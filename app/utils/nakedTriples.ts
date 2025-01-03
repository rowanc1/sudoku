import { SudokuSnapshot } from './types';
import { deepCloneBoard, deepCloneCandidates } from './utils';

export function applyNakedTriples(
  board: number[][],
  candidates: Set<number>[][],
  snapshots: SudokuSnapshot[]
): boolean {
  let changed = false;

  // Rows
  for (let r = 0; r < 9; r++) {
    if (applyNakedTriplesInRow(board, candidates, snapshots, r)) {
      changed = true;
    }
  }

  // Columns
  for (let c = 0; c < 9; c++) {
    if (applyNakedTriplesInColumn(board, candidates, snapshots, c)) {
      changed = true;
    }
  }

  // Boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      if (applyNakedTriplesInBox(board, candidates, snapshots, br, bc)) {
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Attempt to eliminate candidates via Naked Triples in a single row.
 *
 * @param board       The Sudoku board (9x9), where 0 indicates an empty cell.
 * @param candidates  A 9x9 array of Sets, where each Set contains the possible digits for that cell.
 * @param row         The row index (0..8).
 * @returns `true` if at least one candidate was eliminated, otherwise `false`.
 */
function applyNakedTriplesInRow(
  board: number[][],
  candidates: Set<number>[][],
  snapshots: SudokuSnapshot[],
  row: number
): boolean {
  let changed = false;

  // 1) Collect columns of all empty cells in this row
  const emptyCols: number[] = [];
  for (let col = 0; col < 9; col++) {
    if (board[row][col] === 0) {
      emptyCols.push(col);
    }
  }

  // 2) Check combinations of three empty cells
  for (let i = 0; i < emptyCols.length; i++) {
    for (let j = i + 1; j < emptyCols.length; j++) {
      for (let k = j + 1; k < emptyCols.length; k++) {
        const col1 = emptyCols[i];
        const col2 = emptyCols[j];
        const col3 = emptyCols[k];

        const cands1 = candidates[row][col1];
        const cands2 = candidates[row][col2];
        const cands3 = candidates[row][col3];

        // 3) Combine these three sets
        const union = new Set<number>([...cands1, ...cands2, ...cands3]);

        // Check if union size == 3
        // and each cell's set is a subset of that union (meaning size <= 3, no extra digit)
        if (
          union.size === 3 &&
          isSubset(cands1, union) &&
          isSubset(cands2, union) &&
          isSubset(cands3, union)
        ) {
          // We have a naked triple in cands1, cands2, cands3

          // 4) Eliminate those three digits from all other empty cells in this row
          const tripleValues = Array.from(union);
          const removedCandidates: number[][] = [];
          for (let c = 0; c < 9; c++) {
            // skip the triple cells themselves
            if (c !== col1 && c !== col2 && c !== col3 && board[row][c] === 0) {
              for (const val of tripleValues) {
                if (candidates[row][c].delete(val)) {
                  removedCandidates.push([row, c, val]);
                  changed = true;
                }
              }
            }
          }
          if (removedCandidates.length > 0) {
            // Record a snapshot
            snapshots.push({
              board: deepCloneBoard(board),
              candidates: deepCloneCandidates(candidates),
              message: `Naked Triple in Row${row}: c${col1}c${col2}c${col3} = {${[...union].join(
                ', '
              )}}`,
              highlight: {
                rows: [row],
                blocks: [
                  [row, col1],
                  [row, col2],
                  [row, col3],
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

/** Helper function to check if setA is a subset of setB */
function isSubset(setA: Set<number>, setB: Set<number>): boolean {
  for (const x of setA) {
    if (!setB.has(x)) return false;
  }
  return true;
}

/**
 * Attempt to eliminate candidates via Naked Triples in a single column.
 *
 * @param board       The Sudoku board (9x9), where 0 indicates an empty cell.
 * @param candidates  A 9x9 array of Sets, where each Set contains the possible digits for that cell.
 * @param col         The column index (0..8).
 * @returns `true` if at least one candidate was eliminated, otherwise `false`.
 */
function applyNakedTriplesInColumn(
  board: number[][],
  candidates: Set<number>[][],
  snapshots: SudokuSnapshot[],
  col: number
): boolean {
  let changed = false;

  // 1) Collect rows of all empty cells in this column
  const emptyRows: number[] = [];
  for (let row = 0; row < 9; row++) {
    if (board[row][col] === 0) {
      emptyRows.push(row);
    }
  }

  // 2) Check combinations of three empty cells
  for (let i = 0; i < emptyRows.length; i++) {
    for (let j = i + 1; j < emptyRows.length; j++) {
      for (let k = j + 1; k < emptyRows.length; k++) {
        const row1 = emptyRows[i];
        const row2 = emptyRows[j];
        const row3 = emptyRows[k];

        const cands1 = candidates[row1][col];
        const cands2 = candidates[row2][col];
        const cands3 = candidates[row3][col];

        // Combine these three sets
        const union = new Set<number>([...cands1, ...cands2, ...cands3]);

        if (
          union.size === 3 &&
          isSubset(cands1, union) &&
          isSubset(cands2, union) &&
          isSubset(cands3, union)
        ) {
          // We have a naked triple in this column
          const tripleValues = Array.from(union);

          const removedCandidates: number[][] = [];

          // Eliminate those digits from all other empty cells in this column
          for (let r = 0; r < 9; r++) {
            if (r !== row1 && r !== row2 && r !== row3 && board[r][col] === 0) {
              for (const val of tripleValues) {
                if (candidates[r][col].delete(val)) {
                  removedCandidates.push([r, col, val]);
                  changed = true;
                }
              }
            }
          }
          if (removedCandidates.length > 0) {
            // Record a snapshot
            snapshots.push({
              board: deepCloneBoard(board),
              candidates: deepCloneCandidates(candidates),
              message: `Naked Triple in Col${col}: R${row1}R${row2}R${row3} = {${[...union].join(
                ', '
              )}}`,
              highlight: {
                cols: [col],
                blocks: [
                  [row1, col],
                  [row2, col],
                  [row3, col],
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
 * Attempt to eliminate candidates via Naked Triples in a single 3x3 box.
 *
 * @param board        The Sudoku board (9x9), 0 indicates empty.
 * @param candidates   A 9x9 array of Sets containing candidates.
 * @param boxRow       The row-index of the box (0..2).
 * @param boxCol       The col-index of the box (0..2).
 * @returns `true` if at least one candidate was eliminated, otherwise `false`.
 */
function applyNakedTriplesInBox(
  board: number[][],
  candidates: Set<number>[][],
  snapshots: SudokuSnapshot[],
  boxRow: number,
  boxCol: number
): boolean {
  let changed = false;

  // Each box is 3x3 cells
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;

  // 1) Collect the coordinates of all empty cells in this box
  const emptyCells: Array<[number, number]> = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (board[rr][cc] === 0) {
        emptyCells.push([rr, cc]);
      }
    }
  }

  // 2) Check all combinations of three empty cells within the box
  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        const [r1, c1] = emptyCells[i];
        const [r2, c2] = emptyCells[j];
        const [r3, c3] = emptyCells[k];

        const cands1 = candidates[r1][c1];
        const cands2 = candidates[r2][c2];
        const cands3 = candidates[r3][c3];

        // Combine these sets
        const union = new Set<number>([...cands1, ...cands2, ...cands3]);

        if (
          union.size === 3 &&
          isSubset(cands1, union) &&
          isSubset(cands2, union) &&
          isSubset(cands3, union)
        ) {
          // Naked triple found in these 3 cells
          const tripleValues = Array.from(union);

          const removedCandidates: number[][] = [];

          // Eliminate those values from all other cells in the box
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const rr = startRow + r;
              const cc = startCol + c;
              // skip the triple cells themselves
              if (
                (rr !== r1 || cc !== c1) &&
                (rr !== r2 || cc !== c2) &&
                (rr !== r3 || cc !== c3) &&
                board[rr][cc] === 0
              ) {
                for (const val of tripleValues) {
                  if (candidates[rr][cc].delete(val)) {
                    removedCandidates.push([rr, cc, val]);
                    changed = true;
                  }
                }
              }
            }
          }

          if (removedCandidates.length > 0) {
            // Record a snapshot
            snapshots.push({
              board: deepCloneBoard(board),
              candidates: deepCloneCandidates(candidates),
              message: `Naked Triple in Box[${boxRow},${boxCol}]: R${r1}C${c1}, R${r2}C${c2}, R${r3}C${c3} = {${[
                ...cands1,
              ].join(', ')}}`,
              highlight: {
                boxes: [[boxRow, boxCol]],
                blocks: [
                  [r1, c1],
                  [r2, c2],
                  [r3, c3],
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
