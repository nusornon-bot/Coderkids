import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Users,
  Trophy,
  RotateCw,
  Plus,
  Trash2,
  Shuffle,
  Volume2,
  Award,
  Printer,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { UserProfile } from '../types/index.ts';

interface ClassroomLuckyWheelProps {
  isOpen: boolean;
  onClose: () => void;
  profiles?: UserProfile[];
  onAwardBonusPoints?: (amount: number, reason: string) => void;
}

const DEFAULT_STUDENT_NAMES = [
  'ด.ช. พณสร ไทยจินดา',
  'ด.ญ. กัญญาพัชร มณีโชติ',
  'ด.ช. นวพล ศรีสุข',
  'ด.ญ. ธัญญารัตน์ ชูแก้ว',
  'ด.ช. ภูริณัฐ สุวรรณรัตน์',
  'ด.ญ. ศุภิสรา รัตนพงศ์',
  'ด.ช. อัครวินท์ ทองคำ',
  'ด.ญ. นภัสสร สุขเกษม',
  'ด.ช. วรัญญู ประเสริฐสุข',
  'ด.ญ. ชนัญชิดา แสงทอง',
  'ด.ช. ธนกฤต มงคลกุล',
  'ด.ญ. ปรียานุช รักษ์ดี',
];

const TEAM_THEMES = [
  { name: 'ทีม 🐱 Scratch Cyber', color: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-800' },
  { name: 'ทีม 📟 Micro:bit Alpha', color: 'from-indigo-500 to-blue-600', badge: 'bg-indigo-100 text-indigo-800' },
  { name: 'ทีม 🧠 AI Innovator', color: 'from-purple-500 to-violet-600', badge: 'bg-purple-100 text-purple-800' },
  { name: 'ทีม 🥽 3D VR Builders', color: 'from-cyan-500 to-teal-600', badge: 'bg-cyan-100 text-cyan-800' },
  { name: 'ทีม 🐍 Python Masters', color: 'from-emerald-500 to-green-600', badge: 'bg-emerald-100 text-emerald-800' },
  { name: 'ทีม 🛡️ Cyber Defenders', color: 'from-rose-500 to-pink-600', badge: 'bg-rose-100 text-rose-800' },
];

const WHEEL_COLORS = [
  '#4f46e5',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0284c7',
  '#db2777',
  '#16a34a',
  '#ea580c',
  '#0891b2',
  '#9333ea',
  '#ca8a04',
];

export const ClassroomLuckyWheel: React.FC<ClassroomLuckyWheelProps> = ({
  isOpen,
  onClose,
  profiles = [],
  onAwardBonusPoints,
}) => {
  const [activeTab, setActiveTab] = useState<'wheel' | 'teams'>('wheel');
  const [names, setNames] = useState<string[]>(() => {
    if (profiles && profiles.length > 0) {
      const pNames = profiles.map((p) => p.name).filter(Boolean);
      if (pNames.length >= 3) return pNames;
    }
    return DEFAULT_STUDENT_NAMES;
  });

  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState<number>(3);
  const [teams, setTeams] = useState<Array<{ name: string; color: string; badge: string; members: string[] }>>([]);

  // Canvas Wheel Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // If profiles change, populate names
  useEffect(() => {
    if (profiles && profiles.length >= 3) {
      const pNames = profiles.map((p) => p.name).filter(Boolean);
      if (pNames.length > 0) {
        setNames(pNames);
      }
    }
  }, [profiles]);

  // Draw wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 16;
    const total = names.length;
    if (total === 0) return;

    const arc = (2 * Math.PI) / total;

    ctx.clearRect(0, 0, width, height);

    // Draw slices
    names.forEach((name, i) => {
      const sliceAngle = angle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceAngle, sliceAngle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Prompt, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      // Truncate name if long
      const displayName = name.length > 15 ? name.substring(0, 14) + '…' : name;
      ctx.fillText(displayName, radius - 24, 5);
      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center circle knob
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', centerX, centerY + 4);
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [names]);

  const handleSpin = () => {
    if (isSpinning || names.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    soundEffects.play('click');

    const spinDuration = 4500; // ms
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;
    // 5 to 8 full rotations + random slice
    const totalRotation = Math.PI * 2 * (5 + Math.random() * 4);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;
      currentAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate winner
        // Pointer is at the top (angle = 3*PI/2 or -PI/2)
        const total = names.length;
        const arc = (2 * Math.PI) / total;
        // Normalize angle between 0 and 2*PI
        const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        // Pointer is at 270 deg (1.5 * PI)
        const pointerAngle = (1.5 * Math.PI - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(pointerAngle / arc) % total;
        const selectedWinner = names[winningIndex];

        setWinner(selectedWinner);
        soundEffects.play('victory');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed && !names.includes(trimmed)) {
      setNames([...names, trimmed]);
      setNewName('');
      soundEffects.play('click');
    }
  };

  const handleRemoveName = (idx: number) => {
    if (names.length <= 2) return;
    const updated = names.filter((_, i) => i !== idx);
    setNames(updated);
    soundEffects.play('click');
  };

  const handleGenerateTeams = () => {
    soundEffects.play('click');
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const count = Math.min(teamCount, shuffled.length);
    const result: Array<{ name: string; color: string; badge: string; members: string[] }> = [];

    for (let i = 0; i < count; i++) {
      const theme = TEAM_THEMES[i % TEAM_THEMES.length];
      result.push({
        name: theme.name,
        color: theme.color,
        badge: theme.badge,
        members: [],
      });
    }

    shuffled.forEach((student, index) => {
      const teamIdx = index % count;
      result[teamIdx].members.push(student);
    });

    setTeams(result);
    confetti({ particleCount: 40, spread: 50 });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>วงล้อสุ่ม &amp; จัดกลุ่มห้องเรียน</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  สำหรับโปรเจกเตอร์
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สุ่มเรียกนักเรียนตอบคำถามหน้าห้อง และสุ่มแบ่งกลุ่มโครงงาน STEM อัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('wheel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'wheel'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🎡 วงล้อสุ่มชื่อ
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('teams');
                  if (teams.length === 0) handleGenerateTeams();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                👥 จัดกลุ่มอัตโนมัติ
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'wheel' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left / Center: Interactive Wheel */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 relative">
                {/* Pointer Arrow at Top */}
                <div className="relative z-10 -mb-4 flex flex-col items-center">
                  <div className="w-0 h-0 border-x-[14px] border-x-transparent border-t-[24px] border-t-rose-600 drop-shadow-md animate-bounce" />
                </div>

                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={380}
                    className="max-w-full drop-shadow-xl cursor-pointer"
                    onClick={handleSpin}
                  />
                </div>

                {/* Spin CTA Button */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={isSpinning || names.length === 0}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-base shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'กำลังหมุน...' : 'หมุนวงล้อสุ่มเลย! (Spin)'}</span>
                  </button>
                </div>

                {/* Winner Banner */}
                {winner && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-amber-500/20 border border-amber-300 dark:border-amber-600 text-center animate-in zoom-in-95 duration-200 w-full">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      🎉 ยินดีด้วย ผู้โชคดีคือ:
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {winner}
                    </h4>
                    {onAwardBonusPoints && (
                      <button
                        type="button"
                        onClick={() => {
                          onAwardBonusPoints(10, `ตอบคำถามหน้าชั้นเรียนสำเร็จจากการสุ่มวงล้อ: ${winner}`);
                          soundEffects.play('correct');
                          setWinner(null);
                        }}
                        className="mt-2.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>มอบดาวพิเศษ +10 แต้ม 🌟</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Student Names Editor */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>รายชื่อนักเรียนในวงล้อ ({names.length} คน)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNames(DEFAULT_STUDENT_NAMES)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      คืนค่ารายชื่อตัวอย่าง
                    </button>
                  </div>

                  {/* Add Name input */}
                  <form onSubmit={handleAddName} className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="พิมพ์ชื่อนักเรียนเพิ่ม..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newName.trim()}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่ม</span>
                    </button>
                  </form>

                  {/* Names Chips List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {names.map((name, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                          />
                          <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveName(i)}
                          title="ลบชื่อนี้"
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  💡 <strong>เคล็ดลับคุณครู:</strong> คุณครูสามารถต่อสาย HDMI หรือ Cast หน้าจอนี้ขึ้นจอโปรเจกเตอร์หน้าห้องเรียน เพื่อสุ่มเรียกนักเรียนตอบคำถาม ตอบข้อสงสัย หรือให้รางวัลประจำคาบได้ทันที!
                </div>
              </div>
            </div>
          ) : (
            /* Teams Randomizer Tab */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    จำนวนกลุ่มที่ต้องการ:
                  </label>
                  <select
                    value={teamCount}
                    onChange={(e) => setTeamCount(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {[2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} กลุ่ม (เฉลี่ยกลุ่มละ ~{Math.ceil(names.length / num)} คน)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateTeams}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>สุ่มจัดกลุ่มใหม่ (Re-shuffle)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">พิมพ์รายชื่อกลุ่ม</span>
                  </button>
                </div>
              </div>

              {/* Teams Display Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs"
                  >
                    <div className={`p-3 bg-gradient-to-r ${t.color} text-white flex items-center justify-between`}>
                      <span className="font-bold text-sm">{t.name}</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                        {t.members.length} คน
                      </span>
                    </div>

                    <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                      {t.members.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {mIdx + 1}
                          </span>
                          <span className="truncate">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
          <span>โรงเรียนอนุบาลนราธิวาส • ระบบบริหารจัดการห้องเรียนวิทยาการคำนวณ</span>
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
