import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const longestPalindromicSubstring = (s: string): string => {
  if (s.length === 0) return "";
  let start = 0;
  let end = 0;
  const expand = (l: number, r: number): void => {
    let left = l;
    let right = r;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left -= 1;
      right += 1;
    }
    left += 1;
    right -= 1;
    if (right - left > end - start) {
      start = left;
      end = right;
    }
  };
  for (let i = 0; i < s.length; i += 1) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(start, end + 1);
};
