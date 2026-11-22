import type { PointTransaction } from '../types/index.ts';

export const POINTS_STORAGE_KEY = 'coderkids_points';
export const TRANSACTIONS_STORAGE_KEY = 'coderkids_transactions';
export const CLAIMED_ACTIVITIES_STORAGE_KEY = 'coderkids_claimed_activities';
export const POINTS_INTEGRITY_STORAGE_KEY = 'coderkids_points_integrity_v1';
export const DAILY_EARNED_STORAGE_KEY = 'coderkids_daily_earned_v1';
export const DAILY_CHECKIN_DATE_STORAGE_KEY = 'coderkids_daily_checkin_date_v2';

export const DEFAULT_STARTING_POINTS = 65;
export const MAX_SINGLE_STUDENT_AWARD = 200;
export const MAX_SYSTEM_BATTLE_AWARD = 250;
export const MAX_DAILY_STUDENT_XP = 600;
export const BURST_WINDOW_MS = 60_000;
export const MAX_AWARDS_PER_BURST_WINDOW = 6;
export const DEFAULT_GENERIC_COOLDOWN_MS = 10_000;
export const DEFAULT_MAX_GENERIC_SAME_REASON_PER_DAY = 3;

const INTEGRITY_PEPPER = 'CK_OBEC_V42_ANTI_CHEAT_SALT_2026';

export interface PointsIntegrityEnvelope {
  v: 1;
  points: number;
  txCount: number;
  claimedCount: number;
  lastUpdatedAt: number;
  sig: string;
}

export interface DailyEarnedTracker {
  dateKey: string;
  totalEarned: number;
  reasonCounts: Record<string, number>;
}

export interface PointAwardOptions {
  uniqueKey?: string;
  cooldownMs?: number;
  maxPerDay?: number;
  allowLargeReward?: boolean;
  isTeacher?: boolean;
}

export interface EvaluatePointAwardResult {
  allowed: boolean;
  sanitizedAmount: number;
  reasonCode?:
    | 'invalid_amount'
    | 'exceeds_single_cap'
    | 'duplicate_unique_key'
    | 'rate_limited'
    | 'burst_limit'
    | 'daily_reason_limit'
    | 'daily_xp_cap';
  message?: string;
  nextDailyTracker?: DailyEarnedTracker;
}

/**
 * Returns YYYY-MM-DD in Asia/Bangkok timezone for deterministic daily caps and check-ins.
 */
export function getThailandDateKey(date: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      return formatted;
    }
  } catch {
    // Fallback below
  }
  const utcMs = date.getTime() + 7 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString().slice(0, 10);
}

/**
 * Returns ISO week key (e.g., "2026-W47") in Asia/Bangkok timezone for weekly quest locking.
 */
