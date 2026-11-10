import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  ChevronRight,
  ArrowUp,
  Repeat,
  Zap,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Volume2,
  Star,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface BlockMazeRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardPoints?: (amount: number, reason: string) => void;
}

export type CommandType = 'forward' | 'turn_left' | 'turn_right' | 'repeat_3_forward' | 'repeat_4_forward';

export interface CommandBlock {
  id: string;
  type: CommandType;
  label: string;
  icon: string;
  color: string;
}

interface LevelConfig {
  id: number;
  title: string;
  concept: string;
  gridSize: number; // e.g. 6x6
  startPos: { x: number; y: number; dir: number }; // 0: North, 1: East, 2: South, 3: West
  targetPos: { x: number; y: number };
  walls: Array<{ x: number; y: number }>;
  stars: Array<{ x: number; y: number }>;
  optimalSteps: number;
  hint: string;
}

const COMMAND_TEMPLATES: Record<CommandType, { label: string; icon: string; color: string }> = {
  forward: { label: 'เดินหน้า 1 ช่อง', icon: '⬆️', color: 'bg-blue-600 hover:bg-blue-500' },
  turn_left: { label: 'หันซ้าย 90°', icon: '↩️', color: 'bg-amber-600 hover:bg-amber-500' },
  turn_right: { label: 'หันขวา 90°', icon: '↪️', color: 'bg-purple-600 hover:bg-purple-500' },
  repeat_3_forward: { label: 'ทำซ้ำ 3 ครั้ง: เดินหน้า', icon: '🔁', color: 'bg-emerald-600 hover:bg-emerald-500' },
  repeat_4_forward: { label: 'ทำซ้ำ 4 ครั้ง: เดินหน้า', icon: '🔁', color: 'bg-teal-600 hover:bg-teal-500' },
};

