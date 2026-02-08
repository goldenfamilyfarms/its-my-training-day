import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const kthSmallestBST = (root: TreeNode | null, k: number): number => {
  const stack = new Stack<TreeNode>();
  let current: TreeNode | null = root;
  let count = 0;
  while (current !== null || !stack.isEmpty()) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }
    current = stack.pop() as TreeNode;
    count += 1;
    if (count === k) return current.val;
    current = current.right;
  }
  return -1;
};
