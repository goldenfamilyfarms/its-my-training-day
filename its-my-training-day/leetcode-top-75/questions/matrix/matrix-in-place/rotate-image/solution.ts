import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const rotateImage = (matrix: number[][]): void => {
  const n = matrix.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer += 1) {
    const first = layer;
    const last = n - 1 - layer;
    for (let i = first; i < last; i += 1) {
      const offset = i - first;
      const top = matrix[first][i];
      matrix[first][i] = matrix[last - offset][first];
      matrix[last - offset][first] = matrix[last][last - offset];
      matrix[last][last - offset] = matrix[i][last];
      matrix[i][last] = top;
    }
  }
};
