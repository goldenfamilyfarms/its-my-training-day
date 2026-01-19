import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const houseRobber = (nums: number[]): number => {
  let prev1 = 0;
  let prev2 = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const take = prev2 + nums[i];
    const skip = prev1;
    const current = take > skip ? take : skip;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
};
