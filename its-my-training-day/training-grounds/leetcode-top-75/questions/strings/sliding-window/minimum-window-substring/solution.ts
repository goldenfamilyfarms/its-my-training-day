import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const minimumWindowSubstring = (s: string, t: string): string => {
  if (t.length === 0) return "";
  const target: Record<string, number> = {};
  for (let i = 0; i < t.length; i += 1) target[t[i]] = (target[t[i]] || 0) + 1;
  const need = Object.keys(target).length;
  let formed = 0;
  const window: Record<string, number> = {};
  let left = 0;
  let bestLen = 1 << 30;
  let bestL = 0;
  let bestR = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    window[ch] = (window[ch] || 0) + 1;
    if (target[ch] !== undefined && window[ch] === target[ch]) formed += 1;
    while (left <= right && formed === need) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestL = left;
        bestR = right;
      }
      const leftCh = s[left];
      window[leftCh] -= 1;
      if (target[leftCh] !== undefined && window[leftCh] < target[leftCh]) formed -= 1;
      left += 1;
    }
  }
  if (bestLen === (1 << 30)) return "";
  return s.slice(bestL, bestR + 1);
};
