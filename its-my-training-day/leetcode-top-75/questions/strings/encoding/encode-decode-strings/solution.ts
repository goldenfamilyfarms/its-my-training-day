import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const encodeStrings = (strs: string[]): string => {
  const parts = new ArrayList<string>();
  for (let i = 0; i < strs.length; i += 1) {
    parts.add(String(strs[i].length));
    parts.add("#");
    parts.add(strs[i]);
  }
  return toArray(parts).join("");
};
export const decodeStrings = (s: string): string[] => {
  const result = new ArrayList<string>();
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (s[j] !== "#") j += 1;
    const length = parseInt(s.slice(i, j), 10);
    const start = j + 1;
    result.add(s.slice(start, start + length));
    i = start + length;
  }
  return toArray(result);
};
