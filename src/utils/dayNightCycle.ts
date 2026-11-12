export type ThemeMode = 'auto' | 'light' | 'dark';

export type DayPhaseId = 'morning' | 'afternoon' | 'dusk' | 'night';

export interface DayPhaseInfo {
  id: DayPhaseId;
  name: string;
  subTitle: string;
  icon: string;
  recommendedTheme: 'light' | 'dark';
  timeRange: string;
  description: string;
  accentBg: string;
  accentBorder: string;
  glowColor: string;
}

export const DAY_PHASES: Record<DayPhaseId, DayPhaseInfo> = {
  morning: {
    id: 'morning',
    name: 'ช่วงเช้า (Morning)',
    subTitle: 'สดใส รับอรุณ',
    icon: '🌅',
    recommendedTheme: 'light',
    timeRange: '06:00 - 11:59',
    description: 'แสงสว่างสดชื่น เหมาะกับการเริ่มต้นเรียนรู้วิทยาการคำนวณและกิจกรรมใหม่ๆ',
    accentBg: 'from-amber-400/20 via-orange-300/15 to-yellow-200/20',
    accentBorder: 'border-amber-300 dark:border-amber-700',
    glowColor: 'rgba(251, 191, 36, 0.45)',
  },
  afternoon: {
    id: 'afternoon',
    name: 'ช่วงบ่าย (Afternoon)',
    subTitle: 'แสงธรรมชาติ ชัดเจน',
    icon: '☀️',
    recommendedTheme: 'light',
    timeRange: '12:00 - 16:59',
    description: 'ช่วงเวลาแห่งการโฟกัส ปฏิบัติการทดลอง Scratch, Micro:bit และการเขียนโค้ด',
    accentBg: 'from-sky-400/20 via-blue-300/15 to-indigo-200/20',
    accentBorder: 'border-sky-300 dark:border-sky-700',
    glowColor: 'rgba(56, 189, 248, 0.45)',
  },
  dusk: {
    id: 'dusk',
    name: 'ช่วงเย็น / พลบค่ำ (Sunset & Twilight)',
    subTitle: 'แสงอบอุ่น สบายตา',
    icon: '🌇',
    recommendedTheme: 'dark', // 18:00 onwards transitions to night theme
    timeRange: '17:00 - 18:59',
    description: 'ช่วงพระอาทิตย์ตกดิน แสงรอบตัวเริ่มลดลง ระบบเตรียมปรับเข้าสู่โหมดถนอมสายตา',
    accentBg: 'from-orange-500/25 via-rose-500/20 to-purple-700/25',
    accentBorder: 'border-orange-400 dark:border-orange-600',
    glowColor: 'rgba(249, 115, 22, 0.5)',
  },
  night: {
    id: 'night',
    name: 'ช่วงค่ำ / ดึก (Night & Midnight)',
    subTitle: 'โหมดมืด ถนอมสายตา',
    icon: '🌙',
    recommendedTheme: 'dark',
    timeRange: '19:00 - 05:59',
    description: 'โหมดมืดลดแสงสีฟ้า ช่วยลดความล้าของดวงตา เหมาะกับการทบทวนบทเรียนยามค่ำคืน',
    accentBg: 'from-indigo-950/60 via-purple-950/40 to-slate-950/70',
    accentBorder: 'border-indigo-500 dark:border-indigo-600',
    glowColor: 'rgba(99, 102, 241, 0.5)',
  },
};

/**
 * คำนวณช่วงเวลาของวันตามเวลาจริง
 */
export const getCurrentDayPhase = (date: Date = new Date()): DayPhaseInfo => {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) {
    return DAY_PHASES.morning;
  }
  if (hour >= 12 && hour < 17) {
    return DAY_PHASES.afternoon;
  }
  if (hour >= 17 && hour < 19) {
    return DAY_PHASES.dusk;
  }
  return DAY_PHASES.night;
};

/**
 * คำนวณธีมที่เหมาะสม (Light หรือ Dark) ตามวัฏจักรเวลาจริง
 * - 06:00 - 17:59 (กลางวัน): โหมดสว่าง Light Mode
 * - 18:00 - 05:59 (กลางคืน): โหมดมืด Dark Mode
 */
export const getTargetThemeFromTime = (date: Date = new Date()): 'light' | 'dark' => {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

/**
 * รูปแบบเวลาภาษาไทย เช่น "18:05 น."
 */
export const formatThaiClockTime = (date: Date = new Date()): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} น.`;
};

/**
 * คำนวณเปอร์เซ็นต์เวลาของวัน (0 - 100%) สำหรับแถบ Timeline
 */
export const getDayProgressPercentage = (date: Date = new Date()): number => {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  return Math.round((minutesSinceMidnight / 1440) * 100);
};

/**
 * ข้อมูลการเปลี่ยนผ่านสู่ช่วงเวลาถัดไป
 */
export const getNextTransitionInfo = (date: Date = new Date()): {
  targetTheme: 'light' | 'dark';
  targetThemeName: string;
  nextTimeString: string;
  hoursRemaining: number;
  minutesRemaining: number;
} => {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const isCurrentlyDay = currentHour >= 6 && currentHour < 18;

  let targetHour = isCurrentlyDay ? 18 : 6;
  let targetDate = new Date(date);
  targetDate.setHours(targetHour, 0, 0, 0);

  if (targetDate.getTime() <= date.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const diffMs = targetDate.getTime() - date.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hoursRemaining = Math.floor(totalMinutes / 60);
  const minutesRemaining = totalMinutes % 60;

  return {
    targetTheme: isCurrentlyDay ? 'dark' : 'light',
    targetThemeName: isCurrentlyDay ? 'โหมดมืด (Night Mode)' : 'โหมดสว่าง (Day Mode)',
    nextTimeString: isCurrentlyDay ? '18:00 น.' : '06:00 น.',
    hoursRemaining,
    minutesRemaining,
  };
};
