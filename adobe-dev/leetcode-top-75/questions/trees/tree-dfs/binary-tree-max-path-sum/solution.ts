import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const binaryTreeMaxPathSum = (root: TreeNode | null): number => {
  let best = -1e9;
  const dfs = (node: TreeNode | null): number => {
    if (node === null) return 0;
    let left = dfs(node.left);
    let right = dfs(node.right);
    if (left < 0) left = 0;
    if (right < 0) right = 0;
    const total = node.val + left + right;
    if (total > best) best = total;
    return node.val + (left > right ? left : right);
  };
  dfs(root);
  return best;
};
