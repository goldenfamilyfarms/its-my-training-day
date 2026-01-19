import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def maximum_product_subarray(nums: List[int]) -> int:
    max_val = nums[0]
    min_val = nums[0]
    best = nums[0]
    i = 1
    while i < len(nums):
        val = nums[i]
        if val < 0:
            max_val, min_val = min_val, max_val
        max_val = max(val, max_val * val)
        min_val = min(val, min_val * val)
        if max_val > best:
            best = max_val
        i += 1
    return best
