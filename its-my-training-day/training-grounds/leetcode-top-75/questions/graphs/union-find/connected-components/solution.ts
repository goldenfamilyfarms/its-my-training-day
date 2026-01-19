import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const numberOfConnectedComponents = (n: number, edges: number[][]): number => {
  const parent = new Array(n);
  for (let i = 0; i < n; i += 1) parent[i] = i;
  let count = n;
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== x) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  for (let i = 0; i < edges.length; i += 1) {
    const a = edges[i][0];
    const b = edges[i][1];
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) {
      parent[pb] = pa;
      count -= 1;
    }
  }
  return count;
};