const MAZE_LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'ด่าน 1: ก้าวแรกสู่อัลกอริทึม',
    concept: 'ลำดับขั้นตอน (Sequence)',
    gridSize: 5,
    startPos: { x: 1, y: 3, dir: 1 }, // Facing East
    targetPos: { x: 3, y: 3 },
    walls: [],
    stars: [{ x: 2, y: 3 }],
    optimalSteps: 2,
    hint: 'ใส่คำสั่ง "เดินหน้า 1 ช่อง" 2 ครั้งเพื่อไปถึงธงชัยชนะ!',
  },
  {
    id: 2,
    title: 'ด่าน 2: ฝึกเลี้ยวซ้ายเลี้ยวขวา',
    concept: 'การเปลี่ยนทิศทาง (Turning)',
    gridSize: 5,
    startPos: { x: 1, y: 3, dir: 1 }, // East
    targetPos: { x: 3, y: 1 },
    walls: [{ x: 2, y: 2 }],
    stars: [{ x: 3, y: 3 }],
    optimalSteps: 4,
    hint: 'เดินหน้า 2 ก้าว แล้วหันซ้าย แล้วเดินหน้าอีก 2 ก้าว',
  },
  {
    id: 3,
    title: 'ด่าน 3: บันไดซิกแซก',
    concept: 'รูปแบบซ้ำ (Pattern Recognition)',
    gridSize: 6,
    startPos: { x: 1, y: 4, dir: 0 }, // North
    targetPos: { x: 4, y: 1 },
    walls: [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 2 },
    ],
    stars: [
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
    optimalSteps: 6,
    hint: 'เดินหน้า หันขวา เดินหน้า หันซ้าย สลับกันเหมือนขั้นบันได',
  },
  {
    id: 4,
    title: 'ด่าน 4: หลบสิ่งกีดขวาง',
    concept: 'การแก้ปัญหาเฉพาะหน้า (Debugging)',
    gridSize: 6,
    startPos: { x: 0, y: 5, dir: 0 }, // North
    targetPos: { x: 5, y: 0 },
    walls: [
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
    stars: [
      { x: 2, y: 3 },
      { x: 2, y: 1 },
    ],
    optimalSteps: 8,
    hint: 'เดินอ้อมหลบกำแพงสีแดงเพื่อเก็บดาวให้ครบ!',
  },
  {
    id: 5,
    title: 'ด่าน 5: พลังแห่งการวนซ้ำ (Loop)',
    concept: 'ลูปทำซ้ำ (Repeat Loop)',
    gridSize: 6,
    startPos: { x: 1, y: 4, dir: 1 }, // East
    targetPos: { x: 4, y: 4 },
    walls: [],
    stars: [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ],
    optimalSteps: 1,
    hint: 'ใช้บล็อก "ทำซ้ำ 3 ครั้ง: เดินหน้า" เพียงบล็อกเดียวเพื่อผ่านด่านได้ในพริบตา!',
  },
  {
    id: 6,
    title: 'ด่าน 6: วนสี่เหลี่ยมรอบเกาะ',
    concept: 'ลูปประกอบเงื่อนไข',
    gridSize: 6,
    startPos: { x: 1, y: 1, dir: 1 }, // East
    targetPos: { x: 1, y: 2 },
    walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    stars: [
      { x: 4, y: 1 },
      { x: 4, y: 4 },
      { x: 1, y: 4 },
    ],
    optimalSteps: 8,
    hint: 'เดินตามขอบรูปสี่เหลี่ยมเพื่อเก็บดาวให้ครบทั้ง 3 ดวง',
  },
  {
    id: 7,
    title: 'ด่าน 7: เขาวงกตรูปตัวยู (U-Turn)',
    concept: 'อัลกอริทึมค้นหาทางออก',
    gridSize: 7,
    startPos: { x: 1, y: 5, dir: 0 }, // North
    targetPos: { x: 5, y: 5 },
    walls: [
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
    ],
    stars: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 5, y: 1 },
    ],
    optimalSteps: 12,
    hint: 'ขึ้นไปสุดทาง เลี้ยวขวาข้ามกำแพงกั้น แล้วเลี้ยวขวาลงมา',
  },
  {
    id: 8,
    title: 'ด่าน 8: ทางคดเคี้ยวสไปรัล',
    concept: 'การคิดเชิงนามธรรม (Abstraction)',
    gridSize: 7,
    startPos: { x: 0, y: 0, dir: 1 }, // East
    targetPos: { x: 3, y: 3 },
    walls: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
      { x: 2, y: 4 }, { x: 3, y: 4 },
    ],
    stars: [{ x: 5, y: 0 }, { x: 5, y: 5 }, { x: 1, y: 5 }],
    optimalSteps: 14,
    hint: 'วนตามเกลียวนอกเข้าไปสู่จุดศูนย์กลาง',
  },
  {
    id: 9,
    title: 'ด่าน 9: ข้ามสะพานหินแคบ',
    concept: 'การแก้จุดบกพร่อง (Debugging)',
    gridSize: 7,
    startPos: { x: 0, y: 3, dir: 1 }, // East
    targetPos: { x: 6, y: 3 },
    walls: [
      { x: 1, y: 2 }, { x: 1, y: 4 },
      { x: 2, y: 1 }, { x: 2, y: 5 },
      { x: 4, y: 2 }, { x: 4, y: 4 },
      { x: 5, y: 1 }, { x: 5, y: 5 },
    ],
    stars: [{ x: 2, y: 3 }, { x: 4, y: 3 }],
    optimalSteps: 6,
    hint: 'ทางตรงที่มีซอกหิน ระวังอย่าเลี้ยวผิดช่อง!',
  },
  {
    id: 10,
    title: 'ด่าน 10: เขาวงกตปรมาจารย์ (Master Maze)',
    concept: 'บูรณาการ 4 เสาหลักการคิดคำนวณ',
    gridSize: 8,
    startPos: { x: 0, y: 7, dir: 0 }, // North
    targetPos: { x: 7, y: 0 },
    walls: [
      { x: 1, y: 7 }, { x: 1, y: 6 }, { x: 1, y: 5 },
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
      { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
    ],
    stars: [{ x: 0, y: 4 }, { x: 4, y: 1 }, { x: 6, y: 5 }],
    optimalSteps: 18,
    hint: 'ด่านสุดท้าย! วางแผนอัลกอริทึมอย่างรอบคอบเพื่อคว้าแชมป์ Coder Master!',
  },
];

