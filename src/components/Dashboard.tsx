import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  TrendingUp,
  Target,
  Bot,
  FileText,
  GraduationCap,
  Brain,
  Swords,
  Trophy,
  Printer,
  Rocket,
  Binary,
  Zap,
  Keyboard,
  Compass,
  Music,
  CheckCircle2,
  Flame,
  LayoutGrid,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { Leaderboard } from './Leaderboard.tsx';
import { SkillsRadarChart } from './SkillsRadarChart.tsx';
import { AudioNarratorButton } from './AudioNarratorButton.tsx';
import { DailyLearningActivityStreakChart } from './DailyLearningActivityStreakChart.tsx';
import { VisualSyllabusOverview } from './VisualSyllabusOverview.tsx';
import { PointsSummaryCard } from './PointsSummaryCard.tsx';
import { TeacherRealtimeNotificationPanel } from './TeacherRealtimeNotificationPanel.tsx';
import { QUICK_GOAL_SUGGESTIONS } from '../data/learningData.ts';
import { UserProfile, TodayLearningGoal, PointTransaction } from '../types/index.ts';
import { TARGET_SPREADSHEET_ID, syncAllToGoogleSheet } from '../services/googleSheetsService.ts';

interface DashboardProps {
  onNavigate: (moduleKey: string, subSection?: string) => void;
  onOpenCertificate: () => void;
  onOpenProfile: () => void;
  profile: UserProfile;
  profiles?: UserProfile[];
  moduleProgress: {
    safety: boolean;
    thinking: boolean;
    codingLab: boolean;
    showcase: boolean;
  };
  points: number;
  transactions?: PointTransaction[];
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  todayGoal?: TodayLearningGoal | null;
  onToggleTodayGoal?: () => void;
  onSetTodayGoal?: (goal: string, category: 'coding' | 'hardware' | 'thinking' | 'safety' | 'reflection') => void;
  isAdmin?: boolean;
  onCelebrate?: () => void;
  onOpenAITutor?: () => void;
  onOpenGasExport?: () => void;
  onOpenBugHunter?: () => void;
  onOpenUnpluggedWorksheets?: () => void;
  onOpenAssessmentReport?: () => void;
  onOpenExamArena?: () => void;
  onOpenDigitalPassport?: () => void;
  onOpenTeacherPlans?: () => void;
  onOpenRubricModal?: () => void;
  onOpenParentTeacherKit?: () => void;
  onOpenClassroomBattle?: () => void;
  onOpenCodeTyper?: () => void;
  onOpenPairArena?: () => void;
  onOpenStemPacks?: () => void;
  onOpenTeacherMastery?: () => void;
  onOpenHeroCards?: () => void;
  onOpenSmartExam?: () => void;
  onOpenCodeTracer?: () => void;
  onOpenStudentQRPass?: () => void;
  addPoints?: (amount: number, reason: string, category?: any) => void;
}

export const getGoalDestination = (goalText: string, category?: string) => {
  const text = (goalText || '').toLowerCase();
  if (text.includes('scratch')) {
    return {
      moduleKey: 'codingLab',
      subSection: 'scratch',
      label: 'เข้าเรียน Scratch Studio',
      badge: 'Scratch Studio',
    };
  }
  if (text.includes('micro:bit') || text.includes('microbit')) {
    return {
      moduleKey: 'codingLab',
      subSection: 'microbit',
      label: 'เข้าเรียน Micro:bit V2',
      badge: 'Micro:bit Simulator',
    };
  }
  if (text.includes('ฮาร์ดแวร์') || text.includes('อุปกรณ์คอมพิวเตอร์')) {
    return {
      moduleKey: 'digitalLibrary',
      label: 'เข้าคลัง e-Book & อุปกรณ์ฮาร์ดแวร์',
      badge: 'Hardware Guide',
    };
  }
  if (text.includes('pdpa') || text.includes('ความปลอดภัย') || text.includes('สิทธิ')) {
    return {
      moduleKey: 'safety',
      subSection: 'pdpaLab',
      label: 'เข้าเรียน PDPA & ความปลอดภัย',
      badge: 'PDPA Lab',
    };
  }
  if (text.includes('รหัสผ่าน') || text.includes('password')) {
    return {
      moduleKey: 'safety',
      subSection: 'password',
      label: 'เข้าเรียน แล็บรหัสผ่าน',
      badge: 'Password Lab',
    };
  }
  if (text.includes('อัลกอริทึม') || text.includes('เขาวงกต') || text.includes('puzzle')) {
    return {
      moduleKey: 'thinking',
      subSection: 'puzzle',
      label: 'เข้าเรียน อัลกอริทึม & เขาวงกต',
      badge: 'Algorithm Puzzle',
    };
  }
  if (text.includes('flowchart') || text.includes('ลำดับ') || text.includes('เสาหลัก') || text.includes('decomposition')) {
    return {
      moduleKey: 'thinking',
      subSection: 'pillars',
      label: 'เข้าเรียน 4 เสาหลักการคิด',
      badge: 'Computational Thinking',
    };
  }
  if (text.includes('สะท้อนคิด') || text.includes('journal') || text.includes('บันทึก')) {
    return {
      moduleKey: 'showcase',
      subSection: 'dailyJournal',
      label: 'เข้าสู่สมุดบันทึกสะท้อนคิด',
      badge: 'Daily Journal',
    };
  }
  if (text.includes('stem') || text.includes('โครงงาน')) {
    return {
      moduleKey: 'stemProjects',
      label: 'เข้าสู่คลังโครงงาน STEM Hub',
      badge: 'STEM Projects',
    };
  }

  switch (category) {
    case 'coding':
      return { moduleKey: 'codingLab', subSection: 'scratch', label: 'เข้าสู่ห้องเรียน Scratch', badge: 'Coding' };
    case 'hardware':
      return { moduleKey: 'codingLab', subSection: 'microbit', label: 'เข้าสู่ห้องเรียน Micro:bit', badge: 'Hardware' };
    case 'safety':
      return { moduleKey: 'safety', subSection: 'pdpaLab', label: 'เข้าสู่ห้องเรียน ความปลอดภัย & PDPA', badge: 'Safety' };
    case 'thinking':
      return { moduleKey: 'thinking', subSection: 'pillars', label: 'เข้าสู่ห้องเรียน การคิดเชิงคำนวณ', badge: 'Thinking' };
    case 'reflection':
      return { moduleKey: 'showcase', subSection: 'dailyJournal', label: 'เข้าสู่สมุดสะท้อนคิด', badge: 'Reflection' };
    default:
      return { moduleKey: 'codingLab', subSection: 'scratch', label: 'คลิกเข้าสู่บทเรียน', badge: 'บทเรียน' };
  }
};

