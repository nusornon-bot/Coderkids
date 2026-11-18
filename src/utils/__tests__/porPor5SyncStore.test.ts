import { describe, expect, it } from 'vitest';
import {
  computeGradeLevelFromTotal,
  indicatorFromScore,
  parseGradeAndRoom,
  recalculateFromIndicators,
  recalculateFromModuleScores,
  scoreFromIndicator,
  type PorPor5StudentRecord,
} from '../porPor5SyncStore.ts';

function makeBaseRecord(): PorPor5StudentRecord {
  return {
    id: 'stu_1',
    studentId: '10894',
    name: 'เด็กชายต้นกล้า วิทยาการ',
    nickname: 'ต้นกล้า',
    gradeLevelTag: 'ป.5',
    room: '5/1',
    fullGradeText: 'ป.5/1',
    school: 'โรงเรียนอนุบาลนราธิวาส',
    avatarEmoji: '🐱',
    email: '10894@anubalnara.ac.th',
    points: 120,
    indicator1: 3,
    indicator2: 3,
    indicator3: 3,
    indicator4: 3,
    pdpaScore: 19,
    logicScore: 19,
    codingScore: 23,
    showcaseScore: 15,
    totalScore: 76,
    rubricAvg: 3,
    gradeLevel: 'ดีมาก (3.5)',
    status: 'ผ่านเกณฑ์',
    attendancePercent: 98,
    notes: '',
    isRealStudent: true,
    isCurrentActiveUser: false,
    sourceLabel: 'Test',
    lastUpdated: '10:00',
  };
}

describe('porPor5SyncStore calculation helpers', () => {
  it('normalizes Thai grade strings and room numbers cleanly', () => {
    expect(parseGradeAndRoom('ป.4/2')).toEqual({
      gradeLevelTag: 'ป.4',
      room: '4/2',
      fullGradeText: 'ป.4/2',
    });
    expect(parseGradeAndRoom('ประถมศึกษาปีที่ 5/3')).toEqual({
      gradeLevelTag: 'ป.5',
      room: '5/3',
      fullGradeText: 'ป.5/3',
    });
    expect(parseGradeAndRoom('ป.6')).toEqual({
      gradeLevelTag: 'ป.6',
      room: '6/1',
      fullGradeText: 'ป.6/1',
    });
  });

  it('computes PorPor 5 grade level and indicator mappings accurately', () => {
    expect(computeGradeLevelFromTotal(85)).toBe('ดีเยี่ยม (4)');
    expect(computeGradeLevelFromTotal(76)).toBe('ดีมาก (3.5)');
    expect(computeGradeLevelFromTotal(71)).toBe('ดี (3)');
    expect(computeGradeLevelFromTotal(55)).toBe('ผ่านเกณฑ์ (2)');
    expect(computeGradeLevelFromTotal(42)).toBe('ควรปรับปรุง (1)');

    expect(indicatorFromScore(22, 25)).toBe(4);
    expect(scoreFromIndicator(4, 25)).toBe(23);
  });

  it('recalculates total scores and status when indicators or module scores change', () => {
    const base = makeBaseRecord();

    const upgraded = recalculateFromIndicators(base, {
      indicator1: 4,
      indicator2: 4,
      indicator3: 4,
      indicator4: 4,
    });
    expect(upgraded.totalScore).toBeGreaterThanOrEqual(90);
    expect(upgraded.rubricAvg).toBe(4);
    expect(upgraded.gradeLevel).toBe('ดีเยี่ยม (4)');
    expect(upgraded.status).toBe('ผ่านเกณฑ์');

    const failed = recalculateFromModuleScores(base, {
      pdpaScore: 10,
      logicScore: 10,
      codingScore: 12,
      showcaseScore: 8,
    });
    expect(failed.totalScore).toBe(40);
    expect(failed.gradeLevel).toBe('ควรปรับปรุง (1)');
    expect(failed.status).toBe('ปรับปรุง');
  });
});
