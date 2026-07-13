import { useState, useCallback, useRef, useEffect } from 'react';

/* ── Types ────────────────────────────────────────────────── */
export interface VoiceCommandDef {
  id: string;
  patterns: string[];
  action: string;
  description: string;
  example: string;
  group: 'navigation' | 'exam' | 'accessibility' | 'system';
}

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

/* ── Command registry ─────────────────────────────────────── */
export const VOICE_COMMANDS: VoiceCommandDef[] = [
  // Navigation
  {
    id: 'next_question',
    patterns: ['next question', 'next', 'go next', 'move on', 'forward'],
    action: 'NEXT_QUESTION',
    description: 'Go to the next question',
    example: '"Next question"',
    group: 'navigation',
  },
  {
    id: 'prev_question',
    patterns: ['previous question', 'previous', 'go back', 'back', 'last question'],
    action: 'PREV_QUESTION',
    description: 'Go to the previous question',
    example: '"Previous question"',
    group: 'navigation',
  },
  {
    id: 'go_home',
    patterns: ['go home', 'home', 'dashboard', 'go to dashboard'],
    action: 'GO_HOME',
    description: 'Go to the dashboard',
    example: '"Go home"',
    group: 'navigation',
  },

  // Exam controls
  {
    id: 'repeat_question',
    patterns: ['repeat question', 'read question', 'what is the question', 'say the question', 'read this'],
    action: 'READ_QUESTION',
    description: 'Read the current question aloud',
    example: '"Repeat question"',
    group: 'exam',
  },
  {
    id: 'repeat_answer',
    patterns: ['repeat answer', 'read answer', 'what did i say', 'read my answer', 'read selection'],
    action: 'READ_ANSWER',
    description: 'Read your current answer aloud',
    example: '"Repeat answer"',
    group: 'exam',
  },
  {
    id: 'save_answer',
    patterns: ['save answer', 'save my answer', 'save', 'store answer'],
    action: 'SAVE_ANSWER',
    description: 'Save the current answer',
    example: '"Save answer"',
    group: 'exam',
  },
  {
    id: 'submit_answer',
    patterns: ['submit answer', 'confirm answer', 'lock answer'],
    action: 'SUBMIT_ANSWER',
    description: 'Submit and lock your answer',
    example: '"Submit answer"',
    group: 'exam',
  },
  {
    id: 'flag_question',
    patterns: ['flag question', 'mark question', 'flag this', 'mark this'],
    action: 'FLAG_QUESTION',
    description: 'Flag question for review',
    example: '"Flag question"',
    group: 'exam',
  },
  {
    id: 'start_exam',
    patterns: ['start exam', 'begin exam', 'start the exam', 'begin the exam'],
    action: 'START_EXAM',
    description: 'Start the exam',
    example: '"Start exam"',
    group: 'exam',
  },
  {
    id: 'submit_exam',
    patterns: ['submit exam', 'finish exam', 'end exam', 'complete exam', 'submit the exam'],
    action: 'SUBMIT_EXAM',
    description: 'Submit the exam',
    example: '"Submit exam"',
    group: 'exam',
  },

  // Accessibility
  {
    id: 'open_accessibility',
    patterns: ['open accessibility', 'accessibility settings', 'accessibility', 'open settings'],
    action: 'OPEN_ACCESSIBILITY',
    description: 'Open the Accessibility Center',
    example: '"Open accessibility"',
    group: 'accessibility',
  },
  {
    id: 'increase_text',
    patterns: ['increase text', 'larger text', 'bigger text', 'zoom in', 'text bigger'],
    action: 'INCREASE_FONT',
    description: 'Increase text size',
    example: '"Increase text"',
    group: 'accessibility',
  },
  {
    id: 'decrease_text',
    patterns: ['decrease text', 'smaller text', 'zoom out', 'text smaller'],
    action: 'DECREASE_FONT',
    description: 'Decrease text size',
    example: '"Decrease text"',
    group: 'accessibility',
  },
  {
    id: 'high_contrast',
    patterns: ['high contrast', 'toggle contrast', 'contrast mode'],
    action: 'TOGGLE_CONTRAST',
    description: 'Toggle high contrast mode',
    example: '"High contrast"',
    group: 'accessibility',
  },

  // System
  {
    id: 'help',
    patterns: ['help', 'what can i say', 'commands', 'voice commands', 'show commands', 'what commands'],
    action: 'SHOW_HELP',
    description: 'Show available voice commands',
    example: '"Help"',
    group: 'system',
  },
  {
    id: 'stop',
    patterns: ['stop', 'cancel', 'quiet', 'be quiet', 'stop listening', 'silence'],
    action: 'STOP_LISTENING',
    description: 'Stop the voice assistant',
    example: '"Stop"',
    group: 'system',
  },
  {
    id: 'read_page',
    patterns: ['read page', 'read this page', 'read everything', 'read all'],
    action: 'READ_PAGE',
    description: 'Read the entire page aloud',
    example: '"Read page"',
    group: 'system',
  },
];

