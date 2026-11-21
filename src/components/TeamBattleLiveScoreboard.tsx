import React, { useMemo } from 'react';
import {
  ArrowDownWideNarrow,
  Crown,
  Flame,
  Maximize2,
  Minimize2,
  Radio,
  Trophy,
} from 'lucide-react';
import { sortParticipantsByScoreDesc } from '../utils/liveScoreboardSort.ts';

export interface TeamScoreboardEntry {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgGradient: string;
  score: number;
  streak: number;
  correctCount?: number;
  lastScoreDelta?: number;
  lastUpdatedAtMs?: number;
}

interface TeamBattleLiveScoreboardProps {
  teams: TeamScoreboardEntry[];
  roomCode?: string;
  joinedTeamId?: string | null;
  activeAnsweringTeamId?: string | null;
  currentRoundNumber?: number;
  totalRounds?: number;
  isBigScreen?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const TeamBattleLiveScoreboard: React.FC<TeamBattleLiveScoreboardProps> = ({
  teams,
  roomCode,
  joinedTeamId,
  activeAnsweringTeamId,
  currentRoundNumber,
  totalRounds,
  isBigScreen = false,
  expanded = false,
  onToggleExpand,
}) => {
  const sortedTeams = useMemo(() => {
    const sortable = teams.map((team) => ({
      ...team,
      userId: team.id,
      displayName: team.name,
      updatedAtMs: team.lastUpdatedAtMs,
    }));
    return sortParticipantsByScoreDesc(sortable);
  }, [teams]);

  const leaderScore = sortedTeams.length > 0 ? Math.max(sortedTeams[0].score, 1) : 1;
  const secondScore = sortedTeams.length > 1 ? sortedTeams[1].score : 0;
  const leadMargin =
    sortedTeams.length > 1 ? Math.max(0, sortedTeams[0].score - secondScore) : 0;
  const averageScore =
    sortedTeams.length > 0
      ? Math.round(sortedTeams.reduce((sum, t) => sum + t.score, 0) / sortedTeams.length)
      : 0;

  const renderRankMarker = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-black shrink-0"
          title="อันดับ 1"
        >
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm font-black shrink-0"
          title="อันดับ 2"
        >
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 flex items-center justify-center text-sm font-black shrink-0"
          title="อันดับ 3"
        >
          🥉
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-black font-mono tabular-nums shrink-0">
        {rank}
      </span>
    );
  };

  return (
    <section
      aria-label="ตารางอันดับคะแนนทีมแบบเรียลไทม์"
      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <h3
              className={`font-black text-slate-900 dark:text-white ${
                isBigScreen ? 'text-lg' : 'text-sm sm:text-base'
              }`}
            >
              ตารางอันดับทีมแบบเรียลไทม์ (Live Team Scoreboard)
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
              <Radio className="w-3.5 h-3.5" />
              <span>อัปเดตสด</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ArrowDownWideNarrow className="w-3.5 h-3.5 text-indigo-500" />
              <span>เรียงคะแนนมาก → น้อย</span>
            </span>
            {roomCode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  ห้อง {roomCode}
                </span>
              </>
            )}
            {typeof currentRoundNumber === 'number' && typeof totalRounds === 'number' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  ข้อ {currentRoundNumber} / {totalRounds}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">นำสูงสุด </span>
              <span className="font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {sortedTeams[0]?.score.toLocaleString() ?? 0}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              |
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">เฉลี่ย </span>
              <span className="font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                {averageScore.toLocaleString()}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              |
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">ห่างอันดับ 2 </span>
              <span className="font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {leadMargin > 0 ? `+${leadMargin}` : 'เสมอ'}
              </span>
            </div>
          </div>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title={expanded ? 'ย่อมุมมองตารางคะแนน' : 'ขยายตารางคะแนน'}
            >
              {expanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>ย่อมุมมอง</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ขยายตาราง</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rankings Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {sortedTeams.map((team, idx) => {
          const rank = idx + 1;
          const isLeader = rank === 1 && team.score > 0;
          const isUserTeam = Boolean(joinedTeamId && team.id === joinedTeamId);
          const isAnswering = Boolean(activeAnsweringTeamId && team.id === activeAnsweringTeamId);
          const widthPercent =
            team.score > 0 ? Math.max(8, Math.round((team.score / leaderScore) * 100)) : 0;
          const gapFromLeader = sortedTeams[0] ? Math.max(0, sortedTeams[0].score - team.score) : 0;

          return (
            <div
              key={team.id}
              data-testid={`team-rank-row-${team.id}`}
              className={`px-5 transition-colors duration-200 ${expanded ? 'py-4' : 'py-3'} ${
                isAnswering
                  ? 'bg-amber-50/90 dark:bg-amber-950/35'
                  : isUserTeam
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/25'
                  : isLeader
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/15'
                  : 'bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankMarker(rank)}
                  <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">
                    {team.emoji}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold truncate ${
                          isBigScreen || expanded ? 'text-base' : 'text-sm'
                        } text-slate-900 dark:text-white`}
                      >
                        {team.name}
                      </span>
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Crown className="w-3.5 h-3.5" />
                          <span>อันดับ 1</span>
                        </span>
                      )}
                      {isUserTeam && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          · ทีมของคุณ
                        </span>
                      )}
                      {isAnswering && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          · กำลังตอบคำถาม
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                        <Flame className="w-3 h-3" />
                        <span>Streak {team.streak}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        ตอบถูก {team.correctCount ?? 0} ข้อ
                      </span>
                      {rank > 1 && gapFromLeader > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            ตามผู้นำ -{gapFromLeader}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1.5">
                    {typeof team.lastScoreDelta === 'number' && team.lastScoreDelta > 0 && (
                      <span className="text-xs font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{team.lastScoreDelta}
                      </span>
                    )}
                    <span
                      className={`font-black font-mono tabular-nums ${
                        isBigScreen || expanded ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                      } text-slate-900 dark:text-white`}
                    >
                      {team.score.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">แต้ม</span>
                  </div>
                </div>
              </div>

              {/* Relative Progress Bar */}
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${team.bgGradient} transition-all duration-300`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
