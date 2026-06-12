'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdaptive, AdaptiveProvider } from '@/components/providers/AdaptiveProvider';
import {
  BrainType,
  ColorScheme,
  FontSize,
  BrainProfile,
  MoodEntry,
  getDefaultBrainProfile
} from '@/lib/adaptive-ui';
import {
  Sparkles,
  Zap,
  Target,
  Palette,
  Headphones,
  Clock,
  Coffee,
  Smile,
  Shield,
  Sliders,
  RotateCcw,
  Trash2,
  Heart,
  Activity,
  Award,
  EyeOff,
  UserCheck,
  Check,
  Lightbulb,
  BookOpen,
  Flame,
  Music,
  Ear,
  Volume2,
  VolumeX,
  Play,
  Square,
  FileText,
  StickyNote,
  HelpCircle,
  Send,
  TrendingUp,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskStep {
  step: string;
  time: number;
  tip: string;
  reward: string;
  completed?: boolean;
}

interface FocusTask {
  id: string;
  title: string;
  description: string;
  complexity: number;
  steps: TaskStep[];
  completed: boolean;
  createdAt: string;
}

function AppLayout() {
  const {
    brainProfile,
    setBrainProfile,
    currentMood,
    setCurrentMood,
    isSensoryModeActive,
    setIsSensoryModeActive,
    styles,
    isReady
  } = useAdaptive();

  // Active Tab View: 'dashboard', 'tasks', 'focus', 'doubling', 'stats', 'guardian', 'settings', 'onboarding'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // local form states
  const [taskInput, setTaskInput] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [complexity, setComplexity] = useState(5);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // memory database state
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<FocusTask | null>(null);

  // Mood selector values
  const [moodRating, setMoodRating] = useState(5);
  const [energyRating, setEnergyRating] = useState(5);
  const [focusRating, setFocusRating] = useState(5);
  const [anxietyRating, setAnxietyRating] = useState(5);
  const [moodNotes, setMoodNotes] = useState('');
  const [recordedMoods, setRecordedMoods] = useState<MoodEntry[]>([]);

  // Focus Timer States
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [sessionsCompletedCount, setSessionsCompletedCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(3);

  // Simulated study rooms state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [buddyMessages, setBuddyMessages] = useState<string[]>([
    "Keep pushing, you're doing great!",
    "Just finished step 1. Writing feels easier today.",
    "Remember to breathe and stretch!"
  ]);
  const [guardianMessage, setGuardianMessage] = useState<string>(
    "We are so proud of your steady steps today! Have a great study streak."
  );
  const [guardianDraft, setGuardianDraft] = useState<string>("");

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  // New Portfolio Additions: Tokens, Voice, Pro-active Coaching, reflection Report
  const [focusCoins, setFocusCoins] = useState(15);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [lastActivity, setLastActivity] = useState(0);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [synthesisReport, setSynthesisReport] = useState<string | null>(null);

  // 1. Intrusive Ideas Scratchpad States
  const [intrusiveIdeas, setIntrusiveIdeas] = useState<{ id: string; content: string; timestamp: string }[]>([]);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchInput, setScratchInput] = useState('');
  const [scratchFeedback, setScratchFeedback] = useState<string | null>(null);

  // 2. Ambient Pacing Deck States
  const [ambientActive, setAmbientActive] = useState(false);
  const [ambientSoundType, setAmbientSoundType] = useState<'brown' | 'pink' | 'metronome' | 'binaural'>('brown');
  const [ambientVolume, setAmbientVolume] = useState(0.4);

  // 3. Core visual timer mode toggle
  const [visualTimerStyle, setVisualTimerStyle] = useState<'digital' | 'hourglass' | 'visualCircle'>('hourglass');

  // 4. Dopamine particle explosion references & canvas nodes
  const particleCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const particlesRef = React.useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    shape: 'circle' | 'spark' | 'star';
  }[]>([]);

  // 5. Web Audio Context persistence references
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const noiseNodeRef = React.useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const oscLeftRef = React.useRef<OscillatorNode | null>(null);
  const oscRightRef = React.useRef<OscillatorNode | null>(null);
  const metroIntervalRef = React.useRef<any | null>(null);

  // Audio synthesizer player block
  const playFakeBeep = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, []);

  // Particle Explosions for satisfying dopamine completions
  const triggerDopamineBlast = useCallback((x: number, y: number, volume = 25) => {
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6'];
    const shapes: ('circle' | 'spark' | 'star')[] = ['circle', 'spark', 'star'];

    for (let i = 0; i < volume; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 2), // upward bias
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 40 + Math.floor(Math.random() * 30),
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      });
    }
  }, []);

  const triggerCelebration = useCallback((msg: string) => {
    setCelebrationMsg(msg);
    setShowCelebration(true);
    playFakeBeep(659.25, 'sine', 0.25);
    setTimeout(() => {
      playFakeBeep(880, 'sine', 0.3);
    }, 150);

    // Blast shimmery celebration sparks from the center!
    if (typeof window !== 'undefined') {
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.65;
      triggerDopamineBlast(startX, startY, 45);
    }

    setTimeout(() => {
      setShowCelebration(false);
    }, 4500);
  }, [playFakeBeep, triggerDopamineBlast]);

  // Web Audio Ambient Synthesizer
  const stopAmbientSound = useCallback(() => {
    try {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (oscLeftRef.current) {
        oscLeftRef.current.stop();
        oscLeftRef.current.disconnect();
        oscLeftRef.current = null;
      }
      if (oscRightRef.current) {
        oscRightRef.current.stop();
        oscRightRef.current.disconnect();
        oscRightRef.current = null;
      }
      if (metroIntervalRef.current) {
        clearInterval(metroIntervalRef.current);
        metroIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (_) {}
  }, []);

  const startAmbientSound = useCallback((type: 'brown' | 'pink' | 'metronome' | 'binaural', volumeLevel: number) => {
    stopAmbientSound();
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const mainGain = ctx.createGain();
      // Keep it calm and gentle
      mainGain.gain.setValueAtTime(volumeLevel * 0.12, ctx.currentTime);
      mainGain.connect(ctx.destination);
      gainNodeRef.current = mainGain;

      if (type === 'brown' || type === 'pink') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'brown') {
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.018 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.8; // Gain recovery
          }
        } else {
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(mainGain);
        source.start();
        noiseNodeRef.current = source;
      } else if (type === 'binaural') {
        const leftOsc = ctx.createOscillator();
        leftOsc.frequency.setValueAtTime(160, ctx.currentTime); // Deep alpha trigger
        const rightOsc = ctx.createOscillator();
        rightOsc.frequency.setValueAtTime(170, ctx.currentTime); // 10Hz alpha spacing

        const leftPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const rightPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (leftPan && rightPan) {
          leftPan.pan.value = -1;
          rightPan.pan.value = 1;
          leftOsc.connect(leftPan).connect(mainGain);
          rightOsc.connect(rightPan).connect(mainGain);
        } else {
          leftOsc.connect(mainGain);
          rightOsc.connect(mainGain);
        }

        leftOsc.start();
        rightOsc.start();
        oscLeftRef.current = leftOsc;
        oscRightRef.current = rightOsc;
      } else if (type === 'metronome') {
        let nextTickTime = ctx.currentTime;
        const secondsPerBeat = 60 / 52; // Calm 52 BPM heartbeat tempo

        const triggerScheduleTick = () => {
          const osc = ctx.createOscillator();
          const amp = ctx.createGain();
          osc.frequency.setValueAtTime(650, nextTickTime); // Sweet warm bell frequency
          amp.gain.setValueAtTime(0.06, nextTickTime);
          amp.gain.exponentialRampToValueAtTime(0.001, nextTickTime + 0.03);

          osc.connect(amp).connect(mainGain);
          osc.start(nextTickTime);
          osc.stop(nextTickTime + 0.04);

          nextTickTime += secondsPerBeat;
        };

        const intervalId = setInterval(() => {
          if (ctx.state === 'running' && ctx.currentTime + 0.15 > nextTickTime) {
            triggerScheduleTick();
          }
        }, 80);

        metroIntervalRef.current = intervalId;
      }
    } catch (_) {}
  }, [stopAmbientSound]);

  // Adjust volume dynamically on the fly
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(ambientVolume * 0.12, audioContextRef.current.currentTime);
    }
  }, [ambientVolume]);

  // Clean ambient tracks on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, [stopAmbientSound]);

  // Set up animation loop on particle canvas
  useEffect(() => {
    let animId: number;
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateAndDrawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const list = particlesRef.current;

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle gravity
        p.vx *= 0.98; // friction
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'spark') {
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(
              p.x + Math.cos((18 + j * 72) * Math.PI / 180) * p.size,
              p.y - Math.sin((18 + j * 72) * Math.PI / 180) * p.size
            );
            ctx.lineTo(
              p.x + Math.cos((54 + j * 72) * Math.PI / 180) * (p.size / 2),
              p.y - Math.sin((54 + j * 72) * (Math.PI / 180)) * (p.size / 2)
            );
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(updateAndDrawParticles);
    };

    animId = requestAnimationFrame(updateAndDrawParticles);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Keyboard shortcut (Ctrl + B) listener to open Brain Dump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowScratchpad((prev) => !prev);
        playFakeBeep(480, 'sine', 0.1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playFakeBeep]);

  // Capture global click explosions on interactive elements and track activity
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const matchesInteractive = 
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.tagName === 'INPUT' || 
        target.closest('label') ||
        target.classList.contains('cursor-pointer');

      if (matchesInteractive) {
        // Trigger a tiny satisfying click blast at click coordinate
        triggerDopamineBlast(e.clientX, e.clientY, 10);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousedown', handleGlobalClick);
      setLastActivity(Date.now());
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousedown', handleGlobalClick);
      }
    };
  }, [triggerDopamineBlast]);

  // Distraction track listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const registerActivity = () => {
      setLastActivity(Date.now());
    };
    window.addEventListener('mousemove', registerActivity);
    window.addEventListener('keydown', registerActivity);
    window.addEventListener('click', registerActivity);
    return () => {
      window.removeEventListener('mousemove', registerActivity);
      window.removeEventListener('keydown', registerActivity);
      window.removeEventListener('click', registerActivity);
    };
  }, []);

  // Alert pro-active distraction window if idle while timer runs
  useEffect(() => {
    const idleCheck = setInterval(() => {
      if (timerActive && brainProfile.primaryType !== 'NONE' && !showIdleModal) {
        const timeIdle = Date.now() - lastActivity;
        if (timeIdle > 75000) { // 75 seconds idle
          setShowIdleModal(true);
          playFakeBeep(320, 'triangle', 0.2);
        }
      }
    }, 10000);
    return () => clearInterval(idleCheck);
  }, [timerActive, lastActivity, brainProfile, showIdleModal, playFakeBeep]);

  // Load scratchpad list on startup
  useEffect(() => {
    try {
      const savedIdeas = localStorage.getItem('focusflow_intrusive_ideas');
      if (savedIdeas) {
        const parsed = JSON.parse(savedIdeas);
        setTimeout(() => {
          setIntrusiveIdeas(parsed);
        }, 0);
      }
    } catch (_) {}
  }, []);

  // Synchronize timer duration whenever profile or mode updates
  useEffect(() => {
    if (brainProfile && !timerActive) {
      setTimeout(() => {
        const minutes = timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency;
        setTimeLeft(minutes * 60);
      }, 0);
    }
  }, [brainProfile, timerMode, timerActive]);

  // Global Timer Countdown tick
  useEffect(() => {
    let timerInterval: any = null;
    if (timerActive && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimeout(() => {
        playFakeBeep(523.25, 'triangle', 0.5);
        if (timerMode === 'focus') {
          const addedMins = brainProfile.attentionSpan;
          setTotalFocusMinutes((m) => {
            const up = m + addedMins;
            localStorage.setItem('focusflow_focusmins', String(up));
            return up;
          });
          setSessionsCompletedCount((c) => {
            const up = c + 1;
            localStorage.setItem('focusflow_sessions', String(up));
            return up;
          });
          setFocusCoins((prev) => {
            const up = prev + 25;
            localStorage.setItem('focusflow_coins', String(up));
            return up;
          });
          setTimerMode('break');
          setTimeLeft(brainProfile.breakFrequency * 60);
          triggerCelebration("Focus block completed! 🏆 You earned 25 Focus Tokens & a refreshing pause!");
        } else {
          setTimerMode('focus');
          setTimeLeft(brainProfile.attentionSpan * 60);
          triggerCelebration("Break finished! 🚀 Ready to step back in?");
        }
        setTimerActive(false);
      }, 0);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerActive, timeLeft, timerMode, brainProfile, triggerCelebration, playFakeBeep]);

  // Load from database on mount safekeeping
  useEffect(() => {
    setTimeout(() => {
      try {
        const savedTasks = localStorage.getItem('focusflow_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));

        const savedCoins = localStorage.getItem('focusflow_coins');
        if (savedCoins) setFocusCoins(Number(savedCoins));

        const savedPowerups = localStorage.getItem('focusflow_powerups');
        if (savedPowerups) setUnlockedItems(JSON.parse(savedPowerups));

        const savedFocusMins = localStorage.getItem('focusflow_focusmins');
        if (savedFocusMins) setTotalFocusMinutes(Number(savedFocusMins));

        const savedSessions = localStorage.getItem('focusflow_sessions');
        if (savedSessions) setSessionsCompletedCount(Number(savedSessions));

        const savedStreak = localStorage.getItem('focusflow_streak');
        if (savedStreak) setCurrentStreak(Number(savedStreak));

        const savedMoodLogs = localStorage.getItem('focusflow_moodlogs');
        if (savedMoodLogs) setRecordedMoods(JSON.parse(savedMoodLogs));

        const savedGuardianMsg = localStorage.getItem('focusflow_guardianmsg');
        if (savedGuardianMsg) setGuardianMessage(savedGuardianMsg);
      } catch (_) {}
    }, 0);
  }, []);

  // Sync token additions with reward system
  const awardCoins = (amount: number, reason: string) => {
    setFocusCoins((prev) => {
      const up = prev + amount;
      try {
        localStorage.setItem('focusflow_coins', String(up));
      } catch (_) {}
      return up;
    });
    triggerCelebration(`+${amount} Focus Tokens for ${reason}! 🪙`);
  };

  const triggerVoiceInput = () => {
    if (voiceRecording) return;
    setVoiceRecording(true);
    playFakeBeep(650, 'sine', 0.15);
    
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTaskInput(transcript);
          setVoiceRecording(false);
          triggerCelebration(`Captured: "${transcript}" 🎙️`);
        };
        rec.onerror = () => {
          runSimulatedVoiceInput();
        };
        rec.start();
      } catch (_) {
        runSimulatedVoiceInput();
      }
    } else {
      runSimulatedVoiceInput();
    }
  };

  const runSimulatedVoiceInput = () => {
    const defaultIdeas = [
      "Review neural structures and write synopsis bibliography",
      "Draft my cognitive psychology essay outline on executive functioning",
      "Create high contrast design guide parameters for accessible dyslexia interfaces",
      "Complete study notes on clinical focus pacing loops"
    ];
    const speechIdea = defaultIdeas[Math.floor(Math.random() * defaultIdeas.length)];
    let index = 0;
    setTaskInput("");
    const interval = setInterval(() => {
      setTaskInput((prev) => {
        const next = prev + speechIdea[index];
        index++;
        if (index >= speechIdea.length) {
          clearInterval(interval);
          setVoiceRecording(false);
          triggerCelebration(`🎙️ Captured from mock Voice microphone: "${speechIdea}"`);
        }
        return next;
      });
    }, 45);
  };

  const generateTherapistReport = async () => {
    setLoadingSynthesis(true);
    setSynthesisReport(null);
    playFakeBeep(705, 'sine', 0.2);
    try {
      const res = await fetch('/api/tasks/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryType: brainProfile.primaryType,
          recordedMoods: recordedMoods,
          totalFocusMinutes: totalFocusMinutes,
          sessionsCompletedCount: sessionsCompletedCount
        })
      });
      const data = await res.json();
      if (data && data.report) {
        setSynthesisReport(data.report);
        triggerCelebration("Therapist Cognitive Synthesis generated! 📊");
      } else {
        throw new Error();
      }
    } catch (_) {
      // Local legacy advice callback block
      const fallbackAdvice = brainProfile.primaryType === 'ADHD' 
        ? "Micro incentivize with tokens frequently." 
        : brainProfile.primaryType === 'AUTISM' 
          ? "Protect cognitive margins with sensory mute bars." 
          : "Maintain steady pacing rest interval checks.";

      const fallbackMsg = `## Client-Side FocusFlow Synthesis Report\n**Brain Calibration Category:** ${brainProfile.primaryType || 'General'}\n**Cumulative Telemetry:** ${totalFocusMinutes} minutes study duration logged.\n\n### 🧭 Core Spatial Attention\nYour task checklists demonstrate excellent execution. Tracking accomplishments visually helps bypass short term memory loads.\n\n### 🩺 Therapist Supporting Recommendation\n- **Pacing Strategy:** ${fallbackAdvice}\n- **Sensory Boundaries:** Continue utilizing lofi pacing tones to isolate distracting workspace environments.`;
      
      setSynthesisReport(fallbackMsg);
      triggerCelebration("Generated local spatial coaching report!");
    } finally {
      setLoadingSynthesis(false);
    }
  };

  // Save utility
  const saveTasksToLocalStorage = (updatedTasks: FocusTask[]) => {
    setTasks(updatedTasks);
    try {
      localStorage.setItem('focusflow_tasks', JSON.stringify(updatedTasks));
    } catch (_) {}
  };

  const handleOnboardingAnswer = (primary: BrainType) => {
    playFakeBeep(440, 'sine', 0.08);
    const customizedProfile = getDefaultBrainProfile(primary);
    setBrainProfile(customizedProfile);
    setActiveTab('dashboard');
    triggerCelebration(`Profile set to ${primary}! FocusFlow has beautifully adapted its interface.`);
  };

  const handleCreateAIBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setLoadingAI(true);
    setAiError(null);
    playFakeBeep(330, 'square', 0.1);

    try {
      const response = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskInput,
          description: taskDescription,
          complexity: complexity,
          primaryType: brainProfile.primaryType
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const newTask: FocusTask = {
        id: Math.random().toString(36).substr(2, 9),
        title: taskInput,
        description: taskDescription,
        complexity: complexity,
        steps: data.steps.map((st: any) => ({ ...st, completed: false })),
        completed: false,
        createdAt: new Date().toLocaleDateString()
      };

      const newList = [newTask, ...tasks];
      saveTasksToLocalStorage(newList);
      setSelectedTaskForTimer(newTask);
      setTaskInput('');
      setTaskDescription('');
      setComplexity(5);

      triggerCelebration(`AI split your goal into ${newTask.steps.length} cozy, achievable parts!`);
    } catch (err: any) {
      console.error(err);
      setAiError("Initialized local breakdown list successfully!");
      
      const fallbackSteps = [
        { step: "Set up task workspace", time: 5, tip: "Bring only water and absolute focus items nearby.", reward: "Sit up proud!" },
        { step: "Execute initial 10 mins", time: 10, tip: "Get anything down first—avoid editing yet.", reward: "Shoulder roll!" },
        { step: "Perform core drafting block", time: 15, tip: "Keep going; progress is a journey, not a sprint.", reward: "Deep soft breath." },
        { step: "Confirm results & clear desk", time: 5, tip: "Close completed tags.", reward: "A big smile!" }
      ];

      const newTask: FocusTask = {
        id: Math.random().toString(36).substr(2, 9),
        title: taskInput,
        description: taskDescription,
        complexity: complexity,
        steps: fallbackSteps,
        completed: false,
        createdAt: new Date().toLocaleDateString()
      };

      const newList = [newTask, ...tasks];
      saveTasksToLocalStorage(newList);
      setSelectedTaskForTimer(newTask);
      setTaskInput('');
      setTaskDescription('');
      setComplexity(5);
    } finally {
      setLoadingAI(false);
    }
  };

  const toggleStepCompleted = (taskId: string, stepIndex: number) => {
    playFakeBeep(587.33, 'sine', 0.08);
    const shadowList = tasks.map((task) => {
      if (task.id === taskId) {
        const copySteps = [...task.steps];
        copySteps[stepIndex].completed = !copySteps[stepIndex].completed;

        const allMatched = copySteps.every((s) => s.completed);
        return {
          ...task,
          steps: copySteps,
          completed: allMatched
        };
      }
      return task;
    });

    saveTasksToLocalStorage(shadowList);

    const targetTask = shadowList.find((t) => t.id === taskId);
    if (targetTask) {
      if (targetTask.steps[stepIndex].completed) {
        // Award 10 tokens
        awardCoins(10, `completing checkpoint`);
        
        if (targetTask.completed) {
          setTimeout(() => {
            awardCoins(25, `fully finishing: "${targetTask.title}"`);
          }, 1200);
        }
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    playFakeBeep(220, 'sawtooth', 0.12);
    const shadow = tasks.filter((t) => t.id !== id);
    saveTasksToLocalStorage(shadow);
    if (selectedTaskForTimer?.id === id) {
      setSelectedTaskForTimer(null);
    }
  };

  const handleLogMood = (e: React.FormEvent) => {
    e.preventDefault();
    playFakeBeep(523.25, 'sine', 0.1);

    const log: MoodEntry = {
      mood: moodRating,
      energy: energyRating,
      focus: focusRating,
      anxiety: anxietyRating,
      notes: moodNotes || undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentLogs = [log, ...recordedMoods].slice(0, 8);
    setRecordedMoods(currentLogs);
    setCurrentMood(log);

    try {
      localStorage.setItem('focusflow_moodlogs', JSON.stringify(currentLogs));
    } catch (_) {}

    setMoodNotes('');
    triggerCelebration("Mindfulness log submitted! Your theme has adapted to balance current metrics.");
  };

  const handlePublishGuardianMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianDraft.trim()) return;
    playFakeBeep(440, 'sine', 0.15);
    setGuardianMessage(guardianDraft);
    try {
      localStorage.setItem('focusflow_guardianmsg', guardianDraft);
    } catch (_) {}
    setGuardianDraft('');
    triggerCelebration("Mentor beacon note published securely to student dashboard!");
  };

  const handleResetData = () => {
    playFakeBeep(180, 'sawtooth', 0.3);
    localStorage.clear();
    setBrainProfile(getDefaultBrainProfile('NONE'));
    setTasks([]);
    setRecordedMoods([]);
    setCurrentMood(null);
    setTotalFocusMinutes(0);
    setSessionsCompletedCount(0);
    setCurrentStreak(3);
    setIsSensoryModeActive(false);
    setActiveTab('onboarding');
    setSelectedRoom(null);
    setSelectedTaskForTimer(null);
  };

  const themeAccentBg = () => {
    if (brainProfile.primaryType === 'ADHD') return 'bg-amber-400 text-slate-950 hover:bg-amber-500';
    if (brainProfile.primaryType === 'AUTISM') return 'bg-emerald-700 text-white rounded-none hover:bg-emerald-800';
    if (brainProfile.primaryType === 'DYSLEXIA') return 'bg-indigo-700 text-white font-bold hover:bg-indigo-800';
    if (brainProfile.primaryType === 'ANXIETY') return 'bg-purple-400 text-slate-950 rounded-full hover:bg-purple-500';
    return 'bg-indigo-600 text-white hover:bg-indigo-700';
  };

  // Force onboarding if type is NONE
  useEffect(() => {
    if (isReady && brainProfile.primaryType === 'NONE') {
      setTimeout(() => {
        setActiveTab('onboarding');
      }, 0);
    }
  }, [brainProfile, isReady]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm font-mono tracking-wider text-slate-400">LOADING DYNAMIC CALM REGIME...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 border ${
              brainProfile.primaryType === 'ADHD'
                ? 'bg-amber-400 border-amber-500 text-slate-950'
                : brainProfile.primaryType === 'AUTISM'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-100 rounded-none'
                : 'bg-indigo-950 border-indigo-800 text-slate-100'
            }`}>
              <Sparkles className="w-5 h-5 flex-shrink-0 text-yellow-300 animate-pulse" />
              <div>
                <p className="font-bold text-[10px] uppercase tracking-widest opacity-80">FocusFlow Spark</p>
                <p className={`text-sm mt-0.5 font-medium ${styles.lineHeightClass}`}>{celebrationMsg}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sensory Override Panel */}
      <AnimatePresence>
        {isSensoryModeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950 z-40 flex flex-col items-center justify-center p-6 text-white overflow-y-auto"
          >
            <div className="max-w-xl w-full text-center space-y-8">
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <EyeOff className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-mono tracking-widest font-bold">SENSORY SAFETY ACTIVE</h1>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">UI animations, bells, timers, and sidebars are suspended to alleviate sensory overload.</p>
              </div>

              <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-left space-y-4">
                <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Active Target</h3>
                {tasks.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-4">No active tasks in system database storage.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.slice(0, 1).map((t) => (
                      <div key={t.id} className="space-y-2 font-mono">
                        <p className="text-base text-zinc-100">{t.title}</p>
                        <div className="pl-4 space-y-1.5 text-xs text-zinc-400">
                          {t.steps.map((st, i) => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer py-1 hover:text-white">
                              <input
                                type="checkbox"
                                checked={!!st.completed}
                                onChange={() => toggleStepCompleted(t.id, i)}
                                className="accent-white"
                              />
                              <span className={st.completed ? 'line-through text-zinc-600' : ''}>{st.step} ({st.time}m)</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>METRONOME BREATH</span>
                <span className="font-bold text-white animate-pulse">4-4 CYCLE ACTIVE</span>
              </div>

              <div>
                <button
                  onClick={() => setIsSensoryModeActive(false)}
                  className="px-8 py-3 bg-white text-black font-semibold text-xs tracking-widest hover:bg-neutral-200 transition-colors"
                >
                  DEACTIVATE SENSORY SAFEGUARDS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white select-none">FocusFlow</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  brainProfile.primaryType === 'ADHD' ? 'bg-amber-100 text-amber-800 font-bold' :
                  brainProfile.primaryType === 'AUTISM' ? 'bg-emerald-100 text-emerald-800' :
                  brainProfile.primaryType === 'DYSLEXIA' ? 'bg-indigo-950 text-white font-extrabold' :
                  brainProfile.primaryType === 'ANXIETY' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {brainProfile.primaryType}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-350 font-semibold tracking-wide hidden sm:block">Adaptive Neuro-diverse Learning Ecosystem</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playFakeBeep(220, 'sine', 0.2);
                setIsSensoryModeActive(!isSensoryModeActive);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all"
            >
              <EyeOff className="w-3.5 h-3.5 animate-bounce" />
              <span>Sensory escape</span>
            </button>

            <button
              onClick={() => {
                if (confirm("Reset current Profile and clean task storage?")) {
                  handleResetData();
                }
              }}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
              title="Reset Database"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="md:w-60 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-1">
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase p-2 font-bold select-none">Workspace Areas</p>
            
            <button
              onClick={() => { playFakeBeep(); setActiveTab('onboarding'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                activeTab === 'onboarding' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1. Profile Assessment</span>
            </button>

            {brainProfile.primaryType !== 'NONE' && (
              <>
                <button
                  onClick={() => { playFakeBeep(); setActiveTab('dashboard'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'dashboard' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Concentration Hub</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('tasks'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'tasks' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>3. AI Task Breakdown</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('focus'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'focus' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>4. Sensory Timers</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('doubling'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'doubling' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-pink-500" />
                  <span>5. Body Doubling Room</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('stats'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'stats' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Award className="w-4 h-4 text-orange-500" />
                  <span>6. Rhythm Analytics</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('guardian'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'guardian' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span>7. Guardian Bridge</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('settings'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'settings' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-teal-500" />
                  <span>8. Engine Variables</span>
                </button>

                <button
                  onClick={() => { playFakeBeep(); setActiveTab('rewards'); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                    activeTab === 'rewards' ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">🪙</span>
                    <span>Rewards Store</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 rounded-full font-bold">
                    {focusCoins}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Ambient Focus Deck */}
          {brainProfile.primaryType !== 'NONE' && (
            <div className="bg-slate-50/70 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">Mental Ambient Console</span>
                </div>
                {ambientActive && (
                  <div className="flex gap-0.5 items-end h-3 pr-1">
                    <motion.div animate={{ height: [3, 10, 3] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-indigo-500" />
                    <motion.div animate={{ height: [3, 14, 3] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }} className="w-0.5 bg-indigo-500" />
                    <motion.div animate={{ height: [3, 8, 3] }} transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }} className="w-0.5 bg-indigo-500" />
                    <motion.div animate={{ height: [3, 12, 3] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-0.5 bg-indigo-500" />
                  </div>
                )}
              </div>

              {/* Sound Profile Select Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'brown', label: '🤎 Brown', desc: 'Soothing drift' },
                  { id: 'pink', label: '🌸 Pink', desc: 'Static focus' },
                  { id: 'metronome', label: '⏲️ Heart', desc: 'Paced tick' },
                  { id: 'binaural', label: '🎧 Alpha', desc: 'Deep study' }
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      playFakeBeep(420, 'sine', 0.08);
                      setAmbientSoundType(track.id as any);
                      if (ambientActive) {
                        startAmbientSound(track.id as any, ambientVolume);
                      }
                    }}
                    className={`p-2 rounded-xl text-left border text-[10px] transition-all select-none cursor-pointer ${
                      ambientSoundType === track.id
                        ? 'bg-indigo-600/10 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-extrabold'
                        : 'bg-white dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="font-bold">{track.label}</div>
                    <div className="text-[8px] opacity-75 hidden sm:block truncate">{track.desc}</div>
                  </button>
                ))}
              </div>

              {/* Volume Slider & Power Action */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  onClick={() => {
                    playFakeBeep(523, 'sine', 0.1);
                    const flag = !ambientActive;
                    setAmbientActive(flag);
                    if (flag) {
                      startAmbientSound(ambientSoundType, ambientVolume);
                    } else {
                      stopAmbientSound();
                    }
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    ambientActive
                      ? 'bg-red-500 text-white hover:bg-red-650'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={ambientActive ? "Pause Audio Pacing" : "Activate Audio Pacing"}
                >
                  {ambientActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>

                <div className="flex-1 flex items-center gap-1.5 px-2 bg-white/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl py-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={ambientVolume}
                    onChange={(e) => {
                      setAmbientVolume(parseFloat(e.target.value));
                    }}
                    className="w-full h-1 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Unified Subcomponent Renderer Canvas */}
        <main className={`flex-1 bg-white/70 dark:bg-slate-900/65 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 min-h-[520px] ${styles.fontSizeClass}`}>
          
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: ONBOARDING INTRO ASSESSMENT */}
            {activeTab === 'onboarding' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                key="onboarding_wizard"
                className="space-y-6 text-center max-w-2xl mx-auto py-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Formulate Your Adaptive Engine</h1>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed max-w-lg mx-auto">
                    FocusFlow calibrates button scales, text weights, line spacer ratios, and timers explicitly to soothe your specific sensory mind-type.
                  </p>
                </div>

                {/* Recruiter Quick Demo Preset Banner */}
                <div className="p-5 bg-gradient-to-r from-amber-500/15 via-indigo-505/15 via-indigo-500/10 to-pink-500/15 rounded-2xl border border-indigo-200 dark:border-slate-800 max-w-xl mx-auto space-y-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base animate-pulse">✨</span>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Recruiter Quick-Tour Engine</h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-350 font-medium leading-relaxed">
                    Skip assessment setup and instantly load a pre-configured <strong>ADHD Hyperfocus Study Workspace</strong> populated with virtual tasks, completed statistics, logs, and focus tokens!
                  </p>
                  <button
                    onClick={() => {
                      playFakeBeep(880, 'sine', 0.25);
                      
                      // Set ADHD profile
                      const adhdProfile = getDefaultBrainProfile('ADHD');
                      setBrainProfile(adhdProfile);
                      
                      // Pre-populate tasks
                      const mockTasks: FocusTask[] = [
                        {
                          id: 'demo_1',
                          title: 'Prepare biology neural synapses poster diagram',
                          description: 'Need to structure visuals to combat ADHD focus dispersion',
                          complexity: 8,
                          steps: [
                            { step: 'Sketch basic neuron axon anatomy shapes', time: 10, tip: 'Keep drawing rough without detailing yet.', reward: 'Grab some water!', completed: true },
                            { step: 'Label synaptic cleft signal neurotransmitters', time: 15, tip: 'Color-code with neon highlighters.', reward: 'Throw shoulders back!', completed: false },
                            { step: 'Structure dendrite receptor target channels', time: 10, tip: 'Match with minimalist circular keycards.', reward: 'Do a quick happy spin!', completed: false }
                          ],
                          completed: false,
                          createdAt: new Date().toLocaleDateString()
                        },
                        {
                          id: 'demo_2',
                          title: 'Complete cognitive modeling essay outline',
                          description: 'Formulate primary thesis coordinates',
                          complexity: 5,
                          steps: [
                            { step: 'Write single paragraph describing Neurodistinct UI frameworks', time: 15, tip: 'Write anything down; editing can happen later.', reward: 'Great job!', completed: true },
                            { step: 'List 3 core empirical references in biblio draft', time: 12, tip: 'Paste raw URLs for now to avoid side-quests.', reward: 'Take a soft stretch.', completed: true }
                          ],
                          completed: true,
                          createdAt: new Date().toLocaleDateString()
                        }
                      ];
                      saveTasksToLocalStorage(mockTasks);
                      
                      // Pre-populate stats
                      setTotalFocusMinutes(115);
                      setSessionsCompletedCount(5);
                      setCurrentStreak(5);
                      setFocusCoins(85);
                      
                      // Pre-populate mood entries
                      const mockMoods: MoodEntry[] = [
                        { mood: 8, energy: 7, focus: 8, anxiety: 4, notes: "Feeling high kinetic focus energy", createdAt: '10:15 AM' },
                        { mood: 6, energy: 5, focus: 4, anxiety: 6, notes: "Sensory noise distraction from open desk", createdAt: '09:00 AM' }
                      ];
                      setRecordedMoods(mockMoods);
                      localStorage.setItem('focusflow_moodlogs', JSON.stringify(mockMoods));
                      localStorage.setItem('focusflow_focusmins', '115');
                      localStorage.setItem('focusflow_sessions', '5');
                      localStorage.setItem('focusflow_streak', '5');
                      localStorage.setItem('focusflow_coins', '85');
                      
                      setActiveTab('dashboard');
                      triggerCelebration("Recruiter ADHD Hyperfocus workspace loaded seamlessly! Enjoy the demonstration.");
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] tracking-widest uppercase rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    🚀 Launch Recruiter Demo Preset
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                  
                  {/* ADHD Option card */}
                  <div
                    id="select_profile_adhd"
                    onClick={() => handleOnboardingAnswer('ADHD')}
                    className="p-5 bg-amber-500/5 hover:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-800 hover:border-amber-500 rounded-xl cursor-pointer transition-all space-y-3 relative group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                      <Zap className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Fast Loops & Spark (ADHD Style)</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-normal">High interactive visual triggers, 15-minute quick study vaults, variable dopamine celebrate badges, and encouraging focus sparks.</p>
                    </div>
                  </div>

                  {/* Autism Option card */}
                  <div
                    id="select_profile_autism"
                    onClick={() => handleOnboardingAnswer('AUTISM')}
                    className="p-5 bg-emerald-500/5 hover:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl cursor-pointer transition-all space-y-3 relative group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                      <Target className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Predicable & Space (Autism Style)</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-normal">Linear progress bars, 0% flashing animations, deep 45-minute strict attention vaults, and quiet direct labels with no visual fluff.</p>
                    </div>
                  </div>

                  {/* Dyslexia Option card */}
                  <div
                    id="select_profile_dyslexia"
                    onClick={() => handleOnboardingAnswer('DYSLEXIA')}
                    className="p-5 bg-indigo-500/5 hover:bg-indigo-500/10 border-2 border-indigo-400 dark:border-indigo-800 hover:border-indigo-500 rounded-xl cursor-pointer transition-all space-y-3 relative group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <Palette className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Spatial & Voice (Dyslexia Style)</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-normal">Spacious tracking gaps, double lead line height spacing, color coding visual overlays, and simplified word cards.</p>
                    </div>
                  </div>

                  {/* Anxiety Option card */}
                  <div
                    id="select_profile_anxiety"
                    onClick={() => handleOnboardingAnswer('ANXIETY')}
                    className="p-5 bg-purple-500/5 hover:bg-purple-500/10 border-2 border-purple-300 dark:border-purple-800 hover:border-purple-500 rounded-xl cursor-pointer transition-all space-y-3 relative group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-400 text-slate-950 flex items-center justify-center font-bold">
                      <Headphones className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Gentle & Soft (Anxiety Style)</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-normal">Pulsing breathing orbs, quiet progressive countdowns, zero stressful timers, and soothing reassurance reminders.</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 2: CONCENTRATION HUB DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="dashboard_home"
                className="space-y-6 text-left"
              >
                {/* Custom Profile Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-100/40 to-purple-100/40 dark:from-slate-900/90 border-2 border-indigo-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-extrabold tracking-widest text-indigo-805 text-indigo-700 dark:text-indigo-400 uppercase">Attention calibrated focus tab</span>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Welcome Back, Scholar</h2>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">Pacing metric intervals are locked for your {brainProfile.primaryType} mind alignment.</p>
                  </div>

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm">
                    <Zap className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                    <div>
                      <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 uppercase font-extrabold">Sustained active</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{currentStreak} Day Streak</p>
                    </div>
                  </div>
                </div>

                {/* Guardian message spotlight */}
                {guardianMessage && (
                  <div className="p-4 rounded-xl bg-pink-100/10 border border-pink-200/50 flex gap-3 text-xs">
                    <Heart className="w-4.5 h-4.5 text-pink-500 animate-pulse flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-pink-600 block font-bold">Beacon Note from Support Mentor</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 italic font-medium">&quot;{guardianMessage}&quot;</p>
                    </div>
                  </div>
                )}

                {/* Grid stats and rapid tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Item List Box */}
                  <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-4.5 h-4.5 text-indigo-500 stroke-3" />
                        <h4 className="font-extrabold text-slate-950 dark:text-white">Your Segmented Goals</h4>
                      </div>
                      <span className="text-xs font-mono bg-indigo-200 text-indigo-950 dark:bg-indigo-900 dark:text-indigo-250 px-2 py-1 font-extrabold rounded">
                        {tasks.length} total
                      </span>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="text-center py-10 space-y-3 font-medium">
                        <BookOpen className="w-8 h-8 text-indigo-500 mx-auto" />
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">No active goals partitioned yet.</p>
                        <button
                          onClick={() => setActiveTab('tasks')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-bold"
                        >
                          + Trigger AI Decomposition
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto">
                        {tasks.map((t) => (
                          <div key={t.id} className="p-3 bg-slate-100/80 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs font-semibold">
                            <div>
                              <p className="text-slate-950 dark:text-slate-100 font-bold">{t.title}</p>
                              <span className="text-[11px] font-mono text-slate-800 dark:text-slate-300 font-bold block mt-1">
                                {t.steps.filter(s => s.completed).length} of {t.steps.length} checkpoints completed
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedTaskForTimer(t);
                                setActiveTab('focus');
                                playFakeBeep();
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 dark:bg-indigo-950 hover:bg-indigo-700 dark:hover:bg-indigo-900 text-white dark:text-indigo-200 rounded-lg text-[10px] font-extrabold tracking-wide uppercase shadow-xs whitespace-nowrap"
                            >
                              Interval Run
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick self reflection mindfulness log */}
                  <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Smile className="w-5 h-5 text-purple-600 animate-spin" />
                        <h4 className="font-extrabold text-slate-950 dark:text-white">Immediate Mind Log</h4>
                      </div>
                      <span className="text-xs font-mono uppercase text-slate-905 dark:text-slate-200 font-extrabold">Biometrics</span>
                    </div>

                    <form onSubmit={handleLogMood} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                          <label className="text-xs uppercase font-mono text-slate-950 dark:text-slate-100 font-extrabold">Patience</label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={focusRating}
                            onChange={(e) => setFocusRating(Number(e.target.value))}
                            className="w-full h-1.5 accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                          <label className="text-xs uppercase font-mono text-slate-950 dark:text-slate-100 font-extrabold">Vigor ⚡</label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={energyRating}
                            onChange={(e) => setEnergyRating(Number(e.target.value))}
                            className="w-full h-1.5 accent-emerald-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono uppercase text-slate-950 dark:text-slate-100 font-extrabold block pb-0.5">MindState Reflection details</label>
                        <input
                          type="text"
                          value={moodNotes}
                          onChange={(e) => setMoodNotes(e.target.value)}
                          placeholder="What is occupying attention? e.g. noise stress..."
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-sm"
                      >
                        Publish Mind Report
                      </button>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 3: ADAPTIVE AI TASK BREAKDOWN */}
            {activeTab === 'tasks' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="tasks_breaker"
                className="space-y-6 text-left"
              >
                <div className="border-b border-zinc-200 pb-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executive Function breakdown Engine</h2>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">Packs complex milestones down. Uses standard Gemini 3.5 Flash server-side modeling.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left block form */}
                  <div className="lg:col-span-1 bg-slate-50 dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <form onSubmit={handleCreateAIBreakdown} className="space-y-4 text-xs font-medium">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center pb-1">
                          <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Target Goal Title</label>
                          <button
                            type="button"
                            onClick={triggerVoiceInput}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                              voiceRecording 
                                ? 'bg-red-500 border-red-600 text-white animate-pulse' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-650 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700'
                            }`}
                          >
                            <span>🎙️ {voiceRecording ? 'Recording...' : 'Voice Dictate'}</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          placeholder="What project do you need help managing? e.g. 'Write essay intro'..."
                          className={`w-full p-3 dark:bg-slate-950 outline-none text-slate-900 dark:text-white ${styles.inputStyleClass}`}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Brief Scope notes</label>
                        <input
                          type="text"
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="e.g. 'Include bibliography parameters'..."
                          className={`w-full p-3 dark:bg-slate-950 outline-none text-slate-900 dark:text-white ${styles.inputStyleClass}`}
                        />
                      </div>

                      <div className="space-y-2 p-3.5 bg-white dark:bg-slate-950 border border-slate-250/60 dark:border-slate-800 rounded-xl">
                        <div className="flex justify-between">
                          <label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Gloom / Panic scale</label>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{complexity}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={complexity}
                          onChange={(e) => setComplexity(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingAI}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold uppercase rounded-xl tracking-widest text-[11px] shadow-sm transition-all duration-150"
                      >
                        {loadingAI ? 'Decomposing via Gemini...' : 'Decompose Objective with AI'}
                      </button>
                    </form>
                  </div>

                  {/* Right block tasks display */}
                  <div className="lg:col-span-2 space-y-4">
                    {tasks.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 space-y-2">
                        <Sparkles className="w-8 h-8 text-indigo-500 mx-auto" />
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-zinc-100">Task slate is clean.</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Describe your complex assignment on the left to activate smart visual segmentation.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                        {tasks.map((t) => (
                          <div key={t.id} className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Calibrated segmentation list</span>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{t.title}</h3>
                                {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1.5 hover:text-red-500 text-slate-400 dark:text-slate-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              {t.steps.map((st, i) => (
                                <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${st.completed ? 'opacity-70 bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60' : 'bg-slate-50/50 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800'}`}>
                                  <button
                                    onClick={() => toggleStepCompleted(t.id, i)}
                                    className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350 dark:border-slate-600 hover:border-indigo-500'}`}
                                  >
                                    {st.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>

                                  <div className="flex-1 text-xs">
                                    <p className={`font-semibold text-[13px] ${st.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{st.step}</p>
                                    <div className="flex items-center gap-3 pt-1 text-slate-500 dark:text-slate-400 font-medium text-xs">
                                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {st.time} mins</span>
                                      {st.tip && <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Tip: {st.tip}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 4: SENSORY FOCUS TIMER */}
            {activeTab === 'focus' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="focus_room"
                className="space-y-6 text-center max-w-lg mx-auto py-6"
              >
                <div className="text-left border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{brainProfile.primaryType} Focus Workspace</h2>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">Timers automatically adapt concentration frequencies to secure flow states.</p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 border-2 border-slate-250 dark:border-slate-800 rounded-xl text-left text-xs font-semibold">
                  {selectedTaskForTimer ? (
                    <div>
                      <span className="text-xs font-mono uppercase text-indigo-700 dark:text-indigo-300 block pb-0.5 font-extrabold">Spotlight Target Goal</span>
                      <p className="font-extrabold text-sm text-slate-950 dark:text-white mt-1">{selectedTaskForTimer.title}</p>
                    </div>
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 font-bold italic">No task spotlight selection loaded. Navigate to &quot;Decompose Task&quot; tab to build items.</p>
                  )}
                </div>

                {/* Visual Timer Style Switcher */}
                <div className="flex justify-center gap-1.5 p-1 bg-slate-105/70 bg-slate-100/70 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/80 max-w-sm mx-auto">
                  <button
                    onClick={() => { playFakeBeep(); setVisualTimerStyle('hourglass'); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${visualTimerStyle === 'hourglass' ? 'bg-indigo-600 text-white font-extrabold shadow' : 'text-slate-605 text-slate-600 dark:text-slate-400 hover:text-slate-950'}`}
                  >
                    ⏳ Hourglass Active
                  </button>
                  <button
                    onClick={() => { playFakeBeep(); setVisualTimerStyle('visualCircle'); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${visualTimerStyle === 'visualCircle' ? 'bg-indigo-600 text-white font-extrabold shadow' : 'text-slate-605 text-slate-600 dark:text-slate-400 hover:text-slate-950'}`}
                  >
                    📊 Pacing Sweep
                  </button>
                  <button
                    onClick={() => { playFakeBeep(); setVisualTimerStyle('digital'); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${visualTimerStyle === 'digital' ? 'bg-indigo-600 text-white font-extrabold shadow' : 'text-slate-605 text-slate-600 dark:text-slate-400 hover:text-slate-950'}`}
                  >
                    🔢 Core Display
                  </button>
                </div>

                {/* Clock face based on layout constraints */}
                <div className="py-6 flex justify-center">
                  
                  {visualTimerStyle === 'hourglass' && (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <svg viewBox="0 0 100 130" className="w-44 h-56 text-slate-350 dark:text-slate-750">
                        {/* Hourglass Glass Shell */}
                        <path
                          d="M 24 18 L 76 18 Q 74 58 53 65 Q 74 72 76 112 L 24 112 Q 26 72 47 65 Q 26 58 24 18 Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinejoin="round"
                          className="text-slate-300 dark:text-slate-800"
                        />
                        
                        {/* Inner Glass border accents */}
                        <path
                          d="M 28 22 L 72 22 M 28 108 L 72 108"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className="text-slate-200 dark:text-slate-900"
                        />

                        {/* Top & Bottom wood cap supports */}
                        <rect x="18" y="10" width="64" height="8" rx="3" fill="currentColor" className="text-slate-450 dark:text-slate-800" />
                        <rect x="18" y="112" width="64" height="8" rx="3" fill="currentColor" className="text-slate-455 dark:text-slate-800" />

                        {/* Left and Right brass pillars */}
                        <line x1="20" y1="18" x2="20" y2="112" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 dark:text-slate-800" />
                        <line x1="80" y1="18" x2="80" y2="112" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 dark:text-slate-800" />

                        {/* Upper Bulb Sand (Decrease over progress) */}
                        {(() => {
                          const totalDuration = (timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency) * 60;
                          const percentRemaining = totalDuration > 0 ? timeLeft / totalDuration : 1;
                          const prog = percentRemaining; 
                          const currentY = 25 + (38 * (1 - prog));
                          const widthPct = prog;
                          const leftX = 50 - (20 * widthPct);
                          const rightX = 50 + (20 * widthPct);
                          if (prog <= 0.02) return null;
                          return (
                            <path
                              d={`M ${leftX} ${currentY} Q 50 64 47 64 L 53 64 Q 50 64 ${rightX} ${currentY} Z`}
                              fill="currentColor"
                              className="text-amber-500 opacity-90 transition-all duration-300"
                            />
                          );
                        })()}

                        {/* Falling Sand grains simulation */}
                        {timerActive && (
                          <>
                            <motion.circle cx="50" cy="65" r="1.5" className="fill-amber-500" animate={{ cy: [65, 106], scale: [1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                            <motion.circle cx="50" cy="65" r="1.5" className="fill-amber-500" animate={{ cy: [65, 106], scale: [1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear', delay: 0.3 }} />
                            <motion.circle cx="50" cy="65" r="1.5" className="fill-amber-500" animate={{ cy: [65, 106], scale: [1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear', delay: 0.6 }} />
                          </>
                        )}

                        {/* Lower Bulb Sand (Piles up over time) */}
                        {(() => {
                          const totalDuration = (timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency) * 60;
                          const percentRemaining = totalDuration > 0 ? timeLeft / totalDuration : 1;
                          const prog = 1 - percentRemaining; 
                          if (prog <= 0.02) return null;
                          return (
                            <path
                              d={`M 26 110 Q 50 ${110 - (42 * prog)} 74 110 L 74 110 L 26 110 Z`}
                              fill="currentColor"
                              className="text-amber-500 opacity-95 transition-all duration-300"
                            />
                          );
                        })()}
                      </svg>

                      {/* Numeric timer display */}
                      <div className="space-y-0.5 text-center">
                        <h4 className="text-4xl font-mono font-bold text-slate-900 dark:text-white">
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest font-mono">
                          Sequence current status: {timerMode}
                        </p>
                      </div>
                    </div>
                  )}

                  {visualTimerStyle === 'visualCircle' && (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <svg viewBox="0 0 100 100" className="w-52 h-52">
                        {/* Gray track ring */}
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-850" />
                        
                        {/* Gradient background slice */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          className="text-indigo-600/5 dark:text-indigo-500/5"
                          fill="currentColor"
                        />

                        {/* Dynamic arc for time remain */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6.5"
                          strokeLinecap="round"
                          className="text-indigo-600 dark:text-indigo-400"
                          strokeDasharray={263.8} 
                          strokeDashoffset={263.8 * (1 - (timeLeft / ((timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency) * 60)))}
                          transform="rotate(-90 50 50)" 
                          transition={{ duration: 0.3 }}
                        />

                        {/* Inner clean dashboard bubble */}
                        <circle cx="50" cy="50" r="32" fill="currentColor" className="text-white dark:text-slate-950 shadow-inner" />

                        {/* Center labels showing time elapsed analog */}
                        <g className="text-center select-none">
                          <text x="50" y="48" textAnchor="middle" className="text-[14px] font-bold font-mono fill-slate-900 dark:fill-white">
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                          </text>
                          <text x="50" y="60" textAnchor="middle" className="text-[6.5px] font-bold tracking-widest fill-slate-500 dark:fill-slate-400 uppercase font-mono">
                            {timerMode} pace
                          </text>
                        </g>
                      </svg>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest font-mono text-center">
                        Time-Sweep Sweep Dial Active • Alleviates Anxiety countdown pressure
                      </div>
                    </div>
                  )}

                  {visualTimerStyle === 'digital' && (
                    <div className="w-full flex justify-center">
                      {/* ADHD spin countdown */}
                      {brainProfile.primaryType === 'ADHD' && (
                        <div className="relative w-64 h-64 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: timerActive ? 360 : 0 }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                            className={`absolute inset-0 rounded-full border-4 border-dashed border-amber-400 ${timerActive ? 'opacity-100' : 'opacity-40'}`}
                          />
                          <div className="w-56 h-56 rounded-full bg-slate-950 text-white flex flex-col items-center justify-center border-4 border-amber-400 shadow-xl z-20">
                            <span className="text-xs font-mono font-extrabold tracking-widest text-amber-400">ADHD SPRINT VIBRATION</span>
                            <h3 className="text-5xl font-mono mt-1 font-bold">
                              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                            </h3>
                            <span className="text-xs text-slate-300 mt-2 font-bold">Sprint Block duration</span>
                          </div>
                        </div>
                      )}

                      {/* Autism Linear predictor */}
                      {brainProfile.primaryType === 'AUTISM' && (
                        <div className="w-full max-w-sm p-5 bg-slate-100 dark:bg-slate-950 border-2 border-emerald-600 rounded-none text-left space-y-4">
                          <span className="text-xs font-mono uppercase tracking-widest text-slate-800 dark:text-slate-200 font-extrabold block">Autism Predictable Timer</span>
                          <div className="text-5xl font-mono font-bold text-center text-slate-950 dark:text-white">
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                          </div>
                          <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden relative border border-slate-350 dark:border-slate-700">
                            <div
                              className="h-full bg-emerald-600 text-white text-xs font-mono flex items-center pl-2 font-bold"
                              style={{
                                width: `${(((timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency) * 60 - timeLeft) / ((timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency) * 60)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Anxiety hidden countdown pulsator */}
                      {brainProfile.primaryType === 'ANXIETY' && (
                        <div className="space-y-6 text-center">
                          <div className="w-56 h-56 rounded-full bg-purple-500/15 border-2 border-purple-400 flex flex-col items-center justify-center p-8 mx-auto">
                            <span className="text-xs uppercase tracking-widest font-mono text-purple-750 dark:text-purple-300 font-extrabold">Relax Workspace</span>
                            <p className="text-sm text-slate-950 dark:text-zinc-100 mt-4 font-extrabold">{timerActive ? 'Steady focus active...' : 'Savoring starting point'}</p>
                          </div>
                          <div className="text-xs text-slate-800 dark:text-slate-200 font-bold italic">Countdown metrics are invisible to alleviate panic responses.</div>
                        </div>
                      )}

                      {/* Dyslexia or generic default */}
                      {(brainProfile.primaryType === 'NONE' || brainProfile.primaryType === 'DYSLEXIA') && (
                        <div className="space-y-1">
                          <h4 className="text-6xl font-mono font-bold tracking-widest text-slate-950 dark:text-white">
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                          </h4>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">Sequence status: {timerMode.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Operations buttons */}
                <div className="flex justify-center items-center gap-3">
                  <button
                    onClick={() => {
                      playFakeBeep();
                      setTimerActive(!timerActive);
                    }}
                    className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md ${themeAccentBg()}`}
                  >
                    {timerActive ? 'Pause Session' : 'Initiate sprint session'}
                  </button>

                  <button
                    onClick={() => {
                      playFakeBeep(330, 'sine', 0.1);
                      setTimerActive(false);
                      const min = timerMode === 'focus' ? brainProfile.attentionSpan : brainProfile.breakFrequency;
                      setTimeLeft(min * 60);
                    }}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-205 border-slate-200 rounded-lg"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 5: CO-STUDY BODY DOUBLING */}
            {activeTab === 'doubling' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="doubling_rooms"
                className="space-y-6 text-left"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Virtual Body Doubling Space</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Co-study side by side with simulated neurodistinct partners to harness positive workspace gravity.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Channels selector list */}
                  <div className="lg:col-span-1 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected channels</h3>
                    
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          playFakeBeep();
                          setSelectedRoom('library');
                          setBuddyMessages([
                            "Keep pushing, you're doing great!",
                            "Muted sensory mode makes code peaceful.",
                            "Just completed checkpoint 3. Let's do this!"
                          ]);
                        }}
                        className={`p-4 border rounded-xl text-xs font-medium text-left cursor-pointer transition-all ${selectedRoom === 'library' ? 'bg-pink-500/10 border-pink-400 font-semibold' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
                      >
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">🏛️ Silent Library Study Grid</h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">3 active partners • cameras active/muted mics.</p>
                      </div>

                      <div
                        onClick={() => {
                          playFakeBeep();
                          setSelectedRoom('cozy');
                          setBuddyMessages([
                            "Cocoa break! Pacing is everything.",
                            "Listening to visual soothing ambient logs.",
                            "Small steps add up. Take a deep breath."
                          ]);
                        }}
                        className={`p-4 border rounded-xl text-xs font-medium text-left cursor-pointer transition-all ${selectedRoom === 'cozy' ? 'bg-pink-500/10 border-pink-400 font-semibold' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
                      >
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">☕ Visual Cozy Lofi Lounge</h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">5 active partners • background music synchronized.</p>
                      </div>
                    </div>
                  </div>

                  {/* Room status board */}
                  <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                    {selectedRoom ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-3.5 border-slate-200 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] font-mono bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold px-2.5 py-1 rounded tracking-wider uppercase">CONNECTED ONLINE</span>
                            <h3 className="font-semibold text-sm mt-2 text-slate-900 dark:text-white">
                              {selectedRoom === 'library' ? '🏛️ Silent Library Study Grid' : '☕ Visual Cozy Lofi Lounge'}
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedRoom(null)}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>

                        {/* Co-partner cards */}
                        <div>
                          <p className="text-[11px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold block pb-2.5">Your study buddies</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold font-mono text-xs">AX</span>
                              <div>
                                <h4 className="font-semibold text-xs text-slate-800 dark:text-white">Alex (ADHD)</h4>
                                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">SPRINTING: 12m ran</span>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono text-xs">SR</span>
                              <div>
                                <h4 className="font-semibold text-xs text-slate-800 dark:text-white">Sarah (Autism)</h4>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">STRUCTURING: Deep draft</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chat encouragement board */}
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block border-b pb-1.5 border-slate-100/50">Encouragement bulletin board</span>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {buddyMessages.map((msg, i) => (
                              <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100/60 dark:border-slate-800/80">
                                <span className="text-pink-600 dark:text-pink-400 font-mono font-bold mr-1.5">Buddy:</span> {msg}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Supports interactable buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              playFakeBeep();
                              triggerCelebration("Dispatched warm support hearts to connected study buddies!");
                            }}
                            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-extrabold uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Heart className="w-4.5 h-4.5 fill-white text-white" />
                            <span>Share heart signals</span>
                          </button>

                          <button
                            onClick={() => {
                              playFakeBeep(523.25, 'triangle', 0.15);
                              triggerCelebration("Dispatched a synchronized cocoa break request tag!");
                            }}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Coffee className="w-4.5 h-4.5 text-white" />
                            <span>Trigger Break Beep</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white border-2 border-slate-200 rounded-2xl space-y-4">
                        <UserCheck className="w-12 h-12 text-pink-600 mx-auto animate-pulse" />
                        <h4 className="font-extrabold text-slate-950 dark:text-zinc-200">Select Co-study Channel</h4>
                        <p className="text-xs text-slate-850 dark:text-slate-200 font-bold max-w-sm mx-auto">Pick a channel on the left to secure real-time non-intrusive presence coordinates.</p>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 6: RHYTHM PROGRESS ANALYTICS */}
            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="stats_dashboard"
                className="space-y-6 text-left"
              >
                <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flow Rhythm Analytics</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Maps visual productivity without anxiety. Flow stats are non-punitive.</p>
                </div>

                {/* Achievements block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
                    <Zap className="w-5.5 h-5.5 text-amber-500" />
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-amber-100">Pacing Spark</h4>
                    <p className="text-xs text-slate-500 dark:text-amber-200/80 font-medium">Logged your primary cognitive mindset.</p>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 transition-all ${totalFocusMinutes >= 15 ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/60' : 'bg-slate-550 bg-slate-50/40 dark:bg-neutral-900/40 border-slate-200/60 dark:border-neutral-850 opacity-65'}`}>
                    <Clock className={`w-5.5 h-5.5 ${totalFocusMinutes >= 15 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <h4 className={`font-semibold text-xs ${totalFocusMinutes >= 15 ? 'text-slate-800 dark:text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>Concentration Badge</h4>
                    <p className={`text-xs font-medium ${totalFocusMinutes >= 15 ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400/80 dark:text-slate-500/80'}`}>{totalFocusMinutes >= 15 ? 'Unlocked: more than 15m focus logged!' : 'Pace 15m total focus'}</p>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 transition-all ${sessionsCompletedCount >= 1 ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60' : 'bg-slate-550 bg-slate-50/40 dark:bg-neutral-900/40 border-slate-200/60 dark:border-neutral-850 opacity-65'}`}>
                    <Coffee className={`w-5.5 h-5.5 ${sessionsCompletedCount >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <h4 className={`font-semibold text-xs ${sessionsCompletedCount >= 1 ? 'text-slate-800 dark:text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>Smart Rest Badge</h4>
                    <p className={`text-xs font-medium ${sessionsCompletedCount >= 1 ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400/80 dark:text-slate-500/80'}`}>{sessionsCompletedCount >= 1 ? 'Unlocked: completed rest block!' : 'Complete 1 dynamic rest run'}</p>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 transition-all ${recordedMoods.length >= 1 ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/60' : 'bg-slate-550 bg-slate-50/40 dark:bg-neutral-900/40 border-slate-200/60 dark:border-neutral-850 opacity-65'}`}>
                    <Smile className={`w-5.5 h-5.5 ${recordedMoods.length >= 1 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    <h4 className={`font-semibold text-xs ${recordedMoods.length >= 1 ? 'text-slate-800 dark:text-purple-100' : 'text-slate-400 dark:text-slate-500'}`}>Mindfulness Badge</h4>
                    <p className={`text-xs font-medium ${recordedMoods.length >= 1 ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400/80 dark:text-slate-500/80'}`}>{recordedMoods.length >= 1 ? 'Unlocked: mindstates logged!' : 'Log 1 self checkin entry'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Chart representation */}
                  <div className="bg-slate-50/30 dark:bg-neutral-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Pacing distribution</h4>
                    <div className="h-40 w-full flex items-end justify-between px-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl relative pt-4">
                      <div className="w-7 bg-slate-200 dark:bg-slate-850 h-10 rounded-t transition-all"></div>
                      <div className="w-7 bg-slate-200 dark:bg-slate-850 h-16 rounded-t transition-all"></div>
                      <div className="w-7 bg-slate-200 dark:bg-slate-850 h-24 rounded-t transition-all"></div>
                      <div className="w-7 bg-indigo-500 h-36 rounded-t transition-all relative">
                        <div className="absolute top-1 left-0 right-0 text-[8px] font-mono text-white text-center font-bold">MAX</div>
                      </div>
                      <div className="w-7 bg-indigo-400 h-28 rounded-t transition-all"></div>
                    </div>
                  </div>

                  {/* Reflected entries logs */}
                  <div className="bg-slate-50/30 dark:bg-neutral-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Recent logs</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {recordedMoods.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic py-10 text-center">No mind logs entered on home dash yet.</p>
                      ) : (
                        recordedMoods.map((m, index) => (
                          <div key={index} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-white">
                            <span className="text-slate-500 dark:text-slate-405 font-mono">Time: {m.createdAt}</span>
                            <div className="flex gap-2 text-[10.5px]">
                              <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 px-2.5 py-0.5 rounded font-mono font-bold">🎯 Patience: {m.focus}/10</span>
                              <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-400 px-2.5 py-0.5 rounded font-mono font-bold">🌩️ Distraction: {m.anxiety}/10</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Cognitive Synthesis Therapist Report Section */}
                <div className="p-6 bg-slate-50 dark:bg-neutral-950 border border-slate-205 dark:border-slate-850 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white pb-0.5">Therapist/Coach Reflection Synthesis</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-405 font-medium font-semibold">Consolidates your logs into a strategic clinic-aligned cognitive assessment ready to print or share.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={generateTherapistReport}
                        disabled={loadingSynthesis}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-[10.5px] font-mono tracking-wider uppercase rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                      >
                        {loadingSynthesis ? '🔄 Modeling Report...' : '📊 Compose Report'}
                      </button>
                      {synthesisReport && (
                        <button
                          onClick={() => {
                            playFakeBeep();
                            if (typeof window !== 'undefined') window.print();
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10.5px] font-mono tracking-wider uppercase rounded-xl border border-slate-205 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          🖨️ Print Report
                        </button>
                      )}
                    </div>
                  </div>

                  {synthesisReport ? (
                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3.5 max-h-[380px] overflow-y-auto">
                      {synthesisReport.split('\n').map((line, idx) => {
                        if (line.startsWith('## ')) {
                          return <h3 key={idx} className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 pt-3 border-b-2 border-slate-100 dark:border-slate-800 pb-1 mt-2">{line.replace('## ', '')}</h3>;
                        }
                        if (line.startsWith('### ')) {
                          return <h4 key={idx} className="text-[11px] font-bold uppercase tracking-wider text-slate-850 dark:text-white pt-2">{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={idx} className="text-xs font-semibold text-slate-500 italic">{line.replaceAll('**', '')}</p>;
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <div key={idx} className="flex gap-2 text-xs text-slate-705 dark:text-slate-350 font-semibold pl-2 leading-relaxed">
                              <span>•</span>
                              <p>{line.replace('- ', '')}</p>
                            </div>
                          );
                        }
                        if (line.trim().length === 0) return <div key={idx} className="h-1.5" />;
                        return <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Click Compose Report above to query standard Gemini clinic-backed analysis of your focus sessions.</p>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* SCREEN 7: SECURE GUARDIAN PORTAL BRIDGE */}
            {activeTab === 'guardian' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="guardian_portal"
                className="space-y-6 text-left"
              >
                <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Secure Guardian Portal Bridge</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Allows parent/teacher encourage updates. Surveillance markers are disabled to preserve student trust.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Privacy first rhythm cards */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Study rhythm telemetry</h3>
                    
                    <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl space-y-2 text-xs">
                      <span className="text-[10.5px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 block font-bold">Optimal pacing interval</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Comfort Target: {brainProfile.attentionSpan} mins / sprint</h4>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This index has been mapped historically as optimal. Avoid pushing student past this scale.</p>
                    </div>
                  </div>

                  {/* Message center */}
                  <div className="lg:col-span-2 bg-slate-50/30 dark:bg-neutral-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Broadcast support spotlight note</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Write an encouraging note or highlight here. It will immediately show in the student&apos;s primary home dashboard card header spotlight.</p>

                    <form onSubmit={handlePublishGuardianMessage} className="space-y-3">
                      <textarea
                        rows={2}
                        value={guardianDraft}
                        onChange={(e) => setGuardianDraft(e.target.value)}
                        placeholder="e.g. 'We saw your steady progress segmenting task items yesterday. Incredble persistence Sam!'"
                        className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                        required
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all focus:outline-none"
                      >
                        Publish Beacon Note
                      </button>
                    </form>

                    <div className="border-t border-slate-205 border-slate-200 dark:border-slate-800 pt-4 text-xs">
                      <span className="text-[10.5px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 block pb-2 font-bold">Notes currently active in student banner</span>
                      <p className="p-3.5 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/60 rounded-xl italic text-xs font-medium text-slate-700 dark:text-slate-200">&quot;{guardianMessage}&quot;</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 8: SYSTEM VARIABLES & PREFERENCES */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="variables_tweak"
                className="space-y-6 text-left"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calibration preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overrule and tweak variables calculated by style parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Variables panel */}
                  <div className="p-5 bg-slate-50/30 dark:bg-neutral-900/45 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-sm text-slate-805 dark:text-zinc-350 dark:text-slate-100">Attention Vault timings</h3>
                    
                    <div className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-slate-700 dark:text-slate-350 font-bold text-[13px]">Focus Sprint window duration</label>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">{brainProfile.attentionSpan} mins</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          step="5"
                          value={brainProfile.attentionSpan}
                          onChange={(e) => {
                            playFakeBeep();
                            setBrainProfile({ ...brainProfile, attentionSpan: Number(e.target.value) });
                          }}
                          className="w-full h-1.5 accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-slate-700 dark:text-slate-350 font-bold text-[13px]">Rest break duration</label>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">{brainProfile.breakFrequency} mins</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          step="1"
                          value={brainProfile.breakFrequency}
                          onChange={(e) => {
                            playFakeBeep();
                            setBrainProfile({ ...brainProfile, breakFrequency: Number(e.target.value) });
                          }}
                          className="w-full h-1.5 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono pb-2">Custom Schemes Overrule</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        {(['CALM', 'FOCUS', 'ENERGIZE', 'DARK'] as ColorScheme[]).map((scheme) => (
                          <button
                            key={scheme}
                            onClick={() => {
                              playFakeBeep();
                              setBrainProfile({ ...brainProfile, colorScheme: scheme });
                            }}
                            className={`p-2 border rounded-xl font-bold transition-all ${brainProfile.colorScheme === scheme ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-850'}`}
                          >
                            {scheme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Variables panel */}
                  <div className="p-5 bg-slate-50/30 dark:bg-neutral-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-slate-805 dark:text-white">Typography Spacers and Contrast</h3>
                    
                    <div className="space-y-3.5">
                      <div className="space-y-2">
                        <label className="text-slate-700 dark:text-slate-300 font-bold block">Baseline Font sizing profile</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['SMALL', 'MEDIUM', 'LARGE', 'XLARGE'] as FontSize[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                playFakeBeep();
                                setBrainProfile({ ...brainProfile, fontSize: f });
                              }}
                              className={`p-2 border rounded-xl text-xs font-semibold transition-all ${brainProfile.fontSize === f ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-205 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-850'}`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t-2 border-slate-200 dark:border-slate-850">
                        <label className="text-slate-700 dark:text-slate-300 font-bold block">Special Access overlays</label>
                        <div className="space-y-2.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
                            <input
                              type="checkbox"
                              checked={brainProfile.highContrast}
                              onChange={(e) => {
                                playFakeBeep();
                                setBrainProfile({ ...brainProfile, highContrast: e.target.checked });
                              }}
                              className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                            />
                            <span>High Contrast Boldings Overlay</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none">
                            <input
                              type="checkbox"
                              checked={brainProfile.prefersVoiceInput}
                              onChange={(e) => {
                                playFakeBeep();
                                setBrainProfile({ ...brainProfile, prefersVoiceInput: e.target.checked });
                              }}
                              className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                            />
                            <span>Mute warning check alerts (Voice Input Assistance)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* SCREEN 9: DECORATIVE DOPAMINE TOKENS REWARDS STORE */}
            {activeTab === 'rewards' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="rewards_store"
                className="space-y-6 text-left"
              >
                <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dopamine Reward Token Store</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Spend your earned 🪙 Focus Coins to unlock soothing visual skins and cognitive focus boosters!</p>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 px-3.5 py-1.5 rounded-xl">
                    <span className="text-lg font-bold font-sans">🪙</span>
                    <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">{focusCoins} Tokens</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
                  
                  {[
                    { id: 'theme_cosmic', name: 'Cosmic Slate Night Skin', desc: 'Sets a beautiful deeper stellar darkness mode background scheme.', cost: 50, icon: '🌌' },
                    { id: 'sound_forest', name: 'Ambient Rainforest Synth', desc: 'Adds peaceful wet rainforest brown audio tracking triggers.', cost: 75, icon: '🌿' },
                    { id: 'double_spark', name: 'Double Particle Burst Booster', desc: 'Saturates completing actions with 100% extra sparkling particle fireworks!', cost: 100, icon: '❇️' },
                    { id: 'buddy_clara', name: 'Support Bot Clara (ADHD Coach)', desc: 'Unlocks a customized Clara coach AI double companion to send positive logs.', cost: 125, icon: '🤖' }
                  ].map((item) => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const canBuy = focusCoins >= item.cost;
                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                          isUnlocked 
                            ? 'bg-emerald-500/5 border-emerald-300 dark:border-emerald-800/80' 
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-3xl">{item.icon}</span>
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400">
                              {isUnlocked ? 'Unlocked' : `Cost: 🪙 ${item.cost}`}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-xs text-slate-950 dark:text-white uppercase tracking-tight">{item.name}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">{item.desc}</p>
                        </div>

                        <button
                          disabled={isUnlocked || !canBuy}
                          onClick={() => {
                            if (isUnlocked) return;
                            const nextCoins = focusCoins - item.cost;
                            setFocusCoins(nextCoins);
                            localStorage.setItem('focusflow_coins', String(nextCoins));
                            const nextPowerups = [...unlockedItems, item.id];
                            setUnlockedItems(nextPowerups);
                            localStorage.setItem('focusflow_powerups', JSON.stringify(nextPowerups));
                            playFakeBeep(987.77, 'sine', 0.25);
                            triggerCelebration(`Unlocked "${item.name}"! Enjoy your booster. 🎉`);
                          }}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-mono font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                            isUnlocked 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-405 cursor-default border-transparent' 
                              : canBuy 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-transparent text-xs' 
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-250 dark:border-slate-850 text-xs'
                          }`}
                        >
                          {isUnlocked ? '✓ Unlocked' : canBuy ? 'Unlock Item' : 'Need More Coins'}
                        </button>
                      </div>
                    );
                  })}

                </div>

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150/65 dark:border-slate-800 rounded-xl space-y-2 max-w-xl">
                  <h4 className="text-xs font-bold text-indigo-805 dark:text-indigo-350 uppercase font-mono pb-0.5">💡 ADHD Pacing Insight</h4>
                  <p className="text-xs text-slate-805 dark:text-slate-300 font-semibold leading-relaxed">
                    Micro rewards prevent hyperactive focus cycles from crashing into mental exhaustion. Unlocking ambient sounds and custom companion bots establishes immediate, pleasant milestone markers.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

      <footer className="border-t border-slate-300 dark:border-slate-800 py-5 mt-auto bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-mono tracking-wider text-slate-805 dark:text-slate-300 font-bold uppercase select-none">
          FocusFlow Adaptive Learning System • calibrated and structured v2.1
        </div>
      </footer>

      {/* 4. Full screen background Particle Physics Canvas overlay */}
      <canvas ref={particleCanvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* 2. Intrusive Idea Floating Scratchpad Widget */}
      {brainProfile.primaryType !== 'NONE' && (
        <div className="fixed bottom-6 right-6 z-40 select-none">
          <AnimatePresence>
            {showScratchpad && (
              <motion.div
                initial={{ opacity: 0, y: 35, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-80 md:w-96 mb-3 space-y-4 text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Brain Dump Scratchpad</span>
                  </div>
                  <button
                    onClick={() => { playFakeBeep(); setShowScratchpad(false); }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold rounded-lg"
                  >
                    ×
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Sudden tangents and ideas can steal your executive momentum. Clear your mind by writing them down here so you can drift back to focus.
                </p>

                {/* Input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!scratchInput.trim()) return;
                    
                    const newIdea = {
                      id: Math.random().toString(36).substr(2, 9),
                      content: scratchInput,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };

                    const updated = [newIdea, ...intrusiveIdeas];
                    setIntrusiveIdeas(updated);
                    localStorage.setItem('focusflow_intrusive_ideas', JSON.stringify(updated));

                    setScratchInput('');
                    setScratchFeedback("Gently holding this idea for you. Let's drift back.");
                    playFakeBeep(523.25, 'triangle', 0.25);
                    
                    setTimeout(() => {
                      setScratchFeedback(null);
                    }, 4000);
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scratchInput}
                      onChange={(e) => setScratchInput(e.target.value)}
                      placeholder="e.g. 'Must research robotic bees right now!'"
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-400 font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {scratchFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40"
                    >
                      {scratchFeedback}
                    </motion.div>
                  )}
                </form>

                {/* Saved list scrollboard */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {intrusiveIdeas.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-[11px] font-semibold italic">
                      Zero thoughts parked. Brain is clear!
                    </div>
                  ) : (
                    intrusiveIdeas.map((idea) => (
                      <motion.div
                        key={idea.id}
                        layout
                        className="p-2.5 bg-amber-50/40 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 space-y-0.5">
                          <p className="text-slate-800 dark:text-slate-200 font-semibold">{idea.content}</p>
                          <span className="text-[8px] font-mono font-bold text-slate-400">{idea.timestamp}</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              playFakeBeep(440, 'triangle', 0.15);
                              setTaskInput(idea.content);
                              setComplexity(6);
                              setActiveTab('tasks');
                              setShowScratchpad(false);
                            }}
                            className="text-[8.5px] px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-955 dark:hover:bg-amber-900/60 dark:text-amber-400 font-bold rounded-lg cursor-pointer transition-all"
                            title="Deconstruct into achievable subtasks"
                          >
                            🎯 Breakdown
                          </button>
                          <button
                            onClick={() => {
                              playFakeBeep(330, 'sine', 0.08);
                              const updated = intrusiveIdeas.filter(i => i.id !== idea.id);
                              setIntrusiveIdeas(updated);
                              localStorage.setItem('focusflow_intrusive_ideas', JSON.stringify(updated));
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                            title="Dismiss thought"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Button */}
          <button
            onClick={() => { playFakeBeep(400, 'sine', 0.1); setShowScratchpad(!showScratchpad); }}
            className={`px-4 py-3 rounded-full flex items-center gap-2 shadow-xl border select-none cursor-pointer font-bold text-xs tracking-wider uppercase transition-all ${
              showScratchpad
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-amber-400 hover:scale-105'
            }`}
          >
            <StickyNote className={`w-4.5 h-4.5 ${showScratchpad ? 'rotate-12' : ''}`} />
            <span>Brain Dump</span>
            <span className="hidden sm:inline bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-400 dark:text-slate-500 font-mono">CTRL+B</span>
          </button>
        </div>
      )}

    </div>
  );
}

export default function CorePage() {
  return (
    <AdaptiveProvider>
      <AppLayout />
    </AdaptiveProvider>
  );
}
