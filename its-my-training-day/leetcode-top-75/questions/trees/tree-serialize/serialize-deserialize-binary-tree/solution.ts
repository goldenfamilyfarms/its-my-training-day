import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const serializeBinaryTree = (root: TreeNode | null): string => {
  if (root === null) return "";
  const result = new ArrayList<string>();
  const queue = new Queue<TreeNode | null>();
  queue.enqueue(root);
  while (!queue.isEmpty()) {
    const node = queue.dequeue() as TreeNode | null;
    if (node === null) {
      result.add("#");
    } else {
      result.add(String(node.val));
      queue.enqueue(node.left);
      queue.enqueue(node.right);
    }
  }
  return toArray(result).join(",");
};
export const deserializeBinaryTree = (data: string): TreeNode | null => {
  if (data.length === 0) return null;
  const values = data.split(",");
  if (values[0] === "#") return null;
  const root = new TreeNode(parseInt(values[0], 10));
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  let i = 1;
  while (i < values.length) {
    const node = queue.dequeue() as TreeNode;
    const leftVal = values[i];
    i += 1;
    if (leftVal !== "#") {
      node.left = new TreeNode(parseInt(leftVal, 10));
      queue.enqueue(node.left);
    }
    const rightVal = values[i] ?? "#";
    i += 1;
    if (rightVal !== "#") {
      node.right = new TreeNode(parseInt(rightVal, 10));
      queue.enqueue(node.right);
    }
  }
  return root;
};
