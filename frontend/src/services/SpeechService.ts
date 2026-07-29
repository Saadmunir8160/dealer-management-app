import { Platform } from 'react-native';
import { normalizeVoiceTranscript } from '@hooks/useSpeechRecognition';

/**
 * Thin Speech helpers used by voice UI (permissions / support checks).
 * Actual listen loop lives in useSpeechRecognition (Web Speech + @react-native-voice/voice).
 */
export const SpeechService = {
  normalize: normalizeVoiceTranscript,

  isWebSpeechAvailable(): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  },

  async ensureMicPermission(): Promise<{ ok: boolean; message?: string }> {
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return { ok: false, message: 'Microphone API not available in this browser.' };
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return { ok: true };
      } catch {
        return {
          ok: false,
          message: 'Microphone permission denied. Allow mic in browser settings.',
        };
      }
    }

    // Native: @react-native-voice triggers OS permission on startListening.
    return { ok: true };
  },
};

export default SpeechService;
