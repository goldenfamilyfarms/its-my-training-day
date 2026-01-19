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
export const meetingRooms = (intervals: number[][]): boolean => {
  if (intervals.length === 0) return true;
  quickSortIntervals(intervals, 0, intervals.length - 1);
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
};
