import { useState, useCallback, useRef } from 'react';

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
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options?: Partial<UseTextToSpeechProps>) => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || rate;
    utterance.volume = options?.volume || volume;
    
    if (options?.voice || voice) {
      utterance.voice = options?.voice || voice || null;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [rate, volume, voice]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && speaking) {
      window.speechSynthesis.pause();
    }
  }, [speaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    supported
  };
}
