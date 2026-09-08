export type NarratorPriority = 'interrupt' | 'queue' | 'drop-if-speaking';

export interface NarratorOptions {
  priority?: NarratorPriority;
  rate?: number;
  volume?: number;
  pitch?: number;
  voiceName?: string;
}

interface QueuedSpeech {
  text: string;
  options: NarratorOptions;
}

export class VoiceNarrator {
  private queue: QueuedSpeech[] = [];
  private active = false;
  private generation = 0;

  constructor(
    private readonly speech: SpeechSynthesis | null,
    private readonly onStateChange?: (speaking: boolean, text?: string) => void,
  ) {}

  speak(text: string, options: NarratorOptions = {}) {
    if (!this.speech || !text.trim()) return;
    const priority = options.priority ?? 'queue';

    if (priority === 'drop-if-speaking' && (this.active || this.speech.speaking)) return;
    if (priority === 'interrupt') {
      this.cancel();
    }

    this.queue.push({ text: text.trim(), options });
    if (!this.active) this.startNext();
  }

  cancel() {
    this.generation += 1;
    this.queue = [];
    this.speech?.cancel();
    this.active = false;
    this.onStateChange?.(false);
  }

  pause() {
    this.speech?.pause();
  }

  resume() {
    this.speech?.resume();
  }

  isSpeaking() {
    return this.active || Boolean(this.speech?.speaking);
  }

  private startNext() {
    const next = this.queue.shift();
    if (!next || !this.speech) {
      this.active = false;
      this.onStateChange?.(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(next.text);
    const generation = this.generation;
    utterance.rate = next.options.rate ?? 1;
    utterance.volume = next.options.volume ?? 0.8;
    utterance.pitch = next.options.pitch ?? 1;

    if (next.options.voiceName) {
      const voice = this.speech.getVoices().find(item => item.name === next.options.voiceName);
      if (voice) utterance.voice = voice;
    }

    this.active = true;
    this.onStateChange?.(true, next.text);
    utterance.onend = () => {
      if (generation !== this.generation) return;
      this.active = false;
      this.onStateChange?.(false);
      this.startNext();
    };
    utterance.onerror = () => {
      if (generation !== this.generation) return;
      this.active = false;
      this.onStateChange?.(false);
      this.startNext();
    };
    this.speech.speak(utterance);
  }
}