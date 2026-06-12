'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  BrainProfile,
  MoodEntry,
  AdaptiveStyles,
  generateAdaptiveStyles,
  getDefaultBrainProfile,
} from '@/lib/adaptive-ui';

interface AdaptiveContextType {
  brainProfile: BrainProfile;
  setBrainProfile: (profile: BrainProfile) => void;
  currentMood: MoodEntry | null;
  setCurrentMood: (mood: MoodEntry | null) => void;
  isSensoryModeActive: boolean;
  setIsSensoryModeActive: (active: boolean) => void;
  styles: AdaptiveStyles;
  isReady: boolean;
}

const AdaptiveContext = createContext<AdaptiveContextType | undefined>(undefined);

export function AdaptiveProvider({ children }: { children: React.ReactNode }) {
  const [brainProfile, setBrainProfileState] = useState<BrainProfile>(() => getDefaultBrainProfile('NONE'));
  const [currentMood, setCurrentMoodState] = useState<MoodEntry | null>(null);
  const [isSensoryModeActive, setIsSensoryModeActiveState] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Safely mount and load settings from localStorage to prevent hydration mismatch
  useEffect(() => {
    setTimeout(() => {
      try {
        const storedProfile = localStorage.getItem('focusflow_profile');
        const storedMood = localStorage.getItem('focusflow_mood');
        const storedSensory = localStorage.getItem('focusflow_sensory');

        if (storedProfile) {
          setBrainProfileState(JSON.parse(storedProfile));
        } else {
          // Default to a default non-setup state, which directs to onboarding
          setBrainProfileState(getDefaultBrainProfile('NONE'));
        }

        if (storedMood) {
          setCurrentMoodState(JSON.parse(storedMood));
        }

        if (storedSensory) {
          setIsSensoryModeActiveState(JSON.parse(storedSensory));
        }
      } catch (e) {
        console.error('Failed to load FocusFlow states:', e);
      } finally {
        setIsReady(true);
      }
    }, 0);
  }, []);

  const setBrainProfile = (profile: BrainProfile) => {
    setBrainProfileState(profile);
    try {
      localStorage.setItem('focusflow_profile', JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  };

  const setCurrentMood = (mood: MoodEntry | null) => {
    setCurrentMoodState(mood);
    try {
      if (mood) {
        localStorage.setItem('focusflow_mood', JSON.stringify(mood));
      } else {
        localStorage.removeItem('focusflow_mood');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setIsSensoryModeActive = (active: boolean) => {
    setIsSensoryModeActiveState(active);
    try {
      localStorage.setItem('focusflow_sensory', JSON.stringify(active));
    } catch (e) {
      console.error(e);
    }
  };

  const styles = useMemo(() => {
    return generateAdaptiveStyles({
      brainProfile,
      currentMood,
      isSensoryModeActive,
    });
  }, [brainProfile, currentMood, isSensoryModeActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (styles.colorScheme === 'DARK') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [styles.colorScheme]);

  const value = useMemo(() => ({
    brainProfile,
    setBrainProfile,
    currentMood,
    setCurrentMood,
    isSensoryModeActive,
    setIsSensoryModeActive,
    styles,
    isReady,
  }), [brainProfile, currentMood, isSensoryModeActive, styles, isReady]);

  return (
    <AdaptiveContext.Provider value={value}>
      <div
        className={`min-h-screen transition-colors duration-500 ${
          styles.colorScheme === 'DARK'
            ? 'dark bg-slate-950 text-slate-100'
            : styles.colorScheme === 'CALM'
            ? 'bg-emerald-50 text-emerald-950'
            : styles.colorScheme === 'ENERGIZE'
            ? 'bg-amber-50 text-amber-950'
            : 'bg-slate-50 text-slate-900' // FOCUS/DEFAULT
        }`}
        style={{
          fontFamily: brainProfile.primaryType === 'DYSLEXIA' ? 'var(--font-sans), system-ui' : 'var(--font-sans), system-ui',
          letterSpacing: brainProfile.primaryType === 'DYSLEXIA' ? '0.08em' : 'normal',
        }}
      >
        {children}
      </div>
    </AdaptiveContext.Provider>
  );
}

export function useAdaptive() {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used within an AdaptiveProvider');
  }
  return context;
}
