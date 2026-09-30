import type { VoiceMatch } from './types';

/**
 * Development-only voice command log. Never stores microphone audio (we never have it — only the
 * text transcript the browser's speech engine already produced) and, because matching is limited
 * to the fixed command vocabulary, never stores free-text exam answer content.
 */
export interface VoiceCommandLogEntry {
  timestamp: number;
  transcript: string;
  intent: string | null;
  confidence: number;
  result: VoiceMatch['status'] | 'no-handler';
}

const MAX_ENTRIES = 50;
const log: VoiceCommandLogEntry[] = [];

/** Records an entry unconditionally. Exported only so the ring-buffer behavior is unit-testable. */
export function recordVoiceCommand(entry: Omit<VoiceCommandLogEntry, 'timestamp'>): VoiceCommandLogEntry {
  const record: VoiceCommandLogEntry = { ...entry, timestamp: Date.now() };
  log.push(record);
  if (log.length > MAX_ENTRIES) log.shift();
  return record;
}

// import.meta.env is a Vite build-time global, replaced with a literal at build time; guard with
// optional chaining so this module is also safe (and a no-op) under plain Node test runners.
const isDev = Boolean(import.meta.env?.DEV);

export function logVoiceCommand(entry: Omit<VoiceCommandLogEntry, 'timestamp'>): void {
  if (!isDev) return;
  const record = recordVoiceCommand(entry);
  // eslint-disable-next-line no-console
  console.debug('[voice]', record);
}

export function getVoiceCommandLog(): VoiceCommandLogEntry[] {
  return [...log];
}

export function clearVoiceCommandLog(): void {
  log.length = 0;
}
