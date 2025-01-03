export interface SudokuSnapshot {
  board: number[][]; // 9x9 board at this step
  candidates: Set<number>[][]; // 9x9 array of candidate sets
  message: string; // e.g., "Naked single at R3C2 = 5"
  highlight?: {
    rows?: number[];
    cols?: number[];
    blocks?: number[][];
    boxes?: number[][];
    removedCandidates?: number[][]; // row, col, num
  };
}
