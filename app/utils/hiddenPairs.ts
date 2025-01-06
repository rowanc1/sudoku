import { SolverOptions, Sudoku } from './types';
import { addSnapshot } from './utils';

/**
 * Detects and applies hidden pairs in a single row.
 *
 * @param board       9x9 Sudoku board (0 = empty cell)
 * @param candidates  9x9 array of Sets (candidate digits)
 * @param row         The row index (0..8)
 * @returns           `true` if any candidate was removed, otherwise `false`.
 */
function applyHiddenPairsInRow(game: Sudoku, row: number): boolean {
  let changed = false;

  // If the row is fully or mostly filled, skip unnecessary checks
  // (though it's still okay to proceed if you want).
  // Count empty cells quickly:
  let emptyCells = 0;
  for (let col = 0; col < 9; col++) {
    if (game.board[row][col] === 0) {
      emptyCells++;
    }
  }
  if (emptyCells < 2) {
    // Not enough empty cells for a hidden pair
    return false;
  }

  // 1. positionsForDigit[d] will store all columns where digit d can go in `row`.
  const positionsForDigit: number[][] = Array.from({ length: 10 }, () => []);

  // Fill positionsForDigit
  for (let col = 0; col < 9; col++) {
    if (game.board[row][col] === 0) {
      for (const d of game.candidates[row][col]) {
        positionsForDigit[d].push(col);
      }
    }
  }

  // 2. Look for pairs of digits d1, d2 where positionsForDigit[d1] == positionsForDigit[d2]
  //    and length is exactly 2 (or more generally 2).
  for (let d1 = 1; d1 <= 9; d1++) {
    const cols1 = positionsForDigit[d1];
    if (cols1.length === 2) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const cols2 = positionsForDigit[d2];
        // Check if they match exactly
        if (arrayEquals(cols1, cols2)) {
          // We found a hidden pair (d1, d2) in these two columns
          const [c1, c2] = cols1;
          // Remove all other digits from candidates[row][c1] and candidates[row][c2]
          const removedCandidates: number[][] = [];
          changed =
            stripOtherCandidates(game.candidates, row, c1, [d1, d2], removedCandidates) || changed;
          changed =
            stripOtherCandidates(game.candidates, row, c2, [d1, d2], removedCandidates) || changed;

          if (removedCandidates.length > 0) {
            addSnapshot(game, {
              kind: 'Hidden Pair',
              variant: 'Row',
              difficulty: 5,
              highlight: {
                rows: [row],
                blocks: [
                  [row, c1],
                  [row, c2],
                ],
                candidates: [
                  [row, c1, d1],
                  [row, c1, d2],
                  [row, c2, d1],
                  [row, c2, d2],
                ],
                removedCandidates,
              },
            });
          }
        }
      }
    }
  }

  return changed;
}

/** Helper: check if two arrays have the same items in the same order */
function arrayEquals(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Remove all digits from candidates[row][col]
 * except the ones in `allowed`.
 * Returns true if anything was removed.
 */
function stripOtherCandidates(
  candidates: Set<number>[][],
  row: number,
  col: number,
  allowed: number[],
  removedCandidates: number[][]
): boolean {
  let changed = false;
  const toRemove: number[] = [];
  for (const digit of candidates[row][col]) {
    if (!allowed.includes(digit)) {
      toRemove.push(digit);
    }
  }
  for (const d of toRemove) {
    if (candidates[row][col].delete(d)) {
      removedCandidates.push([row, col, d]);
      changed = true;
    }
  }
  return changed;
}

/**
 * Detects and applies hidden pairs in a single column.
 *
 * @param board       9x9 Sudoku board
 * @param candidates  9x9 array of Sets
 * @param col         The column index (0..8)
 * @returns           true if any candidate was removed, otherwise false
 */
function applyHiddenPairsInColumn(game: Sudoku, col: number): boolean {
  let changed = false;

  // Count empty cells in this column
  let emptyCells = 0;
  for (let row = 0; row < 9; row++) {
    if (game.board[row][col] === 0) {
      emptyCells++;
    }
  }
  if (emptyCells < 2) return false;

  // positionsForDigit[d] will store all rows where digit d can go in `col`
  const positionsForDigit: number[][] = Array.from({ length: 10 }, () => []);

  for (let row = 0; row < 9; row++) {
    if (game.board[row][col] === 0) {
      for (const d of game.candidates[row][col]) {
        positionsForDigit[d].push(row);
      }
    }
  }

  // Find pairs of digits with exactly the same row positions
  for (let d1 = 1; d1 <= 9; d1++) {
    const rows1 = positionsForDigit[d1];
    if (rows1.length === 2) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const rows2 = positionsForDigit[d2];
        if (arrayEquals(rows1, rows2)) {
          // Hidden pair found
          const [r1, r2] = rows1;
          const removedCandidates: number[][] = [];
          changed =
            stripOtherCandidates(game.candidates, r1, col, [d1, d2], removedCandidates) || changed;
          changed =
            stripOtherCandidates(game.candidates, r2, col, [d1, d2], removedCandidates) || changed;

          if (removedCandidates.length > 0) {
            addSnapshot(game, {
              kind: 'Hidden Pair',
              variant: 'Column',
              difficulty: 5,
              highlight: {
                cols: [col],
                blocks: [
                  [r1, col],
                  [r2, col],
                ],
                candidates: [
                  [r1, col, d1],
                  [r1, col, d2],
                  [r2, col, d1],
                  [r2, col, d2],
                ],
                removedCandidates,
              },
            });
          }
        }
      }
    }
  }

  return changed;
}

