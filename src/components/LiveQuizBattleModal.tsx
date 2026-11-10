import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Share2,
  Award,
  Flame,
  QrCode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  timeLimit: number;
  category: 'scratch' | 'microbit' | 'algorithm' | 'safety';
}

const BATTLE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'ในโปรแกรม Scratch หากต้องการให้ตัวละครเดินหน้าตลอดเวลา ต้องใช้บล็อกคำสั่งใด?',
    options: ['repeat 10', 'forever + move 10 steps', 'if on edge, bounce', 'when green flag clicked'],
    correctIndex: 1,
    explanation: 'บล็อก "forever" (วนซ้ำตลอดไป) เมื่อใส่ "move 10 steps" ด้านใน จะทำให้ตัวละครเดินหน้าอย่างต่อเนื่องไม่หยุด',
    timeLimit: 15,
    category: 'scratch',
  },
  {
    id: 'q2',
    question: 'บอร์ด Micro:bit V2 มีหน้าจอหลอดไฟ LED สำหรับแสดงผลทั้งหมดกี่ดวง?',
    options: ['16 ดวง (4x4)', '25 ดวง (5x5)', '64 ดวง (8x8)', '9 ดวง (3x3)'],
    correctIndex: 1,
    explanation: 'Micro:bit หน้าจอเป็น LED Dot Matrix ขนาด 5 แถว 5 คอลัมน์ รวมเป็น 25 ดวง สีแดง',
    timeLimit: 15,
    category: 'microbit',
  },
  {
    id: 'q3',
    question: 'ข้อใดเป็นตัวอย่างของการ "แยกส่วนประกอบ (Decomposition)" ในแนวคิดเชิงคำนวณ?',
    options: [
      'มองหาจุดร่วมของแมวและเสือ',
      'ตัดรายละเอียดที่ไม่สำคัญทิ้งไป',
      'แตกขั้นตอนการทำต้มยำกุ้งออกเป็น เตรียมของ หั่น ปรุง และต้ม',
      'เขียนคำสั่งเรียงตามลำดับ 1, 2, 3',
    ],
    correctIndex: 2,
    explanation: 'Decomposition คือการแบ่งปัญหาใหญ่หรือระบบที่ซับซ้อนออกเป็นส่วนย่อยๆ เพื่อให้จัดการและแก้ไขได้ง่ายขึ้น',
    timeLimit: 20,
    category: 'algorithm',
  },
  {
    id: 'q4',
    question: 'ข้อมูลประเภทใดจัดเป็น "ข้อมูลส่วนบุคคลที่มีความอ่อนไหว (Sensitive Data)" ตามกฎหมาย PDPA?',
    options: ['ชื่อ-นามสกุล', 'เบอร์โทรศัพท์บ้าน', 'ข้อมูลประวัติสุขภาพและลายนิ้วมือ', 'ชื่อบัญชีอินสตาแกรม'],
    correctIndex: 2,
    explanation: 'ข้อมูลสุขภาพ ประวัติอาชญากรรม และข้อมูลชีวภาพ (ลายนิ้วมือ/ใบหน้า) เป็นข้อมูลส่วนบุคคลที่มีความอ่อนไหวสูงเป็นพิเศษ',
    timeLimit: 15,
    category: 'safety',
  },
  {
    id: 'q5',
    question: 'คำสั่ง basic.pause(500) ใน Micro:bit มีความหมายว่าอย่างไร?',
    options: ['หยุดรอ 5 วินาที', 'หยุดรอ 0.5 วินาที (500 มิลลิวินาที)', 'ปิดเครื่องทันที', 'เล่นเสียงโน้ตความถี่ 500 Hz'],
    correctIndex: 1,
    explanation: 'หน่วยเวลาในบอร์ด Micro:bit คือมิลลิวินาที (ms) โดย 1,000 ms = 1 วินาที ดังนั้น 500 ms = 0.5 วินาที',
    timeLimit: 15,
    category: 'microbit',
  },
  {
    id: 'q6',
    question: 'การตรวจจับเงื่อนไข "ถ้า...มิฉะนั้น..." (If ... Else) ตรงกับโครงสร้างการควบคุมแบบใด?',
    options: ['การทำงานแบบลำดับ (Sequence)', 'การเลือกทำตามเงื่อนไข (Selection)', 'การวนซ้ำ (Iteration)', 'ฟังก์ชัน (Function)'],
    correctIndex: 1,
    explanation: 'Selection หรือ Condition คือการตัดสินใจเลือกทำคำสั่งตามค่าความจริงของเงื่อนไข (True/False)',
    timeLimit: 15,
    category: 'algorithm',
  },
];

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswerIndex: number | null;
  lastAnswerTime: number;
  isMe?: boolean;
}

