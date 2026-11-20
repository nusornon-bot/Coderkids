import React, { useMemo } from 'react';
import {
  ArrowDownWideNarrow,
  Flame,
  Maximize2,
  Minimize2,
  Radio,
  Trophy,
  Users,
} from 'lucide-react';
import type { LiveQuizParticipantRecord } from '../services/firestoreService.ts';
import { sortParticipantsByScoreDesc } from '../utils/liveScoreboardSort.ts';

interface LiveClassroomScoreboardProps {
  participants: LiveQuizParticipantRecord[];
  roomCode: string;
  accent?: 'indigo' | 'amber';
  compact?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  currentParticipantId?: string;
  title?: string;
}

export const LiveClassroomScoreboard: React.FC<LiveClassroomScoreboardProps> = ({
  participants,
  roomCode,
  accent = 'indigo',
  compact = false,
  expanded = false,
  onToggleExpand,
  currentParticipantId,
  title = 'คะแนนนักเรียนแบบเรียลไทม์',
}) => {
  const sortedParticipants = useMemo(
    () => sortParticipantsByScoreDesc(participants),
    [participants]
  );

  const topScore =
    sortedParticipants.length > 0 ? Math.max(sortedParticipants[0].score, 1) : 1;
  const averageScore =
    sortedParticipants.length > 0
      ? Math.round(
          sortedParticipants.reduce((sum, p) => sum + p.score, 0) / sortedParticipants.length
        )
      : 0;
  const activeResponders = sortedParticipants.filter(
    (p) => p.score > 0 || p.lastAnswerIndex >= 0
  ).length;

  const accentBorder =
    accent === 'amber' ? 'border-amber-500/30' : 'border-emerald-500/30';
  const accentBar =
    accent === 'amber'
      ? 'from-amber-400 to-orange-500'
      : 'from-emerald-400 to-cyan-400';
  const accentScoreText =
    accent === 'amber' ? 'text-amber-300' : 'text-emerald-300';

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center text-xs font-black shrink-0"
          title="อันดับ 1"
        >
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-slate-300/15 border border-slate-300/40 text-slate-200 flex items-center justify-center text-xs font-black shrink-0"
          title="อันดับ 2"
        >
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-orange-400/15 border border-orange-400/40 text-orange-300 flex items-center justify-center text-xs font-black shrink-0"
          title="อันดับ 3"
        >
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
        {rank}
      </span>
    );
  };

  return (
    <div
      className={`w-full rounded-2xl bg-slate-900/90 border ${accentBorder} text-left shadow-lg overflow-hidden`}
    >
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-300 uppercase tracking-wider shrink-0">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs font-bold text-white truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-[10px] font-semibold text-slate-300"
            title="เรียงอันดับคะแนนจากมากไปน้อยอัตโนมัติ"
          >
            <ArrowDownWideNarrow className="w-3 h-3 text-amber-400" />
            <span>มาก → น้อย</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            {sortedParticipants.length} คน
          </span>
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
              title={expanded ? 'ย่อตารางคะแนน' : 'ขยายกระดานคะแนนสดเต็มความกว้าง'}
            >
              {expanded ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span>ย่อ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3" />
                  <span>ขยายสด</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Live Metrics (when at least 1 participant exists and not compact) */}
      {!compact && sortedParticipants.length > 0 && (
        <div className="grid grid-cols-3 gap-2 px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/80 text-center">
          <div className="rounded-xl bg-slate-800/60 px-2 py-1.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">คะแนนสูงสุด</div>
            <div className={`text-xs sm:text-sm font-black font-mono tabular-nums ${accentScoreText}`}>
              {sortedParticipants[0].score.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/60 px-2 py-1.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">เฉลี่ยห้อง</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-sky-300">
              {averageScore.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/60 px-2 py-1.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">เริ่มตอบแล้ว</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-amber-300">
              {activeResponders}/{sortedParticipants.length}
            </div>
          </div>
        </div>
      )}

      {/* Participant List */}
      <div
        className={`p-3 space-y-2 overflow-y-auto ${
          expanded ? 'max-h-[420px]' : compact ? 'max-h-44' : 'max-h-64'
        }`}
      >
        {sortedParticipants.length === 0 ? (
          <div className="py-4 px-2 text-center space-y-1">
            <Trophy className="w-6 h-6 text-slate-600 mx-auto" />
            <div className="text-xs font-semibold text-slate-300">
              รอรับนักเรียนเข้าห้อง PIN {roomCode}
            </div>
            <div className="text-[11px] text-slate-400">
              เมื่อนักเรียนกรอกรหัสและเริ่มตอบ คะแนนแต่ละคนจะอัปเดตทันทีแบบเรียลไทม์
            </div>
          </div>
        ) : (
          sortedParticipants.map((p, idx) => {
            const rank = idx + 1;
            const isSelf = Boolean(currentParticipantId && p.userId === currentParticipantId);
            const barWidth =
              p.score > 0 ? Math.max(8, Math.round((p.score / topScore) * 100)) : 0;
            const hasAnswered = p.score > 0 || p.lastAnswerIndex >= 0;

            return (
              <div
                key={p.userId}
                className={`rounded-xl px-3 py-2 border transition-all duration-300 ${
                  rank === 1 && p.score > 0
                    ? 'bg-amber-500/10 border-amber-500/35'
                    : isSelf
                    ? 'bg-indigo-500/15 border-indigo-400/40'
                    : 'bg-slate-800/60 border-slate-700/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getRankBadge(rank)}
                    <span className="text-sm shrink-0" aria-hidden="true">
                      {p.avatar || '⚡'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`font-bold truncate ${
                            expanded ? 'text-sm' : 'text-xs'
                          } ${isSelf ? 'text-amber-300' : 'text-white'}`}
                        >
                          {p.displayName}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                            คุณ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{hasAnswered ? 'กำลังแข่งขัน' : 'เข้าห้องแล้ว'}</span>
                        {p.streak >= 2 && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-amber-400">
                            <Flame className="w-3 h-3 fill-current" />
                            Streak x{p.streak}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-black font-mono tabular-nums ${
                        expanded ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
                      } ${accentScoreText}`}
                    >
                      {p.score.toLocaleString()}{' '}
                      <span className="text-[10px] font-semibold text-slate-400">pts</span>
                    </div>
                  </div>
                </div>

                {/* Real-time visual progress bar relative to room leader */}
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-950/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accentBar} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
