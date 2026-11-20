import {
  BUILTIN_BATTLE_QUESTIONS,
  BattleDifficulty,
  BattleDifficultyFilter,
  BattleQuestionItem,
  DIFFICULTY_META,
} from '../data/battleQuestionBank.ts';
import {
  filterBattleQuestions,
  selectRandomBattleQuestions,
  shuffleArray,
} from './battleQuestionSelector.ts';

export type SmartExamSource = 'mixed' | 'Scratch' | 'Micro:bit' | 'standard';
export type SmartExamGrade = 'ทั้งหมด' | 'ป.4' | 'ป.5' | 'ป.6';

export interface SmartExamQuestion {
  id: string;
  platform: 'Scratch' | 'Micro:bit' | 'ว 4.2';
  difficulty?: BattleDifficulty;
  grade?: 'ป.4' | 'ป.5' | 'ป.6';
  indicator: string;
  question: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation: string;
}

export const THAI_CHOICE_LABELS = ['ก.', 'ข.', 'ค.', 'ง.'] as const;

export const STANDARD_CURRICULUM_QUESTIONS: SmartExamQuestion[] = [
  {
    id: 'std_p4_01',
    platform: 'ว 4.2',
    grade: 'ป.4',
    difficulty: 'easy',
    indicator: 'ว 4.2 ป.4/1',
    question: 'ข้อใดเป็นการใช้แนวคิดเชิงคำนวณแบบ "การแยกย่อยปัญหา" (Decomposition) ในชีวิตประจำวัน?',
    options: [
      'ท่องจำสูตรคูณแม่ 2 ถึงแม่ 12',
      'การแบ่งขั้นตอนการทำความสะอาดบ้านออกเป็น ห้องนอน ห้องน้ำ และห้องครัว',
      'การระบายสีภาพตามตัวอย่างในหนังสือ',
      'การวิ่งรอบสนามตามเวลาที่ครูกำหนด',
    ],
    correctAnswer: 1,
    explanation: 'Decomposition คือการแบ่งปัญหาใหญ่ที่ซับซ้อนให้กลายเป็นส่วนย่อยๆ เพื่อจัดการทีละขั้นตอน',
  },
  {
    id: 'std_p4_02',
    platform: 'ว 4.2',
    grade: 'ป.4',
    difficulty: 'easy',
    indicator: 'ว 4.2 ป.4/2',
    question: 'ในโปรแกรม Scratch ถ้าต้องการให้ตัวละครเดินไปข้างหน้า 10 ก้าว แล้วเลี้ยวขวา 90 องศา วนซ้ำ 4 รอบ จะได้รูปเรขาคณิตใด?',
    options: ['สามเหลี่ยมด้านเท่า', 'สี่เหลี่ยมจัตุรัส', 'วงกลม', 'หกเหลี่ยม'],
    correctAnswer: 1,
    explanation: 'หมุน 90 องศา 4 ครั้ง รวมเป็น 360 องศา และด้านเท่ากัน 4 ด้าน คือรูปสี่เหลี่ยมจัตุรัส',
  },
  {
    id: 'std_p4_03',
    platform: 'ว 4.2',
    grade: 'ป.4',
    difficulty: 'easy',
    indicator: 'ว 4.2 ป.4/4',
    question: 'ข้อมูลใดต่อไปนี้ "ไม่ควร" โพสต์เปิดเผยลงบนอินเทอร์เน็ตสาธารณะมากที่สุด?',
    options: [
      'ชื่อสัตว์เลี้ยง',
      'บัตรประจำตัวประชาชนและที่อยู่บ้าน',
      'กีฬาที่ตนเองชื่นชอบ',
      'อาหารมื้อเย็นที่ชอบทาน',
    ],
    correctAnswer: 1,
    explanation: 'เลขบัตรประชาชนและที่อยู่เป็นข้อมูลส่วนบุคคลอ่อนไหว เสี่ยงต่อการถูกมิจฉาชีพนำไปสวมรอย',
  },
  {
    id: 'std_p5_01',
    platform: 'ว 4.2',
    grade: 'ป.5',
    difficulty: 'medium',
    indicator: 'ว 4.2 ป.5/1',
    question: 'สถานการณ์ใดใช้คำสั่งแบบมีเงื่อนไข (If - Else) ในการแก้ปัญหา?',
    options: [
      'ถ้าฝนตกให้กางร่ม ถ้าฝนไม่ตกให้เดินตามปกติ',
      'ปรบมือ 10 ครั้งติดต่อกัน',
      'ล้างจานใบที่ 1 แล้วล้างใบที่ 2 จนหมด',
      'เดินตรงไปข้างหน้า 50 เมตร',
    ],
    correctAnswer: 0,
    explanation: 'คำสั่งมีเงื่อนไข (If-Else) คือการเลือกทำกิจกรรมที่แตกต่างกันตามผลลัพธ์ที่เป็นจริงหรือเท็จ',
  },
  {
    id: 'std_p5_02',
    platform: 'ว 4.2',
    grade: 'ป.5',
    difficulty: 'medium',
    indicator: 'ว 4.2 ป.5/2',
    question: 'หากเซ็นเซอร์วัดความชื้นของ Micro:bit อ่านค่าได้ 200 (แห้งมาก) คำสั่งเงื่อนไขใดควรสั่งให้ปั๊มน้ำทำงาน?',
    options: [
      'if moisture > 800: pump.start()',
      'if moisture < 300: pump.start()',
      'if moisture == 1000: pump.start()',
      'if moisture != 0: pump.stop()',
    ],
    correctAnswer: 1,
    explanation: 'เมื่อความชื้นต่ำกว่าเกณฑ์วิกฤต (เช่น < 300) ต้องสั่งเปิดปั๊มน้ำเพื่อช่วยต้นไม้',
  },
  {
    id: 'std_p5_03',
    platform: 'ว 4.2',
    grade: 'ป.5',
    difficulty: 'medium',
    indicator: 'ว 4.2 ป.5/4',
    question: 'ข้อใดเป็นการมีมารยาทดิจิทัล (Netiquette) ที่ถูกต้องในกลุ่มแชทห้องเรียน?',
    options: [
      'พิมพ์ข้อความตัวพิมพ์ใหญ่ทั้งหมดพร้อมเครื่องหมายตกใจหลายตัว',
      'ส่งสติกเกอร์รัวๆ 50 รูปตอนตีสอง',
      'ใช้ถ้อยคำสุภาพ ไม่แชร์ภาพถ่ายประจานเพื่อน และสื่อสารตามกาลเทศะ',
      'โพสต์คลิปวิดีโอที่มีลิขสิทธิ์ของผู้อื่นโดยไม่อ้างอิงแหล่งที่มา',
    ],
    correctAnswer: 2,
    explanation: 'การเคารพผู้อื่น ไม่บูลลี่ และใช้คำสุภาพเป็นหัวใจของมารยาทดิจิทัล',
  },
  {
    id: 'std_p6_01',
    platform: 'ว 4.2',
    grade: 'ป.6',
    difficulty: 'hard',
    indicator: 'ว 4.2 ป.6/2',
    question: 'โปรแกรมวนลูป while count < 5: แต่ในลูปไม่มีคำสั่งเพิ่มค่า count ผลลัพธ์จะเป็นอย่างไร?',
    options: [
      'โปรแกรมหยุดทำงานทันที',
      'เกิด Infinite Loop (ลูปวนไม่รู้จบ) เพราะ count จะเป็น 0 ตลอดไป',
      'โปรแกรมทำงาน 5 รอบแล้วจบลง',
      'ตัวแปร count จะลบค่าตัวเองอัตโนมัติ',
    ],
    correctAnswer: 1,
    explanation: 'หากไม่มีการเปลี่ยนค่าตัวแปรเงื่อนไข เงื่อนไขจะเป็นจริงตลอดกาล เกิดบั๊ก Infinite Loop',
  },
  {
    id: 'std_p6_02',
    platform: 'ว 4.2',
    grade: 'ป.6',
    difficulty: 'hard',
    indicator: 'ว 4.2 ป.6/3',
    question: 'วิธีใดช่วยตรวจสอบภาพถ่ายว่าสร้างจาก AI Deepfake หรือไม่ได้อย่างน่าเชื่อถือที่สุด?',
    options: [
      'เชื่อทันทีหากส่งต่อมาจากกลุ่มไลน์ครอบครัว',
      'สังเกตความผิดปกติของรอยต่อแสงสะท้อนในตา จำนวนนิ้วมือ และค้นหาภาพต้นฉบับย้อนกลับ (Reverse Image Search)',
      'ดูว่ามีคนกดไลก์เยอะหรือไม่',
      'ตรวจสอบแค่ความละเอียดของไฟล์ภาพ',
    ],
    correctAnswer: 1,
    explanation: 'AI ปัจจุบันมักมีจุดบกพร่องเรื่องการสะท้อนแสง รอยต่อผิวหนัง และสามารถตรวจสอบได้ด้วย Reverse Search',
  },
];

