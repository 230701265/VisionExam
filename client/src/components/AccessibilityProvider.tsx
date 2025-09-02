import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useInternationalKeyboardNavigation } from '@/hooks/useInternationalKeyboardNavigation';

export interface AccessibilitySettings {
  fontSize: number;
  contrastMode: 'normal' | 'high' | 'dark';
  speechRate: number;
  speechVolume: number;
  audioInstructions: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
  speechEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  speechSupported: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  // Initialize international keyboard navigation
  const keyboardNav = useInternationalKeyboardNavigation();
  
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 18,
    contrastMode: 'normal',
    speechRate: 10, // 0.5 to 2.0, stored as 5-20
    speechVolume: 80,
    audioInstructions: true,
    soundEffects: true,
    reducedMotion: false,
    speechEnabled: false
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [ariaLiveRegion, setAriaLiveRegion] = useState<HTMLElement | null>(null);

  // Initialize speech synthesis and ARIA live region
  useEffect(() => {
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
      setSpeechSupported(true);
      setSettings(prev => ({ ...prev, speechEnabled: true }));
    }

    // Create ARIA live region for screen reader announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
    setAriaLiveRegion(liveRegion);

    // Apply initial settings to document
    applyAccessibilitySettings(settings);

    return () => {
      if (liveRegion && document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    };
  }, []);

  // Apply settings to the document
  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.fontSize = `${newSettings.fontSize}px`;
    
    // Apply contrast mode
    root.classList.remove('high-contrast', 'dark-mode');
    if (newSettings.contrastMode === 'high') {
      root.classList.add('high-contrast');
    } else if (newSettings.contrastMode === 'dark') {
      root.classList.add('dark-mode');
    }
    
    // Apply reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    applyAccessibilitySettings(updatedSettings);
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (ariaLiveRegion) {
      ariaLiveRegion.setAttribute('aria-live', priority);
      ariaLiveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (ariaLiveRegion) {
          ariaLiveRegion.textContent = '';
        }
      }, 1000);
    }

    // Also speak if TTS is enabled and available
    if (settings.audioInstructions && speechSupported) {
      speak(message);
    }
  };

  const speak = (text: string) => {
    if (!speechSynthesis || !settings.speechEnabled || !settings.audioInstructions) {
      return;
    }

    // Cancel any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate / 10; // Convert 5-20 to 0.5-2.0
    utterance.volume = settings.speechVolume / 100; // Convert 0-100 to 0-1.0
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    speak,
    stopSpeaking,
    isSpeaking,
    speechSupported
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Accessibility Instructions */}
      <div className="sr-only">
        <h1>OPSIS Coding Exam Platform - Accessibility Features</h1>
        <p>
          This platform supports comprehensive keyboard navigation and screen reader functionality.
          Use Alt+Up/Down arrows to navigate between sections.
          Press H key to access keyboard shortcuts help.
          Tab key navigates through interactive elements.
          All coding editors support standard VS Code keyboard shortcuts.
        </p>
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}