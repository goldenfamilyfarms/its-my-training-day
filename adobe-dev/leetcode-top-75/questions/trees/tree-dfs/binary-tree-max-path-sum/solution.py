import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def binary_tree_max_path_sum(root: Optional[TreeNode]) -> int:
    best = -10**9

    def dfs(node: Optional[TreeNode]) -> int:
        nonlocal best
        if node is None:
            return 0
        left = dfs(node.left)
        right = dfs(node.right)
        left = left if left > 0 else 0
        right = right if right > 0 else 0
        total = node.val + left + right
        if total > best:
            best = total
        return node.val + (left if left > right else right)

    dfs(root)
    return best
