import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const maximumSubarray = (nums: number[]): number => {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const val = nums[i];
    current = current + val > val ? current + val : val;
    if (current > best) best = current;
  }
  return best;
};
