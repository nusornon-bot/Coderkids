import React from 'react';
import {
  Award,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  computeOverallModuleProgressSummary,
  type ModuleProgressKey,
  type ModuleProgressState,
} from '../utils/moduleProgressSummary.ts';

interface OverallModuleProgressBarProps {
  moduleProgress: ModuleProgressState;
  onNavigate: (moduleKey: string, subSection?: string) => void;
  onOpenCertificate?: () => void;
}

const MODULE_STYLES: Record<
  ModuleProgressKey,
  {
    icon: React.ReactNode;
    barDone: string;
    cardDone: string;
    cardNext: string;
    labelDone: string;
    labelNext: string;
  }
> = {
  safety: {
    icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    barDone: 'bg-emerald-500',
    cardDone:
      'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400',
    cardNext:
      'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/15 hover:border-emerald-500',
    labelDone: 'text-emerald-700 dark:text-emerald-300',
    labelNext: 'text-emerald-600 dark:text-emerald-400',
  },
  thinking: {
    icon: <Brain className="w-4 h-4 shrink-0" />,
    barDone: 'bg-sky-500',
    cardDone:
      'bg-sky-50/70 dark:bg-sky-950/35 border-sky-300 dark:border-sky-700 hover:border-sky-400',
    cardNext:
      'bg-white dark:bg-slate-900 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/15 hover:border-sky-500',
    labelDone: 'text-sky-700 dark:text-sky-300',
    labelNext: 'text-sky-600 dark:text-sky-400',
  },
  codingLab: {
    icon: <Code2 className="w-4 h-4 shrink-0" />,
    barDone: 'bg-indigo-500',
    cardDone:
      'bg-indigo-50/70 dark:bg-indigo-950/35 border-indigo-300 dark:border-indigo-700 hover:border-indigo-400',
    cardNext:
      'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/15 hover:border-indigo-500',
    labelDone: 'text-indigo-700 dark:text-indigo-300',
    labelNext: 'text-indigo-600 dark:text-indigo-400',
  },
  showcase: {
    icon: <Award className="w-4 h-4 shrink-0" />,
    barDone: 'bg-purple-500',
    cardDone:
      'bg-purple-50/70 dark:bg-purple-950/35 border-purple-300 dark:border-purple-700 hover:border-purple-400',
    cardNext:
      'bg-white dark:bg-slate-900 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/15 hover:border-purple-500',
    labelDone: 'text-purple-700 dark:text-purple-300',
    labelNext: 'text-purple-600 dark:text-purple-400',
  },
};

export const OverallModuleProgressBar: React.FC<OverallModuleProgressBarProps> = ({
  moduleProgress,
  onNavigate,
  onOpenCertificate,
}) => {
  const summary = computeOverallModuleProgressSummary(moduleProgress);

  return (
    <section
      aria-label="แถบความคืบหน้ารวมทั้ง 4 โมดูล"
      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4"
    >
      {/* หัวข้อสรุปความคืบหน้าและปุ่มไปต่อ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>ความคืบหน้ารวม 4 โมดูลหลัก</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
              ผ่านแล้ว {summary.completedCount} / {summary.totalCount} โมดูล
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
            {summary.encouragementText}
          </h2>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white leading-none">
              {summary.progressPercent}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              ภาพรวมหลักสูตร
            </div>
          </div>

          {summary.isAllCompleted && onOpenCertificate ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                onOpenCertificate();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>รับเกียรติบัตร</span>
            </button>
          ) : summary.nextModuleKey ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                onNavigate(summary.nextModuleKey!);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>เรียนโมดูลถัดไป</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : null}
        </div>
      </div>

      {/* แถบ Progress Bar รวมแบบแบ่ง 4 จังหวะชัดเจน */}
      <div className="space-y-2">
        <div
          role="progressbar"
          aria-label="ความคืบหน้ารวมทั้ง 4 โมดูล"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.progressPercent}
          className="relative w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700/80"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${summary.progressPercent}%` }}
          />
          {/* เส้นแบ่งสัดส่วน 25% / 50% / 75% ให้เด็กๆ เห็นชัดทั้ง 4 ช่วง */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid grid-cols-4"
          >
            <div className="border-r border-white/70 dark:border-slate-900/70" />
            <div className="border-r border-white/70 dark:border-slate-900/70" />
            <div className="border-r border-white/70 dark:border-slate-900/70" />
            <div />
          </div>
        </div>
      </div>

      {/* แถวสถานะย่อยของโมดูลทั้ง 4 กดเข้าไปเรียนได้ทันที */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {summary.modules.map((mod) => {
          const style = MODULE_STYLES[mod.key];
          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => {
                soundEffects.play('click');
                onNavigate(mod.key);
              }}
              className={`group p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                mod.done
                  ? style.cardDone
                  : mod.isNextUp
                  ? style.cardNext
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* แถบสีประจำโมดูลด้านบนการ์ด */}
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    mod.done
                      ? style.barDone
                      : mod.isNextUp
                      ? `${style.barDone} opacity-45 w-1/2`
                      : 'w-0'
                  }`}
                  style={mod.done ? { width: '100%' } : undefined}
                />
              </div>

              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tabular-nums ${
                    mod.done
                      ? style.labelDone
                      : mod.isNextUp
                      ? style.labelNext
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {style.icon}
                  <span>โมดูล {mod.shortNum}</span>
                </span>

                {mod.done ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ผ่านแล้ว</span>
                  </span>
                ) : mod.isNextUp ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span>ถัดไป</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>รอเรียน</span>
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {mod.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {mod.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
