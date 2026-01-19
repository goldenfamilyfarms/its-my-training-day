import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const coinChange = (coins: number[], amount: number): number => {
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let i = 1; i <= amount; i += 1) {
    for (let j = 0; j < coins.length; j += 1) {
      const coin = coins[j];
      if (coin <= i) {
        const cand = dp[i - coin] + 1;
        if (cand < dp[i]) dp[i] = cand;
      }
    }
  }
  return dp[amount] === amount + 1 ? -1 : dp[amount];
};
