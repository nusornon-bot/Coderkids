import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Printer,
  Trophy,
  Timer,
  CheckCircle2,
  Play,
  ArrowRight,
  BookOpen,
  X,
  FileCheck,
  Shuffle,
  SlidersHorizontal,
  Database,
  Eye,
  EyeOff,
  RotateCcw,
  Pause,
  AlertTriangle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.ts';
import confetti from 'canvas-confetti';
import {
  BUILTIN_BATTLE_QUESTIONS,
  BattleDifficultyFilter,
  BattleQuestionItem,
  DIFFICULTY_META,
} from '../data/battleQuestionBank.ts';
import {
  SmartExamGrade,
  SmartExamQuestion,
  SmartExamSource,
  THAI_CHOICE_LABELS,
  computeExamDurationSeconds,
  formatCountdownClock,
  formatThaiChoiceOption,
  generateSmartExamSet,
  getDifficultyPoolBreakdown,
  getEligibleSmartExamPoolCount,
  getTimerUrgencyLevel,
} from '../utils/smartExamGenerator.ts';
import {
  isCloudFirestoreReadyForUser,
  listBattleQuestionsFromFirestore,
} from '../services/firestoreService.ts';

interface SmartExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  onRewardPoints?: (points: number, reason: string) => void;
}

const LOCAL_CUSTOM_BANK_KEY = 'coderkids_battle_custom_questions_v1';

function loadLocalCustomBattleQuestions(): BattleQuestionItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q) =>
        q &&
        typeof q.id === 'string' &&
        (q.platform === 'Scratch' || q.platform === 'Micro:bit') &&
        (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') &&
        Array.isArray(q.options) &&
        q.options.length === 4
    );
  } catch {
    return [];
  }
}

