import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, ListOrdered } from 'lucide-react';
import {
  buildScoreChartMetrics,
  type BattleClosedRankedParticipant,
  type ScoreChartDatum,
} from '../utils/battleCloseSummary.ts';

interface PostBattleScoreChartProps {
  participants: readonly BattleClosedRankedParticipant[];
  currentParticipantId?: string;
  isRoomClosed: boolean;
}

type ViewTab = 'chart' | 'ledger';
type OrientationMode = 'auto' | 'vertical' | 'horizontal';

function getBarColor(entry: ScoreChartDatum, isSelf: boolean): string {
  if (entry.rank === 1) return '#F59E0B';
  if (entry.rank === 2) return '#CBD5E1';
  if (entry.rank === 3) return '#FB923C';
  if (isSelf) return '#818CF8';
  return '#38BDF8';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScoreChartDatum }>;
  isRoomClosed: boolean;
}

const ScoreTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isRoomClosed }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const deltaPrefix = item.deltaFromAverage > 0 ? '+' : '';
  const deltaLabel =
    item.deltaFromAverage > 0
      ? `สูงกว่าค่าเฉลี่ย ${deltaPrefix}${item.deltaFromAverage.toLocaleString()} pts`
      : item.deltaFromAverage < 0
      ? `ต่ำกว่าค่าเฉลี่ย ${item.deltaFromAverage.toLocaleString()} pts`
      : 'เท่ากับค่าเฉลี่ยห้องพอดี';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3.5 py-2.5 shadow-xl text-left min-w-[200px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold text-white truncate max-w-[160px]">
          {item.avatar} {item.displayName}
        </span>
        <span className="font-mono tabular-nums text-xs font-black text-amber-300 shrink-0">
          #{item.rank}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-slate-800 pt-1.5">
        <span className="text-[11px] text-slate-400">คะแนนรวม</span>
        <span className="font-mono tabular-nums text-sm font-black text-white">
          {item.score.toLocaleString()} pts
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
        <span className="text-slate-400">
          {isRoomClosed ? 'เหรียญ XP ที่ได้รับ' : 'เหรียญ XP รางวัล'}
        </span>
        <span className="font-mono tabular-nums font-bold text-amber-300">
          +{item.xpReward} XP {item.isTopThree ? '(Top 3)' : ''}
        </span>
      </div>
      {item.streak >= 2 && (
        <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
          <span className="text-slate-400">ตอบถูกต่อเนื่อง</span>
          <span className="font-mono tabular-nums font-semibold text-emerald-300">
            x{item.streak}
          </span>
        </div>
      )}
      <div className="mt-1.5 pt-1 border-t border-slate-800/80 text-[11px] text-sky-300">
        {deltaLabel}
      </div>
    </div>
  );
};

