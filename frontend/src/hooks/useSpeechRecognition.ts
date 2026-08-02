import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onsoundstart?: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Listen window — longer = easier from a short distance / slower speech */
const LISTEN_MS = 18000;

export const SPEECH_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ar-SA', label: 'العربية (Saudi)' },
  { code: 'ar-AE', label: 'العربية (UAE)' },
  { code: 'ar-EG', label: 'العربية (Egypt)' },
  { code: 'ur-PK', label: 'اردو' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'nb-NO', label: 'Norsk' },
  { code: 'sv-SE', label: 'Svenska' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
];

export function resolveDefaultSpeechLang(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  const nav = (navigator.language || 'en-US').trim();
  const exact = SPEECH_LANGUAGES.find(l => l.code.toLowerCase() === nav.toLowerCase());
  if (exact) return exact.code;
  const prefix = nav.split('-')[0].toLowerCase();
  const byPrefix = SPEECH_LANGUAGES.find(l => l.code.toLowerCase().startsWith(`${prefix}-`));
  if (byPrefix) return byPrefix.code;
  if (prefix === 'ar') return 'ar-SA';
  if (prefix === 'ur') return 'ur-PK';
  return 'en-US';
}

function getWebSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function normalizeDigits(raw: string): string {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  return raw.replace(/[٠-٩۰-۹]/g, ch => map[ch] ?? ch);
}

/** Clean STT noise — keep product words distinct (paint ≠ rod). */
export function normalizeVoiceTranscript(raw: string): string {
  let t = normalizeDigits((raw || '').trim());
  t = t.replace(/[.,!?]+$/g, '');
  t = t.replace(/\s+/g, ' ');
  const fixes: [RegExp, string][] = [
    [/\b(rode|road|roads|rods)\b/gi, 'rod'],
    [/\b(steel rod|steel rods|metal rod)\b/gi, 'steel rod'],
    [/\b(paints?|painting|pint)\b/gi, 'paint'],
    [/\b(cements?|cement bag)\b/gi, 'cement'],
    [/\b(bricks?|brick)\b/gi, 'bricks'],
    [/\b(pipes?|pvc)\b/gi, 'pipe'],
    [/\bfor\s+for\b/gi, 'for'],
    [/\border\s+order\b/gi, 'order'],
    [/\badd\s+add\b/gi, 'add'],
  ];
  for (const [re, rep] of fixes) t = t.replace(re, rep);
  return t.trim();
}

function friendlySpeechError(code: string): string {
  switch (code) {
    case 'network':
    case 'no-speech':
    case 'aborted':
      return '';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission denied. Allow mic in app settings.';
    case 'audio-capture':
      return 'No microphone found.';
    case 'language-not-supported':
      return 'Speech language not supported on this device.';
    default:
      return code ? `Speech error: ${code}` : '';
  }
}

export interface UseSpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  isSupported: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  resetTranscript: () => void;
}

/**
 * Web: browser SpeechRecognition.
 * Native (Android/iOS): expo-speech-recognition TurboModule (New Architecture safe).
 */
