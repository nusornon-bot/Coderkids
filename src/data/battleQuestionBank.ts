import { SCRATCH_BATTLE_QUESTIONS } from './battleQuestionsScratch.ts';
import { MICROBIT_BATTLE_QUESTIONS } from './battleQuestionsMicrobit.ts';

export type BattlePlatform = 'Scratch' | 'Micro:bit';
export type BattleDifficulty = 'easy' | 'medium' | 'hard';
export type BattleSetFilter = 'Scratch' | 'Micro:bit' | 'mixed';
export type BattleDifficultyFilter = 'all' | BattleDifficulty;

export interface BattleQuestionItem {
  id: string;
  platform: BattlePlatform;
  difficulty: BattleDifficulty;
  title: string;
  codeSnippet: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  source: 'builtin' | 'cloud' | 'local';
  createdByName?: string;
}

export const DIFFICULTY_META: Record<
  BattleDifficulty,
  { label: string; emoji: string; badgeClass: string; timeSeconds: number; basePoints: number }
> = {
  easy: {
    label: 'ง่าย',
    emoji: '🟢',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    timeSeconds: 18,
    basePoints: 50,
  },
  medium: {
    label: 'ปานกลาง',
    emoji: '🟡',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    timeSeconds: 15,
    basePoints: 75,
  },
  hard: {
    label: 'ยาก',
    emoji: '🔴',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    timeSeconds: 15,
    basePoints: 100,
  },
};

/**
 * คลังข้อสอบมาตรฐานรวม 144 ข้อ (เพิ่มขึ้น +300% จากเดิม 36 ข้อ)
 * - Scratch: 72 ข้อ (ง่าย 24 · ปานกลาง 24 · ยาก 24)
 * - Micro:bit: 72 ข้อ (ง่าย 24 · ปานกลาง 24 · ยาก 24)
 * - กระจายคำตอบที่ถูกต้องเท่ากันทุกตัวเลือก: ก(A)=36, ข(B)=36, ค(C)=36, ง(D)=36
 *   (และในแต่ละหมวดย่อย 24 ข้อมีคำตอบถูกตัวเลือกละ 6 ข้อเท่ากัน)
 */
export const BUILTIN_BATTLE_QUESTIONS: BattleQuestionItem[] = [
  ...SCRATCH_BATTLE_QUESTIONS,
  ...MICROBIT_BATTLE_QUESTIONS,
];
