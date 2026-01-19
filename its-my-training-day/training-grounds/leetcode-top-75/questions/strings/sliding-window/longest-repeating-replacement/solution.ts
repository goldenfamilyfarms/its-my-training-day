import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestRepeatingCharacterReplacement = (s: string, k: number): number => {
  const counts: Record<string, number> = {};
  let left = 0;
  let maxCount = 0;
  let best = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    counts[ch] = (counts[ch] || 0) + 1;
    if (counts[ch] > maxCount) maxCount = counts[ch];
    const window = right - left + 1;
    if (window - maxCount > k) {
      counts[s[left]] -= 1;
      left += 1;
    } else if (window > best) {
      best = window;
    }
  }
  return best;
};
