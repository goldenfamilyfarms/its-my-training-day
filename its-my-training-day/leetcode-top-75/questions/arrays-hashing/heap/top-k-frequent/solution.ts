import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const topKFrequent = (nums: number[], k: number): number[] => {
  const freq: Record<number, number> = {};
  for (let i = 0; i < nums.length; i += 1) freq[nums[i]] = (freq[nums[i]] || 0) + 1;
  type Pair = { count: number; value: number };
  const heap = new MinHeap<Pair>();
  Object.keys(freq).forEach((key) => {
    const value = parseInt(key, 10);
    heap.push({ count: freq[value], value });
    if (heap.size() > k) heap.pop();
  });
  const result = new Array(k);
  for (let i = k - 1; i >= 0; i -= 1) {
    result[i] = (heap.pop() as Pair).value;
  }
  return result;
};
