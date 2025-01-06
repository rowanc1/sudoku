import { SolverOptions, Sudoku } from './types';
import { addSnapshot } from './utils';

/**
 * For each row, check if a digit's candidates are all confined
 * to the same 3×3 box. If so, eliminate that digit from the rest
 * of the box (outside this row).
 *
 * @param board       9x9 Sudoku board (0 = empty)
 * @param candidates  9x9 array of Sets (possible digits for each cell)
 * @returns           true if any candidate was eliminated, otherwise false
 */
function applyBoxLineReductionInRows(game: Sudoku): boolean {
  // For each row
  for (let row = 0; row < 9; row++) {
    // For each digit 1..9
    for (let digit = 1; digit <= 9; digit++) {
      // If digit already in the row, skip
      if (isDigitInRow(game.board, row, digit)) {
        continue;
      }

      // Gather columns where 'digit' is still a candidate
      const colsForDigit: number[] = [];
      for (let col = 0; col < 9; col++) {
        if (game.board[row][col] === 0 && game.candidates[row][col].has(digit)) {
          colsForDigit.push(col);
        }
      }

      // If we have between 1..3 positions for the digit
      // (larger sets can't be confined to a single 3×3 box in a single row)
      if (colsForDigit.length > 1 && colsForDigit.length <= 3) {
        // Check if all those columns are in the same 3×3 box
        const boxColStart = Math.floor(colsForDigit[0] / 3);
        const allSameBox = colsForDigit.every((c) => Math.floor(c / 3) === boxColStart);

        if (allSameBox) {
          // The digit is confined to the box at (rowBox, boxColStart)
          const rowBox = Math.floor(row / 3);
          // We can eliminate 'digit' from the rest of that box
          // (excluding this row).
          const changed = eliminateDigitFromBox(
            game,
            rowBox,
            boxColStart,
            digit,
            row /* exclude this row */
          );
          if (changed) return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if 'digit' is already placed in the given row.
 */
function isDigitInRow(board: number[][], row: number, digit: number): boolean {
  for (let col = 0; col < 9; col++) {
    if (board[row][col] === digit) return true;
  }
  return false;
}

/**
 * Eliminate 'digit' from a 3×3 box, except for a particular row if needed.
 *
 * @param excludeRow  If provided, skip eliminating in that entire row.
 * @param excludeCol  If provided, skip eliminating in that entire column.
 */
function eliminateDigitFromBox(
  game: Sudoku,
  boxRow: number,
  boxCol: number,
  digit: number,
  excludeRow?: number,
  excludeCol?: number
): boolean {
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;

  const removedCandidates: number[][] = [];
  const blockHighlight: number[][] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;

      // Skip the excluded row/col if provided
      if (excludeRow !== undefined && rr === excludeRow) {
        if (game.board[rr][cc] === 0 && game.candidates[rr][cc].has(digit)) {
          blockHighlight.push([rr, cc]);
        }
        continue;
      }
      if (excludeCol !== undefined && cc === excludeCol) {
        if (game.board[rr][cc] === 0 && game.candidates[rr][cc].has(digit)) {
          blockHighlight.push([rr, cc]);
        }
        continue;
      }

      if (game.board[rr][cc] === 0 && game.candidates[rr][cc].delete(digit)) {
        removedCandidates.push([rr, cc, digit]);
      }
    }
  }
  if (removedCandidates.length > 0) {
    addSnapshot(game, {
      kind: 'Box Line Reduction',
      variant: excludeRow == null ? 'Column' : 'Row',
      difficulty: 5,
      highlight: {
        rows: excludeRow == null ? [] : [excludeRow],
        cols: excludeCol == null ? [] : [excludeCol],
        boxes: [[boxRow, boxCol]],
        blocks: blockHighlight,
        candidates: blockHighlight.map(([r, c]) => [r, c, digit]),
        removedCandidates,
      },
    });
    return true;
  }
  return false;
}

/**
 * Similar logic, but for each column. If a digit's candidates
 * in that column are all within one 3×3 box, eliminate that digit
 * from other cells in that box (excluding the column).
 *
 * @param board       9x9 Sudoku board
 * @param candidates  9x9 array of Sets
 * @returns           true if any candidate was eliminated, otherwise false
 */
function applyBoxLineReductionInColumns(game: Sudoku): boolean {
  // For each column
  for (let col = 0; col < 9; col++) {
    // For each digit 1..9
    for (let digit = 1; digit <= 9; digit++) {
      // If digit is already in this column, skip
      if (isDigitInColumn(game, col, digit)) {
        continue;
      }

      // Gather rows where 'digit' is still a candidate
      const rowsForDigit: number[] = [];
      for (let row = 0; row < 9; row++) {
        if (game.board[row][col] === 0 && game.candidates[row][col].has(digit)) {
          rowsForDigit.push(row);
        }
      }

      // If we have between 1..3 positions for the digit
      if (rowsForDigit.length > 1 && rowsForDigit.length <= 3) {
        // Check if all those rows are in the same 3×3 box
        const boxRowStart = Math.floor(rowsForDigit[0] / 3);
        const allSameBox = rowsForDigit.every((r) => Math.floor(r / 3) === boxRowStart);

        if (allSameBox) {
          // The digit is locked into that box for this column
          // => eliminate digit from the rest of the box
          const boxCol = Math.floor(col / 3);
          const changed = eliminateDigitFromBox(
            game,
            boxRowStart,
            boxCol,
            digit,
            /*excludeRow*/ undefined,
            col // exclude this column
          );
          if (changed) return true;
        }
      }
    }
  }
  return false;
}

function isDigitInColumn(game: Sudoku, col: number, digit: number): boolean {
  for (let row = 0; row < 9; row++) {
    if (game.board[row][col] === digit) return true;
  }
  return false;
}

/**
 * Applies Box/Line Reduction in both rows and columns.
 * Returns `true` if any candidate was eliminated.
 */
export function applyBoxLineReduction(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.boxLineReduction === false) return false;
  if (opts?.boxLineReductionRows !== false && applyBoxLineReductionInRows(game)) return true;
  if (opts?.boxLineReductionCols !== false && applyBoxLineReductionInColumns(game)) return true;
  return false;
}
