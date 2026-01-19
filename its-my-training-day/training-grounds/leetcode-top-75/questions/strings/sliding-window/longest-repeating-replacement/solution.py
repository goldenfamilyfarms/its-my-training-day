import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def longest_repeating_character_replacement(s: str, k: int) -> int:
    counts: Dict[str, int] = {}
    left = 0
    max_count = 0
    best = 0
    right = 0
    while right < len(s):
        ch = s[right]
        counts[ch] = counts.get(ch, 0) + 1
        if counts[ch] > max_count:
            max_count = counts[ch]
        window = right - left + 1
        if window - max_count > k:
            left_ch = s[left]
            counts[left_ch] -= 1
            left += 1
        else:
            if window > best:
                best = window
        right += 1
    return best
