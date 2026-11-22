import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Footer } from './components/Footer.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { ConfettiCelebration, CelebrationEvent, fireConfetti } from './components/ConfettiCelebration.tsx';
import { soundEffects } from './utils/soundEffects.ts';
import { ThemeMode, getTargetThemeFromTime } from './utils/dayNightCycle.ts';
import { DayNightTransitionOverlay, TransitionPayload } from './components/DayNightTransitionOverlay.tsx';
import {
  testConnection,
  syncUserProfileToFirestore,
  publishShowcaseProjectToFirestore,
} from './services/firestoreService.ts';
import {
  BURST_WINDOW_MS,
  DEFAULT_STARTING_POINTS,
  PointAwardOptions,
  evaluatePointAward,
  getThailandDateKey,
  loadDailyEarnedTracker,
  loadVerifiedStoredPoints,
  normalizeReasonKey,
  persistPointsIntegrity,
  saveDailyEarnedTracker,
  validatePointSpend,
} from './utils/antiCheatGuard.ts';

function lazyNamed<
  TModule extends Record<string, any>,
  TKey extends keyof TModule
>(
  factory: () => Promise<TModule>,
  exportName: TKey
): React.LazyExoticComponent<TModule[TKey]> {
  return lazy(() =>
    factory().then((mod) => ({
      default: mod[exportName],
    }))
  );
}

const ModuleLoadingFallback: React.FC = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
    <div className="w-9 h-9 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
    <span className="text-xs font-semibold">กำลังโหลดห้องเรียนและเครื่องมือ...</span>
  </div>
);

// 4 Main Modules (Code-Split Lazy Chunks)
const SafeSharingGame = lazyNamed(() => import('./components/Module1Safety/SafeSharingGame.tsx'), 'SafeSharingGame');
const PasswordLab = lazyNamed(() => import('./components/Module1Safety/PasswordLab.tsx'), 'PasswordLab');
const NetiquetteScenarios = lazyNamed(() => import('./components/Module1Safety/NetiquetteScenarios.tsx'), 'NetiquetteScenarios');
const SafetyQuiz = lazyNamed(() => import('./components/Module1Safety/SafetyQuiz.tsx'), 'SafetyQuiz');
const PDPALab = lazyNamed(() => import('./components/Module1Safety/PDPALab.tsx'), 'PDPALab');
const PDPAPrivacyGenerator = lazyNamed(() => import('./components/Module1Safety/PDPAPrivacyGenerator.tsx'), 'PDPAPrivacyGenerator');
const InternetSearchLab = lazyNamed(() => import('./components/Module1Safety/InternetSearchLab.tsx'), 'InternetSearchLab');

const PillarsView = lazyNamed(() => import('./components/Module2Thinking/PillarsView.tsx'), 'PillarsView');
const FlowchartGuideView = lazyNamed(() => import('./components/Module2Thinking/FlowchartGuideView.tsx'), 'FlowchartGuideView');
const ControlStructuresView = lazyNamed(() => import('./components/Module2Thinking/ControlStructuresView.tsx'), 'ControlStructuresView');
const AlgorithmPuzzleGame = lazyNamed(() => import('./components/Module2Thinking/AlgorithmPuzzleGame.tsx'), 'AlgorithmPuzzleGame');
const LogicAndStoryboardLab = lazyNamed(() => import('./components/Module2Thinking/LogicAndStoryboardLab.tsx'), 'LogicAndStoryboardLab');

const ScratchStudio = lazyNamed(() => import('./components/Module3CodingLab/ScratchStudio.tsx'), 'ScratchStudio');
const MicrobitSimulator = lazyNamed(() => import('./components/Module3CodingLab/MicrobitSimulator.tsx'), 'MicrobitSimulator');
const CodeExamplesGallery = lazyNamed(() => import('./components/Module3CodingLab/CodeExamplesGallery.tsx'), 'CodeExamplesGallery');
const CodeDebuggingLab = lazyNamed(() => import('./components/Module3CodingLab/CodeDebuggingLab.tsx'), 'CodeDebuggingLab');

const ShowcaseGallery = lazyNamed(() => import('./components/Module4Showcase/ShowcaseGallery.tsx'), 'ShowcaseGallery');
const SubmitProjectModal = lazyNamed(() => import('./components/Module4Showcase/SubmitProjectModal.tsx'), 'SubmitProjectModal');
const PeerReviewWall = lazyNamed(() => import('./components/Module4Showcase/PeerReviewWall.tsx'), 'PeerReviewWall');
const ReflectionJournal = lazyNamed(() => import('./components/Module4Showcase/ReflectionJournal.tsx'), 'ReflectionJournal');
const DailyJournal = lazyNamed(() => import('./components/Module4Showcase/DailyJournal.tsx'), 'DailyJournal');
const CertificateModal = lazyNamed(() => import('./components/Module4Showcase/CertificateModal.tsx'), 'CertificateModal');
const DataProcessingLab = lazyNamed(() => import('./components/Module4Showcase/DataProcessingLab.tsx'), 'DataProcessingLab');

// Secondary Systems & Modals (Code-Split Lazy Chunks)
const ProfileModal = lazyNamed(() => import('./components/ProfileModal.tsx'), 'ProfileModal');
const ProfileManagementView = lazyNamed(() => import('./components/ProfileManagementView.tsx'), 'ProfileManagementView');
const PointsRewardCenter = lazyNamed(() => import('./components/PointsRewardCenter.tsx'), 'PointsRewardCenter');
const VirtualClassroom = lazyNamed(() => import('./components/VirtualClassroom.tsx'), 'VirtualClassroom');
const DidYouKnowSection = lazyNamed(() => import('./components/DidYouKnowSection.tsx'), 'DidYouKnowSection');
const LoginModal = lazyNamed(() => import('./components/LoginModal.tsx'), 'LoginModal');
const Leaderboard = lazyNamed(() => import('./components/Leaderboard.tsx'), 'Leaderboard');
const LearningPathMap = lazyNamed(() => import('./components/LearningPathMap.tsx'), 'LearningPathMap');
const AITutorChatbot = lazyNamed(() => import('./components/AITutorChatbot.tsx'), 'AITutorChatbot');
const GoogleAppsScriptExportModal = lazyNamed(() => import('./components/GoogleAppsScriptExportModal.tsx'), 'GoogleAppsScriptExportModal');
const TeacherAssessmentReportModal = lazyNamed(() => import('./components/TeacherAssessmentReportModal.tsx'), 'TeacherAssessmentReportModal');
const UnpluggedWorksheetsModal = lazyNamed(() => import('./components/UnpluggedWorksheetsModal.tsx'), 'UnpluggedWorksheetsModal');
const DailyBugHunterModal = lazyNamed(() => import('./components/DailyBugHunterModal.tsx'), 'DailyBugHunterModal');
const JuniorCodePlayground = lazyNamed(() => import('./components/JuniorCodePlayground.tsx'), 'JuniorCodePlayground');
const KidsAILab = lazyNamed(() => import('./components/KidsAILab.tsx'), 'KidsAILab');
const BuddySystem = lazyNamed(() => import('./components/BuddySystem.tsx'), 'BuddySystem');
const ExamArenaModal = lazyNamed(() => import('./components/ExamArenaModal.tsx'), 'ExamArenaModal');
const TeamBattleArena = lazyNamed(() => import('./components/TeamBattleArena.tsx'), 'TeamBattleArena');
const DigitalPassportModal = lazyNamed(() => import('./components/DigitalPassportModal.tsx'), 'DigitalPassportModal');
const TeacherLessonPlansModal = lazyNamed(() => import('./components/TeacherLessonPlansModal.tsx'), 'TeacherLessonPlansModal');
const DigitalLibrary = lazyNamed(() => import('./components/DigitalLibrary.tsx'), 'DigitalLibrary');
const StemProjectHub = lazyNamed(() => import('./components/StemProjectHub.tsx'), 'StemProjectHub');
const BinaryPixelArtLab = lazyNamed(() => import('./components/BinaryPixelArtLab.tsx'), 'BinaryPixelArtLab');
const RubricAssessmentModal = lazyNamed(() => import('./components/RubricAssessmentModal.tsx'), 'RubricAssessmentModal');
const ParentTeacherKitModal = lazyNamed(() => import('./components/ParentTeacherKitModal.tsx'), 'ParentTeacherKitModal');
const AiPromptLab = lazyNamed(() => import('./components/AiPromptLab.tsx'), 'AiPromptLab');
const MicrobitDataLogger = lazyNamed(() => import('./components/MicrobitDataLogger.tsx'), 'MicrobitDataLogger');
const ClassroomBattleModal = lazyNamed(() => import('./components/ClassroomBattleModal.tsx'), 'ClassroomBattleModal');
const OnetBattleModal = lazyNamed(() => import('./components/OnetBattleModal.tsx'), 'OnetBattleModal');
const CodeTyperModal = lazyNamed(() => import('./components/CodeTyperModal.tsx'), 'CodeTyperModal');
const PairProgrammingArena = lazyNamed(() => import('./components/PairProgrammingArena.tsx'), 'PairProgrammingArena');
const TeacherMasteryPortal = lazyNamed(() => import('./components/TeacherMasteryPortal.tsx'), 'TeacherMasteryPortal');
const TeacherClassroomStatsModal = lazyNamed(() => import('./components/TeacherClassroomStatsModal.tsx'), 'TeacherClassroomStatsModal');
const StemPacksModal = lazyNamed(() => import('./components/StemPacksModal.tsx'), 'StemPacksModal');
const CoderHeroCardsModal = lazyNamed(() => import('./components/CoderHeroCardsModal.tsx'), 'CoderHeroCardsModal');
const SmartExamGeneratorModal = lazyNamed(() => import('./components/SmartExamGeneratorModal.tsx'), 'SmartExamGeneratorModal');
const VisualCodeTracerModal = lazyNamed(() => import('./components/VisualCodeTracerModal.tsx'), 'VisualCodeTracerModal');
const StudentQRPassModal = lazyNamed(() => import('./components/StudentQRPassModal.tsx'), 'StudentQRPassModal');
const MicrobitMusicLab = lazyNamed(() => import('./components/MicrobitMusicLab.tsx'), 'MicrobitMusicLab');
const QuickSearchModal = lazyNamed(() => import('./components/QuickSearchModal.tsx'), 'QuickSearchModal');
const ClassroomLuckyWheel = lazyNamed(() => import('./components/ClassroomLuckyWheel.tsx'), 'ClassroomLuckyWheel');
const BlockMazeRunner = lazyNamed(() => import('./components/BlockMazeRunner.tsx'), 'BlockMazeRunner');
const HomeworkDropzone = lazyNamed(() => import('./components/HomeworkDropzone.tsx'), 'HomeworkDropzone');
const AvatarShopModal = lazyNamed(() => import('./components/AvatarShopModal.tsx'), 'AvatarShopModal');
const LiveQuizBattleModal = lazyNamed(() => import('./components/LiveQuizBattleModal.tsx'), 'LiveQuizBattleModal');
const CommunityRemixHubModal = lazyNamed(() => import('./components/CommunityRemixHubModal.tsx'), 'CommunityRemixHubModal');
const DailyMicroChallengeModal = lazyNamed(() => import('./components/DailyMicroChallengeModal.tsx'), 'DailyMicroChallengeModal');
const BebrasSimulatorModal = lazyNamed(() => import('./components/BebrasSimulatorModal.tsx'), 'BebrasSimulatorModal');
const SmartSocraticDebuggerModal = lazyNamed(() => import('./components/SmartSocraticDebuggerModal.tsx'), 'SmartSocraticDebuggerModal');
const StudentReportCardModal = lazyNamed(() => import('./components/StudentReportCardModal.tsx'), 'StudentReportCardModal');
const ComputingGlossaryModal = lazyNamed(() => import('./components/ComputingGlossaryModal.tsx'), 'ComputingGlossaryModal');

import {
  INITIAL_SHOWCASE_PROJECTS,
  DEFAULT_PROFILE,
  DEFAULT_PROFILES_LIST,
  ACHIEVEMENT_BADGES,
  INITIAL_POINT_TRANSACTIONS,
  INITIAL_TODAY_GOAL,
} from './data/learningData.ts';
import {
  ShowcaseProject,
  ProjectStage,
  PeerReview,
  UserProfile,
  AchievementBadge,
  PointTransaction,
  TodayLearningGoal,
  TeacherRecord,
  ColorTone,
} from './types/index.ts';
import {
  TARGET_SPREADSHEET_ID,
  fetchTeachersFromGoogleSheet,
  fetchStudentsFromGoogleSheet,
  checkIsTeacherAdmin,
  getAdminProfileData,
  recordStudentLoginToGoogleSheet,
  saveProfileToGoogleSheet,
  syncAllToGoogleSheet,
  auth,
  initAuth,
  googleLogout,
} from './services/googleSheetsService.ts';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import {
  parseRouteFromUrl,
  syncRouteToUrl,
  buildShareableLessonUrl,
} from './utils/urlRouter.ts';
import confetti from 'canvas-confetti';

// Helper: Filter out legacy mock profiles (กวินท์, ณิชารีย์, CK-2569-4102, ฯลฯ)
const isLegacyMockProfile = (p?: any): boolean => {
  if (!p) return true;
  const name = String(p.name || '');
  const id = String(p.id || '');
  const studentId = String(p.studentId || '');
  return (
    id.startsWith('prof_1') ||
    id.startsWith('prof_2') ||
    id.startsWith('prof_3') ||
    id.startsWith('prof_4') ||
    id.startsWith('prof_5') ||
    id.startsWith('prof_6') ||
    studentId === 'CK-2569-4102' ||
    studentId === 'CK-2569-4103' ||
    studentId === 'CK-2569-4104' ||
    studentId === 'CK-2569-4105' ||
    studentId === 'CK-2569-4106' ||
    studentId === 'CK-2569-4107' ||
    name.includes('กวินท์') ||
    name.includes('ณิชารีย์') ||
    name.includes('ธีรภัทร') ||
    name.includes('พิมพิมาดา') ||
    name.includes('ชนัญชิดา')
  );
};

