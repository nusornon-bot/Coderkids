import { describe, it, expect } from 'vitest';
import {
  computeExamDurationSeconds,
  formatCountdownClock,
  formatThaiChoiceOption,
  generateSmartExamSet,
  getDifficultyPoolBreakdown,
  getEligibleSmartExamPoolCount,
  getTimerUrgencyLevel,
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

  it('supports difficulty filtering and breakdown counts across both battle and standard libraries', () => {
    const mixedBreakdown = getDifficultyPoolBreakdown({ source: 'mixed', grade: 'ทั้งหมด' });
    expect(mixedBreakdown).toEqual({ all: 144, easy: 48, medium: 48, hard: 48 });

    const scratchBreakdown = getDifficultyPoolBreakdown({ source: 'Scratch', grade: 'ทั้งหมด' });
    expect(scratchBreakdown).toEqual({ all: 72, easy: 24, medium: 24, hard: 24 });

    const stdBreakdown = getDifficultyPoolBreakdown({ source: 'standard', grade: 'ทั้งหมด' });
    expect(stdBreakdown).toEqual({ all: 8, easy: 3, medium: 3, hard: 2 });

    const stdHard = generateSmartExamSet({
      source: 'standard',
      difficulty: 'hard',
      grade: 'ทั้งหมด',
      questionCount: 10,
      rng: () => 0.2,
    });
    expect(stdHard).toHaveLength(2);
    expect(stdHard.every((q) => q.difficulty === 'hard')).toBe(true);
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

  it('computes exam countdown durations, formats clocks, and classifies urgency accurately', () => {
    expect(computeExamDurationSeconds(10, 'auto')).toBe(600);
    expect(computeExamDurationSeconds(2, 'auto')).toBe(180); // min 3 minutes
    expect(computeExamDurationSeconds(10, 15)).toBe(900);
    expect(computeExamDurationSeconds(10, 120)).toBe(5400); // clamped to 90 min

    expect(formatCountdownClock(0)).toBe('00:00');
    expect(formatCountdownClock(65)).toBe('01:05');
    expect(formatCountdownClock(600)).toBe('10:00');
    expect(formatCountdownClock(3665)).toBe('1:01:05');

    expect(getTimerUrgencyLevel(500, 600)).toBe('normal');
    expect(getTimerUrgencyLevel(200, 600)).toBe('warning');
    expect(getTimerUrgencyLevel(45, 600)).toBe('critical');
  });
});
