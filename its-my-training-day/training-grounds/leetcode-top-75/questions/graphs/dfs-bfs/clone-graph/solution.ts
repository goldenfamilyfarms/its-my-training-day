import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const cloneGraph = (node: GraphNode | null): GraphNode | null => {
  if (node === null) return null;
  const clones = new Map<GraphNode, GraphNode>();
  const dfs = (curr: GraphNode): GraphNode => {
    if (clones.has(curr)) return clones.get(curr) as GraphNode;
    const copy = new GraphNode(curr.val);
    clones.set(curr, copy);
    for (let i = 0; i < curr.neighbors.size(); i += 1) {
      copy.neighbors.add(dfs(curr.neighbors.get(i)));
    }
    return copy;
  };
  return dfs(node);
};
