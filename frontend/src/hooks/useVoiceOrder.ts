import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import { Dealer, Product } from '@types';
import {
  FieldConfidence,
  VoiceAiPhase,
  VoiceOrderFillResult,
} from '@types';
import { useSpeechRecognition, SPEECH_LANGUAGES } from '@hooks/useSpeechRecognition';
import { OrderParser } from '@services/OrderParser';
import { SpeechService } from '@services/SpeechService';
import { GeminiService } from '@services/GeminiService';
import { unlockMicWithGain, stopAssistantSpeech } from '@utils/voiceAssistant';


export interface UseVoiceOrderOptions {
  enabled: boolean;
  dealers: Dealer[];
  products: Product[];
  areas?: string[];
  onFill: (result: VoiceOrderFillResult) => void;
  onError?: (message: string) => void;
  onInfo?: (title: string, message: string) => void;
}

export function useVoiceOrder(options: UseVoiceOrderOptions) {
  const { enabled, dealers, products, areas, onFill, onError, onInfo } = options;

  const speech = useSpeechRecognition();
  const [phase, setPhase] = useState<VoiceAiPhase>('idle');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [typedCommand, setTypedCommand] = useState('');
  const [confidence, setConfidence] = useState<FieldConfidence | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [engineLabel, setEngineLabel] = useState('');
  const [listenSeconds, setListenSeconds] = useState(0);
  const [micArmed, setMicArmed] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceOrderFillResult | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const lastProcessed = useRef('');
  const micHolding = useRef(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFillRef = useRef(onFill);
  const onErrorRef = useRef(onError);
  const onInfoRef = useRef(onInfo);

  useEffect(() => {
    onFillRef.current = onFill;
    onErrorRef.current = onError;
    onInfoRef.current = onInfo;
  }, [onFill, onError, onInfo]);

  const isLiveListening = micArmed || speech.isListening;

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  useEffect(() => {
    if (!isLiveListening) {
      setListenSeconds(0);
      return;
    }
    setListenSeconds(0);
    const id = setInterval(() => setListenSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isLiveListening]);

  useEffect(() => {
    if (!isLiveListening) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLiveListening, pulse]);

  // Debounce partial transcript UI updates
  useEffect(() => {
    if (!enabled) return;
    const partial = speech.partialTranscript;
    if (!partial) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setLiveTranscript(partial);
    }, 80);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [speech.partialTranscript, enabled]);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    let cancelled = false;
    void (async () => {
      const stream = await unlockMicWithGain();
      if (cancelled) {
        stream?.getTracks().forEach(t => t.stop());
        return;
      }
      stream?.getTracks().forEach(t => t.stop());
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!speech.isListening && !micHolding.current) {
      setMicArmed(false);
    }
  }, [speech.isListening]);

  useEffect(() => {
    if (speech.error) {
      onErrorRef.current?.(speech.error);
      setMicArmed(false);
      setPhase('error');
    }
  }, [speech.error]);

  const runExtract = useCallback(
    async (text: string) => {
      const cleaned = SpeechService.normalize(text);
      if (!cleaned || processing) return;

      // Ignore stop-word / noise fragments (e.g. "it", "a", "um")
      const noiseOnly = /^(it|a|the|um|uh|ah|and|or|to|of|for|is|this|that)$/i.test(
        cleaned.trim(),
      );
      if (noiseOnly) {
        setLiveTranscript(cleaned);
        setPhase('error');
        onErrorRef.current?.(
          'Heard unclear speech. Hold mic and say e.g. "5505 600 bags ORD-121".',
        );
        return;
      }

      if (!products.length) {
        setPhase('error');
        onErrorRef.current?.('Products still loading — try again in a moment.');
        return;
      }

      setProcessing(true);
      setPhase('processing');
      setProgress(12);
      setLiveTranscript(cleaned);
      clearProgressTimer();
      progressTimer.current = setInterval(() => {
        setProgress(p => (p >= 92 ? 92 : p + 8));
      }, 400);

      try {
        const result = await OrderParser.parse({
          transcript: cleaned,
          dealers,
          products,
          areas,
          preferLocal: true,
        });

        setProgress(100);
        setLastResult(result);
        setConfidence(result.confidence);
        setNeedsConfirmation(result.needsConfirmation);
        setWarnings(result.warnings);
        setEngineLabel(
          result.engine === 'local'
            ? 'Offline extract'
            : result.engine === 'proxy'
              ? 'AI proxy'
              : 'Gemini',
        );
        setPhase(result.needsConfirmation ? 'review' : 'success');
        onFillRef.current(result);

        if (result.items.length) {
          const first = result.items[0];
          const msg = result.couponNumber
            ? `${first.productName} · ${first.quantity} bags · ${result.couponNumber}`
            : result.warnings.find(w => !/customer/i.test(w)) ||
              `Filled ${result.items.length} item(s) — enter coupon, then Place Order.`;
          onInfoRef.current?.(
            result.needsConfirmation ? 'Review order' : 'Voice ready',
            msg,
          );
        } else {
          const err =
            result.warnings.find(w => /code|product|item|ln/i.test(w)) ||
            result.warnings.find(w => !/customer/i.test(w)) ||
            'Say LN code from item list, bags, coupon — e.g. "5505 600 bags ORD-121".';
          onErrorRef.current?.(err);
          setPhase('error');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process speech';
        setPhase('error');
        onErrorRef.current?.(message);
      } finally {
        clearProgressTimer();
        setProcessing(false);
      }
    },
    [processing, dealers, products, areas],
  );

  useEffect(() => {
    if (!enabled) return;
    const t = speech.transcript.trim();
    if (!t || t === lastProcessed.current) return;
    lastProcessed.current = t;
    setLiveTranscript(t);
    void runExtract(t);
  }, [speech.transcript, runExtract, enabled]);

  const onMicHoldStart = useCallback(() => {
    if (processing) return;
    micHolding.current = true;
    setMicArmed(true);
    setPhase('recording');
    lastProcessed.current = '';
    speech.resetTranscript();
    stopAssistantSpeech();

    void (async () => {
      const perm = await SpeechService.ensureMicPermission();
      if (!perm.ok) {
        setMicArmed(false);
        setPhase('error');
        onErrorRef.current?.(perm.message || 'Microphone permission denied.');
        return;
      }
      void unlockMicWithGain().then(stream => stream?.getTracks().forEach(t => t.stop()));
      await speech.startListening();
      if (!micHolding.current) {
        setMicArmed(false);
        await speech.stopListening();
      }
    })();
  }, [processing, speech]);

  const onMicHoldEnd = useCallback(() => {
    micHolding.current = false;
    setMicArmed(false);
    void speech.stopListening();
  }, [speech]);

  const onStopRecording = useCallback(() => {
    micHolding.current = false;
    setMicArmed(false);
    void speech.stopListening();
  }, [speech]);

  const onRetryExtract = useCallback(() => {
    const text = (liveTranscript || typedCommand || speech.transcript).trim();
    if (!text) {
      onErrorRef.current?.('No transcript to process. Hold the mic and speak again.');
      return;
    }
    lastProcessed.current = '';
    void runExtract(text);
  }, [liveTranscript, typedCommand, speech.transcript, runExtract]);

  const onRunTypedCommand = useCallback(() => {
    const text = typedCommand.trim();
    if (!text) {
      onErrorRef.current?.(
        'Speak an order or type e.g. Create an order for ABC Traders. 20 bags of cement.',
      );
      return;
    }
    lastProcessed.current = '';
    void runExtract(text);
  }, [typedCommand, runExtract]);

  const resetVoice = useCallback(async () => {
    if (speech.isListening) await speech.stopListening();
    speech.resetTranscript();
    lastProcessed.current = '';
    setTypedCommand('');
    setLiveTranscript('');
    setConfidence(null);
    setNeedsConfirmation(false);
    setWarnings([]);
    setEngineLabel('');
    setLastResult(null);
    setPhase('idle');
    setProgress(0);
  }, [speech]);

  const statusMessage = useMemo(() => {
    if (phase === 'processing') {
      return 'Extracting order...';
    }
    return undefined;
  }, [phase]);

  return {
    // speech
    isSupported: speech.isSupported,
    language: speech.language,
    setLanguage: speech.setLanguage,
    speechLanguages: SPEECH_LANGUAGES,
    partialTranscript: speech.partialTranscript,
    isListening: speech.isListening,
    isLiveListening,
    // phase
    phase,
    processing,
    progress,
    confidence,
    needsConfirmation,
    warnings,
    engineLabel,
    lastResult,
    liveTranscript,
    typedCommand,
    setTypedCommand,
    listenSeconds,
    pulse,
    statusMessage,
    geminiReady: GeminiService.isConfigured(),
    // actions
    onMicHoldStart,
    onMicHoldEnd,
    onStopRecording,
    onRetryExtract,
    onRunTypedCommand,
    resetVoice,
    runExtract,
  };
}

export default useVoiceOrder;
