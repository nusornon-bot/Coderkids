import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  HeartHandshake,
  Clock,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  PorPor5StudentRecord,
  PORPOR5_SYNC_EVENT,
  getImmediatePorPor5Roster,
  syncPorPor5RosterWithCloud,
} from '../utils/porPor5SyncStore.ts';
import {
  computeClassroomStats,
  buildClassroomStatsCsv,
  SupportPriority,
} from '../utils/classroomStatsAnalytics.ts';
import {
  isCloudFirestoreReadyForUser,
  listHomeworkFromFirestore,
} from '../services/firestoreService.ts';

interface TeacherClassroomStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: UserProfile;
  profiles?: UserProfile[];
  currentPoints?: number;
  moduleProgress?: {
    safety?: boolean;
    thinking?: boolean;
    codingLab?: boolean;
    showcase?: boolean;
  };
  onOpenTeacherMastery?: () => void;
  onOpenAssessmentReport?: () => void;
  onOpenHomeworkDropzone?: () => void;
}

type ModalTab = 'overview' | 'support' | 'roster';
type SortMode = 'score_asc' | 'score_desc' | 'progress_asc' | 'name_asc';

export const TeacherClassroomStatsModal: React.FC<TeacherClassroomStatsModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  profiles,
  currentPoints,
  moduleProgress,
  onOpenTeacherMastery,
  onOpenAssessmentReport,
  onOpenHomeworkDropzone,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'ป.4' | 'ป.5' | 'ป.6'>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('score_asc');

  const [students, setStudents] = useState<PorPor5StudentRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState<number | null>(null);
  const [exportNotice, setExportNotice] = useState<string>('');

  const loadRoster = useCallback(
    async (forceCloudSync = false) => {
      const immediate = getImmediatePorPor5Roster({
        profiles,
        currentProfile,
        currentPoints,
        moduleProgress,
      });
      setStudents(immediate);

      setIsSyncing(true);
      try {
        const synced = await syncPorPor5RosterWithCloud({
          profiles,
          currentProfile,
          currentPoints,
          moduleProgress,
          writeBackToGoogleSheets: forceCloudSync,
        });
        setStudents(synced.records);
        setLastSyncedAt(
          new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        );

        if (isCloudFirestoreReadyForUser()) {
          try {
            const hwList = await listHomeworkFromFirestore(true);
            setPendingHomeworkCount(hwList.filter((h) => h.status === 'pending').length);
          } catch {
            // Optional metric
          }
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [profiles, currentProfile, currentPoints, moduleProgress]
  );

  useEffect(() => {
    if (!isOpen) return;
    loadRoster(false);
  }, [isOpen, loadRoster]);

  useEffect(() => {
    if (!isOpen) return;
    const onExternalUpdate = () => {
      const updated = getImmediatePorPor5Roster({
        profiles,
        currentProfile,
        currentPoints,
        moduleProgress,
      });
      setStudents(updated);
    };
    window.addEventListener(PORPOR5_SYNC_EVENT, onExternalUpdate);
    return () => window.removeEventListener(PORPOR5_SYNC_EVENT, onExternalUpdate);
  }, [isOpen, profiles, currentProfile, currentPoints, moduleProgress]);

  // Dynamically available rooms within chosen grade
  const availableRooms = useMemo(() => {
    const scoped =
      selectedGrade === 'all'
        ? students
        : students.filter((s) => s.gradeLevelTag === selectedGrade);
    return Array.from(new Set(scoped.map((s) => s.fullGradeText))).sort((a, b) =>
      a.localeCompare(b, 'th')
    );
  }, [students, selectedGrade]);

  // Reset room filter if current selection is no longer in availableRooms
  useEffect(() => {
    if (selectedRoom !== 'all' && !availableRooms.includes(selectedRoom)) {
      setSelectedRoom('all');
    }
  }, [availableRooms, selectedRoom]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (selectedGrade !== 'all' && s.gradeLevelTag !== selectedGrade) return false;
      if (selectedRoom !== 'all' && s.fullGradeText !== selectedRoom) return false;
      if (q) {
        const hay = `${s.name} ${s.nickname} ${s.studentId} ${s.fullGradeText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, selectedGrade, selectedRoom, searchQuery]);

  const stats = useMemo(() => computeClassroomStats(filteredStudents), [filteredStudents]);

  const sortedRosterRows = useMemo(() => {
    const copy = [...stats.studentRows];
    if (sortMode === 'score_asc') {
      copy.sort((a, b) => a.student.totalScore - b.student.totalScore);
    } else if (sortMode === 'score_desc') {
      copy.sort((a, b) => b.student.totalScore - a.student.totalScore);
    } else if (sortMode === 'progress_asc') {
      copy.sort((a, b) => a.moduleProgressPercent - b.moduleProgressPercent);
    } else {
      copy.sort((a, b) => a.student.name.localeCompare(b.student.name, 'th'));
    }
    return copy;
  }, [stats.studentRows, sortMode]);

  if (!isOpen) return null;

  const handleExportCsv = (onlySupport: boolean) => {
    const targetRows = onlySupport ? stats.needsSupportStudents : sortedRosterRows;
    if (targetRows.length === 0) {
      setExportNotice('ไม่มีข้อมูลสำหรับส่งออกในกลุ่มที่เลือก');
      setTimeout(() => setExportNotice(''), 2500);
      return;
    }

    const csv = '\uFEFF' + buildClassroomStatsCsv(targetRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const scopeSlug = selectedRoom !== 'all' ? selectedRoom : selectedGrade;
    link.download = onlySupport
      ? `coderkids_special_support_${scopeSlug}.csv`
      : `coderkids_classroom_stats_${scopeSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    soundEffects.play('correct');
    setExportNotice(
      onlySupport
        ? `ส่งออกรายชื่อนักเรียนดูแลพิเศษ (${targetRows.length} คน) สำเร็จ!`
        : `ส่งออกสรุปภาพรวมห้องเรียน (${targetRows.length} คน) สำเร็จ!`
    );
    setTimeout(() => setExportNotice(''), 3000);
  };

  const priorityBadge = (priority: SupportPriority) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3" />
          ดูแลเร่งด่วน
        </span>
      );
    }
    if (priority === 'watch') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3" />
          เฝ้าระวัง
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3" />
        ตามเกณฑ์
      </span>
    );
  };

  const moduleBarColors: Record<'pdpa' | 'logic' | 'coding' | 'showcase', string> = {
    pdpa: 'bg-emerald-500',
    logic: 'bg-sky-500',
    coding: 'bg-indigo-500',
    showcase: 'bg-purple-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl my-auto max-h-[93vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Teacher Classroom Analytics · ว 4.2 ป.4–ป.6
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                สรุปภาพรวมนักเรียนทั้งห้องเรียน
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadRoster(true)}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงก์...' : 'ซิงก์ล่าสุด'}</span>
              {lastSyncedAt && !isSyncing && (
                <span className="text-[10px] text-slate-400 font-mono">({lastSyncedAt})</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ส่งออก CSV ทั้งห้อง</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Navigation Toolbar */}
        <div className="px-5 sm:px-7 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          {/* Grade & Room Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['all', 'ป.4', 'ป.5', 'ป.6'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {g === 'all' ? 'ทุกระดับชั้น' : g}
                </button>
              ))}
            </div>

            {availableRooms.length > 1 && (
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="all">ทุกห้องเรียน ({availableRooms.length} ห้อง)</option>
                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    ห้อง {room}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ / รหัสนักเรียน..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 w-44 sm:w-52"
              />
            </div>
          </div>

          {/* Modal View Tabs */}
          <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ภาพรวม &amp; 4 โมดูล</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ต้องการดูแลพิเศษ</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  activeTab === 'support'
                    ? 'bg-white/20 text-white'
                    : stats.needsSupportStudents.length > 0
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {stats.needsSupportStudents.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>รายบุคคล ({stats.totalStudents})</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {exportNotice && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>{exportNotice}</span>
              <button type="button" onClick={() => setExportNotice('')} className="cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* 4 Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>นักเรียนในกลุ่มที่เลือก</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stats.totalStudents}{' '}
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">คน</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ผ่านเกณฑ์ {stats.passedCount} คน ({stats.passRatePercent}%) · เข้าเรียนเฉลี่ย{' '}
                {stats.averageAttendance}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>คะแนนเฉลี่ยทั้งห้อง</span>
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300">
                {stats.averageTotalScore}
                <span className="text-sm font-bold text-indigo-400"> / 100</span>
              </div>
              <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-semibold">
                รูบริกเฉลี่ย {stats.averageRubric} / 4.00 · แต้มสะสมเฉลี่ย {stats.averagePoints} XP
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
                <span>ความคืบหน้าโมดูลรวม</span>
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-300">
                {stats.overallModuleProgressPercent}%
              </div>
              <div className="w-full h-2 rounded-full bg-sky-200/80 dark:bg-sky-900/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.overallModuleProgressPercent)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className="text-left p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 hover:border-rose-400 transition-all space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                <span>ต้องการความช่วยเหลือพิเศษ</span>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300">
                {stats.needsSupportStudents.length}{' '}
                <span className="text-sm font-bold text-rose-500">คน</span>
              </div>
              <div className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-300/80 group-hover:underline">
                เร่งด่วน {stats.urgentCount} · เฝ้าระวัง {stats.watchCount} (คลิกดูรายชื่อ →)
              </div>
            </button>
          </div>

          {/* Empty State */}
          {stats.totalStudents === 0 && (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                ยังไม่มีรายชื่อนักเรียนที่ตรงกับเงื่อนไขการค้นหา
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ลองเปลี่ยนตัวกรองระดับชั้น/ห้องเรียน หรือกดปุ่ม &quot;ซิงก์ล่าสุด&quot; เพื่อดึงข้อมูลนักเรียนจากระบบ
              </p>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & 4-MODULE PROGRESS                            */}
          {/* ============================================================== */}
          {stats.totalStudents > 0 && activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left (7 cols): Module-by-Module Progress Breakdown */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      ความคืบหน้าโมดูลรวมทั้ง 4 โมดูลหลัก (ว 4.2)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      คำนวณจากคะแนนเฉลี่ยรายโมดูลและจำนวนนักเรียนที่ผ่านเกณฑ์ความชำนาญ (≥ 60%)
                    </p>
                  </div>
                  {pendingHomeworkCount !== null && onOpenHomeworkDropzone && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenHomeworkDropzone();
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer"
                    >
                      การบ้านรอตรวจ: {pendingHomeworkCount} ชิ้น
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {stats.moduleSummaries.map((mod) => {
                    const isWeakest =
                      stats.weakestClassModule && stats.weakestClassModule.key === mod.key;
                    return (
                      <div
                        key={mod.key}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {mod.fullLabel}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {mod.indicatorCode}
                            </span>
                            {isWeakest && mod.averagePercent < 75 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                ควรทบทวนเพิ่ม
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {mod.averagePercent}%{' '}
                            <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">
                              ({mod.averageScore}/{mod.maxScore})
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${moduleBarColors[mod.key]} transition-all duration-500`}
                            style={{ width: `${Math.min(100, mod.averagePercent)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            นักเรียนผ่านเกณฑ์โมดูลนี้: <strong>{mod.completedCount}</strong> /{' '}
                            {stats.totalStudents} คน
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            อัตราความสำเร็จ {mod.completionRatePercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {stats.weakestClassModule && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>ข้อเสนอแนะสำหรับคาบเรียนถัดไป:</strong> ภาพรวมห้องเรียนมีคะแนนต่ำสุดที่{' '}
                      <strong>{stats.weakestClassModule.fullLabel}</strong> (เฉลี่ย{' '}
                      {stats.weakestClassModule.averagePercent}%) แนะนำให้จัดกิจกรรมทบทวนสั้นๆ 10
                      นาทีก่อนเริ่มบทเรียนใหม่
                    </div>
                  </div>
                )}
              </div>

              {/* Right (5 cols): Grade Distribution & Top Peer Mentors */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    การกระจายระดับผลการเรียน (ปพ.5)
                  </h3>
                  <div className="space-y-2.5">
                    {stats.gradeDistribution.map((item) => {
                      const barColor = item.gradeLevel.includes('4')
                        ? 'bg-emerald-500'
                        : item.gradeLevel.includes('3.5')
                        ? 'bg-teal-500'
                        : item.gradeLevel.includes('3')
                        ? 'bg-sky-500'
                        : item.gradeLevel.includes('2')
                        ? 'bg-amber-500'
                        : 'bg-rose-500';
                      return (
                        <div key={item.gradeLevel} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.gradeLevel}
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {item.count} คน ({item.percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performers / Potential Peer Buddies */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>นักเรียนดีเด่น (แนะนำเป็น Buddy ช่วยเพื่อน)</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {stats.topPerformers.map((row, idx) => (
                      <div
                        key={row.student.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800/50 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-base shrink-0">{row.student.avatarEmoji || '🎓'}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {row.student.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {row.student.fullGradeText} · ผ่าน {row.completedModulesCount}/4 โมดูล
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                          {row.student.totalScore}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SPECIAL SUPPORT WATCHLIST (นักเรียนที่ต้องการความช่วยเหลือพิเศษ) */}
          {/* ============================================================== */}
          {stats.totalStudents > 0 && activeTab === 'support' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-rose-900 dark:text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>
                      รายชื่อนักเรียนที่ต้องการความช่วยเหลือพิเศษ ({stats.needsSupportStudents.length}{' '}
                      คน)
                    </span>
                  </h3>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
                    เกณฑ์คัดกรองอัตโนมัติ: คะแนนรวมต่ำกว่า 70, มีโมดูลใดโมดูลหนึ่งต่ำกว่า 60%,
                    มีตัวชี้วัดระดับ 1 หรือเวลาเรียนต่ำกว่า 85%
                  </p>
                </div>

                {stats.needsSupportStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleExportCsv(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออกรายชื่อดูแลพิเศษ (CSV)</span>
                  </button>
                )}
              </div>

              {stats.needsSupportStudents.length === 0 ? (
                <div className="p-10 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    ยอดเยี่ยม! นักเรียนทุกคนในกลุ่มนี้ผ่านเกณฑ์และมีความคืบหน้าตามแผน
                  </div>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                    ไม่พบนักเรียนที่อยู่ในกลุ่มเร่งด่วนหรือเฝ้าระวังในขณะนี้
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.needsSupportStudents.map((row) => (
                    <div
                      key={row.student.id}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        row.supportPriority === 'urgent'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0">
                            {row.student.avatarEmoji || '🎒'}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {row.student.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {row.student.fullGradeText} · รหัส {row.student.studentId || '-'} ·
                              คะแนน {row.student.totalScore}/100
                            </div>
                          </div>
                        </div>
                        {priorityBadge(row.supportPriority)}
                      </div>

                      {/* Alert Reasons */}
                      <div className="flex flex-wrap gap-1.5">
                        {row.alertReasons.map((reason, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            • {reason}
                          </span>
                        ))}
                      </div>

                      {/* 4 Mini Module Bars */}
                      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                        {(
                          [
                            { label: 'PDPA', val: row.modulePercents.pdpa },
                            { label: 'ตรรกะ', val: row.modulePercents.logic },
                            { label: 'โค้ดดิ้ง', val: row.modulePercents.coding },
                            { label: 'โครงงาน', val: row.modulePercents.showcase },
                          ] as const
                        ).map((m) => (
                          <div
                            key={m.label}
                            className={`p-1.5 rounded-lg text-center border ${
                              m.val < 60
                                ? 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-black'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
                            }`}
                          >
                            <div>{m.label}</div>
                            <div className="font-mono">{m.val}%</div>
                          </div>
                        ))}
                      </div>

                      {/* Recommended Action */}
                      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          💡 แนวทางช่วยเหลือแนะนำ ({row.weakestModule.label}):{' '}
                        </strong>
                        {row.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: ALL STUDENTS ROSTER TABLE                               */}
          {/* ============================================================== */}
          {stats.totalStudents > 0 && activeTab === 'roster' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  แสดงรายชื่อทั้งหมด {sortedRosterRows.length} คน
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="score_asc">เรียงตามคะแนน (น้อย → มาก)</option>
                    <option value="score_desc">เรียงตามคะแนน (มาก → น้อย)</option>
                    <option value="progress_asc">เรียงตามความคืบหน้าโมดูล (น้อย → มาก)</option>
                    <option value="name_asc">เรียงตามชื่อ ก–ฮ</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 font-bold">นักเรียน</th>
                      <th className="py-3 px-3 font-bold">ชั้น/ห้อง</th>
                      <th className="py-3 px-3 font-bold text-center">คะแนนรวม</th>
                      <th className="py-3 px-3 font-bold text-center">รูบริก</th>
                      <th className="py-3 px-3 font-bold text-center">ความคืบหน้าโมดูล</th>
                      <th className="py-3 px-3 font-bold text-center">เข้าเรียน</th>
                      <th className="py-3 px-3 font-bold">ด้านที่ควรเสริม</th>
                      <th className="py-3 px-4 font-bold text-right">สถานะดูแล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {sortedRosterRows.map((row) => (
                      <tr
                        key={row.student.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{row.student.avatarEmoji || '🎓'}</span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {row.student.name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {row.student.studentId || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {row.student.fullGradeText}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                          {row.student.totalScore}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                          {row.student.rubricAvg}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${row.moduleProgressPercent}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px]">
                              {row.completedModulesCount}/4 ({row.moduleProgressPercent}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {row.student.attendancePercent}%
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {row.weakestModule.label}{' '}
                          <span className="font-mono text-[11px] text-slate-400">
                            ({row.weakestModule.percent}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {priorityBadge(row.supportPriority)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Links to Other Teacher Portals */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            ข้อมูลเชื่อมโยงแบบเรียลไทม์กับศูนย์คุณครู ว 4.2 และรายงานผลสัมฤทธิ์ ปพ.5
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenTeacherMastery && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTeacherMastery();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>แก้ไขคะแนนใน ปพ.5</span>
              </button>
            )}
            {onOpenAssessmentReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssessmentReport();
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>รายงานผลสัมฤทธิ์ ปพ.5</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
