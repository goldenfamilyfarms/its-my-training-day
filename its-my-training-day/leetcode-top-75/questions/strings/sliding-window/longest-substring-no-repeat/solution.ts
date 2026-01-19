import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestSubstringWithoutRepeating = (s: string): number => {
  const last: Record<string, number> = {};
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    if (last[ch] !== undefined && last[ch] >= left) left = last[ch] + 1;
    last[ch] = right;
    const length = right - left + 1;
    if (length > best) best = length;
  }
  return best;
};
