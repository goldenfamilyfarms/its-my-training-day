import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const twoSum = (nums: number[], target: number): number[] => {
  const seen: Record<number, number> = {};
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen[need] !== undefined) {
      return [seen[need], i];
    }
    seen[nums[i]] = i;
  }
  return [];
};
