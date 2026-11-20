import type {
  LiveQuizParticipantRecord,
  LiveQuizRoomRecord,
  LiveRoomFinalWinner,
} from '../services/firestoreService.ts';
import { sortParticipantsByScoreDesc } from './liveScoreboardSort.ts';

export type BattleModeKind = 'coding' | 'onet';

export interface BattleClosedWinner extends LiveRoomFinalWinner {
  medalTitle: string;
  medalTier: 'gold' | 'silver' | 'bronze';
}

export interface BattleClosedRankedParticipant extends LiveQuizParticipantRecord {
  rank: number;
  xpReward: number;
}

export interface BattleClosedSummaryData {
  roomCode: string;
  battleMode: BattleModeKind;
  battleTitle: string;
  hostName: string;
  closedAtLabel: string;
  totalParticipants: number;
  topScore: number;
  averageScore: number;
  totalXpAwarded: number;
  topWinners: BattleClosedWinner[];
  allRanked: BattleClosedRankedParticipant[];
}

export const TOP_THREE_XP_REWARDS: Record<1 | 2 | 3, number> = {
  1: 150,
  2: 100,
  3: 60,
};

export const PARTICIPATION_XP_REWARD = 20;

const CLAIMED_REWARDS_STORAGE_KEY = 'coderkids_claimed_battle_close_xp_v1';

export function getXpRewardForRank(rank: number): number {
  if (rank === 1) return TOP_THREE_XP_REWARDS[1];
  if (rank === 2) return TOP_THREE_XP_REWARDS[2];
  if (rank === 3) return TOP_THREE_XP_REWARDS[3];
  return rank >= 4 ? PARTICIPATION_XP_REWARD : 0;
}

export function getMedalMetaForRank(rank: 1 | 2 | 3): {
  medalTitle: string;
  medalTier: 'gold' | 'silver' | 'bronze';
} {
  if (rank === 1) {
    return { medalTitle: 'แชมป์อันดับ 1', medalTier: 'gold' };
  }
  if (rank === 2) {
    return { medalTitle: 'รองชนะเลิศอันดับ 1', medalTier: 'silver' };
  }
  return { medalTitle: 'รองชนะเลิศอันดับ 2', medalTier: 'bronze' };
}

export function extractFinalTopWinners(
  participants: readonly LiveQuizParticipantRecord[]
): LiveRoomFinalWinner[] {
  const sorted = sortParticipantsByScoreDesc(participants);
  return sorted.slice(0, 3).map((participant, index) => {
    const rank = (index + 1) as 1 | 2 | 3;
    return {
      rank,
      userId: participant.userId,
      displayName: participant.displayName,
      avatar: participant.avatar || '⚡',
      score: Math.max(0, Math.round(participant.score || 0)),
      streak: Math.max(0, Math.round(participant.streak || 0)),
      xpReward: getXpRewardForRank(rank),
    };
  });
}