const INITIAL_BOT_PLAYERS: Player[] = [
  { id: 'p1', name: 'น้องต้นกล้า ป.5/1', avatar: '🤖', score: 0, streak: 0, lastAnswerIndex: null, lastAnswerTime: 0 },
  { id: 'p2', name: 'น้องฟ้าใส ป.5/2', avatar: '🐱', score: 0, streak: 0, lastAnswerIndex: null, lastAnswerTime: 0 },
  { id: 'p3', name: 'ด.ช. ภูมิภัทร ป.6/1', avatar: '🚀', score: 0, streak: 0, lastAnswerIndex: null, lastAnswerTime: 0 },
  { id: 'p4', name: 'ด.ญ. มะนาว ป.4/3', avatar: '🦄', score: 0, streak: 0, lastAnswerIndex: null, lastAnswerTime: 0 },
];

const ANSWER_COLORS = [
  { bg: 'bg-red-500 hover:bg-red-600', border: 'border-red-600', shape: '▲', label: 'สีแดง' },
  { bg: 'bg-blue-500 hover:bg-blue-600', border: 'border-blue-600', shape: '◆', label: 'สีน้ำเงิน' },
  { bg: 'bg-amber-500 hover:bg-amber-600', border: 'border-amber-600', shape: '●', label: 'สีเหลือง' },
  { bg: 'bg-emerald-500 hover:bg-emerald-600', border: 'border-emerald-600', shape: '■', label: 'สีเขียว' },
];

interface LiveQuizBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentName: string;
  onRewardPoints?: (pts: number, reason: string) => void;
}