export const SmartExamGeneratorModal: React.FC<SmartExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  studentName = 'กวินทร์ แสนดี',
  onRewardPoints,
}) => {
  // Exam generator configuration state
  const [selectedSource, setSelectedSource] = useState<SmartExamSource>('mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BattleDifficultyFilter>('all');
  const [selectedGrade, setSelectedGrade] = useState<SmartExamGrade>('ทั้งหมด');
  const [examType, setExamType] = useState<'online' | 'print'>('online');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMode, setDurationMode] = useState<'auto' | number>('auto');
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [showPrintAnswerKey, setShowPrintAnswerKey] = useState<boolean>(false);
  const [drawSeed, setDrawSeed] = useState<number>(1);

  // Synced custom questions from local & Firestore battle question bank
  const [cloudQuestions, setCloudQuestions] = useState<BattleQuestionItem[]>([]);
  const [localQuestions, setLocalQuestions] = useState<BattleQuestionItem[]>(() =>
    loadLocalCustomBattleQuestions()
  );

  // Generated active exam set
  const [examQuestions, setExamQuestions] = useState<SmartExamQuestion[]>([]);

  // Online exam state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(600);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [didTimeExpire, setDidTimeExpire] = useState(false);

  // Load latest custom questions whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLocalQuestions(loadLocalCustomBattleQuestions());
    if (!isCloudFirestoreReadyForUser()) return;

    let cancelled = false;
    listBattleQuestionsFromFirestore()
      .then((records) => {
        if (!cancelled && Array.isArray(records)) {
          setCloudQuestions(records);
        }
      })
      .catch(() => {
        // Fallback silently to built-in + local bank
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Combined battle question bank (built-in 144 + custom cloud/local)
  const combinedBattleBank = useMemo<BattleQuestionItem[]>(() => {
    const map = new Map<string, BattleQuestionItem>();
    for (const q of BUILTIN_BATTLE_QUESTIONS) map.set(q.id, q);
    for (const q of localQuestions) map.set(q.id, q);
    for (const q of cloudQuestions) map.set(q.id, q);
    return Array.from(map.values());
  }, [localQuestions, cloudQuestions]);

  const scratchBankCount = useMemo(
    () => combinedBattleBank.filter((q) => q.platform === 'Scratch').length,
    [combinedBattleBank]
  );
  const microbitBankCount = useMemo(
    () => combinedBattleBank.filter((q) => q.platform === 'Micro:bit').length,
    [combinedBattleBank]
  );

  // Pool counts per difficulty level for the Difficulty dropdown
  const difficultyPoolCounts = useMemo(
    () =>
      getDifficultyPoolBreakdown({
        source: selectedSource,
        grade: selectedGrade,
        battleBank: combinedBattleBank,
      }),
    [selectedSource, selectedGrade, combinedBattleBank]
  );

  // Maximum available questions for the selected source + difficulty/grade filter
  const eligiblePoolCount = useMemo(
    () =>
      getEligibleSmartExamPoolCount({
        source: selectedSource,
        difficulty: selectedDifficulty,
        grade: selectedGrade,
        battleBank: combinedBattleBank,
      }),
    [selectedSource, selectedDifficulty, selectedGrade, combinedBattleBank]
  );

  const effectiveQuestionCount = useMemo(() => {
    if (eligiblePoolCount <= 0) return 1;
    return Math.max(1, Math.min(questionCount, eligiblePoolCount));
  }, [questionCount, eligiblePoolCount]);

  const configuredDurationSeconds = useMemo(
    () => computeExamDurationSeconds(effectiveQuestionCount, durationMode),
    [effectiveQuestionCount, durationMode]
  );

  // Regenerate randomized exam whenever filters, questionCount, bank, or drawSeed changes
  useEffect(() => {
    if (!isOpen) return;
    const generated = generateSmartExamSet({
      source: selectedSource,
      difficulty: selectedDifficulty,
      grade: selectedGrade,
      questionCount: effectiveQuestionCount,
      shuffleOptions,
      battleBank: combinedBattleBank,
    });
    const nextDuration = computeExamDurationSeconds(generated.length, durationMode);
    setExamQuestions(generated);
    setCurrentQIndex(0);
    setUserAnswers({});
    setIsExamFinished(false);
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setDidTimeExpire(false);
    setTotalDurationSeconds(nextDuration);
    setTimeLeft(nextDuration);
  }, [
    isOpen,
    selectedSource,
    selectedDifficulty,
    selectedGrade,
    effectiveQuestionCount,
    shuffleOptions,
    combinedBattleBank,
    drawSeed,
  ]);

  // Keep preview duration synced when teacher/student changes timer limit before starting
  useEffect(() => {
    if (!isTimerActive && !isExamFinished) {
      const nextDuration = computeExamDurationSeconds(
        examQuestions.length || effectiveQuestionCount,
        durationMode
      );
      setTotalDurationSeconds(nextDuration);
      setTimeLeft(nextDuration);
    }
  }, [durationMode, examQuestions.length, effectiveQuestionCount, isTimerActive, isExamFinished]);

  const calculateScore = useCallback(
    (questions: SmartExamQuestion[], answers: Record<number, number>) => {
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) correct++;
      });
      return correct;
    },
    []
  );

  const sourceTitle = useMemo(() => {
    if (selectedSource === 'Scratch') return 'คลังข้อสอบ Scratch';
    if (selectedSource === 'Micro:bit') return 'คลังข้อสอบ Micro:bit';
    if (selectedSource === 'mixed') return 'แบบผสม Scratch + Micro:bit';
    return `ตัวชี้วัด ว 4.2 (${selectedGrade})`;
  }, [selectedSource, selectedGrade]);

  const handleFinishExam = useCallback(
    (expired = false) => {
      setIsTimerActive(false);
      setIsTimerPaused(false);
      setIsExamFinished(true);
      setDidTimeExpire(expired);
      soundEffects.play(expired ? 'error' : 'victory');
      if (!expired) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }

      const correct = calculateScore(examQuestions, userAnswers);
      if (onRewardPoints && examQuestions.length > 0) {
        onRewardPoints(
          correct * 10,
          `สอบสุ่มข้อสอบ ${sourceTitle} ได้ ${correct}/${examQuestions.length}`
        );
      }
    },
    [calculateScore, examQuestions, userAnswers, onRewardPoints, sourceTitle]
  );

  // Timer countdown with audio ticks for final warnings
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isTimerActive && !isTimerPaused && timeLeft > 0 && !isExamFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 60 || next === 30 || (next > 0 && next <= 10)) {
            soundEffects.play('tick');
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive && !isExamFinished) {
      handleFinishExam(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerActive, isTimerPaused, timeLeft, isExamFinished, handleFinishExam]);

  if (!isOpen) return null;

  const currentQ = examQuestions[currentQIndex] || examQuestions[0];

  const handleRerollExam = () => {
    soundEffects.play('click');
    setDrawSeed((s) => s + 1);
  };

  const handleStartExam = (rerollFirst = false) => {
    soundEffects.play('click');
    let nextQuestions = examQuestions;
    if (rerollFirst || examQuestions.length === 0) {
      nextQuestions = generateSmartExamSet({
        source: selectedSource,
        difficulty: selectedDifficulty,
        grade: selectedGrade,
        questionCount: effectiveQuestionCount,
        shuffleOptions,
        battleBank: combinedBattleBank,
      });
      setExamQuestions(nextQuestions);
    }
    const nextDuration = computeExamDurationSeconds(nextQuestions.length, durationMode);
    setCurrentQIndex(0);
    setUserAnswers({});
    setIsExamFinished(false);
    setDidTimeExpire(false);
    setIsTimerPaused(false);
    setTotalDurationSeconds(nextDuration);
    setTimeLeft(nextDuration);
    setIsTimerActive(true);
  };

  const handleSelectAnswer = (ansIdx: number) => {
    if (isTimerPaused) return;
    setUserAnswers((prev) => ({ ...prev, [currentQIndex]: ansIdx }));
    soundEffects.play('click');
  };

  const timerRatio = totalDurationSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalDurationSeconds)) : 0;
  const timerPercent = Math.round(timerRatio * 100);
  const timerUrgency = getTimerUrgencyLevel(timeLeft, totalDurationSeconds);
  const elapsedSeconds = Math.max(0, totalDurationSeconds - timeLeft);
  const remainingQuestionsCount = Math.max(1, examQuestions.length - Object.keys(userAnswers).length);
  const paceSecondsPerRemaining = Math.round(timeLeft / remainingQuestionsCount);
  const isActivelyTakingOnlineExam = examType === 'online' && isTimerActive && !isExamFinished;

  // SVG circular gauge geometry
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - timerRatio);

  const urgencyStyles =
    timerUrgency === 'critical'
      ? {
          container: 'bg-rose-950/50 border-rose-500/70 shadow-lg shadow-rose-950/50',
          clockText: 'text-rose-300',
          barFill: 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500',
          ringStroke: '#f43f5e',
          badge: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
          badgeText: '⚠️ เหลือเวลาไม่มาก! เร่งตรวจคำตอบ',
        }
      : timerUrgency === 'warning'
      ? {
          container: 'bg-amber-950/35 border-amber-500/50 shadow-md shadow-amber-950/30',
          clockText: 'text-amber-300',
          barFill: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400',
          ringStroke: '#f59e0b',
          badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
          badgeText: '⏱️ เหลือเวลาน้อยกว่าครึ่งหนึ่งแล้ว',
        }
      : {
          container: 'bg-slate-950/95 border-cyan-500/40 shadow-md shadow-cyan-950/30',
          clockText: 'text-cyan-300',
          barFill: 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400',
          ringStroke: '#22d3ee',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          badgeText: 'กำลังจับเวลาสอบจริง',
        };

  const handlePrint = () => {
    soundEffects.play('click');
    window.print();
  };

  const score = calculateScore(examQuestions, userAnswers);
  const answeredCount = Object.keys(userAnswers).length;
  const presetCounts = selectedSource === 'standard' ? [3, 5, 8] : [5, 10, 15, 20, 30];

  const examPlatformSummary = useMemo(() => {
    let scratch = 0;
    let microbit = 0;
    let standard = 0;
    for (const q of examQuestions) {
      if (q.platform === 'Scratch') scratch++;
      else if (q.platform === 'Micro:bit') microbit++;
      else standard++;
    }
    return { scratch, microbit, standard };
  }, [examQuestions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto print:bg-white print:p-0 print:static">
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border border-indigo-500/30 text-white shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-0 print:rounded-none print:max-w-none print:bg-white print:text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                  ระบบสุ่มชุดข้อสอบ Smart Exam &amp; พิมพ์กระดาษคำตอบ A4
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  คลัง {combinedBattleBank.length} ข้อ
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                สุ่มข้อสอบ Scratch / Micro:bit / แบบผสม ตามจำนวนข้อและระดับความยากที่ระบุได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isActivelyTakingOnlineExam && (
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-black text-sm ${
                  timerUrgency === 'critical'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                    : timerUrgency === 'warning'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>{formatCountdownClock(timeLeft)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Always-Visible Visual Countdown Banner during Active Exam Session */}
        {isActivelyTakingOnlineExam ? (
          <div
            className={`px-5 sm:px-6 py-3.5 border-b transition-colors print:hidden ${urgencyStyles.container}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Circular SVG Ring + Large Digital Countdown Clock */}
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                    <circle
                      cx="28"
                      cy="28"
                      r={ringRadius}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth="5"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r={ringRadius}
                      fill="none"
                      stroke={urgencyStyles.ringStroke}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                      className="transition-all duration-700 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-mono font-black text-white">
                    {timerPercent}%
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none ${
                        urgencyStyles.clockText
                      } ${timerUrgency === 'critical' && !isTimerPaused ? 'animate-pulse' : ''}`}
                    >
                      {formatCountdownClock(timeLeft)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${urgencyStyles.badge}`}
                    >
                      {isTimerPaused ? '⏸️ หยุดพักเวลาชั่วคราว' : urgencyStyles.badgeText}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>
                      ข้อที่ <strong className="text-white font-mono">{currentQIndex + 1}/{examQuestions.length}</strong>
                    </span>
                    <span>
                      ตอบแล้ว <strong className="text-emerald-300 font-mono">{answeredCount}/{examQuestions.length}</strong>
                    </span>
                    <span>
                      เฉลี่ยคงเหลือ <strong className="text-cyan-200 font-mono">~{paceSecondsPerRemaining} วิ/ข้อ</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Pause/Resume & Early Submit Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setIsTimerPaused((p) => !p);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isTimerPaused
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                      : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isTimerPaused ? 'นับเวลาต่อ' : 'พักเวลา'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishExam(false)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  ส่งคำตอบเลย
                </button>
              </div>
            </div>

            {/* Smooth Horizontal Visual Countdown Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="h-2.5 w-full rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-linear ${urgencyStyles.barFill}`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>ใช้เวลาไปแล้ว {formatCountdownClock(elapsedSeconds)}</span>
                <span>เวลาทั้งหมด {formatCountdownClock(totalDurationSeconds)}</span>
              </div>
            </div>
          </div>
        ) : (
        /* Configuration Bar */
        <div className="px-5 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 space-y-3 print:hidden">
          {/* Row 1: Platform / Source Selector + Online/Print Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>ชุดข้อสอบ:</span>
              </span>
              {(
                [
                  {
                    id: 'mixed',
                    label: `🔀 แบบผสม (${combinedBattleBank.length})`,
                  },
                  {
                    id: 'Scratch',
                    label: `🐱 Scratch (${scratchBankCount})`,
                  },
                  {
                    id: 'Micro:bit',
                    label: `🤖 Micro:bit (${microbitBankCount})`,
                  },
                  {
                    id: 'standard',
                    label: '📚 ตัวชี้วัด ป.4–ป.6',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setSelectedSource(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedSource === item.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setExamType('online');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  examType === 'online'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>สอบออนไลน์จับเวลา</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setExamType('print');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  examType === 'print'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ข้อสอบ A4</span>
              </button>
            </div>
          </div>

          {/* Row 2: Difficulty Dropdown + Grade Filter (when standard) + Question Count + Reroll */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            {/* Difficulty Dropdown (All / Easy / Medium / Hard) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor="smart-exam-difficulty-select"
                className="text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>ความยาก (Difficulty):</span>
              </label>

              <div className="relative">
                <select
                  id="smart-exam-difficulty-select"
                  aria-label="Difficulty"
                  value={selectedDifficulty}
                  onChange={(e) => {
                    soundEffects.play('click');
                    setSelectedDifficulty(e.target.value as BattleDifficultyFilter);
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-amber-400/50 text-xs font-bold text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 cursor-pointer transition"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    🎯 ทุกระดับ / All ({difficultyPoolCounts.all} ข้อ)
                  </option>
                  <option
                    value="easy"
                    disabled={difficultyPoolCounts.easy === 0}
                    className="bg-slate-900 text-emerald-300"
                  >
                    🟢 ง่าย / Easy ({difficultyPoolCounts.easy} ข้อ)
                  </option>
                  <option
                    value="medium"
                    disabled={difficultyPoolCounts.medium === 0}
                    className="bg-slate-900 text-amber-300"
                  >
                    🟡 ปานกลาง / Medium ({difficultyPoolCounts.medium} ข้อ)
                  </option>
                  <option
                    value="hard"
                    disabled={difficultyPoolCounts.hard === 0}
                    className="bg-slate-900 text-rose-300"
                  >
                    🔴 ยาก / Hard ({difficultyPoolCounts.hard} ข้อ)
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-300 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {selectedSource === 'standard' && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <span className="text-xs font-bold text-slate-400">ชั้น:</span>
                  {(['ทั้งหมด', 'ป.4', 'ป.5', 'ป.6'] as const).map((gr) => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setSelectedGrade(gr);
                        setSelectedDifficulty('all');
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedGrade === gr
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {gr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Question Count Selector + Custom Input + Reroll */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">จำนวนข้อ:</span>
              {presetCounts.map((preset) => {
                const disabled = preset > eligiblePoolCount;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      soundEffects.play('click');
                      setQuestionCount(preset);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                      effectiveQuestionCount === preset
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <span>ระบุเอง:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, eligiblePoolCount)}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (Number.isNaN(val)) {
                      setQuestionCount(1);
                    } else {
                      setQuestionCount(Math.max(1, Math.min(val, Math.max(1, eligiblePoolCount))));
                    }
                  }}
                  aria-label="กำหนดจำนวนข้อสอบที่จะสุ่ม"
                  className="w-12 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[11px] text-slate-400">/ {eligiblePoolCount}</span>
              </label>

              <button
                type="button"
                onClick={handleRerollExam}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="สุ่มชุดข้อสอบใหม่จากคลังตามจำนวนข้อที่ระบุ"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>สุ่มชุดใหม่</span>
              </button>
            </div>
          </div>

          {/* Row 3: Exam Time Limit Selector (Online Mode) + Shuffle options + Draw summary */}
          {examType === 'online' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ตั้งเวลาสอบ (Countdown):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setDurationMode('auto');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    durationMode === 'auto'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  อัตโนมัติ ({Math.round(computeExamDurationSeconds(effectiveQuestionCount, 'auto') / 60)} น.)
                </button>
                {[3, 5, 10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      soundEffects.play('click');
                      setDurationMode(mins);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      durationMode === mins
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mins} นาที
                  </button>
                ))}
                <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={Math.round(configuredDurationSeconds / 60)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) {
                        setDurationMode(Math.max(1, Math.min(90, v)));
                      }
                    }}
                    aria-label="กำหนดเวลาสอบเป็นนาที"
                    className="w-11 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-400">นาที</span>
                </label>
              </div>
            </div>
          )}

          {/* Row 4: Shuffle options toggle & current draw summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span>สุ่มสลับลำดับตัวเลือก ก–ง ทุกครั้งที่สุ่มชุดข้อสอบ</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-semibold">
                สุ่มได้ {examQuestions.length} ข้อ (ชุดที่ #{drawSeed})
              </span>
              {examPlatformSummary.scratch > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 font-semibold">
                  🐱 Scratch: {examPlatformSummary.scratch}
                </span>
              )}
              {examPlatformSummary.microbit > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                  🤖 Micro:bit: {examPlatformSummary.microbit}
                </span>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[68vh] print:max-h-none print:overflow-visible print:p-0">
          {examType === 'online' ? (
            !isTimerActive && !isExamFinished ? (
              /* Ready to start online exam */
              <div className="py-6 text-center space-y-5 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-cyan-300 border border-cyan-500/30 mx-auto flex items-center justify-center shadow-lg">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white">
                    ชุดข้อสอบสุ่ม: {sourceTitle}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    สุ่มข้อสอบจำนวน <strong className="text-cyan-300">{examQuestions.length} ข้อ</strong> จากคลังทั้งหมด{' '}
                    <strong className="text-white">{eligiblePoolCount} ข้อ</strong> ที่ตรงเงื่อนไข · จับเวลาถอยหลัง{' '}
                    <strong className="text-amber-300">{formatCountdownClock(totalDurationSeconds)} นาที</strong> (ส่งคำตอบอัตโนมัติเมื่อหมดเวลา)
                  </p>
                </div>

                {/* Countdown Preview Badge */}
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950 border border-cyan-500/30">
                  <Timer className="w-5 h-5 text-cyan-400" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      เวลาสอบจำกัด (Time Limit)
                    </div>
                    <div className="text-lg font-mono font-black text-cyan-300 leading-tight">
                      {formatCountdownClock(totalDurationSeconds)}{' '}
                      <span className="text-xs font-sans font-semibold text-slate-400">
                        (เฉลี่ย ~{Math.round(totalDurationSeconds / Math.max(1, examQuestions.length))} วินาที/ข้อ)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview tags of drawn set */}
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  {examPlatformSummary.scratch > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">
                      🐱 Scratch {examPlatformSummary.scratch} ข้อ
                    </span>
                  )}
                  {examPlatformSummary.microbit > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
                      🤖 Micro:bit {examPlatformSummary.microbit} ข้อ
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-xl border font-bold ${
                      selectedDifficulty === 'all'
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : DIFFICULTY_META[selectedDifficulty].badgeClass
                    }`}
                  >
                    ความยาก (Difficulty):{' '}
                    {selectedDifficulty === 'all'
                      ? '🎯 ทุกระดับ (All)'
                      : `${DIFFICULTY_META[selectedDifficulty].emoji} ${DIFFICULTY_META[selectedDifficulty].label} (${
                          selectedDifficulty === 'easy'
                            ? 'Easy'
                            : selectedDifficulty === 'medium'
                            ? 'Medium'
                            : 'Hard'
                        })`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleStartExam(false)}
                    disabled={examQuestions.length === 0}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-4 h-4" />
                    <span>เริ่มทำข้อสอบ ({examQuestions.length} ข้อ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRerollExam}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4 text-emerald-400" />
                    <span>สุ่มชุดข้อสอบใหม่</span>
                  </button>
                </div>
              </div>
            ) : isExamFinished ? (
              /* Exam Finished & Results */
              <div className="space-y-6 py-2">
                {didTimeExpire && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>หมดเวลาทำข้อสอบ (00:00) — ระบบได้บันทึกและส่งกระดาษคำตอบให้อัตโนมัติแล้ว</span>
                  </div>
                )}

                <div className="text-center space-y-2.5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                  <h3 className="text-2xl font-black text-white">
                    ผลคะแนนสอบ: {score} / {examQuestions.length} คะแนน (
                    {examQuestions.length > 0 ? Math.round((score / examQuestions.length) * 100) : 0}%)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ผู้เข้าสอบ: <strong className="text-white">{studentName}</strong> · ชุดข้อสอบ: {sourceTitle}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold">
                      ⏱️ ใช้เวลาไป {formatCountdownClock(elapsedSeconds)} / {formatCountdownClock(totalDurationSeconds)}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold">
                      ⚡ เฉลี่ย {Math.round(elapsedSeconds / Math.max(1, examQuestions.length))} วินาที/ข้อ
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => handleStartExam(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>สุ่มชุดใหม่ {effectiveQuestionCount} ข้อแล้วสอบอีกครั้ง</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartExam(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ทำชุดเดิมซ้ำ</span>
                    </button>
                  </div>
                </div>

                {/* Question-by-question review */}
                <div className="space-y-3">
                  {examQuestions.map((q, idx) => {
                    const userAns = userAnswers[idx];
                    const isCorrect = userAns === q.correctAnswer;

                    return (
                      <div
                        key={`${q.id}-${idx}`}
                        className={`p-4 rounded-2xl border ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-rose-950/20 border-rose-500/40'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-1.5">
                          <span className="text-cyan-400 font-mono">
                            ข้อที่ {idx + 1} · {q.indicator}
                          </span>
                          <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCorrect ? '✓ ถูกต้อง' : userAns === undefined ? '— ไม่ได้ตอบ' : '✗ ไม่ถูกต้อง'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-white font-semibold mb-2">{q.question}</p>
                        {q.codeSnippet && (
                          <pre className="mb-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-200 whitespace-pre-wrap overflow-x-auto">
                            {q.codeSnippet}
                          </pre>
                        )}
                        {userAns !== undefined && !isCorrect && (
                          <div className="text-xs text-rose-300 mb-1">
                            คำตอบที่คุณเลือก:{' '}
                            <span className="font-semibold">
                              {formatThaiChoiceOption(q.options[userAns], userAns)}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-slate-300">
                          คำตอบที่ถูกต้อง:{' '}
                          <span className="font-bold text-emerald-400">
                            {formatThaiChoiceOption(q.options[q.correctAnswer], q.correctAnswer)}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                          💡 <strong>คำอธิบาย:</strong> {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentQ ? (
              /* Taking Online Exam */
              <div className="space-y-5">
                {/* Question Navigator Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {examQuestions.map((q, idx) => {
                      const isAnswered = userAnswers[idx] !== undefined;
                      const isActive = idx === currentQIndex;
                      return (
                        <button
                          key={`${q.id}-nav-${idx}`}
                          type="button"
                          disabled={isTimerPaused}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border disabled:opacity-40 ${
                            isActive
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 scale-105'
                              : isAnswered
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Box (with privacy overlay when timer is paused) */}
                {isTimerPaused ? (
                  <div className="p-10 rounded-2xl bg-slate-950 border border-amber-500/40 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 mx-auto flex items-center justify-center">
                      <Pause className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">พักเวลาชั่วคราว (ซ่อนโจทย์เพื่อความยุติธรรม)</h4>
                      <p className="text-xs text-slate-400">
                        เวลาคงเหลือ <strong className="text-amber-300 font-mono">{formatCountdownClock(timeLeft)}</strong> · กดปุ่มด้านล่างเพื่อกลับมาทำข้อสอบต่อ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setIsTimerPaused(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>นับเวลาต่อและแสดงโจทย์</span>
                    </button>
                  </div>
                ) : (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono font-bold text-cyan-400">
                      {currentQ.indicator}
                    </div>
                    {currentQ.difficulty && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          DIFFICULTY_META[currentQ.difficulty].badgeClass
                        }`}
                      >
                        {DIFFICULTY_META[currentQ.difficulty].emoji}{' '}
                        {DIFFICULTY_META[currentQ.difficulty].label}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h4>

                  {currentQ.codeSnippet && (
                    <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {currentQ.codeSnippet}
                    </pre>
                  )}

                  <div className="space-y-2.5 pt-1">
                    {currentQ.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(optIdx)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 cursor-pointer ${
                          userAnswers[currentQIndex] === optIdx
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100'
                            : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <span>{formatThaiChoiceOption(opt, optIdx)}</span>
                        {userAnswers[currentQIndex] === optIdx && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={currentQIndex === 0 || isTimerPaused}
                    onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ข้อก่อนหน้า
                  </button>

                  {currentQIndex + 1 < examQuestions.length ? (
                    <button
                      type="button"
                      disabled={isTimerPaused}
                      onClick={() => setCurrentQIndex((i) => i + 1)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <span>ข้อถัดไป</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFinishExam(false)}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                    >
                      ส่งกระดาษคำตอบ ({answeredCount}/{examQuestions.length}) ✓
                    </button>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            /* Print A4 Exam Paper Layout */
            <div className="space-y-4">
              {/* Print Controls (hidden when printing) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRerollExam}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>สุ่มชุดใหม่ก่อนพิมพ์ ({effectiveQuestionCount} ข้อ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintAnswerKey((prev) => !prev)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      showPrintAnswerKey
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {showPrintAnswerKey ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showPrintAnswerKey ? 'ซ่อนเฉลยคุณครู' : 'แสดงเฉลยสำหรับคุณครู'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสารข้อสอบ A4</span>
                </button>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 space-y-6 shadow-inner print:p-0 print:shadow-none">
                <div className="text-center border-b border-slate-300 pb-4 space-y-1">
                  <h3 className="font-bold text-lg text-slate-900">
                    แบบทดสอบวัดผลสัมฤทธิ์ กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (ว 4.2)
                  </h3>
                  <p className="text-xs text-slate-700 font-semibold">
                    ชุดข้อสอบ: {sourceTitle} · จำนวน {examQuestions.length} ข้อ (ชุดสุ่ม #{drawSeed})
                    {showPrintAnswerKey ? ' — [ฉบับเฉลยคุณครู]' : ''}
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-3 text-xs font-medium text-slate-700">
                    <div className="border-b border-dotted border-slate-400 pb-1 text-left">
                      ชื่อ-สกุล: ....................................................
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-1 text-left">
                      ชั้น/ห้อง: ....................
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-1 text-left">
                      เลขที่: ......... คะแนน: ......./{examQuestions.length}
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4 text-xs">
                  {examQuestions.map((q, idx) => (
                    <div key={`${q.id}-print-${idx}`} className="space-y-1.5 break-inside-avoid">
                      <p className="font-bold text-slate-900 leading-relaxed">
                        {idx + 1}. {q.question}{' '}
                        <span className="font-normal text-slate-500">({q.indicator})</span>
                      </p>
                      {q.codeSnippet && (
                        <pre className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-800 whitespace-pre-wrap">
                          {q.codeSnippet}
                        </pre>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 text-slate-800">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={
                              showPrintAnswerKey && oIdx === q.correctAnswer
                                ? 'font-bold text-emerald-700 underline'
                                : ''
                            }
                          >
                            {formatThaiChoiceOption(opt, oIdx)}
                          </div>
                        ))}
                      </div>
                      {showPrintAnswerKey && (
                        <div className="ml-4 mt-1 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                          <strong>เฉลย {THAI_CHOICE_LABELS[q.correctAnswer]}:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Printable Answer Sheet Table */}
                <div className="pt-4 border-t border-slate-300 space-y-2 break-inside-avoid">
                  <h4 className="font-bold text-xs text-slate-900">
                    กระดาษคำตอบ (ทำเครื่องหมาย ✕ ลงในช่องตัวเลือกที่ถูกต้อง)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    {examQuestions.map((q, idx) => (
                      <div
                        key={`ans-sheet-${q.id}-${idx}`}
                        className="flex items-center justify-between px-2 py-1 rounded border border-slate-300 bg-slate-50"
                      >
                        <span className="font-mono font-bold text-slate-700">{idx + 1}.</span>
                        <div className="flex items-center gap-1.5 font-semibold">
                          {THAI_CHOICE_LABELS.map((lbl, cIdx) => {
                            const isKey = showPrintAnswerKey && cIdx === q.correctAnswer;
                            return (
                              <span
                                key={lbl}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                                  isKey
                                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                                    : 'border-slate-400 text-slate-700 bg-white'
                                }`}
                              >
                                {lbl.replace('.', '')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>🏛️ เชื่อมต่อคลังข้อสอบ Scratch &amp; Micro:bit มาตรฐาน ว 4.2 สพฐ.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
