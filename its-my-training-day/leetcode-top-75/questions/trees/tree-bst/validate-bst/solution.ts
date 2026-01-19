import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const validateBST = (root: TreeNode | null): boolean => {
  const helper = (node: TreeNode | null, low: number, high: number): boolean => {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return helper(node.left, low, node.val) && helper(node.right, node.val, high);
  };
  return helper(root, -1e18, 1e18);
};
