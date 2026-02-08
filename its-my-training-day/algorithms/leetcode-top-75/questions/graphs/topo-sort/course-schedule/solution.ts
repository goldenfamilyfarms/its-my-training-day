import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const courseSchedule = (numCourses: number, prerequisites: number[][]): boolean => {
  const graph = new Array(numCourses);
  for (let i = 0; i < numCourses; i += 1) graph[i] = new ArrayList<number>();
  const indegree = new Array(numCourses).fill(0);
  for (let i = 0; i < prerequisites.length; i += 1) {
    const a = prerequisites[i][0];
    const b = prerequisites[i][1];
    graph[b].add(a);
    indegree[a] += 1;
  }
  const queue = new Queue<number>();
  for (let i = 0; i < numCourses; i += 1) {
    if (indegree[i] === 0) queue.enqueue(i);
  }
  let visited = 0;
  while (!queue.isEmpty()) {
    const node = queue.dequeue() as number;
    visited += 1;
    const neighbors = graph[node];
    for (let i = 0; i < neighbors.size(); i += 1) {
      const nxt = neighbors.get(i);
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) queue.enqueue(nxt);
    }
  }
  return visited === numCourses;
};
