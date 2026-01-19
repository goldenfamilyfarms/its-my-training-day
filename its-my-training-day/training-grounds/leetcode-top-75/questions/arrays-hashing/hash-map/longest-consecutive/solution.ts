import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestConsecutive = (nums: number[]): number => {
  const seen: Record<number, boolean> = {};
  for (let i = 0; i < nums.length; i += 1) seen[nums[i]] = true;
  let longest = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const val = nums[i];
    if (seen[val - 1] !== true) {
      let length = 1;
      let current = val + 1;
      while (seen[current]) {
        length += 1;
        current += 1;
      }
      if (length > longest) longest = length;
    }
  }
  return longest;
};
