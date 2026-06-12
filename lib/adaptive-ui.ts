export type BrainType = 'ADHD' | 'AUTISM' | 'DYSLEXIA' | 'ANXIETY' | 'NONE';
export type ColorScheme = 'CALM' | 'FOCUS' | 'ENERGIZE' | 'DARK';
export type FontSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
export type AnimationLevel = 'NONE' | 'MINIMAL' | 'MODERATE' | 'FULL';

export interface BrainProfile {
  primaryType: BrainType;
  secondaryType: BrainType | null;
  attentionSpan: number; // in minutes
  breakFrequency: number; // in minutes
  colorScheme: ColorScheme;
  fontSize: FontSize;
  animationLevel: AnimationLevel;
  highContrast: boolean;
  prefersVoiceInput: boolean;
  needsTextToSpeech: boolean;
}

export interface MoodEntry {
  mood: number; // 1-10
  energy: number; // 1-10
  focus: number; // 1-10
  anxiety: number; // 1-10
  notes?: string;
  createdAt: string;
}

export interface AdaptiveConfig {
  brainProfile: BrainProfile;
  currentMood?: MoodEntry | null;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  isSensoryModeActive?: boolean;
}

export interface AdaptiveStyles {
  fontSizeClass: string;
  lineHeightClass: string;
  letterSpacingClass: string;
  colorScheme: ColorScheme;
  contrastClass: string;
  animationLevel: AnimationLevel;
  spacingClass: string;
  buttonScaleClass: string;
  inputStyleClass: string;
  focusIndicators: boolean;
  progressVisibility: boolean;
  timeVisibility: boolean;
}

export function generateAdaptiveStyles(config: AdaptiveConfig): AdaptiveStyles {
  const { brainProfile, currentMood, isSensoryModeActive } = config;

  // 1. Sensory Mode overrides
  if (isSensoryModeActive) {
    return {
      fontSizeClass: 'text-lg md:text-xl',
      lineHeightClass: 'leading-relaxed',
      letterSpacingClass: 'tracking-wide',
      colorScheme: 'DARK', // Monochrome dark
      contrastClass: 'contrast-125 border-white border',
      animationLevel: 'NONE',
      spacingClass: 'space-y-6 p-8',
      buttonScaleClass: 'scale-100 py-3 px-6 text-lg',
      inputStyleClass: 'border-2 border-white',
      focusIndicators: true,
      progressVisibility: true,
      timeVisibility: false,
    };
  }

  // 2. Base profiles
  const profileType = brainProfile.primaryType;

  // Spacing Class
  let spacingClass = 'space-y-4 p-5';
  if (profileType === 'ADHD') {
    spacingClass = 'space-y-5 p-6'; // Slightly wider chunks
  } else if (profileType === 'AUTISM') {
    spacingClass = 'space-y-4 p-4'; // Uniform structure
  } else if (profileType === 'DYSLEXIA') {
    spacingClass = 'space-y-6 p-6'; // Highly breathable spacing
  } else if (profileType === 'ANXIETY') {
    spacingClass = 'space-y-4 p-5'; // Cozy and soft
  }

  // Color scheme adaptation based on mood
  let activeScheme = brainProfile.colorScheme;
  if (currentMood) {
    // If feeling highly anxious (anxiety > 7) or low energy (energy < 4), soothe with Calm scheme
    if (currentMood.anxiety > 7 || currentMood.energy < 4) {
      activeScheme = 'CALM';
    }
  }

  // Font Size
  let fontSizeClass = 'text-sm md:text-base';
  if (profileType === 'DYSLEXIA' || brainProfile.fontSize === 'LARGE') {
    fontSizeClass = 'text-base md:text-lg';
  } else if (brainProfile.fontSize === 'XLARGE') {
    fontSizeClass = 'text-lg md:text-xl';
  } else if (brainProfile.fontSize === 'SMALL') {
    fontSizeClass = 'text-xs md:text-sm';
  }

  // Line Height & Letter Spacing
  let lineHeightClass = 'leading-normal';
  let letterSpacingClass = 'tracking-normal';
  if (profileType === 'DYSLEXIA') {
    lineHeightClass = 'leading-loose'; // Large spacing to satisfy dyslexic visual guidelines
    letterSpacingClass = 'tracking-widest';
  } else if (profileType === 'AUTISM') {
    lineHeightClass = 'leading-relaxed';
    letterSpacingClass = 'tracking-normal';
  }

  // Dynamic Button Scale
  let buttonScaleClass = 'scale-100 hover:scale-[1.02] active:scale-95 transition-all duration-200';
  if (profileType === 'ADHD') {
    buttonScaleClass = 'scale-105 hover:scale-110 active:scale-95 text-base font-semibold transition-all shadow-md';
  } else if (profileType === 'AUTISM') {
    buttonScaleClass = 'scale-100 hover:bg-opacity-90 rounded-none cursor-pointer text-sm tracking-wide font-medium border border-current shadow-sm';
  } else if (profileType === 'ANXIETY') {
    buttonScaleClass = 'scale-100 active:scale-98 text-sm md:text-base bg-opacity-90 rounded-full transition-transform';
  }

  // Input styles
  let inputStyleClass = 'rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500';
  if (profileType === 'ADHD') {
    inputStyleClass = 'rounded-xl border-2 border-amber-400 focus:border-amber-500 shadow-sm';
  } else if (profileType === 'AUTISM') {
    inputStyleClass = 'rounded-none border-2 border-slate-700 bg-slate-50 focus:border-emerald-600 focus:ring-0';
  } else if (profileType === 'DYSLEXIA') {
    inputStyleClass = 'rounded-lg border-2 border-indigo-600 bg-indigo-50/30 dark:bg-slate-900 text-slate-900 dark:text-white tracking-widest leading-loose font-mono';
  }

  const animationLevel = profileType === 'AUTISM' ? 'NONE' : brainProfile.animationLevel;

  return {
    fontSizeClass,
    lineHeightClass,
    letterSpacingClass,
    colorScheme: activeScheme,
    contrastClass: brainProfile.highContrast ? 'contrast-125 font-bold' : 'contrast-100',
    animationLevel,
    spacingClass,
    buttonScaleClass,
    inputStyleClass,
    focusIndicators: profileType === 'ADHD',
    progressVisibility: true,
    timeVisibility: profileType !== 'ANXIETY', // Hide countdown timers for anxiety to curb stress response
  };
}

