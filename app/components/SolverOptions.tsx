// SolverOptionsModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { SolverOptions } from '../utils/types';

type OptionCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * A simple tailwind-styled checkbox + label.
 */
export function OptionCheckbox({ label, checked, onChange }: OptionCheckboxProps) {
  return (
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        className="h-4 w-4 accent-blue-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-gray-800">{label}</span>
    </label>
  );
}

export function SolverOptionsModal({
  options,
  setOptions,
  onOpenChange,
}: {
  options: SolverOptions;
  setOptions: (value: React.SetStateAction<SolverOptions>) => void;
  onOpenChange?: (value: boolean) => void;
}) {
  // Reusable update function
  const toggleOption = (key: keyof SolverOptions) => (checked: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Dialog.Root onOpenChange={onOpenChange}>
      {/* The button that opens the modal */}
      <Dialog.Trigger asChild>
        <button className="rounded bg-gray-300 px-3 py-1 disabled:opacity-50">
          Open Solver Options
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="bg-black/50 data-[state=open]:animate-overlayShow fixed inset-0" />

        {/* Modal Content */}
        <Dialog.Content
          className={`
            data-[state=open]:animate-contentShow
            fixed top-[50%] left-[50%]
            max-h-[90vh] w-[90vw] max-w-md
            -translate-x-[50%] -translate-y-[50%]
            rounded-md bg-white p-4 shadow-md
            focus:outline-none
          `}
        >
          <Dialog.Title className="text-lg font-bold mb-2">Solver Options</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Enable or disable specific Sudoku-solving techniques:
          </Dialog.Description>

          {/* Scrollable container if needed */}
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {/* Naked Singles */}
            <div className="border p-2 rounded bg-gray-50">
              <OptionCheckbox
                label="Naked Singles"
                checked={options.nakedSingles !== false}
                onChange={toggleOption('nakedSingles')}
              />
            </div>

            {/* Naked Pairs */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="Naked Pairs"
                checked={options.nakedPairs !== false}
                onChange={toggleOption('nakedPairs')}
              />
              {options.nakedPairs !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.nakedPairsRows !== false}
                    onChange={toggleOption('nakedPairsRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.nakedPairsCols !== false}
                    onChange={toggleOption('nakedPairsCols')}
                  />
                  <OptionCheckbox
                    label="Boxes"
                    checked={options.nakedPairsBoxes !== false}
                    onChange={toggleOption('nakedPairsBoxes')}
                  />
                </div>
              )}
            </div>

            {/* Hidden Singles */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="Hidden Singles"
                checked={options.hiddenSingles !== false}
                onChange={toggleOption('hiddenSingles')}
              />
              {options.hiddenSingles !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.hiddenSinglesRows !== false}
                    onChange={toggleOption('hiddenSinglesRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.hiddenSinglesCols !== false}
                    onChange={toggleOption('hiddenSinglesCols')}
                  />
                  <OptionCheckbox
                    label="Boxes"
                    checked={options.hiddenSinglesBoxes !== false}
                    onChange={toggleOption('hiddenSinglesBoxes')}
                  />
                </div>
              )}
            </div>

            {/* Naked Triples */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="Naked Triples"
                checked={options.nakedTriples !== false}
                onChange={toggleOption('nakedTriples')}
              />
              {options.nakedTriples !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.nakedTriplesRows !== false}
                    onChange={toggleOption('nakedTriplesRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.nakedTriplesCols !== false}
                    onChange={toggleOption('nakedTriplesCols')}
                  />
                  <OptionCheckbox
                    label="Boxes"
                    checked={options.nakedTriplesBoxes !== false}
                    onChange={toggleOption('nakedTriplesBoxes')}
                  />
                </div>
              )}
            </div>

            {/* Hidden Pairs */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="Hidden Pairs"
                checked={options.hiddenPairs !== false}
                onChange={toggleOption('hiddenPairs')}
              />
              {options.hiddenPairs !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.hiddenPairsRows !== false}
                    onChange={toggleOption('hiddenPairsRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.hiddenPairsCols !== false}
                    onChange={toggleOption('hiddenPairsCols')}
                  />
                  <OptionCheckbox
                    label="Boxes"
                    checked={options.hiddenPairsBoxes !== false}
                    onChange={toggleOption('hiddenPairsBoxes')}
                  />
                </div>
              )}
            </div>

            {/* Box/Line Reduction */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="Box/Line Reduction"
                checked={options.boxLineReduction !== false}
                onChange={toggleOption('boxLineReduction')}
              />
              {options.boxLineReduction !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.boxLineReductionRows !== false}
                    onChange={toggleOption('boxLineReductionRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.boxLineReductionCols !== false}
                    onChange={toggleOption('boxLineReductionCols')}
                  />
                </div>
              )}
            </div>

            {/* X-Wing */}
            <div className="border p-2 rounded bg-gray-50 space-y-2">
              <OptionCheckbox
                label="X-Wing"
                checked={options.xWing !== false}
                onChange={toggleOption('xWing')}
              />
              {options.xWing !== false && (
                <div className="ml-6 flex flex-col space-y-1">
                  <OptionCheckbox
                    label="Rows"
                    checked={options.xWingRows !== false}
                    onChange={toggleOption('xWingRows')}
                  />
                  <OptionCheckbox
                    label="Columns"
                    checked={options.xWingCols !== false}
                    onChange={toggleOption('xWingCols')}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