const ONET_SETS_SUMMARY = [
  { setNo: 1, title: 'ชุดที่ 1: อัลกอริทึม & ผังงาน', focus: 'เหตุผลเชิงตรรกะ & Flowchart', badge: 'ว 4.2 ป.6/1' },
  { setNo: 2, title: 'ชุดที่ 2: โค้ดดิ้ง & แก้บั๊ก', focus: 'Scratch & การตรวจหาข้อผิดพลาด', badge: 'ว 4.2 ป.6/2' },
  { setNo: 3, title: 'ชุดที่ 3: พลเมืองดิจิทัล & ค้นหา', focus: 'การค้นหาข้อมูลขั้นสูง & PDPA', badge: 'ว 4.2 ป.6/3-4' },
  { setNo: 4, title: 'ชุดที่ 4: ตรรกะในชีวิตจริง & ไซเบอร์', focus: 'แก้ปัญหาชีวิตประจำวัน & Cyber Safety', badge: 'ว 4.2 ป.6/1,4' },
  { setNo: 5, title: 'ชุดที่ 5: ออกแบบวิธีแก้ปัญหา & ภัยไซเบอร์', focus: 'วางแผนแก้ปัญหา & รู้ทัน Phishing', badge: 'ว 4.2 ป.6/1,4' },
  { setNo: 6, title: 'ชุดที่ 6: ประเมินข้อมูล & Fake News', focus: 'ตรวจสอบข่าวปลอม & จริยธรรมดิจิทัล', badge: 'ว 4.2 ป.6/3,4' },
  { setNo: 7, title: 'ชุดที่ 7: Scratch เชิงตรรกะ & สถานการณ์จำลอง', focus: 'ตัวแปร เงื่อนไข ลูป & แก้โจทย์จำลอง', badge: 'ว 4.2 ป.6/1,2' },
  { setNo: 8, title: 'ชุดที่ 8: ประยุกต์ใช้ Micro:bit & เซนเซอร์', focus: 'อ่านค่าเซนเซอร์ & ระบบอัตโนมัติ', badge: 'ว 4.2 ป.6/1,2' },
  { setNo: 9, title: 'ชุดที่ 9: Scratch ขั้นสูง (Broadcast & Nested If)', focus: 'ส่งสารตัวละคร จัด Layer & เงื่อนไขซ้อน', badge: 'ว 4.2 ป.6/1,2' },
  { setNo: 10, title: 'ชุดที่ 10: ผลกระทบเทคโนโลยีต่อสุขภาพ & การเรียน', focus: 'Ergonomics, สุขภาวะดิจิทัล & การเรียน', badge: 'ว 4.2 ป.6/4' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenCertificate,
  onOpenProfile,
  profile,
  profiles = [],
  moduleProgress,
  points,
  transactions = [],
  todayGoal,
  onSetTodayGoal,
  isAdmin = false,
  onOpenAITutor,
  onOpenUnpluggedWorksheets,
  onOpenExamArena,
  onOpenDigitalPassport,
  onOpenTeacherPlans,
  onOpenClassroomBattle,
  onOpenCodeTyper,
  onOpenPairArena,
  onOpenTeacherMastery,
  onOpenSmartExam,
  addPoints,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'curriculum' | 'labs' | 'onet' | 'stem' | 'progress' | 'teacher'
  >('all');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSyncGoogleSheet = async () => {
    setIsSyncingSheet(true);
    setSyncStatusMsg({ text: 'กำลังเชื่อมต่อและบันทึกข้อมูลลง Google Sheet...', type: 'info' });
    try {
      const profilesToSync = [
        profile,
        ...(profiles || []).filter((p) => p.id !== profile.id),
      ];
      const res = await syncAllToGoogleSheet(TARGET_SPREADSHEET_ID, profilesToSync);
      setSyncStatusMsg({
        text: res.message,
        type: res.directSheetWrite ? 'success' : res.success ? 'info' : 'error',
      });
      if (res.directSheetWrite) {
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
        soundEffects.play('badge');
      }
    } catch (err: any) {
      console.warn('Dashboard sync warning:', err);
      setSyncStatusMsg({
        text: err?.message || 'บันทึกข้อมูลลง Google Sheet ไม่สำเร็จ กรุณาตรวจสอบการลงชื่อเข้าใช้ด้วย Google และสิทธิ์แก้ไข (Editor) ของไฟล์ชีต',
        type: 'error',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const completedCount = Object.values(moduleProgress).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  // Next Recommended Mission based on student's current step
  const nextRecommended = useMemo(() => {
    if (!moduleProgress.safety) {
      return {
        key: 'safety',
        stepNum: 'ก้าวที่ 1 จาก 4',
        title: '01. ความปลอดภัยดิจิทัล & กฎหมาย PDPA',
        desc: 'เริ่มต้นก้าวแรกด้วยการปกป้องข้อมูลส่วนบุคคล สร้างรหัสผ่านที่แข็งแรง และรู้เท่าทันภัยไซเบอร์ก่อนท่องโลกดิจิทัล',
        badge: 'เริ่มต้นก้าวแรก',
        btnText: 'เริ่มเรียนก้าวที่ 1 (ความปลอดภัยดิจิทัล)',
        gradient: 'from-emerald-600 to-teal-700',
        activeStepIndex: 1,
      };
    }
    if (!moduleProgress.thinking) {
      return {
        key: 'thinking',
        stepNum: 'ก้าวที่ 2 จาก 4',
        title: '02. การคิดเชิงคำนวณ & ผังงาน Flowchart',
        desc: 'ฝึกแยกย่อยปัญหา หารูปแบบ คิดเชิงนามธรรม และออกแบบลำดับขั้นตอนอัลกอริทึมด้วยผังงาน',
        badge: 'ก้าวต่อไปของคุณ',
        btnText: 'เรียนต่อก้าวที่ 2 (การคิดเชิงคำนวณ)',
        gradient: 'from-sky-600 to-indigo-700',
        activeStepIndex: 2,
      };
    }
    if (!moduleProgress.codingLab) {
      return {
        key: 'codingLab',
        stepNum: 'ก้าวที่ 3 จาก 4',
        title: '03. ปฏิบัติการโค้ดดิ้ง Scratch & Micro:bit V2',
        desc: 'นำวิธีคิดเชิงตรรกะมาต่อบล็อกคำสั่ง Scratch และเขียนโปรแกรมควบคุมเซนเซอร์บนบอร์ดสมองกล Micro:bit V2',
        badge: 'ลงมือเขียนโค้ดจริง',
        btnText: 'เข้าห้องแล็บก้าวที่ 3 (Scratch & Micro:bit)',
        gradient: 'from-indigo-600 to-blue-700',
        activeStepIndex: 3,
      };
    }
    if (!moduleProgress.showcase) {
      return {
        key: 'showcase',
        stepNum: 'ก้าวที่ 4 จาก 4',
        title: '04. สร้างสรรค์โครงงาน & ขอรับเกียรติบัตร',
        desc: 'สรุปผลการเรียนรู้ด้วยการส่งผลงานโครงงาน แลกเปลี่ยนคำชม 2 Stars & A Wish กับเพื่อน และรับเกียรติบัตร',
        badge: 'ก้าวสุดท้ายสู่ความสำเร็จ',
        btnText: 'ไปที่ก้าวที่ 4 (ส่งผลงาน & รับเกียรติบัตร)',
        gradient: 'from-purple-600 to-pink-700',
        activeStepIndex: 4,
      };
    }
    return {
      key: 'certificate',
      stepNum: 'สำเร็จครบ 4 ก้าว',
      title: 'เรียนจบครบทั้ง 4 ก้าวหลักเรียบร้อยแล้ว!',
      desc: 'ยอดเยี่ยมมาก! คุณผ่านครบทุกบทเรียนหลัก สามารถเปิดรับเกียรติบัตร หรือท้าทายคลังข้อสอบ O-NET 10 ชุดได้เลย',
      badge: 'สำเร็จสมบูรณ์ 100%',
      btnText: 'เปิดดูเกียรติบัตรทางการ',
      gradient: 'from-amber-600 to-orange-700',
      activeStepIndex: 5,
    };
  }, [moduleProgress]);

  const learningStepsSummary = [
    {
      num: '01',
      key: 'safety',
      label: 'ความปลอดภัย & PDPA',
      shortSub: 'ปูพื้นฐานพลเมืองดิจิทัล',
      done: moduleProgress.safety,
      isCurrent: nextRecommended.activeStepIndex === 1,
    },
    {
      num: '02',
      key: 'thinking',
      label: 'คิดเชิงคำนวณ & ผังงาน',
      shortSub: 'ฝึกตรรกะและอัลกอริทึม',
      done: moduleProgress.thinking,
      isCurrent: nextRecommended.activeStepIndex === 2,
    },
    {
      num: '03',
      key: 'codingLab',
      label: 'Scratch & Micro:bit',
      shortSub: 'ลงมือเขียนโปรแกรมจริง',
      done: moduleProgress.codingLab,
      isCurrent: nextRecommended.activeStepIndex === 3,
    },
    {
      num: '04',
      key: 'showcase',
      label: 'โครงงาน & เกียรติบัตร',
      shortSub: 'สรุปผลงานและรับรางวัล',
      done: moduleProgress.showcase,
      isCurrent: nextRecommended.activeStepIndex === 4,
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* ----------------- แถบนำทางตามลำดับขั้นตอนการเรียนรู้ของนักเรียน ----------------- */}
      <div className="sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2">
        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>ทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('curriculum');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>1. บทเรียนหลัก (4 ก้าว)</span>
            <span className="font-mono text-[11px] tabular-nums opacity-85">{progressPercent}%</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('labs');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'labs'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>2. ฝึกแล็บ &amp; มินิเกม</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('onet');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'onet'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-800/60'
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 shrink-0 ${activeCategory === 'onet' ? 'text-amber-200' : 'text-rose-500 dark:text-rose-400'}`} />
            <span>3. คลังข้อสอบ O-NET (10 ชุด)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('stem');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'stem'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>4. โครงงาน STEM &amp; 3D</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('progress');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'progress'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>5. ผลการเรียน &amp; อันดับ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setActiveCategory('teacher');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'teacher'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>ศูนย์ครู &amp; ผู้ปกครอง</span>
          </button>
        </div>
      </div>

      {/* ----------------- จุดเริ่มต้น: แผนผังก้าวการเรียนรู้ปัจจุบัน & เป้าหมายรายวัน ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'curriculum') && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* กล่องซ้าย (Col 7): ต้อนรับ + แผนผัง 4 ก้าวแบบกดเรียนได้ทันที + ก้าวแนะนำถัดไป */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900 text-white border border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="space-y-5 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-indigo-400">หลักสูตรวิทยาการคำนวณ สพฐ. / สสวท. ว 4.2</span>
                  <span aria-hidden="true">·</span>
                  <span>ระดับชั้น {profile.grade || 'ป.4 – ป.6'}</span>
                </div>
                <AudioNarratorButton
                  textToRead="ยินดีต้อนรับสู่ห้องเรียนวิทยาการคำนวณ เริ่มต้นเรียนรู้ตามลำดับ 4 ก้าวหลัก ตั้งแต่วิธีดูแลความปลอดภัยดิจิทัล การคิดเชิงคำนวณ การเขียนโค้ด ไปจนถึงการสร้างโครงงานและสอบวัดผล O-NET"
                  label="ฟังคำแนะนำการเรียน"
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                  สวัสดี, {profile.name || 'โปรแกรมเมอร์รุ่นเยาว์'}
                </h1>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  เรียนรู้อย่างเป็นลำดับขั้น: <span className="text-white font-semibold">1. เรียนเนื้อหาหลัก</span> ➔ <span className="text-white font-semibold">2. ฝึกปฏิบัติแล็บ</span> ➔ <span className="text-white font-semibold">3. ทดสอบ O-NET &amp; ทบทวนจุดอ่อน</span>
                </p>
              </div>

              {/* แถบ 4 ก้าวการเรียนรู้ (Interactive Step-by-Step Progress Strip) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {learningStepsSummary.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => {
                      soundEffects.play('click');
                      onNavigate(step.key);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      step.done
                        ? 'bg-emerald-950/60 border-emerald-500/50 hover:border-emerald-400'
                        : step.isCurrent
                        ? 'bg-indigo-950/80 border-amber-400/80 ring-2 ring-amber-400/20'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={step.done ? 'text-emerald-300 font-bold' : step.isCurrent ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                        ก้าวที่ {step.num}
                      </span>
                      {step.done ? (
                        <span className="text-emerald-400 font-semibold">✓ ผ่านแล้ว</span>
                      ) : step.isCurrent ? (
                        <span className="text-amber-300 font-semibold">กำลังเรียน</span>
                      ) : (
                        <span className="text-slate-500">ถัดไป</span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-white leading-snug">{step.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">{step.shortSub}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* กล่องภารกิจแนะนำในขั้นตอนปัจจุบัน */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>ขั้นตอนที่ควรเรียนต่อตอนนี้ · {nextRecommended.badge}</span>
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">{nextRecommended.stepNum}</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white">{nextRecommended.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{nextRecommended.desc}</p>
              </div>
            </div>

            {/* ปุ่มดำเนินการหลัก */}
            <div className="pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  if (nextRecommended.key === 'certificate') {
                    onOpenCertificate();
                  } else {
                    onNavigate(nextRecommended.key);
                  }
                }}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${nextRecommended.gradient} hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer`}
              >
                <span>{nextRecommended.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenExamArena && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    onOpenExamArena();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs sm:text-sm font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>ฝึกทำข้อสอบ O-NET (10 ชุด)</span>
                </button>
              )}

              {onOpenAITutor && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    onOpenAITutor();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>ถามครูพี่โค้ด AI</span>
                </button>
              )}
            </div>
          </div>

          {/* กล่องขวา (Col 5): ความก้าวหน้าของฉัน & เป้าหมายการเรียนรู้วันนี้ */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm">
            <div className="space-y-5">
              {/* ส่วนหัวความก้าวหน้า */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">ความก้าวหน้าหลักสูตรของฉัน</span>
                  <span className="font-mono tabular-nums">
                    ผ่านแล้ว {completedCount} จาก 4 ก้าวหลัก · Streak {profile.streakDays || 1} วัน
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                    {progressPercent}%
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    <span>{points.toLocaleString()} XP</span>
                    <span aria-hidden="true">·</span>
                    <span>{profile.unlockedRewardIds?.length || 0} รางวัล</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* เป้าหมายการเรียนรู้วันนี้ (Today's Learning Goal) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    เป้าหมายการเรียนประจำวันนี้
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    คลิกเพื่อเข้าเรียนทันที
                  </span>
                </div>

                {todayGoal ? (() => {
                  const destination = getGoalDestination(todayGoal.goal, todayGoal.category);
                  return (
                    <div
                      onClick={() => {
                        soundEffects.play('click');
                        onNavigate(destination.moduleKey, destination.subSection);
                      }}
                      className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                            <span>{destination.badge}</span>
                            <span className="flex items-center gap-1">
                              <span>เข้าเรียน</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {todayGoal.goal}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      เลือกภารกิจสั้นๆ ประจำวันเพื่อเริ่มฝึกฝนทีละก้าว:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_GOAL_SUGGESTIONS.slice(0, 3).map((item, idx) => {
                        const dest = getGoalDestination(item.goal, item.category);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              soundEffects.play('click');
                              if (onSetTodayGoal) onSetTodayGoal(item.goal, item.category);
                              onNavigate(dest.moduleKey, dest.subSection);
                            }}
                            className="p-3 rounded-xl text-left text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-slate-900 dark:text-white font-semibold truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                                {item.goal}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {dest.label}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <span>เริ่มเลย</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ลิงก์ด่วนสำหรับผู้เรียน */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  โปรไฟล์ของฉัน
                </button>
                {onOpenDigitalPassport && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={onOpenDigitalPassport}
                      className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      พาสปอร์ตดิจิทัล
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenCertificate}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                ดูเกียรติบัตรทางการ ➔
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- ขั้นที่ 1: เรียนรู้ 4 บทเรียนหลักตามลำดับ (01 ➔ 02 ➔ 03 ➔ 04) ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'curriculum') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                ขั้นตอนที่ 1 ของการเรียนรู้ · ศึกษาเนื้อหาและฝึกปฏิบัติตามลำดับ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                4 ก้าวหลักการเรียนรู้วิทยาการคำนวณ (เรียนตามลำดับ 01 ➔ 04)
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              สอดคล้องตัวชี้วัด ว 4.2 ป.4 – ป.6 (สพฐ. &amp; สสวท.)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* ก้าวที่ 01 */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
                moduleProgress.safety
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : nextRecommended.activeStepIndex === 1
                  ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ก้าวที่ 01
                  </span>
                  {moduleProgress.safety ? (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">เริ่มต้นที่นี่</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ความปลอดภัยดิจิทัล &amp; PDPA
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เรียนรู้สิทธิข้อมูลส่วนบุคคล การตั้งรหัสผ่านที่ปลอดภัย และการรับมือภัยหลอกลวงออนไลน์
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div>1. รู้จักข้อมูลส่วนบุคคล &amp; สิทธิ PDPA</div>
                  <div>2. ทดลองสร้างรหัสผ่านที่ปลอดภัย</div>
                  <div>3. ทำแบบทดสอบวัดความเข้าใจ 5 ข้อ</div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('safety')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{moduleProgress.safety ? 'ทบทวนก้าวที่ 1' : 'เริ่มเรียนก้าวที่ 1'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('safety', 'pdpaGenerator')}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <span>ฝึกสร้างใบยินยอม PDPA</span>
                </button>
              </div>
            </div>

            {/* ก้าวที่ 02 */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
                moduleProgress.thinking
                  ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800 shadow-sm'
                  : nextRecommended.activeStepIndex === 2
                  ? 'bg-white dark:bg-slate-900 border-sky-500 ring-2 ring-sky-500/15 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-sky-600 dark:text-sky-400">
                    ก้าวที่ 02
                  </span>
                  {moduleProgress.thinking ? (
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">ฝึกวิธีคิด</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  การคิดเชิงคำนวณ &amp; Flowchart
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ฝึกคิดแก้ปัญหาอย่างมีตรรกะด้วย 4 เสาหลัก CT และออกแบบผังงานอัลกอริทึมก่อนเริ่มเขียนโค้ด
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div>1. เข้าใจ 4 เสาหลักการคิดเชิงคำนวณ</div>
                  <div>2. สัญลักษณ์ผังงาน &amp; เงื่อนไข If-Else</div>
                  <div>3. ตะลุยด่านเกมเขาวงกตอัลกอริทึม</div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('thinking')}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{moduleProgress.thinking ? 'ทบทวนก้าวที่ 2' : 'เข้าเรียนก้าวที่ 2'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('thinking', 'puzzle')}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <span>ฝึกแก้โจทย์เขาวงกต 3 ด่าน</span>
                </button>
              </div>
            </div>

            {/* ก้าวที่ 03 */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
                moduleProgress.codingLab
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-sm'
                  : nextRecommended.activeStepIndex === 3
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ก้าวที่ 03
                  </span>
                  {moduleProgress.codingLab ? (
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">ลงมือเขียนโค้ด</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scratch Studio &amp; Micro:bit V2
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เปลี่ยนผังงานเป็นบล็อกคำสั่ง Scratch และเขียนโปรแกรมควบคุมเซนเซอร์บนบอร์ดสมองกลจำลอง
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div>1. ต่อบล็อกคำสั่ง Scratch สร้างชิ้นงาน</div>
                  <div>2. ทดลองบอร์ดจำลอง Micro:bit V2</div>
                  <div>3. อ่านค่าเซนเซอร์แสงและอุณหภูมิ</div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('codingLab')}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{moduleProgress.codingLab ? 'ทบทวนก้าวที่ 3' : 'เข้าห้องแล็บก้าวที่ 3'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('codingLab', 'examplesGallery')}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <span>ดูคลังตัวอย่างโจทย์โค้ด</span>
                </button>
              </div>
            </div>

            {/* ก้าวที่ 04 */}
            <div
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-200 ${
                moduleProgress.showcase
                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 shadow-sm'
                  : nextRecommended.activeStepIndex === 4
                  ? 'bg-white dark:bg-slate-900 border-purple-500 ring-2 ring-purple-500/15 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-purple-600 dark:text-purple-400">
                    ก้าวที่ 04
                  </span>
                  {moduleProgress.showcase ? (
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">สรุปผลและรับรางวัล</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  แสดงผลงาน &amp; รับเกียรติบัตร
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ส่งโครงงานเข้าแกลเลอรี ชื่นชมผลงานเพื่อนแบบ 2 Stars &amp; A Wish และรับเกียรติบัตรทางการ
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <div>1. ส่งผลงานและเขียนบันทึกสะท้อนคิด</div>
                  <div>2. ชื่นชมผลงานเพื่อน (2 Stars &amp; A Wish)</div>
                  <div>3. พิมพ์เกียรติบัตรผ่านหลักสูตร</div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('showcase')}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{moduleProgress.showcase ? 'ดูผลงานและเกียรติบัตร' : 'เข้าสู่ก้าวที่ 4'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenCertificate}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <span>ตรวจสอบสิทธิ์รับเกียรติบัตร</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- ขั้นที่ 2: ฝึกทักษะปฏิบัติการ & สังเวียนประลองโค้ด ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'labs') && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                ขั้นตอนที่ 2 ของการเรียนรู้ · ฝึกแก้โจทย์และลงมือปฏิบัติให้คล่องแคล่ว
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                มินิแล็บฝึกทักษะ &amp; สังเวียนประลองการคิดเชิงคำนวณ
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              เลือกฝึกฝนตามทักษะที่ต้องการพัฒนาเพิ่มเติมหลังจากเรียนบทเรียนหลัก
            </div>
          </div>

          {/* 3 สังเวียนหลัก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={() => onNavigate('bebrasArena')}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    ฝึกคิดเชิงคำนวณ
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Bebras Thailand Arena
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ฝึกแก้ปัญหาเชาวน์ปัญญา 4 เสาหลักการคิดเชิงคำนวณ: เขื่อนบีเวอร์ สับรางรถไฟ ถอดรหัสลูป และแยกส่วนปัญหา
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>เข้าฝึกโจทย์ Bebras</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {onOpenClassroomBattle && (
              <div
                onClick={onOpenClassroomBattle}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xl">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      แข่งขันในชั้นเรียน
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Live Classroom Coding Battle
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    ประลองความเร็วแก้โจทย์โค้ดสดในห้องเรียน 5 ข้อ ตะลุยด่าน Scratch &amp; Python แบบเรียลไทม์
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span>เปิดห้องประลองสด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {onOpenPairArena && (
              <div
                onClick={onOpenPairArena}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 flex items-center justify-center text-xl">
                      <Swords className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      เรียนรู้ร่วมกับเพื่อน (2 คน)
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Pair Programming Arena
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    ฝึกเขียนโค้ดแบบคู่หู คนขับ-ผู้นำทาง (Driver &amp; Navigator) บนหน้าจอเดียวกันและสลับบทบาทตามเวลา
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
                  <span>เปิดสังเวียนคู่หูเขียนโค้ด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          {/* เครื่องมือฝึกฝนทักษะย่อย (จัดเรียงเป็นระเบียบ) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ห้องฝึกทักษะเฉพาะด้าน (เลือกฝึกตามหัวข้อที่สนใจ)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ฝึกฝนได้ไม่จำกัดจำนวนครั้ง
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('codingLab', 'examplesGallery')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">คลังโจทย์โค้ด</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ถอดรหัสบล็อกคำสั่ง</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('socraticDebugger')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200 dark:border-slate-700 hover:border-purple-300 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">ฝึกหาบั๊กโค้ด</div>
                <div className="text-[11px] text-slate-500 mt-0.5">วิเคราะห์ข้อผิดพลาด</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('binaryLab')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                  <Binary className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Binary Pixel</div>
                <div className="text-[11px] text-slate-500 mt-0.5">รหัสเลขฐานสอง 8x8</div>
              </button>

              {onOpenCodeTyper && (
                <button
                  type="button"
                  onClick={onOpenCodeTyper}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Code Typer</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">ฝึกพิมพ์คำสั่งโค้ด</div>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate('dailyChallenge')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-slate-200 dark:border-slate-700 hover:border-orange-300 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 flex items-center justify-center mb-2">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">โจทย์ประจำวัน</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ภารกิจฝึกสมอง 3 นาที</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('glossary')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">คำศัพท์ CS</div>
                <div className="text-[11px] text-slate-500 mt-0.5">พจนานุกรม 2 ภาษา</div>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- ขั้นที่ 3: ทดสอบวัดผล คลังข้อสอบ O-NET & วิเคราะห์จุดแข็งรายบุคคล ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'onet') && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                ขั้นตอนที่ 3 ของการเรียนรู้ · ทดสอบความรู้และวิเคราะห์จุดที่ควรทบทวน
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                คลังข้อสอบ O-NET &amp; สสวท. ป.6 (ครบ 10 ชุด · 100 ข้อ) &amp; รายงานวิเคราะห์รายบุคคล
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ตรวจคำตอบพร้อมเฉลยละเอียด กราฟเปรียบเทียบจุดแข็งรายวิชา และสรุปเนื้อหาทบทวนอัตโนมัติ
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <Trophy className="w-4 h-4" />
                  <span>มาตรฐานการทดสอบ ว 4.2 ป.6 · ครบ 10 ชุด รวม 100 ข้อ (500 คะแนนเต็ม)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  ฝึกทำข้อสอบชุดที่ 1–10 และดูกราฟวิเคราะห์จุดแข็งรายวิชาของฉัน
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  ระบบจะบันทึกคะแนนย้อนหลังทั้ง 10 ชุดเพื่อสร้างกราฟเปรียบเทียบสมรรถนะระหว่าง <span className="text-white font-semibold">การคิดเชิงคำนวณ &amp; โค้ดดิ้ง</span> กับ <span className="text-white font-semibold">ความปลอดภัยดิจิทัล &amp; สารสนเทศ</span> พร้อมสร้างการ์ดบทเรียนทบทวนเฉพาะเรื่องที่ยังทำผิดให้ทันที
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {onOpenExamArena && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        onOpenExamArena();
                      }}
                      className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>เปิดคลังข้อสอบ O-NET &amp; ดูรายงานวิเคราะห์</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {onOpenSmartExam && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        onOpenSmartExam();
                      }}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>สอบปลายภาค Smart Exam</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-80">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400">คลังข้อสอบมาตรฐาน</div>
                  <div className="text-2xl font-black text-amber-400 mt-1 font-mono tabular-nums">10 ชุด</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">ชุดละ 10 ข้อ (50 คะแนน)</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400">กราฟวิเคราะห์จุดแข็ง</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 font-mono tabular-nums">6 ด้าน</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">พร้อมบทเรียนทบทวน</div>
                </div>
              </div>
            </div>
          </div>

          {/* รายการชุดข้อสอบทั้ง 10 ชุด */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ONET_SETS_SUMMARY.map((item) => (
              <button
                key={item.setNo}
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  onOpenExamArena?.();
                }}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/60 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      ชุดที่ {item.setNo}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{item.badge}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.focus}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span>เริ่มทำข้อสอบ (10 ข้อ)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ----------------- ขั้นที่ 4: ประยุกต์สร้างสรรค์โครงงาน STEM & ฮาร์ดแวร์ 3 มิติ ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'stem') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                ขั้นตอนที่ 4 ของการเรียนรู้ · บูรณาการความรู้สร้างนวัตกรรมแก้ปัญหาจริง
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                โครงงานสะเต็ม (STEM Project Hub) &amp; ฮาร์ดแวร์จำลอง 3 มิติ
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ต่อยอดความรู้โค้ดดิ้งสู่การออกแบบสิ่งประดิษฐ์และนวัตกรรมอัจฉริยะ
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => onNavigate('stemProjects')}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xl">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    6 โครงงานต้นแบบ + Canvas
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  คลังโครงงาน STEM Project Hub
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เรียนรู้โครงงาน Smart Farm, ถังขยะอัตโนมัติ และสัญญาณเตือนน้ำท่วม พร้อมเครื่องมือร่างใบงานโครงงาน A4
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>สำรวจโครงงานต้นแบบ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('digitalLibrary')}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    3D Interactive Model
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  โมเดล 3D Micro:bit V2 &amp; คลัง e-Book
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  สำรวจส่วนประกอบและเซนเซอร์บนบอร์ด Micro:bit V2 แบบ 3 มิติหมุนได้ 360 องศา พร้อมหนังสืออิเล็กทรอนิกส์
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                <span>เปิดคลัง 3D &amp; e-Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('musicLab')}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xl">
                    <Music className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    โค้ดดิ้งเสียงดนตรี
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Micro:bit Music Lab
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  แต่งทำนองเพลง 16 จังหวะ ดูกราฟคลื่นเสียง และแปลงโน้ตเพลงเป็นโค้ดคำสั่ง MakeCode และ Python
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>เปิดห้องแล็บดนตรี</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- ขั้นที่ 5: สรุปผลการเรียนรู้ สมรรถนะ & ตารางอันดับ ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'progress') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ขั้นตอนที่ 5 ของการเรียนรู้ · ติดตามพัฒนาการและสะสมผลงานสู่เกียรติบัตร
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                แผนผังความก้าวหน้า สมรรถนะรายบุคคล &amp; ตารางอันดับผู้เรียน
              </h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ตรวจสอบคะแนนสะสม กราฟเรดาร์ทักษะ และความสม่ำเสมอในการเรียน
            </div>
          </div>

          <VisualSyllabusOverview
            moduleProgress={moduleProgress}
            points={points}
            profile={profile}
            onNavigate={onNavigate}
            onOpenCertificate={onOpenCertificate}
          />

          <PointsSummaryCard
            points={points}
            transactions={transactions}
            moduleProgress={moduleProgress}
            profile={profile}
            onNavigate={onNavigate}
          />

          <DailyLearningActivityStreakChart
            profile={profile}
            points={points}
            onNavigate={onNavigate}
            onAwardBonusPoints={(pts, reason) => {
              if (addPoints) addPoints(pts, reason, 'classroom');
            }}
          />

          <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
            <SkillsRadarChart
              moduleProgress={moduleProgress}
              points={points}
              profile={profile}
              onNavigate={onNavigate}
            />
          </div>

          <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
            <Leaderboard
              initialEntries={[]}
              currentUserPoints={points}
              completedModulesCount={completedCount}
              onOpenCertificate={onOpenCertificate}
              isAdmin={isAdmin}
              profile={profile}
              profiles={profiles}
              onNavigate={onNavigate}
            />
          </div>
        </section>
      )}

      {/* ----------------- ส่วนสำหรับคุณครู & ผู้ปกครอง (แยกไว้ด้านล่างสุดหรือในแท็บครู) ----------------- */}
      {(activeCategory === 'all' || activeCategory === 'teacher') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                สำหรับคุณครูและผู้ปกครอง · ระบบบริหารจัดการชั้นเรียนและวัดผล ว 4.2
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                ศูนย์เครื่องมือคุณครู &amp; ผู้ปกครอง (สพฐ. ว 4.2)
              </h2>
            </div>

            <button
              type="button"
              onClick={handleSyncGoogleSheet}
              disabled={isSyncingSheet}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>{isSyncingSheet ? 'กำลังซิงค์ลง Google Sheet...' : 'ซิงค์คะแนนนักเรียนลง Google Sheet'}</span>
            </button>
          </div>

          {syncStatusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                syncStatusMsg.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                  : syncStatusMsg.type === 'error'
                  ? 'bg-rose-950/80 border border-rose-700 text-rose-200'
                  : 'bg-indigo-950/80 border border-indigo-700 text-indigo-200'
              }`}
            >
              <span>{syncStatusMsg.text}</span>
              <button
                type="button"
                onClick={() => setSyncStatusMsg(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <TeacherRealtimeNotificationPanel
            profile={profile}
            profiles={profiles}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onOpenTeacherMastery && (
              <div
                onClick={onOpenTeacherMastery}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    บันทึกคะแนน ปพ.5 (ว 4.2)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    บันทึกคะแนนตัวชี้วัด ป.4–6, รูบริกประเมินสมรรถนะ และส่งออกไฟล์ CSV
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                  <span>เปิดศูนย์ ปพ.5</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {onOpenSmartExam && (
              <div
                onClick={onOpenSmartExam}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center text-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    ข้อสอบปลายภาค Smart Exam
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    สุ่มข้อสอบจับเวลาตรวจผลอัตโนมัติ หรือพิมพ์ข้อสอบพร้อมกระดาษคำตอบ A4
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
                  <span>สร้างชุดข้อสอบ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {onOpenUnpluggedWorksheets && (
              <div
                onClick={onOpenUnpluggedWorksheets}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    ใบงาน Unplugged (พิมพ์ A4)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    ผังงาน Flowchart, ถอดรหัส Binary และเขาวงกตคำสั่ง สำหรับจัดการเรียนรู้แบบไม่ใช้คอมพิวเตอร์
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>เปิดคลังใบงาน A4</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {onOpenTeacherPlans && (
              <div
                onClick={onOpenTeacherPlans}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    แผนการจัดการเรียนรู้ 8 แผน
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    แผนการสอน K-P-A บันทึกหลังสอน เกณฑ์รูบริก และโหมดเปิดสไลด์สอนสดหน้าชั้นเรียน
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>เปิดดูแผนการสอน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