export function getDefaultBrainProfile(type: BrainType): BrainProfile {
  switch (type) {
    case 'ADHD':
      return {
        primaryType: 'ADHD',
        secondaryType: null,
        attentionSpan: 15, // Shorter focus window
        breakFrequency: 5,
        colorScheme: 'ENERGIZE', // Bright, warm tones
        fontSize: 'MEDIUM',
        animationLevel: 'MODERATE',
        highContrast: false,
        prefersVoiceInput: false,
        needsTextToSpeech: false,
      };
    case 'AUTISM':
      return {
        primaryType: 'AUTISM',
        secondaryType: null,
        attentionSpan: 45, // Deeper block concentration
        breakFrequency: 10,
        colorScheme: 'CALM', // Soft, natural blues/greens
        fontSize: 'MEDIUM',
        animationLevel: 'NONE', // No animations
        highContrast: false,
        prefersVoiceInput: false,
        needsTextToSpeech: false,
      };
    case 'DYSLEXIA':
      return {
        primaryType: 'DYSLEXIA',
        secondaryType: null,
        attentionSpan: 25,
        breakFrequency: 5,
        colorScheme: 'FOCUS', // Clean high contrast
        fontSize: 'LARGE', // Magnified text size
        animationLevel: 'MINIMAL',
        highContrast: true,
        prefersVoiceInput: true,
        needsTextToSpeech: true,
      };
    case 'ANXIETY':
      return {
        primaryType: 'ANXIETY',
        secondaryType: null,
        attentionSpan: 20, // Low pressure intervals
        breakFrequency: 5,
        colorScheme: 'CALM', // Soft lilac and warm pastel tones
        fontSize: 'MEDIUM',
        animationLevel: 'MINIMAL',
        highContrast: false,
        prefersVoiceInput: false,
        needsTextToSpeech: false,
      };
    default:
      return {
        primaryType: 'NONE',
        secondaryType: null,
        attentionSpan: 25,
        breakFrequency: 5,
        colorScheme: 'CALM',
        fontSize: 'MEDIUM',
        animationLevel: 'MINIMAL',
        highContrast: false,
        prefersVoiceInput: false,
        needsTextToSpeech: false,
      };
  }
}
