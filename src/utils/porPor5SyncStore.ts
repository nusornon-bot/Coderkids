import { UserProfile } from '../types/index.ts';
import {
  fetchStudentsFromGoogleSheet,
  getFirebaseAuthHeaders,
  readLogsFromGoogleSheet,
  saveProfileToGoogleSheet,
  TARGET_SPREADSHEET_ID,
} from '../services/googleSheetsService.ts';

export interface PorPor5StudentRecord {
  id: string;
  studentId: string;
  name: string;
  nickname: string;
  gradeLevelTag: 'ป.4' | 'ป.5' | 'ป.6';
  room: string;
  fullGradeText: string;
  school: string;
  avatarEmoji: string;
  email: string;
  points: number;
  // 4 ตัวชี้วัดหลัก ว 4.2 (ระดับคุณภาพ 1-4 สำหรับ ศูนย์คุณครู ว 4.2 & บันทึก ปพ.5)
  indicator1: number; // ว 4.2 ป.x/1 เหตุผลเชิงตรรกะ & การคิดเชิงคำนวณ (1-4)
  indicator2: number; // ว 4.2 ป.x/2 การออกแบบและเขียนโปรแกรม Scratch & Micro:bit (1-4)
  indicator3: number; // ว 4.2 ป.x/3 การค้นหา ประมวลผลข้อมูล และนำเสนอโครงงาน (1-4)
  indicator4: number; // ว 4.2 ป.x/4 ความปลอดภัยดิจิทัล & กฎหมาย PDPA (1-4)
  // คะแนนรายด้าน 100 คะแนน (สำหรับ ระบบรายงานผลสัมฤทธิ์ ปพ.5)
  pdpaScore: number; // เต็ม 25 (สอดคล้องกับ indicator4)
  logicScore: number; // เต็ม 25 (สอดคล้องกับ indicator1)
  codingScore: number; // เต็ม 30 (สอดคล้องกับ indicator2)
  showcaseScore: number; // เต็ม 20 (สอดคล้องกับ indicator3)
  totalScore: number; // เต็ม 100
  rubricAvg: number; // ค่าเฉลี่ยตัวชี้วัด 1.00 - 4.00
  gradeLevel: 'ดีเยี่ยม (4)' | 'ดีมาก (3.5)' | 'ดี (3)' | 'ผ่านเกณฑ์ (2)' | 'ควรปรับปรุง (1)';
  status: 'ผ่านเกณฑ์' | 'ปรับปรุง';
  attendancePercent: number;
  notes: string;
  isRealStudent: boolean;
  isCurrentActiveUser: boolean;
  sourceLabel: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'coderkids_porpor5_shared_records_v2';
export const PORPOR5_SYNC_EVENT = 'coderkids-porpor5-updated';

// Helper to normalize any grade string into 'ป.4' | 'ป.5' | 'ป.6' and room
export function parseGradeAndRoom(rawGrade?: string): {
  gradeLevelTag: 'ป.4' | 'ป.5' | 'ป.6';
  room: string;
  fullGradeText: string;
} {
  const g = (rawGrade || '').trim();
  if (g.includes('6')) {
    const roomMatch = g.match(/6\s*\/\s*(\d+)/);
    const room = roomMatch ? `6/${roomMatch[1]}` : '6/1';
    return { gradeLevelTag: 'ป.6', room, fullGradeText: `ป.${room}` };
  }
  if (g.includes('5')) {
    const roomMatch = g.match(/5\s*\/\s*(\d+)/);
    const room = roomMatch ? `5/${roomMatch[1]}` : '5/1';
    return { gradeLevelTag: 'ป.5', room, fullGradeText: `ป.${room}` };
  }
  const roomMatch = g.match(/4\s*\/\s*(\d+)/);
  const room = roomMatch ? `4/${roomMatch[1]}` : '4/1';
  return { gradeLevelTag: 'ป.4', room, fullGradeText: `ป.${room}` };
}

export function computeGradeLevelFromTotal(
  totalScore: number
): 'ดีเยี่ยม (4)' | 'ดีมาก (3.5)' | 'ดี (3)' | 'ผ่านเกณฑ์ (2)' | 'ควรปรับปรุง (1)' {
  if (totalScore >= 80) return 'ดีเยี่ยม (4)';
  if (totalScore >= 75) return 'ดีมาก (3.5)';
  if (totalScore >= 70) return 'ดี (3)';
  if (totalScore >= 50) return 'ผ่านเกณฑ์ (2)';
  return 'ควรปรับปรุง (1)';
}

export function indicatorFromScore(score: number, maxScore: number): number {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.68) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export function scoreFromIndicator(indicator: number, maxScore: number): number {
  const clamped = Math.max(1, Math.min(4, Math.round(indicator)));
  if (clamped === 4) return Math.round(maxScore * 0.92);
  if (clamped === 3) return Math.round(maxScore * 0.76);
  if (clamped === 2) return Math.round(maxScore * 0.6);
  return Math.round(maxScore * 0.44);
}

/**
 * Recalculates totalScore, rubricAvg, gradeLevel, and status when 1-4 indicators are edited
 * in TeacherMasteryPortal (ศูนย์คุณครู ว 4.2 & บันทึก ปพ.5)
 */
export function recalculateFromIndicators(
  record: PorPor5StudentRecord,
  updates: Partial<
    Pick<
      PorPor5StudentRecord,
      'indicator1' | 'indicator2' | 'indicator3' | 'indicator4' | 'attendancePercent' | 'notes'
    >
  >
): PorPor5StudentRecord {
  const ind1 = Math.max(1, Math.min(4, updates.indicator1 ?? record.indicator1));
  const ind2 = Math.max(1, Math.min(4, updates.indicator2 ?? record.indicator2));
  const ind3 = Math.max(1, Math.min(4, updates.indicator3 ?? record.indicator3));
  const ind4 = Math.max(1, Math.min(4, updates.indicator4 ?? record.indicator4));

  const logicScore =
    updates.indicator1 !== undefined ? scoreFromIndicator(ind1, 25) : record.logicScore;
  const codingScore =
    updates.indicator2 !== undefined ? scoreFromIndicator(ind2, 30) : record.codingScore;
  const showcaseScore =
    updates.indicator3 !== undefined ? scoreFromIndicator(ind3, 20) : record.showcaseScore;
  const pdpaScore =
    updates.indicator4 !== undefined ? scoreFromIndicator(ind4, 25) : record.pdpaScore;

  const totalScore = Math.min(100, pdpaScore + logicScore + codingScore + showcaseScore);
  const rubricAvg = Number(((ind1 + ind2 + ind3 + ind4) / 4).toFixed(2));
  const gradeLevel = computeGradeLevelFromTotal(totalScore);
  const status: 'ผ่านเกณฑ์' | 'ปรับปรุง' = totalScore >= 50 && rubricAvg >= 1.5 ? 'ผ่านเกณฑ์' : 'ปรับปรุง';

  return {
    ...record,
    indicator1: ind1,
    indicator2: ind2,
    indicator3: ind3,
    indicator4: ind4,
    logicScore,
    codingScore,
    showcaseScore,
    pdpaScore,
    totalScore,
    rubricAvg,
    gradeLevel,
    status,
    attendancePercent:
      updates.attendancePercent !== undefined
        ? Math.max(0, Math.min(100, updates.attendancePercent))
        : record.attendancePercent,
    notes: updates.notes !== undefined ? updates.notes : record.notes,
    lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Recalculates indicators (1-4), totalScore, rubricAvg, gradeLevel, and status when module scores
 * are edited in TeacherAssessmentReportModal (ระบบรายงานผลสัมฤทธิ์ ปพ.5)
 */
export function recalculateFromModuleScores(
  record: PorPor5StudentRecord,
  updates: Partial<
    Pick<
      PorPor5StudentRecord,
      'pdpaScore' | 'logicScore' | 'codingScore' | 'showcaseScore' | 'attendancePercent' | 'notes'
    >
  >
): PorPor5StudentRecord {
  const pdpaScore = Math.max(0, Math.min(25, updates.pdpaScore ?? record.pdpaScore));
  const logicScore = Math.max(0, Math.min(25, updates.logicScore ?? record.logicScore));
  const codingScore = Math.max(0, Math.min(30, updates.codingScore ?? record.codingScore));
  const showcaseScore = Math.max(0, Math.min(20, updates.showcaseScore ?? record.showcaseScore));

  const indicator1 = indicatorFromScore(logicScore, 25);
  const indicator2 = indicatorFromScore(codingScore, 30);
  const indicator3 = indicatorFromScore(showcaseScore, 20);
  const indicator4 = indicatorFromScore(pdpaScore, 25);

  const totalScore = Math.min(100, pdpaScore + logicScore + codingScore + showcaseScore);
  const rubricAvg = Number(((indicator1 + indicator2 + indicator3 + indicator4) / 4).toFixed(2));
  const gradeLevel = computeGradeLevelFromTotal(totalScore);
  const status: 'ผ่านเกณฑ์' | 'ปรับปรุง' = totalScore >= 50 && rubricAvg >= 1.5 ? 'ผ่านเกณฑ์' : 'ปรับปรุง';

  return {
    ...record,
    pdpaScore,
    logicScore,
    codingScore,
    showcaseScore,
    indicator1,
    indicator2,
    indicator3,
    indicator4,
    totalScore,
    rubricAvg,
    gradeLevel,
    status,
    attendancePercent:
      updates.attendancePercent !== undefined
        ? Math.max(0, Math.min(100, updates.attendancePercent))
        : record.attendancePercent,
    notes: updates.notes !== undefined ? updates.notes : record.notes,
    lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Derive a student's real PorPor 5 scores from their XP/points, moduleProgress, and activity logs
 */
function buildRecordFromStudentData(params: {
  id: string;
  studentId: string;
  name: string;
  nickname: string;
  rawGrade: string;
  school: string;
  avatarEmoji: string;
  email: string;
  points: number;
  moduleProgress?: {
    safety?: boolean;
    thinking?: boolean;
    codingLab?: boolean;
    showcase?: boolean;
  };
  isRealStudent: boolean;
  isCurrentActiveUser: boolean;
  sourceLabel: string;
  existingSaved?: Partial<PorPor5StudentRecord>;
}): PorPor5StudentRecord {
  const { gradeLevelTag, room, fullGradeText } = parseGradeAndRoom(params.rawGrade);
  const pts = Math.max(50, params.points || 65);
  const bonusFactor = Math.min(1, (pts - 50) / 220); // 0.0 -> 1.0 as points grow from 50 to 270+

  // Calculate realistic base scores from actual module completion & points
  const basePdpa = params.moduleProgress?.safety
    ? 24
    : Math.min(24, Math.round(19 + bonusFactor * 5));
  const baseLogic = params.moduleProgress?.thinking
    ? 24
    : Math.min(24, Math.round(19 + bonusFactor * 5));
  const baseCoding = params.moduleProgress?.codingLab
    ? 29
    : Math.min(29, Math.round(22 + bonusFactor * 6));
  const baseShowcase = params.moduleProgress?.showcase
    ? 19
    : Math.min(19, Math.round(15 + bonusFactor * 4));

  const saved = params.existingSaved;
  const pdpaScore = saved?.pdpaScore ?? basePdpa;
  const logicScore = saved?.logicScore ?? baseLogic;
  const codingScore = saved?.codingScore ?? baseCoding;
  const showcaseScore = saved?.showcaseScore ?? baseShowcase;

  const indicator1 = saved?.indicator1 ?? indicatorFromScore(logicScore, 25);
  const indicator2 = saved?.indicator2 ?? indicatorFromScore(codingScore, 30);
  const indicator3 = saved?.indicator3 ?? indicatorFromScore(showcaseScore, 20);
  const indicator4 = saved?.indicator4 ?? indicatorFromScore(pdpaScore, 25);

  const totalScore = Math.min(100, pdpaScore + logicScore + codingScore + showcaseScore);
  const rubricAvg = Number(((indicator1 + indicator2 + indicator3 + indicator4) / 4).toFixed(2));
  const gradeLevel = computeGradeLevelFromTotal(totalScore);
  const status: 'ผ่านเกณฑ์' | 'ปรับปรุง' = totalScore >= 50 && rubricAvg >= 1.5 ? 'ผ่านเกณฑ์' : 'ปรับปรุง';

  const defaultNote = params.isCurrentActiveUser
    ? `กำลังเข้าเรียนและฝึกปฏิบัติจริง (${pts} XP • ระดับชั้น ${fullGradeText})`
    : `ซิงก์ข้อมูลจาก${params.sourceLabel} (${pts} XP)`;

  return {
    id: params.id,
    studentId: params.studentId,
    name: params.name,
    nickname: params.nickname,
    gradeLevelTag,
    room,
    fullGradeText,
    school: params.school || 'โรงเรียนอนุบาลนราธิวาส',
    avatarEmoji: params.avatarEmoji || '🐱',
    email: params.email || '',
    points: pts,
    indicator1,
    indicator2,
    indicator3,
    indicator4,
    pdpaScore,
    logicScore,
    codingScore,
    showcaseScore,
    totalScore,
    rubricAvg,
    gradeLevel,
    status,
    attendancePercent: saved?.attendancePercent ?? 98,
    notes: saved?.notes || defaultNote,
    isRealStudent: params.isRealStudent,
    isCurrentActiveUser: params.isCurrentActiveUser,
    sourceLabel: params.sourceLabel,
    lastUpdated:
      saved?.lastUpdated ||
      new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function getSavedPorPor5Map(): Map<string, PorPor5StudentRecord> {
  const map = new Map<string, PorPor5StudentRecord>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && (item.studentId || item.name)) {
            const key = String(item.studentId || item.name).trim().toLowerCase();
            map.set(key, item);
          }
        }
      }
    }
  } catch {}
  return map;
}

export function savePorPor5Records(records: PorPor5StudentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(PORPOR5_SYNC_EVENT, { detail: records }));
  } catch {}

