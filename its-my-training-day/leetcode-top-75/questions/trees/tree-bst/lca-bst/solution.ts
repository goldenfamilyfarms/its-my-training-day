import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const lcaBST = (root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null => {
  let current = root;
  while (current !== null) {
    if (p.val < current.val && q.val < current.val) current = current.left;
    else if (p.val > current.val && q.val > current.val) current = current.right;
    else return current;
  }
  return null;
};