/* ── Fuzzy command matching ───────────────────────────────── */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function similarity(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const matches = wordsA.filter(w => wordsB.includes(w)).length;
  return matches / Math.max(wordsA.length, wordsB.length);
}

export function matchCommand(transcript: string): CommandResult {
  const norm = normalise(transcript);
  let bestMatch: { cmd: VoiceCommandDef; score: number } | null = null;

  for (const cmd of VOICE_COMMANDS) {
    for (const pattern of cmd.patterns) {
      const score = similarity(norm, normalise(pattern));
      if (score > (bestMatch?.score ?? 0)) {
        bestMatch = { cmd, score };
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.65) {
    return { matched: true, command: bestMatch.cmd, confidence: bestMatch.score };
  }
  return { matched: false, confidence: 0 };
}

/* ── Main hook ────────────────────────────────────────────── */
interface UseVoiceCommandsOptions {
  onCommand: (action: string, command: VoiceCommandDef) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  language?: string;
}

export function useVoiceCommands({ onCommand, onTranscript, language = 'en-US' }: UseVoiceCommandsOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const noiseRafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  /* check support */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
    return () => stopNoiseDetection();
  }, []);

  /* ── Noise detection ────────────────────────────────────── */
  const startNoiseDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setPermissionState('granted');

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setNoiseLevel(Math.min(100, Math.round((avg / 128) * 100)));
        noiseRafRef.current = requestAnimationFrame(tick);
      };
      noiseRafRef.current = requestAnimationFrame(tick);
    } catch {
      setPermissionState('denied');
    }
  }, []);

  const stopNoiseDetection = useCallback(() => {
    cancelAnimationFrame(noiseRafRef.current);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  /* ── Start listening ─────────────────────────────────────── */
  const startListening = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (!audioCtxRef.current) await startNoiseDetection();

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => { setIsListening(false); setInterimText(''); };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') setPermissionState('denied');
      setIsListening(false);
    };

    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        const conf = result[0].confidence ?? 0.8;

        if (result.isFinal) {
          setInterimText('');
          setConfidence(Math.round(conf * 100));
          onTranscript?.(text, true);

          const match = matchCommand(text);
          const entry: VoiceHistoryEntry = {
            id: crypto.randomUUID(),
            transcript: text.trim(),
            matched: match.matched,
            command: match.command?.description,
            confidence: Math.round((match.confidence ?? conf) * 100),
            timestamp: new Date(),
          };
          setHistory(prev => [entry, ...prev].slice(0, 12));

          if (match.matched && match.command) {
            onCommand(match.command.action, match.command);
          }
        } else {
          interim = text;
          setConfidence(Math.round(conf * 100));
          onTranscript?.(text, false);
        }
      }
      setInterimText(interim);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, startNoiseDetection, onCommand, onTranscript]);

  /* ── Stop listening ──────────────────────────────────────── */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    isListening,
    isSupported,
    interimText,
    confidence,
    noiseLevel,
    history,
    permissionState,
    startListening,
    stopListening,
    clearHistory,
    VOICE_COMMANDS,
  };
}
