import test from 'node:test';
import assert from 'node:assert/strict';
import { matchVoiceCommand, normalizeTranscript } from './commandRegistry';

test('normalizes punctuation and whitespace deterministically', () => {
  assert.equal(normalizeTranscript('  Next   Question! '), 'next question');
  assert.equal(normalizeTranscript('GO TO THE NEXT question'), 'go to next question');
});

test('matches only registered phrases, not fuzzy near-misses', () => {
  assert.equal(matchVoiceCommand('next question', 'question', 0.92).status, 'matched');
  assert.equal(matchVoiceCommand('next question please', 'question', 0.92).status, 'unknown');
});

test('rejects low-confidence commands before dispatch', () => {
  const result = matchVoiceCommand('submit exam', 'question', 0.4);
  assert.equal(result.status, 'low-confidence');
  assert.equal(result.command, undefined);
});

test('parses option arguments and validates scope', () => {
  const select = matchVoiceCommand('select option B', 'question', 0.95);
  assert.equal(select.status, 'matched');
  assert.equal(select.command?.definition.id, 'selectOption');
  assert.equal(select.command?.argument, 'B');

  const wrongScope = matchVoiceCommand('read timer', 'results', 0.95);
  assert.equal(wrongScope.status, 'wrong-scope');
});