export interface ScoreboardParticipantLike {
  userId: string;
  displayName: string;
  score: number;
  streak: number;
  updatedAtMs?: number;
}

/**
 * Returns a new array of live classroom participants sorted strictly from
 * highest score to lowest score (มากไปน้อย).
 * Tie-breakers: higher streak first, earlier timestamp (faster answer) first,
 * then alphabetical Thai displayName.
 */
export function sortParticipantsByScoreDesc<T extends ScoreboardParticipantLike>(
  participants: readonly T[]
): T[] {
  return [...participants].sort((a, b) => {
    const scoreA = Number.isFinite(Number(a.score)) ? Number(a.score) : 0;
    const scoreB = Number.isFinite(Number(b.score)) ? Number(b.score) : 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const streakA = Number.isFinite(Number(a.streak)) ? Number(a.streak) : 0;
    const streakB = Number.isFinite(Number(b.streak)) ? Number(b.streak) : 0;
    if (streakB !== streakA) {
      return streakB - streakA;
    }

    const timeA = typeof a.updatedAtMs === 'number' ? a.updatedAtMs : Number.MAX_SAFE_INTEGER;
    const timeB = typeof b.updatedAtMs === 'number' ? b.updatedAtMs : Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.displayName.localeCompare(b.displayName, 'th');
  });
}
