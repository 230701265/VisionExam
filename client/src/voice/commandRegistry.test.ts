import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHelpMessage, matchVoiceCommand, normalizeTranscript } from './commandRegistry';

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

test('parses option arguments for any number of options, not just A-D', () => {
  const byNumber = matchVoiceCommand('select option 5', 'question', 0.95);
  assert.equal(byNumber.status, 'matched');
  assert.equal(byNumber.command?.definition.id, 'selectOption');
  assert.equal(byNumber.command?.argument, '5');

  const byLetter = matchVoiceCommand('select option f', 'question', 0.95);
  assert.equal(byLetter.status, 'matched');
  assert.equal(byLetter.command?.argument, 'F');

  const readByNumber = matchVoiceCommand('read option 2', 'question', 0.95);
  assert.equal(readByNumber.status, 'matched');
  assert.equal(readByNumber.command?.definition.id, 'readOption');
  assert.equal(readByNumber.command?.argument, '2');
});

test('destructive commands require a stricter confidence bar than ordinary ones', () => {
  // 0.8 clears the normal 0.75 bar but not the 0.85 bar reserved for destructive commands.
  const shakySubmit = matchVoiceCommand('submit exam', 'question', 0.8);
  assert.equal(shakySubmit.status, 'low-confidence');

  const confidentSubmit = matchVoiceCommand('submit exam', 'question', 0.9);
  assert.equal(confidentSubmit.status, 'matched');
  assert.equal(confidentSubmit.command?.definition.id, 'stageSubmit');

  // The same 0.8 confidence is plenty for a non-destructive command.
  const nextQuestion = matchVoiceCommand('next question', 'question', 0.8);
  assert.equal(nextQuestion.status, 'matched');
});

test('navigation commands are recognized from the global scope', () => {
  const home = matchVoiceCommand('go home', 'global', 0.95);
  assert.equal(home.status, 'matched');
  assert.equal(home.command?.definition.id, 'navigateHome');

  const dashboardAlias = matchVoiceCommand('open dashboard', 'global', 0.95);
  assert.equal(dashboardAlias.command?.definition.id, 'navigateHome');

  const accessibilityProfile = matchVoiceCommand('open accessibility profile', 'global', 0.95);
  assert.equal(accessibilityProfile.command?.definition.id, 'openAccessibilityProfile');

  const settings = matchVoiceCommand('open settings', 'global', 0.95);
  assert.equal(settings.command?.definition.id, 'openSettings');

  const startExam = matchVoiceCommand('start exam', 'global', 0.95);
  assert.equal(startExam.command?.definition.id, 'startExam');
});

test('"go back" resolves contextually: previous question in the exam, browser-back elsewhere', () => {
  const duringExam = matchVoiceCommand('go back', 'question', 0.95);
  assert.equal(duringExam.status, 'matched');
  assert.equal(duringExam.command?.definition.id, 'previousQuestion');

  const elsewhere = matchVoiceCommand('go back', 'global', 0.95);
  assert.equal(elsewhere.status, 'matched');
  assert.equal(elsewhere.command?.definition.id, 'goBack');
});

test('bare yes/no route to the exam confirmation commands', () => {
  const yes = matchVoiceCommand('yes', 'question', 0.95);
  assert.equal(yes.command?.definition.id, 'confirmSubmit');

  const no = matchVoiceCommand('no', 'question', 0.95);
  assert.equal(no.command?.definition.id, 'cancel');
});

test('buildHelpMessage lists the commands actually available in a scope', () => {
  const questionHelp = buildHelpMessage('question');
  assert.match(questionHelp, /move to the next question/);
  assert.match(questionHelp, /clear the selected answer/);
  // Global commands (e.g. navigation) should also be included since they work everywhere.
  assert.match(questionHelp, /go to the dashboard/);

  const unknownScopeHelp = buildHelpMessage('editor');
  assert.equal(typeof unknownScopeHelp, 'string');
  assert.ok(unknownScopeHelp.length > 0);
});