export function useSpeechRecognition(initialLang?: string): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState(
    () => initialLang || resolveDefaultSpeechLang(),
  );
  const webRef = useRef<SpeechRecognitionLike | null>(null);
  const finalLock = useRef(false);
  const languageRef = useRef(language);
  const networkRetryRef = useRef(0);
  const interimRef = useRef('');
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStop = useRef(false);
  const nativeSubsRef = useRef<{ remove: () => void }[]>([]);
  const nativeReadyRef = useRef(false);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const isWeb = Platform.OS === 'web';
  const webSupported = isWeb && !!getWebSpeechRecognition();
  const [nativeSupported, setNativeSupported] = useState(!isWeb);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    languageRef.current = lang;
  }, []);

  const clearListenTimer = () => {
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  };

  const commitText = useCallback((text: string) => {
    const cleaned = normalizeVoiceTranscript(text);
    if (!cleaned || finalLock.current) return;
    finalLock.current = true;
    networkRetryRef.current = 0;
    setTranscript(cleaned);
    setPartialTranscript('');
    setError(null);
  }, []);

  // Wire expo-speech-recognition listeners once on native
  useEffect(() => {
    if (isWeb) return;

    let cancelled = false;
    const subs: { remove: () => void }[] = [];

    (async () => {
      try {
        const {
          ExpoSpeechRecognitionModule,
        } = await import('expo-speech-recognition');

        if (cancelled) return;

        if (
          !ExpoSpeechRecognitionModule ||
          typeof ExpoSpeechRecognitionModule.start !== 'function'
        ) {
          setNativeSupported(false);
          setError('Voice module missing. Rebuild the app.');
          return;
        }

        const available =
          typeof ExpoSpeechRecognitionModule.isRecognitionAvailable === 'function'
            ? ExpoSpeechRecognitionModule.isRecognitionAvailable()
            : true;

        if (!available) {
          setNativeSupported(false);
          setError(
            'Speech recognition not available. Install Google app / enable Dictation.',
          );
          return;
        }

        subs.push(
          ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
            const results = event?.results ?? [];
            const top = String(results[0]?.transcript ?? '').trim();
            if (!top || finalLock.current) return;

            const isFinal = Boolean(event?.isFinal ?? results[0]?.isFinal);
            interimRef.current = top;
            setPartialTranscript(top);

            // Continuous sessions: keep updating until stop; commit on final chunks
            if (isFinal && top.length >= 2) {
              interimRef.current = top;
              setPartialTranscript(top);
            }
          }),
        );

        subs.push(
          ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
            const code = String(event?.error ?? event?.code ?? '');
            if (intentionalStop.current) return;
            const msg = friendlySpeechError(code) || String(event?.message ?? '');
            if (msg) setError(msg);
            setIsListening(false);
            clearListenTimer();
          }),
        );

        subs.push(
          ExpoSpeechRecognitionModule.addListener('end', () => {
            clearListenTimer();
            if (!finalLock.current && interimRef.current.trim()) {
              commitText(interimRef.current);
            }
            setIsListening(false);
          }),
        );

        subs.push(
          ExpoSpeechRecognitionModule.addListener('start', () => {
            setIsListening(true);
          }),
        );

        nativeSubsRef.current = subs;
        nativeReadyRef.current = true;
        setNativeSupported(true);
      } catch (e: any) {
        if (!cancelled) {
          nativeReadyRef.current = false;
          setNativeSupported(false);
          setError(
            e?.message ||
              'Voice module not available. Install a fresh APK with speech support.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      clearListenTimer();
      nativeReadyRef.current = false;
      nativeSubsRef.current.forEach(s => {
        try {
          s.remove();
        } catch {
          // ignore
        }
      });
      nativeSubsRef.current = [];
      void import('expo-speech-recognition')
        .then(({ ExpoSpeechRecognitionModule }) => {
          try {
            ExpoSpeechRecognitionModule.abort?.();
          } catch {
            // ignore
          }
        })
        .catch(() => undefined);
    };
  }, [isWeb, commitText]);

  const isSupported = isWeb ? webSupported : nativeSupported;

  const resetTranscript = useCallback(() => {
    finalLock.current = false;
    networkRetryRef.current = 0;
    interimRef.current = '';
    setTranscript('');
    setPartialTranscript('');
    setError(null);
  }, []);

  const startWebRecognition = useCallback(
    (lang: string) => {
      const Ctor = getWebSpeechRecognition();
      if (!Ctor) {
        setError('Use Google Chrome for voice recognition.');
        return;
      }
      try {
        intentionalStop.current = false;
        webRef.current?.abort?.();
        const recognition = new Ctor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;
        recognition.lang = lang;

        recognition.onresult = (event: any) => {
          let interim = '';
          let finalText = '';
          let bestAlt = '';
          let bestConf = -1;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            for (let a = 0; a < result.length; a++) {
              const alt = result[a];
              const piece = String(alt?.transcript ?? '');
              const conf = Number(alt?.confidence ?? 0);
              if (conf >= bestConf && piece) {
                bestConf = conf;
                bestAlt = piece;
              }
            }
            const top = String(result[0]?.transcript ?? '');
            if (result.isFinal) finalText += top;
            else interim += top;
          }
          if (interim && !finalLock.current) {
            interimRef.current = interim || bestAlt;
            setPartialTranscript(interimRef.current);
          }
          if (finalText && !finalLock.current) {
            const piece = finalText.trim() || bestAlt;
            const merged = [interimRef.current, piece]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            interimRef.current = merged;
            setPartialTranscript(merged);
          }
        };

        recognition.onerror = (event: any) => {
          const code = String(event?.error ?? '');
          if (code === 'aborted' || code === 'no-speech') return;
          if (code === 'network') {
            if (networkRetryRef.current < 3 && !finalLock.current) {
              networkRetryRef.current += 1;
              setTimeout(() => startWebRecognition(lang), 400 * networkRetryRef.current);
            }
            return;
          }
          const msg = friendlySpeechError(code);
          if (msg) setError(msg);
        };

        recognition.onend = () => {
          clearListenTimer();
          if (!finalLock.current && interimRef.current.trim()) {
            commitText(interimRef.current);
          }
          setIsListening(false);
        };

        webRef.current = recognition;
        recognition.start();
        setIsListening(true);

        clearListenTimer();
        listenTimerRef.current = setTimeout(() => {
          intentionalStop.current = true;
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }, LISTEN_MS);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to start microphone');
        setIsListening(false);
      }
    },
    [commitText],
  );

  const startListening = useCallback(async () => {
    setError(null);
    setPartialTranscript('');
    setTranscript('');
    finalLock.current = false;
    networkRetryRef.current = 0;
    interimRef.current = '';
    intentionalStop.current = false;

    const lang = languageRef.current || 'en-US';

    if (isWeb) {
      startWebRecognition(lang);
      return;
    }

    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');

      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm?.granted) {
        setError('Microphone / speech permission denied. Enable in phone settings.');
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: true,
        // Android: web_search model is more reliable for short codes / LN numbers
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'web_search',
        },
      });

      setIsListening(true);
      clearListenTimer();
      listenTimerRef.current = setTimeout(() => {
        intentionalStop.current = true;
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {
          // ignore
        }
      }, LISTEN_MS);
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? '');
      if (/startSpeech|of null/i.test(msg)) {
        setError('Voice native module failed. Reinstall the latest APK.');
      } else {
        setError(msg || 'Failed to start voice recognition');
      }
      setIsListening(false);
    }
  }, [isWeb, startWebRecognition]);

  const stopListening = useCallback(async () => {
    clearListenTimer();
    intentionalStop.current = true;
    if (isWeb) {
      try {
        webRef.current?.stop?.();
      } catch {
        // ignore
      }
      if (!finalLock.current && interimRef.current.trim()) {
        commitText(interimRef.current);
      }
      setIsListening(false);
      return;
    }
    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    if (!finalLock.current && interimRef.current.trim()) {
      commitText(interimRef.current);
    }
    setIsListening(false);
  }, [isWeb, commitText]);

  return {
    isListening,
    transcript,
    partialTranscript,
    error,
    isSupported,
    language,
    setLanguage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
