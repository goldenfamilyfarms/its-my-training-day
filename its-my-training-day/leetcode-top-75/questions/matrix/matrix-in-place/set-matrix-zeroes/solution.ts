import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const setMatrixZeroes = (matrix: number[][]): void => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let rowZero = false;
  let colZero = false;
  for (let r = 0; r < rows; r += 1) {
    if (matrix[r][0] === 0) colZero = true;
  }
  for (let c = 0; c < cols; c += 1) {
    if (matrix[0][c] === 0) rowZero = true;
  }
  for (let r = 1; r < rows; r += 1) {
    for (let c = 1; c < cols; c += 1) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < rows; r += 1) {
    if (matrix[r][0] === 0) {
      for (let c = 1; c < cols; c += 1) matrix[r][c] = 0;
    }
  }
  for (let c = 1; c < cols; c += 1) {
    if (matrix[0][c] === 0) {
      for (let r = 1; r < rows; r += 1) matrix[r][c] = 0;
    }
  }
  if (rowZero) {
    for (let c = 0; c < cols; c += 1) matrix[0][c] = 0;
  }
  if (colZero) {
    for (let r = 0; r < rows; r += 1) matrix[r][0] = 0;
  }
};
