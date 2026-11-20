import {
  ExamQuestion,
  ExamSetMeta,
  ONET_EXAM_SETS,
} from '../components/ExamArenaModal.tsx';

export type OnetBattleDifficulty = 'easy' | 'medium' | 'hard';
export type OnetBattleDifficultyFilter = 'all' | OnetBattleDifficulty;
export type OnetBattleSetId = ExamSetMeta['id'];
export type OnetBattleSetFilter = 'all' | OnetBattleSetId;
export type OnetBattleCategory = ExamQuestion['category'];
export type OnetBattleCategoryFilter = 'all' | 'must_know' | OnetBattleCategory;

export interface OnetBattleQuestionItem {
  id: string;
  setId: OnetBattleSetId;
  setNumber: number;
  setTitle: string;
  category: OnetBattleCategory;
  categoryLabel: string;
  indicator: string;
  isMustKnow: boolean;
  questionFormat: 'single_choice' | 'complex_choice';
  blueprintTopic: string;
  difficulty: OnetBattleDifficulty;
  question: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  source: 'builtin' | 'local';
  createdByName?: string;
}

export const ONET_DIFFICULTY_META: Record<
  OnetBattleDifficulty,
  {
    label: string;
    shortLabel: string;
    emoji: string;
    timeSeconds: number;
    basePoints: number;
    badgeClass: string;
  }
