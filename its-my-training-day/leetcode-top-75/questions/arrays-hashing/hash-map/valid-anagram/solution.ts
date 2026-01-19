import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const validAnagram = (s: string, t: string): boolean => {
  if (s.length !== t.length) return false;
  const count: Record<string, number> = {};
  for (let i = 0; i < s.length; i += 1) count[s[i]] = (count[s[i]] || 0) + 1;
  for (let i = 0; i < t.length; i += 1) {
    const ch = t[i];
    if (count[ch] === undefined) return false;
    count[ch] -= 1;
    if (count[ch] < 0) return false;
  }
  return true;
};
