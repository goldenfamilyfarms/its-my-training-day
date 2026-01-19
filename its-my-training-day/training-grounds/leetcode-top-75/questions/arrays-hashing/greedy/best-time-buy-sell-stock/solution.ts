import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const bestTimeBuySellStock = (prices: number[]): number => {
  if (prices.length === 0) return 0;
  let minPrice = prices[0];
  let maxProfit = 0;
  for (let i = 1; i < prices.length; i += 1) {
    if (prices[i] < minPrice) minPrice = prices[i];
    else {
      const profit = prices[i] - minPrice;
      if (profit > maxProfit) maxProfit = profit;
    }
  }
  return maxProfit;
};
