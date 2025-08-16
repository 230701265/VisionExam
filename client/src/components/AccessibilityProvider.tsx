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
      const welcomeMessage = `Welcome to AccessExam - the accessible examination platform designed for blind students. 
        This application automatically reads content and provides full keyboard navigation support. 
        You can navigate using Tab key, activate buttons with Enter or Space, and use keyboard shortcuts for quick actions.
        Press Alt + H anytime for help, Alt + R to read page content, Alt + N for next question, Alt + P for previous question.
        Students should login using their roll number. Teachers can login with their username to create and manage exams.`;
      
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
