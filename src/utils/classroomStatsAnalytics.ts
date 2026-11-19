import { PorPor5StudentRecord } from './porPor5SyncStore';

export type SupportPriority = 'urgent' | 'watch' | 'on_track';

export interface ModuleStatSummary {
  key: 'pdpa' | 'logic' | 'coding' | 'showcase';
  shortLabel: string;
  fullLabel: string;
  indicatorCode: string;
  maxScore: number;
  averageScore: number;
  averagePercent: number;
  completedCount: number;
  completionRatePercent: number;
}

export interface StudentAnalyticsRow {
  student: PorPor5StudentRecord;
  completedModulesCount: number; // 0..4
  moduleProgressPercent: number; // 0..100
  modulePercents: {
    pdpa: number;
    logic: number;
    coding: number;
    showcase: number;
  };
  weakestModule: {
    key: 'pdpa' | 'logic' | 'coding' | 'showcase';
    label: string;
    percent: number;
  };
  supportPriority: SupportPriority;
  alertReasons: string[];
  recommendedAction: string;
}

export interface ClassroomStatsOverview {
  totalStudents: number;
  passedCount: number;
  passRatePercent: number;
  averageTotalScore: number;
  averageRubric: number;
  averagePoints: number;
  averageAttendance: number;
  overallModuleProgressPercent: number;
  moduleSummaries: ModuleStatSummary[];
  weakestClassModule: ModuleStatSummary | null;
  gradeDistribution: Array<{
    gradeLevel: PorPor5StudentRecord['gradeLevel'];
    count: number;
    percent: number;
  }>;
  studentRows: StudentAnalyticsRow[];
  needsSupportStudents: StudentAnalyticsRow[];
  urgentCount: number;
  watchCount: number;
  topPerformers: StudentAnalyticsRow[];
}

const MODULE_META: Array<{
  key: 'pdpa' | 'logic' | 'coding' | 'showcase';
  shortLabel: string;
  fullLabel: string;
  indicatorCode: string;
  maxScore: number;
  getScore: (s: PorPor5StudentRecord) => number;
  getIndicator: (s: PorPor5StudentRecord) => number;
  coachingTip: string;
}> = [
  {
    key: 'pdpa',
    shortLabel: 'ความปลอดภัย & PDPA',
    fullLabel: 'โมดูล 1: ความปลอดภัยดิจิทัล & กฎหมาย PDPA',
    indicatorCode: 'ว 4.2 ป.x/4',
    maxScore: 25,
    getScore: (s) => s.pdpaScore,
    getIndicator: (s) => s.indicator4,
    coachingTip: 'ทบทวนเกมแยกแยะข้อมูลส่วนบุคคล (PDPA Lab) และฝึกสร้างรหัสผ่านปลอดภัยแบบทีละขั้น',
  },
  {
    key: 'logic',
    shortLabel: 'การคิดเชิงคำนวณ',
    fullLabel: 'โมดูล 2: การคิดเป็นลำดับขั้น & อัลกอริทึม',
    indicatorCode: 'ว 4.2 ป.x/1',
    maxScore: 25,
    getScore: (s) => s.logicScore,
    getIndicator: (s) => s.indicator1,
    coachingTip: 'ฝึกเรียงลำดับขั้นตอนด้วยผังงาน Flowchart และเกม Algorithm Puzzle ระดับเริ่มต้น',
  },
  {
    key: 'coding',
    shortLabel: 'โค้ดดิ้ง Scratch/Micro:bit',
    fullLabel: 'โมดูล 3: ปฏิบัติการ Scratch & Micro:bit',
    indicatorCode: 'ว 4.2 ป.x/2',
    maxScore: 30,
    getScore: (s) => s.codingScore,
    getIndicator: (s) => s.indicator2,
    coachingTip: 'จัดจับคู่เพื่อนคู่คิด (Buddy System) ฝึกต่อบล็อก Scratch และใช้ Socratic Debug Lab ทีละคำสั่ง',
  },
  {
    key: 'showcase',
    shortLabel: 'โครงงาน & นำเสนอ',
    fullLabel: 'โมดูล 4: นำเสนอผลงาน & สะท้อนคิด',
    indicatorCode: 'ว 4.2 ป.x/3',
    maxScore: 20,
    getScore: (s) => s.showcaseScore,
    getIndicator: (s) => s.indicator3,
    coachingTip: 'ช่วยวางโครงร่างโครงงานขนาดเล็กด้วย Project Canvas และกระตุ้นการส่งผลงานใน Showcase',
  },
];

const GRADE_ORDER: PorPor5StudentRecord['gradeLevel'][] = [
  'ดีเยี่ยม (4)',
  'ดีมาก (3.5)',
  'ดี (3)',
  'ผ่านเกณฑ์ (2)',
  'ควรปรับปรุง (1)',
];

/**
 * Evaluates a single student's module completion, weakest competency, and early-warning support tier.
 */
