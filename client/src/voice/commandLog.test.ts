import test from 'node:test';
import assert from 'node:assert/strict';
import { clearVoiceCommandLog, getVoiceCommandLog, logVoiceCommand, recordVoiceCommand } from './commandLog';

test('records a voice command entry with only the fixed, non-sensitive fields', () => {
  clearVoiceCommandLog();
  recordVoiceCommand({ transcript: 'next question', intent: 'nextQuestion', confidence: 0.95, result: 'matched' });

  const entries = getVoiceCommandLog();
  assert.equal(entries.length, 1);
  const [entry] = entries;
  assert.equal(entry.transcript, 'next question');
  assert.equal(entry.intent, 'nextQuestion');
  assert.equal(entry.result, 'matched');
  assert.equal(typeof entry.timestamp, 'number');
  // No audio, no free-text answer content — only the fixed shape below.
  assert.deepEqual(Object.keys(entry).sort(), ['confidence', 'intent', 'result', 'timestamp', 'transcript']);
});

test('caps the log at 50 entries, dropping the oldest first', () => {
  clearVoiceCommandLog();
  for (let i = 0; i < 60; i += 1) {
    recordVoiceCommand({ transcript: `command ${i}`, intent: null, confidence: 1, result: 'unknown' });
  }
  const entries = getVoiceCommandLog();
  assert.equal(entries.length, 50);
  assert.equal(entries[0].transcript, 'command 10');
  assert.equal(entries[entries.length - 1].transcript, 'command 59');
});

test('getVoiceCommandLog returns a copy, not the live buffer', () => {
  clearVoiceCommandLog();
  recordVoiceCommand({ transcript: 'help', intent: 'help', confidence: 1, result: 'matched' });
  const entries = getVoiceCommandLog();
  entries.push({ timestamp: 0, transcript: 'tampered', intent: null, confidence: 0, result: 'unknown' });
  assert.equal(getVoiceCommandLog().length, 1);
});

test('logVoiceCommand is a no-op outside a dev build (as it is under this Node test runner)', () => {
  clearVoiceCommandLog();
  logVoiceCommand({ transcript: 'next question', intent: 'nextQuestion', confidence: 0.95, result: 'matched' });
  assert.equal(getVoiceCommandLog().length, 0);
});
