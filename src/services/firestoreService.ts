import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types/index.ts';
import type { EditorNode } from '../components/Module2Thinking/flowchartUtils.ts';
import { KNOWN_ADMIN_EMAILS } from './googleSheetsService.ts';

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
