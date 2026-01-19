import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const decodeWays = (s: string): number => {
  if (s.length === 0 || s[0] === "0") return 0;
  let prev2 = 1;
  let prev1 = 1;
  for (let i = 1; i < s.length; i += 1) {
    let current = 0;
    if (s[i] !== "0") current += prev1;
    const two = parseInt(s.slice(i - 1, i + 1), 10);
    if (two >= 10 && two <= 26) current += prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
};
