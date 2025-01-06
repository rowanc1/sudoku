/***********************************************************
 * Sudoku Solver using:
 * 1) Logical Techniques: Naked Singles, Hidden Singles, Naked Pairs
 * 2) Backtracking for remaining cells after logic is exhausted
 ************************************************************/

import { applyBoxLineReduction } from './boxLineReduction';
import { applyHiddenPairs } from './hiddenPairs';
import { applyNakedTriples } from './nakedTriples';
import { SolverOptions, Sudoku } from './types';
import { addSnapshot, BOARD_SIZE, BOX_SIZE, deepCloneBoard, stringToBoard } from './utils';
import { applyXWing } from './xwing';

/**
 * Solve the Sudoku puzzle in-place.
 *
 * @param board A 9x9 Sudoku board; 0 represents an empty cell.
 * @returns True if solved, false if no solution.
 */
export function solveSudoku(startingBoard: number[][] | string, options?: SolverOptions): Sudoku {
  const board = deepCloneBoard(
    typeof startingBoard === 'string' ? stringToBoard(startingBoard) : startingBoard
  );
  const game: Sudoku = { board, candidates: buildCandidates({ board }), snapshots: [] };
  addSnapshot(game, { kind: 'Initial Board', difficulty: 0 });

  // Repeatedly apply logical strategies (naked/hidden singles, naked pairs, etc.)
  console.time('logical');
  applyLogicalStrategies(game, options);
  console.timeEnd('logical');

  // If still not solved, do backtracking
  // if (!isComplete(game.board)) {
  //   console.log('Backtracking');
  //   console.table(game.board);
  //   backtrack(game);
  //   return game;
  // }

  return game;
}

/***********************************************************
 * 1) CANDIDATE BUILDING & BASIC ELIMINATION
 ***********************************************************/

/**
 * Build a 9x9 array of candidate sets for each cell.
 * If the cell is filled, it has a set with only that digit.
 * If the cell is empty (0), it starts with {1..9} minus
 * digits that are already present in its row/column/box.
 */
export function buildCandidates({ board }: Pick<Sudoku, 'board'>): Set<number>[][] {
  // Initialize all possibilities [1..9] for empty cells
  const candidates: Set<number>[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]))
  );

  // For each filled cell, fix the candidate set to that digit,
  // and eliminate it from peers
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const val = board[row][col];
      if (val !== 0) {
        // If a cell is filled, its only candidate is the filled digit
        candidates[row][col] = new Set<number>([val]);
        eliminateFromPeers({ board, candidates }, row, col, val);
      }
    }
  }
  return candidates;
}

/**
 * Eliminate 'digit' from peers (same row, column, box).
 */
function eliminateFromPeers(
  game: Omit<Sudoku, 'snapshots'>,
  row: number,
  col: number,
  digit: number
) {
  // Row
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c !== col && game.board[row][c] === 0) {
      game.candidates[row][c].delete(digit);
    }
  }
  // Column
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (r !== row && game.board[r][col] === 0) {
      game.candidates[r][col].delete(digit);
    }
  }
  // Box
  const startRow = row - (row % BOX_SIZE);
  const startCol = col - (col % BOX_SIZE);
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if ((rr !== row || cc !== col) && game.board[rr][cc] === 0) {
        game.candidates[rr][cc].delete(digit);
      }
    }
  }
}

/***********************************************************
 * 2) LOGICAL STRATEGIES WRAPPER
 ***********************************************************/

function applyLogicalStrategies(game: Sudoku, opts?: SolverOptions): void {
  let changed = true;
  while (changed) {
    changed = false;
    if (!changed && applyNakedSingles(game, opts)) changed = true;
    if (!changed && applyNakedPairs(game, opts)) changed = true;
    if (!changed && applyHiddenSingles(game, opts)) changed = true;
    if (!changed && applyNakedTriples(game, opts)) changed = true;
    if (!changed && applyHiddenPairs(game, opts)) changed = true;
    if (!changed && applyBoxLineReduction(game, opts)) changed = true;
    if (!changed && applyXWing(game, opts)) changed = true;
  }
}

/***********************************************************
 * 2.1) NAKED SINGLES
 ***********************************************************/

/**
 * If a cell has exactly 1 candidate, fill it immediately.
 */
