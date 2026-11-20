import { describe, expect, it } from 'vitest';
import type { LiveQuizParticipantRecord, LiveQuizRoomRecord } from '../../services/firestoreService.ts';
import {
  PARTICIPATION_XP_REWARD,
  TOP_THREE_XP_REWARDS,
  buildBattleClosedSummary,
  buildBattleClosedSummaryFromCloudRoom,
  extractFinalTopWinners,
  findStudentRewardInClosedSummary,
} from '../battleCloseSummary.ts';

const SAMPLE_PARTICIPANTS: LiveQuizParticipantRecord[] = [
  {
    roomCode: '882410',
    userId: 'guest_2',
    displayName: 'น้องข้าวปั้น',
    avatar: '🚀',
    score: 2150,
    streak: 3,
    lastAnswerIndex: 1,
    updatedAtMs: 2000,
  },
  {
    roomCode: '882410',
    userId: 'guest_1',
    displayName: 'น้องพณสร',
    avatar: '⚡',
    score: 2850,
    streak: 5,
    lastAnswerIndex: 0,
    updatedAtMs: 1500,
  },
  {
    roomCode: '882410',
    userId: 'guest_4',
    displayName: 'น้องต้นกล้า',
    avatar: '🐱',
    score: 1200,
    streak: 1,
    lastAnswerIndex: 2,
    updatedAtMs: 3000,
  },
  {
    roomCode: '882410',
    userId: 'guest_3',
    displayName: 'น้องใบเฟิร์น',
    avatar: '🎓',
    score: 1950,
    streak: 2,
    lastAnswerIndex: 3,
    updatedAtMs: 2500,
  },
];

describe('battleCloseSummary', () => {
  it('ranks participants descending and assigns Top 3 XP coin rewards + participation XP', () => {
    const summary = buildBattleClosedSummary({
      roomCode: '882410',
      battleMode: 'coding',
      battleTitle: 'Live Classroom Coding Battle',
      hostName: 'ครูอนุสรณ์',
      participants: SAMPLE_PARTICIPANTS,
    });

    expect(summary.totalParticipants).toBe(4);
    expect(summary.topScore).toBe(2850);
    expect(summary.topWinners).toHaveLength(3);

    expect(summary.topWinners[0]).toMatchObject({
      rank: 1,
      displayName: 'น้องพณสร',
      score: 2850,
      xpReward: TOP_THREE_XP_REWARDS[1],
      medalTier: 'gold',
    });
    expect(summary.topWinners[1]).toMatchObject({
      rank: 2,
      displayName: 'น้องข้าวปั้น',
      score: 2150,
      xpReward: TOP_THREE_XP_REWARDS[2],
      medalTier: 'silver',
    });
    expect(summary.topWinners[2]).toMatchObject({
      rank: 3,
      displayName: 'น้องใบเฟิร์น',
      score: 1950,
      xpReward: TOP_THREE_XP_REWARDS[3],
      medalTier: 'bronze',
    });

    expect(summary.allRanked[3].xpReward).toBe(PARTICIPATION_XP_REWARD);
    expect(summary.totalXpAwarded).toBe(
      TOP_THREE_XP_REWARDS[1] +
        TOP_THREE_XP_REWARDS[2] +
        TOP_THREE_XP_REWARDS[3] +
        PARTICIPATION_XP_REWARD
    );
  });

  it('reconstructs closed room summary from Firestore finalTopWinners when participants are already cleared', () => {
    const finalTopWinners = extractFinalTopWinners(SAMPLE_PARTICIPANTS);
    const closedRoom: LiveQuizRoomRecord = {
      roomCode: '882410',
      hostUid: 'teacher_1',
      hostName: 'ครูอนุสรณ์',
      title: 'Live Classroom O-NET Battle',
      stage: 'podium',
      currentQuestionIndex: 5,
      status: 'closed',
      totalParticipants: 6,
      finalTopWinners,
    };

    const summary = buildBattleClosedSummaryFromCloudRoom({
      room: closedRoom,
      battleMode: 'onet',
    });

    expect(summary.totalParticipants).toBe(6);
    expect(summary.topWinners).toHaveLength(3);
    expect(summary.topWinners[0].displayName).toBe('น้องพณสร');
    expect(summary.topWinners[0].xpReward).toBe(150);
    expect(summary.totalXpAwarded).toBe(150 + 100 + 60 + 3 * PARTICIPATION_XP_REWARD);
  });

  it('matches student reward accurately by participantId or fallback name', () => {
    const summary = buildBattleClosedSummary({
      roomCode: '882410',
      battleMode: 'onet',
      battleTitle: 'Live Classroom O-NET Battle',
      hostName: 'ครูอนุสรณ์',
      participants: SAMPLE_PARTICIPANTS,
    });

    const firstPlace = findStudentRewardInClosedSummary(summary, 'guest_1', 'น้องพณสร');
    expect(firstPlace).toMatchObject({
      rank: 1,
      xpReward: 150,
      isTopThree: true,
    });

    const fourthPlace = findStudentRewardInClosedSummary(summary, 'guest_4', 'น้องต้นกล้า');
    expect(fourthPlace).toMatchObject({
      rank: 4,
      xpReward: PARTICIPATION_XP_REWARD,
      isTopThree: false,
    });
  });

  it('handles zero participants gracefully when a room is closed empty', () => {
    const summary = buildBattleClosedSummary({
      roomCode: '999000',
      battleMode: 'coding',
      battleTitle: 'Live Classroom Coding Battle',
      hostName: 'ครูอนุสรณ์',
      participants: [],
    });

    expect(summary.totalParticipants).toBe(0);
    expect(summary.topWinners).toEqual([]);
    expect(summary.totalXpAwarded).toBe(0);
    expect(findStudentRewardInClosedSummary(summary, 'guest_x', 'นักเรียน')).toBeNull();
  });
});
