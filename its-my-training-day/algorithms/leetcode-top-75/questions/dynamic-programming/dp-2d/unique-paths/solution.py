import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    i = 1
    while i < m:
        j = 1
        while j < n:
            dp[j] = dp[j] + dp[j - 1]
            j += 1
        i += 1
    return dp[n - 1]
