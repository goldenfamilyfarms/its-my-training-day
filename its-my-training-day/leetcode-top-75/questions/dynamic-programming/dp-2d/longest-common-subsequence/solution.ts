import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestCommonSubsequence = (text1: string, text2: string): number => {
  const n = text1.length;
  const m = text2.length;
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i += 1) {
    dp[i] = new Array(m + 1).fill(0);
  }
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
};
