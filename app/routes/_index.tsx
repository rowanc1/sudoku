import type { MetaFunction } from '@remix-run/node';
import { SudokuBoard } from '../components/Board';
import { useState } from 'react';
import { SudokuSnapshot } from '../utils/types';
import { solveSudoku } from '../utils/solve';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sudoku Solver' },
    { name: 'description', content: 'Visualization of solving a sudoku using logical steps.' },
  ];
};

type StepByStepSudokuViewerProps = {
  initialBoard: number[][];
};

export function StepByStepSudokuViewer({ initialBoard }: StepByStepSudokuViewerProps) {
  // currentStep starts at 0 => the initial snapshot
  const [currentStep, setCurrentStep] = useState(0);
  const [stepHistory, setStepHistory] = useState([] as SudokuSnapshot[]);

  // We show the last snapshot if we have none or if the puzzle is solved at the end
  const snapshotCount = stepHistory.length;

  // Ensure currentStep is within [0, snapshotCount - 1]
  const snapshotIndex = Math.min(currentStep, snapshotCount - 1);

  // Current snapshot to display
  const currentSnapshot: SudokuSnapshot | null =
    snapshotCount > 0 ? stepHistory[snapshotIndex] : null;

  function handleNext() {
    if (snapshotIndex < snapshotCount - 1) {
      setCurrentStep(snapshotIndex + 1);
    }
  }

  function handleSolve() {
    setStepHistory(solveSudoku(initialBoard));
  }

  function handlePrev() {
    if (snapshotIndex > 0) {
      setCurrentStep(snapshotIndex - 1);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button className="rounded bg-gray-300 px-3 py-1 disabled:opacity-50" onClick={handleSolve}>
        Solve
      </button>
      <div className="flex items-center gap-2">
        <button
          className="rounded bg-gray-300 px-3 py-1 disabled:opacity-50"
          onClick={handlePrev}
          disabled={snapshotIndex === 0}
        >
          Previous
        </button>
        <div>
          Step {snapshotIndex + 1} / {snapshotCount}
        </div>
        <button
          className="rounded bg-gray-300 px-3 py-1 disabled:opacity-50"
          onClick={handleNext}
          disabled={snapshotIndex === snapshotCount - 1}
        >
          Next
        </button>
      </div>

      {currentSnapshot && (
        <>
          <p className="italic text-gray-700">{currentSnapshot.message}</p>
          {/* Render your Sudoku board visualization with candidates */}
          <SudokuBoard
            board={currentSnapshot.board}
            candidates={currentSnapshot.candidates}
            highlight={currentSnapshot.highlight}
          />
        </>
      )}
    </div>
  );
}

export default function Index() {
  // const board: number[][] = [
  //   [5, 3, 0, 0, 7, 0, 0, 0, 0],
  //   [6, 0, 0, 1, 9, 5, 0, 0, 0],
  //   [0, 9, 8, 0, 0, 0, 0, 6, 0],

  //   [8, 0, 0, 0, 6, 0, 0, 0, 3],
  //   [4, 0, 0, 8, 0, 3, 0, 0, 1],
  //   [7, 0, 0, 0, 2, 0, 0, 0, 6],

  //   [0, 6, 0, 0, 0, 0, 2, 8, 0],
  //   [0, 0, 0, 4, 1, 9, 0, 0, 5],
  //   [0, 0, 0, 0, 8, 0, 0, 7, 9],
  // ];

  // const board: number[][] = [
  //   [0, 0, 0, 0, 6, 5, 0, 0, 0],
  //   [0, 0, 0, 1, 0, 0, 0, 3, 0],
  //   [0, 0, 5, 0, 0, 7, 6, 0, 2],
  //   [0, 0, 0, 0, 8, 0, 3, 4, 0],
  //   [0, 2, 6, 7, 0, 3, 0, 0, 0],
  //   [7, 0, 0, 0, 0, 9, 2, 0, 0],
  //   [8, 0, 0, 0, 0, 6, 0, 0, 0],
  //   [0, 9, 0, 0, 0, 0, 0, 5, 1],
  //   [5, 0, 0, 4, 0, 0, 9, 0, 0],
  // ];

  // Medium
  // const board: number[][] = [
  //   [0, 0, 0, 0, 6, 5, 0, 0, 0],
  //   [0, 0, 0, 1, 0, 0, 0, 3, 0],
  //   [0, 0, 5, 0, 0, 7, 6, 0, 2],
  //   [0, 0, 0, 0, 8, 0, 3, 4, 0],
  //   [0, 2, 6, 7, 0, 3, 0, 0, 0],
  //   [7, 0, 0, 0, 0, 9, 2, 0, 0],
  //   [8, 0, 0, 0, 0, 6, 0, 0, 0],
  //   [0, 9, 0, 0, 0, 0, 0, 5, 1],
  //   [5, 0, 0, 4, 0, 0, 9, 0, 0],
  // ];

  // Hard
  const board: number[][] = [
    [0, 2, 0, 0, 7, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 8, 4, 0],
    [0, 0, 0, 5, 0, 0, 1, 0, 0],
    [9, 0, 0, 0, 1, 0, 7, 6, 4],
    [5, 0, 0, 0, 6, 0, 0, 0, 0],
    [4, 0, 0, 0, 9, 0, 0, 3, 0],
    [0, 0, 7, 9, 0, 0, 0, 0, 0],
    [0, 3, 0, 4, 0, 0, 0, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 8],
  ];
  return <StepByStepSudokuViewer initialBoard={board} />;

  // // Build some trivial candidate sets:
  // // For empty cells (0), use all digits 1..9 as a placeholder.
  // // For filled cells, only that digit as its candidate.
  // const candidates: Set<number>[][] = buildCandidates(board);
  // return (
  //   <div className="min-h-screen bg-gray-50 p-4">
  //     <h1 className="mb-4 text-center text-2xl font-bold">Sudoku Visualization</h1>
  //     <SudokuBoard board={board} candidates={candidates} />
  //   </div>
  // );
}