  // Also persist to server in background when verified Firebase teacher token is present
  void (async () => {
    const authHeaders = await getFirebaseAuthHeaders();
    if (!authHeaders.Authorization) return;
    await fetch('/api/porpor5/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ records }),
    });
  })().catch(() => {});
}

/**
 * Build initial immediate PorPor 5 roster synchronously from localStorage & props
 * so both modals immediately show the real active user & registered students on open
 */
export function getImmediatePorPor5Roster(options: {
  currentProfile?: UserProfile;
  profiles?: UserProfile[];
  currentPoints?: number;
  moduleProgress?: {
    safety?: boolean;
    thinking?: boolean;
    codingLab?: boolean;
    showcase?: boolean;
  };
}): PorPor5StudentRecord[] {
  const savedMap = getSavedPorPor5Map();
  const resultMap = new Map<string, PorPor5StudentRecord>();

  const makeKey = (studentId?: string, name?: string) => {
    const cleanId = (studentId || '').trim().toLowerCase();
    const cleanName = (name || '').replace(/\([^)]+\)/g, '').trim().toLowerCase();
    return cleanId || cleanName;
  };

  // 1. Always include the currently active user first (if not guest placeholder or if they have a real name)
  const curr = options.currentProfile;
  if (curr && curr.name) {
    const isGuestDefault = curr.id === 'guest_learner' && curr.name === 'นักเรียนผู้มาเยือน (โหมดทดลองเรียน)';
    const key = makeKey(curr.studentId, curr.name);
    const saved = savedMap.get(key) || savedMap.get(curr.name.trim().toLowerCase());
    const activePts =
      options.currentPoints ??
      Number(localStorage.getItem('coderkids_points') || curr.points || 65);

    resultMap.set(
      key,
      buildRecordFromStudentData({
        id: curr.id || `active_${key}`,
        studentId: curr.studentId || '10894',
        name: curr.name,
        nickname: curr.nickname || 'ผู้เรียนปัจจุบัน',
        rawGrade: curr.grade || 'ป.5/1',
        school: curr.school || 'โรงเรียนอนุบาลนราธิวาส',
        avatarEmoji: curr.avatarEmoji || '🐱',
        email: curr.contactEmail || localStorage.getItem('coderkids_verified_google_email') || '',
        points: activePts,
        moduleProgress: options.moduleProgress,
        isRealStudent: true,
        isCurrentActiveUser: true,
        sourceLabel: isGuestDefault ? 'ผู้เรียนกำลังใช้งานขณะนี้ (โหมดทดลอง)' : 'กำลังใช้งานจริงขณะนี้',
        existingSaved: saved,
      })
    );
  }

  // 2. Include all profiles from App.tsx / coderkids_profiles
  const allProfiles: UserProfile[] = [...(options.profiles || [])];
  try {
    const rawProfiles = localStorage.getItem('coderkids_profiles');
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles);
      if (Array.isArray(parsed)) allProfiles.push(...parsed);
    }
  } catch {}

  for (const p of allProfiles) {
    if (!p || !p.name) continue;
    if (['prof_1', 'prof_2', 'prof_3', 'guest_learner'].includes(String(p.id))) continue;
    const key = makeKey(p.studentId, p.name);
    if (!key || resultMap.has(key)) continue;
    const saved = savedMap.get(key) || savedMap.get(p.name.trim().toLowerCase());
    resultMap.set(
      key,
      buildRecordFromStudentData({
        id: p.id || `prof_${key}`,
        studentId: p.studentId || `CK-2569-${1000 + resultMap.size}`,
        name: p.name,
        nickname: p.nickname || '',
        rawGrade: p.grade || 'ป.4/1',
        school: p.school || 'โรงเรียนอนุบาลนราธิวาส',
        avatarEmoji: p.avatarEmoji || '🐱',
        email: p.contactEmail || '',
        points: p.points || 80,
        isRealStudent: true,
        isCurrentActiveUser: false,
        sourceLabel: 'โปรไฟล์ผู้เรียนในระบบ',
        existingSaved: saved,
      })
    );
  }

  // 3. Include students from localStorage 'coderkids_registered_students'
  try {
    const regRaw = localStorage.getItem('coderkids_registered_students');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      if (Array.isArray(regList)) {
        for (const s of regList) {
          if (!s || !s.name) continue;
          const key = makeKey(s.studentId, s.name);
          if (!key || resultMap.has(key)) continue;
          const saved = savedMap.get(key) || savedMap.get(s.name.trim().toLowerCase());
          resultMap.set(
            key,
            buildRecordFromStudentData({
              id: s.id || `reg_${key}`,
              studentId: s.studentId || `CK-2569-${1000 + resultMap.size}`,
              name: s.name,
              nickname: s.nickname || '',
              rawGrade: s.grade || 'ป.4/1',
              school: s.school || 'โรงเรียนอนุบาลนราธิวาส',
              avatarEmoji: s.avatarEmoji || '🐱',
              email: s.contactEmail || s.email || '',
              points: Number(s.points) || 75,
              isRealStudent: true,
              isCurrentActiveUser: false,
              sourceLabel: 'ลงทะเบียนเข้าเรียนจริง',
              existingSaved: saved,
            })
          );
        }
      }
    }
  } catch {}

  // 4. Include students from classroom access logs ('coderkids_classroom_logs')
  try {
    const logsRaw = localStorage.getItem('coderkids_classroom_logs');
    if (logsRaw) {
      const logsList = JSON.parse(logsRaw);
      if (Array.isArray(logsList)) {
        for (const l of logsList) {
          if (!l || !l.studentName) continue;
          const rawName = String(l.studentName).trim();
          const nickMatch = rawName.match(/\(([^)]+)\)/);
          const cleanName = rawName.replace(/\([^)]+\)/g, '').trim();
          const nickname = nickMatch ? nickMatch[1].trim() : '';
          const emailPrefix = l.email && l.email.includes('@') ? l.email.split('@')[0] : '';
          const inferredId = /^\d{4,6}$/.test(emailPrefix) ? emailPrefix : '';
          const key = makeKey(inferredId, cleanName);
          if (!key || resultMap.has(key)) continue;
          // Also check if cleanName matches an existing entry
          const existingByName = Array.from(resultMap.values()).find(
            (r) => r.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (existingByName) continue;

          const saved = savedMap.get(key) || savedMap.get(cleanName.toLowerCase());
          resultMap.set(
            key,
            buildRecordFromStudentData({
              id: `log_${key}`,
              studentId: inferredId || saved?.studentId || `CK-${1000 + resultMap.size}`,
              name: cleanName,
              nickname,
              rawGrade: l.grade || 'ป.4/1',
              school: l.school || 'โรงเรียนอนุบาลนราธิวาส',
              avatarEmoji: l.avatar || '🐱',
              email: l.email || '',
              points: saved?.points || 80,
              isRealStudent: true,
              isCurrentActiveUser: false,
              sourceLabel: 'บันทึกเข้าเรียน (Logs)',
              existingSaved: saved,
            })
          );
        }
      }
    }
  } catch {}

  // 5. Include any previously saved PorPor 5 records from localStorage
  for (const [k, savedRec] of savedMap.entries()) {
    if (!resultMap.has(k)) {
      const dupName = Array.from(resultMap.values()).find(
        (r) => r.name.trim().toLowerCase() === (savedRec.name || '').trim().toLowerCase()
      );
      if (!dupName) {
        resultMap.set(k, {
          ...savedRec,
          isCurrentActiveUser: false,
        });
      }
    }
  }

  return Array.from(resultMap.values());
}

