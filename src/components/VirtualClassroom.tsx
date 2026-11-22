import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClassroomAssignment,
  ClassroomPost,
  ClassroomPoll,
  VirtualClassroomRoom,
  UserProfile,
  ClassScheduleItem,
  DigitalLessonMaterial,
} from '../types/index.ts';
import {
  CLASSROOM_ASSIGNMENTS,
  CLASSROOM_POSTS,
  CLASSROOM_POLL,
  INITIAL_VIRTUAL_CLASSROOMS,
  CLASS_SCHEDULE_ITEMS,
  INITIAL_DIGITAL_LESSON_MATERIALS,
} from '../data/learningData.ts';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  isCloudFirestoreReadyForUser,
  createOrUpdateVirtualClassroomInFirestore,
  getVirtualClassroomFromFirestore,
  listVirtualClassroomsFromFirestore,
  subscribeVirtualClassroomInFirestore,
  joinVirtualClassroomMemberInFirestore,
  subscribeVirtualClassroomMembersInFirestore,
  createVirtualClassroomAssignmentInFirestore,
  subscribeVirtualClassroomAssignmentsInFirestore,
  submitVirtualClassroomHomeworkInFirestore,
  gradeVirtualClassroomSubmissionInFirestore,
  subscribeVirtualClassroomSubmissionsInFirestore,
  createVirtualClassroomScheduleInFirestore,
  subscribeVirtualClassroomSchedulesInFirestore,
  createVirtualClassroomMaterialInFirestore,
  deleteVirtualClassroomMaterialInFirestore,
  incrementVirtualClassroomMaterialDownloadInFirestore,
  subscribeVirtualClassroomMaterialsInFirestore,
  createVirtualClassroomPostInFirestore,
  likeVirtualClassroomPostInFirestore,
  subscribeVirtualClassroomPostsInFirestore,
  type VirtualClassroomMemberRecord,
} from '../services/firestoreService.ts';
import {
  normalizeVirtualRoomCode,
  isValidVirtualRoomCode,
  isBuiltInDefaultRoomCode,
  mergeVirtualClassrooms,
  mergeAssignmentsWithSubmissions,
  type VirtualClassroomSubmissionRecord,
} from '../utils/virtualClassroomSync.ts';
import {
  Users,
  BookOpen,
  Send,
  MessageSquare,
  BarChart2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Heart,
  Plus,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  School,
  GraduationCap,
  Copy,
  Check,
  X,
  Shuffle,
  AlertCircle,
  Trophy,
  Calendar,
  FileText,
  Download,
  Eye,
  Video,
  FileCode,
  Layers,
  Search,
  CheckSquare,
  Radio,
  Trash2,
  Laptop,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VirtualClassroomProps {
  onNavigateModule: (moduleKey: string) => void;
  addPoints: (amount: number, reason?: string, category?: 'safety' | 'thinking' | 'coding' | 'showcase' | 'classroom', options?: any) => void;
  studentName: string;
  profile?: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  isAdmin?: boolean;
}

export const VirtualClassroom: React.FC<VirtualClassroomProps> = ({
  onNavigateModule,
  addPoints,
  studentName,
  profile,
  onUpdateProfile,
  isAdmin = false,
}) => {
  // Role switcher: 'student' or 'teacher' (only verified admins can enter teacher mode)
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>(() => {
    return isAdmin ? 'teacher' : 'student';
  });

  useEffect(() => {
    if (!isAdmin && currentRole !== 'student') {
      setCurrentRole('student');
    }
  }, [isAdmin, currentRole]);

  // 1. Rooms List State (Loaded from localStorage or defaults)
  const [classrooms, setClassrooms] = useState<VirtualClassroomRoom[]>(() => {
    const saved = localStorage.getItem('coderkids_virtual_classrooms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading classrooms:', e);
      }
    }
    return INITIAL_VIRTUAL_CLASSROOMS;
  });

  useEffect(() => {
    localStorage.setItem('coderkids_virtual_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  // Current Active Classroom Code
  const [activeRoomCode, setActiveRoomCode] = useState<string>(() =>
    normalizeVirtualRoomCode(profile?.enrolledClassroomCode || classrooms[0]?.code || 'COD-2026')
  );

  // Cloud Firestore real-time state for active classroom
  const [cloudRoomExists, setCloudRoomExists] = useState<boolean>(false);
  const [cloudMembers, setCloudMembers] = useState<VirtualClassroomMemberRecord[]>([]);
  const [cloudAssignments, setCloudAssignments] = useState<ClassroomAssignment[]>([]);
  const [cloudSubmissions, setCloudSubmissions] = useState<VirtualClassroomSubmissionRecord[]>([]);
  const [cloudSchedules, setCloudSchedules] = useState<ClassScheduleItem[]>([]);
  const [cloudMaterials, setCloudMaterials] = useState<DigitalLessonMaterial[]>([]);
  const [cloudPosts, setCloudPosts] = useState<ClassroomPost[]>([]);
  const syncedLocalRoomsRef = useRef<Set<string>>(new Set());

  // Sync activeRoomCode if profile.enrolledClassroomCode changes externally
  useEffect(() => {
    const enrolled = normalizeVirtualRoomCode(profile?.enrolledClassroomCode || '');
    if (enrolled && isValidVirtualRoomCode(enrolled)) {
      setActiveRoomCode(enrolled);
    }
  }, [profile?.enrolledClassroomCode]);

  // Initial Cloud Firestore fetch:
  // 1) Fetch enrolled classroom by code (works for both Google-verified and Student-ID logins)
  // 2) For verified Google users / teachers, list active cloud classrooms
  // 3) For verified teachers, auto-publish any existing custom local rooms (e.g. created earlier) to Cloud Firestore
  useEffect(() => {
    let cancelled = false;

    const bootstrapCloudClassrooms = async () => {
      const enrolledCode = normalizeVirtualRoomCode(profile?.enrolledClassroomCode || '');
      let discoveredCloudRooms: VirtualClassroomRoom[] = [];

      if (isCloudFirestoreReadyForUser()) {
        try {
          const listed = await listVirtualClassroomsFromFirestore();
          if (!cancelled && listed.length > 0) {
            discoveredCloudRooms = listed;
            setClassrooms((prev) => mergeVirtualClassrooms(prev, listed));
          }
        } catch (err) {
          console.warn('Could not list cloud virtual classrooms:', err);
        }
      }

      if (enrolledCode && isValidVirtualRoomCode(enrolledCode)) {
        try {
          const enrolledRoom = await getVirtualClassroomFromFirestore(enrolledCode);
          if (!cancelled && enrolledRoom) {
            setClassrooms((prev) => mergeVirtualClassrooms(prev, [enrolledRoom]));
          }
        } catch (err) {
          console.warn('Could not fetch enrolled virtual classroom:', err);
        }
      }

      // If verified teacher has custom non-built-in rooms in localStorage that aren't in Firestore yet, sync them now
      if (isAdmin && isCloudFirestoreReadyForUser()) {
        const cloudCodes = new Set(discoveredCloudRooms.map((r) => normalizeVirtualRoomCode(r.code)));
        const customLocalRooms = classrooms.filter(
          (r) => !isBuiltInDefaultRoomCode(r.code) && !cloudCodes.has(normalizeVirtualRoomCode(r.code))
        );
        for (const localRoom of customLocalRooms) {
          const code = normalizeVirtualRoomCode(localRoom.code);
          if (!code || !isValidVirtualRoomCode(code) || syncedLocalRoomsRef.current.has(code)) {
            continue;
          }
          syncedLocalRoomsRef.current.add(code);
          try {
            const saved = await createOrUpdateVirtualClassroomInFirestore({
              code,
              name: localRoom.name,
              teacherName: localRoom.teacherName,
              grade: localRoom.grade,
              school: localRoom.school || 'โรงเรียนอนุบาลนราธิวาส',
              description: localRoom.description,
              studentsCount: localRoom.studentsCount,
            });
            if (saved && !cancelled) {
              setClassrooms((prev) => mergeVirtualClassrooms(prev, [saved]));
            }
          } catch (err) {
            syncedLocalRoomsRef.current.delete(code);
            console.warn(`Could not sync local classroom ${code} to Firestore:`, err);
          }
        }
      }
    };

    bootstrapCloudClassrooms();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, profile?.enrolledClassroomCode]);

  // Active Room Object
  const currentRoom = useMemo(() => {
    const target = normalizeVirtualRoomCode(activeRoomCode);
    return (
      classrooms.find((r) => normalizeVirtualRoomCode(r.code) === target) ||
      classrooms[0] || {
        id: 'room_1',
        code: 'COD-2026',
        name: 'ห้องเรียนวิทยาการคำนวณ ป.4/1',
        teacherName: 'ครูสมคิด & ครูอารีย์',
        grade: 'ประถมศึกษาปีที่ 4/1',
        school: 'โรงเรียนอนุบาลนราธิวาส',
        description: 'พื้นที่เรียนรู้การเขียนโค้ด Scratch, บอร์ด Micro:bit และการคิดเชิงคำนวณ',
        createdAt: '10 มีนาคม 2026',
        studentsCount: 28,
      }
    );
  }, [classrooms, activeRoomCode]);

  // Section Tabs: 'assignments' | 'schedule' | 'materials' | 'poll' | 'feed' | 'members'
  const [activeSection, setActiveSection] = useState<'assignments' | 'schedule' | 'materials' | 'poll' | 'feed' | 'members'>('assignments');

  // 2. Assignments State (Persistent)
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>(() => {
    const saved = localStorage.getItem('coderkids_classroom_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading assignments:', e);
      }
    }
    return CLASSROOM_ASSIGNMENTS;
  });

  useEffect(() => {
    localStorage.setItem('coderkids_classroom_assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Assignment Filters & Modals
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [submittingAssignment, setSubmittingAssignment] = useState<ClassroomAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');

  // Teacher Grading Modal
  const [gradingAssignment, setGradingAssignment] = useState<ClassroomAssignment | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingStudentName, setGradingStudentName] = useState<string>('');
  const [gradingScore, setGradingScore] = useState<number>(30);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Teacher Create Assignment Modal
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwModuleKey, setNewHwModuleKey] = useState<'safety' | 'thinking' | 'codingLab' | 'showcase' | 'general'>('codingLab');
  const [newHwDueDate, setNewHwDueDate] = useState('ศุกร์นี้ 18:00 น.');
  const [newHwPoints, setNewHwPoints] = useState(30);
  const [newHwTeacherNote, setNewHwTeacherNote] = useState('');

  // 3. Timetable / Schedule State (Persistent)
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>(() => {
    const saved = localStorage.getItem('coderkids_classroom_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading schedules:', e);
      }
    }
    return CLASS_SCHEDULE_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('coderkids_classroom_schedule', JSON.stringify(schedules));
  }, [schedules]);

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [schedDay, setSchedDay] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('monday');
  const [schedStart, setSchedStart] = useState('09:00');
  const [schedEnd, setSchedEnd] = useState('10:00');
  const [schedSubject, setSchedSubject] = useState('ว14101 วิทยาการคำนวณ ป.4');
  const [schedTopic, setSchedTopic] = useState('');
  const [schedRoom, setSchedRoom] = useState('ห้องปฏิบัติการคอมพิวเตอร์ 1');
  const [schedTeacher, setSchedTeacher] = useState(currentRoom.teacherName);
  const [schedMeetUrl, setSchedMeetUrl] = useState('');

  // 4. Custom Digital Lesson Materials State (Persistent)
  const [materials, setMaterials] = useState<DigitalLessonMaterial[]>(() => {
    const saved = localStorage.getItem('coderkids_digital_materials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading materials:', e);
      }
    }
    return INITIAL_DIGITAL_LESSON_MATERIALS;
  });

  useEffect(() => {
    localStorage.setItem('coderkids_digital_materials', JSON.stringify(materials));
  }, [materials]);

  const [materialFilterType, setMaterialFilterType] = useState<string>('all');
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [previewMaterial, setPreviewMaterial] = useState<DigitalLessonMaterial | null>(null);

  // Teacher Add Material Modal
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matUnit, setMatUnit] = useState('หน่วยที่ 1: การคิดเชิงคำนวณ');
  const [matDesc, setMatDesc] = useState('');
  const [matFileType, setMatFileType] = useState<'pdf' | 'slides' | 'worksheet' | 'code' | 'video' | 'link'>('pdf');
  const [matFileName, setMatFileName] = useState('');
  const [matSnippet, setMatSnippet] = useState('');
  const [matTags, setMatTags] = useState('สพฐ., ป.4, สื่อการสอน');
  const [matExternalUrl, setMatExternalUrl] = useState('');

  // 5. Poll & Feed State
  const [posts, setPosts] = useState<ClassroomPost[]>(CLASSROOM_POSTS);
  const [poll, setPoll] = useState<ClassroomPoll>(CLASSROOM_POLL);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`coderkids_vc_poll_choice_${CLASSROOM_POLL.id}`);
    } catch {
      return null;
    }
  });
  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`coderkids_vc_poll_voted_${CLASSROOM_POLL.id}`) === '1';
    } catch {
      return false;
    }
  });
  const [newQuestionText, setNewQuestionText] = useState('');

  // 6. Enter & Create Room Modals
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [inputClassroomCode, setInputClassroomCode] = useState('');
  const [enterError, setEnterError] = useState<string | null>(null);
  const [enterSuccess, setEnterSuccess] = useState<string | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState(`COD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [createTeacherName, setCreateTeacherName] = useState('ครูสมคิด & ครูอารีย์');
  const [createGrade, setCreateGrade] = useState('ประถมศึกษาปีที่ 4/1');
  const [createSchool, setCreateSchool] = useState('โรงเรียนอนุบาลนราธิวาส');
  const [createDesc, setCreateDesc] = useState('ฝึกทักษะการคิดเชิงคำนวณ เขียนโปรแกรม Scratch และต่อบอร์ด Micro:bit');
  const [copiedCode, setCopiedCode] = useState(false);

  // Real-time Firestore subscriptions for the active classroom
  useEffect(() => {
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    if (!isValidVirtualRoomCode(roomCode)) return;

    setCloudRoomExists(false);
    setCloudMembers([]);
    setCloudAssignments([]);
    setCloudSubmissions([]);
    setCloudSchedules([]);
    setCloudMaterials([]);
    setCloudPosts([]);

    const unsubRoom = subscribeVirtualClassroomInFirestore(
      roomCode,
      (cloudRoom) => {
        if (cloudRoom) {
          setCloudRoomExists(true);
          setClassrooms((prev) => mergeVirtualClassrooms(prev, [cloudRoom]));
        } else {
          setCloudRoomExists(false);
        }
      },
      (err) => console.warn('Room subscription error:', err)
    );

    const unsubMembers = subscribeVirtualClassroomMembersInFirestore(
      roomCode,
      (members) => setCloudMembers(members),
      (err) => console.warn('Members subscription error:', err)
    );

    const unsubAssignments = subscribeVirtualClassroomAssignmentsInFirestore(
      roomCode,
      (items) => setCloudAssignments(items),
      (err) => console.warn('Assignments subscription error:', err)
    );

    const unsubSubmissions = subscribeVirtualClassroomSubmissionsInFirestore(
      roomCode,
      Boolean(isAdmin && currentRole === 'teacher'),
      (subs) => setCloudSubmissions(subs),
      (err) => console.warn('Submissions subscription error:', err)
    );

    const unsubSchedules = subscribeVirtualClassroomSchedulesInFirestore(
      roomCode,
      (items) => setCloudSchedules(items),
      (err) => console.warn('Schedules subscription error:', err)
    );

    const unsubMaterials = subscribeVirtualClassroomMaterialsInFirestore(
      roomCode,
      (items) => setCloudMaterials(items),
      (err) => console.warn('Materials subscription error:', err)
    );

    const unsubPosts = subscribeVirtualClassroomPostsInFirestore(
      roomCode,
      (items) => setCloudPosts(items),
      (err) => console.warn('Posts subscription error:', err)
    );

    return () => {
      unsubRoom();
      unsubMembers();
      unsubAssignments();
      unsubSubmissions();
      unsubSchedules();
      unsubMaterials();
      unsubPosts();
    };
  }, [currentRoom.code, isAdmin, currentRole]);

  // Register current user in /virtualClassrooms/{roomCode}/members when room exists on cloud
  useEffect(() => {
    if (!cloudRoomExists) return;
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    if (!isValidVirtualRoomCode(roomCode)) return;

    joinVirtualClassroomMemberInFirestore({
      roomCode,
      displayName: studentName || profile?.name || 'ผู้เรียน Coder Kids',
      avatarEmoji: profile?.avatarEmoji || '🐱',
      role: isAdmin && currentRole === 'teacher' ? 'teacher' : 'student',
    }).catch((err) => {
      console.warn('Member sync skipped:', err);
    });
  }, [
    cloudRoomExists,
    currentRoom.code,
    studentName,
    profile?.name,
    profile?.avatarEmoji,
    isAdmin,
    currentRole,
  ]);

  // Helper: ensure teacher's room exists in Firestore before creating subcollection items
  const ensureCloudRoomForTeacherWrite = async (): Promise<boolean> => {
    if (!isAdmin || !isCloudFirestoreReadyForUser()) return false;
    if (cloudRoomExists) return true;
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    if (!isValidVirtualRoomCode(roomCode)) return false;
    try {
      const created = await createOrUpdateVirtualClassroomInFirestore({
        code: roomCode,
        name: currentRoom.name,
        teacherName: currentRoom.teacherName,
        grade: currentRoom.grade,
        school: currentRoom.school || 'โรงเรียนอนุบาลนราธิวาส',
        description: currentRoom.description,
        studentsCount: Math.max(1, currentRoom.studentsCount || 1),
      });
      if (created) {
        setCloudRoomExists(true);
        setClassrooms((prev) => mergeVirtualClassrooms(prev, [created]));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Could not ensure cloud room:', err);
      return false;
    }
  };

  // Merge cloud & local assignments for the active room
  const effectiveAssignments = useMemo(() => {
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    const isBuiltIn = isBuiltInDefaultRoomCode(roomCode);
    const seen = new Map<string, ClassroomAssignment>();

    for (const ca of cloudAssignments) {
      seen.set(ca.id, ca);
    }
    for (const la of assignments) {
      const target = normalizeVirtualRoomCode(la.targetRoomCode || '');
      const belongsToRoom = target ? target === roomCode : isBuiltIn;
      if (belongsToRoom && !seen.has(la.id)) {
        seen.set(la.id, la);
      }
    }

    return mergeAssignmentsWithSubmissions(
      Array.from(seen.values()),
      cloudSubmissions,
      currentRole === 'teacher'
    );
  }, [currentRoom.code, cloudAssignments, assignments, cloudSubmissions, currentRole]);

  // Group all cloud submissions by assignmentId for teacher grading view
  const submissionsByAssignmentId = useMemo(() => {
    const map = new Map<string, VirtualClassroomSubmissionRecord[]>();
    for (const sub of cloudSubmissions) {
      const list = map.get(sub.assignmentId) || [];
      list.push(sub);
      map.set(sub.assignmentId, list);
    }
    return map;
  }, [cloudSubmissions]);

  // Statistics for assignments
  const assignmentStats = useMemo(() => {
    const total = effectiveAssignments.length;
    const submitted = effectiveAssignments.filter((a) => a.status === 'submitted').length;
    const graded = effectiveAssignments.filter((a) => a.status === 'graded').length;
    const pending = effectiveAssignments.filter((a) => a.status === 'pending').length;
    const completedOrSubmitted = submitted + graded;
    const percent = total > 0 ? Math.round((completedOrSubmitted / total) * 100) : 0;
    const totalEarnedPoints = effectiveAssignments
      .filter((a) => a.status === 'graded' || a.status === 'submitted')
      .reduce((sum, a) => sum + (a.score || a.rewardPoints || 0), 0);

    return { total, submitted, graded, pending, percent, totalEarnedPoints };
  }, [effectiveAssignments]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === 'all') return effectiveAssignments;
    return effectiveAssignments.filter((a) => a.status === assignmentFilter);
  }, [effectiveAssignments, assignmentFilter]);

  // Effective & Filtered Schedules (cloud + local)
  const effectiveSchedules = useMemo(() => {
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    const isBuiltIn = isBuiltInDefaultRoomCode(roomCode);
    const seen = new Map<string, ClassScheduleItem>();
    for (const cs of cloudSchedules) {
      seen.set(cs.id, cs);
    }
    for (const ls of schedules) {
      const sCode = normalizeVirtualRoomCode(ls.roomCode);
      const matchesRoom = (sCode === 'ALL' && isBuiltIn) || sCode === roomCode;
      if (matchesRoom && !seen.has(ls.id)) {
        seen.set(ls.id, ls);
      }
    }
    return Array.from(seen.values());
  }, [cloudSchedules, schedules, currentRoom.code]);

  const filteredSchedules = useMemo(() => {
    return effectiveSchedules.filter((s) => {
      return selectedDayFilter === 'all' || s.dayOfWeek === selectedDayFilter;
    });
  }, [effectiveSchedules, selectedDayFilter]);

  // Effective & Filtered Materials (cloud + local)
  const effectiveMaterials = useMemo(() => {
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    const isBuiltIn = isBuiltInDefaultRoomCode(roomCode);
    const seen = new Map<string, DigitalLessonMaterial>();
    for (const cm of cloudMaterials) {
      seen.set(cm.id, cm);
    }
    for (const lm of materials) {
      const mCode = normalizeVirtualRoomCode(lm.roomCode);
      const matchesRoom = (mCode === 'ALL' && isBuiltIn) || mCode === roomCode;
      if (matchesRoom && !seen.has(lm.id)) {
        seen.set(lm.id, lm);
      }
    }
    return Array.from(seen.values());
  }, [cloudMaterials, materials, currentRoom.code]);

  const filteredMaterials = useMemo(() => {
    return effectiveMaterials.filter((m) => {
      const matchesType = materialFilterType === 'all' || m.fileType === materialFilterType;
      const q = materialSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.unitTopic.toLowerCase().includes(q) ||
        m.uploadedBy.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [effectiveMaterials, materialFilterType, materialSearchQuery]);

  // Effective Posts (cloud + built-in fallback)
  const effectivePosts = useMemo(() => {
    const roomCode = normalizeVirtualRoomCode(currentRoom.code);
    const isBuiltIn = isBuiltInDefaultRoomCode(roomCode);
    const seen = new Map<string, ClassroomPost>();
    for (const cp of cloudPosts) {
      seen.set(cp.id, cp);
    }
    if (isBuiltIn || !cloudRoomExists) {
      for (const lp of posts) {
        if (!seen.has(lp.id)) {
          seen.set(lp.id, lp);
        }
      }
    }
    return Array.from(seen.values());
  }, [cloudPosts, posts, currentRoom.code, cloudRoomExists]);

  // Handle student submit homework
  const handleConfirmSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || submittingAssignment.status !== 'pending') return;

    const targetAssignment = submittingAssignment;
    const cleanText = submissionText.trim() || 'นักเรียนส่งงานผ่านระบบเรียบร้อยแล้ว';
    const cleanUrl = submissionUrl.trim() || undefined;
    const cleanFile = submissionFileName.trim() || 'project_submission.sb3';

    if (cloudRoomExists) {
      try {
        await submitVirtualClassroomHomeworkInFirestore(currentRoom.code, {
          assignmentId: targetAssignment.id,
          studentName: studentName || profile?.name || 'นักเรียน Coder Kids',
          submissionText: cleanText,
          submissionUrl: cleanUrl,
          submissionFileName: cleanFile,
        });
      } catch (err) {
        console.warn('Cloud submission failed, keeping local state:', err);
      }
    }

    soundEffects.playSuccess();
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === targetAssignment.id
          ? {
              ...a,
              status: 'submitted' as const,
              submissionDate: 'ส่งเมื่อสักครู่',
              submissionText: cleanText,
              submissionUrl: cleanUrl,
              submissionFileName: cleanFile,
            }
          : a
      )
    );

    const safeReward = Math.max(5, Math.min(50, Number(targetAssignment.rewardPoints) || 20));
    addPoints(safeReward, `ส่งการบ้าน: ${targetAssignment.title}`, 'classroom', {
      uniqueKey: `vc_hw_${targetAssignment.id}`,
    });
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });

    setEnterSuccess(`ส่งการบ้าน "${targetAssignment.title}" เรียบร้อยแล้ว! (+${safeReward} แต้ม)`);
    setSubmittingAssignment(null);
    setSubmissionText('');
    setSubmissionUrl('');
    setSubmissionFileName('');
    setTimeout(() => setEnterSuccess(null), 4000);
  };

  // Handle teacher grading homework
  const handleConfirmGrading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !gradingAssignment) return;

    const cleanScore = Math.max(0, Math.min(100, Number(gradingScore) || gradingAssignment.rewardPoints || 0));
    const cleanFeedback = gradingFeedback.trim() || 'ยอดเยี่ยมมาก ผลงานถูกต้องและมีความคิดสร้างสรรค์';

    if (gradingSubmissionId && cloudRoomExists) {
      try {
        await gradeVirtualClassroomSubmissionInFirestore(currentRoom.code, gradingSubmissionId, {
          score: cleanScore,
          teacherFeedback: cleanFeedback,
        });
      } catch (err) {
        console.warn('Cloud grading failed:', err);
      }
    }

    soundEffects.playFanfare();
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === gradingAssignment.id
          ? {
              ...a,
              status: 'graded' as const,
              score: cleanScore,
              teacherFeedback: cleanFeedback,
            }
          : a
      )
    );

    setEnterSuccess(
      `บันทึกผลการตรวจการบ้าน "${gradingAssignment.title}"${gradingStudentName ? ` ของ ${gradingStudentName}` : ''} (${cleanScore} คะแนน) เรียบร้อยแล้ว!`
    );
    setGradingAssignment(null);
    setGradingSubmissionId(null);
    setGradingStudentName('');
    setGradingFeedback('');
    setTimeout(() => setEnterSuccess(null), 4000);
  };

  // Handle teacher creating new homework
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newHwTitle.trim()) return;

    soundEffects.playClick();
    const clampedPoints = Math.max(5, Math.min(50, Number(newHwPoints) || 30));
    const newAssignment: ClassroomAssignment = {
      id: `hw_${Date.now()}`,
      title: newHwTitle.trim(),
      moduleKey: newHwModuleKey,
      dueDate: newHwDueDate.trim() || 'ศุกร์นี้ 18:00 น.',
      teacherNote: newHwTeacherNote.trim() || 'ให้นักเรียนศึกษาและปฏิบัติตามคำสั่งที่ได้รับมอบหมาย',
      rewardPoints: clampedPoints,
      status: 'pending',
      maxScore: clampedPoints,
      targetRoomCode: currentRoom.code,
    };

    const roomReady = await ensureCloudRoomForTeacherWrite();
    if (roomReady) {
      try {
        await createVirtualClassroomAssignmentInFirestore(currentRoom.code, newAssignment);
      } catch (err) {
        console.warn('Cloud assignment save failed:', err);
      }
    }

    setAssignments((prev) => [newAssignment, ...prev]);
    setIsCreateAssignmentModalOpen(false);
    setNewHwTitle('');
    setNewHwTeacherNote('');
    setEnterSuccess(`คุณครูเพิ่มการบ้านใหม่ "${newAssignment.title}" เรียบร้อยแล้ว!`);
    setTimeout(() => setEnterSuccess(null), 4000);
  };

  // Handle teacher adding schedule item
  const handleAddScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !schedTopic.trim()) return;

    soundEffects.playClick();
    const dayLabels: Record<string, string> = {
      monday: 'วันจันทร์',
      tuesday: 'วันอังคาร',
      wednesday: 'วันพุธ',
      thursday: 'วันพฤหัสบดี',
      friday: 'วันศุกร์',
    };

    const newItem: ClassScheduleItem = {
      id: `sched_${Date.now()}`,
      roomCode: currentRoom.code,
      dayOfWeek: schedDay,
      dayLabel: dayLabels[schedDay] || 'วันเรียน',
      startTime: schedStart,
      endTime: schedEnd,
      period: schedDay === 'monday' ? 2 : schedDay === 'tuesday' ? 5 : 3,
      subjectCode: schedSubject.split(' ')[0] || 'ว14101',
      subjectName: schedSubject,
      topic: schedTopic.trim(),
      unitTitle: 'หน่วยการเรียนรู้จัดสรรโดยครู',
      roomLocation: schedRoom.trim() || 'ห้องคอมพิวเตอร์',
      teacherName: schedTeacher.trim() || currentRoom.teacherName,
      onlineMeetUrl: schedMeetUrl.trim() || undefined,
      colorTheme: 'from-indigo-600 to-purple-700',
    };

    const roomReady = await ensureCloudRoomForTeacherWrite();
    if (roomReady) {
      try {
        await createVirtualClassroomScheduleInFirestore(currentRoom.code, newItem);
      } catch (err) {
        console.warn('Cloud schedule save failed:', err);
      }
    }

    setSchedules((prev) => [...prev, newItem]);
    setIsAddScheduleModalOpen(false);
    setSchedTopic('');
    setEnterSuccess(`เพิ่มคาบเรียน "${newItem.topic}" ลงในตารางเรียนเรียบร้อยแล้ว!`);
    setTimeout(() => setEnterSuccess(null), 4000);
  };

  // Handle teacher adding digital lesson material
  const handleAddDigitalMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !matTitle.trim()) return;

    soundEffects.playSuccess();
    const typeLabels: Record<string, string> = {
      pdf: 'เอกสารสรุปความรู้ (PDF)',
      slides: 'สไลด์การสอน (PDF/Slides)',
      worksheet: 'ใบงานดิจิทัล (Worksheet)',
      code: 'ไฟล์โค้ดตัวอย่าง (.sb3 / .hex)',
      video: 'วิดีโอบทเรียน (Video Tutorial)',
      link: 'ลิงก์สื่อภายนอก (Link)',
    };

    const newMaterial: DigitalLessonMaterial = {
      id: `mat_${Date.now()}`,
      roomCode: currentRoom.code,
      title: matTitle.trim(),
      description: matDesc.trim() || 'เอกสารประกอบการจัดการเรียนรู้วิทยาการคำนวณ',
      fileType: matFileType,
      fileTypeLabel: typeLabels[matFileType] || 'ไฟล์ดิจิทัล',
      fileName: matFileName.trim() || `${matTitle.trim().replace(/\s+/g, '_')}.${matFileType === 'code' ? 'sb3' : 'pdf'}`,
      fileSize: matFileType === 'video' ? '35.4 MB' : matFileType === 'code' ? '1.8 MB' : '2.5 MB',
      downloadUrl: `#download-${Date.now()}`,
      externalUrl: matExternalUrl.trim() || undefined,
      uploadDate: 'วันนี้',
      uploadedBy: currentRole === 'teacher' ? (profile?.name || currentRoom.teacherName) : 'คุณครูผู้สอน',
      unitTopic: matUnit,
      tags: matTags.split(',').map((t) => t.trim()).filter(Boolean),
      previewSnippet: matSnippet.trim() || '• เนื้อหาบทเรียนจัดสรรโดยคุณครูประจำวิชา พร้อมดาวน์โหลดไปทบทวนและฝึกปฏิบัติ',
      downloadsCount: 1,
    };

    const roomReady = await ensureCloudRoomForTeacherWrite();
    if (roomReady) {
      try {
        await createVirtualClassroomMaterialInFirestore(currentRoom.code, newMaterial);
      } catch (err) {
        console.warn('Cloud material save failed:', err);
      }
    }

    setMaterials((prev) => [newMaterial, ...prev]);
    setIsAddMaterialModalOpen(false);
    setMatTitle('');
    setMatDesc('');
    setMatFileName('');
    setMatSnippet('');
    setEnterSuccess(`คุณครูจัดสรรสื่อบทเรียนใหม่ "${newMaterial.title}" เรียบร้อยแล้ว!`);
    addPoints(25, `คุณครูจัดสรรสื่อดิจิทัล: ${newMaterial.title}`, 'classroom', { uniqueKey: `vc_mat_${newMaterial.id}` });
    setTimeout(() => setEnterSuccess(null), 4000);
  };

  const [pendingDeleteMatId, setPendingDeleteMatId] = useState<string | null>(null);

  // Handle delete material (two-step in-app confirmation, zero browser confirm dialog)
  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!isAdmin) return;
    soundEffects.playClick();
    if (pendingDeleteMatId !== id) {
      setPendingDeleteMatId(id);
      setTimeout(() => {
        setPendingDeleteMatId((curr) => (curr === id ? null : curr));
      }, 4000);
      return;
    }

    if (cloudRoomExists && isCloudFirestoreReadyForUser()) {
      try {
        await deleteVirtualClassroomMaterialInFirestore(currentRoom.code, id);
      } catch (err) {
        console.warn('Cloud material delete failed:', err);
      }
    }

    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setPendingDeleteMatId(null);
    setEnterSuccess(`ลบสื่อบทเรียน "${title}" เรียบร้อยแล้ว`);
    setTimeout(() => setEnterSuccess(null), 3000);
  };

  // Handle simulated download
  const handleDownloadFile = (material: DigitalLessonMaterial) => {
    soundEffects.playClick();
    setMaterials((prev) =>
      prev.map((m) => (m.id === material.id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m))
    );
    if (cloudRoomExists && cloudMaterials.some((cm) => cm.id === material.id)) {
      incrementVirtualClassroomMaterialDownloadInFirestore(currentRoom.code, material.id).catch(() => {});
    }

    // Create a real downloadable text/blob demo
    const blobContent = `สื่อการเรียนรู้ดิจิทัล: ${material.title}\nหน่วยการเรียนรู้: ${material.unitTopic}\nผู้จัดสรร: ${material.uploadedBy}\nวันที่: ${material.uploadDate}\n\nเนื้อหาสาระสำคัญ:\n${material.previewSnippet || material.description}\n\nโรงเรียน: ${currentRoom.school}\nห้องเรียน: ${currentRoom.name} (${currentRoom.code})`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = material.fileName.endsWith('.txt') || material.fileName.includes('.') ? material.fileName : `${material.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setEnterSuccess(`ดาวน์โหลดไฟล์ "${material.fileName}" เรียบร้อยแล้ว!`);
    setTimeout(() => setEnterSuccess(null), 3000);
  };

  // Handle Student / Member Entering Classroom by Code (Checks Cloud Firestore first!)
  const handleEnterClassroom = async (codeToJoin?: string) => {
    const rawCode = codeToJoin !== undefined ? codeToJoin : inputClassroomCode;
    const targetCode = normalizeVirtualRoomCode(rawCode);
    if (!targetCode) {
      setEnterError('กรุณากรอกรหัสห้องเรียน เช่น COD-2026 หรือ CK-P4-02');
      return;
    }
    if (!isValidVirtualRoomCode(targetCode)) {
      setEnterError('รหัสห้องเรียนต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีด (- / _) ความยาว 3-20 ตัวอักษร');
      return;
    }

    setIsJoiningRoom(true);
    setEnterError(null);

    let cloudRoom: VirtualClassroomRoom | null = null;
    try {
      cloudRoom = await getVirtualClassroomFromFirestore(targetCode);
    } catch (err) {
      console.warn('Cloud classroom lookup error, falling back to local cache:', err);
    }

    const localFound = classrooms.find((c) => normalizeVirtualRoomCode(c.code) === targetCode) || null;
    const found = cloudRoom || localFound;

    if (!found) {
      setIsJoiningRoom(false);
      setEnterError(`ไม่พบห้องเรียนรหัส "${targetCode}" กรุณาตรวจสอบรหัสจากคุณครู หรือเลือกห้องเรียนที่มีในระบบด้านล่าง`);
      return;
    }

    if (cloudRoom) {
      setClassrooms((prev) => mergeVirtualClassrooms(prev, [cloudRoom]));
      joinVirtualClassroomMemberInFirestore({
        roomCode: cloudRoom.code,
        displayName: studentName || profile?.name || 'ผู้เรียน Coder Kids',
        avatarEmoji: profile?.avatarEmoji || '🐱',
        role: isAdmin && currentRole === 'teacher' ? 'teacher' : 'student',
      }).catch((err) => console.warn('Could not register classroom member:', err));
    }

    setActiveRoomCode(found.code);
    if (profile && onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        enrolledClassroomCode: found.code,
      });
    }

    setIsJoiningRoom(false);
    setIsEnterModalOpen(false);
    setInputClassroomCode('');
    setEnterError(null);
    setEnterSuccess(`เข้าร่วมห้องเรียน "${found.name}" (รหัส: ${found.code}) สำเร็จแล้ว!`);
    addPoints(20, `กรอกรหัสเข้าเรียนห้อง ${found.name}`, 'classroom', { uniqueKey: `vc_join_${found.code}` });
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setEnterSuccess(null), 5000);
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundEffects.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Poll voting
  const handleVotePoll = (optionId: string) => {
    try {
      if (hasVoted || localStorage.getItem(`coderkids_vc_poll_voted_${poll.id}`) === '1') {
        setHasVoted(true);
        return;
      }
      localStorage.setItem(`coderkids_vc_poll_voted_${poll.id}`, '1');
      localStorage.setItem(`coderkids_vc_poll_choice_${poll.id}`, optionId);
    } catch {
      if (hasVoted) return;
    }

    setSelectedPollOption(optionId);
    setHasVoted(true);
    setPoll((prev) => ({
      ...prev,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
    }));

    addPoints(15, 'ร่วมโหวตในโพลล์ห้องเรียนสด', 'classroom', { uniqueKey: `vc_poll_${poll.id}` });
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
  };

  // Post in Feed
  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestionText.trim().length < 2) return;

    soundEffects.playClick();
    const postId = `post_${Date.now()}`;
    const authorName = studentName || profile?.name || 'คุณ (นักเรียน)';
    const authorRole: 'teacher' | 'student' = currentRole === 'teacher' ? 'teacher' : 'student';
    const content = newQuestionText.trim();

    if (cloudRoomExists) {
      try {
        await createVirtualClassroomPostInFirestore(currentRoom.code, {
          postId,
          authorName,
          authorRole,
          content,
        });
      } catch (err) {
        console.warn('Cloud post failed, keeping local post:', err);
      }
    }

    const newPost: ClassroomPost = {
      id: postId,
      authorName,
      authorRole,
      content,
      timestamp: 'เมื่อสักครู่',
      likes: 1,
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewQuestionText('');
    addPoints(10, 'ถามข้อสงสัยในบอร์ดห้องเรียน', 'classroom', { maxPerDay: 2, cooldownMs: 15000 });
  };

  const handleLikePost = (postId: string) => {
    soundEffects.playClick();
    if (cloudRoomExists && cloudPosts.some((cp) => cp.id === postId)) {
      likeVirtualClassroomPostInFirestore(currentRoom.code, postId).catch(() => {});
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
      {/* 0. Notification Feedback Banner */}
      {enterSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{enterSuccess}</span>
          </div>
          <button
            onClick={() => setEnterSuccess(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 0.1 Role Switcher & Admin Notice Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 px-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">ระบบห้องเรียนออนไลน์ปลอดภัย:</span>
          <span className="hidden md:inline text-slate-500 dark:text-slate-400">คุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA</span>
        </div>

        {/* Role Toggle Button */}
        <div className="flex items-center bg-white dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs self-end sm:self-auto">
          <button
            onClick={() => {
              soundEffects.playClick();
              setCurrentRole('student');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRole === 'student'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>มุมมองนักเรียน</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentRole('teacher');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentRole === 'teacher'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>มุมมองคุณครู (จัดการห้อง)</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Classroom Top Banner with Action Buttons */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ห้องเรียนเสมือนจริงออนไลน์ (Virtual Classroom)</span>
              <span aria-hidden="true">·</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-md text-amber-300 font-mono font-bold tracking-wider">
                รหัสห้อง: {currentRoom.code}
              </span>
              <button
                onClick={() => handleCopyCode(currentRoom.code)}
                title="คัดลอกรหัสห้องเรียน"
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{currentRoom.name}</span>
              {currentRole === 'teacher' && (
                <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                  โหมดคุณครู
                </span>
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentRoom.school || 'โรงเรียนอนุบาลนราธิวาส'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentRoom.grade || 'ประถมศึกษาปีที่ 4/1'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>สมาชิก {Math.max(currentRoom.studentsCount, cloudMembers.length)} คน</span>
              </span>
              {cloudRoomExists && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ซิงค์ Cloud Real-Time
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-indigo-200">ครูผู้สอน: {currentRoom.teacherName}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed pt-1">
              {currentRoom.description || 'พื้นที่รวมสถานะการบ้าน ตารางเรียนประจำสัปดาห์ คลังสื่อบทเรียนดิจิทัลที่ครูจัดสรร และเวทีแลกเปลี่ยน'}
            </p>
          </div>

          {/* Action Hub: Enter Code (Students) & Create Room (Teachers) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Student Action: Enter Classroom by Code */}
            <button
              onClick={() => {
                setEnterError(null);
                setIsEnterModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>🔑 กรอกรหัสเพื่อสลับห้อง</span>
            </button>

            {/* Teacher Action: Create Classroom */}
            {currentRole === 'teacher' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 rounded-2xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>+ สร้างห้องเรียนใหม่</span>
              </button>
            )}

            {/* Leaderboard Link */}
            <button
              onClick={() => onNavigateModule('leaderboard')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold border border-indigo-400/30 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              title="ดูทำเนียบจัดอันดับคะแนนของผู้เรียนในห้องเรียนนี้"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>🏆 ดู Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 Quick Classroom Switcher Strip */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>ห้องเรียนในระบบ ({classrooms.length} ห้อง):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {classrooms.map((room) => {
            const isCurrent = room.code.toUpperCase() === currentRoom.code.toUpperCase();
            return (
              <button
                key={room.id}
                onClick={() => handleEnterClassroom(room.code)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <span className="font-mono text-[11px] font-bold opacity-80">{room.code}</span>
                <span>·</span>
                <span className="truncate max-w-[150px]">{room.name}</span>
                {isCurrent && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-4xl text-xs font-semibold">
        {/* Tab 1: Homework & Assignments */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('assignments');
          }}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'assignments'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>สถานะการบ้าน ({effectiveAssignments.length})</span>
        </button>

        {/* Tab 2: Timetable / Class Schedule */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('schedule');
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'schedule'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>ตารางเรียน ({filteredSchedules.length})</span>
        </button>

        {/* Tab 3: Custom Digital Lesson Materials */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('materials');
          }}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'materials'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-500" />
          <span>สื่อบทเรียนดิจิทัล ({effectiveMaterials.length})</span>
        </button>

        {/* Tab 4: Live Poll */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('poll');
          }}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'poll'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
          <span>โพลล์สด</span>
        </button>

        {/* Tab 5: Feed / Q&A */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('feed');
          }}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'feed'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
          <span>กระดานถาม-ตอบ ({effectivePosts.length})</span>
        </button>

        {/* Tab 6: Classroom Members */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveSection('members');
          }}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'members'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          <span>สมาชิก ({cloudMembers.length})</span>
        </button>
      </div>

      {/* ----------------- SECTION 1: HOMEWORK & ASSIGNMENT STATUS ----------------- */}
      {activeSection === 'assignments' && (
        <div className="space-y-6">
          {/* Homework Status Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>สรุปสถานะการบ้านของนักเรียน</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ส่งแล้ว {assignmentStats.submitted + assignmentStats.graded} จาก {assignmentStats.total} ชิ้น ({assignmentStats.percent}%) • คะแนนสะสมจากการบ้าน: {assignmentStats.totalEarnedPoints} แต้ม
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Bar */}
              <div className="w-36 hidden sm:block">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>ความก้าวหน้า</span>
                  <span className="font-bold text-indigo-600">{assignmentStats.percent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${assignmentStats.percent}%` }}
                  />
                </div>
              </div>

              {/* Teacher Button to add assignment */}
              {currentRole === 'teacher' && (
                <button
                  onClick={() => setIsCreateAssignmentModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ครูเพิ่มการบ้านใหม่</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'ทั้งหมด', count: effectiveAssignments.length },
                { id: 'pending', label: '⏳ รอทำ / ยังไม่ส่ง', count: assignmentStats.pending },
                { id: 'submitted', label: '📤 ส่งแล้ว (รอครูตรวจ)', count: assignmentStats.submitted },
                { id: 'graded', label: '✅ ตรวจแล้ว (ผ่านเกณฑ์)', count: assignmentStats.graded },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setAssignmentFilter(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    assignmentFilter === tab.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    assignmentFilter === tab.id
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              แสดง {filteredAssignments.length} รายการ
            </span>
          </div>

          {/* Assignment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>กำหนดส่ง: {item.dueDate}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      +{item.rewardPoints} แต้ม
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <strong className="text-indigo-700 dark:text-indigo-400">คำสั่งจากครู:</strong> {item.teacherNote}
                  </p>

                  {/* Submission detail if submitted or graded */}
                  {item.status !== 'pending' && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>ข้อมูลการส่งงานของนักเรียน:</span>
                        <span className="text-[10px] text-slate-400">{item.submissionDate || 'ส่งแล้ว'}</span>
                      </div>
                      {item.submissionText && (
                        <p className="text-slate-600 dark:text-slate-400 italic">
                          "{item.submissionText}"
                        </p>
                      )}
                      {item.submissionUrl && (
                        <div className="pt-1">
                          <a
                            href={item.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-[11px]"
                          >
                            <span>🔗 ลิงก์โครงงาน: {item.submissionUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {item.submissionFileName && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          📁 ไฟล์แนบ: {item.submissionFileName}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Feedback if graded */}
                  {item.status === 'graded' && item.teacherFeedback && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                        💬 ข้อเสนอแนะจากคุณครู:
                      </span>
                      <p className="text-emerald-900 dark:text-emerald-200">
                        {item.teacherFeedback}
                      </p>
                    </div>
                  )}
                  {/* Teacher view: list of cloud student submissions for this assignment */}
                  {currentRole === 'teacher' && (submissionsByAssignmentId.get(item.id)?.length || 0) > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2 text-xs">
                      <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                        <span>📥 งานที่นักเรียนส่งเข้ามา ({submissionsByAssignmentId.get(item.id)?.length} คน)</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {(submissionsByAssignmentId.get(item.id) || []).map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {sub.studentName}
                                <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                                  ({sub.submittedAt})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                                {sub.submissionText}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                setGradingAssignment(item);
                                setGradingSubmissionId(sub.id);
                                setGradingStudentName(sub.studentName);
                                setGradingScore(sub.score ?? item.rewardPoints ?? 30);
                                setGradingFeedback(
                                  sub.teacherFeedback || 'ผลงานถูกต้อง เรียบร้อย และนำความรู้ไปประยุกต์ใช้ได้ดี'
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                            >
                              {sub.status === 'graded' ? `✅ ${sub.score} คะแนน` : '✏️ ตรวจงาน'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {item.status === 'graded' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ตรวจแล้ว ({item.score || item.rewardPoints}/{item.maxScore || item.rewardPoints} คะแนน)</span>
                      </span>
                    ) : item.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>ส่งแล้ว (รอครูตรวจ)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>รอลงมือปฏิบัติ / ยังไม่ส่ง</span>
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Student Submit Button */}
                    {item.status === 'pending' && (
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          setSubmittingAssignment(item);
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                      >
                        📤 ส่งการบ้านนี้
                      </button>
                    )}

                    {/* Teacher Grade Button */}
                    {currentRole === 'teacher' && (
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          const firstSub = submissionsByAssignmentId.get(item.id)?.[0];
                          setGradingAssignment(item);
                          setGradingSubmissionId(firstSub ? firstSub.id : null);
                          setGradingStudentName(firstSub ? firstSub.studentName : '');
                          setGradingScore(firstSub?.score || item.score || item.rewardPoints || 30);
                          setGradingFeedback(
                            firstSub?.teacherFeedback ||
                              item.teacherFeedback ||
                              'ผลงานถูกต้อง เรียบร้อย และนำความรู้ไปประยุกต์ใช้ได้ดี'
                          );
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        ✏️ {item.status === 'graded' ? 'แก้คะแนน' : 'ตรวจการบ้าน'}
                      </button>
                    )}

                    {/* Direct Navigate to Module */}
                    {item.moduleKey !== 'general' && (
                      <button
                        onClick={() => onNavigateModule(item.moduleKey)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <span>ไปทำภารกิจ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-3xl">🎉</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">ไม่มีรายการการบ้านในหมวดนี้</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">คุณสามารถเลือกดูหมวดอื่น หรือเปลี่ยนตัวกรองเป็น "ทั้งหมด"</p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 2: CLASS TIMETABLE & SCHEDULE ----------------- */}
      {activeSection === 'schedule' && (
        <div className="space-y-6">
          {/* Schedule Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-950 dark:text-amber-200">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>ตารางเรียนประจำสัปดาห์: วิทยาการคำนวณ &amp; โค้ดดิ้ง ({currentRoom.name})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ตรวจสอบเวลาเรียน คาบเรียน หัวข้อบทเรียนประจำวัน และลิงก์เข้าห้องเรียนสด On-site / Google Meet
              </p>
            </div>

            {currentRole === 'teacher' && (
              <button
                onClick={() => setIsAddScheduleModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ ครูเพิ่มคาบเรียนในตาราง</span>
              </button>
            )}
          </div>

          {/* Day of Week Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: '📅 ทั้งสัปดาห์' },
              { id: 'monday', label: 'จันทร์' },
              { id: 'tuesday', label: 'อังคาร' },
              { id: 'wednesday', label: 'พุธ' },
              { id: 'thursday', label: 'พฤหัสบดี' },
              { id: 'friday', label: 'ศุกร์' },
            ].map((day) => (
              <button
                key={day.id}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedDayFilter(day.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDayFilter === day.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Timetable List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between space-y-4 shadow-2xs relative overflow-hidden"
              >
                {/* Live indicator if active */}
                {item.isLiveNow && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 animate-pulse">
                    <Radio className="w-3 h-3" />
                    <span>กำลังเรียนสดตอนนี้</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      {item.dayLabel} • คาบที่ {item.period}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.startTime} - {item.endTime} น.
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.subjectCode} • {item.subjectName}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                      {item.topic}
                    </h4>
                  </div>

                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.roomLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>ผู้สอน: {item.teacherName}</span>
                    </div>
                    {item.materialsNote && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-100 dark:border-amber-900">
                        📌 {item.materialsNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {item.onlineMeetUrl ? (
                    <a
                      href={item.onlineMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>เข้าห้องเรียนสด (Meet)</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">เรียน On-site ในห้องปฏิบัติการ</span>
                  )}

                  {/* Quick Action to Coding Lab / Scratch */}
                  <button
                    onClick={() => onNavigateModule('codingLab')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    title="เปิดห้องปฏิบัติการ Coding Lab"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-3xl">📅</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">ไม่มีคาบเรียนในวันที่เลือก</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">ลองเลือกดูวันอื่นหรือกดดู "ทั้งสัปดาห์"</p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 3: CUSTOM DIGITAL LESSON MATERIALS ----------------- */}
      {activeSection === 'materials' && (
        <div className="space-y-6">
          {/* Materials Header Strip */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-teal-950 dark:text-teal-200">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>คลังสื่อบทเรียนดิจิทัลที่ครูจัดสรร (Custom Digital Learning Resources)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                สไลด์บรรยาย, ใบงาน PDF, ไฟล์โค้ดโปรเจกต์ .sb3/.hex, และวิดีโอคลิปประกอบการสอนที่ครูจัดเตรียมไว้ให้นักเรียนดาวน์โหลด
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentRole === 'teacher' && (
                <button
                  onClick={() => setIsAddMaterialModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ครูเพิ่มสื่อบทเรียนใหม่</span>
                </button>
              )}
              <button
                onClick={() => onNavigateModule('digitalLibrary')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold text-xs hover:bg-teal-50 transition-colors flex items-center gap-1.5"
                title="เปิดคลัง e-Book ฉบับเต็ม"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>เปิดคลัง e-Book กลาง</span>
              </button>
            </div>
          </div>

          {/* Search & File Type Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* File type pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'slides', label: '📊 สไลด์' },
                { id: 'worksheet', label: '📝 ใบงาน' },
                { id: 'code', label: '💻 ไฟล์โค้ด' },
                { id: 'pdf', label: '📄 เอกสาร PDF' },
                { id: 'video', label: '🎥 วิดีโอ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setMaterialFilterType(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    materialFilterType === tab.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อบทเรียน, ไฟล์, แท็ก..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((mat) => {
              const getIcon = () => {
                switch (mat.fileType) {
                  case 'slides':
                    return <Layers className="w-5 h-5 text-amber-500" />;
                  case 'worksheet':
                    return <FileText className="w-5 h-5 text-emerald-500" />;
                  case 'code':
                    return <FileCode className="w-5 h-5 text-sky-500" />;
                  case 'video':
                    return <Video className="w-5 h-5 text-purple-500" />;
                  default:
                    return <FileText className="w-5 h-5 text-rose-500" />;
                }
              };

              return (
                <div
                  key={mat.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {getIcon()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          {mat.fileTypeLabel}
                        </span>
                        {currentRole === 'teacher' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                              pendingDeleteMatId === mat.id
                                ? 'bg-rose-600 text-white'
                                : 'text-slate-400 hover:text-rose-500'
                            }`}
                            title={pendingDeleteMatId === mat.id ? 'คลิกอีกครั้งเพื่อยืนยันการลบ' : 'ลบสื่อนี้'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {pendingDeleteMatId === mat.id && <span>ยืนยันลบ</span>}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {mat.unitTopic}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                        {mat.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {mat.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span>จัดสรรโดย: {mat.uploadedBy}</span>
                      <span className="font-mono">{mat.fileSize || '2 MB'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {/* Preview Button */}
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setPreviewMaterial(mat);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>พรีวิวเนื้อหา</span>
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadFile(mat)}
                      className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="ดาวน์โหลดไฟล์ดิจิทัลนี้"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด ({mat.downloadsCount})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-3xl">🔍</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">ไม่พบสื่อการสอนที่ตรงกับการค้นหา</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">ลองเปลี่ยนตัวกรองชนิดไฟล์ หรือค้นหาด้วยคำอื่น</p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 4: LIVE CLASSROOM POLL ----------------- */}
      {activeSection === 'poll' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                {poll.context}
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {poll.question}
              </h4>
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              {poll.options.map((opt) => {
                const percent = Math.round((opt.votes / poll.totalVotes) * 100) || 0;
                const isSelected = selectedPollOption === opt.id;

                return (
                  <button
                    key={opt.id}
                    disabled={hasVoted}
                    onClick={() => handleVotePoll(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {/* Voting Progress Fill Bar */}
                    {hasVoted && (
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-100/60 dark:bg-indigo-950/60 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{opt.text}</span>
                      {hasVoted && (
                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="text-slate-500 tabular-nums">({opt.votes} โหวต)</span>
                          <span className="font-bold text-indigo-900 dark:text-indigo-300 tabular-nums">{percent}%</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <span>{hasVoted ? 'บันทึกคะแนนโหวตของคุณแล้ว (+15 แต้ม)' : 'คลิกเลือกคำตอบที่คุณคิดว่าใช่ที่สุด'}</span>
              <span className="font-mono">ผู้ร่วมโหวตรวม: {poll.totalVotes} คน</span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 5: FEED & QUESTIONS ----------------- */}
      {activeSection === 'feed' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Post Form */}
          <form
            onSubmit={handlePostQuestion}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>โพสต์ข้อสงสัยหรือแชร์ความคืบหน้าให้เพื่อนและครู</span>
            </div>

            <textarea
              rows={3}
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="พิมพ์ข้อความของคุณที่นี่ เช่น 'ติดปัญหาเขียนบล็อก If ใน Scratch...' หรือ 'บอร์ด Micro:bit อ่านค่าแสงไม่ได้...'"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">ถามอย่างสร้างสรรค์ รับ +10 แต้มสะสม</span>
              <button
                type="submit"
                disabled={!newQuestionText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งข้อความ</span>
              </button>
            </div>
          </form>

          {/* Posts Feed */}
          <div className="space-y-3">
            {effectivePosts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {post.authorRole === 'teacher' ? '👨‍🏫' : '🐱'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>{post.authorName}</span>
                        {post.authorRole === 'teacher' && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                            คุณครู
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{post.timestamp}</div>
                    </div>
                  </div>

                  {post.badge && (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {post.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-9">
                  {post.content}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-50 text-rose-500" />
                    <span>{post.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SECTION 6: CLASSROOM MEMBERS ----------------- */}
      {activeSection === 'members' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-950 dark:text-emerald-200">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>รายชื่อสมาชิกในห้องเรียน {currentRoom.name} ({currentRoom.code})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                แสดงคุณครูและนักเรียนที่เข้าร่วมห้องเรียนผ่านระบบออนไลน์แบบเรียลไทม์ ({cloudMembers.length} คน)
              </p>
            </div>
          </div>

          {cloudMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cloudMembers.map((member) => (
                <div
                  key={member.memberId}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-xl shrink-0">
                      {member.avatarEmoji || '🐱'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {member.role === 'teacher' ? '👩‍🏫 คุณครูผู้สอน' : '🎒 นักเรียน'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      member.role === 'teacher'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {member.role === 'teacher' ? 'Teacher' : 'Online'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-3xl">👥</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">ยังไม่มีสมาชิกออนไลน์ในห้องนี้</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เมื่อนักเรียนนำรหัส <span className="font-mono font-bold text-indigo-600">{currentRoom.code}</span> ไปกรอกเข้าร่วมห้องเรียน รายชื่อจะแสดงที่นี่อัตโนมัติ
              </p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODAL: STUDENT SUBMIT HOMEWORK ----------------- */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ส่งการบ้าน: {submittingAssignment.title}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                    รับ +{submittingAssignment.rewardPoints} แต้มสะสมเมื่อส่ง
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSubmitHomework} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  คำอธิบายหรือสรุปผลการทำโครงงาน:
                </label>
                <textarea
                  required
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="เขียนสรุปสั้นๆ ว่าคุณทำภารกิจนี้อย่างไร แก้บั๊กอะไร และได้ผลลัพธ์แบบไหน..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  แนบลิงก์ผลงาน (Scratch / Replit / Google Drive):
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://scratch.mit.edu/projects/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ชื่อไฟล์ดิจิทัลที่บันทึก (เช่น My_Project.sb3 / code.py):
                </label>
                <input
                  type="text"
                  value={submissionFileName}
                  onChange={(e) => setSubmissionFileName(e.target.value)}
                  placeholder="MyGame_Level1.sb3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  ยืนยันส่งการบ้าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TEACHER GRADING HOMEWORK ----------------- */}
      {gradingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ตรวจการบ้าน: {gradingAssignment.title}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {gradingStudentName
                      ? `กำลังตรวจงานของ: ${gradingStudentName}`
                      : 'ให้คะแนนและพิมพ์ข้อเสนอแนะส่งถึงนักเรียน'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setGradingAssignment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmGrading} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ให้คะแนน (เต็ม {gradingAssignment.maxScore || gradingAssignment.rewardPoints || 30}):
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={gradingAssignment.maxScore || gradingAssignment.rewardPoints || 30}
                  value={gradingScore}
                  onChange={(e) => setGradingScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ข้อเสนอแนะจากคุณครู (Teacher Feedback):
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="ชื่นชมจุดเด่น และให้ข้อคิดเพื่อการพัฒนาต่อยอด..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  บันทึกผลการตรวจ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TEACHER CREATE ASSIGNMENT ----------------- */}
      {isCreateAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>คุณครูเพิ่มการบ้านใหม่</span>
              </h3>
              <button
                onClick={() => setIsCreateAssignmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  หัวข้อการบ้าน:
                </label>
                <input
                  type="text"
                  required
                  value={newHwTitle}
                  onChange={(e) => setNewHwTitle(e.target.value)}
                  placeholder="เช่น การบ้านที่ 5: ออกแบบระบบเปิดไฟถนนอัตโนมัติ Micro:bit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    หมวดหมู่โมดูล:
                  </label>
                  <select
                    value={newHwModuleKey}
                    onChange={(e) => setNewHwModuleKey(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="codingLab">3. Scratch & Micro:bit</option>
                    <option value="thinking">2. การคิดเชิงคำนวณ</option>
                    <option value="safety">1. PDPA & ไซเบอร์</option>
                    <option value="showcase">4. โชว์ผลงาน & สะท้อนคิด</option>
                    <option value="general">ทั่วไป</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    กำหนดส่ง:
                  </label>
                  <input
                    type="text"
                    value={newHwDueDate}
                    onChange={(e) => setNewHwDueDate(e.target.value)}
                    placeholder="ศุกร์หน้า 18:00 น."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  คำสั่งจากครู / รายละเอียดงาน:
                </label>
                <textarea
                  rows={3}
                  value={newHwTeacherNote}
                  onChange={(e) => setNewHwTeacherNote(e.target.value)}
                  placeholder="เขียนคำอธิบายให้นักเรียนเข้าใจขั้นตอน..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  คะแนนแต้มรางวัล:
                </label>
                <input
                  type="number"
                  value={newHwPoints}
                  onChange={(e) => setNewHwPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  สร้างการบ้าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TEACHER ADD SCHEDULE ----------------- */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>+ เพิ่มคาบเรียนในตาราง</span>
              </h3>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddScheduleItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">วัน:</label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="monday">วันจันทร์</option>
                    <option value="tuesday">วันอังคาร</option>
                    <option value="wednesday">วันพุธ</option>
                    <option value="thursday">วันพฤหัสบดี</option>
                    <option value="friday">วันศุกร์</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">เวลา (เริ่ม - สิ้นสุด):</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={schedStart}
                      onChange={(e) => setSchedStart(e.target.value)}
                      placeholder="09:00"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={schedEnd}
                      onChange={(e) => setSchedEnd(e.target.value)}
                      placeholder="10:00"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">รหัสและชื่อวิชา:</label>
                <input
                  type="text"
                  value={schedSubject}
                  onChange={(e) => setSchedSubject(e.target.value)}
                  placeholder="ว14101 วิทยาการคำนวณ ป.4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">หัวข้อบทเรียนประจำคาบ:</label>
                <input
                  type="text"
                  required
                  value={schedTopic}
                  onChange={(e) => setSchedTopic(e.target.value)}
                  placeholder="เช่น ปฏิบัติการต่อบอร์ด Micro:bit V2 วัดอุณหภูมิห้อง"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ห้องเรียน:</label>
                  <input
                    type="text"
                    value={schedRoom}
                    onChange={(e) => setSchedRoom(e.target.value)}
                    placeholder="ห้องปฏิบัติการคอมพิวเตอร์ 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ลิงก์ Meet (ถ้ามี):</label>
                  <input
                    type="url"
                    value={schedMeetUrl}
                    onChange={(e) => setSchedMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  บันทึกลงตาราง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TEACHER ADD DIGITAL MATERIAL ----------------- */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span>+ ครูจัดสรรสื่อบทเรียนดิจิทัล</span>
              </h3>
              <button
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDigitalMaterial} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อสื่อการเรียนรู้:</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="เช่น สไลด์บรรยาย: การออกแบบอัลกอริทึมลูปวนซ้ำ Repeat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ชนิดไฟล์:</label>
                  <select
                    value={matFileType}
                    onChange={(e) => setMatFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="slides">สไลด์การสอน (PDF/Slides)</option>
                    <option value="worksheet">ใบงานดิจิทัล (Worksheet)</option>
                    <option value="code">ไฟล์โค้ดตัวอย่าง (.sb3 / .hex)</option>
                    <option value="pdf">เอกสารสรุปความรู้ (PDF)</option>
                    <option value="video">วิดีโอบทเรียน (Video)</option>
                    <option value="link">ลิงก์สื่อภายนอก (Link)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">หน่วยการเรียนรู้:</label>
                  <input
                    type="text"
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    placeholder="หน่วยที่ 1: การคิดเชิงคำนวณ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อไฟล์ที่ดาวน์โหลด:</label>
                <input
                  type="text"
                  value={matFileName}
                  onChange={(e) => setMatFileName(e.target.value)}
                  placeholder="Lesson1_Repeat_Loops.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">คำอธิบายสื่อ:</label>
                <textarea
                  rows={2}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="อธิบายว่าสื่อชิ้นนี้ใช้สำหรับอะไร และมีกิจกรรมอะไรบ้าง..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ข้อความพรีวิวเนื้อหา / สรุปประเด็นในไฟล์:
                </label>
                <textarea
                  rows={2}
                  value={matSnippet}
                  onChange={(e) => setMatSnippet(e.target.value)}
                  placeholder="เขียนประเด็นสำคัญ เช่น • ตัวแปร Score เก็บแต้ม • Forever loop ตรวจจับการชน..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  บันทึกสื่อดิจิทัล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: MATERIAL PREVIEW ----------------- */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {previewMaterial.title}
                  </h3>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                    {previewMaterial.fileTypeLabel} • จัดสรรโดย {previewMaterial.uploadedBy}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">คำอธิบายเนื้อหา:</strong>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {previewMaterial.description}
                </p>
              </div>

              {previewMaterial.previewSnippet && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">
                    พรีวิวตัวอย่างเนื้อหา / โค้ดในไฟล์:
                  </strong>
                  <pre className="p-3 rounded-xl bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {previewMaterial.previewSnippet}
                  </pre>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex justify-between">
                <span>ชื่อไฟล์: {previewMaterial.fileName}</span>
                <span>ดาวน์โหลดแล้ว {previewMaterial.downloadsCount} ครั้ง</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={() => {
                  handleDownloadFile(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ENTER CLASSROOM BY CODE ----------------- */}
      {isEnterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">กรอกรหัสเพื่อเข้าห้องเรียน</h3>
              </div>
              <button
                onClick={() => setIsEnterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEnterClassroom();
              }}
              className="space-y-3"
            >
              <p className="text-xs text-slate-600 dark:text-slate-400">
                นำรหัสห้องเรียนจากคุณครู เช่น <span className="font-mono font-bold text-amber-600">COD-2026</span> หรือ <span className="font-mono font-bold text-amber-600">CK-P4-02</span> มากรอกเพื่อเข้าสู่พื้นที่เรียนรู้
              </p>

              <input
                type="text"
                value={inputClassroomCode}
                onChange={(e) => {
                  setInputClassroomCode(e.target.value.toUpperCase());
                  setEnterError(null);
                }}
                placeholder="กรอกรหัส เช่น COD-2026"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold tracking-widest text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {enterError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{enterError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isJoiningRoom}
                  onClick={() => setIsEnterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isJoiningRoom}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isJoiningRoom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isJoiningRoom ? 'กำลังค้นหาห้องเรียน...' : 'เข้าร่วมห้องเรียน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TEACHER CREATE CLASSROOM ----------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                <span>คุณครูสร้างห้องเรียนใหม่</span>
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!isAdmin || !createName.trim()) return;

                const trimmedCode = normalizeVirtualRoomCode(
                  createCode.trim() || `COD-${Date.now().toString().slice(-4)}`
                );
                if (!isValidVirtualRoomCode(trimmedCode)) {
                  setCreateError('รหัสห้องเรียนต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีด (- / _) ความยาว 3-20 ตัวอักษร');
                  return;
                }

                setCreateError(null);
                setIsCreatingRoom(true);

                const teacherDisplay = createTeacherName.trim() || 'คุณครูผู้สอน';
                const gradeDisplay = createGrade.trim() || 'ประถมศึกษาปีที่ 4/1';
                const schoolDisplay = createSchool.trim() || 'โรงเรียนอนุบาลนราธิวาส';
                const descDisplay = createDesc.trim() || 'ห้องเรียนวิทยาการคำนวณออนไลน์';

                let createdRoom: VirtualClassroomRoom | null = null;
                if (isCloudFirestoreReadyForUser()) {
                  try {
                    createdRoom = await createOrUpdateVirtualClassroomInFirestore({
                      code: trimmedCode,
                      name: createName.trim(),
                      teacherName: teacherDisplay,
                      grade: gradeDisplay,
                      school: schoolDisplay,
                      description: descDisplay,
                      studentsCount: 1,
                    });
                    if (createdRoom) {
                      joinVirtualClassroomMemberInFirestore({
                        roomCode: createdRoom.code,
                        displayName: studentName || profile?.name || teacherDisplay,
                        avatarEmoji: profile?.avatarEmoji || '👩‍🏫',
                        role: 'teacher',
                      }).catch(() => {});
                    }
                  } catch (err) {
                    console.error('Failed to create virtual classroom in Firestore:', err);
                    setIsCreatingRoom(false);
                    setCreateError('ไม่สามารถบันทึกห้องเรียนขึ้น Cloud ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
                    return;
                  }
                }

                const newRoom: VirtualClassroomRoom = createdRoom || {
                  id: `room_${Date.now()}`,
                  code: trimmedCode,
                  name: createName.trim(),
                  teacherName: teacherDisplay,
                  grade: gradeDisplay,
                  school: schoolDisplay,
                  description: descDisplay,
                  createdAt: 'วันนี้',
                  studentsCount: 1,
                };

                setClassrooms((prev) => mergeVirtualClassrooms(prev, [newRoom]));
                setActiveRoomCode(trimmedCode);
                setIsCreatingRoom(false);
                setIsCreateModalOpen(false);
                setCreateName('');
                setEnterSuccess(
                  `สร้างห้องเรียน "${newRoom.name}" (รหัส: ${trimmedCode}) และซิงค์ออนไลน์ให้นักเรียนเข้าเรียนได้ทันทีเรียบร้อยแล้ว!`
                );
                addPoints(25, `คุณครูสร้างห้องเรียนเสมือน "${newRoom.name}"`, 'classroom', { uniqueKey: `vc_create_${trimmedCode}` });
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                setTimeout(() => setEnterSuccess(null), 5000);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อห้องเรียน:</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="เช่น ห้องเรียนวิทยาการคำนวณ ป.4/3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">รหัสห้องเรียน:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      required
                      value={createCode}
                      onChange={(e) => {
                        setCreateCode(e.target.value.toUpperCase());
                        setCreateError(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const prefixes = ['COD', 'CK', 'ROBOT', 'ALGO'];
                        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
                        const num = Math.floor(1000 + Math.random() * 9000);
                        setCreateCode(`${p}-${num}`);
                        setCreateError(null);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="สุ่มรหัสใหม่"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ระดับชั้น:</label>
                  <input
                    type="text"
                    value={createGrade}
                    onChange={(e) => setCreateGrade(e.target.value)}
                    placeholder="ประถมศึกษาปีที่ 4/1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อครูผู้สอน:</label>
                <input
                  type="text"
                  value={createTeacherName}
                  onChange={(e) => setCreateTeacherName(e.target.value)}
                  placeholder="ครูสมคิด & ครูอารีย์"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">คำอธิบายห้องเรียน:</label>
                <textarea
                  rows={2}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isCreatingRoom}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingRoom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreatingRoom ? 'กำลังสร้างและซิงค์...' : 'ยืนยันสร้างห้องเรียน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
