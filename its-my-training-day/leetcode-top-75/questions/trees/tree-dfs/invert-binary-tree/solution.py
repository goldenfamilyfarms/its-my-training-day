import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def invert_binary_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if root is None:
        return None
    left = invert_binary_tree(root.left)
    right = invert_binary_tree(root.right)
    root.left = right
    root.right = left
    return root
