import { describe, it, expect } from 'vitest';
import { PorPor5StudentRecord } from '../porPor5SyncStore';
import {
  buildClassroomStatsCsv,
  computeClassroomStats,
  evaluateStudentSupportStatus,
} from '../classroomStatsAnalytics';

function makeStudent(overrides: Partial<PorPor5StudentRecord>): PorPor5StudentRecord {
  return {
    id: 'st_1',
    studentId: 'CK-001',
    name: 'เด็กชายทดสอบ ใจดี',
    nickname: 'ทดสอบ',
    gradeLevelTag: 'ป.5',
    room: '5/1',
    fullGradeText: 'ป.5/1',
    school: 'โรงเรียนอนุบาลนราธิวาส',
    avatarEmoji: '🐱',
    email: 'test@example.com',
    points: 200,
    indicator1: 3,
    indicator2: 3,
    indicator3: 3,
    indicator4: 3,
    pdpaScore: 20,
    logicScore: 20,
    codingScore: 24,
    showcaseScore: 16,
    totalScore: 80,
    rubricAvg: 3.0,
    gradeLevel: 'ดีเยี่ยม (4)',
    status: 'ผ่านเกณฑ์',
    attendancePercent: 95,
    notes: '',
    isRealStudent: true,
    isCurrentActiveUser: false,
    sourceLabel: 'Cloud',
    lastUpdated: '10:00',
    ...overrides,
  };
}

describe('classroomStatsAnalytics', () => {
  it('handles empty student roster safely', () => {
    const overview = computeClassroomStats([]);
    expect(overview.totalStudents).toBe(0);
    expect(overview.averageTotalScore).toBe(0);
    expect(overview.overallModuleProgressPercent).toBe(0);
    expect(overview.needsSupportStudents).toHaveLength(0);
    expect(overview.moduleSummaries).toHaveLength(4);
  });

  it('classifies urgent, watch, and on-track students accurately', () => {
    const highPerformer = makeStudent({ id: 's1', name: 'ต้นกล้า', totalScore: 88 });
    const watchStudent = makeStudent({
      id: 's2',
      name: 'น้ำฝน',
      codingScore: 14, // 47% (< 60%)
      totalScore: 66,
      indicator2: 2,
      gradeLevel: 'ผ่านเกณฑ์ (2)',
    });
    const urgentStudent = makeStudent({
      id: 's3',
      name: 'ภูมิใจ',
      pdpaScore: 10,
      logicScore: 10,
      codingScore: 12,
      showcaseScore: 10,
      totalScore: 42,
      indicator1: 1,
      indicator2: 1,
      rubricAvg: 1.5,
      gradeLevel: 'ควรปรับปรุง (1)',
      status: 'ปรับปรุง',
      attendancePercent: 70,
    });

    expect(evaluateStudentSupportStatus(highPerformer).supportPriority).toBe('on_track');

    const watchEval = evaluateStudentSupportStatus(watchStudent);
    expect(watchEval.supportPriority).toBe('watch');
    expect(watchEval.weakestModule.key).toBe('coding');

    const urgentEval = evaluateStudentSupportStatus(urgentStudent);
    expect(urgentEval.supportPriority).toBe('urgent');
    expect(urgentEval.alertReasons.length).toBeGreaterThanOrEqual(3);

    const overview = computeClassroomStats([highPerformer, watchStudent, urgentStudent]);
    expect(overview.totalStudents).toBe(3);
    expect(overview.averageTotalScore).toBeCloseTo((88 + 66 + 42) / 3, 1);
    expect(overview.urgentCount).toBe(1);
    expect(overview.watchCount).toBe(1);
    expect(overview.needsSupportStudents.map((r) => r.student.id)).toEqual(['s3', 's2']);
    expect(overview.topPerformers[0].student.id).toBe('s1');
  });

  it('generates properly escaped CSV with headers and support status', () => {
    const row = evaluateStudentSupportStatus(
      makeStudent({ id: 's9', name: 'เด็กหญิง, ดาว', totalScore: 48, status: 'ปรับปรุง' })
    );
    const csv = buildClassroomStatsCsv([row]);
    expect(csv).toContain('รหัสนักเรียน,ชื่อ-นามสกุล');
    expect(csv).toContain('"เด็กหญิง, ดาว"');
    expect(csv).toContain('ดูแลเร่งด่วน');
  });
});
