import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const sameTree = (p: TreeNode | null, q: TreeNode | null): boolean => {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;
  return sameTree(p.left, q.left) && sameTree(p.right, q.right);
};
