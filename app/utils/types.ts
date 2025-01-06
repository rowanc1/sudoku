export interface Sudoku {
  board: number[][]; // 9x9 board at this step
  candidates: Set<number>[][]; // 9x9 array of candidate sets
  snapshots: SudokuSnapshot[];
}

export interface SolverOptions {
  nakedSingles?: boolean;
  nakedPairs?: boolean;
  nakedPairsRows?: boolean;
  nakedPairsCols?: boolean;
  nakedPairsBoxes?: boolean;
  hiddenSingles?: boolean;
  hiddenSinglesRows?: boolean;
  hiddenSinglesCols?: boolean;
  hiddenSinglesBoxes?: boolean;
  nakedTriples?: boolean;
  nakedTriplesRows?: boolean;
  nakedTriplesCols?: boolean;
  nakedTriplesBoxes?: boolean;
  hiddenPairs?: boolean;
  hiddenPairsRows?: boolean;
  hiddenPairsCols?: boolean;
  hiddenPairsBoxes?: boolean;
  boxLineReduction?: boolean;
  boxLineReductionRows?: boolean;
  boxLineReductionCols?: boolean;
  xWing?: boolean;
  xWingRows?: boolean;
  xWingCols?: boolean;
}

export interface SudokuSnapshot {
  board: number[][]; // 9x9 board at this step
  candidates: Set<number>[][]; // 9x9 array of candidate sets
  kind: string; // e.g., "Naked Single"
  variant?: string; // e.g., "Row"
  difficulty: number;
  highlight?: {
    rows?: number[];
    cols?: number[];
    blocks?: number[][];
    boxes?: number[][];
    candidates?: number[][]; // row, col, num
    removedCandidates?: number[][]; // row, col, num
  };
}
