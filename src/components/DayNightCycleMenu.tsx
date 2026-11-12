import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Sparkles,
  Check,
  Play,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';
import {
  ThemeMode,
  getCurrentDayPhase,
  formatThaiClockTime,
  getDayProgressPercentage,
  getNextTransitionInfo,
  DAY_PHASES,
} from '../utils/dayNightCycle.ts';

interface DayNightCycleMenuProps {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  onPreviewTransition: () => void;
  onClose?: () => void;
}

export const DayNightCycleMenu: React.FC<DayNightCycleMenuProps> = ({
  theme,
  themeMode,
  onSelectThemeMode,
  onPreviewTransition,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const phase = getCurrentDayPhase(currentTime);
  const timeProgress = getDayProgressPercentage(currentTime);
  const nextInfo = getNextTransitionInfo(currentTime);

  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');
  const clockDisplay = `${formatThaiClockTime(currentTime).replace(' น.', '')}:${secondsStr} น.`;

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-slate-800 dark:text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>วัฏจักรกลางวัน / กลางคืน</span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-full">
                Day/Night
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              สลับธีมอัตโนมัติตามช่วงเวลาจริงของวัน
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Current Phase Card */}
      <div
        className={`p-3.5 rounded-2xl border bg-gradient-to-br ${phase.accentBg} ${phase.accentBorder} space-y-2 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow-sm">{phase.icon}</span>
            <div>
              <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{phase.name}</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {phase.subTitle} · ({phase.timeRange})
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
              {clockDisplay}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              เวลาท้องถิ่น
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          {phase.description}
        </p>

        {/* 24-Hour Timeline Bar with glowing current time pin */}
        <div className="space-y-1 pt-1.5">
          <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
            <span>00:00 (คืน)</span>
            <span>06:00 (เช้า)</span>
            <span>12:00 (เที่ยง)</span>
            <span>18:00 (ค่ำ)</span>
            <span>24:00</span>
          </div>

          <div className="relative w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700">
            {/* Background 4-Phase zones */}
            <div className="absolute inset-0 flex">
              <div className="w-[25%] bg-indigo-950/40" title="00:00-06:00 โหมดมืด" />
              <div className="w-[25%] bg-amber-300/40" title="06:00-12:00 โหมดสว่าง" />
              <div className="w-[25%] bg-sky-300/40" title="12:00-18:00 โหมดสว่าง" />
              <div className="w-[25%] bg-indigo-950/40" title="18:00-24:00 โหมดมืด" />
            </div>

            {/* Glowing Current Time Pin */}
            <div
              className="absolute top-0 bottom-0 w-2.5 -ml-1.25 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)] border border-white z-10 transition-all duration-300"
              style={{ left: `${Math.max(2, Math.min(98, timeProgress))}%` }}
              title={`เวลาปัจจุบัน: ${formatThaiClockTime(currentTime)}`}
            />
          </div>

          {themeMode === 'auto' && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Clock className="w-3 h-3" />
                <span>เปลี่ยนสู่ {nextInfo.targetThemeName}</span>
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                อีก {nextInfo.hoursRemaining > 0 ? `${nextInfo.hoursRemaining} ชม. ` : ''}
                {nextInfo.minutesRemaining} นาที ({nextInfo.nextTimeString})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Theme Modes Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          เลือกโหมดการทำงานของธีม:
        </label>

        <div className="grid grid-cols-1 gap-2">
          {/* Mode 1: Auto Day/Night Cycle */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('auto')}
            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              themeMode === 'auto'
                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>อัตโนมัติตามช่วงเวลาจริง</span>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                    แนะนำ
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  สว่างตอนกลางวัน (06:00-18:00) และมืดตอนกลางคืนอัตโนมัติ
                </div>
              </div>
            </div>

            {themeMode === 'auto' && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* Mode 2: Always Light */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('light')}
            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              themeMode === 'light'
                ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/30'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  โหมดสว่างคงที่ (Always Light)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  คงธีมสว่างไว้ตลอดเวลา ไม่เปลี่ยนตามเวลา
                </div>
              </div>
            </div>

            {themeMode === 'light' && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* Mode 3: Always Dark */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('dark')}
            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              themeMode === 'dark'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 dark:bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  โหมดมืดคงที่ (Always Dark)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  คงธีมมืดถนอมสายตาไว้ตลอดเวลา
                </div>
              </div>
            </div>

            {themeMode === 'dark' && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Preview Transition Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          ทดสอบความนุ่มนวลของจอ:
        </span>
        <button
          type="button"
          onClick={onPreviewTransition}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ทดสอบเอฟเฟกต์เปลี่ยนผ่าน</span>
        </button>
      </div>
    </div>
  );
};
