import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[] = []) {
  const announceToScreenReader = useCallback((message: string) => {
    const announcer = document.getElementById('announcements');
    if (announcer) {
      announcer.textContent = message;
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, altKey, ctrlKey, shiftKey } = event;

    // Find matching shortcut
    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === key.toLowerCase() &&
      (s.altKey === undefined || s.altKey === altKey) &&
      (s.ctrlKey === undefined || s.ctrlKey === ctrlKey) &&
      (s.shiftKey === undefined || s.shiftKey === shiftKey)
    );

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }

    // General keyboard help
    if (altKey && key.toLowerCase() === 'h') {
      event.preventDefault();
      const helpText = shortcuts.map(s => {
        const modifiers = [];
        if (s.altKey) modifiers.push('Alt');
        if (s.ctrlKey) modifiers.push('Ctrl');
        if (s.shiftKey) modifiers.push('Shift');
        const keyCombo = [...modifiers, s.key.toUpperCase()].join(' + ');
        return `${keyCombo}: ${s.description}`;
      }).join('. ');
      
      announceToScreenReader(`Keyboard shortcuts: ${helpText}`);
    }
  }, [shortcuts, announceToScreenReader]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { announceToScreenReader };
}
