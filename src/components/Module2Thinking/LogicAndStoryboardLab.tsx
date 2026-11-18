import React, { useState } from 'react';
import {
  Brain,
  Search,
  Grid3X3,
  Film,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects.ts';

interface LogicAndStoryboardLabProps {
  addPoints: (points: number, reason?: string) => void;
  onComplete?: () => void;
}

type LabTab = 'binary' | 'games' | 'storyboard' | 'checkpoint';

interface StoryScene {
  id: number;
  title: string;
  backdrop: string;
  spriteA: string;
  spriteB: string;
  dialogue: string;
  broadcastSignal: string;
  actionNote: string;
}

const DEFAULT_SCENES: StoryScene[] = [
  {
    id: 1,
    title: 'ฉากที่ 1: พบปัญหาหน้าโรงเรียน',
    backdrop: 'หน้าโรงเรียนตอนเช้า',
    spriteA: 'น้องแมวสายฟ้า',
    spriteB: 'หุ่นยนต์ผู้ช่วย',
    dialogue: 'วันนี้ฝนตกหนัก รถติดหน้าประตูโรงเรียน เราจะไปเข้าแถวทันไหม?',
    broadcastSignal: 'ส่งสาร: "rain_alert"',
    actionNote: 'เมื่อคลิกธงเขียว -> แสดงข้อความ + ส่งสาร rain_alert',
  },
  {
    id: 2,
    title: 'ฉากที่ 2: หุ่นยนต์รับสารและคำนวณทางลัด',
    backdrop: 'แผนที่ทางเดินในอาคาร',
    spriteA: 'หุ่นยนต์ผู้ช่วย',
    spriteB: 'น้องแมวสายฟ้า',
    dialogue: 'ได้รับสาร rain_alert แล้ว! เปลี่ยนเส้นทางเดินผ่านทางเชื่อมมีหลังคาทันที',
    broadcastSignal: 'ส่งสาร: "route_ready"',
    actionNote: 'เมื่อได้รับสาร rain_alert -> หุ่นยนต์คำนวณเวลาเดินทางใหม่',
  },
  {
    id: 3,
    title: 'ฉากที่ 3: เข้าห้องเรียนตรงเวลา',
    backdrop: 'ห้องเรียนวิทยาการคำนวณ',
    spriteA: 'น้องแมวสายฟ้า',
    spriteB: 'คุณครู',
    dialogue: 'เย้! ใช้การวางแผนเงื่อนไขเริ่มต้นต่างกัน จึงเดินถึงห้องเรียนทันเวลาและตัวไม่เปียก!',
    broadcastSignal: 'จบเรื่อง (End)',
    actionNote: 'เมื่อได้รับสาร route_ready -> เปลี่ยนฉาก + เล่นเสียงสำเร็จ',
  },
];

// 4x4 Sudoku preset (0 = blank)
const SUDOKU_INITIAL = [
  [1, 0, 3, 4],
  [3, 4, 0, 2],
  [2, 1, 4, 0],
  [0, 3, 2, 1],
];
const SUDOKU_SOLUTION = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const CHECKPOINT_COMPLEX = {
  question:
    'พิจารณาปัญหาการหาหน้าหนังสือ 1,000 หน้า หรือทายเลข 1 ถึง 1,000,000 และเกม OX (ป.4/1 & ป.6/1) แล้วระบุว่าแต่ละข้อ "ถูกต้อง" หรือ "ไม่ถูกต้อง"',
  statements: [
    {
      text: 'การค้นหาแบบแบ่งครึ่งช่วง (Binary Search) เปิดกลางเล่มก่อนเสมอ ทำให้ทายเลข 1–1,000,000 ได้สำเร็จภายในไม่เกิน 20 คำถาม',
      isTrue: true,
    },
    {
      text: 'การเปิดค้นหาทีละหน้าตั้งแต่หน้า 1 ไปจนถึงหน้า 950 เป็นวิธีที่ใช้จำนวนครั้งน้อยกว่า Binary Search เสมอ',
      isTrue: false,
    },
    {
      text: 'ในเกม OX ตำแหน่งที่ผู้เล่นคนแรกลงมือวางก่อน (สถานะเริ่มต้น) ส่งผลต่อทางเลือกในการวางเพื่อชนะหรือเสมอของผู้เล่นคนที่สอง',
      isTrue: true,
    },
    {
      text: 'ในการออกแบบโปรแกรมนิทานโต้ตอบ การใช้ Broadcast ช่วยให้ตัวละครหลายตัวสื่อสารและทำงานต่อจากกันได้อย่างถูกต้องตามลำดับ',
      isTrue: true,
    },
  ],
  explanation:
    'Binary Search ตัดตัวเลือกทิ้งครึ่งหนึ่งในทุกคำถาม (2²⁰ > 1,000,000) จึงหาเจอภายใน 20 ครั้ง ส่วนเกม OX และ Broadcast แสดงถึงความสำคัญของสถานะเริ่มต้นและการสื่อสารระหว่างตัวละคร',
};

export const LogicAndStoryboardLab: React.FC<LogicAndStoryboardLabProps> = ({ addPoints, onComplete }) => {
  const [activeTab, setActiveTab] = useState<LabTab>('binary');

  // --- TAB 1: Binary Search & Travel Time Calculator (ป.6/1) ---
  const [targetNum, setTargetNum] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);
  const [low, setLow] = useState<number>(1);
  const [high, setHigh] = useState<number>(1000000);
  const [guessCount, setGuessCount] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<string>('กด "ถามค่ากึ่งกลาง (Mid)" เพื่อดูการตัดตัวเลือกทิ้งครึ่งหนึ่ง!');
  const [foundBinary, setFoundBinary] = useState<boolean>(false);

  // Travel Time Calculator (ป.6/1: distance, speed, rest stop)
  const [distanceKm, setDistanceKm] = useState<number>(180);
  const [speedKmh, setSpeedKmh] = useState<number>(60);
  const [restMinutes, setRestMinutes] = useState<number>(15);
  const [restIntervalHours, setRestIntervalHours] = useState<number>(1);

  const mid = Math.floor((low + high) / 2);

  const handleStepBinary = () => {
    if (foundBinary) return;
    soundEffects.play('click');
    const nextCount = guessCount + 1;
    setGuessCount(nextCount);
    if (mid === targetNum) {
      setFoundBinary(true);
      soundEffects.play('correct');
      setLastFeedback(`เจอเลข ${targetNum.toLocaleString()} แล้วในคำถามที่ ${nextCount}! (Binary Search ใช้ไม่เกิน 20 ครั้งจาก 1,000,000)`);
      addPoints(15, 'พิชิตภารกิจ Binary Search 1–1,000,000 (ป.6/1)');
    } else if (mid < targetNum) {
      setLow(mid + 1);
      setLastFeedback(`คำถามที่ ${nextCount}: ถามว่า "มากกว่า ${mid.toLocaleString()} หรือไม่?" -> ตอบ "ใช่ (มากกว่า)" ตัดช่วงล่างทิ้งทันที!`);
    } else {
      setHigh(mid - 1);
      setLastFeedback(`คำถามที่ ${nextCount}: ถามว่า "มากกว่า ${mid.toLocaleString()} หรือไม่?" -> ตอบ "ไม่ใช่ (น้อยกว่า)" ตัดช่วงบนทิ้งทันที!`);
    }
  };

  const resetBinary = () => {
    soundEffects.play('click');
    setTargetNum(Math.floor(Math.random() * 1000000) + 1);
    setLow(1);
    setHigh(1000000);
    setGuessCount(0);
    setFoundBinary(false);
    setLastFeedback('สุ่มเลขลับใหม่ระหว่าง 1 – 1,000,000 แล้ว กดปุ่มเพื่อเริ่มค้นหาแบบแบ่งครึ่ง!');
  };

  // Compute commute/travel time with Loop & Condition
  const driveHours = speedKmh > 0 ? distanceKm / speedKmh : 0;
  const numberOfRests =
    restIntervalHours > 0 && driveHours > restIntervalHours
      ? Math.floor((driveHours - 0.0001) / restIntervalHours)
      : 0;
  const totalTravelMinutes = Math.round(driveHours * 60 + numberOfRests * restMinutes);

  // --- TAB 2: OX Game, Initial State Comparator & Mini Sudoku (ป.4/1, ป.5/1) ---
  const [oxBoard, setOxBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [oxLogs, setOxLogs] = useState<string[]>([]);
  const [initialFirstCorner, setInitialFirstCorner] = useState<'center' | 'corner'>('center');

  const checkOxWinner = (b: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(Boolean) ? 'DRAW' : null;
  };

  const oxWinner = checkOxWinner(oxBoard);

  const handleOxClick = (idx: number) => {
    if (oxBoard[idx] || oxWinner) return;
    soundEffects.play('click');
    const next = [...oxBoard];
    next[idx] = 'X';
    const nextLogs = [...oxLogs, `X ลงช่อง ${idx + 1}`];
    const wAfterX = checkOxWinner(next);
    if (!wAfterX) {
      // Smart O counter
      const empty = next.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
      if (empty.length > 0) {
        const pick = next[4] === null ? 4 : empty[0];
        next[pick] = 'O';
        nextLogs.push(`O โต้กลับช่อง ${pick + 1}`);
      }
    }
    setOxBoard(next);
    setOxLogs(nextLogs);
    if (checkOxWinner(next) === 'X') {
      soundEffects.play('correct');
      addPoints(10, 'ชนะเกม OX ด้วยการวางแผนเชิงตรรกะ (ป.4/1)');
    }
  };

  const startOxPreset = (mode: 'center' | 'corner') => {
    soundEffects.play('click');
    setInitialFirstCorner(mode);
    const preset = Array(9).fill(null);
    if (mode === 'center') {
      preset[4] = 'X';
      setOxLogs(['สถานะเริ่มต้น A: X ยึดจุดกึ่งกลาง (ช่อง 5) -> เปิดเส้นทางชนะได้ 4 แนว!']);
    } else {
      preset[0] = 'X';
      setOxLogs(['สถานะเริ่มต้น B: X ยึดมุมซ้ายบน (ช่อง 1) -> เปิดเส้นทางชนะได้ 3 แนว']);
    }
    setOxBoard(preset);
  };

  // Mini Sudoku 4x4 state
  const [sudokuGrid, setSudokuGrid] = useState<number[][]>(() => SUDOKU_INITIAL.map((r) => [...r]));
  const [sudokuChecked, setSudokuChecked] = useState<boolean>(false);

  const handleSudokuCellClick = (r: number, c: number) => {
    if (SUDOKU_INITIAL[r][c] !== 0) return;
    soundEffects.play('click');
    setSudokuChecked(false);
    setSudokuGrid((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((val, ci) => (ci === c ? (val % 4) + 1 : val)) : row
      )
    );
  };

  const isSudokuComplete = sudokuGrid.every((row, r) =>
    row.every((val, c) => val === SUDOKU_SOLUTION[r][c])
  );

  // --- TAB 3: Storyboard Builder & Broadcast Preview (ป.4/1, ป.4/2) ---
  const [scenes, setScenes] = useState<StoryScene[]>(DEFAULT_SCENES);
  const [playingSceneIdx, setPlayingSceneIdx] = useState<number | null>(null);

  const playStoryboard = async () => {
    for (let i = 0; i < scenes.length; i++) {
      setPlayingSceneIdx(i);
      soundEffects.play('click');
      await new Promise((r) => setTimeout(r, 1400));
    }
    soundEffects.play('correct');
    addPoints(10, 'ทดลองรัน Storyboard นิทานโต้ตอบสำเร็จ (ป.4/2)');
  };

  // --- TAB 4: Checkpoint Complex Choice ---
  const [cpChoices, setCpChoices] = useState<Record<number, boolean>>({});
  const [cpSubmitted, setCpSubmitted] = useState<boolean>(false);
  const [cpRewarded, setCpRewarded] = useState<boolean>(false);

  const handleCheckCp = () => {
    setCpSubmitted(true);
    const allOk = CHECKPOINT_COMPLEX.statements.every((st, idx) => cpChoices[idx] === st.isTrue);
    if (allOk) {
      soundEffects.play('correct');
      if (!cpRewarded) {
        setCpRewarded(true);
        addPoints(25, 'ผ่านแบบประเมินตรรกะและสตอรีบอร์ด O-NET ป.4–ป.6');
        onComplete?.();
      }
    } else {
      soundEffects.play('error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <Brain className="w-4 h-4" />
            <span>มาตรฐาน ว 4.2 ป.4/1 (Must-know) · ป.4/2 · ป.5/1 · ป.6/1 (Must-know)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ห้องทดลองตรรกะ เกมคิดวิเคราะห์ &amp; ออกแบบสตอรีบอร์ด
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            ฝึกทำนายผลลัพธ์เมื่อเงื่อนไขเริ่มต้นต่างกัน ทดลอง Binary Search ทายเลข 1–1,000,000 เล่นเกม OX / Sudoku และออกแบบ Storyboard นิทานโต้ตอบ
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('binary')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'binary'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            1. Binary Search &amp; เวลาเดินทาง (ป.6/1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('games')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'games'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            2. เกม OX · Sudoku · สถานะเริ่มต้น (ป.4/1, ป.5/1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storyboard')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'storyboard'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            3. ออกแบบ Storyboard &amp; Logo (ป.4/2)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checkpoint')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === 'checkpoint'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            4. โจทย์ O-NET เชิงซ้อน
          </button>
        </div>
      </div>

      {/* TAB 1: BINARY SEARCH & TRAVEL CALCULATOR */}
      {activeTab === 'binary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Binary Search Arena */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  ภารกิจ ป.6/1 (Must-know) · Loop + Condition
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ทายเลข 1 – 1,000,000 ให้เจอภายใน 20 คำถาม!
                </h4>
              </div>
              <button
                type="button"
                onClick={resetBinary}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>สุ่มเลขลับใหม่</span>
              </button>
            </div>

            {/* Range metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500">ขอบเขตต่ำสุด (Low)</div>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {low.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700">
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">ค่ากึ่งกลาง (Mid)</div>
                <div className="text-base font-black font-mono text-indigo-700 dark:text-indigo-300">
                  {mid.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500">ขอบเขตสูงสุด (High)</div>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {high.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  เลขลับเป้าหมาย (จำลองคำตอบของระบบ): <strong className="font-mono text-indigo-600">{targetNum.toLocaleString()}</strong>
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  จำนวนครั้งที่ถาม: {guessCount} / 20
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {lastFeedback}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                จำนวนตัวเลขที่เหลืออยู่: <strong className="font-mono text-slate-800 dark:text-slate-200">{(high - low + 1).toLocaleString()}</strong> ตัวเลือก
              </div>
              <button
                type="button"
                disabled={foundBinary}
                onClick={handleStepBinary}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>{foundBinary ? 'ค้นหาสำเร็จแล้ว!' : `ถามกึ่งกลาง (${mid.toLocaleString()})`}</span>
              </button>
            </div>
          </div>

          {/* Right 5 cols: Travel Time Calculator with Loop & Rest Conditions */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>จำลองโจทย์ ป.6/1: คำนวณเวลาเดินทางรวมพัก</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              หากเดินทางไกลและมีเงื่อนไขว่า &quot;ทุก ๆ X ชั่วโมง ต้องแวะพัก Y นาที&quot; ต้องใช้ทั้งลูปและเงื่อนไขคำนวณเวลาจริง
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>ระยะทางทั้งหมด</span>
                  <span className="font-mono text-indigo-600">{distanceKm} กม.</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={600}
                  step={30}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>ความเร็วเฉลี่ย</span>
                  <span className="font-mono text-indigo-600">{speedKmh} กม./ชม.</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={120}
                  step={10}
                  value={speedKmh}
                  onChange={(e) => setSpeedKmh(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    พักทุก ๆ (ชม.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={restIntervalHours}
                    onChange={(e) => setRestIntervalHours(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    พักครั้งละ (นาที)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    step={5}
                    value={restMinutes}
                    onChange={(e) => setRestMinutes(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>เวลาขับรถล้วน:</span>
                <span className="font-mono font-bold">{driveHours.toFixed(1)} ชม. ({Math.round(driveHours * 60)} นาที)</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนครั้งที่ต้องหยุดพัก:</span>
                <span className="font-mono font-bold text-amber-600">{numberOfRests} ครั้ง ({numberOfRests * restMinutes} นาที)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm font-black text-indigo-700 dark:text-indigo-400">
                <span>เวลาเดินทางรวมสุทธิ:</span>
                <span className="font-mono">
                  {Math.floor(totalTravelMinutes / 60)} ชม. {totalTravelMinutes % 60} นาที
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OX GAME, INITIAL STATE & MINI SUDOKU */}
      {activeTab === 'games' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* OX Game + Initial State Comparator */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-sky-600">ป.4/1 (Must-know) · เหตุผลเชิงตรรกะ</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  เกม OX: เงื่อนไขเริ่มต้นต่างกัน ผลลัพธ์ต่างกัน
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOxBoard(Array(9).fill(null));
                  setOxLogs([]);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                ล้างกระดาน
              </button>
            </div>

            {/* Initial State Preset Buttons */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => startOxPreset('center')}
                className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer ${
                  initialFirstCorner === 'center'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                }`}
              >
                สถานะเริ่มต้น A: วางกลางกระดาน
              </button>
              <button
                type="button"
                onClick={() => startOxPreset('corner')}
                className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer ${
                  initialFirstCorner === 'corner'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                }`}
              >
                สถานะเริ่มต้น B: วางมุมซ้ายบน
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {oxBoard.map((cell, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOxClick(idx)}
                  className="aspect-square rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 text-2xl font-black flex items-center justify-center cursor-pointer transition-all"
                >
                  <span className={cell === 'X' ? 'text-indigo-600' : 'text-rose-500'}>
                    {cell || <span className="text-xs font-mono text-slate-300">{idx + 1}</span>}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {oxWinner === 'X'
                  ? 'ผลการเล่น: คุณ (X) ชนะ!'
                  : oxWinner === 'O'
                  ? 'ผลการเล่น: AI (O) ชนะ ลองสังเกตจุดที่พลาดแล้วเริ่มใหม่!'
                  : oxWinner === 'DRAW'
                  ? 'ผลการเล่น: เสมอกัน!'
                  : 'ตาคุณ (X): คลิกเลือกช่องที่วางแผนไว้'}
              </div>
              {oxLogs.length > 0 && (
                <div className="text-[11px] text-slate-500">{oxLogs.slice(-3).join(' → ')}</div>
              )}
            </div>
          </div>

          {/* Mini Sudoku 4x4 (ป.5/1) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-600">ป.5/1 · เหตุผลเชิงตรรกะ &amp; เงื่อนไข</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Mini Sudoku 4×4 (เติมเลข 1–4 ห้ามซ้ำแถว/หลัก/กลุ่ม)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSudokuGrid(SUDOKU_INITIAL.map((r) => [...r]));
                  setSudokuChecked(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                รีเซ็ตโจทย์
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-w-[240px] mx-auto p-2 rounded-2xl bg-slate-200 dark:bg-slate-700">
              {sudokuGrid.map((row, r) =>
                row.map((val, c) => {
                  const isFixed = SUDOKU_INITIAL[r][c] !== 0;
                  const isWrong = sudokuChecked && val !== 0 && val !== SUDOKU_SOLUTION[r][c];
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      disabled={isFixed}
                      onClick={() => handleSudokuCellClick(r, c)}
                      className={`aspect-square rounded-xl font-mono font-black text-base flex items-center justify-center transition-all ${
                        isFixed
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white cursor-default'
                          : isWrong
                          ? 'bg-rose-100 text-rose-700 border-2 border-rose-400 cursor-pointer'
                          : 'bg-white dark:bg-slate-900 text-indigo-600 border-2 border-indigo-200 hover:border-indigo-500 cursor-pointer'
                      }`}
                    >
                      {val === 0 ? '?' : val}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">คลิกที่ช่องสีขาวเพื่อสลับตัวเลข 1 → 2 → 3 → 4</span>
              <button
                type="button"
                onClick={() => {
                  setSudokuChecked(true);
                  if (isSudokuComplete) {
                    soundEffects.play('correct');
                    addPoints(15, 'ไขปริศนา Mini Sudoku 4×4 สำเร็จ (ป.5/1)');
                  } else {
                    soundEffects.play('error');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                ตรวจ Sudoku
              </button>
            </div>

            {sudokuChecked && (
              <div
                className={`p-3 rounded-xl text-xs border font-semibold ${
                  isSudokuComplete
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {isSudokuComplete
                  ? 'ถูกต้องครบทุกแถว ทุกหลัก และทุกกล่อง 2×2!'
                  : 'ยังมีช่องที่เลขซ้ำกันในแถว/หลัก/กลุ่มย่อย ลองคลิกปรับช่องสีแดงดูนะ'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORYBOARD DESIGNER & LOGO VS SCRATCH */}
      {activeTab === 'storyboard' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-600" />
                <span>ออกแบบ Storyboard นิทานโต้ตอบ &amp; การสื่อสารข้ามตัวละคร (Broadcast)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                มาตรฐาน ป.4/1–ป.4/2: วางแผนลำดับฉาก บทสนทนา และข้อความ Broadcast ก่อนลงมือต่อบล็อกใน Scratch
              </p>
            </div>
            <button
              type="button"
              onClick={playStoryboard}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>เล่นพรีวิว Storyboard</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenes.map((sc, idx) => {
              const isPlaying = playingSceneIdx === idx;
              return (
                <div
                  key={sc.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isPlaying
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <span>{sc.title}</span>
                    <span className="font-mono text-[11px] text-slate-400">#{idx + 1}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">ฉากหลัง (Backdrop):</label>
                      <input
                        type="text"
                        value={sc.backdrop}
                        onChange={(e) =>
                          setScenes((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, backdrop: e.target.value } : item))
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">บทสนทนาตัวละคร ({sc.spriteA}):</label>
                      <textarea
                        rows={2}
                        value={sc.dialogue}
                        onChange={(e) =>
                          setScenes((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, dialogue: e.target.value } : item))
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{sc.broadcastSignal}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{sc.actionNote}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Logo vs Scratch Comparison Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                ภาษาโลโก (Logo Turtle Graphics · ป.4/2)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                สั่งเต่าเดินหน้าและหมุนด้วยข้อความสั้น ๆ เช่น <code className="font-mono text-indigo-600">REPEAT 4 [FD 80 RT 90]</code> เพื่อวาดรูปสี่เหลี่ยมจัตุรัส
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                โปรแกรม Scratch แบบบล็อก (ป.4/2 – ป.6/2)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                ใช้บล็อกสีสันสดใสต่อกัน เช่น <code className="font-mono text-emerald-600">ทำซ้ำ 4 รอบ [ก้าว 80 + หมุน 90°]</code> พร้อมเพิ่มเสียงและ Broadcast ได้ง่าย
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLEX CHOICE ASSESSMENT */}
      {activeTab === 'checkpoint' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-indigo-600">
                แบบฝึกหัดเลือกตอบเชิงซ้อน O-NET (ป.4/1, ป.4/2, ป.6/1)
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {CHECKPOINT_COMPLEX.question}
              </h4>
            </div>
            {cpSubmitted && (
              <button
                type="button"
                onClick={() => {
                  setCpChoices({});
                  setCpSubmitted(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                ทำใหม่
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <th className="py-3 px-4">ข้อความที่พิจารณา</th>
                  <th className="py-3 px-4 text-center w-28">ถูกต้อง</th>
                  <th className="py-3 px-4 text-center w-28">ไม่ถูกต้อง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {CHECKPOINT_COMPLEX.statements.map((st, idx) => {
                  const val = cpChoices[idx];
                  const isOk = cpSubmitted && val === st.isTrue;
                  const isBad = cpSubmitted && val !== st.isTrue;
                  return (
                    <tr key={idx} className={isOk ? 'bg-emerald-50/70' : isBad ? 'bg-rose-50/70' : ''}>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                        <strong className="mr-1.5">{idx + 1}.</strong>
                        {st.text}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={cpSubmitted}
                          onClick={() => setCpChoices((prev) => ({ ...prev, [idx]: true }))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                            val === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ถูกต้อง
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={cpSubmitted}
                          onClick={() => setCpChoices((prev) => ({ ...prev, [idx]: false }))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                            val === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ไม่ถูกต้อง
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {cpSubmitted ? (
              <div className="flex-1 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>เฉลย:</strong> {CHECKPOINT_COMPLEX.explanation}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500">เลือกคำตอบครบ 4 ข้อย่อยแล้วกดตรวจ</span>
            )}

            {!cpSubmitted && (
              <button
                type="button"
                disabled={CHECKPOINT_COMPLEX.statements.some((_, idx) => cpChoices[idx] === undefined)}
                onClick={handleCheckCp}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>ตรวจคำตอบเชิงซ้อน</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
