import React, { useState, useMemo } from 'react';
import {
  Compass,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck,
  Brain,
  Code2,
  Trophy,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Calendar,
  Zap,
  Target,
  ExternalLink,
  Lock,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { UserProfile } from '../types/index.ts';

export interface VisualSyllabusOverviewProps {
  moduleProgress: {
    safety: boolean;
    thinking: boolean;
    codingLab: boolean;
    showcase: boolean;
  };
  points: number;
  profile: UserProfile;
  onNavigate: (moduleKey: string, subSection?: string) => void;
  onOpenCertificate?: () => void;
}

export interface SyllabusLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'concept' | 'interactive_lab' | 'quiz' | 'project';
  description: string;
  subSection?: string;
}

export interface SyllabusModule {
  key: 'safety' | 'thinking' | 'codingLab' | 'showcase';
  stepNum: string;
  stepCode: string;
  titleTh: string;
  titleEn: string;
  levelTitle: string;
  levelNumber: number;
  levelRank: string;
  estimatedMinutes: number;
  curriculumCode: string; // เช่น ว 4.2 ป.4/1
  themeColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentGradient: string;
  icon: React.ReactNode;
  summary: string;
  learningOutcomes: string[];
  toolsAndStack: string[];
  xpReward: number;
  lessons: SyllabusLesson[];
  defaultSubSection?: string;
}

