import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def kth_smallest_bst(root: Optional[TreeNode], k: int) -> int:
    stack = Stack()
    current = root
    count = 0
    while current or not stack.is_empty():
        while current:
            stack.push(current)
            current = current.left
        current = stack.pop()
        count += 1
        if count == k:
            return current.val
        current = current.right
    return -1