export function getThailandWeekKey(date: Date = new Date()): string {
  const dateKey = getThailandDateKey(date);
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const temp = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Deterministic salted 64-bit-equivalent hex digest (dual FNV-1a mix) to detect casual
 * DevTools localStorage tampering of points, claimed activities, and ledger totals.
 */
export function computeIntegritySignature(payload: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const full = `${INTEGRITY_PEPPER}|${payload}|${payload.length}`;
  for (let i = 0; i < full.length; i++) {
    const c = full.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c + ((i + 1) * 31);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b) >>> 0;
  h2 = Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35) >>> 0;
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function buildPointsIntegrityEnvelope(
  points: number,
  txCount: number,
  claimedCount: number,
  nowMs: number = Date.now()
): PointsIntegrityEnvelope {
  const safePoints = Math.max(0, Math.min(1_000_000, Math.round(points || 0)));
  const safeTx = Math.max(0, Math.round(txCount || 0));
  const safeClaimed = Math.max(0, Math.round(claimedCount || 0));
  const sig = computeIntegritySignature(`pts:${safePoints}|tx:${safeTx}|cl:${safeClaimed}`);
  return {
    v: 1,
    points: safePoints,
    txCount: safeTx,
    claimedCount: safeClaimed,
    lastUpdatedAt: nowMs,
    sig,
  };
}

export function verifyPointsIntegrityEnvelope(
  envelope: PointsIntegrityEnvelope | null | undefined,
  points: number,
  txCount: number,
  claimedCount: number
): boolean {
  if (!envelope || envelope.v !== 1 || typeof envelope.sig !== 'string') {
    return false;
  }
  const safePoints = Math.max(0, Math.min(1_000_000, Math.round(points || 0)));
  if (envelope.points !== safePoints) return false;
  const expected = computeIntegritySignature(
    `pts:${safePoints}|tx:${Math.max(0, Math.round(txCount || 0))}|cl:${Math.max(0, Math.round(claimedCount || 0))}`
  );
  return envelope.sig === expected;
}

/**
 * Recomputes a safe points ceiling from the transaction ledger so manually setting
 * `localStorage.coderkids_points = "999999"` cannot inflate a student's score.
 */
export function computeLedgerPointsTotal(
  transactions: readonly PointTransaction[],
  initialTransactionsCount: number = 0
): number {
  let earned = 0;
  let spent = 0;
  for (const tx of transactions) {
    if (!tx || typeof tx.amount !== 'number' || !Number.isFinite(tx.amount)) continue;
    const clampedAmt = Math.max(0, Math.min(MAX_SYSTEM_BATTLE_AWARD, Math.round(tx.amount)));
    if (tx.type === 'earn') {
      earned += clampedAmt;
    } else if (tx.type === 'spend') {
      spent += Math.max(0, Math.min(50_000, Math.round(tx.amount)));
    }
  }
  const baseOffset = transactions.length === 0 && initialTransactionsCount === 0 ? DEFAULT_STARTING_POINTS : 0;
  return Math.max(0, baseOffset + earned - spent);
}

/**
 * Loads and validates student points from localStorage.
 * If the stored points value was tampered with in DevTools (fails signature check or exceeds
 * the transaction ledger ceiling), automatically restores the authentic ledger total.
 */
export function loadVerifiedStoredPoints(
  transactions: readonly PointTransaction[],
  claimedCount: number,
  fallbackStartingPoints: number = DEFAULT_STARTING_POINTS
): { points: number; tampered: boolean } {
  try {
    if (typeof localStorage === 'undefined') {
      return { points: fallbackStartingPoints, tampered: false };
    }
    const rawPts = localStorage.getItem(POINTS_STORAGE_KEY);
    if (rawPts === null) {
      return { points: fallbackStartingPoints, tampered: false };
    }
    const parsedPts = Number(rawPts);
    if (!Number.isFinite(parsedPts) || parsedPts < 0 || parsedPts > 1_000_000) {
      const recovered = Math.max(fallbackStartingPoints, computeLedgerPointsTotal(transactions));
      return { points: recovered, tampered: true };
    }
    const intPts = Math.round(parsedPts);
    const ledgerTotal = computeLedgerPointsTotal(transactions);

    const rawEnv = localStorage.getItem(POINTS_INTEGRITY_STORAGE_KEY);
    if (rawEnv) {
      try {
        const env = JSON.parse(rawEnv) as PointsIntegrityEnvelope;
        if (verifyPointsIntegrityEnvelope(env, intPts, transactions.length, claimedCount)) {
          // Even if signed, disallow impossible divergence above ledger + starting grace buffer
          const maxPlausible = Math.max(fallbackStartingPoints, ledgerTotal + fallbackStartingPoints);
          if (intPts <= maxPlausible) {
            return { points: intPts, tampered: false };
          }
        }
        // Signature failed or points diverged from ledger -> tamper detected
        const safeRecovered = Math.min(intPts, Math.max(fallbackStartingPoints, ledgerTotal));
        return { points: safeRecovered, tampered: true };
      } catch {
        const safeRecovered = Math.min(intPts, Math.max(fallbackStartingPoints, ledgerTotal));
        return { points: safeRecovered, tampered: true };
      }
    }

    // Legacy user without integrity envelope yet: accept only if consistent with ledger ceiling
    const legacyCeiling = Math.max(fallbackStartingPoints, ledgerTotal + fallbackStartingPoints);
    if (intPts > legacyCeiling) {
      return { points: Math.max(fallbackStartingPoints, ledgerTotal), tampered: true };
    }
    return { points: intPts, tampered: false };
  } catch {
    return { points: fallbackStartingPoints, tampered: false };
  }
}

export function persistPointsIntegrity(
  points: number,
  txCount: number,
  claimedCount: number
): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const envelope = buildPointsIntegrityEnvelope(points, txCount, claimedCount);
    localStorage.setItem(POINTS_INTEGRITY_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Ignore storage errors
  }
}