function applyNakedSingles(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.nakedSingles === false) return false;
  let changed = false;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (game.board[row][col] === 0 && game.candidates[row][col].size === 1) {
        const digit = [...game.candidates[row][col]][0];
        game.board[row][col] = digit;
        eliminateFromPeers(game, row, col, digit);
        addSnapshot(game, {
          kind: 'Naked Single',
          variant: `${digit}`,
          difficulty: 1,
          highlight: { blocks: [[row, col]] },
        });
        changed = true;
      }
    }
  }
  return changed;
}

/***********************************************************
 * 2.2) HIDDEN SINGLES
 ***********************************************************/

/**
 * Apply Hidden Singles in rows, columns, and boxes.
 */
function applyHiddenSingles(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.hiddenSingles === false) return false;
  if (opts?.hiddenSinglesBoxes !== false && applyHiddenSinglesInBoxes(game)) return true;
  if (opts?.hiddenSinglesRows !== false && applyHiddenSinglesInRows(game)) return true;
  if (opts?.hiddenSinglesCols !== false && applyHiddenSinglesInColumns(game)) return true;
  return false;
}

/** Hidden Singles in rows */
function applyHiddenSinglesInRows(game: Sudoku): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let digit = 1; digit <= 9; digit++) {
      // If digit is already in row, skip
      if (isDigitInRow(game.board, row, digit)) continue;

      // Find all columns in this row where digit is a candidate
      const possibleCols: number[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (game.board[row][col] === 0 && game.candidates[row][col].has(digit)) {
          possibleCols.push(col);
        }
      }
      // If exactly 1 possible location, place the digit
      if (possibleCols.length === 1) {
        const col = possibleCols[0];
        game.board[row][col] = digit;
        eliminateFromPeers(game, row, col, digit);
        addSnapshot(game, {
          kind: 'Hidden Single',
          variant: 'Row',
          difficulty: 3,
          highlight: { rows: [row], blocks: [[row, col]] },
        });
        return true;
      }
    }
  }

  return false;
}

/** Hidden Singles in columns (similar logic) */
function applyHiddenSinglesInColumns(game: Sudoku): boolean {
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let digit = 1; digit <= 9; digit++) {
      // If digit is already in column, skip
      if (isDigitInCol(game.board, col, digit)) continue;

      // Find all rows in this column where digit is a candidate
      const possibleRows: number[] = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (game.board[row][col] === 0 && game.candidates[row][col].has(digit)) {
          possibleRows.push(row);
        }
      }
      // If exactly 1 possible location, place the digit
      if (possibleRows.length === 1) {
        const row = possibleRows[0];
        game.board[row][col] = digit;
        eliminateFromPeers(game, row, col, digit);
        addSnapshot(game, {
          kind: 'Hidden Single',
          variant: 'Column',
          difficulty: 3,
          highlight: { cols: [col], blocks: [[row, col]] },
        });
        return true;
      }
    }
  }
  return false;
}

/** Hidden Singles in boxes (similar logic) */
function applyHiddenSinglesInBoxes(game: Sudoku): boolean {
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let digit = 1; digit <= 9; digit++) {
        if (isDigitInBox(game.board, boxRow, boxCol, digit)) continue;

        const possibleCells: Array<[number, number]> = [];
        // Each box is 3x3
        const startRow = boxRow * 3;
        const startCol = boxCol * 3;
        for (let r = 0; r < BOX_SIZE; r++) {
          for (let c = 0; c < BOX_SIZE; c++) {
            const rr = startRow + r;
            const cc = startCol + c;
            if (game.board[rr][cc] === 0 && game.candidates[rr][cc].has(digit)) {
              possibleCells.push([rr, cc]);
            }
          }
        }
        // If exactly 1 location for digit, place it
        if (possibleCells.length === 1) {
          const [r, c] = possibleCells[0];
          game.board[r][c] = digit;
          eliminateFromPeers(game, r, c, digit);
          addSnapshot(game, {
            kind: 'Hidden Single',
            variant: 'Box',
            difficulty: 3,
            highlight: { boxes: [[boxRow, boxCol]], blocks: [[r, c]] },
          });
          return true;
        }
      }
    }
  }
  return false;
}

/** Helpers for row/col/box checks */
function isDigitInRow(board: number[][], row: number, digit: number): boolean {
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (board[row][col] === digit) return true;
  }
  return false;
}

