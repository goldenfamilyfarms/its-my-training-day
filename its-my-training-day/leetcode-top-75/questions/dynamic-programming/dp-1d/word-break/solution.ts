import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const wordBreak = (s: string, wordDict: string[]): boolean => {
  const wordSet: Record<string, boolean> = {};
  for (let i = 0; i < wordDict.length; i += 1) wordSet[wordDict[i]] = true;
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (dp[j] && wordSet[s.slice(j, i)]) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
};
