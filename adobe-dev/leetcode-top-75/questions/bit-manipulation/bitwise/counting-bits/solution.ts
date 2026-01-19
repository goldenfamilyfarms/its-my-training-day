import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const countingBits = (n: number): number[] => {
  const result = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    result[i] = result[i >> 1] + (i & 1);
  }
  return result;
};
