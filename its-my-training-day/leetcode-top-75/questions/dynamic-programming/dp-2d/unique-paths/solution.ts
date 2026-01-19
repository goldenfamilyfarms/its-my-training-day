import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const uniquePaths = (m: number, n: number): number => {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i += 1) {
    for (let j = 1; j < n; j += 1) {
      dp[j] = dp[j] + dp[j - 1];
    }
  }
  return dp[n - 1];
};
