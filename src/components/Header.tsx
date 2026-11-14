import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  User,
  Coins,
  BookOpen,
  Lightbulb,
  Users,
  LogIn,
  LogOut,
  Shield,
  ShieldCheck,
  Trophy,
  Compass,
  Bot,
  Sun,
  Moon,
  FileCode,
  Bug,
  FileText,
  GraduationCap,
  Terminal,
  Brain,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  LayoutDashboard,
  Code2,
  Swords,
  Volume2,
  VolumeX,
  BookMarked,
  FileCheck,
  Rocket,
  Binary,
  Sliders,
  PenTool,
  Zap,
  Keyboard,
  FileSpreadsheet,
  QrCode,
  Cpu,
  Sparkles,
  Music,
  Palette,
  Check,
  Search,
  Tv,
  RotateCw,
  ShoppingBag,
  FolderGit2,
} from 'lucide-react';
import { UserProfile, ColorTone, COLOR_TONES } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';
import { AccessibilityControls } from './AccessibilityControls.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

import { ThemeMode } from '../utils/dayNightCycle.ts';
import { DayNightCycleMenu } from './DayNightCycleMenu.tsx';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCertificate: () => void;
  onOpenProfile: () => void;
  completedPoints: number;
  profile: UserProfile;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  isTeacherAuthorized?: boolean;
  isAdmin?: boolean;
  onToggleAdmin?: (isAdmin: boolean) => void;
  onOpenAITutor?: () => void;
  theme?: 'light' | 'dark';
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  onSelectThemeMode?: (mode: ThemeMode) => void;
  onPreviewTransition?: () => void;
  onOpenGasExport?: () => void;
  onOpenAssessmentReport?: () => void;
  onOpenUnpluggedWorksheets?: () => void;
  onOpenBugHunter?: () => void;
  onOpenExamArena?: () => void;
  onOpenDigitalPassport?: () => void;
  onOpenTeacherPlans?: () => void;
  onOpenRubricModal?: () => void;
  onOpenParentTeacherKit?: () => void;
  onOpenClassroomBattle?: () => void;
  onOpenCodeTyper?: () => void;
  onOpenPairArena?: () => void;
  onOpenStemPacks?: () => void;
  onOpenTeacherMastery?: () => void;
  onOpenHeroCards?: () => void;
  onOpenSmartExam?: () => void;
  onOpenCodeTracer?: () => void;
  onOpenStudentQRPass?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  colorTone?: ColorTone;
  onChangeColorTone?: (tone: ColorTone) => void;
  onOpenQuickSearch?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenMazeRunner?: () => void;
  onOpenHomeworkDropzone?: () => void;
  onOpenAvatarShop?: () => void;
  isProjectorMode?: boolean;
  onToggleProjectorMode?: () => void;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCertificate,
  onOpenProfile,
  completedPoints,
  profile,
  isLoggedIn = true,
  onOpenLogin,
  onLogout,
  isTeacherAuthorized = false,
  isAdmin = false,
  onToggleAdmin,
  onOpenAITutor,
  theme = 'light',
  themeMode = 'auto',
  onToggleTheme,
  onSelectThemeMode,
  onPreviewTransition,
  colorTone = 'indigo',
  onChangeColorTone,
  onOpenQuickSearch,
  onOpenLuckyWheel,
  onOpenMazeRunner,
  onOpenHomeworkDropzone,
  onOpenAvatarShop,
  isProjectorMode = false,
  onToggleProjectorMode,
  onTriggerSync,
  isSyncing = false,
  lastSyncTime,
  onOpenGasExport,
  onOpenAssessmentReport,
  onOpenUnpluggedWorksheets,
  onOpenBugHunter,
  onOpenExamArena,
  onOpenDigitalPassport,
  onOpenTeacherPlans,
  onOpenRubricModal,
  onOpenParentTeacherKit,
  onOpenClassroomBattle,
  onOpenCodeTyper,
  onOpenPairArena,
  onOpenStemPacks,
  onOpenTeacherMastery,
  onOpenHeroCards,
  onOpenSmartExam,
  onOpenCodeTracer,
  onOpenStudentQRPass,
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const userLevel = Math.max(1, Math.floor(completedPoints / 75) + 1);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundEffects.isSoundMuted());

  // Categorized dropdowns state (including tone picker and Day/Night cycle)
  const [openDropdown, setOpenDropdown] = useState<'modules' | 'labs' | 'system' | 'tone' | 'daynight' | null>(null);
  const activeToneOption = COLOR_TONES.find((t) => t.id === colorTone) || COLOR_TONES[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Category matching
  const isModulesActive = ['learningMap', 'safety', 'thinking', 'codingLab', 'showcase', 'pdpaConsent'].includes(activeTab);
  const isLabsActive = [
    'juniorPlayground',
    'kidsAILab',
    'teamBattle',
    'digitalLibrary',
    'stemProjects',
    'binaryLab',
    'bebrasArena',
    'aiPromptLab',
    'microbitDataLogger',
    'musicLab',
  ].includes(activeTab);
  const isSystemActive = ['classroom', 'didYouKnow', 'leaderboard', 'rewards', 'profileManage', 'buddySystem'].includes(activeTab);

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsSoundMuted(muted);
    if (!muted) {
      soundEffects.playClick();
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
      setOpenDropdown(null);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-[1720px] w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-1.5 sm:gap-2.5" ref={navRef}>
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl group p-1 -m-1 cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Coder Kids
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 leading-none">
                  วิทยาการคำนวณ ป.4-6
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Categorized Navigation Menus */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium shrink min-w-0">
            
            {/* 1. หน้าหลัก (Direct Link) */}
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>หน้าหลัก</span>
            </button>

            {/* 2. หมวด: บทเรียนหลัก (Dropdown) */}
            <div className="relative shrink-0">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'modules' ? null : 'modules')}
                className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isModulesActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={openDropdown === 'modules'}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>บทเรียนหลัก</span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px]">4</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 text-slate-400 ${openDropdown === 'modules' ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {/* Modules Dropdown Popover */}
              {openDropdown === 'modules' && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">📚 4 โมดูลการเรียนรู้</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">ตามหลักสูตร สพฐ.</span>
                  </div>

                  <button
                    onClick={() => handleSelectTab('learningMap')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'learningMap'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>แผนที่การเรียนรู้</span>
                        {activeTab === 'learningMap' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">สำรวจเส้นทาง &amp; ปลดล็อกเหรียญ</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('safety')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'safety'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 text-sm">
                      🛡️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>1. ความปลอดภัยดิจิทัล &amp; PDPA</span>
                        {activeTab === 'safety' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">รหัสผ่านปลอดภัย, มารยาทเน็ต &amp; กฎหมาย</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('pdpaConsent')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'pdpaConsent'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 text-sm">
                      📜
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>สร้างหนังสือยินยอม PDPA (PDF)</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">ใหม่</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">ออกเอกสารยินยอม &amp; นโยบายความเป็นส่วนตัว</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('thinking')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'thinking'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 text-sm">
                      🧩
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>2. คิดเป็นลำดับขั้น (Computational)</span>
                        {activeTab === 'thinking' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">4 เสาหลักการคิด, อัลกอริทึม &amp; เกมเขาวงกต</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('codingLab')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'codingLab'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 text-sm">
                      💻
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>3. ปฏิบัติการ Scratch &amp; Micro:bit</span>
                        {activeTab === 'codingLab' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">ห้องสตูดิโอบล็อกคำสั่ง &amp; บอร์ดจำลองฮาร์ดแวร์</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('showcase')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'showcase'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 text-sm">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>4. แสดงผลงานและสะท้อนคิด</span>
                        {activeTab === 'showcase' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">โชว์โครงงาน, ประเมินเพื่อน &amp; บันทึกสะท้อนคิด</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 3. หมวด: แล็บ & เควสต์ (Dropdown) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'labs' ? null : 'labs')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isLabsActive
                    ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={openDropdown === 'labs'}
              >
                <Terminal className="w-4 h-4 text-purple-500" />
                <span>แล็บ &amp; มินิเกม</span>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px]">21</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${openDropdown === 'labs' ? 'rotate-180 text-purple-600' : ''}`} />
              </button>

              {/* Labs Dropdown Popover */}
              {openDropdown === 'labs' && (
                <div className="absolute left-0 mt-2 w-80 sm:w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[min(75vh,540px)]">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">⚡ แล็บฝึกทักษะ &amp; สื่อเรียนรู้</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <span>เลื่อนดู ↕</span>
                    </span>
                  </div>

                  <div className="overflow-y-auto space-y-0.5 pr-1.5 overscroll-contain custom-scrollbar flex-1">

                  {onOpenMazeRunner && (
                    <button
                      onClick={() => handleAction(onOpenMazeRunner)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                          <span>มินิเกมเขาวงกต (Maze Runner)</span>
                          <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.2 rounded font-mono font-bold">20 ด่าน</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">ลากบล็อกพาน้องแมวผ่านเขาวงกต 20 ด่าน</div>
                      </div>
                    </button>
                  )}

                  {onOpenAvatarShop && (
                    <button
                      onClick={() => handleAction(onOpenAvatarShop)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-purple-700 dark:text-purple-300">
                          <span>ร้านค้าอวตาร (Avatar Shop)</span>
                          <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">22 ไอเทม</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">แลกหมวก แว่นตา สัตว์เลี้ยงคู่ใจ 22 รายการ</div>
                      </div>
                    </button>
                  )}

                  {onOpenHomeworkDropzone && (
                    <button
                      onClick={() => handleAction(onOpenHomeworkDropzone)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-teal-700 dark:text-teal-300">
                          <span>กล่องส่งการบ้าน (Homework)</span>
                          <span className="text-[10px] bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-1.5 py-0.2 rounded font-mono font-bold">12 หัวข้อ</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">ถ่ายรูปใบงาน &amp; แฟ้มสะสมงาน (12 ภารกิจ)</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectTab('stemProjects')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'stemProjects'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                      <Rocket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                        <span>คลังโครงงาน STEM Project Hub</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">12 โครงงาน</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">12 โครงงาน + วางแผน Project Canvas A4</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('binaryLab')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'binaryLab'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                      <Binary className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                        <span>Binary Pixel Art &amp; รหัสลับ ASCII</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">10 ภาพ</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">10 ภาพพิกเซล 8×8 &amp; 6 ภารกิจถอดรหัสสายลับ</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('digitalLibrary')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'digitalLibrary'
                        ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-teal-700 dark:text-teal-300">
                        <span>คลัง e-Book &amp; ฮาร์ดแวร์ 3D</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">12+12</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">12 โมเดล 3D หมุน 360° &amp; 12 e-Book ว 4.2</div>
                    </div>
                  </button>


                  <button
                    onClick={() => handleSelectTab('musicLab')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'musicLab'
                        ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-purple-700 dark:text-purple-300">
                        <span>Micro:bit Music Lab</span>
                        <span className="text-[10px] bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 px-1.5 py-0.2 rounded font-mono font-bold">20 เพลง</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">20 เมโลดี้/SFX, ออสซิลโลสโคป &amp; MakeCode</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('teamBattle')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'teamBattle'
                        ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                      <Swords className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-rose-700 dark:text-rose-300">
                        <span>สนามประลองทีม (Team Battle)</span>
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded font-mono font-bold">10 ข้อ</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">10 โจทย์ประลองสด 4 ทีม + แย่งกดปุ่ม</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('juniorPlayground')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'juniorPlayground'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                      <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>Junior Code Playground</span>
                        {activeTab === 'juniorPlayground' ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">8 โจทย์</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 เทมเพลตบล็อก, Python &amp; Micro:bit JS รันสด</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('kidsAILab')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'kidsAILab'
                        ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>Kids AI Lab</span>
                        {activeTab === 'kidsAILab' ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> : <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">18+8</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">เทรน AI 18 ตัวอย่าง &amp; ทดสอบแยกขยะ 8 ด่าน</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('bebrasArena')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'bebrasArena'
                        ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-base">
                      🦫
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-amber-700 dark:text-amber-300">
                        <span>Bebras Thailand Arena</span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-mono font-bold">8 ภารกิจ</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 ภารกิจสากล 4 เสาหลักการคิดเชิงคำนวณ</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('aiPromptLab')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'aiPromptLab'
                        ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0 text-base">
                      🤖
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-purple-700 dark:text-purple-300">
                        <span>Kids AI &amp; Safe Prompting</span>
                        <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">8+14</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 คดี Deepfake, 14 ป้ายเช็ก &amp; 10 บทบาท Prompt</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('microbitDataLogger')}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeTab === 'microbitDataLogger'
                        ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0 text-base">
                      📈
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between text-teal-700 dark:text-teal-300">
                        <span>IoT Data Logger &amp; Science</span>
                        <span className="text-[10px] bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-1.5 py-0.2 rounded font-mono font-bold">8 ช่อง</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 เซนเซอร์สด, 6 การทดลองวิทย์ &amp; ส่งออก CSV</div>
                    </div>
                  </button>

                  {onOpenCodeTyper && (
                    <button
                      onClick={() => handleAction(onOpenCodeTyper)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                        <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                          <span>Kids Code Typer</span>
                          <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.2 rounded font-mono font-bold">40 ชุด</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">40 โจทย์พิมพ์โค้ดดิ้ง คำสั่ง &amp; วงเล็บ 3 ระดับ</div>
                      </div>
                    </button>
                  )}

                  {onOpenPairArena && (
                    <button
                      onClick={() => handleAction(onOpenPairArena)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                        <Swords className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-rose-700 dark:text-rose-300">
                          <span>Pair Programming Arena</span>
                          <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.2 rounded font-mono font-bold">8 ด่าน</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 ด่านดวล 2 คนบนจอเดียว &amp; คนขับ-ผู้นำทาง</div>
                      </div>
                    </button>
                  )}

                  {onOpenStemPacks && (
                    <button
                      onClick={() => handleAction(onOpenStemPacks)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                        <Rocket className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                          <span>โครงงานสะเต็มศึกษา (STEM 5E)</span>
                          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">10 ชุด</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">10 โครงงานจำลอง 5E แปลงผัก, หุ่นยนต์, IoT</div>
                      </div>
                    </button>
                  )}

                  {onOpenHeroCards && (
                    <button
                      onClick={() => handleAction(onOpenHeroCards)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-pink-50 dark:hover:bg-pink-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/60 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-pink-700 dark:text-pink-300">
                          <span>การ์ดพลังฮีโร่โค้ดดิ้ง (Hero Cards)</span>
                          <span className="text-[10px] bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-1.5 py-0.2 rounded font-mono font-bold">12 ใบ</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">12 การ์ดพลัง 3D สะสมเปิดซอง &amp; พิมพ์ A4</div>
                      </div>
                    </button>
                  )}

                  {onOpenCodeTracer && (
                    <button
                      onClick={() => handleAction(onOpenCodeTracer)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-cyan-700 dark:text-cyan-300">
                          <span>จำลองโค้ดทีละขั้น (Code Tracer)</span>
                          <span className="text-[10px] bg-cyan-200 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-1.5 py-0.2 rounded font-mono font-bold">6 โจทย์</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">6 โจทย์ส่องตัวแปร, ลูป &amp; ฟังก์ชันใน RAM สด</div>
                      </div>
                    </button>
                  )}

                  {onOpenClassroomBattle && (
                    <button
                      onClick={() => handleAction(onOpenClassroomBattle)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-amber-700 dark:text-amber-400">
                          <span>Live Classroom Battle</span>
                          <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ข้อ</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">10 ข้อแข่งแก้บักสปรินท์สด &amp; จอโปรเจกเตอร์</div>
                      </div>
                    </button>
                  )}

                  {onOpenBugHunter && (
                    <button
                      onClick={() => handleAction(onOpenBugHunter)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                        <Bug className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-rose-600 dark:text-rose-400">
                          <span>ภารกิจล่าบั๊ก (+15 EXP)</span>
                          <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded font-mono font-bold">6 ด่าน</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">6 ภารกิจค้นหาและแก้บั๊กในโค้ดประจำวัน</div>
                      </div>
                    </button>
                  )}

                  {onOpenUnpluggedWorksheets && (
                    <button
                      onClick={() => handleAction(onOpenUnpluggedWorksheets)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                          <span>คลังใบงาน Unplugged</span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded font-mono font-bold">8 ใบงาน</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">8 ใบกิจกรรม A4 โค้ดดิ้งไม่ใช้คอมพิวเตอร์</div>
                      </div>
                    </button>
                  )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. หมวด: ห้องเรียน & วัดผล (Dropdown) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'system' ? null : 'system')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSystemActive
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={openDropdown === 'system'}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>ห้องเรียน &amp; วัดผล</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px]">10</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${openDropdown === 'system' ? 'rotate-180 text-amber-600' : ''}`} />
              </button>

              {/* System Dropdown Popover */}
              {openDropdown === 'system' && (
                <div className="absolute right-0 lg:left-0 mt-2 w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[min(75vh,540px)]">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">🏫 ห้องเรียน &amp; ระบบวัดผล</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <span>เลื่อนดู ↕</span>
                    </span>
                  </div>

                  <div className="overflow-y-auto space-y-0.5 pr-1.5 overscroll-contain custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 gap-0.5">
                    {onOpenLuckyWheel && (
                      <button
                        onClick={() => handleAction(onOpenLuckyWheel)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-amber-700 dark:text-amber-300">
                            <span>วงล้อสุ่มชื่อ &amp; จัดกลุ่ม (Lucky Wheel)</span>
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded font-mono font-bold">ใหม่</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">สุ่มตอบคำถาม &amp; แบ่งทีมสำหรับโปรเจกเตอร์</div>
                        </div>
                      </button>
                    )}

                    {onOpenHomeworkDropzone && (
                      <button
                        onClick={() => handleAction(onOpenHomeworkDropzone)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0">
                          <FolderGit2 className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-teal-700 dark:text-teal-300">
                            <span>โต๊ะตรวจการบ้าน &amp; ผลงานนักเรียน</span>
                            <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.2 rounded font-mono font-bold">ตรวจงาน</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">ให้คะแนนดาว &amp; คำติชม 2 Stars 1 Wish</div>
                        </div>
                      </button>
                    )}

                    {onOpenTeacherMastery && (
                      <button
                        onClick={() => handleAction(onOpenTeacherMastery)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                            <span>ศูนย์คุณครู ว 4.2 &amp; บันทึก ปพ.5</span>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded font-mono font-bold">สพฐ.</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">รูบริก ปพ.5 + แผน 5E + ส่งออก CSV</div>
                        </div>
                      </button>
                    )}

                    {onOpenRubricModal && (
                      <button
                        onClick={() => handleAction(onOpenRubricModal)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                            <span>แบบประเมินรูบริกส์ (Rubric ว 4.2)</span>
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded font-mono font-bold">ใหม่</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">ประเมินตนเอง 4 มิติ + Digital Portfolio</div>
                        </div>
                      </button>
                    )}

                    {onOpenParentTeacherKit && (
                      <button
                        onClick={() => handleAction(onOpenParentTeacherKit)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-teal-700 dark:text-teal-300">
                            <span>ชุดพิมพ์ใบงาน QR &amp; คู่มือผู้ปกครอง</span>
                            <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.2 rounded font-mono font-bold">A4</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">ใบงาน Unplugged สแกนเฉลย + เคล็ดลับบ้าน</div>
                        </div>
                      </button>
                    )}

                    {onOpenExamArena && (
                      <button
                        onClick={() => handleAction(onOpenExamArena)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-amber-700 dark:text-amber-300">
                            <span>คลังข้อสอบ O-NET &amp; สสวท. ป.6</span>
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded font-mono font-bold">10 ชุด (100 ข้อ)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">ผัง O-NET 69 • 10 ชุด ชุดละ 10 ข้อ + วิเคราะห์ตัวชี้วัด</div>
                        </div>
                      </button>
                    )}

                    {onOpenDigitalPassport && (
                      <button
                        onClick={() => handleAction(onOpenDigitalPassport)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                          <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                            <span>พาสปอร์ตการเรียนรู้ (Passport)</span>
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded font-mono">ตราประทับ</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">สมุดตรวจลงตรา 4 วีซ่า พิมพ์ A4</div>
                        </div>
                      </button>
                    )}

                    {onOpenTeacherPlans && (
                      <button
                        onClick={() => handleAction(onOpenTeacherPlans)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                            <span>แผนการจัดการเรียนรู้ (8 แผน ว 4.2)</span>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded font-mono">ครู</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">มาตรฐาน K-P-A + สไลด์สอน + รูบริก</div>
                        </div>
                      </button>
                    )}

                    {onOpenSmartExam && (
                      <button
                        onClick={() => handleAction(onOpenSmartExam)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-violet-50 dark:hover:bg-violet-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-violet-700 dark:text-violet-300">
                            <span>ระบบสุ่มข้อสอบ Smart Exam</span>
                            <span className="text-[10px] bg-violet-100 dark:bg-violet-900/60 px-1.5 py-0.2 rounded font-mono font-bold">A4 &amp; สอบสด</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">สุ่ม 5-10 ข้อ ป.4-ป.6 + กระดาษคำตอบ</div>
                        </div>
                      </button>
                    )}

                    {onOpenStudentQRPass && (
                      <button
                        onClick={() => handleAction(onOpenStudentQRPass)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                          <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                            <span>บัตรนักเรียน QR Pass &amp; สแกนเนอร์</span>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded font-mono font-bold">เช็คชื่อ</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">บัตรพกกระเป๋า A4 + ครูสแกนแจกแต้ม</div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => handleSelectTab('classroom')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'classroom'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0 text-sm">
                        🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>ห้องเรียนเสมือน (Virtual Classroom)</span>
                          {activeTab === 'classroom' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectTab('buddySystem')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'buddySystem'
                          ? 'bg-pink-50 dark:bg-pink-950/70 text-pink-900 dark:text-pink-200 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/60 flex items-center justify-center shrink-0 text-pink-600 dark:text-pink-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between text-pink-700 dark:text-pink-300">
                          <span>คู่หูเรียนรู้ &amp; ส่งกำลังใจ (Buddy)</span>
                          {activeTab === 'buddySystem' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />
                          ) : (
                            <span className="text-[10px] bg-pink-100 dark:bg-pink-900/60 px-1.5 py-0.2 rounded font-mono">ใหม่</span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectTab('leaderboard')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'leaderboard'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>Leaderboard ทำเนียบผู้นำ</span>
                          {activeTab === 'leaderboard' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectTab('rewards')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'rewards'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>ศูนย์สะสมแต้ม &amp; แลกรางวัล</span>
                          {activeTab === 'rewards' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectTab('didYouKnow')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'didYouKnow'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>เรื่องน่ารู้ชวนคิด (Tech Bites)</span>
                          {activeTab === 'didYouKnow' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </div>
                    </button>

                    {onOpenAssessmentReport && (
                      <button
                        onClick={() => handleAction(onOpenAssessmentReport)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center justify-between text-purple-700 dark:text-purple-300">
                            <span>รายงาน ปพ.5 ครู (CSV)</span>
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.2 rounded font-mono">ครู</span>
                          </div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(onOpenCertificate)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight text-indigo-600 dark:text-indigo-400">
                          <span>เกียรติบัตรการเรียน</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectTab('profileManage')}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'profileManage'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight">
                          <span>จัดการโปรไฟล์ผู้เรียน</span>
                        </div>
                      </div>
                    </button>

                    {onOpenGasExport && (
                      <button
                        onClick={() => handleAction(onOpenGasExport)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight text-emerald-700 dark:text-emerald-400">
                            <span>ส่งออกโค้ดสำหรับ GAS</span>
                          </div>
                        </div>
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </nav>

          {/* Right Action Utilities Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* AI Tutor Button */}
            {onOpenAITutor && (
              <button
                onClick={onOpenAITutor}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                title="ปรึกษาครูพี่โค้ดดิ้ง (AI Tutor ด้วย Gemini API)"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">AI Tutor</span>
              </button>
            )}

            {/* Points Badge (Clickable) */}
            {isLoggedIn && (
              <button
                onClick={() => handleSelectTab('rewards')}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                title="แต้มสะสม Coder Coins (คลิกเพื่อแลกรางวัล)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-mono tabular-nums">{completedPoints}</span>
                <span className="hidden 2xl:inline text-[11px] font-normal text-amber-700 dark:text-amber-400">แต้ม</span>
              </button>
            )}

            {/* Student or Admin Profile Trigger */}
            {isLoggedIn ? (
              <button
                onClick={onOpenProfile}
                className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer shadow-xs shrink-0 ${
                  isAdmin
                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                title={isAdmin ? "โปรไฟล์ผู้ดูแลระบบ (คลิกเพื่อจัดการโปรไฟล์)" : "ดูและแก้ไขโปรไฟล์ผู้เรียน"}
              >
                <span className="text-base sm:text-lg leading-none">{profile.avatarEmoji || (isAdmin ? '👨‍🏫' : '🐱')}</span>
                <span className="hidden xl:inline truncate max-w-[80px]">
                  {isAdmin ? (profile.nickname || 'ครูนุสรณ์') : (profile.nickname || profile.name.split(' ')[0])}
                </span>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold leading-none">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-bold leading-none">
                    LV.{userLevel}
                  </span>
                )}
              </button>
            ) : (
              onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )
            )}

            {/* Admin Toggle & Role Status (เฉพาะคุณครู/แอดมินที่มีสิทธิ์ในแท็บ Teachers เท่านั้น) */}
            {isLoggedIn && isTeacherAuthorized && onToggleAdmin && (
              <button
                onClick={() => onToggleAdmin(!isAdmin)}
                className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                  isAdmin
                    ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={
                  isAdmin
                    ? 'กำลังอยู่ในโหมดผู้ดูแลระบบ (คลิกเพื่อสลับไปมุมมองนักเรียน)'
                    : 'สลับไปโหมดผู้ดูแลระบบ (Admin Mode)'
                }
              >
                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:inline text-[11px]">แอดมิน</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden 2xl:inline text-[11px]">มุมมองนักเรียน</span>
                  </div>
                )}
              </button>
            )}

            {/* Quick Search Button (Ctrl+K) */}
            {onOpenQuickSearch && (
              <button
                type="button"
                onClick={onOpenQuickSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                title="ค้นหาบทเรียน & เครื่องมือด่วน (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">ค้นหา</span>
                <kbd className="hidden lg:inline-flex text-[10px] font-mono px-1 py-0.2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Google Sheets Live Sync Status Pill */}
            {onTriggerSync && (
              <button
                type="button"
                onClick={onTriggerSync}
                disabled={isSyncing}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all text-[11px] font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                title={`ซิงค์กับ Google Sheets เรียบร้อย (คลิกเพื่อบันทึกข้อมูลล่าสุด)`}
              >
                <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : ''}`} />
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden 2xl:inline">{isSyncing ? 'กำลังซิงค์...' : 'Google Sheets'}</span>
                <RotateCw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Classroom Projector Mode Toggle */}
            {onToggleProjectorMode && (
              <button
                type="button"
                onClick={onToggleProjectorMode}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                  isProjectorMode
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/50 shadow-md animate-pulse'
                    : 'text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
                title={
                  isProjectorMode
                    ? 'ปิดโหมดฉายจอห้องเรียน (Projector Mode)'
                    : 'เปิดโหมดฉายจอห้องเรียน (Projector Mode: ขยายตัวอักษรให้อ่านง่ายสำหรับโปรเจกเตอร์)'
                }
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* Sound FX Toggle (Web Audio API & Thai TTS) */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs border ${
                isSoundMuted
                  ? 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                  : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
              title={isSoundMuted ? 'เปิดเสียงเอฟเฟกต์และเสียงอ่านภาษาไทย (Unmute)' : 'ปิดเสียงเอฟเฟกต์ (Mute)'}
              aria-label="เปิด/ปิดเสียงเอฟเฟกต์"
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 animate-pulse" />
              )}
            </button>

            {/* Accessibility & Focus Mode Controls */}
            <AccessibilityControls
              isFocusMode={isFocusMode}
              onToggleFocusMode={onToggleFocusMode || (() => {})}
            />

            {/* Day / Night Cycle & Theme Controller */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'daynight' ? null : 'daynight')}
                className={`p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border ${
                  theme === 'dark'
                    ? 'text-amber-300 hover:text-amber-200 bg-slate-800 hover:bg-slate-750 border-slate-700'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title={
                  themeMode === 'auto'
                    ? `วัฏจักรตามเวลาจริง (Day/Night Auto): ${theme === 'dark' ? 'โหมดมืด (กลางคืน)' : 'โหมดสว่าง (กลางวัน)'} - คลิกเพื่อตั้งค่า`
                    : `โหมดธีม: ${theme === 'dark' ? 'โหมดมืดคงที่' : 'โหมดสว่างคงที่'} - คลิกเพื่อตั้งค่า`
                }
                aria-label="ตั้งค่าวัฏจักรกลางวัน/กลางคืนและธีม"
                aria-expanded={openDropdown === 'daynight'}
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                {themeMode === 'auto' && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/40 animate-pulse shrink-0"
                    title="โหมดสลับอัตโนมัติตามเวลาเปิดใช้งานอยู่"
                  />
                )}
              </button>

              {openDropdown === 'daynight' && (
                <div className="absolute right-0 mt-2 z-50">
                  <DayNightCycleMenu
                    theme={theme}
                    themeMode={themeMode}
                    onSelectThemeMode={(mode) => {
                      if (onSelectThemeMode) onSelectThemeMode(mode);
                      // Don't necessarily close dropdown so user can see timeline update, or close if they prefer
                    }}
                    onPreviewTransition={() => {
                      if (onPreviewTransition) onPreviewTransition();
                    }}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>
              )}
            </div>

            {/* App Color Tone Picker (ฟีเจอร์เปลี่ยนโทนสีของแอป) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'tone' ? null : 'tone')}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                title={`เปลี่ยนโทนสีของแอป (ปัจจุบัน: ${activeToneOption.name})`}
                aria-label="เปลี่ยนโทนสีของแอป"
                aria-expanded={openDropdown === 'tone'}
              >
                <Palette className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800 shadow-xs"
                  style={{ backgroundColor: activeToneOption.dotColor }}
                />
              </button>

              {openDropdown === 'tone' && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>โทนสีของแอป (Color Tone)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        เลือกบรรยากาศสีสันที่คุณชื่นชอบ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {COLOR_TONES.map((t) => {
                      const isSelected = (colorTone || 'indigo') === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (onChangeColorTone) onChangeColorTone(t.id);
                            soundEffects.play('click');
                            setOpenDropdown(null);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs ring-1 ring-indigo-500/40'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white text-[9px]"
                            style={{ backgroundColor: t.dotColor }}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {t.name.split(' ')[0]}
                            </div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                              {t.nameEn}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Logout shortcut (desktop) */}
            {isLoggedIn && onLogout && (
              <button
                onClick={onLogout}
                className="hidden xl:flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
              aria-label="เปิดเมนูการนำทาง"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Categorized Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-slate-900/40 backdrop-blur-xs z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top duration-200">
            
            {/* Mobile Color Tone Picker */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>โทนสีของแอป (Color Tone)</span>
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {activeToneOption.name.split(' ')[0]}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_TONES.map((t) => {
                  const isSelected = (colorTone || 'indigo') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (onChangeColorTone) onChangeColorTone(t.id);
                        soundEffects.play('click');
                      }}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: t.dotColor }}
                      title={t.name}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Home */}
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>หน้าหลัก (Dashboard)</span>
            </button>

            {/* Category 1: บทเรียนหลัก */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>หมวด 1: บทเรียนหลัก (4 โมดูล)</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelectTab('learningMap')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'learningMap' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="flex items-center gap-2">🧭 แผนที่การเรียนรู้</span>
                </button>
                <button
                  onClick={() => handleSelectTab('safety')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'safety' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🛡️ 1. ความปลอดภัยดิจิทัล &amp; PDPA</span>
                </button>
                <button
                  onClick={() => handleSelectTab('thinking')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'thinking' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🧩 2. คิดเป็นลำดับขั้น (Computational Thinking)</span>
                </button>
                <button
                  onClick={() => handleSelectTab('codingLab')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'codingLab' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>💻 3. ปฏิบัติการ Scratch &amp; Micro:bit</span>
                </button>
                <button
                  onClick={() => handleSelectTab('showcase')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'showcase' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🏆 4. แสดงผลงานและสะท้อนคิด</span>
                </button>
              </div>
            </div>

            {/* Category 2: แล็บ & มินิเกม */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800">
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>หมวด 2: แล็บ &amp; มินิเกม</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">เลื่อนดู ↕</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1 overscroll-contain custom-scrollbar">
                {onOpenMazeRunner && (
                  <button
                    onClick={() => handleAction(onOpenMazeRunner)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🐱 มินิเกมเขาวงกต (Maze Runner)</span>
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">20 ด่าน</span>
                  </button>
                )}
                {onOpenAvatarShop && (
                  <button
                    onClick={() => handleAction(onOpenAvatarShop)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🛍️ ร้านค้าอวตาร (Avatar Shop)</span>
                    <span className="text-[10px] bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">22 ไอเทม</span>
                  </button>
                )}
                {onOpenHomeworkDropzone && (
                  <button
                    onClick={() => handleAction(onOpenHomeworkDropzone)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">📂 กล่องส่งการบ้าน (Homework)</span>
                    <span className="text-[10px] bg-teal-200 dark:bg-teal-900 px-1.5 py-0.5 rounded font-mono font-bold">12 หัวข้อ</span>
                  </button>
                )}
                <button
                  onClick={() => handleSelectTab('stemProjects')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'stemProjects' ? 'bg-indigo-600 text-white' : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">🚀 คลังโครงงาน STEM Project Hub</span>
                  <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">12 โครงงาน</span>
                </button>
                <button
                  onClick={() => handleSelectTab('binaryLab')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'binaryLab' ? 'bg-emerald-600 text-white' : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">👾 Binary Pixel Art &amp; รหัสลับ ASCII</span>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ภาพ</span>
                </button>
                <button
                  onClick={() => handleSelectTab('digitalLibrary')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'digitalLibrary' ? 'bg-teal-600 text-white' : 'text-teal-700 dark:text-teal-300 hover:bg-teal-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">📖 คลัง e-Book &amp; ฮาร์ดแวร์ 3D</span>
                  <span className="text-[10px] bg-teal-100 dark:bg-teal-900 px-1.5 py-0.5 rounded font-mono font-bold">12+12</span>
                </button>
                <button
                  onClick={() => handleSelectTab('musicLab')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'musicLab' ? 'bg-purple-600 text-white' : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">🎵 Micro:bit Music Lab</span>
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">20 เพลง</span>
                </button>
                <button
                  onClick={() => handleSelectTab('teamBattle')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'teamBattle' ? 'bg-rose-600 text-white' : 'text-rose-700 dark:text-rose-300 hover:bg-rose-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">⚔️ สนามประลองทีม (Team Battle)</span>
                  <span className="text-[10px] bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ข้อ</span>
                </button>
                <button
                  onClick={() => handleSelectTab('juniorPlayground')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'juniorPlayground' ? 'bg-purple-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>💻 Junior Code Playground</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">8 โจทย์</span>
                </button>
                <button
                  onClick={() => handleSelectTab('kidsAILab')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'kidsAILab' ? 'bg-purple-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🧠 Kids AI Lab (ปัญญาประดิษฐ์)</span>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">18+8</span>
                </button>
                <button
                  onClick={() => handleSelectTab('bebrasArena')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'bebrasArena' ? 'bg-amber-600 text-white' : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">🦫 Bebras Thailand Arena</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">8 ภารกิจ</span>
                </button>
                <button
                  onClick={() => handleSelectTab('aiPromptLab')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'aiPromptLab' ? 'bg-purple-600 text-white' : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">🤖 Kids AI &amp; Safe Prompting Lab</span>
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">8+14</span>
                </button>
                <button
                  onClick={() => handleSelectTab('microbitDataLogger')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'microbitDataLogger' ? 'bg-teal-600 text-white' : 'text-teal-700 dark:text-teal-300 hover:bg-teal-100/60'
                  }`}
                >
                  <span className="flex items-center gap-2">📈 IoT Data Logger &amp; Science</span>
                  <span className="text-[10px] bg-teal-200 dark:bg-teal-900 px-1.5 py-0.5 rounded font-mono font-bold">8 ช่อง</span>
                </button>
                {onOpenCodeTyper && (
                  <button
                    onClick={() => handleAction(onOpenCodeTyper)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">⌨️ Kids Code Typer</span>
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">40 ชุด</span>
                  </button>
                )}
                {onOpenPairArena && (
                  <button
                    onClick={() => handleAction(onOpenPairArena)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">👥 Pair Programming Arena</span>
                    <span className="text-[10px] bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded font-mono font-bold">8 ด่าน</span>
                  </button>
                )}
                {onOpenStemPacks && (
                  <button
                    onClick={() => handleAction(onOpenStemPacks)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🧪 โครงงานสะเต็มศึกษา (STEM 5E)</span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ชุด</span>
                  </button>
                )}
                {onOpenClassroomBattle && (
                  <button
                    onClick={() => handleAction(onOpenClassroomBattle)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">⚡ Live Classroom Battle (ห้องประลองสด)</span>
                    <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ข้อ</span>
                  </button>
                )}
                {onOpenBugHunter && (
                  <button
                    onClick={() => handleAction(onOpenBugHunter)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 flex items-center justify-between"
                  >
                    <span>🐞 ภารกิจล่าบั๊กประจำวัน (+15 EXP)</span>
                    <span className="text-[10px] bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded font-mono font-bold">6 ด่าน</span>
                  </button>
                )}
                {onOpenUnpluggedWorksheets && (
                  <button
                    onClick={() => handleAction(onOpenUnpluggedWorksheets)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 flex items-center justify-between"
                  >
                    <span>📄 คลังใบงาน Unplugged Coding (พิมพ์ A4)</span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">8 ใบงาน</span>
                  </button>
                )}
                {onOpenHeroCards && (
                  <button
                    onClick={() => handleAction(onOpenHeroCards)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🃏 สมุดการ์ดพลัง Coder Heroes 3D</span>
                    <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">12 ใบ</span>
                  </button>
                )}
                {onOpenCodeTracer && (
                  <button
                    onClick={() => handleAction(onOpenCodeTracer)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🔍 จำลองโค้ดทีละขั้น (Code Tracer)</span>
                    <span className="text-[10px] bg-cyan-200 dark:bg-cyan-900 px-1.5 py-0.5 rounded font-mono font-bold">6 โจทย์</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category 3: ห้องเรียน & วัดผล */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>หมวด 3: ห้องเรียน &amp; วัดผล</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">เลื่อนดู ↕</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1 overscroll-contain custom-scrollbar">
                {onOpenSmartExam && (
                  <button
                    onClick={() => handleAction(onOpenSmartExam)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">📝 สุ่มชุดข้อสอบ Smart Exam (พิมพ์ A4)</span>
                    <span className="text-[10px] bg-violet-200 dark:bg-violet-900 px-1.5 py-0.5 rounded font-mono font-bold">ใหม่</span>
                  </button>
                )}
                {onOpenStudentQRPass && (
                  <button
                    onClick={() => handleAction(onOpenStudentQRPass)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🪪 บัตรนักเรียน QR Pass &amp; สแกนเนอร์</span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">เช็คชื่อ</span>
                  </button>
                )}
                {onOpenRubricModal && (
                  <button
                    onClick={() => handleAction(onOpenRubricModal)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 flex items-center justify-between"
                  >
                    <span>📊 แบบประเมินตนเองรูบริกส์ (Rubric ว 4.2)</span>
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono">ใหม่</span>
                  </button>
                )}
                {onOpenParentTeacherKit && (
                  <button
                    onClick={() => handleAction(onOpenParentTeacherKit)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100/60 flex items-center justify-between"
                  >
                    <span>🖨️ ชุดพิมพ์ใบงาน QR &amp; คู่มือผู้ปกครอง</span>
                    <span className="text-[10px] bg-teal-200 dark:bg-teal-900 px-1.5 py-0.5 rounded font-mono">A4</span>
                  </button>
                )}
                {onOpenExamArena && (
                  <button
                    onClick={() => handleAction(onOpenExamArena)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 flex items-center justify-between"
                  >
                    <span>🏆 คลังข้อสอบ O-NET &amp; สสวท. ป.6 (ผังปี 69)</span>
                    <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">10 ชุด (100 ข้อ)</span>
                  </button>
                )}
                {onOpenDigitalPassport && (
                  <button
                    onClick={() => handleAction(onOpenDigitalPassport)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 flex items-center justify-between"
                  >
                    <span>📖 พาสปอร์ตการเรียนรู้ (Passport วีซ่า)</span>
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono">A4</span>
                  </button>
                )}
                {onOpenTeacherPlans && (
                  <button
                    onClick={() => handleAction(onOpenTeacherPlans)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 flex items-center justify-between"
                  >
                    <span>👨‍🏫 แผนการสอนครู (8 แผน ว 4.2)</span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono">สไลด์</span>
                  </button>
                )}
                <button
                  onClick={() => handleSelectTab('classroom')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'classroom' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🏫 ห้องเรียนเสมือน</span>
                </button>
                <button
                  onClick={() => handleSelectTab('buddySystem')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'buddySystem' ? 'bg-pink-600 text-white' : 'text-pink-700 dark:text-pink-300 hover:bg-pink-100/60'
                  }`}
                >
                  <span>👥 คู่หูเรียนรู้ (Buddy System)</span>
                  <span className="text-[10px] bg-pink-200 dark:bg-pink-900 px-1.5 py-0.5 rounded">ใหม่</span>
                </button>
                <button
                  onClick={() => handleSelectTab('leaderboard')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'leaderboard' ? 'bg-amber-500 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>👑 Leaderboard ทำเนียบผู้นำ</span>
                </button>
                <button
                  onClick={() => handleSelectTab('rewards')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'rewards' ? 'bg-amber-500 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🪙 สะสมแต้ม &amp; แลกรางวัล</span>
                </button>
                <button
                  onClick={() => handleSelectTab('didYouKnow')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'didYouKnow' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>💡 เรื่องน่ารู้ชวนคิด</span>
                </button>
                {onOpenAssessmentReport && (
                  <button
                    onClick={() => handleAction(onOpenAssessmentReport)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/60 flex items-center justify-between"
                  >
                    <span>🎓 รายงาน ปพ.5 ครู (CSV)</span>
                  </button>
                )}
                <button
                  onClick={() => handleAction(onOpenCertificate)}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 flex items-center justify-between"
                >
                  <span>📜 เกียรติบัตรการเรียน</span>
                </button>
                <button
                  onClick={() => handleSelectTab('profileManage')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    activeTab === 'profileManage' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                  }`}
                >
                  <span>👤 จัดการโปรไฟล์ผู้เรียน</span>
                </button>
                {onOpenGasExport && (
                  <button
                    onClick={() => handleAction(onOpenGasExport)}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 flex items-center justify-between"
                  >
                    <span>📤 ส่งออกโค้ดสำหรับ GAS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Profile & Logout on Mobile */}
            {isLoggedIn && onLogout && (
              <div className="pt-2">
                <button
                  onClick={() => handleAction(onLogout)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Slim Categorized Active Breadcrumb Ribbon (เมื่อไม่ได้อยู่ที่ Dashboard ช่วยให้ผู้เรียนทราบตำแหน่งปัจจุบันอย่างสะอาดตา) */}
      {activeTab !== 'dashboard' && (
        <div className="w-full bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6 lg:px-8 py-1.5 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => handleSelectTab('dashboard')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1 shrink-0"
              >
                <span>หน้าหลัก</span>
              </button>
              <span>/</span>
              {isModulesActive && (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                  หมวดบทเรียนหลัก
                </span>
              )}
              {isLabsActive && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold shrink-0">
                  หมวดแล็บ &amp; มินิเกม
                </span>
              )}
              {isSystemActive && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                  หมวดห้องเรียน &amp; วัดผล
                </span>
              )}
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {activeTab === 'learningMap' && '🧭 แผนที่การเรียนรู้'}
                {activeTab === 'safety' && '🛡️ 1. ความปลอดภัยดิจิทัล & PDPA'}
                {activeTab === 'thinking' && '🧩 2. คิดเป็นลำดับขั้น'}
                {activeTab === 'codingLab' && '💻 3. ปฏิบัติการ Scratch & Micro:bit'}
                {activeTab === 'showcase' && '🏆 4. แสดงผลงานและสะท้อนคิด'}
                {activeTab === 'teamBattle' && '⚔️ สนามประลองทีม (Team Battle Arena)'}
                {activeTab === 'juniorPlayground' && '💻 Junior Code Playground'}
                {activeTab === 'kidsAILab' && '🧠 Kids AI Lab'}
                {activeTab === 'classroom' && '🏫 ห้องเรียนเสมือน'}
                {activeTab === 'leaderboard' && '👑 Leaderboard ทำเนียบผู้นำ'}
                {activeTab === 'rewards' && '🪙 ศูนย์สะสมแต้ม & แลกรางวัล'}
                {activeTab === 'didYouKnow' && '💡 เรื่องน่ารู้ชวนคิด'}
                {activeTab === 'profileManage' && '👤 จัดการโปรไฟล์ผู้เรียน'}
                {activeTab === 'buddySystem' && '👥 คู่หูเรียนรู้ & ส่งกำลังใจ (Buddy System)'}
              </span>
            </div>

            <button
              onClick={() => handleSelectTab('dashboard')}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-3"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
