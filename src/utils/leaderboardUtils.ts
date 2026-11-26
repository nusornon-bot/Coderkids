import type { LeaderboardEntry, UserProfile } from '../types/index.ts';

export type LeaderboardSortBy = 'points' | 'streak' | 'modules';
export type LeaderboardGradeFilter = 'all' | 'p4' | 'p5' | 'p6';
export type LeaderboardPeriodFilter = 'all' | 'weekly' | 'school';

const THAI_PREFIX_RE = /^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง|ครู)\s*/;

export function getStudentInitial(name: string | undefined | null, fallback = '👤'): string {
  const clean = (name || '').trim().replace(THAI_PREFIX_RE, '').trim();
  if (!clean) {
    const raw = (name || '').trim();
    return raw ? Array.from(raw)[0] || fallback : fallback;
  }
  return Array.from(clean)[0] || fallback;
}

export function isStudentProfileRecord(p: UserProfile | null | undefined): p is UserProfile {
  if (!p) return false;
  if (p.role === 'admin') return false;
  if (typeof p.id === 'string' && (p.id.startsWith('admin_') || p.id === 'guest_learner')) {
    return false;
  }
  return Boolean(p.name && p.name.trim().length > 0);
}

function normalizeIdentityKey(entry: {
  id?: string;
  studentId?: string;
  contactEmail?: string;
  studentName?: string;
}): string {
  const sid = (entry.studentId || '').trim().toUpperCase();
  if (sid && sid !== '-' && sid !== 'N/A') {
    return `sid:${sid}`;
  }
  const email = (entry.contactEmail || '').trim().toLowerCase();
  if (email && email.includes('@')) {
    return `email:${email}`;
  }
  const id = (entry.id || '').trim();
  if (id) {
    return `id:${id}`;
  }
  return `name:${(entry.studentName || '').trim().toLowerCase()}`;
}

export function normalizeGradeBucket(grade: string | undefined | null): 'p4' | 'p5' | 'p6' | 'other' {
  const g = (grade || '').toLowerCase();
  if (g.includes('ป.4') || g.includes('ประถมศึกษาปีที่ 4') || /\b4\b/.test(g) || g.includes('4/')) {
    return 'p4';
  }
  if (g.includes('ป.5') || g.includes('ประถมศึกษาปีที่ 5') || /\b5\b/.test(g) || g.includes('5/')) {
    return 'p5';
  }
  if (g.includes('ป.6') || g.includes('ประถมศึกษาปีที่ 6') || /\b6\b/.test(g) || g.includes('6/')) {
    return 'p6';
  }
  return 'other';
}

function normalizeGradeToken(grade: string | undefined | null): string {
  return (grade || '')
    .trim()
    .toLowerCase()
    .replace('ประถมศึกษาปีที่', 'ป.')
    .replace(/\s+/g, '');
}

