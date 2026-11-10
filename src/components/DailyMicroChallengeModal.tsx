import React, { useState } from 'react';
import {
  X,
  Flame,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Clock,
  Bug,
  ListOrdered,
  Cpu,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface DailyPuzzle {
  dayId: string;
  dayNumber: number;
  type: 'bug_buster' | 'order_algo' | 'loop_decoder';
  typeLabel: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  description: string;
  codeOrItems: string[];
  correctAnswer: any; // index, ordered array, or number
  hint: string;
  explanation: string;
  rewardPoints: number;
}

const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    dayId: 'd1',
    dayNumber: 1,
    type: 'bug_buster',
    typeLabel: '🐛 Bug Buster',
    title: 'จับบั๊กหุ่นยนต์เดินวนไม่หยุด',
    difficulty: 'Easy',
    description: 'โปรแกรมนี้มีเป้าหมายให้ตัวละครเดิน 5 ก้าวแล้วหยุด แต่ทำไมตัวละครถึงเดินไม่ยอมหยุด? บรรทัดไหนมีจุดบกพร่อง?',
    codeOrItems: [
      '1: count = 0',
      '2: while count < 5:',
      '3:     robot.forward(1)',
      '4:     count = count - 1  # เพิ่มรอบเดิน',
      '5: robot.stop()',
    ],
    correctAnswer: 3, // index of line 4
    hint: 'สังเกตค่าตัวแปร count ในแต่ละรอบว่ามีค่าเพิ่มขึ้นหรือลดลง',
    explanation: 'บรรทัดที่ 4 เขียนว่า `count = count - 1` ทำให้ค่า count ลดลงเรื่อยๆ (0, -1, -2, ...) จึงน้อยกว่า 5 ตลอดกาล เกิดภาวะ Infinite Loop ต้องแก้เป็น `count = count + 1`',
    rewardPoints: 15,
  },
  {
    dayId: 'd2',
    dayNumber: 2,
    type: 'order_algo',
    typeLabel: '🧩 Algorithm Ordering',
    title: 'เรียงลำดับขั้นตอนระบบเปิดไฟอัจฉริยะ',
    difficulty: 'Medium',
    description: 'จงจัดเรียงขั้นตอนการทำงานของเซ็นเซอร์เปิดไฟทางเดินอัตโนมัติให้ถูกต้องตามลำดับ:',
    codeOrItems: [
      'เปิดหลอดไฟ LED สว่าง 100% เป็นเวลา 15 วินาที',
      'เริ่มทำงาน อ่านค่าเซ็นเซอร์แสงและความเคลื่อนไหว (PIR)',
      'ถ้าตรวจพบคนเดินผ่านและแสงสว่างน้อยกว่า 200 Lux',
      'ปิดหลอดไฟและกลับเข้าสู่โหมดสแตนด์บายตรวจจับรอบต่อไป',
    ],
    correctAnswer: [1, 2, 0, 3], // Correct order index
    hint: 'เริ่มต้นจากการรับค่าอินพุต (Input) -> ตรวจเงื่อนไข (Process) -> ทำงาน (Output) -> จบการทำงาน',
    explanation: 'ลำดับที่ถูกต้อง: 1. อ่านค่าเซ็นเซอร์ -> 2. ตรวจเงื่อนไขพบคนและมืด -> 3. เปิดไฟสว่าง 15 วินาที -> 4. ดับไฟและวนตรวจรอบต่อไป',
    rewardPoints: 15,
  },
  {
    dayId: 'd3',
    dayNumber: 3,
    type: 'loop_decoder',
    typeLabel: '🔄 Loop Decoder',
    title: 'ทำนายค่าตัวแปรผลลัพธ์ของลูป',
    difficulty: 'Medium',
    description: 'เมื่อรันโปรแกรมนี้เสร็จสิ้น ตัวแปร total จะมีค่าเป็นเท่าใด?',
    codeOrItems: [
      'total = 0',
      'for i in [2, 4, 6]:',
      '    total = total + i',
      'print(total)',
    ],
    correctAnswer: 12,
    hint: 'ลูปจะวนทำงาน 3 รอบ โดยบวกค่า 2, 4, และ 6 ตามลำดับ',
    explanation: 'รอบที่ 1: total = 0 + 2 = 2, รอบที่ 2: total = 2 + 4 = 6, รอบที่ 3: total = 6 + 6 = 12 ผลลัพธ์สุดท้ายคือ 12',
    rewardPoints: 15,
  },
  {
    dayId: 'd4',
    dayNumber: 4,
    type: 'bug_buster',
    typeLabel: '🐛 Bug Buster',
    title: 'คำนวณส่วนลดราคาผลไม้ผิดพลาด',
    difficulty: 'Challenging',
    description: 'หากลูกค้าซื้อผลไม้เกิน 500 บาท จะได้ส่วนลด 10% แต่ทำไมลูกค้าซื้อ 600 บาทแต่ไม่ได้ส่วนลด?',
    codeOrItems: [
      '1: price = 600',
      '2: discount = 0',
      '3: if price > 1000:',
      '4:     discount = price * 0.10',
      '5: final_price = price - discount',
    ],
    correctAnswer: 2, // line 3
    hint: 'ดูตัวเลขเงื่อนไขในคำสั่ง if',
    explanation: 'เงื่อนไขในบรรทัดที่ 3 ตั้งไว้ว่า `price > 1000` แต่โจทย์ระบุว่าซื้อเกิน 500 บาท จึงต้องแก้เป็น `if price > 500:`',
    rewardPoints: 15,
  },
];

