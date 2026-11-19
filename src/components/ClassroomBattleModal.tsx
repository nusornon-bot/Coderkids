import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Trophy,
  Timer,
  Play,
  RotateCcw,
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
  Cloud,
  HardDrive,
  RefreshCw,
  BookOpen,
  KeyRound,
  Users,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioReaderButton } from './AudioReaderButton.tsx';
import {
  BUILTIN_BATTLE_QUESTIONS,
  DIFFICULTY_META,
  BattleDifficulty,
  BattleDifficultyFilter,
  BattlePlatform,
  BattleQuestionItem,
  BattleSetFilter,
} from '../data/battleQuestionBank.ts';
import {
  filterBattleQuestions,
  getBankBreakdownCounts,
  selectRandomBattleQuestions,
  shuffleQuestionOptions,
} from '../utils/battleQuestionSelector.ts';
import {
  LiveQuizParticipantRecord,
  createOrUpdateLiveRoomInFirestore,
  deleteBattleQuestionFromFirestore,
  getLiveRoomFromFirestore,
  isCloudFirestoreReadyForUser,
  joinOrUpdateLiveParticipantInFirestore,
  listBattleQuestionsFromFirestore,
  listLiveParticipantsFromFirestore,
  saveBattleQuestionToFirestore,
} from '../services/firestoreService.ts';

interface ClassroomBattleModalProps {
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

interface LocalBattleRoomConfig {
  roomCode: string;
  hostName: string;
  platformSet: BattleSetFilter;
  difficulty: BattleDifficultyFilter;
  questionCount: number;
  questionIds: string[];
  status: 'active' | 'closed';
  createdAt: number;
}

const LOCAL_CUSTOM_BANK_KEY = 'coderkids_battle_custom_questions_v1';
const LOCAL_BATTLE_ROOMS_KEY = 'coderkids_battle_rooms_v1';

function loadLocalCustomQuestions(): BattleQuestionItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q) =>
        q &&
        typeof q.id === 'string' &&
        (q.platform === 'Scratch' || q.platform === 'Micro:bit') &&
        (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') &&
        Array.isArray(q.options) &&
        q.options.length === 4
    );
  } catch {
    return [];
  }
}

