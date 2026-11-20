import { describe, expect, it } from 'vitest';
import {
  BUILTIN_ONET_BATTLE_QUESTIONS,
  filterOnetBattleQuestions,
  getOnetBankBreakdownCounts,
  selectRandomOnetBattleQuestions,
  shuffleOnetQuestionOptions,
} from '../onetBattleSelector';

describe('onetBattleSelector', () => {
  it('loads all 100 built-in O-NET questions with unique IDs and 4 valid options', () => {
    expect(BUILTIN_ONET_BATTLE_QUESTIONS.length).toBe(100);

    const idSet = new Set(BUILTIN_ONET_BATTLE_QUESTIONS.map((q) => q.id));
    expect(idSet.size).toBe(100);

    for (const q of BUILTIN_ONET_BATTLE_QUESTIONS) {
      expect(q.id.startsWith('onet_set')).toBe(true);
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('filters accurately by O-NET set, category, must-know flag, and difficulty', () => {
    const set1 = filterOnetBattleQuestions(BUILTIN_ONET_BATTLE_QUESTIONS, {
      setFilter: 'set1',
      categoryFilter: 'all',
      difficultyFilter: 'all',
    });
    expect(set1).toHaveLength(10);
    expect(set1.every((q) => q.setId === 'set1' && q.difficulty === 'easy')).toBe(true);

    const mustKnow = filterOnetBattleQuestions(BUILTIN_ONET_BATTLE_QUESTIONS, {
      setFilter: 'all',
      categoryFilter: 'must_know',
      difficultyFilter: 'all',
    });
    expect(mustKnow.length).toBeGreaterThan(0);
    expect(mustKnow.every((q) => q.isMustKnow)).toBe(true);

    const safetyOnly = filterOnetBattleQuestions(BUILTIN_ONET_BATTLE_QUESTIONS, {
      setFilter: 'all',
      categoryFilter: 'safety',
      difficultyFilter: 'all',
    });
    expect(safetyOnly.length).toBeGreaterThan(0);
    expect(safetyOnly.every((q) => q.category === 'safety')).toBe(true);
  });

  it('selects random non-duplicate questions spread across diverse O-NET sets', () => {
    const drawn = selectRandomOnetBattleQuestions(BUILTIN_ONET_BATTLE_QUESTIONS, {
      setFilter: 'all',
      categoryFilter: 'all',
      difficultyFilter: 'all',
      count: 10,
      shuffleOptions: true,
    });

    expect(drawn).toHaveLength(10);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(10);
    // Drawing 10 questions across 10 sets via round-robin yields 10 distinct sets
    expect(new Set(drawn.map((q) => q.setId)).size).toBe(10);
  });

  it('caps requested count to available filtered pool without failing', () => {
    const drawn = selectRandomOnetBattleQuestions(BUILTIN_ONET_BATTLE_QUESTIONS, {
      setFilter: 'set5',
      categoryFilter: 'all',
      difficultyFilter: 'all',
      count: 25,
    });
    expect(drawn).toHaveLength(10);
    expect(drawn.every((q) => q.setId === 'set5')).toBe(true);
  });

  it('preserves the exact correct answer text after shuffling options', () => {
    const sample = BUILTIN_ONET_BATTLE_QUESTIONS[0];
    const expectedText = sample.options[sample.correctIndex];

    let seed = 42;
    const deterministicRng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 15; i++) {
      const shuffled = shuffleOnetQuestionOptions(sample, deterministicRng);
      expect(shuffled.options).toHaveLength(4);
      expect(shuffled.options[shuffled.correctIndex]).toBe(expectedText);
    }
  });

  it('computes accurate breakdown counts across sets, categories, difficulties, and choices', () => {
    const breakdown = getOnetBankBreakdownCounts(BUILTIN_ONET_BATTLE_QUESTIONS);
    expect(breakdown.total).toBe(100);
    expect(breakdown.bySet.set1).toBe(10);
    expect(breakdown.bySet.set10).toBe(10);

    const diffSum =
      breakdown.byDifficulty.easy +
      breakdown.byDifficulty.medium +
      breakdown.byDifficulty.hard;
    expect(diffSum).toBe(100);

    const choiceSum = breakdown.byCorrectIndex.reduce((acc, n) => acc + n, 0);
    expect(choiceSum).toBe(100);
  });
});
