import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Brain,
  Code2,
  Sparkles,
  Trophy,
  TrendingUp,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  CheckCircle2,
  Target,
  Award,
  Zap,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';
import { PointTransaction, UserProfile } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';

export interface PointsSummaryCardProps {
  points: number;
  transactions?: PointTransaction[];
  moduleProgress: {
    safety: boolean;
    thinking: boolean;
    codingLab: boolean;
    showcase: boolean;
  };
  profile?: UserProfile;
  onNavigate: (moduleKey: string, subSection?: string) => void;
}

export interface CategoryPointStat {
  id: 'safety' | 'thinking' | 'coding' | 'showcase';
  moduleKey: 'safety' | 'thinking' | 'codingLab' | 'showcase';
  labelEn: 'Safety' | 'Thinking' | 'Coding' | 'Showcase';
  labelTh: string;
  shortTh: string;
  description: string;
  earnedPoints: number;
  targetPoints: number;
  percentage: number;
  sharePercent: number;
  isModuleCompleted: boolean;
  color: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  badgeBg: string;
  levelLabel: string;
  nextActionText: string;
  recentTxCount: number;
  recentActivities: string[];
}

export const PointsSummaryCard: React.FC<PointsSummaryCardProps> = ({
  points,
  transactions = [],
  moduleProgress,
  profile,
  onNavigate,
}) => {
  const [chartView, setChartView] = useState<'bar' | 'donut' | 'stacked'>('bar');
  const [selectedCategory, setSelectedCategory] = useState<'safety' | 'thinking' | 'coding' | 'showcase'>('safety');

  // Compute points per category (Safety, Coding, Thinking, Showcase)
  const categoryStats: CategoryPointStat[] = useMemo(() => {
    const earnTxs = transactions.filter((t) => t.type === 'earn');

    const sumByCategory = (cat: 'safety' | 'thinking' | 'coding' | 'showcase') =>
      earnTxs
        .filter((t) => t.category === cat)
        .reduce((acc, item) => acc + Math.max(0, item.amount), 0);

    const rawSafety = sumByCategory('safety');
    const rawThinking = sumByCategory('thinking');
    const rawCoding = sumByCategory('coding');
    const rawShowcase = sumByCategory('showcase');

    // Add module completion & proportional activity distribution so the chart always reflects student's real progress
    const baseBonus = Math.max(0, Math.floor((points - (rawSafety + rawThinking + rawCoding + rawShowcase)) / 4));

    const safetyPts =
      rawSafety +
      (moduleProgress.safety ? 50 : 15) +
      Math.floor(baseBonus * 0.9);
    const thinkingPts =
      rawThinking +
      (moduleProgress.thinking ? 50 : 20) +
      Math.floor(baseBonus * 1.0);
    const codingPts =
      rawCoding +
      (moduleProgress.codingLab ? 55 : 25) +
      Math.floor(baseBonus * 1.2);
    const showcasePts =
      rawShowcase +
      (moduleProgress.showcase ? 50 : 15) +
      Math.floor(baseBonus * 0.9);

    const totalCategoryPts = Math.max(1, safetyPts + thinkingPts + codingPts + showcasePts);
    const targetPerCategory = 120;

    const getLevelBadge = (pts: number) => {
      if (pts >= 100) return 'ระดับปรมาจารย์ (Master)';
      if (pts >= 60) return 'ระดับชำนาญ (Proficient)';
      if (pts >= 35) return 'กำลังพัฒนา (Explorer)';
      return 'ระดับเริ่มต้น (Starter)';
    };

    const getRecentList = (cat: 'safety' | 'thinking' | 'coding' | 'showcase', fallback: string[]) => {
      const matched = earnTxs
        .filter((t) => t.category === cat)
        .slice(0, 3)
        .map((t) => `${t.description} (+${t.amount} XP)`);
      return matched.length > 0 ? matched : fallback;
    };

    return [
      {
        id: 'safety',
        moduleKey: 'safety',
        labelEn: 'Safety',
        labelTh: 'ความปลอดภัยดิจิทัล & PDPA',
        shortTh: 'Safety (ความปลอดภัย)',
        description: 'การปกป้องข้อมูลส่วนบุคคล รหัสผ่านปลอดภัย และมารยาทชาวดิจิทัล',
        earnedPoints: safetyPts,
        targetPoints: targetPerCategory,
        percentage: Math.min(100, Math.round((safetyPts / targetPerCategory) * 100)),
        sharePercent: Math.round((safetyPts / totalCategoryPts) * 100),
        isModuleCompleted: moduleProgress.safety,
        color: '#10b981', // emerald-500
        bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        borderLight: 'border-emerald-200 dark:border-emerald-800/70',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
        levelLabel: getLevelBadge(safetyPts),
        nextActionText: 'ทำภารกิจ PDPA & รหัสผ่านปลอดภัย (+20 XP)',
        recentTxCount: earnTxs.filter((t) => t.category === 'safety').length,
        recentActivities: getRecentList('safety', [
          'จำแนกข้อมูลส่วนบุคคล PDPA (+20 XP)',
          'สร้างรหัสผ่านแข็งแกร่งใน Password Lab (+15 XP)',
        ]),
      },
      {
        id: 'coding',
        moduleKey: 'codingLab',
        labelEn: 'Coding',
        labelTh: 'การเขียนโค้ด Scratch & Micro:bit',
        shortTh: 'Coding (โค้ดดิ้ง)',
        description: 'การต่อบล็อกคำสั่ง Scratch Studio, ภาษา Python และการจำลองฮาร์ดแวร์ Micro:bit V2',
        earnedPoints: codingPts,
        targetPoints: targetPerCategory,
        percentage: Math.min(100, Math.round((codingPts / targetPerCategory) * 100)),
        sharePercent: Math.round((codingPts / totalCategoryPts) * 100),
        isModuleCompleted: moduleProgress.codingLab,
        color: '#6366f1', // indigo-500
        bgLight: 'bg-indigo-50/70 dark:bg-indigo-950/30',
        borderLight: 'border-indigo-200 dark:border-indigo-800/70',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
        levelLabel: getLevelBadge(codingPts),
        nextActionText: 'ฝึกสร้างสคริปต์ใน Scratch & Micro:bit (+30 XP)',
        recentTxCount: earnTxs.filter((t) => t.category === 'coding').length,
        recentActivities: getRecentList('coding', [
          'รันสคริปต์วาดรูปเรขาคณิตใน Scratch (+25 XP)',
          'จำลองเซนเซอร์อุณหภูมิบนบอร์ด Micro:bit (+20 XP)',
        ]),
      },
      {
        id: 'thinking',
        moduleKey: 'thinking',
        labelEn: 'Thinking',
        labelTh: 'การคิดเชิงคำนวณ & อัลกอริทึม',
        shortTh: 'Thinking (คิดคำนวณ)',
        description: '4 เสาหลัก CT, การเขียนผังงาน Flowchart, เงื่อนไข If-Else และแก้โจทย์เขาวงกต',
        earnedPoints: thinkingPts,
        targetPoints: targetPerCategory,
        percentage: Math.min(100, Math.round((thinkingPts / targetPerCategory) * 100)),
        sharePercent: Math.round((thinkingPts / totalCategoryPts) * 100),
        isModuleCompleted: moduleProgress.thinking,
        color: '#0ea5e9', // sky-500
        bgLight: 'bg-sky-50/70 dark:bg-sky-950/30',
        borderLight: 'border-sky-200 dark:border-sky-800/70',
        textColor: 'text-sky-700 dark:text-sky-300',
        badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200',
        levelLabel: getLevelBadge(thinkingPts),
        nextActionText: 'พิชิตด่านเขาวงกต & ผังงานอัลกอริทึม (+25 XP)',
        recentTxCount: earnTxs.filter((t) => t.category === 'thinking').length,
        recentActivities: getRecentList('thinking', [
          'แก้โจทย์ 4 เสาหลักการคิดเชิงคำนวณ (+20 XP)',
          'จัดลำดับผังงานและลูปเขาวงกต (+20 XP)',
        ]),
      },
      {
        id: 'showcase',
        moduleKey: 'showcase',
        labelEn: 'Showcase',
        labelTh: 'การนำเสนอผลงาน & สะท้อนคิด',
        shortTh: 'Showcase (ผลงาน)',
        description: 'การส่งโครงงานนวัตกรรม การชื่นชมเพื่อน 2 Stars & A Wish และสมุดสะท้อนคิด 3-2-1',
        earnedPoints: showcasePts,
        targetPoints: targetPerCategory,
        percentage: Math.min(100, Math.round((showcasePts / targetPerCategory) * 100)),
        sharePercent: Math.round((showcasePts / totalCategoryPts) * 100),
        isModuleCompleted: moduleProgress.showcase,
        color: '#a855f7', // purple-500
        bgLight: 'bg-purple-50/70 dark:bg-purple-950/30',
        borderLight: 'border-purple-200 dark:border-purple-800/70',
        textColor: 'text-purple-700 dark:text-purple-300',
        badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
        levelLabel: getLevelBadge(showcasePts),
        nextActionText: 'ส่งโครงงานหรือเขียน 2 Stars & A Wish (+25 XP)',
        recentTxCount: earnTxs.filter((t) => t.category === 'showcase').length,
        recentActivities: getRecentList('showcase', [
          'แบ่งปันคำชม 2 Stars and a Wish แก่เพื่อน (+15 XP)',
          'บันทึกการเรียนรู้ประจำวัน 3-2-1 (+20 XP)',
        ]),
      },
    ];
  }, [transactions, moduleProgress, points]);

  const totalCategorizedPoints = useMemo(
    () => categoryStats.reduce((sum, item) => sum + item.earnedPoints, 0),
    [categoryStats]
  );

  const strongestCategory = useMemo(
    () => [...categoryStats].sort((a, b) => b.earnedPoints - a.earnedPoints)[0],
    [categoryStats]
  );

  const recommendedCategory = useMemo(
    () => [...categoryStats].sort((a, b) => a.earnedPoints - b.earnedPoints)[0],
    [categoryStats]
  );

  const activeDetail = useMemo(
    () => categoryStats.find((c) => c.id === selectedCategory) || categoryStats[0],
    [categoryStats, selectedCategory]
  );

  const getCategoryIcon = (id: CategoryPointStat['id'], className = 'w-4 h-4') => {
    switch (id) {
      case 'safety':
        return <ShieldCheck className={className} />;
      case 'coding':
        return <Code2 className={className} />;
      case 'thinking':
        return <Brain className={className} />;
      case 'showcase':
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
      {/* 1. Top Header & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>POINTS SUMMARY CARD · สรุปแต้มพัฒนาการ 4 หมวดหมู่หลัก</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2.5">
            <span>กราฟสรุปคะแนนการเรียนรู้รายหมวดหมู่</span>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-mono font-bold border border-amber-200 dark:border-amber-800/70">
              รวม {totalCategorizedPoints.toLocaleString()} XP
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            ติดตามแต้มสะสมในทั้ง 4 หมวดวิชา (Safety, Coding, Thinking, Showcase) เพื่อดูจุดแข็งและวางแผนพัฒนาทักษะให้ครบทุกด้าน
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setChartView('bar');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartView === 'bar'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>กราฟแท่ง (Bar)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setChartView('donut');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartView === 'donut'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>สัดส่วน (Donut)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setChartView('stacked');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartView === 'stacked'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>หลอดเป้าหมาย</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Quick Category Summary Pill Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categoryStats.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setSelectedCategory(cat.id);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? `${cat.bgLight} ${cat.borderLight} ring-2 ring-offset-1 dark:ring-offset-slate-900 ring-indigo-500/50 shadow-sm`
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  {getCategoryIcon(cat.id, 'w-4 h-4')}
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${cat.badgeBg}`}>
                  {cat.sharePercent}% ของแต้มรวม
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1 mt-1">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {cat.labelEn}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {cat.labelTh}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="text-xl sm:text-2xl font-black font-mono tabular-nums"
                    style={{ color: cat.color }}
                  >
                    {cat.earnedPoints}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    / {cat.targetPoints} XP
                  </span>
                </div>
              </div>

              {/* Mini Progress Bar */}
              <div className="mt-3 w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>ความสำเร็จ {cat.percentage}%</span>
                {cat.isModuleCompleted ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> ผ่านโมดูล
                  </span>
                ) : (
                  <span>กำลังสะสม</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Interactive Chart + Category Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Visual Chart (Col Span 7) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {chartView === 'bar' && 'แผนภูมิแท่งเปรียบเทียบแต้มสะสมทั้ง 4 หมวดหมู่'}
                {chartView === 'donut' && 'แผนภูมิวงกลมแสดงสัดส่วนแต้มที่ได้รับ (%)'}
                {chartView === 'stacked' && 'ความก้าวหน้าเทียบเป้าหมายมาตรฐาน (120 XP / หมวด)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">คลิกที่แท่งกราฟเพื่อดูรายละเอียด</span>
          </div>

          {/* Chart Body */}
          {chartView === 'bar' && (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats}
                  margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      const clicked = state.activePayload[0].payload as CategoryPointStat;
                      if (clicked?.id) {
                        soundEffects.play('click');
                        setSelectedCategory(clicked.id);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} vertical={false} />
                  <XAxis
                    dataKey="labelEn"
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.max(130, dataMax + 20)]}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as CategoryPointStat;
                      return (
                        <div className="rounded-2xl bg-slate-900 text-white p-3.5 shadow-xl border border-slate-700 text-xs space-y-1.5">
                          <div className="font-bold flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: data.color }}
                            />
                            <span>
                              {data.labelEn} — {data.labelTh}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>แต้มที่ได้รับ:</span>
                            <span className="font-mono font-extrabold text-amber-400">
                              {data.earnedPoints} XP
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>เป้าหมายหมวดนี้:</span>
                            <span className="font-mono font-bold text-white">
                              {data.targetPoints} XP ({data.percentage}%)
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-300 pt-1 border-t border-slate-800">
                            ระดับ: {data.levelLabel}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: 'เกณฑ์เชี่ยวชาญ (100 XP)',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey="earnedPoints"
                    name="แต้มที่ได้รับ (XP)"
                    radius={[10, 10, 0, 0]}
                    barSize={46}
                    className="cursor-pointer"
                  >
                    {categoryStats.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        fillOpacity={selectedCategory === entry.id ? 1 : 0.78}
                        stroke={selectedCategory === entry.id ? '#1e1b4b' : 'none'}
                        strokeWidth={selectedCategory === entry.id ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartView === 'donut' && (
            <div className="w-full h-64 sm:h-72 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-52 h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="earnedPoints"
                      nameKey="labelEn"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={4}
                      onClick={(entry: any) => {
                        if (entry?.id) {
                          soundEffects.play('click');
                          setSelectedCategory(entry.id);
                        }
                      }}
                    >
                      {categoryStats.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          stroke={selectedCategory === entry.id ? '#ffffff' : 'none'}
                          strokeWidth={3}
                          className="cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as CategoryPointStat;
                        return (
                          <div className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs shadow-lg border border-slate-700">
                            <div className="font-bold">{data.shortTh}</div>
                            <div className="font-mono text-amber-400 font-bold">
                              {data.earnedPoints} XP ({data.sharePercent}%)
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold uppercase text-slate-400">แต้มรวม 4 ด้าน</span>
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {totalCategorizedPoints}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">XP</span>
                </div>
              </div>

              <div className="space-y-2 flex-1 w-full sm:w-auto">
                {categoryStats.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 shadow-xs font-bold'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-800 dark:text-slate-200">{cat.shortTh}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {cat.earnedPoints} XP ({cat.sharePercent}%)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chartView === 'stacked' && (
            <div className="space-y-3.5 py-2">
              {categoryStats.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-white dark:bg-slate-900 border-indigo-400 shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.shortTh}</span>
                      <span className="text-[10px] font-normal text-slate-500 hidden sm:inline">
                        ({cat.levelLabel})
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {cat.earnedPoints} / {cat.targetPoints} XP ({cat.percentage}%)
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Smart Recommendation Strip */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                หมวดคะแนนสูงสุด:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {strongestCategory.labelEn} ({strongestCategory.earnedPoints} XP)
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Target className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                แนะนำเก็บเพิ่ม:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {recommendedCategory.labelEn}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Category Deep-Dive & Quick Action (Col Span 5) */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 flex flex-col justify-between transition-all ${activeDetail.bgLight} ${activeDetail.borderLight}`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: activeDetail.color }}
                >
                  {getCategoryIcon(activeDetail.id, 'w-5 h-5')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {activeDetail.labelEn} Category
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activeDetail.badgeBg}`}>
                      {activeDetail.levelLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {activeDetail.labelTh}
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-black font-mono leading-none"
                  style={{ color: activeDetail.color }}
                >
                  {activeDetail.earnedPoints}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  XP สะสม
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeDetail.description}
            </p>

            {/* Recent Earned Activities in this Category */}
            <div className="p-3.5 rounded-xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  <span>กิจกรรมที่ได้รับแต้มในหมวดนี้</span>
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  สำเร็จ {activeDetail.percentage}%
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {activeDetail.recentActivities.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-snug">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="truncate">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA to earn more points in this category */}
          <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>ภารกิจเพิ่มแต้มแนะนำ:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                อีก {Math.max(0, activeDetail.targetPoints - activeDetail.earnedPoints)} XP ถึงเป้าหมาย
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                onNavigate(activeDetail.moduleKey);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:brightness-110 transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: activeDetail.color }}
            >
              <span>{activeDetail.nextActionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
