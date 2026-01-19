import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

const quickSortIntervals = (intervals: number[][], left: number, right: number): void => {
  if (left >= right) return;
  const pivot = intervals[Math.floor((left + right) / 2)][0];
  let i = left;
  let j = right;
  while (i <= j) {
    while (intervals[i][0] < pivot) i += 1;
    while (intervals[j][0] > pivot) j -= 1;
    if (i <= j) {
      const temp = intervals[i];
      intervals[i] = intervals[j];
      intervals[j] = temp;
      i += 1;
      j -= 1;
    }
  }
  if (left < j) quickSortIntervals(intervals, left, j);
  if (i < right) quickSortIntervals(intervals, i, right);
};
export const insertInterval = (intervals: number[][], newInterval: number[]): number[][] => {
  const result = new ArrayList<number[]>();
  let i = 0;
  while (i < intervals.length && intervals[i][1] < newInterval[0]) {
    result.add(intervals[i]);
    i += 1;
  }
  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    if (intervals[i][0] < newInterval[0]) newInterval[0] = intervals[i][0];
    if (intervals[i][1] > newInterval[1]) newInterval[1] = intervals[i][1];
    i += 1;
  }
  result.add(newInterval);
  while (i < intervals.length) {
    result.add(intervals[i]);
    i += 1;
  }
  return toArray(result);
};
