import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceNarrator } from './narrator';

class FakeUtterance {
  text: string;
  rate = 1;
  volume = 1;
  pitch = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

test('queues speech and supports interrupt cancellation', () => {
  const previous = globalThis.SpeechSynthesisUtterance;
  (globalThis as unknown as { SpeechSynthesisUtterance: typeof FakeUtterance }).SpeechSynthesisUtterance = FakeUtterance;

  const spoken: FakeUtterance[] = [];
  const fakeSpeech = {
    speaking: false,
    getVoices: () => [],
    speak(utterance: FakeUtterance) {
      this.speaking = true;
      spoken.push(utterance);
    },
    cancel() {
      this.speaking = false;
    },
    pause() {},
    resume() {},
  };

  const narrator = new VoiceNarrator(fakeSpeech as unknown as SpeechSynthesis);
  narrator.speak('first');
  narrator.speak('second');
  assert.deepEqual(spoken.map(item => item.text), ['first']);

  spoken[0].onend?.();
  assert.deepEqual(spoken.map(item => item.text), ['first', 'second']);

  narrator.speak('urgent', { priority: 'interrupt' });
  assert.deepEqual(spoken.map(item => item.text), ['first', 'second', 'urgent']);
  narrator.cancel();

  if (previous) (globalThis as unknown as { SpeechSynthesisUtterance: typeof FakeUtterance }).SpeechSynthesisUtterance = previous;
  else delete (globalThis as unknown as { SpeechSynthesisUtterance?: typeof FakeUtterance }).SpeechSynthesisUtterance;
});