import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const reverseBits = (n: number): number => {
  let result = 0;
  let x = n >>> 0;
  for (let i = 0; i < 32; i += 1) {
    result = (result << 1) | (x & 1);
    x >>>= 1;
  }
  return result >>> 0;
};
