import { Sudoku, SudokuSnapshot } from './types';

/** 9x9 Sudoku Constants */
export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;

/**
 * Converts a Sudoku puzzle string into a 9x9 number array.
 *
 * @param puzzleString A string of length 81, where '.' indicates an empty cell
 *                    and digits '1'..'9' indicate filled cells.
 * @returns A 9x9 array of numbers, with 0 for empty cells.
 */
export function stringToBoard(puzzleString: string): number[][] {
  // A valid Sudoku string should be exactly 81 chars (one for each cell).
  if (puzzleString.length !== 81) {
    throw new Error('Puzzle string must be exactly 81 characters long.');
  }

  const board: number[][] = [];

  for (let row = 0; row < 9; row++) {
    // Each row will be an array of 9 numbers
    const rowArray: number[] = [];
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col; // position in the string
      const char = puzzleString[index];

      if (char === '.' || char === '0') {
        // Empty cell -> 0
        rowArray.push(0);
      } else {
        // Convert digit character '1'..'9' to a number
        const digit = parseInt(char, 10);
        // (Optionally, validate it's within 1..9)
        if (digit < 1 || digit > 9) {
          throw new Error(`Invalid character '${char}' at index ${index}.`);
        }
        rowArray.push(digit);
      }
    }
    board.push(rowArray);
  }

  return board;
}

/** Check if the Sudoku is completely filled */
export function isComplete(board: number[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
}

// Example deep clone for a 9x9 array of numbers:
export function deepCloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

// Example deep clone for a 9x9 array of Sets
export function deepCloneCandidates(candidates: Set<number>[][]): Set<number>[][] {
  return candidates.map((row) => row.map((cellSet) => new Set(cellSet)));
}

export function addSnapshot(
  game: Sudoku,
  {
    kind,
    variant,
    highlight,
    difficulty,
  }: { kind: string; variant?: string; highlight?: SudokuSnapshot['highlight']; difficulty: number }
) {
  game.snapshots.push({
    board: deepCloneBoard(game.board),
    candidates: deepCloneCandidates(game.candidates),
    kind,
    variant,
    difficulty,
    highlight,
  });
}
