import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const containerWithMostWater = (heights: number[]): number => {
  let left = 0;
  let right = heights.length - 1;
  let best = 0;
  while (left < right) {
    const width = right - left;
    if (heights[left] < heights[right]) {
      const area = heights[left] * width;
      if (area > best) best = area;
      left += 1;
    } else {
      const area = heights[right] * width;
      if (area > best) best = area;
      right -= 1;
    }
  }
  return best;
};
