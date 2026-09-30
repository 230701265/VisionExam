import type {
  CommandId,
  ParsedVoiceCommand,
  VoiceCommandDefinition,
  VoiceMatch,
  VoiceScope,
} from './types';

export const VOICE_CONFIDENCE_THRESHOLD = 0.75;
/** Destructive commands (exam submission) require a higher-confidence recognition before they're even staged. */
export const VOICE_DESTRUCTIVE_CONFIDENCE_THRESHOLD = 0.85;

function thresholdFor(definition: VoiceCommandDefinition): number {
  return definition.destructive ? VOICE_DESTRUCTIVE_CONFIDENCE_THRESHOLD : VOICE_CONFIDENCE_THRESHOLD;
}

export const VOICE_COMMANDS: VoiceCommandDefinition[] = [
  {
    id: 'nextQuestion',
    phrases: ['next', 'next question', 'go to next question', 'go next', 'skip ahead'],
    description: 'Move to the next question',
    scopes: ['question'],
  },
  {
    id: 'previousQuestion',
    phrases: ['previous', 'previous question', 'go back', 'go to previous question'],
    description: 'Move to the previous question',
    scopes: ['question'],
  },
  {
    id: 'readQuestion',
    phrases: ['read question', 'read this question', 'what is the question'],
    description: 'Read the current question',
    scopes: ['question', 'results'],
  },
  {
    id: 'readOption',
    phrases: [],
    description: 'Read a specific answer option',
    scopes: ['question'],
  },
  {
    id: 'selectOption',
    phrases: [],
    description: 'Select a specific answer option',
    scopes: ['question'],
  },
  {
    id: 'readTimer',
    phrases: ['read timer', 'time remaining', 'how much time is left'],
    description: 'Read the remaining exam time',
    scopes: ['question'],
  },
  {
    id: 'flagQuestion',
    phrases: ['flag question', 'flag this question', 'mark question for review'],
    description: 'Flag the current question for review',
    scopes: ['question'],
  },
  {
    id: 'runTests',
    phrases: ['run tests', 'run the tests', 'execute tests'],
    description: 'Run the current coding question tests',
    scopes: ['editor', 'question'],
  },
  {
    id: 'readTestResults',
    phrases: ['read test results', 'read the test results', 'what were the test results'],
    description: 'Read the latest coding test results',
    scopes: ['editor', 'question'],
  },
  {
    id: 'readResults',
    phrases: ['read results', 'show my results', 'tell me my result'],
    description: 'Read the exam results',
    scopes: ['results'],
  },
  {
    id: 'help',
    phrases: ['help', 'what can i say', 'voice commands', 'give me help'],
    description: 'List commands available in this context',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'repeat',
    phrases: ['repeat', 'say that again'],
    description: 'Repeat the last important announcement',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'cancel',
    phrases: ['cancel', 'stop', 'be quiet', 'no'],
    description: 'Cancel the current voice action or speech',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'pauseSpeech',
    phrases: ['pause speech', 'pause speaking'],
    description: 'Pause speech',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'resumeSpeech',
    phrases: ['resume speech', 'resume speaking'],
    description: 'Resume speech',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'increaseSpeechRate',
    phrases: ['speak faster', 'speech faster', 'increase speech rate'],
    description: 'Increase the speech rate',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'decreaseSpeechRate',
    phrases: ['speak slower', 'speech slower', 'decrease speech rate'],
    description: 'Decrease the speech rate',
    scopes: ['global', 'question', 'editor', 'results'],
  },
  {
    id: 'stageSubmit',
    phrases: ['submit exam', 'finish exam', 'end exam'],
    description: 'Prepare the exam for submission',
    scopes: ['question'],
    destructive: true,
  },
  {
    id: 'confirmSubmit',
    phrases: ['confirm submit', 'confirm submission', 'yes submit', 'yes'],
    description: 'Confirm exam submission',
    scopes: ['question'],
    destructive: true,
  },
  {
    id: 'readOptions',
    phrases: ['read the options', 'read options', 'what are the options'],
    description: 'Read all answer options for the current question',
    scopes: ['question'],
  },
  {
    id: 'clearAnswer',
    phrases: ['clear answer', 'clear my answer', 'remove answer'],
    description: 'Clear the selected answer for the current question',
    scopes: ['question'],
  },
  {
    id: 'readSelectedAnswer',
    phrases: ['read my answer', 'read selected answer', 'what did i select'],
    description: 'Read back the currently selected answer',
    scopes: ['question'],
  },
  {
    id: 'submitAnswer',
    phrases: ['submit answer', 'save answer', 'confirm answer'],
    description: 'Confirm the current answer and move on',
    scopes: ['question'],
  },
  {
    id: 'navigateHome',
    phrases: ['go home', 'take me home', 'open dashboard', 'go to dashboard'],
    description: 'Go to the dashboard',
    scopes: ['global'],
  },
  {
    id: 'openProfile',
    phrases: ['open profile', 'go to profile'],
    description: 'Open your profile',
    scopes: ['global'],
  },
  {
    id: 'openAccessibilityProfile',
    phrases: ['open accessibility profile', 'go to accessibility profile', 'accessibility profile'],
    description: 'Open your accessibility profile',
    scopes: ['global'],
  },
  {
    id: 'goBack',
    phrases: ['go back'],
    description: 'Go back to the previous screen',
    scopes: ['global'],
  },
  {
    id: 'openSettings',
    phrases: ['open settings', 'go to settings'],
    description: 'Open settings',
    scopes: ['global'],
  },
  {
    id: 'openExamination',
    phrases: ['open examination', 'open exam'],
    description: 'Open an available exam',
    scopes: ['global'],
  },
  {
    id: 'startExam',
    phrases: ['start exam'],
    description: 'Start an available exam',
    scopes: ['global'],
  },
  {
    id: 'enableVoiceCommands',
    phrases: ['enable voice commands', 'turn on voice commands'],
    description: 'Enable OPSIS Assist voice commands',
    scopes: ['global'],
  },
  {
    id: 'disableVoiceCommands',
    phrases: ['disable voice commands', 'turn off voice commands'],
    description: 'Disable OPSIS Assist voice commands',
    scopes: ['global'],
  },
];

