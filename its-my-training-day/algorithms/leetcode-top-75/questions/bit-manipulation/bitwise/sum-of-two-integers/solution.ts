import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const sumOfTwoIntegers = (a: number, b: number): number => {
  let x = a;
  let y = b;
  const mask = 0xffffffff;
  while (y !== 0) {
    const carry = (x & y) & mask;
    x = (x ^ y) & mask;
    y = (carry << 1) & mask;
  }
  return x | 0;
};