function isDigitInCol(board: number[][], col: number, digit: number): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row][col] === digit) return true;
  }
  return false;
}

function isDigitInBox(board: number[][], boxRow: number, boxCol: number, digit: number): boolean {
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      if (board[startRow + r][startCol + c] === digit) return true;
    }
  }
  return false;
}

/***********************************************************
 * 2.3) NAKED PAIRS
 ***********************************************************/

function applyNakedPairs(game: Sudoku, opts?: SolverOptions): boolean {
  if (opts?.nakedPairs === false) return false;
  // Apply in rows, columns, and boxes
  if (opts?.nakedPairsRows !== false) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (applyNakedPairsInRow(game, r)) return true;
    }
  }
  if (opts?.nakedPairsCols !== false) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (applyNakedPairsInCol(game, c)) return true;
    }
  }
  if (opts?.nakedPairsBoxes !== false) {
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        if (applyNakedPairsInBox(game, br, bc)) return true;
      }
    }
  }

  return false;
}

/** Naked Pairs in a single row */
function applyNakedPairsInRow(game: Sudoku, row: number): boolean {
  // Collect columns for empty cells
  const emptyCols: number[] = [];
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (game.board[row][col] === 0) {
      emptyCols.push(col);
    }
  }

  // Check each pair of empty columns
  for (let i = 0; i < emptyCols.length; i++) {
    for (let j = i + 1; j < emptyCols.length; j++) {
      const col1 = emptyCols[i];
      const col2 = emptyCols[j];
      const cands1 = game.candidates[row][col1];
      const cands2 = game.candidates[row][col2];

      // If both cells have exactly 2 identical candidates => Naked Pair
      if (cands1.size === 2 && cands2.size === 2 && areSetsEqual(cands1, cands2)) {
        // Remove these candidates from all other cells in this row
        const pairValues = [...cands1];
        const removedCandidates: number[][] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (c !== col1 && c !== col2 && game.board[row][c] === 0) {
            for (const val of pairValues) {
              if (game.candidates[row][c].delete(val)) {
                removedCandidates.push([row, c, val]);
              }
            }
          }
        }
        if (removedCandidates.length > 0) {
          addSnapshot(game, {
            kind: 'Naked Pair',
            variant: 'Row',
            difficulty: 2,
            highlight: {
              // cands1?
              rows: [row],
              blocks: [
                [row, col1],
                [row, col2],
              ],
              candidates: [
                [row, col1, pairValues[0]],
                [row, col1, pairValues[1]],
                [row, col2, pairValues[0]],
                [row, col2, pairValues[1]],
              ],
              removedCandidates,
            },
          });
          return true;
        }
      }
    }
  }

  return false;
}

/** Naked Pairs in a single column */
function applyNakedPairsInCol(game: Sudoku, col: number): boolean {
  // Collect rows for empty cells
  const emptyRows: number[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (game.board[row][col] === 0) {
      emptyRows.push(row);
    }
  }

  // Check each pair of empty rows
  for (let i = 0; i < emptyRows.length; i++) {
    for (let j = i + 1; j < emptyRows.length; j++) {
      const row1 = emptyRows[i];
      const row2 = emptyRows[j];
      const cands1 = game.candidates[row1][col];
      const cands2 = game.candidates[row2][col];

      // If both cells have exactly 2 identical candidates => Naked Pair
      if (cands1.size === 2 && cands2.size === 2 && areSetsEqual(cands1, cands2)) {
        // Remove these candidates from all other cells in this column
        const removedCandidates: number[][] = [];
        const pairValues = [...cands1];
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (r !== row1 && r !== row2 && game.board[r][col] === 0) {
            for (const val of pairValues) {
              if (game.candidates[r][col].delete(val)) {
                removedCandidates.push([r, col, val]);
              }
            }
          }
        }
        if (removedCandidates.length > 0) {
          addSnapshot(game, {
            kind: 'Naked Pair',
            variant: 'Column',
            difficulty: 2,
            highlight: {
              cols: [col],
              blocks: [
                [row1, col],
                [row2, col],
              ],
              candidates: [
                [row1, col, pairValues[0]],
                [row1, col, pairValues[1]],
                [row2, col, pairValues[0]],
                [row2, col, pairValues[1]],
              ],
              removedCandidates,
            },
          });
          return true;
        }
      }
    }
  }

  return false;
}

