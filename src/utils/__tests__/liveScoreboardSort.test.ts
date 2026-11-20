import { describe, expect, it } from 'vitest';
import { sortParticipantsByScoreDesc } from '../liveScoreboardSort.ts';

describe('sortParticipantsByScoreDesc', () => {
  it('sorts participants strictly from highest score to lowest score without mutating input', () => {
    const input = [
      { userId: 'u1', displayName: 'นักเรียน A', score: 250, streak: 1, updatedAtMs: 1000 },
      { userId: 'u2', displayName: 'นักเรียน B', score: 980, streak: 3, updatedAtMs: 1500 },
      { userId: 'u3', displayName: 'นักเรียน C', score: 0, streak: 0, updatedAtMs: 900 },
      { userId: 'u4', displayName: 'นักเรียน D', score: 620, streak: 2, updatedAtMs: 1200 },
    ];

    const sorted = sortParticipantsByScoreDesc(input);

    expect(sorted.map((p) => p.score)).toEqual([980, 620, 250, 0]);
    expect(sorted.map((p) => p.userId)).toEqual(['u2', 'u4', 'u1', 'u3']);
    // Original array stays unmutated
    expect(input.map((p) => p.userId)).toEqual(['u1', 'u2', 'u3', 'u4']);
  });

  it('breaks equal-score ties by higher streak, then faster timestamp, then Thai name', () => {
    const input = [
      { userId: 'u1', displayName: 'ขุนแผน', score: 500, streak: 2, updatedAtMs: 2000 },
      { userId: 'u2', displayName: 'กานดา', score: 500, streak: 3, updatedAtMs: 2500 },
      { userId: 'u3', displayName: 'ณัฐพล', score: 500, streak: 2, updatedAtMs: 1500 },
      { userId: 'u4', displayName: 'กิตติ', score: 500, streak: 2, updatedAtMs: 2000 },
    ];

    const sorted = sortParticipantsByScoreDesc(input);
    expect(sorted.map((p) => p.userId)).toEqual(['u2', 'u3', 'u4', 'u1']);
  });
});
