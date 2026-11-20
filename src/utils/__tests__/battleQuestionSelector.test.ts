import { describe, it, expect } from 'vitest';
import {
  BUILTIN_BATTLE_QUESTIONS,
  BattleDifficulty,
  BattlePlatform,
} from '../../data/battleQuestionBank';
import {
  filterBattleQuestions,
  getBankBreakdownCounts,
  selectRandomBattleQuestions,
  shuffleQuestionOptions,
} from '../battleQuestionSelector';

describe('battleQuestionBank & battleQuestionSelector', () => {
  it('contains 144 questions (+300% from 36) evenly split across Scratch/Micro:bit and Easy/Medium/Hard', () => {
    const counts = getBankBreakdownCounts(BUILTIN_BATTLE_QUESTIONS);
    expect(counts.total).toBe(144);
    expect(counts.byPlatform.Scratch).toBe(72);
    expect(counts.byPlatform['Micro:bit']).toBe(72);

    expect(counts.byPlatformDifficulty.Scratch.easy).toBe(24);
    expect(counts.byPlatformDifficulty.Scratch.medium).toBe(24);
    expect(counts.byPlatformDifficulty.Scratch.hard).toBe(24);

    expect(counts.byPlatformDifficulty['Micro:bit'].easy).toBe(24);
    expect(counts.byPlatformDifficulty['Micro:bit'].medium).toBe(24);
    expect(counts.byPlatformDifficulty['Micro:bit'].hard).toBe(24);
  });

  it('distributes correct answers (A/B/C/D) equally globally, per platform, and per difficulty bucket', () => {
    const counts = getBankBreakdownCounts(BUILTIN_BATTLE_QUESTIONS);
    // Global: 144 / 4 = 36 each
    expect(counts.byCorrectIndex).toEqual([36, 36, 36, 36]);

    // Per platform (72 / 4 = 18 each) & per platform+difficulty bucket (24 / 4 = 6 each)
    const platforms: BattlePlatform[] = ['Scratch', 'Micro:bit'];
    const difficulties: BattleDifficulty[] = ['easy', 'medium', 'hard'];

    for (const platform of platforms) {
      const platQs = BUILTIN_BATTLE_QUESTIONS.filter((q) => q.platform === platform);
      const platDist = getBankBreakdownCounts(platQs).byCorrectIndex;
      expect(platDist).toEqual([18, 18, 18, 18]);

      for (const difficulty of difficulties) {
        const bucket = platQs.filter((q) => q.difficulty === difficulty);
        const bucketDist = getBankBreakdownCounts(bucket).byCorrectIndex;
        expect(bucketDist).toEqual([6, 6, 6, 6]);
      }
    }
  });

  it('ensures every built-in question has unique id/title, 4 distinct non-empty options, and explanation', () => {
    const ids = new Set<string>();
    const titles = new Set<string>();

    for (const q of BUILTIN_BATTLE_QUESTIONS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);

      expect(titles.has(q.title)).toBe(false);
      titles.add(q.title);

      expect(q.options).toHaveLength(4);
      const trimmedOptions = q.options.map((o) => o.trim());
      expect(trimmedOptions.every((o) => o.length > 0)).toBe(true);
      expect(new Set(trimmedOptions).size).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.correctIndex);
      expect(q.explanation.trim().length).toBeGreaterThan(10);
    }
  });

  it('filters accurately by platform and difficulty', () => {
    const scratchHard = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Scratch', 'hard');
    expect(scratchHard).toHaveLength(24);
    expect(scratchHard.every((q) => q.platform === 'Scratch' && q.difficulty === 'hard')).toBe(true);

    const microbitEasy = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Micro:bit', 'easy');
    expect(microbitEasy).toHaveLength(24);
    expect(microbitEasy.every((q) => q.platform === 'Micro:bit' && q.difficulty === 'easy')).toBe(true);
  });

  it('draws exact requested count and balances Scratch and Micro:bit in mixed mode', () => {
    const drawn = selectRandomBattleQuestions(BUILTIN_BATTLE_QUESTIONS, {
      platform: 'mixed',
      difficulty: 'all',
      count: 20,
      rng: () => 0.42,
    });
    expect(drawn).toHaveLength(20);
    const uniqueIds = new Set(drawn.map((q) => q.id));
    expect(uniqueIds.size).toBe(20);

    const scratchCount = drawn.filter((q) => q.platform === 'Scratch').length;
    const microbitCount = drawn.filter((q) => q.platform === 'Micro:bit').length;
    expect(scratchCount).toBe(10);
    expect(microbitCount).toBe(10);
  });

  it('clamps requested count to available bank size without duplicating questions', () => {
    const drawn = selectRandomBattleQuestions(BUILTIN_BATTLE_QUESTIONS, {
      platform: 'Scratch',
      difficulty: 'easy',
      count: 99,
    });
    const available = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Scratch', 'easy').length;
    expect(available).toBe(24);
    expect(drawn).toHaveLength(available);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(available);
  });

  it('shuffles answer options while preserving the exact correct answer text', () => {
    const sample = BUILTIN_BATTLE_QUESTIONS[0];
    const originalCorrectText = sample.options[sample.correctIndex];
    const shuffled = shuffleQuestionOptions(sample, () => 0.25);
    expect(shuffled.options).toHaveLength(4);
    expect(shuffled.options[shuffled.correctIndex]).toBe(originalCorrectText);
  });
});
