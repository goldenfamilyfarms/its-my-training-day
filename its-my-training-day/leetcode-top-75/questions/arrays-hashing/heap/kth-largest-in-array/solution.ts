import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const kthLargestInArray = (nums: number[], k: number): number => {
  const heap = new MinHeap<number>();
  for (let i = 0; i < nums.length; i += 1) {
    heap.push(nums[i]);
    if (heap.size() > k) heap.pop();
  }
  return heap.peek() as number;
};