interface DailyMicroChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentName: string;
  onRewardPoints?: (pts: number, reason: string) => void;
}

export const DailyMicroChallengeModal: React.FC<DailyMicroChallengeModalProps> = ({
  isOpen,
  onClose,
  currentStudentName,
  onRewardPoints,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [solvedDays, setSolvedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_daily_solved');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  const [streakCount, setStreakCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('coderkids_daily_streak');
      return saved ? parseInt(saved, 10) : 4;
    } catch {
      return 4;
    }
  });

  // Current puzzle state
  const currentPuzzle = DAILY_PUZZLES.find((p) => p.dayNumber === selectedDay) || DAILY_PUZZLES[0];
  
  // Bug buster selected line
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  
  // Loop decoder input
  const [userNumberInput, setUserNumberInput] = useState<string>('');

  // Order algo list
  const [orderedItems, setOrderedItems] = useState<number[]>([0, 1, 2, 3]);

  // Submission result state
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectDay = (dayNum: number) => {
    setSelectedDay(dayNum);
    setSelectedLine(null);
    setUserNumberInput('');
    setOrderedItems([0, 1, 2, 3]);
    setHasSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    soundEffects.play('click');
  };

  const handleMoveOrderItem = (index: number, direction: 'up' | 'down') => {
    soundEffects.play('tick');
    const newOrder = [...orderedItems];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setOrderedItems(newOrder);
  };

  const handleCheckAnswer = () => {
    soundEffects.play('click');
    let correct = false;

    if (currentPuzzle.type === 'bug_buster') {
      correct = selectedLine === currentPuzzle.correctAnswer;
    } else if (currentPuzzle.type === 'order_algo') {
      correct = JSON.stringify(orderedItems) === JSON.stringify(currentPuzzle.correctAnswer);
    } else if (currentPuzzle.type === 'loop_decoder') {
      correct = parseInt(userNumberInput.trim(), 10) === currentPuzzle.correctAnswer;
    }

    setIsCorrect(correct);
    setHasSubmitted(true);

    if (correct) {
      soundEffects.play('victory');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      if (!solvedDays.includes(selectedDay)) {
        const nextSolved = [...solvedDays, selectedDay];
        setSolvedDays(nextSolved);
        localStorage.setItem('coderkids_daily_solved', JSON.stringify(nextSolved));

        const nextStreak = streakCount + 1;
        setStreakCount(nextStreak);
        localStorage.setItem('coderkids_daily_streak', nextStreak.toString());

        if (onRewardPoints) {
          onRewardPoints(currentPuzzle.rewardPoints, `พิชิต Daily Challenge วันที่ ${selectedDay}`);
        }
      }
    } else {
      soundEffects.play('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  3-Minute Daily Challenge ⚡
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ฝึกคิดวันละ 3 นาที
                </span>
              </div>
              <p className="text-xs text-slate-400">
                แก้ปริศนาโค้ดดิ้งสั้นๆ สะสมเปลวไฟ Streak และรับโบนัส +15 XP ทุกวัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
              <Flame className="w-4 h-4 fill-amber-400 animate-pulse text-amber-500" />
              <span>{streakCount} วันต่อเนื่อง!</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Streak Strip */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">ปฏิทินภารกิจประจำสัปดาห์:</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const isSolved = solvedDays.includes(dayNum);
              const isCurrent = dayNum === selectedDay;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`w-10 h-10 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center cursor-pointer relative ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-white/30 scale-105'
                      : isSolved
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] font-sans opacity-70">Day</span>
                  <span>{dayNum}</span>
                  {isSolved && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center text-slate-950 font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Puzzle Body */}
        <div className="p-4 sm:p-6 flex-1 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4 shadow-inner">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentPuzzle.typeLabel}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                  ระดับ: {currentPuzzle.difficulty}
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-amber-400">
                รางวัล: +{currentPuzzle.rewardPoints} XP
              </div>
            </div>

            {/* Title & Desc */}
            <div>
              <h3 className="text-lg font-black text-white">{currentPuzzle.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {currentPuzzle.description}
              </p>
            </div>

            {/* PUZZLE TYPE 1: BUG BUSTER */}
            {currentPuzzle.type === 'bug_buster' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400">
                  👉 คลิกเลือกบรรทัดที่มีข้อผิดพลาด (Bug):
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {currentPuzzle.codeOrItems.map((line, idx) => {
                    const isSelected = selectedLine === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedLine(idx);
                          setHasSubmitted(false);
                          soundEffects.play('click');
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-2 ring-rose-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <span>{line}</span>
                        {isSelected && (
                          <Bug className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PUZZLE TYPE 2: ORDER ALGORITHM */}
            {currentPuzzle.type === 'order_algo' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400">
                  👉 กดลูกศรขึ้น/ลง เพื่อจัดเรียงขั้นตอน 1 ถึง 4 ให้ถูกต้อง:
                </div>
                <div className="space-y-2">
                  {orderedItems.map((itemIdx, posIdx) => (
                    <div
                      key={posIdx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                          {posIdx + 1}
                        </span>
                        <span className="text-slate-200">{currentPuzzle.codeOrItems[itemIdx]}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={posIdx === 0}
                          onClick={() => handleMoveOrderItem(posIdx, 'up')}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={posIdx === orderedItems.length - 1}
                          onClick={() => handleMoveOrderItem(posIdx, 'down')}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PUZZLE TYPE 3: LOOP DECODER */}
            {currentPuzzle.type === 'loop_decoder' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
                  {currentPuzzle.codeOrItems.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">ค่า total สุดท้าย =</span>
                  <input
                    type="number"
                    placeholder="ใส่ตัวเลขคำตอบ..."
                    value={userNumberInput}
                    onChange={(e) => {
                      setUserNumberInput(e.target.value);
                      setHasSubmitted(false);
                    }}
                    className="w-40 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'ซ่อนคำใบ้' : 'ขอคำใบ้ (Hint)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCheckAnswer}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>ตรวจคำตอบ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hint Box */}
            {showHint && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center gap-2 animate-fadeIn">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span><strong>คำใบ้:</strong> {currentPuzzle.hint}</span>
              </div>
            )}

            {/* Feedback Box */}
            {hasSubmitted && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fadeIn ${
                  isCorrect
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>🎉 ถูกต้องยอดเยี่ยม! ได้รับ +{currentPuzzle.rewardPoints} XP</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>ยังไม่ถูกต้อง ลองสังเกตคำใบ้แล้วลองอีกครั้งนะ!</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300">
                  <strong>คำอธิบาย:</strong> {currentPuzzle.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