export const BlockMazeRunner: React.FC<BlockMazeRunnerProps> = ({
  isOpen,
  onClose,
  onAwardPoints,
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const level = MAZE_LEVELS[currentLevelIdx];

  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [playerPos, setPlayerPos] = useState({ ...level.startPos });
  const [collectedStars, setCollectedStars] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCommandIdx, setActiveCommandIdx] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});

  // Reset state when level changes
  useEffect(() => {
    setPlayerPos({ ...level.startPos });
    setCollectedStars([]);
    setCommands([]);
    setHasWon(false);
    setErrorMessage(null);
    setActiveCommandIdx(null);
    setIsRunning(false);
  }, [currentLevelIdx]);

  const handleAddCommand = (type: CommandType) => {
    if (isRunning) return;
    const template = COMMAND_TEMPLATES[type];
    const newBlock: CommandBlock = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: template.label,
      icon: template.icon,
      color: template.color,
    };
    setCommands([...commands, newBlock]);
    soundEffects.play('click');
  };

  const handleRemoveCommand = (idx: number) => {
    if (isRunning) return;
    setCommands(commands.filter((_, i) => i !== idx));
    soundEffects.play('click');
  };

  const handleClear = () => {
    if (isRunning) return;
    setCommands([]);
    setPlayerPos({ ...level.startPos });
    setCollectedStars([]);
    setHasWon(false);
    setErrorMessage(null);
    soundEffects.play('click');
  };

  const handleResetPosition = () => {
    setPlayerPos({ ...level.startPos });
    setCollectedStars([]);
    setHasWon(false);
    setErrorMessage(null);
    setActiveCommandIdx(null);
    setIsRunning(false);
    soundEffects.play('click');
  };

  // Run the sequence of commands step-by-step
  const handleRunCode = async () => {
    if (isRunning || commands.length === 0) return;
    setIsRunning(true);
    setErrorMessage(null);
    setHasWon(false);
    soundEffects.play('click');

    let currentPos = { ...level.startPos };
    let starsGained: string[] = [];
    setPlayerPos(currentPos);
    setCollectedStars([]);

    // Directions: 0: North (y-1), 1: East (x+1), 2: South (y+1), 3: West (x-1)
    const dirOffsets = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
    ];

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (let i = 0; i < commands.length; i++) {
      setActiveCommandIdx(i);
      const cmd = commands[i];

      // Handle Repeat loops
      let stepsToExecute = 1;
      let actionType = cmd.type;
      if (cmd.type === 'repeat_3_forward') {
        stepsToExecute = 3;
        actionType = 'forward';
      } else if (cmd.type === 'repeat_4_forward') {
        stepsToExecute = 4;
        actionType = 'forward';
      }

      for (let s = 0; s < stepsToExecute; s++) {
        await sleep(350);

        if (actionType === 'forward') {
          const offset = dirOffsets[currentPos.dir];
          const nextX = currentPos.x + offset.x;
          const nextY = currentPos.y + offset.y;

          // Check boundary
          if (nextX < 0 || nextX >= level.gridSize || nextY < 0 || nextY >= level.gridSize) {
            setErrorMessage('💥 โอ๊ะ! น้องแมวเดินชนขอบหน้าผา ลองแก้ไขโค้ดดูใหม่นะ');
            soundEffects.play('error');
            setIsRunning(false);
            setActiveCommandIdx(null);
            return;
          }

          // Check wall
          const isWall = level.walls.some((w) => w.x === nextX && w.y === nextY);
          if (isWall) {
            setErrorMessage('🧱 ชนกำแพงหิน! ลองเลี้ยวหลบสิ่งกีดขวาง');
            soundEffects.play('error');
            setIsRunning(false);
            setActiveCommandIdx(null);
            return;
          }

          currentPos = { ...currentPos, x: nextX, y: nextY };
          setPlayerPos({ ...currentPos });
          soundEffects.play('click');

          // Check star collection
          const starAtPos = level.stars.find((st) => st.x === nextX && st.y === nextY);
          if (starAtPos) {
            const key = `${nextX},${nextY}`;
            if (!starsGained.includes(key)) {
              starsGained.push(key);
              setCollectedStars([...starsGained]);
              soundEffects.play('correct');
            }
          }
        } else if (actionType === 'turn_left') {
          currentPos = { ...currentPos, dir: (currentPos.dir + 3) % 4 };
          setPlayerPos({ ...currentPos });
          soundEffects.play('click');
        } else if (actionType === 'turn_right') {
          currentPos = { ...currentPos, dir: (currentPos.dir + 1) % 4 };
          setPlayerPos({ ...currentPos });
          soundEffects.play('click');
        }
      }
    }

    setIsRunning(false);
    setActiveCommandIdx(null);

    // Check if reached target
    if (currentPos.x === level.targetPos.x && currentPos.y === level.targetPos.y) {
      setHasWon(true);
      soundEffects.play('victory');
      confetti({ particleCount: 70, spread: 60 });

      // Calculate rating 1-3 stars
      const starCount = commands.length <= level.optimalSteps + 2 ? 3 : 2;
      setLevelStars((prev) => ({ ...prev, [level.id]: Math.max(prev[level.id] || 0, starCount) }));

      if (onAwardPoints) {
        onAwardPoints(15, `ผ่านด่านที่ ${level.id} ใน Block Maze Runner (+15 EXP)`);
      }
    } else {
      setErrorMessage('🏁 ยังไม่ถึงธงชัยชนะ! ลองเพิ่มคำสั่งให้ถึงจุดหมายนะ');
      soundEffects.play('tick');
    }
  };

  const dirRotation = [0, 90, 180, 270]; // 0: North, 1: East, 2: South, 3: West

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  🐱 Coder Maze Runner: ตะลุยด่านตรรกะอัลกอริทึม
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  10 ด่าน
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เขียนบล็อกคำสั่งพาน้องแมวเก็บดาวและมุ่งสู่ธงชัยชนะ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Selector Bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs custom-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">เลือกระดับ:</span>
          {MAZE_LEVELS.map((lvl, idx) => {
            const isCurrent = idx === currentLevelIdx;
            const stars = levelStars[lvl.id] || 0;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  if (!isRunning) setCurrentLevelIdx(idx);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>ด่าน {lvl.id}</span>
                {stars > 0 && (
                  <span className="text-amber-400 text-[10px]">
                    {'★'.repeat(stars)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Maze Grid View */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{level.title}</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-mono">
                      {level.concept}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    💡 {level.hint}
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>
                    ดาว: {collectedStars.length} / {level.stars.length}
                  </span>
                </div>
              </div>

              {/* Grid Canvas Board */}
              <div
                className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner inline-grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))`,
                  width: `${Math.min(420, level.gridSize * 65)}px`,
                  height: `${Math.min(420, level.gridSize * 65)}px`,
                }}
              >
                {Array.from({ length: level.gridSize * level.gridSize }).map((_, i) => {
                  const x = i % level.gridSize;
                  const y = Math.floor(i / level.gridSize);
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const isTarget = level.targetPos.x === x && level.targetPos.y === y;
                  const isWall = level.walls.some((w) => w.x === x && w.y === y);
                  const isStar =
                    level.stars.some((st) => st.x === x && st.y === y) &&
                    !collectedStars.includes(`${x},${y}`);

                  return (
                    <div
                      key={i}
                      className={`relative rounded-xl border flex items-center justify-center transition-all ${
                        isWall
                          ? 'bg-rose-900/80 border-rose-800 text-white shadow-xs'
                          : isTarget
                          ? 'bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Wall tile */}
                      {isWall && <span className="text-base sm:text-xl">🧱</span>}

                      {/* Star item */}
                      {isStar && !isPlayer && (
                        <span className="text-base sm:text-xl animate-pulse">⭐️</span>
                      )}

                      {/* Flag destination */}
                      {isTarget && !isPlayer && (
                        <span className="text-base sm:text-xl animate-bounce">🚩</span>
                      )}

                      {/* Player character with direction rotation */}
                      {isPlayer && (
                        <div
                          className="text-2xl sm:text-3xl transition-transform duration-300 drop-shadow-md z-10"
                          style={{
                            transform: `rotate(${dirRotation[playerPos.dir]}deg)`,
                          }}
                        >
                          🐱
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Message */}
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center w-full animate-shake">
                  {errorMessage}
                </div>
              )}

              {/* Win Modal Banner */}
              {hasWon && (
                <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-300 dark:border-emerald-600 text-center w-full animate-in zoom-in-95 duration-200">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    🎉 ยอดเยี่ยมมาก! ผ่านด่านที่ {level.id} สำเร็จ!
                  </span>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    ได้รับ 15 EXP &amp; ดาวทอง 3 ดวง ⭐⭐⭐
                  </div>
                  {currentLevelIdx < MAZE_LEVELS.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentLevelIdx(currentLevelIdx + 1)}
                      className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>ไปต่อด่าน {level.id + 1}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Code Workspace & Toolbox */}
            <div className="lg:col-span-5 space-y-4">
              {/* Toolbox Blocks */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>กล่องคำสั่งบล็อก (Toolbox)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">คลิกเพื่อใส่ในโปรแกรม</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddCommand('forward')}
                    disabled={isRunning}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>⬆️</span>
                    <span>เดินหน้า 1 ช่อง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddCommand('turn_left')}
                    disabled={isRunning}
                    className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>↩️</span>
                    <span>หันซ้าย 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddCommand('turn_right')}
                    disabled={isRunning}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>↪️</span>
                    <span>หันขวา 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddCommand('repeat_3_forward')}
                    disabled={isRunning}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>🔁</span>
                    <span>ทำซ้ำ 3 ก้าว</span>
                  </button>
                </div>
              </div>

              {/* Workspace Sequence */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      โปรแกรมของฉัน ({commands.length} คำสั่ง)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (เหมาะสม ~{level.optimalSteps} บล็อก)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetPosition}
                      disabled={isRunning}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      รีเซ็ตตำแหน่ง
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isRunning}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      ล้างทั้งหมด
                    </button>
                  </div>
                </div>

                {/* Commands Sequence Stack */}
                <div className="min-h-48 max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 custom-scrollbar">
                  {commands.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span>ยังไม่มีบล็อกคำสั่ง</span>
                      <span className="text-[11px] mt-1 text-slate-500">
                        คลิกเลือกบล็อกคำสั่งจากกล่องด้านบนเพื่อสร้างอัลกอริทึม
                      </span>
                    </div>
                  ) : (
                    commands.map((cmd, idx) => (
                      <div
                        key={cmd.id}
                        className={`p-2 rounded-xl text-white text-xs font-bold flex items-center justify-between transition-all ${
                          cmd.color.split(' ')[0]
                        } ${
                          activeCommandIdx === idx
                            ? 'ring-4 ring-amber-400 ring-offset-1 scale-102 shadow-md'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-black/20 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{cmd.icon}</span>
                          <span>{cmd.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommand(idx)}
                          disabled={isRunning}
                          className="p-1 text-white/70 hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Run / Stop Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRunCode}
                    disabled={isRunning || commands.length === 0}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-pulse' : ''}`} />
                    <span>{isRunning ? 'กำลังรันโค้ด...' : 'รันโค้ดทันที (Run Algorithm)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPosition}
                    className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
                    title="เริ่มตำแหน่งใหม่"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
          <span>สพฐ. และ สสวท. • มาตรฐาน ว 4.2 การคิดเชิงคำนวณและขั้นตอนวิธี</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
