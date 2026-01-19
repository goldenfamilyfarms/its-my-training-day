import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def reverse_bits(n: int) -> int:
    result = 0
    i = 0
    while i < 32:
        result = (result << 1) | (n & 1)
        n >>= 1
        i += 1
    return result
