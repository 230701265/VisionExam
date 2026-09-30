import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserSpeechEngine } from './speechRecognition';

interface FakeRecognitionEvent {
  error?: string;
}

class FakeRecognition {
  static instances: FakeRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: FakeRecognitionEvent) => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;
  started = false;
  stopped = false;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

function makeFakeWindow() {
  const timeouts: number[] = [];
  return {
    SpeechRecognition: FakeRecognition,
    setTimeout(_fn: () => void, ms: number) {
      timeouts.push(ms);
      return timeouts.length;
    },
    clearTimeout() {},
    timeouts,
  };
}

function makeEngine(
  onError: (message: string) => void = () => {},
  timeoutMs = 4000,
  continuous = false,
) {
  return new BrowserSpeechEngine('en-US', () => {}, () => {}, () => {}, () => {}, onError, timeoutMs, continuous);
}

test('passes the continuous option through to the underlying recognition instance', () => {
  const previousWindow = (globalThis as unknown as { window?: unknown }).window;
  FakeRecognition.instances = [];
  (globalThis as unknown as { window: unknown }).window = makeFakeWindow();

  try {
    makeEngine(() => {}, 4000, true).start();
    assert.equal(FakeRecognition.instances.at(-1)?.continuous, true);

    makeEngine(() => {}, 4000, false).start();
    assert.equal(FakeRecognition.instances.at(-1)?.continuous, false);
  } finally {
    (globalThis as unknown as { window: unknown }).window = previousWindow;
  }
});

test('maps the newer speech recognition error codes to their updated messages', () => {
  const previousWindow = (globalThis as unknown as { window?: unknown }).window;
  FakeRecognition.instances = [];
  (globalThis as unknown as { window: unknown }).window = makeFakeWindow();

  try {
    const errors: string[] = [];
    makeEngine(message => errors.push(message)).start();
    const recognition = FakeRecognition.instances.at(-1)!;

    recognition.onerror?.({ error: 'not-allowed' });
    recognition.onerror?.({ error: 'service-not-allowed' });
    recognition.onerror?.({ error: 'network' });

    assert.deepEqual(errors, [
      'Microphone access was denied. Keyboard and screen-reader controls are still available.',
      'Microphone access was denied by the browser speech service. Keyboard and screen-reader controls are still available.',
      'A speech recognition network error occurred. Retrying.',
    ]);
  } finally {
    (globalThis as unknown as { window: unknown }).window = previousWindow;
  }
});

test('skips scheduling an auto-stop timeout when timeoutMs is 0', () => {
  const previousWindow = (globalThis as unknown as { window?: unknown }).window;
  FakeRecognition.instances = [];
  const fakeWindow = makeFakeWindow();
  (globalThis as unknown as { window: unknown }).window = fakeWindow;

  try {
    makeEngine(() => {}, 0).start();
    assert.deepEqual(fakeWindow.timeouts, []);

    makeEngine(() => {}, 4000).start();
    assert.deepEqual(fakeWindow.timeouts, [4000]);
  } finally {
    (globalThis as unknown as { window: unknown }).window = previousWindow;
  }
});

test('reports the unsupported-browser message instead of crashing when no engine is available', () => {
  const previousWindow = (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { window?: unknown }).window;

  try {
    const errors: string[] = [];
    assert.doesNotThrow(() => makeEngine(message => errors.push(message)).start());
    assert.deepEqual(errors, [
      'Voice input is unavailable in this browser. Keyboard and screen-reader controls are still available.',
    ]);
  } finally {
    (globalThis as unknown as { window: unknown }).window = previousWindow;
  }
});