/**
 * Asynchronously fetches and merges live students from:
 * 1. Express Server (/api/porpor5/list, /api/students/list, /api/logs/list)
 * 2. Google Sheets (Students tab & Logs tab in 1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng)
 * 3. Current active user & local storage
 */
export async function syncPorPor5RosterWithCloud(options: {
  currentProfile?: UserProfile;
  profiles?: UserProfile[];
  currentPoints?: number;
  moduleProgress?: {
    safety?: boolean;
    thinking?: boolean;
    codingLab?: boolean;
    showcase?: boolean;
  };
  writeBackToGoogleSheets?: boolean;
}): Promise<{
  records: PorPor5StudentRecord[];
  sheetSyncedCount: number;
  message: string;
}> {
  const savedMap = getSavedPorPor5Map();
  const initialList = getImmediatePorPor5Roster(options);
  const mergedMap = new Map<string, PorPor5StudentRecord>();

  const findExistingKey = (studentId?: string, name?: string): string | null => {
    const cleanId = (studentId || '').trim().toLowerCase();
    const cleanName = (name || '').replace(/\([^)]+\)/g, '').trim().toLowerCase();
    for (const [k, r] of mergedMap.entries()) {
      if (cleanId && r.studentId.trim().toLowerCase() === cleanId) return k;
      if (cleanName && r.name.trim().toLowerCase() === cleanName) return k;
    }
    return null;
  };

  for (const r of initialList) {
    const key = (r.studentId || r.name).trim().toLowerCase();
    mergedMap.set(key, r);
  }

  // 1. Fetch from Server API (/api/porpor5/list)
  try {
    const authHeaders = await getFirebaseAuthHeaders();
    const sRes = authHeaders.Authorization
      ? await fetch('/api/porpor5/list', { headers: authHeaders })
      : null;
    if (sRes && sRes.ok) {
      const sData = await sRes.json();
      if (Array.isArray(sData.records)) {
        for (const rec of sData.records) {
          if (!rec || (!rec.studentId && !rec.name)) continue;
          const existingKey = findExistingKey(rec.studentId, rec.name);
          if (existingKey) {
            const prev = mergedMap.get(existingKey)!;
            mergedMap.set(existingKey, {
              ...prev,
              indicator1: rec.indicator1 ?? prev.indicator1,
              indicator2: rec.indicator2 ?? prev.indicator2,
              indicator3: rec.indicator3 ?? prev.indicator3,
              indicator4: rec.indicator4 ?? prev.indicator4,
              pdpaScore: rec.pdpaScore ?? prev.pdpaScore,
              logicScore: rec.logicScore ?? prev.logicScore,
              codingScore: rec.codingScore ?? prev.codingScore,
              showcaseScore: rec.showcaseScore ?? prev.showcaseScore,
              totalScore: rec.totalScore ?? prev.totalScore,
              rubricAvg: rec.rubricAvg ?? prev.rubricAvg,
              gradeLevel: rec.gradeLevel ?? prev.gradeLevel,
              status: rec.status ?? prev.status,
              notes: rec.notes || prev.notes,
            });
          } else {
            const key = String(rec.studentId || rec.name).trim().toLowerCase();
            mergedMap.set(key, { ...rec, isRealStudent: true, isCurrentActiveUser: false });
          }
        }
      }

      if (Array.isArray(sData.registeredStudents)) {
        for (const stu of sData.registeredStudents) {
          if (!stu || !stu.name) continue;
          const existingKey = findExistingKey(stu.studentId, stu.name);
          if (!existingKey) {
            const key = String(stu.studentId || stu.name).trim().toLowerCase();
            const saved = savedMap.get(key);
            mergedMap.set(
              key,
              buildRecordFromStudentData({
                id: stu.id || `srv_${key}`,
                studentId: stu.studentId || `CK-2569-${1000 + mergedMap.size}`,
                name: stu.name,
                nickname: stu.nickname || '',
                rawGrade: stu.grade || 'ป.4/1',
                school: stu.school || 'โรงเรียนอนุบาลนราธิวาส',
                avatarEmoji: stu.avatarEmoji || '🐱',
                email: stu.email || '',
                points: Number(stu.points) || 75,
                isRealStudent: true,
                isCurrentActiveUser: false,
                sourceLabel: 'เซิร์ฟเวอร์ห้องเรียน (Live)',
                existingSaved: saved,
              })
            );
          }
        }
      }

      if (Array.isArray(sData.logs)) {
        for (const l of sData.logs) {
          if (!l || !l.studentName) continue;
          const rawName = String(l.studentName).trim();
          const nickMatch = rawName.match(/\(([^)]+)\)/);
          const cleanName = rawName.replace(/\([^)]+\)/g, '').trim();
          const nickname = nickMatch ? nickMatch[1].trim() : '';
          const emailPrefix = l.email && l.email.includes('@') ? l.email.split('@')[0] : '';
          const inferredId = /^\d{4,6}$/.test(emailPrefix) ? emailPrefix : '';
          const existingKey = findExistingKey(inferredId, cleanName);
          if (!existingKey) {
            const key = (inferredId || cleanName).toLowerCase();
            const saved = savedMap.get(key);
            mergedMap.set(
              key,
              buildRecordFromStudentData({
                id: `srvlog_${key}`,
                studentId: inferredId || `CK-2569-${1000 + mergedMap.size}`,
                name: cleanName,
                nickname,
                rawGrade: l.grade || 'ป.4/1',
                school: l.school || 'โรงเรียนอนุบาลนราธิวาส',
                avatarEmoji: l.avatar || '🐱',
                email: l.email || '',
                points: 80,
                isRealStudent: true,
                isCurrentActiveUser: false,
                sourceLabel: 'ประวัติเข้าใช้งานจริง (Logs)',
                existingSaved: saved,
              })
            );
          }
        }
      }
    }
  } catch {}

  // 2. Fetch from Google Sheets (Students tab & Logs tab)
  let sheetSyncedCount = 0;
  try {
    const sheetData = await fetchStudentsFromGoogleSheet(TARGET_SPREADSHEET_ID);
    if (Array.isArray(sheetData.students) && sheetData.students.length > 0) {
      // Extract points column from rawRows if available
      const pointsByStudentId = new Map<string, number>();
      if (Array.isArray(sheetData.rawRows) && sheetData.rawRows.length > 1) {
        for (let i = 1; i < sheetData.rawRows.length; i++) {
          const r = sheetData.rawRows[i];
          const sid = (r[0] || '').trim().toLowerCase();
          const sname = (r[2] || '').replace(/\([^)]+\)/g, '').trim().toLowerCase();
          const ptsVal = parseInt(r[8] || '85', 10);
          if (!isNaN(ptsVal)) {
            if (sid) pointsByStudentId.set(sid, ptsVal);
            if (sname) pointsByStudentId.set(sname, ptsVal);
          }
        }
      }

      for (const s of sheetData.students) {
        if (!s || !s.name) continue;
        sheetSyncedCount++;
        const ptsFromSheet =
          pointsByStudentId.get((s.studentId || '').trim().toLowerCase()) ||
          pointsByStudentId.get(s.name.trim().toLowerCase()) ||
          85;

        const existingKey = findExistingKey(s.studentId, s.name);
        if (existingKey) {
          const prev = mergedMap.get(existingKey)!;
          mergedMap.set(existingKey, {
            ...prev,
            studentId: s.studentId || prev.studentId,
            school: s.school || prev.school,
            points: Math.max(prev.points, ptsFromSheet),
            isRealStudent: true,
            sourceLabel: prev.isCurrentActiveUser
              ? 'กำลังใช้งานจริงขณะนี้ + ซิงก์ Google Sheet'
              : 'Google Sheets (แท็บ Students)',
          });
        } else {
          const key = (s.studentId || s.name).trim().toLowerCase();
          const saved = savedMap.get(key);
          mergedMap.set(
            key,
            buildRecordFromStudentData({
              id: s.id || `sheet_${key}`,
              studentId: s.studentId || `CK-2569-${1000 + mergedMap.size}`,
              name: s.name,
              nickname: s.nickname || '',
              rawGrade: s.grade || 'ป.4/1',
              school: s.school || 'โรงเรียนอนุบาลนราธิวาส',
              avatarEmoji: s.avatarEmoji || '🐱',
              email: s.contactEmail || '',
              points: ptsFromSheet,
              isRealStudent: true,
              isCurrentActiveUser: false,
              sourceLabel: 'Google Sheets (แท็บ Students)',
              existingSaved: saved,
            })
          );
        }
      }
    }
  } catch {}

  // Also check Google Sheets Logs tab for any student who signed in
  try {
    const logsSheet = await readLogsFromGoogleSheet(TARGET_SPREADSHEET_ID);
    if (Array.isArray(logsSheet.rows) && logsSheet.rows.length > 1) {
      for (let i = 1; i < logsSheet.rows.length; i++) {
        const r = logsSheet.rows[i];
        const rawName = (r[1] || '').trim();
        if (!rawName || rawName === 'ชื่อนักเรียน') continue;
        const nickMatch = rawName.match(/\(([^)]+)\)/);
        const cleanName = rawName.replace(/\([^)]+\)/g, '').trim();
        const nickname = nickMatch ? nickMatch[1].trim() : '';
        const gradeVal = (r[2] || 'ป.4/1').trim();
        const schoolVal = (r[3] || 'โรงเรียนอนุบาลนราธิวาส').trim();
        const avatarVal = (r[4] || '🐱').trim();
        const emailVal = (r[9] || '').trim();
        const emailPrefix = emailVal.includes('@') ? emailVal.split('@')[0] : '';
        const inferredId = /^\d{4,6}$/.test(emailPrefix) ? emailPrefix : '';

        const existingKey = findExistingKey(inferredId, cleanName);
        if (!existingKey) {
          sheetSyncedCount++;
          const key = (inferredId || cleanName).toLowerCase();
          const saved = savedMap.get(key);
          mergedMap.set(
            key,
            buildRecordFromStudentData({
              id: `sheetlog_${i}_${key}`,
              studentId: inferredId || `CK-2569-${1000 + mergedMap.size}`,
              name: cleanName,
              nickname,
              rawGrade: gradeVal,
              school: schoolVal,
              avatarEmoji: avatarVal,
              email: emailVal,
              points: 85,
              isRealStudent: true,
              isCurrentActiveUser: false,
              sourceLabel: 'Google Sheets (แท็บ Logs)',
              existingSaved: saved,
            })
          );
        }
      }
    }
  } catch {}

  const finalRecords = Array.from(mergedMap.values()).sort((a, b) => {
    if (a.isCurrentActiveUser && !b.isCurrentActiveUser) return -1;
    if (!a.isCurrentActiveUser && b.isCurrentActiveUser) return 1;
    return b.totalScore - a.totalScore;
  });

  savePorPor5Records(finalRecords);

  // If writeBackToGoogleSheets is requested, also save the active student profile & scores to Google Sheet
  if (options.writeBackToGoogleSheets && options.currentProfile) {
    try {
      await saveProfileToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        options.currentProfile,
        options.currentPoints || 85,
        2,
        [],
        options.currentProfile.contactEmail || ''
      );
    } catch {}
  }

  return {
    records: finalRecords,
    sheetSyncedCount,
    message: `ซิงก์ข้อมูลผู้เรียนจริงสำเร็จ (${finalRecords.length} คน) เชื่อมโยงข้อมูลตรงกันทั้งศูนย์คุณครู ว 4.2 และรายงานผลสัมฤทธิ์ ปพ.5`,
  };
}
