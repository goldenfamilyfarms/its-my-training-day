import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def max_depth_binary_tree(root: Optional[TreeNode]) -> int:
    if root is None:
        return 0
    left = max_depth_binary_tree(root.left)
    right = max_depth_binary_tree(root.right)
    return 1 + (left if left > right else right)
