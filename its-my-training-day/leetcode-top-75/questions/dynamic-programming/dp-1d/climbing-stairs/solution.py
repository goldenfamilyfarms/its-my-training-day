import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def climbing_stairs(n: int) -> int:
    if n <= 2:
        return n
    prev2 = 1
    prev1 = 2
    i = 3
    while i <= n:
        current = prev1 + prev2
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1
