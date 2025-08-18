import { useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '@/components/AccessibilityProvider';

interface NavigableElement {
  element: HTMLElement;
  type: 'button' | 'link' | 'input' | 'select' | 'textarea' | 'card' | 'content';
  id: string;
  description: string;
}

interface UsePageNavigationOptions {
  enableArrowNavigation?: boolean;
  enableQuickJumps?: boolean;
  announceNavigation?: boolean;
  skipInvisible?: boolean;
}

export function usePageNavigation(options: UsePageNavigationOptions = {}) {
  const {
    enableArrowNavigation = true,
    enableQuickJumps = true,
    announceNavigation = true,
    skipInvisible = true
  } = options;

  const { announceToScreenReader } = useAccessibility();
  const currentIndexRef = useRef(0);
  const navigableElementsRef = useRef<NavigableElement[]>([]);
  const isNavigatingRef = useRef(false);

  // Find all navigable elements on the page
  const findNavigableElements = useCallback((): NavigableElement[] => {
    const elements: NavigableElement[] = [];
    
    // Selectors for different types of navigable elements
    const selectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex="0"]',
      '[role="button"]',
      '[role="link"]',
      '[data-navigable="true"]',
      '.card',
      'main section',
      'main article',
      'h1, h2, h3, h4, h5, h6'
    ];

    const allElements = document.querySelectorAll(selectors.join(', '));
    
    Array.from(allElements).forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      
      // Skip if element is invisible and skipInvisible is true
      if (skipInvisible) {
        const style = window.getComputedStyle(htmlEl);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }
      }

      // Determine element type and description
      let type: NavigableElement['type'] = 'content';
      let description = '';

      if (htmlEl.tagName === 'BUTTON') {
        type = 'button';
        description = htmlEl.textContent?.trim() || htmlEl.getAttribute('aria-label') || 'Button';
      } else if (htmlEl.tagName === 'A') {
        type = 'link';
        description = htmlEl.textContent?.trim() || htmlEl.getAttribute('aria-label') || 'Link';
      } else if (['INPUT', 'SELECT', 'TEXTAREA'].includes(htmlEl.tagName)) {
        type = htmlEl.tagName.toLowerCase() as 'input' | 'select' | 'textarea';
        const label = document.querySelector(`label[for="${htmlEl.id}"]`)?.textContent?.trim();
        description = label || htmlEl.getAttribute('placeholder') || htmlEl.getAttribute('aria-label') || type;
      } else if (htmlEl.classList.contains('card') || htmlEl.closest('.card')) {
        type = 'card';
        const title = htmlEl.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();
        description = title || 'Card';
      } else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(htmlEl.tagName)) {
        type = 'content';
        description = `${htmlEl.tagName} heading: ${htmlEl.textContent?.trim()}`;
      } else {
        type = 'content';
        description = htmlEl.textContent?.trim()?.slice(0, 50) || 'Content';
      }

      elements.push({
        element: htmlEl,
        type,
        id: htmlEl.id || `nav-${index}`,
        description
      });
    });

    return elements;
  }, [skipInvisible]);

  // Focus on a specific element
  const focusElement = useCallback((index: number) => {
    const elements = navigableElementsRef.current;
    if (index < 0 || index >= elements.length) return false;

    const navElement = elements[index];
    const { element, description, type } = navElement;

    // Set focus
    element.focus();
    
    // Add visual indication
    element.style.outline = '3px solid var(--primary)';
    element.style.outlineOffset = '2px';
    
    // Remove outline after a short delay
    setTimeout(() => {
      if (element.style.outline) {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }
    }, 2000);

    if (announceNavigation) {
      const typeLabel = type === 'content' ? '' : `${type} `;
      announceToScreenReader(`${typeLabel}${description}`);
    }

    currentIndexRef.current = index;
    return true;
  }, [announceNavigation, announceToScreenReader]);

  // Navigate to next element
  const navigateNext = useCallback(() => {
    const elements = navigableElementsRef.current;
    if (elements.length === 0) return false;

    const nextIndex = (currentIndexRef.current + 1) % elements.length;
    return focusElement(nextIndex);
  }, [focusElement]);

  // Navigate to previous element
  const navigatePrevious = useCallback(() => {
    const elements = navigableElementsRef.current;
    if (elements.length === 0) return false;

    const prevIndex = currentIndexRef.current === 0 ? elements.length - 1 : currentIndexRef.current - 1;
    return focusElement(prevIndex);
  }, [focusElement]);

  // Jump to specific element types
  const jumpToType = useCallback((type: NavigableElement['type']) => {
    const elements = navigableElementsRef.current;
    const currentIndex = currentIndexRef.current;
    
    // Find next element of the specified type
    for (let i = 1; i < elements.length; i++) {
      const index = (currentIndex + i) % elements.length;
      if (elements[index].type === type) {
        return focusElement(index);
      }
    }
    
    return false;
  }, [focusElement]);

  // Jump to main sections
  const jumpToMain = useCallback(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
      announceToScreenReader('Jumped to main content');
      return true;
    }
    return false;
  }, [announceToScreenReader]);

  const jumpToNavigation = useCallback(() => {
    const navElement = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (navElement) {
      (navElement as HTMLElement).focus();
      announceToScreenReader('Jumped to navigation');
      return true;
    }
    return false;
  }, [announceToScreenReader]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }

    const { key, altKey, ctrlKey, shiftKey } = event;

    // Arrow key navigation
    if (enableArrowNavigation) {
      if (key === 'ArrowDown' && altKey) {
        event.preventDefault();
        isNavigatingRef.current = true;
        navigableElementsRef.current = findNavigableElements();
        navigateNext();
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
        return;
      }

      if (key === 'ArrowUp' && altKey) {
        event.preventDefault();
        isNavigatingRef.current = true;
        navigableElementsRef.current = findNavigableElements();
        navigatePrevious();
        setTimeout(() => { isNavigatingRef.current = false; }, 100);
        return;
      }
    }

    // Quick jump shortcuts
    if (enableQuickJumps && altKey) {
      switch (key.toLowerCase()) {
        case 'm':
          event.preventDefault();
          jumpToMain();
          break;
        case 'n':
          event.preventDefault();
          jumpToNavigation();
          break;
        case 'b':
          event.preventDefault();
          navigableElementsRef.current = findNavigableElements();
          jumpToType('button');
          break;
        case 'l':
          event.preventDefault();
          navigableElementsRef.current = findNavigableElements();
          jumpToType('link');
          break;
        case 'i':
          event.preventDefault();
          navigableElementsRef.current = findNavigableElements();
          jumpToType('input');
          break;
        case 'c':
          event.preventDefault();
          navigableElementsRef.current = findNavigableElements();
          jumpToType('card');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          event.preventDefault();
          const heading = document.querySelector(`h${key}`);
          if (heading) {
            (heading as HTMLElement).focus();
            announceToScreenReader(`Jumped to ${heading.tagName} heading: ${heading.textContent}`);
          }
          break;
      }
    }
  }, [
    enableArrowNavigation,
    enableQuickJumps,
    findNavigableElements,
    navigateNext,
    navigatePrevious,
    jumpToType,
    jumpToMain,
    jumpToNavigation,
    announceToScreenReader
  ]);

  // Initialize navigation on component mount
  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Update navigable elements on DOM changes
    const observer = new MutationObserver(() => {
      if (!isNavigatingRef.current) {
        navigableElementsRef.current = findNavigableElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Initial scan
    navigableElementsRef.current = findNavigableElements();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [handleKeyDown, findNavigableElements]);

  return {
    navigateNext,
    navigatePrevious,
    jumpToType,
    jumpToMain,
    jumpToNavigation,
    focusElement,
    getCurrentElement: () => navigableElementsRef.current[currentIndexRef.current],
    getNavigableElements: () => navigableElementsRef.current,
    announceHelp: () => {
      const helpText = `Page Navigation Help: 
        Alt + Down Arrow: Next element, 
        Alt + Up Arrow: Previous element, 
        Alt + M: Jump to main content, 
        Alt + N: Jump to navigation, 
        Alt + B: Next button, 
        Alt + L: Next link, 
        Alt + I: Next input field, 
        Alt + C: Next card, 
        Alt + 1-6: Jump to headings by level. 
        Use Tab for normal focus navigation, Space or Enter to activate buttons and links.`;
      announceToScreenReader(helpText);
    }
  };
}