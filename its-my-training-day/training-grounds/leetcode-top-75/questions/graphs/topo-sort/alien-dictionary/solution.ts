import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const alienDictionary = (words: string[]): string => {
  const graph = new Map<string, ArrayList<string>>();
  const indegree = new Map<string, number>();
  for (let i = 0; i < words.length; i += 1) {
    for (let j = 0; j < words[i].length; j += 1) {
      const ch = words[i][j];
      if (!graph.has(ch)) graph.set(ch, new ArrayList<string>());
      if (!indegree.has(ch)) indegree.set(ch, 0);
    }
  }
  for (let i = 0; i + 1 < words.length; i += 1) {
    const a = words[i];
    const b = words[i + 1];
    let j = 0;
    while (j < a.length && j < b.length && a[j] === b[j]) j += 1;
    if (j < a.length && j < b.length) {
      const from = a[j];
      const to = b[j];
      (graph.get(from) as ArrayList<string>).add(to);
      indegree.set(to, (indegree.get(to) as number) + 1);
    } else if (a.length > b.length) {
      return "";
    }
  }
  const queue = new Queue<string>();
  indegree.forEach((value, key) => {
    if (value === 0) queue.enqueue(key);
  });
  const order = new ArrayList<string>();
  while (!queue.isEmpty()) {
    const ch = queue.dequeue() as string;
    order.add(ch);
    const neighbors = graph.get(ch) as ArrayList<string>;
    for (let i = 0; i < neighbors.size(); i += 1) {
      const nxt = neighbors.get(i);
      indegree.set(nxt, (indegree.get(nxt) as number) - 1);
      if (indegree.get(nxt) === 0) queue.enqueue(nxt);
    }
  }
  if (order.size() !== indegree.size) return "";
  return toArray(order).join("");
};
