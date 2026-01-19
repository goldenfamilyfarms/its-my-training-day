import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const subtreeOfAnotherTree = (root: TreeNode | null, subRoot: TreeNode | null): boolean => {
  const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  };
  if (root === null) return subRoot === null;
  if (same(root, subRoot)) return true;
  return subtreeOfAnotherTree(root.left, subRoot) || subtreeOfAnotherTree(root.right, subRoot);
};
