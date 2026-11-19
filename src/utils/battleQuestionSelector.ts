import {
  BattleDifficulty,
  BattleDifficultyFilter,
  BattlePlatform,
  BattleQuestionItem,
  BattleSetFilter,
} from '../data/battleQuestionBank';

/**
 * Unbiased Fisher-Yates shuffle returning a new array copy.
 */
export function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles the 4 answer options of a question while remapping correctIndex accurately.
 */
export function shuffleQuestionOptions(
  q: BattleQuestionItem,
  rng: () => number = Math.random
): BattleQuestionItem {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  const shuffled = shuffleArray(indexed, rng);
  const newCorrectIdx = shuffled.findIndex((item) => item.isCorrect) as 0 | 1 | 2 | 3;

  return {
    ...q,
    options: [
      shuffled[0].text,
      shuffled[1].text,
      shuffled[2].text,
      shuffled[3].text,
    ],
    correctIndex: newCorrectIdx,
  };
}

/**
 * Filters question bank by platform (Scratch / Micro:bit / mixed) and difficulty.
 */
export function filterBattleQuestions(
  bank: BattleQuestionItem[],
  platformFilter: BattleSetFilter,
  difficultyFilter: BattleDifficultyFilter
): BattleQuestionItem[] {
  return bank.filter((q) => {
    const matchesPlatform = platformFilter === 'mixed' || q.platform === platformFilter;
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesPlatform && matchesDifficulty;
  });
}

/**
 * Randomly selects `requestedCount` questions from the bank matching teacher's filters.
 * In 'mixed' mode, balances Scratch and Micro:bit fairly before shuffling the final sequence.
 */
export function selectRandomBattleQuestions(
  bank: BattleQuestionItem[],
  options: {
    platform: BattleSetFilter;
    difficulty: BattleDifficultyFilter;
    count: number;
    shuffleOptions?: boolean;
    rng?: () => number;
  }
): BattleQuestionItem[] {
  const rng = options.rng || Math.random;
  const eligible = filterBattleQuestions(bank, options.platform, options.difficulty);
  if (eligible.length === 0) return [];

  const targetCount = Math.max(1, Math.min(options.count, eligible.length));
  let picked: BattleQuestionItem[] = [];

  if (options.platform === 'mixed') {
    const scratchPool = shuffleArray(
      eligible.filter((q) => q.platform === 'Scratch'),
      rng
    );
    const microbitPool = shuffleArray(
      eligible.filter((q) => q.platform === 'Micro:bit'),
      rng
    );

    const half = Math.floor(targetCount / 2);
    const extraFirst = targetCount % 2 === 1 && rng() >= 0.5 ? 1 : 0;
    const desiredScratch = Math.min(scratchPool.length, half + extraFirst);
    const desiredMicrobit = Math.min(microbitPool.length, targetCount - desiredScratch);

    picked = [
      ...scratchPool.slice(0, desiredScratch),
      ...microbitPool.slice(0, desiredMicrobit),
    ];

    // Top up if one platform had fewer questions than desired
    if (picked.length < targetCount) {
      const usedIds = new Set(picked.map((q) => q.id));
      const remaining = shuffleArray(
        eligible.filter((q) => !usedIds.has(q.id)),
        rng
      );
      picked = [...picked, ...remaining.slice(0, targetCount - picked.length)];
    }

    picked = shuffleArray(picked, rng);
  } else {
    picked = shuffleArray(eligible, rng).slice(0, targetCount);
  }

  if (options.shuffleOptions !== false) {
    return picked.map((q) => shuffleQuestionOptions(q, rng));
  }
  return picked;
}

export interface BankBreakdown {
  total: number;
  byPlatform: Record<BattlePlatform, number>;
  byPlatformDifficulty: Record<BattlePlatform, Record<BattleDifficulty, number>>;
}

export function getBankBreakdownCounts(bank: BattleQuestionItem[]): BankBreakdown {
  const result: BankBreakdown = {
    total: bank.length,
    byPlatform: { Scratch: 0, 'Micro:bit': 0 },
    byPlatformDifficulty: {
      Scratch: { easy: 0, medium: 0, hard: 0 },
      'Micro:bit': { easy: 0, medium: 0, hard: 0 },
    },
  };

  for (const q of bank) {
    result.byPlatform[q.platform] += 1;
    result.byPlatformDifficulty[q.platform][q.difficulty] += 1;
  }

  return result;
}