export function loadDailyEarnedTracker(dateKey: string = getThailandDateKey()): DailyEarnedTracker {
  try {
    if (typeof localStorage === 'undefined') {
      return { dateKey, totalEarned: 0, reasonCounts: {} };
    }
    const raw = localStorage.getItem(DAILY_EARNED_STORAGE_KEY);
    if (!raw) {
      return { dateKey, totalEarned: 0, reasonCounts: {} };
    }
    const parsed = JSON.parse(raw) as Partial<DailyEarnedTracker>;
    if (parsed && parsed.dateKey === dateKey) {
      return {
        dateKey,
        totalEarned:
          typeof parsed.totalEarned === 'number' && Number.isFinite(parsed.totalEarned)
            ? Math.max(0, Math.round(parsed.totalEarned))
            : 0,
        reasonCounts:
          parsed.reasonCounts && typeof parsed.reasonCounts === 'object' && !Array.isArray(parsed.reasonCounts)
            ? (parsed.reasonCounts as Record<string, number>)
            : {},
      };
    }
  } catch {
    // Ignore parse error
  }
  return { dateKey, totalEarned: 0, reasonCounts: {} };
}

export function saveDailyEarnedTracker(tracker: DailyEarnedTracker): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DAILY_EARNED_STORAGE_KEY, JSON.stringify(tracker));
  } catch {
    // Ignore storage error
  }
}

/**
 * Determines whether a reward description corresponds to a one-shot-per-day activity
 * (exams, assessments, check-ins, daily goals, quests, battles, worksheets, finishing books).
 */
export function isOneShotDailyReason(reason: string): boolean {
  const normalized = reason.trim().toLowerCase();
  const oneShotKeywords = [
    'ข้อสอบ',
    'แบบทดสอบ',
    'ประเมินตนเอง',
    'รูบริก',
    'ใบงาน',
    'bebras',
    'daily bug hunter',
    'daily challenge',
    'daily journal',
    'pair programming',
    'จบเล่ม',
    'เช็คอิน',
    'เช็กชื่อ',
    'เป้าหมาย',
    'เควสต์',
    'live quiz battle',
    'o-net',
    'coding battle',
    'รางวัลเหรียญ',
    'เข้าเรียนห้อง',
    'โหวต',
    'final stage',
    'หนังสือยินยอม pdpa',
    'co-op daily',
    'ส่งออกชุดข้อมูล',
  ];
  return oneShotKeywords.some((kw) => normalized.includes(kw));
}

export function normalizeReasonKey(category: string, reason: string): string {
  return `${category}:${reason.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 100)}`;
}

/**
 * Central anti-cheat gate evaluated before any XP/points are added to a student's balance.
 */
