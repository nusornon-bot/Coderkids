import { describe, expect, it } from 'vitest';
import { SUDOKU_PUZZLES, SudokuDifficulty, validateSudokuBoard } from '../sudokuPuzzles.ts';

function countSolutions(
  initial: number[][],
  size: number,
  boxRows: number,
  boxCols: number,
  limit = 2
): number {
  const board = initial.map((r) => [...r]);
  let found = 0;

  const isSafe = (r: number, c: number, num: number): boolean => {
    for (let i = 0; i < size; i++) {
      if (board[r][i] === num || board[i][c] === num) return false;
    }
    const sr = Math.floor(r / boxRows) * boxRows;
    const sc = Math.floor(c / boxCols) * boxCols;
    for (let rr = sr; rr < sr + boxRows; rr++) {
      for (let cc = sc; cc < sc + boxCols; cc++) {
        if (board[rr][cc] === num) return false;
      }
    }
    return true;
  };

  const solve = (): void => {
    if (found >= limit) return;
    let emptyR = -1;
    let emptyC = -1;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) {
          emptyR = r;
          emptyC = c;
          break;
        }
      }
      if (emptyR !== -1) break;
    }

    if (emptyR === -1) {
      found++;
      return;
    }

    for (let num = 1; num <= size; num++) {
      if (isSafe(emptyR, emptyC, num)) {
        board[emptyR][emptyC] = num;
        solve();
        board[emptyR][emptyC] = 0;
        if (found >= limit) return;
      }
    }
  };

  solve();
  return found;
}

describe('sudokuPuzzles', () => {
  const difficulties: SudokuDifficulty[] = ['easy', 'medium', 'hard'];

  it('provides at least two verified puzzles per difficulty', () => {
    for (const diff of difficulties) {
      expect(SUDOKU_PUZZLES[diff].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has valid solutions, matching clues, and unique solutions for every puzzle', () => {
    for (const diff of difficulties) {
      for (const puzzle of SUDOKU_PUZZLES[diff]) {
        const solCheck = validateSudokuBoard(puzzle.solution, puzzle.boxRows, puzzle.boxCols);
        expect(solCheck.isValid).toBe(true);
        expect(solCheck.emptyCount).toBe(0);

        const initCheck = validateSudokuBoard(puzzle.initial, puzzle.boxRows, puzzle.boxCols);
        expect(initCheck.conflictKeys.size).toBe(0);
        expect(initCheck.emptyCount).toBeGreaterThan(0);

        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            if (puzzle.initial[r][c] !== 0) {
              expect(puzzle.initial[r][c]).toBe(puzzle.solution[r][c]);
            }
          }
        }

        const solutionCount = countSolutions(
          puzzle.initial,
          puzzle.size,
          puzzle.boxRows,
          puzzle.boxCols,
          2
        );
        expect(solutionCount).toBe(1);
      }
    }
  });

  it('detects row, column, and sub-box conflicts accurately', () => {
    const board = [
      [1, 1, 3, 4],
      [3, 4, 0, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
    const res = validateSudokuBoard(board, 2, 2);
    expect(res.isComplete).toBe(false);
    expect(res.isValid).toBe(false);
    expect(res.emptyCount).toBe(1);
    expect(res.conflictKeys.has('0-0')).toBe(true);
    expect(res.conflictKeys.has('0-1')).toBe(true);
  });
});