function formatClosedTimeThai(date: Date = new Date()): string {
  try {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function buildBattleClosedSummary(params: {
  roomCode: string;
  battleMode: BattleModeKind;
  battleTitle: string;
  hostName: string;
  participants: readonly LiveQuizParticipantRecord[];
  closedAt?: Date;
}): BattleClosedSummaryData {
  const sorted = sortParticipantsByScoreDesc(params.participants);
  const allRanked: BattleClosedRankedParticipant[] = sorted.map((p, idx) => {
    const rank = idx + 1;
    return {
      ...p,
      rank,
      xpReward: getXpRewardForRank(rank),
    };
  });

  const topWinners: BattleClosedWinner[] = allRanked.slice(0, 3).map((entry) => {
    const rank = entry.rank as 1 | 2 | 3;
    const medal = getMedalMetaForRank(rank);
    return {
      rank,
      userId: entry.userId,
      displayName: entry.displayName,
      avatar: entry.avatar || '⚡',
      score: entry.score,
      streak: entry.streak,
      xpReward: entry.xpReward,
      medalTitle: medal.medalTitle,
      medalTier: medal.medalTier,
    };
  });

  const totalParticipants = allRanked.length;
  const topScore = totalParticipants > 0 ? allRanked[0].score : 0;
  const averageScore =
    totalParticipants > 0
      ? Math.round(allRanked.reduce((sum, p) => sum + p.score, 0) / totalParticipants)
      : 0;
  const totalXpAwarded = allRanked.reduce((sum, p) => sum + p.xpReward, 0);

  return {
    roomCode: params.roomCode.trim().toUpperCase(),
    battleMode: params.battleMode,
    battleTitle: params.battleTitle,
    hostName: params.hostName || 'คุณครู',
    closedAtLabel: formatClosedTimeThai(params.closedAt),
    totalParticipants,
    topScore,
    averageScore,
    totalXpAwarded,
    topWinners,
    allRanked,
  };
}

export function buildBattleClosedSummaryFromCloudRoom(params: {
  room: LiveQuizRoomRecord;
  battleMode: BattleModeKind;
  fallbackParticipants?: readonly LiveQuizParticipantRecord[];
  closedAt?: Date;
}): BattleClosedSummaryData {
  const { room, battleMode, fallbackParticipants = [], closedAt } = params;
  const cloudWinners = Array.isArray(room.finalTopWinners) ? room.finalTopWinners : [];

  if (fallbackParticipants.length > 0 && fallbackParticipants.length >= cloudWinners.length) {
    return buildBattleClosedSummary({
      roomCode: room.roomCode,
      battleMode,
      battleTitle:
        room.title ||
        (battleMode === 'onet'
          ? 'Live Classroom O-NET Battle'
          : 'Live Classroom Coding Battle'),
      hostName: room.hostName || 'คุณครู',
      participants: fallbackParticipants,
      closedAt,
    });
  }

  const normalizedWinners: BattleClosedWinner[] = [...cloudWinners]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((winner, index) => {
      const rank = ((winner.rank >= 1 && winner.rank <= 3 ? winner.rank : index + 1) as
        | 1
        | 2
        | 3);
      const medal = getMedalMetaForRank(rank);
      return {
        ...winner,
        rank,
        xpReward:
          typeof winner.xpReward === 'number' && winner.xpReward > 0
            ? winner.xpReward
            : getXpRewardForRank(rank),
        medalTitle: medal.medalTitle,
        medalTier: medal.medalTier,
      };
    });

  const allRanked: BattleClosedRankedParticipant[] = normalizedWinners.map((w) => ({
    roomCode: room.roomCode,
    userId: w.userId,
    displayName: w.displayName,
    avatar: w.avatar,
    score: w.score,
    streak: w.streak,
    lastAnswerIndex: -1,
    rank: w.rank,
    xpReward: w.xpReward,
  }));

  const totalParticipants = Math.max(
    typeof room.totalParticipants === 'number' ? room.totalParticipants : 0,
    normalizedWinners.length
  );
  const topScore = normalizedWinners.length > 0 ? normalizedWinners[0].score : 0;
  const averageScore =
    normalizedWinners.length > 0
      ? Math.round(
          normalizedWinners.reduce((sum, w) => sum + w.score, 0) / normalizedWinners.length
        )
      : 0;
  const extraParticipants = Math.max(0, totalParticipants - normalizedWinners.length);
  const totalXpAwarded =
    normalizedWinners.reduce((sum, w) => sum + w.xpReward, 0) +
    extraParticipants * PARTICIPATION_XP_REWARD;

  return {
    roomCode: room.roomCode,
    battleMode,
    battleTitle:
      room.title ||
      (battleMode === 'onet' ? 'Live Classroom O-NET Battle' : 'Live Classroom Coding Battle'),
    hostName: room.hostName || 'คุณครู',
    closedAtLabel: formatClosedTimeThai(closedAt),
    totalParticipants,
    topScore,
    averageScore,
    totalXpAwarded,
    topWinners: normalizedWinners,
    allRanked,
  };
}

export interface StudentClosedRoomReward {
  rank: number | null;
  xpReward: number;
  score: number;
  medalTitle: string;
  isTopThree: boolean;
}

export function findStudentRewardInClosedSummary(
  summary: BattleClosedSummaryData,
  participantId: string,
  displayName: string,
  fallbackScore: number = 0
): StudentClosedRoomReward | null {
  const normalizedName = displayName.trim().toLowerCase();

  const matchedTop = summary.topWinners.find(
    (w) =>
      (participantId && w.userId === participantId) ||
      (normalizedName && w.displayName.trim().toLowerCase() === normalizedName)
  );
  if (matchedTop) {
    return {
      rank: matchedTop.rank,
      xpReward: matchedTop.xpReward,
      score: matchedTop.score,
      medalTitle: matchedTop.medalTitle,
      isTopThree: true,
    };
  }

  const matchedAll = summary.allRanked.find(
    (p) =>
      (participantId && p.userId === participantId) ||
      (normalizedName && p.displayName.trim().toLowerCase() === normalizedName)
  );
  if (matchedAll) {
    return {
      rank: matchedAll.rank,
      xpReward: matchedAll.xpReward,
      score: matchedAll.score,
      medalTitle: `อันดับที่ ${matchedAll.rank}`,
      isTopThree: false,
    };
  }

  if (summary.totalParticipants > 0) {
    return {
      rank: null,
      xpReward: PARTICIPATION_XP_REWARD,
      score: Math.max(0, Math.round(fallbackScore)),
      medalTitle: 'ผู้เข้าร่วมประลอง',
      isTopThree: false,
    };
  }

  return null;
}

function getClaimedRoomSet(): Set<string> {
  try {
    if (typeof sessionStorage === 'undefined') return new Set();
    const raw = sessionStorage.getItem(CLAIMED_REWARDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map((v) => String(v))) : new Set();
  } catch {
    return new Set();
  }
}

export function hasClaimedClosedRoomReward(roomCode: string): boolean {
  const key = roomCode.trim().toUpperCase();
  if (!key) return false;
  return getClaimedRoomSet().has(key);
}

export function markClosedRoomRewardClaimed(roomCode: string): void {
  const key = roomCode.trim().toUpperCase();
  if (!key) return;
  try {
    if (typeof sessionStorage === 'undefined') return;
    const set = getClaimedRoomSet();
    set.add(key);
    sessionStorage.setItem(CLAIMED_REWARDS_STORAGE_KEY, JSON.stringify(Array.from(set).slice(-30)));
  } catch {
    // Ignore storage quota errors
  }
}
