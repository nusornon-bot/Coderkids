import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  RotateCcw,
  Sparkles,
  Trophy,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShieldCheck,
  Brain,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface BebrasTask {
  id: string;
  number: number;
  title: string;
  pillar: 'decomposition' | 'pattern' | 'abstraction' | 'algorithm';
  pillarLabel: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  scenario: string;
  question: string;
  visualGraphic?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const BEBRAS_TASKS: BebrasTask[] = [
  {
    id: 'b1',
    number: 1,
    title: 'ต้นบีเวอร์กับเขื่อนกั้นน้ำ (Beaver Dam)',
    pillar: 'decomposition',
    pillarLabel: 'การแยกย่อยปัญหา (Decomposition)',
    difficulty: 'Easy',
    points: 6,
    scenario: 'บีเวอร์ต้องการสร้างเขื่อนกั้นน้ำ โดยต้องใช้ท่อนซุงขนาดใหญ่ 3 ท่อน, กิ่งไม้ขนาดกลาง 5 กิ่ง และโคลนเชื่อม 4 ก้อน บีเวอร์มีเวลาจำกัดก่อนที่พระอาทิตย์จะตกดิน',
    question: 'หากบีเวอร์ต้องการให้เขื่อนสำเร็จอย่างเป็นระบบ ควรกำหนดขั้นตอนใดเป็นลำดับแรก?',
    options: [
      'ทาโคลนเชื่อมลงบนแม่น้ำทันที',
      'วางโครงสร้างหลักด้วยท่อนซุงขนาดใหญ่ 3 ท่อนที่ก้นแม่น้ำก่อน',
      'ลอยกิ่งไม้ขนาดกลางไปตามกระแสน้ำ',
      'รอให้ระดับน้ำแห้งทั้งหมด',
    ],
    correctIndex: 1,
    explanation: 'ตามหลักการแยกย่อยปัญหา การสร้างฐานรากที่แข็งแรงด้วยท่อนซุงขนาดใหญ่ก่อน จะเป็นตัวรับแรงให้กิ่งไม้และโคลนยึดเกาะได้',
  },
  {
    id: 'b2',
    number: 2,
    title: 'รหัสผ้าพันคอแสนกล (Striped Scarf Pattern)',
    pillar: 'pattern',
    pillarLabel: 'การหารูปแบบ (Pattern Recognition)',
    difficulty: 'Easy',
    points: 6,
    scenario: 'บีเวอร์ทอผ้าพันคอด้วยลำดับแถบสี: [แดง, แดง, น้ำเงิน, ขาว, แดง, แดง, น้ำเงิน, ขาว, ...]',
    question: 'แถบสีในลำดับที่ 19 จะเป็นสีอะไร?',
    options: ['สีแดง', 'สีน้ำเงิน', 'สีขาว', 'สีเหลือง'],
    correctIndex: 1,
    explanation: 'รูปแบบวนซ้ำทุก 4 ผืน [แดง, แดง, น้ำเงิน, ขาว] นำ 19 หารด้วย 4 ได้เศษ 3 ตำแหน่งที่ 3 ของคาบคือ "สีน้ำเงิน"',
  },
  {
    id: 'b3',
    number: 3,
    title: 'แผนที่เดินรถไฟฟ้าบีเวอร์ทาวน์ (Metro Map)',
    pillar: 'abstraction',
    pillarLabel: 'การคิดเชิงนามธรรม (Abstraction)',
    difficulty: 'Easy',
    points: 6,
    scenario: 'วิศวกรต้องการวาดแผนที่เส้นทางรถไฟฟ้าเพื่อให้ผู้โดยสารเข้าใจง่าย ไม่สับสนระหว่างเดินทาง',
    question: 'ข้อมูลใดควรตัดออก (นามธรรม) เพื่อไม่ให้แผนที่รถไฟฟ้ารกเกินไป?',
    options: [
      'ชื่อสถานีและจุดเชื่อมต่อสาย',
      'ตำแหน่งของต้นไม้และร้านก๋วยเตี๋ยวตามข้างถนน',
      'ทิศทางที่รถไฟฟ้าวิ่ง',
      'สีของสายรถไฟฟ้าแต่ละสาย',
    ],
    correctIndex: 1,
    explanation: 'Abstraction คือการตัดรายละเอียดที่ไม่จำเป็นออก ข้อมูลร้านค้าข้างทางและต้นไม้ไม่มีผลต่อการเดินทางด้วยรถไฟฟ้า',
  },
  {
    id: 'b4',
    number: 4,
    title: 'หุ่นยนต์เก็บลูกเกาลัด (Nut Collector Algorithm)',
    pillar: 'algorithm',
    pillarLabel: 'การออกแบบอัลกอริทึม (Algorithms)',
    difficulty: 'Easy',
    points: 6,
    scenario: 'หุ่นยนต์บีเวอร์เดินในตาราง 4x4 โดยเริ่มจากจุด (0,0) และต้องการเดินไปเก็บผลไม้ที่จุด (3,3)',
    question: 'ชุดคำสั่งใดที่พาหุ่นยนต์ไปถึงเป้าหมายได้ถูกต้อง?',
    options: [
      'เดินหน้า 3 ก้าว -> เลี้ยวขวา -> เดินหน้า 3 ก้าว',
      'เลี้ยวขวา -> เดินหน้า 4 ก้าว',
      'เดินหน้า 1 ก้าว -> เลี้ยวซ้าย -> หยุด',
      'หมุนรอบตัวเอง 3 ครั้ง',
    ],
    correctIndex: 0,
    explanation: 'การเดินในตาราง 4x4 จากมุมบนซ้ายไปมุมล่างขวา ต้องขยับในแกน X 3 ช่อง และแกน Y 3 ช่อง',
  },
  {
    id: 'b5',
    number: 5,
    title: 'ระบบส่งสัญญาณควันข้ามภูเขา (Smoke Signal Code)',
    pillar: 'pattern',
    pillarLabel: 'การหารูปแบบ (Pattern Recognition)',
    difficulty: 'Medium',
    points: 9,
    scenario: 'สัญญาณควันสั้นแทนเลข 0 สัญญาณควันยาวแทนเลข 1 บีเวอร์ส่งข้อความ: [ยาว, สั้น, ยาว, สั้น] = 1010',
    question: 'หากแปลงรหัส 1010 (เลขฐานสอง) เป็นเลขฐานสิบ จะได้ค่าเท่าใด?',
    options: ['8', '10', '12', '14'],
    correctIndex: 1,
    explanation: '(1 * 8) + (0 * 4) + (1 * 2) + (0 * 1) = 8 + 0 + 2 + 0 = 10',
  },
  {
    id: 'b6',
    number: 6,
    title: 'เขาวงกตต้นไม้สองทาง (Binary Decision Tree)',
    pillar: 'algorithm',
    pillarLabel: 'การออกแบบอัลกอริทึม (Algorithms)',
    difficulty: 'Medium',
    points: 9,
    scenario: 'ทางแยกในถ้ำ: ถ้ามีน้ำให้เลี้ยวซ้าย ถ้าไม่มีน้ำให้เลี้ยวขวา จากนั้นถ้าพบหินงอกให้ตรงไป',
    question: 'การตัดสินใจของบีเวอร์นี้ตรงกับโครงสร้างข้อมูลและอัลกอริทึมแบบใด?',
    options: ['ต้นไม้ตัดสินใจ (Decision Tree)', 'สแต็ก (Stack)', 'คิว (Queue)', 'การสุ่มแบบมอนเตคาร์โล'],
    correctIndex: 0,
    explanation: 'การเลือกทางแยกตามเงื่อนไข ใช่/ไม่ใช่ (True/False) เป็นพื้นฐานของต้นไม้ตัดสินใจ (Decision Tree / If-Else)',
  },
  {
    id: 'b7',
    number: 7,
    title: 'การจัดตารางแข่งว่ายน้ำ (Task Scheduling)',
    pillar: 'decomposition',
    pillarLabel: 'การแยกย่อยปัญหา (Decomposition)',
    difficulty: 'Hard',
    points: 12,
    scenario: 'มีลู่ว่ายน้ำ 2 ลู่ มีนักกีฬา 4 ตัวใช้เวลาว่าย: A (10 นาที), B (20 นาที), C (15 นาที), D (5 นาที)',
    question: 'ควรจัดคู่อย่างไรเพื่อให้การแข่งขันทั้งหมดเสร็จสิ้นเร็วที่สุด?',
    options: [
      'ลู่ 1: A+B (30 นาที), ลู่ 2: C+D (20 นาที) รวม 30 นาที',
      'ลู่ 1: B+D (25 นาที), ลู่ 2: A+C (25 นาที) รวม 25 นาที',
      'ลู่ 1: A+C+D (30 นาที), ลู่ 2: B (20 นาที) รวม 30 นาที',
      'ให้ว่ายทีละตัวในลู่เดียว รวม 50 นาที',
    ],
    correctIndex: 1,
    explanation: 'การแบ่งภาระงานให้สมดุล (Load Balancing): ลู่ 1 ใช้ 20+5 = 25 นาที และลู่ 2 ใช้ 10+15 = 25 นาที ทำให้เสร็จพร้อมกันใน 25 นาที ซึ่งเร็วที่สุด',
  },
];

interface BebrasSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentName: string;
  onRewardPoints?: (pts: number, reason: string) => void;
}