/**
 * Detects and applies hidden pairs in a single 3x3 box.
 *
 * @param board       9x9 Sudoku board
 * @param candidates  9x9 array of Sets
 * @param boxRow      The box's row index (0..2)
 * @param boxCol      The box's col index (0..2)
 * @returns           true if any candidate was removed, otherwise false
 */
function applyHiddenPairsInBox(game: Sudoku, boxRow: number, boxCol: number): boolean {
  let changed = false;

  // The 3x3 box starts at (boxRow*3, boxCol*3)
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;

  // Gather the coordinates of empty cells in this box
  const emptyCells: Array<[number, number]> = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (game.board[rr][cc] === 0) {
        emptyCells.push([rr, cc]);
      }
    }
  }

  if (emptyCells.length < 2) return false;

  // positionsForDigit[d] will store all coordinates where digit d can be in this box
  const positionsForDigit: Record<number, Array<[number, number]>> = {};
  for (let d = 1; d <= 9; d++) {
    positionsForDigit[d] = [];
  }

  for (const [rr, cc] of emptyCells) {
    for (const d of game.candidates[rr][cc]) {
      positionsForDigit[d].push([rr, cc]);
    }
  }

  // Now find pairs of digits (d1, d2) that appear in exactly the same two cells
  for (let d1 = 1; d1 <= 9; d1++) {
    const coords1 = positionsForDigit[d1];
    if (coords1.length === 2) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const coords2 = positionsForDigit[d2];
        if (coords2.length === 2 && coordsEquals(coords1, coords2)) {
          // We have a hidden pair in these exact two cells
          const [cellA, cellB] = coords1;
          const removedCandidates: number[][] = [];
          changed =
            stripOtherCandidates(
              game.candidates,
              cellA[0],
              cellA[1],
              [d1, d2],
              removedCandidates
            ) || changed;
          changed =
            stripOtherCandidates(
              game.candidates,
              cellB[0],
              cellB[1],
              [d1, d2],
              removedCandidates
            ) || changed;
          if (removedCandidates.length > 0) {
            addSnapshot(game, {
              kind: 'Hidden Pair',
              variant: 'Box',
              difficulty: 5,
              highlight: {
                boxes: [[boxRow, boxCol]],
                blocks: [cellA, cellB],
                candidates: [
                  [...cellA, d1],
                  [...cellA, d2],
                  [...cellB, d1],
                  [...cellB, d2],
                ],
                removedCandidates,
              },
            });
          }
        }
      }
    }
  }

  return changed;
}

/** Helper: check if two arrays of coordinates match exactly in length and positions */
function coordsEquals(a: Array<[number, number]>, b: Array<[number, number]>): boolean {
  if (a.length !== b.length) return false;
  // Sort them so the order doesn't affect equality
  a = a.slice().sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1]);
  b = b.slice().sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1]);

  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

/**
 * Applies hidden pairs in all rows, columns, and boxes.
 * @returns `true` if any candidate was removed, otherwise false.
 */
export function applyHiddenPairs(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.hiddenPairs === false) return false;
  // Boxes
  if (opts?.hiddenPairsBoxes !== false) {
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        if (applyHiddenPairsInBox(game, br, bc)) return true;
      }
    }
  }

  // Rows
  if (opts?.hiddenPairsRows !== false) {
    for (let row = 0; row < 9; row++) {
      if (applyHiddenPairsInRow(game, row)) return true;
    }
  }

  // Columns
  if (opts?.hiddenPairsCols !== false) {
    for (let col = 0; col < 9; col++) {
      if (applyHiddenPairsInColumn(game, col)) return true;
    }
  }

  return false;
}
