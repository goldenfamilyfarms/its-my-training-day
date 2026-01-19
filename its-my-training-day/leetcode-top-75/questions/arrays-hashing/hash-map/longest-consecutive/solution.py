import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def longest_consecutive(nums: List[int]) -> int:
    seen = {}
    i = 0
    while i < len(nums):
        seen[nums[i]] = True
        i += 1
    longest = 0
    i = 0
    while i < len(nums):
        val = nums[i]
        if (val - 1) not in seen:
            length = 1
            current = val + 1
            while current in seen:
                length += 1
                current += 1
            if length > longest:
                longest = length
        i += 1
    return longest
