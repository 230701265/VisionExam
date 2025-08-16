import { createContext, useContext, useEffect, useState } from 'react';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface AccessibilityContextType {
  settings: any;
  updateSettings: (settings: any) => void;
  speak: (text: string) => void;
  announceToScreenReader: (message: string) => void;
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function AccessibilityProvider({ children, userId }: AccessibilityProviderProps) {
  const { settings, updateSettings, isLoading, getSpeechRate, getSpeechVolume } = useAccessibilitySettings(userId);
  const { speak } = useTextToSpeech({
    rate: getSpeechRate(),
    volume: getSpeechVolume(),
  });

  const announceToScreenReader = (message: string) => {
    const announcer = document.getElementById('announcements');
    if (announcer) {
      announcer.textContent = message;
    }
    
    // Also speak if audio instructions are enabled
    if (settings.audioInstructions) {
      speak(message);
    }
  };

  // Initialize accessibility announcements on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      announceToScreenReader('AccessExam loaded. Press Alt + H for help, Alt + R to read page content.');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const value = {
    settings,
    updateSettings,
    speak,
    announceToScreenReader,
    isLoading,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div id="announcements" aria-live="polite" aria-atomic="true" className="sr-only" />
      {children}
    </AccessibilityContext.Provider>
  );
}
