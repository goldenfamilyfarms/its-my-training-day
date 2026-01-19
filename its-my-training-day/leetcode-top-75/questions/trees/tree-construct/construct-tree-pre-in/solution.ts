import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const buildTreePreIn = (preorder: number[], inorder: number[]): TreeNode | null => {
  const indexMap: Record<number, number> = {};
  for (let i = 0; i < inorder.length; i += 1) indexMap[inorder[i]] = i;
  const helper = (preL: number, preR: number, inL: number, inR: number): TreeNode | null => {
    if (preL > preR) return null;
    const rootVal = preorder[preL];
    const root = new TreeNode(rootVal);
    const mid = indexMap[rootVal];
    const leftSize = mid - inL;
    root.left = helper(preL + 1, preL + leftSize, inL, mid - 1);
    root.right = helper(preL + leftSize + 1, preR, mid + 1, inR);
    return root;
  };
  return helper(0, preorder.length - 1, 0, inorder.length - 1);
};