export const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    key: 'safety',
    stepNum: '01',
    stepCode: 'MOD-01',
    titleTh: 'ความปลอดภัยดิจิทัล · ค้นหาข้อมูลขั้นสูง & PDPA',
    titleEn: 'Digital Safety, Effective Search & PDPA',
    levelTitle: 'Level 1: พลเมืองดิจิทัล & นักสืบค้นมือโปร (Digital Citizen)',
    levelNumber: 1,
    levelRank: 'ระดับพื้นฐาน (Foundation)',
    estimatedMinutes: 60,
    curriculumCode: 'มาตรฐาน ว 4.2 ป.6/3, ป.6/4 (บูรณาการ ป.4/5–ป.5/5)',
    themeColor: 'emerald',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    accentBorder: 'border-emerald-300 dark:border-emerald-800',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    accentGradient: 'from-emerald-500 to-teal-600',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    summary: 'สร้างภูมิคุ้มกันดิจิทัล รู้จักกฎหมาย PDPA รหัสผ่านปลอดภัย มารยาทดิจิทัล พร้อมฝึกใช้ Search Operators (" ", -, OR, site:, filetype:) และประเมินความน่าเชื่อถือจากหลายแหล่ง',
    learningOutcomes: [
      'เข้าใจสิทธิและปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) และความปลอดภัยไซเบอร์ (ป.6/4)',
      'สร้างรหัสผ่าน Passphrase ที่มีความแข็งแกร่งและป้องกัน Phishing / Cyberbullying',
      'ใช้ Search Operators และเข้าใจการจัดอันดับของ Search Engine อย่างมีประสิทธิภาพ (ป.6/3)',
      'ตรวจสอบความน่าเชื่อถือจากหลายแหล่งข้อมูล และสรุปใจความสำคัญร่วมกับวิชาภาษาไทย (ป.6/3)',
    ],
    toolsAndStack: ['Search Operators Lab', 'Multi-Source Fact Checker', 'PDPA Consent Generator', 'Password Entropy Meter'],
    xpReward: 300,
    defaultSubSection: 'pdpaLab',
    lessons: [
      {
        id: 'safety_pdpa',
        title: 'แนวคิดข้อมูลส่วนบุคคลและกฎหมาย PDPA เบื้องต้น',
        durationMinutes: 12,
        type: 'concept',
        description: 'จำแนกข้อมูลทั่วไป ข้อมูลอ่อนไหว และการให้ความยินยอมถูกต้อง',
        subSection: 'pdpaLab',
      },
      {
        id: 'safety_password',
        title: 'ห้องปฏิบัติการสร้างรหัสผ่าน Passphrase ขั้นสูง',
        durationMinutes: 10,
        type: 'interactive_lab',
        description: 'ทดสอบการถอดรหัสและคำนวณเวลาที่แฮกเกอร์ใช้เจาะรหัส',
        subSection: 'password',
      },
      {
        id: 'safety_netiquette',
        title: 'สถานการณ์จำลองมารยาทดิจิทัลและกลลวง Phishing',
        durationMinutes: 12,
        type: 'interactive_lab',
        description: 'จำลองการตอบรับข้อความแปลกปลอม ลิงก์ลวง และการหลอกโอนเงิน',
        subSection: 'netiquette',
      },
      {
        id: 'safety_search_lab',
        title: 'ห้องแล็บค้นหาข้อมูลขั้นสูง & ประเมินความน่าเชื่อถือ (ป.6/3)',
        durationMinutes: 16,
        type: 'interactive_lab',
        description: 'ฝึกใช้ " ", -, OR, site:, filetype: เทียบหลายแหล่ง และสรุปใจความสำคัญ',
        subSection: 'searchLab',
      },
      {
        id: 'safety_quiz',
        title: 'แบบประเมินความปลอดภัยไซเบอร์ & ข้อสอบเชิงซ้อน O-NET',
        durationMinutes: 10,
        type: 'quiz',
        description: 'วัดผลการประยุกต์ใช้ความรู้ทั้งแบบปรนัยและเลือกตอบเชิงซ้อน',
        subSection: 'quiz',
      },
    ],
  },
  {
    key: 'thinking',
    stepNum: '02',
    stepCode: 'MOD-02',
    titleTh: 'ตรรกะ · การคิดเชิงคำนวณ & Flowchart',
    titleEn: 'Logical Reasoning, Storyboard & Flowchart',
    levelTitle: 'Level 2: นักคิดแก้ปัญหาอย่างเป็นระบบ (Systematic Thinker)',
    levelNumber: 2,
    levelRank: 'ระดับปานกลาง (Intermediate)',
    estimatedMinutes: 75,
    curriculumCode: 'มาตรฐาน ว 4.2 ป.4/1 (Must-know), ป.4/2, ป.5/1, ป.6/1 (Must-know)',
    themeColor: 'sky',
    accentBg: 'bg-sky-50 dark:bg-sky-950/30',
    accentBorder: 'border-sky-300 dark:border-sky-800',
    accentText: 'text-sky-700 dark:text-sky-400',
    accentGradient: 'from-sky-500 to-indigo-600',
    icon: <Brain className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    summary: 'ฝึกเหตุผลเชิงตรรกะทั้งเกม OX, Mini Sudoku, Binary Search (ทายเลข 1–1,000,000), การออกแบบ Storyboard, 4 เสาหลัก CT และเขียนผังงาน Flowchart เงื่อนไข/วนซ้ำ',
    learningOutcomes: [
      'ใช้เหตุผลเชิงตรรกะทำนายผลลัพธ์เมื่อเงื่อนไขเริ่มต้นต่างกันผ่านเกม OX และสถานการณ์จริง (ป.4/1, ป.5/1)',
      'แก้ปัญหาด้วยแนวคิดแบบวนซ้ำและเงื่อนไข เช่น Binary Search และคำนวณเวลาเดินทาง (ป.6/1)',
      'ออกแบบ Storyboard นิทานโต้ตอบและผังงาน Flowchart ด้วยสัญลักษณ์มาตรฐานสากล (ป.4/2, ป.5/2)',
      'ประยุกต์ใช้ 4 เสาหลัก CT และตรวจจับข้อผิดพลาดในอัลกอริทึมเขาวงกต 5 ด่าน',
    ],
    toolsAndStack: ['4 Pillars Matrix', 'Flowchart Studio', 'Binary Search Arena', 'OX & Sudoku · Storyboard Lab'],
    xpReward: 350,
    defaultSubSection: 'pillars',
    lessons: [
      {
        id: 'thinking_pillars',
        title: '4 เสาหลักการคิดเชิงคำนวณและตัวอย่างในชีวิตจริง',
        durationMinutes: 15,
        type: 'concept',
        description: 'ฝึกวิเคราะห์ปัญหาขนาดใหญ่ให้กลายเป็นชิ้นเล็กที่จัดการได้',
        subSection: 'pillars',
      },
      {
        id: 'thinking_flowchart',
        title: 'สตูดิโอเขียนผังงานแก้ปัญหา (Flowchart Studio)',
        durationMinutes: 20,
        type: 'interactive_lab',
        description: 'ลากวางบล็อกผังงาน ตรวจสอบตรรกะแบบ If-Else, Loop และข้อสอบเชิงซ้อน',
        subSection: 'flowchart',
      },
      {
        id: 'thinking_logic_lab',
        title: 'ห้องแล็บตรรกะ: Binary Search · เกม OX · Sudoku & Storyboard',
        durationMinutes: 25,
        type: 'interactive_lab',
        description: 'ทายเลข 1–1,000,000 ใน 20 คำถาม เล่นเกม OX/Sudoku และออกแบบ Storyboard',
        subSection: 'logicLab',
      },
      {
        id: 'thinking_puzzle',
        title: 'เกมเขาวงกตและโจทย์ Bebras Challenge (5 ด่าน)',
        durationMinutes: 15,
        type: 'quiz',
        description: 'วางแผนเส้นทางหุ่นยนต์ด้วยลำดับ เงื่อนไข และลูปทำซ้ำ',
        subSection: 'puzzle',
      },
    ],
  },
  {
    key: 'codingLab',
    stepNum: '03',
    stepCode: 'MOD-03',
    titleTh: 'ปฏิบัติการโค้ดดิ้ง Scratch · Micro:bit & แก้บั๊ก',
    titleEn: 'Block Coding, Variables, Broadcast & Debugging',
    levelTitle: 'Level 3: นักประดิษฐ์และโปรแกรมเมอร์ (Code & IoT Crafter)',
    levelNumber: 3,
    levelRank: 'ระดับก้าวหน้า (Advanced Junior)',
    estimatedMinutes: 100,
    curriculumCode: 'มาตรฐาน ว 4.2 ป.4/1, ป.4/2, ป.5/2, ป.6/2',
    themeColor: 'indigo',
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    accentBorder: 'border-indigo-300 dark:border-indigo-800',
    accentText: 'text-indigo-700 dark:text-indigo-400',
    accentGradient: 'from-indigo-600 to-purple-600',
    icon: <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    summary: 'ลงมือพัฒนาโปรแกรม Scratch ทั้งวาดเรขาคณิต Broadcast ตัวแปร เงื่อนไขเลขคู่-คี่ ตรวจสมส่วนร่างกาย หา ค.ร.น. (LCM) จำลอง Micro:bit V2 และฝึกจับผิดแก้บั๊กโค้ดของผู้อื่น',
    learningOutcomes: [
      'เขียนโปรแกรมแบบลำดับ การวนซ้ำ และการส่งสาร Broadcast ระหว่างตัวละคร (ป.4/1, ป.4/2)',
      'ออกแบบโปรแกรมตรวจสอบเงื่อนไขครอบคลุมทุกกรณี เช่น เลขคู่-คี่ และน้ำหนัก-ส่วนสูง (ป.5/2)',
      'พัฒนาโปรแกรมที่ผสาน ตัวแปร + ลูป + เงื่อนไข เช่น เกมและเครื่องคำนวณ ค.ร.น. (ป.6/2)',
      'ตรวจสอบและแก้ไขข้อผิดพลาด (Debugging) ของโปรแกรมที่ผู้อื่นเขียนทีละขั้นตอน',
    ],
    toolsAndStack: ['Scratch 3.0 Sandbox (+Variables)', 'Code Debugger Lab', 'Micro:bit V2 Simulator', 'Music Synth Lab'],
    xpReward: 450,
    defaultSubSection: 'scratch',
    lessons: [
      {
        id: 'coding_scratch_basics',
        title: 'Scratch Studio: วาดเรขาคณิต Broadcast & ลูปทำซ้ำ',
        durationMinutes: 20,
        type: 'interactive_lab',
        description: 'สร้างรูปหลายเหลี่ยมและส่งสาร Broadcast ระหว่างตัวละคร (ป.4/1, ป.4/2)',
        subSection: 'scratch',
      },
      {
        id: 'coding_scratch_logic',
        title: 'Scratch ขั้นสูง: ตัวแปร · เลขคู่/คี่ · สมส่วน · หา ค.ร.น.',
        durationMinutes: 25,
        type: 'interactive_lab',
        description: 'เขียนโปรแกรมใช้ Variables + Loop + If-Else ตรวจเลขคู่คี่และหา ค.ร.น. (ป.5/2, ป.6/2)',
        subSection: 'scratch',
      },
      {
        id: 'coding_debug_lab',
        title: 'ห้องจับผิดและแก้บั๊กโค้ดทีละขั้นตอน (Code Debugger Lab)',
        durationMinutes: 25,
        type: 'interactive_lab',
        description: 'Trace โค้ดของผู้อื่นทีละบรรทัดเพื่อหาจุดผิดพลาดใน Scratch, BMI และ ค.ร.น.',
        subSection: 'debugLab',
      },
      {
        id: 'coding_microbit',
        title: 'ห้องทดลองเสมือน Micro:bit V2 & เซนเซอร์สิ่งแวดล้อม',
        durationMinutes: 15,
        type: 'interactive_lab',
        description: 'โปรแกรมแสดงหัวใจเต้น, ลูกเต๋าสุ่มตัวเลข, และเทอร์โมมิเตอร์ดิจิทัล',
        subSection: 'microbit',
      },
      {
        id: 'coding_project_pack',
        title: 'คลังโจทย์โค้ดดิ้งต้นแบบและวิเคราะห์โค้ด',
        durationMinutes: 15,
        type: 'project',
        description: 'ศึกษาตัวอย่างโปรเจกต์โค้ดดิ้งและถอดรหัสตรรกะการทำงาน',
        subSection: 'examplesGallery',
      },
    ],
  },
  {
    key: 'showcase',
    stepNum: '04',
    stepCode: 'MOD-04',
    titleTh: 'จัดการข้อมูล · นำเสนอ Blog · แฟ้มผลงาน & เกียรติบัตร',
    titleEn: 'Data Processing, Web Presentation & Showcase',
    levelTitle: 'Level 4: นักวิเคราะห์ข้อมูล & นวัตกรดิจิทัล (Creative Innovator)',
    levelNumber: 4,
    levelRank: 'ระดับเชี่ยวชาญ (Mastery & Reflection)',
    estimatedMinutes: 65,
    curriculumCode: 'มาตรฐาน ว 4.2 ป.4/4, ป.5/4 (และประมวลผลโครงงาน ป.6)',
    themeColor: 'purple',
    accentBg: 'bg-purple-50 dark:bg-purple-950/30',
    accentBorder: 'border-purple-300 dark:border-purple-800',
    accentText: 'text-purple-700 dark:text-purple-400',
    accentGradient: 'from-purple-600 to-rose-600',
    icon: <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    summary: 'ฝึกเก็บและประมวลผลข้อมูลด้วยตารางทำงาน (จัดกลุ่ม เรียงลำดับ หาผลรวม) ประเมินทางเลือก สำรวจพื้นที่และทำแบบสอบถามออนไลน์ สร้างหน้า Blog นำเสนอข้อมูล และจัดทำแฟ้มผลงาน',
    learningOutcomes: [
      'รวบรวม ประมวลผล (เปรียบเทียบ จัดกลุ่ม เรียงลำดับ หาผลรวม) และสร้างทางเลือกจากข้อมูลเมนูอาหาร 5 วัน (ป.4/4)',
      'ใช้ซอฟต์แวร์หลากหลายและบริการอินเทอร์เน็ตสำรวจความคิดเห็น สำรวจพื้นที่ และนำเสนอผ่าน Blog/Web (ป.5/4)',
      'สะท้อนกระบวนการคิด จัดทำ Digital Portfolio และให้ข้อเสนอแนะเพื่อนด้วยเกณฑ์รูบริก',
      'สำเร็จหลักสูตรและได้รับเกียรติบัตรรับรองสมรรถนะวิทยาการคำนวณอย่างเป็นทางการ',
    ],
    toolsAndStack: ['Lunch Spreadsheet Lab', 'Online Survey & Map Lab', 'Student Blog Preview', 'Digital Portfolio Hub'],
    xpReward: 350,
    defaultSubSection: 'dataLab',
    lessons: [
      {
        id: 'showcase_data_lab',
        title: 'แล็บตารางข้อมูลอาหาร 5 วัน · แผนที่สำรวจ & Blog/Web (ป.4/4, ป.5/4)',
        durationMinutes: 25,
        type: 'interactive_lab',
        description: 'เรียงลำดับ คำนวณผลรวม ประเมินทางเลือก วิเคราะห์ผลสำรวจ และสร้าง Blog นำเสนอ',
        subSection: 'dataLab',
      },
      {
        id: 'showcase_portfolio',
        title: 'คลังผลงานสร้างสรรค์และการส่งชิ้นงานดิจิทัล',
        durationMinutes: 15,
        type: 'project',
        description: 'จัดแสดงชิ้นงาน บันทึกผลลัพธ์ และแลกเปลี่ยนความคิดเห็นกับเพื่อน (2 Stars & Wish)',
        subSection: 'gallery',
      },
      {
        id: 'showcase_journal',
        title: 'สมุดบันทึกสะท้อนคิด 3-2-1 และประจำวัน (Reflection Journal)',
        durationMinutes: 15,
        type: 'concept',
        description: 'ตอบคำถามทบทวน สิ่งที่ได้เรียนรู้ อุปสรรค และแนวทางนำไปประยุกต์ใช้',
        subSection: 'reflection',
      },
      {
        id: 'showcase_certificate',
        title: 'การประเมินรูบริกและออกเกียรติบัตรสำเร็จหลักสูตร',
        durationMinutes: 10,
        type: 'quiz',
        description: 'ตรวจสอบเกณฑ์ผ่านทุกโมดูล พิมพ์เกียรติบัตร PDF',
        subSection: 'certificate',
      },
    ],
  },
];

