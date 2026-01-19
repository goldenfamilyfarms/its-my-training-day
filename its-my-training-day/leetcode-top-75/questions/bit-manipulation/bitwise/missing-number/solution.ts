import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const missingNumber = (nums: number[]): number => {
  let xorVal = 0;
  for (let i = 0; i < nums.length; i += 1) {
    xorVal ^= i;
    xorVal ^= nums[i];
  }
  xorVal ^= nums.length;
  return xorVal;
};
