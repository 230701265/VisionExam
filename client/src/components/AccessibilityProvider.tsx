import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useInternationalKeyboardNavigation } from '@/hooks/useInternationalKeyboardNavigation';

export interface AccessibilitySettings {
  // Display & Visual
  fontSize: number;
  contrastMode: 'normal' | 'high' | 'dark';
  colorTheme: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
  lineHeight: number;
  letterSpacing: number;
  fontFamily: 'default' | 'dyslexia' | 'serif' | 'mono';
  cursorSize: 'normal' | 'large' | 'extra-large';
  focusIndicatorStyle: 'default' | 'thick' | 'colored' | 'animated';
  
  // Motion & Animation
  reducedMotion: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'off';
  parallaxEffects: boolean;
  autoplayMedia: boolean;
  
  // Audio & Speech
  speechEnabled: boolean;
  speechRate: number;
  speechVolume: number;
  speechVoice: string;
  speechPitch: number;
  audioInstructions: boolean;
  soundEffects: boolean;
  audioDescriptions: boolean;
  
  // Navigation & Interaction
  keyboardNavigation: 'standard' | 'enhanced' | 'custom';
  tabOrder: 'default' | 'logical' | 'visual';
  skipLinksVisible: boolean;
  stickyFocus: boolean;
  clickDelay: number;
  
  // Screen Reader & Assistive Tech
  verboseMode: boolean;
  announceChanges: boolean;
  structuralNavigation: boolean;
  landmarkNavigation: boolean;
  
  // Content & Reading
  readingMode: boolean;
  textJustification: 'left' | 'center' | 'justify';
  paragraphSpacing: number;
  highlightLinks: boolean;
  showTooltips: boolean;
  
  // Timing & Timeouts
  extendedTimeouts: boolean;
  timeoutWarnings: boolean;
  pauseAnimations: boolean;
  
