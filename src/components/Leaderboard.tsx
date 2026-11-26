import React, { useState, useMemo } from 'react';
import { LeaderboardEntry, UserProfile, VirtualClassroomRoom } from '../types/index.ts';
import { INITIAL_LEADERBOARD, INITIAL_VIRTUAL_CLASSROOMS } from '../data/learningData.ts';
import {
  Trophy,
  Crown,
  Sparkles,
  Award,
  Search,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Filter,
  School,
  GraduationCap,
  Users,
  Flame,
  Printer,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Radar,
  LogIn,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentSkillRadarModal, computeStudentSkills } from './StudentSkillRadarModal.tsx';
import { soundEffects } from '../utils/soundEffects.ts';
import { getVirtualClassroomFromFirestore } from '../services/firestoreService.ts';
import { mergeVirtualClassrooms, normalizeVirtualRoomCode } from '../utils/virtualClassroomSync.ts';
import {
  buildMergedLeaderboardEntries,
  computePointsGapToTop3,
  filterAndRankLeaderboardEntries,
  getStudentInitial,
  type LeaderboardGradeFilter,
  type LeaderboardPeriodFilter,
  type LeaderboardSortBy,
} from '../utils/leaderboardUtils.ts';

// Inline Mini Radar Chart for table rows (ขนาด 36x36 แสดงรูปทรงสมรรถนะ)
const MiniRadarChart: React.FC<{
  safety: number;
  thinking: number;
  codingLab: number;
  showcase: number;
}> = ({ safety, thinking, codingLab, showcase }) => {
  const size = 36;
  const c = size / 2;
  const r = 14;
  const pTop = `${c},${c - r * (thinking / 100)}`;
  const pRight = `${c + r * (codingLab / 100)},${c}`;
  const pBottom = `${c},${c + r * (showcase / 100)}`;
  const pLeft = `${c - r * (safety / 100)},${c}`;
  const points = `${pTop} ${pRight} ${pBottom} ${pLeft}`;

  return (
    <svg width={size} height={size} className="overflow-visible inline-block shrink-0 drop-shadow-xs">
      <polygon
        points={`${c},${c - r} ${c + r},${c} ${c},${c + r} ${c - r},${c}`}
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1"
        className="dark:fill-slate-800 dark:stroke-slate-700"
      />
      <line x1={c} y1={c - r} x2={c} y2={c + r} stroke="#e2e8f0" strokeWidth="0.8" className="dark:stroke-slate-700" />
      <line x1={c - r} y1={c} x2={c + r} y2={c} stroke="#e2e8f0" strokeWidth="0.8" className="dark:stroke-slate-700" />
      <polygon
        points={points}
        fill="rgba(99, 102, 241, 0.45)"
        stroke="#4f46e5"
        strokeWidth="1.5"
      />
      <circle cx={c} cy={c} r="1.5" fill="#6366f1" />
    </svg>
  );
};

