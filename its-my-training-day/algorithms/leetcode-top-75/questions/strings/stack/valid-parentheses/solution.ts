import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const validParentheses = (s: string): boolean => {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (pairs[ch]) {
      const top = stack.pop();
      if (top === null || top !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.isEmpty();
};
