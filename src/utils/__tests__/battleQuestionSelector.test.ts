import { describe, it, expect } from 'vitest';
import { BUILTIN_BATTLE_QUESTIONS } from '../../data/battleQuestionBank';
import {
  filterBattleQuestions,
  getBankBreakdownCounts,
  selectRandomBattleQuestions,
  shuffleQuestionOptions,
} from '../battleQuestionSelector';

describe('battleQuestionBank & battleQuestionSelector', () => {
  it('provides balanced Scratch and Micro:bit questions across easy, medium, and hard', () => {
    const counts = getBankBreakdownCounts(BUILTIN_BATTLE_QUESTIONS);
    expect(counts.byPlatform.Scratch).toBeGreaterThanOrEqual(18);
    expect(counts.byPlatform['Micro:bit']).toBeGreaterThanOrEqual(18);
    expect(counts.byPlatformDifficulty.Scratch.easy).toBeGreaterThanOrEqual(6);
    expect(counts.byPlatformDifficulty.Scratch.medium).toBeGreaterThanOrEqual(6);
    expect(counts.byPlatformDifficulty.Scratch.hard).toBeGreaterThanOrEqual(6);
    expect(counts.byPlatformDifficulty['Micro:bit'].easy).toBeGreaterThanOrEqual(6);
    expect(counts.byPlatformDifficulty['Micro:bit'].medium).toBeGreaterThanOrEqual(6);
    expect(counts.byPlatformDifficulty['Micro:bit'].hard).toBeGreaterThanOrEqual(6);
  });

  it('filters accurately by platform and difficulty', () => {
    const scratchHard = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Scratch', 'hard');
    expect(scratchHard.length).toBeGreaterThanOrEqual(6);
    expect(scratchHard.every((q) => q.platform === 'Scratch' && q.difficulty === 'hard')).toBe(true);

    const microbitEasy = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Micro:bit', 'easy');
    expect(microbitEasy.length).toBeGreaterThanOrEqual(6);
    expect(microbitEasy.every((q) => q.platform === 'Micro:bit' && q.difficulty === 'easy')).toBe(true);
  });

  it('draws exact requested count and balances Scratch and Micro:bit in mixed mode', () => {
    const drawn = selectRandomBattleQuestions(BUILTIN_BATTLE_QUESTIONS, {
      platform: 'mixed',
      difficulty: 'all',
      count: 10,
      rng: () => 0.42,
    });
    expect(drawn).toHaveLength(10);
    const uniqueIds = new Set(drawn.map((q) => q.id));
    expect(uniqueIds.size).toBe(10);

    const scratchCount = drawn.filter((q) => q.platform === 'Scratch').length;
    const microbitCount = drawn.filter((q) => q.platform === 'Micro:bit').length;
    expect(scratchCount).toBe(5);
    expect(microbitCount).toBe(5);
  });

  it('clamps requested count to available bank size without duplicating questions', () => {
    const drawn = selectRandomBattleQuestions(BUILTIN_BATTLE_QUESTIONS, {
      platform: 'Scratch',
      difficulty: 'easy',
      count: 99,
    });
    const available = filterBattleQuestions(BUILTIN_BATTLE_QUESTIONS, 'Scratch', 'easy').length;
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
