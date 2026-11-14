import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  RefreshCw,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  ExternalLink,
  Search,
  CheckCheck,
  Trash2,
  Award,
  Sparkles,
  Clock,
  UserCheck,
  X,
  SlidersHorizontal,
  Play,
  Pause,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types/index.ts';
import {
  TARGET_SPREADSHEET_ID,
  STUDENTS_SHEET_TITLE,
  LOGS_SHEET_TITLE,
  readLogsFromGoogleSheet,
   readProfilesFromGoogleSheet,
  recordStudentLoginToGoogleSheet,
  saveProfileToGoogleSheet,
} from '../services/googleSheetsService.ts';
import { soundEffects } from '../utils/soundEffects.ts';

export interface TeacherNotificationItem {
  id: string;
  timestamp: string;
  studentName: string;
  studentId?: string;
  grade: string;
  school: string;
  avatar: string;
  email?: string;
  eventType: 'module_complete' | 'mission_complete' | 'sheet_sync';
  title: string;
  detail: string;
  moduleName: string;
  pointsEarned?: number;
  totalPoints?: number;
  completedModulesText?: string;
  sourceTab: 'Logs' | 'Students' | 'LiveSync';
  isRead: boolean;
}

interface StudentSheetSnapshot {
  studentId: string;
  name: string;
  grade: string;
  avatar: string;
  points: number;
  completedModules: string;
  updatedAt: string;
  email: string;
}

interface TeacherRealtimeNotificationPanelProps {
  profile: UserProfile;
  profiles?: UserProfile[];
  isAdmin?: boolean;
  onNavigate?: (moduleKey: string) => void;
}

const STORAGE_KEY_NOTIFICATIONS = 'coderkids_teacher_realtime_notifications_v1';

