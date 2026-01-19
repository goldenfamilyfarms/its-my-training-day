import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def counting_bits(n: int) -> List[int]:
    result = [0] * (n + 1)
    i = 1
    while i <= n:
        result[i] = result[i >> 1] + (i & 1)
        i += 1
    return result
