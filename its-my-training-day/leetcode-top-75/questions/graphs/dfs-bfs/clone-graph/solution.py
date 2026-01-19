import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else ArrayList()
def clone_graph(node: Optional[GraphNode]) -> Optional[GraphNode]:
    if node is None:
        return None
    clones: Dict[GraphNode, GraphNode] = {}

    def dfs(curr: GraphNode) -> GraphNode:
        if curr in clones:
            return clones[curr]
        copy = GraphNode(curr.val, ArrayList())
        clones[curr] = copy
        i = 0
        while i < curr.neighbors.size():
            copy.neighbors.add(dfs(curr.neighbors.get(i)))
            i += 1
        return copy

    return dfs(node)
