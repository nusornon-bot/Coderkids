import { describe, expect, it } from 'vitest';
import {
  normalizeVirtualRoomCode,
  isValidVirtualRoomCode,
  isBuiltInDefaultRoomCode,
  mergeVirtualClassrooms,
  mergeAssignmentsWithSubmissions,
  type VirtualClassroomSubmissionRecord,
} from '../virtualClassroomSync.ts';
import type { ClassroomAssignment, VirtualClassroomRoom } from '../../types/index.ts';

describe('virtualClassroomSync', () => {
  it('normalizes room codes consistently (case-insensitive & trimmed)', () => {
    expect(normalizeVirtualRoomCode('  cs61  ')).toBe('CS61');
    expect(normalizeVirtualRoomCode('cod-2026')).toBe('COD-2026');
    expect(normalizeVirtualRoomCode('')).toBe('');
  });

  it('validates room codes matching Firestore rule pattern ^[A-Z0-9_-]{3,20}$', () => {
    expect(isValidVirtualRoomCode('CS61')).toBe(true);
    expect(isValidVirtualRoomCode('cs61')).toBe(true);
    expect(isValidVirtualRoomCode('COD-2026')).toBe(true);
    expect(isValidVirtualRoomCode('CK_P4_02')).toBe(true);
    expect(isValidVirtualRoomCode('AB')).toBe(false);
    expect(isValidVirtualRoomCode('ห้อง1')).toBe(false);
    expect(isValidVirtualRoomCode('A'.repeat(21))).toBe(false);
  });

  it('identifies built-in default room codes vs custom teacher rooms', () => {
    expect(isBuiltInDefaultRoomCode('cod-2026')).toBe(true);
    expect(isBuiltInDefaultRoomCode('CK-P4-02')).toBe(true);
    expect(isBuiltInDefaultRoomCode('CYBER-401')).toBe(true);
    expect(isBuiltInDefaultRoomCode('CS61')).toBe(false);
  });

  it('merges cloud and local classrooms with cloud precedence and custom rooms first', () => {
    const localRooms: VirtualClassroomRoom[] = [
      {
        id: 'room_1',
        code: 'COD-2026',
        name: 'Default Local Room',
        teacherName: 'ครู A',
        grade: 'ป.4/1',
        school: 'โรงเรียน',
        description: 'local',
        createdAt: 'วันนี้',
        studentsCount: 10,
      },
      {
        id: 'room_local_custom',
        code: 'cs61',
        name: 'Local CS61',
        teacherName: 'ครู B',
        grade: 'ป.6/1',
        school: 'โรงเรียน',
        description: 'stale local',
        createdAt: 'วันนี้',
        studentsCount: 1,
      },
    ];

    const cloudRooms: VirtualClassroomRoom[] = [
      {
        id: 'room_CS61',
        code: 'CS61',
        name: 'cs61',
        teacherName: 'นุสรณ์',
        grade: 'ประถมศึกษาปีที่ 6/1',
        school: 'โรงเรียนอนุบาลนราธิวาส',
        description: 'cloud synced',
        createdAt: 'วันนี้',
        studentsCount: 25,
      },
    ];

    const merged = mergeVirtualClassrooms(localRooms, cloudRooms);
    expect(merged).toHaveLength(2);
    expect(merged[0].code).toBe('CS61');
    expect(merged[0].teacherName).toBe('นุสรณ์');
    expect(merged[0].studentsCount).toBe(25);
    expect(merged[1].code).toBe('COD-2026');
  });

  it('merges assignments with student submissions and teacher grades', () => {
    const assignments: ClassroomAssignment[] = [
      {
        id: 'hw_1',
        title: 'Scratch Maze',
        moduleKey: 'codingLab',
        dueDate: 'ศุกร์นี้',
        teacherNote: 'ทำให้ครบ',
        rewardPoints: 30,
        status: 'pending',
        maxScore: 30,
        targetRoomCode: 'CS61',
      },
      {
        id: 'hw_2',
        title: 'Micro:bit Thermometer',
        moduleKey: 'codingLab',
        dueDate: 'จันทร์หน้า',
        teacherNote: 'ส่งไฟล์ .hex',
        rewardPoints: 40,
        status: 'pending',
        maxScore: 40,
        targetRoomCode: 'CS61',
      },
    ];

    const submissions: VirtualClassroomSubmissionRecord[] = [
      {
        id: 'hw_1__student_1',
        roomCode: 'CS61',
        assignmentId: 'hw_1',
        studentMemberId: 'student_1',
        studentName: 'ด.ช.ต้นกล้า',
        submissionText: 'ส่งแล้วครับ',
        submissionUrl: 'https://scratch.mit.edu/projects/123',
        status: 'graded',
        score: 28,
        teacherFeedback: 'ทำได้ดีมาก',
        submittedAt: '10:30 น.',
      },
    ];

    const merged = mergeAssignmentsWithSubmissions(assignments, submissions);
    expect(merged[0].status).toBe('graded');
    expect(merged[0].score).toBe(28);
    expect(merged[0].teacherFeedback).toBe('ทำได้ดีมาก');
    expect(merged[0].submissionUrl).toBe('https://scratch.mit.edu/projects/123');
    expect(merged[1].status).toBe('pending');
  });
});