export function evaluatePointAward(params: {
  amount: number;
  reason: string;
  category: string;
  claimedActivities: readonly string[];
  recentAwardTimestamps: number[];
  lastActionTimestamps: Map<string, number>;
  dailyTracker: DailyEarnedTracker;
  options?: PointAwardOptions;
  nowMs?: number;
}): EvaluatePointAwardResult {
  const {
    amount,
    reason,
    category,
    claimedActivities,
    recentAwardTimestamps,
    lastActionTimestamps,
    dailyTracker,
    options,
    nowMs = Date.now(),
  } = params;

  // 1. Validate numeric sanity (prevent NaN, Infinity, negative, 0)
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return { allowed: false, sanitizedAmount: 0, reasonCode: 'invalid_amount', message: 'จำนวนแต้มไม่ถูกต้อง' };
  }
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return { allowed: false, sanitizedAmount: 0, reasonCode: 'invalid_amount', message: 'จำนวนแต้มต้องมากกว่า 0' };
  }

  // 2. Single-award cap
  const singleCap = options?.allowLargeReward ? MAX_SYSTEM_BATTLE_AWARD : MAX_SINGLE_STUDENT_AWARD;
  if (!options?.isTeacher && rounded > singleCap) {
    return {
      allowed: false,
      sanitizedAmount: 0,
      reasonCode: 'exceeds_single_cap',
      message: `ระบบป้องกันการโกง: แต้มต่อครั้งต้องไม่เกิน ${singleCap} XP`,
    };
  }

  // 3. Explicit uniqueKey deduplication
  if (options?.uniqueKey) {
    if (claimedActivities.includes(options.uniqueKey)) {
      return {
        allowed: false,
        sanitizedAmount: 0,
        reasonCode: 'duplicate_unique_key',
        message: 'กิจกรรมนี้ได้รับแต้มไปแล้ว ไม่สามารถรับซ้ำได้',
      };
    }
  }

  // 4. Per-action cooldown (debounce against rapid clicking)
  const reasonKey = normalizeReasonKey(category, reason);
  const cooldownMs =
    options?.cooldownMs ?? (options?.uniqueKey ? 1500 : DEFAULT_GENERIC_COOLDOWN_MS);
  const lastActionMs = lastActionTimestamps.get(reasonKey) || 0;
  if (nowMs - lastActionMs < cooldownMs) {
    return {
      allowed: false,
      sanitizedAmount: 0,
      reasonCode: 'rate_limited',
      message: 'กรุณารอสักครู่ก่อนรับแต้มจากกิจกรรมเดิมอีกครั้ง',
    };
  }

  // 5. Rolling burst protection against auto-clickers / console loops
  if (!options?.isTeacher) {
    const activeBurst = recentAwardTimestamps.filter((ts) => nowMs - ts < BURST_WINDOW_MS);
    if (activeBurst.length >= MAX_AWARDS_PER_BURST_WINDOW) {
      return {
        allowed: false,
        sanitizedAmount: 0,
        reasonCode: 'burst_limit',
        message: 'ได้รับแต้มถี่เกินไป กรุณารอสักครู่แล้วค่อยทำกิจกรรมต่อ',
      };
    }
  }

  // 6. Per-reason daily repetition limit (blocks replaying the same quiz/lab endlessly)
  const currentCountForReason = dailyTracker.reasonCounts[reasonKey] || 0;
  const maxForReasonToday =
    options?.maxPerDay ??
    (options?.uniqueKey
      ? 1
      : isOneShotDailyReason(reason)
      ? 1
      : DEFAULT_MAX_GENERIC_SAME_REASON_PER_DAY);

  if (!options?.isTeacher && !options?.uniqueKey && currentCountForReason >= maxForReasonToday) {
    return {
      allowed: false,
      sanitizedAmount: 0,
      reasonCode: 'daily_reason_limit',
      message: 'คุณได้รับแต้มจากกิจกรรมนี้ครบจำนวนสูงสุดของวันนี้แล้ว',
    };
  }

  // 7. Global daily XP cap for students (prevents multi-module farming scripts)
  if (!options?.isTeacher && dailyTracker.totalEarned >= MAX_DAILY_STUDENT_XP) {
    return {
      allowed: false,
      sanitizedAmount: 0,
      reasonCode: 'daily_xp_cap',
      message: `วันนี้สะสมแต้มครบโควตาสูงสุด ${MAX_DAILY_STUDENT_XP} XP แล้ว กลับมาเรียนรู้ต่อพรุ่งนี้นะ!`,
    };
  }

  const remainingDailyBudget = options?.isTeacher
    ? rounded
    : Math.max(0, MAX_DAILY_STUDENT_XP - dailyTracker.totalEarned);
  const sanitizedAmount = Math.min(rounded, remainingDailyBudget);

  if (sanitizedAmount <= 0) {
    return {
      allowed: false,
      sanitizedAmount: 0,
      reasonCode: 'daily_xp_cap',
      message: `วันนี้สะสมแต้มครบโควตาสูงสุด ${MAX_DAILY_STUDENT_XP} XP แล้ว`,
    };
  }

  const nextDailyTracker: DailyEarnedTracker = {
    dateKey: dailyTracker.dateKey,
    totalEarned: dailyTracker.totalEarned + sanitizedAmount,
    reasonCounts: {
      ...dailyTracker.reasonCounts,
      [reasonKey]: currentCountForReason + 1,
    },
  };

  return {
    allowed: true,
    sanitizedAmount,
    nextDailyTracker,
  };
}

/**
 * Validates point spending to prevent negative-amount point generation or duplicate unlocks.
 */
export function validatePointSpend(params: {
  currentPoints: number;
  amount: number;
  rewardId: string;
  unlockedRewardIds: readonly string[];
}): { valid: boolean; sanitizedAmount: number } {
  const { currentPoints, amount, rewardId, unlockedRewardIds } = params;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return { valid: false, sanitizedAmount: 0 };
  }
  const rounded = Math.round(amount);
  if (rounded <= 0 || rounded > 100_000) {
    return { valid: false, sanitizedAmount: 0 };
  }
  if (currentPoints < rounded) {
    return { valid: false, sanitizedAmount: 0 };
  }
  if (rewardId && rewardId !== 'avatar_shop' && unlockedRewardIds.includes(rewardId)) {
    return { valid: false, sanitizedAmount: 0 };
  }
  return { valid: true, sanitizedAmount: rounded };
}

/**
 * Shared Daily Check-In helpers so DashboardWidget and DailyLearningActivityStreakChart
 * cannot double-award Daily Check-In XP on the same day or across page reloads.
 */
export function hasCompletedDailyCheckIn(dateKey: string = getThailandDateKey()): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(DAILY_CHECKIN_DATE_STORAGE_KEY) === dateKey;
  } catch {
    return false;
  }
}

export function markDailyCheckInCompleted(dateKey: string = getThailandDateKey()): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DAILY_CHECKIN_DATE_STORAGE_KEY, dateKey);
  } catch {
    // Ignore storage error
  }
}