export function buildMergedLeaderboardEntries(params: {
  initialEntries: readonly LeaderboardEntry[];
  profile: UserProfile;
  profiles: readonly UserProfile[];
  currentUserPoints: number;
  completedModulesCount: number;
  sortBy: LeaderboardSortBy;
}): LeaderboardEntry[] {
  const {
    initialEntries,
    profile,
    profiles,
    currentUserPoints,
    completedModulesCount,
    sortBy,
  } = params;

  const isCurrentStudent = isStudentProfileRecord(profile);

  const userEntry: LeaderboardEntry | null = isCurrentStudent
    ? {
        id: profile.id || 'current_user',
        studentName: profile.name || 'ผู้เรียนปัจจุบัน',
        nickname: profile.nickname || '',
        studentId: profile.studentId || '-',
        avatarColor: 'bg-indigo-600',
        avatarEmoji: profile.avatarEmoji || '🐱',
        grade: profile.grade || 'ประถมศึกษาปีที่ 4/1',
        school: profile.school || 'โรงเรียนอนุบาลนราธิวาส',
        classroomCode: profile.enrolledClassroomCode || 'COD-2026',
        badgeTitle:
          profile.selectedTitle ||
          (completedModulesCount >= 3 ? 'ระดับผู้เชี่ยวชาญ (Master)' : 'กำลังพัฒนาฝีมือ (Rising Star)'),
        points: Math.max(0, Math.round(currentUserPoints || 0)),
        completedModules: Math.max(0, Math.min(4, Math.round(completedModulesCount || 0))),
        streakDays: Math.max(1, Math.round(profile.streakDays || 1)),
        isCurrentUser: true,
      }
    : null;

  const currentUserKey = userEntry
    ? normalizeIdentityKey({
        id: profile.id,
        studentId: profile.studentId,
        contactEmail: profile.contactEmail,
        studentName: profile.name,
      })
    : '';

  const mergedMap = new Map<string, LeaderboardEntry>();

  for (const entry of initialEntries) {
    const key = normalizeIdentityKey({
      id: entry.id,
      studentId: entry.studentId,
      studentName: entry.studentName,
    });
    mergedMap.set(key, {
      ...entry,
      points: Math.max(0, Math.round(entry.points || 0)),
      completedModules: Math.max(0, Math.min(4, Math.round(entry.completedModules || 0))),
    });
  }

  for (const p of profiles) {
    if (!isStudentProfileRecord(p)) continue;
    const key = normalizeIdentityKey({
      id: p.id,
      studentId: p.studentId,
      contactEmail: p.contactEmail,
      studentName: p.name,
    });

    // Skip duplicate profile entry for the active user so live points take precedence
    if (
      isCurrentStudent &&
      (p.id === profile.id ||
        (currentUserKey && key === currentUserKey) ||
        (p.name && profile.name && p.name.trim().toLowerCase() === profile.name.trim().toLowerCase()))
    ) {
      continue;
    }

    const realPoints =
      typeof p.points === 'number' && Number.isFinite(p.points)
        ? Math.max(0, Math.round(p.points))
        : 0;
    const realModules =
      typeof p.completedModulesCount === 'number' && Number.isFinite(p.completedModulesCount)
        ? Math.max(0, Math.min(4, Math.round(p.completedModulesCount)))
        : 0;

    mergedMap.set(key, {
      id: p.id,
      studentName: p.name,
      nickname: p.nickname,
      studentId: p.studentId || '-',
      avatarColor:
        p.themeColor === 'amber'
          ? 'bg-amber-500'
          : p.themeColor === 'emerald'
          ? 'bg-emerald-500'
          : 'bg-indigo-500',
      avatarEmoji: p.avatarEmoji || '🤖',
      grade: p.grade || 'ประถมศึกษาปีที่ 4/1',
      school: p.school || 'โรงเรียนอนุบาลนราธิวาส',
      classroomCode: p.enrolledClassroomCode || 'COD-2026',
      badgeTitle: p.selectedTitle || 'นักคิดสร้างสรรค์',
      points: realPoints,
      completedModules: realModules,
      streakDays: Math.max(1, Math.round(p.streakDays || 1)),
      isCurrentUser: false,
    });
  }

  if (userEntry) {
    mergedMap.set(currentUserKey || userEntry.id, userEntry);
  }

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => {
    if (sortBy === 'streak') {
      return (
        (b.streakDays || 0) - (a.streakDays || 0) ||
        b.points - a.points ||
        b.completedModules - a.completedModules ||
        a.studentName.localeCompare(b.studentName, 'th')
      );
    }
    if (sortBy === 'modules') {
      return (
        b.completedModules - a.completedModules ||
        b.points - a.points ||
        (b.streakDays || 0) - (a.streakDays || 0) ||
        a.studentName.localeCompare(b.studentName, 'th')
      );
    }
    return (
      b.points - a.points ||
      b.completedModules - a.completedModules ||
      (b.streakDays || 0) - (a.streakDays || 0) ||
      a.studentName.localeCompare(b.studentName, 'th')
    );
  });

  return list;
}

export function filterAndRankLeaderboardEntries(
  allEntries: readonly LeaderboardEntry[],
  filters: {
    selectedGrade: LeaderboardGradeFilter;
    selectedClassroomCode: string;
    filterPeriod: LeaderboardPeriodFilter;
    searchQuery: string;
    currentUserGrade?: string;
    currentUserSchool?: string;
  }
): LeaderboardEntry[] {
  const {
    selectedGrade,
    selectedClassroomCode,
    filterPeriod,
    searchQuery,
    currentUserGrade,
    currentUserSchool,
  } = filters;

  const targetGradeToken = normalizeGradeToken(currentUserGrade);
  const targetSchool = (currentUserSchool || '').trim().toLowerCase();
  const hasSpecificRoom = Boolean(
    targetGradeToken && !targetGradeToken.includes('4-6') && !targetGradeToken.includes('กลุ่มสาระ')
  );

  return allEntries
    .filter((item) => {
      if (selectedGrade !== 'all') {
        if (normalizeGradeBucket(item.grade) !== selectedGrade) {
          return false;
        }
      }

      if (selectedClassroomCode !== 'all') {
        if ((item.classroomCode || '').toUpperCase() !== selectedClassroomCode.toUpperCase()) {
          return false;
        }
      }

      if (filterPeriod === 'weekly') {
        if ((item.streakDays || 0) < 2 && !item.isCurrentUser) {
          return false;
        }
      } else if (filterPeriod === 'school') {
        if (hasSpecificRoom) {
          if (normalizeGradeToken(item.grade) !== targetGradeToken && !item.isCurrentUser) {
            return false;
          }
        } else if (targetSchool) {
          if ((item.school || '').trim().toLowerCase() !== targetSchool && !item.isCurrentUser) {
            return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchNick = item.nickname?.toLowerCase().includes(q) || false;
        const matchId = item.studentId?.toLowerCase().includes(q) || false;
        const matchSchool = item.school?.toLowerCase().includes(q) || false;
        if (!matchName && !matchNick && !matchId && !matchSchool) {
          return false;
        }
      }

      return true;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

export function computePointsGapToTop3(params: {
  userRank: number | null;
  top3: LeaderboardEntry | undefined;
  currentUserPoints: number;
  sortBy: LeaderboardSortBy;
}): number | null {
  const { userRank, top3, currentUserPoints, sortBy } = params;
  if (userRank === null || userRank <= 3 || !top3 || sortBy !== 'points') {
    return null;
  }
  const diff = top3.points - currentUserPoints;
  if (diff < 0) return null;
  return diff + 1;
}
