import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  commandsForScope,
  matchVoiceCommand,
  VOICE_CONFIDENCE_THRESHOLD,
} from '@/voice/commandRegistry';
import { BrowserSpeechEngine, isSpeechRecognitionSupported } from '@/voice/speechRecognition';
import { VoiceCommandBus } from '@/voice/commandBus';
import type {
  ParsedVoiceCommand,
  VoiceCommandDefinition,
  VoiceMode,
  VoiceScope,
} from '@/voice/types';

export type VoiceCommandDef = VoiceCommandDefinition;
export const VOICE_COMMANDS = commandsForScope('question');

export interface VoiceHistoryEntry {
  id: string;
  transcript: string;
  matched: boolean;
  command?: string;
  confidence: number;
  timestamp: Date;
}

export interface CommandResult {
  matched: boolean;
  command?: VoiceCommandDef;
  confidence: number;
}

export function matchCommand(transcript: string): CommandResult {
  const result = matchVoiceCommand(transcript, 'question', 1);
  return {
    matched: result.status === 'matched',
    command: result.command?.definition,
    confidence: result.confidence,
  };
}

interface UseVoiceCommandsOptions {
  scope: VoiceScope;
  mode?: VoiceMode;
  language?: string;
  onCommand: (command: ParsedVoiceCommand) => void;
}

type Earcon = 'start' | 'accepted' | 'error' | 'stop';

function playEarcon(kind: Earcon, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = kind === 'error' ? 220 : kind === 'accepted' ? 880 : kind === 'stop' ? 440 : 660;
    oscillator.frequency.value = frequency;
    oscillator.type = kind === 'error' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.addEventListener('ended', () => void context.close());
  } catch {
    // Audio feedback is optional. Speech and the live region remain available.
  }
}

export function useVoiceCommands({
  scope,
  mode = 'off',
  language = 'en-US',
  onCommand,
}: UseVoiceCommandsOptions) {
  const {
    settings,
    announceToScreenReader,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    isSpeaking,
  } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastConfidence, setLastConfidence] = useState(0);
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const engineRef = useRef<BrowserSpeechEngine | null>(null);
  const commandBusRef = useRef(new VoiceCommandBus());

  useEffect(() => {
    commandBusRef.current.clear();
    for (const command of commandsForScope(scope)) {
      commandBusRef.current.register(command.id, onCommand);
    }
    return () => commandBusRef.current.clear();
  }, [onCommand, scope]);

  const announce = useCallback(
    (message: string, priority: 'interrupt' | 'queue' | 'drop-if-speaking' = 'queue') => {
      setLastAnnouncement(message);
      announceToScreenReader(message);
      if (settings.speechEnabled && settings.audioInstructions) {
        speak(message, { priority });
      }
    },
    [announceToScreenReader, settings.audioInstructions, settings.speechEnabled, speak],
  );

  const startListening = useCallback(() => {
    if (mode !== 'push-to-talk' || isListening) return;
    setError(null);
    const engine = new BrowserSpeechEngine(
      language,
      text => setInterimText(text),
      result => {
        setInterimText('');
        setLastTranscript(result.transcript);
        const confidence = result.confidence ?? 0;
        setLastConfidence(confidence);
        const match = matchVoiceCommand(result.transcript, scope, confidence);
        setHistory(previous => [
          {
            id: crypto.randomUUID(),
            transcript: result.transcript,
            matched: match.status === 'matched',
            command: match.command?.definition.description,
            confidence: Math.round(confidence * 100),
            timestamp: new Date(),
          },
          ...previous,
        ].slice(0, 20));

        if (match.status === 'low-confidence') {
          playEarcon('error', settings.soundEffects);
          announce(`I heard: ${result.transcript}. Please repeat.`, 'interrupt');
          return;
        }
        if (match.status === 'wrong-scope') {
          playEarcon('error', settings.soundEffects);
          announce('That command is not available in this part of OPSIS.', 'interrupt');
          return;
        }
        if (match.status !== 'matched' || !match.command) {
          playEarcon('error', settings.soundEffects);
          announce('Command not understood. Say help for available commands.', 'interrupt');
          return;
        }

        playEarcon('accepted', settings.soundEffects);
        commandBusRef.current.dispatch(match.command);
      },
      () => {
        setIsListening(true);
        playEarcon('start', settings.soundEffects);
        announce('Listening.', 'interrupt');
      },
      () => {
        setIsListening(false);
        setInterimText('');
        playEarcon('stop', settings.soundEffects);
      },
      message => {
        setIsListening(false);
        setError(message);
        playEarcon('error', settings.soundEffects);
        announce(message, 'interrupt');
      },
    );
    engineRef.current = engine;
    engine.start();
  }, [
    announce,
    isListening,
    language,
    mode,
    scope,
    settings.soundEffects,
  ]);

  const stopListening = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const speakMessage = useCallback(
    (message: string, priority: 'interrupt' | 'queue' | 'drop-if-speaking' = 'queue') => {
      setLastAnnouncement(message);
      announceToScreenReader(message);
      if (settings.speechEnabled && settings.audioInstructions) speak(message, { priority });
    },
    [announceToScreenReader, settings.audioInstructions, settings.speechEnabled, speak],
  );

  const repeat = useCallback(() => {
    if (lastAnnouncement) speakMessage(lastAnnouncement, 'interrupt');
    else announce('There is nothing to repeat yet.', 'interrupt');
  }, [announce, lastAnnouncement, speakMessage]);

  useEffect(() => {
    if (mode !== 'push-to-talk') {
      stopListening();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSpeaking && !event.ctrlKey && !event.metaKey && !event.altKey) {
        stopSpeaking();
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        toggleListening();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isSpeaking, mode, stopListening, stopSpeaking, toggleListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    isListening,
    isSupported: isSpeechRecognitionSupported(),
    interimText,
    lastTranscript,
    lastConfidence,
    lastAnnouncement,
    error,
    history,
    startListening,
    stopListening,
    toggleListening,
    speakMessage,
    repeat,
    pauseSpeech: pauseSpeaking,
    resumeSpeech: resumeSpeaking,
    stopSpeech: stopSpeaking,
    commands: commandsForScope(scope),
    confidenceThreshold: VOICE_CONFIDENCE_THRESHOLD,
  };
}