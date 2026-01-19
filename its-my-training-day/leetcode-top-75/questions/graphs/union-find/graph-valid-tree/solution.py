import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def graph_valid_tree(n: int, edges: List[List[int]]) -> bool:
    if len(edges) != n - 1:
        return False
    parent = [i for i in range(n)]

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    i = 0
    while i < len(edges):
        a = edges[i][0]
        b = edges[i][1]
        pa = find(a)
        pb = find(b)
        if pa == pb:
            return False
        parent[pb] = pa
        i += 1
    return True
