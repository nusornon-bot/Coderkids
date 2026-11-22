import { describe, expect, it } from 'vitest';
import { computeOverallModuleProgressSummary } from '../moduleProgressSummary.ts';

describe('moduleProgressSummary', () => {
  it('computes 0% and recommends Module 01 when no modules are completed', () => {
    const summary = computeOverallModuleProgressSummary({
      safety: false,
      thinking: false,
      codingLab: false,
      showcase: false,
    });

    expect(summary.completedCount).toBe(0);
    expect(summary.totalCount).toBe(4);
    expect(summary.progressPercent).toBe(0);
    expect(summary.isAllCompleted).toBe(false);
    expect(summary.nextModuleKey).toBe('safety');
    expect(summary.modules.map((m) => m.isNextUp)).toEqual([true, false, false, false]);
  });

  it('computes intermediate percentages (25%, 50%, 75%) and highlights the first incomplete module', () => {
    const oneDone = computeOverallModuleProgressSummary({
      safety: true,
      thinking: false,
      codingLab: false,
      showcase: false,
    });
    expect(oneDone.completedCount).toBe(1);
    expect(oneDone.progressPercent).toBe(25);
    expect(oneDone.nextModuleKey).toBe('thinking');
    expect(oneDone.modules.map((m) => m.isNextUp)).toEqual([false, true, false, false]);

    const twoDone = computeOverallModuleProgressSummary({
      safety: true,
      thinking: true,
      codingLab: false,
      showcase: false,
    });
    expect(twoDone.completedCount).toBe(2);
    expect(twoDone.progressPercent).toBe(50);
    expect(twoDone.nextModuleKey).toBe('codingLab');

    const threeDoneNonSequential = computeOverallModuleProgressSummary({
      safety: true,
      thinking: false,
      codingLab: true,
      showcase: true,
    });
    expect(threeDoneNonSequential.completedCount).toBe(3);
    expect(threeDoneNonSequential.progressPercent).toBe(75);
    expect(threeDoneNonSequential.nextModuleKey).toBe('thinking');
    expect(threeDoneNonSequential.modules.map((m) => m.done)).toEqual([true, false, true, true]);
  });

  it('computes 100% and sets isAllCompleted when all 4 modules are completed', () => {
    const allDone = computeOverallModuleProgressSummary({
      safety: true,
      thinking: true,
      codingLab: true,
      showcase: true,
    });

    expect(allDone.completedCount).toBe(4);
    expect(allDone.progressPercent).toBe(100);
    expect(allDone.isAllCompleted).toBe(true);
    expect(allDone.nextModuleKey).toBeNull();
    expect(allDone.modules.every((m) => m.done && !m.isNextUp)).toBe(true);
  });
});
