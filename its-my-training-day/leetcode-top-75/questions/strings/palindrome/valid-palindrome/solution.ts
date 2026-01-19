import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const validPalindrome = (s: string): boolean => {
  let left = 0;
  let right = s.length - 1;
  const isAlphaNum = (ch: string): boolean => /[a-z0-9]/i.test(ch);
  while (left < right) {
    while (left < right && !isAlphaNum(s[left])) left += 1;
    while (left < right && !isAlphaNum(s[right])) right -= 1;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
};
