import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  JOINED_BATTLE_ROOMS_STORAGE_KEY,
  clearBattleRoomJoinInStorage,
  getDuplicateJoinAlertMessage,
  getJoinedBattleRoomsFromStorage,
  hasJoinedBattleRoomInStorage,
  markBattleRoomJoinedInStorage,
  normalizeBattleRoomCode,
} from '../battleJoinGuard.ts';

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

describe('battleJoinGuard (anti-duplicate classroom & team room join)', () => {
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

  it('normalizes room codes consistently (uppercase, trimmed, safe chars)', () => {
    expect(normalizeBattleRoomCode('  ab12-xy!@# ')).toBe('AB12-XY');
    expect(normalizeBattleRoomCode('team_401')).toBe('TEAM_401');
    expect(normalizeBattleRoomCode('')).toBe('');
  });

  it('records and blocks duplicate join attempts in the same room and mode', () => {
    expect(hasJoinedBattleRoomInStorage('coding', '849201')).toBe(false);

    const saved = markBattleRoomJoinedInStorage('coding', '849201', 'น้องต้นกล้า');
    expect(saved).not.toBeNull();
    expect(saved?.roomCode).toBe('849201');
    expect(saved?.mode).toBe('coding');

    // Exact match and lowercase/whitespace variants are blocked
    expect(hasJoinedBattleRoomInStorage('coding', '849201')).toBe(true);
    expect(hasJoinedBattleRoomInStorage('coding', ' 849201 ')).toBe(true);

    // Calling mark again preserves original timestamp without duplicating entries
    const second = markBattleRoomJoinedInStorage('coding', '849201', 'ชื่อใหม่');
    expect(second?.joinedAt).toBe(saved?.joinedAt);
    expect(second?.participantName).toBe('น้องต้นกล้า');
  });

  it('allows joining a new room code for Round 2 and isolates modes (coding vs onet vs team)', () => {
    markBattleRoomJoinedInStorage('coding', '111222', 'นักเรียน A');
    markBattleRoomJoinedInStorage('onet', '333444', 'นักเรียน A');
    markBattleRoomJoinedInStorage('team', 'team-401', 'ทีมราชสีห์คำนวณ');

    // Same mode, new Room Code -> allowed
    expect(hasJoinedBattleRoomInStorage('coding', '999888')).toBe(false);
    expect(hasJoinedBattleRoomInStorage('onet', '555666')).toBe(false);
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-402')).toBe(false);

    // Same Room Code in different mode -> isolated
    expect(hasJoinedBattleRoomInStorage('onet', '111222')).toBe(false);
    expect(hasJoinedBattleRoomInStorage('coding', '333444')).toBe(false);
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-401')).toBe(true);

    expect(getJoinedBattleRoomsFromStorage('team')).toHaveLength(1);
    expect(getJoinedBattleRoomsFromStorage()).toHaveLength(3);
  });

  it('returns the exact required Thai alert message for TeamBattleArena and anti-cheat live rooms', () => {
    expect(getDuplicateJoinAlertMessage('TEAM-401', false)).toBe('คุณได้เข้าร่วมห้องนี้แล้ว');
    expect(getDuplicateJoinAlertMessage('849201', true)).toContain('คุณได้เข้าร่วมห้องนี้แล้ว');
    expect(getDuplicateJoinAlertMessage('849201', true)).toContain('849201');
  });

  it('recovers gracefully if localStorage contains corrupted JSON', () => {
    localStorage.setItem(JOINED_BATTLE_ROOMS_STORAGE_KEY, '{invalid-json');
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-401')).toBe(false);
    const saved = markBattleRoomJoinedInStorage('team', 'TEAM-401', 'ทีมหุ่นยนต์');
    expect(saved?.roomCode).toBe('TEAM-401');
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-401')).toBe(true);
  });

  it('clears a canceled team room from LocalStorage so user can re-join without affecting other modes', () => {
    markBattleRoomJoinedInStorage('team', 'TEAM-401', 'ทีมราชสีห์คำนวณ');
    markBattleRoomJoinedInStorage('team', 'TEAM-402', 'ทีมหุ่นยนต์อัจฉริยะ');
    markBattleRoomJoinedInStorage('coding', '849201', 'นักเรียน A');

    // Cancel specific room TEAM-401
    clearBattleRoomJoinInStorage('team', 'TEAM-401');
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-401')).toBe(false);
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-402')).toBe(true);
    expect(hasJoinedBattleRoomInStorage('coding', '849201')).toBe(true);

    // Can re-join TEAM-401 after canceling
    const rejoined = markBattleRoomJoinedInStorage('team', 'TEAM-401', 'ทีมนักบินอวกาศโค้ด');
    expect(rejoined?.roomCode).toBe('TEAM-401');
    expect(hasJoinedBattleRoomInStorage('team', 'TEAM-401')).toBe(true);

    // Cancel all team rooms while leaving coding room intact
    clearBattleRoomJoinInStorage('team');
    expect(getJoinedBattleRoomsFromStorage('team')).toHaveLength(0);
    expect(hasJoinedBattleRoomInStorage('coding', '849201')).toBe(true);
  });
});
