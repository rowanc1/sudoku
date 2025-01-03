import classNames from 'classnames';
import { SudokuSnapshot } from '../utils/types';
/** 9x9 Sudoku board; 0 = empty cells */
type SudokuBoardProps = Omit<SudokuSnapshot, 'message'>;

/**
 * A Sudoku board component in React using Tailwind CSS,
 * with fixed candidate positions (1..9) in a 3x3 mini-grid.
 */
export function SudokuBoard({ board, candidates, highlight }: SudokuBoardProps) {
  return (
    <div className="mx-auto inline-block bg-gray-100 p-2">
      {board.map((row, rowIndex) => (
        <div className="flex" key={rowIndex}>
          {row.map((cellValue, colIndex) => {
            const isFilled = cellValue !== 0;
            const borderClasses = getSudokuBorderClasses(rowIndex, colIndex);

            return (
              <div
                key={colIndex}
                className={classNames(
                  'relative flex h-16 w-16 items-center justify-center bg-white',
                  borderClasses,
                  {
                    // 'text-red-600 font-bold':
                    //   !isFilled && candidates[rowIndex][colIndex].size === 1,
                    'text-gray-600': !isFilled,
                    'bg-yellow-50':
                      (!!highlight?.rows?.find((r) => rowIndex === r) ||
                        !!highlight?.cols?.find((c) => colIndex === c) ||
                        !!highlight?.boxes?.find(
                          ([r, c]) =>
                            Math.floor(rowIndex / 3) === r && Math.floor(colIndex / 3) === c
                        )) &&
                      !highlight?.blocks?.find(([r, c]) => rowIndex === r && colIndex == c),
                    'bg-yellow-300': !!highlight?.blocks?.find(
                      ([r, c]) => rowIndex === r && colIndex == c
                    ),
                  }
                )}
              >
                {isFilled ? (
                  /* If cell is filled, just show the digit */
                  <span className="text-xl font-bold">{cellValue}</span>
                ) : (
                  /* Otherwise, render a 3x3 fixed grid for the 9 possible digits */
                  <div className="grid p-2 h-full w-full grid-cols-3 grid-rows-3 text-xs">
                    {/* Instead of sorting the candidate digits,
                        we check each digit 1..9 in a fixed position. */}
                    {SUDOKU_CANDIDATES_ORDER.map((digit) => {
                      const removed = highlight?.removedCandidates?.find(
                        ([r, c, d]) => rowIndex === r && colIndex === c && d === digit
                      );
                      return (
                        <div
                          key={digit}
                          className={classNames('flex items-center justify-center', {
                            'text-red-600 line-through': removed,
                          })}
                        >
                          {candidates[rowIndex][colIndex].has(digit) ? digit : removed?.[2] ?? ''}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * A fixed order for digits 1..9, laid out as:
 * 1 2 3
 * 4 5 6
 * 7 8 9
 *
 * This means:
 *  - index 0 => digit 1 (top-left)
 *  - index 1 => digit 2 (top-middle)
 *  - etc.
 */
const SUDOKU_CANDIDATES_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Returns Tailwind classes to apply thicker borders around
 * each 3x3 region (standard Sudoku layout).
 */
function getSudokuBorderClasses(rowIndex: number, colIndex: number): string {
  const classes: string[] = [];

  // Thicker top border at row multiples of 3
  if (rowIndex % 3 === 0) {
    classes.push('border-t-2 border-gray-700');
  }
  // Thicker left border at col multiples of 3
  if (colIndex % 3 === 0) {
    classes.push('border-l-2 border-gray-700');
  }

  // Thicker bottom border for the last row
  if (rowIndex === 8) {
    classes.push('border-b-2 border-gray-700');
  }
  // Thicker right border for the last column
  if (colIndex === 8) {
    classes.push('border-r-2 border-gray-700');
  }

  return classes.join(' ');
}
