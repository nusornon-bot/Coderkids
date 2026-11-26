import { describe, expect, it } from 'vitest';
import { BUILTIN_BATTLE_QUESTIONS } from '../battleQuestionBank';
import { BUILTIN_ONET_BATTLE_QUESTIONS } from '../../utils/onetBattleSelector';

function countCodePoints(text: string): number {
  return [...text.trim()].length;
}

describe('Coding Battle Question Bank Quality (144 ข้อ)', () => {
  it('has 144 unique questions with 4 unique non-empty options each', () => {
    expect(BUILTIN_BATTLE_QUESTIONS).toHaveLength(144);
    const ids = new Set<string>();

    for (const q of BUILTIN_BATTLE_QUESTIONS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);

      const trimmed = q.options.map((opt) => opt.trim());
      for (const opt of trimmed) {
        expect(opt.length).toBeGreaterThan(0);
      }
      expect(new Set(trimmed).size).toBe(4);
    }
  });

  it('distributes correct answers evenly across A/B/C/D globally and in every platform × difficulty group', () => {
    const globalCounts = [0, 0, 0, 0];
    const bucketCounts: Record<string, number[]> = {};

    for (const q of BUILTIN_BATTLE_QUESTIONS) {
      globalCounts[q.correctIndex] += 1;
      const key = `${q.platform}:${q.difficulty}`;
      if (!bucketCounts[key]) {
        bucketCounts[key] = [0, 0, 0, 0];
      }
      bucketCounts[key][q.correctIndex] += 1;
    }

    expect(globalCounts).toEqual([36, 36, 36, 36]);
    expect(Object.keys(bucketCounts).sort()).toEqual([
      'Micro:bit:easy',
      'Micro:bit:hard',
      'Micro:bit:medium',
      'Scratch:easy',
      'Scratch:hard',
      'Scratch:medium',
    ]);

    for (const counts of Object.values(bucketCounts)) {
      expect(counts).toEqual([6, 6, 6, 6]);
    }
  });

  it('avoids long consecutive streaks of the same correct option', () => {
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < BUILTIN_BATTLE_QUESTIONS.length; i += 1) {
      if (BUILTIN_BATTLE_QUESTIONS[i].correctIndex === BUILTIN_BATTLE_QUESTIONS[i - 1].correctIndex) {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    expect(maxStreak).toBeLessThanOrEqual(2);
  });

  it('keeps option lengths balanced on every question and eliminates longest-answer bias', () => {
    let strictLongestCorrectCount = 0;

    for (const q of BUILTIN_BATTLE_QUESTIONS) {
      const lengths = q.options.map(countCodePoints);
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      const ratio = maxLen / Math.max(1, minLen);
      const diff = maxLen - minLen;

      // Either within 1.30x length ratio or within 6 characters for very short code/numeric choices
      expect(
        ratio <= 1.3 || diff <= 6,
        `${q.id} has unbalanced option lengths: ${JSON.stringify(lengths)} (ratio=${ratio.toFixed(2)}, diff=${diff})`
      ).toBe(true);

      const correctLen = lengths[q.correctIndex];
      const longestDistractor = Math.max(
        ...lengths.filter((_, idx) => idx !== q.correctIndex)
      );
      if (correctLen > longestDistractor) {
        strictLongestCorrectCount += 1;
      }
    }

    // Should stay close to random chance (~25% = 36/144), never an 80%+ giveaway
    expect(strictLongestCorrectCount).toBeLessThanOrEqual(42);
  });
});

describe('O-NET Battle Question Bank Quality (200 ข้อ)', () => {
  it('distributes correct answers evenly across A/B/C/D (50 each) with balanced option lengths', () => {
    expect(BUILTIN_ONET_BATTLE_QUESTIONS).toHaveLength(200);
    const counts = [0, 0, 0, 0];
    let strictLongestCorrectCount = 0;

    for (const q of BUILTIN_ONET_BATTLE_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      counts[q.correctIndex] += 1;

      const lengths = q.options.map(countCodePoints);
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      const ratio = maxLen / Math.max(1, minLen);
      const diff = maxLen - minLen;

      expect(
        ratio <= 1.3 || diff <= 6,
        `${q.id} has unbalanced option lengths: ${JSON.stringify(lengths)} (ratio=${ratio.toFixed(2)}, diff=${diff})`
      ).toBe(true);

      const correctLen = lengths[q.correctIndex];
      const longestDistractor = Math.max(
        ...lengths.filter((_, idx) => idx !== q.correctIndex)
      );
      if (correctLen > longestDistractor) {
        strictLongestCorrectCount += 1;
      }
    }

    expect(counts).toEqual([50, 50, 50, 50]);
    expect(strictLongestCorrectCount).toBeLessThanOrEqual(70);
  });
});

describe('O-NET Exam Sets 11–20 (Must-Know Indicators & Scenario Synthesis)', () => {
  const extraQuestions = BUILTIN_ONET_BATTLE_QUESTIONS.filter(
    (q) => q.setNumber >= 11 && q.setNumber <= 20
  );

  it('contains 100 unique questions across sets 11–20 focused strictly on Must-Know indicators ว 4.2 ป.4/1, ป.6/1, ป.6/4', () => {
    expect(extraQuestions).toHaveLength(100);
    const allowedIndicators = new Set(['ว 4.2 ป.4/1', 'ว 4.2 ป.6/1', 'ว 4.2 ป.6/4']);
    const setCounts: Record<string, number> = {};

    for (const q of extraQuestions) {
      expect(allowedIndicators.has(q.indicator)).toBe(true);
      expect(q.isMustKnow).toBe(true);
      setCounts[q.setId] = (setCounts[q.setId] || 0) + 1;
    }

    for (let s = 11; s <= 20; s += 1) {
      expect(setCounts[`set${s}`]).toBe(10);
    }
  });

  it('balances correct answers [25, 25, 25, 25] globally, >= 2 per choice per set, and avoids streaks > 2', () => {
    const globalCounts = [0, 0, 0, 0];
    const perSetCounts: Record<string, [number, number, number, number]> = {};
    let maxStreak = 1;
    let currentStreak = 1;

    extraQuestions.forEach((q, idx) => {
      globalCounts[q.correctIndex] += 1;
      if (!perSetCounts[q.setId]) {
        perSetCounts[q.setId] = [0, 0, 0, 0];
      }
      perSetCounts[q.setId][q.correctIndex] += 1;

      if (idx > 0 && extraQuestions[idx - 1].correctIndex === q.correctIndex) {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    });

    expect(globalCounts).toEqual([25, 25, 25, 25]);
    expect(maxStreak).toBeLessThanOrEqual(2);
    for (const counts of Object.values(perSetCounts)) {
      for (const c of counts) {
        expect(c).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

