import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestIncreasingSubsequence = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const tails = new Array(nums.length).fill(0);
  let size = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const val = nums[i];
    let left = 0;
    let right = size;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < val) left = mid + 1;
      else right = mid;
    }
    tails[left] = val;
    if (left === size) size += 1;
  }
  return size;
};
