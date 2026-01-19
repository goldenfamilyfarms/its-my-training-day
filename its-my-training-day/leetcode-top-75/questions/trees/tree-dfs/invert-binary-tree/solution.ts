import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const invertBinaryTree = (root: TreeNode | null): TreeNode | null => {
  if (root === null) return null;
  const left = invertBinaryTree(root.left);
  const right = invertBinaryTree(root.right);
  root.left = right;
  root.right = left;
  return root;
};
