import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { UserSettings } from '@shared/schema';

const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'userId'> = {
  fontSize: 18,
  contrastMode: 'normal',
  speechRate: 10,
  speechVolume: 80,
  audioInstructions: true,
  soundEffects: true,
  reducedMotion: false,
};

export function useAccessibilitySettings(userId: string | null) {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings', userId],
    enabled: !!userId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      if (!userId) throw new Error('User ID required');
      
      const response = await apiRequest('PUT', `/api/settings/${userId}`, newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
    },
  });

  const currentSettings = settings || { ...DEFAULT_SETTINGS, userId: userId || '', id: '' };

  // Apply settings to document
  useEffect(() => {
    if (!settings && !isLoading) return;

    const root = document.documentElement;
    
    // Apply font size
    root.style.fontSize = `${currentSettings.fontSize}px`;
    
    // Apply contrast mode
    root.classList.remove('high-contrast', 'dark');
    if (currentSettings.contrastMode === 'high') {
      root.classList.add('high-contrast');
    } else if (currentSettings.contrastMode === 'dark') {
      root.classList.add('dark');
    }
    
    // Apply reduced motion
    if (currentSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
  }, [currentSettings, isLoading, settings]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    updateSettingsMutation.mutate(newSettings);
  }, [updateSettingsMutation]);

  const getSpeechRate = useCallback(() => {
    return currentSettings.speechRate / 10; // Convert from 5-20 to 0.5-2.0
  }, [currentSettings.speechRate]);

  const getSpeechVolume = useCallback(() => {
    return currentSettings.speechVolume / 100; // Convert from 0-100 to 0-1
  }, [currentSettings.speechVolume]);

  const playNotificationSound = useCallback(() => {
    if (!currentSettings.soundEffects) return;
    
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Fallback for browsers that don't support Web Audio API
      console.log('Sound notification');
    }
  }, [currentSettings.soundEffects]);

  return {
    settings: currentSettings,
    updateSettings,
    isLoading: isLoading || updateSettingsMutation.isPending,
    getSpeechRate,
    getSpeechVolume,
    playNotificationSound,
  };
}