export default function App() {
  const initialRoute = typeof window !== 'undefined' ? parseRouteFromUrl(window.location.search) : null;
  const isApplyingPopStateRef = useRef(false);
  const [copiedLessonLink, setCopiedLessonLink] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(initialRoute?.tab || 'dashboard');

  // Sub-tab selectors for each module
  const [safetySubTab, setSafetySubTab] = useState<
    'pdpaLab' | 'pdpa' | 'password' | 'netiquette' | 'quiz' | 'pdpaGenerator' | 'searchLab'
  >(
    initialRoute?.tab === 'safety' && initialRoute.sub
      ? (initialRoute.sub as any)
      : 'pdpaLab'
  );
  const [thinkingSubTab, setThinkingSubTab] = useState<
    'pillars' | 'flowchart' | 'controls' | 'puzzle' | 'logicLab'
  >(
    initialRoute?.tab === 'thinking' && initialRoute.sub
      ? (initialRoute.sub as any)
      : 'pillars'
  );
  const [codingSubTab, setCodingSubTab] = useState<
    'scratch' | 'microbit' | 'musicLab' | 'examplesGallery' | 'debugLab'
  >(
    initialRoute?.tab === 'codingLab' && initialRoute.sub
      ? (initialRoute.sub as any)
      : 'scratch'
  );
  const [showcaseSubTab, setShowcaseSubTab] = useState<
    'gallery' | 'reviews' | 'reflection' | 'dailyJournal' | 'dataLab'
  >(
    initialRoute?.tab === 'showcase' && initialRoute.sub
      ? (initialRoute.sub as any)
      : 'gallery'
  );

  const currentActiveSubTab =
    activeTab === 'safety'
      ? safetySubTab
      : activeTab === 'thinking'
      ? thinkingSubTab
      : activeTab === 'codingLab'
      ? codingSubTab
      : activeTab === 'showcase'
      ? showcaseSubTab
      : undefined;

  // Sync active tab & sub-tab to browser URL (?tab=...&sub=...) for shareable links & refresh persistence
  useEffect(() => {
    if (isApplyingPopStateRef.current) {
      isApplyingPopStateRef.current = false;
      return;
    }
    syncRouteToUrl({ tab: activeTab, sub: currentActiveSubTab }, false);
  }, [activeTab, currentActiveSubTab]);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromUrl(window.location.search);
      isApplyingPopStateRef.current = true;
      if (!parsed) {
        setActiveTab('dashboard');
        return;
      }
      setActiveTab(parsed.tab);
      if (parsed.tab === 'safety' && parsed.sub) setSafetySubTab(parsed.sub as any);
      if (parsed.tab === 'thinking' && parsed.sub) setThinkingSubTab(parsed.sub as any);
      if (parsed.tab === 'codingLab' && parsed.sub) setCodingSubTab(parsed.sub as any);
      if (parsed.tab === 'showcase' && parsed.sub) setShowcaseSubTab(parsed.sub as any);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCopyShareableLessonLink = async () => {
    const url = buildShareableLessonUrl(activeTab, currentActiveSubTab);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      soundEffects.play('correct');
      setCopiedLessonLink(true);
      setTimeout(() => setCopiedLessonLink(false), 2400);
    } catch {
      // Fallback copy via temporary input
      try {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        soundEffects.play('correct');
        setCopiedLessonLink(true);
        setTimeout(() => setCopiedLessonLink(false), 2400);
      } catch {
        // Ignore clipboard errors in restricted frames
      }
    }
  };

  // Student Profiles State for Multi-Profile Management (เพิ่ม, ลบ, แก้ไข, สลับ)
  // ลบโปรไฟล์เริ่มต้นของระบบออกทั้งหมด ข้อมูลจะถูกดึงอัตโนมัติจากแท็บ Students ใน Google Sheet
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('coderkids_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p) => !isLegacyMockProfile(p));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {
        console.error('Error loading profiles:', e);
      }
    }
    return DEFAULT_PROFILES_LIST;
  });

  // Current Active Student Profile: หากยังไม่เข้าสู่ระบบ จะเป็น guest_learner
  const [profile, setProfile] = useState<UserProfile>(() => {
    const isLogged = localStorage.getItem('coderkids_is_logged_in') === 'true';
    if (!isLogged) {
      return DEFAULT_PROFILE;
    }
    const saved = localStorage.getItem('coderkids_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && !isLegacyMockProfile(parsed)) return parsed;
      } catch (e) {
        console.error('Error loading active profile:', e);
      }
    }
    return DEFAULT_PROFILE;
  });

  // Anti-Cheat: บันทึกรายการกิจกรรม/ภารกิจที่รับแต้มไปแล้ว ป้องกันการฟาร์มแต้มซ้ำ
  const [claimedActivities, setClaimedActivities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_claimed_activities');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<PointTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_transactions');
      const parsed = saved ? JSON.parse(saved) : INITIAL_POINT_TRANSACTIONS;
      return Array.isArray(parsed) ? parsed : INITIAL_POINT_TRANSACTIONS;
    } catch {
      return INITIAL_POINT_TRANSACTIONS;
    }
  });

  // Points State (ตรวจลายเซ็น integrity + เพดาน ledger ป้องกันการแก้ localStorage ด้วย DevTools)
  const [points, setPoints] = useState<number>(() => {
    const verified = loadVerifiedStoredPoints(
      transactions,
      claimedActivities.length,
      DEFAULT_STARTING_POINTS
    );
    if (verified.tampered) {
      console.warn('[Anti-Cheat] ตรวจพบการแก้ไขคะแนนใน localStorage โดยไม่ได้รับอนุญาต ระบบกู้คืนคะแนนที่ถูกต้องแล้ว');
    }
    return verified.points;
  });

  // Module Progress State
  const [moduleProgress, setModuleProgress] = useState<{
    safety: boolean;
    thinking: boolean;
    codingLab: boolean;
    showcase: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('coderkids_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return { safety: false, thinking: false, codingLab: false, showcase: false };
  });

  // Achievement Badges
  const [badges, setBadges] = useState<AchievementBadge[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_badges');
      return saved ? JSON.parse(saved) : ACHIEVEMENT_BADGES;
    } catch {
      return ACHIEVEMENT_BADGES;
    }
  });

  // Projects and peer reviews
  const [projects, setProjects] = useState<ShowcaseProject[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_projects');
      return saved ? JSON.parse(saved) : INITIAL_SHOWCASE_PROJECTS;
    } catch {
      return INITIAL_SHOWCASE_PROJECTS;
    }
  });

  const [likedProjectIds, setLikedProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_liked_projects');
      return saved ? JSON.parse(saved) : ['proj_1'];
    } catch {
      return ['proj_1'];
    }
  });

  const [reviews, setReviews] = useState<PeerReview[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_reviews');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'rev_1',
              projectId: 'proj_1',
              reviewerName: 'ด.ญ. ชนัญชิดา สุขสันต์',
              star1: 'เกมเล่นสนุก มีเสียงประกอบน่ารักมาก และเก็บเหรียญได้สมูท',
              star2: 'ชอบที่ใช้ตัวแปรนับคะแนนและแถบพลังชีวิตชัดเจน',
              wish: 'อยากให้เพิ่มศัตรูระดับบอสตอนท้ายเกมจะยิ่งท้าทายขึ้นค่ะ',
              createdAt: '1 วันที่แล้ว',
            },
            {
              id: 'rev_2',
              projectId: 'proj_2',
              reviewerName: 'ด.ช. ธนกฤต วุฒิชัย',
              star1: 'การประยุกต์ใช้เซ็นเซอร์อุณหภูมิกับสิ่งแวดล้อมมีประโยชน์มาก',
              star2: 'ไอคอนพระอาทิตย์บนหน้าจอ Micro:bit ดูเข้าใจง่ายดี',
              wish: 'ถ้าต่อ Relay สั่งเปิดปั๊มน้ำจริงได้จะยอดเยี่ยมมากเลยครับ',
              createdAt: '2 วันที่แล้ว',
            },
          ];
    } catch {
      return [
        {
          id: 'rev_1',
          projectId: 'proj_1',
          reviewerName: 'ด.ญ. ชนัญชิดา สุขสันต์',
          star1: 'เกมเล่นสนุก มีเสียงประกอบน่ารักมาก และเก็บเหรียญได้สมูท',
          star2: 'ชอบที่ใช้ตัวแปรนับคะแนนและแถบพลังชีวิตชัดเจน',
          wish: 'อยากให้เพิ่มศัตรูระดับบอสตอนท้ายเกมจะยิ่งท้าทายขึ้นค่ะ',
          createdAt: '1 วันที่แล้ว',
        },
      ];
    }
  });

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isGasExportModalOpen, setIsGasExportModalOpen] = useState(false);
  const [isAssessmentReportOpen, setIsAssessmentReportOpen] = useState(false);
  const [isUnpluggedWorksheetsOpen, setIsUnpluggedWorksheetsOpen] = useState(false);
  const [isBugHunterOpen, setIsBugHunterOpen] = useState(false);
  const [isExamArenaOpen, setIsExamArenaOpen] = useState(false);
  const [isDigitalPassportOpen, setIsDigitalPassportOpen] = useState(false);
  const [isTeacherPlansOpen, setIsTeacherPlansOpen] = useState(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isParentTeacherKitOpen, setIsParentTeacherKitOpen] = useState(false);
  const [isClassroomBattleOpen, setIsClassroomBattleOpen] = useState(false);
  const [isOnetBattleOpen, setIsOnetBattleOpen] = useState(false);
  const [isCodeTyperOpen, setIsCodeTyperOpen] = useState(false);
  const [isPairArenaOpen, setIsPairArenaOpen] = useState(false);
  const [isStemPacksOpen, setIsStemPacksOpen] = useState(false);
  const [isTeacherMasteryOpen, setIsTeacherMasteryOpen] = useState(false);
  const [isClassroomStatsOpen, setIsClassroomStatsOpen] = useState(false);
  const [isHeroCardsOpen, setIsHeroCardsOpen] = useState(false);
  const [isSmartExamOpen, setIsSmartExamOpen] = useState(false);
  const [isCodeTracerOpen, setIsCodeTracerOpen] = useState(false);
  const [isStudentQRPassOpen, setIsStudentQRPassOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [isMazeRunnerOpen, setIsMazeRunnerOpen] = useState(false);
  const [isHomeworkDropzoneOpen, setIsHomeworkDropzoneOpen] = useState(false);
  const [isAvatarShopOpen, setIsAvatarShopOpen] = useState(false);
  const [isLiveQuizBattleOpen, setIsLiveQuizBattleOpen] = useState(false);
  const [isCommunityRemixOpen, setIsCommunityRemixOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isBebrasSimulatorOpen, setIsBebrasSimulatorOpen] = useState(false);
  const [isSocraticDebuggerOpen, setIsSocraticDebuggerOpen] = useState(false);
  const [isStudentReportCardOpen, setIsStudentReportCardOpen] = useState(false);
  const [isComputingGlossaryOpen, setIsComputingGlossaryOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<ShowcaseProject | null>(null);
  const [pythonHandoff, setPythonHandoff] = useState<{
    code: string;
    title: string;
    key: number;
  } | null>(null);
  const [viewRoleMode, setViewRoleMode] = useState<'student' | 'teacher'>(() => {
    try {
      const saved = localStorage.getItem('coderkids_view_role_mode');
      if (saved === 'teacher' || saved === 'student') return saved;
    } catch {}
    return 'student';
  });

  // Member Login Gate State ("สมาชิกลงชื่อเข้าใช้งาน ก่อนเข้าบทเรียน")
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    // ตรวจสอบความถูกต้อง หากเคยจำลองเป็นโปรไฟล์ระบบเดิม ให้เคลียร์เพื่อความปลอดภัย
    const savedProf = localStorage.getItem('coderkids_profile');
    if (savedProf) {
      try {
        const p = JSON.parse(savedProf);
        if (isLegacyMockProfile(p)) {
          localStorage.removeItem('coderkids_profile');
          localStorage.removeItem('coderkids_is_logged_in');
          return false;
        }
      } catch {
        return false;
      }
    }
    const saved = localStorage.getItem('coderkids_is_logged_in');
    return saved === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingDestinationModule, setPendingDestinationModule] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('coderkids_claimed_activities', JSON.stringify(claimedActivities));
  }, [claimedActivities]);

  // Anti-Cheat Rate Limiting, Rolling Burst & Daily XP Cap Trackers
  const lastActionTimestampsRef = useRef<Map<string, number>>(new Map());
  const recentAwardTimestampsRef = useRef<number[]>([]);
  const dailyEarnedRef = useRef(loadDailyEarnedTracker());

  // Today's Learning Goal State (เป้าหมายการเรียนรู้วันนี้ ที่ตั้งจาก DailyJournal)
  const [todayGoal, setTodayGoal] = useState<TodayLearningGoal | null>(() => {
    const saved = localStorage.getItem('coderkids_today_goal');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.goal) return parsed;
      } catch (e) {
        console.error('Error loading today goal:', e);
      }
    }
    return INITIAL_TODAY_GOAL;
  });

  useEffect(() => {
    if (todayGoal) {
      localStorage.setItem('coderkids_today_goal', JSON.stringify(todayGoal));
    } else {
      localStorage.removeItem('coderkids_today_goal');
    }
  }, [todayGoal]);

  // Theme & Day/Night Cycle State (สลับธีมอัตโนมัติตามเวลาจริง + โหมดสว่าง/มืดคงที่ พร้อมเอฟเฟกต์เปลี่ยนผ่าน)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('coderkids_theme_mode');
    if (savedMode === 'auto' || savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }
    return 'auto';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('coderkids_theme_mode');
    if (savedMode === 'light' || savedMode === 'dark') return savedMode;
    if (savedMode === 'auto' || !savedMode) {
      return getTargetThemeFromTime();
    }
    const saved = localStorage.getItem('coderkids_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return getTargetThemeFromTime();
  });

  const [transitionEvent, setTransitionEvent] = useState<TransitionPayload | null>(null);

  const triggerThemeTransition = (targetTheme: 'light' | 'dark', reason: 'auto' | 'manual' = 'manual') => {
    setTransitionEvent({
      toTheme: targetTheme,
      reason,
      timestamp: Date.now(),
    });
    setTheme(targetTheme);
  };

  useEffect(() => {
    localStorage.setItem('coderkids_theme_mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('coderkids_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // ตรวจสอบเวลาจริงทุก 30 วินาที เมื่ออยู่ในโหมดสลับอัตโนมัติ (Day/Night Cycle Auto)
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const syncThemeWithClock = () => {
      const target = getTargetThemeFromTime(new Date());
      setTheme((prev) => {
        if (prev !== target) {
          setTransitionEvent({
            toTheme: target,
            reason: 'auto',
            timestamp: Date.now(),
          });
          return target;
        }
        return prev;
      });
    };

    syncThemeWithClock();
    const interval = setInterval(syncThemeWithClock, 30000);
    return () => clearInterval(interval);
  }, [themeMode]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    triggerThemeTransition(nextTheme, 'manual');
    soundEffects.play('click');
  };

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    soundEffects.play('click');
    const target = mode === 'auto' ? getTargetThemeFromTime() : mode;
    if (target !== theme) {
      triggerThemeTransition(target, mode === 'auto' ? 'auto' : 'manual');
    }
  };

  const handlePreviewTransition = () => {
    soundEffects.play('click');
    const oppositeTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    triggerThemeTransition(oppositeTheme, 'manual');
    if (themeMode === 'auto') {
      setTimeout(() => {
        const realTarget = getTargetThemeFromTime();
        if (realTarget !== oppositeTheme) {
          triggerThemeTransition(realTarget, 'auto');
        }
      }, 2200);
    } else {
      setThemeMode(oppositeTheme);
    }
  };

  // App Color Tone (ฟีเจอร์เปลี่ยนโทนสีของแอป: indigo, emerald, purple, amber, rose, teal)
  const [colorTone, setColorTone] = useState<ColorTone>(() => {
    const saved = localStorage.getItem('coderkids_color_tone') as ColorTone | null;
    if (saved && ['indigo', 'emerald', 'purple', 'amber', 'rose', 'teal'].includes(saved)) {
      return saved;
    }
    return 'indigo';
  });

  useEffect(() => {
    localStorage.setItem('coderkids_color_tone', colorTone);
    document.documentElement.setAttribute('data-color-tone', colorTone);
  }, [colorTone]);

  const handleSetColorTone = (newTone: ColorTone) => {
    setColorTone(newTone);
    soundEffects.play('click');
  };

  // Classroom Projector Mode (โหมดฉายจอห้องเรียนโปรเจกเตอร์: ขยายขนาดตัวอักษรและคอนทราสต์)
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(() => {
    return localStorage.getItem('coderkids_projector_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('coderkids_projector_mode', String(isProjectorMode));
    document.documentElement.setAttribute('data-projector', isProjectorMode ? 'true' : 'false');
  }, [isProjectorMode]);

  // Google Sheets Live Sync State & Indicator
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('coderkids_last_sync_time') || 'เมื่อสักครู่';
  });

  // Global Quick Search Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Google Sheets Universal Manual Sync Trigger
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    soundEffects.play('tick');
    try {
      const profilesToSync = [profile, ...profiles.filter((p) => p.id !== profile.id)];
      const res = await syncAllToGoogleSheet(TARGET_SPREADSHEET_ID, profilesToSync);
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      localStorage.setItem('coderkids_last_sync_time', timeStr);
      
      if (res.directSheetWrite) {
        soundEffects.play('victory');
        fireConfetti('fireworks');
        setCelebrationEvent({
          id: `sync_success_${Date.now()}`,
          type: 'custom',
          title: '📊 ซิงค์ข้อมูลลง Google Sheets เรียบร้อย!',
          subtitle: res.message || `บันทึกนักเรียน ${res.studentsCount} คน และประวัติการเรียนรู้ ${res.logsCount} รายการลง Google Sheet สำเร็จ`,
          pointsAwarded: 5,
          badgeEmoji: '☁️',
        });
      } else {
        soundEffects.play('badge');
        setCelebrationEvent({
          id: `sync_local_${Date.now()}`,
          type: 'custom',
          title: '💾 บันทึกข้อมูลในระบบเรียบร้อยแล้ว!',
          subtitle: res.message || `สำรองข้อมูลนักเรียน ${res.studentsCount} คน ปลอดภัยในระบบเรียบร้อยแล้ว`,
          pointsAwarded: 5,
          badgeEmoji: '🛡️',
        });
      }
    } catch (err: any) {
      console.warn('Google Sheets sync warning:', err);
      soundEffects.play('badge');
      setCelebrationEvent({
        id: `sync_safe_${Date.now()}`,
        type: 'custom',
        title: '💾 บันทึกข้อมูลในระบบเรียบร้อยแล้ว',
        subtitle: 'ข้อมูลและประวัติการเรียนรู้ของคุณได้รับการบันทึกไว้อย่างปลอดภัยในระบบ',
        pointsAwarded: 2,
        badgeEmoji: '💾',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Celebration event state for ConfettiCelebration component
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEvent | null>(null);

  const handleTriggerManualCelebration = () => {
    fireConfetti('fireworks');
    setCelebrationEvent({
      id: `celebrate_manual_${Date.now()}`,
      type: 'custom',
      title: '🌟 เก่งมาก! กำลังใจในการเรียนรู้วิทยาการคำนวณ',
      subtitle: 'คุณกำลังก้าวหน้าอย่างยอดเยี่ยมบนเส้นทางการเรียนรู้ ร่วมสะสมแต้มและฝึกทักษะให้ครบทุกโมดูลนะ!',
      pointsAwarded: 10,
      badgeEmoji: '✨',
      nextStepTitle: 'ไปที่แผนที่การเดินทาง (Learning Map) 🗺️',
      nextStepModule: 'learningMap',
    });
  };

  // จัดการเป้าหมายการเรียนรู้วันนี้ พร้อมระบบ Anti-Cheat (รับแต้มเป้าหมายรายวันได้สูงสุดวันละ 1 ครั้ง)
  const handleToggleTodayGoal = () => {
    if (!todayGoal) return;
    const newCompleted = !todayGoal.completed;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const goalUniqueKey = `daily_goal_${getThailandDateKey()}`;
    const isAlreadyClaimed = Boolean(todayGoal.pointsClaimed || claimedActivities.includes(goalUniqueKey));

    const updated: TodayLearningGoal = {
      ...todayGoal,
      completed: newCompleted,
      completedAt: newCompleted ? nowTime : undefined,
      pointsClaimed: isAlreadyClaimed || newCompleted,
    };
    setTodayGoal(updated);

    if (newCompleted) {
      if (!isAlreadyClaimed) {
        addPoints(
          20,
          `ทำเป้าหมายการเรียนรู้วันนี้สำเร็จ: "${todayGoal.goal.substring(0, 35)}..."`,
          'classroom',
          { uniqueKey: goalUniqueKey }
        );
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      } else {
        soundEffects.play('click');
      }
    }
  };

  const handleSetTodayGoal = (
    goalText: string,
    category: 'coding' | 'hardware' | 'thinking' | 'safety' | 'reflection' = 'coding'
  ) => {
    const now = new Date();
    const newGoal: TodayLearningGoal = {
      id: `goal_${Date.now()}`,
      goal: goalText.trim(),
      completed: false,
      pointsClaimed: false,
      category,
      createdAt: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      date: now.toISOString().split('T')[0],
    };
    setTodayGoal(newGoal);
  };

  useEffect(() => {
    localStorage.setItem('coderkids_is_logged_in', isLoggedIn.toString());
  }, [isLoggedIn]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('coderkids_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('coderkids_profile', JSON.stringify(profile));
  }, [profile]);

  // Profile Management Handlers (เพิ่ม, แก้ไข, ลบ, สลับ)
  // ใช้เฉพาะอีเมลที่ผ่านการยืนยันตัวตนจาก Firebase Auth จริงเท่านั้น (ห้ามเชื่อค่าจาก localStorage หรือ contactEmail)
  const getCurrentVerifiedEmail = () =>
    auth.currentUser?.emailVerified && auth.currentUser?.email
      ? auth.currentUser.email.trim().toLowerCase()
      : firebaseUserEmail;

  const handleUpdateProfile = (updated: UserProfile) => {
    // กฎความปลอดภัย: สมาชิกไม่สามารถแก้ไขข้อมูลสมาชิกคนอื่นได้ (ต้องยืนยันตัวตนผ่าน Google OAuth และมีอีเมลในแท็บ Teachers เท่านั้น)
    const isTeacher = checkIsTeacherAdmin(getCurrentVerifiedEmail(), teachersList).isAdmin;
    if (!isTeacher && updated.id !== profile.id && updated.studentId !== profile.studentId) {
      setCelebrationEvent({
        id: `perm_denied_${Date.now()}`,
        type: 'custom',
        title: '🔒 ปฏิเสธการดำเนินการ',
        subtitle: 'สมาชิกไม่สามารถแก้ไขข้อมูลของสมาชิกคนอื่นได้ (สิทธิ์เฉพาะครู/แอดมินที่ยืนยันตัวตนผ่าน Google)',
        badgeEmoji: '🔒',
      });
      return;
    }

    setProfile(updated);
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      if (exists) {
        return prev.map((p) => (p.id === updated.id ? updated : p));
      }
      return [...prev, updated];
    });
  };

  const handleAddProfile = (newProfile: UserProfile, makeActive: boolean = true) => {
    // กฎความปลอดภัย: สมาชิกไม่สามารถเพิ่มข้อมูลสมาชิกคนอื่นในระบบได้
    const isTeacher = checkIsTeacherAdmin(getCurrentVerifiedEmail(), teachersList).isAdmin;
    if (!isTeacher) {
      setCelebrationEvent({
        id: `perm_denied_${Date.now()}`,
        type: 'custom',
        title: '🔒 ปฏิเสธการดำเนินการ',
        subtitle: 'สมาชิกไม่สามารถเพิ่มข้อมูลผู้เรียนคนอื่นในระบบได้ (สิทธิ์เฉพาะครู/แอดมินที่ยืนยันตัวตนผ่าน Google)',
        badgeEmoji: '🔒',
      });
      return;
    }
    setProfiles((prev) => [newProfile, ...prev]);
    if (makeActive) {
      setProfile(newProfile);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    // กฎความปลอดภัย: สมาชิกไม่สามารถลบข้อมูลสมาชิกคนอื่นได้
    const isTeacher = checkIsTeacherAdmin(getCurrentVerifiedEmail(), teachersList).isAdmin;
    if (!isTeacher) {
      setCelebrationEvent({
        id: `perm_denied_${Date.now()}`,
        type: 'custom',
        title: '🔒 ปฏิเสธการดำเนินการ',
        subtitle: 'สมาชิกไม่สามารถลบข้อมูลสมาชิกคนอื่นได้ (สิทธิ์เฉพาะครู/แอดมิน)',
        badgeEmoji: '🔒',
      });
      return;
    }
    setProfiles((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((p) => p.id !== profileId);
      if (profile.id === profileId && remaining.length > 0) {
        setProfile(remaining[0]);
      }
      return remaining;
    });
  };

  const handleSelectProfile = (profileId: string) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setProfile(found);
    }
  };

  // Lesson Access Gatekeeper ("สมาชิกลงชื่อเข้าใช้งาน ก่อนเข้าบทเรียน & จัดการโปรไฟล์")
  const handleNavigate = (moduleKey: string, subSection?: string) => {
    const protectedModules = ['safety', 'thinking', 'codingLab', 'showcase', 'classroom', 'profileManage', 'pdpaConsent'];
    if (!isLoggedIn && protectedModules.includes(moduleKey)) {
      setPendingDestinationModule(moduleKey);
      setIsLoginModalOpen(true);
      return;
    }
    if (moduleKey === 'certificate') {
      setIsCertificateModalOpen(true);
      return;
    }
    if (moduleKey === 'luckyWheel') {
      setIsLuckyWheelOpen(true);
      return;
    }
    if (moduleKey === 'mazeRunner') {
      setIsMazeRunnerOpen(true);
      return;
    }
    if (moduleKey === 'homeworkDropzone') {
      setIsHomeworkDropzoneOpen(true);
      return;
    }
    if (moduleKey === 'avatarShop') {
      setIsAvatarShopOpen(true);
      return;
    }
    if (moduleKey === 'teacherMastery') {
      setIsTeacherMasteryOpen(true);
      return;
    }
    if (moduleKey === 'classroomStats') {
      setIsClassroomStatsOpen(true);
      return;
    }
    if (moduleKey === 'rubricModal') {
      setIsRubricModalOpen(true);
      return;
    }
    if (moduleKey === 'smartExam') {
      setIsSmartExamOpen(true);
      return;
    }
    if (moduleKey === 'examArena') {
      setIsExamArenaOpen(true);
      return;
    }
    if (moduleKey === 'worksheets') {
      setIsUnpluggedWorksheetsOpen(true);
      return;
    }
    if (moduleKey === 'bugHunter') {
      setIsBugHunterOpen(true);
      return;
    }
    if (moduleKey === 'digitalPassport') {
      setIsDigitalPassportOpen(true);
      return;
    }
    if (moduleKey === 'codeTyper') {
      setIsCodeTyperOpen(true);
      return;
    }
    if (moduleKey === 'heroCards') {
      setIsHeroCardsOpen(true);
      return;
    }
    if (moduleKey === 'classroomBattle') {
      setIsClassroomBattleOpen(true);
      return;
    }
    if (moduleKey === 'onetBattle') {
      setIsOnetBattleOpen(true);
      return;
    }
    if (moduleKey === 'quickSearch') {
      setIsQuickSearchOpen(true);
      return;
    }
    if (moduleKey === 'liveQuizBattle') {
      setIsLiveQuizBattleOpen(true);
      return;
    }
    if (moduleKey === 'communityRemix') {
      setIsCommunityRemixOpen(true);
      return;
    }
    if (moduleKey === 'dailyChallenge') {
      setIsDailyChallengeOpen(true);
      return;
    }
    if (moduleKey === 'bebrasSimulator') {
      setIsBebrasSimulatorOpen(true);
      return;
    }
    if (moduleKey === 'socraticDebugger') {
      setIsSocraticDebuggerOpen(true);
      return;
    }
    if (moduleKey === 'reportCard') {
      setIsStudentReportCardOpen(true);
      return;
    }
    if (moduleKey === 'glossary') {
      setIsComputingGlossaryOpen(true);
      return;
    }
    if (moduleKey === 'safety' && subSection) {
      setSafetySubTab(subSection as any);
    }
    if (moduleKey === 'thinking' && subSection) {
      setThinkingSubTab(subSection as any);
    }
    if (moduleKey === 'codingLab' && subSection) {
      setCodingSubTab(subSection as any);
    }
    if (moduleKey === 'showcase' && subSection) {
      setShowcaseSubTab(subSection as any);
    }
    setActiveTab(moduleKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // บันทึกประวัติการเข้าเรียนรู้ลงในชีตแท็บ Logs อัตโนมัติ (เฉพาะเมื่อผู้ใช้ไม่ได้เลือก nosync)
    if (isLoggedIn && profile && profile.id !== 'guest_learner') {
      const syncPref = localStorage.getItem('coderkids_sync_to_sheets');
      if (syncPref !== 'nosync') {
        recordStudentLoginToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          profile,
          auth.currentUser?.email || profile.contactEmail || '',
          `เข้าเรียนรู้โมดูล: ${moduleKey}${subSection ? ` (${subSection})` : ''}`,
          moduleKey
        ).catch(() => {});
      }
    }
  };

  const handleLoginSuccess = (selectedProfile: UserProfile, googleUser?: any) => {
    const googleDisplayName = (
      googleUser?.displayName ||
      googleUser?.providerData?.find?.((p: any) => p?.displayName)?.displayName ||
      localStorage.getItem('coderkids_google_profile_name') ||
      ''
    ).trim();

    const userEmail = (
      googleUser?.email ||
      googleUser?.providerData?.find?.((p: any) => p?.email)?.email ||
      selectedProfile.contactEmail ||
      ''
    ).trim().toLowerCase();

    const isVerifiedFirebaseLogin = Boolean(
      (googleUser?.emailVerified || auth.currentUser?.emailVerified) && userEmail
    );
    if (isVerifiedFirebaseLogin) {
      setFirebaseUserEmail(userEmail);
    }

    const finalProfile: UserProfile = {
      ...selectedProfile,
      name:
        googleDisplayName && (!selectedProfile.name || selectedProfile.name.startsWith('นักเรียน ('))
          ? googleDisplayName
          : selectedProfile.name,
      nickname:
        googleDisplayName && (!selectedProfile.nickname || selectedProfile.nickname === selectedProfile.studentId)
          ? googleDisplayName.split(' ')[0]
          : selectedProfile.nickname,
      contactEmail: userEmail || selectedProfile.contactEmail,
    };

    setIsLoggedIn(true);
    try {
      localStorage.setItem('coderkids_is_logged_in', 'true');
      localStorage.setItem('coderkids_profile', JSON.stringify(finalProfile));
    } catch {}
    setProfile(finalProfile);
    setProfiles((prev) => {
      const filtered = prev.filter(
        (p) =>
          p.id !== finalProfile.id &&
          !(finalProfile.studentId && p.studentId === finalProfile.studentId) &&
          !(finalProfile.contactEmail && p.contactEmail?.toLowerCase() === finalProfile.contactEmail.toLowerCase())
      );
      return [finalProfile, ...filtered];
    });

    if (pendingDestinationModule) {
      setActiveTab(pendingDestinationModule);
      setPendingDestinationModule(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    googleLogout().catch(() => {});
    setFirebaseUserEmail('');
    setIsLoggedIn(false);
    localStorage.removeItem('coderkids_is_logged_in');
    localStorage.removeItem('coderkids_verified_google_email');
    setProfile(DEFAULT_PROFILES_LIST[0] || DEFAULT_PROFILE);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    localStorage.setItem('coderkids_points', points.toString());
    persistPointsIntegrity(points, transactions.length, claimedActivities.length);
  }, [points, transactions.length, claimedActivities.length]);

  useEffect(() => {
    localStorage.setItem('coderkids_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('coderkids_progress', JSON.stringify(moduleProgress));
  }, [moduleProgress]);

  useEffect(() => {
    localStorage.setItem('coderkids_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('coderkids_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('coderkids_liked_projects', JSON.stringify(likedProjectIds));
  }, [likedProjectIds]);

  useEffect(() => {
    localStorage.setItem('coderkids_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Points and Ledger Management (พร้อมระบบ Anti-Cheat ป้องกันการกดแต้มซ้ำ / ฟาร์มแต้ม / แก้ค่าคะแนน)
  const addPoints = (
    amount: number,
    reason: string = 'ผ่านภารกิจการเรียนรู้',
    category: 'safety' | 'thinking' | 'coding' | 'showcase' | 'classroom' = 'classroom',
    options?: PointAwardOptions
  ): boolean => {
    const now = Date.now();
    const todayKey = getThailandDateKey();
    if (dailyEarnedRef.current.dateKey !== todayKey) {
      dailyEarnedRef.current = loadDailyEarnedTracker(todayKey);
    }

    const isVerifiedTeacherSession = Boolean(isAdmin && viewRoleMode === 'teacher');
    const evaluation = evaluatePointAward({
      amount,
      reason,
      category,
      claimedActivities,
      recentAwardTimestamps: recentAwardTimestampsRef.current,
      lastActionTimestamps: lastActionTimestampsRef.current,
      dailyTracker: dailyEarnedRef.current,
      options: {
        ...options,
        isTeacher: options?.isTeacher ?? isVerifiedTeacherSession,
      },
      nowMs: now,
    });

    if (!evaluation.allowed) {
      console.warn(`[Anti-Cheat] ${evaluation.reasonCode}: ${evaluation.message || reason}`);
      return false;
    }

    const awardedAmount = evaluation.sanitizedAmount;
    const reasonKey = normalizeReasonKey(category, reason);
    lastActionTimestampsRef.current.set(reasonKey, now);
    recentAwardTimestampsRef.current = [
      ...recentAwardTimestampsRef.current.filter((ts) => now - ts < BURST_WINDOW_MS),
      now,
    ];
    if (evaluation.nextDailyTracker) {
      dailyEarnedRef.current = evaluation.nextDailyTracker;
      saveDailyEarnedTracker(evaluation.nextDailyTracker);
    }

    if (options?.uniqueKey) {
      setClaimedActivities((prev) =>
        prev.includes(options.uniqueKey!) ? prev : [...prev, options.uniqueKey!]
      );
    }

    const newTotal = points + awardedAmount;
    setPoints(newTotal);
    soundEffects.playSuccess();

    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      description: reason,
      amount: awardedAmount,
      type: 'earn',
      timestamp: 'เมื่อสักครู่',
      category,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Check Century Club Badge
    if (newTotal >= 100) {
      setBadges((prev) =>
        prev.map((b) => (b.id === 'badge_score_100' ? { ...b, unlocked: true } : b))
      );
    }

    // Check points milestone celebration: 100, 200, 300, 500
    const milestones = [100, 200, 300, 500];
    const reached = milestones.find((m) => points < m && newTotal >= m);
    if (reached) {
      setTimeout(() => {
        setCelebrationEvent({
          id: `celebrate_milestone_${reached}_${Date.now()}`,
          type: 'milestone_points',
          title: `⚡ ยอดเยี่ยมมาก! สะสมแต้มทะลุ ${reached} แต้มแล้ว!`,
          subtitle: `คุณทำกิจกรรมและพัฒนาทักษะวิทยาการคำนวณอย่างต่อเนื่อง สะสมแต้มไปแลกของรางวัลและฉายาพิเศษได้เลย`,
          pointsAwarded: 20,
          totalPoints: newTotal,
          badgeEmoji: '🪙',
          nextStepTitle: 'เปิดศูนย์แลกแต้มรางวัล 🎁',
          nextStepModule: 'rewards',
        });
      }, 500);
    }

    // 3. Real-time Notification Broadcast & Automatic Google Sheets Sync
    if (awardedAmount > 0) {
      const completedCountNow = Object.values(moduleProgress).filter(Boolean).length;
      const isModuleCompletionReason = reason.includes('สำเร็จการเรียนรู้โมดูล:');
      const eventPayload = {
        id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        studentId: profile.studentId || '10241',
        studentName: profile.name,
        grade: profile.grade || 'ป.4/1',
        school: profile.school || 'โรงเรียนอนุบาลนราธิวาส',
        avatarEmoji: profile.avatarEmoji || '🐱',
        eventType: isModuleCompletionReason ? 'module_complete' : 'mission_complete',
        title: isModuleCompletionReason ? `🎉 ${reason}` : `⚡ สำเร็จภารกิจ: ${reason}`,
        detail: `${profile.name} (${profile.grade || 'ป.4/1'}) ได้รับ +${awardedAmount} XP (สะสมรวม ${newTotal} XP • ผ่านแล้ว ${completedCountNow}/4 โมดูล)`,
        moduleOrCategory: category,
        pointsEarned: awardedAmount,
        totalPoints: newTotal,
        completedModulesText: `${completedCountNow}/4`,
        timestampThai: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        timestampMs: Date.now(),
        read: false,
        source: 'live_event',
      };

      try {
        window.dispatchEvent(new CustomEvent('coderkids:student-achievement', { detail: eventPayload }));
      } catch {}

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('coderkids_realtime_sync');
          bc.postMessage({ type: 'STUDENT_ACHIEVEMENT', payload: eventPayload });
          bc.close();
        }
      } catch {}

      // Background sync to Google Sheet (Logs & Students tabs) so Teacher's Dashboard sheet monitor detects it immediately
      if (localStorage.getItem('coderkids_sync_to_sheets') !== 'nosync' && !isModuleCompletionReason) {
        const activeEmail = auth.currentUser?.email || profile.contactEmail || '';
        recordStudentLoginToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          profile,
          activeEmail,
          `สำเร็จภารกิจ: ${reason} (+${awardedAmount} XP)`,
          category
        ).catch(() => {});
        saveProfileToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          profile,
          newTotal,
          completedCountNow,
          badges,
          activeEmail
        ).catch(() => {});
      }
    }

    return true;
  };

  const spendPoints = (amount: number, description: string, rewardId: string): boolean => {
    const check = validatePointSpend({
      currentPoints: points,
      amount,
      rewardId,
      unlockedRewardIds: profile.unlockedRewardIds || [],
    });
    if (!check.valid) {
      console.warn('[Anti-Cheat] ปฏิเสธการแลกแต้มที่ไม่ถูกต้อง:', { amount, rewardId });
      return false;
    }

    const sanitizedAmount = check.sanitizedAmount;
    setPoints((prev) => Math.max(0, prev - sanitizedAmount));
    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      description,
      amount: sanitizedAmount,
      type: 'spend',
      timestamp: 'เมื่อสักครู่',
      category: 'classroom',
    };
    setTransactions((prev) => [newTx, ...prev]);

    setProfile((prev) => ({
      ...prev,
      unlockedRewardIds: prev.unlockedRewardIds.includes(rewardId)
        ? prev.unlockedRewardIds
        : [...prev.unlockedRewardIds, rewardId],
    }));

    return true;
  };

  const markModuleComplete = (moduleKey: 'safety' | 'thinking' | 'codingLab' | 'showcase') => {
    setModuleProgress((prev) => {
      const isAlreadyDone = prev[moduleKey];
      const updated = { ...prev, [moduleKey]: true };
      const allDone = Object.values(updated).every(Boolean);

      // Unlock badges based on module completion
      setBadges((bList) =>
        bList.map((b) => {
          if (moduleKey === 'safety' && b.id === 'badge_pdpa') return { ...b, unlocked: true };
          if (moduleKey === 'thinking' && b.id === 'badge_logic') return { ...b, unlocked: true };
          if (moduleKey === 'codingLab' && (b.id === 'badge_scratch_star' || b.id === 'badge_microbit_hacker')) return { ...b, unlocked: true };
          if (moduleKey === 'showcase' && (b.id === 'badge_peer_champion' || b.id === 'badge_reflector')) return { ...b, unlocked: true };
          if (allDone && b.id === 'badge_all_rounder') return { ...b, unlocked: true };
          return b;
        })
      );

      // Trigger ConfettiCelebration particle animation whenever student completes a module or milestone
      if (!isAlreadyDone) {
        addPoints(
          50,
          `สำเร็จการเรียนรู้โมดูล: ${moduleKey}`,
          moduleKey === 'codingLab' ? 'coding' : moduleKey,
          { uniqueKey: `module_complete_${moduleKey}` }
        );

        const moduleMeta: Record<string, { title: string; subtitle: string; emoji: string; next?: string; nextTitle?: string }> = {
          safety: {
            title: '🎉 ผ่านโมดูล 1: ความปลอดภัยดิจิทัล & PDPA สำเร็จ!',
            subtitle: 'ยอดเยี่ยมมาก! คุณได้เรียนรู้การคุ้มครองข้อมูลส่วนบุคคล รหัสผ่าน และมารยาทไซเบอร์ พร้อมรับเกราะคุ้มกันดิจิทัล',
            emoji: '🛡️',
            next: 'thinking',
            nextTitle: 'ลุยโมดูล 2: การคิดเชิงคำนวณและอัลกอริทึม 🚀',
          },
          thinking: {
            title: '🎉 ผ่านโมดูล 2: การคิดเชิงคำนวณและอัลกอริทึม สำเร็จ!',
            subtitle: 'เก่งมาก! คุณเข้าใจ 4 เสาหลักการคิดเชิงคำนวณ ผังงาน และตรรกะแบบวนซ้ำ พร้อมนำไปเขียนโปรแกรมจริง',
            emoji: '🧩',
            next: 'codingLab',
            nextTitle: 'ลุยโมดูล 3: ปฏิบัติการ Scratch & Micro:bit 🚀',
          },
          codingLab: {
            title: '🎉 ผ่านโมดูล 3: ปฏิบัติการ Scratch & Micro:bit สำเร็จ!',
            subtitle: 'สุดยอดผลงาน! คุณสร้างโค้ดดิ้งบล็อกและจำลองการทำงานของฮาร์ดแวร์ Micro:bit ได้อย่างสมบูรณ์แบบ',
            emoji: '💻',
            next: 'showcase',
            nextTitle: 'ลุยโมดูล 4: แสดงผลงานและสะท้อนคิด 🚀',
          },
          showcase: {
            title: '🎉 ผ่านโมดูล 4: แสดงผลงานและสะท้อนคิด สำเร็จ!',
            subtitle: 'ยินดีด้วย! คุณได้แบ่งปันผลงาน ให้ข้อคิดเห็น 2 Stars & A Wish และบันทึกการเรียนรู้อย่างสร้างสรรค์',
            emoji: '🏆',
            next: 'dashboard',
            nextTitle: 'ดูแผนที่ความสำเร็จและเกียรติบัตร 🎓',
          },
        };

        const meta = moduleMeta[moduleKey];

        if (allDone) {
          setCelebrationEvent({
            id: `celebrate_all_${Date.now()}`,
            type: 'certificate_unlocked',
            title: '🎓 ยินดีด้วยอย่างยิ่ง! ผ่านครบทั้ง 4 โมดูลแล้ว!',
            subtitle: 'คุณสำเร็จหลักสูตรวิทยาการคำนวณและเทคโนโลยีครบทุกด่าน พร้อมขอรับเกียรติบัตรรับรองมาตรฐาน สพฐ. & สสวท.',
            pointsAwarded: 100,
            badgeEmoji: '👑',
            nextStepTitle: 'เปิดดูเกียรติบัตรอย่างเป็นทางการ 🎓',
            nextStepModule: 'certificate',
          });
        } else if (meta) {
          setCelebrationEvent({
            id: `celebrate_${moduleKey}_${Date.now()}`,
            type: 'module_complete',
            title: meta.title,
            subtitle: meta.subtitle,
            pointsAwarded: 50,
            badgeEmoji: meta.emoji,
            nextStepTitle: meta.nextTitle,
            nextStepModule: meta.next,
          });
        }

        // Sync completed module status immediately to Google Sheet (Students & Logs tabs)
        if (localStorage.getItem('coderkids_sync_to_sheets') !== 'nosync') {
          const newCompletedCount = Object.values(updated).filter(Boolean).length;
          const activeEmail = auth.currentUser?.email || profile.contactEmail || '';
          const moduleTitleLabel = meta ? meta.title.replace('🎉 ', '') : `ผ่านโมดูล ${moduleKey} สำเร็จ`;
          recordStudentLoginToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            profile,
            activeEmail,
            `${moduleTitleLabel} (+50 XP | สะสม ${newCompletedCount}/4 โมดูล)`,
            moduleKey
          ).catch(() => {});
          saveProfileToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            profile,
            points + 50,
            newCompletedCount,
            badges,
            activeEmail
          ).catch(() => {});
        }
      }

      return updated;
    });
  };

  const handleLikeProject = (projId: string) => {
    if (likedProjectIds.includes(projId)) {
      setLikedProjectIds((prev) => prev.filter((id) => id !== projId));
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, likes: Math.max(0, p.likes - 1) } : p))
      );
    } else {
      setLikedProjectIds((prev) => [...prev, projId]);
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, likes: p.likes + 1 } : p))
      );
      addPoints(5, 'กดถูกใจและให้กำลังใจผลงานเพื่อน', 'showcase', {
        uniqueKey: `like_project_${projId}`,
      });
    }
  };

  const handleAddProject = (newProject: ShowcaseProject) => {
    setProjects((prev) => [newProject, ...prev]);
    addPoints(30, `ส่งและนำเสนอโครงงาน: ${newProject.title}`, 'showcase', { maxPerDay: 2 });
    markModuleComplete('showcase');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    publishShowcaseProjectToFirestore({
      authorName: newProject.studentName || profile.name,
      authorAvatar: profile.avatarEmoji,
      grade: newProject.grade || profile.grade,
      category:
        newProject.tool === 'Micro:bit' ? 'Micro:bit' : 'Scratch',
      title: newProject.title,
      description: newProject.description,
    }).catch((err) => {
      console.warn('Firestore showcase sync skipped:', err);
    });
  };

  const handleUpdateProjectStage = (projectId: string, newStage: ProjectStage) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const nextHistory = { ...(p.stageHistory || {}) };
          if (!nextHistory[newStage]) {
            nextHistory[newStage] = {
              date: 'วันนี้',
              note: `ก้าวสู่ระยะ ${newStage === 'idea' ? 'ไอเดีย (Idea)' : newStage === 'draft' ? 'ร่างแบบ (Draft)' : newStage === 'review' ? 'รีวิว (Review)' : 'สมบูรณ์ (Final)'} สำเร็จ!`,
              milestonesDone: ['บรรลุเป้าหมายการพัฒนาระยะนี้'],
            };
          }
          return {
            ...p,
            stage: newStage,
            stageHistory: nextHistory,
          };
        }
        return p;
      })
    );
    if (newStage === 'final') {
      addPoints(25, 'พัฒนาโครงงานจนถึงขั้นสมบูรณ์ (Final Stage) 🏆', 'showcase', {
        uniqueKey: `project_final_${projectId}`,
      });
    }
  };

  const handleAddReview = (newReview: PeerReview) => {
    setReviews((prev) => [newReview, ...prev]);
    addPoints(15, 'ให้คำชม 2 Stars and a Wish แก่เพื่อน', 'showcase', {
      uniqueKey: `peer_review_${newReview.projectId}`,
    });
    markModuleComplete('showcase');
  };

  const handleSelectProjectForReview = (project: ShowcaseProject) => {
    setSelectedProjectForReview(project);
    setShowcaseSubTab('reviews');
    setActiveTab('showcase');
  };

  const handleSelectTitle = (title: string) => {
    setProfile((prev) => ({ ...prev, selectedTitle: title }));
  };

  // Teachers list loaded from Google Sheet Tab "Teachers"
  const [teachersList, setTeachersList] = useState<TeacherRecord[]>([]);
  const teachersListRef = useRef<TeacherRecord[]>([]);
  // เก็บเฉพาะอีเมลที่ผ่านการยืนยันตัวตน Firebase Auth จริง (ป้องกันปลอมสิทธิ์แอดมินผ่าน localStorage)
  const [firebaseUserEmail, setFirebaseUserEmail] = useState<string>(() => {
    return auth.currentUser?.emailVerified && auth.currentUser?.email
      ? auth.currentUser.email.trim().toLowerCase()
      : '';
  });

  // Refresh teachers list from Google Sheet Tab "Teachers"
  const refreshTeachersList = async () => {
    try {
      const list = await fetchTeachersFromGoogleSheet(TARGET_SPREADSHEET_ID);
      teachersListRef.current = list;
      setTeachersList(list);
      return list;
    } catch (e) {
      console.warn('Could not load teachers from Google Sheet:', e);
      return [];
    }
  };

  useEffect(() => {
    // 0. ทดสอบการเชื่อมต่อ Firestore Server ตั้งแต่เปิดแอป
    testConnection().catch(() => {});

    // 1. ดึงข้อมูลสมาชิกอัตโนมัติทุกครั้งที่โหลดแอป จาก Google Sheet (แท็บ Students ID: 1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng)
    fetchStudentsFromGoogleSheet(TARGET_SPREADSHEET_ID)
      .then(({ students }) => {
        if (students && students.length > 0) {
          console.log(`[Google Sheets] ดึงข้อมูลสมาชิกอัตโนมัติเรียบร้อย: ${students.length} รายการ`);
          setProfiles((prev) => {
            const adminProfiles = prev.filter((p) => p.role === 'admin' || p.id.startsWith('admin_'));
            return [...adminProfiles, ...students];
          });

          // อัปเดตโปรไฟล์ปัจจุบันถ้าเป็นผู้เรียน
          setProfile((curr) => {
            if (curr.role !== 'admin') {
              const matched = students.find(
                (s) => s.studentId === curr.studentId || s.name === curr.name || s.id === curr.id
              );
              return matched || curr;
            }
            return curr;
          });
        }
      })
      .catch((err) => {
        console.warn('Auto-fetch students on load error:', err);
      });

    // 2. ดึงข้อมูลครูและตรวจสอบสิทธิ์แอดมินจากแท็บ Teachers (ใช้เฉพาะบัญชี Firebase Auth ที่ยืนยันอีเมลแล้วเท่านั้น)
    refreshTeachersList().then((list) => {
      const currentEmail =
        auth.currentUser?.emailVerified && auth.currentUser?.email
          ? auth.currentUser.email.trim().toLowerCase()
          : '';
      if (currentEmail) {
        const check = checkIsTeacherAdmin(currentEmail, list);
        if (check.isAdmin) {
          const googleName = (
            auth.currentUser?.displayName ||
            check.matchedTeacher?.name ||
            ''
          ).trim();
          const adminProf = getAdminProfileData(currentEmail, googleName || undefined);
          setProfile(adminProf);
          setProfiles((prev) => {
            const exists = prev.some((p) => p.id === adminProf.id);
            return exists ? prev : [adminProf, ...prev];
          });
        } else {
          setProfile((prev) => (prev.role === 'admin' ? { ...prev, role: 'student' } : prev));
        }
      } else {
        // หากยังไม่ได้ยืนยันตัวตนผ่าน Firebase Auth ห้ามค้างสถานะ admin จาก localStorage
        setProfile((prev) => (prev.role === 'admin' ? { ...prev, role: 'student' } : prev));
      }
    });

    // 3. ติดตามสถานะ Firebase Auth และอัปเดตชื่อโปรไฟล์จาก Google Account จริง
    const unsub = initAuth(
      (user) => {
        const userEmail = (
          user?.email ||
          user?.providerData?.find((p) => p?.email)?.email ||
          ''
        ).trim().toLowerCase();

        if (userEmail && user?.emailVerified) {
          setFirebaseUserEmail(userEmail);
          setIsLoggedIn(true);
          try {
            localStorage.setItem('coderkids_is_logged_in', 'true');
          } catch {}

          const googleName = (
            user.displayName ||
            user.providerData?.find((p) => p?.displayName)?.displayName ||
            localStorage.getItem('coderkids_google_profile_name') ||
            ''
          ).trim();
          const emailPrefix = userEmail.split('@')[0];

          const check = checkIsTeacherAdmin(userEmail, teachersListRef.current);
          if (check.isAdmin) {
            // แสดงโปรไฟล์ของแอดมินพร้อมชื่อจริงจาก Google หรือแท็บ Teachers
            const adminProf = getAdminProfileData(
              userEmail,
              googleName || check.matchedTeacher?.name || undefined
            );
            setProfile(adminProf);
            setProfiles((prev) => {
              const exists = prev.some((p) => p.id === adminProf.id);
              return exists ? prev.map((p) => (p.id === adminProf.id ? adminProf : p)) : [adminProf, ...prev];
            });
          } else {
            setProfile((prev) => {
              const shouldReplaceName =
                Boolean(googleName) &&
                (!prev.name ||
                  prev.name.startsWith('นักเรียน (') ||
                  prev.name === emailPrefix ||
                  prev.id === 'prof_1' ||
                  prev.id === 'guest_learner');
              const updatedName = shouldReplaceName ? googleName : prev.name || emailPrefix;
              const updatedNickname =
                shouldReplaceName && googleName ? googleName.split(' ')[0] : prev.nickname || emailPrefix;
              return {
                ...prev,
                id: prev.id === 'prof_1' || prev.id === 'guest_learner' ? `student_${emailPrefix}` : prev.id,
                studentId:
                  prev.id === 'prof_1' || prev.id === 'guest_learner'
                    ? emailPrefix
                    : prev.studentId || emailPrefix,
                name: updatedName,
                nickname: updatedNickname,
                contactEmail: userEmail,
                role: 'student',
              };
            });
          }
        }
      },
      () => {
        // When Firebase Auth has no signed-in user, strictly clear verified email so no localStorage spoofing works
        setFirebaseUserEmail('');
      }
    );
    return () => unsub();
  }, []);

  const completedCount = Object.values(moduleProgress).filter(Boolean).length;
  // ผู้ใช้ต้องยืนยันตัวตนผ่านระบบ Firebase Auth (emailVerified === true) และมีอีเมลในแท็บ Teachers เท่านั้น
  const verifiedUserEmail =
    isLoggedIn && (auth.currentUser?.emailVerified && auth.currentUser?.email ? auth.currentUser.email : firebaseUserEmail)
      ? (auth.currentUser?.emailVerified && auth.currentUser?.email ? auth.currentUser.email : firebaseUserEmail)
          .trim()
          .toLowerCase()
      : '';
  const teacherCheck = checkIsTeacherAdmin(verifiedUserEmail, teachersList);
  const isTeacherAuthorized = Boolean(isLoggedIn && verifiedUserEmail && teacherCheck.isAdmin);
  const isAdmin = Boolean(isLoggedIn && isTeacherAuthorized && profile.role !== 'student');

  useEffect(() => {
    try {
      localStorage.setItem('coderkids_view_role_mode', viewRoleMode);
    } catch {}
  }, [viewRoleMode]);

  useEffect(() => {
    if (isTeacherAuthorized) {
      setViewRoleMode('teacher');
    } else {
      setViewRoleMode('student');
    }
  }, [isTeacherAuthorized]);

  const handleChangeViewRoleMode = (mode: 'student' | 'teacher') => {
    if (!isTeacherAuthorized) {
      setViewRoleMode('student');
      return;
    }
    setViewRoleMode(mode);
  };

  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser?.emailVerified) return;
    const timer = window.setTimeout(() => {
      syncUserProfileToFirestore(profile, points, completedCount).catch((err) => {
        console.warn('Firestore profile sync skipped:', err);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [
    isLoggedIn,
    firebaseUserEmail,
    profile.id,
    profile.name,
    profile.nickname,
    profile.avatarEmoji,
    profile.grade,
    profile.school,
    profile.selectedTitle,
    points,
    completedCount,
  ]);

  const handleToggleAdmin = (newAdminState: boolean) => {
    const currentEmail = verifiedUserEmail;
    const check = checkIsTeacherAdmin(currentEmail, teachersList);

    // Enforcement: ต้องยืนยันตัวตนผ่านระบบ Google และมีอีเมลในแท็บ Teachers เท่านั้น
    if (newAdminState && (!currentEmail || !check.isAdmin)) {
      setCelebrationEvent({
        id: `perm_admin_${Date.now()}`,
        type: 'custom',
        title: '🔒 ปฏิเสธการเปลี่ยนสถานะ',
        subtitle: 'ต้องยืนยันตัวตนผ่านระบบของ Google และมีรายชื่ออีเมลในแท็บ Teachers บน Google Sheet เท่านั้น',
        badgeEmoji: '🔒',
      });
      return;
    }

    if (newAdminState) {
      // สลับสู่โหมดแอดมิน -> แสดงโปรไฟล์แอดมิน
      const adminProf = getAdminProfileData(currentEmail, check.matchedTeacher?.name);
      setProfile(adminProf);
      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === adminProf.id);
        return exists ? prev : [adminProf, ...prev];
      });
    } else {
      // สลับสู่มุมมองผู้เรียน -> สลับไปที่โปรไฟล์ผู้เรียน
      const studentProf = profiles.find((p) => p.role !== 'admin' && !p.id.startsWith('admin_')) || profiles[0];
      if (studentProf) {
        setProfile({ ...studentProf, role: 'student' });
      } else {
        setProfile((prev) => ({ ...prev, role: 'student' }));
      }
    }
  };

  const handleSyncStudentsFromSheet = (sheetStudents: UserProfile[]) => {
    if (sheetStudents && sheetStudents.length > 0) {
      setProfiles((prev) => {
        const existingIds = new Set(sheetStudents.map((s) => s.studentId || s.id));
        const kept = prev.filter((p) => !existingIds.has(p.studentId || p.id));
        const merged = [...sheetStudents, ...kept];
        try {
          localStorage.setItem('coderkids_profiles', JSON.stringify(merged));
        } catch (e) {
          console.warn('Save profiles error:', e);
        }
        return merged;
      });
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
      {/* 3-Zone Header Contract with Profile & Points */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenCertificate={() => setIsCertificateModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        completedPoints={points}
        profile={profile}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isTeacherAuthorized={isTeacherAuthorized}
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
        onOpenAITutor={() => setIsAITutorOpen(true)}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onSelectThemeMode={handleSelectThemeMode}
        onPreviewTransition={handlePreviewTransition}
        colorTone={colorTone}
        onChangeColorTone={handleSetColorTone}
        onOpenGasExport={() => setIsGasExportModalOpen(true)}
        onOpenAssessmentReport={() => setIsAssessmentReportOpen(true)}
        onOpenUnpluggedWorksheets={() => setIsUnpluggedWorksheetsOpen(true)}
        onOpenBugHunter={() => setIsBugHunterOpen(true)}
        onOpenExamArena={() => setIsExamArenaOpen(true)}
        onOpenDigitalPassport={() => setIsDigitalPassportOpen(true)}
        onOpenTeacherPlans={() => setIsTeacherPlansOpen(true)}
        onOpenRubricModal={() => setIsRubricModalOpen(true)}
        onOpenParentTeacherKit={() => setIsParentTeacherKitOpen(true)}
        onOpenClassroomBattle={() => setIsClassroomBattleOpen(true)}
        onOpenOnetBattle={() => setIsOnetBattleOpen(true)}
        onOpenCodeTyper={() => setIsCodeTyperOpen(true)}
        onOpenPairArena={() => setIsPairArenaOpen(true)}
        onOpenStemPacks={() => setIsStemPacksOpen(true)}
        onOpenTeacherMastery={() => setIsTeacherMasteryOpen(true)}
        onOpenClassroomStats={() => setIsClassroomStatsOpen(true)}
        onOpenHeroCards={() => setIsHeroCardsOpen(true)}
        onOpenSmartExam={() => setIsSmartExamOpen(true)}
        onOpenCodeTracer={() => setIsCodeTracerOpen(true)}
        onOpenStudentQRPass={() => setIsStudentQRPassOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
        onOpenMazeRunner={() => setIsMazeRunnerOpen(true)}
        onOpenHomeworkDropzone={() => setIsHomeworkDropzoneOpen(true)}
        onOpenAvatarShop={() => setIsAvatarShopOpen(true)}
        isProjectorMode={isProjectorMode}
        onToggleProjectorMode={() => setIsProjectorMode((prev) => !prev)}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        viewRoleMode={viewRoleMode}
        onChangeViewRoleMode={handleChangeViewRoleMode}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 ${isFocusMode ? 'pt-2 max-w-5xl' : 'pt-6 sm:pt-8'}`}>
        <Suspense fallback={<ModuleLoadingFallback />}>
        {/* Breadcrumb / Back button when navigating away from dashboard */}
        {activeTab !== 'dashboard' && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับสู่หน้าหลัก Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareableLessonLink}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border shadow-sm transition-colors cursor-pointer ${
                  copiedLessonLink
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700'
                }`}
                title="คัดลอกลิงก์ตรงไปยังบทเรียนหน้านี้เพื่อส่งให้เพื่อนหรือครู"
              >
                {copiedLessonLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>คัดลอกลิงก์บทเรียนแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>แชร์ลิงก์บทเรียนนี้</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'learningMap' && 'แผนที่การผจญภัยการเรียนรู้ 4 ดินแดน (Learning Path Map)'}
              {activeTab === 'safety' && 'โมดูลที่ 1: ความปลอดภัย & มารยาทดิจิทัล'}
              {activeTab === 'thinking' && 'โมดูลที่ 2: การคิดเป็นลำดับขั้น & อัลกอริทึม'}
              {activeTab === 'codingLab' && 'โมดูลที่ 3: ปฏิบัติการ Scratch & Micro:bit'}
              {activeTab === 'showcase' && 'โมดูลที่ 4: นำเสนอผลงาน & สะท้อนคิด'}
              {activeTab === 'teamBattle' && '⚔️ สนามประลองสด 4 ทีมในห้องเรียน (Team Battle Arena)'}
              {activeTab === 'classroom' && 'ห้องเรียนเสมือนจริง (Virtual Classroom)'}
              {activeTab === 'rewards' && 'ศูนย์สะสมแต้ม & ร้านค้าแลกรางวัล'}
              {activeTab === 'didYouKnow' && 'เรื่องน่ารู้ชวนคิด 4 หัวข้อ (Did You Know?)'}
              {activeTab === 'profileManage' && 'ระบบจัดการโปรไฟล์ & บันทึกลง Google Sheets'}
              {activeTab === 'juniorPlayground' && 'ห้องทดลองเขียนโค้ด Junior Code Playground (Python & JS)'}
              {activeTab === 'kidsAILab' && 'ห้องปฏิบัติการเทรนปัญญาประดิษฐ์ Kids AI & Machine Learning Lab'}
              {activeTab === 'buddySystem' && '👥 ระบบคู่หูเรียนรู้ & แผงควบคุมส่งอิโมจิให้กำลังใจ (Buddy System)'}
              {activeTab === 'stemProjects' && '🚀 คลังโครงงาน STEM / STEAM Project Hub & Project Canvas A4'}
              {activeTab === 'binaryLab' && '👾 ห้องแล็บเลขฐานสอง Binary Pixel Art 8×8 & รหัสลับสายลับ ASCII'}
              {activeTab === 'aiPromptLab' && '🤖 ห้องทดลองปัญญาประดิษฐ์ Kids AI & Safe Prompting Lab'}
              {activeTab === 'microbitDataLogger' && '📈 บันทึกข้อมูลและพล็อตกราฟวิทยาศาสตร์ Micro:bit IoT Data Logger'}
              {activeTab === 'pdpaConsent' && '📜 เครื่องมือสร้างหนังสือยินยอม PDPA & นโยบายความเป็นส่วนตัวสำหรับโครงงานดิจิทัล'}
            </div>
          </div>
        )}

        {/* ----------------- VIEW 0: MAIN DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenCertificate={() => setIsCertificateModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            profile={profile}
            profiles={profiles}
            moduleProgress={moduleProgress}
            points={points}
            transactions={transactions}
            isLoggedIn={isLoggedIn}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            todayGoal={todayGoal}
            onToggleTodayGoal={handleToggleTodayGoal}
            onSetTodayGoal={handleSetTodayGoal}
            isAdmin={isAdmin}
            onCelebrate={handleTriggerManualCelebration}
            onOpenAITutor={() => setIsAITutorOpen(true)}
            onOpenGasExport={() => setIsGasExportModalOpen(true)}
            onOpenAssessmentReport={() => setIsAssessmentReportOpen(true)}
            onOpenUnpluggedWorksheets={() => setIsUnpluggedWorksheetsOpen(true)}
            onOpenBugHunter={() => setIsBugHunterOpen(true)}
            onOpenExamArena={() => setIsExamArenaOpen(true)}
            onOpenDigitalPassport={() => setIsDigitalPassportOpen(true)}
            onOpenTeacherPlans={() => setIsTeacherPlansOpen(true)}
            onOpenRubricModal={() => setIsRubricModalOpen(true)}
            onOpenParentTeacherKit={() => setIsParentTeacherKitOpen(true)}
            onOpenClassroomBattle={() => setIsClassroomBattleOpen(true)}
            onOpenOnetBattle={() => setIsOnetBattleOpen(true)}
            onOpenCodeTyper={() => setIsCodeTyperOpen(true)}
            onOpenPairArena={() => setIsPairArenaOpen(true)}
            onOpenStemPacks={() => setIsStemPacksOpen(true)}
            onOpenTeacherMastery={() => setIsTeacherMasteryOpen(true)}
            onOpenClassroomStats={() => setIsClassroomStatsOpen(true)}
            onOpenHeroCards={() => setIsHeroCardsOpen(true)}
            onOpenSmartExam={() => setIsSmartExamOpen(true)}
            onOpenCodeTracer={() => setIsCodeTracerOpen(true)}
            onOpenStudentQRPass={() => setIsStudentQRPassOpen(true)}
            addPoints={addPoints}
            isTeacherAuthorized={isTeacherAuthorized}
            viewRoleMode={viewRoleMode}
            onChangeViewRoleMode={handleChangeViewRoleMode}
          />
        )}

        {/* ----------------- VIEW: LEARNING PATH MAP (STEP-BY-STEP ROADMAP) ----------------- */}
        {activeTab === 'learningMap' && (
          <LearningPathMap
            moduleProgress={moduleProgress}
            points={points}
            profile={profile}
            onNavigate={handleNavigate}
            onOpenCertificate={() => setIsCertificateModalOpen(true)}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {/* ----------------- VIEW: PROFILE MANAGEMENT & GOOGLE SHEETS ----------------- */}
        {activeTab === 'profileManage' && (
          <ProfileManagementView
            profile={profile}
            profiles={profiles}
            isLoggedIn={isLoggedIn}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onUpdateProfile={handleUpdateProfile}
            onAddProfile={handleAddProfile}
            onDeleteProfile={handleDeleteProfile}
            onSelectProfile={handleSelectProfile}
            points={points}
            completedModulesCount={completedCount}
            badges={badges}
            isAdmin={isAdmin}
            onToggleAdmin={handleToggleAdmin}
            teachersList={teachersList}
            onRefreshTeachers={refreshTeachersList}
            onSyncStudentsFromSheet={handleSyncStudentsFromSheet}
            onOpenGasExport={() => setIsGasExportModalOpen(true)}
          />
        )}

        {/* ----------------- VIEW: VIRTUAL CLASSROOM ----------------- */}
        {activeTab === 'classroom' && (
          <VirtualClassroom
            onNavigateModule={(mod) => handleNavigate(mod)}
            addPoints={addPoints}
            studentName={profile.name}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            isAdmin={isAdmin && viewRoleMode === 'teacher'}
          />
        )}

        {/* ----------------- VIEW: BUDDY SYSTEM (CO-LEARNING & CHEERING) ----------------- */}
        {activeTab === 'buddySystem' && (
          <BuddySystem
            profile={profile}
            addPoints={addPoints}
            onNavigateModule={handleNavigate}
          />
        )}

        {/* ----------------- VIEW: REWARDS & POINTS CENTER ----------------- */}
        {activeTab === 'rewards' && (
          <PointsRewardCenter
            points={points}
            transactions={transactions}
            profile={profile}
            onSpendPoints={spendPoints}
            onSelectTitle={handleSelectTitle}
          />
        )}

        {/* ----------------- VIEW: DID YOU KNOW BITE-SIZED FACTS ----------------- */}
        {activeTab === 'didYouKnow' && (
          <DidYouKnowSection addPoints={addPoints} />
        )}

        {/* ----------------- VIEW: LEADERBOARD (HALL OF FAME) ----------------- */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            currentUserPoints={points}
            completedModulesCount={completedCount}
            onOpenCertificate={() => setIsCertificateModalOpen(true)}
            isAdmin={isAdmin}
            profile={profile}
            profiles={profiles}
            onNavigate={handleNavigate}
            onToggleAdmin={handleToggleAdmin}
            onEnrollClassroom={(code) => {
              const updated = { ...profile, enrolledClassroomCode: code };
              handleUpdateProfile(updated);
            }}
          />
        )}

        {/* ----------------- VIEW 1: DIGITAL SAFETY, SEARCH & PDPA ----------------- */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-2xl max-w-5xl">
              <button
                onClick={() => setSafetySubTab('pdpaLab')}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  safetySubTab === 'pdpaLab' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛡️ 1. จำลองสถานการณ์ PDPA Lab</span>
              </button>
              <button
                onClick={() => setSafetySubTab('pdpa')}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  safetySubTab === 'pdpa' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. เกมจำแนกข้อมูล
              </button>
              <button
                onClick={() => setSafetySubTab('password')}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  safetySubTab === 'password' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. แล็บรหัสผ่าน
              </button>
              <button
                onClick={() => setSafetySubTab('netiquette')}
                className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  safetySubTab === 'netiquette' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4. มารยาทดิจิทัล
              </button>
              <button
                onClick={() => setSafetySubTab('searchLab')}
                className={`flex-1 min-w-[160px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  safetySubTab === 'searchLab'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔍 5. ค้นหาข้อมูลขั้นสูง (ป.6/3)</span>
              </button>
              <button
                onClick={() => setSafetySubTab('quiz')}
                className={`flex-1 min-w-[100px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  safetySubTab === 'quiz' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6. แบบทดสอบ
              </button>
              <button
                onClick={() => setSafetySubTab('pdpaGenerator')}
                className={`flex-1 min-w-[170px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  safetySubTab === 'pdpaGenerator'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📜 7. สร้างหนังสือยินยอม PDPA</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  PDF
                </span>
              </button>
            </div>

            {safetySubTab === 'pdpaLab' && (
              <PDPALab
                addPoints={(pts, reason) => addPoints(pts, reason || 'ตัดสินใจสถานการณ์ PDPA Lab ถูกต้อง', 'safety')}
                onComplete={() => markModuleComplete('safety')}
              />
            )}
            {safetySubTab === 'pdpa' && (
              <SafeSharingGame
                onComplete={() => markModuleComplete('safety')}
                addPoints={(pts) => addPoints(pts, 'จำแนกข้อมูล PDPA สำเร็จ', 'safety')}
              />
            )}
            {safetySubTab === 'password' && (
              <PasswordLab addPoints={(pts) => addPoints(pts, 'ทดสอบสร้างรหัสผ่านปลอดภัย', 'safety')} />
            )}
            {safetySubTab === 'netiquette' && (
              <NetiquetteScenarios addPoints={(pts) => addPoints(pts, 'ตอบสถานการณ์มารยาทดิจิทัลถูกต้อง', 'safety')} />
            )}
            {safetySubTab === 'searchLab' && (
              <InternetSearchLab
                onComplete={() => markModuleComplete('safety')}
                addPoints={(pts, reason) => addPoints(pts, reason || 'ฝึกสืบค้นและประเมินข้อมูล ป.6/3 สำเร็จ', 'safety')}
              />
            )}
            {safetySubTab === 'quiz' && (
              <SafetyQuiz
                onComplete={() => markModuleComplete('safety')}
                addPoints={(pts) => addPoints(pts, 'ทำแบบทดสอบความปลอดภัยดิจิทัลผ่าน', 'safety')}
              />
            )}
            {safetySubTab === 'pdpaGenerator' && (
              <PDPAPrivacyGenerator
                currentProfile={profile}
                addPoints={(pts, reason) => addPoints(pts, reason || 'สร้างหนังสือยินยอม PDPA สำเร็จ', 'safety')}
                onBackToLab={() => setSafetySubTab('pdpaLab')}
              />
            )}
          </div>
        )}

        {/* ----------------- VIEW 2: COMPUTATIONAL THINKING & FLOWCHART ----------------- */}
        {activeTab === 'thinking' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-5xl">
              <button
                onClick={() => setThinkingSubTab('pillars')}
                className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  thinkingSubTab === 'pillars' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. 4 เสาหลักการคิด
              </button>
              <button
                onClick={() => setThinkingSubTab('flowchart')}
                className={`flex-1 min-w-[160px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  thinkingSubTab === 'flowchart' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>2. ผังงาน Flowchart</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  ป.4–ป.6
                </span>
              </button>
              <button
                onClick={() => setThinkingSubTab('controls')}
                className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  thinkingSubTab === 'controls' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. โครงสร้างควบคุม 3 แบบ
              </button>
              <button
                onClick={() => setThinkingSubTab('puzzle')}
                className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  thinkingSubTab === 'puzzle' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4. เกมเขาวงกต (5 ด่าน)
              </button>
              <button
                onClick={() => setThinkingSubTab('logicLab')}
                className={`flex-1 min-w-[170px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  thinkingSubTab === 'logicLab' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🧠 5. ตรรกะ · OX/Sudoku · สตอรีบอร์ด
              </button>
            </div>

            {thinkingSubTab === 'pillars' && (
              <PillarsView
                onOpenFlowchart={() => setThinkingSubTab('flowchart')}
                onOpenControlStructures={() => setThinkingSubTab('controls')}
              />
            )}
            {thinkingSubTab === 'flowchart' && (
              <FlowchartGuideView
                addPoints={(pts) => addPoints(pts, 'ทำแบบฝึกหัดผังงาน Flowchart ป.4-ป.6 ผ่าน', 'thinking')}
                onOpenPythonLab={(code, title) => {
                  setPythonHandoff({ code, title, key: Date.now() });
                  setActiveTab('juniorPlayground');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {thinkingSubTab === 'controls' && <ControlStructuresView />}
            {thinkingSubTab === 'puzzle' && (
              <AlgorithmPuzzleGame
                onComplete={() => markModuleComplete('thinking')}
                addPoints={(pts) => addPoints(pts, 'พิชิตด่านหุ่นยนต์แก้ปัญหาเขาวงกต', 'thinking')}
              />
            )}
            {thinkingSubTab === 'logicLab' && (
              <LogicAndStoryboardLab
                onComplete={() => markModuleComplete('thinking')}
                addPoints={(pts, reason) => addPoints(pts, reason || 'ฝึกตรรกะ Binary Search และ Storyboard สำเร็จ', 'thinking')}
              />
            )}
          </div>
        )}

        {/* ----------------- VIEW 3: HANDS-ON CODING LAB ----------------- */}
        {activeTab === 'codingLab' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-5xl">
              <button
                onClick={() => setCodingSubTab('scratch')}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  codingSubTab === 'scratch' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🐱 1. Scratch Visual Studio
              </button>
              <button
                onClick={() => setCodingSubTab('microbit')}
                className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  codingSubTab === 'microbit' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📟 2. Micro:bit V2 Simulator
              </button>
              <button
                onClick={() => setCodingSubTab('musicLab')}
                className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  codingSubTab === 'musicLab' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎵 3. Micro:bit Music Lab</span>
                <span className="px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 text-[10px] font-bold">
                  Synth
                </span>
              </button>
              <button
                onClick={() => setCodingSubTab('examplesGallery')}
                className={`flex-1 min-w-[160px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  codingSubTab === 'examplesGallery' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📚 4. คลังโจทย์ตัวอย่างโค้ด</span>
              </button>
              <button
                onClick={() => setCodingSubTab('debugLab')}
                className={`flex-1 min-w-[170px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  codingSubTab === 'debugLab' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🐞 5. ห้องจับผิด &amp; แก้บั๊กโค้ด</span>
              </button>
            </div>

            {codingSubTab === 'scratch' && (
              <ScratchStudio
                onComplete={() => markModuleComplete('codingLab')}
                addPoints={(pts) => addPoints(pts, 'รันสคริปต์บล็อก Scratch สำเร็จ', 'coding')}
                onOpenPythonLab={(code, title) => {
                  setPythonHandoff({ code, title, key: Date.now() });
                  setActiveTab('juniorPlayground');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {codingSubTab === 'microbit' && (
              <MicrobitSimulator
                onComplete={() => markModuleComplete('codingLab')}
                addPoints={(pts) => addPoints(pts, 'ทดลองเล่นบอร์ด Micro:bit V2 และเซ็นเซอร์', 'coding')}
                onOpenMusicLab={() => setCodingSubTab('musicLab')}
                onOpenPythonLab={(code, title) => {
                  setPythonHandoff({ code, title, key: Date.now() });
                  setActiveTab('juniorPlayground');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {codingSubTab === 'musicLab' && (
              <MicrobitMusicLab
                onBack={() => setCodingSubTab('microbit')}
                addPoints={addPoints}
                onNavigateCodingLab={() => setCodingSubTab('microbit')}
              />
            )}
            {codingSubTab === 'examplesGallery' && (
              <CodeExamplesGallery
                onNavigateToSimulator={(platform) => {
                  if (platform === 'scratch') {
                    setCodingSubTab('scratch');
                  } else {
                    setCodingSubTab('microbit');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                addPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
              />
            )}
            {codingSubTab === 'debugLab' && (
              <CodeDebuggingLab
                onComplete={() => markModuleComplete('codingLab')}
                addPoints={(pts, reason) => addPoints(pts, reason || 'แก้บั๊กโค้ดของผู้อื่นสำเร็จ', 'coding')}
              />
            )}
          </div>
        )}

        {/* ----------------- VIEW 4: SHOWCASE, DATA PROCESSING & REFLECTION ----------------- */}
        {activeTab === 'showcase' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-5xl">
              <button
                onClick={() => setShowcaseSubTab('gallery')}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  showcaseSubTab === 'gallery' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. คลังแสดงผลงาน ({projects.length})
              </button>
              <button
                onClick={() => setShowcaseSubTab('reviews')}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  showcaseSubTab === 'reviews' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. กำแพง 2 Stars &amp; Wish
              </button>
              <button
                onClick={() => setShowcaseSubTab('reflection')}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  showcaseSubTab === 'reflection' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. สมุดสะท้อนคิด 3-2-1
              </button>
              <button
                onClick={() => setShowcaseSubTab('dailyJournal')}
                className={`flex-1 min-w-[150px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  showcaseSubTab === 'dailyJournal' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔥 4. บันทึกประจำวัน (Streak {profile.streakDays || 4} วัน)</span>
              </button>
              <button
                onClick={() => setShowcaseSubTab('dataLab')}
                className={`flex-1 min-w-[175px] py-2 px-3 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  showcaseSubTab === 'dataLab' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📊 5. จัดการข้อมูล &amp; Blog (ป.4/4, ป.5/4)</span>
              </button>
            </div>

            {showcaseSubTab === 'gallery' && (
              <ShowcaseGallery
                projects={projects}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                onSelectProjectForReview={handleSelectProjectForReview}
                onLikeProject={handleLikeProject}
                likedProjectIds={likedProjectIds}
                onUpdateProjectStage={handleUpdateProjectStage}
              />
            )}

            {showcaseSubTab === 'reviews' && (
              <PeerReviewWall
                projects={projects}
                selectedProject={selectedProjectForReview}
                onClearSelectedProject={() => setSelectedProjectForReview(null)}
                reviews={reviews}
                onAddReview={handleAddReview}
                addPoints={(pts) => addPoints(pts, 'ให้ข้อเสนอแนะเพื่อน (2 Stars & Wish)', 'showcase')}
              />
            )}

            {showcaseSubTab === 'reflection' && (
              <ReflectionJournal
                onComplete={() => markModuleComplete('showcase')}
                addPoints={(pts) => addPoints(pts, 'บันทึกสะท้อนคิด 3-2-1 และประเมินรูบริก', 'showcase')}
                onOpenCertificate={() => setIsCertificateModalOpen(true)}
              />
            )}

            {showcaseSubTab === 'dailyJournal' && (
              <DailyJournal
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                addPoints={addPoints}
                onNavigateModule={handleNavigate}
                todayGoal={todayGoal}
                onSetTodayGoal={handleSetTodayGoal}
                onToggleTodayGoal={handleToggleTodayGoal}
              />
            )}

            {showcaseSubTab === 'dataLab' && (
              <DataProcessingLab
                onComplete={() => markModuleComplete('showcase')}
                addPoints={(pts, reason) => addPoints(pts, reason || 'ประมวลผลและนำเสนอข้อมูล ป.4/4–ป.5/4 สำเร็จ', 'showcase')}
              />
            )}
          </div>
        )}

        {/* ----------------- VIEW: JUNIOR TEXT-BASED CODE PLAYGROUND ----------------- */}
        {activeTab === 'juniorPlayground' && (
          <JuniorCodePlayground
            initialCode={pythonHandoff?.code}
            initialTitle={pythonHandoff?.title}
            initialCodeKey={pythonHandoff?.key}
            onAwardPoints={(pts) => {
              addPoints(pts, 'เขียนและรันโค้ด Python / JS ใน Junior Playground', 'coding');
              setBadges((prev) =>
                prev.map((b) => (b.id === 'badge_junior_coder' ? { ...b, unlocked: true } : b))
              );
            }}
          />
        )}

        {/* ----------------- VIEW: KIDS AI & MACHINE LEARNING LAB ----------------- */}
        {activeTab === 'kidsAILab' && (
          <KidsAILab
            onAwardPoints={(pts) => {
              addPoints(pts, 'ฝึกสอนโมเดล AI แยกขยะอัจฉริยะใน Kids AI Lab', 'thinking');
              setBadges((prev) =>
                prev.map((b) => (b.id === 'badge_ai_trainer' ? { ...b, unlocked: true } : b))
              );
            }}
          />
        )}

        {/* ----------------- VIEW: LIVE 4-TEAM CLASSROOM BATTLE ARENA ----------------- */}
        {activeTab === 'teamBattle' && (
          <TeamBattleArena
            onBack={() => setActiveTab('dashboard')}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            onAwardPoints={(pts, reason, opts) => {
              addPoints(pts, reason, 'thinking', opts);
              soundEffects.playFanfare();
            }}
          />
        )}

        {/* ----------------- VIEW: DIGITAL LIBRARY (E-BOOKS & MICRO:BIT MANUALS) ----------------- */}
        {activeTab === 'digitalLibrary' && (
          <DigitalLibrary
            profile={profile}
            addPoints={addPoints}
            onNavigateModule={handleNavigate}
          />
        )}

        {/* ----------------- VIEW: STEM PROJECT HUB & PROJECT CANVAS ----------------- */}
        {activeTab === 'stemProjects' && (
          <StemProjectHub
            onBack={() => setActiveTab('dashboard')}
            onNavigate={handleNavigate}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {/* ----------------- VIEW: BINARY PIXEL ART & SECRET CIPHER LAB ----------------- */}
        {activeTab === 'binaryLab' && (
          <BinaryPixelArtLab
            onBack={() => setActiveTab('dashboard')}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {/* ----------------- VIEW: KIDS AI & SAFE PROMPTING LAB ----------------- */}
        {activeTab === 'aiPromptLab' && (
          <AiPromptLab
            onBack={() => setActiveTab('dashboard')}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {/* ----------------- VIEW: MICRO:BIT IOT DATA LOGGER & SCIENCE CHART ----------------- */}
        {activeTab === 'microbitDataLogger' && (
          <MicrobitDataLogger
            onBack={() => setActiveTab('dashboard')}
            addPoints={addPoints}
          />
        )}

        {/* ----------------- VIEW: MICRO:BIT MUSIC LAB (WEB AUDIO & SYNTHESIZER) ----------------- */}
        {activeTab === 'musicLab' && (
          <MicrobitMusicLab
            onBack={() => setActiveTab('dashboard')}
            addPoints={addPoints}
            onNavigateCodingLab={() => {
              setActiveTab('codingLab');
              setCodingSubTab('microbit');
            }}
          />
        )}


        {/* ----------------- VIEW: STANDALONE PDPA PRIVACY GENERATOR ----------------- */}
        {activeTab === 'pdpaConsent' && (
          <PDPAPrivacyGenerator
            currentProfile={profile}
            addPoints={(pts, reason) => addPoints(pts, reason || 'สร้างหนังสือยินยอม PDPA สำเร็จ', 'safety')}
            onBackToLab={() => setActiveTab('safety')}
          />
        )}
        </Suspense>
      </main>

      {/* Global Modals (Code-Split Lazy Loading on Demand) */}
      <Suspense fallback={null}>
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            badges={badges}
            points={points}
            completedModulesCount={completedCount}
            onOpenProfileManagement={() => {
              setIsProfileModalOpen(false);
              setActiveTab('profileManage');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {isSubmitModalOpen && (
          <SubmitProjectModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            onSubmit={handleAddProject}
            defaultStudentName={profile.name}
            defaultGrade={profile.grade}
          />
        )}

        {isCertificateModalOpen && (
          <CertificateModal
            isOpen={isCertificateModalOpen}
            onClose={() => setIsCertificateModalOpen(false)}
            studentName={profile.name}
            schoolName={profile.school}
            points={points}
            completedCount={completedCount}
          />
        )}

        {isAssessmentReportOpen && (
          <TeacherAssessmentReportModal
            isOpen={isAssessmentReportOpen}
            onClose={() => setIsAssessmentReportOpen(false)}
            currentProfile={profile}
            profiles={profiles}
            currentPoints={points}
            moduleProgress={moduleProgress}
            onOpenTeacherMastery={() => setIsTeacherMasteryOpen(true)}
          />
        )}

        {isUnpluggedWorksheetsOpen && (
          <UnpluggedWorksheetsModal
            isOpen={isUnpluggedWorksheetsOpen}
            onClose={() => setIsUnpluggedWorksheetsOpen(false)}
            onCompleteWorksheet={() => {
              addPoints(15, 'ทำกิจกรรมใบงาน Unplugged Coding ตามมาตรฐาน สพฐ.', 'thinking');
              setBadges((prev) =>
                prev.map((b) => (b.id === 'badge_unplugged_champ' ? { ...b, unlocked: true } : b))
              );
            }}
          />
        )}

        {isBugHunterOpen && (
          <DailyBugHunterModal
            isOpen={isBugHunterOpen}
            onClose={() => setIsBugHunterOpen(false)}
            onSuccessBugHunter={(pts) => {
              addPoints(pts, 'พิชิตภารกิจล่า Bug ประจำวัน (Daily Bug Hunter)', 'coding');
              setBadges((prev) =>
                prev.map((b) => (b.id === 'badge_bug_hunter' ? { ...b, unlocked: true } : b))
              );
            }}
          />
        )}

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            profiles={profiles}
            currentProfile={profile}
            onLoginSuccess={handleLoginSuccess}
            pendingDestinationModule={pendingDestinationModule}
            isAdmin={isAdmin}
          />
        )}

        {/* AI Tutor Chatbot Floating Assistant */}
        <AITutorChatbot
          profile={profile}
          points={points}
          activeModule={activeTab}
          onNavigate={handleNavigate}
          isOpenExternal={isAITutorOpen}
          onCloseExternal={() => setIsAITutorOpen(false)}
        />

        {isGasExportModalOpen && (
          <GoogleAppsScriptExportModal
            isOpen={isGasExportModalOpen}
            onClose={() => setIsGasExportModalOpen(false)}
          />
        )}

        {isExamArenaOpen && (
          <ExamArenaModal
            isOpen={isExamArenaOpen}
            onClose={() => setIsExamArenaOpen(false)}
            studentName={profile.name}
            onCompleteExam={(score) => {
              const earned = score * 5;
              addPoints(earned, `ทำข้อสอบวัดผลจำลอง O-NET / สสวท. ป.6 ได้ ${score}/10 คะแนน`, 'thinking');
              soundEffects.playFanfare();
            }}
          />
        )}

        {isDigitalPassportOpen && (
          <DigitalPassportModal
            isOpen={isDigitalPassportOpen}
            onClose={() => setIsDigitalPassportOpen(false)}
            profile={profile}
            points={points}
            moduleProgress={moduleProgress}
          />
        )}

        {isTeacherPlansOpen && (
          <TeacherLessonPlansModal
            isOpen={isTeacherPlansOpen}
            onClose={() => setIsTeacherPlansOpen(false)}
          />
        )}

        {isRubricModalOpen && (
          <RubricAssessmentModal
            isOpen={isRubricModalOpen}
            onClose={() => setIsRubricModalOpen(false)}
            profile={profile}
            points={points}
            completedModulesCount={completedCount}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {isParentTeacherKitOpen && (
          <ParentTeacherKitModal
            isOpen={isParentTeacherKitOpen}
            onClose={() => setIsParentTeacherKitOpen(false)}
          />
        )}

        {isClassroomBattleOpen && (
          <ClassroomBattleModal
            isOpen={isClassroomBattleOpen}
            onClose={() => setIsClassroomBattleOpen(false)}
            studentName={profile.name}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {isOnetBattleOpen && (
          <OnetBattleModal
            isOpen={isOnetBattleOpen}
            onClose={() => setIsOnetBattleOpen(false)}
            studentName={profile.name}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            addPoints={addPoints}
            onCelebrate={handleTriggerManualCelebration}
          />
        )}

        {isCodeTyperOpen && (
          <CodeTyperModal
            isOpen={isCodeTyperOpen}
            onClose={() => setIsCodeTyperOpen(false)}
            onRewardPoints={(pts, reason, opts) => addPoints(pts, reason, 'coding', opts)}
          />
        )}

        {isPairArenaOpen && (
          <PairProgrammingArena
            isOpen={isPairArenaOpen}
            onClose={() => setIsPairArenaOpen(false)}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
          />
        )}

        {isStemPacksOpen && (
          <StemPacksModal
            isOpen={isStemPacksOpen}
            onClose={() => setIsStemPacksOpen(false)}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
          />
        )}

        {isTeacherMasteryOpen && (
          <TeacherMasteryPortal
            isOpen={isTeacherMasteryOpen}
            onClose={() => setIsTeacherMasteryOpen(false)}
            currentProfile={profile}
            profiles={profiles}
            currentPoints={points}
            moduleProgress={moduleProgress}
            onOpenAssessmentReport={() => setIsAssessmentReportOpen(true)}
          />
        )}

        {isClassroomStatsOpen && (
          <TeacherClassroomStatsModal
            isOpen={isClassroomStatsOpen}
            onClose={() => setIsClassroomStatsOpen(false)}
            currentProfile={profile}
            profiles={profiles}
            currentPoints={points}
            moduleProgress={moduleProgress}
            onOpenTeacherMastery={() => {
              setIsClassroomStatsOpen(false);
              setIsTeacherMasteryOpen(true);
            }}
            onOpenAssessmentReport={() => {
              setIsClassroomStatsOpen(false);
              setIsAssessmentReportOpen(true);
            }}
            onOpenHomeworkDropzone={() => {
              setIsClassroomStatsOpen(false);
              setIsHomeworkDropzoneOpen(true);
            }}
          />
        )}

        {isHeroCardsOpen && (
          <CoderHeroCardsModal
            isOpen={isHeroCardsOpen}
            onClose={() => setIsHeroCardsOpen(false)}
            studentName={profile.name}
          />
        )}

        {isSmartExamOpen && (
          <SmartExamGeneratorModal
            isOpen={isSmartExamOpen}
            onClose={() => setIsSmartExamOpen(false)}
            studentName={profile.name}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'thinking')}
          />
        )}

        {isCodeTracerOpen && (
          <VisualCodeTracerModal
            isOpen={isCodeTracerOpen}
            onClose={() => setIsCodeTracerOpen(false)}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
          />
        )}

        {isStudentQRPassOpen && (
          <StudentQRPassModal
            isOpen={isStudentQRPassOpen}
            onClose={() => setIsStudentQRPassOpen(false)}
            currentStudentName={profile.name}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            onRewardPoints={(pts, reason, opts) => addPoints(pts, reason, 'classroom', opts)}
          />
        )}

        {isQuickSearchOpen && (
          <QuickSearchModal
            isOpen={isQuickSearchOpen}
            onClose={() => setIsQuickSearchOpen(false)}
            onNavigate={handleNavigate}
            onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
            onOpenMazeRunner={() => setIsMazeRunnerOpen(true)}
            onOpenHomeworkDropzone={() => setIsHomeworkDropzoneOpen(true)}
            onOpenAvatarShop={() => setIsAvatarShopOpen(true)}
            onOpenTeacherMastery={() => setIsTeacherMasteryOpen(true)}
            onOpenClassroomStats={() => setIsClassroomStatsOpen(true)}
            onOpenRubricModal={() => setIsRubricModalOpen(true)}
            onOpenSmartExam={() => setIsSmartExamOpen(true)}
            onOpenClassroomBattle={() => setIsClassroomBattleOpen(true)}
            onOpenOnetBattle={() => setIsOnetBattleOpen(true)}
          />
        )}

        {isLuckyWheelOpen && (
          <ClassroomLuckyWheel
            isOpen={isLuckyWheelOpen}
            onClose={() => setIsLuckyWheelOpen(false)}
            profiles={profiles}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            onAwardBonusPoints={(pts, reason, opts) => addPoints(pts, reason, 'classroom', opts)}
          />
        )}

        {isMazeRunnerOpen && (
          <BlockMazeRunner
            isOpen={isMazeRunnerOpen}
            onClose={() => setIsMazeRunnerOpen(false)}
            onAwardPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
          />
        )}

        {isHomeworkDropzoneOpen && (
          <HomeworkDropzone
            isOpen={isHomeworkDropzoneOpen}
            onClose={() => setIsHomeworkDropzoneOpen(false)}
            profile={profile}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            onAwardPoints={(pts, reason, opts) => addPoints(pts, reason, 'showcase', opts)}
          />
        )}

        {isAvatarShopOpen && (
          <AvatarShopModal
            isOpen={isAvatarShopOpen}
            onClose={() => setIsAvatarShopOpen(false)}
            points={points}
            profile={profile}
            onDeductPoints={(pts, reason) => spendPoints(pts, reason, 'avatar_shop')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {isLiveQuizBattleOpen && (
          <LiveQuizBattleModal
            isOpen={isLiveQuizBattleOpen}
            onClose={() => setIsLiveQuizBattleOpen(false)}
            currentStudentName={profile.name}
            isTeacher={isAdmin && viewRoleMode === 'teacher'}
            onRewardPoints={(pts, reason, opts) => addPoints(pts, reason, 'classroom', opts)}
          />
        )}

        {isCommunityRemixOpen && (
          <CommunityRemixHubModal
            isOpen={isCommunityRemixOpen}
            onClose={() => setIsCommunityRemixOpen(false)}
            currentStudentName={profile.name}
            onRewardPoints={(pts, reason, opts) => addPoints(pts, reason, 'showcase', opts)}
          />
        )}

        {isDailyChallengeOpen && (
          <DailyMicroChallengeModal
            isOpen={isDailyChallengeOpen}
            onClose={() => setIsDailyChallengeOpen(false)}
            currentStudentName={profile.name}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'thinking')}
          />
        )}

        {isBebrasSimulatorOpen && (
          <BebrasSimulatorModal
            isOpen={isBebrasSimulatorOpen}
            onClose={() => setIsBebrasSimulatorOpen(false)}
            currentStudentName={profile.name}
            onRewardPoints={(pts, reason, opts) => addPoints(pts, reason, 'thinking', opts)}
          />
        )}

        {isSocraticDebuggerOpen && (
          <SmartSocraticDebuggerModal
            isOpen={isSocraticDebuggerOpen}
            onClose={() => setIsSocraticDebuggerOpen(false)}
            currentStudentName={profile.name}
            onRewardPoints={(pts, reason) => addPoints(pts, reason, 'coding')}
          />
        )}

        {isStudentReportCardOpen && (
          <StudentReportCardModal
            isOpen={isStudentReportCardOpen}
            onClose={() => setIsStudentReportCardOpen(false)}
            profile={profile}
            points={points}
          />
        )}

        {isComputingGlossaryOpen && (
          <ComputingGlossaryModal
            isOpen={isComputingGlossaryOpen}
            onClose={() => setIsComputingGlossaryOpen(false)}
          />
        )}
      </Suspense>

      {/* Milestone & Completion Confetti Celebration Modal */}
      <ConfettiCelebration
        event={celebrationEvent}
        onClose={() => setCelebrationEvent(null)}
        onNavigate={handleNavigate}
        profile={profile}
      />

      {/* Day / Night Smooth Transition Effect Overlay */}
      <DayNightTransitionOverlay
        transitionEvent={transitionEvent}
        onTransitionEnd={() => setTransitionEvent(null)}
      />

      {/* Offline Mode Indicator Toast */}
      <OfflineIndicator />

      {/* Footer */}
      <Footer />
    </div>
  );
}
