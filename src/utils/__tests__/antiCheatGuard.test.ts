import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PointTransaction } from '../../types/index.ts';
import {
  BURST_WINDOW_MS,
  DAILY_EARNED_STORAGE_KEY,
  DEFAULT_STARTING_POINTS,
  MAX_AWARDS_PER_BURST_WINDOW,
  MAX_DAILY_STUDENT_XP,
  MAX_SINGLE_STUDENT_AWARD,
  MAX_SYSTEM_BATTLE_AWARD,
  POINTS_INTEGRITY_STORAGE_KEY,
  POINTS_STORAGE_KEY,
  evaluatePointAward,
  getThailandDateKey,
  getThailandWeekKey,
  hasCompletedDailyCheckIn,
  loadDailyEarnedTracker,
  loadVerifiedStoredPoints,
  markDailyCheckInCompleted,
  persistPointsIntegrity,
  saveDailyEarnedTracker,
  validatePointSpend,
  type DailyEarnedTracker,
} from '../antiCheatGuard.ts';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

const SAMPLE_TXS: PointTransaction[] = [
  { id: 't1', amount: 30, description: 'เช็คอินรายวัน', category: 'classroom', timestamp: '10:00', type: 'earn' },
  { id: 't2', amount: 50, description: 'จบโมดูลที่ 1', category: 'safety', timestamp: '10:05', type: 'earn' },
  { id: 't3', amount: 15, description: 'ซื้อกรอบโปรไฟล์', category: 'showcase', timestamp: '10:10', type: 'spend' },
];

