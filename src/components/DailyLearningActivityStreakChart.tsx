import React, { useState, useMemo } from 'react';
import {
  Flame,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Award,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { UserProfile } from '../types/index.ts';

export interface DailyLearningActivityStreakChartProps {
  profile: UserProfile;
  points: number;
  onNavigate?: (moduleKey: string, subSection?: string) => void;
  onAwardBonusPoints?: (amount: number, reason: string) => void;
}

export interface DailyActivityRecord {
  index: number;
  dateKey: string;
  dayLabel: string;
  weekdayThai: string;
  fullDateThai: string;
  sessions: number;       // ความถี่การเข้าเรียน / เซสชัน (ครั้ง)
  minutes: number;        // เวลาที่ใช้เรียนรู้ (นาที)
  pointsEarned: number;   // คะแนน EXP ที่ได้รับ
  modules: string[];      // รายชื่อโมดูลที่เข้าเรียน
  streakActive: boolean;  // เข้าเรียนในวันนั้นหรือไม่
  isToday: boolean;
}

export const DailyLearningActivityStreakChart: React.FC<DailyLearningActivityStreakChartProps> = ({
  profile,
  points,
  onNavigate,
  onAwardBonusPoints,
}) => {
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [chartMode, setChartMode] = useState<'composed' | 'sessions' | 'minutes' | 'points'>('composed');
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    return localStorage.getItem('coderkids_daily_checkin_done') === 'true';
  });
  const [selectedDay, setSelectedDay] = useState<DailyActivityRecord | null>(null);

  // User streak count (default fallback to 18-30 days based on points)
  const currentStreak = useMemo(() => {
    if (profile.streakDays && profile.streakDays > 0) return profile.streakDays;
    return Math.min(30, Math.max(7, Math.floor(points / 30) + 12));
  }, [profile.streakDays, points]);

  // Generate deterministic past 30 days of learning activities
  const full30DaysData: DailyActivityRecord[] = useMemo(() => {
    const records: DailyActivityRecord[] = [];
    const today = new Date();

    const weekdays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    const modulePool = [
      'Scratch Studio',
      'Micro:bit V2 Simulator',
      'PDPA & Cyber Safety',
      '4 Pillars Algorithm',
      'Password Lab',
      'Block Maze Runner',
      'Binary Pixel Art',
      'Bebras Thailand Arena',
      'VR Hardware Lab',
      'Smart Exam Simulator',
      'Showcase & Peer Review',
    ];

    // Seeded randomness based on points & profile name
    const seed = (points + (profile.name?.length || 5)) % 100;

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const isToday = i === 0;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Active streak days logic: past days matching currentStreak are active
      const streakActive = i < currentStreak || (i <= 25 && (i + seed) % 6 !== 0);

      // Session Frequency: 1 - 5 sessions on active days, 0 on inactive days
      let sessions = 0;
      let minutes = 0;
      let pointsEarned = 0;
      let modules: string[] = [];

      if (streakActive) {
        // Deterministic session count (1 to 4 sessions, weekend might be 2-5)
        const sessionVariation = ((i * 3 + seed) % 4) + 1;
        sessions = isToday && hasCheckedInToday ? Math.max(3, sessionVariation + 1) : sessionVariation;

        // Minutes: 15-25 mins per session
        minutes = Math.min(85, Math.max(15, sessions * 18 + ((i * 7) % 15)));

        // Points: 10-35 points earned
        pointsEarned = Math.max(10, sessions * 12 + ((i * 5) % 10));

        // Modules picked for this day
        const modCount = Math.min(3, Math.max(1, sessions));
        const startModIdx = (i * 2 + seed) % modulePool.length;
        modules = [];
        for (let m = 0; m < modCount; m++) {
          modules.push(modulePool[(startModIdx + m) % modulePool.length]);
        }
      } else {
        sessions = 0;
        minutes = 0;
        pointsEarned = 0;
        modules = [];
      }

      const dayNumber = date.getDate();
      const monthLabel = monthsThai[date.getMonth()];
      const dayLabel = `${dayNumber} ${monthLabel}`;
      const weekdayThai = weekdays[dayOfWeek];
      const fullDateThai = `วัน${weekdayThai}ที่ ${dayNumber} ${monthsThai[date.getMonth()]} ${date.getFullYear() + 543}`;
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

      records.push({
        index: 30 - i,
        dateKey,
        dayLabel: isToday ? 'วันนี้' : dayLabel,
        weekdayThai,
        fullDateThai: isToday ? `วันนี้ (${fullDateThai})` : fullDateThai,
        sessions,
        minutes,
        pointsEarned,
        modules,
        streakActive,
        isToday,
      });
    }

    return records;
  }, [currentStreak, points, profile.name, hasCheckedInToday]);

  // Filtered by selected time range (30, 14, 7 days)
  const displayData = useMemo(() => {
    const count = parseInt(timeRange, 10);
    return full30DaysData.slice(-count);
  }, [full30DaysData, timeRange]);

  // Aggregate Metrics over the displayed range
  const metrics = useMemo(() => {
    const totalSessions = displayData.reduce((acc, curr) => acc + curr.sessions, 0);
    const totalMinutes = displayData.reduce((acc, curr) => acc + curr.minutes, 0);
    const totalPoints = displayData.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const activeDaysCount = displayData.filter((d) => d.streakActive).length;
    const peakSessionDay = [...displayData].sort((a, b) => b.sessions - a.sessions)[0];
    const avgSessionsPerActiveDay = activeDaysCount > 0 ? (totalSessions / activeDaysCount).toFixed(1) : '0';
    const consistencyRate = Math.round((activeDaysCount / displayData.length) * 100);

    return {
      totalSessions,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      totalPoints,
      activeDaysCount,
      peakSessions: peakSessionDay ? peakSessionDay.sessions : 0,
      peakDateLabel: peakSessionDay ? peakSessionDay.dayLabel : '-',
      avgSessionsPerActiveDay,
      consistencyRate,
    };
  }, [displayData]);

  // Handle daily streak check-in
  const handleCheckInToday = () => {
    if (hasCheckedInToday) return;
    setHasCheckedInToday(true);
    localStorage.setItem('coderkids_daily_checkin_done', 'true');
    soundEffects.play('victory');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    if (onAwardBonusPoints) {
      onAwardBonusPoints(15, 'เช็กชื่อเข้าเรียนรักษาสตรีคประจำวัน (+15 XP)');
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm transition-all">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>30-Day Activity &amp; Session Frequency</span>
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              สถิติกิจกรรมรายวันย้อนหลัง 30 วัน
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>ความถี่การเข้าเรียน &amp; สถิติกิจกรรมสะสม</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
              🔥 {currentStreak} วันต่อเนื่อง
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ติดตามจำนวนเซสชันการเข้าเรียนรู้ เวลาสะสม และความสม่ำเสมอของ {profile.name} (สพฐ. ว 4.2)
          </p>
        </div>

        {/* Right Action Controls: Range Switcher & Check-in Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '7'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7 วัน
            </button>
            <button
              onClick={() => setTimeRange('14')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '14'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              14 วัน
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '30'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              30 วัน
            </button>
          </div>

          {/* Daily Streak Check-in Button */}
          <button
            onClick={handleCheckInToday}
            disabled={hasCheckedInToday}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              hasCheckedInToday
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 hover:scale-[1.02] cursor-pointer'
            }`}
          >
            {hasCheckedInToday ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>รักษาสตรีควันนี้แล้ว (+15 XP)</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                <span>เช็กชื่อรักษาสตรีควันนี้ (+15 XP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5">
        {/* Metric 1: Streak */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-800/50">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-xs font-semibold">สตรีคเรียนต่อเนื่อง</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {currentStreak} <span className="text-xs font-normal text-slate-500">วัน</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
            ความสม่ำเสมอ {metrics.consistencyRate}% ใน 30 วัน
          </div>
        </div>

        {/* Metric 2: Total Sessions */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/60 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/70 dark:border-indigo-800/50">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 mb-1">
            <span className="text-xs font-semibold">ความถี่เซสชันรวม</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.totalSessions} <span className="text-xs font-normal text-slate-500">เซสชัน</span>
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
            เฉลี่ย {metrics.avgSessionsPerActiveDay} ครั้ง / วันที่เข้าเรียน
          </div>
        </div>

        {/* Metric 3: Total Learning Minutes */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-800/50">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-semibold">เวลาเรียนสะสม</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.totalMinutes} <span className="text-xs font-normal text-slate-500">นาที</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
            คิดเป็น ~{metrics.totalHours} ชั่วโมงการเรียนรู้
          </div>
        </div>

        {/* Metric 4: Peak Activity Day */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/60 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/70 dark:border-purple-800/50">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
            <span className="text-xs font-semibold">ความถี่สูงสุดในหนึ่งวัน</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.peakSessions} <span className="text-xs font-normal text-slate-500">เซสชัน/วัน</span>
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
            วันที่พีคสุด: {metrics.peakDateLabel}
          </div>
        </div>
      </div>

      {/* Chart Filter Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setChartMode('composed')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              chartMode === 'composed'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>กราฟรวม: เซสชัน &amp; นาทีเรียน</span>
          </button>
          <button
            onClick={() => setChartMode('sessions')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              chartMode === 'sessions'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>ความถี่เซสชัน (ครั้ง)</span>
          </button>
          <button
            onClick={() => setChartMode('minutes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              chartMode === 'minutes'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>เวลาเรียนรู้ (นาที)</span>
          </button>
          <button
            onClick={() => setChartMode('points')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              chartMode === 'points'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>คะแนน EXP รายวัน</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden lg:flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>คลิกที่แท่งกราฟหรือกล่องปฏิทินเพื่อดูรายละเอียดของวันนั้น</span>
        </div>
      </div>

      {/* Main Recharts Visualization Container */}
      <div className="w-full h-72 sm:h-80 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-2 sm:p-4 border border-slate-100 dark:border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'composed' ? (
            <ComposedChart
              data={displayData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedDay(e.activePayload[0].payload as DailyActivityRecord);
                  soundEffects.play('click');
                }
              }}
            >
              <defs>
                <linearGradient id="sessionBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="minutesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30' ? 2 : 0}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6366f1', fontSize: 11 }}
                domain={[0, 6]}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#10b981', fontSize: 11 }}
                domain={[0, 90]}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />
              <Bar
                yAxisId="left"
                dataKey="sessions"
                name="ความถี่เซสชัน (ครั้ง/วัน)"
                fill="url(#sessionBarGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={timeRange === '30' ? 16 : 28}
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? '#f59e0b' : 'url(#sessionBarGradient)'}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="minutes"
                name="เวลาเรียนรู้ (นาที)"
                stroke="#10b981"
                fill="url(#minutesAreaGradient)"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#10b981', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#059669' }}
              />
              <ReferenceLine yAxisId="left" y={2} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            </ComposedChart>
          ) : chartMode === 'sessions' ? (
            <BarChart
              data={displayData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedDay(e.activePayload[0].payload as DailyActivityRecord);
                  soundEffects.play('click');
                }
              }}
            >
              <defs>
                <linearGradient id="pureSessionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#3b82f6', fontSize: 11 }}
                domain={[0, 6]}
                allowDecimals={false}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Bar
                dataKey="sessions"
                name="จำนวนเซสชันการเข้าเรียน (ครั้ง)"
                fill="url(#pureSessionGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={timeRange === '30' ? 20 : 34}
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`sess-cell-${index}`}
                    fill={entry.isToday ? '#f59e0b' : entry.sessions >= 4 ? '#ec4899' : 'url(#pureSessionGrad)'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : chartMode === 'minutes' ? (
            <AreaChart
              data={displayData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedDay(e.activePayload[0].payload as DailyActivityRecord);
                  soundEffects.play('click');
                }
              }}
            >
              <defs>
                <linearGradient id="emeraldTimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#10b981', fontSize: 11 }}
                domain={[0, 90]}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Area
                type="monotone"
                dataKey="minutes"
                name="ระยะเวลาเรียนรู้ (นาที)"
                stroke="#10b981"
                fill="url(#emeraldTimeGrad)"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={displayData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedDay(e.activePayload[0].payload as DailyActivityRecord);
                  soundEffects.play('click');
                }
              }}
            >
              <defs>
                <linearGradient id="amberExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#f59e0b', fontSize: 11 }}
                domain={[0, 50]}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Bar
                dataKey="pointsEarned"
                name="คะแนนสะสม EXP ที่ได้รับ (แต้ม)"
                fill="url(#amberExpGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={timeRange === '30' ? 20 : 34}
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`exp-cell-${index}`}
                    fill={entry.isToday ? '#ef4444' : 'url(#amberExpGrad)'}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 30-Day Activity Streak Strip (Interactive Heatmap Calendar Grid) */}
      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              แถบสถานะการเข้าเรียนรายวัน (30-Day Streak Grid)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" />
              <span>0 ครั้ง</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300 dark:bg-indigo-900 inline-block" />
              <span>1-2 ครั้ง</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500 inline-block" />
              <span>3+ ครั้ง</span>
            </span>
          </div>
        </div>

        {/* Heatmap Tiles Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 sm:gap-2">
          {full30DaysData.map((day) => {
            const isSelected = selectedDay?.dateKey === day.dateKey;
            let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700/60';
            if (day.sessions >= 3) {
              bgClass = 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-700 dark:border-indigo-400 font-bold';
            } else if (day.sessions >= 1) {
              bgClass = 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
            }
            if (day.isToday) {
              bgClass += ' ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900';
            }

            return (
              <button
                key={day.dateKey}
                onClick={() => {
                  setSelectedDay(day);
                  soundEffects.play('click');
                }}
                title={`${day.fullDateThai}: ${day.sessions} เซสชัน (${day.minutes} นาที)`}
                className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border text-center transition-all hover:scale-105 cursor-pointer ${bgClass} ${
                  isSelected ? 'scale-105 shadow-md shadow-indigo-500/20' : ''
                }`}
              >
                <span className="text-[10px] opacity-75">{day.dayLabel.split(' ')[0]}</span>
                {day.sessions > 0 ? (
                  <Flame className={`w-3.5 h-3.5 mt-0.5 ${day.sessions >= 3 ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-amber-500'}`} />
                ) : (
                  <span className="text-[11px] font-bold mt-0.5">-</span>
                )}
                <span className="text-[9px] font-bold mt-0.5">{day.sessions > 0 ? `${day.sessions}x` : 'เว้น'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Popover / Banner */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                📌 รายละเอียด: {selectedDay.fullDateThai}
              </span>
              {selectedDay.isToday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  วันนี้
                </span>
              )}
            </div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 flex flex-wrap items-center gap-3">
              <span>ความถี่: <strong>{selectedDay.sessions} เซสชัน</strong></span>
              <span>เวลาเรียน: <strong>{selectedDay.minutes} นาที</strong></span>
              <span>คะแนน EXP: <strong>+{selectedDay.pointsEarned} แต้ม</strong></span>
            </div>
            {selectedDay.modules.length > 0 && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-1">
                <span>หัวข้อที่เรียน:</span>
                {selectedDay.modules.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200/50 dark:border-indigo-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onNavigate && (
              <button
                onClick={() => onNavigate('codingLab', 'scratch')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span>เข้าสู่ห้องเรียน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Glassmorphic Tooltip for Recharts
const CustomActivityTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data: DailyActivityRecord = payload[0].payload;
    return (
      <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{data.fullDateThai}</span>
          </span>
          {data.isToday && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white">
              TODAY
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>ความถี่เซสชัน:</span>
            </span>
            <span className="font-bold">{data.sessions} ครั้ง</span>
          </div>

          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>เวลาที่ใช้เรียน:</span>
            </span>
            <span className="font-bold">{data.minutes} นาที</span>
          </div>

          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>คะแนนที่ได้รับ:</span>
            </span>
            <span className="font-bold">+{data.pointsEarned} XP</span>
          </div>
        </div>

        {data.modules.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="font-semibold mb-1">โมดูลที่เข้าเรียน:</div>
            <div className="flex flex-wrap gap-1">
              {data.modules.map((m, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-700 dark:text-slate-300"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};
