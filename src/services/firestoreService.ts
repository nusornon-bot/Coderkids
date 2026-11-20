import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types/index.ts';
import type { EditorNode } from '../components/Module2Thinking/flowchartUtils.ts';
import { KNOWN_ADMIN_EMAILS } from './googleSheetsService.ts';
import { sortParticipantsByScoreDesc } from '../utils/liveScoreboardSort.ts';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const firebaseAuth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo:
        firebaseAuth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testConnection(): Promise<boolean> {
  if (connectionTested) return true;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // PERMISSION_DENIED on /test/connection still confirms live server connectivity
    return true;
  }
}

function clampStr(value: unknown, maxLen: number, fallback = ''): string {
  const s = typeof value === 'string' ? value.trim() : fallback;
  return s.slice(0, maxLen);
}

function isSafeUid(uid: string | undefined | null): uid is string {
  return Boolean(uid && /^[a-zA-Z0-9_-]{1,128}$/.test(uid));
}

export function isCloudFirestoreReadyForUser(): boolean {
  const user = firebaseAuth.currentUser;
  return Boolean(user && user.emailVerified && isSafeUid(user.uid));
}

export async function syncUserProfileToFirestore(
  profile: UserProfile,
  points: number,
  completedModulesCount: number
): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return false;
  }

  const publicPath = `users/${user.uid}/public/profile`;
  const privatePath = `users/${user.uid}/private/info`;

  try {
    const publicRef = doc(db, 'users', user.uid, 'public', 'profile');
    const existingPublic = await getDoc(publicRef);

    const safePoints = Math.max(0, Math.min(1_000_000, Math.round(points || 0)));
    const safeCompleted = Math.max(0, Math.min(20, Math.round(completedModulesCount || 0)));
    const safeStreak = Math.max(0, Math.min(3650, Math.round(profile.streakDays || 1)));
    const safeLevel =
      profile.codingLevel === 'Advanced' || profile.codingLevel === 'Intermediate'
        ? profile.codingLevel
        : 'Beginner';

    const publicPayload: Record<string, unknown> = {
      uid: user.uid,
      displayName: clampStr(profile.name, 120, 'ผู้เรียน Coder Kids') || 'ผู้เรียน Coder Kids',
      nickname: clampStr(profile.nickname, 60, ''),
      avatarEmoji: clampStr(profile.avatarEmoji, 16, '🐱') || '🐱',
      grade: clampStr(profile.grade, 60, 'ป.4/1') || 'ป.4/1',
      school: clampStr(profile.school, 120, 'โรงเรียนอนุบาลนราธิวาส') || 'โรงเรียนอนุบาลนราธิวาส',
      points: safePoints,
      codingLevel: safeLevel,
      selectedTitle: clampStr(profile.selectedTitle, 100, 'นักประดิษฐ์รุ่นเยาว์'),
      streakDays: safeStreak,
      completedModulesCount: safeCompleted,
      updatedAt: serverTimestamp(),
      ...(existingPublic.exists()
        ? { createdAt: existingPublic.data()?.createdAt || serverTimestamp() }
        : { createdAt: serverTimestamp() }),
    };

    await setDoc(publicRef, publicPayload, { merge: false });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      publicPath
    );
  }

  try {
    const privateRef = doc(db, 'users', user.uid, 'private', 'info');
    const existingPrivate = await getDoc(privateRef);
    const emailLower = (user.email || '').trim().toLowerCase();
    const isAdminEmail = KNOWN_ADMIN_EMAILS.some((e) => e.toLowerCase() === emailLower);

    const privatePayload: Record<string, unknown> = {
      uid: user.uid,
      studentId: clampStr(profile.studentId, 64, ''),
      contactEmail: clampStr(profile.contactEmail || user.email || '', 160, ''),
      bio: clampStr(profile.bio, 400, ''),
      motto: clampStr(profile.motto, 200, ''),
      role: existingPrivate.exists()
        ? existingPrivate.data()?.role || 'student'
        : isAdminEmail
        ? 'student' // Initial creation always obeys 'student' role rule unless promoted by admin
        : 'student',
      updatedAt: serverTimestamp(),
      ...(existingPrivate.exists()
        ? { createdAt: existingPrivate.data()?.createdAt || serverTimestamp() }
        : { createdAt: serverTimestamp() }),
    };

    await setDoc(privateRef, privatePayload, { merge: false });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function saveFlowchartToFirestore(params: {
  flowchartId?: string;
  title: string;
  missionId?: string;
  templateId?: string | null;
  displayMode: 'visual' | 'text';
  snapToGrid: boolean;
  nodes: EditorNode[];
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return null;
  }
  if (!Array.isArray(params.nodes) || params.nodes.length === 0) return null;

  const docId =
    params.flowchartId && /^[a-zA-Z0-9_-]{1,128}$/.test(params.flowchartId)
      ? params.flowchartId
      : `fc_${Date.now()}`;
  const path = `users/${user.uid}/flowcharts/${docId}`;

  try {
    const ref = doc(db, 'users', user.uid, 'flowcharts', docId);
    const snap = await getDoc(ref);
    const sanitizedNodes = params.nodes.slice(0, 100).map((n) => ({
      uid: clampStr(n.uid, 64, 'node'),
      kind: n.kind,
      label: clampStr(n.label, 200, ''),
      x: typeof n.x === 'number' && Number.isFinite(n.x) ? Math.round(n.x) : 192,
      y: typeof n.y === 'number' && Number.isFinite(n.y) ? Math.round(n.y) : 24,
      ...(n.kind === 'decision'
        ? {
            trueAction: clampStr(n.trueAction, 200, ''),
            falseAction: clampStr(n.falseAction, 200, ''),
          }
        : {}),
    }));

    await setDoc(ref, {
      ownerId: user.uid,
      title: clampStr(params.title, 140, 'ผังงานของฉัน') || 'ผังงานของฉัน',
      ...(params.missionId ? { missionId: clampStr(params.missionId, 64, 'mission_free') } : {}),
      ...(params.templateId ? { templateId: clampStr(params.templateId, 64, '') } : {}),
      displayMode: params.displayMode === 'text' ? 'text' : 'visual',
      snapToGrid: Boolean(params.snapToGrid),
      nodes: sanitizedNodes,
      createdAt: snap.exists() ? snap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listUserFlowchartsFromFirestore(): Promise<
  Array<{
    id: string;
    title: string;
    displayMode: 'visual' | 'text';
    snapToGrid: boolean;
    nodes: EditorNode[];
  }>
> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return [];
  }
  const path = `users/${user.uid}/flowcharts`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'flowcharts'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || 'ผังงาน'),
        displayMode: data.displayMode === 'text' ? 'text' : 'visual',
        snapToGrid: Boolean(data.snapToGrid),
        nodes: Array.isArray(data.nodes) ? (data.nodes as EditorNode[]) : [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function publishShowcaseProjectToFirestore(params: {
  authorName: string;
  authorAvatar?: string;
  grade?: string;
  category: 'Scratch' | 'Micro:bit' | 'Python' | 'Flowchart';
  title: string;
  description: string;
  projectUrl?: string;
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return null;
  }
  const path = 'showcaseProjects';
  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: user.uid,
      authorName: clampStr(params.authorName, 120, 'นักเรียน Coder Kids') || 'นักเรียน Coder Kids',
      authorAvatar: clampStr(params.authorAvatar, 16, '🐱'),
      grade: clampStr(params.grade, 40, 'ป.5'),
      category: params.category,
      title: clampStr(params.title, 140, 'โครงงานของฉัน') || 'โครงงานของฉัน',
      description: clampStr(params.description, 1000, 'โครงงานวิทยาการคำนวณ') || 'โครงงานวิทยาการคำนวณ',
      projectUrl: clampStr(params.projectUrl, 400, ''),
      likesCount: 0,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ---------------------------------------------------------------------------
// Homework Submissions Cloud Persistence (/homeworkSubmissions/{submissionId})
// ---------------------------------------------------------------------------
export interface CloudHomeworkRecord {
  id: string;
  ownerId: string;
  studentName: string;
  studentClass: string;
  topic: string;
  title: string;
  projectUrl: string;
  reflection: string;
  submittedAt: string;
  status: 'pending' | 'graded';
  gradeScore?: number;
  teacherFeedback?: string;
}

export async function submitHomeworkToFirestore(params: {
  submissionId?: string;
  studentName: string;
  studentClass: string;
  topic: string;
  title: string;
  projectUrl?: string;
  reflection: string;
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return null;
  }

  const docId =
    params.submissionId && /^[a-zA-Z0-9_-]{1,128}$/.test(params.submissionId)
      ? params.submissionId
      : `hw_${Date.now()}`;
  const path = `homeworkSubmissions/${docId}`;

  try {
    const ref = doc(db, 'homeworkSubmissions', docId);
    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      studentName: clampStr(params.studentName, 120, 'นักเรียน Coder Kids') || 'นักเรียน Coder Kids',
      studentClass: clampStr(params.studentClass, 60, 'ป.5/1') || 'ป.5/1',
      topic: clampStr(params.topic, 200, 'ใบงานวิทยาการคำนวณ') || 'ใบงานวิทยาการคำนวณ',
      title: clampStr(params.title, 160, 'ผลงานของฉัน') || 'ผลงานของฉัน',
      reflection: clampStr(params.reflection, 1000, ''),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const cleanUrl = clampStr(params.projectUrl, 400, '');
    if (cleanUrl) {
      payload.projectUrl = cleanUrl;
    }

    await setDoc(ref, payload, { merge: false });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listHomeworkFromFirestore(
  isTeacherRole: boolean
): Promise<CloudHomeworkRecord[]> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return [];
  }

  const path = 'homeworkSubmissions';
  try {
    const emailLower = (user.email || '').trim().toLowerCase();
    const isVerifiedAdminEmail = KNOWN_ADMIN_EMAILS.some((e) => e.toLowerCase() === emailLower);
    const canQueryAll = isTeacherRole && isVerifiedAdminEmail;

    const q = canQueryAll
      ? query(collection(db, 'homeworkSubmissions'), limit(50))
      : query(
          collection(db, 'homeworkSubmissions'),
          where('ownerId', '==', user.uid),
          limit(50)
        );

    const snap = await getDocs(q);
    const records: Array<CloudHomeworkRecord & { _sortMs: number }> = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
      return {
        id: d.id,
        ownerId: String(data.ownerId || ''),
        studentName: String(data.studentName || 'นักเรียน'),
        studentClass: String(data.studentClass || 'ป.5/1'),
        topic: String(data.topic || ''),
        title: String(data.title || ''),
        projectUrl: String(data.projectUrl || ''),
        reflection: String(data.reflection || ''),
        submittedAt: ts.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: data.status === 'graded' ? 'graded' : 'pending',
        ...(typeof data.gradeScore === 'number' ? { gradeScore: data.gradeScore } : {}),
        ...(typeof data.teacherFeedback === 'string' ? { teacherFeedback: data.teacherFeedback } : {}),
        _sortMs: ts.getTime(),
      };
    });

    records.sort((a, b) => b._sortMs - a._sortMs);
    return records.map(({ _sortMs, ...rest }) => rest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function gradeHomeworkInFirestore(params: {
  submissionId: string;
  gradeScore: number;
  teacherFeedback: string;
}): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return false;
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(params.submissionId)) {
    return false;
  }

  const path = `homeworkSubmissions/${params.submissionId}`;
  try {
    const ref = doc(db, 'homeworkSubmissions', params.submissionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const existing = snap.data();

    const safeScore = Math.max(1, Math.min(5, Math.round(params.gradeScore || 5)));
    const payload: Record<string, unknown> = {
      ownerId: existing.ownerId,
      studentName: existing.studentName,
      studentClass: existing.studentClass,
      topic: existing.topic,
      title: existing.title,
      ...(existing.projectUrl ? { projectUrl: existing.projectUrl } : {}),
      reflection: existing.reflection || '',
      status: 'graded',
      gradeScore: safeScore,
      teacherFeedback:
        clampStr(params.teacherFeedback, 600, 'ผลงานยอดเยี่ยมมากครับ! พัฒนาต่อไปนะครับ 🌟') ||
        'ผลงานยอดเยี่ยมมากครับ! พัฒนาต่อไปนะครับ 🌟',
      createdAt: existing.createdAt,
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload, { merge: false });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Cloud Studio Projects (/users/{userId}/studioProjects/{studioProjectId})
// ---------------------------------------------------------------------------
export interface CloudStudioProjectRecord {
  id: string;
  studioType: 'scratch' | 'microbit' | 'python';
  title: string;
  presetId?: string;
  codeContent: string;
  blocksJson?: string;
  updatedAtLabel: string;
  source: 'cloud' | 'local';
}

export async function saveStudioProjectToFirestore(params: {
  projectId?: string;
  studioType: 'scratch' | 'microbit' | 'python';
  title: string;
  presetId?: string;
  codeContent: string;
  blocksJson?: string;
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return null;
  }

  const docId =
    params.projectId && /^[a-zA-Z0-9_-]{1,128}$/.test(params.projectId)
      ? params.projectId
      : `sp_${params.studioType}_${Date.now()}`;
  const path = `users/${user.uid}/studioProjects/${docId}`;

  try {
    const ref = doc(db, 'users', user.uid, 'studioProjects', docId);
    const snap = await getDoc(ref);

    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      studioType: params.studioType,
      title: clampStr(params.title, 140, 'โปรเจกต์ของฉัน') || 'โปรเจกต์ของฉัน',
      codeContent: clampStr(params.codeContent, 20000, '# Coder Kids Project') || '# Coder Kids Project',
      createdAt: snap.exists() ? snap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.presetId) {
      payload.presetId = clampStr(params.presetId, 64, '');
    }
    if (params.blocksJson) {
      payload.blocksJson = clampStr(params.blocksJson, 30000, '');
    }

    await setDoc(ref, payload, { merge: false });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listStudioProjectsFromFirestore(
  studioType?: 'scratch' | 'microbit' | 'python'
): Promise<CloudStudioProjectRecord[]> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return [];
  }

  const path = `users/${user.uid}/studioProjects`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'studioProjects'),
      where('ownerId', '==', user.uid),
      limit(30)
    );
    const snap = await getDocs(q);
    const items: Array<CloudStudioProjectRecord & { _sortMs: number }> = snap.docs
      .map((d) => {
        const data = d.data();
        const ts = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
        const typeVal =
          data.studioType === 'microbit' || data.studioType === 'python'
            ? data.studioType
            : 'scratch';
        return {
          id: d.id,
          studioType: typeVal as 'scratch' | 'microbit' | 'python',
          title: String(data.title || 'โปรเจกต์ของฉัน'),
          ...(data.presetId ? { presetId: String(data.presetId) } : {}),
          codeContent: String(data.codeContent || ''),
          ...(data.blocksJson ? { blocksJson: String(data.blocksJson) } : {}),
          updatedAtLabel: ts.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          source: 'cloud' as const,
          _sortMs: ts.getTime(),
        };
      })
      .filter((item) => (!studioType ? true : item.studioType === studioType));

    items.sort((a, b) => b._sortMs - a._sortMs);
    return items.map(({ _sortMs, ...rest }) => rest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteStudioProjectFromFirestore(projectId: string): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return false;
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(projectId)) {
    return false;
  }
  const path = `users/${user.uid}/studioProjects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'studioProjects', projectId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Live Classroom Quiz Rooms (/liveRooms/{roomCode} & /participants/{uid})
// ---------------------------------------------------------------------------
export interface LiveRoomFinalWinner {
  rank: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  streak: number;
  xpReward: number;
}

export interface LiveQuizRoomRecord {
  roomCode: string;
  hostUid: string;
  hostName: string;
  title: string;
  stage: 'lobby' | 'question' | 'reveal' | 'podium';
  currentQuestionIndex: number;
  status: 'active' | 'closed';
  platformSet?: 'Scratch' | 'Micro:bit' | 'mixed';
  difficulty?: 'all' | 'easy' | 'medium' | 'hard';
  questionCount?: number;
  questionIds?: string[];
  totalParticipants?: number;
  finalTopWinners?: LiveRoomFinalWinner[];
}

export interface LiveQuizParticipantRecord {
  roomCode: string;
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswerIndex: number;
  updatedAtMs?: number;
}

export async function createOrUpdateLiveRoomInFirestore(params: {
  roomCode: string;
  hostName: string;
  title?: string;
  stage: 'lobby' | 'question' | 'reveal' | 'podium';
  currentQuestionIndex: number;
  status?: 'active' | 'closed';
  platformSet?: 'Scratch' | 'Micro:bit' | 'mixed';
  difficulty?: 'all' | 'easy' | 'medium' | 'hard';
  questionCount?: number;
  questionIds?: string[];
}): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return false;
  }
  const cleanCode = clampStr(params.roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return false;
  }

  const path = `liveRooms/${cleanCode}`;
  try {
    const ref = doc(db, 'liveRooms', cleanCode);
    let snap;
    try {
      snap = await getDocFromServer(ref);
    } catch {
      snap = await getDoc(ref);
    }

    const mutablePayload: Record<string, unknown> = {
      hostName: clampStr(params.hostName, 120, 'คุณครู') || 'คุณครู',
      title: clampStr(params.title, 140, 'Live Quiz Battle ว 4.2') || 'Live Quiz Battle ว 4.2',
      stage: params.stage,
      currentQuestionIndex: Math.max(0, Math.min(50, Math.round(params.currentQuestionIndex || 0))),
      status: params.status === 'closed' ? 'closed' : 'active',
      updatedAt: serverTimestamp(),
    };

    if (
      params.platformSet === 'Scratch' ||
      params.platformSet === 'Micro:bit' ||
      params.platformSet === 'mixed'
    ) {
      mutablePayload.platformSet = params.platformSet;
    }
    if (
      params.difficulty === 'all' ||
      params.difficulty === 'easy' ||
      params.difficulty === 'medium' ||
      params.difficulty === 'hard'
    ) {
      mutablePayload.difficulty = params.difficulty;
    }
    if (typeof params.questionCount === 'number' && Number.isFinite(params.questionCount)) {
      mutablePayload.questionCount = Math.max(1, Math.min(50, Math.round(params.questionCount)));
    }
    if (Array.isArray(params.questionIds) && params.questionIds.length > 0) {
      const cleanIds = params.questionIds
        .map((id) => clampStr(id, 128, ''))
        .filter((id) => id.length > 0)
        .slice(0, 50);
      if (cleanIds.length > 0) {
        mutablePayload.questionIds = cleanIds;
      }
    }

    if (snap.exists()) {
      await updateDoc(ref, mutablePayload);
    } else {
      await setDoc(
        ref,
        {
          roomCode: cleanCode,
          hostUid: user.uid,
          ...mutablePayload,
          createdAt: serverTimestamp(),
        },
        { merge: false }
      );
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

const GUEST_PARTICIPANT_STORAGE_KEY = 'coderkids_live_guest_pid_v1';
let inMemoryGuestParticipantId: string | null = null;

function isValidGuestParticipantId(id: string): boolean {
  return id.length >= 14 && id.length <= 72 && /^guest_[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Returns the active Firebase UID for verified users, or a stable guest participant ID
 * (`guest_<timestamp>_<rand>`) so students signed in via Student Profile / ID can join
 * teacher-opened Cloud Live Rooms and sync live scores to the classroom leaderboard.
 */
export function getLiveParticipantId(): string {
  const user = firebaseAuth.currentUser;
  if (user && user.emailVerified && isSafeUid(user.uid)) {
    return user.uid;
  }

  if (inMemoryGuestParticipantId && isValidGuestParticipantId(inMemoryGuestParticipantId)) {
    return inMemoryGuestParticipantId;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(GUEST_PARTICIPANT_STORAGE_KEY);
      if (saved && isValidGuestParticipantId(saved)) {
        inMemoryGuestParticipantId = saved;
        return saved;
      }
    }
  } catch {
    // Ignore storage read errors
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem(GUEST_PARTICIPANT_STORAGE_KEY);
      if (saved && isValidGuestParticipantId(saved)) {
        inMemoryGuestParticipantId = saved;
        return saved;
      }
    }
  } catch {
    // Ignore storage read errors
  }

  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  const generated = `guest_${timePart}_${randPart}`;
  inMemoryGuestParticipantId = generated;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUEST_PARTICIPANT_STORAGE_KEY, generated);
    }
  } catch {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(GUEST_PARTICIPANT_STORAGE_KEY, generated);
      }
    } catch {
      // Fall back to in-memory ID for current session
    }
  }

  return generated;
}

function parseLiveRoomData(
  cleanCode: string,
  data: Record<string, unknown>
): LiveQuizRoomRecord {
  const parsedWinners: LiveRoomFinalWinner[] = Array.isArray(data.finalTopWinners)
    ? data.finalTopWinners
        .slice(0, 3)
        .map((entry, idx): LiveRoomFinalWinner | null => {
          if (!entry || typeof entry !== 'object') return null;
          const obj = entry as Record<string, unknown>;
          const rawRank = typeof obj.rank === 'number' ? Math.round(obj.rank) : idx + 1;
          const rank: 1 | 2 | 3 = rawRank === 1 || rawRank === 2 || rawRank === 3 ? rawRank : ((idx + 1) as 1 | 2 | 3);
          return {
            rank,
            userId: String(obj.userId || `winner_${rank}`),
            displayName: String(obj.displayName || 'ผู้เรียน'),
            avatar: String(obj.avatar || '⚡'),
            score: typeof obj.score === 'number' ? Math.max(0, Math.round(obj.score)) : 0,
            streak: typeof obj.streak === 'number' ? Math.max(0, Math.round(obj.streak)) : 0,
            xpReward: typeof obj.xpReward === 'number' ? Math.max(0, Math.round(obj.xpReward)) : 0,
          };
        })
        .filter((item): item is LiveRoomFinalWinner => item !== null)
    : [];

  return {
    roomCode: cleanCode,
    hostUid: String(data.hostUid || ''),
    hostName: String(data.hostName || 'คุณครู'),
    title: String(data.title || 'Live Quiz Battle'),
    stage:
      data.stage === 'question' || data.stage === 'reveal' || data.stage === 'podium'
        ? data.stage
        : 'lobby',
    currentQuestionIndex:
      typeof data.currentQuestionIndex === 'number' ? data.currentQuestionIndex : 0,
    status: data.status === 'closed' ? 'closed' : 'active',
    ...(data.platformSet === 'Scratch' ||
    data.platformSet === 'Micro:bit' ||
    data.platformSet === 'mixed'
      ? { platformSet: data.platformSet }
      : {}),
    ...(data.difficulty === 'all' ||
    data.difficulty === 'easy' ||
    data.difficulty === 'medium' ||
    data.difficulty === 'hard'
      ? { difficulty: data.difficulty }
      : {}),
    ...(typeof data.questionCount === 'number' ? { questionCount: data.questionCount } : {}),
    ...(Array.isArray(data.questionIds)
      ? { questionIds: data.questionIds.map((id: unknown) => String(id)) }
      : {}),
    ...(typeof data.totalParticipants === 'number'
      ? { totalParticipants: Math.max(0, Math.round(data.totalParticipants)) }
      : {}),
    ...(parsedWinners.length > 0 ? { finalTopWinners: parsedWinners } : {}),
  };
}

export async function getLiveRoomFromFirestore(
  roomCode: string
): Promise<LiveQuizRoomRecord | null> {
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return null;
  }
  const path = `liveRooms/${cleanCode}`;
  try {
    const ref = doc(db, 'liveRooms', cleanCode);
    let snap;
    try {
      // Fetch directly from server first so newly created/reopened PINs are never masked by stale cache
      snap = await getDocFromServer(ref);
    } catch {
      snap = await getDoc(ref);
    }
    if (!snap.exists()) return null;
    return parseLiveRoomData(cleanCode, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Real-time listener for a Live Classroom room document so joined students are
 * notified immediately when the teacher closes the room.
 */
export function subscribeLiveRoomInFirestore(
  roomCode: string,
  onUpdate: (room: LiveQuizRoomRecord | null) => void,
  onError?: (error: unknown) => void
): () => void {
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    onUpdate(null);
    return () => {};
  }

  const path = `liveRooms/${cleanCode}`;
  return onSnapshot(
    doc(db, 'liveRooms', cleanCode),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(parseLiveRoomData(cleanCode, snap.data() as Record<string, unknown>));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (handledErr) {
        if (onError) {
          onError(handledErr);
        }
      }
    }
  );
}

/**
 * Deletes every student participant document inside a Live Classroom room.
 */
export async function clearLiveRoomParticipantsInFirestore(
  roomCode: string
): Promise<{ ok: boolean; removedCount: number }> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return { ok: false, removedCount: 0 };
  }
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return { ok: false, removedCount: 0 };
  }

  const path = `liveRooms/${cleanCode}/participants`;
  try {
    const q = query(
      collection(db, 'liveRooms', cleanCode, 'participants'),
      where('roomCode', '==', cleanCode),
      limit(50)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { ok: true, removedCount: 0 };
    }
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    return { ok: true, removedCount: snap.docs.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Resets all participant scores, streaks, and last answers to 0 inside an active room
 * so the teacher can clear previous scores for a fresh round without changing PIN.
 */
export async function resetLiveRoomScoresInFirestore(
  roomCode: string
): Promise<{ ok: boolean; resetCount: number }> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return { ok: false, resetCount: 0 };
  }
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return { ok: false, resetCount: 0 };
  }

  const path = `liveRooms/${cleanCode}/participants`;
  try {
    const q = query(
      collection(db, 'liveRooms', cleanCode, 'participants'),
      where('roomCode', '==', cleanCode),
      limit(50)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { ok: true, resetCount: 0 };
    }
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, {
          score: 0,
          streak: 0,
          lastAnswerIndex: -1,
          updatedAt: serverTimestamp(),
        })
      )
    );
    return { ok: true, resetCount: snap.docs.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Closes a Live Classroom room on Firestore, snapshots final Top 3 winners & XP coin awards
 * onto the room document (so students see the graphical summary and claim XP rewards),
 * and automatically deletes all participant documents from the room.
 */
export async function closeLiveRoomAndClearParticipantsInFirestore(
  roomCode: string,
  options?: {
    fallbackParticipants?: readonly LiveQuizParticipantRecord[];
  }
): Promise<{
  closed: boolean;
  removedCount: number;
  finalParticipants: LiveQuizParticipantRecord[];
  finalTopWinners: LiveRoomFinalWinner[];
}> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return { closed: false, removedCount: 0, finalParticipants: [], finalTopWinners: [] };
  }
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return { closed: false, removedCount: 0, finalParticipants: [], finalTopWinners: [] };
  }

  const path = `liveRooms/${cleanCode}`;
  try {
    // 1. Read the latest participants right before clearing so we never lose last-second scores
    const participantsQuery = query(
      collection(db, 'liveRooms', cleanCode, 'participants'),
      where('roomCode', '==', cleanCode),
      limit(50)
    );
    const participantsSnap = await getDocs(participantsQuery);
    const fetchedParticipants: LiveQuizParticipantRecord[] = participantsSnap.docs.map((d) => {
      const data = d.data();
      const updatedMs =
        typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : undefined;
      return {
        roomCode: cleanCode,
        userId: String(data.userId || d.id),
        displayName: String(data.displayName || 'ผู้เรียน'),
        avatar: String(data.avatar || '⚡'),
        score: typeof data.score === 'number' ? data.score : 0,
        streak: typeof data.streak === 'number' ? data.streak : 0,
        lastAnswerIndex: typeof data.lastAnswerIndex === 'number' ? data.lastAnswerIndex : -1,
        updatedAtMs: updatedMs,
      };
    });

    const sourceParticipants =
      fetchedParticipants.length > 0
        ? fetchedParticipants
        : [...(options?.fallbackParticipants || [])];
    const sortedParticipants = sortParticipantsByScoreDesc(sourceParticipants);

    const rankXpTable: Record<1 | 2 | 3, number> = { 1: 150, 2: 100, 3: 60 };
    const finalTopWinners: LiveRoomFinalWinner[] = sortedParticipants
      .slice(0, 3)
      .map((participant, index) => {
        const rank = (index + 1) as 1 | 2 | 3;
        const safeUserId = /^[a-zA-Z0-9_-]{1,128}$/.test(participant.userId)
          ? participant.userId
          : `winner_${rank}`;
        return {
          rank,
          userId: safeUserId,
          displayName: clampStr(participant.displayName, 120, 'ผู้เรียน') || 'ผู้เรียน',
          avatar: clampStr(participant.avatar, 16, '⚡') || '⚡',
          score: Math.max(0, Math.min(100000, Math.round(participant.score || 0))),
          streak: Math.max(0, Math.min(100, Math.round(participant.streak || 0))),
          xpReward: rankXpTable[rank],
        };
      });

    // 2. Delete all participants from the room automatically
    if (!participantsSnap.empty) {
      await Promise.all(participantsSnap.docs.map((d) => deleteDoc(d.ref)));
    }
    const removedCount = participantsSnap.docs.length;

    // 3. Mark room closed and store Top 3 winners snapshot for student reward delivery
    const ref = doc(db, 'liveRooms', cleanCode);
    let roomSnap;
    try {
      roomSnap = await getDocFromServer(ref);
    } catch {
      roomSnap = await getDoc(ref);
    }
    if (roomSnap.exists()) {
      await updateDoc(ref, {
        status: 'closed',
        stage: 'podium',
        totalParticipants: Math.max(0, Math.min(500, sortedParticipants.length)),
        finalTopWinners,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      closed: true,
      removedCount,
      finalParticipants: sortedParticipants,
      finalTopWinners,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function joinOrUpdateLiveParticipantInFirestore(params: {
  roomCode: string;
  displayName: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswerIndex: number;
}): Promise<boolean> {
  const cleanCode = clampStr(params.roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return false;
  }

  const participantId = getLiveParticipantId();
  const path = `liveRooms/${cleanCode}/participants/${participantId}`;
  try {
    const ref = doc(db, 'liveRooms', cleanCode, 'participants', participantId);
    let snap;
    try {
      snap = await getDocFromServer(ref);
    } catch {
      snap = await getDoc(ref);
    }
    const mutableFields = {
      displayName: clampStr(params.displayName, 120, 'ผู้เรียน') || 'ผู้เรียน',
      avatar: clampStr(params.avatar, 16, '🐱') || '🐱',
      score: Math.max(0, Math.min(100000, Math.round(params.score || 0))),
      streak: Math.max(0, Math.min(100, Math.round(params.streak || 0))),
      lastAnswerIndex: Math.max(-1, Math.min(10, Math.round(params.lastAnswerIndex ?? -1))),
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      await updateDoc(ref, mutableFields);
    } else {
      await setDoc(
        ref,
        {
          roomCode: cleanCode,
          userId: participantId,
          ...mutableFields,
          createdAt: serverTimestamp(),
        },
        { merge: false }
      );
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listLiveParticipantsFromFirestore(
  roomCode: string
): Promise<LiveQuizParticipantRecord[]> {
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    return [];
  }
  const path = `liveRooms/${cleanCode}/participants`;
  try {
    const q = query(
      collection(db, 'liveRooms', cleanCode, 'participants'),
      where('roomCode', '==', cleanCode),
      limit(50)
    );
    const snap = await getDocs(q);
    const list: LiveQuizParticipantRecord[] = snap.docs.map((d) => {
      const data = d.data();
      const updatedMs =
        typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : undefined;
      return {
        roomCode: cleanCode,
        userId: String(data.userId || d.id),
        displayName: String(data.displayName || 'ผู้เรียน'),
        avatar: String(data.avatar || '🐱'),
        score: typeof data.score === 'number' ? data.score : 0,
        streak: typeof data.streak === 'number' ? data.streak : 0,
        lastAnswerIndex: typeof data.lastAnswerIndex === 'number' ? data.lastAnswerIndex : -1,
        updatedAtMs: updatedMs,
      };
    });
    return sortParticipantsByScoreDesc(list);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Real-time Firestore listener for all participants & scores in an active Live Classroom room.
 * Automatically updates whenever any student joins or submits an answer.
 */
export function subscribeLiveParticipantsInFirestore(
  roomCode: string,
  onUpdate: (participants: LiveQuizParticipantRecord[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const cleanCode = clampStr(roomCode, 12, '').toUpperCase();
  if (!/^[a-zA-Z0-9_-]{4,12}$/.test(cleanCode)) {
    onUpdate([]);
    return () => {};
  }

  const path = `liveRooms/${cleanCode}/participants`;
  const q = query(
    collection(db, 'liveRooms', cleanCode, 'participants'),
    where('roomCode', '==', cleanCode),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: LiveQuizParticipantRecord[] = snap.docs.map((d) => {
        const data = d.data();
        const updatedMs =
          typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : undefined;
        return {
          roomCode: cleanCode,
          userId: String(data.userId || d.id),
          displayName: String(data.displayName || 'ผู้เรียน'),
          avatar: String(data.avatar || '🐱'),
          score: typeof data.score === 'number' ? data.score : 0,
          streak: typeof data.streak === 'number' ? data.streak : 0,
          lastAnswerIndex: typeof data.lastAnswerIndex === 'number' ? data.lastAnswerIndex : -1,
          updatedAtMs: updatedMs,
        };
      });
      onUpdate(sortParticipantsByScoreDesc(list));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (handledErr) {
        if (onError) {
          onError(handledErr);
        }
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Live Classroom Coding Battle Question Bank (/battleQuestions/{questionId})
// ---------------------------------------------------------------------------
export interface CloudBattleQuestionRecord {
  id: string;
  platform: 'Scratch' | 'Micro:bit';
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  codeSnippet: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  createdByName: string;
  source: 'cloud';
}

export async function getBattleQuestionByIdFromFirestore(
  questionId: string
): Promise<CloudBattleQuestionRecord | null> {
  const cleanId = clampStr(questionId, 128, '');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanId)) {
    return null;
  }
  const path = `battleQuestions/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'battleQuestions', cleanId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const opts = Array.isArray(data.options) ? data.options : [];
    if (opts.length !== 4) return null;
    const platformVal = data.platform === 'Micro:bit' ? 'Micro:bit' : 'Scratch';
    const diffVal =
      data.difficulty === 'easy' || data.difficulty === 'hard'
        ? data.difficulty
        : 'medium';
    const correctIdx =
      typeof data.correctIndex === 'number' &&
      data.correctIndex >= 0 &&
      data.correctIndex <= 3
        ? (Math.floor(data.correctIndex) as 0 | 1 | 2 | 3)
        : 0;
    return {
      id: snap.id,
      platform: platformVal as 'Scratch' | 'Micro:bit',
      difficulty: diffVal as 'easy' | 'medium' | 'hard',
      title: String(data.title || ''),
      codeSnippet: String(data.codeSnippet || ''),
      options: [
        String(opts[0] || ''),
        String(opts[1] || ''),
        String(opts[2] || ''),
        String(opts[3] || ''),
      ] as [string, string, string, string],
      correctIndex: correctIdx,
      explanation: String(data.explanation || ''),
      createdByName: String(data.createdByName || 'คุณครู'),
      source: 'cloud',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function listBattleQuestionsFromFirestore(): Promise<CloudBattleQuestionRecord[]> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return [];
  }

  const path = 'battleQuestions';
  try {
    const q = query(
      collection(db, 'battleQuestions'),
      where('status', '==', 'active'),
      limit(100)
    );
    const snap = await getDocs(q);
    const records: Array<CloudBattleQuestionRecord & { _sortMs: number }> = snap.docs
      .map((d) => {
        const data = d.data();
        const opts = Array.isArray(data.options) ? data.options : [];
        if (opts.length !== 4) return null;
        const platformVal = data.platform === 'Micro:bit' ? 'Micro:bit' : 'Scratch';
        const diffVal =
          data.difficulty === 'easy' || data.difficulty === 'hard'
            ? data.difficulty
            : 'medium';
        const correctIdx =
          typeof data.correctIndex === 'number' &&
          data.correctIndex >= 0 &&
          data.correctIndex <= 3
            ? (Math.floor(data.correctIndex) as 0 | 1 | 2 | 3)
            : 0;
        const ts = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
        return {
          id: d.id,
          platform: platformVal as 'Scratch' | 'Micro:bit',
          difficulty: diffVal as 'easy' | 'medium' | 'hard',
          title: String(data.title || ''),
          codeSnippet: String(data.codeSnippet || ''),
          options: [
            String(opts[0] || ''),
            String(opts[1] || ''),
            String(opts[2] || ''),
            String(opts[3] || ''),
          ] as [string, string, string, string],
          correctIndex: correctIdx,
          explanation: String(data.explanation || ''),
          createdByName: String(data.createdByName || 'คุณครู'),
          source: 'cloud' as const,
          _sortMs: ts.getTime(),
        };
      })
      .filter((item): item is CloudBattleQuestionRecord & { _sortMs: number } => item !== null);

    records.sort((a, b) => b._sortMs - a._sortMs);
    return records.map(({ _sortMs, ...rest }) => rest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveBattleQuestionToFirestore(params: {
  questionId?: string;
  platform: 'Scratch' | 'Micro:bit';
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  codeSnippet: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  createdByName: string;
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return null;
  }

  const docId =
    params.questionId && /^[a-zA-Z0-9_-]{1,128}$/.test(params.questionId)
      ? params.questionId
      : `bq_${params.platform === 'Scratch' ? 'sc' : 'mb'}_${Date.now()}`;
  const path = `battleQuestions/${docId}`;

  try {
    const ref = doc(db, 'battleQuestions', docId);
    const snap = await getDoc(ref);
    const cleanOptions: [string, string, string, string] = [
      clampStr(params.options[0], 300, 'ตัวเลือก A') || 'ตัวเลือก A',
      clampStr(params.options[1], 300, 'ตัวเลือก B') || 'ตัวเลือก B',
      clampStr(params.options[2], 300, 'ตัวเลือก C') || 'ตัวเลือก C',
      clampStr(params.options[3], 300, 'ตัวเลือก D') || 'ตัวเลือก D',
    ];
    const safeCorrectIdx = Math.max(0, Math.min(3, Math.floor(params.correctIndex))) as 0 | 1 | 2 | 3;

    const payload: Record<string, unknown> = {
      platform: params.platform === 'Micro:bit' ? 'Micro:bit' : 'Scratch',
      difficulty:
        params.difficulty === 'easy' || params.difficulty === 'hard'
          ? params.difficulty
          : 'medium',
      title: clampStr(params.title, 200, 'คำถามประลองโค้ด') || 'คำถามประลองโค้ด',
      codeSnippet: clampStr(params.codeSnippet, 1500, '// ตัวอย่างโค้ด') || '// ตัวอย่างโค้ด',
      options: cleanOptions,
      correctIndex: safeCorrectIdx,
      explanation: clampStr(params.explanation, 600, 'ตรวจสอบลำดับและเงื่อนไขของคำสั่งให้ถูกต้อง') || 'ตรวจสอบลำดับและเงื่อนไขของคำสั่งให้ถูกต้อง',
      status: 'active',
      createdByUid: snap.exists() ? snap.data()?.createdByUid || user.uid : user.uid,
      createdByName: clampStr(params.createdByName, 120, 'คุณครู') || 'คุณครู',
      createdAt: snap.exists() ? snap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload, { merge: false });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBattleQuestionFromFirestore(questionId: string): Promise<boolean> {
  const user = firebaseAuth.currentUser;
  if (!user || !user.emailVerified || !isSafeUid(user.uid)) {
    return false;
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(questionId)) {
    return false;
  }
  const path = `battleQuestions/${questionId}`;
  try {
    await deleteDoc(doc(db, 'battleQuestions', questionId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


