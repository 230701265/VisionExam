export type VoiceMode = 'off' | 'push-to-talk';

export type VoiceScope = 'global' | 'question' | 'editor' | 'results';

export type CommandId =
  | 'nextQuestion'
  | 'previousQuestion'
  | 'readQuestion'
  | 'readOption'
  | 'selectOption'
  | 'readTimer'
  | 'flagQuestion'
  | 'runTests'
  | 'readTestResults'
  | 'readResults'
  | 'help'
  | 'repeat'
  | 'cancel'
  | 'pauseSpeech'
  | 'resumeSpeech'
  | 'increaseSpeechRate'
  | 'decreaseSpeechRate'
  | 'stageSubmit'
  | 'confirmSubmit';

export interface VoiceCommandDefinition {
  id: CommandId;
  phrases: string[];
  description: string;
  scopes: VoiceScope[];
  destructive?: boolean;
}

export interface ParsedVoiceCommand {
  definition: VoiceCommandDefinition;
  argument?: string;
  transcript: string;
  confidence: number;
}

export interface VoiceMatch {
  status: 'matched' | 'unknown' | 'low-confidence' | 'wrong-scope';
  command?: ParsedVoiceCommand;
  confidence: number;
}

export interface SpeechRecognitionFinalResult {
  transcript: string;
  confidence?: number;
}