function battleIndicatorFor(item: BattleQuestionItem): string {
  const diffLabel = DIFFICULTY_META[item.difficulty].label;
  if (item.platform === 'Scratch') {
    if (item.difficulty === 'easy') return `Scratch · ว 4.2 ป.4/2 (${diffLabel})`;
    if (item.difficulty === 'medium') return `Scratch · ว 4.2 ป.5/2 (${diffLabel})`;
    return `Scratch · ว 4.2 ป.6/2 (${diffLabel})`;
  }
  if (item.difficulty === 'easy') return `Micro:bit · ว 4.2 ป.4/2 (${diffLabel})`;
  if (item.difficulty === 'medium') return `Micro:bit · ว 4.2 ป.5/2 (${diffLabel})`;
  return `Micro:bit · ว 4.2 ป.6/2 (${diffLabel})`;
}

function mapBattleToSmartExam(item: BattleQuestionItem): SmartExamQuestion {
  return {
    id: item.id,
    platform: item.platform,
    difficulty: item.difficulty,
    indicator: battleIndicatorFor(item),
    question: item.title,
    codeSnippet: item.codeSnippet,
    options: [...item.options] as [string, string, string, string],
    correctAnswer: item.correctIndex,
    explanation: item.explanation,
  };
}

function shuffleSmartExamOptions(
  q: SmartExamQuestion,
  rng: () => number
): SmartExamQuestion {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctAnswer,
  }));
  const shuffled = shuffleArray(indexed, rng);
  const newCorrect = shuffled.findIndex((i) => i.isCorrect) as 0 | 1 | 2 | 3;
  return {
    ...q,
    options: [
      shuffled[0].text,
      shuffled[1].text,
      shuffled[2].text,
      shuffled[3].text,
    ],
    correctAnswer: newCorrect,
  };
}

