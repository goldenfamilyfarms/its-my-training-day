import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def two_sum(nums: List[int], target: int) -> List[int]:
    seen: Dict[int, int] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        need = target - val
        if need in seen:
            return [seen[need], i]
        seen[val] = i
        i += 1
    return []
