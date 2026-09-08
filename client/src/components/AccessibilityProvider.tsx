import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useInternationalKeyboardNavigation } from '@/hooks/useInternationalKeyboardNavigation';
import { VoiceNarrator, type NarratorOptions } from '@/voice/narrator';
import type { VoiceMode } from '@/voice/types';

export interface AccessibilitySettings {
  fontSize: number;
  contrastMode: 'normal' | 'high' | 'dark';
  colorTheme: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
  lineHeight: number;
  letterSpacing: number;
  fontFamily: 'default' | 'dyslexia' | 'serif' | 'mono';
  cursorSize: 'normal' | 'large' | 'extra-large';
  focusIndicatorStyle: 'default' | 'thick' | 'colored' | 'animated';
  reducedMotion: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'off';
  parallaxEffects: boolean;
  autoplayMedia: boolean;
  speechEnabled: boolean;
  speechRate: number;
  speechVolume: number;
  speechVoice: string;
  speechPitch: number;
  audioInstructions: boolean;
  soundEffects: boolean;
  audioDescriptions: boolean;
  keyboardNavigation: 'standard' | 'enhanced' | 'custom';
  tabOrder: 'default' | 'logical' | 'visual';
  skipLinksVisible: boolean;
  stickyFocus: boolean;
  clickDelay: number;
  verboseMode: boolean;
  announceChanges: boolean;
  structuralNavigation: boolean;
  landmarkNavigation: boolean;
  readingMode: boolean;
  textJustification: 'left' | 'center' | 'justify';
  paragraphSpacing: number;
  highlightLinks: boolean;
  showTooltips: boolean;
  extendedTimeouts: boolean;
  timeoutWarnings: boolean;
  pauseAnimations: boolean;
  language: string;
  dateFormat: 'iso' | 'us' | 'eu' | 'local';
  numberFormat: 'default' | 'simplified';
  /* New settings */
  readingMask: boolean;
  readingMaskHeight: number;
  readingGuide: boolean;
  liveCaptions: boolean;
  voiceNavigation: boolean;
  voiceMode: VoiceMode;
  screenReaderMode: boolean;
  wordSpacing: number;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  speak: (text: string, options?: NarratorOptions) => void;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  isSpeaking: boolean;
  speechSupported: boolean;
  isLoading: boolean;
  currentCaption: string;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsString: string) => boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/* ── Reading Mask overlay ────────────────────────────────── */
function ReadingMask({ height }: { height: number }) {
  const [maskY, setMaskY] = useState(300);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => setMaskY(e.clientY);
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const band = Math.max(20, height);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        background: `linear-gradient(
          to bottom,
          rgba(0,0,0,0.45) 0px,
          rgba(0,0,0,0.45) ${Math.max(0, maskY - band)}px,
          transparent ${Math.max(0, maskY - band)}px,
          transparent ${maskY + band}px,
          rgba(0,0,0,0.45) ${maskY + band}px,
          rgba(0,0,0,0.45) 100%
        )`,
      }}
    />
  );
}

/* ── Live Captions bar ───────────────────────────────────── */
function LiveCaptionsBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Live captions"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9997,
        background: 'rgba(0,0,0,0.87)',
        color: '#fff',
        fontSize: '1.1rem',
        lineHeight: 1.5,
        padding: '12px 24px',
        textAlign: 'center',
        borderTop: '3px solid hsl(221 83% 53%)',
        letterSpacing: '0.01em',
      }}
    >
      {text}
    </div>
  );
}

/* ── Reading Guide line ──────────────────────────────────── */
function ReadingGuideLine() {
  const [guideY, setGuideY] = useState(-100);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => setGuideY(e.clientY);
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: guideY,
        height: 2,
        background: 'hsl(221 83% 53% / 0.5)',
        pointerEvents: 'none',
        zIndex: 9996,
        transition: 'top 0.05s linear',
      }}
    />
  );
}

