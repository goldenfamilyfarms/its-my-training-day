import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def course_schedule(num_courses: int, prerequisites: List[List[int]]) -> bool:
    graph = [ArrayList() for _ in range(num_courses)]
    indegree = [0] * num_courses
    i = 0
    while i < len(prerequisites):
        a = prerequisites[i][0]
        b = prerequisites[i][1]
        graph[b].add(a)
        indegree[a] += 1
        i += 1
    queue = Queue()
    i = 0
    while i < num_courses:
        if indegree[i] == 0:
            queue.enqueue(i)
        i += 1
    visited = 0
    while not queue.is_empty():
        node = queue.dequeue()
        visited += 1
        neighbors = graph[node]
        j = 0
        while j < neighbors.size():
            nxt = neighbors.get(j)
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.enqueue(nxt)
            j += 1
    return visited == num_courses
