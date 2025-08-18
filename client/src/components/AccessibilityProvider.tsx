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
      // Auto-read welcome message for blind students
      const welcomeMessage = `Welcome to OPSIS - the accessible examination platform designed for blind students. 
        This application provides complete keyboard navigation without needing a mouse or scrolling. 
        Use Alt + Down and Up arrows to navigate through all elements on any page. 
        Use Tab for standard navigation, or Alt + M to jump to main content, Alt + B for buttons, Alt + L for links.
        Press Alt + H anytime for complete keyboard help, or click the Keyboard Help button in the bottom right.
        Alt + R reads content aloud, Alt + N and P navigate questions during exams.
        Students login with roll number, teachers with username.`;
      
      announceToScreenReader(welcomeMessage);
      speak(welcomeMessage);
    }, 1500);

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