export interface LeaderboardProps {
  initialEntries?: LeaderboardEntry[];
  currentUserPoints: number;
  completedModulesCount: number;
  onOpenCertificate: () => void;
  isAdmin?: boolean;
  isTeacherAuthorized?: boolean;
  profile: UserProfile;
  profiles?: UserProfile[];
  classrooms?: VirtualClassroomRoom[];
  onNavigate?: (tab: string, subSection?: string) => void;
  onToggleAdmin?: (isAdmin: boolean) => void;
  onOpenLogin?: () => void;
  onEnrollClassroom?: (code: string) => void;
  fromClassroom?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  initialEntries = INITIAL_LEADERBOARD,
  currentUserPoints,
  completedModulesCount,
  onOpenCertificate,
  isAdmin = false,
  isTeacherAuthorized = false,
  profile,
  profiles = [],
  classrooms = INITIAL_VIRTUAL_CLASSROOMS,
  onNavigate,
  onToggleAdmin,
  onOpenLogin,
  onEnrollClassroom,
  fromClassroom = false,
}) => {
  // Merge prop classrooms with locally cached / teacher-created classrooms
  const [discoveredCloudRooms, setDiscoveredCloudRooms] = useState<VirtualClassroomRoom[]>([]);
  const availableClassrooms = useMemo(() => {
    let localSaved: VirtualClassroomRoom[] = [];
    try {
      const raw = localStorage.getItem('coderkids_virtual_classrooms');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localSaved = parsed;
      }
    } catch {
      // ignore storage errors
    }
    const localMerged = mergeVirtualClassrooms(classrooms, localSaved);
    return mergeVirtualClassrooms(localMerged, discoveredCloudRooms);
  }, [classrooms, discoveredCloudRooms]);

  // Local unlock fallback when parent does not provide onEnrollClassroom
  const [localEnrolledCode, setLocalEnrolledCode] = useState<string>('');
  const effectiveClassroomCode = normalizeVirtualRoomCode(
    profile.enrolledClassroomCode || localEnrolledCode
  );

  // ------------------ ACCESS CONTROL CHECK ------------------
  // Accessible to:
  // 1. Verified Admins / Authorized Teachers
  // 2. Members with a valid enrolled classroom code or navigating from classroom view
  const isUserAdmin = isAdmin || profile.role === 'admin';
  const isEnrolledInClassroom = Boolean(
    effectiveClassroomCode || fromClassroom || profile.role === 'teacher'
  );
  const hasAccess = isUserAdmin || isEnrolledInClassroom;

  // Unlock gate form state
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
  const [isCheckingCloudRoom, setIsCheckingCloudRoom] = useState(false);

  // Filter & Search states
  const [selectedGrade, setSelectedGrade] = useState<LeaderboardGradeFilter>('all');
  const [filterPeriod, setFilterPeriod] = useState<LeaderboardPeriodFilter>('all');
  const [selectedClassroomCode, setSelectedClassroomCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('points');
  const [selectedStudentForRadar, setSelectedStudentForRadar] = useState<LeaderboardEntry | null>(null);

  // Handle fast unlock via entering a valid Virtual Classroom code (local or Cloud Firestore)
  const handleAttemptUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlockSuccess(null);
    const cleaned = normalizeVirtualRoomCode(unlockCode);

    if (!cleaned) {
      setUnlockError('กรุณากรอกรหัสห้องเรียนเสมือนจริงเพื่อปลดล็อกตารางจัดอันดับ');
      return;
    }

    let matchedRoom = availableClassrooms.find(
      (c) => normalizeVirtualRoomCode(c.code) === cleaned
    );

    if (!matchedRoom) {
      setIsCheckingCloudRoom(true);
      try {
        const cloudRoom = await getVirtualClassroomFromFirestore(cleaned);
        if (cloudRoom) {
          matchedRoom = cloudRoom;
          setDiscoveredCloudRooms((prev) => mergeVirtualClassrooms(prev, [cloudRoom]));
        }
      } catch {
        // Ignore network errors and fall back to local check
      } finally {
        setIsCheckingCloudRoom(false);
      }
    }

    if (matchedRoom) {
      if (onEnrollClassroom) {
        onEnrollClassroom(cleaned);
      } else {
        setLocalEnrolledCode(cleaned);
      }
      setUnlockSuccess(`เข้าร่วมห้องเรียน "${matchedRoom.name}" สำเร็จ! ปลดล็อกตารางจัดอันดับเรียบร้อย`);
      soundEffects.play('correct');
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } else {
      const sampleCodes = availableClassrooms
        .slice(0, 2)
        .map((c) => c.code)
        .join(' หรือ ');
      setUnlockError(
        `ไม่พบรหัสห้องเรียน "${cleaned}" ในระบบ${sampleCodes ? ` (ลองใช้ ${sampleCodes})` : ''}`
      );
    }
  };

  // ------------------ DYNAMIC DATA MERGING ------------------
  const allEntries: LeaderboardEntry[] = useMemo(
    () =>
      buildMergedLeaderboardEntries({
        initialEntries,
        profile,
        profiles,
        currentUserPoints,
        completedModulesCount,
        sortBy,
      }),
    [initialEntries, profile, profiles, currentUserPoints, completedModulesCount, sortBy]
  );

  // Grade student counts for filter badges
  const gradeCounts = useMemo(() => {
    return {
      all: allEntries.length,
      p4: allEntries.filter((e) => e.grade.includes('4') || e.grade.includes('ป.4')).length,
      p5: allEntries.filter((e) => e.grade.includes('5') || e.grade.includes('ป.5')).length,
      p6: allEntries.filter((e) => e.grade.includes('6') || e.grade.includes('ป.6')).length,
    };
  }, [allEntries]);

  // Filter by grade, classroom, period & search query, then assign dynamic ranks
  const filteredList = useMemo(
    () =>
      filterAndRankLeaderboardEntries(allEntries, {
        selectedGrade,
        selectedClassroomCode,
        filterPeriod,
        searchQuery,
        currentUserGrade: profile.grade,
        currentUserSchool: profile.school,
      }),
    [
      allEntries,
      selectedGrade,
      selectedClassroomCode,
      filterPeriod,
      searchQuery,
      profile.grade,
      profile.school,
    ]
  );

  // Grade average stats computation for Radar Chart benchmark
  const gradeAverage = useMemo(() => {
    if (filteredList.length === 0) {
      return { safety: 82, thinking: 85, codingLab: 81, showcase: 83 };
    }
    let sumSafety = 0;
    let sumThinking = 0;
    let sumCoding = 0;
    let sumShowcase = 0;

    filteredList.forEach((e) => {
      const s = computeStudentSkills(e, Boolean(e.isCurrentUser), completedModulesCount, currentUserPoints);
      sumSafety += s.safety;
      sumThinking += s.thinking;
      sumCoding += s.codingLab;
      sumShowcase += s.showcase;
    });

    return {
      safety: Math.round(sumSafety / filteredList.length),
      thinking: Math.round(sumThinking / filteredList.length),
      codingLab: Math.round(sumCoding / filteredList.length),
      showcase: Math.round(sumShowcase / filteredList.length),
    };
  }, [filteredList, completedModulesCount, currentUserPoints]);

  // Current user rank within the filtered view
  const userRankIndex = filteredList.findIndex((item) => item.isCurrentUser);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;

  // Podium (Top 3 of current filter)
  const top1 = filteredList[0];
  const top2 = filteredList[1];
  const top3 = filteredList[2];

  // Points gap to reach Top 3
  const pointsToTop3 = useMemo(
    () =>
      computePointsGapToTop3({
        userRank,
        top3,
        currentUserPoints,
        sortBy,
      }),
    [userRank, top3, currentUserPoints, sortBy]
  );

  // Statistics
  const totalStudents = filteredList.length;
  const topScore = top1 ? top1.points : 0;
  const averagePoints =
    totalStudents > 0
      ? Math.round(filteredList.reduce((acc, curr) => acc + curr.points, 0) / totalStudents)
      : 0;

  const handlePrint = () => {
    soundEffects.play('click');
    window.print();
  };

  const displaySchool = profile.school || 'โรงเรียนอนุบาลนราธิวาส';
  const displayGrade = profile.grade || 'ประถมศึกษาปีที่ 4-6';
  const hasSpecificGradeLabel =
    displayGrade && !displayGrade.includes('4-6') && !displayGrade.includes('กลุ่มสาระ');

  // ------------------ RENDER: PROTECTED ACCESS LOCK SCREEN ------------------
  if (!hasAccess) {
    const sampleRooms = availableClassrooms.slice(0, 3);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-12 shadow-sm space-y-8 max-w-3xl mx-auto my-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-sm">
          <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>พื้นที่จำกัดสิทธิ์การเข้าถึง (PDPA Protected Access)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            ทำเนียบจัดอันดับผู้เรียน (Leaderboard)
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            ตารางจัดอันดับคะแนนและผลงานสะสม สงวนสิทธิ์การเข้าถึงเฉพาะ{' '}
            <strong className="text-slate-900 dark:text-white font-bold">คุณครูผู้สอนที่ยืนยันตัวตนแล้ว</strong> หรือ{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              สมาชิกที่เข้าร่วมห้องเรียนเสมือนจริง (Virtual Classroom)
            </strong>{' '}
            เท่านั้น เพื่อคุ้มครองข้อมูลส่วนบุคคลของนักเรียนตามมาตรฐาน PDPA
          </p>
        </div>

        {/* Quick Unlock Form */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md mx-auto text-left space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>กรอกรหัสห้องเรียน (Classroom PIN) เพื่อปลดล็อก:</span>
          </div>

          <form onSubmit={handleAttemptUnlock} className="space-y-3">
            <div>
              <input
                type="text"
                value={unlockCode}
                onChange={(e) => {
                  setUnlockCode(e.target.value.toUpperCase());
                  setUnlockError(null);
                }}
                placeholder={`เช่น ${sampleRooms[0]?.code || 'COD-2026'} หรือ ${sampleRooms[1]?.code || 'CK-P4-02'}`}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {unlockError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            {unlockSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{unlockSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCheckingCloudRoom}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isCheckingCloudRoom ? 'กำลังตรวจสอบรหัสห้องเรียน...' : 'ยืนยันรหัสห้องเรียน'}</span>
            </button>
          </form>

          {sampleRooms.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>💡 รหัสห้องเรียนที่มีในระบบ:</span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {sampleRooms.map((room) => (
                  <button
                    key={room.code}
                    type="button"
                    onClick={() => {
                      setUnlockCode(room.code);
                      setUnlockError(null);
                    }}
                    className="hover:underline bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {room.code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Switchers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('classroom')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>ไปที่ห้องเรียนเสมือนจริง (Virtual Classroom)</span>
            </button>
          )}

          {isTeacherAuthorized && onToggleAdmin ? (
            <button
              type="button"
              onClick={() => {
                onToggleAdmin(true);
                confetti({ particleCount: 50, spread: 60 });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>เปิดโหมดคุณครูผู้ดูแลระบบ</span>
            </button>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>สำหรับคุณครู: ลงชื่อเข้าใช้บัญชี Google</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // ------------------ RENDER: FULL SECURE LEADERBOARD VIEW ------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Coder Kids Hall of Fame</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300 font-medium">
                {isUserAdmin ? 'สิทธิ์คุณครูผู้ดูแลระบบ' : 'สมาชิกห้องเรียนเสมือนจริง'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              ทำเนียบยอดนักคิด &amp; ผู้พิชิตคะแนนสูงสุด (Leaderboard)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              จัดอันดับผู้เรียนตามแต้มสะสมทั้งหมดจากการพิชิตภารกิจความปลอดภัยไซเบอร์ แก้ปริศนาอัลกอริทึม
              เขียนโค้ด Scratch / Micro:bit และการสะท้อนคิดประจำวัน
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                <span>{displaySchool}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{displayGrade}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 tabular-nums">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>ผู้เรียนในตาราง {totalStudents} คน</span>
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-xs sm:text-sm border border-white/20 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              title="พิมพ์หรือส่งออกตารางจัดอันดับเป็น PDF"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>พิมพ์รายงานสรุปผล</span>
            </button>

            <button
              type="button"
              onClick={onOpenCertificate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>ดูเกียรติบัตรของคุณ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Quick Stat Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">อันดับของคุณ</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-0.5">
              {userRank !== null ? `#${userRank}` : '-'}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">จากทั้งหมด {totalStudents} คน</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">แต้มสะสมของคุณ</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-0.5">
              {currentUserPoints}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              เลเวล {Math.max(1, Math.floor(currentUserPoints / 75) + 1)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">คะแนนสูงสุดในตาราง</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
              {topScore}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{top1?.studentName || '-'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">คะแนนเฉลี่ยห้องเรียน</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tabular-nums mt-0.5">
              {averagePoints}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">เกณฑ์การประเมิน สพฐ.</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter, Search & Grade Level Controls */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Grade Level Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
              จัดอันดับตามระดับชั้นเรียน (Grade Levels):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedGrade('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGrade === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🎓 ทุกระดับชั้น</span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">({gradeCounts.all})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedGrade('p4');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGrade === 'p4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🟢 ประถม 4 (ป.4)</span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">({gradeCounts.p4})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedGrade('p5');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGrade === 'p5'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🔵 ประถม 5 (ป.5)</span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">({gradeCounts.p5})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedGrade('p6');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGrade === 'p6'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🟣 ประถม 6 (ป.6)</span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">({gradeCounts.p6})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัสนักเรียน (เช่น CK-2569)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Classroom Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>ห้องเรียน:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedClassroomCode('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedClassroomCode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ทุกห้องเรียน ({allEntries.length})
            </button>

            {availableClassrooms.map((c) => {
              const isSelected = selectedClassroomCode.toUpperCase() === c.code.toUpperCase();
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setSelectedClassroomCode(c.code);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sorting and Period Sub-filters */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">มุมมอง:</span>
            <div className="inline-flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setFilterPeriod('all');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterPeriod === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                คะแนนสะสมทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setFilterPeriod('weekly');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterPeriod === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="แสดงเฉพาะผู้เรียนที่มีความต่อเนื่อง (Streak ≥ 2 วัน)"
              >
                ผู้เรียนต่อเนื่อง (Streak ≥ 2 วัน)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setFilterPeriod('school');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterPeriod === 'school'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {hasSpecificGradeLabel ? `เฉพาะห้อง (${displayGrade})` : `เฉพาะโรงเรียน (${displaySchool})`}
              </button>
            </div>
          </div>

          {/* Sort By criteria */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>จัดเรียงตาม:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LeaderboardSortBy)}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="points">คะแนนสะสม (สูงสุดไปต่ำสุด)</option>
              <option value="streak">ความต่อเนื่อง (Streak)</option>
              <option value="modules">ภารกิจที่ผ่าน (Modules)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Top 3 Visual Podium (แท่นเกียรติยศ 3 อันดับแรก) */}
      {top1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>ทำเนียบเกียรติยศ 3 อันดับสูงสุด</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              แท่นเกียรติยศ 3 อันดับผู้นำสูงสุด
            </h3>
          </div>

          <div className="pt-4 pb-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-2xl mx-auto items-end">
              {/* Rank 2 (Silver - Left) */}
              {top2 ? (() => {
                const top2Skills = computeStudentSkills(top2, Boolean(top2.isCurrentUser), completedModulesCount, currentUserPoints);
                return (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${top2.avatarColor || 'bg-slate-600'} text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-md ring-4 ring-slate-200 dark:ring-slate-700`}
                      >
                        {top2.avatarEmoji || getStudentInitial(top2.studentName, '🥈')}
                      </div>
                      <div className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100 font-bold text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                        🥈
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[120px] sm:max-w-none">
                      {top2.studentName} {top2.nickname && `(${top2.nickname})`}
                    </div>
                    {top2.studentId && (
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{top2.studentId}</div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{top2.school} · {top2.grade}</div>
                    <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 tabular-nums">
                      {top2.points} แต้ม
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setSelectedStudentForRadar(top2);
                      }}
                      className="mt-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="คลิกเพื่อดูกราฟเรดาร์ทักษะ"
                    >
                      <span>{top2Skills.strongest.emoji}</span>
                      <span className="truncate max-w-[85px]">{top2Skills.strongest.shortTitle}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold tabular-nums">{top2Skills.strongest.score}%</span>
                      <Radar className="w-2.5 h-2.5 text-indigo-500 ml-0.5" />
                    </button>

                    <div className="w-full mt-3 h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-t-2 border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 shadow-inner">
                      <span className="font-mono text-xl sm:text-2xl font-black tabular-nums">2</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">SILVER</span>
                    </div>
                  </div>
                );
              })() : <div />}

              {/* Rank 1 (Gold - Center Highest) */}
              {top1 && (() => {
                const top1Skills = computeStudentSkills(top1, Boolean(top1.isCurrentUser), completedModulesCount, currentUserPoints);
                return (
                  <div className="flex flex-col items-center text-center relative -top-3 sm:-top-5">
                    <Crown className="w-8 h-8 text-amber-500 mb-1" />
                    <div className="relative mb-2">
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${top1.avatarColor || 'bg-amber-500'} text-white font-black flex items-center justify-center text-2xl sm:text-3xl shadow-xl ring-4 ring-amber-400`}
                      >
                        {top1.avatarEmoji || getStudentInitial(top1.studentName, '👑')}
                      </div>
                      <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-amber-400 text-amber-900 font-extrabold text-sm flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                        👑
                      </div>
                    </div>

                    <div className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[130px] sm:max-w-none">
                      {top1.studentName} {top1.nickname && `(${top1.nickname})`}
                    </div>
                    {top1.studentId && (
                      <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">{top1.studentId}</div>
                    )}
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium line-clamp-1">{top1.school} · {top1.grade}</div>
                    <div className="text-xs sm:text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                      {top1.points} แต้ม
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setSelectedStudentForRadar(top1);
                      }}
                      className="mt-1.5 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1 border border-amber-300 dark:border-amber-700 transition-all cursor-pointer shadow-xs"
                      title="คลิกเพื่อดูกราฟเรดาร์ทักษะแชมเปียน"
                    >
                      <span>{top1Skills.strongest.emoji}</span>
                      <span className="truncate max-w-[95px]">{top1Skills.strongest.shortTitle}</span>
                      <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold tabular-nums">{top1Skills.strongest.score}%</span>
                      <Radar className="w-3 h-3 text-amber-600 ml-0.5" />
                    </button>

                    <div className="w-full mt-3 h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 dark:from-amber-950/80 dark:via-amber-900/40 dark:to-slate-800 border-t-2 border-amber-300 dark:border-amber-700 flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 shadow-inner">
                      <span className="font-mono text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 tabular-nums">1</span>
                      <span className="text-[11px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400">CHAMPION</span>
                    </div>
                  </div>
                );
              })()}

              {/* Rank 3 (Bronze - Right) */}
              {top3 ? (() => {
                const top3Skills = computeStudentSkills(top3, Boolean(top3.isCurrentUser), completedModulesCount, currentUserPoints);
                return (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${top3.avatarColor || 'bg-amber-700'} text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-md ring-4 ring-amber-200 dark:ring-amber-800`}
                      >
                        {top3.avatarEmoji || getStudentInitial(top3.studentName, '🥉')}
                      </div>
                      <div className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                        🥉
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[120px] sm:max-w-none">
                      {top3.studentName} {top3.nickname && `(${top3.nickname})`}
                    </div>
                    {top3.studentId && (
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{top3.studentId}</div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{top3.school} · {top3.grade}</div>
                    <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
                      {top3.points} แต้ม
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setSelectedStudentForRadar(top3);
                      }}
                      className="mt-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="คลิกเพื่อดูกราฟเรดาร์ทักษะ"
                    >
                      <span>{top3Skills.strongest.emoji}</span>
                      <span className="truncate max-w-[85px]">{top3Skills.strongest.shortTitle}</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-extrabold tabular-nums">{top3Skills.strongest.score}%</span>
                      <Radar className="w-2.5 h-2.5 text-amber-600 ml-0.5" />
                    </button>

                    <div className="w-full mt-3 h-20 sm:h-22 rounded-t-2xl bg-gradient-to-t from-orange-200 to-amber-100 dark:from-slate-800 dark:to-slate-700 border-t-2 border-amber-300 dark:border-amber-700 flex flex-col items-center justify-center text-amber-900 dark:text-amber-300 shadow-inner">
                      <span className="font-mono text-xl sm:text-2xl font-black tabular-nums">3</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-300">BRONZE</span>
                    </div>
                  </div>
                );
              })() : <div />}
            </div>
          </div>
        </div>
      )}

      {/* 5. Current User Position Card */}
      {userRank !== null && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold font-mono tabular-nums flex items-center justify-center text-base shadow-sm shrink-0">
              #{userRank}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-indigo-950 dark:text-indigo-100">
                <span>
                  สถานะของคุณ: {profile.name} {profile.nickname ? `(${profile.nickname})` : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold tabular-nums">
                  อันดับที่ {userRank}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                <span className="font-mono font-bold tabular-nums">{currentUserPoints} แต้ม</span>
                <span aria-hidden="true">·</span>
                <span>รหัส: {profile.studentId || '-'}</span>
                <span aria-hidden="true">·</span>
                <span>{displayGrade}</span>
                <span aria-hidden="true">·</span>
                <span>{displaySchool}</span>
              </div>

              {(() => {
                const myEntry = filteredList.find((e) => e.isCurrentUser) || {
                  id: profile.id,
                  studentName: profile.name,
                  points: currentUserPoints,
                  grade: displayGrade,
                  school: displaySchool,
                  badgeTitle: '',
                  completedModules: completedModulesCount,
                  avatarColor: 'bg-indigo-600',
                };
                const mySkills = computeStudentSkills(myEntry, true, completedModulesCount, currentUserPoints);
                return (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      🌟 ทักษะเด่นที่สุด: {mySkills.strongest.emoji} {mySkills.strongest.title}{' '}
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black tabular-nums">
                        ({mySkills.strongest.score}%)
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        setSelectedStudentForRadar(myEntry);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Radar className="w-3.5 h-3.5" />
                      <span>ดูกราฟเรดาร์ทักษะของคุณ</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
            {userRank > 3 ? (
              pointsToTop3 !== null ? (
                <div className="text-xs text-indigo-800 dark:text-indigo-200">
                  ต้องการอีก <strong className="font-mono text-indigo-950 dark:text-white tabular-nums">{pointsToTop3}</strong> แต้ม เพื่อแซงขึ้นแท่น Top 3
                </div>
              ) : (
                <div className="text-xs text-indigo-800 dark:text-indigo-200">
                  ทำภารกิจและสะสม Streak ต่อเนื่องเพื่อขึ้นแท่น Top 3
                </div>
              )
            ) : (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ยินดีด้วย! คุณอยู่ในกลุ่มผู้นำคะแนนยอดเยี่ยม</span>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenCertificate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <Award className="w-3.5 h-3.5" />
              <span>เกียรติบัตร</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Ranking Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="tabular-nums">ตารางจัดอันดับคะแนนผู้เรียนทั้งหมด ({filteredList.length} รายการ)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เรียงลำดับจากคะแนนสะสมจริงที่ได้รับจากการเรียนรู้และทำกิจกรรมในระบบ
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {selectedClassroomCode === 'all' ? 'ห้องเรียน: ทั้งหมด' : `ห้องเรียน: ${selectedClassroomCode}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 sm:px-4 font-bold text-center w-14">อันดับ</th>
                <th className="py-3 px-3 sm:px-4 font-bold">ข้อมูลผู้เรียน</th>
                <th className="py-3 px-3 sm:px-4 font-bold text-center">ทักษะเด่น &amp; เรดาร์</th>
                <th className="py-3 px-3 sm:px-4 font-bold hidden md:table-cell">โรงเรียน / ระดับชั้น</th>
                <th className="py-3 px-3 sm:px-4 font-bold hidden sm:table-cell">ห้องเรียน</th>
                <th className="py-3 px-3 sm:px-4 font-bold hidden lg:table-cell text-center">ภารกิจ</th>
                <th className="py-3 px-3 sm:px-4 font-bold hidden lg:table-cell text-center">Streak</th>
                <th className="py-3 px-3 sm:px-4 font-bold text-right">คะแนนสะสม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        ยังไม่มีข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                        ระบบดึงข้อมูลผู้เรียนจากแท็บ <strong>Students</strong> ใน Google Sheet และการเข้าใช้งานจริง ลองเปลี่ยนตัวกรองระดับชั้นหรือคำค้นหา
                      </p>
                      {isAdmin && onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('profileManage')}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>ไปที่จัดการโปรไฟล์ (เพิ่ม/ดึงข้อมูลนักเรียน)</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((entry) => {
                  const isMe = Boolean(entry.isCurrentUser);
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;
                  const entrySkills = computeStudentSkills(
                    entry,
                    isMe,
                    completedModulesCount,
                    currentUserPoints
                  );

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 font-medium'
                          : isTop1
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/35'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                            #{entry.rank}
                          </span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${entry.avatarColor || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-base shrink-0 shadow-xs`}
                          >
                            {entry.avatarEmoji || getStudentInitial(entry.studentName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {entry.studentName}
                              </span>
                              {entry.nickname && (
                                <span className="text-slate-500 dark:text-slate-400 text-xs">({entry.nickname})</span>
                              )}
                              {isMe && (
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/70 font-bold px-1.5 py-0.5 rounded">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {entry.studentId && entry.studentId !== '-' && (
                                <>
                                  <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                                    {entry.studentId}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                </>
                              )}
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[160px] sm:max-w-none">
                                {entry.badgeTitle}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Strongest Skill & Radar Column */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.play('click');
                              setSelectedStudentForRadar(entry);
                            }}
                            className="cursor-pointer group inline-flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="คลิกเพื่อดูกราฟเรดาร์ทักษะ 4 มิติ"
                          >
                            <MiniRadarChart
                              safety={entrySkills.safety}
                              thinking={entrySkills.thinking}
                              codingLab={entrySkills.codingLab}
                              showcase={entrySkills.showcase}
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {entrySkills.strongest.emoji} {entrySkills.strongest.shortTitle}{' '}
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {entrySkills.strongest.score}%
                              </span>
                            </span>
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          </button>
                        </div>
                      </td>

                      {/* School & Grade */}
                      <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{entry.school}</div>
                        <div className="text-slate-400 dark:text-slate-500 text-[11px]">{entry.grade}</div>
                      </td>

                      {/* Classroom Code */}
                      <td className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {entry.classroomCode || 'COD-2026'}
                        </span>
                      </td>

                      {/* Completed Modules */}
                      <td className="py-3.5 px-3 sm:px-4 hidden lg:table-cell text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-semibold tabular-nums">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{entry.completedModules}/4 ภารกิจ</span>
                        </span>
                      </td>

                      {/* Streak Days */}
                      <td className="py-3.5 px-3 sm:px-4 hidden lg:table-cell text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                          <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                          <span>{entry.streakDays || 1} วัน</span>
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-3 sm:px-4 text-right">
                        <div className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base tabular-nums">
                          {entry.points}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">แต้มสะสม XP</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Student Skill Radar & Analytics Modal */}
      <StudentSkillRadarModal
        entry={selectedStudentForRadar}
        isOpen={Boolean(selectedStudentForRadar)}
        onClose={() => setSelectedStudentForRadar(null)}
        completedModulesCount={completedModulesCount}
        currentUserPoints={currentUserPoints}
        gradeAverage={gradeAverage}
        onNavigate={onNavigate}
      />
    </div>
  );
};
