import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Search,
  Plus,
  X,
  ClipboardCheck,
  Save,
  RefreshCw,
  Users,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  PorPor5StudentRecord,
  PORPOR5_SYNC_EVENT,
  getImmediatePorPor5Roster,
  syncPorPor5RosterWithCloud,
  recalculateFromIndicators,
  savePorPor5Records,
  parseGradeAndRoom,
} from '../utils/porPor5SyncStore.ts';
import { TARGET_SPREADSHEET_ID } from '../services/googleSheetsService.ts';

interface TeacherMasteryPortalProps {
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
  onOpenAssessmentReport?: () => void;
}

const CURRICULUM_INDICATORS = {
  'ป.4': [
    { code: 'ว 4.2 ป.4/1', name: 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหาและอธิบายการทำงาน' },
    { code: 'ว 4.2 ป.4/2', name: 'ออกแบบและเขียนโปรแกรมอย่างง่าย ตรวจหาข้อผิดพลาด' },
    { code: 'ว 4.2 ป.4/3', name: 'ใช้อินเทอร์เน็ตค้นหาความรู้และประเมินความน่าเชื่อถือ' },
    { code: 'ว 4.2 ป.4/4', name: 'รวบรวม ประมวลผล นำเสนอข้อมูลสารสนเทศตามวัตถุประสงค์' },
  ],
  'ป.5': [
    { code: 'ว 4.2 ป.5/1', name: 'ใช้เหตุผลเชิงตรรกะในการคาดการณ์ผลลัพธ์จากปัญหาอย่างง่าย' },
    { code: 'ว 4.2 ป.5/2', name: 'ออกแบบและเขียนโปรแกรม ตรวจหาและแก้ไขข้อผิดพลาด (Debug)' },
    { code: 'ว 4.2 ป.5/3', name: 'ใช้อินเทอร์เน็ตค้นหาข้อมูลอย่างมีประสิทธิภาพ ประเมินความน่าเชื่อถือ' },
    { code: 'ว 4.2 ป.5/4', name: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีมารยาท เข้าใจสิทธิและหน้าที่' },
  ],
  'ป.6': [
    { code: 'ว 4.2 ป.6/1', name: 'ใช้เหตุผลเชิงตรรกะในการอธิบายและออกแบบวิธีการแก้ปัญหาที่ซับซ้อน' },
    { code: 'ว 4.2 ป.6/2', name: 'ออกแบบและเขียนโปรแกรมเพื่อแก้ปัญหา ตรวจหาข้อผิดพลาดของโปรแกรม' },
    { code: 'ว 4.2 ป.6/3', name: 'ใช้อินเทอร์เน็ตสืบค้นข้อมูลอย่างมีประสิทธิภาพ ประเมินความน่าเชื่อถือของข้อมูล' },
    { code: 'ว 4.2 ป.6/4', name: 'ใช้เทคโนโลยีสารสนเทศทำงานร่วมกันอย่างปลอดภัย เข้าใจสิทธิและหน้าที่ตนเอง' },
  ],
};

const LESSON_PLANS_5E = [
  {
    grade: 'ป.4',
    title: 'แผนการจัดการเรียนรู้ที่ 1: ตะลุยเขาวงกตด้วยอัลกอริทึม (Decomposition & Pattern)',
    hours: '2 คาบ (100 นาที)',
    steps: {
      engagement: 'ขั้นสร้างความสนใจ (15 นาที): ครูเปิดคลิปสั้นหุ่นยนต์ส่งของหลงทางในโกดัง ให้นักเรียนช่วยกันคิดหาสาเหตุ',
      exploration: 'ขั้นสำรวจและค้นหา (30 นาที): นักเรียนแบ่งกลุ่ม 3-4 คน เล่นเกม Algorithm Puzzle บนแท็บเล็ต Coder Kids',
      explanation: 'ขั้นอธิบายและลงข้อสรุป (25 นาที): ตัวแทนกลุ่มนำเสนอขั้นตอนการเดินหน้า เลี้ยวซ้าย-ขวา และการตรวจจับสิ่งกีดขวาง',
      elaboration: 'ขั้นขยายความรู้ (20 นาที): ให้นักเรียนเขียนผังงาน Flowchart จำลองขั้นตอนการเดินออกจากบ้านมาโรงเรียน',
      evaluation: 'ขั้นประเมินผล (10 นาที): ทำแบบทดสอบสั้น 5 ข้อ และประเมินสมรรถนะตามเกณฑ์รูบริก ว 4.2 ป.4/1',
    },
  },
  {
    grade: 'ป.5',
    title: 'แผนการจัดการเรียนรู้ที่ 2: แปลงผักอัจฉริยะ IoT และการเขียนโปรแกรมเงื่อนไข If-Else',
    hours: '3 คาบ (150 นาที)',
    steps: {
      engagement: 'ขั้นสร้างความสนใจ (15 นาที): คุณครูนำต้นไม้ที่เหี่ยวเฉามาให้สังเกต พร้อมถามว่า "ถ้าเราไปเที่ยวเสาร์-อาทิตย์จะดูแลต้นไม้อย่างไร?"',
      exploration: 'ขั้นสำรวจและค้นหา (45 นาที): นักเรียนทดลองนำเซ็นเซอร์วัดความชื้นปักลงดินแห้งและดินเปียกเพื่อดูค่าตัวเลขบน Micro:bit',
      explanation: 'ขั้นอธิบายและลงข้อสรุป (30 นาที): อภิปรายคำสั่งเงื่อนไข If soilMoisture < 300 Then เปิดน้ำ Else ปิดน้ำ',
      elaboration: 'ขั้นขยายความรู้ (40 นาที): ต่อยอดระบบให้ส่งเสียงร้องเตือน Buzzer เมื่อน้ำในถังสำรองหมด',
      evaluation: 'ขั้นประเมินผล (20 นาที): ทดสอบโครงงานแปลงผักจริงและบันทึกผลการประเมินลง ปพ.5 ว 4.2 ป.5/2',
    },
  },
  {
    grade: 'ป.6',
    title: 'แผนการจัดการเรียนรู้ที่ 3: ป้องกันภัย Deepfake & ไซเบอร์ไฮยีน (PDPA & Netiquette)',
    hours: '2 คาบ (100 นาที)',
    steps: {
      engagement: 'ขั้นสร้างความสนใจ (15 นาที): ครูฉายภาพ AI Deepfake ดาราชื่อดังพูดขายของปลอม ให้นักเรียนทายว่าจริงหรือปลอม',
      exploration: 'ขั้นสำรวจและค้นหา (35 นาที): ใช้อุปกรณ์แว่นขยายใน AiPromptLab ส่องหารอยต่อ แสงสะท้อนในตา และการเคลื่อนไหวริมฝีปาก',
      explanation: 'ขั้นอธิบายและลงข้อสรุป (20 นาที): สรุป 5 วิธีสังเกตข่าวปลอม และกฎหมาย PDPA การนำรูปผู้อื่นไปโพสต์ประจาน',
      elaboration: 'ขั้นขยายความรู้ (20 นาที): นักเรียนสร้างโปสเตอร์ดิจิทัล "รู้ทันภัยไซเบอร์" เพื่อติดบอร์ดประชาสัมพันธ์หน้าห้อง',
      evaluation: 'ขั้นประเมินผล (10 นาที): ทำแบบทดสอบความตระหนักรู้ด้านความปลอดภัยดิจิทัล ว 4.2 ป.6/4',
    },
  },
];

export const TeacherMasteryPortal: React.FC<TeacherMasteryPortalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  profiles,
  currentPoints,
  moduleProgress,
  onOpenAssessmentReport,
}) => {
  const [activeTab, setActiveTab] = useState<'porpor5' | 'lesson5e' | 'rubricGuide'>('porpor5');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'ป.4' | 'ป.5' | 'ป.6'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<PorPor5StudentRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNickname, setNewStudentNickname] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState<'ป.4/1' | 'ป.5/1' | 'ป.6/1'>('ป.5/1');

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
        setSyncStatusMessage(res.message);
      } catch {
        // Fallback to immediate local roster
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

  // Load real students immediately when opened and sync with cloud
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

  // Listen for real-time updates from TeacherAssessmentReportModal
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

  const filteredStudents = students.filter((s) => {
    const matchGrade = selectedGrade === 'all' || s.gradeLevelTag === selectedGrade;
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nickname.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.fullGradeText.toLowerCase().includes(q);
    return matchGrade && matchQuery;
  });

  // Update a single student's indicator score & automatically sync 100-point score with TeacherAssessmentReportModal
  const updateIndicatorScore = (
    id: string,
    field: 'indicator1' | 'indicator2' | 'indicator3' | 'indicator4',
    val: number
  ) => {
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? recalculateFromIndicators(s, { [field]: val }) : s
      );
      savePorPor5Records(updated);
      return updated;
    });
  };

  const updateStudentNote = (id: string, notes: string) => {
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? recalculateFromIndicators(s, { notes }) : s
      );
      savePorPor5Records(updated);
      return updated;
    });
  };

  const handleAddRealStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const { gradeLevelTag, room, fullGradeText } = parseGradeAndRoom(newStudentGrade);
    const code = newStudentCode.trim() || `CK-2569-${1000 + students.length + 1}`;
    const newRec: PorPor5StudentRecord = {
      id: `manual_${Date.now()}`,
      studentId: code,
      name: newStudentName.trim(),
      nickname: newStudentNickname.trim() || '',
      gradeLevelTag,
      room,
      fullGradeText,
      school: currentProfile?.school || 'โรงเรียนอนุบาลนราธิวาส',
      avatarEmoji: '🧑‍💻',
      email: `${code}@anubalnara.ac.th`,
      points: 85,
      indicator1: 4,
      indicator2: 4,
      indicator3: 4,
      indicator4: 4,
      pdpaScore: 23,
      logicScore: 23,
      codingScore: 28,
      showcaseScore: 18,
      totalScore: 92,
      rubricAvg: 4.0,
      gradeLevel: 'ดีเยี่ยม (4)',
      status: 'ผ่านเกณฑ์',
      attendancePercent: 100,
      notes: 'เพิ่มรายชื่อนักเรียนและซิงก์กับระบบรายงานผลสัมฤทธิ์ ปพ.5',
      isRealStudent: true,
      isCurrentActiveUser: false,
      sourceLabel: 'ครูเพิ่มในระบบ ปพ.5',
      lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newRec, ...students];
    setStudents(updated);
    savePorPor5Records(updated);

    // Also register with server API so it persists across sessions
    fetch('/api/students/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newRec.id,
        name: newRec.name,
        nickname: newRec.nickname,
        studentId: newRec.studentId,
        grade: newRec.fullGradeText,
        school: newRec.school,
        points: newRec.points,
      }),
    }).catch(() => {});

    setNewStudentCode('');
    setNewStudentName('');
    setNewStudentNickname('');
    setShowAddStudentForm(false);
    soundEffects.play('correct');
  };

  const getRubricBadge = (avg: number) => {
    if (avg >= 3.5)
      return { label: 'ดีเยี่ยม (4)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (avg >= 2.5)
      return { label: 'ดี (3)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    if (avg >= 1.5)
      return { label: 'พอใช้ (2)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { label: 'ปรับปรุง (1)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  const indicatorDisplayGrade: 'ป.4' | 'ป.5' | 'ป.6' =
    selectedGrade === 'all' ? 'ป.5' : selectedGrade;

  // CSV Export Function (Includes both 1-4 indicators and 100-point module breakdown!)
  const handleExportCSV = () => {
    const indicators = CURRICULUM_INDICATORS[indicatorDisplayGrade];
    const header = [
      'รหัสนักเรียน',
      'ชื่อ-สกุล',
      'ชื่อเล่น',
      'ชั้น/ห้อง',
      indicators[0].code,
      indicators[1].code,
      indicators[2].code,
      indicators[3].code,
      'เฉลี่ยตัวชี้วัด (4.00)',
      'PDPA (25)',
      'คิดคำนวณ (25)',
      'Coding Lab (30)',
      'Showcase (20)',
      'คะแนนรวม (100)',
      'ระดับผลการเรียน',
      'ร้อยละเวลาเรียน',
      'แหล่งข้อมูล',
      'บันทึกคุณครู',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentId}"`,
      `"${s.name}"`,
      `"${s.nickname}"`,
      `"${s.fullGradeText}"`,
      s.indicator1,
      s.indicator2,
      s.indicator3,
      s.indicator4,
      s.rubricAvg.toFixed(2),
      s.pdpaScore,
      s.logicScore,
      s.codingScore,
      s.showcaseScore,
      s.totalScore,
      `"${s.gradeLevel}"`,
      `${s.attendancePercent}%`,
      `"${s.sourceLabel}"`,
      `"${s.notes}"`,
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `PorPor5_${selectedGrade === 'all' ? 'AllGrades' : selectedGrade}_CoderKids.csv`
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

  const handleSaveAndSync = async () => {
    soundEffects.play('badge');
    savePorPor5Records(students);
    await handleCloudSync(true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-6xl rounded-3xl bg-slate-900 border border-indigo-500/30 text-white shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
              <GraduationCap className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
                  ศูนย์รวมคุณครู ว 4.2 &amp; บันทึก ปพ.5 📚
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  ✓ ซิงก์ข้อมูลผู้เรียนจริง &amp; รายงานผลสัมฤทธิ์ ปพ.5 แบบเรียลไทม์
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เชื่อมโยงข้อมูลผู้เรียนที่กำลังใช้งานจริง, แท็บ Students/Logs ใน Google Sheet ({TARGET_SPREADSHEET_ID.slice(0, 12)}...) และรายงานผลสัมฤทธิ์ ปพ.5 (100 คะแนน) ตรงกันทุกจุด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAssessmentReport && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  onClose();
                  onOpenAssessmentReport();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>เปิดรายงานผลสัมฤทธิ์ ปพ.5 (100 คะแนน)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('porpor5')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'porpor5'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>แบบบันทึกคะแนน ปพ.5 ({students.length} คน)</span>
            </button>
            <button
              onClick={() => setActiveTab('lesson5e')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'lesson5e'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>คลังแผนการจัดการเรียนรู้ 5E</span>
            </button>
            <button
              onClick={() => setActiveTab('rubricGuide')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'rubricGuide'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>เกณฑ์รูบริก 4 ระดับคุณภาพ</span>
            </button>
          </div>

          {activeTab === 'porpor5' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">กรองระดับชั้น:</span>
              {(['all', 'ป.4', 'ป.5', 'ป.6'] as const).map((gr) => (
                <button
                  key={gr}
                  onClick={() => setSelectedGrade(gr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGrade === gr
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {gr === 'all' ? `ทุกชั้น (${students.length})` : gr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Por-Por-5 Grading Sheet */}
        {activeTab === 'porpor5' && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[72vh]">
            {/* Active Student Sync Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <span className="font-bold text-emerald-300">
                    กำลังซิงก์ข้อมูลผู้เรียนจริงแบบเรียลไทม์:
                  </span>{' '}
                  <span className="text-slate-200">
                    ผู้ใช้งานปัจจุบัน{' '}
                    <strong className="text-cyan-300">
                      {currentProfile?.name || 'ผู้เรียน'} ({currentProfile?.grade || 'ป.5/1'})
                    </strong>{' '}
                    • เมื่อแก้ไขคะแนนตัวชี้วัด 1–4 ระบบจะคำนวณคะแนนรวม 100 คะแนนและอัปเดตใน &ldquo;รายงานผลสัมฤทธิ์ ปพ.5&rdquo; ทันที
                  </span>
                  {syncStatusMessage && (
                    <div className="text-[11px] text-cyan-300/90 mt-0.5">{syncStatusMessage}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentForm((v) => !v)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายชื่อนักเรียนจริง</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleCloudSync(false)}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุดจาก Sheets'}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Real Student Form */}
            {showAddStudentForm && (
              <form
                onSubmit={handleAddRealStudent}
                className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    placeholder="เช่น 10895"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">ชื่อ - นามสกุล (จำเป็น)</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="เช่น ด.ช. ธนภัทร รักเรียน"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">ชื่อเล่น &amp; ชั้น</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newStudentNickname}
                      onChange={(e) => setNewStudentNickname(e.target.value)}
                      placeholder="ชื่อเล่น"
                      className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <select
                      value={newStudentGrade}
                      onChange={(e) => setNewStudentGrade(e.target.value as any)}
                      className="w-1/2 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="ป.4/1">ป.4/1</option>
                      <option value="ป.5/1">ป.5/1</option>
                      <option value="ป.6/1">ป.6/1</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    + บันทึกนักเรียน
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStudentForm(false)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, ชื่อเล่น หรือรหัสนักเรียน..."
                    className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-64"
                  />
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>
                    แสดงนักเรียนจริง:{' '}
                    <strong className="text-white">{filteredStudents.length} คน</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => void handleSaveAndSync()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {savedSuccess
                      ? 'บันทึกและซิงก์ ปพ.5 สำเร็จ! ✓'
                      : 'บันทึก & ซิงก์รายงานผลสัมฤทธิ์ ปพ.5'}
                  </span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ดาวน์โหลด CSV (Excel)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์แบบฟอร์ม ปพ.5</span>
                </button>
              </div>
            </div>

            {/* Indicator Legend Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px]">
              {CURRICULUM_INDICATORS[indicatorDisplayGrade].map((ind, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-cyan-400 font-mono">
                    ตัวชี้วัดที่ {i + 1} ({ind.code})
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5 line-clamp-2">{ind.name}</div>
                </div>
              ))}
            </div>

            {/* Roster Table */}
            <div className="rounded-2xl border border-slate-800 overflow-x-auto bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <th className="p-3">รหัส</th>
                    <th className="p-3">ชื่อ-นามสกุล (ผู้เรียนจริง)</th>
                    <th className="p-3 text-center">ชั้น/ห้อง</th>
                    <th className="p-3 text-center" title="เหตุผลเชิงตรรกะ & การคิดเชิงคำนวณ (1-4)">
                      ตัวชี้วัด 1
                    </th>
                    <th className="p-3 text-center" title="การเขียนโปรแกรม Scratch & Micro:bit (1-4)">
                      ตัวชี้วัด 2
                    </th>
                    <th className="p-3 text-center" title="การสืบค้น ประมวลผล & โครงงาน (1-4)">
                      ตัวชี้วัด 3
                    </th>
                    <th className="p-3 text-center" title="ความปลอดภัยดิจิทัล & PDPA (1-4)">
                      ตัวชี้วัด 4
                    </th>
                    <th className="p-3 text-center">เฉลี่ยรูบริก</th>
                    <th className="p-3 text-center text-cyan-300">คะแนนรวม (100)</th>
                    <th className="p-3 text-center">ระดับคุณภาพ</th>
                    <th className="p-3">แหล่งข้อมูล / หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((s) => {
                    const badge = getRubricBadge(s.rubricAvg);

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-900/50 transition ${
                          s.isCurrentActiveUser ? 'bg-indigo-950/35' : ''
                        }`}
                      >
                        <td className="p-3 font-mono text-cyan-300 font-medium">{s.studentId}</td>
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{s.avatarEmoji || '🐱'}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {s.name}
                                  {s.nickname ? ` (${s.nickname})` : ''}
                                </span>
                                {s.isCurrentActiveUser && (
                                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                    🟢 กำลังใช้งานจริง
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                สะสม {s.points} XP • {s.sourceLabel}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center font-bold text-slate-300">
                          {s.fullGradeText}
                        </td>

                        {/* Editable Indicator 1 */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={s.indicator1}
                            onChange={(e) =>
                              updateIndicatorScore(s.id, 'indicator1', parseInt(e.target.value) || 1)
                            }
                            className="w-11 text-center py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:border-cyan-400 outline-none"
                          />
                        </td>
                        {/* Editable Indicator 2 */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={s.indicator2}
                            onChange={(e) =>
                              updateIndicatorScore(s.id, 'indicator2', parseInt(e.target.value) || 1)
                            }
                            className="w-11 text-center py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:border-cyan-400 outline-none"
                          />
                        </td>
                        {/* Editable Indicator 3 */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={s.indicator3}
                            onChange={(e) =>
                              updateIndicatorScore(s.id, 'indicator3', parseInt(e.target.value) || 1)
                            }
                            className="w-11 text-center py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:border-cyan-400 outline-none"
                          />
                        </td>
                        {/* Editable Indicator 4 */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={s.indicator4}
                            onChange={(e) =>
                              updateIndicatorScore(s.id, 'indicator4', parseInt(e.target.value) || 1)
                            }
                            className="w-11 text-center py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:border-cyan-400 outline-none"
                          />
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-white">
                          {s.rubricAvg.toFixed(2)}
                        </td>

                        <td className="p-3 text-center font-mono font-black text-cyan-300">
                          {s.totalScore} / 100
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={s.notes}
                            onChange={(e) => updateStudentNote(s.id, e.target.value)}
                            className="w-full min-w-[180px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-cyan-400 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: 5E Lesson Plans */}
        {activeTab === 'lesson5e' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              {LESSON_PLANS_5E.map((plan, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mr-2">
                        ระดับ {plan.grade}
                      </span>
                      <h3 className="font-bold text-white text-base inline">{plan.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">⏱️ เวลาสอน: {plan.hours}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <span>1. Engagement</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{plan.steps.engagement}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-cyan-400 flex items-center gap-1">
                        <span>2. Exploration</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{plan.steps.exploration}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-blue-400 flex items-center gap-1">
                        <span>3. Explanation</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{plan.steps.explanation}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-purple-400 flex items-center gap-1">
                        <span>4. Elaboration</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{plan.steps.elaboration}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <span>5. Evaluation</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{plan.steps.evaluation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Rubric Guide */}
        {activeTab === 'rubricGuide' && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="text-emerald-300 font-bold text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>ระดับ 4: ดีเยี่ยม (3.5 - 4.0)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  สามารถออกแบบอัลกอริทึม ตรวจหาและแก้ไขข้อผิดพลาด (Debug) ได้อย่างแม่นยำด้วยตนเอง
                  ประยุกต์ใช้แนวคิดเชิงคำนวณแก้ปัญหาในสถานการณ์ใหม่ได้อย่างสร้างสรรค์
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-2">
                <div className="text-blue-300 font-bold text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <span>ระดับ 3: ดี (2.5 - 3.4)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  เขียนโปรแกรมและแก้ปัญหาตามขั้นตอนที่กำหนดได้ถูกต้องครบถ้วน เข้าใจการทำงานของบล็อกคำสั่ง
                  และตระหนักถึงความปลอดภัยไซเบอร์
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="text-amber-300 font-bold text-base flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>ระดับ 2: พอใช้ (1.5 - 2.4)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  สามารถแก้ปัญหาและเขียนโปรแกรมอย่างง่ายได้เมื่อได้รับคำแนะนำหรือมีตัวอย่างเปรียบเทียบ
                  เข้าใจข้อผิดพลาดเมื่อมีผู้ชี้แนะ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <div className="text-rose-300 font-bold text-base flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>ระดับ 1: ปรับปรุง (1.0 - 1.4)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ยังไม่สามารถจัดลำดับขั้นตอนการแก้ปัญหาหรือเขียนโปรแกรมได้ ต้องการการดูแลและสอนเสริมอย่างใกล้ชิด
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            🏫 อ้างอิง: หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) • ซิงก์ตรงกับรายงานผลสัมฤทธิ์ ปพ.5
          </div>
          <button
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
