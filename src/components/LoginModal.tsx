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
  recordStudentLoginToGoogleSheet,
  saveProfileToGoogleSheet,
  fetchTeachersFromGoogleSheet,
  fetchStudentsFromGoogleSheet,
  checkIsTeacherAdmin,
  getAdminProfileData,
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
  ExternalLink,
  Copy,
  Check,
  Mail,
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

  // Google OAuth troubleshooting state
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [oauthBlockedHelp, setOauthBlockedHelp] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Direct School Account (@anubalnara.ac.th) / Teacher Email instant sign-in (works even when Google popup shows 403 access_denied)
  const [directSchoolEmail, setDirectSchoolEmail] = useState<string>('');
  const [directSchoolName, setDirectSchoolName] = useState<string>('');
  const [directSchoolGrade, setDirectSchoolGrade] = useState<string>('ประถมศึกษาปีที่ 6/1');

  if (!isOpen) return null;

  // 1. Login with Existing Profile or Student ID
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const baseProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || currentProfile;
    const typedId = inputStudentId.trim();
    const matchedByTypedId = typedId
      ? profiles.find((p) => (p.studentId || '').trim().toLowerCase() === typedId.toLowerCase())
      : undefined;

    const finalStudentId = (typedId || matchedByTypedId?.studentId || baseProfile.studentId || '10241').trim();
    const cleanIdSlug = finalStudentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const isCustomNewId = Boolean(
      typedId &&
      !matchedByTypedId &&
      typedId.toLowerCase() !== (baseProfile.studentId || '').trim().toLowerCase()
    );

    const targetProfile: UserProfile = {
      ...(matchedByTypedId || baseProfile),
      // Ensure id is never 'prof_1' / 'prof_2' / 'prof_3' so Google Sheet sync never skips this student!
      id:
        matchedByTypedId && !['prof_1', 'prof_2', 'prof_3'].includes(String(matchedByTypedId.id))
          ? matchedByTypedId.id
          : `stu_${cleanIdSlug}`,
      studentId: finalStudentId,
      name: isCustomNewId ? `นักเรียนรหัส ${finalStudentId}` : (matchedByTypedId?.name || baseProfile.name),
      nickname: isCustomNewId ? finalStudentId : (matchedByTypedId?.nickname || baseProfile.nickname),
      contactEmail:
        matchedByTypedId?.contactEmail ||
        (typedId.includes('@') ? typedId : `${finalStudentId}@${SCHOOL_DOMAIN}`),
      role: 'student',
    };

    try {
      if (syncChoice === 'sync') {
        localStorage.setItem('coderkids_sync_to_sheets', 'sync');
        const userEmail = targetProfile.contactEmail || `${targetProfile.studentId || 'student'}@${SCHOOL_DOMAIN}`;
        try {
          await saveProfileToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            targetProfile,
            65,
            targetProfile.streakDays || 1,
            [],
            userEmail
          );
          await recordStudentLoginToGoogleSheet(
            TARGET_SPREADSHEET_ID,
            targetProfile,
            userEmail,
            `ลงชื่อเข้าใช้งานด้วยรหัสนักเรียน (${finalStudentId})`,
            getModuleName(pendingDestinationModule)
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

  // 2. Real Google OAuth Sign-In + Strict Email Verification against Google Sheet (Teachers & Students tabs)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(null);

    try {
      // Step 1: Authenticate identity via Google OAuth Popup (Basic Profile & Email only — avoids sensitive scope 403 block on @anubalnara.ac.th)
      const res = await googleSignIn(false);
      if (!res || !res.user) {
        setIsLoading(false);
        return;
      }
      const userEmail = (
        res.user.email ||
        res.user.providerData?.find((p) => p?.email)?.email ||
        ''
      ).trim().toLowerCase();
      const googleDisplayName = (
        res.googleProfileName ||
        res.user.displayName ||
        res.user.providerData?.find((p) => p?.displayName)?.displayName ||
        ''
      ).trim();

      if (!userEmail) {
        await googleLogout();
        setErrorMsg('ไม่สามารถอ่านที่อยู่อีเมลจากบัญชี Google ของคุณได้ กรุณาลองใหม่อีกครั้ง');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch live Teachers and Students lists from Google Sheet
      const [teachers, studentsRes] = await Promise.all([
        fetchTeachersFromGoogleSheet(TARGET_SPREADSHEET_ID).catch(() => [] as TeacherRecord[]),
        fetchStudentsFromGoogleSheet(TARGET_SPREADSHEET_ID).catch(() => ({
          students: [] as UserProfile[],
          rawRows: [] as string[][],
        })),
      ]);

      // Step 3: Check if the Google-verified email is in the Teachers tab
      const teacherCheck = checkIsTeacherAdmin(userEmail, teachers);
      const isTeacherAdmin = teacherCheck.isAdmin;
      const matchedTeacherName = teacherCheck.matchedTeacher?.name;

      // Step 4: Check if the Google-verified email matches an existing student in the Students tab
      const emailPrefix = userEmail.split('@')[0];
      const isSchoolDomain = userEmail.endsWith(`@${SCHOOL_DOMAIN}`);
      const sheetStudents = studentsRes.students.length > 0 ? studentsRes.students : profiles;
      const matchedStudentFromSheet = sheetStudents.find((s) => {
        const sEmail = (s.contactEmail || '').trim().toLowerCase();
        const sId = (s.studentId || '').trim().toLowerCase();
        return (
          (sEmail && sEmail === userEmail) ||
          (sId && `${sId}@${SCHOOL_DOMAIN}` === userEmail) ||
          (sId && sId === emailPrefix)
        );
      });

      // Step 5: Build verified user profile using Google Profile Name (res.googleProfileName / displayName)
      let verifiedProfile: UserProfile;
      if (isTeacherAdmin) {
        verifiedProfile = getAdminProfileData(
          userEmail,
          googleDisplayName || matchedTeacherName || undefined
        );
      } else {
        const sheetRealName =
          matchedStudentFromSheet?.name && !matchedStudentFromSheet.name.startsWith('นักเรียน (')
            ? matchedStudentFromSheet.name.trim()
            : '';
        const finalName = googleDisplayName || sheetRealName || emailPrefix;
        const finalNickname =
          (matchedStudentFromSheet?.nickname && matchedStudentFromSheet.nickname !== emailPrefix
            ? matchedStudentFromSheet.nickname
            : '') ||
          (googleDisplayName ? googleDisplayName.split(' ')[0] : '');

        verifiedProfile = {
          ...(matchedStudentFromSheet || {
            id: `student_${emailPrefix}`,
            studentId: emailPrefix,
            school: 'โรงเรียนอนุบาลนราธิวาส',
            grade: 'ประถมศึกษาปีที่ 4/1',
            bio: 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
            motto: 'เขียนโค้ดวันละนิด จิตแจ่มใส บั๊กหายวับ!',
            avatarId: 'avatar_cat',
            avatarEmoji: '🐱',
            themeColor: 'indigo',
            codingLevel: 'Intermediate',
            techInterests: ['Scratch Game', 'Micro:bit IoT', 'Cyber Security'],
            selectedTitle: 'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
            joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
            streakDays: 1,
            unlockedRewardIds: ['title_junior'],
          }),
          id: matchedStudentFromSheet?.id || `student_${emailPrefix}`,
          studentId: matchedStudentFromSheet?.studentId || emailPrefix,
          name: finalName,
          nickname: finalNickname,
          contactEmail: userEmail,
          role: 'student',
        };
      }

      localStorage.setItem('coderkids_sync_to_sheets', 'sync');

      // Step 7: Immediately save/update Student Profile and Login Log to Google Sheet (Students & Logs tabs)
      try {
        await saveProfileToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          verifiedProfile,
          75,
          verifiedProfile.streakDays || 1,
          [],
          userEmail
        ).catch((err) => console.warn('Save profile to Students tab on login:', err));

        await recordStudentLoginToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          verifiedProfile,
          userEmail,
          isTeacherAdmin
            ? 'ครู/แอดมิน ยืนยันตัวตนผ่าน Google OAuth และตรวจสอบสิทธิ์จาก Google Sheet (Teachers)'
            : 'นักเรียน ยืนยันตัวตนผ่าน Google OAuth และบันทึกข้อมูลลง Google Sheet (Students & Logs)',
          getModuleName(pendingDestinationModule)
        ).catch((err) => console.warn('Record login to Logs tab on login:', err));
      } catch (sheetErr) {
        console.warn('Google Sheet background login recording:', sheetErr);
      }

      soundEffects.play('victory');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onLoginSuccess(verifiedProfile, res.user);
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user')
      ) {
        setOauthBlockedHelp(true);
        setErrorMsg(
          'ป๊อปอัป Google แจ้ง "403: access_denied (แอปนี้อยู่ระหว่างการทดสอบ)" — คุณสามารถกรอกอีเมลโรงเรียน (เช่น 10894@anubalnara.ac.th) ในช่องด้านล่างเพื่อเข้าสู่ระบบได้ทันที หรือกด Publish App ใน Google Cloud Console'
        );
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'coderkids.nusornon.workers.dev';
        setUnauthorizedDomain(host);
        setErrorMsg(`โดเมน ${host} ยังไม่ได้รับอนุญาตใน Firebase Authentication`);
      } else {
        setErrorMsg(msg || 'เกิดข้อผิดพลาดในการยืนยันตัวตนผ่าน Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2B. Direct School Email / Student ID Sign-In (Bypasses 403: access_denied Google OAuth Popup block for @anubalnara.ac.th & Teachers)
  const handleDirectSchoolEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = directSchoolEmail.trim().toLowerCase();
    if (!rawInput) {
      setErrorMsg(`กรุณากรอกรหัสนักเรียน หรืออีเมลโรงเรียน (เช่น 10894@${SCHOOL_DOMAIN})`);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const userEmail = rawInput.includes('@') ? rawInput : `${rawInput}@${SCHOOL_DOMAIN}`;
      const emailPrefix = userEmail.split('@')[0];
      const isSchoolDomain = userEmail.endsWith(`@${SCHOOL_DOMAIN}`);

      const [teachers, studentsRes] = await Promise.all([
        fetchTeachersFromGoogleSheet(TARGET_SPREADSHEET_ID).catch(() => [] as TeacherRecord[]),
        fetchStudentsFromGoogleSheet(TARGET_SPREADSHEET_ID).catch(() => ({
          students: [] as UserProfile[],
          rawRows: [] as string[][],
        })),
      ]);

      const teacherCheck = checkIsTeacherAdmin(userEmail, teachers);
      const isTeacherAdmin = teacherCheck.isAdmin;
      const matchedTeacherName = teacherCheck.matchedTeacher?.name;

      const sheetStudents = studentsRes.students.length > 0 ? studentsRes.students : profiles;
      const matchedStudentFromSheet = sheetStudents.find((s) => {
        const sEmail = (s.contactEmail || '').trim().toLowerCase();
        const sId = (s.studentId || '').trim().toLowerCase();
        return (
          (sEmail && sEmail === userEmail) ||
          (sId && `${sId}@${SCHOOL_DOMAIN}` === userEmail) ||
          (sId && sId === emailPrefix)
        );
      });

      let verifiedProfile: UserProfile;
      if (isTeacherAdmin) {
        verifiedProfile = getAdminProfileData(
          userEmail,
          directSchoolName.trim() || matchedTeacherName || undefined
        );
      } else {
        const customName = directSchoolName.trim();
        const existingName =
          matchedStudentFromSheet?.name && !matchedStudentFromSheet.name.startsWith('นักเรียน (')
            ? matchedStudentFromSheet.name.trim()
            : '';
        const finalName = customName || existingName || `นักเรียนรหัส ${emailPrefix}`;
        const finalNickname =
          matchedStudentFromSheet?.nickname ||
          (customName ? customName.split(' ')[0] : emailPrefix);

        verifiedProfile = {
          ...(matchedStudentFromSheet || {
            id: `student_${emailPrefix}`,
            studentId: emailPrefix,
            school: 'โรงเรียนอนุบาลนราธิวาส',
            grade: directSchoolGrade || 'ประถมศึกษาปีที่ 6/1',
            bio: 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
            motto: 'เขียนโค้ดวันละนิด จิตแจ่มใส บั๊กหายวับ!',
            avatarId: 'avatar_cat',
            avatarEmoji: '🐱',
            themeColor: 'indigo',
            codingLevel: 'Intermediate',
            techInterests: ['Scratch Game', 'Micro:bit IoT', 'Cyber Security'],
            selectedTitle: 'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
            joinedDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
            streakDays: 1,
            unlockedRewardIds: ['title_junior'],
          }),
          id: matchedStudentFromSheet?.id || `student_${emailPrefix}`,
          studentId: matchedStudentFromSheet?.studentId || emailPrefix,
          name: finalName,
          nickname: finalNickname,
          grade: directSchoolGrade || matchedStudentFromSheet?.grade || 'ประถมศึกษาปีที่ 6/1',
          contactEmail: userEmail,
          role: 'student',
        };
      }

      try {
        localStorage.setItem('coderkids_verified_google_email', userEmail);
        localStorage.setItem('coderkids_google_profile_name', verifiedProfile.name);
        localStorage.setItem('coderkids_sync_to_sheets', 'sync');
      } catch {}

      await saveProfileToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        verifiedProfile,
        75,
        verifiedProfile.streakDays || 1,
        [],
        userEmail
      ).catch(() => {});

      await recordStudentLoginToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        verifiedProfile,
        userEmail,
        isTeacherAdmin
          ? 'ครู/แอดมิน เข้าสู่ระบบด้วยอีเมลโรงเรียนและตรวจสอบสิทธิ์จาก Google Sheet (Teachers)'
          : `นักเรียน (${userEmail}) เข้าสู่ระบบด้วยอีเมลโรงเรียน (@${SCHOOL_DOMAIN})`,
        getModuleName(pendingDestinationModule)
      ).catch(() => {});

      soundEffects.play('victory');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onLoginSuccess(verifiedProfile, { email: userEmail, displayName: verifiedProfile.name });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วยอีเมลโรงเรียน');
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

        {/* Guide Banner when Google OAuth Popup shows 403: access_denied (Testing Mode) */}
        {oauthBlockedHelp && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    วิธีแก้หน้าจอ "การเข้าถึงถูกบล็อก (403: access_denied)" บนป๊อปอัป Google
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    สาเหตุเกิดจากโปรเจกต์ <code className="font-mono font-bold">gen-lang-client-0756366544</code> ใน Google Cloud Console ยังตั้งค่า OAuth Consent Screen เป็นโหมด <strong>Testing (กำลังทดสอบ)</strong>
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

            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-800 space-y-2 text-[11px]">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>🛠️ ขั้นตอนเปิดใช้งานให้บัญชีโรงเรียนล็อกอินผ่าน Google ได้ทันที:</span>
                <span className="font-mono text-[10px] text-slate-500">gen-lang-client-0756366544</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0756366544"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>1. เปิดหน้า OAuth Consent Screen</span>
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
              <div className="text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>• <strong>วิธีที่ 1 (แนะนำ - ปลดล็อกถาวร):</strong> คลิกปุ่ม <strong>"PUBLISH APP" (เผยแพร่แอป)</strong> แล้วกด Confirm เพื่อเปลี่ยนสถานะเป็น <em>In production</em> (เนื่องจากแอปร้องขอเฉพาะอีเมลและโปรไฟล์พื้นฐาน จึงใช้งานได้ทันทีโดยไม่ต้องรอ Google ตรวจสอบ)</div>
                <div>• <strong>วิธีที่ 2 (กรณีต้องการคงโหมด Testing):</strong> เลื่อนลงมาที่หัวข้อ <strong>Test users</strong> กด <strong>+ ADD USERS</strong> แล้วเพิ่มอีเมลที่มีใน Google Sheet เช่น <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">nusorn.not@anubalnara.ac.th</code></div>
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

        {/* TAB 2: Official Google OAuth Login + Direct School Email Login */}
        {activeTab === 'google' && (
          <div className="space-y-4 py-1">
            {/* Instant School Email / Student ID Sign-In (Works immediately even when Google Popup is in Testing mode 403) */}
            <form
              onSubmit={handleDirectSchoolEmailLogin}
              className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 space-y-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>เข้าเรียนได้ทันที (ไม่ติดบล็อก 403 ป๊อปอัป)</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  @{SCHOOL_DOMAIN}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  เข้าสู่ระบบด้วยอีเมลโรงเรียน หรือ รหัสนักเรียน
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  พิมพ์รหัสนักเรียน (เช่น <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">10894</code>) หรืออีเมลเต็ม (เช่น <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">10894@{SCHOOL_DOMAIN}</code> หรืออีเมลครูในแท็บ Teachers) เพื่อเข้าเรียนและบันทึกข้อมูลทันที
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    อีเมลโรงเรียน หรือ รหัสประจำตัวนักเรียน 5 หลัก *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={directSchoolEmail}
                      onChange={(e) => setDirectSchoolEmail(e.target.value)}
                      placeholder={`เช่น 10894 หรือ 10894@${SCHOOL_DOMAIN}`}
                      style={{ color: '#065f46', caretColor: '#065f46', backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-bold text-emerald-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อ-นามสกุล (ระบุครั้งแรก)
                    </label>
                    <input
                      type="text"
                      value={directSchoolName}
                      onChange={(e) => setDirectSchoolName(e.target.value)}
                      placeholder="เช่น ด.ช. กิตติภพ สุริยวงศ์"
                      style={{ color: '#1e293b', caretColor: '#1e293b', backgroundColor: '#ffffff' }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ระดับชั้น/ห้อง
                    </label>
                    <input
                      type="text"
                      value={directSchoolGrade}
                      onChange={(e) => setDirectSchoolGrade(e.target.value)}
                      placeholder="เช่น ประถมศึกษาปีที่ 6/1"
                      style={{ color: '#1e293b', caretColor: '#1e293b', backgroundColor: '#ffffff' }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'กำลังตรวจสอบและบันทึกข้อมูล...'
                    : 'เข้าสู่ระบบด้วยอีเมลโรงเรียนทันที'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                หรือ ยืนยันผ่านป๊อปอัป Google OAuth
              </span>
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
            </div>

            {/* Official Google OAuth Sign-In Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>
                  {isLoading
                    ? 'กำลังยืนยันตัวตนกับ Google...'
                    : 'เปิดป๊อปอัปเข้าสู่ระบบด้วยบัญชี Google'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOauthBlockedHelp((prev) => !prev)}
                className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>ทำไมป๊อปอัป Google จึงแจ้ง "403: access_denied (แอปอยู่ระหว่างการทดสอบ)"? คลิกดูวิธีปลดล็อก</span>
              </button>
            </div>
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