  // Language & Localization
  language: string;
  dateFormat: 'iso' | 'us' | 'eu' | 'local';
  numberFormat: 'default' | 'simplified';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  speechSupported: boolean;
  isLoading: boolean;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsString: string) => boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  // Initialize international keyboard navigation
  const keyboardNav = useInternationalKeyboardNavigation();
  
  const getDefaultSettings = (): AccessibilitySettings => ({
    // Display & Visual
    fontSize: 18,
    contrastMode: 'normal',
    colorTheme: 'default',
    lineHeight: 1.6,
    letterSpacing: 0,
    fontFamily: 'default',
    cursorSize: 'normal',
    focusIndicatorStyle: 'default',
    
    // Motion & Animation
    reducedMotion: false,
    animationSpeed: 'normal',
    parallaxEffects: true,
    autoplayMedia: true,
    
    // Audio & Speech
    speechEnabled: false,
    speechRate: 10, // 0.5 to 2.0, stored as 5-20
    speechVolume: 80,
    speechVoice: '',
    speechPitch: 10,
    audioInstructions: true,
    soundEffects: true,
    audioDescriptions: false,
    
    // Navigation & Interaction
    keyboardNavigation: 'enhanced',
    tabOrder: 'logical',
    skipLinksVisible: true,
    stickyFocus: false,
    clickDelay: 0,
    
    // Screen Reader & Assistive Tech
    verboseMode: false,
    announceChanges: true,
    structuralNavigation: true,
    landmarkNavigation: true,
    
    // Content & Reading
    readingMode: false,
    textJustification: 'left',
    paragraphSpacing: 1,
    highlightLinks: true,
    showTooltips: true,
    
    // Timing & Timeouts
    extendedTimeouts: false,
    timeoutWarnings: true,
    pauseAnimations: false,
    
    // Language & Localization
    language: 'en-US',
    dateFormat: 'local',
    numberFormat: 'default'
  });

  const [settings, setSettings] = useState<AccessibilitySettings>(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(false);

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
    
    // Apply line height
    root.style.setProperty('--line-height', newSettings.lineHeight.toString());
    
    // Apply letter spacing
    root.style.setProperty('--letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply contrast mode
    root.classList.remove('high-contrast', 'dark-mode');
    if (newSettings.contrastMode === 'high') {
      root.classList.add('high-contrast');
    } else if (newSettings.contrastMode === 'dark') {
      root.classList.add('dark-mode');
    }
    
    // Apply color theme for colorblind users
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'monochrome');
    if (newSettings.colorTheme !== 'default') {
      root.classList.add(newSettings.colorTheme);
    }
    
    // Apply font family
    root.classList.remove('font-dyslexia', 'font-serif', 'font-mono');
    if (newSettings.fontFamily !== 'default') {
      root.classList.add(`font-${newSettings.fontFamily}`);
    }
    
    // Apply cursor size
    root.classList.remove('cursor-large', 'cursor-extra-large');
    if (newSettings.cursorSize !== 'normal') {
      root.classList.add(`cursor-${newSettings.cursorSize}`);
    }
    
    // Apply focus indicator style
    root.classList.remove('focus-thick', 'focus-colored', 'focus-animated');
    if (newSettings.focusIndicatorStyle !== 'default') {
      root.classList.add(`focus-${newSettings.focusIndicatorStyle}`);
    }
    
    // Apply motion settings
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply animation speed
    root.classList.remove('animation-slow', 'animation-fast', 'animation-off');
    if (newSettings.animationSpeed !== 'normal') {
      root.classList.add(`animation-${newSettings.animationSpeed}`);
    }
    
    // Apply reading mode
    if (newSettings.readingMode) {
      root.classList.add('reading-mode');
    } else {
      root.classList.remove('reading-mode');
    }
    
    // Apply text justification
    root.style.setProperty('--text-align', newSettings.textJustification);
    
    // Apply paragraph spacing
    root.style.setProperty('--paragraph-spacing', `${newSettings.paragraphSpacing}rem`);
  };

  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      applyAccessibilitySettings(updatedSettings);
      
      // Save to localStorage
      localStorage.setItem('opsis-accessibility-settings', JSON.stringify(updatedSettings));
      
      // Announce major changes
      if (newSettings.contrastMode && newSettings.contrastMode !== settings.contrastMode) {
        announceToScreenReader(`Contrast mode changed to ${newSettings.contrastMode}`);
      }
      if (newSettings.fontSize && newSettings.fontSize !== settings.fontSize) {
        announceToScreenReader(`Font size changed to ${newSettings.fontSize} pixels`);
      }
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };
  
  const resetToDefaults = () => {
    const defaultSettings = getDefaultSettings();
    setSettings(defaultSettings);
    applyAccessibilitySettings(defaultSettings);
    localStorage.removeItem('opsis-accessibility-settings');
    announceToScreenReader('Settings reset to defaults');
  };
  
  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };
  
  const importSettings = (settingsString: string) => {
    try {
      const importedSettings = JSON.parse(settingsString);
      const validatedSettings = { ...getDefaultSettings(), ...importedSettings };
      setSettings(validatedSettings);
      applyAccessibilitySettings(validatedSettings);
      localStorage.setItem('opsis-accessibility-settings', JSON.stringify(validatedSettings));
      announceToScreenReader('Settings imported successfully');
      return true;
    } catch (error) {
      announceToScreenReader('Failed to import settings. Invalid format.');
      return false;
    }
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('opsis-accessibility-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const mergedSettings = { ...getDefaultSettings(), ...parsedSettings };
        setSettings(mergedSettings);
        applyAccessibilitySettings(mergedSettings);
      } catch (error) {
        console.warn('Failed to load accessibility settings from localStorage');
      }
    }
  }, []);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    speak,
    stopSpeaking,
    isSpeaking,
    speechSupported,
    isLoading,
    resetToDefaults,
    exportSettings,
    importSettings
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