/* ── Provider ────────────────────────────────────────────── */
export function AccessibilityProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  useInternationalKeyboardNavigation();

  const getDefaultSettings = (): AccessibilitySettings => ({
    fontSize: 16,
    contrastMode: 'normal',
    colorTheme: 'default',
    lineHeight: 1.6,
    letterSpacing: 0,
    wordSpacing: 0,
    fontFamily: 'default',
    cursorSize: 'normal',
    focusIndicatorStyle: 'default',
    reducedMotion: false,
    animationSpeed: 'normal',
    parallaxEffects: true,
    autoplayMedia: true,
    speechEnabled: false,
    speechRate: 10,
    speechVolume: 80,
    speechVoice: '',
    speechPitch: 10,
    audioInstructions: true,
    soundEffects: true,
    audioDescriptions: false,
    keyboardNavigation: 'enhanced',
    tabOrder: 'logical',
    skipLinksVisible: true,
    stickyFocus: false,
    clickDelay: 0,
    verboseMode: false,
    announceChanges: true,
    structuralNavigation: true,
    landmarkNavigation: true,
    readingMode: false,
    textJustification: 'left',
    paragraphSpacing: 1,
    highlightLinks: true,
    showTooltips: true,
    extendedTimeouts: false,
    timeoutWarnings: true,
    pauseAnimations: false,
    language: 'en-US',
    dateFormat: 'local',
    numberFormat: 'default',
    readingMask: false,
    readingMaskHeight: 40,
    readingGuide: false,
    liveCaptions: false,
    voiceNavigation: true,
    voiceMode: 'push-to-talk',
    screenReaderMode: false,
  });

  const [settings, setSettings] = useState<AccessibilitySettings>(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthesisObj, setSpeechSynthesisObj] = useState<SpeechSynthesis | null>(null);
  const [ariaLiveRegion, setAriaLiveRegion] = useState<HTMLElement | null>(null);
  const [currentCaption, setCurrentCaption] = useState('');
  const narratorRef = useRef<VoiceNarrator | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesisObj(window.speechSynthesis);
      setSpeechSupported(true);
      setSettings(prev => ({ ...prev, speechEnabled: true }));
    }

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(liveRegion);
    setAriaLiveRegion(liveRegion);

    const savedSettings = localStorage.getItem('opsis-accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const merged = { ...getDefaultSettings(), ...parsed };
        setSettings(merged);
        applyAccessibilitySettings(merged);
      } catch {
        /* ignore */
      }
    } else {
      applyAccessibilitySettings(getDefaultSettings());
    }

    if (userId) {
      fetch(`/api/settings/${userId}`)
        .then(response => response.ok ? response.json() : null)
        .then(remote => {
          if (!remote) return;
          setSettings(previous => {
            const merged: AccessibilitySettings = {
              ...previous,
              fontSize: remote.fontSize ?? previous.fontSize,
              contrastMode: remote.contrastMode ?? previous.contrastMode,
              speechRate: remote.speechRate ?? previous.speechRate,
              speechVolume: remote.speechVolume ?? previous.speechVolume,
              speechPitch: remote.speechPitch ?? previous.speechPitch,
              speechVoice: remote.speechVoice ?? previous.speechVoice,
              voiceMode: remote.voiceMode ?? previous.voiceMode,
              voiceNavigation: (remote.voiceMode ?? previous.voiceMode) !== 'off',
              audioInstructions: remote.audioInstructions ?? previous.audioInstructions,
              soundEffects: remote.soundEffects ?? previous.soundEffects,
              reducedMotion: remote.reducedMotion ?? previous.reducedMotion,
            };
            applyAccessibilitySettings(merged);
            localStorage.setItem('opsis-accessibility-settings', JSON.stringify(merged));
            return merged;
          });
        })
        .catch(() => {
          // Local settings remain fully functional when the server is unavailable.
        });
    }

    return () => {
      if (liveRegion && document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    };
  }, [userId]);

  useEffect(() => {
    narratorRef.current = new VoiceNarrator(speechSynthesisObj, (speaking, text) => {
      setIsSpeaking(speaking);
      if (speaking && text) setCurrentCaption(text);
      if (!speaking) setCurrentCaption('');
    });
    return () => narratorRef.current?.cancel();
  }, [speechSynthesisObj]);

  const applyAccessibilitySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement;

    root.style.fontSize = `${s.fontSize}px`;
    root.style.setProperty('--line-height', s.lineHeight.toString());
    root.style.setProperty('--letter-spacing', `${s.letterSpacing}px`);
    root.style.setProperty('--word-spacing', `${s.wordSpacing}px`);
    root.style.setProperty('--text-align', s.textJustification);
    root.style.setProperty('--paragraph-spacing', `${s.paragraphSpacing}rem`);

    root.classList.remove('high-contrast', 'dark');
    if (s.contrastMode === 'high') root.classList.add('high-contrast');
    else if (s.contrastMode === 'dark') root.classList.add('dark');

    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'monochrome');
    if (s.colorTheme !== 'default') root.classList.add(s.colorTheme);

    root.classList.remove('font-dyslexia', 'font-serif', 'font-mono');
    if (s.fontFamily !== 'default') root.classList.add(`font-${s.fontFamily}`);

    root.classList.remove('cursor-large', 'cursor-extra-large');
    if (s.cursorSize !== 'normal') root.classList.add(`cursor-${s.cursorSize}`);

    root.classList.remove('focus-thick', 'focus-colored', 'focus-animated');
    if (s.focusIndicatorStyle !== 'default') root.classList.add(`focus-${s.focusIndicatorStyle}`);

    root.classList.toggle('reduce-motion', s.reducedMotion);
    root.classList.remove('animation-slow', 'animation-fast', 'animation-off');
    if (s.animationSpeed !== 'normal') root.classList.add(`animation-${s.animationSpeed}`);

    root.classList.toggle('reading-mode', s.readingMode);
    root.classList.toggle('screen-reader-mode', s.screenReaderMode);
  };

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (ariaLiveRegion) {
      ariaLiveRegion.setAttribute('aria-live', priority);
      ariaLiveRegion.textContent = message;
      setTimeout(() => { if (ariaLiveRegion) ariaLiveRegion.textContent = ''; }, 1000);
    }
  }, [ariaLiveRegion]);

  const speak = useCallback((text: string, options: NarratorOptions = {}) => {
    narratorRef.current?.speak(text, {
      ...options,
      rate: options.rate ?? settings.speechRate / 10,
      volume: options.volume ?? settings.speechVolume / 100,
      pitch: options.pitch ?? settings.speechPitch / 10,
      voiceName: options.voiceName ?? settings.speechVoice,
      priority: options.priority ?? 'queue',
    });
  }, [settings.speechPitch, settings.speechRate, settings.speechVolume, settings.speechVoice]);

  useEffect(() => {
    const handleNarrationRequest = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (message) speak(message, { priority: 'queue' });
    };
    document.addEventListener('opsis:narrate', handleNarrationRequest);
    return () => document.removeEventListener('opsis:narrate', handleNarrationRequest);
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    narratorRef.current?.cancel();
  }, []);

  const pauseSpeaking = useCallback(() => narratorRef.current?.pause(), []);
  const resumeSpeaking = useCallback(() => narratorRef.current?.resume(), []);

  const updateSettings = useCallback(async (newSettings: Partial<AccessibilitySettings>) => {
    setIsLoading(true);
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      applyAccessibilitySettings(updated);
      localStorage.setItem('opsis-accessibility-settings', JSON.stringify(updated));
      if (userId) {
        void fetch(`/api/settings/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fontSize: updated.fontSize,
            contrastMode: updated.contrastMode,
            speechRate: updated.speechRate,
            speechVolume: updated.speechVolume,
            speechPitch: updated.speechPitch,
            speechVoice: updated.speechVoice,
            voiceMode: updated.voiceMode,
            audioInstructions: updated.audioInstructions,
            soundEffects: updated.soundEffects,
            reducedMotion: updated.reducedMotion,
          }),
        });
      }
      if (newSettings.contrastMode && newSettings.contrastMode !== settings.contrastMode)
        announceToScreenReader(`Contrast mode: ${newSettings.contrastMode}`);
      if (newSettings.fontSize && newSettings.fontSize !== settings.fontSize)
        announceToScreenReader(`Font size: ${newSettings.fontSize}px`);
    } finally {
      setTimeout(() => setIsLoading(false), 250);
    }
  }, [settings, announceToScreenReader, userId]);

  const resetToDefaults = useCallback(() => {
    const d = getDefaultSettings();
    setSettings(d);
    applyAccessibilitySettings(d);
    localStorage.removeItem('opsis-accessibility-settings');
    announceToScreenReader('Accessibility settings reset to defaults.');
  }, [announceToScreenReader]);

  const exportSettings = useCallback(() => JSON.stringify(settings, null, 2), [settings]);

  const importSettings = useCallback((str: string) => {
    try {
      const imported = JSON.parse(str);
      const valid = { ...getDefaultSettings(), ...imported };
      setSettings(valid);
      applyAccessibilitySettings(valid);
      localStorage.setItem('opsis-accessibility-settings', JSON.stringify(valid));
      announceToScreenReader('Settings imported successfully.');
      return true;
    } catch {
      announceToScreenReader('Failed to import settings. Invalid format.');
      return false;
    }
  }, [announceToScreenReader]);

  return (
    <AccessibilityContext.Provider value={{
      settings, updateSettings, announceToScreenReader, speak, stopSpeaking, pauseSpeaking, resumeSpeaking,
      isSpeaking, speechSupported, isLoading, currentCaption,
      resetToDefaults, exportSettings, importSettings,
    }}>
      {children}
      {settings.readingMask && <ReadingMask height={settings.readingMaskHeight} />}
      {settings.readingGuide && <ReadingGuideLine />}
      {settings.liveCaptions && <LiveCaptionsBar text={currentCaption} />}
      <div className="sr-only" role="complementary" aria-label="Screen reader information">
        <p>OPSIS — Accessibility-first examination platform. WCAG 2.2 AA compliant.</p>
        <p>Use Alt+Up/Down to navigate sections. Tab for interactive elements. Alt+A for Accessibility Center.</p>
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
}