export const LiveQuizBattleModal: React.FC<LiveQuizBattleModalProps> = ({
  isOpen,
  onClose,
  currentStudentName,
  onRewardPoints,
}) => {
  const [role, setRole] = useState<'player' | 'host'>('player');
  const [roomPin, setRoomPin] = useState<string>('839201');
  const [gameStage, setGameStage] = useState<'lobby' | 'question' | 'reveal' | 'podium'>('lobby');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<number>(0);
  const [myStreak, setMyStreak] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>(INITIAL_BOT_PLAYERS);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = BATTLE_QUESTIONS[currentQIndex];

  // Auto tick timer during question stage
  useEffect(() => {
    if (!isOpen || gameStage !== 'question') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        if (prev <= 4 && soundEnabled) {
          soundEffects.play('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, gameStage, currentQIndex, soundEnabled]);

  // Handle countdown finished or all players answered
  const handleTimeUp = () => {
    setIsAnswerLocked(true);
    setGameStage('reveal');

    // Simulate bot answers
    setPlayers((prev) =>
      prev.map((p) => {
        const isCorrect = Math.random() > 0.35; // 65% correct rate
        const chosen = isCorrect
          ? currentQ.correctIndex
          : (currentQ.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
        const speedBonus = Math.floor(Math.random() * 300);
        const pts = isCorrect ? 700 + speedBonus : 0;
        return {
          ...p,
          score: p.score + pts,
          streak: isCorrect ? p.streak + 1 : 0,
          lastAnswerIndex: chosen,
        };
      })
    );

    if (selectedAnswer === currentQ.correctIndex) {
      if (soundEnabled) soundEffects.play('correct');
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } else {
      if (soundEnabled) soundEffects.play('error');
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (isAnswerLocked || gameStage !== 'question') return;
    setSelectedAnswer(index);
    setIsAnswerLocked(true);
    if (soundEnabled) soundEffects.play('click');

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      const speedBonus = timeLeft * 30;
      const roundPts = 600 + speedBonus;
      setMyScore((prev) => prev + roundPts);
      setMyStreak((prev) => prev + 1);
    } else {
      setMyStreak(0);
    }
  };

  const handleStartGame = () => {
    setGameStage('question');
    setCurrentQIndex(0);
    setTimeLeft(BATTLE_QUESTIONS[0].timeLimit);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setMyScore(0);
    setMyStreak(0);
    setPlayers(INITIAL_BOT_PLAYERS.map((p) => ({ ...p, score: 0, streak: 0 })));
    if (soundEnabled) soundEffects.play('click');
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < BATTLE_QUESTIONS.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setTimeLeft(BATTLE_QUESTIONS[nextIdx].timeLimit);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
      setGameStage('question');
      if (soundEnabled) soundEffects.play('click');
    } else {
      // Podium stage
      setGameStage('podium');
      if (soundEnabled) soundEffects.play('victory');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      if (onRewardPoints) {
        onRewardPoints(25, 'ชัยชนะในสมรภูมิสด Live Quiz Battle');
      }
    }
  };

  const handleResetGame = () => {
    setGameStage('lobby');
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setMyScore(0);
    setMyStreak(0);
    if (soundEnabled) soundEffects.play('click');
  };

  if (!isOpen) return null;

  // Compute standings for podium / leaderboard
  const allLeaderboard = [
    {
      id: 'me',
      name: currentStudentName || 'คุณ (นักเรียน)',
      avatar: '🌟',
      score: myScore,
      streak: myStreak,
      isMe: true,
    },
    ...players,
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Live Quiz Battle ⚡
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ห้องสด Kahoot-Style
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ประลองความรู้วิทยาการคำนวณแบบสดในชั้นเรียน พร้อมบอร์ดผู้นำแบบเรียลไทม์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role & PIN Bar */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">โหมดมุมมอง:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  role === 'player' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎮 ผู้เล่น (Student)
              </button>
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  role === 'host' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                📡 ผู้จัดห้อง (Host/Teacher)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">รหัส PIN:</span>
              <span className="font-mono font-black text-amber-400 tracking-wider text-sm">{roomPin}</span>
            </div>
            {role === 'host' && (
              <span className="text-slate-400 hidden sm:inline">นักเรียนเข้าร่วมแล้ว 5 คน</span>
            )}
          </div>
        </div>

        {/* Main Game Container */}
        <div className="p-4 sm:p-6 flex-1">
          {/* LOBBY STAGE */}
          {gameStage === 'lobby' && (
            <div className="py-6 sm:py-10 max-w-xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                <Users className="w-10 h-10 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">ห้องประลองสดพร้อมแล้ว!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  ใช้รหัส 6 หลักนี้เพื่อเข้าร่วมจากอุปกรณ์มือถือ หรือกดปุ่มเริ่มประลองได้ทันที
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-inner inline-block w-full max-w-sm">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">
                  Game PIN
                </div>
                <div className="text-4xl font-mono font-black tracking-widest text-amber-400 select-all py-1">
                  {roomPin}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>สแกน QR Code เข้าจากมือถือได้ทันที</span>
                </div>
              </div>

              {/* Joined Players */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ผู้เล่นในห้องล็อบบี้ ({players.length + 1} คน)
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                    <span>🌟</span>
                    <span>{currentStudentName || 'คุณ (นักเรียน)'}</span>
                  </span>
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5"
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>เริ่มประลองเลย! (Start Battle)</span>
                </button>
              </div>
            </div>
          )}

          {/* QUESTION STAGE */}
          {(gameStage === 'question' || gameStage === 'reveal') && (
            <div className="space-y-5">
              {/* Top Progress bar */}
              <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white">
                    ข้อที่ {currentQIndex + 1} / {BATTLE_QUESTIONS.length}
                  </span>
                  <span className="text-slate-500 uppercase tracking-wider">
                    หมวด: {currentQ.category}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    <span>Streak: {myStreak}</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono text-white">
                    คะแนน: {myScore.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className="relative w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 8 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(timeLeft / currentQ.timeLimit) * 100}%` }}
                />
              </div>

              {/* Question Text Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-2 shadow-inner">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>เวลาคงเหลือ: {timeLeft} วินาที</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* 4 Colored Answer Buttons (Kahoot-Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {currentQ.options.map((option, idx) => {
                  const color = ANSWER_COLORS[idx];
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  const isReveal = gameStage === 'reveal';

                  let btnClasses = `p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 text-left transition-all relative flex items-center gap-4 cursor-pointer shadow-md `;

                  if (isReveal) {
                    if (isCorrect) {
                      btnClasses += 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/40 text-white ';
                    } else if (isSelected) {
                      btnClasses += 'bg-rose-600/60 border-rose-500 text-rose-200 line-through opacity-75 ';
                    } else {
                      btnClasses += 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-40 ';
                    }
                  } else {
                    if (isSelected) {
                      btnClasses += `${color.bg} ${color.border} ring-4 ring-white/30 text-white scale-[1.02] `;
                    } else if (isAnswerLocked) {
                      btnClasses += 'bg-slate-800/60 border-slate-700 text-slate-400 opacity-60 ';
                    } else {
                      btnClasses += `${color.bg} ${color.border} text-white hover:scale-[1.01] active:scale-[0.98] `;
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerLocked}
                      onClick={() => handleSelectAnswer(idx)}
                      className={btnClasses}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black/25 flex items-center justify-center shrink-0 text-xl font-black font-mono">
                        {color.shape}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-bold leading-snug">
                          {option}
                        </div>
                      </div>
                      {isReveal && isCorrect && (
                        <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                      )}
                      {isReveal && isSelected && !isCorrect && (
                        <XCircle className="w-6 h-6 text-rose-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reveal Explanation & Next Button */}
              {gameStage === 'reveal' && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        เฉลยและคำอธิบาย
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {selectedAnswer === currentQ.correctIndex ? (
                        <span className="text-emerald-400 font-bold">
                          🎉 ตอบถูก! ได้รับแต้มความเร็ว
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          ❌ ตอบผิด ไม่เป็นไร ลองข้อต่อไปนะ!
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <span>
                        {currentQIndex + 1 < BATTLE_QUESTIONS.length ? 'ข้อต่อไป' : 'ดูผลคะแนนโพเดียม 🏆'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PODIUM STAGE */}
          {gameStage === 'podium' && (
            <div className="py-6 sm:py-8 max-w-2xl mx-auto space-y-6 text-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
                  <span>🏆</span>
                  <span>โพเดียมผู้ชนะประจำรอบ!</span>
                  <span>🎉</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  การประลองความรู้วิทยาการคำนวณจบลงแล้ว ยินดีกับผู้ทำคะแนนสูงสุด
                </p>
              </div>

              {/* 3-Step Podium */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-4">
                {/* 2nd place */}
                {allLeaderboard[1] && (
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl">{allLeaderboard[1].avatar}</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                      {allLeaderboard[1].name}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {allLeaderboard[1].score.toLocaleString()} pts
                    </div>
                    <div className="h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700 flex flex-col justify-center items-center font-black text-2xl text-slate-400 border-t-4 border-slate-400">
                      <span>2</span>
                      <span className="text-[10px] font-sans text-slate-400 uppercase">Silver</span>
                    </div>
                  </div>
                )}

                {/* 1st place */}
                {allLeaderboard[0] && (
                  <div className="space-y-2">
                    <div className="text-3xl sm:text-4xl animate-bounce">{allLeaderboard[0].avatar}</div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 truncate">
                      👑 {allLeaderboard[0].name}
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {allLeaderboard[0].score.toLocaleString()} pts
                    </div>
                    <div className="h-40 sm:h-48 rounded-t-2xl bg-gradient-to-t from-amber-700 to-amber-500 flex flex-col justify-center items-center font-black text-3xl text-slate-950 border-t-4 border-amber-300 shadow-lg shadow-amber-500/20">
                      <span>1</span>
                      <span className="text-[10px] font-sans text-slate-950 font-bold uppercase">Gold Champion</span>
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {allLeaderboard[2] && (
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl">{allLeaderboard[2].avatar}</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                      {allLeaderboard[2].name}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {allLeaderboard[2].score.toLocaleString()} pts
                    </div>
                    <div className="h-20 sm:h-28 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-900 flex flex-col justify-center items-center font-black text-2xl text-amber-600 border-t-4 border-amber-700">
                      <span>3</span>
                      <span className="text-[10px] font-sans text-amber-600 uppercase">Bronze</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Ranks */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  ตารางคะแนนรวมทั้งหมด
                </div>
                {allLeaderboard.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      item.isMe
                        ? 'bg-indigo-600/30 border border-indigo-500/50 text-white font-bold'
                        : 'bg-slate-900/60 border border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-slate-400 font-bold">
                        #{idx + 1}
                      </span>
                      <span>{item.avatar}</span>
                      <span>{item.name}</span>
                      {item.isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/40 text-indigo-200">
                          (คุณ)
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-amber-400">
                      {item.score.toLocaleString()} คะแนน
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetGame}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เล่นใหม่อีกครั้ง</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  บันทึกและกลับสู่บทเรียน
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
