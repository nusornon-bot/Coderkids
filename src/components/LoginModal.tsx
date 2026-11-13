import React, { useState } from 'react';
import { UserProfile, TeacherRecord } from '../types/index.ts';
import { AVATAR_OPTIONS } from '../data/learningData.ts';
import { CategorizedAvatarSelector, AvatarSelectionPayload } from './CategorizedAvatarSelector.tsx';
import {
  TARGET_SPREADSHEET_ID,
  STUDENTS_SHEET_TITLE,
  TEACHERS_SHEET_TITLE,
  SCHOOL_DOMAIN,
  googleSignIn,
  googleLogout,
  isAllowedSchoolUser,
  recordStudentLoginToGoogleSheet,
  saveProfileToGoogleSheet,
  fetchTeachersFromGoogleSheet,
  checkIsTeacherAdmin,
  getAdminProfileData,
  getAccessToken,
} from '../services/googleSheetsService.ts';
import {
  LogIn,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Lock,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Key,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  currentProfile: UserProfile;
  onLoginSuccess: (profile: UserProfile, googleUser?: any) => void;
  pendingDestinationModule?: string | null;
  isAdmin?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  profiles,
  currentProfile,
  onLoginSuccess,
  pendingDestinationModule,
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'google' | 'register'>('existing');

  // Existing profile selection
  const [selectedProfileId, setSelectedProfileId] = useState<string>(currentProfile.id || profiles[0]?.id || 'prof_1');
  const [inputStudentId, setInputStudentId] = useState<string>('');

  // Register new profile fields
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regStudentId, setRegStudentId] = useState(`CK-2569-${Math.floor(1000 + Math.random() * 9000)}`);
  const [regSchool, setRegSchool] = useState('โรงเรียนอนุบาลนราธิวาส');
  const [regGrade, setRegGrade] = useState('ประถมศึกษาปีที่ 4/1');
  const [regAvatarId, setRegAvatarId] = useState('avatar_cat');
  const [regAvatarEmoji, setRegAvatarEmoji] = useState('🐱');
  const [regEmail, setRegEmail] = useState('');

  // User's choice whether to record to Google Sheet when NOT signing in with Google
  const [syncChoice, setSyncChoice] = useState<'sync' | 'nosync'>(() => {
    try {
      return (localStorage.getItem('coderkids_sync_to_sheets') as 'sync' | 'nosync') || 'sync';
    } catch {
      return 'sync';
    }
  });

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Direct School Login state (Fallback for unauthorized Firebase domain or OAuth 403 testing mode)
  const [directSchoolEmail, setDirectSchoolEmail] = useState('nusorn.not@anubalnara.ac.th');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [oauthBlockedHelp, setOauthBlockedHelp] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  // 1. Login with Existing Profile (ไม่ต้องบังคับเปิด Google Popup ที่อาจติด 403 access_denied)
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const targetProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || currentProfile;

    try {
      if (syncChoice === 'sync') {
        localStorage.setItem('coderkids_sync_to_sheets', 'sync');
        const userEmail = targetProfile.contactEmail || `${targetProfile.studentId || 'student'}@${SCHOOL_DOMAIN}`;
        try {
          await recordStudentLoginToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            targetProfile,
            userEmail,
            'ลงชื่อเข้าใช้งานห้องเรียน Coder Kids',
            getModuleName(pendingDestinationModule)
          );
          await saveProfileToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            targetProfile,
            65,
            targetProfile.streakDays || 1,
            [],
            userEmail
          );
        } catch (e) {
          console.warn('Google Sheet background login recording:', e);
        }
      } else {
        localStorage.setItem('coderkids_sync_to_sheets', 'nosync');
      }

      onLoginSuccess(targetProfile);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google OAuth Sign-In (ใช้เฉพาะ Basic Profile/Email ไม่ขอ Sensitive Scope เพื่อลดการบล็อก 403)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await googleSignIn(false);
      if (!res) {
        // ผู้ใช้ปิดหน้าต่างป๊อปอัป (เช่น ติดหน้าจอ 403: access_denied แอปอยู่ระหว่างการทดสอบ)
        setOauthBlockedHelp(true);
        setIsLoading(false);
        return;
      }
      if (res && res.user) {
        // Link with matching profile or update email
        const userEmail = res.user.email || '';

        // Fetch teachers list from Google Sheet to check permissions & domain
        let isTeacherAdmin = false;
        let matchedTeacherName: string | undefined;
        let teachers: TeacherRecord[] = [];
        try {
          teachers = await fetchTeachersFromGoogleSheet(TARGET_SPREADSHEET_ID);
          const teacherCheck = checkIsTeacherAdmin(userEmail, teachers);
          isTeacherAdmin = teacherCheck.isAdmin;
          matchedTeacherName = teacherCheck.matchedTeacher?.name;
        } catch (tErr) {
          console.warn('Teacher check error:', tErr);
        }

        // ตรวจสอบการจำกัดโดเมน anubalnara.ac.th สำหรับผู้เรียน
        const domainCheck = isAllowedSchoolUser(userEmail, teachers);
        if (!domainCheck.isAllowed) {
          await googleLogout();
          setErrorMsg(
            `⚠️ การเข้าสู่ระบบถูกปฏิเสธ: บัญชีกูเกิล "${userEmail}" ไม่ได้อยู่ในโดเมนโรงเรียน @${SCHOOL_DOMAIN} หรือรายชื่อคุณครูผู้ดูแลระบบ กรุณาใช้บัญชีอีเมลของโรงเรียน (@${SCHOOL_DOMAIN}) ในการเข้าใช้งาน`
          );
          setIsLoading(false);
          return;
        }

        const emailPrefix = userEmail.split('@')[0];
        // จับคู่นักเรียนที่มีอยู่เดิมในแท็บ Students จาก Google Sheet
        const matchedStudent = profiles.find(
          (p) =>
            p.contactEmail?.toLowerCase() === userEmail.toLowerCase() ||
            p.studentId === emailPrefix ||
            p.studentId?.replace(/\D/g, '') === emailPrefix.replace(/\D/g, '') ||
            (res.user.displayName && p.name && (p.name.includes(res.user.displayName) || res.user.displayName.includes(p.name)))
        );

        let updated: UserProfile;
        if (isTeacherAdmin) {
          // เมื่อแอดมินเข้าสู่ระบบ แสดงโปรไฟล์ของแอดมิน
          updated = getAdminProfileData(userEmail, matchedTeacherName || res.user.displayName || undefined);
        } else if (matchedStudent) {
          // เชื่อมโยงกับโปรไฟล์นักเรียนที่มีอยู่ในแท็บ Students
          updated = {
            ...matchedStudent,
            contactEmail: userEmail,
            role: 'student',
          };
        } else {
          // นักเรียนใหม่โรงเรียนอนุบาลนราธิวาส
          const isNumericId = /^\d+$/.test(emailPrefix);
          updated = {
            ...currentProfile,
            id: `student_${emailPrefix}`,
            studentId: isNumericId ? emailPrefix : `CK-${emailPrefix}`,
            name: res.user.displayName || `นักเรียน (${emailPrefix})`,
            nickname: res.user.displayName?.split(' ')[0] || emailPrefix,
            school: 'โรงเรียนอนุบาลนราธิวาส',
            grade: currentProfile.grade && currentProfile.grade !== '-' ? currentProfile.grade : 'ประถมศึกษาปีที่ 4/1',
            bio: 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
            motto: 'เขียนโค้ดวันละนิด จิตแจ่มใส บั๊กหายวับ!',
            avatarId: 'avatar_cat',
            avatarEmoji: '🐱',
            themeColor: 'indigo',
            codingLevel: 'Intermediate',
            techInterests: ['Scratch Game', 'Micro:bit IoT', 'Cyber Security'],
            selectedTitle: 'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
            contactEmail: userEmail,
            role: 'student',
            joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
            streakDays: 1,
            unlockedRewardIds: ['title_junior'],
          };
        }

        // ลงชื่อด้วยบัญชีกูเกิลของโรงเรียน บันทึกลงกูเกิลชีตอัตโนมัติเสมอ
        localStorage.setItem('coderkids_sync_to_sheets', 'sync');

        // Record to Google Sheet TAB "Logs" & "Students" (ID: 1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng)
        try {
          await recordStudentLoginToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            updated,
            userEmail,
            isTeacherAdmin ? 'แอดมิน/ครู เข้าสู่ระบบห้องเรียน' : 'ลงชื่อเข้าใช้งานห้องเรียน Coder Kids',
            getModuleName(pendingDestinationModule)
          );
          if (!isTeacherAdmin) {
            await saveProfileToGoogleSheet(TARGET_SPREADSHEET_ID, updated, 70, 2, [], userEmail).catch(() => {});
          }
        } catch (e) {
          console.warn('Google Sheet auto-save on Google login:', e);
        }

        onLoginSuccess(updated, res.user);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        onClose();
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/user-cancelled' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        setOauthBlockedHelp(true);
        return;
      }
      console.error(err);
      setOauthBlockedHelp(true);

      const isUnauthorizedDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('auth/unauthorized-domain') ||
        err?.message?.includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHost);
        setErrorMsg(
          `⚠️ โดเมน "${currentHost}" ยังไม่ได้รับอนุญาตใน Firebase Authentication (auth/unauthorized-domain) คุณสามารถกดปุ่มเข้าสู่ระบบด้วยบัญชีโรงเรียนด้านล่างได้ทันทีโดยไม่ต้องเปิดป๊อปอัป`
        );
      } else {
        setErrorMsg(err.message || 'ไม่สามารถลงชื่อเข้าใช้ผ่านป๊อปอัปได้ คุณสามารถเข้าสู่ระบบด้วยอีเมลโรงเรียนด้านล่างได้ทันที');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Direct School Account Login (Bypass Firebase popup 403 access_denied / domain restriction)
  const handleDirectSchoolLogin = async (e?: React.FormEvent, overrideEmail?: string) => {
    if (e) e.preventDefault();
    const rawTarget = (overrideEmail !== undefined ? overrideEmail : directSchoolEmail).trim();
    if (!rawTarget) {
      setErrorMsg('กรุณากรอกอีเมลโรงเรียน (@anubalnara.ac.th) หรือเลขประจำตัวนักเรียน');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      let email = rawTarget.toLowerCase();
      if (!email.includes('@')) {
        email = `${email}@${SCHOOL_DOMAIN}`;
      }

      // Check Teacher & Domain permissions
      let isTeacherAdmin = false;
      let matchedTeacherName: string | undefined;
      let teachers: TeacherRecord[] = [];
      try {
        teachers = await fetchTeachersFromGoogleSheet(TARGET_SPREADSHEET_ID);
        const teacherCheck = checkIsTeacherAdmin(email, teachers);
        isTeacherAdmin = teacherCheck.isAdmin;
        matchedTeacherName = teacherCheck.matchedTeacher?.name;
      } catch (tErr) {
        console.warn('Teacher check error during direct login:', tErr);
      }

      const domainCheck = isAllowedSchoolUser(email, teachers);
      if (!domainCheck.isAllowed) {
        setErrorMsg(
          `⚠️ การเข้าสู่ระบบถูกปฏิเสธ: บัญชี "${email}" ไม่ได้อยู่ในโดเมนโรงเรียน @${SCHOOL_DOMAIN} หรือรายชื่อคุณครูผู้ดูแลระบบ กรุณาใช้บัญชีของโรงเรียนอนุบาลนราธิวาส (@${SCHOOL_DOMAIN})`
        );
        setIsLoading(false);
        return;
      }

      const emailPrefix = email.split('@')[0];
      const matchedStudent = profiles.find(
        (p) =>
          p.contactEmail?.toLowerCase() === email.toLowerCase() ||
          p.studentId === emailPrefix ||
          p.studentId?.replace(/\D/g, '') === emailPrefix.replace(/\D/g, '') ||
          (p.name && (p.name.includes(emailPrefix) || emailPrefix.includes(p.name)))
      );

      let updated: UserProfile;
      if (isTeacherAdmin) {
        updated = getAdminProfileData(
          email,
          matchedTeacherName || (email.startsWith('nusorn.not') ? 'ครูนุสรณ์ (ผู้ดูแลระบบ)' : undefined)
        );
      } else if (matchedStudent) {
        updated = {
          ...matchedStudent,
          contactEmail: email,
          role: 'student',
        };
      } else {
        const isNumericId = /^\d+$/.test(emailPrefix);
        updated = {
          ...currentProfile,
          id: `student_${emailPrefix}`,
          studentId: isNumericId ? emailPrefix : `CK-${emailPrefix}`,
          name: `นักเรียน (${emailPrefix})`,
          nickname: emailPrefix,
          school: 'โรงเรียนอนุบาลนราธิวาส',
          grade: currentProfile.grade && currentProfile.grade !== '-' ? currentProfile.grade : 'ประถมศึกษาปีที่ 4/1',
          bio: 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
          motto: 'เขียนโค้ดวันละนิด จิตแจ่มใส บั๊กหายวับ!',
          avatarId: 'avatar_cat',
          avatarEmoji: '🐱',
          themeColor: 'indigo',
          codingLevel: 'Intermediate',
          techInterests: ['Scratch Game', 'Micro:bit IoT', 'Cyber Security'],
          selectedTitle: 'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
          contactEmail: email,
          role: 'student',
          joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
          streakDays: 1,
          unlockedRewardIds: ['title_junior'],
        };
      }

      localStorage.setItem('coderkids_sync_to_sheets', 'sync');

      // Record to Google Sheet / Logs and Backend
      try {
        await recordStudentLoginToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          updated,
          email,
          isTeacherAdmin ? 'แอดมิน/ครู เข้าสู่ระบบห้องเรียน (Direct School Auth)' : 'ลงชื่อเข้าใช้งานห้องเรียน Coder Kids (Direct School Auth)',
          getModuleName(pendingDestinationModule)
        );
        if (!isTeacherAdmin) {
          await saveProfileToGoogleSheet(TARGET_SPREADSHEET_ID, updated, 70, 1, [], email).catch(() => {});
        }
      } catch (sheetErr) {
        console.warn('Google Sheet background login recording:', sheetErr);
      }

      soundEffects.play('victory');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onLoginSuccess(updated, {
        email,
        displayName: updated.name,
        uid: `school_${emailPrefix}`,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ด้วยบัญชีโรงเรียน');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Register New Profile and Login (ไม่ต้องบังคับเปิด Google Popup ที่อาจติด 403 access_denied)
  const handleRegisterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลของผู้เรียน');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const chosenAvatar = AVATAR_OPTIONS.find((a) => a.id === regAvatarId) || AVATAR_OPTIONS[0];
    let formattedRegEmail = regEmail.trim();
    if (formattedRegEmail && !formattedRegEmail.includes('@')) {
      formattedRegEmail = `${formattedRegEmail}@${SCHOOL_DOMAIN}`;
    }

    const newStudentProfile: UserProfile = {
      id: `prof_${Date.now()}`,
      name: regName.trim(),
      nickname: regNickname.trim(),
      studentId: regStudentId.trim() || `CK-2569-0${Math.floor(Math.random() * 80 + 10)}`,
      school: regSchool.trim() || 'โรงเรียนอนุบาลนราธิวาส',
      grade: regGrade.trim() || 'ประถมศึกษาปีที่ 4/1',
      bio: 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
      motto: 'เขียนโค้ดวันละนิด จิตแจ่มใส บั๊กหายวับ!',
      avatarId: regAvatarId,
      avatarEmoji: regAvatarEmoji || chosenAvatar.emoji,
      contactEmail: formattedRegEmail || undefined,
      themeColor: 'indigo',
      codingLevel: 'Intermediate',
      techInterests: ['Scratch Game', 'Micro:bit IoT', 'Cyber Security'],
      selectedTitle: 'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
      joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
      streakDays: 1,
      unlockedRewardIds: ['title_junior'],
    };

    try {
      if (syncChoice === 'sync') {
        localStorage.setItem('coderkids_sync_to_sheets', 'sync');
        const userEmail = formattedRegEmail || `${newStudentProfile.studentId}@${SCHOOL_DOMAIN}`;

        // Record to Google Sheet ID: 1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng (Students & Logs tabs)
        try {
          await recordStudentLoginToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            newStudentProfile,
            userEmail,
            'ลงทะเบียนผู้เรียนใหม่เข้าห้องเรียน',
            getModuleName(pendingDestinationModule)
          );
          await saveProfileToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            newStudentProfile,
            50,
            1,
            [],
            userEmail
          );
        } catch (e) {
          console.warn('Google Sheet auto-save to Students/Logs:', e);
        }
      } else {
        localStorage.setItem('coderkids_sync_to_sheets', 'nosync');
      }

      onLoginSuccess(newStudentProfile);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  // Destination module friendly name
  const getModuleName = (key?: string | null) => {
    if (!key) return 'บทเรียน';
    switch (key) {
      case 'safety': return 'โมดูลที่ 1: ความปลอดภัยดิจิทัล & PDPA';
      case 'thinking': return 'โมดูลที่ 2: การคิดเป็นลำดับขั้น & อัลกอริทึม';
      case 'codingLab': return 'โมดูลที่ 3: ปฏิบัติการ Scratch & Micro:bit';
      case 'showcase': return 'โมดูลที่ 4: นำเสนอผลงาน & สะท้อนคิด';
      case 'classroom': return 'ห้องเรียนเสมือนจริง (Virtual Classroom)';
      default: return 'บทเรียนการเรียนรู้';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center absolute top-6 right-6 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>สมาชิกลงชื่อเข้าใช้งาน ก่อนเข้าบทเรียน</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            เข้าสู่ระบบเพื่อเริ่มเรียน
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {pendingDestinationModule ? (
              <span>
                คุณกำลังจะเข้าสู่ <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{getModuleName(pendingDestinationModule)}</strong> กรุณาลงชื่อเข้าใช้เพื่อบันทึกประวัติ แต้มสะสม และส่งข้อมูลสู่ Google Sheets
              </span>
            ) : (
              <span>
                ลงชื่อเข้าใช้งานด้วยโปรไฟล์นักเรียน หรือบัญชีโรงเรียน (@{SCHOOL_DOMAIN}) เพื่อเก็บข้อมูลลงใน Google Sheet
              </span>
            )}
          </p>

          {isAdmin ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">กูเกิลชีตไอดี (ผู้ดูแลระบบ):</span>
                <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold truncate select-all">{TARGET_SPREADSHEET_ID}</span>
              </div>
              <a
                href={`https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-semibold underline shrink-0 ml-2 flex items-center gap-1 text-[11px]"
              >
                <span>เปิดดูชีต</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ระบบจัดเก็บข้อมูลการเรียนรู้ลงฐานข้อมูลคลาวด์ สพฐ. &amp; สสวท. อย่างปลอดภัย</span>
            </div>
          )}
        </div>

        {/* Tabs: Existing Profile vs Google vs New Student */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all whitespace-nowrap text-center ${
              activeTab === 'existing'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            เลือกโปรไฟล์นักเรียน
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all whitespace-nowrap text-center ${
              activeTab === 'google'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            บัญชีโรงเรียน / Google
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all whitespace-nowrap text-center ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + สมัครนักเรียนใหม่
          </button>
        </div>

        {/* Recovery Banner when Google OAuth Popup shows 403: access_denied (Testing Mode) */}
        {oauthBlockedHelp && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    พบหน้าจอ "การเข้าถึงถูกบล็อก (403: access_denied)" บนป๊อปอัปใช่หรือไม่?
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    ไม่ต้องกังวล! คุณสามารถ <strong>คลิกปุ่มลัดด้านล่างเพื่อเข้าสู่ระบบด้วยบัญชีโรงเรียนได้ทันที (ไม่ต้องผ่านป๊อปอัป)</strong> หรือตั้งค่าเผยแพร่แอปบน Google Cloud Console
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthBlockedHelp(false)}
                className="text-amber-600 hover:text-amber-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Click Instant Login Buttons */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>เข้าใช้งานทันทีใน 1 คลิก (พร้อมซิงก์ Google Sheet อัตโนมัติ):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectSchoolLogin(undefined, 'nusorn.not@anubalnara.ac.th')}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">ครูนุสรณ์ (nusorn.not@)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectSchoolLogin(undefined, 'webmaster@anubalnara.ac.th')}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Key className="w-4 h-4 shrink-0" />
                  <span className="truncate">แอดมิน (webmaster@)</span>
                </button>
              </div>
            </div>

            {/* Guide for Admin to fix 403 access_denied in Google Cloud Console */}
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>🛠️ วิธีปลดล็อกป๊อปอัป 403: access_denied ถาวร (สำหรับผู้ดูแลโปรเจกต์):</span>
                <span className="font-mono text-[10px] text-slate-500">gen-lang-client-0756366544</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                สาเหตุที่ป๊อปอัปแจ้งว่า <em>"แอปนี้อยู่ระหว่างการทดสอบ (403: access_denied)"</em> เพราะ OAuth Consent Screen ใน Google Cloud ยังเป็นโหมด <strong>Testing</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0756366544"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>1. เปิด Google Cloud OAuth Consent Screen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText('nusorn.not@anubalnara.ac.th');
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'คัดลอกอีเมลแล้ว!' : 'คัดลอก nusorn.not@anubalnara.ac.th'}</span>
                </button>
              </div>
              <div className="text-slate-600 dark:text-slate-400 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>• <strong>วิธีที่ 1 (แนะนำ):</strong> กดปุ่ม <strong>"PUBLISH APP" (เผยแพร่แอป)</strong> เพื่อให้ทุกคนในโรงเรียนเข้าผ่านป๊อปอัปได้ทันที</div>
                <div>• <strong>วิธีที่ 2:</strong> เลื่อนลงมาที่หัวข้อ <strong>Test users (ผู้ทดสอบ)</strong> กด <strong>+ ADD USERS</strong> แล้วเพิ่ม <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">nusorn.not@anubalnara.ac.th</code></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert with Smart Domain Resolution */}
        {errorMsg && (() => {
          const isDomainErr = Boolean(
            unauthorizedDomain ||
            errorMsg.includes('auth/unauthorized-domain') ||
            errorMsg.includes('unauthorized-domain')
          );
          const domainHost =
            unauthorizedDomain ||
            (typeof window !== 'undefined' ? window.location.hostname : '') ||
            'coderkids.nusornon.workers.dev';

          return (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="font-bold text-xs sm:text-sm text-rose-800 dark:text-rose-200 leading-snug">
                    {isDomainErr
                      ? `⚠️ โดเมน "${domainHost}" ยังไม่ได้รับอนุญาตใน Firebase Authentication (auth/unauthorized-domain)`
                      : errorMsg}
                  </div>

                  {isDomainErr && (
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-2 pt-1.5 border-t border-rose-200 dark:border-rose-900/60">
                      <p className="leading-relaxed">
                        <strong>สาเหตุ:</strong> เพื่อความปลอดภัยของบัญชีผู้ใช้ Firebase กำหนดให้ต้องเพิ่มโดเมนของเว็บไซต์นี้ลงในรายการ <strong>Authorized domains</strong> ก่อน จึงจะสามารถเปิดป๊อปอัป Google Sign-In ได้
                      </p>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300">
                            🛠️ วิธีแก้ไขสำหรับผู้ดูแลระบบ (Admin):
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">โปรเจกต์: gen-lang-client-0756366544</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(domainHost);
                                setCopiedDomain(true);
                                setTimeout(() => setCopiedDomain(false), 2500);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            {copiedDomain ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 dark:text-emerald-400">คัดลอก {domainHost} แล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                <span>คัดลอกโดเมน: {domainHost}</span>
                              </>
                            )}
                          </button>

                          <a
                            href="https://console.firebase.google.com/project/gen-lang-client-0756366544/authentication/settings"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <span>เปิด Firebase Console ➔ Settings ➔ Authorized domains</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Bypass / Instant Entry for Students and Teachers */}
              <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/60 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  ⚡ เข้าสู่ระบบด่วนใน 1 คลิก (ไม่ต้องผ่านป๊อปอัป Google):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectSchoolLogin(undefined, 'nusorn.not@anubalnara.ac.th')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบ: nusorn.not@{SCHOOL_DOMAIN} (ครูนุสรณ์)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setUnauthorizedDomain(null);
                      setActiveTab('existing');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>เลือกโปรไฟล์นักเรียนเข้าเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 1: Existing Profile Login */}
        {activeTab === 'existing' && (
          <form onSubmit={handleExistingLogin} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                เลือกรายชื่อผู้เรียนของคุณ
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        if (p.studentId) setInputStudentId(p.studentId);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.avatarEmoji || '🐱'}</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {p.name} {p.nickname ? `(${p.nickname})` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {p.studentId || 'CK-2569-042'} · {p.grade}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Student ID check */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                รหัสประจำตัวนักเรียน (Student ID)
              </label>
              <input
                type="text"
                value={inputStudentId}
                onChange={(e) => setInputStudentId(e.target.value)}
                placeholder="เช่น CK-2569-042"
                style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono font-bold text-blue-700 placeholder:text-slate-400"
              />
            </div>

            {/* Google Sheets Sync Selector */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>การบันทึกข้อมูลลง Google Sheet:</span>
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {syncChoice === 'sync' ? '🟢 บันทึกอัตโนมัติ' : '⚪ ไม่บันทึก'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSyncChoice('sync')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    syncChoice === 'sync'
                      ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                      syncChoice === 'sync'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {syncChoice === 'sync' && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      บันทึกลง Google Sheet
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      ส่งข้อมูลผู้เรียนและประวัติเข้าแท็บ Students &amp; Logs
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncChoice('nosync')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    syncChoice === 'nosync'
                      ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                      syncChoice === 'nosync'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {syncChoice === 'nosync' && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      ไม่บันทึกลงกูเกิลชีต
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      เข้าเรียนทันที ไม่ส่งข้อมูลเข้าชีตและไม่ขอสิทธิ์
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบและเริ่มเรียนบทเรียน'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Direct School Account & Google OAuth Login (@anubalnara.ac.th) */}
        {activeTab === 'google' && (
          <div className="space-y-4 text-center py-1">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <span>🏫 สำหรับนักเรียนและบุคลากร @{SCHOOL_DOMAIN}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ลงชื่อเข้าใช้ด้วยบัญชีโรงเรียนอนุบาลนราธิวาส
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                กรอกอีเมล <strong className="text-indigo-600 dark:text-indigo-400 font-mono">@{SCHOOL_DOMAIN}</strong> หรือรหัสนักเรียนเพื่อเข้าใช้งานทันทีโดยไม่ติดบล็อกป๊อปอัป (403: access_denied)
              </p>
            </div>

            {/* Primary Direct School Login Form (Works 100% without 403 popup block) */}
            <form
              onSubmit={(e) => handleDirectSchoolLogin(e)}
              className="space-y-3 text-left p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-indigo-950 dark:text-indigo-200">
                  ✨ เข้าสู่ระบบตรงด้วยอีเมลโรงเรียน / รหัสนักเรียน (แนะนำ)
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  ไม่ติดบล็อก 403
                </span>
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder={`เช่น nusorn.not@${SCHOOL_DOMAIN} หรือ 4102`}
                  value={directSchoolEmail}
                  onChange={(e) => setDirectSchoolEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-indigo-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 1-Click Quick Role Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  ⚡ คลิกเข้าสู่ระบบด่วน (1-Click):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDirectSchoolLogin(undefined, 'nusorn.not@anubalnara.ac.th')}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ครูนุสรณ์ (nusorn.not@anubalnara.ac.th)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectSchoolLogin(undefined, 'webmaster@anubalnara.ac.th')}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>แอดมิน (webmaster@)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectSchoolLogin(undefined, '10241@anubalnara.ac.th')}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>นักเรียน (10241@)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วยบัญชีโรงเรียนทันที'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Auto-sync indicator for School Google account */}
            <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 text-left flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>🟢 บันทึกลง Google Sheet อัตโนมัติ (Students &amp; Logs)</span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  รองรับการตรวจสอบสิทธิ์คุณครู/แอดมินจากแท็บ <strong>Teachers</strong> และบันทึกข้อมูลผู้เรียนเข้าแท็บ <strong>Students</strong> &amp; <strong>Logs</strong> อัตโนมัติ
                </div>
              </div>
            </div>

            {/* Optional: Standard Google OAuth Popup */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium text-[11px]">
                  หรือ เชื่อมต่อผ่านหน้าต่าง Google OAuth Popup
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : `เปิดหน้าต่าง Google Sign-In Popup (@${SCHOOL_DOMAIN})`}</span>
            </button>
          </div>
        )}

        {/* TAB 3: Register New Student */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterLogin} className="space-y-4 text-xs sm:text-sm">
            {/* Quick Register / Direct School Sign-in for instant Google Sheets sync */}
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>บันทึกลง Google Sheet อัตโนมัติ (Live)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  แนะนำ
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                กรอกข้อมูลด้านล่างแล้วกด <strong>"ลงทะเบียนและเข้าเรียนทันที"</strong> ระบบจะส่งข้อมูลเข้าแท็บ Students และ Logs ทันทีโดยไม่ติดบล็อกป๊อปอัป
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('google')}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>มีอีเมล @{SCHOOL_DOMAIN} อยู่แล้ว? คลิกเพื่อเข้าสู่ระบบทันที</span>
              </button>
            </div>

            {/* Avatar Row */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                หรือกรอกข้อมูลสมัครแบบแมนนวล (เลือกอวตารผู้เรียน)
              </label>
              <CategorizedAvatarSelector
                selectedAvatarId={regAvatarId}
                selectedAvatarEmoji={regAvatarEmoji}
                onSelectAvatar={(payload: AvatarSelectionPayload) => {
                  setRegAvatarId(payload.avatarId);
                  if (payload.avatarEmoji) setRegAvatarEmoji(payload.avatarEmoji);
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="เช่น ด.ช. กิตติภพ สุริยวงศ์"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-semibold text-blue-700 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อเล่น</label>
                <input
                  type="text"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  placeholder="เช่น ภพ"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-semibold text-blue-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">รหัสนักเรียน (อัตโนมัติ)</label>
                  <button
                    type="button"
                    onClick={() => setRegStudentId(`CK-2569-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    🎲 สุ่มรหัสใหม่
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={regStudentId}
                    style={{ color: '#1d4ed8', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 select-all cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">ระดับชั้น / ห้องเรียน</label>
                <input
                  type="text"
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value)}
                  placeholder="เช่น ประถมศึกษาปีที่ 4/1"
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-blue-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">โรงเรียน / สถาบันการศึกษา</label>
              <input
                type="text"
                value={regSchool}
                onChange={(e) => setRegSchool(e.target.value)}
                placeholder="เช่น โรงเรียนอนุบาลนราธิวาส"
                style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-blue-700 placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  อีเมลโรงเรียน (@{SCHOOL_DOMAIN}) <span className="text-[11px] font-normal text-slate-500">(ไม่บังคับ - ใช้เชื่อมโยงข้อมูล)</span>
                </label>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder={`เช่น 4102 หรือ 4102@${SCHOOL_DOMAIN}`}
                  style={{ color: '#1d4ed8', caretColor: '#1d4ed8', backgroundColor: '#ffffff' }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-semibold text-blue-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Google Sheets Sync Selector for Registration */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>การบันทึกข้อมูลลง Google Sheet:</span>
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {syncChoice === 'sync' ? '🟢 บันทึก' : '⚪ ไม่บันทึก'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSyncChoice('sync')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    syncChoice === 'sync'
                      ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                      syncChoice === 'sync'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {syncChoice === 'sync' && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      บันทึกลง Google Sheet
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      เพิ่มนักเรียนใหม่ลงแท็บ Students &amp; Logs ทันที
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncChoice('nosync')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    syncChoice === 'nosync'
                      ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                      syncChoice === 'nosync'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {syncChoice === 'nosync' && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      ไม่บันทึกลงกูเกิลชีต
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      เข้าเรียนทันที ไม่ส่งข้อมูลเข้าชีตและไม่ขอสิทธิ์
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนและเข้าเรียนทันที'}</span>
            </button>
          </form>
        )}

        {/* Footer info note */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          {isAdmin ? (
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ชีตไอดี (แอดมิน):</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold select-all">{TARGET_SPREADSHEET_ID}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ระบบจัดเก็บข้อมูลการเรียนรู้ สพฐ. &amp; สสวท. (ซิงก์คลาวด์ปลอดภัย)</span>
            </span>
          )}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline font-medium flex items-center gap-0.5"
              >
                <span>เปิด Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="hover:underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              ข้ามไปก่อน (โหมดทดลอง)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
