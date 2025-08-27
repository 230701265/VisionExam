import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[] = []) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input, textarea, or contenteditable element
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.getAttribute('role') === 'textbox') {
      return;
    }

    // Check for matching shortcuts
    for (const shortcut of shortcuts) {
      if (event.key === shortcut.key &&
          Boolean(event.ctrlKey) === Boolean(shortcut.ctrlKey) &&
          Boolean(event.shiftKey) === Boolean(shortcut.shiftKey) &&
          Boolean(event.altKey) === Boolean(shortcut.altKey) &&
          Boolean(event.metaKey) === Boolean(shortcut.metaKey)) {
        
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Global navigation shortcuts
export function useGlobalNavigation() {
  const navigateToElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const navigateBetweenSections = useCallback((direction: 'up' | 'down') => {
    const navigableElements = Array.from(
      document.querySelectorAll('[data-navigable="true"]')
    ) as HTMLElement[];
    
    const currentFocused = document.activeElement as HTMLElement;
    const currentIndex = navigableElements.findIndex(el => 
      el === currentFocused || el.contains(currentFocused)
    );
    
    let nextIndex: number;
    if (direction === 'down') {
      nextIndex = currentIndex < navigableElements.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : navigableElements.length - 1;
    }
    
    const nextElement = navigableElements[nextIndex];
    if (nextElement) {
      const focusableElement = nextElement.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement || nextElement;
      
      focusableElement.focus();
      focusableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowDown',
      altKey: true,
      action: () => navigateBetweenSections('down'),
      description: 'Navigate to next section (Alt+Down)'
    },
    {
      key: 'ArrowUp',
      altKey: true,
      action: () => navigateBetweenSections('up'),
      description: 'Navigate to previous section (Alt+Up)'
    },
    {
      key: '1',
      altKey: true,
      action: () => navigateToElement('main'),
      description: 'Go to main content (Alt+1)'
    },
    {
      key: '2',
      altKey: true,
      action: () => navigateToElement('nav'),
      description: 'Go to navigation (Alt+2)'
    },
    {
      key: 'h',
      action: () => {
        // Show keyboard shortcuts help
        const helpEvent = new CustomEvent('show-keyboard-help');
        document.dispatchEvent(helpEvent);
      },
      description: 'Show keyboard shortcuts help (H)'
    },
  ];

  useKeyboardNavigation(globalShortcuts);

  return {
    navigateToElement,
    navigateBetweenSections
  };
}