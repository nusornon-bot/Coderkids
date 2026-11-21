export type BattleArenaMode = 'coding' | 'onet' | 'team';

export interface JoinedBattleRoomRecord {
  mode: BattleArenaMode;
  roomCode: string;
  joinedAt: number;
  participantName?: string;
}

export const JOINED_BATTLE_ROOMS_STORAGE_KEY = 'coderkids_battle_joined_rooms_v1';

export function normalizeBattleRoomCode(roomCode: string): string {
  return String(roomCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

function buildRecordKey(mode: BattleArenaMode, normalizedCode: string): string {
  return `${mode}:${normalizedCode}`;
}

function readJoinedRoomsMap(): Record<string, JoinedBattleRoomRecord> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(JOINED_BATTLE_ROOMS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, JoinedBattleRoomRecord>;
  } catch {
    return {};
  }
}

function writeJoinedRoomsMap(map: Record<string, JoinedBattleRoomRecord>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(JOINED_BATTLE_ROOMS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota or private-browsing errors
  }
}

/**
 * Checks LocalStorage to determine whether this browser/session has already joined
 * a specific Battle Room Code for the given arena mode.
 */
export function hasJoinedBattleRoomInStorage(
  mode: BattleArenaMode,
  roomCode: string
): boolean {
  const normalized = normalizeBattleRoomCode(roomCode);
  if (!normalized) return false;
  const map = readJoinedRoomsMap();
  return Boolean(map[buildRecordKey(mode, normalized)]);
}

/**
 * Records a joined Battle Room Code in LocalStorage so duplicate joins are blocked
 * to prevent score farming / cheating within the same room.
 */
export function markBattleRoomJoinedInStorage(
  mode: BattleArenaMode,
  roomCode: string,
  participantName?: string
): JoinedBattleRoomRecord | null {
  const normalized = normalizeBattleRoomCode(roomCode);
  if (!normalized) return null;

  const map = readJoinedRoomsMap();
  const key = buildRecordKey(mode, normalized);
  const existing = map[key];
  if (existing) {
    return existing;
  }

  const record: JoinedBattleRoomRecord = {
    mode,
    roomCode: normalized,
    joinedAt: Date.now(),
    ...(participantName && participantName.trim()
      ? { participantName: participantName.trim().slice(0, 120) }
      : {}),
  };

  map[key] = record;

  // Keep storage bounded to the 100 most recent joined rooms
  const entries = Object.entries(map);
  if (entries.length > 100) {
    entries.sort((a, b) => (b[1]?.joinedAt || 0) - (a[1]?.joinedAt || 0));
    const trimmed = Object.fromEntries(entries.slice(0, 100));
    writeJoinedRoomsMap(trimmed);
  } else {
    writeJoinedRoomsMap(map);
  }

  return record;
}

export function getJoinedBattleRoomsFromStorage(
  mode?: BattleArenaMode
): JoinedBattleRoomRecord[] {
  const map = readJoinedRoomsMap();
  const all = Object.values(map).filter(
    (rec): rec is JoinedBattleRoomRecord =>
      Boolean(rec && typeof rec.roomCode === 'string' && typeof rec.mode === 'string')
  );
  const filtered = mode ? all.filter((r) => r.mode === mode) : all;
  return filtered.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
}

/**
 * Removes a specific room (or all rooms for a given mode) from LocalStorage
 * so a user can cancel their join and re-join a different or corrected room.
 */
export function clearBattleRoomJoinInStorage(
  mode: BattleArenaMode,
  roomCode?: string
): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const map = readJoinedRoomsMap();
    const normalized = roomCode ? normalizeBattleRoomCode(roomCode) : '';

    if (normalized) {
      delete map[buildRecordKey(mode, normalized)];
    } else {
      for (const key of Object.keys(map)) {
        if (key.startsWith(`${mode}:`)) {
          delete map[key];
        }
      }
    }

    if (Object.keys(map).length === 0) {
      localStorage.removeItem(JOINED_BATTLE_ROOMS_STORAGE_KEY);
    } else {
      writeJoinedRoomsMap(map);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getDuplicateJoinAlertMessage(
  roomCode?: string,
  includeAntiCheatHint: boolean = true
): string {
  const normalized = roomCode ? normalizeBattleRoomCode(roomCode) : '';
  if (!includeAntiCheatHint) {
    return 'คุณได้เข้าร่วมห้องนี้แล้ว';
  }
  if (normalized) {
    return `คุณได้เข้าร่วมห้องนี้แล้ว (รหัสห้อง ${normalized}) ไม่สามารถเข้าร่วมห้องเรียนซ้ำได้เพื่อป้องกันการโกงคะแนน กรุณารอรหัสห้องใหม่จากคุณครู`;
  }
  return 'คุณได้เข้าร่วมห้องนี้แล้ว ไม่สามารถเข้าร่วมห้องเรียนซ้ำได้เพื่อป้องกันการโกงคะแนน';
}
