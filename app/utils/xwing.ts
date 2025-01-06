import { SolverOptions, Sudoku } from './types';
import { addSnapshot } from './utils';

/**
 * Attempts to apply an X-Wing pattern for a specific digit by looking at rows.
 *
 * If two rows each have digit `d` in exactly the same two columns,
 * then we can eliminate `d` from those columns in all other rows.
 *
 * @param board       9x9 Sudoku board (0 = empty).
 * @param candidates  9x9 array of candidate sets for each cell.
 * @param d           The digit (1..9) we are focusing on.
 * @returns           true if any candidate was eliminated, false otherwise.
 */
function applyXWingRows(game: Sudoku, d: number): boolean {
  let changed = false;

  // For each row, gather the columns where digit d is a candidate
  const digitPositionsInRow: number[][] = Array.from({ length: 9 }, () => []);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (game.board[r][c] === 0 && game.candidates[r][c].has(d)) {
        digitPositionsInRow[r].push(c);
      }
    }
  }

  // Now find pairs of rows (r1, r2) where digit d is in exactly 2 columns each,
  // and those columns match.
  for (let r1 = 0; r1 < 9; r1++) {
    if (digitPositionsInRow[r1].length === 2) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (digitPositionsInRow[r2].length === 2) {
          // Check if both rows share the same 2 columns
          const [c1, c2] = digitPositionsInRow[r1];
          if (digitPositionsInRow[r2][0] === c1 && digitPositionsInRow[r2][1] === c2) {
            // We have an X-Wing pattern for digit d in columns c1, c2
            // => eliminate d from these columns in other rows
            const removedCandidates: number[][] = [];
            for (let rx = 0; rx < 9; rx++) {
              if (rx !== r1 && rx !== r2) {
                // Eliminate from (rx, c1) and (rx, c2)
                if (game.board[rx][c1] === 0 && game.candidates[rx][c1].delete(d)) {
                  removedCandidates.push([rx, c1, d]);
                  changed = true;
                }
                if (game.board[rx][c2] === 0 && game.candidates[rx][c2].delete(d)) {
                  removedCandidates.push([rx, c2, d]);
                  changed = true;
                }
              }
            }
            if (removedCandidates.length > 0) {
              addSnapshot(game, {
                kind: 'X-Wing',
                variant: 'Row',
                difficulty: 6,
                highlight: {
                  blocks: [
                    [r1, c1],
                    [r2, c1],
                    [r1, c2],
                    [r2, c2],
                  ],
                  cols: [c1, c2],
                  rows: [r1, r2],
                  candidates: [
                    [r1, c1, d],
                    [r2, c1, d],
                    [r1, c2, d],
                    [r2, c2, d],
                  ],
                  removedCandidates,
                },
              });
            }
          }
        }
      }
    }
  }

  return changed;
}

/**
 * Attempts to apply an X-Wing pattern for a specific digit by looking at columns.
 *
 * If two columns each have digit `d` in exactly the same two rows,
 * then we can eliminate `d` from those rows in all other columns.
 *
 * @param board       9x9 Sudoku board (0 = empty).
 * @param candidates  9x9 array of candidate sets for each cell.
 * @param d           The digit (1..9) we are focusing on.
 * @returns           true if any candidate was eliminated, false otherwise.
 */
function applyXWingColumns(game: Sudoku, d: number): boolean {
  let changed = false;

  // For each column, gather the rows where digit d is a candidate
  const digitPositionsInCol: number[][] = Array.from({ length: 9 }, () => []);

  for (let c = 0; c < 9; c++) {
    for (let r = 0; r < 9; r++) {
      if (game.board[r][c] === 0 && game.candidates[r][c].has(d)) {
        digitPositionsInCol[c].push(r);
      }
    }
  }

  // Now find pairs of columns (c1, c2) that have the same 2 rows for digit d
  for (let c1 = 0; c1 < 9; c1++) {
    if (digitPositionsInCol[c1].length === 2) {
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (digitPositionsInCol[c2].length === 2) {
          // Check if both columns share the same 2 rows
          const [r1, r2] = digitPositionsInCol[c1];
          if (digitPositionsInCol[c2][0] === r1 && digitPositionsInCol[c2][1] === r2) {
            // We have an X-Wing pattern for digit d in rows r1, r2
            // => eliminate d from these rows in other columns
            const removedCandidates: number[][] = [];
            for (let cx = 0; cx < 9; cx++) {
              if (cx !== c1 && cx !== c2) {
                // Eliminate from (r1, cx) and (r2, cx)
                if (game.board[r1][cx] === 0 && game.candidates[r1][cx].delete(d)) {
                  removedCandidates.push([r1, cx, d]);
                  changed = true;
                }
                if (game.board[r2][cx] === 0 && game.candidates[r2][cx].delete(d)) {
                  removedCandidates.push([r2, cx, d]);
                  changed = true;
                }
              }
            }
            if (removedCandidates.length > 0) {
              addSnapshot(game, {
                kind: 'X-Wing',
                variant: 'Column',
                difficulty: 6,
                highlight: {
                  blocks: [
                    [r1, c1],
                    [r2, c1],
                    [r1, c2],
                    [r2, c2],
                  ],
                  cols: [c1, c2],
                  rows: [r1, r2],
                  candidates: [
                    [r1, c1, d],
                    [r2, c1, d],
                    [r1, c2, d],
                    [r2, c2, d],
                  ],
                  removedCandidates,
                },
              });
            }
          }
        }
      }
    }
  }

  return changed;
}

/**
 * Applies the X-Wing strategy for all digits, checking both
 * row-based and column-based patterns.
 *
 * @param board       9x9 Sudoku board
 * @param candidates  9x9 array of candidate sets
 * @returns           true if any candidate was eliminated, otherwise false
 */
export function applyXWing(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.xWing === false) return false;

  // Check each digit 1..9
  for (let d = 1; d <= 9; d++) {
    // Row-based X-Wing
    if (opts?.xWingRows !== false && applyXWingRows(game, d)) return true;
    // Column-based X-Wing
    if (opts?.xWingCols !== false && applyXWingColumns(game, d)) return true;
  }

  return false;
}
