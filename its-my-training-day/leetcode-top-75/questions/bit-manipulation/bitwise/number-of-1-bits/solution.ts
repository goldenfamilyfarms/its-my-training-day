import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const numberOf1Bits = (n: number): number => {
  let count = 0;
  let x = n >>> 0;
  while (x !== 0) {
    x &= x - 1;
    count += 1;
  }
  return count;
};
