export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

export interface SudokuPuzzle {
  id: string;
  difficulty: SudokuDifficulty;
  title: string;
  size: 4 | 6;
  boxRows: 2;
  boxCols: 2 | 3;
  rewardExp: number;
  initial: number[][];
  solution: number[][];
}

export interface SudokuDifficultyMeta {
  id: SudokuDifficulty;
  label: string;
  badge: string;
  gridLabel: string;
  description: string;
  rewardExp: number;
}

export const SUDOKU_DIFFICULTY_META: Record<SudokuDifficulty, SudokuDifficultyMeta> = {
  easy: {
    id: 'easy',
    label: 'ง่าย',
    badge: '4×4',
    gridLabel: 'ตาราง 4×4 (เลข 1–4)',
    description: 'เว้น 4–5 ช่อง เหมาะสำหรับเริ่มต้นฝึกสังเกตแถว หลัก และกลุ่ม 2×2',
    rewardExp: 15,
  },
  medium: {
    id: 'medium',
    label: 'ปานกลาง',
    badge: '4×4',
    gridLabel: 'ตาราง 4×4 (เลข 1–4)',
    description: 'เว้น 8 ช่อง ต้องตัดตัวเลือกและเชื่อมโยงเงื่อนไขหลายแถวพร้อมกัน',
    rewardExp: 20,
  },
  hard: {
    id: 'hard',
    label: 'ยาก (ท้าทาย)',
    badge: '6×6',
    gridLabel: 'ตาราง 6×6 (เลข 1–6)',
    description: 'ตารางขยาย 6×6 แบ่งกลุ่ม 2×3 ใช้เหตุผลเชิงตรรกะขั้นสูง',
    rewardExp: 30,
  },
};

export const SUDOKU_PUZZLES: Record<SudokuDifficulty, SudokuPuzzle[]> = {
  easy: [
    {
      id: 'easy-1',
      difficulty: 'easy',
      title: 'ชุดฝึกที่ 1',
      size: 4,
      boxRows: 2,
      boxCols: 2,
      rewardExp: 15,
      initial: [
        [1, 0, 3, 4],
        [3, 4, 0, 2],
        [2, 1, 4, 0],
        [0, 3, 2, 1],
      ],
      solution: [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ],
    },
    {
      id: 'easy-2',
      difficulty: 'easy',
      title: 'ชุดฝึกที่ 2',
      size: 4,
      boxRows: 2,
      boxCols: 2,
      rewardExp: 15,
      initial: [
        [2, 0, 1, 3],
        [1, 3, 0, 2],
        [0, 2, 0, 1],
        [3, 1, 2, 0],
      ],
      solution: [
        [2, 4, 1, 3],
        [1, 3, 4, 2],
        [4, 2, 3, 1],
        [3, 1, 2, 4],
      ],
    },
  ],
  medium: [
    {
      id: 'medium-1',
      difficulty: 'medium',
      title: 'ชุดฝึกที่ 1',
      size: 4,
      boxRows: 2,
      boxCols: 2,
      rewardExp: 20,
      initial: [
        [4, 0, 2, 0],
        [0, 3, 0, 1],
        [1, 0, 3, 0],
        [0, 4, 0, 2],
      ],
      solution: [
        [4, 1, 2, 3],
        [2, 3, 4, 1],
        [1, 2, 3, 4],
        [3, 4, 1, 2],
      ],
    },
    {
      id: 'medium-2',
      difficulty: 'medium',
      title: 'ชุดฝึกที่ 2',
      size: 4,
      boxRows: 2,
      boxCols: 2,
      rewardExp: 20,
      initial: [
        [0, 2, 0, 1],
        [1, 0, 2, 0],
        [0, 1, 3, 0],
        [2, 0, 0, 4],
      ],
      solution: [
        [3, 2, 4, 1],
        [1, 4, 2, 3],
        [4, 1, 3, 2],
        [2, 3, 1, 4],
      ],
    },
  ],
  hard: [
    {
      id: 'hard-1',
      difficulty: 'hard',
      title: 'ชุดท้าทาย 6×6 (1)',
      size: 6,
      boxRows: 2,
      boxCols: 3,
      rewardExp: 30,
      initial: [
        [1, 0, 3, 4, 0, 6],
        [0, 5, 6, 0, 2, 0],
        [2, 3, 0, 5, 6, 0],
        [5, 0, 4, 0, 3, 1],
        [0, 1, 2, 6, 0, 5],
        [6, 4, 0, 3, 1, 0],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6],
        [4, 5, 6, 1, 2, 3],
        [2, 3, 1, 5, 6, 4],
        [5, 6, 4, 2, 3, 1],
        [3, 1, 2, 6, 4, 5],
        [6, 4, 5, 3, 1, 2],
      ],
    },
    {
      id: 'hard-2',
      difficulty: 'hard',
      title: 'ชุดท้าทาย 6×6 (2)',
      size: 6,
      boxRows: 2,
      boxCols: 3,
      rewardExp: 30,
      initial: [
        [2, 0, 6, 0, 3, 5],
        [1, 3, 0, 2, 0, 6],
        [0, 6, 2, 3, 5, 0],
        [3, 0, 1, 0, 6, 2],
        [6, 2, 0, 5, 0, 3],
        [0, 1, 3, 6, 2, 0],
      ],
      solution: [
        [2, 4, 6, 1, 3, 5],
        [1, 3, 5, 2, 4, 6],
        [4, 6, 2, 3, 5, 1],
        [3, 5, 1, 4, 6, 2],
        [6, 2, 4, 5, 1, 3],
        [5, 1, 3, 6, 2, 4],
      ],
    },
  ],
};

export interface SudokuValidationResult {
  isComplete: boolean;
  isValid: boolean;
  conflictKeys: Set<string>;
  emptyCount: number;
}

export function validateSudokuBoard(
  grid: number[][],
  boxRows: number,
  boxCols: number
): SudokuValidationResult {
  const size = grid.length;
  const conflictKeys = new Set<string>();
  let emptyCount = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val === 0) {
        emptyCount++;
        continue;
      }
      if (val < 1 || val > size) {
        conflictKeys.add(`${r}-${c}`);
        continue;
      }

      // Check row duplicates
      for (let cc = 0; cc < size; cc++) {
        if (cc !== c && grid[r][cc] === val) {
          conflictKeys.add(`${r}-${c}`);
          conflictKeys.add(`${r}-${cc}`);
        }
      }

      // Check column duplicates
      for (let rr = 0; rr < size; rr++) {
        if (rr !== r && grid[rr][c] === val) {
          conflictKeys.add(`${r}-${c}`);
          conflictKeys.add(`${rr}-${c}`);
        }
      }

      // Check sub-box duplicates
      const startRow = Math.floor(r / boxRows) * boxRows;
      const startCol = Math.floor(c / boxCols) * boxCols;
      for (let rr = startRow; rr < startRow + boxRows; rr++) {
        for (let cc = startCol; cc < startCol + boxCols; cc++) {
          if ((rr !== r || cc !== c) && grid[rr][cc] === val) {
            conflictKeys.add(`${r}-${c}`);
            conflictKeys.add(`${rr}-${cc}`);
          }
        }
      }
    }
  }

  return {
    isComplete: emptyCount === 0,
    isValid: emptyCount === 0 && conflictKeys.size === 0,
    conflictKeys,
    emptyCount,
  };
}
