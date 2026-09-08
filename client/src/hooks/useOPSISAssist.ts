import { useEffect, useRef } from 'react';
import { useAccessibility, type AssistShortcut } from '@/components/AccessibilityProvider';
import type { ParsedVoiceCommand, VoiceScope } from '@/voice/types';

/** Registers page-local Assist actions with the single provider controller. */
export function useOPSISAssist(
  scope: VoiceScope,
  onCommand: (command: ParsedVoiceCommand) => boolean | void,
  shortcuts: Record<string, AssistShortcut> = {},
) {
  const { assist } = useAccessibility();
  const { registerVoiceScope, registerShortcut } = assist;
  const commandRef = useRef(onCommand);
  const shortcutsRef = useRef(shortcuts);
  commandRef.current = onCommand;
  shortcutsRef.current = shortcuts;
  useEffect(() => registerVoiceScope(scope, command => commandRef.current(command)), [registerVoiceScope, scope]);
  useEffect(() => {
    const removers = Object.entries(shortcutsRef.current).map(([id, shortcut]) =>
      registerShortcut(`${scope}:${id}`, {
        ...shortcut,
        action: () => shortcutsRef.current[id]?.action(),
      }),
    );
    return () => removers.forEach(remove => remove());
  }, [registerShortcut, scope]);
  return assist;
}