describe('antiCheatGuard', () => {
  const originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  });

  describe('LocalStorage points integrity & tamper detection', () => {
    it('accepts valid signed points integrity envelope matching ledger', () => {
      const ledgerNet = 30 + 50 - 15; // 65
      localStorage.setItem(POINTS_STORAGE_KEY, String(ledgerNet));
      persistPointsIntegrity(ledgerNet, SAMPLE_TXS.length, 2);

      const res = loadVerifiedStoredPoints(SAMPLE_TXS, 2);
      expect(res.tampered).toBe(false);
      expect(res.points).toBe(ledgerNet);
    });

    it('detects manual localStorage point inflation and restores ledger total', () => {
      localStorage.setItem(POINTS_STORAGE_KEY, '99999');
      persistPointsIntegrity(65, SAMPLE_TXS.length, 2);

      const res = loadVerifiedStoredPoints(SAMPLE_TXS, 2);
      expect(res.tampered).toBe(true);
      expect(res.points).toBe(65);
    });

    it('detects legacy inflated points without an integrity envelope', () => {
      localStorage.setItem(POINTS_STORAGE_KEY, '50000');
      const res = loadVerifiedStoredPoints(SAMPLE_TXS, 2);
      expect(res.tampered).toBe(true);
      expect(res.points).toBe(65);
    });

    it('recovers safely when stored points is negative, NaN, or oversized', () => {
      localStorage.setItem(POINTS_STORAGE_KEY, '-500');
      expect(loadVerifiedStoredPoints(SAMPLE_TXS, 0)).toEqual({
        points: DEFAULT_STARTING_POINTS,
        tampered: true,
      });

      localStorage.setItem(POINTS_STORAGE_KEY, 'not-a-number');
      expect(loadVerifiedStoredPoints([], 0)).toEqual({
        points: DEFAULT_STARTING_POINTS,
        tampered: true,
      });

      localStorage.setItem(POINTS_STORAGE_KEY, '99999999');
      localStorage.removeItem(POINTS_INTEGRITY_STORAGE_KEY);
      expect(loadVerifiedStoredPoints(SAMPLE_TXS, 0).tampered).toBe(true);
    });
  });

  describe('evaluatePointAward protections', () => {
    const emptyTracker = (): DailyEarnedTracker => ({
      dateKey: getThailandDateKey(),
      totalEarned: 0,
      reasonCounts: {},
    });

    it('rejects zero, negative, NaN, and Infinity amounts', () => {
      for (const badAmount of [0, -10, NaN, Infinity, -Infinity]) {
        const result = evaluatePointAward({
          amount: badAmount,
          reason: 'ทดสอบส่งค่าไม่ถูกต้อง',
          category: 'quiz',
          claimedActivities: [],
          recentAwardTimestamps: [],
          lastActionTimestamps: new Map(),
          dailyTracker: emptyTracker(),
        });
        expect(result.allowed).toBe(false);
        expect(result.reasonCode).toBe('invalid_amount');
      }
    });

    it('caps single student awards at MAX_SINGLE_STUDENT_AWARD (200) or MAX_SYSTEM_BATTLE_AWARD (250) with allowLargeReward', () => {
      const tooBigNormal = evaluatePointAward({
        amount: MAX_SINGLE_STUDENT_AWARD + 1,
        reason: 'ส่งงาน lab',
        category: 'lab',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: emptyTracker(),
      });
      expect(tooBigNormal.allowed).toBe(false);
      expect(tooBigNormal.reasonCode).toBe('exceeds_single_cap');

      const allowedBattle = evaluatePointAward({
        amount: MAX_SYSTEM_BATTLE_AWARD,
        reason: 'ชนะอันดับ 1',
        category: 'quiz',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: emptyTracker(),
        options: { allowLargeReward: true, uniqueKey: 'battle_room_1' },
      });
      expect(allowedBattle.allowed).toBe(true);
      expect(allowedBattle.sanitizedAmount).toBe(MAX_SYSTEM_BATTLE_AWARD);

      const teacherOverride = evaluatePointAward({
        amount: 500,
        reason: 'ครูกดให้คะแนนพิเศษ',
        category: 'quiz',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: emptyTracker(),
        options: { isTeacher: true },
      });
      expect(teacherOverride.allowed).toBe(true);
      expect(teacherOverride.sanitizedAmount).toBe(500);
    });

    it('deduplicates repeated claims with identical uniqueKey', () => {
      const result = evaluatePointAward({
        amount: 25,
        reason: 'ทำใบงานสำเร็จ',
        category: 'lab',
        claimedActivities: ['worksheet_p5_u1'],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: emptyTracker(),
        options: { uniqueKey: 'worksheet_p5_u1' },
      });
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('duplicate_unique_key');
    });

    it('enforces action cooldown and 6-per-60s burst limit', () => {
      const now = 1_000_000;
      const actionMap = new Map<string, number>();
      actionMap.set('lab:ฝึกเขียนโค้ด python', now - 2_000);

      const cooledDown = evaluatePointAward({
        amount: 15,
        reason: 'ฝึกเขียนโค้ด Python',
        category: 'lab',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: actionMap,
        dailyTracker: emptyTracker(),
        nowMs: now,
      });
      expect(cooledDown.allowed).toBe(false);
      expect(cooledDown.reasonCode).toBe('rate_limited');

      const burstTimestamps = Array.from(
        { length: MAX_AWARDS_PER_BURST_WINDOW },
        (_, idx) => now - (idx + 1) * 2_000
      );
      expect(burstTimestamps.every((ts) => now - ts < BURST_WINDOW_MS)).toBe(true);

      const bursted = evaluatePointAward({
        amount: 15,
        reason: 'กิจกรรมใหม่',
        category: 'game',
        claimedActivities: [],
        recentAwardTimestamps: burstTimestamps,
        lastActionTimestamps: new Map(),
        dailyTracker: emptyTracker(),
        nowMs: now,
      });
      expect(bursted.allowed).toBe(false);
      expect(bursted.reasonCode).toBe('burst_limit');
    });

    it('enforces 1/day limit on one-shot keywords and 3/day on generic reasons', () => {
      const tracker: DailyEarnedTracker = {
        dateKey: getThailandDateKey(),
        totalEarned: 100,
        reasonCounts: {
          'quiz:ทำข้อสอบกลางภาค': 1,
          'lab:ทดลองรันโค้ด': 3,
        },
      };

      const repeatExam = evaluatePointAward({
        amount: 30,
        reason: 'ทำข้อสอบกลางภาค',
        category: 'quiz',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: tracker,
      });
      expect(repeatExam.allowed).toBe(false);
      expect(repeatExam.reasonCode).toBe('daily_reason_limit');

      const repeatGeneric = evaluatePointAward({
        amount: 20,
        reason: 'ทดลองรันโค้ด',
        category: 'lab',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: tracker,
      });
      expect(repeatGeneric.allowed).toBe(false);
      expect(repeatGeneric.reasonCode).toBe('daily_reason_limit');
    });

    it('caps remaining daily XP budget at MAX_DAILY_STUDENT_XP (600) and blocks when full', () => {
      const almostFull: DailyEarnedTracker = {
        dateKey: getThailandDateKey(),
        totalEarned: MAX_DAILY_STUDENT_XP - 10,
        reasonCounts: {},
      };
      const partial = evaluatePointAward({
        amount: 50,
        reason: 'ชนะภารกิจพิเศษ',
        category: 'game',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: almostFull,
        options: { uniqueKey: 'special_1' },
      });
      expect(partial.allowed).toBe(true);
      expect(partial.sanitizedAmount).toBe(10);
      expect(partial.nextDailyTracker?.totalEarned).toBe(MAX_DAILY_STUDENT_XP);

      const full = evaluatePointAward({
        amount: 20,
        reason: 'อีกภารกิจ',
        category: 'game',
        claimedActivities: [],
        recentAwardTimestamps: [],
        lastActionTimestamps: new Map(),
        dailyTracker: partial.nextDailyTracker!,
        options: { uniqueKey: 'special_2' },
      });
      expect(full.allowed).toBe(false);
      expect(full.reasonCode).toBe('daily_xp_cap');
    });
  });

  describe('validatePointSpend', () => {
    it('rejects negative/zero spend, insufficient points, and duplicate non-shop unlocks', () => {
      expect(
        validatePointSpend({
          currentPoints: 100,
          amount: -50,
          rewardId: 'badge_1',
          unlockedRewardIds: [],
        }).valid
      ).toBe(false);

      expect(
        validatePointSpend({
          currentPoints: 40,
          amount: 50,
          rewardId: 'badge_1',
          unlockedRewardIds: [],
        }).valid
      ).toBe(false);

      expect(
        validatePointSpend({
          currentPoints: 200,
          amount: 50,
          rewardId: 'badge_1',
          unlockedRewardIds: ['badge_1'],
        }).valid
      ).toBe(false);

      expect(
        validatePointSpend({
          currentPoints: 200,
          amount: 50,
          rewardId: 'avatar_shop',
          unlockedRewardIds: ['avatar_shop'],
        })
      ).toEqual({ valid: true, sanitizedAmount: 50 });
    });
  });

  describe('Daily check-in, date keys, and daily tracker persistence', () => {
    it('shares daily check-in completion flag across widgets for the same Thailand date', () => {
      const today = getThailandDateKey();
      expect(/^\d{4}-\d{2}-\d{2}$/.test(today)).toBe(true);
      expect(/^\d{4}-W\d{2}$/.test(getThailandWeekKey())).toBe(true);

      expect(hasCompletedDailyCheckIn(today)).toBe(false);
      markDailyCheckInCompleted(today);
      expect(hasCompletedDailyCheckIn(today)).toBe(true);
      expect(hasCompletedDailyCheckIn('2099-01-01')).toBe(false);
    });

    it('resets daily tracker when stored dateKey does not match today', () => {
      localStorage.setItem(
        DAILY_EARNED_STORAGE_KEY,
        JSON.stringify({ dateKey: '2020-01-01', totalEarned: 600, reasonCounts: { a: 3 } })
      );
      const fresh = loadDailyEarnedTracker('2026-11-22');
      expect(fresh).toEqual({ dateKey: '2026-11-22', totalEarned: 0, reasonCounts: {} });

      saveDailyEarnedTracker({ dateKey: '2026-11-22', totalEarned: 120, reasonCounts: { x: 1 } });
      expect(loadDailyEarnedTracker('2026-11-22').totalEarned).toBe(120);
    });
  });
});