export function normalizeTranscript(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bgo to the next\b/g, 'go to next')
    .replace(/\bgo to the previous\b/g, 'go to previous');
}

function getOptionArgument(transcript: string, verb: 'read' | 'select'): string | undefined {
  const normalized = normalizeTranscript(transcript);
  const starters = verb === 'read' ? 'read|what|repeat' : 'select|choose|answer';
  const match = normalized.match(
    new RegExp(`^(?:${starters})(?: option| answer)?\\s+([a-z]|[1-9][0-9]?|true|false)$`),
  );
  return match?.[1]?.toUpperCase();
}

function exactPhraseMatch(transcript: string, definition: VoiceCommandDefinition): boolean {
  const normalized = normalizeTranscript(transcript);
  return definition.phrases.some(phrase => normalizeTranscript(phrase) === normalized);
}

export function matchVoiceCommand(
  transcript: string,
  scope: VoiceScope,
  confidence = 1,
): VoiceMatch {
  const normalized = normalizeTranscript(transcript);
  if (!normalized) return { status: 'unknown', confidence };

  const optionToRead = getOptionArgument(normalized, 'read');
  if (optionToRead) {
    const definition = VOICE_COMMANDS.find(command => command.id === 'readOption')!;
    if (confidence < thresholdFor(definition)) {
      return { status: 'low-confidence', confidence };
    }
    return {
      status: definition.scopes.includes(scope) ? 'matched' : 'wrong-scope',
      command: definition.scopes.includes(scope)
        ? { definition, argument: optionToRead, transcript, confidence }
        : undefined,
      confidence,
    };
  }

  const optionToSelect = getOptionArgument(normalized, 'select');
  if (optionToSelect) {
    const definition = VOICE_COMMANDS.find(command => command.id === 'selectOption')!;
    if (confidence < thresholdFor(definition)) {
      return { status: 'low-confidence', confidence };
    }
    return {
      status: definition.scopes.includes(scope) ? 'matched' : 'wrong-scope',
      command: definition.scopes.includes(scope)
        ? { definition, argument: optionToSelect, transcript, confidence }
        : undefined,
      confidence,
    };
  }

  // Some phrases are intentionally shared by more than one command (e.g. "go back" means
  // previousQuestion in the question scope but goBack everywhere else) — prefer whichever
  // candidate actually applies to the scope being tried, falling back to the first candidate
  // so an out-of-scope phrase still reports 'wrong-scope' rather than 'unknown'.
  const candidates = VOICE_COMMANDS.filter(command => exactPhraseMatch(normalized, command));
  if (!candidates.length) return { status: 'unknown', confidence };
  const definition =
    candidates.find(command => command.scopes.includes(scope) || command.scopes.includes('global')) ??
    candidates[0];
  if (confidence < thresholdFor(definition)) return { status: 'low-confidence', confidence };
  if (!definition.scopes.includes(scope) && !definition.scopes.includes('global')) {
    return { status: 'wrong-scope', confidence };
  }

  return {
    status: 'matched',
    command: { definition, transcript, confidence },
    confidence,
  };
}

export function commandsForScope(scope: VoiceScope): VoiceCommandDefinition[] {
  return VOICE_COMMANDS.filter(
    command => command.scopes.includes(scope) || command.scopes.includes('global'),
  );
}

/** Builds a spoken "here's what you can say" sentence from the commands actually available in this context. */
export function buildHelpMessage(scope: VoiceScope): string {
  const descriptions = commandsForScope(scope)
    .map(command => command.description.charAt(0).toLowerCase() + command.description.slice(1))
    .filter((description, index, all) => all.indexOf(description) === index);
  if (!descriptions.length) return 'No voice commands are available here.';
  return `You can say: ${descriptions.join(', ')}.`;
}

export type VoiceActionHandler = (command: ParsedVoiceCommand) => void;

export function createCommandBus(
  handlers: Partial<Record<CommandId, VoiceActionHandler>>,
) {
  return {
    dispatch(command: ParsedVoiceCommand) {
      handlers[command.definition.id]?.(command);
    },
  };
}