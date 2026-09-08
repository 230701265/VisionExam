import { useCallback } from 'react';
import { useAccessibility } from '@/components/AccessibilityProvider';

interface UseTextToSpeechProps {
  rate?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export function useTextToSpeech({
  rate = 1,
  volume = 0.8,
  voice
}: UseTextToSpeechProps = {}) {
  const {
    speak: narrate,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    isSpeaking: speaking,
    speechSupported: supported,
  } = useAccessibility();

  const speak = useCallback((text: string, options?: Partial<UseTextToSpeechProps>) => {
    narrate(text, {
      priority: 'interrupt',
      rate: options?.rate ?? rate,
      volume: options?.volume ?? volume,
      voiceName: options?.voice?.name ?? voice?.name,
    });
  }, [narrate, rate, volume, voice]);

  const stop = useCallback(() => stopSpeaking(), [stopSpeaking]);

  const pause = useCallback(() => pauseSpeaking(), [pauseSpeaking]);

  const resume = useCallback(() => resumeSpeaking(), [resumeSpeaking]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    supported
  };
}