export const TeacherRealtimeNotificationPanel: React.FC<TeacherRealtimeNotificationPanelProps> = ({
  profile,
  profiles = [],
  isAdmin = false,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<TeacherNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 60);
      }
    } catch {}
    return [];
  });

  // Live floating toast alerts (top-right popup when a student completes a mission/module)
  const [activeToasts, setActiveToasts] = useState<TeacherNotificationItem[]>([]);

  // Monitoring controls
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(true);
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(12);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCheckingNow, setIsCheckingNow] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('กำลังเตรียมซิงก์...');
  const [secondsUntilNextCheck, setSecondsUntilNextCheck] = useState<number>(12);
  const [sheetSyncStats, setSheetSyncStats] = useState<{
    studentsInSheet: number;
    logsInSheet: number;
    status: 'connected' | 'syncing' | 'idle';
  }>({
    studentsInSheet: 0,
    logsInSheet: 0,
    status: 'idle',
  });

  // Filtering & Search
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'module_complete' | 'mission_complete'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Refs for diffing Google Sheet state across polls without re-triggering old rows
  const isInitialLoadRef = useRef<boolean>(true);
  const seenLogKeysRef = useRef<Set<string>>(new Set());
  const studentSnapshotsRef = useRef<Map<string, StudentSheetSnapshot>>(new Map());
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications.slice(0, 60)));
    } catch {}
  }, [notifications]);

  // Helper to classify log action into module_complete vs mission_complete
  const classifyAction = (
    actionText: string,
    moduleText: string
  ): {
    eventType: 'module_complete' | 'mission_complete' | 'sheet_sync';
    title: string;
    pointsEarned?: number;
    friendlyModule: string;
  } => {
    const combined = `${actionText} ${moduleText}`.toLowerCase();
    const ptsMatch = actionText.match(/\+(\d+)\s*(?:xp|แต้ม|คะแนน)/i);
    const pointsEarned = ptsMatch ? parseInt(ptsMatch[1], 10) : undefined;

    let friendlyModule = 'ห้องเรียนวิทยาการคำนวณ';
    if (combined.includes('safety') || combined.includes('pdpa') || combined.includes('ความปลอดภัย') || combined.includes('รหัสผ่าน')) {
      friendlyModule = 'โมดูล 1: ความปลอดภัยดิจิทัล & PDPA';
    } else if (combined.includes('thinking') || combined.includes('อัลกอริทึม') || combined.includes('เขาวงกต') || combined.includes('flowchart') || combined.includes('bebras')) {
      friendlyModule = 'โมดูล 2: การคิดเชิงคำนวณ & อัลกอริทึม';
    } else if (combined.includes('coding') || combined.includes('scratch') || combined.includes('micro:bit') || combined.includes('microbit') || combined.includes('python') || combined.includes('bug')) {
      friendlyModule = 'โมดูล 3: ปฏิบัติการ Scratch & Micro:bit';
    } else if (combined.includes('showcase') || combined.includes('โครงงาน') || combined.includes('สะท้อนคิด') || combined.includes('journal') || combined.includes('stem')) {
      friendlyModule = 'โมดูล 4: โครงงาน & สะท้อนคิด';
    }

    if (
      actionText.includes('สำเร็จการเรียนรู้โมดูล') ||
      actionText.includes('ผ่านโมดูล') ||
      actionText.includes('ครบทั้ง 4 โมดูล')
    ) {
      return {
        eventType: 'module_complete',
        title: `พิชิต${friendlyModule}สำเร็จ!`,
        pointsEarned: pointsEarned || 50,
        friendlyModule,
      };
    }

    if (
      actionText.includes('สำเร็จภารกิจ') ||
      actionText.includes('พิชิตด่าน') ||
      actionText.includes('ทำแบบทดสอบ') ||
      actionText.includes('ทำข้อสอบ') ||
      actionText.includes('ส่งและนำเสนอโครงงาน') ||
      actionText.includes('ทำเป้าหมายการเรียนรู้วันนี้สำเร็จ') ||
      pointsEarned !== undefined
    ) {
      return {
        eventType: 'mission_complete',
        title: actionText.replace(/^สำเร็จภารกิจ:\s*/i, ''),
        pointsEarned: pointsEarned || 20,
        friendlyModule,
      };
    }

    return {
      eventType: 'sheet_sync',
      title: actionText || 'อัปเดตความก้าวหน้าการเรียนผ่าน Google Sheet',
      pointsEarned,
      friendlyModule,
    };
  };

  // Trigger a new real-time notification + toast + sound
  const pushNewNotification = useCallback((item: TeacherNotificationItem, triggerAlert: boolean = true) => {
    setNotifications((prev) => {
      if (prev.some((existing) => existing.id === item.id)) {
        return prev;
      }
      return [item, ...prev].slice(0, 60);
    });

    if (triggerAlert) {
      setActiveToasts((prev) => [item, ...prev.filter((t) => t.id !== item.id)].slice(0, 3));
      if (soundEnabledRef.current) {
        if (item.eventType === 'module_complete') {
          soundEffects.play('victory');
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.2, x: 0.85 } });
        } else {
          soundEffects.playSuccess();
        }
      }
    }
  }, []);

  // Auto-dismiss floating toasts after 7 seconds
  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timer = setTimeout(() => {
      setActiveToasts((prev) => prev.slice(0, -1));
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToasts]);

  // Core function: Poll Google Sheet (Students & Logs tabs) + Server API and detect student completions
  const checkGoogleSheetForUpdates = useCallback(
    async (isManualTrigger: boolean = false) => {
      setIsCheckingNow(true);
      setSheetSyncStats((prev) => ({ ...prev, status: 'syncing' }));

      try {
        const [studentsSheetRes, logsSheetRes, serverLogsRes] = await Promise.all([
          readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE).catch(() => ({
            rows: [] as string[][],
            sheetTitle: STUDENTS_SHEET_TITLE,
          })),
          readLogsFromGoogleSheet(TARGET_SPREADSHEET_ID).catch(() => ({
            rows: [] as string[][],
            sheetTitle: LOGS_SHEET_TITLE,
          })),
          fetch('/api/logs/list')
            .then((r) => (r.ok ? r.json() : { logs: [] }))
            .catch(() => ({ logs: [] })),
        ]);

        const studentRows = studentsSheetRes.rows || [];
        const logRows = logsSheetRes.rows || [];
        const serverLogs: any[] = Array.isArray(serverLogsRes?.logs) ? serverLogsRes.logs : [];

        // 1. Process "Students" Tab rows to detect module completion or XP point increases
        // Columns: [0:เลขประจำตัว, 1:วันที่อัปเดต, 2:ชื่อ-นามสกุล, 3:ระดับชั้น/ห้อง, 4:โรงเรียน, 5:อวตาร, 6:ฉายา, 7:Bio, 8:แต้มสะสม, 9:เลเวล, 10:ภารกิจที่สำเร็จ (จาก 4), 11:เหรียญตรา, 12:อีเมล]
        const dataStudentRows = studentRows.length > 1 ? studentRows.slice(1) : [];
        for (const row of dataStudentRows) {
          const studentId = (row[0] || '').trim();
          const updatedAt = (row[1] || '').trim();
          const name = (row[2] || '').trim();
          const grade = (row[3] || 'ป.4/1').trim();
          const school = (row[4] || 'โรงเรียนอนุบาลนราธิวาส').trim();
          const avatarRaw = (row[5] || '🐱').trim();
          const avatarEmoji = avatarRaw.split(' ')[0] || '🐱';
          const points = parseInt(row[8] || '0', 10) || 0;
          const completedModules = (row[10] || '0/4').trim();
          const badgesText = (row[11] || '').trim();
          const email = (row[12] || '').trim();

          if (!name) continue;
          const key = (email || studentId || name).toLowerCase();
          const prevSnap = studentSnapshotsRef.current.get(key);

          const currentSnap: StudentSheetSnapshot = {
            studentId,
            name,
            grade,
            avatar: avatarEmoji,
            points,
            completedModules,
            updatedAt,
            email,
          };

          if (!isInitialLoadRef.current && prevSnap) {
            // Check if completedModules increased (e.g. "1/4" -> "2/4")
            const prevModNum = parseInt(prevSnap.completedModules.split('/')[0] || '0', 10) || 0;
            const currModNum = parseInt(completedModules.split('/')[0] || '0', 10) || 0;

            if (currModNum > prevModNum) {
              const notifId = `sheet_stu_mod_${key}_${currModNum}_${updatedAt}`;
              pushNewNotification(
                {
                  id: notifId,
                  timestamp: updatedAt || new Date().toLocaleTimeString('th-TH'),
                  studentName: name,
                  studentId,
                  grade,
                  school,
                  avatar: avatarEmoji,
                  email,
                  eventType: 'module_complete',
                  title: `ผ่านโมดูลการเรียนรู้เพิ่มเป็น ${completedModules} โมดูล!`,
                  detail: `ตรวจพบการอัปเดตความก้าวหน้าจากแท็บ Students ใน Google Sheet (เหรียญตรา: ${badgesText || 'ปลดล็อกใหม่'})`,
                  moduleName: `ความก้าวหน้า ${completedModules}`,
                  pointsEarned: Math.max(50, points - prevSnap.points),
                  totalPoints: points,
                  completedModulesText: completedModules,
                  sourceTab: 'Students',
                  isRead: false,
                },
                true
              );
            } else if (points > prevSnap.points) {
              const diffPts = points - prevSnap.points;
              const notifId = `sheet_stu_pts_${key}_${points}_${updatedAt}`;
              pushNewNotification(
                {
                  id: notifId,
                  timestamp: updatedAt || new Date().toLocaleTimeString('th-TH'),
                  studentName: name,
                  studentId,
                  grade,
                  school,
                  avatar: avatarEmoji,
                  email,
                  eventType: 'mission_complete',
                  title: `ทำภารกิจสำเร็จและรับแต้มสะสมเพิ่ม +${diffPts} XP (รวม ${points} XP)`,
                  detail: `ซิงก์ข้อมูลคะแนนล่าสุดจากแท็บ Students ใน Google Sheet (ภารกิจที่สำเร็จ: ${completedModules})`,
                  moduleName: 'แท็บ Students (Google Sheet)',
                  pointsEarned: diffPts,
                  totalPoints: points,
                  completedModulesText: completedModules,
                  sourceTab: 'Students',
                  isRead: false,
                },
                true
              );
            }
          }

          studentSnapshotsRef.current.set(key, currentSnap);
        }

        // 2. Process "Logs" Tab rows from Google Sheet
        // Columns: [0:วันเวลาที่เข้าเรียน, 1:ชื่อนักเรียน, 2:ระดับชั้น, 3:โรงเรียน, 4:อวตาร, 5:การดำเนินการ, 6:หมายเหตุ, 7:สถานะ Streak, 8:บทเรียนที่กำลังศึกษา, 9:อีเมล]
        const dataLogRows = logRows.length > 1 ? logRows.slice(1) : [];
        const combinedLogs: Array<{
          timestamp: string;
          studentName: string;
          grade: string;
          school: string;
          avatar: string;
          action: string;
          note: string;
          streak: string;
          activeModule: string;
          email: string;
          sourceTab: 'Logs' | 'LiveSync';
        }> = [];

        for (const r of dataLogRows) {
          if (!r[1] && !r[5]) continue;
          combinedLogs.push({
            timestamp: (r[0] || '').trim(),
            studentName: (r[1] || 'นักเรียน').trim(),
            grade: (r[2] || 'ป.4/1').trim(),
            school: (r[3] || 'โรงเรียนอนุบาลนราธิวาส').trim(),
            avatar: (r[4] || '🐱').trim(),
            action: (r[5] || '').trim(),
            note: (r[6] || '').trim(),
            streak: (r[7] || '').trim(),
            activeModule: (r[8] || '').trim(),
            email: (r[9] || '').trim(),
            sourceTab: 'Logs',
          });
        }

        for (const sLog of serverLogs.slice(0, 25)) {
          if (!sLog.studentName) continue;
          combinedLogs.push({
            timestamp: sLog.timestamp || '',
            studentName: sLog.studentName,
            grade: sLog.grade || 'ป.4/1',
            school: sLog.school || 'โรงเรียนอนุบาลนราธิวาส',
            avatar: sLog.avatar || '🐱',
            action: sLog.action || '',
            note: sLog.note || '',
            streak: sLog.streak || '',
            activeModule: sLog.activeModule || '',
            email: sLog.email || '',
            sourceTab: 'Logs',
          });
        }

        // Also check localStorage classroom logs
        try {
          const localLogs = JSON.parse(localStorage.getItem('coderkids_classroom_logs') || '[]');
          if (Array.isArray(localLogs)) {
            for (const lLog of localLogs.slice(0, 15)) {
              if (!lLog.studentName) continue;
              combinedLogs.push({
                timestamp: lLog.timestamp || '',
                studentName: lLog.studentName,
                grade: lLog.grade || 'ป.4/1',
                school: lLog.school || 'โรงเรียนอนุบาลนราธิวาส',
                avatar: lLog.avatar || '🐱',
                action: lLog.action || '',
                note: lLog.note || '',
                streak: lLog.streak || '',
                activeModule: lLog.activeModule || '',
                email: lLog.email || '',
                sourceTab: 'Logs',
              });
            }
          }
        } catch {}

        for (const logEntry of combinedLogs) {
          const logKey = `${logEntry.timestamp}_${logEntry.studentName}_${logEntry.action}`;
          if (seenLogKeysRef.current.has(logKey)) continue;
          seenLogKeysRef.current.add(logKey);

          const classified = classifyAction(logEntry.action, logEntry.activeModule);

          // On initial load, populate up to 8 recent items quietly without firing popup toasts
          const shouldAlert = !isInitialLoadRef.current;

          const notifItem: TeacherNotificationItem = {
            id: `log_${logKey.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_')}`,
            timestamp: logEntry.timestamp || new Date().toLocaleTimeString('th-TH'),
            studentName: logEntry.studentName,
            grade: logEntry.grade,
            school: logEntry.school,
            avatar: logEntry.avatar || '🐱',
            email: logEntry.email,
            eventType: classified.eventType,
            title: classified.title,
            detail: `${logEntry.note || 'ซิงก์ข้อมูลจาก Google Sheet'} ${logEntry.streak ? `· ${logEntry.streak}` : ''}`,
            moduleName: classified.friendlyModule,
            pointsEarned: classified.pointsEarned,
            sourceTab: logEntry.sourceTab,
            isRead: isInitialLoadRef.current,
          };

          pushNewNotification(notifItem, shouldAlert);
        }

        isInitialLoadRef.current = false;
        const nowStr = new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastCheckedTime(nowStr);
        setSheetSyncStats({
          studentsInSheet: dataStudentRows.length,
          logsInSheet: Math.max(dataLogRows.length, combinedLogs.length),
          status: 'connected',
        });
      } catch (err) {
        console.warn('Teacher real-time sheet monitor error:', err);
        setSheetSyncStats((prev) => ({ ...prev, status: 'idle' }));
      } finally {
        setIsCheckingNow(false);
        setSecondsUntilNextCheck(pollIntervalSec);
      }
    },
    [pollIntervalSec, pushNewNotification]
  );

  // Listen to instant same-browser / cross-tab mission & module completion events
  useEffect(() => {
    const handleCustomCompletion = (e: Event) => {
      const customEvt = e as CustomEvent<any>;
      const data = customEvt.detail;
      if (!data) return;

      const notifItem: TeacherNotificationItem = {
        id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        studentName: data.studentName || profile.name,
        studentId: data.studentId || profile.studentId,
        grade: data.grade || profile.grade || 'ป.4/1',
        school: data.school || profile.school || 'โรงเรียนอนุบาลนราธิวาส',
        avatar: data.avatar || profile.avatarEmoji || '🐱',
        email: data.email || profile.contactEmail || '',
        eventType: data.eventType || 'mission_complete',
        title: data.title || 'ทำภารกิจการเรียนรู้สำเร็จ!',
        detail: data.detail || 'ซิงก์สถานะความสำเร็จลง Google Sheet (แท็บ Students & Logs) เรียบร้อยแล้ว',
        moduleName: data.moduleName || 'บทเรียนวิทยาการคำนวณ',
        pointsEarned: data.pointsEarned,
        totalPoints: data.totalPoints,
        completedModulesText: data.completedModulesText,
        sourceTab: 'LiveSync',
        isRead: false,
      };

      pushNewNotification(notifItem, true);
    };

    window.addEventListener('coderkids:student-achievement', handleCustomCompletion);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('coderkids_realtime_sync');
        bc.onmessage = (msg) => {
          if (msg?.data?.type === 'STUDENT_ACHIEVEMENT') {
            handleCustomCompletion(new CustomEvent('coderkids:student-achievement', { detail: msg.data.payload }));
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('coderkids:student-achievement', handleCustomCompletion);
      if (bc) bc.close();
    };
  }, [profile, pushNewNotification]);

  // Initial check & periodic polling loop
  useEffect(() => {
    checkGoogleSheetForUpdates(false);
  }, [checkGoogleSheetForUpdates]);

  useEffect(() => {
    if (!isLiveMonitoring) return;

    const countdownTimer = setInterval(() => {
      setSecondsUntilNextCheck((prev) => {
        if (prev <= 1) {
          checkGoogleSheetForUpdates(false);
          return pollIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isLiveMonitoring, pollIntervalSec, checkGoogleSheetForUpdates]);

  // Simulate & sync a real student mission completion to Google Sheet so Teacher can test the alert immediately
  const handleTriggerTestStudentCompletion = async () => {
    setIsCheckingNow(true);
    const targetStudent =
      profiles.find((p) => p.role !== 'admin') ||
      profile;

    const sampleMissions = [
      {
        title: 'ผ่านโมดูล 1: ความปลอดภัยดิจิทัล & PDPA สำเร็จครบทุกด่าน!',
        moduleName: 'โมดูล 1: ความปลอดภัยดิจิทัล & PDPA',
        eventType: 'module_complete' as const,
        pointsEarned: 50,
        completedModulesText: '1/4',
      },
      {
        title: 'พิชิตภารกิจเขาวงกตอัลกอริทึม 20 ด่าน และเขียนผังงาน Flowchart สำเร็จ!',
        moduleName: 'โมดูล 2: การคิดเชิงคำนวณ & อัลกอริทึม',
        eventType: 'module_complete' as const,
        pointsEarned: 50,
        completedModulesText: '2/4',
      },
      {
        title: 'รันโปรเจกต์บล็อกคำสั่ง Scratch & จำลองเซนเซอร์อุณหภูมิ Micro:bit V2 สำเร็จ!',
        moduleName: 'โมดูล 3: ปฏิบัติการ Scratch & Micro:bit',
        eventType: 'mission_complete' as const,
        pointsEarned: 35,
        completedModulesText: '3/4',
      },
      {
        title: 'ส่งโครงงานนวัตกรรม STEM Smart Farm และบันทึกสะท้อนคิด 3-2-1 สำเร็จ!',
        moduleName: 'โมดูล 4: โครงงาน & สะท้อนคิด',
        eventType: 'module_complete' as const,
        pointsEarned: 50,
        completedModulesText: '4/4',
      },
    ];

    const chosen = sampleMissions[Math.floor(Math.random() * sampleMissions.length)];
    const studentEmail = targetStudent.contactEmail || `${targetStudent.studentId || '10894'}@anubalnara.ac.th`;

    try {
      await recordStudentLoginToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        targetStudent,
        studentEmail,
        `สำเร็จภารกิจ: ${chosen.title} (+${chosen.pointsEarned} XP)`,
        chosen.moduleName
      );
      await saveProfileToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        targetStudent,
        (targetStudent.points || 100) + chosen.pointsEarned,
        parseInt(chosen.completedModulesText.split('/')[0], 10) || 2,
        ['ผู้พิทักษ์ข้อมูล PDPA', 'ยอดนักคิดอัลกอริทึม'],
        studentEmail
      );
    } catch (e) {
      console.warn('Test completion sheet write:', e);
    }

    const newNotif: TeacherNotificationItem = {
      id: `test_sync_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      studentName: targetStudent.name,
      studentId: targetStudent.studentId,
      grade: targetStudent.grade || 'ป.4/1',
      school: targetStudent.school || 'โรงเรียนอนุบาลนราธิวาส',
      avatar: targetStudent.avatarEmoji || '🐱',
      email: studentEmail,
      eventType: chosen.eventType,
      title: chosen.title,
      detail: `บันทึกและตรวจสอบสถานะการซิงก์ผ่าน Google Sheet (${TARGET_SPREADSHEET_ID}) สำเร็จ`,
      moduleName: chosen.moduleName,
      pointsEarned: chosen.pointsEarned,
      totalPoints: (targetStudent.points || 100) + chosen.pointsEarned,
      completedModulesText: chosen.completedModulesText,
      sourceTab: 'LiveSync',
      isRead: false,
    };

    pushNewNotification(newNotif, true);
    setIsCheckingNow(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const moduleCompleteCount = notifications.filter((n) => n.eventType === 'module_complete').length;
  const missionCompleteCount = notifications.filter((n) => n.eventType === 'mission_complete').length;

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'unread' && item.isRead) return false;
    if (filterType === 'module_complete' && item.eventType !== 'module_complete') return false;
    if (filterType === 'mission_complete' && item.eventType !== 'mission_complete') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMod = item.moduleName.toLowerCase().includes(q);
      const matchEmail = (item.email || '').toLowerCase().includes(q);
      return matchName || matchTitle || matchMod || matchEmail;
    }
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
  };

  return (
    <div className="space-y-4">
      {/* Floating Real-Time Toast Alerts (Top-Right Viewport) */}
      {activeToasts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 shadow-xl transition-all duration-200 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xl shrink-0">
                {toast.avatar || '🎓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5" />
                    <span>
                      {toast.eventType === 'module_complete'
                        ? 'แจ้งเตือนผ่านโมดูลสำเร็จ!'
                        : 'แจ้งเตือนทำภารกิจสำเร็จ!'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {toast.timestamp}
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate mt-0.5">
                  {toast.studentName} ({toast.grade})
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-snug">
                  {toast.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                  {toast.pointsEarned && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{toast.pointsEarned} XP
                    </span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{toast.moduleName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Real-time Notification Card in Teacher Dashboard */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <BellRing className="w-4 h-4" />
              <span>Real-time Classroom Notification · Google Sheets Sync Monitor</span>
              {unreadCount > 0 && (
                <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                  · ใหม่ {unreadCount} รายการ
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ระบบแจ้งเตือนความสำเร็จผู้เรียนแบบเรียลไทม์ (สำหรับคุณครู)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ตรวจสอบการซิงก์ข้อมูลจาก Google Sheet (แท็บ <strong>Students</strong> &amp; <strong>Logs</strong>) อัตโนมัติ และแจ้งเตือนทันทีเมื่อนักเรียนทำภารกิจหรือผ่านโมดูลการเรียนรู้สำเร็จ
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLiveMonitoring((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isLiveMonitoring
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {isLiveMonitoring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>
                {isLiveMonitoring
                  ? `กำลังซิงก์อัตโนมัติ (${secondsUntilNextCheck}s)`
                  : 'หยุดซิงก์ชั่วคราว'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="เปิด/ปิดเสียงแจ้งเตือนเมื่อนักเรียนทำภารกิจสำเร็จ"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>เสียงแจ้งเตือน: เปิด</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>เสียงแจ้งเตือน: ปิด</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => checkGoogleSheetForUpdates(true)}
              disabled={isCheckingNow}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNow ? 'animate-spin' : ''}`} />
              <span>{isCheckingNow ? 'กำลังตรวจสอบชีต...' : 'เช็คสถานะชีตทันที'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerTestStudentCompletion}
              disabled={isCheckingNow}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ทดสอบแจ้งเตือนภารกิจสำเร็จ</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">รายการแจ้งเตือนใหม่</div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {unreadCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              จากทั้งหมด <span className="font-mono tabular-nums">{notifications.length}</span> รายการ
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">ผ่านโมดูลสำเร็จ (Modules)</div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {moduleCompleteCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ซิงก์จากแท็บ Students &amp; Logs
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">ทำภารกิจสำเร็จ (Missions)</div>
            <div className="text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
              {missionCompleteCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              สะสมแต้ม XP รายกิจกรรม
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">สถานะเชื่อมต่อ Google Sheet</div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>อัปเดตล่าสุด {lastCheckedTime}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
              ผู้เรียนในชีต {sheetSyncStats.studentsInSheet} คน · บันทึก {sheetSyncStats.logsInSheet} รายการ
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Interactive Segmented Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === 'unread'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ยังไม่อ่าน ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('module_complete')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === 'module_complete'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ผ่านโมดูล ({moduleCompleteCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('mission_complete')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === 'mission_complete'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              สำเร็จภารกิจ ({missionCompleteCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อนักเรียน หรือภารกิจ..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านแล้วทั้งหมด</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearNotifications}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="ล้างประวัติการแจ้งเตือน"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification Feed List */}
        {filteredNotifications.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              ยังไม่มีรายการแจ้งเตือนในหมวดหมู่นี้
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              เมื่อนักเรียนทำภารกิจหรือผ่านโมดูลการเรียนรู้ ระบบจะซิงก์ข้อมูลลง Google Sheet และแจ้งเตือนคุณครูที่นี่โดยอัตโนมัติ หรือกดปุ่ม <strong>"ทดสอบแจ้งเตือนภารกิจสำเร็จ"</strong> ด้านบนเพื่อทดสอบระบบ
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`py-3.5 px-3 transition-colors flex items-start justify-between gap-4 cursor-pointer rounded-xl ${
                  !item.isRead
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/25 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                    {item.avatar || '🐱'}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.studentName}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.grade}
                      </span>
                      {item.email && (
                        <>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {item.email}
                          </span>
                        </>
                      )}
                      {!item.isRead && (
                        <>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            ใหม่
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {item.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.moduleName}</span>
                      <span aria-hidden="true">·</span>
                      <span>ซิงก์จากแท็บ {item.sourceTab === 'LiveSync' ? 'Logs & Students (Live)' : item.sourceTab}</span>
                      {item.completedModulesText && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            ความก้าวหน้า {item.completedModulesText} โมดูล
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1 font-mono tabular-nums">
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </div>
                  {item.pointsEarned && (
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{item.pointsEarned} XP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with Google Sheet Direct Link & Interval Selector */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>ความถี่การตรวจสอบ Google Sheet:</span>
            <select
              value={pollIntervalSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPollIntervalSec(val);
                setSecondsUntilNextCheck(val);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200"
            >
              <option value={8}>ทุก 8 วินาที</option>
              <option value={12}>ทุก 12 วินาที (แนะนำ)</option>
              <option value={20}>ทุก 20 วินาที</option>
              <option value={30}>ทุก 30 วินาที</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('profileManage')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                เปิดหน้าจัดการข้อมูล Google Sheet
              </button>
            )}
            <a
              href={`https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>เปิดไฟล์ Google Sheet ({TARGET_SPREADSHEET_ID.slice(0, 8)}...)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