export function getDifficultyPoolBreakdown(options: {
  source: SmartExamSource;
  grade: SmartExamGrade;
  battleBank?: BattleQuestionItem[];
}): Record<BattleDifficultyFilter, number> {
  const bank = options.battleBank ?? BUILTIN_BATTLE_QUESTIONS;
  if (options.source === 'standard') {
    const gradeFiltered = STANDARD_CURRICULUM_QUESTIONS.filter(
      (q) => options.grade === 'ทั้งหมด' || q.grade === options.grade
    );
    return {
      all: gradeFiltered.length,
      easy: gradeFiltered.filter((q) => q.difficulty === 'easy').length,
      medium: gradeFiltered.filter((q) => q.difficulty === 'medium').length,
      hard: gradeFiltered.filter((q) => q.difficulty === 'hard').length,
    };
  }
  const platformFiltered = filterBattleQuestions(bank, options.source, 'all');
  return {
    all: platformFiltered.length,
    easy: platformFiltered.filter((q) => q.difficulty === 'easy').length,
    medium: platformFiltered.filter((q) => q.difficulty === 'medium').length,
    hard: platformFiltered.filter((q) => q.difficulty === 'hard').length,
  };
}

export function getEligibleSmartExamPoolCount(options: {
  source: SmartExamSource;
  difficulty: BattleDifficultyFilter;
  grade: SmartExamGrade;
  battleBank?: BattleQuestionItem[];
}): number {
  const bank = options.battleBank ?? BUILTIN_BATTLE_QUESTIONS;
  if (options.source === 'standard') {
    return STANDARD_CURRICULUM_QUESTIONS.filter(
      (q) =>
        (options.grade === 'ทั้งหมด' || q.grade === options.grade) &&
        (options.difficulty === 'all' || q.difficulty === options.difficulty)
    ).length;
  }
  return filterBattleQuestions(bank, options.source, options.difficulty).length;
}