/** Naked Pairs in a single 3x3 box */
function applyNakedPairsInBox(game: Sudoku, boxRow: number, boxCol: number): boolean {
  // Collect the cells in this 3x3 box
  const cells: Array<[number, number]> = [];
  const startRow = boxRow * BOX_SIZE;
  const startCol = boxCol * BOX_SIZE;

  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (game.board[rr][cc] === 0) {
        cells.push([rr, cc]);
      }
    }
  }

  // Check each pair of empty cells
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const [r1, c1] = cells[i];
      const [r2, c2] = cells[j];
      const cands1 = game.candidates[r1][c1];
      const cands2 = game.candidates[r2][c2];

      const removedCandidates: number[][] = [];
      // If both cells have exactly 2 identical candidates => Naked Pair
      if (cands1.size === 2 && cands2.size === 2 && areSetsEqual(cands1, cands2)) {
        const pairValues = [...cands1];
        // Eliminate from all other cells in this box
        for (let k = 0; k < cells.length; k++) {
          if (k !== i && k !== j) {
            const [rr, cc] = cells[k];
            for (const val of pairValues) {
              if (game.candidates[rr][cc].delete(val)) {
                removedCandidates.push([rr, cc, val]);
              }
            }
          }
        }
        if (removedCandidates.length > 0) {
          addSnapshot(game, {
            kind: 'Naked Pair',
            variant: 'Box',
            difficulty: 2,
            highlight: {
              boxes: [[boxRow, boxCol]],
              blocks: [
                [r1, c1],
                [r2, c2],
              ],
              candidates: [
                [r1, c1, pairValues[0]],
                [r1, c1, pairValues[1]],
                [r2, c2, pairValues[0]],
                [r2, c2, pairValues[1]],
              ],
              removedCandidates,
            },
          });
          return true;
        }
      }
    }
  }

  return false;
}

/** Compare two sets for exact equality of elements */
function areSetsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

/***********************************************************
 * 3) BACKTRACKING
 ***********************************************************/

/**
 * If logical methods don’t finish the puzzle,
 * do a standard backtracking approach using the
 * existing candidates structure to speed things up.
 */
export function backtrack(game: Sudoku): boolean {
  const [row, col] = findEmptyCell(game.board);
  if (row === -1 && col === -1) {
    // No empty cell => solved
    return true;
  }

  // We'll try each candidate in the set
  const possibleDigits = [...game.candidates[row][col]];
  for (const digit of possibleDigits) {
    // Check if it's still valid to place (a quick re-check)
    if (isValid(game.board, row, col, digit)) {
      // Place the digit
      game.board[row][col] = digit;
      // Save the old set for revert
      const oldCandidates = new Set<number>(game.candidates[row][col]);
      // Restrict this cell's set to only this digit
      game.candidates[row][col] = new Set([digit]);
      // Eliminate from peers
      eliminateFromPeers(game, row, col, digit);

      // Recurse
      if (backtrack(game)) {
        return true;
      }

      // Backtrack (undo placement)
      game.board[row][col] = 0;
      game.candidates[row][col] = oldCandidates;
      // We must also restore candidates of peers that were eliminated.
      // For simplicity, we rebuild from scratch or do a partial restore.
      // Easiest (but less efficient) approach: rebuild entire candidates grid.
      // For performance, a more fine-grained restore might be needed.
      rebuildAllCandidates(game);
    }
  }

  return false; // If none worked, backtrack
}

/** Find the next empty cell (row, col). Returns [-1, -1] if no empty cell. */
function findEmptyCell(board: number[][]): [number, number] {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return [-1, -1];
}

/** Quickly check if digit can be placed in (row,col) without violating Sudoku rules */
function isValid(board: number[][], row: number, col: number, digit: number): boolean {
  // Row check
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board[row][c] === digit) return false;
  }
  // Col check
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r][col] === digit) return false;
  }
  // Box check
  const startRow = row - (row % BOX_SIZE);
  const startCol = col - (col % BOX_SIZE);
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      if (board[startRow + r][startCol + c] === digit) return false;
    }
  }
  return true;
}

/** For simplicity, we can rebuild candidates from scratch after each backtrack step. */
function rebuildAllCandidates(game: Sudoku): void {
  const newCands = buildCandidates(game);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      game.candidates[r][c] = newCands[r][c];
    }
  }
}
