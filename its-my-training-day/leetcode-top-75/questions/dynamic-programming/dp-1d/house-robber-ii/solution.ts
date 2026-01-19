import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const houseRobberII = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  const robRange = (left: number, right: number): number => {
    let prev1 = 0;
    let prev2 = 0;
    for (let i = left; i <= right; i += 1) {
      const take = prev2 + nums[i];
      const skip = prev1;
      const current = take > skip ? take : skip;
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  };
  return Math.max(robRange(0, nums.length - 2), robRange(1, nums.length - 1));
};
