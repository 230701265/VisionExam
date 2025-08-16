import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean; // Cmd key on Mac
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
    const { key, altKey, ctrlKey, metaKey, shiftKey } = event;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Find matching shortcut
    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === key.toLowerCase() &&
      (s.altKey === undefined || s.altKey === altKey) &&
      (s.ctrlKey === undefined || s.ctrlKey === (isMac ? metaKey : ctrlKey)) &&
      (s.metaKey === undefined || s.metaKey === metaKey) &&
      (s.shiftKey === undefined || s.shiftKey === shiftKey)
    );

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }

    // General keyboard help (Alt+H on Windows, Option+H on Mac)
    if (altKey && key.toLowerCase() === 'h') {
      event.preventDefault();
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      let helpText = 'OPSIS Keyboard Shortcuts: ';
      helpText += shortcuts.map(s => {
        const modifiers = [];
        if (s.altKey) modifiers.push(isMac ? 'Option' : 'Alt');
        if (s.ctrlKey) modifiers.push(isMac ? 'Cmd' : 'Ctrl');
        if (s.shiftKey) modifiers.push('Shift');
        const keyCombo = [...modifiers, s.key.toUpperCase()].join(' + ');
        return `${keyCombo}: ${s.description}`;
      }).join('. ');
      
      const platformNav = isMac ? 'Option + H for help, Option + R to read, Option + N for next, Option + P for previous, Option + F to flag, Cmd + M for voice input' : 'Alt + H for help, Alt + R to read, Alt + N for next, Alt + P for previous, Alt + F to flag, Ctrl + M for voice input';
      helpText += '. General navigation: Tab to move forward, Shift+Tab to move backward, Enter or Space to activate buttons, Arrow keys to navigate radio buttons and dropdowns. Platform shortcuts: ' + platformNav;
      
      announceToScreenReader(helpText);
    }
  }, [shortcuts, announceToScreenReader]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { announceToScreenReader };
}
