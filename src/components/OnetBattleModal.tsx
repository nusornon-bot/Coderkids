import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Timer,
  Play,
  X,
  Tv,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  Database,
  Plus,
  Trash2,
  Shuffle,
  SlidersHorizontal,
  RefreshCw,
  BookOpen,
  KeyRound,
  Users,
  Radio,
  GraduationCap,
  Search,
  Star,
  Copy,
  Check,
  Cloud,
  Sparkles,
  Power,
  Eraser,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioReaderButton } from './AudioReaderButton.tsx';
import { ONET_EXAM_SETS } from './ExamArenaModal.tsx';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  BUILTIN_ONET_BATTLE_QUESTIONS,
  ONET_CATEGORY_META,
  ONET_DIFFICULTY_META,
  OnetBattleCategory,
  OnetBattleCategoryFilter,
  OnetBattleDifficulty,
  OnetBattleDifficultyFilter,
  OnetBattleQuestionItem,
  OnetBattleSetFilter,
  OnetBattleSetId,
  filterOnetBattleQuestions,
  getOnetBankBreakdownCounts,
  selectRandomOnetBattleQuestions,
  shuffleOnetQuestionOptions,
} from '../utils/onetBattleSelector.ts';
import { LiveClassroomScoreboard } from './LiveClassroomScoreboard.tsx';
import { BattleClosedSummaryView } from './BattleClosedSummaryView.tsx';
import {
  BattleClosedSummaryData,
  StudentClosedRoomReward,
  buildBattleClosedSummary,
  buildBattleClosedSummaryFromCloudRoom,
  findStudentRewardInClosedSummary,
  hasClaimedClosedRoomReward,
  markClosedRoomRewardClaimed,
} from '../utils/battleCloseSummary.ts';
import {
  hasJoinedBattleRoomInStorage,
  markBattleRoomJoinedInStorage,
  getDuplicateJoinAlertMessage,
} from '../utils/battleJoinGuard.ts';
import {
  LiveQuizParticipantRecord,
  closeLiveRoomAndClearParticipantsInFirestore,
  createOrUpdateLiveRoomInFirestore,
  getLiveParticipantId,
  getLiveRoomFromFirestore,
  hasParticipantJoinedLiveRoomInFirestore,
  isCloudFirestoreReadyForUser,
  joinOrUpdateLiveParticipantInFirestore,
  resetLiveRoomScoresInFirestore,
  subscribeLiveParticipantsInFirestore,
  subscribeLiveRoomInFirestore,
} from '../services/firestoreService.ts';

interface OnetBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  isTeacher?: boolean;
  addPoints: (amount: number, reason: string, category: 'thinking') => void;
  onCelebrate: (
    type: 'badge' | 'module_completed' | 'points_milestone' | 'quiz_perfect',
    title: string,
    desc: string,
    icon: string
  ) => void;
}

interface LocalOnetBattleRoomConfig {
  roomCode: string;
  hostName: string;
  setFilter: OnetBattleSetFilter;
  categoryFilter: OnetBattleCategoryFilter;
  difficulty: OnetBattleDifficultyFilter;
  questionCount: number;
  questionIds: string[];
  status: 'active' | 'closed';
  createdAt: number;
}

const LOCAL_ONET_CUSTOM_BANK_KEY = 'coderkids_onet_battle_custom_questions_v1';
const LOCAL_ONET_ROOMS_KEY = 'coderkids_onet_battle_rooms_v1';
const MAX_ROOM_QUESTIONS = 50;

function loadLocalOnetCustomQuestions(): OnetBattleQuestionItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ONET_CUSTOM_BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q) =>
        q &&
        typeof q.id === 'string' &&
        q.id.startsWith('onet_') &&
        (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') &&
        Array.isArray(q.options) &&
        q.options.length === 4
    );
  } catch {
    return [];
  }
}

