import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  School,
  GraduationCap,
  RefreshCw,
  Save,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  PorPor5StudentRecord,
  PORPOR5_SYNC_EVENT,
  getImmediatePorPor5Roster,
  syncPorPor5RosterWithCloud,
  recalculateFromModuleScores,
  savePorPor5Records,
} from '../utils/porPor5SyncStore.ts';

interface TeacherAssessmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  profiles?: UserProfile[];
  currentPoints?: number;
  moduleProgress?: {
    safety?: boolean;
    thinking?: boolean;
    codingLab?: boolean;
    showcase?: boolean;
  };
  onOpenTeacherMastery?: () => void;
}

export const TeacherAssessmentReportModal: React.FC<TeacherAssessmentReportModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  profiles,
  currentPoints,
  moduleProgress,
  onOpenTeacherMastery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | 'ป.4' | 'ป.5' | 'ป.6'>('all');
  const [selectedTab, setSelectedTab] = useState<'table' | 'rubric' | 'summary'>('table');
  const [students, setStudents] = useState<PorPor5StudentRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const handleCloudSync = useCallback(
    async (writeBackToGoogleSheets: boolean = false) => {
      setIsSyncing(true);
      try {
        const res = await syncPorPor5RosterWithCloud({
          currentProfile,
          profiles,
          currentPoints,
          moduleProgress,
          writeBackToGoogleSheets,
        });
        setStudents(res.records);
        setSyncMessage(res.message);
      } catch {
        const local = getImmediatePorPor5Roster({
          currentProfile,
          profiles,
          currentPoints,
          moduleProgress,
        });
        setStudents(local);
      } finally {
        setIsSyncing(false);
      }
    },
    [currentProfile, profiles, currentPoints, moduleProgress]
  );

  useEffect(() => {
    if (!isOpen) return;
    const immediate = getImmediatePorPor5Roster({
      currentProfile,
      profiles,
      currentPoints,
      moduleProgress,
    });
    setStudents(immediate);
    void handleCloudSync(false);
  }, [isOpen, currentProfile, profiles, currentPoints, moduleProgress, handleCloudSync]);

  // Listen for real-time updates from TeacherMasteryPortal
  useEffect(() => {
    const onExternalSync = (e: Event) => {
      const custom = e as CustomEvent<PorPor5StudentRecord[]>;
      if (Array.isArray(custom.detail)) {
        setStudents(custom.detail);
      }
    };
    window.addEventListener(PORPOR5_SYNC_EVENT, onExternalSync);
    return () => window.removeEventListener(PORPOR5_SYNC_EVENT, onExternalSync);
  }, []);

  if (!isOpen) return null;

  // Filter student rows
  const filteredStudents = students.filter((s) => {
    const matchGrade =
      selectedGradeFilter === 'all' || s.gradeLevelTag === selectedGradeFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nickname.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.fullGradeText.toLowerCase().includes(q);
    return matchGrade && matchQuery;
  });

  const activeList = filteredStudents.length > 0 ? filteredStudents : students;

  const averageScore =
    activeList.length > 0
      ? Math.round(activeList.reduce((acc, cur) => acc + cur.totalScore, 0) / activeList.length)
      : 0;

  const passRate =
    activeList.length > 0
      ? Math.round(
          (activeList.filter((s) => s.status === 'ผ่านเกณฑ์').length / activeList.length) * 100
        )
      : 100;

  const avgRubricScore =
    activeList.length > 0
      ? (activeList.reduce((acc, cur) => acc + cur.rubricAvg, 0) / activeList.length).toFixed(2)
      : '4.00';

  // Dynamic grade distribution for Tab 3
  const countGrade4 = activeList.filter((s) => s.totalScore >= 80).length;
  const countGrade35 = activeList.filter((s) => s.totalScore >= 75 && s.totalScore < 80).length;
  const countGrade2to3 = activeList.filter((s) => s.totalScore < 75).length;
  const totalCount = Math.max(1, activeList.length);
  const pctGrade4 = Math.round((countGrade4 / totalCount) * 100);
  const pctGrade35 = Math.round((countGrade35 / totalCount) * 100);
  const pctGrade2to3 = Math.round((countGrade2to3 / totalCount) * 100);

  // Dynamic competency averages
  const avgPdpaPct = Math.round(
    (activeList.reduce((a, c) => a + c.pdpaScore, 0) / (totalCount * 25)) * 100
  );
  const avgLogicPct = Math.round(
    (activeList.reduce((a, c) => a + c.logicScore, 0) / (totalCount * 25)) * 100
  );
  const avgCodingPct = Math.round(
    (activeList.reduce((a, c) => a + c.codingScore, 0) / (totalCount * 30)) * 100
  );
  const avgShowcasePct = Math.round(
    (activeList.reduce((a, c) => a + c.showcaseScore, 0) / (totalCount * 20)) * 100
  );

  // Update a student's module score & sync bidirectionally with TeacherMasteryPortal
  const handleUpdateModuleScore = (
    id: string,
    field: 'pdpaScore' | 'logicScore' | 'codingScore' | 'showcaseScore',
    val: number
  ) => {
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? recalculateFromModuleScores(s, { [field]: val }) : s
      );
      savePorPor5Records(updated);
      return updated;
    });
  };

  const handleSaveAll = async () => {
    soundEffects.play('badge');
    savePorPor5Records(students);
    await handleCloudSync(true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'ระดับชั้น',
      'ความปลอดภัยและPDPA (25)',
      'การคิดเชิงคำนวณ (25)',
      'การเขียนโปรแกรม (30)',
      'การสะท้อนคิดและโครงงาน (20)',
      'คะแนนรวม (100)',
      'ตัวชี้วัด 1 (4)',
      'ตัวชี้วัด 2 (4)',
      'ตัวชี้วัด 3 (4)',
      'ตัวชี้วัด 4 (4)',
      'เฉลี่ยตัวชี้วัด (4.00)',
      'ระดับผลการเรียน',
      'สถานะ',
      'แหล่งข้อมูล',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentId}"`,
      `"${s.name}"`,
      `"${s.nickname}"`,
      `"${s.fullGradeText}"`,
      s.pdpaScore,
      s.logicScore,
      s.codingScore,
      s.showcaseScore,
      s.totalScore,
      s.indicator1,
      s.indicator2,
      s.indicator3,
      s.indicator4,
      s.rubricAvg.toFixed(2),
      `"${s.gradeLevel}"`,
      `"${s.status}"`,
      `"${s.sourceLabel}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `ปพ5_วิทยาการคำนวณ_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEffects.play('correct');
  };

  const handlePrint = () => {
    soundEffects.play('click');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <GraduationCap className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  ✓ ซิงก์ข้อมูลผู้เรียนจริง &amp; ศูนย์คุณครู ว 4.2 อัตโนมัติ
                </span>
                <span className="text-xs text-indigo-200">ตามหลักสูตร สพฐ. &amp; สสวท.</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) วิชา วิทยาการคำนวณ
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenTeacherMastery && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  onClose();
                  onOpenTeacherMastery();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <GraduationCap className="w-4 h-4" />
                <span>เปิดศูนย์คุณครู ว 4.2 (ตัวชี้วัด 1-4)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls & Sub-tabs */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedTab('table')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedTab === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                ตารางคะแนนรายบุคคล ({students.length} คน)
              </button>
              <button
                onClick={() => setSelectedTab('rubric')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedTab === 'rubric'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                เกณฑ์ประเมิน (Rubrics)
              </button>
              <button
                onClick={() => setSelectedTab('summary')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedTab === 'summary'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                สถิติและตัวชี้วัด 5 ด้าน
              </button>
            </div>

            {/* Grade Filter Pills */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(['all', 'ป.4', 'ป.5', 'ป.6'] as const).map((gr) => (
                <button
                  key={gr}
                  type="button"
                  onClick={() => setSelectedGradeFilter(gr)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedGradeFilter === gr
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {gr === 'all' ? 'ทุกชั้น' : gr}
                </button>
              ))}
            </div>
          </div>

          {/* Sync / Export / Print Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCloudSync(false)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงก์...' : 'ซิงก์ข้อมูลนักเรียนจริง'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAll()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'บันทึกสำเร็จ! ✓' : 'บันทึก & ซิงก์ ปพ.5'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบรายงาน ปพ.5</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Official Document Print Header */}
          <div className="border border-slate-300 dark:border-slate-700 p-6 rounded-2xl bg-white dark:bg-slate-900 space-y-4">
            <div className="text-center space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm sm:text-base">
                <School className="w-5 h-5" />
                <span>{currentProfile.school || 'โรงเรียนอนุบาลนราธิวาส'}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                แบบบันทึกผลการประเมินการเรียนรู้รายวิชา วิทยาการคำนวณและเทคโนโลยี (ปพ.5)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี • มาตรฐาน ว 4.2 •{' '}
                {selectedGradeFilter === 'all'
                  ? 'ระดับชั้นประถมศึกษาปีที่ 4–6'
                  : `ระดับชั้น ${selectedGradeFilter}`}
              </p>
              {syncMessage && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 print:hidden">
                  🟢 {syncMessage}
                </p>
              )}
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  จำนวนนักเรียนจริงที่ประเมิน
                </span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {activeList.length} คน
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  คะแนนเฉลี่ยรวม
                </span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {averageScore} / 100
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  อัตราการผ่านเกณฑ์
                </span>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{passRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  ค่าเฉลี่ยตัวชี้วัด ว 4.2 (เต็ม 4.00)
                </span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {avgRubricScore} / 4.00
                </p>
              </div>
            </div>

            {/* TAB 1: Student Score Table */}
            {selectedTab === 'table' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, ชื่อเล่น หรือรหัสนักเรียน..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    💡 แก้ไขคะแนนในช่องได้โดยตรง ระบบจะคำนวณตัวชี้วัด 1–4 และซิงก์กับ &ldquo;ศูนย์คุณครู ว 4.2&rdquo; อัตโนมัติ
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold uppercase text-xs">
                      <tr>
                        <th className="p-3">รหัสนักเรียน</th>
                        <th className="p-3">ชื่อ - นามสกุล (ผู้เรียนจริง)</th>
                        <th className="p-3 text-center">ชั้น</th>
                        <th className="p-3 text-center">PDPA (25)</th>
                        <th className="p-3 text-center">การคิดเชิงคำนวณ (25)</th>
                        <th className="p-3 text-center">Coding Lab (30)</th>
                        <th className="p-3 text-center">Showcase (20)</th>
                        <th className="p-3 text-center font-bold text-indigo-700 dark:text-indigo-400">
                          รวม (100)
                        </th>
                        <th className="p-3 text-center">รูบริก ว 4.2</th>
                        <th className="p-3 text-center">ระดับผลการเรียน</th>
                        <th className="p-3 text-center">ผลการประเมิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            student.isCurrentActiveUser
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                              : ''
                          }`}
                        >
                          <td className="p-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {student.studentId}
                          </td>
                          <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <span>{student.avatarEmoji || '🐱'}</span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold">
                                    {student.name}
                                    {student.nickname ? ` (${student.nickname})` : ''}
                                  </span>
                                  {student.isCurrentActiveUser && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                      🟢 กำลังใช้งานจริง
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  สะสม {student.points} XP • {student.sourceLabel}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center font-semibold">{student.fullGradeText}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="25"
                              value={student.pdpaScore}
                              onChange={(e) =>
                                handleUpdateModuleScore(
                                  student.id,
                                  'pdpaScore',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="25"
                              value={student.logicScore}
                              onChange={(e) =>
                                handleUpdateModuleScore(
                                  student.id,
                                  'logicScore',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={student.codingScore}
                              onChange={(e) =>
                                handleUpdateModuleScore(
                                  student.id,
                                  'codingScore',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={student.showcaseScore}
                              onChange={(e) =>
                                handleUpdateModuleScore(
                                  student.id,
                                  'showcaseScore',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {student.totalScore}
                          </td>
                          <td className="p-3 text-center font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                            {student.rubricAvg.toFixed(2)} / 4.00
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 whitespace-nowrap">
                              {student.gradeLevel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{student.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Rubrics Detail */}
            {selectedTab === 'rubric' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
                  <p className="font-bold mb-1">
                    เกณฑ์การให้คะแนนแบบรูบริก (Rubrics Assessment) เชื่อมโยงตัวชี้วัด ว 4.2 (4 ระดับคุณภาพ):
                  </p>
                  <p>
                    ระดับ 4 = ดีเยี่ยม (80-100%), ระดับ 3 = ดี (70-79%), ระดับ 2 = พอใช้/ผ่านเกณฑ์ (50-69%), ระดับ 1 = ควรปรับปรุง (&lt;50%)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>ด้านที่ 1: ความปลอดภัยดิจิทัลและ PDPA (25 คะแนน ⟷ ตัวชี้วัดที่ 4)</span>
                    </h4>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li>• <b>ระดับ 4:</b> จำแนกข้อมูลส่วนบุคคลได้แม่นยำ 100% ตั้งรหัสผ่านปลอดภัยสูง และปฏิบัติตนตามมารยาทไซเบอร์</li>
                      <li>• <b>ระดับ 3:</b> จำแนกข้อมูลส่วนบุคคลได้ถูกต้องส่วนใหญ่ ตั้งรหัสผ่านระดับปานกลาง</li>
                      <li>• <b>ระดับ 2:</b> เข้าใจแนวคิด PDPA พื้นฐาน แต่ยังสับสนข้อมูลบางประเภท</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>ด้านที่ 2: การคิดเชิงคำนวณ (25 คะแนน ⟷ ตัวชี้วัดที่ 1)</span>
                    </h4>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li>• <b>ระดับ 4:</b> ใช้ 4 เสาหลัก (Decomposition, Pattern, Abstraction, Algorithm) แก้ปัญหาได้ครบถ้วน</li>
                      <li>• <b>ระดับ 3:</b> เขียนลำดับขั้นตอนแบบมีเงื่อนไขและวนซ้ำได้ถูกต้องส่วนใหญ่</li>
                      <li>• <b>ระดับ 2:</b> แก้ปัญหาแบบลำดับตรงได้ แต่อาจติดขัดเมื่อมีเงื่อนไขซับซ้อน</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>ด้านที่ 3: การเขียนโปรแกรม Scratch &amp; Micro:bit (30 คะแนน ⟷ ตัวชี้วัดที่ 2)</span>
                    </h4>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li>• <b>ระดับ 4:</b> ประกอบบล็อกคำสั่งถูกต้อง ควบคุมเซ็นเซอร์/หน้าจอ LED และดีบั๊กแก้ข้อผิดพลาดได้ด้วยตนเอง</li>
                      <li>• <b>ระดับ 3:</b> เขียนโปรแกรมตามโจทย์สำเร็จ และดัดแปลงพารามิเตอร์ได้</li>
                      <li>• <b>ระดับ 2:</b> ทำงานตามตัวอย่างได้อย่างถูกต้อง แต่ต้องการคำแนะนำเพิ่มเติมในการดีบั๊ก</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>ด้านที่ 4: การนำเสนอและสะท้อนคิด (20 คะแนน ⟷ ตัวชี้วัดที่ 3)</span>
                    </h4>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li>• <b>ระดับ 4:</b> นำเสนอชิ้นงานอย่างสร้างสรรค์ ให้ข้อเสนอแนะเพื่อนแบบ 2 Stars &amp; a Wish และสะท้อนคิดครบถ้วน</li>
                      <li>• <b>ระดับ 3:</b> อธิบายแนวคิดโครงงานได้ชัดเจน มีส่วนร่วมในการแลกเปลี่ยนเรียนรู้</li>
                      <li>• <b>ระดับ 2:</b> มีชิ้นงานนำเสนอ แต่ยังต้องฝึกทักษะการให้ข้อคิดเห็นเพื่อน</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Summary Analytics (Calculated from Real Active Students) */}
            {selectedTab === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      การกระจายผลการเรียนจริง (จากนักเรียน {activeList.length} คน)
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span>ดีเยี่ยม (เกรด 4, 80-100 คะแนน)</span>
                          <span className="text-emerald-600 font-bold">
                            {countGrade4} คน ({pctGrade4}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${pctGrade4}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span>ดีมาก (เกรด 3.5, 75-79 คะแนน)</span>
                          <span className="text-indigo-600 font-bold">
                            {countGrade35} คน ({pctGrade35}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${pctGrade35}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span>ดี / ผ่านเกณฑ์ (เกรด 2-3, 50-74 คะแนน)</span>
                          <span className="text-amber-600 font-bold">
                            {countGrade2to3} คน ({pctGrade2to3}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${pctGrade2to3}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      สมรรถนะสำคัญของผู้เรียนจริง (5 Core Competencies)
                    </h4>
                    <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                      <li className="flex items-center justify-between">
                        <span>1. ความสามารถในการสื่อสารและนำเสนอโครงงาน</span>
                        <span className="text-emerald-600 font-bold">
                          ดีเยี่ยม ({avgShowcasePct}%)
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>2. ความสามารถในการคิดเชิงคำนวณและแก้ปัญหา</span>
                        <span className="text-indigo-600 font-bold">
                          ดีเยี่ยม ({avgLogicPct}%)
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>3. ความสามารถในการแก้ปัญหาเชิงตรรกะ</span>
                        <span className="text-indigo-600 font-bold">
                          ดีเยี่ยม ({averageScore}%)
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>4. ความสามารถในการใช้ทักษะชีวิตและมารยาทไซเบอร์ (PDPA)</span>
                        <span className="text-emerald-600 font-bold">
                          ยอดเยี่ยม ({avgPdpaPct}%)
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>5. ความสามารถในการใช้เทคโนโลยี Scratch &amp; Micro:bit</span>
                        <span className="text-indigo-600 font-bold">
                          ดีเยี่ยม ({avgCodingPct}%)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Official Signatures Section for Official Document Print */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-700 dark:text-slate-300">
              <div className="space-y-6">
                <div className="border-b border-dotted border-slate-400 dark:border-slate-600 w-3/4 mx-auto pb-4" />
                <div>
                  <p className="font-semibold">(........................................................)</p>
                  <p className="text-slate-500">ครูผู้สอนประจำวิชา</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-b border-dotted border-slate-400 dark:border-slate-600 w-3/4 mx-auto pb-4" />
                <div>
                  <p className="font-semibold">(........................................................)</p>
                  <p className="text-slate-500">หัวหน้ากลุ่มสาระการเรียนรู้</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-b border-dotted border-slate-400 dark:border-slate-600 w-3/4 mx-auto pb-4" />
                <div>
                  <p className="font-semibold">(........................................................)</p>
                  <p className="text-slate-500">ผู้อำนวยการสถานศึกษา</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Coder Kids • ซิงก์ข้อมูลผู้เรียนจริงร่วมกับศูนย์คุณครู ว 4.2 &amp; Google Sheets อัตโนมัติ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
