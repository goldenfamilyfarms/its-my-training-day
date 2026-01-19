import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def alien_dictionary(words: List[str]) -> str:
    graph: Dict[str, ArrayList] = {}
    indegree: Dict[str, int] = {}
    i = 0
    while i < len(words):
        j = 0
        while j < len(words[i]):
            ch = words[i][j]
            if ch not in graph:
                graph[ch] = ArrayList()
                indegree[ch] = 0
            j += 1
        i += 1

    i = 0
    while i < len(words) - 1:
        w1 = words[i]
        w2 = words[i + 1]
        j = 0
        while j < len(w1) and j < len(w2) and w1[j] == w2[j]:
            j += 1
        if j < len(w1) and j < len(w2):
            a = w1[j]
            b = w2[j]
            graph[a].add(b)
            indegree[b] += 1
        elif len(w1) > len(w2):
            return ""
        i += 1

    queue = Queue()
    for ch in indegree:
        if indegree[ch] == 0:
            queue.enqueue(ch)

    order = ArrayList()
    while not queue.is_empty():
        ch = queue.dequeue()
        order.add(ch)
        neighbors = graph[ch]
        k = 0
        while k < neighbors.size():
            nxt = neighbors.get(k)
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.enqueue(nxt)
            k += 1

    if order.size() != len(indegree):
        return ""
    return "".join(order.to_list())
