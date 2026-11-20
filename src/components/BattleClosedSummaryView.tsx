import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  KeyRound,
  Loader2,
  Plus,
  Power,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  BattleClosedSummaryData,
  BattleClosedWinner,
  StudentClosedRoomReward,
} from '../utils/battleCloseSummary.ts';
import { PostBattleScoreChart } from './PostBattleScoreChart.tsx';

export interface PostBattlePersonalStats {
  displayName: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  contextLabel?: string;
}

interface BattleClosedSummaryViewProps {
  summary: BattleClosedSummaryData;
  isTeacher: boolean;
  /** 'live' = Post-Battle Summary right after last question (room still open); 'closed' = Room closed & XP coins auto-awarded */
  stage?: 'live' | 'closed';
  currentParticipantId?: string;
  studentReward?: StudentClosedRoomReward | null;
  personalStats?: PostBattlePersonalStats | null;
  removedCount?: number;
  isBusy?: boolean;
  onCloseRoomAndAwardXp?: () => void;
  onStartFreshRound?: () => void;
  onCreateNewRoom?: () => void;
  onBackToLobby: () => void;
  onCloseModal: () => void;
}

const STAGE_BANNER_SRC = '/src/assets/images/battle_podium_stage_banner_1795166534406.jpg';

const XpCoinSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="xpCoinOuter" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="xpCoinInner" x1="8" y1="7" x2="28" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="16.5" fill="url(#xpCoinOuter)" stroke="#FEF9C3" strokeWidth="1.2" />
    <circle cx="18" cy="18" r="12.5" fill="url(#xpCoinInner)" stroke="#FDE68A" strokeWidth="1" />
    <path
      d="M19.8 9.8L13.5 19.2H18.1L16.2 26.2L22.5 16.8H17.9L19.8 9.8Z"
      fill="#FFFBEB"
      stroke="#92400E"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
  </svg>
);

const MedalEmblemSvg: React.FC<{ rank: 1 | 2 | 3; className?: string }> = ({
  rank,
  className = 'w-14 h-14',
}) => {
  const palette =
    rank === 1
      ? {
          ribbonL: '#B91C1C',
          ribbonR: '#DC2626',
          rimStart: '#FEF08A',
          rimEnd: '#B45309',
          faceStart: '#FDE047',
          faceEnd: '#D97706',
          text: '#78350F',
          label: '1',
        }
      : rank === 2
      ? {
          ribbonL: '#1D4ED8',
          ribbonR: '#2563EB',
          rimStart: '#F8FAFC',
          rimEnd: '#64748B',
          faceStart: '#E2E8F0',
          faceEnd: '#94A3B8',
          text: '#1E293B',
          label: '2',
        }
      : {
          ribbonL: '#0F766E',
          ribbonR: '#0D9488',
          rimStart: '#FED7AA',
          rimEnd: '#9A3412',
          faceStart: '#FDBA74',
          faceEnd: '#C2410C',
          text: '#431407',
          label: '3',
        };

  const gradRimId = `medalRim_${rank}`;
  const gradFaceId = `medalFace_${rank}`;

  return (
    <svg
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`เหรียญรางวัลอันดับ ${rank}`}
    >
      <defs>
        <linearGradient id={gradRimId} x1="12" y1="20" x2="52" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.rimStart} />
          <stop offset="100%" stopColor={palette.rimEnd} />
        </linearGradient>
        <linearGradient id={gradFaceId} x1="16" y1="24" x2="48" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.faceStart} />
          <stop offset="100%" stopColor={palette.faceEnd} />
        </linearGradient>
      </defs>
      <path d="M16 2H29L34 26H22L16 2Z" fill={palette.ribbonL} />
      <path d="M48 2H35L30 26H42L48 2Z" fill={palette.ribbonR} />
      <circle
        cx="32"
        cy="44"
        r="22"
        fill={`url(#${gradRimId})`}
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="44"
        r="17.5"
        fill={`url(#${gradFaceId})`}
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {rank === 1 && (
        <path
          d="M24 34L27.5 37.5L32 31.5L36.5 37.5L40 34L38.5 40H25.5L24 34Z"
          fill="#FFFBEB"
          opacity="0.92"
        />
      )}
      <text
        x="32"
        y={rank === 1 ? '55' : '51'}
        textAnchor="middle"
        fill={palette.text}
        fontSize={rank === 1 ? '17' : '21'}
        fontWeight="900"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {palette.label}
      </text>
    </svg>
  );
};

