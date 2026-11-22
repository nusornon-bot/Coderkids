import type { ClassroomAssignment, VirtualClassroomRoom } from '../types/index.ts';

export const BUILT_IN_VIRTUAL_ROOM_CODES = ['COD-2026', 'CK-P4-02', 'CYBER-401'] as const;

export function normalizeVirtualRoomCode(raw: string): string {
  return String(raw || '').trim().toUpperCase();
}

export function isValidVirtualRoomCode(raw: string): boolean {
  const clean = normalizeVirtualRoomCode(raw);
  return /^[A-Z0-9_-]{3,20}$/.test(clean);
}

export function isBuiltInDefaultRoomCode(raw: string): boolean {
  const clean = normalizeVirtualRoomCode(raw);
  return (BUILT_IN_VIRTUAL_ROOM_CODES as readonly string[]).includes(clean);
}

export function mergeVirtualClassrooms(
  localRooms: readonly VirtualClassroomRoom[],
  cloudRooms: readonly VirtualClassroomRoom[]
): VirtualClassroomRoom[] {
  const byCode = new Map<string, VirtualClassroomRoom>();

  // Cloud rooms take precedence so cross-device updates override stale local snapshots
  for (const room of cloudRooms) {
    const code = normalizeVirtualRoomCode(room.code);
    if (!code) continue;
    byCode.set(code, { ...room, code });
  }

  for (const room of localRooms) {
    const code = normalizeVirtualRoomCode(room.code);
    if (!code) continue;
    if (!byCode.has(code)) {
      byCode.set(code, { ...room, code });
    }
  }

  const merged = Array.from(byCode.values());
  // Sort custom/cloud non-default rooms before built-in default rooms while keeping relative order
  merged.sort((a, b) => {
    const aBuiltIn = isBuiltInDefaultRoomCode(a.code) ? 1 : 0;
    const bBuiltIn = isBuiltInDefaultRoomCode(b.code) ? 1 : 0;
    if (aBuiltIn !== bBuiltIn) return aBuiltIn - bBuiltIn;
    return 0;
  });
  return merged;
}

export interface VirtualClassroomSubmissionRecord {
  id: string;
  roomCode: string;
  assignmentId: string;
  studentMemberId: string;
  studentName: string;
  submissionText: string;
  submissionUrl?: string;
  submissionFileName?: string;
  status: 'submitted' | 'graded';
  score?: number;
  teacherFeedback?: string;
  submittedAt: string;
}

export function mergeAssignmentsWithSubmissions(
  assignments: readonly ClassroomAssignment[],
  submissions: readonly VirtualClassroomSubmissionRecord[],
  preferLatestSubmissionForTeacher = false
): ClassroomAssignment[] {
  const subMap = new Map<string, VirtualClassroomSubmissionRecord>();
  for (const sub of submissions) {
    if (!subMap.has(sub.assignmentId) || preferLatestSubmissionForTeacher) {
      if (!subMap.has(sub.assignmentId)) {
        subMap.set(sub.assignmentId, sub);
      }
    }
  }

  return assignments.map((assignment) => {
    const matched = subMap.get(assignment.id);
    if (!matched) return assignment;
    return {
      ...assignment,
      status: matched.status,
      submissionDate: matched.submittedAt,
      submissionText: matched.submissionText,
      ...(matched.submissionUrl ? { submissionUrl: matched.submissionUrl } : {}),
      ...(matched.submissionFileName ? { submissionFileName: matched.submissionFileName } : {}),
      ...(typeof matched.score === 'number' ? { score: matched.score } : {}),
      ...(matched.teacherFeedback ? { teacherFeedback: matched.teacherFeedback } : {}),
    };
  });
}
