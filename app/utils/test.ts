import { BOARDS } from './boards.js';
import { solveSudoku } from './solve.js';

const board = BOARDS.hard.jan3;
console.log('Initial Board:');
console.table(board);

console.time('myTimer');
const solved = solveSudoku(board);
console.timeEnd('myTimer');

if (solved) {
  console.log('Solved Board:');
  console.table(board);
} else {
  console.log('No solution found.');
}