function saveLocalCustomQuestions(items: BattleQuestionItem[]): void {
  try {
    localStorage.setItem(LOCAL_CUSTOM_BANK_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

function loadLocalBattleRooms(): Record<string, LocalBattleRoomConfig> {
  try {
    const raw = localStorage.getItem(LOCAL_BATTLE_ROOMS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalBattleRoom(room: LocalBattleRoomConfig): void {
  try {
    const existing = loadLocalBattleRooms();
    existing[room.roomCode.toUpperCase()] = room;
    localStorage.setItem(LOCAL_BATTLE_ROOMS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore quota errors
  }
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const ClassroomBattleModal: React.FC<ClassroomBattleModalProps> = ({
  isOpen,
  onClose,
  studentName,
  isTeacher = false,
  addPoints,
  onCelebrate,
}) => {
  const [activeView, setActiveView] = useState<'arena' | 'bank'>('arena');
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'roundResult' | 'podium'>('lobby');
  const [gamePin, setGamePin] = useState<string>('849201');
  const [studentJoinPin, setStudentJoinPin] = useState<string>('');
  const [joinedRoomCode, setJoinedRoomCode] = useState<string>('');
  const [joinedHostName, setJoinedHostName] = useState<string>('');
  const [isRoomOpenedByTeacher, setIsRoomOpenedByTeacher] = useState<boolean>(false);
  const [isOpeningOrJoining, setIsOpeningOrJoining] = useState<boolean>(false);
  const [cloudParticipants, setCloudParticipants] = useState<LiveQuizParticipantRecord[]>([]);

  const [playerNickname, setPlayerNickname] = useState<string>(studentName || 'น้องโค้ดเดอร์');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Teacher Battle Setup (Platform Set, Difficulty, Question Count)
  const [selectedPlatformSet, setSelectedPlatformSet] = useState<BattleSetFilter>('mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BattleDifficultyFilter>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [shuffleChoicesEnabled, setShuffleChoicesEnabled] = useState<boolean>(true);

  // Question Bank State (Built-in + Cloud + Local Custom)
  const [cloudQuestions, setCloudQuestions] = useState<BattleQuestionItem[]>([]);
  const [localQuestions, setLocalQuestions] = useState<BattleQuestionItem[]>(() =>
    loadLocalCustomQuestions()
  );
  const [isLoadingBank, setIsLoadingBank] = useState<boolean>(false);
  const [bankNotice, setBankNotice] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Question Bank Filter & Create Form State (Teacher Only)
  const [bankPlatformFilter, setBankPlatformFilter] = useState<'all' | BattlePlatform>('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<BattleDifficultyFilter>('all');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState<boolean>(false);

  const [newPlatform, setNewPlatform] = useState<BattlePlatform>('Scratch');
  const [newDifficulty, setNewDifficulty] = useState<BattleDifficulty>('easy');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCodeSnippet, setNewCodeSnippet] = useState<string>('');
  const [newOptions, setNewOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState<0 | 1 | 2 | 3>(0);
  const [newExplanation, setNewExplanation] = useState<string>('');

  // Active Match State
  const [activeQuestions, setActiveQuestions] = useState<BattleQuestionItem[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  // Enforce student cannot stay on 'bank' view if role switches to student
  useEffect(() => {
    if (!isTeacher && activeView !== 'arena') {
      setActiveView('arena');
    }
    if (!isTeacher && isProjectorMode) {
      setIsProjectorMode(false);
    }
  }, [isTeacher, activeView, isProjectorMode]);

  // Sync nickname when profile name changes
  useEffect(() => {
    if (studentName) {
      setPlayerNickname(studentName);
    }
  }, [studentName]);

  // Load Cloud Question Bank on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadCloudBank = async () => {
      if (!isCloudFirestoreReadyForUser()) return;
      setIsLoadingBank(true);
      try {
        const items = await listBattleQuestionsFromFirestore();
        if (!cancelled) {
          setCloudQuestions(items);
        }
      } catch {
        // Keep local + built-in questions gracefully
      } finally {
        if (!cancelled) setIsLoadingBank(false);
      }
    };
    loadCloudBank();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Poll live participants when teacher has opened a cloud room or student is on podium
  useEffect(() => {
    const activeCode = isTeacher ? (isRoomOpenedByTeacher ? gamePin : '') : joinedRoomCode;
    if (!isOpen || !activeCode || !isCloudFirestoreReadyForUser()) return;

    let cancelled = false;
    const fetchParticipants = async () => {
      try {
        const list = await listLiveParticipantsFromFirestore(activeCode);
        if (!cancelled) {
          setCloudParticipants(list);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, isTeacher, isRoomOpenedByTeacher, gamePin, joinedRoomCode, gameState]);

  // Combined deduplicated question bank
  const fullQuestionBank = useMemo<BattleQuestionItem[]>(() => {
    const map = new Map<string, BattleQuestionItem>();
    for (const q of BUILTIN_BATTLE_QUESTIONS) {
      map.set(q.id, q);
    }
    for (const q of localQuestions) {
      map.set(q.id, q);
    }
    for (const q of cloudQuestions) {
      map.set(q.id, q);
    }
    return Array.from(map.values());
  }, [cloudQuestions, localQuestions]);

  const bankBreakdown = useMemo(() => getBankBreakdownCounts(fullQuestionBank), [fullQuestionBank]);

  const eligibleQuestions = useMemo(
    () => filterBattleQuestions(fullQuestionBank, selectedPlatformSet, selectedDifficulty),
    [fullQuestionBank, selectedPlatformSet, selectedDifficulty]
  );

  const effectiveQuestionCount = useMemo(() => {
    if (eligibleQuestions.length === 0) return 0;
    return Math.max(1, Math.min(questionCount, eligibleQuestions.length));
  }, [questionCount, eligibleQuestions.length]);

  const filteredBankDisplay = useMemo(() => {
    return fullQuestionBank.filter((q) => {
      const matchPlat = bankPlatformFilter === 'all' || q.platform === bankPlatformFilter;
      const matchDiff = bankDifficultyFilter === 'all' || q.difficulty === bankDifficultyFilter;
      return matchPlat && matchDiff;
    });
  }, [fullQuestionBank, bankPlatformFilter, bankDifficultyFilter]);

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

  // Teacher: Publish room PIN + randomized question set to Firestore + localStorage
  const publishTeacherBattleRoom = async (
    drawnQuestions: BattleQuestionItem[],
    stage: 'lobby' | 'question'
  ): Promise<boolean> => {
    const cleanPin = gamePin.trim().toUpperCase();
    const questionIds = drawnQuestions.map((q) => q.id);

    // Always store locally as fallback for same-browser / offline testing
    saveLocalBattleRoom({
      roomCode: cleanPin,
      hostName: playerNickname || 'คุณครู',
      platformSet: selectedPlatformSet,
      difficulty: selectedDifficulty,
      questionCount: drawnQuestions.length,
      questionIds,
      status: 'active',
      createdAt: Date.now(),
    });

    let syncedToCloud = false;
    if (isCloudFirestoreReadyForUser()) {
      try {
        syncedToCloud = await createOrUpdateLiveRoomInFirestore({
          roomCode: cleanPin,
          hostName: playerNickname || 'คุณครู',
          title: `Coding Battle (${selectedPlatformSet})`,
          stage,
          currentQuestionIndex: 0,
          status: 'active',
          platformSet: selectedPlatformSet,
          difficulty: selectedDifficulty,
          questionCount: drawnQuestions.length,
          questionIds,
        });
      } catch {
        syncedToCloud = false;
      }
    }

    setIsRoomOpenedByTeacher(true);
    return syncedToCloud;
  };

  // Teacher: Open room so students can enter the Game PIN without starting host screen yet
  const handleTeacherOpenRoomOnly = async () => {
    if (!isTeacher) return;
    const drawn = selectRandomBattleQuestions(fullQuestionBank, {
      platform: selectedPlatformSet,
      difficulty: selectedDifficulty,
      count: effectiveQuestionCount || 5,
      shuffleOptions: shuffleChoicesEnabled,
    });
    if (drawn.length === 0) {
      setBankNotice({
        type: 'error',
        text: 'ไม่พบข้อสอบที่ตรงกับเงื่อนไขที่เลือก กรุณาเปลี่ยนตัวกรองหรือสร้างข้อสอบเพิ่มในคลัง',
      });
      return;
    }

    setIsOpeningOrJoining(true);
    setBankNotice(null);
    try {
      const synced = await publishTeacherBattleRoom(drawn, 'lobby');
      setActiveQuestions(drawn);
      setBankNotice({
        type: 'success',
        text: synced
          ? `เปิดห้องเรียนรหัส ${gamePin} บน Cloud เรียบร้อย! นักเรียนสามารถกรอกรหัส ${gamePin} เพื่อเข้าร่วมได้ทันที (${drawn.length} ข้อ)`
          : `เปิดห้องเรียนรหัส ${gamePin} เรียบร้อย (${drawn.length} ข้อ) แจ้งรหัสให้นักเรียนกรอกเข้าร่วมได้เลย`,
      });
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  // Teacher: Open room & start playing immediately
  const handleTeacherStartGame = async () => {
    if (!isTeacher) return;
    const drawn = selectRandomBattleQuestions(fullQuestionBank, {
      platform: selectedPlatformSet,
      difficulty: selectedDifficulty,
      count: effectiveQuestionCount || 5,
      shuffleOptions: shuffleChoicesEnabled,
    });

    if (drawn.length === 0) {
      setBankNotice({
        type: 'error',
        text: 'ไม่พบข้อสอบที่ตรงกับเงื่อนไขที่เลือก กรุณาเปลี่ยนตัวกรองหรือสร้างข้อสอบเพิ่มในคลัง',
      });
      return;
    }

    setIsOpeningOrJoining(true);
    setBankNotice(null);
    try {
      await publishTeacherBattleRoom(drawn, 'question');
      setActiveQuestions(drawn);
      setActiveView('arena');
      setGameState('playing');
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(DIFFICULTY_META[drawn[0].difficulty].timeSeconds);
      setIsAnswerSubmitted(false);
      setSelectedOption(null);
    } finally {
      setIsOpeningOrJoining(false);
    }
  };

  // Student: Join classroom strictly by entering the Game PIN provided by the teacher
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

    setIsOpeningOrJoining(true);
    setBankNotice(null);

    try {
      let roomPlatform: BattleSetFilter = 'mixed';
      let roomDifficulty: BattleDifficultyFilter = 'all';
      let roomCount = 5;
      let roomQuestionIds: string[] = [];
      let hostName = 'คุณครู';
      let foundRoom = false;

      // 1. Check Cloud Firestore first
      if (isCloudFirestoreReadyForUser()) {
        try {
          const cloudRoom = await getLiveRoomFromFirestore(enteredPin);
          if (cloudRoom && cloudRoom.status === 'active') {
            foundRoom = true;
            hostName = cloudRoom.hostName || 'คุณครู';
            roomPlatform = cloudRoom.platformSet || 'mixed';
            roomDifficulty = cloudRoom.difficulty || 'all';
            roomCount = cloudRoom.questionCount || 5;
            roomQuestionIds = cloudRoom.questionIds || [];
          }
        } catch {
          // Fall back to local room check below
        }
      }

      // 2. Fallback check in local room store (e.g., same-device classroom preview / offline)
      if (!foundRoom) {
        const localRooms = loadLocalBattleRooms();
        const localRoom = localRooms[enteredPin];
        if (localRoom && localRoom.status === 'active') {
          foundRoom = true;
          hostName = localRoom.hostName || 'คุณครู';
          roomPlatform = localRoom.platformSet || 'mixed';
          roomDifficulty = localRoom.difficulty || 'all';
          roomCount = localRoom.questionCount || 5;
          roomQuestionIds = localRoom.questionIds || [];
        }
      }

      if (!foundRoom) {
        setBankNotice({
          type: 'error',
          text: `ไม่พบห้องเรียนรหัส "${enteredPin}" หรือคุณครูยังไม่ได้เปิดห้อง กรุณาตรวจสอบรหัส Game PIN จากคุณครูอีกครั้ง`,
        });
        return;
      }

      // Resolve teacher's exact question IDs from bank (including latest cloud questions)
      let latestBank = fullQuestionBank;
      if (isCloudFirestoreReadyForUser()) {
        try {
          const freshCloud = await listBattleQuestionsFromFirestore();
          const mergedMap = new Map<string, BattleQuestionItem>();
          for (const q of fullQuestionBank) mergedMap.set(q.id, q);
          for (const q of freshCloud) mergedMap.set(q.id, q);
          latestBank = Array.from(mergedMap.values());
          setCloudQuestions(freshCloud);
        } catch {
          // Keep current bank
        }
      }

      const bankById = new Map(latestBank.map((q) => [q.id, q]));
      let roomQuestions: BattleQuestionItem[] = roomQuestionIds
        .map((id) => bankById.get(id))
        .filter((q): q is BattleQuestionItem => Boolean(q))
        .map((q) => shuffleQuestionOptions(q));

      if (roomQuestions.length === 0) {
        roomQuestions = selectRandomBattleQuestions(latestBank, {
          platform: roomPlatform,
          difficulty: roomDifficulty,
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

      // Register student in Cloud room participants if signed in
      if (isCloudFirestoreReadyForUser()) {
        try {
          await joinOrUpdateLiveParticipantInFirestore({
            roomCode: enteredPin,
            displayName: playerNickname || studentName || 'นักเรียน',
            avatar: '⚡',
            score: 0,
            streak: 0,
            lastAnswerIndex: -1,
          });
        } catch {
          // Allow gameplay even if cloud write fails
        }
      }

      setJoinedRoomCode(enteredPin);
      setJoinedHostName(hostName);
      setSelectedPlatformSet(roomPlatform);
      setSelectedDifficulty(roomDifficulty);
      setActiveQuestions(roomQuestions);
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(DIFFICULTY_META[roomQuestions[0].difficulty].timeSeconds);
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
      const meta = DIFFICULTY_META[currentQ.difficulty];
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
      nextStreak = 0;
      setStreak(0);
    }

    // Sync student's live score to Firestore room participants if joined via PIN
    const activeCode = isTeacher ? (isRoomOpenedByTeacher ? gamePin : '') : joinedRoomCode;
    if (activeCode && isCloudFirestoreReadyForUser()) {
      joinOrUpdateLiveParticipantInFirestore({
        roomCode: activeCode,
        displayName: playerNickname || studentName || 'ผู้เรียน',
        avatar: isTeacher ? '👨‍🏫' : '⚡',
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
      setTimeLeft(DIFFICULTY_META[nextQ.difficulty].timeSeconds);
      setGameState('playing');
    } else {
      setGameState('podium');
      const earnedXP = Math.max(10, Math.round(score / 6));
      const setLabel =
        selectedPlatformSet === 'mixed'
          ? 'แบบผสม Scratch + Micro:bit'
          : selectedPlatformSet;
      addPoints(
        earnedXP,
        `ประลองสด Coding Battle ชุด ${setLabel} (${correctCount}/${activeQuestions.length} ข้อ, ${score} pts)`,
        'thinking'
      );
      onCelebrate(
        correctCount === activeQuestions.length ? 'quiz_perfect' : 'points_milestone',
        'ผู้ชนะสังเวียนประลองโค้ด!',
        `ตอบถูก ${correctCount}/${activeQuestions.length} ข้อ (${score} แต้ม) รับ +${earnedXP} XP`,
        '🏆'
      );
    }
  };

  const handleSaveNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher) return;

    const trimmedTitle = newTitle.trim();
    const trimmedCode = newCodeSnippet.trim();
    const trimmedOpts = newOptions.map((o) => o.trim()) as [string, string, string, string];
    const trimmedExp = newExplanation.trim();

    if (!trimmedTitle || !trimmedCode || trimmedOpts.some((o) => !o) || !trimmedExp) {
      setBankNotice({
        type: 'error',
        text: 'กรุณากรอกโจทย์ ตัวอย่างโค้ด ตัวเลือกครบทั้ง 4 ข้อ และคำอธิบายเฉลยให้สมบูรณ์',
      });
      return;
    }

    setIsSavingQuestion(true);
    setBankNotice(null);

    try {
      let savedCloudId: string | null = null;
      if (isCloudFirestoreReadyForUser()) {
        try {
          savedCloudId = await saveBattleQuestionToFirestore({
            platform: newPlatform,
            difficulty: newDifficulty,
            title: trimmedTitle,
            codeSnippet: trimmedCode,
            options: trimmedOpts,
            correctIndex: newCorrectIndex,
            explanation: trimmedExp,
            createdByName: playerNickname || 'คุณครู',
          });
        } catch {
          savedCloudId = null;
        }
      }

      if (savedCloudId) {
        const newCloudItem: BattleQuestionItem = {
          id: savedCloudId,
          platform: newPlatform,
          difficulty: newDifficulty,
          title: trimmedTitle,
          codeSnippet: trimmedCode,
          options: trimmedOpts,
          correctIndex: newCorrectIndex,
          explanation: trimmedExp,
          source: 'cloud',
          createdByName: playerNickname || 'คุณครู',
        };
        setCloudQuestions((prev) => [newCloudItem, ...prev.filter((q) => q.id !== savedCloudId)]);
        setBankNotice({
          type: 'success',
          text: `บันทึกข้อสอบ ${newPlatform} (ระดับ${DIFFICULTY_META[newDifficulty].label}) ลงคลัง Cloud เรียบร้อยแล้ว!`,
        });
      } else {
        const localId = `local_${newPlatform === 'Scratch' ? 'sc' : 'mb'}_${Date.now()}`;
        const newLocalItem: BattleQuestionItem = {
          id: localId,
          platform: newPlatform,
          difficulty: newDifficulty,
          title: trimmedTitle,
          codeSnippet: trimmedCode,
          options: trimmedOpts,
          correctIndex: newCorrectIndex,
          explanation: trimmedExp,
          source: 'local',
          createdByName: playerNickname || 'คุณครู',
        };
        const updatedLocal = [newLocalItem, ...localQuestions];
        setLocalQuestions(updatedLocal);
        saveLocalCustomQuestions(updatedLocal);
        setBankNotice({
          type: 'info',
          text: `บันทึกข้อสอบ ${newPlatform} (ระดับ${DIFFICULTY_META[newDifficulty].label}) ลงคลังในเครื่องเรียบร้อย (เข้าสู่ระบบบัญชีครูเพื่อซิงก์ขึ้น Cloud)`,
        });
      }

      setNewTitle('');
      setNewCodeSnippet('');
      setNewOptions(['', '', '', '']);
      setNewCorrectIndex(0);
      setNewExplanation('');
      setIsCreateFormOpen(false);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteCustomQuestion = async (q: BattleQuestionItem) => {
    if (!isTeacher || q.source === 'builtin') return;
    if (q.source === 'cloud') {
      try {
        await deleteBattleQuestionFromFirestore(q.id);
      } catch {
        // Proceed gracefully
      }
      setCloudQuestions((prev) => prev.filter((item) => item.id !== q.id));
    } else {
      const updated = localQuestions.filter((item) => item.id !== q.id);
      setLocalQuestions(updated);
      saveLocalCustomQuestions(updated);
    }
    setConfirmDeleteId(null);
    setBankNotice({
      type: 'info',
      text: `ลบข้อสอบ "${q.title.slice(0, 40)}" ออกจากคลังแล้ว`,
    });
  };

  const platformSetLabel =
    selectedPlatformSet === 'Scratch'
      ? 'เฉพาะ Scratch'
      : selectedPlatformSet === 'Micro:bit'
      ? 'เฉพาะ Micro:bit'
      : 'แบบผสม (Scratch + Micro:bit)';

  const difficultyLabel =
    selectedDifficulty === 'all'
      ? 'ผสมทุกระดับ (ง่าย–ยาก)'
      : `ระดับ${DIFFICULTY_META[selectedDifficulty].label}`;

  // Use real Cloud participants when available; otherwise fall back to classroom simulation
  const podiumEntries =
    cloudParticipants.length > 0
      ? cloudParticipants.slice(0, 8).map((p, idx) => ({
          rank: idx + 1,
          name:
            p.displayName === (playerNickname || studentName)
              ? `${p.displayName} (คุณ)`
              : p.displayName,
          score: p.score,
          isYou: p.displayName === (playerNickname || studentName),
        }))
      : [
          { name: `${playerNickname} (คุณ)`, score, isYou: true },
          {
            name: 'ต้นกล้า (ป.5/1)',
            score: Math.max(120, Math.round(activeQuestions.length * 68)),
            isYou: false,
          },
          {
            name: 'ฟ้าใส (ป.5/2)',
            score: Math.max(95, Math.round(activeQuestions.length * 56)),
            isYou: false,
          },
          {
            name: 'ภูริ (ป.6/1)',
            score: Math.max(70, Math.round(activeQuestions.length * 44)),
            isYou: false,
          },
        ]
          .sort((a, b) => b.score - a.score)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl transition-all duration-300 w-full my-auto max-h-[94vh] overflow-y-auto ${
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
            <span className="text-2xl">🏁</span>
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Live Classroom Coding Battle
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                ห้องประลองโค้ดดิ้ง Scratch &amp; Micro:bit สด
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Teacher-only controls: Question Bank switcher & Projector Mode */}
            {isTeacher && (gameState === 'lobby' || gameState === 'podium') && (
              <div className="inline-flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setActiveView('arena')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'arena'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>ห้องประลอง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'bank'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>คลังข้อสอบ ({bankBreakdown.total})</span>
                </button>
              </div>
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
              onClick={onClose}
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
        {/* VIEW A: TEACHER-ONLY QUESTION BANK MANAGER                       */}
        {/* ================================================================ */}
        {isTeacher && activeView === 'bank' && (
          <div className="space-y-5">
            {/* Bank Summary Stats: Scratch vs Micro:bit broken down by Easy / Medium / Hard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-orange-500/30 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <span>🐱 คลังข้อสอบ Scratch</span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-200 font-mono">
                      {bankBreakdown.byPlatform.Scratch} ข้อ
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-300">
                    <span>🟢 ง่าย: {bankBreakdown.byPlatformDifficulty.Scratch.easy}</span>
                    <span>🟡 ปานกลาง: {bankBreakdown.byPlatformDifficulty.Scratch.medium}</span>
                    <span>🔴 ยาก: {bankBreakdown.byPlatformDifficulty.Scratch.hard}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlatformSet('Scratch');
                    setActiveView('arena');
                    setGameState('lobby');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/30 text-xs font-bold cursor-pointer shrink-0"
                >
                  ใช้ชุดนี้
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-sky-500/30 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <span>🤖 คลังข้อสอบ Micro:bit</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200 font-mono">
                      {bankBreakdown.byPlatform['Micro:bit']} ข้อ
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-300">
                    <span>🟢 ง่าย: {bankBreakdown.byPlatformDifficulty['Micro:bit'].easy}</span>
                    <span>🟡 ปานกลาง: {bankBreakdown.byPlatformDifficulty['Micro:bit'].medium}</span>
                    <span>🔴 ยาก: {bankBreakdown.byPlatformDifficulty['Micro:bit'].hard}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlatformSet('Micro:bit');
                    setActiveView('arena');
                    setGameState('lobby');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 text-xs font-bold cursor-pointer shrink-0"
                >
                  ใช้ชุดนี้
                </button>
              </div>
            </div>

            {/* Filter Controls + Add New Question Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'Scratch', 'Micro:bit'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setBankPlatformFilter(plat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bankPlatformFilter === plat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {plat === 'all'
                      ? 'ทั้งหมด'
                      : plat === 'Scratch'
                      ? '🐱 Scratch'
                      : '🤖 Micro:bit'}
                  </button>
                ))}
                <span className="text-slate-600">|</span>
                {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setBankDifficultyFilter(diff)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bankDifficultyFilter === diff
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {diff === 'all'
                      ? 'ทุกระดับ'
                      : `${DIFFICULTY_META[diff].emoji} ${DIFFICULTY_META[diff].label}`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCreateFormOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isCreateFormOpen ? 'ซ่อนฟอร์มสร้างข้อสอบ' : 'สร้างข้อสอบใหม่เก็บลงคลัง'}
                </span>
              </button>
            </div>

            {/* Teacher Create Question Form */}
            {isCreateFormOpen && (
              <form
                onSubmit={handleSaveNewQuestion}
                className="p-5 rounded-2xl bg-slate-800/90 border border-emerald-500/40 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>สร้างข้อสอบใหม่เก็บเข้าคลังข้อสอบ</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    {isCloudFirestoreReadyForUser() ? (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ซิงก์ขึ้น Cloud อัตโนมัติ</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                        <span>บันทึกในเครื่อง (ออฟไลน์)</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      หมวดคลังข้อสอบ:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Scratch', 'Micro:bit'] as const).map((plat) => (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setNewPlatform(plat)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            newPlatform === plat
                              ? plat === 'Scratch'
                                ? 'bg-orange-500/20 border-orange-400 text-orange-200'
                                : 'bg-sky-500/20 border-sky-400 text-sky-200'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {plat === 'Scratch' ? '🐱 Scratch' : '🤖 Micro:bit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      ระดับความยาก:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setNewDifficulty(diff)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            newDifficulty === diff
                              ? DIFFICULTY_META[diff].badgeClass
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {DIFFICULTY_META[diff].emoji} {DIFFICULTY_META[diff].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    โจทย์คำถาม (สูงสุด 200 ตัวอักษร):
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={
                      newPlatform === 'Scratch'
                        ? 'เช่น แมว Scratch เดินชนขอบแล้วกลับหัว ต้องแก้บล็อกไหน?'
                        : 'เช่น Micro:bit เขย่าแล้วเลขก้าวเดินไม่เพิ่ม เกิดจากอะไร?'
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ชุดบล็อก / ตัวอย่างโค้ดประกอบคำถาม:
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={newCodeSnippet}
                    onChange={(e) => setNewCodeSnippet(e.target.value)}
                    placeholder={
                      newPlatform === 'Scratch'
                        ? '[เมื่อคลิกธงเขียว]\n[วนซ้ำตลอด]\n  [เคลื่อนที่ 10 ก้าว]'
                        : 'basic.forever(() => {\n  basic.showIcon(IconNames.Heart)\n})'
                    }
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    ตัวเลือกทั้ง 4 ข้อ (คลิกปุ่มหน้าตัวเลือกเพื่อกำหนดข้อที่ถูก):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          newCorrectIndex === idx
                            ? 'bg-emerald-500/15 border-emerald-500/50'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setNewCorrectIndex(idx as 0 | 1 | 2 | 3)}
                          className={`w-7 h-7 rounded-lg text-xs font-black shrink-0 cursor-pointer ${
                            newCorrectIndex === idx
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title="ตั้งเป็นคำตอบที่ถูกต้อง"
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input
                          type="text"
                          maxLength={300}
                          value={newOptions[idx]}
                          onChange={(e) => {
                            const next = [...newOptions] as [string, string, string, string];
                            next[idx] = e.target.value;
                            setNewOptions(next);
                          }}
                          placeholder={`ตัวเลือก ${String.fromCharCode(65 + idx)}${
                            newCorrectIndex === idx ? ' (คำตอบที่ถูก)' : ''
                          }`}
                          className="w-full bg-transparent text-xs text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    คำอธิบายเฉลย (แสดงหลังผู้เรียนตอบ):
                  </label>
                  <input
                    type="text"
                    maxLength={600}
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="อธิบายเหตุผลสั้นๆ เพื่อให้นักเรียนเข้าใจแนวคิด"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreateFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuestion}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingQuestion ? 'กำลังบันทึก...' : '💾 บันทึกข้อสอบลงคลัง'}
                  </button>
                </div>
              </form>
            )}

            {/* Question List */}
            <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1">
              {isLoadingBank && (
                <div className="text-center py-4 text-xs text-slate-400">
                  กำลังโหลดคลังข้อสอบจาก Cloud...
                </div>
              )}

              {filteredBankDisplay.map((q) => {
                const diffMeta = DIFFICULTY_META[q.difficulty];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            q.platform === 'Scratch'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {q.platform === 'Scratch' ? '🐱 Scratch' : '🤖 Micro:bit'}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffMeta.badgeClass}`}
                        >
                          {diffMeta.emoji} {diffMeta.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-700">
                          {q.source === 'builtin'
                            ? 'คลังมาตรฐาน'
                            : q.source === 'cloud'
                            ? '☁️ Cloud ครูสร้าง'
                            : '💾 ในเครื่อง'}
                        </span>
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

                    <div className="text-sm font-bold text-white">{q.title}</div>
                    <pre className="text-[11px] font-mono text-emerald-300 bg-black/40 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                      {q.codeSnippet}
                    </pre>

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
                  ไม่พบข้อสอบในหมวดที่เลือก
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B1: STUDENT-ONLY LOBBY (กรอกรหัสเข้าร่วมห้องเรียนเท่านั้น)    */}
        {/* ================================================================ */}
        {!isTeacher && activeView === 'arena' && gameState === 'lobby' && (
          <form
            onSubmit={handleStudentJoinByPin}
            className="text-center py-4 space-y-5 max-w-sm mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <KeyRound className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">เข้าร่วมห้องเรียนประลองสด</h4>
              <p className="text-xs text-slate-400">
                กรอกรหัส Game PIN ที่คุณครูเปิดไว้หน้าห้องเรียนเพื่อเริ่มการแข่งขัน
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
                placeholder="กรอกรหัส เช่น 849201"
                className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-400 placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs text-slate-400 font-medium">ชื่อผู้แข่งขัน:</label>
              <input
                type="text"
                maxLength={60}
                value={playerNickname}
                onChange={(e) => setPlayerNickname(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-sky-300 font-semibold focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isOpeningOrJoining || studentJoinPin.trim().length < 4}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isOpeningOrJoining ? 'กำลังตรวจสอบรหัสห้องเรียน...' : 'เข้าร่วมห้องเรียน (Join Battle)'}
              </span>
            </button>
          </form>
        )}

        {/* ================================================================ */}
        {/* VIEW B2: TEACHER-ONLY LOBBY WITH EXAM SET & ROOM CREATOR         */}
        {/* ================================================================ */}
        {isTeacher && activeView === 'arena' && gameState === 'lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-2">
            {/* Left Column: PIN, Room Status & Start Buttons */}
            <div className="lg:col-span-5 text-center space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-8 h-8 text-white" />
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-center gap-1.5">
                  <span>รหัสเข้าร่วมห้องเรียน (Game PIN)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGamePin(generatePin());
                      setIsRoomOpenedByTeacher(false);
                      setCloudParticipants([]);
                    }}
                    className="text-slate-400 hover:text-amber-300 p-1 rounded-md hover:bg-slate-800 cursor-pointer"
                    title="สุ่มรหัส PIN ใหม่"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-widest font-mono bg-slate-900/90 py-2.5 px-5 rounded-2xl border border-slate-700 inline-block">
                  {gamePin}
                </div>

                {isRoomOpenedByTeacher && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>ห้องเปิดแล้ว</span>
                    <span className="text-slate-400">·</span>
                    <Users className="w-3.5 h-3.5" />
                    <span>ผู้เข้าร่วม {cloudParticipants.length} คน</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs text-slate-400 font-medium">ชื่อคุณครูผู้คุมห้อง:</label>
                <input
                  type="text"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-sky-300 font-semibold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed text-left space-y-1">
                <div>
                  🎮 <strong>กติกาการแข่งขัน:</strong> ชุด{' '}
                  <span className="text-amber-300 font-bold">{platformSetLabel}</span> ·{' '}
                  <span className="text-sky-300 font-bold">{difficultyLabel}</span>
                </div>
                <div>
                  🎲 ระบบจะสุ่มข้อสอบ{' '}
                  <span className="text-emerald-400 font-black">{effectiveQuestionCount} ข้อ</span>{' '}
                  จากคลัง ({eligibleQuestions.length} ข้อที่ตรงเงื่อนไข) เมื่อเปิดห้อง
                  นักเรียนกรอกรหัส PIN เพื่อเข้าร่วมได้ทันที
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={effectiveQuestionCount === 0 || isOpeningOrJoining}
                  onClick={handleTeacherOpenRoomOnly}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>
                    {isRoomOpenedByTeacher
                      ? `อัปเดตชุดข้อสอบห้อง PIN ${gamePin}`
                      : `เปิดห้องให้นักเรียนกรอก PIN (${gamePin})`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={effectiveQuestionCount === 0 || isOpeningOrJoining}
                  onClick={handleTeacherStartGame}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>เปิดห้องและเริ่มประลองสด (สุ่ม {effectiveQuestionCount} ข้อ)</span>
                </button>
              </div>
            </div>

            {/* Right Column: Teacher Exam Set & Randomizer Settings */}
            <div className="lg:col-span-7 space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    ตั้งค่าชุดข้อสอบและระบบสุ่มจากคลัง (สำหรับคุณครู)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('bank')}
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>จัดการคลังข้อสอบ</span>
                </button>
              </div>

              {/* 1. Choose Topic Set: Scratch / Micro:bit / Mixed */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  1. เลือกชุดข้อสอบ (Platform):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      key: 'Scratch' as BattleSetFilter,
                      title: '🐱 Scratch',
                      sub: `${bankBreakdown.byPlatform.Scratch} ข้อในคลัง`,
                      activeClass: 'bg-orange-500/20 border-orange-400 text-orange-200',
                    },
                    {
                      key: 'Micro:bit' as BattleSetFilter,
                      title: '🤖 Micro:bit',
                      sub: `${bankBreakdown.byPlatform['Micro:bit']} ข้อในคลัง`,
                      activeClass: 'bg-sky-500/20 border-sky-400 text-sky-200',
                    },
                    {
                      key: 'mixed' as BattleSetFilter,
                      title: '🔀 แบบผสม',
                      sub: `Scratch + Micro:bit (${bankBreakdown.total} ข้อ)`,
                      activeClass: 'bg-indigo-500/25 border-indigo-400 text-indigo-200',
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedPlatformSet(item.key)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPlatformSet === item.key
                          ? `${item.activeClass} shadow-sm`
                          : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-black">{item.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Choose Difficulty Level: All / Easy / Medium / Hard */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  2. เลือกระดับความยาก (Difficulty):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'all', label: '🎯 ผสมทุกระดับ' },
                      { key: 'easy', label: '🟢 ง่าย' },
                      { key: 'medium', label: '🟡 ปานกลาง' },
                      { key: 'hard', label: '🔴 ยาก' },
                    ] as const
                  ).map((diff) => {
                    const countForDiff = filterBattleQuestions(
                      fullQuestionBank,
                      selectedPlatformSet,
                      diff.key
                    ).length;
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

              {/* 3. Choose Number of Randomized Questions */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    3. ระบุจำนวนข้อสอบที่จะสุ่มจากคลัง:
                  </label>
                  <span className="text-[11px] text-emerald-300 font-bold">
                    พร้อมสุ่มสูงสุด {eligibleQuestions.length} ข้อ
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[5, 8, 10, 15, 20].map((preset) => {
                    const disabled = preset > eligibleQuestions.length;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() => setQuestionCount(preset)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          effectiveQuestionCount === preset
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
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
                      max={Math.max(1, eligibleQuestions.length)}
                      value={effectiveQuestionCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val)) {
                          setQuestionCount(Math.max(1, Math.min(val, eligibleQuestions.length || 1)));
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
                    className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
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
                  <span>เพิ่มข้อสอบใหม่ลงคลัง</span>
                </button>
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
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    PIN: {joinedRoomCode}
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
                  timeLeft <= 5
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft} วินาที</span>
              </div>

              <div className="text-sm font-black text-emerald-400">{score} PTS</div>
            </div>

            {/* Platform & Difficulty Badges + Audio */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                    currentQ.platform === 'Scratch'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {currentQ.platform === 'Scratch' ? '🐱 Scratch' : '🤖 Micro:bit'}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                    DIFFICULTY_META[currentQ.difficulty].badgeClass
                  }`}
                >
                  {DIFFICULTY_META[currentQ.difficulty].emoji} ระดับ
                  {DIFFICULTY_META[currentQ.difficulty].label}
                </span>
              </div>
              <AudioReaderButton textToRead={`${currentQ.title} จงเลือกคำตอบที่ถูกต้อง`} size="sm" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">{currentQ.title}</h2>

            {/* Code Snippet Box */}
            <div className="bg-black/60 rounded-2xl p-5 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
              <pre>{currentQ.codeSnippet}</pre>
            </div>

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
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B: ARENA — 3. ROUND RESULT                                  */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'roundResult' && currentQ && (
          <div className="space-y-6 py-4 max-w-2xl mx-auto">
            <div className="text-center">
              {selectedOption === currentQ.correctIndex ? (
                <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-lg bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ตอบถูกต้อง! ยอดเยี่ยมมาก</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-lg bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20">
                  <XCircle className="w-5 h-5" />
                  <span>
                    {selectedOption === -1
                      ? 'หมดเวลา! ลองดูเฉลยข้อนี้กันนะ'
                      : 'ตอบผิด ไม่เป็นไร ลองดูคำอธิบายนะ!'}
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

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400">💡 เฉลยและข้อคิด: </span>
              {currentQ.explanation}
            </div>

            <button
              type="button"
              onClick={handleNextRound}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {currentRound < activeQuestions.length - 1 ? 'ไปข้อถัดไป' : 'ดูสรุปผลการแข่งขัน'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW B: ARENA — 4. PODIUM & FINAL LEADERBOARD                    */}
        {/* ================================================================ */}
        {activeView === 'arena' && gameState === 'podium' && (
          <div className="text-center py-5 space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/30">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">สิ้นสุดการประลองสด!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
                {playerNickname} ตอบถูก{' '}
                <span className="text-emerald-400 font-bold">
                  {correctCount}/{activeQuestions.length} ข้อ
                </span>{' '}
                {!isTeacher && joinedRoomCode ? `(ห้อง PIN ${joinedRoomCode} · ${joinedHostName})` : `(ชุด ${platformSetLabel} · ${difficultyLabel})`}{' '}
                ทำคะแนนได้ <span className="text-amber-400 font-black">{score} คะแนน</span>!
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 max-w-md mx-auto text-left space-y-2.5">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                🏆 ตารางคะแนนรวมในห้องเรียน (Classroom Leaderboard)
              </div>

              {podiumEntries.map((user) => (
                <div
                  key={`${user.rank}-${user.name}`}
                  className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                    user.isYou
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                      {user.rank}
                    </span>
                    <span>{user.name}</span>
                  </div>
                  <span className="font-mono text-emerald-400">{user.score} pts</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2.5 max-w-lg mx-auto">
              {isTeacher ? (
                <>
                  <button
                    type="button"
                    onClick={handleTeacherStartGame}
                    className="flex-1 min-w-[150px] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>สุ่มชุดใหม่ประลองอีกรอบ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameState('lobby')}
                    className="flex-1 min-w-[140px] py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ตั้งค่าชุดข้อสอบใหม่</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setStudentJoinPin('');
                    setJoinedRoomCode('');
                    setGameState('lobby');
                  }}
                  className="flex-1 min-w-[150px] py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>กรอกรหัสห้องเรียนใหม่</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-w-[140px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                เสร็จสิ้นและรับรางวัล
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