export const VisualSyllabusOverview: React.FC<VisualSyllabusOverviewProps> = ({
  moduleProgress,
  points,
  profile,
  onNavigate,
  onOpenCertificate,
}) => {
  // Active selected module for detailed inspection
  const [selectedModuleKey, setSelectedModuleKey] = useState<'safety' | 'thinking' | 'codingLab' | 'showcase'>('safety');
  // Visual Mode: 'roadmap' (Visual Pathway) vs 'matrix' (Syllabus Table)
  const [viewMode, setViewMode] = useState<'roadmap' | 'matrix'>('roadmap');
  // Study Pace: standard (1 period/wk = 50min) vs fast (2 periods/wk = 100min)
  const [studyPace, setStudyPace] = useState<'standard' | 'accelerated'>('standard');

  const selectedModule = useMemo(() => {
    return SYLLABUS_MODULES.find((m) => m.key === selectedModuleKey) || SYLLABUS_MODULES[0];
  }, [selectedModuleKey]);

  // Calculations for time and progression
  const stats = useMemo(() => {
    const totalMinutes = SYLLABUS_MODULES.reduce((acc, m) => acc + m.estimatedMinutes, 0);
    const completedModulesCount = Object.values(moduleProgress).filter(Boolean).length;
    
    let completedMinutes = 0;
    SYLLABUS_MODULES.forEach((m) => {
      if (moduleProgress[m.key]) {
        completedMinutes += m.estimatedMinutes;
      }
    });

    const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);
    const progressPercent = Math.round((completedMinutes / totalMinutes) * 100);

    // Current student skill level & rank
    let currentLevelNumber = 1;
    let currentLevelTitle = 'Level 1: พลเมืองดิจิทัลรอบรู้ (Digital Citizen)';
    let currentRankBadge = 'ระดับพื้นฐาน';

    if (moduleProgress.safety && moduleProgress.thinking && moduleProgress.codingLab && moduleProgress.showcase) {
      currentLevelNumber = 4;
      currentLevelTitle = 'Level 4: นวัตกรดิจิทัลสร้างสรรค์ (Creative Innovator)';
      currentRankBadge = 'สำเร็จหลักสูตรสูงสุด';
    } else if (moduleProgress.safety && moduleProgress.thinking && moduleProgress.codingLab) {
      currentLevelNumber = 4;
      currentLevelTitle = 'กำลังเข้าสู่ Level 4: การสะท้อนคิดและโครงงาน';
      currentRankBadge = 'ระดับเชี่ยวชาญ';
    } else if (moduleProgress.safety && moduleProgress.thinking) {
      currentLevelNumber = 3;
      currentLevelTitle = 'Level 3: นักประดิษฐ์และโปรแกรมเมอร์ (Code & IoT Crafter)';
      currentRankBadge = 'ระดับก้าวหน้า';
    } else if (moduleProgress.safety) {
      currentLevelNumber = 2;
      currentLevelTitle = 'Level 2: นักคิดแก้ปัญหาอย่างเป็นระบบ (Systematic Thinker)';
      currentRankBadge = 'ระดับปานกลาง';
    }

    // Estimated weeks to complete based on pace
    const minutesPerWeek = studyPace === 'standard' ? 50 : 100;
    const estimatedWeeksRemaining = Math.ceil(remainingMinutes / minutesPerWeek);

    // Estimated target completion date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (estimatedWeeksRemaining * 7));
    const targetDateThai = targetDate.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      totalMinutes,
      totalHoursStr: `${Math.floor(totalMinutes / 60)} ชม. ${totalMinutes % 60 > 0 ? `${totalMinutes % 60} นาที` : ''}`,
      completedMinutes,
      completedHoursStr: `${Math.floor(completedMinutes / 60)} ชม. ${completedMinutes % 60} นาที`,
      remainingMinutes,
      remainingHoursStr: `${Math.floor(remainingMinutes / 60)} ชม. ${remainingMinutes % 60} นาที`,
      progressPercent,
      completedModulesCount,
      currentLevelNumber,
      currentLevelTitle,
      currentRankBadge,
      estimatedWeeksRemaining,
      targetDateThai,
    };
  }, [moduleProgress, studyPace]);

  const handleSelectModule = (key: 'safety' | 'thinking' | 'codingLab' | 'showcase') => {
    soundEffects.play('click');
    setSelectedModuleKey(key);
  };

  const handleNavigateToModule = (module: SyllabusModule) => {
    soundEffects.play('click');
    if (module.key === 'showcase' && moduleProgress.safety && moduleProgress.thinking && moduleProgress.codingLab && onOpenCertificate) {
      // Completed all previous: offer direct certificate or journal
      onNavigate(module.key, module.defaultSubSection);
    } else {
      onNavigate(module.key, module.defaultSubSection);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* ----------------- 1. HEADER & ROADMAP METRICS ----------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Compass className="w-4 h-4" />
            <span className="uppercase tracking-wider">Visual Syllabus &amp; Skill Progression Roadmap</span>
            <span aria-hidden="true">·</span>
            <span>หลักสูตร สพฐ. &amp; สสวท. ว 4.2</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            แผนการเรียนรู้เชิงทัศนะ &amp; เส้นทางพัฒนาสมรรถนะ 4 ขั้น
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            สำรวจเส้นทางการเรียนรู้แบบเป็นขั้นตอน พร้อมระยะเวลาโดยประมาณ และเกณฑ์วัดระดับความเชี่ยวชาญ
          </p>
        </div>

        {/* View Switcher Controls (Zero-pill compliant segmented buttons) */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setViewMode('roadmap');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'roadmap'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>เส้นทางเดิน (Roadmap)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setViewMode('matrix');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>ตารางหลักสูตร (Syllabus Matrix)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- 2. PROGRESSION & TIME ESTIMATOR METRIC CARDS ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Progression Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>สถานะสมรรถนะปัจจุบัน</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {stats.completedModulesCount} / 4 โมดูล
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={stats.currentLevelTitle}>
            {stats.currentLevelTitle}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>ความคืบหน้าภาพรวม</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{stats.progressPercent}%</span>
          </div>
        </div>

        {/* Metric 2: Estimated Time Completion */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>เวลาเรียนรวมทั้งหลักสูตร</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalHoursStr}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>เรียนแล้ว: {stats.completedHoursStr}</span>
            <span aria-hidden="true">·</span>
            <span>คงเหลือ: {stats.remainingHoursStr}</span>
          </div>
        </div>

        {/* Metric 3: Estimated Target Completion Date & Pace */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>คาดการณ์วันที่จบหลักสูตร</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {stats.completedModulesCount === 4 ? '🎉 ผ่านครบทุกโมดูลแล้ว!' : `ประมาณ ${stats.targetDateThai}`}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-slate-500">ความเร็วในการเรียน:</span>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('tick');
                setStudyPace(studyPace === 'standard' ? 'accelerated' : 'standard');
              }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              {studyPace === 'standard' ? '1 คาบ/สัปดาห์ (สลับ)' : '2 คาบ/สัปดาห์ (สลับ)'}
            </button>
          </div>
        </div>

        {/* Metric 4: Experience Points & Skill Mastery Rewards */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>เกียรติบัตร &amp; แต้มสะสม</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <span>{points.toLocaleString()}</span>
            <span className="text-xs font-normal text-slate-500">XP</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>รับเกียรติบัตรเมื่อผ่านครบ 4 โมดูล</span>
            {onOpenCertificate && (
              <button
                type="button"
                onClick={onOpenCertificate}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                ดูตัวอย่าง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- 3. VIEW MODE A: INTERACTIVE VISUAL ROADMAP PATHWAY ----------------- */}
      {viewMode === 'roadmap' && (
        <div className="space-y-6">
          {/* Milestone Pathway Stepper */}
          <div className="relative">
            {/* Horizontal Line connector (Visible on md and up) */}
            <div className="hidden md:block absolute top-10 left-12 right-12 h-1 bg-slate-200 dark:bg-slate-800 z-0 rounded-full" />
            <div
              className="hidden md:block absolute top-10 left-12 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 z-0 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, (stats.completedModulesCount - 0.5) / 3.5) * 100}%`,
              }}
            />

            {/* 4 Roadmap Milestone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              {SYLLABUS_MODULES.map((mod, index) => {
                const isCompleted = Boolean(moduleProgress[mod.key]);
                const isSelected = selectedModuleKey === mod.key;
                const isCurrentActive =
                  !isCompleted &&
                  (index === 0 || Boolean(moduleProgress[SYLLABUS_MODULES[index - 1].key]));
                const isLocked = !isCompleted && !isCurrentActive;

                return (
                  <div
                    key={mod.key}
                    onClick={() => handleSelectModule(mod.key)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer text-left relative flex flex-col justify-between group ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700'
                        : isCompleted
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                        : isLocked
                        ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-90 hover:opacity-100 hover:border-slate-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Step Number & Status Indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Step Icon Box with small icon indicator overlay */}
                        <div className="relative">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs transition-transform group-hover:scale-105 ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrentActive
                                ? 'bg-indigo-600 text-white animate-pulse'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrentActive ? (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>

                          {/* Small icon indicator corner badge */}
                          {isCompleted && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs"
                              title="สำเร็จแล้ว"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          {isLocked && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs"
                              title="ล็อกอยู่ (ต้องผ่านโมดูลก่อนหน้า)"
                            >
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {isCurrentActive && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs"
                              title="กำลังเรียนรู้ขั้นนี้"
                            >
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                          {mod.stepCode}
                        </span>
                      </div>

                      {/* Small Status Badge Indicator (Checkmark for completed, Lock for locked) */}
                      <span className="text-xs">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>ผ่านแล้ว</span>
                          </span>
                        ) : isCurrentActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block shrink-0" />
                            <span>กำลังเรียน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>ล็อกอยู่</span>
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Module Title & Level */}
                    <div className="space-y-1.5 my-1">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                        {mod.levelTitle.split(':')[0]}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {mod.titleTh}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {mod.summary}
                      </p>
                    </div>

                    {/* Bottom Metadata: Time & XP */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{mod.estimatedMinutes} นาที</span>
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        +{mod.xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------- 4. EXPANDED DETAILED INSPECTOR PANEL ----------------- */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedModule.stepCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedModule.curriculumCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedModule.levelTitle}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {selectedModule.icon}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {selectedModule.stepNum}. {selectedModule.titleTh}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedModule.titleEn}
                      </span>
                      {(() => {
                        const isPassed = Boolean(moduleProgress[selectedModule.key]);
                        const idx = SYLLABUS_MODULES.findIndex((m) => m.key === selectedModule.key);
                        const isActive = !isPassed && (idx === 0 || Boolean(moduleProgress[SYLLABUS_MODULES[idx - 1].key]));
                        if (isPassed) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/80">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>สำเร็จแล้ว</span>
                            </span>
                          );
                        }
                        if (isActive) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
                              <span>กำลังเรียนรู้</span>
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>ล็อกอยู่ (ต้องผ่านโมดูลที่ {idx} ก่อน)</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed pt-1">
                  {selectedModule.summary}
                </p>
              </div>

              {/* Action Jump to Module Button */}
              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigateToModule(selectedModule)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{moduleProgress[selectedModule.key] ? 'ทบทวนบทเรียนนี้' : 'เข้าสู่บทเรียนทันที'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Grid: Learning Outcomes vs Lessons Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              {/* Left Column: Learning Outcomes & Tools (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    🎯 จุดประสงค์การเรียนรู้ (Learning Objectives)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {selectedModule.learningOutcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    🛠️ เครื่องมือและห้องแล็บปฏิบัติการ
                  </h4>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {selectedModule.toolsAndStack.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Lessons & Estimated Duration (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <span>📚 รายละเอียดกิจกรรม &amp; ระยะเวลา ({selectedModule.lessons.length} บทเรียน)</span>
                  <span className="font-mono text-slate-500 font-normal">รวม ~{selectedModule.estimatedMinutes} นาที</span>
                </div>

                <div className="space-y-2">
                  {selectedModule.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        soundEffects.play('click');
                        onNavigate(selectedModule.key, lesson.subSection);
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {lesson.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {lesson.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {lesson.durationMinutes} นาที
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 4. VIEW MODE B: FULL SYLLABUS MATRIX TABLE ----------------- */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">ขั้นตอน / รหัส</th>
                <th className="py-3 px-4">ชื่อโมดูลหลัก (สพฐ. ว 4.2)</th>
                <th className="py-3 px-4">ระดับสมรรถนะ (Skill Level)</th>
                <th className="py-3 px-4">เวลาเรียน</th>
                <th className="py-3 px-4">รางวัล XP</th>
                <th className="py-3 px-4">สถานะของคุณ</th>
                <th className="py-3 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SYLLABUS_MODULES.map((mod, idx) => {
                const isPassed = Boolean(moduleProgress[mod.key]);
                const isCurrent = !isPassed && (idx === 0 || Boolean(moduleProgress[SYLLABUS_MODULES[idx - 1].key]));
                const isLocked = !isPassed && !isCurrent;
                return (
                  <tr
                    key={mod.key}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {mod.stepCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{mod.titleTh}</div>
                      <div className="text-[11px] text-slate-500">{mod.curriculumCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{mod.levelTitle}</div>
                      <div className="text-[11px] text-slate-500">{mod.levelRank}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      ~{mod.estimatedMinutes} นาที
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{mod.xpReward} XP
                    </td>
                    <td className="py-3.5 px-4">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>ผ่านแล้ว</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block shrink-0" />
                          <span>กำลังเรียน</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>ล็อกอยู่</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleNavigateToModule(mod)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>เข้าเรียน</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