export const PostBattleScoreChart: React.FC<PostBattleScoreChartProps> = ({
  participants,
  currentParticipantId,
  isRoomClosed,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('chart');
  const [orientation, setOrientation] = useState<OrientationMode>('auto');

  const metrics = useMemo(() => buildScoreChartMetrics(participants), [participants]);

  if (metrics.data.length === 0) {
    return null;
  }

  const effectiveOrientation: 'vertical' | 'horizontal' =
    orientation === 'auto'
      ? metrics.data.length > 9
        ? 'horizontal'
        : 'vertical'
      : orientation;

  const maxScoreDomain = Math.max(metrics.maxScore, 10);
  const horizontalChartHeight = Math.max(260, metrics.data.length * 42 + 44);

  return (
    <section
      aria-label="กราฟสรุปคะแนนของนักเรียนทุกคน"
      className="rounded-2xl border border-slate-800 bg-slate-900/85 overflow-hidden"
    >
      {/* Header & Interactive View Controls */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-white">
            <BarChart3 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>กราฟสรุปคะแนนของนักเรียนทุกคน</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-slate-300">
              ทั้งหมด {metrics.data.length} คน
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              ค่าเฉลี่ยห้อง <strong className="text-sky-300">{metrics.averageScore.toLocaleString()}</strong> pts
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              ค่ากลาง <strong className="text-slate-200">{metrics.medianScore.toLocaleString()}</strong> pts
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              ผ่านเกณฑ์เฉลี่ย <strong className="text-emerald-300">{metrics.aboveAverageCount}</strong> คน
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Chart Orientation Switcher (only in chart tab when >= 2 students) */}
          {activeTab === 'chart' && metrics.data.length >= 2 && (
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800"
              role="group"
              aria-label="ทิศทางกราฟแท่ง"
            >
              <button
                type="button"
                onClick={() => setOrientation('vertical')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  effectiveOrientation === 'vertical'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                แท่งแนวตั้ง
              </button>
              <button
                type="button"
                onClick={() => setOrientation('horizontal')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  effectiveOrientation === 'horizontal'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                แท่งแนวนอน
              </button>
            </div>
          )}

          {/* Primary Tab Switcher: Graph vs Ranked Ledger */}
          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800"
            role="tablist"
            aria-label="รูปแบบการแสดงผลคะแนน"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chart'}
              onClick={() => setActiveTab('chart')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-sky-500/20 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>กราฟคะแนน</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ledger'}
              onClick={() => setActiveTab('ledger')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-sky-500/20 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>ตารางอันดับ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Interactive Recharts All-Students Score Graph */}
      {activeTab === 'chart' ? (
        <div className="p-4 sm:p-5 space-y-3">
          {/* Clean Legend Key */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" aria-hidden="true" />
                <span className="text-slate-300">อันดับ 1 (+150 XP)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" aria-hidden="true" />
                <span className="text-slate-300">อันดับ 2 (+100 XP)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" aria-hidden="true" />
                <span className="text-slate-300">อันดับ 3 (+60 XP)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" aria-hidden="true" />
                <span className="text-slate-300">ผู้เข้าร่วม (+20 XP)</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-sky-300">
              <span className="w-4 border-t-2 border-dashed border-sky-400 inline-block" aria-hidden="true" />
              <span>เส้นประ = ค่าเฉลี่ยห้อง ({metrics.averageScore.toLocaleString()} pts)</span>
            </div>
          </div>

          {effectiveOrientation === 'vertical' ? (
            <div className="w-full h-[300px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.data}
                  margin={{ top: 26, right: 18, left: 6, bottom: 26 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#CBD5E1', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    interval={0}
                    angle={metrics.data.length > 6 ? -18 : 0}
                    textAnchor={metrics.data.length > 6 ? 'end' : 'middle'}
                    height={metrics.data.length > 6 ? 52 : 34}
                  />
                  <YAxis
                    domain={[0, Math.ceil(maxScoreDomain * 1.15)]}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={<ScoreTooltip isRoomClosed={isRoomClosed} />}
                  />
                  {metrics.averageScore > 0 && (
                    <ReferenceLine
                      y={metrics.averageScore}
                      stroke="#38BDF8"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                    />
                  )}
                  <Bar
                    dataKey="score"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={56}
                    isAnimationActive={false}
                  >
                    {metrics.data.map((entry) => {
                      const isSelf = Boolean(
                        currentParticipantId && entry.userId === currentParticipantId
                      );
                      return (
                        <Cell
                          key={`${entry.userId}_${entry.rank}`}
                          fill={getBarColor(entry, isSelf)}
                          stroke={isSelf ? '#E0E7FF' : 'none'}
                          strokeWidth={isSelf ? 2 : 0}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="score"
                      position="top"
                      formatter={(val: unknown) =>
                        typeof val === 'number' ? val.toLocaleString() : String(val ?? '')
                      }
                      style={{
                        fill: '#F8FAFC',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full max-h-[440px] overflow-y-auto pr-1">
              <div style={{ height: horizontalChartHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.data}
                    layout="vertical"
                    margin={{ top: 10, right: 56, left: 10, bottom: 10 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, Math.ceil(maxScoreDomain * 1.15)]}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortLabel"
                      width={136}
                      tick={{ fill: '#E2E8F0', fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                      content={<ScoreTooltip isRoomClosed={isRoomClosed} />}
                    />
                    {metrics.averageScore > 0 && (
                      <ReferenceLine
                        x={metrics.averageScore}
                        stroke="#38BDF8"
                        strokeDasharray="5 5"
                        strokeWidth={1.5}
                      />
                    )}
                    <Bar
                      dataKey="score"
                      radius={[2, 8, 8, 2]}
                      barSize={24}
                      isAnimationActive={false}
                    >
                      {metrics.data.map((entry) => {
                        const isSelf = Boolean(
                          currentParticipantId && entry.userId === currentParticipantId
                        );
                        return (
                          <Cell
                            key={`${entry.userId}_${entry.rank}`}
                            fill={getBarColor(entry, isSelf)}
                            stroke={isSelf ? '#E0E7FF' : 'none'}
                            strokeWidth={isSelf ? 2 : 0}
                          />
                        );
                      })}
                      <LabelList
                        dataKey="score"
                        position="right"
                        formatter={(val: unknown) =>
                          typeof val === 'number'
                            ? `${val.toLocaleString()} pts`
                            : String(val ?? '')
                        }
                        style={{
                          fill: '#F8FAFC',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Detailed Ranked Ledger with Tabular Numerals & XP Allocation */
        <div className="divide-y divide-slate-800/80 max-h-[380px] overflow-y-auto">
          {metrics.data.map((entry) => {
            const barPct =
              entry.score > 0
                ? Math.max(6, Math.round((entry.score / Math.max(metrics.maxScore, 1)) * 100))
                : 0;
            const isSelf = Boolean(
              currentParticipantId && entry.userId === currentParticipantId
            );
            const barGradient =
              entry.rank === 1
                ? 'from-amber-400 to-yellow-300'
                : entry.rank === 2
                ? 'from-slate-300 to-sky-200'
                : entry.rank === 3
                ? 'from-orange-400 to-amber-500'
                : 'from-sky-400 to-indigo-400';

            return (
              <div
                key={`${entry.userId}_${entry.rank}`}
                className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  isSelf ? 'bg-indigo-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                  <span
                    className={`w-7 text-center font-mono tabular-nums font-black text-sm shrink-0 ${
                      entry.rank === 1
                        ? 'text-amber-300'
                        : entry.rank === 2
                        ? 'text-slate-200'
                        : entry.rank === 3
                        ? 'text-orange-300'
                        : 'text-slate-400'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <span className="text-base shrink-0" aria-hidden="true">
                    {entry.avatar}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {entry.displayName}
                      {isSelf ? ' (คุณ)' : ''}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {entry.streak >= 2 ? `ตอบถูกต่อเนื่อง x${entry.streak}` : 'ผู้เข้าแข่งขัน'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-mono tabular-nums text-sm font-black text-white shrink-0">
                    {entry.score.toLocaleString()}{' '}
                    <span className="text-[11px] font-medium text-slate-400">pts</span>
                  </div>
                </div>

                <div className="sm:w-36 flex items-center sm:justify-end gap-1.5 font-mono tabular-nums text-xs sm:text-sm font-black shrink-0">
                  <span className={entry.isTopThree ? 'text-amber-300' : 'text-slate-300'}>
                    +{entry.xpReward} XP
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-slate-400">
                    {isRoomClosed ? '· แจกแล้ว' : entry.isTopThree ? '· Top 3' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
