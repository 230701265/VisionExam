import type { SpeechRecognitionFinalResult } from './types';

export interface STTEngine {
  readonly supported: boolean;
  start(): void;
  stop(): void;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence?: number } }>;
  }) => void) | null;
  start(): void;
  stop(): void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as Window & { SpeechRecognition?: BrowserSpeechRecognitionConstructor }).SpeechRecognition ??
    (window as Window & { webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor }).webkitSpeechRecognition ??
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getConstructor());
}

export class BrowserSpeechEngine implements STTEngine {
  readonly supported: boolean;
  private recognition: BrowserSpeechRecognition | null = null;
  private readonly timeoutMs: number;
  private timeoutId: number | null = null;

  constructor(
    private readonly language: string,
    private readonly onPartial: (text: string) => void,
    private readonly onFinal: (result: SpeechRecognitionFinalResult) => void,
    private readonly onStart: () => void,
    private readonly onEnd: () => void,
    private readonly onError: (message: string) => void,
    timeoutMs = 4000,
  ) {
    this.supported = isSpeechRecognitionSupported();
    this.timeoutMs = timeoutMs;
  }

  start() {
    const Recognition = getConstructor();
    if (!Recognition) {
      this.onError('Voice input is unavailable in this browser. Keyboard and screen-reader controls are still available.');
      return;
    }

    this.stop();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = this.language;
    recognition.maxAlternatives = 1;
    recognition.onstart = this.onStart;
    recognition.onend = () => {
      if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.onEnd();
    };
    recognition.onerror = event => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access was denied. Keyboard and screen-reader controls are still available.',
        'audio-capture': 'No microphone was found. Keyboard and screen-reader controls are still available.',
        'no-speech': 'No speech was detected. Please try again.',
        network: 'The browser speech service is unavailable. Please try again.',
      };
      this.onError(messages[event.error ?? ''] ?? 'Voice input failed. Please try again.');
    };
    recognition.onresult = event => {
      let partial = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          this.onFinal({
            transcript: result[0].transcript.trim(),
            confidence: result[0].confidence,
          });
        } else {
          partial += result[0].transcript;
        }
      }
      this.onPartial(partial.trim());
    };

    this.recognition = recognition;
    recognition.start();
    this.timeoutId = window.setTimeout(() => this.stop(), this.timeoutMs);
  }

  stop() {
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    this.timeoutId = null;
    this.recognition?.stop();
    this.recognition = null;
  }
}