import { Platform } from 'react-native';

/**
 * Speak text via Web Speech Synthesis (web) — used for assistant prompts.
 * Native: no-op (expo-speech can be added later).
 */
export function speakAssistant(
  text: string,
  opts?: { lang?: string; rate?: number; pitch?: number },
): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve();
  }
  const synth = window.speechSynthesis;
  if (!synth) return Promise.resolve();

  return new Promise(resolve => {
    try {
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = opts?.lang || 'en-US';
      utter.rate = opts?.rate ?? 1;
      utter.pitch = opts?.pitch ?? 1;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      // Chrome sometimes needs a tick after cancel
      setTimeout(() => {
        try {
          synth.speak(utter);
        } catch {
          resolve();
        }
      }, 80);
    } catch {
      resolve();
    }
  });
}

export function stopAssistantSpeech() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}

/** Far-field friendly mic stream (auto-gain on, noise suppression lighter). */
export async function unlockMicWithGain(): Promise<MediaStream | null> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
        channelCount: 1,
      } as MediaTrackConstraints,
      video: false,
    });
  } catch {
    return null;
  }
}
