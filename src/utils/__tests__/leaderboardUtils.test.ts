import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry, UserProfile } from '../../types/index.ts';
import {
  buildMergedLeaderboardEntries,
  computePointsGapToTop3,
  filterAndRankLeaderboardEntries,
  getStudentInitial,
} from '../leaderboardUtils.ts';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'stu_1',
    name: 'ด.ช. ภีมพัฒน์ ใจดี',
    nickname: 'ภีม',
    studentId: 'CK-2569-101',
    avatarId: 'avatar_cat',
    avatarEmoji: '🐱',
    school: 'โรงเรียนอนุบาลนราธิวาส',
    grade: 'ประถมศึกษาปีที่ 4/1',
    bio: '',
    joinedDate: '2026-11-01',
    streakDays: 3,
    unlockedRewardIds: [],
    selectedTitle: 'นักคิดรุ่นเยาว์',
    points: 120,
    completedModulesCount: 2,
    role: 'student',
    enrolledClassroomCode: 'COD-2026',
    ...overrides,
  };
}

describe('leaderboardUtils', () => {
  it('extracts student initial safely across Thai prefixes, short names, and empty values', () => {
    expect(getStudentInitial('ด.ช. กวินท์ แสนดี')).toBe('ก');
    expect(getStudentInitial('ด.ญ. นิชา พัฒน์')).toBe('น');
    expect(getStudentInitial('Alex')).toBe('A');
    expect(getStudentInitial('ก')).toBe('ก');
    expect(getStudentInitial('')).toBe('👤');
  });

  it('uses real profile points & completedModulesCount and deduplicates current user against sheet profiles', () => {
    const active = makeProfile({
      id: 'student_peem',
      studentId: 'CK-2569-101',
      name: 'ด.ช. ภีมพัฒน์ ใจดี',
      points: 120,
      completedModulesCount: 2,
    });

    const sheetDuplicate = makeProfile({
      id: 'sheet_stu_1_CK-2569-101',
      studentId: 'CK-2569-101',
      name: 'ด.ช. ภีมพัฒน์ ใจดี',
      points: 95,
      completedModulesCount: 1,
    });

    const peer1 = makeProfile({
      id: 'sheet_stu_2_CK-2569-102',
      studentId: 'CK-2569-102',
      name: 'ด.ญ. กานดา สุขใจ',
      points: 340,
      completedModulesCount: 4,
      streakDays: 5,
    });

    const peer2 = makeProfile({
      id: 'sheet_stu_3_CK-2569-103',
      studentId: 'CK-2569-103',
      name: 'ด.ช. ปกรณ์ กล้าหาญ',
      points: 0,
      completedModulesCount: 0,
      streakDays: 1,
    });

    const admin = makeProfile({
      id: 'admin_teacher',
      role: 'admin',
      name: 'ครูนุสรณ์',
      points: 9999,
    });

    const merged = buildMergedLeaderboardEntries({
      initialEntries: [],
      profile: active,
      profiles: [sheetDuplicate, peer1, peer2, admin],
      currentUserPoints: 250,
      completedModulesCount: 3,
      sortBy: 'points',
    });

    expect(merged).toHaveLength(3);
    expect(merged.map((m) => m.studentId)).toEqual(['CK-2569-102', 'CK-2569-101', 'CK-2569-103']);
    expect(merged[0].points).toBe(340);
    expect(merged[0].completedModules).toBe(4);
    expect(merged[1].points).toBe(250);
    expect(merged[1].isCurrentUser).toBe(true);
    expect(merged[2].points).toBe(0);
    expect(merged[2].completedModules).toBe(0);
  });

  it('filters by period (weekly streak & school/grade room), grade level, classroom, and search query', () => {
    const entries: LeaderboardEntry[] = [
      {
        id: '1',
        studentName: 'ด.ญ. กานดา',
        studentId: '101',
        avatarColor: 'bg-indigo-500',
        grade: 'ประถมศึกษาปีที่ 4/1',
        school: 'โรงเรียนอนุบาลนราธิวาส',
        classroomCode: 'COD-2026',
        badgeTitle: 'A',
        points: 300,
        completedModules: 4,
        streakDays: 4,
      },
      {
        id: '2',
        studentName: 'ด.ช. ธนา',
        studentId: '102',
        avatarColor: 'bg-indigo-500',
        grade: 'ประถมศึกษาปีที่ 5/2',
        school: 'โรงเรียนอนุบาลนราธิวาส',
        classroomCode: 'CK-P4-02',
        badgeTitle: 'B',
        points: 200,
        completedModules: 2,
        streakDays: 1,
      },
      {
        id: '3',
        studentName: 'ด.ช. ภีม',
        studentId: '103',
        avatarColor: 'bg-indigo-600',
        grade: 'ป.4/1',
        school: 'โรงเรียนอนุบาลนราธิวาส',
        classroomCode: 'COD-2026',
        badgeTitle: 'C',
        points: 150,
        completedModules: 2,
        streakDays: 1,
        isCurrentUser: true,
      },
    ];

    const weekly = filterAndRankLeaderboardEntries(entries, {
      selectedGrade: 'all',
      selectedClassroomCode: 'all',
      filterPeriod: 'weekly',
      searchQuery: '',
      currentUserGrade: 'ประถมศึกษาปีที่ 4/1',
      currentUserSchool: 'โรงเรียนอนุบาลนราธิวาส',
    });
    expect(weekly.map((e) => e.id)).toEqual(['1', '3']);
    expect(weekly.map((e) => e.rank)).toEqual([1, 2]);

    const sameRoom = filterAndRankLeaderboardEntries(entries, {
      selectedGrade: 'all',
      selectedClassroomCode: 'all',
      filterPeriod: 'school',
      searchQuery: '',
      currentUserGrade: 'ประถมศึกษาปีที่ 4/1',
      currentUserSchool: 'โรงเรียนอนุบาลนราธิวาส',
    });
    expect(sameRoom.map((e) => e.id)).toEqual(['1', '3']);

    const p5Only = filterAndRankLeaderboardEntries(entries, {
      selectedGrade: 'p5',
      selectedClassroomCode: 'all',
      filterPeriod: 'all',
      searchQuery: '',
    });
    expect(p5Only.map((e) => e.id)).toEqual(['2']);
  });

  it('computes exact points gap to pass Top 3 only when ranked > 3 and sorting by points', () => {
    const top3: LeaderboardEntry = {
      id: '3',
      studentName: 'Top3',
      avatarColor: 'bg-indigo-500',
      grade: 'ป.4/1',
      school: 'School',
      badgeTitle: 'B',
      points: 200,
      completedModules: 3,
    };

    expect(
      computePointsGapToTop3({
        userRank: 4,
        top3,
        currentUserPoints: 185,
        sortBy: 'points',
      })
    ).toBe(16);

    expect(
      computePointsGapToTop3({
        userRank: 4,
        top3: { ...top3, points: 0 },
        currentUserPoints: 0,
        sortBy: 'points',
      })
    ).toBe(1);

    expect(
      computePointsGapToTop3({
        userRank: 2,
        top3,
        currentUserPoints: 250,
        sortBy: 'points',
      })
    ).toBeNull();

    expect(
      computePointsGapToTop3({
        userRank: 4,
        top3,
        currentUserPoints: 185,
        sortBy: 'streak',
      })
    ).toBeNull();
  });
});