function saveLocalOnetCustomQuestions(items: OnetBattleQuestionItem[]): void {
  try {
    localStorage.setItem(LOCAL_ONET_CUSTOM_BANK_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

function loadLocalOnetRooms(): Record<string, LocalOnetBattleRoomConfig> {
  try {
    const raw = localStorage.getItem(LOCAL_ONET_ROOMS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalOnetRoom(room: LocalOnetBattleRoomConfig): void {
  try {
    const existing = loadLocalOnetRooms();
    existing[room.roomCode.toUpperCase()] = room;
    localStorage.setItem(LOCAL_ONET_ROOMS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

function closeLocalOnetRoom(roomCode: string): void {
  try {
    const existing = loadLocalOnetRooms();
    const key = roomCode.trim().toUpperCase();
    if (existing[key]) {
      existing[key] = { ...existing[key], status: 'closed' };
      localStorage.setItem(LOCAL_ONET_ROOMS_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore storage errors
  }
}

function generateOnetPin(excludePin?: string): string {
  let candidate = String(Math.floor(100000 + Math.random() * 900000));
  let guard = 0;
  while (excludePin && candidate === excludePin && guard < 10) {
    candidate = String(Math.floor(100000 + Math.random() * 900000));
    guard += 1;
  }
  return candidate;
}

export const OnetBattleModal: React.FC<OnetBattleModalProps> = ({
  isOpen,
  onClose,
  studentName,
  isTeacher = false,
  addPoints,
  onCelebrate,
}) => {
  const [activeView, setActiveView] = useState<'arena' | 'bank'>('arena');
  const [gameState, setGameState] = useState<
    'lobby' | 'playing' | 'roundResult' | 'podium' | 'closedSummary'
  >('lobby');
  const [gamePin, setGamePin] = useState<string>(() => generateOnetPin());
  const [studentJoinPin, setStudentJoinPin] = useState<string>('');
  const [joinedRoomCode, setJoinedRoomCode] = useState<string>('');
  const [joinedHostName, setJoinedHostName] = useState<string>('');
  const [isRoomOpenedByTeacher, setIsRoomOpenedByTeacher] = useState<boolean>(false);
  const [isRoomSyncedToCloud, setIsRoomSyncedToCloud] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [isOpeningOrJoining, setIsOpeningOrJoining] = useState<boolean>(false);
  const [isClosingOrClearing, setIsClosingOrClearing] = useState<boolean>(false);
  const [cloudParticipants, setCloudParticipants] = useState<LiveQuizParticipantRecord[]>([]);
  const [isScoreboardExpanded, setIsScoreboardExpanded] = useState<boolean>(false);
  const [closedSummary, setClosedSummary] = useState<BattleClosedSummaryData | null>(null);
  const [closedRemovedCount, setClosedRemovedCount] = useState<number>(0);
  const [closedStudentReward, setClosedStudentReward] = useState<StudentClosedRoomReward | null>(
    null
  );

  const [playerNickname, setPlayerNickname] = useState<string>(studentName || 'น้องผู้เข้าสอบ');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Teacher Battle Setup (O-NET Set, Category/Must-Know, Difficulty, Question Count)
  const [selectedSetFilter, setSelectedSetFilter] = useState<OnetBattleSetFilter>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<OnetBattleCategoryFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<OnetBattleDifficultyFilter>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [shuffleChoicesEnabled, setShuffleChoicesEnabled] = useState<boolean>(true);

  // Question Bank State (Built-in 100 O-NET + Local Teacher Custom)
  const [localQuestions, setLocalQuestions] = useState<OnetBattleQuestionItem[]>(() =>
    loadLocalOnetCustomQuestions()
  );
  const [bankNotice, setBankNotice] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Question Bank Filter & Create Form State (Teacher Only)
  const [bankSetFilter, setBankSetFilter] = useState<OnetBattleSetFilter>('all');
  const [bankCategoryFilter, setBankCategoryFilter] = useState<OnetBattleCategoryFilter>('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] =
    useState<OnetBattleDifficultyFilter>('all');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newSetId, setNewSetId] = useState<OnetBattleSetId>('set1');
  const [newCategory, setNewCategory] = useState<OnetBattleCategory>('thinking');
  const [newDifficulty, setNewDifficulty] = useState<OnetBattleDifficulty>('medium');
  const [newIndicator, setNewIndicator] = useState<string>('ว 4.2 ป.6/1');
  const [newIsMustKnow, setNewIsMustKnow] = useState<boolean>(true);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newCodeSnippet, setNewCodeSnippet] = useState<string>('');
  const [newOptions, setNewOptions] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [newCorrectIndex, setNewCorrectIndex] = useState<0 | 1 | 2 | 3>(0);
  const [newExplanation, setNewExplanation] = useState<string>('');

  // Active Match State
  const [activeQuestions, setActiveQuestions] = useState<OnetBattleQuestionItem[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Enforce student cannot access teacher bank or projector mode if role changes
  useEffect(() => {
    if (!isTeacher && activeView !== 'arena') {
      setActiveView('arena');
    }
    if (!isTeacher && isProjectorMode) {
      setIsProjectorMode(false);
    }
  }, [isTeacher, activeView, isProjectorMode]);

  useEffect(() => {
    if (studentName) {
      setPlayerNickname(studentName);
    }
  }, [studentName]);

  // Keep refs synced for real-time closed-room summary without re-subscribing listeners
  const latestParticipantsRef = useRef<LiveQuizParticipantRecord[]>(cloudParticipants);
  const latestScoreRef = useRef<number>(score);
  const latestNicknameRef = useRef<string>(playerNickname || studentName || 'นักเรียน');
  const awardedXpRoomRef = useRef<string | null>(null);
  latestParticipantsRef.current = cloudParticipants;
  latestScoreRef.current = score;
  latestNicknameRef.current = playerNickname || studentName || 'นักเรียน';

  // Cleanly reset student session when re-opening modal after finishing a round so Round 2 works every time
  const resetStudentSession = (
    notice?: { type: 'success' | 'info' | 'error'; text: string } | null
  ) => {
    setStudentJoinPin('');
    setJoinedRoomCode('');
    setJoinedHostName('');
    setActiveQuestions([]);
    setCurrentRound(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCloudParticipants([]);
    setClosedSummary(null);
    setClosedStudentReward(null);
    setGameState('lobby');
    setBankNotice(notice ?? null);
  };

  useEffect(() => {
    if (!isTeacher && isOpen && (gameState === 'podium' || gameState === 'closedSummary')) {
      resetStudentSession(null);
    }
  }, [isOpen, isTeacher]);

  // Real-time Firestore listener for live participants & scores
  useEffect(() => {
    const activeCode = isTeacher ? (isRoomOpenedByTeacher ? gamePin : '') : joinedRoomCode;
    if (!isOpen || !activeCode) {
      return;
    }

    const unsubscribe = subscribeLiveParticipantsInFirestore(
      activeCode,
      (list) => {
        setCloudParticipants(list);
      },
      () => {
        // Keep last known participants gracefully on transient network error
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, isTeacher, isRoomOpenedByTeacher, gamePin, joinedRoomCode]);

  // Real-time room status listener for joined students: show graphical Top 3 summary & auto-award XP coins when teacher closes room
  useEffect(() => {
    if (!isOpen || isTeacher || !joinedRoomCode) {
      return;
    }

    const unsubscribe = subscribeLiveRoomInFirestore(
      joinedRoomCode,
      (room) => {
        if (room && room.status === 'closed') {
          const summary = buildBattleClosedSummaryFromCloudRoom({
            room,
            battleMode: 'onet',
            fallbackParticipants: latestParticipantsRef.current,
          });
          const participantId = getLiveParticipantId();
          const reward = findStudentRewardInClosedSummary(
            summary,
            participantId,
            latestNicknameRef.current,
            latestScoreRef.current
          );

          if (reward && reward.xpReward > 0 && !hasClaimedClosedRoomReward(room.roomCode)) {
            markClosedRoomRewardClaimed(room.roomCode);
            addPoints(
              reward.xpReward,
              `รางวัลเหรียญ XP ${reward.medalTitle} (O-NET Battle ห้อง ${room.roomCode})`,
              'thinking'
            );
            if (reward.isTopThree) {
              onCelebrate(
                'points_milestone',
                `คว้า${reward.medalTitle} O-NET Battle!`,
                `ได้รับเหรียญรางวัล +${reward.xpReward} XP จากห้องประลอง O-NET รหัส ${room.roomCode}`,
                reward.rank === 1 ? '🥇' : reward.rank === 2 ? '🥈' : '🥉'
              );
            }
          }

          setStudentJoinPin('');
          setJoinedRoomCode('');
          setJoinedHostName('');
          setActiveQuestions([]);
          setCurrentRound(0);
          setScore(0);
          setCorrectCount(0);
          setStreak(0);
          setSelectedOption(null);
          setIsAnswerSubmitted(false);
          setCloudParticipants([]);
          setClosedSummary(summary);
          setClosedStudentReward(reward);
          setBankNotice(null);
          setGameState('closedSummary');
        }
      },
      () => {
        // Ignore transient network errors
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, isTeacher, joinedRoomCode]);

  // Combined deduplicated O-NET question bank (100 built-in + custom local)
  const fullQuestionBank = useMemo<OnetBattleQuestionItem[]>(() => {
    const map = new Map<string, OnetBattleQuestionItem>();
    for (const q of BUILTIN_ONET_BATTLE_QUESTIONS) {
      map.set(q.id, q);
    }
    for (const q of localQuestions) {
      map.set(q.id, q);
    }
    return Array.from(map.values());
  }, [localQuestions]);

  const bankBreakdown = useMemo(
    () => getOnetBankBreakdownCounts(fullQuestionBank),
    [fullQuestionBank]
  );

  const eligibleQuestions = useMemo(
    () =>
      filterOnetBattleQuestions(fullQuestionBank, {
        setFilter: selectedSetFilter,
        categoryFilter: selectedCategoryFilter,
        difficultyFilter: selectedDifficulty,
      }),
    [fullQuestionBank, selectedSetFilter, selectedCategoryFilter, selectedDifficulty]
  );

  const maxAllowedCount = Math.min(MAX_ROOM_QUESTIONS, eligibleQuestions.length);

  const effectiveQuestionCount = useMemo(() => {
    if (maxAllowedCount === 0) return 0;
    return Math.max(1, Math.min(questionCount, maxAllowedCount));
  }, [questionCount, maxAllowedCount]);

  const filteredBankDisplay = useMemo(() => {
    const needle = bankSearchQuery.trim().toLowerCase();
    return filterOnetBattleQuestions(fullQuestionBank, {
      setFilter: bankSetFilter,
      categoryFilter: bankCategoryFilter,
      difficultyFilter: bankDifficultyFilter,
    }).filter((q) => {
      if (!needle) return true;
      return (
        q.question.toLowerCase().includes(needle) ||
        q.indicator.toLowerCase().includes(needle) ||
        q.blueprintTopic.toLowerCase().includes(needle) ||
        q.categoryLabel.toLowerCase().includes(needle)
      );
    });
  }, [
    fullQuestionBank,
    bankSetFilter,
    bankCategoryFilter,
    bankDifficultyFilter,
    bankSearchQuery,
  ]);

  // Countdown timer during active round
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (activeView === 'arena' && gameState === 'playing' && timeLeft > 0 && !isAnswerSubmitted) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (
      activeView === 'arena' &&
      gameState === 'playing' &&
      timeLeft === 0 &&
      !isAnswerSubmitted
    ) {
      handleAnswerOption(-1);
    }
    return () => clearTimeout(timer);
  }, [activeView, gameState, timeLeft, isAnswerSubmitted]);

  if (!isOpen) return null;

  const currentQ = activeQuestions[currentRound];

  const getSetShortLabel = (setFilter: OnetBattleSetFilter): string => {
    if (setFilter === 'all') return 'รวมทุกชุด O-NET (10 ชุด)';
    const found = ONET_EXAM_SETS.find((s) => s.id === setFilter);
    return found ? `ชุดที่ ${found.setNumber}` : setFilter;
  };

  const getCategoryLabel = (catFilter: OnetBattleCategoryFilter): string => {
    if (catFilter === 'all') return 'ทุกหมวดสาระ O-NET';
    if (catFilter === 'must_know') return 'เฉพาะตัวชี้วัดต้องรู้';
    return ONET_CATEGORY_META[catFilter].label;
  };

  const setLabelText = getSetShortLabel(selectedSetFilter);
  const categoryLabelText = getCategoryLabel(selectedCategoryFilter);
  const difficultyLabelText =
    selectedDifficulty === 'all'
      ? 'ผสมทุกระดับ'
      : ONET_DIFFICULTY_META[selectedDifficulty].label;

  // Teacher: Publish O-NET battle room PIN + randomized question set to Firestore & local fallback
  const publishTeacherOnetRoom = async (
    drawnQuestions: OnetBattleQuestionItem[],
    stage: 'lobby' | 'question',
    explicitRoomCode?: string
  ): Promise<{ roomCode: string; syncedToCloud: boolean }> => {
    const cleanPin = (explicitRoomCode || gamePin).trim().toUpperCase();
    const cappedQuestions = drawnQuestions.slice(0, MAX_ROOM_QUESTIONS);
    const questionIds = cappedQuestions.map((q) => q.id);

    saveLocalOnetRoom({
      roomCode: cleanPin,
      hostName: playerNickname || 'คุณครู',
      setFilter: selectedSetFilter,
      categoryFilter: selectedCategoryFilter,
      difficulty: selectedDifficulty,
      questionCount: cappedQuestions.length,
      questionIds,
      status: 'active',
      createdAt: Date.now(),
    });

    let syncedToCloud = false;
    if (isCloudFirestoreReadyForUser()) {
      try {
        // Omit platformSet so Firestore /liveRooms rules validate cleanly for O-NET Battle
        syncedToCloud = await createOrUpdateLiveRoomInFirestore({
          roomCode: cleanPin,
          hostName: playerNickname || 'คุณครู',
          title: `Live Classroom O-NET Battle (${setLabelText})`,
          stage,
          currentQuestionIndex: 0,
          status: 'active',
          difficulty: selectedDifficulty,
          questionCount: cappedQuestions.length,
          questionIds,
        });
      } catch {
        syncedToCloud = false;
      }
    }

    setGamePin(cleanPin);
    setIsRoomOpenedByTeacher(true);
    setIsRoomSyncedToCloud(syncedToCloud);
    return { roomCode: cleanPin, syncedToCloud };
  };

  // Teacher: Create a brand-new Battle Room with a randomly generated Room Code (auto-closes previous room & clears old students)
  const handleCreateBattleRoom = async () => {
    if (!isTeacher) return;
    const drawn = selectRandomOnetBattleQuestions(fullQuestionBank, {
      setFilter: selectedSetFilter,
      categoryFilter: selectedCategoryFilter,
      difficultyFilter: selectedDifficulty,
      count: effectiveQuestionCount || 5,
      shuffleOptions: shuffleChoicesEnabled,
    });

    if (drawn.length === 0) {
      setBankNotice({
        type: 'error',
        text: 'ไม่พบข้อสอบ O-NET ที่ตรงกับเงื่อนไขที่เลือก กรุณาปรับตัวกรองใหม่',
      });
      return;
    }

    setIsOpeningOrJoining(true);
    setBankNotice(null);
    setCopiedPin(false);

    try {
      // Automatically close previous open room & remove old participants before generating a fresh Room Code
      if (isRoomOpenedByTeacher && gamePin) {
        closeLocalOnetRoom(gamePin);
        if (isCloudFirestoreReadyForUser()) {
          await closeLiveRoomAndClearParticipantsInFirestore(gamePin).catch(() => {});
        }
      }

      const freshRoomCode = generateOnetPin(isRoomOpenedByTeacher ? gamePin : undefined);
      setClosedSummary(null);
      setClosedStudentReward(null);
      setGameState('lobby');
      setActiveView('arena');
      setCloudParticipants([]);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setCurrentRound(0);

      const { roomCode, syncedToCloud } = await publishTeacherOnetRoom(
        drawn,
        'lobby',
        freshRoomCode
      );
      setActiveQuestions(drawn);
      setBankNotice({
        type: syncedToCloud ? 'success' : 'info',
        text: syncedToCloud
          ? `สร้างห้อง Battle รหัส ${roomCode} และบันทึกข้อมูลขึ้น Firestore เรียบร้อย! เด็กๆ สามารถกรอกรหัส ${roomCode} เพื่อร่วมประลอง O-NET พร้อมกันได้ทันที (${drawn.length} ข้อ)`
          : `สร้างห้อง Battle รหัส ${roomCode} ในเครื่องเรียบร้อย (${drawn.length} ข้อ) · แนะนำให้คุณครูเข้าสู่ระบบด้วย Google เพื่อบันทึกลง Cloud Firestore ให้เด็กๆ เข้าร่วมข้ามเครื่องได้`,
      });
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  // Teacher: Update existing open room's question set in Firestore (keeping the same Room Code)
  const handleUpdateCurrentRoom = async () => {
    if (!isTeacher || !isRoomOpenedByTeacher) return;
    const drawn = selectRandomOnetBattleQuestions(fullQuestionBank, {
      setFilter: selectedSetFilter,
      categoryFilter: selectedCategoryFilter,
      difficultyFilter: selectedDifficulty,
      count: effectiveQuestionCount || 5,
      shuffleOptions: shuffleChoicesEnabled,
    });

    if (drawn.length === 0) {
      setBankNotice({
        type: 'error',
        text: 'ไม่พบข้อสอบ O-NET ที่ตรงกับเงื่อนไขที่เลือก กรุณาปรับตัวกรองใหม่',
      });
      return;
    }

    setIsOpeningOrJoining(true);
    setBankNotice(null);
    try {
      const { roomCode, syncedToCloud } = await publishTeacherOnetRoom(drawn, 'lobby', gamePin);
      setActiveQuestions(drawn);
      setBankNotice({
        type: 'success',
        text: syncedToCloud
          ? `อัปเดตชุดข้อสอบห้องรหัส ${roomCode} บน Firestore เรียบร้อย (${drawn.length} ข้อ)`
          : `อัปเดตชุดข้อสอบห้องรหัส ${roomCode} เรียบร้อย (${drawn.length} ข้อ)`,
      });
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  // Teacher: Clear previous scores in the current active room (sets all participants to 0 pts)
  const handleTeacherClearScores = async () => {
    if (!isTeacher || !isRoomOpenedByTeacher || !gamePin) return;
    setIsClosingOrClearing(true);
    setBankNotice(null);
    try {
      let resetCount = cloudParticipants.length;
      if (isCloudFirestoreReadyForUser()) {
        const res = await resetLiveRoomScoresInFirestore(gamePin).catch(() => ({
          ok: false,
          resetCount: 0,
        }));
        if (res.ok) {
          resetCount = res.resetCount;
        }
      }
      setCloudParticipants((prev) =>
        prev.map((p) => ({ ...p, score: 0, streak: 0, lastAnswerIndex: -1 }))
      );
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setBankNotice({
        type: 'success',
        text: `เคลียร์คะแนนเดิมของห้อง O-NET รหัส ${gamePin} เป็น 0 คะแนนเรียบร้อยแล้ว (${resetCount} คน) พร้อมแข่งรอบถัดไป`,
      });
    } finally {
      setIsClosingOrClearing(false);
    }
  };

  // Teacher: Close room, snapshot Top 3 winners & XP rewards, automatically delete all student participants, and display graphical summary
  const handleTeacherCloseRoom = async () => {
    if (!isTeacher || !isRoomOpenedByTeacher || !gamePin) return;
    const closingCode = gamePin;
    const localSnapshot = [...cloudParticipants];
    setIsClosingOrClearing(true);
    setBankNotice(null);
    try {
      let removedCount = localSnapshot.length;
      let finalParticipants = localSnapshot;
      closeLocalOnetRoom(closingCode);
      if (isCloudFirestoreReadyForUser()) {
        const res = await closeLiveRoomAndClearParticipantsInFirestore(closingCode, {
          fallbackParticipants: localSnapshot,
        }).catch(() => ({
          closed: false,
          removedCount: 0,
          finalParticipants: [] as LiveQuizParticipantRecord[],
          finalTopWinners: [],
        }));
        if (res.closed) {
          removedCount = res.removedCount;
          if (res.finalParticipants.length > 0) {
            finalParticipants = res.finalParticipants;
          }
        }
      }

      const summary = buildBattleClosedSummary({
        roomCode: closingCode,
        battleMode: 'onet',
        battleTitle: `Live Classroom O-NET Battle (${setLabelText})`,
        hostName: playerNickname || 'คุณครู',
        participants: finalParticipants,
      });

      setIsRoomOpenedByTeacher(false);
      setIsRoomSyncedToCloud(false);
      setIsScoreboardExpanded(false);
      setCloudParticipants([]);
      setActiveQuestions([]);
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setGamePin(generateOnetPin(closingCode));
      setClosedRemovedCount(removedCount);
      setClosedStudentReward(null);
      setClosedSummary(summary);
      setActiveView('arena');
      setGameState('closedSummary');
    } finally {
      setIsClosingOrClearing(false);
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(gamePin);
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      }
    } catch {
      // Ignore clipboard permission errors in restricted iframes
    }
  };

  // Teacher: Open (or reuse active) room & start playing immediately; forceFreshRound draws new questions & clears scores
  const handleTeacherStartGame = async (forceFreshRound = false) => {
    if (!isTeacher) return;
    const drawn =
      !forceFreshRound && isRoomOpenedByTeacher && activeQuestions.length > 0
        ? activeQuestions
        : selectRandomOnetBattleQuestions(fullQuestionBank, {
            setFilter: selectedSetFilter,
            categoryFilter: selectedCategoryFilter,
            difficultyFilter: selectedDifficulty,
            count: effectiveQuestionCount || 5,
            shuffleOptions: shuffleChoicesEnabled,
          });

    if (drawn.length === 0) {
      setBankNotice({
        type: 'error',
        text: 'ไม่พบข้อสอบ O-NET ที่ตรงกับเงื่อนไขที่เลือก กรุณาปรับตัวกรองใหม่',
      });
      return;
    }

    const targetRoomCode = isRoomOpenedByTeacher ? gamePin : generateOnetPin();
    setIsOpeningOrJoining(true);
    setBankNotice(null);
    try {
      if (forceFreshRound && isRoomOpenedByTeacher && isCloudFirestoreReadyForUser()) {
        await resetLiveRoomScoresInFirestore(targetRoomCode).catch(() => {});
      }
      await publishTeacherOnetRoom(drawn, 'question', targetRoomCode);
      setActiveQuestions(drawn);
      setActiveView('arena');
      setGameState('playing');
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(ONET_DIFFICULTY_META[drawn[0].difficulty].timeSeconds);
      setIsAnswerSubmitted(false);
      setSelectedOption(null);
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  // Student: Join strictly by entering the Game PIN created by the teacher
  const handleStudentJoinByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = studentJoinPin.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{4,12}$/.test(enteredPin)) {
      setBankNotice({
        type: 'error',
        text: 'กรุณากรอกรหัสเข้าร่วมห้องเรียน (Game PIN) 4–12 หลักที่ได้รับจากคุณครู',
      });
      return;
    }

    if (hasJoinedBattleRoomInStorage('onet', enteredPin)) {
      setBankNotice({
        type: 'error',
        text: getDuplicateJoinAlertMessage(enteredPin, true),
      });
      return;
    }

    setIsOpeningOrJoining(true);
    setBankNotice(null);

    try {
      let roomDifficulty: OnetBattleDifficultyFilter = 'all';
      let roomCount = 10;
      let roomQuestionIds: string[] = [];
      let hostName = 'คุณครู';
      let foundRoom = false;
      let isWrongBattleMode = false;
      let isRoomClosed = false;

      // 1. Always check Cloud Firestore directly from server (works for both Google and Student Profile logins)
      try {
        const cloudRoom = await getLiveRoomFromFirestore(enteredPin);
        if (cloudRoom) {
          if (cloudRoom.status === 'closed') {
            isRoomClosed = true;
          } else {
            const ids = cloudRoom.questionIds || [];
            const isOnetRoom =
              cloudRoom.title.toUpperCase().includes('O-NET') ||
              ids.some((id) => id.startsWith('onet_'));

            if (!isOnetRoom) {
              isWrongBattleMode = true;
            } else {
              foundRoom = true;
              hostName = cloudRoom.hostName || 'คุณครู';
              roomDifficulty = cloudRoom.difficulty || 'all';
              roomCount = cloudRoom.questionCount || 10;
              roomQuestionIds = ids;
            }
          }
        }
      } catch {
        // Fall back to local room check below
      }

      if (isRoomClosed) {
        setBankNotice({
          type: 'error',
          text: `ห้องประลอง O-NET รหัส "${enteredPin}" ถูกคุณครูปิดห้องแล้ว กรุณาขอรหัสห้องใหม่จากคุณครู`,
        });
        return;
      }

      if (isWrongBattleMode) {
        setBankNotice({
          type: 'error',
          text: `รหัส "${enteredPin}" เป็นห้องของ Live Classroom Coding Battle กรุณาเข้าผ่านเมนู Coding Battle หรือขอรหัส O-NET Battle จากคุณครู`,
        });
        return;
      }

      // 2. Fallback check in local room store
      if (!foundRoom) {
        const localRooms = loadLocalOnetRooms();
        const localRoom = localRooms[enteredPin];
        if (localRoom && localRoom.status === 'active') {
          foundRoom = true;
          hostName = localRoom.hostName || 'คุณครู';
          roomDifficulty = localRoom.difficulty || 'all';
          roomCount = localRoom.questionCount || 10;
          roomQuestionIds = localRoom.questionIds || [];
        }
      }

      if (!foundRoom) {
        setBankNotice({
          type: 'error',
          text: `ไม่พบห้องประลอง O-NET รหัส "${enteredPin}" หรือคุณครูยังไม่ได้เปิดห้อง กรุณาตรวจสอบรหัส Game PIN จากคุณครูอีกครั้ง`,
        });
        return;
      }

      const bankById = new Map(fullQuestionBank.map((q) => [q.id, q]));
      let roomQuestions: OnetBattleQuestionItem[] = roomQuestionIds
        .map((id) => bankById.get(id))
        .filter((q): q is OnetBattleQuestionItem => Boolean(q))
        .map((q) => shuffleOnetQuestionOptions(q));

      if (roomQuestions.length === 0) {
        roomQuestions = selectRandomOnetBattleQuestions(fullQuestionBank, {
          setFilter: 'all',
          categoryFilter: 'all',
          difficultyFilter: roomDifficulty,
          count: roomCount,
          shuffleOptions: true,
        });
      }

      if (roomQuestions.length === 0) {
        setBankNotice({
          type: 'error',
          text: 'ไม่พบข้อสอบในห้องเรียนนี้ กรุณาแจ้งคุณครูตรวจสอบชุดข้อสอบ',
        });
        return;
      }

      const alreadyJoinedInCloud = await hasParticipantJoinedLiveRoomInFirestore(enteredPin).catch(
        () => false
      );
      if (alreadyJoinedInCloud) {
        markBattleRoomJoinedInStorage('onet', enteredPin, playerNickname || studentName);
        setBankNotice({
          type: 'error',
          text: getDuplicateJoinAlertMessage(enteredPin, true),
        });
        return;
      }

      let duplicateBlockedByCloud = false;
      try {
        const joinedOk = await joinOrUpdateLiveParticipantInFirestore(
          {
            roomCode: enteredPin,
            displayName: playerNickname || studentName || 'นักเรียน',
            avatar: '🎓',
            score: 0,
            streak: 0,
            lastAnswerIndex: -1,
          },
          { preventDuplicateCreate: true }
        );
        if (!joinedOk) {
          duplicateBlockedByCloud = true;
        }
      } catch {
        // Allow gameplay even if cloud write fails (e.g., local-only room)
      }

      if (duplicateBlockedByCloud) {
        markBattleRoomJoinedInStorage('onet', enteredPin, playerNickname || studentName);
        setBankNotice({
          type: 'error',
          text: getDuplicateJoinAlertMessage(enteredPin, true),
        });
        return;
      }

      markBattleRoomJoinedInStorage('onet', enteredPin, playerNickname || studentName);
      awardedXpRoomRef.current = null;
      setJoinedRoomCode(enteredPin);
      setJoinedHostName(hostName);
      setSelectedDifficulty(roomDifficulty);
      setActiveQuestions(roomQuestions);
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(ONET_DIFFICULTY_META[roomQuestions[0].difficulty].timeSeconds);
      setIsAnswerSubmitted(false);
      setSelectedOption(null);
      setGameState('playing');
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  const handleAnswerOption = (index: number) => {
    if (isAnswerSubmitted || !currentQ) return;
    setSelectedOption(index);
    setIsAnswerSubmitted(true);

    const isCorrect = index === currentQ.correctIndex;
    let nextScore = score;
    let nextStreak = streak;

    if (isCorrect) {
      soundEffects.play('correct');
      const meta = ONET_DIFFICULTY_META[currentQ.difficulty];
      const timeBonus = Math.max(5, timeLeft * 3);
      nextStreak = streak + 1;
      const multiplier = nextStreak >= 3 ? 2 : nextStreak >= 2 ? 1.5 : 1;
      const roundPoints = Math.round((meta.basePoints + timeBonus) * multiplier);

      nextScore = score + roundPoints;
      setScore(nextScore);
      setCorrectCount((prev) => prev + 1);
      setStreak(nextStreak);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      soundEffects.play('error');
      nextStreak = 0;
      setStreak(0);
    }

    const activeCode = isTeacher ? (isRoomOpenedByTeacher ? gamePin : '') : joinedRoomCode;
    if (activeCode) {
      joinOrUpdateLiveParticipantInFirestore({
        roomCode: activeCode,
        displayName: playerNickname || studentName || 'ผู้เรียน',
        avatar: isTeacher ? '👨‍🏫' : '🎓',
        score: nextScore,
        streak: nextStreak,
        lastAnswerIndex: index,
      }).catch(() => {});
    }

    setTimeout(() => {
      setGameState('roundResult');
    }, 950);
  };

  const handleNextRound = () => {
    if (currentRound < activeQuestions.length - 1) {
      const nextIdx = currentRound + 1;
      const nextQ = activeQuestions[nextIdx];
      setCurrentRound(nextIdx);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setTimeLeft(ONET_DIFFICULTY_META[nextQ.difficulty].timeSeconds);
      setGameState('playing');
    } else {
      soundEffects.play('victory');
      setGameState('podium');
      const earnedXP = Math.max(15, Math.round(score / 6));
      const xpRoomKey = isTeacher
        ? isRoomOpenedByTeacher
          ? gamePin
          : '__solo_teacher__'
        : joinedRoomCode || '__solo_student__';
      if (awardedXpRoomRef.current !== xpRoomKey) {
        awardedXpRoomRef.current = xpRoomKey;
        addPoints(
          earnedXP,
          `ประลองสด O-NET Battle ${setLabelText} (${correctCount}/${activeQuestions.length} ข้อ, ${score} pts)`,
          'thinking'
        );
      }
      onCelebrate(
        correctCount === activeQuestions.length ? 'quiz_perfect' : 'points_milestone',
        'แชมป์สังเวียน Live Classroom O-NET!',
        `ตอบถูก ${correctCount}/${activeQuestions.length} ข้อ (${score} แต้ม) รับ +${earnedXP} XP`,
        '🎓'
      );
    }
  };

  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher) return;

    const trimmedQuestion = newQuestionText.trim();
    const trimmedOpts = newOptions.map((o) => o.trim()) as [string, string, string, string];
    const trimmedExp = newExplanation.trim();
    const trimmedIndicator = newIndicator.trim() || 'ว 4.2 ป.6/1';

    if (!trimmedQuestion || trimmedOpts.some((o) => !o) || !trimmedExp) {
      setBankNotice({
        type: 'error',
        text: 'กรุณากรอกโจทย์ O-NET ตัวเลือกครบทั้ง 4 ข้อ และคำอธิบายเฉลยให้สมบูรณ์',
      });
      return;
    }

    const matchedSet = ONET_EXAM_SETS.find((s) => s.id === newSetId) || ONET_EXAM_SETS[0];
    const newItem: OnetBattleQuestionItem = {
      id: `onet_custom_${Date.now()}`,
      setId: matchedSet.id,
      setNumber: matchedSet.setNumber,
      setTitle: matchedSet.title,
      category: newCategory,
      categoryLabel: ONET_CATEGORY_META[newCategory].label,
      indicator: trimmedIndicator,
      isMustKnow: newIsMustKnow,
      questionFormat: 'single_choice',
      blueprintTopic: 'ข้อสอบ O-NET เพิ่มเติมโดยคุณครู',
      difficulty: newDifficulty,
      question: trimmedQuestion,
      ...(newCodeSnippet.trim() ? { codeSnippet: newCodeSnippet.trim() } : {}),
      options: trimmedOpts,
      correctIndex: newCorrectIndex,
      explanation: trimmedExp,
      source: 'local',
      createdByName: playerNickname || 'คุณครู',
    };

    const updated = [newItem, ...localQuestions];
    setLocalQuestions(updated);
    saveLocalOnetCustomQuestions(updated);
    setBankNotice({
      type: 'success',
      text: `เพิ่มข้อสอบ O-NET ใหม่เข้าคลังเรียบร้อยแล้ว (ชุดที่ ${matchedSet.setNumber} · ${ONET_CATEGORY_META[newCategory].label})`,
    });

    setNewQuestionText('');
    setNewCodeSnippet('');
    setNewOptions(['', '', '', '']);
    setNewCorrectIndex(0);
    setNewExplanation('');
    setIsCreateFormOpen(false);
  };

  const handleDeleteCustomQuestion = (q: OnetBattleQuestionItem) => {
    if (!isTeacher || q.source === 'builtin') return;
    const updated = localQuestions.filter((item) => item.id !== q.id);
    setLocalQuestions(updated);
    saveLocalOnetCustomQuestions(updated);
    setConfirmDeleteId(null);
    setBankNotice({
      type: 'info',
      text: `ลบข้อสอบ "${q.question.slice(0, 42)}..." ออกจากคลังแล้ว`,
    });
  };

  const currentParticipantId = getLiveParticipantId();

  // Build real Post-Battle Summary from live Firestore participants (fallback to current player only if solo/offline)
  const livePostBattleSummary = useMemo(() => {
    const activeCode = isTeacher ? gamePin : joinedRoomCode || gamePin;
    const sourceParticipants: LiveQuizParticipantRecord[] =
      cloudParticipants.length > 0
        ? cloudParticipants
        : [
            {
              roomCode: activeCode || 'LOCAL',
              userId: currentParticipantId || 'self',
              displayName: playerNickname || studentName || 'ผู้เรียน',
              avatar: isTeacher ? '👨‍🏫' : '🎓',
              score,
              streak,
              lastAnswerIndex: selectedOption ?? -1,
            },
          ];

    return buildBattleClosedSummary({
      roomCode: activeCode || '',
      battleMode: 'onet',
      battleTitle: `Live Classroom O-NET Battle (${setLabelText})`,
      hostName: isTeacher ? playerNickname || 'คุณครู' : joinedHostName || 'คุณครู',
      participants: sourceParticipants,
    });
  }, [
    cloudParticipants,
    currentParticipantId,
    gamePin,
    isTeacher,
    joinedHostName,
    joinedRoomCode,
    playerNickname,
    score,
    selectedOption,
    setLabelText,
    streak,
    studentName,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`bg-slate-900 text-white rounded-3xl border border-amber-500/25 shadow-2xl transition-all duration-300 w-full my-auto max-h-[94vh] overflow-y-auto ${
          isTeacher && isProjectorMode
            ? 'max-w-6xl min-h-[85vh] p-6 sm:p-8'
            : !isTeacher && gameState === 'lobby'
            ? 'max-w-lg p-5 sm:p-7'
            : 'max-w-4xl p-5 sm:p-7'
        }`}
      >
        {/* Top Bar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Live Classroom O-NET Battle
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                ห้องประลองข้อสอบ O-NET ป.6 สด (ว 4.2)
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isTeacher &&
              (joinedRoomCode || (gameState === 'closedSummary' && closedSummary?.roomCode)) && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>รหัสห้องประลอง:</span>
                <span className="font-mono font-black tracking-wider text-amber-200">
                  {joinedRoomCode || closedSummary?.roomCode}
                </span>
              </div>
            )}
            {/* Teacher-only controls: Question Bank switcher & Projector Mode */}
            {isTeacher &&
              (gameState === 'lobby' || gameState === 'podium' || gameState === 'closedSummary') && (
              <div className="inline-flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setActiveView('arena')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'arena'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>ห้องประลอง O-NET</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'bank'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>คลัง O-NET ({bankBreakdown.total})</span>
                </button>
              </div>
            )}

            {isTeacher && isRoomOpenedByTeacher && (
              <button
                type="button"
                disabled={isClosingOrClearing}
                onClick={handleTeacherCloseRoom}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/45 text-amber-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                title="ปิดห้อง Battle แจกเหรียญ XP รางวัลให้อันดับ 1–3 อัตโนมัติ และลบรายชื่อผู้เข้าร่วม"
              >
                <Power className="w-3.5 h-3.5" />
                <span>ปิดห้อง &amp; แจก XP</span>
              </button>
            )}

            {isTeacher && (
              <button
                type="button"
                onClick={() => setIsProjectorMode(!isProjectorMode)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                title="สลับโหมดจอโปรเจกเตอร์สำหรับครู"
              >
                <Tv className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">
                  {isProjectorMode ? 'ขนาดย่อ' : 'ฉายโปรเจกเตอร์'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!isTeacher && (gameState === 'podium' || gameState === 'closedSummary')) {
                  resetStudentSession(null);
                } else if (isTeacher && gameState === 'closedSummary') {
                  setClosedSummary(null);
                  setGameState('lobby');
                }
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Feedback Notice */}
        {bankNotice && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              bankNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : bankNotice.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
            }`}
          >
            <span>{bankNotice.text}</span>
            <button
              type="button"
              onClick={() => setBankNotice(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW A: TEACHER-ONLY O-NET QUESTION BANK MANAGER                 */}
        {/* ================================================================ */}
        {isTeacher && activeView === 'bank' && (
          <div className="space-y-5">
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-amber-500/30">
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>🏛️ คลังข้อสอบ O-NET ทั้งหมด</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 font-mono">
                    {bankBreakdown.total} ข้อ
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-2">
                  ครอบคลุม {ONET_EXAM_SETS.length} ชุดมาตรฐาน สทศ. &amp; สสวท. ป.6
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-indigo-500/30">
                <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                  <span>⭐ ตัวชี้วัดต้องรู้ (Must-Know)</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 font-mono">
                    {bankBreakdown.mustKnowCount} ข้อ
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-300">
                  <span>🟢 ง่าย: {bankBreakdown.byDifficulty.easy}</span>
                  <span>🟡 กลาง: {bankBreakdown.byDifficulty.medium}</span>
                  <span>🔴 ยาก: {bankBreakdown.byDifficulty.hard}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-300 mb-2">
                  🎯 การกระจายคำตอบถูก (A–D)
                </div>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                  {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                    <span
                      key={letter}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-center"
                    >
                      {letter}: {bankBreakdown.byCorrectIndex[idx]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Bar + Add Question */}
            <div className="space-y-3 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
                  <select
                    value={bankSetFilter}
                    onChange={(e) => setBankSetFilter(e.target.value as OnetBattleSetFilter)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="all">ทุกชุด O-NET ({bankBreakdown.total} ข้อ)</option>
                    {ONET_EXAM_SETS.map((s) => (
                      <option key={s.id} value={s.id}>
                        ชุดที่ {s.setNumber} ({bankBreakdown.bySet[s.id] || 0} ข้อ)
                      </option>
                    ))}
                  </select>

                  <select
                    value={bankCategoryFilter}
                    onChange={(e) =>
                      setBankCategoryFilter(e.target.value as OnetBattleCategoryFilter)
                    }
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="all">ทุกหมวดสาระ</option>
                    <option value="must_know">⭐ เฉพาะตัวชี้วัดต้องรู้</option>
                    {(Object.keys(ONET_CATEGORY_META) as OnetBattleCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {ONET_CATEGORY_META[cat].emoji} {ONET_CATEGORY_META[cat].label} (
                        {bankBreakdown.byCategory[cat]})
                      </option>
                    ))}
                  </select>

                  <select
                    value={bankDifficultyFilter}
                    onChange={(e) =>
                      setBankDifficultyFilter(e.target.value as OnetBattleDifficultyFilter)
                    }
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="all">ทุกระดับความยาก</option>
                    <option value="easy">🟢 มาตรฐาน (ง่าย)</option>
                    <option value="medium">🟡 เข้มข้น (ปานกลาง)</option>
                    <option value="hard">🔴 ท้าทาย O-NET (ยาก)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isCreateFormOpen ? 'ซ่อนฟอร์มเพิ่มข้อสอบ' : 'เพิ่มข้อสอบ O-NET ลงคลัง'}
                  </span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="ค้นหาโจทย์ ตัวชี้วัด (เช่น ป.6/1, PDPA, ผังงาน, Scratch)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Teacher Create O-NET Question Form */}
            {isCreateFormOpen && (
              <form
                onSubmit={handleSaveNewQuestion}
                className="p-5 rounded-2xl bg-slate-800/90 border border-emerald-500/40 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>สร้างข้อสอบ O-NET เพิ่มเติมเก็บลงคลัง</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">บันทึกในคลังประจำเครื่อง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      สังกัดชุดข้อสอบ:
                    </label>
                    <select
                      value={newSetId}
                      onChange={(e) => setNewSetId(e.target.value as OnetBattleSetId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      {ONET_EXAM_SETS.map((s) => (
                        <option key={s.id} value={s.id}>
                          ชุดที่ {s.setNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      หมวดหมู่สาระ:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as OnetBattleCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      {(Object.keys(ONET_CATEGORY_META) as OnetBattleCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {ONET_CATEGORY_META[cat].emoji} {ONET_CATEGORY_META[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ระดับความยาก:
                    </label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as OnetBattleDifficulty)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      <option value="easy">🟢 มาตรฐาน (ง่าย)</option>
                      <option value="medium">🟡 เข้มข้น (ปานกลาง)</option>
                      <option value="hard">🔴 ท้าทาย O-NET (ยาก)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ตัวชี้วัด สพฐ.:
                    </label>
                    <input
                      type="text"
                      value={newIndicator}
                      onChange={(e) => setNewIndicator(e.target.value)}
                      placeholder="เช่น ว 4.2 ป.6/1"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-amber-300 font-semibold pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsMustKnow}
                      onChange={(e) => setNewIsMustKnow(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-amber-500"
                    />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>จัดอยู่ในกลุ่มตัวชี้วัดต้องรู้ (Must-Know)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    โจทย์คำถาม O-NET:
                  </label>
                  <textarea
                    rows={3}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="พิมพ์สถานการณ์และคำถาม O-NET..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ตัวอย่างโค้ด/ผังงานประกอบ (ถ้ามี — ไม่บังคับ):
                  </label>
                  <textarea
                    rows={2}
                    value={newCodeSnippet}
                    onChange={(e) => setNewCodeSnippet(e.target.value)}
                    placeholder="เช่น repeat (4) { move 10 steps }"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([0, 1, 2, 3] as const).map((idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          ตัวเลือก {String.fromCharCode(65 + idx)}:
                        </span>
                        <label className="inline-flex items-center gap-1 text-[11px] text-emerald-300 cursor-pointer">
                          <input
                            type="radio"
                            name="onet_correct_option"
                            checked={newCorrectIndex === idx}
                            onChange={() => setNewCorrectIndex(idx)}
                          />
                          <span>คำตอบที่ถูก</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newOptions[idx]}
                        onChange={(e) => {
                          const next = [...newOptions] as [string, string, string, string];
                          next[idx] = e.target.value;
                          setNewOptions(next);
                        }}
                        placeholder={`พิมพ์ตัวเลือก ${String.fromCharCode(65 + idx)}`}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    คำอธิบายเฉลยละเอียด:
                  </label>
                  <textarea
                    rows={2}
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="อธิบายเหตุผลที่คำตอบนี้ถูกต้องตามแนวข้อสอบ O-NET..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow cursor-pointer"
                  >
                    บันทึกข้อสอบลงคลัง O-NET
                  </button>
                </div>
              </form>
            )}

            {/* Filtered Question Bank List */}
            <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
              <div className="text-xs text-slate-400">
                แสดง {filteredBankDisplay.length} ข้อ จากทั้งหมด {fullQuestionBank.length} ข้อในคลัง
                O-NET
              </div>

              {filteredBankDisplay.map((q) => {
                const diffMeta = ONET_DIFFICULTY_META[q.difficulty];
                const catMeta = ONET_CATEGORY_META[q.category];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30">
                          ชุดที่ {q.setNumber}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeClass}`}
                        >
                          {catMeta.emoji} {catMeta.label}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffMeta.badgeClass}`}
                        >
                          {diffMeta.emoji} {diffMeta.shortLabel}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-sky-300 border border-slate-700">
                          {q.indicator}
                        </span>
                        {q.isMustKnow && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            ⭐ ต้องรู้
                          </span>
                        )}
                      </div>

                      {q.source !== 'builtin' && (
                        <div className="flex items-center gap-1.5">
                          {confirmDeleteId === q.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomQuestion(q)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                              >
                                ยืนยันลบ
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(q.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="ลบข้อสอบนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-bold text-white whitespace-pre-line leading-relaxed">
                      {q.question}
                    </div>

                    {q.codeSnippet && (
                      <pre className="text-[11px] font-mono text-emerald-300 bg-black/40 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                        {q.codeSnippet}
                      </pre>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${
                            idx === q.correctIndex
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-mono mr-1.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredBankDisplay.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  ไม่พบข้อสอบ O-NET ที่ตรงกับเงื่อนไขที่ค้นหา
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B0: GRAPHICAL CLOSED ROOM SUMMARY (TOP 3 + XP COIN AWARDS)  */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'closedSummary' && closedSummary && (
          <BattleClosedSummaryView
            summary={closedSummary}
            stage="closed"
            isTeacher={isTeacher}
            currentParticipantId={currentParticipantId}
            studentReward={closedStudentReward}
            removedCount={closedRemovedCount}
            isBusy={isOpeningOrJoining || isClosingOrClearing}
            onCreateNewRoom={isTeacher ? handleCreateBattleRoom : undefined}
            onBackToLobby={() => {
              if (isTeacher) {
                setClosedSummary(null);
                setGameState('lobby');
              } else {
                resetStudentSession({
                  type: 'info',
                  text: 'พร้อมสำหรับรอบถัดไปแล้ว กรอกรหัส Game PIN ห้องใหม่จากคุณครูเพื่อเข้าร่วมทันที',
                });
              }
            }}
            onCloseModal={() => {
              if (isTeacher) {
                setClosedSummary(null);
                setGameState('lobby');
              } else {
                resetStudentSession(null);
              }
              onClose();
            }}
          />
        )}

        {/* ================================================================ */}
        {/* VIEW B1: STUDENT-ONLY LOBBY (กรอกรหัสเข้าร่วมห้องเรียนเท่านั้น)    */}
        {/* ================================================================ */}
        {!isTeacher && activeView === 'arena' && gameState === 'lobby' && (
          <form
            onSubmit={handleStudentJoinByPin}
            className="text-center py-4 space-y-5 max-w-sm mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <KeyRound className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">เข้าร่วมห้องประลอง O-NET สด</h4>
              <p className="text-xs text-slate-400">
                กรอกรหัส Game PIN ที่คุณครูเปิดไว้หน้าห้องเรียนเพื่อเริ่มตะลุยข้อสอบ O-NET
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs text-slate-300 font-semibold">
                รหัสเข้าร่วมห้องเรียน (Game PIN):
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={12}
                value={studentJoinPin}
                onChange={(e) =>
                  setStudentJoinPin(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase())
                }
                placeholder="กรอกรหัส เช่น 529418"
                className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-400 placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs text-slate-400 font-medium">ชื่อผู้เข้าสอบ:</label>
              <input
                type="text"
                maxLength={60}
                value={playerNickname}
                onChange={(e) => setPlayerNickname(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-sky-300 font-semibold focus:border-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isOpeningOrJoining || studentJoinPin.trim().length < 4}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isOpeningOrJoining
                  ? 'กำลังตรวจสอบรหัสห้องเรียน...'
                  : 'เข้าร่วมห้องประลอง O-NET'}
              </span>
            </button>
          </form>
        )}

        {/* ================================================================ */}
        {/* VIEW B2: TEACHER-ONLY LOBBY WITH O-NET SET & ROOM CREATOR        */}
        {/* ================================================================ */}
        {isTeacher && activeView === 'arena' && gameState === 'lobby' && (
          <div className="space-y-5 py-2">
            {isRoomOpenedByTeacher && isScoreboardExpanded && (
              <LiveClassroomScoreboard
                participants={cloudParticipants}
                roomCode={gamePin}
                accent="amber"
                expanded
                onToggleExpand={() => setIsScoreboardExpanded(false)}
                currentParticipantId={currentParticipantId}
                title={`กระดานคะแนน O-NET สดแบบเรียลไทม์ · ห้อง PIN ${gamePin}`}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: PIN, Room Status & Start Buttons */}
              <div className="lg:col-span-5 text-center space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-center gap-1.5">
                    <span>รหัสห้องประลอง O-NET (Room Code)</span>
                    {isRoomOpenedByTeacher && (
                      <button
                        type="button"
                        onClick={handleCopyRoomCode}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-amber-300 transition-colors cursor-pointer"
                        title="คัดลอกรหัสห้อง"
                      >
                        {copiedPin ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>คัดลอก</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isRoomOpenedByTeacher ? (
                    <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-widest font-mono bg-slate-900/90 py-2.5 px-5 rounded-2xl border border-amber-500/40 shadow-inner inline-block">
                      {gamePin}
                    </div>
                  ) : (
                    <div className="py-3 px-4 rounded-2xl bg-slate-900/80 border border-dashed border-slate-700 text-xs text-slate-400">
                      กดปุ่ม <strong className="text-emerald-300">"สร้างห้อง Battle"</strong>{' '}
                      เพื่อสุ่มรหัสห้อง (Room Code) และบันทึกลง Firestore
                    </div>
                  )}

                  {isRoomOpenedByTeacher && (
                    <div className="mt-2.5 flex flex-col items-center gap-2.5">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>ห้องเปิดแล้ว</span>
                          <span className="text-slate-400">·</span>
                          <Users className="w-3.5 h-3.5" />
                          <span>ผู้เข้าร่วม {cloudParticipants.length} คน</span>
                        </div>
                        {isRoomSyncedToCloud && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300">
                            <Cloud className="w-3 h-3" />
                            <span>Firestore</span>
                          </div>
                        )}
                      </div>

                      {!isScoreboardExpanded && (
                        <LiveClassroomScoreboard
                          participants={cloudParticipants}
                          roomCode={gamePin}
                          accent="amber"
                          onToggleExpand={() => setIsScoreboardExpanded(true)}
                          currentParticipantId={currentParticipantId}
                        />
                      )}
                    </div>
                  )}
                </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs text-slate-400 font-medium">
                  ชื่อคุณครูผู้คุมห้องสอบ:
                </label>
                <input
                  type="text"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-sky-300 font-semibold focus:border-amber-500 outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed text-left space-y-1">
                <div>
                  🎓 <strong>ชุดข้อสอบ O-NET:</strong>{' '}
                  <span className="text-amber-300 font-bold">{setLabelText}</span>
                </div>
                <div>
                  🎯 <strong>ขอบเขต:</strong>{' '}
                  <span className="text-sky-300 font-bold">{categoryLabelText}</span> ·{' '}
                  <span className="text-indigo-300 font-bold">{difficultyLabelText}</span>
                </div>
                <div>
                  🎲 สุ่มข้อสอบ{' '}
                  <span className="text-emerald-400 font-black">{effectiveQuestionCount} ข้อ</span>{' '}
                  จากคลัง O-NET ({eligibleQuestions.length} ข้อที่ตรงเงื่อนไข)
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={effectiveQuestionCount === 0 || isOpeningOrJoining || isClosingOrClearing}
                  onClick={handleCreateBattleRoom}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isOpeningOrJoining
                      ? 'กำลังสร้างห้องและบันทึกลง Firestore...'
                      : isRoomOpenedByTeacher
                      ? 'สร้างห้อง Battle ใหม่ (สุ่มรหัสใหม่)'
                      : 'สร้างห้อง Battle'}
                  </span>
                </button>

                {isRoomOpenedByTeacher && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isClosingOrClearing || isOpeningOrJoining}
                      onClick={handleTeacherClearScores}
                      className="py-2.5 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 disabled:opacity-40 text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="รีเซ็ตคะแนนนักเรียนทุกคนในห้องเป็น 0"
                    >
                      <Eraser className="w-3.5 h-3.5 shrink-0" />
                      <span>เคลียร์คะแนนเดิม</span>
                    </button>

                    <button
                      type="button"
                      disabled={isClosingOrClearing || isOpeningOrJoining}
                      onClick={handleTeacherCloseRoom}
                      className="py-2.5 px-2.5 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 disabled:opacity-40 text-rose-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="ปิดห้องและลบนักเรียนทั้งหมดออกจากห้องอัตโนมัติ"
                    >
                      <Power className="w-3.5 h-3.5 shrink-0" />
                      <span>ปิดห้อง</span>
                    </button>
                  </div>
                )}

                {isRoomOpenedByTeacher && (
                  <button
                    type="button"
                    disabled={effectiveQuestionCount === 0 || isOpeningOrJoining || isClosingOrClearing}
                    onClick={handleUpdateCurrentRoom}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>อัปเดตชุดข้อสอบห้องเดิม ({gamePin})</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={effectiveQuestionCount === 0 || isOpeningOrJoining || isClosingOrClearing}
                  onClick={() => handleTeacherStartGame(false)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isRoomOpenedByTeacher
                      ? `เริ่มประลอง O-NET หน้าจอครู (${activeQuestions.length || effectiveQuestionCount} ข้อ)`
                      : `สร้างห้องและเริ่มประลองทันที (${effectiveQuestionCount} ข้อ)`}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Teacher O-NET Exam Set & Randomizer Settings */}
            <div className="lg:col-span-7 space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    ตั้งค่าคลังข้อสอบ O-NET และระบบสุ่ม (สำหรับคุณครู)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('bank')}
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>ดูคลัง O-NET</span>
                </button>
              </div>

              {/* 1. Choose O-NET Set (All 10 Sets or Specific Set 1-10) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  1. เลือกชุดข้อสอบจากคลัง O-NET (10 ชุดมาตรฐาน):
                </label>
                <select
                  value={selectedSetFilter}
                  onChange={(e) => setSelectedSetFilter(e.target.value as OnetBattleSetFilter)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-200 outline-none"
                >
                  <option value="all">
                    🌐 รวมทุกชุด O-NET (สุ่มกระจายทั้ง 10 ชุด · {bankBreakdown.total} ข้อในคลัง)
                  </option>
                  {ONET_EXAM_SETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      ชุดที่ {s.setNumber}: {s.title.replace(/^ชุดที่ \d+:\s*/, '')} (
                      {bankBreakdown.bySet[s.id] || 0} ข้อ)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Choose O-NET Category / Must-Know Focus */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  2. เลือกหมวดหมู่สาระ O-NET / ตัวชี้วัดต้องรู้:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'all', label: '📚 ทุกหมวด' },
                      { key: 'must_know', label: '⭐ ต้องรู้' },
                      { key: 'thinking', label: '🧠 ตรรกะ' },
                      { key: 'coding', label: '💻 โค้ด/ผังงาน' },
                      { key: 'data', label: '📊 ข้อมูล' },
                      { key: 'debugging', label: '🐛 แก้บั๊ก' },
                      { key: 'search', label: '🔎 สืบค้น' },
                      { key: 'safety', label: '🛡️ ไซเบอร์' },
                    ] as const
                  ).map((cat) => {
                    const countForCat = filterOnetBattleQuestions(fullQuestionBank, {
                      setFilter: selectedSetFilter,
                      categoryFilter: cat.key,
                      difficultyFilter: selectedDifficulty,
                    }).length;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.key)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedCategoryFilter === cat.key
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black'
                            : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500 font-semibold'
                        }`}
                      >
                        <div className="text-[11px] truncate">{cat.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{countForCat} ข้อ</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Choose Difficulty Level */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  3. เลือกระดับความยาก O-NET:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'all', label: '🎯 ทุกระดับ' },
                      { key: 'easy', label: '🟢 มาตรฐาน' },
                      { key: 'medium', label: '🟡 เข้มข้น' },
                      { key: 'hard', label: '🔴 ท้าทาย' },
                    ] as const
                  ).map((diff) => {
                    const countForDiff = filterOnetBattleQuestions(fullQuestionBank, {
                      setFilter: selectedSetFilter,
                      categoryFilter: selectedCategoryFilter,
                      difficultyFilter: diff.key,
                    }).length;
                    return (
                      <button
                        key={diff.key}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff.key)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedDifficulty === diff.key
                            ? 'bg-slate-100 text-slate-950 border-white font-black'
                            : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500 font-bold'
                        }`}
                      >
                        <div className="text-xs">{diff.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            selectedDifficulty === diff.key ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {countForDiff} ข้อ
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Choose Number of Randomized Questions */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    4. ระบุจำนวนข้อสอบที่จะสุ่มจากคลัง O-NET:
                  </label>
                  <span className="text-[11px] text-emerald-300 font-bold">
                    พร้อมสุ่มสูงสุด {maxAllowedCount} ข้อ
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[5, 8, 10, 15, 20, 30].map((preset) => {
                    const disabled = preset > maxAllowedCount;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() => setQuestionCount(preset)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          effectiveQuestionCount === preset
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {preset} ข้อ
                      </button>
                    );
                  })}

                  <div className="flex items-center gap-1.5 ml-auto bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-[11px] text-slate-400">กำหนดเอง:</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, maxAllowedCount)}
                      value={effectiveQuestionCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val)) {
                          setQuestionCount(Math.max(1, Math.min(val, maxAllowedCount || 1)));
                        }
                      }}
                      className="w-14 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                    />
                    <span className="text-[11px] text-slate-400">ข้อ</span>
                  </div>
                </div>
              </div>

              {/* Shuffle Options Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/70">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleChoicesEnabled}
                    onChange={(e) => setShuffleChoicesEnabled(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-0"
                  />
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>สุ่มสลับลำดับข้อสอบและตัวเลือก A–D ทุกครั้งที่เริ่ม</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('bank');
                    setIsCreateFormOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มข้อสอบ O-NET ลงคลัง</span>
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B: ARENA — 2. PLAYING                                       */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'playing' && currentQ && (
          <div className="space-y-5">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">
                  ข้อที่ {currentRound + 1} / {activeQuestions.length}
                </span>
                {!isTeacher && joinedRoomCode && (
                  <span className="text-[11px] font-mono font-bold text-amber-200 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-400/40 inline-flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3" />
                    <span>รหัสห้องประลอง: {joinedRoomCode}</span>
                  </span>
                )}
                {streak > 1 && (
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                    Streak x{streak}
                  </span>
                )}
              </div>

              <div
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold ${
                  timeLeft <= 6
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft} วินาที</span>
              </div>

              <div className="text-sm font-black text-amber-400">{score} PTS</div>
            </div>

            {/* O-NET Metadata Badges + Audio */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🎓 O-NET ชุดที่ {currentQ.setNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                    ONET_CATEGORY_META[currentQ.category].badgeClass
                  }`}
                >
                  {ONET_CATEGORY_META[currentQ.category].emoji} {currentQ.categoryLabel}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold bg-slate-800 text-sky-300 border border-slate-700">
                  {currentQ.indicator}
                </span>
                {currentQ.isMustKnow && (
                  <span className="text-xs px-2 py-1 rounded-md font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    ⭐ ต้องรู้
                  </span>
                )}
                {currentQ.questionFormat === 'complex_choice' && (
                  <span className="text-xs px-2 py-1 rounded-md font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    เลือกตอบเชิงซ้อน
                  </span>
                )}
              </div>
              <AudioReaderButton
                textToRead={`${currentQ.question} จงเลือกคำตอบที่ถูกต้อง`}
                size="sm"
              />
            </div>

            {/* Question Stem */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80">
              <h2 className="text-base sm:text-lg font-bold text-white whitespace-pre-line leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* Optional Code / Flowchart Snippet Box */}
            {currentQ.codeSnippet && (
              <div className="bg-black/60 rounded-2xl p-4 sm:p-5 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const showCorrectHighlight = isAnswerSubmitted && idx === currentQ.correctIndex;
                const showWrongHighlight =
                  isAnswerSubmitted && isSelected && idx !== currentQ.correctIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleAnswerOption(idx)}
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      showCorrectHighlight
                        ? 'bg-emerald-600/30 border-emerald-400 text-emerald-100 shadow-lg'
                        : showWrongHighlight
                        ? 'bg-rose-600/30 border-rose-400 text-rose-100'
                        : isSelected
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Live Classroom Scoreboard for Teacher during active rounds */}
            {isTeacher && isRoomOpenedByTeacher && (
              <div className="pt-2">
                <LiveClassroomScoreboard
                  participants={cloudParticipants}
                  roomCode={gamePin}
                  accent="amber"
                  compact
                  currentParticipantId={currentParticipantId}
                  title={`คะแนน O-NET นักเรียนเรียลไทม์ (PIN ${gamePin})`}
                />
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B: ARENA — 3. ROUND RESULT                                  */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'roundResult' && currentQ && (
          <div className="space-y-5 py-4 max-w-2xl mx-auto">
            {!isTeacher && joinedRoomCode && (
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold font-mono">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>รหัสห้องประลอง: {joinedRoomCode}</span>
                </span>
              </div>
            )}
            <div className="text-center">
              {selectedOption === currentQ.correctIndex ? (
                <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-lg bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ตอบถูกต้อง! เยี่ยมยอดระดับ O-NET</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-lg bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20">
                  <XCircle className="w-5 h-5" />
                  <span>
                    {selectedOption === -1
                      ? 'หมดเวลา! มาดูเฉลย O-NET ข้อนี้กัน'
                      : 'ยังไม่ใช่ข้อนี้ ลองอ่านเหตุผลเฉลยกันนะ!'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-xs sm:text-sm text-emerald-200">
              <span className="font-bold text-emerald-300">✅ คำตอบที่ถูกต้อง: </span>
              <span className="font-mono font-bold mr-1">
                ({String.fromCharCode(65 + currentQ.correctIndex)})
              </span>
              {currentQ.options[currentQ.correctIndex]}
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <div>
                <span className="font-bold text-amber-400">💡 เฉลยละเอียดตามแนว O-NET: </span>
                <span className="whitespace-pre-line">{currentQ.explanation}</span>
              </div>
              <div className="pt-2 border-t border-slate-700/70 text-[11px] text-slate-400 flex flex-wrap gap-2">
                <span>📌 ตัวชี้วัด: {currentQ.indicator}</span>
                <span>·</span>
                <span>สาระแกนกลาง: {currentQ.blueprintTopic}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextRound}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {currentRound < activeQuestions.length - 1 ? 'ไปข้อถัดไป' : 'ดูสรุปผลการประลอง O-NET'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isTeacher && isRoomOpenedByTeacher && (
              <LiveClassroomScoreboard
                participants={cloudParticipants}
                roomCode={gamePin}
                accent="amber"
                compact
                currentParticipantId={currentParticipantId}
                title={`อัปเดตคะแนน O-NET นักเรียนสด (PIN ${gamePin})`}
              />
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B: ARENA — 4. POST-BATTLE SUMMARY (GRAPH + TOP 3 XP AWARD)  */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'podium' && (
          <BattleClosedSummaryView
            summary={livePostBattleSummary}
            stage="live"
            isTeacher={isTeacher}
            currentParticipantId={currentParticipantId}
            personalStats={{
              displayName: playerNickname || studentName || 'ผู้เรียน',
              correctCount,
              totalQuestions: activeQuestions.length,
              score,
              contextLabel: `${setLabelText} · ${categoryLabelText}`,
            }}
            isBusy={isOpeningOrJoining || isClosingOrClearing}
            onCloseRoomAndAwardXp={
              isTeacher && isRoomOpenedByTeacher ? handleTeacherCloseRoom : undefined
            }
            onStartFreshRound={isTeacher ? () => handleTeacherStartGame(true) : undefined}
            onBackToLobby={() => {
              if (isTeacher) {
                setGameState('lobby');
              } else {
                resetStudentSession(null);
              }
            }}
            onCloseModal={() => {
              if (!isTeacher) {
                resetStudentSession(null);
              }
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
