import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def maximum_subarray(nums: List[int]) -> int:
    best = nums[0]
    current = nums[0]
    i = 1
    while i < len(nums):
        val = nums[i]
        if current + val > val:
            current = current + val
        else:
            current = val
        if current > best:
            best = current
        i += 1
    return best
