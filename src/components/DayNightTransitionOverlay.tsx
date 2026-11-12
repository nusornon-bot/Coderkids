import React, { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles, Clock } from 'lucide-react';
import { getCurrentDayPhase, formatThaiClockTime } from '../utils/dayNightCycle.ts';

export interface TransitionPayload {
  toTheme: 'light' | 'dark';
  reason?: 'auto' | 'manual';
  timestamp?: number;
}

interface DayNightTransitionOverlayProps {
  transitionEvent: TransitionPayload | null;
  onTransitionEnd?: () => void;
}

export const DayNightTransitionOverlay: React.FC<DayNightTransitionOverlayProps> = ({
  transitionEvent,
  onTransitionEnd,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animStage, setAnimStage] = useState<'enter' | 'active' | 'exit'>('enter');
  const [currentEvent, setCurrentEvent] = useState<TransitionPayload | null>(null);

  useEffect(() => {
    if (!transitionEvent) return;

    setCurrentEvent(transitionEvent);
    setIsVisible(true);
    setAnimStage('enter');

    // Add transitioning class to document to smoothly crossfade all backgrounds & text
    document.documentElement.classList.add('theme-transitioning');

    const activeTimer = setTimeout(() => {
      setAnimStage('active');
    }, 50);

    const exitTimer = setTimeout(() => {
      setAnimStage('exit');
    }, 850);

    const cleanupTimer = setTimeout(() => {
      setIsVisible(false);
      document.documentElement.classList.remove('theme-transitioning');
      if (onTransitionEnd) onTransitionEnd();
    }, 1250);

    return () => {
      clearTimeout(activeTimer);
      clearTimeout(exitTimer);
      clearTimeout(cleanupTimer);
      document.documentElement.classList.remove('theme-transitioning');
    };
  }, [transitionEvent, onTransitionEnd]);

  if (!isVisible || !currentEvent) return null;

  const isDay = currentEvent.toTheme === 'light';
  const phase = getCurrentDayPhase();
  const timeStr = formatThaiClockTime();

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex flex-col items-center justify-start pt-16 sm:pt-20 transition-opacity duration-500 ${
        animStage === 'enter'
          ? 'opacity-0'
          : animStage === 'active'
          ? 'opacity-100'
          : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Ambient Radial Waves Glow */}
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-out transform ${
          animStage === 'enter' ? 'scale-75 opacity-0' : animStage === 'active' ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
        }`}
        style={{
          background: isDay
            ? 'radial-gradient(circle at 50% 25%, rgba(251, 191, 36, 0.38) 0%, rgba(249, 115, 22, 0.22) 40%, rgba(255, 255, 255, 0.45) 85%)'
            : 'radial-gradient(circle at 50% 25%, rgba(99, 102, 241, 0.42) 0%, rgba(30, 27, 75, 0.55) 45%, rgba(2, 6, 23, 0.7) 90%)',
        }}
      />

      {/* Floating Ambient Sun/Moon Aura Circle */}
      <div
        className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center transition-all duration-700 ${
          animStage === 'enter'
            ? 'scale-50 opacity-0 -translate-y-8'
            : animStage === 'active'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 -translate-y-4'
        } ${
          isDay
            ? 'bg-gradient-to-br from-amber-300/80 via-orange-400/70 to-yellow-200/90 shadow-[0_0_80px_rgba(251,191,36,0.6)]'
            : 'bg-gradient-to-br from-indigo-500/80 via-purple-700/80 to-slate-900/90 shadow-[0_0_80px_rgba(99,102,241,0.6)]'
        }`}
      >
        <div className="absolute inset-2 rounded-full border border-white/40 animate-ping opacity-40 duration-1000" />
        {isDay ? (
          <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-[0_4px_12px_rgba(217,119,6,0.8)] animate-spin-slow" />
        ) : (
          <Moon className="w-16 h-16 sm:w-20 sm:h-20 text-amber-200 drop-shadow-[0_4px_12px_rgba(99,102,241,0.8)]" />
        )}
      </div>

      {/* Floating Toast Notification Pill */}
      <div
        className={`relative mt-6 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-500 max-w-sm sm:max-w-md text-center flex items-center gap-3 ${
          animStage === 'enter'
            ? 'scale-90 opacity-0 translate-y-4'
            : animStage === 'active'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 -translate-y-2'
        } ${
          isDay
            ? 'bg-white/90 dark:bg-slate-900/90 border-amber-300 text-slate-800 shadow-amber-500/20'
            : 'bg-slate-900/90 border-indigo-500/60 text-white shadow-indigo-500/30'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDay ? 'bg-amber-100 text-amber-600' : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
          }`}
        >
          {isDay ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </div>

        <div className="text-left flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black">
              {isDay ? '🌅 สลับเป็นโหมดสว่าง (Day Mode)' : '🌙 สลับเป็นโหมดมืด (Night Mode)'}
            </span>
            {currentEvent.reason === 'auto' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>อัตโนมัติตามเวลา</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-2">
            <span>{phase.name} · {timeStr}</span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{isDay ? 'สดใส พร้อมเรียนรู้' : 'ถนอมสายตายามค่ำคืน'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
