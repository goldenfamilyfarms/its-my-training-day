import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def longest_substring_without_repeating(s: str) -> int:
    last: Dict[str, int] = {}
    left = 0
    best = 0
    right = 0
    while right < len(s):
        ch = s[right]
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        length = right - left + 1
        if length > best:
            best = length
        right += 1
    return best
