import type { MetaFunction } from '@remix-run/node';
import { SudokuBoard } from '../components/Board';
import { useState } from 'react';
import { SolverOptions, SudokuSnapshot } from '../utils/types';
import { solveSudoku } from '../utils/solve';
import { BOARDS, DIABOLICAL, HARD, MEDIUM, RANDOM } from '../utils/boards';
import classNames from 'classnames';
import { SolverOptionsModal } from '../components/SolverOptions';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sudoku Solver' },
    { name: 'description', content: 'Visualization of solving a sudoku using logical steps.' },
  ];
};

type StepByStepSudokuViewerProps = {
  initialBoard: number[][] | string;
};

export function StepByStepSudokuViewer({ initialBoard }: StepByStepSudokuViewerProps) {
  // currentStep starts at 0 => the initial snapshot
  const [options, setOptions] = useState<SolverOptions>({});
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
    const game = solveSudoku(initialBoard, options);
    setStepHistory(game.snapshots);
  }

  function handlePrev() {
    if (snapshotIndex > 0) {
      setCurrentStep(snapshotIndex - 1);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row gap-2">
        <button className="rounded bg-gray-300 px-3 py-1 disabled:opacity-50" onClick={handleSolve}>
          Solve
        </button>
        <SolverOptionsModal
          {...{
            options,
            setOptions,
            onOpenChange: (open) => {
              if (!open) handleSolve();
            },
          }}
        />
      </div>
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
          <p className="italic text-gray-700">
            {currentSnapshot.kind} - {currentSnapshot.variant}
          </p>
          <div className="flex flex-row">
            {stepHistory.map(({ difficulty }, index) => (
              <button
                key={index}
                className="w-2 h-10 relative"
                onFocus={() => setCurrentStep(index)}
                onMouseOver={() => setCurrentStep(index)}
              >
                <div
                  className={classNames('w-full absolute bottom-0 border-r-[0.5px]', {
                    'bg-gray-900': difficulty === 0,
                    'bg-green-600': difficulty === 1,
                    'bg-slate-500': difficulty === 2,
                    'bg-blue-500': difficulty === 3,
                    'bg-violet-500': difficulty === 4,
                    'bg-orange-500': difficulty === 5,
                    'bg-red-500': difficulty === 6,
                  })}
                  style={{ height: (difficulty + 1) * 4 }}
                />
              </button>
            ))}
          </div>
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
  return <StepByStepSudokuViewer initialBoard={HARD[12]} />;
}