> = {
  easy: {
    label: 'มาตรฐาน (ง่าย)',
    shortLabel: 'ง่าย',
    emoji: '🟢',
    timeSeconds: 25,
    basePoints: 100,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  medium: {
    label: 'เข้มข้น (ปานกลาง)',
    shortLabel: 'ปานกลาง',
    emoji: '🟡',
    timeSeconds: 30,
    basePoints: 140,
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  hard: {
    label: 'ท้าทาย O-NET (ยาก)',
    shortLabel: 'ยาก',
    emoji: '🔴',
    timeSeconds: 35,
    basePoints: 180,
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
};

export const ONET_CATEGORY_META: Record<
  OnetBattleCategory,
  {
    label: string;
    emoji: string;
    badgeClass: string;
  }
> = {
  thinking: {
    label: 'เหตุผลเชิงตรรกะ',
    emoji: '🧠',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  coding: {
    label: 'โค้ดดิ้ง & ผังงาน',
    emoji: '💻',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  data: {
    label: 'ข้อมูล & สารสนเทศ',
    emoji: '📊',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  debugging: {
    label: 'ตรวจสอบและแก้บั๊ก',
    emoji: '🐛',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  search: {
    label: 'การสืบค้น & ประเมินข้อมูล',
    emoji: '🔎',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  safety: {
    label: 'ความปลอดภัยไซเบอร์ & PDPA',
    emoji: '🛡️',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
};

export function mapExamSetDifficulty(
  setDifficulty: ExamSetMeta['difficulty']
): OnetBattleDifficulty {
  if (setDifficulty === 'มาตรฐาน (Standard)') return 'easy';
  if (setDifficulty === 'เข้มข้น (Intermediate)') return 'medium';
  return 'hard';
}

/**
 * Converts ONET_EXAM_SETS (10 sets × 10 questions = 100 questions) into normalized battle items
 * with guaranteed unique IDs (`onet_set1_1` .. `onet_set10_10`).
 */
export function buildBuiltinOnetBattleQuestions(
  sets: ExamSetMeta[] = ONET_EXAM_SETS
): OnetBattleQuestionItem[] {
  const result: OnetBattleQuestionItem[] = [];

  for (const examSet of sets) {
    const mappedDifficulty = mapExamSetDifficulty(examSet.difficulty);
    examSet.questions.forEach((q, idx) => {
      if (!Array.isArray(q.options) || q.options.length !== 4) return;
      const safeCorrect = (
        q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0
      ) as 0 | 1 | 2 | 3;

      result.push({
        id: `onet_${examSet.id}_${idx + 1}`,
        setId: examSet.id,
        setNumber: examSet.setNumber,
        setTitle: examSet.title,
        category: q.category,
        categoryLabel: q.categoryLabel || ONET_CATEGORY_META[q.category].label,
        indicator: q.indicator,
        isMustKnow: Boolean(q.isMustKnow),
        questionFormat: q.questionFormat,
        blueprintTopic: q.blueprintTopic,
        difficulty: mappedDifficulty,
        question: q.question,
        codeSnippet: q.codeSnippet,
        options: [q.options[0], q.options[1], q.options[2], q.options[3]],
        correctIndex: safeCorrect,
        explanation: q.explanation,
        source: 'builtin',
      });
    });
  }

  return result;
}

export const BUILTIN_ONET_BATTLE_QUESTIONS: OnetBattleQuestionItem[] =
  buildBuiltinOnetBattleQuestions(ONET_EXAM_SETS);

export function shuffleOnetArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles the 4 choices of an O-NET battle question while remapping correctIndex accurately.
 */
export function shuffleOnetQuestionOptions(
  q: OnetBattleQuestionItem,
  rng: () => number = Math.random
): OnetBattleQuestionItem {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  const shuffled = shuffleOnetArray(indexed, rng);
  const newCorrectIdx = shuffled.findIndex((item) => item.isCorrect) as 0 | 1 | 2 | 3;

  return {
    ...q,
    options: [shuffled[0].text, shuffled[1].text, shuffled[2].text, shuffled[3].text],
    correctIndex: newCorrectIdx,
  };
}

export interface OnetFilterParams {
  setFilter: OnetBattleSetFilter;
  categoryFilter: OnetBattleCategoryFilter;
  difficultyFilter: OnetBattleDifficultyFilter;
}

export function filterOnetBattleQuestions(
  bank: OnetBattleQuestionItem[],
  params: OnetFilterParams
): OnetBattleQuestionItem[] {
  return bank.filter((q) => {
    const matchesSet = params.setFilter === 'all' || q.setId === params.setFilter;
    const matchesCategory =
      params.categoryFilter === 'all' ||
      (params.categoryFilter === 'must_know'
        ? q.isMustKnow
        : q.category === params.categoryFilter);
    const matchesDifficulty =
      params.difficultyFilter === 'all' || q.difficulty === params.difficultyFilter;

    return matchesSet && matchesCategory && matchesDifficulty;
  });
}

/**
 * Randomly selects `count` questions from the O-NET battle bank.
 * When drawing across all sets, uses round-robin bucket sampling across sets so questions
 * cover diverse O-NET topics rather than clustering in a single set.
 */
export function selectRandomOnetBattleQuestions(
  bank: OnetBattleQuestionItem[],
  options: {
    setFilter: OnetBattleSetFilter;
    categoryFilter: OnetBattleCategoryFilter;
    difficultyFilter: OnetBattleDifficultyFilter;
    count: number;
    shuffleOptions?: boolean;
    rng?: () => number;
  }
): OnetBattleQuestionItem[] {
  const rng = options.rng || Math.random;
  const eligible = filterOnetBattleQuestions(bank, {
    setFilter: options.setFilter,
    categoryFilter: options.categoryFilter,
    difficultyFilter: options.difficultyFilter,
  });

  if (eligible.length === 0) return [];

  const targetCount = Math.max(1, Math.min(options.count, eligible.length));
  let picked: OnetBattleQuestionItem[] = [];

  if (options.setFilter === 'all') {
    const bucketsBySet = new Map<string, OnetBattleQuestionItem[]>();
    for (const item of eligible) {
      const list = bucketsBySet.get(item.setId) || [];
      list.push(item);
      bucketsBySet.set(item.setId, list);
    }

    const shuffledBuckets = shuffleOnetArray(Array.from(bucketsBySet.values()), rng).map(
      (bucket) => shuffleOnetArray(bucket, rng)
    );

    let cursor = 0;
    while (picked.length < targetCount) {
      let addedInPass = false;
      for (const bucket of shuffledBuckets) {
        if (picked.length >= targetCount) break;
        if (cursor < bucket.length) {
          picked.push(bucket[cursor]);
          addedInPass = true;
        }
      }
      if (!addedInPass) break;
      cursor += 1;
    }

    picked = shuffleOnetArray(picked, rng);
  } else {
    picked = shuffleOnetArray(eligible, rng).slice(0, targetCount);
  }

  if (options.shuffleOptions !== false) {
    return picked.map((q) => shuffleOnetQuestionOptions(q, rng));
  }

  return picked;
}

export interface OnetBankBreakdown {
  total: number;
  mustKnowCount: number;
  bySet: Record<string, number>;
  byCategory: Record<OnetBattleCategory, number>;
  byDifficulty: Record<OnetBattleDifficulty, number>;
  byCorrectIndex: [number, number, number, number];
}

export function getOnetBankBreakdownCounts(
  bank: OnetBattleQuestionItem[]
): OnetBankBreakdown {
  const result: OnetBankBreakdown = {
    total: bank.length,
    mustKnowCount: 0,
    bySet: {},
    byCategory: {
      thinking: 0,
      coding: 0,
      data: 0,
      debugging: 0,
      search: 0,
      safety: 0,
    },
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    byCorrectIndex: [0, 0, 0, 0],
  };

  for (const q of bank) {
    if (q.isMustKnow) result.mustKnowCount += 1;
    result.bySet[q.setId] = (result.bySet[q.setId] || 0) + 1;
    result.byCategory[q.category] = (result.byCategory[q.category] || 0) + 1;
    result.byDifficulty[q.difficulty] += 1;
    if (q.correctIndex >= 0 && q.correctIndex <= 3) {
      result.byCorrectIndex[q.correctIndex] += 1;
    }
  }

  return result;
}