export const BebrasSimulatorModal: React.FC<BebrasSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentStudentName,
  onRewardPoints,
}) => {
  const [stage, setStage] = useState<'intro' | 'exam' | 'result'>('intro');
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60); // 45 minutes
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stage === 'exam' && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, isTimerRunning]);

  if (!isOpen) return null;

  const currentTask = BEBRAS_TASKS[currentTaskIndex];

  const handleStartExam = () => {
    setStage('exam');
    setIsTimerRunning(true);
    setAnswers({});
    setFlaggedIds([]);
    setCurrentTaskIndex(0);
    setSecondsLeft(45 * 60);
    soundEffects.play('click');
  };

  const handleSelectOption = (optIndex: number) => {
    soundEffects.play('tick');
    setAnswers((prev) => ({
      ...prev,
      [currentTask.id]: optIndex,
    }));
  };

  const handleToggleFlag = (taskId: string) => {
    soundEffects.play('click');
    setFlaggedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleFinishExam = () => {
    setIsTimerRunning(false);
    setStage('result');
    soundEffects.play('victory');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    // Calculate score
    let totalScore = 0;
    BEBRAS_TASKS.forEach((t) => {
      if (answers[t.id] === t.correctIndex) {
        totalScore += t.points;
      }
    });

    if (onRewardPoints) {
      onRewardPoints(Math.round(totalScore * 0.5), `การทดสอบจำลอง Bebras International Challenge`);
    }
  };

  // Compute breakdown stats for results
  const computeStats = () => {
    let earned = 0;
    let max = 0;
    const pillarScores: Record<string, { earned: number; max: number }> = {
      decomposition: { earned: 0, max: 0 },
      pattern: { earned: 0, max: 0 },
      abstraction: { earned: 0, max: 0 },
      algorithm: { earned: 0, max: 0 },
    };

    BEBRAS_TASKS.forEach((t) => {
      max += t.points;
      pillarScores[t.pillar].max += t.points;
      if (answers[t.id] === t.correctIndex) {
        earned += t.points;
        pillarScores[t.pillar].earned += t.points;
      }
    });

    return { earned, max, pillarScores };
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Bebras CT Challenge Simulator 🦫
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  มาตรฐานนานาชาติ สสวท.
                </span>
              </div>
              <p className="text-xs text-slate-400">
                แบบทดสอบแนวคิดเชิงคำนวณระดับนานาชาติ วัด 4 เสาหลัก (Decomposition, Pattern, Abstraction, Algorithm)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage === 'exam' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INTRO STAGE */}
        {stage === 'intro' && (
          <div className="p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-4xl shadow-xl">
              🦫
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                การประเมินทักษะแนวคิดเชิงคำนวณ Bebras Challenge
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                จำลองรูปแบบข้อสอบจริงจาก Bebras International Contest ใช้เวลาทดสอบ 45 นาที
                ข้อสอบประกอบด้วยโจทย์ปัญหาที่น่าสนใจ 7 ข้อ แบ่งตาม 4 เสาหลักแห่งวิทยาการคำนวณ
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {[
                { title: 'Decomposition', desc: 'การแยกย่อยปัญหา', emoji: '🧩' },
                { title: 'Pattern Recognition', desc: 'การหารูปแบบ', emoji: '🔍' },
                { title: 'Abstraction', desc: 'การคิดเชิงนามธรรม', emoji: '💡' },
                { title: 'Algorithms', desc: 'การคิดขั้นตอนวิธี', emoji: '⚙️' },
              ].map((p, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-lg">{p.emoji}</div>
                  <div className="text-xs font-bold text-white leading-tight">{p.title}</div>
                  <div className="text-[10px] text-slate-400">{p.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 leading-relaxed text-left flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>กติกาการสอบ:</strong> ตอบถูกได้คะแนนตามระดับความยาก (Easy 6 คะแนน, Medium 9 คะแนน, Hard 12 คะแนน) เมื่อทำครบระบบจะคำนวณคะแนนและออกเกียรติบัตรระบุสมรรถนะทันที
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartExam}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              🚀 เริ่มทำแบบทดสอบ Bebras (45 นาที)
            </button>
          </div>
        )}

        {/* EXAM STAGE */}
        {stage === 'exam' && (
          <div className="flex-1 flex flex-col md:flex-row">
            {/* Left/Main Task Display */}
            <div className="flex-1 p-5 sm:p-6 space-y-5 border-r border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    ข้อที่ {currentTask.number} / {BEBRAS_TASKS.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    {currentTask.pillarLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {currentTask.difficulty} (+{currentTask.points} คะแนน)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentTask.id)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      flaggedIds.includes(currentTask.id)
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ปักหมุดทบทวน</span>
                  </button>
                </div>
              </div>

              {/* Scenario & Question */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4 shadow-inner">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {currentTask.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {currentTask.scenario}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs sm:text-sm font-bold text-amber-200">
                  ❓ {currentTask.question}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentTask.options.map((opt, idx) => {
                  const isSelected = answers[currentTask.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white ring-2 ring-amber-500/30'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium leading-relaxed">
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentTaskIndex === 0}
                  onClick={() => setCurrentTaskIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ข้อย้อนหลัง</span>
                </button>

                {currentTaskIndex < BEBRAS_TASKS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentTaskIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ข้อถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishExam}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>ส่งกระดาษคำตอบ</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Question Palette */}
            <div className="w-full md:w-64 p-4 sm:p-5 bg-slate-950/40 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ตารางสถานะข้อสอบ
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-3 gap-2">
                {BEBRAS_TASKS.map((t, idx) => {
                  const isCurrent = idx === currentTaskIndex;
                  const isAnswered = answers[t.id] !== undefined;
                  const isFlagged = flaggedIds.includes(t.id);

                  let bgClass = 'bg-slate-800/80 border-slate-700 text-slate-400';
                  if (isCurrent) {
                    bgClass = 'bg-amber-500 text-slate-950 font-black ring-2 ring-white/40';
                  } else if (isFlagged) {
                    bgClass = 'bg-rose-500/30 border-rose-500/50 text-rose-300';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
                  }

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCurrentTaskIndex(idx)}
                      className={`h-10 rounded-xl border text-xs flex items-center justify-center font-mono cursor-pointer relative ${bgClass}`}
                    >
                      <span>{t.number}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500" />
                  <span>ตอบแล้ว ({Object.keys(answers).length} ข้อ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
                  <span>ปักหมุดทบทวน ({flaggedIds.length} ข้อ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                  <span>ยังไม่ตอบ ({BEBRAS_TASKS.length - Object.keys(answers).length} ข้อ)</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
                >
                  สิ้นสุดการสอบก่อนเวลา
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULT & CERTIFICATE STAGE */}
        {stage === 'result' && (() => {
          const stats = computeStats();
          const percent = Math.round((stats.earned / stats.max) * 100);
          const awardTier =
            percent >= 80 ? 'เกียรติบัตรเหรียญทอง (Gold Distinction)' :
            percent >= 60 ? 'เกียรติบัตรเหรียญเงิน (Silver Merit)' :
            'เกียรติบัตรเข้าร่วม (Participant)';

          return (
            <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-white">รายงานผลการประเมิน Bebras Challenge</h3>
                <p className="text-xs text-slate-400">
                  ผู้เข้าสอบ: <span className="text-white font-bold">{currentStudentName}</span> | ผลคะแนนสมรรถนะ
                </p>
              </div>

              {/* Total Score Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 text-center space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  คะแนนรวมทั้งหมด
                </div>
                <div className="text-5xl font-mono font-black text-white">
                  {stats.earned} <span className="text-2xl text-slate-500 font-sans">/ {stats.max} คะแนน</span>
                </div>
                <div className="inline-block px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                  {awardTier} ({percent}%)
                </div>
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  คะแนนจำแนกตาม 4 เสาหลัก (Computational Thinking Pillars)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'decomposition', label: 'การแยกย่อยปัญหา (Decomposition)', icon: '🧩' },
                    { key: 'pattern', label: 'การหารูปแบบ (Pattern Recognition)', icon: '🔍' },
                    { key: 'abstraction', label: 'การคิดเชิงนามธรรม (Abstraction)', icon: '💡' },
                    { key: 'algorithm', label: 'การคิดขั้นตอนวิธี (Algorithms)', icon: '⚙️' },
                  ].map((item) => {
                    const sc = stats.pillarScores[item.key];
                    const pPct = sc.max > 0 ? Math.round((sc.earned / sc.max) * 100) : 0;
                    return (
                      <div key={item.key} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-slate-200">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                          <span className="font-mono text-amber-400">{sc.earned} / {sc.max}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${pPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStage('intro')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>สอบจำลองใหม่อีกครั้ง</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  บันทึกผลและกลับสู่แดชบอร์ด
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