export function evaluateStudentSupportStatus(student: PorPor5StudentRecord): StudentAnalyticsRow {
  const modulePercents = {
    pdpa: Math.round((Math.max(0, Math.min(25, student.pdpaScore)) / 25) * 100),
    logic: Math.round((Math.max(0, Math.min(25, student.logicScore)) / 25) * 100),
    coding: Math.round((Math.max(0, Math.min(30, student.codingScore)) / 30) * 100),
    showcase: Math.round((Math.max(0, Math.min(20, student.showcaseScore)) / 20) * 100),
  };

  // A module is counted as "completed / proficient" if indicator >= 2 and module score >= 60%
  const completedFlags = MODULE_META.map(
    (m) => m.getIndicator(student) >= 2 && modulePercents[m.key] >= 60
  );
  const completedModulesCount = completedFlags.filter(Boolean).length;
  const moduleProgressPercent = Math.round(
    (modulePercents.pdpa + modulePercents.logic + modulePercents.coding + modulePercents.showcase) / 4
  );

  // Identify weakest module
  let weakest = MODULE_META[0];
  let weakestPct = modulePercents[weakest.key];
  for (const m of MODULE_META) {
    if (modulePercents[m.key] < weakestPct) {
      weakest = m;
      weakestPct = modulePercents[m.key];
    }
  }

  const level1Indicators = [
    student.indicator1,
    student.indicator2,
    student.indicator3,
    student.indicator4,
  ].filter((v) => v <= 1).length;

  const alertReasons: string[] = [];
  if (student.totalScore < 55 || student.status === 'ปรับปรุง') {
    alertReasons.push(`คะแนนรวมต่ำกว่าเกณฑ์ (${student.totalScore}/100)`);
  } else if (student.totalScore < 70) {
    alertReasons.push(`คะแนนรวมอยู่ระดับเฝ้าระวัง (${student.totalScore}/100)`);
  }

  if (level1Indicators >= 2) {
    alertReasons.push(`มีตัวชี้วัด ว 4.2 ระดับ 1 จำนวน ${level1Indicators} ด้าน`);
  } else if (level1Indicators === 1) {
    alertReasons.push('มีตัวชี้วัด ว 4.2 ระดับ 1 จำนวน 1 ด้าน');
  }

  if (weakestPct < 60) {
    alertReasons.push(`${weakest.shortLabel} ต่ำกว่า 60% (${weakestPct}%)`);
  }

  if (student.attendancePercent < 75) {
    alertReasons.push(`เวลาเรียนต่ำกว่าเกณฑ์ (${student.attendancePercent}%)`);
  } else if (student.attendancePercent < 85) {
    alertReasons.push(`เวลาเรียนต้องติดตาม (${student.attendancePercent}%)`);
  }

  let supportPriority: SupportPriority = 'on_track';
  if (
    student.totalScore < 55 ||
    student.status === 'ปรับปรุง' ||
    level1Indicators >= 2 ||
    student.attendancePercent < 75
  ) {
    supportPriority = 'urgent';
  } else if (
    student.totalScore < 70 ||
    level1Indicators === 1 ||
    weakestPct < 60 ||
    student.attendancePercent < 85
  ) {
    supportPriority = 'watch';
  }

  return {
    student,
    completedModulesCount,
    moduleProgressPercent,
    modulePercents,
    weakestModule: {
      key: weakest.key,
      label: weakest.shortLabel,
      percent: weakestPct,
    },
    supportPriority,
    alertReasons,
    recommendedAction: weakest.coachingTip,
  };
}

/**
 * Computes full classroom summary metrics, module progress breakdowns, and intervention list.
 */
