import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceCommandBus } from './commandBus';
import { matchVoiceCommand } from './commandRegistry';
import { isSpeechRecognitionSupported } from './speechRecognition';
import type { CommandId } from './types';

function dispatchFakeTranscript(
  bus: VoiceCommandBus,
  transcript: string,
  commandId: CommandId,
  confidence = 0.95,
) {
  const match = matchVoiceCommand(transcript, 'question', confidence);
  assert.equal(match.status, 'matched');
  assert.equal(match.command?.definition.id, commandId);
  bus.dispatch(match.command!);
}

test('fake transcripts drive the registered exam navigation action', () => {
  const bus = new VoiceCommandBus();
  let questionIndex = 0;
  bus.register('nextQuestion', () => {
    questionIndex += 1;
  });

  dispatchFakeTranscript(bus, 'next question', 'nextQuestion');
  assert.equal(questionIndex, 1);
});

test('submission requires stage and confirm transcripts in order', () => {
  const bus = new VoiceCommandBus();
  let staged = false;
  let submitted = false;
  bus.register('stageSubmit', () => {
    staged = true;
  });
  bus.register('confirmSubmit', () => {
    if (staged) submitted = true;
  });

  dispatchFakeTranscript(bus, 'confirm submit', 'confirmSubmit');
  assert.equal(submitted, false);

  dispatchFakeTranscript(bus, 'submit exam', 'stageSubmit');
  assert.equal(staged, true);
  assert.equal(submitted, false);

  dispatchFakeTranscript(bus, 'confirm submit', 'confirmSubmit');
  assert.equal(submitted, true);
});

test('bare "yes" and "no" drive the same stage/confirm state machine as the explicit phrases', () => {
  const bus = new VoiceCommandBus();
  let staged = false;
  let submitted = false;
  bus.register('stageSubmit', () => { staged = true; });
  bus.register('confirmSubmit', () => { if (staged) submitted = true; });
  bus.register('cancel', () => { staged = false; });

  dispatchFakeTranscript(bus, 'submit exam', 'stageSubmit');
  assert.equal(staged, true);

  // "no" cancels the pending submission instead of confirming it.
  dispatchFakeTranscript(bus, 'no', 'cancel');
  assert.equal(staged, false);
  assert.equal(submitted, false);

  dispatchFakeTranscript(bus, 'submit exam', 'stageSubmit');
  dispatchFakeTranscript(bus, 'yes', 'confirmSubmit');
  assert.equal(submitted, true);
});

test('an unrelated command while a submission is staged never submits the exam', () => {
  const bus = new VoiceCommandBus();
  let staged = false;
  let submitted = false;
  let nextQuestionCalls = 0;
  bus.register('stageSubmit', () => { staged = true; });
  bus.register('confirmSubmit', () => { if (staged) submitted = true; });
  bus.register('nextQuestion', () => { nextQuestionCalls += 1; });

  dispatchFakeTranscript(bus, 'submit exam', 'stageSubmit');
  // Saying something unrelated to the pending confirmation must not submit.
  dispatchFakeTranscript(bus, 'next question', 'nextQuestion');
  assert.equal(nextQuestionCalls, 1);
  assert.equal(submitted, false);
});

test('unsupported runtime is reported without requesting a microphone', () => {
  assert.equal(isSpeechRecognitionSupported(), false);
});