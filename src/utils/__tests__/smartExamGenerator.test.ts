import { describe, it, expect } from 'vitest';
import {
  formatThaiChoiceOption,
  generateSmartExamSet,
  getEligibleSmartExamPoolCount,
} from '../smartExamGenerator';

describe('smartExamGenerator', () => {
  it('draws exact requested questionCount from Scratch bank and respects difficulty filter', () => {
    const exam = generateSmartExamSet({
      source: 'Scratch',
      difficulty: 'medium',
      grade: 'ทั้งหมด',
      questionCount: 12,
      rng: () => 0.37,
    });

    expect(exam).toHaveLength(12);
    expect(exam.every((q) => q.platform === 'Scratch' && q.difficulty === 'medium')).toBe(true);
    expect(new Set(exam.map((q) => q.id)).size).toBe(12);
  });

  it('draws exact requested questionCount from Micro:bit bank', () => {
    const exam = generateSmartExamSet({
      source: 'Micro:bit',
      difficulty: 'all',
      grade: 'ทั้งหมด',
      questionCount: 25,
      rng: () => 0.61,
    });

    expect(exam).toHaveLength(25);
    expect(exam.every((q) => q.platform === 'Micro:bit')).toBe(true);
    expect(new Set(exam.map((q) => q.id)).size).toBe(25);
  });

  it('balances Scratch and Micro:bit evenly in mixed mode for any requested questionCount', () => {
    const exam = generateSmartExamSet({
      source: 'mixed',
      difficulty: 'all',
      grade: 'ทั้งหมด',
      questionCount: 20,
      rng: () => 0.29,
    });

    expect(exam).toHaveLength(20);
    const scratchCount = exam.filter((q) => q.platform === 'Scratch').length;
    const microbitCount = exam.filter((q) => q.platform === 'Micro:bit').length;
    expect(scratchCount).toBe(10);
    expect(microbitCount).toBe(10);
  });

  it('clamps questionCount to available pool size without duplicates', () => {
    const poolSize = getEligibleSmartExamPoolCount({
      source: 'Scratch',
      difficulty: 'hard',
      grade: 'ทั้งหมด',
    });
    expect(poolSize).toBe(24);

    const exam = generateSmartExamSet({
      source: 'Scratch',
      difficulty: 'hard',
      grade: 'ทั้งหมด',
      questionCount: 99,
    });

    expect(exam).toHaveLength(24);
    expect(new Set(exam.map((q) => q.id)).size).toBe(24);
  });

  it('supports standard curriculum filter by grade and preserves correct answer after shuffling options', () => {
    const exam = generateSmartExamSet({
      source: 'standard',
      difficulty: 'all',
      grade: 'ป.4',
      questionCount: 10,
      shuffleOptions: true,
      rng: () => 0.15,
    });

    expect(exam).toHaveLength(3);
    expect(exam.every((q) => q.platform === 'ว 4.2' && q.grade === 'ป.4')).toBe(true);
    expect(exam.every((q) => q.options[q.correctAnswer].length > 0)).toBe(true);
  });

  it('formats Thai choice prefixes without duplicating existing prefixes', () => {
    expect(formatThaiChoiceOption('สี่เหลี่ยมจัตุรัส', 1)).toBe('ข. สี่เหลี่ยมจัตุรัส');
    expect(formatThaiChoiceOption('ค. วงกลม', 2)).toBe('ค. วงกลม');
  });
});
