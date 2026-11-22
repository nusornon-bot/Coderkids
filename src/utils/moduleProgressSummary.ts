export interface ModuleProgressState {
  safety: boolean;
  thinking: boolean;
  codingLab: boolean;
  showcase: boolean;
}

export type ModuleProgressKey = keyof ModuleProgressState;

export interface OverallModuleItem {
  key: ModuleProgressKey;
  order: number;
  shortNum: string;
  title: string;
  subtitle: string;
  done: boolean;
  isNextUp: boolean;
}

export interface OverallModuleProgressSummary {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  encouragementText: string;
  nextModuleKey: ModuleProgressKey | null;
  nextModuleTitle: string | null;
  isAllCompleted: boolean;
  modules: OverallModuleItem[];
}

const MODULE_META: Array<{
  key: ModuleProgressKey;
  order: number;
  shortNum: string;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'safety',
    order: 1,
    shortNum: '01',
    title: 'ความปลอดภัย & PDPA',
    subtitle: 'พลเมืองดิจิทัลและการสืบค้น',
  },
  {
    key: 'thinking',
    order: 2,
    shortNum: '02',
    title: 'คิดเชิงคำนวณ & ผังงาน',
    subtitle: 'ตรรกะและอัลกอริทึม',
  },
  {
    key: 'codingLab',
    order: 3,
    shortNum: '03',
    title: 'Scratch & Micro:bit',
    subtitle: 'ลงมือเขียนโค้ดจริง',
  },
  {
    key: 'showcase',
    order: 4,
    shortNum: '04',
    title: 'โครงงาน & เกียรติบัตร',
    subtitle: 'สร้างสรรค์ผลงาน',
  },
];

export function computeOverallModuleProgressSummary(
  moduleProgress: ModuleProgressState
): OverallModuleProgressSummary {
  const safeProgress: ModuleProgressState = {
    safety: Boolean(moduleProgress?.safety),
    thinking: Boolean(moduleProgress?.thinking),
    codingLab: Boolean(moduleProgress?.codingLab),
    showcase: Boolean(moduleProgress?.showcase),
  };

  const firstIncomplete = MODULE_META.find((m) => !safeProgress[m.key]) || null;

  const modules: OverallModuleItem[] = MODULE_META.map((m) => ({
    ...m,
    done: safeProgress[m.key],
    isNextUp: firstIncomplete?.key === m.key,
  }));

  const completedCount = modules.filter((m) => m.done).length;
  const totalCount = MODULE_META.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isAllCompleted = completedCount === totalCount;

  let encouragementText = 'เริ่มต้นก้าวแรกสู่โลกวิทยาการคำนวณกันเลย!';
  if (completedCount === 1) {
    encouragementText = 'เริ่มต้นได้เยี่ยมมาก! ไปต่อโมดูลถัดไปกันเถอะ';
  } else if (completedCount === 2) {
    encouragementText = 'เก่งมาก! ผ่านมาครึ่งทางแล้ว อีกนิดเดียว';
  } else if (completedCount === 3) {
    encouragementText = 'ยอดเยี่ยม! เหลืออีกเพียง 1 โมดูลก็จะครบแล้ว';
  } else if (completedCount === 4) {
    encouragementText = 'สุดยอด! เรียนสำเร็จครบทั้ง 4 โมดูลหลักแล้ว';
  }

  return {
    completedCount,
    totalCount,
    progressPercent,
    encouragementText,
    nextModuleKey: firstIncomplete ? firstIncomplete.key : null,
    nextModuleTitle: firstIncomplete ? firstIncomplete.title : null,
    isAllCompleted,
    modules,
  };
}
