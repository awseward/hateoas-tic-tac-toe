export const spaces = [
  0, 1, 2,
  3, 4, 5,
  6, 7, 8
] as const;
export type Space = typeof spaces[number];

export const emptySpace = '_';
export type EmptySpace = typeof emptySpace;

export const isEmpty = (board: Board) => (space: Space) =>
  board[space] === emptySpace;

export type PlayerId = 'X' | 'O';

export type Board = Record<Space, (PlayerId | EmptySpace)>;
export const getSpaces = (board: Board): Space[] =>
  Object.keys(board).map(s => parseInt(s)) as Space[];
