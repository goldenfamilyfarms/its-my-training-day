import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const maxDepthBinaryTree = (root: TreeNode | null): number => {
  if (root === null) return 0;
  const left = maxDepthBinaryTree(root.left);
  const right = maxDepthBinaryTree(root.right);
  return 1 + (left > right ? left : right);
};
