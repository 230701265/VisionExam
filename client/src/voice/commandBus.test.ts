import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceCommandBus } from './commandBus';
import { matchVoiceCommand } from './commandRegistry';

test('dispatches a matched command to its registered handler', () => {
  const bus = new VoiceCommandBus();
  const received: string[] = [];
  bus.register('nextQuestion', command => received.push(command.definition.id));

  const match = matchVoiceCommand('next question', 'question', 0.9);
  assert.equal(match.status, 'matched');
  bus.dispatch(match.command!);
  assert.deepEqual(received, ['nextQuestion']);
});

test('does not dispatch commands without a registered handler', () => {
  const bus = new VoiceCommandBus();
  assert.doesNotThrow(() => {
    const match = matchVoiceCommand('read results', 'results', 0.9);
    if (match.command) bus.dispatch(match.command);
  });
});