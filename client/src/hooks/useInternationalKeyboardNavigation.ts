import { useEffect, useCallback } from 'react';

/**
 * International Keyboard Navigation Hook
 * Implements WCAG 2.1 compliant keyboard shortcuts for comprehensive accessibility
 * Based on international standards for screen reader users
 */
export const useInternationalKeyboardNavigation = () => {
  const navigateToElement = useCallback((selector: string, direction: 'next' | 'previous' = 'next') => {
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    if (elements.length === 0) return false;

    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = elements.indexOf(currentElement);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % elements.length;
    } else {
      nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    }
    
    const targetElement = elements[nextIndex];
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);

  const announceNavigation = useCallback((message: string) => {
    // Create ARIA live region for screen reader announcements
    let liveRegion = document.getElementById('keyboard-nav-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'keyboard-nav-announcer';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body?.appendChild(liveRegion);
    }
    liveRegion.textContent = message;
    
    // Speech is handled by the centralized narrator in AccessibilityProvider.
    document.dispatchEvent(new CustomEvent('opsis:narrate', { detail: { message } }));
  }, []);

  const jumpToLandmark = useCallback((landmark: string) => {
    // WCAG landmark navigation
    const landmarkSelectors = {
      main: 'main, [role="main"], #main-content',
      navigation: 'nav, [role="navigation"], #navigation',
      banner: 'header, [role="banner"]',
      contentinfo: 'footer, [role="contentinfo"]',
      complementary: 'aside, [role="complementary"]',
      search: '[role="search"], #search',
      form: 'form, [role="form"]',
      application: '[role="application"]'
    };
    
    const selector = landmarkSelectors[landmark as keyof typeof landmarkSelectors] || `[role="${landmark}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);

  const navigateByElementType = useCallback((type: string) => {
    const elementSelectors = {
      button: 'button, [role="button"], input[type="button"], input[type="submit"]',
      link: 'a[href], [role="link"]',
      heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
      input: 'input:not([type="button"]):not([type="submit"]), textarea, select, [role="textbox"]',
      checkbox: 'input[type="checkbox"], [role="checkbox"]',
      radio: 'input[type="radio"], [role="radio"]',
      combobox: 'select, [role="combobox"]',
      listbox: '[role="listbox"]',
      menuitem: '[role="menuitem"]',
      tab: '[role="tab"]',
      tabpanel: '[role="tabpanel"]',
      dialog: '[role="dialog"]',
      table: 'table, [role="table"]',
      row: 'tr, [role="row"]',
      cell: 'td, th, [role="gridcell"], [role="cell"]'
    };
    
    const selector = elementSelectors[type as keyof typeof elementSelectors];
    if (selector) {
      return navigateToElement(selector, 'next');
    }
    return false;
  }, [navigateToElement]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't interfere when user is typing
    const target = event.target as HTMLElement;
    const isEditing = target.tagName === 'TEXTAREA' || 
                      (target.tagName === 'INPUT' && !['button', 'submit', 'checkbox', 'radio'].includes((target as HTMLInputElement).type)) ||
                      target.contentEditable === 'true' ||
                      target.closest('.monaco-editor');

    // Detect Mac/iOS platforms
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes('Mac');
    
    // International accessibility keyboard shortcuts
    // Based on JAWS, NVDA, VoiceOver (Mac), and other global standards
    
    // Alt key navigation (Windows/Linux) OR Option key navigation (Mac)
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const key = event.key.toLowerCase();
      
      switch (key) {
        // WCAG Navigation shortcuts
        case 'arrowdown':
          if (!isEditing) {
            event.preventDefault();
            if (navigateToElement('button, a[href], input, select, textarea, [tabindex="0"], [role="button"]', 'next')) {
              announceNavigation('Next interactive element');
            }
          }
          break;
        case 'arrowup':
          if (!isEditing) {
            event.preventDefault();
            if (navigateToElement('button, a[href], input, select, textarea, [tabindex="0"], [role="button"]', 'previous')) {
              announceNavigation('Previous interactive element');
            }
          }
          break;
        case 'arrowright':
          if (!isEditing) {
            event.preventDefault();
            if (navigateByElementType('input')) {
              announceNavigation('Next form field');
            }
          }
          break;
        case 'arrowleft':
          if (!isEditing) {
            event.preventDefault();
            if (navigateToElement('input, select, textarea, [role="textbox"]', 'previous')) {
              announceNavigation('Previous form field');
            }
          }
          break;

        // Landmark navigation (Alt + Letter) - International standard
        case 'm':
          event.preventDefault();
          if (jumpToLandmark('main')) {
            announceNavigation('Main content landmark');
          } else {
            announceNavigation('Main content not found');
          }
          break;
        case 'n':
          event.preventDefault();
          if (jumpToLandmark('navigation')) {
            announceNavigation('Navigation landmark');
          } else {
            announceNavigation('Navigation not found');
          }
          break;
        case 'f':
          event.preventDefault();
          if (jumpToLandmark('contentinfo')) {
            announceNavigation('Footer landmark');
          } else {
            announceNavigation('Footer not found');
          }
          break;
        case 's':
          event.preventDefault();
          if (jumpToLandmark('search')) {
            announceNavigation('Search landmark');
          } else {
            announceNavigation('Search not found');
          }
          break;
        case 'r':
          event.preventDefault();
          if (jumpToLandmark('form')) {
            announceNavigation('Form landmark');
          } else {
            announceNavigation('Form not found');
          }
          break;

        // Element type navigation
        case 'h':
          event.preventDefault();
          if (navigateByElementType('heading')) {
            announceNavigation('Next heading');
          } else {
            announceNavigation('No headings found');
          }
          break;
        case 'b':
          event.preventDefault();
          if (navigateByElementType('button')) {
            announceNavigation('Next button');
          } else {
            announceNavigation('No buttons found');
          }
          break;
        case 'l':
          event.preventDefault();
          if (navigateByElementType('link')) {
            announceNavigation('Next link');
          } else {
            announceNavigation('No links found');
          }
          break;
        case 'i':
          event.preventDefault();
          if (navigateByElementType('input')) {
            announceNavigation('Next input field');
          } else {
            announceNavigation('No input fields found');
          }
          break;
        case 'c':
          event.preventDefault();
          if (navigateByElementType('checkbox')) {
            announceNavigation('Next checkbox');
          } else {
            announceNavigation('No checkboxes found');
          }
          break;
        case 'o':
          event.preventDefault();
          if (navigateByElementType('combobox')) {
            announceNavigation('Next dropdown menu');
          } else {
            announceNavigation('No dropdown menus found');
          }
          break;
        case 't':
          event.preventDefault();
          if (navigateByElementType('table')) {
            announceNavigation('Next table');
          } else {
            announceNavigation('No tables found');
          }
          break;

        // Heading levels (Alt + 1-6)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          event.preventDefault();
          if (navigateToElement(`h${key}`, 'next')) {
            announceNavigation(`Next heading level ${key}`);
          } else {
            announceNavigation(`No level ${key} headings found`);
          }
          break;
      }
    }

    // Additional shortcuts with Ctrl+Alt (Windows/Linux) or Cmd+Option (Mac)
    if ((event.ctrlKey && event.altKey && !isMac) || (event.metaKey && event.altKey && isMac)) {
      switch (event.key.toLowerCase()) {
        case 'h':
          event.preventDefault();
          // Show keyboard help
          const helpButton = document.querySelector('[data-testid*="help"], [aria-label*="help"]') as HTMLElement;
          if (helpButton) {
            helpButton.click();
            announceNavigation('Keyboard help opened');
          } else {
            announceNavigation('Help not available');
          }
          break;
        case 's':
          event.preventDefault();
          // Jump to submit/save button
          if (navigateToElement('[type="submit"], [data-testid*="submit"], [data-testid*="save"]', 'next')) {
            announceNavigation('Submit button');
          } else {
            announceNavigation('Submit button not found');
          }
          break;
        case 'e':
          event.preventDefault();
          // Jump to first error or validation message
          if (navigateToElement('[role="alert"], .error, [aria-invalid="true"]', 'next')) {
            announceNavigation('Error message');
          } else {
            announceNavigation('No errors found');
          }
          break;
      }
    }

    // Quick escape actions
    if (event.key === 'Escape') {
      // Close modal or return to main content
      const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])') as HTMLElement;
      if (modal) {
        const closeButton = modal.querySelector('[aria-label*="close"], [data-testid*="close"], button[aria-label*="Close"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
          announceNavigation('Dialog closed');
        }
      } else if (jumpToLandmark('main')) {
        announceNavigation('Returned to main content');
      }
    }

  }, [navigateToElement, announceNavigation, jumpToLandmark, navigateByElementType]);

  useEffect(() => {
    // Initialize the live region
    announceNavigation('International keyboard navigation enabled');
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown, announceNavigation]);

  return {
    navigateToElement,
    announceNavigation,
    jumpToLandmark,
    navigateByElementType
  };
};