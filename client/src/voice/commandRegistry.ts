import type {
  CommandId,
  ParsedVoiceCommand,
  VoiceCommandDefinition,
  VoiceMatch,
  VoiceScope,
} from './types';

export const VOICE_CONFIDENCE_THRESHOLD = 0.75;

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
    phrases: ['help', 'what can i say', 'voice commands'],
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
    phrases: ['cancel', 'stop', 'be quiet'],
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
    phrases: ['confirm submit', 'confirm submission', 'yes submit'],
    description: 'Confirm exam submission',
    scopes: ['question'],
    destructive: true,
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
    new RegExp(`^(?:${starters})(?: option| answer)?\\s+(a|b|c|d|true|false)$`),
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
    if (confidence < VOICE_CONFIDENCE_THRESHOLD) {
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
    if (confidence < VOICE_CONFIDENCE_THRESHOLD) {
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

  const definition = VOICE_COMMANDS.find(command => exactPhraseMatch(normalized, command));
  if (!definition) return { status: 'unknown', confidence };
  if (confidence < VOICE_CONFIDENCE_THRESHOLD) return { status: 'low-confidence', confidence };
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