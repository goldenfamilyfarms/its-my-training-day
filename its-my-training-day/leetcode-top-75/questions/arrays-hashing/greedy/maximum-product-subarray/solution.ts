import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const maximumProductSubarray = (nums: number[]): number => {
  let maxVal = nums[0];
  let minVal = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const val = nums[i];
    if (val < 0) {
      const temp = maxVal;
      maxVal = minVal;
      minVal = temp;
    }
    maxVal = Math.max(val, maxVal * val);
    minVal = Math.min(val, minVal * val);
    if (maxVal > best) best = maxVal;
  }
  return best;
};