/**
 * Generates a randomized exam set based on source (Scratch / Micro:bit / mixed / standard),
 * difficulty/grade filter, and the requested `questionCount`.
 */
export function generateSmartExamSet(options: {
  source: SmartExamSource;
  difficulty: BattleDifficultyFilter;
  grade: SmartExamGrade;
  questionCount: number;
  shuffleOptions?: boolean;
  battleBank?: BattleQuestionItem[];
  rng?: () => number;
}): SmartExamQuestion[] {
  const rng = options.rng ?? Math.random;
  const bank = options.battleBank ?? BUILTIN_BATTLE_QUESTIONS;
  const requestedCount = Math.max(1, Math.floor(options.questionCount || 1));

  if (options.source === 'standard') {
    const eligible = STANDARD_CURRICULUM_QUESTIONS.filter(
      (q) =>
        (options.grade === 'ทั้งหมด' || q.grade === options.grade) &&
        (options.difficulty === 'all' || q.difficulty === options.difficulty)
    );
    const picked = shuffleArray(eligible, rng).slice(
      0,
      Math.min(requestedCount, eligible.length)
    );
    if (options.shuffleOptions !== false) {
      return picked.map((q) => shuffleSmartExamOptions(q, rng));
    }
    return picked;
  }

  const drawn = selectRandomBattleQuestions(bank, {
    platform: options.source,
    difficulty: options.difficulty,
    count: requestedCount,
    shuffleOptions: options.shuffleOptions !== false,
    rng,
  });

  return drawn.map(mapBattleToSmartExam);
}

/**
 * Formats option text with Thai prefix (ก., ข., ค., ง.) without duplicating existing prefixes.
 */
export function formatThaiChoiceOption(text: string, index: number): string {
  const prefix = THAI_CHOICE_LABELS[index] ?? `${index + 1}.`;
  const trimmed = text.trim();
  if (/^[กขคง]\.\s*/.test(trimmed)) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
}

export type TimerUrgencyLevel = 'normal' | 'warning' | 'critical';

/**
 * Computes total exam duration in seconds from either 'auto' (1 min/question, min 3 min)
 * or an explicit minute value clamped to [1, 90].
 */
export function computeExamDurationSeconds(
  questionCount: number,
  durationMode: 'auto' | number
): number {
  if (durationMode === 'auto') {
    const safeCount = Math.max(1, Math.floor(questionCount || 1));
    return Math.max(180, safeCount * 60);
  }
  const mins = Math.max(1, Math.min(90, Math.floor(durationMode || 1)));
  return mins * 60;
}

/**
 * Formats remaining seconds as MM:SS (or H:MM:SS when >= 3600s).
 */
export function formatCountdownClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hours > 0) {
    return `${hours}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Determines visual urgency zone for the countdown timer.
 */
export function getTimerUrgencyLevel(
  timeLeftSeconds: number,
  totalDurationSeconds: number
): TimerUrgencyLevel {
  const safeTotal = Math.max(1, totalDurationSeconds);
  const ratio = Math.max(0, timeLeftSeconds) / safeTotal;
  if (timeLeftSeconds <= 60 || ratio <= 0.2) {
    return 'critical';
  }
  if (timeLeftSeconds <= 180 || ratio <= 0.45) {
    return 'warning';
  }
  return 'normal';
}

