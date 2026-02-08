import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const combinationSum = (candidates: number[], target: number): number[][] => {
  const result = new ArrayList<number[]>();
  const path = new ArrayList<number>();
  const backtrack = (start: number, total: number): void => {
    if (total === target) {
      result.add(toArray(path));
      return;
    }
    if (total > target) return;
    for (let i = start; i < candidates.length; i += 1) {
      path.add(candidates[i]);
      backtrack(i, total + candidates[i]);
      path.removeLast();
    }
  };
  backtrack(0, 0);
  return toArray(result);
};