export const BattleClosedSummaryView: React.FC<BattleClosedSummaryViewProps> = ({
  summary,
  isTeacher,
  stage = 'closed',
  currentParticipantId,
  studentReward,
  personalStats,
  removedCount,
  isBusy = false,
  onCloseRoomAndAwardXp,
  onStartFreshRound,
  onCreateNewRoom,
  onBackToLobby,
  onCloseModal,
}) => {
  const [bannerError, setBannerError] = useState(false);
  const isClosed = stage === 'closed';

  const fireVictoryConfetti = () => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#FACC15', '#F59E0B', '#38BDF8', '#34D399', '#F8FAFC'],
      });
    } catch {
      // Ignore confetti issues in non-canvas environments
    }
  };

  useEffect(() => {
    if (summary.topWinners.length > 0) {
      fireVictoryConfetti();
    }
  }, [summary.roomCode, stage, summary.topWinners.length]);

  const winner1 = summary.topWinners.find((w) => w.rank === 1) || null;
  const winner2 = summary.topWinners.find((w) => w.rank === 2) || null;
  const winner3 = summary.topWinners.find((w) => w.rank === 3) || null;

  // Classic podium display order: 2nd (Left) — 1st (Tall Center) — 3rd (Right)
  const podiumSlots: Array<{
    rank: 1 | 2 | 3;
    winner: BattleClosedWinner | null;
    pedestalHeightClass: string;
    orderClass: string;
    columnGradient: string;
    borderAccent: string;
    scoreColor: string;
  }> = [
    {
      rank: 2,
      winner: winner2,
      pedestalHeightClass: 'min-h-[140px] sm:min-h-[168px]',
      orderClass: 'order-2 md:order-1',
      columnGradient: 'from-slate-700/80 via-slate-800/90 to-slate-900',
      borderAccent: 'border-slate-400/45',
      scoreColor: 'text-slate-100',
    },
    {
      rank: 1,
      winner: winner1,
      pedestalHeightClass: 'min-h-[172px] sm:min-h-[214px]',
      orderClass: 'order-1 md:order-2',
      columnGradient: 'from-amber-500/30 via-amber-900/40 to-slate-900',
      borderAccent: 'border-amber-400/70',
      scoreColor: 'text-amber-300',
    },
    {
      rank: 3,
      winner: winner3,
      pedestalHeightClass: 'min-h-[124px] sm:min-h-[146px]',
      orderClass: 'order-3 md:order-3',
      columnGradient: 'from-orange-600/25 via-orange-950/50 to-slate-900',
      borderAccent: 'border-orange-400/50',
      scoreColor: 'text-orange-200',
    },
  ];

  const modeDisplayLabel =
    summary.battleMode === 'onet'
      ? 'Live Classroom O-NET Battle'
      : 'Live Classroom Coding Battle';

  const accuracyPct =
    personalStats && personalStats.totalQuestions > 0
      ? Math.round((personalStats.correctCount / personalStats.totalQuestions) * 100)
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Architectural Victory Stage Header with Generated Stage Backdrop */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
        <div className="relative min-h-[210px] sm:min-h-[236px] flex flex-col justify-end p-5 sm:p-8">
          {!bannerError ? (
            <img
              src={STAGE_BANNER_SRC}
              alt="เวทีประกาศผลคะแนนและรางวัลหลังจบการแข่งขัน"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950"
              aria-hidden="true"
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/35"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-amber-300/95">
                <span>{modeDisplayLabel}</span>
                {summary.roomCode && (
                  <>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-200">
                      รหัสห้อง {summary.roomCode}
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="text-slate-500">
                  ·
                </span>
                <span className={isClosed ? 'text-emerald-300' : 'text-sky-300'}>
                  {isClosed ? 'ปิดห้องและแจกเหรียญ XP แล้ว' : 'สรุปผลหลังจบการแข่งขัน (Post-Battle Summary)'}
                </span>
                {isClosed && summary.closedAtLabel && (
                  <>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      เวลา {summary.closedAtLabel} น.
                    </span>
                  </>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
                {isClosed
                  ? 'สรุปผลคะแนนและมอบเหรียญ XP รางวัลเรียบร้อย'
                  : 'สรุปผลคะแนนหลังจบการแข่งขัน'}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isClosed
                  ? summary.totalParticipants > 0
                    ? isTeacher
                      ? `ปิดห้องและลบรายชื่อผู้เข้าร่วมอัตโนมัติแล้ว (${
                          typeof removedCount === 'number' ? removedCount : summary.totalParticipants
                        } คน) พร้อมแจกเหรียญ XP รางวัลให้อันดับ 1–3 เรียบร้อย`
                      : `คุณครู ${summary.hostName} ปิดห้องประลองเรียบร้อยแล้ว ขอแสดงความยินดีกับผู้ชนะทั้ง 3 อันดับแรก!`
                    : `ปิดห้องเรียนรหัส ${summary.roomCode} เรียบร้อยแล้ว (ยังไม่มีนักเรียนเข้าร่วมในรอบนี้)`
                  : isTeacher
                  ? 'ตรวจสอบกราฟคะแนนของนักเรียนทุกคนด้านล่าง แล้วกดปุ่มปิดห้อง Battle เพื่อแจกเหรียญ XP รางวัลให้อันดับ 1–3 อัตโนมัติ'
                  : personalStats
                  ? `${personalStats.displayName} ตอบถูก ${personalStats.correctCount}/${personalStats.totalQuestions} ข้อ${
                      accuracyPct !== null ? ` (${accuracyPct}%)` : ''
                    } ทำคะแนนได้ ${personalStats.score.toLocaleString()} คะแนน · รอคุณครูปิดห้องเพื่อรับเหรียญ XP รางวัลอัตโนมัติ`
                  : 'ตรวจสอบอันดับและกราฟคะแนนรวมของห้องเรียนด้านล่าง'}
              </p>
            </div>

            {summary.topWinners.length > 0 && (
              <button
                type="button"
                onClick={fireVictoryConfetti}
                className="self-start md:self-end inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-amber-400/40 text-amber-200 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>ฉลองผลรางวัล</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Quantitative Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-t border-slate-800 bg-slate-900/95">
          <div className="px-4 py-3.5">
            <div className="text-xs text-slate-400">นักเรียนเข้าร่วม</div>
            <div className="mt-1 text-xl font-black text-white font-mono tabular-nums">
              {summary.totalParticipants}{' '}
              <span className="text-xs font-semibold text-slate-400">คน</span>
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-xs text-slate-400">คะแนนสูงสุด</div>
            <div className="mt-1 text-xl font-black text-amber-300 font-mono tabular-nums">
              {summary.topScore.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-400">pts</span>
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-xs text-slate-400">คะแนนเฉลี่ยห้อง</div>
            <div className="mt-1 text-xl font-black text-sky-300 font-mono tabular-nums">
              {summary.averageScore.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-400">pts</span>
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-xs text-slate-400">
              {isClosed ? 'เหรียญ XP ที่แจกอันดับ 1–3' : 'เหรียญ XP เตรียมแจกอันดับ 1–3'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-black text-emerald-300 font-mono tabular-nums">
              <XpCoinSvg className="w-5 h-5 shrink-0" />
              <span>+{summary.topThreeXpAwarded.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-400">XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Teacher Auto-Award XP & Close Room Control Panel (Primary Focal Action when Live) */}
      {isTeacher && !isClosed && onCloseRoomAndAwardXp && (
        <div className="rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
              <XpCoinSvg className="w-7 h-7" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ปิดห้อง Battle และแจกเหรียญ XP รางวัลให้อันดับ 1–3 อัตโนมัติ
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                เมื่อกดปุ่มนี้ ระบบจะบันทึกผู้ชนะอันดับ 1 (+150 XP) · อันดับ 2 (+100 XP) · อันดับ 3 (+60 XP) ลงฐานข้อมูล
                ส่งเหรียญ XP เข้าโปรไฟล์นักเรียนทันที และเคลียร์รายชื่อผู้เข้าแข่งขันในห้องให้อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={onCloseRoomAndAwardXp}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>
              {isBusy
                ? 'กำลังปิดห้องและแจกเหรียญ XP...'
                : 'ปิดห้อง Battle และแจกเหรียญ XP อันดับ 1–3 อัตโนมัติ'}
            </span>
          </button>
        </div>
      )}

      {/* 2b. Confirmed XP Award Status Strip (Teacher View after Close) */}
      {isTeacher && isClosed && summary.topWinners.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              แจกเหรียญ XP รางวัลให้อันดับ 1–3 อัตโนมัติเรียบร้อยแล้ว (รวม +{summary.topThreeXpAwarded} XP สำหรับ 3 อันดับแรก · รวมทั้งห้อง +{summary.totalXpAwarded} XP)
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums text-emerald-300 shrink-0">
            บันทึกผลบน Cloud สำเร็จ
          </span>
        </div>
      )}

      {/* 2c. Personal Student Reward Callout (Student View Only when Closed) */}
      {!isTeacher && isClosed && studentReward && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            studentReward.isTopThree
              ? 'bg-amber-500/10 border-amber-400/50'
              : 'bg-emerald-500/10 border-emerald-400/40'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-400/40 flex items-center justify-center shrink-0">
              <XpCoinSvg className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {studentReward.isTopThree
                    ? `ยินดีด้วย! คุณคว้ารางวัล ${studentReward.medalTitle}`
                    : `ขอบคุณที่ร่วมประลอง! (${studentReward.medalTitle})`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                ระบบเพิ่มเหรียญรางวัล{' '}
                <strong className="text-amber-300 font-mono tabular-nums">
                  +{studentReward.xpReward} XP
                </strong>{' '}
                เข้าโปรไฟล์ของคุณอัตโนมัติเรียบร้อยแล้ว
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-amber-400/40 shrink-0 self-start sm:self-center">
            <XpCoinSvg className="w-6 h-6" />
            <span className="text-lg font-black text-amber-300 font-mono tabular-nums">
              +{studentReward.xpReward} XP
            </span>
          </div>
        </div>
      )}

      {/* 3. Graphical 3-Tier Championship Podium */}
      {summary.topWinners.length > 0 ? (
        <section aria-label="ผู้ชนะ 3 อันดับแรก" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white">
                ทำเนียบผู้ชนะ 3 อันดับแรกและเหรียญ XP รางวัล
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                อันดับ 1 รับ +150 XP · อันดับ 2 รับ +100 XP · อันดับ 3 รับ +60 XP · ผู้เข้าร่วมรับ +20 XP
              </p>
            </div>
            <div
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                isClosed ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                {isClosed ? 'แจกเหรียญ XP อัตโนมัติแล้ว' : 'พร้อมแจกเหรียญ XP เมื่อปิดห้อง'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {podiumSlots.map((slot) => {
              const w = slot.winner;
              const isSelf = Boolean(
                w && currentParticipantId && w.userId === currentParticipantId
              );

              if (!w) {
                return (
                  <div
                    key={slot.rank}
                    className={`${slot.orderClass} rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5 text-center flex flex-col items-center justify-center ${slot.pedestalHeightClass}`}
                  >
                    <MedalEmblemSvg rank={slot.rank} className="w-11 h-11 opacity-35 mb-2" />
                    <div className="text-xs font-semibold text-slate-500">
                      ยังไม่มีผู้ครองอันดับ {slot.rank}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slot.rank}
                  className={`${slot.orderClass} rounded-2xl border ${slot.borderAccent} bg-gradient-to-b ${slot.columnGradient} p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${slot.pedestalHeightClass}`}
                >
                  <div className="flex flex-col items-center text-center">
                    <MedalEmblemSvg
                      rank={slot.rank}
                      className={slot.rank === 1 ? 'w-16 h-16 -mt-1 mb-2' : 'w-13 h-13 mb-2'}
                    />

                    <div className="text-xs font-semibold text-slate-300">
                      {w.medalTitle}
                      {isSelf ? ' · คุณ' : ''}
                    </div>

                    <div className="mt-1.5 flex items-center justify-center gap-2 max-w-full">
                      <span className="text-xl shrink-0" aria-hidden="true">
                        {w.avatar || '⚡'}
                      </span>
                      <span
                        className={`font-extrabold text-white truncate ${
                          slot.rank === 1 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                        }`}
                        title={w.displayName}
                      >
                        {w.displayName}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-center gap-2">
                      <span
                        className={`font-black font-mono tabular-nums ${
                          slot.rank === 1 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                        } ${slot.scoreColor}`}
                      >
                        {w.score.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">pts</span>
                    </div>

                    {w.streak >= 2 && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>ตอบถูกต่อเนื่อง x{w.streak}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {isClosed ? 'ได้รับเหรียญ XP' : 'รางวัล XP เมื่อปิดห้อง'}
                    </span>
                    <div className="inline-flex items-center gap-1.5 font-black font-mono tabular-nums text-amber-300 text-sm sm:text-base">
                      <XpCoinSvg className="w-5 h-5 shrink-0" />
                      <span>+{w.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-2">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">ยังไม่มีผลคะแนนนักเรียนในรอบนี้</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            คุณครูสามารถกดสร้างห้อง Battle ใหม่ด้านล่าง เพื่อรับรหัส Game PIN ใหม่ให้นักเรียนเข้าร่วมประลองได้ทันที
          </p>
        </div>
      )}

      {/* 4. Interactive All-Students Score Summary Graph (Recharts) + Ranked XP Ledger */}
      <PostBattleScoreChart
        participants={summary.allRanked}
        currentParticipantId={currentParticipantId}
        isRoomClosed={isClosed}
      />

      {/* 5. Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {isTeacher ? (
          isClosed ? (
            <>
              <button
                type="button"
                onClick={onBackToLobby}
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>กลับหน้าตั้งค่าห้อง</span>
              </button>
              {onCreateNewRoom && (
                <button
                  type="button"
                  onClick={onCreateNewRoom}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-sm font-extrabold shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างห้อง Battle ใหม่ (สุ่มรหัสใหม่)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onCloseModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>ปิดหน้าต่าง</span>
              </button>
            </>
          ) : (
            <>
              {onStartFreshRound && (
                <button
                  type="button"
                  onClick={onStartFreshRound}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>สุ่มชุดใหม่ + เคลียร์คะแนน</span>
                </button>
              )}
              <button
                type="button"
                onClick={onBackToLobby}
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>กลับหน้าตั้งค่าห้อง</span>
              </button>
              {onCloseRoomAndAwardXp && (
                <button
                  type="button"
                  onClick={onCloseRoomAndAwardXp}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-sm font-extrabold shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Power className="w-4 h-4" />
                  <span>ปิดห้อง &amp; แจกเหรียญ XP อันดับ 1–3</span>
                </button>
              )}
              <button
                type="button"
                onClick={onCloseModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>ปิดหน้าต่าง</span>
              </button>
            </>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={onBackToLobby}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-extrabold shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>เล่นรอบถัดไป (กรอกรหัสห้องใหม่)</span>
            </button>
            <button
              type="button"
              onClick={onCloseModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>เสร็จสิ้นและกลับหน้าหลัก</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
