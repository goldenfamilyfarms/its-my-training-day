import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def decode_ways(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev2 = 1
    prev1 = 1
    i = 1
    while i < len(s):
        current = 0
        if s[i] != "0":
            current += prev1
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
            current += prev2
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1
