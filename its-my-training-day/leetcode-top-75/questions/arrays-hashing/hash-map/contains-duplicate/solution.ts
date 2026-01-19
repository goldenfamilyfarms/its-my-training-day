import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const containsDuplicate = (nums: number[]): boolean => {
  const seen: Record<number, boolean> = {};
  for (let i = 0; i < nums.length; i += 1) {
    if (seen[nums[i]]) return true;
    seen[nums[i]] = true;
  }
  return false;
};