export function computeClassroomStats(
  students: PorPor5StudentRecord[]
): ClassroomStatsOverview {
  if (students.length === 0) {
    return {
      totalStudents: 0,
      passedCount: 0,
      passRatePercent: 0,
      averageTotalScore: 0,
      averageRubric: 0,
      averagePoints: 0,
      averageAttendance: 0,
      overallModuleProgressPercent: 0,
      moduleSummaries: MODULE_META.map((m) => ({
        key: m.key,
        shortLabel: m.shortLabel,
        fullLabel: m.fullLabel,
        indicatorCode: m.indicatorCode,
        maxScore: m.maxScore,
        averageScore: 0,
        averagePercent: 0,
        completedCount: 0,
        completionRatePercent: 0,
      })),
      weakestClassModule: null,
      gradeDistribution: GRADE_ORDER.map((g) => ({ gradeLevel: g, count: 0, percent: 0 })),
      studentRows: [],
      needsSupportStudents: [],
      urgentCount: 0,
      watchCount: 0,
      topPerformers: [],
    };
  }

  const totalStudents = students.length;
  const studentRows = students.map(evaluateStudentSupportStatus);

  const passedCount = students.filter((s) => s.status === 'ผ่านเกณฑ์').length;
  const passRatePercent = Math.round((passedCount / totalStudents) * 100);

  const sumScore = students.reduce((acc, s) => acc + s.totalScore, 0);
  const sumRubric = students.reduce((acc, s) => acc + s.rubricAvg, 0);
  const sumPoints = students.reduce((acc, s) => acc + (s.points || 0), 0);
  const sumAttendance = students.reduce((acc, s) => acc + (s.attendancePercent || 0), 0);

  const averageTotalScore = Number((sumScore / totalStudents).toFixed(1));
  const averageRubric = Number((sumRubric / totalStudents).toFixed(2));
  const averagePoints = Math.round(sumPoints / totalStudents);
  const averageAttendance = Math.round(sumAttendance / totalStudents);

  const moduleSummaries: ModuleStatSummary[] = MODULE_META.map((m) => {
    const avgScoreRaw = students.reduce((acc, s) => acc + m.getScore(s), 0) / totalStudents;
    const averageScore = Number(avgScoreRaw.toFixed(1));
    const averagePercent = Math.round((avgScoreRaw / m.maxScore) * 100);
    const completedCount = studentRows.filter(
      (r) => m.getIndicator(r.student) >= 2 && r.modulePercents[m.key] >= 60
    ).length;
    const completionRatePercent = Math.round((completedCount / totalStudents) * 100);

    return {
      key: m.key,
      shortLabel: m.shortLabel,
      fullLabel: m.fullLabel,
      indicatorCode: m.indicatorCode,
      maxScore: m.maxScore,
      averageScore,
      averagePercent,
      completedCount,
      completionRatePercent,
    };
  });

  const overallModuleProgressPercent = Math.round(
    moduleSummaries.reduce((acc, m) => acc + m.averagePercent, 0) / moduleSummaries.length
  );

  const weakestClassModule = [...moduleSummaries].sort(
    (a, b) => a.averagePercent - b.averagePercent
  )[0];

  const gradeDistribution = GRADE_ORDER.map((gradeLevel) => {
    const count = students.filter((s) => s.gradeLevel === gradeLevel).length;
    return {
      gradeLevel,
      count,
      percent: Math.round((count / totalStudents) * 100),
    };
  });

  const priorityRank: Record<SupportPriority, number> = {
    urgent: 0,
    watch: 1,
    on_track: 2,
  };

  const needsSupportStudents = studentRows
    .filter((r) => r.supportPriority !== 'on_track')
    .sort((a, b) => {
      const rankDiff = priorityRank[a.supportPriority] - priorityRank[b.supportPriority];
      if (rankDiff !== 0) return rankDiff;
      return a.student.totalScore - b.student.totalScore;
    });

  const urgentCount = needsSupportStudents.filter((r) => r.supportPriority === 'urgent').length;
  const watchCount = needsSupportStudents.filter((r) => r.supportPriority === 'watch').length;

  const topPerformers = [...studentRows]
    .sort((a, b) => b.student.totalScore - a.student.totalScore)
    .slice(0, 5);

  return {
    totalStudents,
    passedCount,
    passRatePercent,
    averageTotalScore,
    averageRubric,
    averagePoints,
    averageAttendance,
    overallModuleProgressPercent,
    moduleSummaries,
    weakestClassModule,
    gradeDistribution,
    studentRows,
    needsSupportStudents,
    urgentCount,
    watchCount,
    topPerformers,
  };
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates UTF-8 CSV content for exporting the Classroom Overview / Special Support Watchlist.
 */
export function buildClassroomStatsCsv(rows: StudentAnalyticsRow[]): string {
  const headers = [
    'รหัสนักเรียน',
    'ชื่อ-นามสกุล',
    'ชั้น/ห้อง',
    'ระดับการดูแล',
    'คะแนนรวม (100)',
    'รูบริกเฉลี่ย (4)',
    'ความคืบหน้าโมดูล (%)',
    'ผ่านโมดูล (จาก 4)',
    'เข้าเรียน (%)',
    'ด้านที่ควรเสริม',
    'สาเหตุที่ต้องติดตาม',
    'แนวทางช่วยเหลือแนะนำ',
  ];

  const priorityLabel: Record<SupportPriority, string> = {
    urgent: 'ดูแลเร่งด่วน',
    watch: 'เฝ้าระวัง',
    on_track: 'ปกติ',
  };

  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.student.studentId,
        r.student.name,
        r.student.fullGradeText,
        priorityLabel[r.supportPriority],
        r.student.totalScore,
        r.student.rubricAvg,
        r.moduleProgressPercent,
        `${r.completedModulesCount}/4`,
        r.student.attendancePercent,
        `${r.weakestModule.label} (${r.weakestModule.percent}%)`,
        r.alertReasons.join(' | ') || 'ผลการเรียนตามเกณฑ์',
        r.recommendedAction,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return lines.join('\n');
}
