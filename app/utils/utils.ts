// Example deep clone for a 9x9 array of numbers:
export function deepCloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

// Example deep clone for a 9x9 array of Sets
export function deepCloneCandidates(candidates: Set<number>[][]): Set<number>[][] {
  return candidates.map((row) => row.map((cellSet) => new Set(cellSet)));
}
