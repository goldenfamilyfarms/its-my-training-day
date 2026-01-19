import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def contains_duplicate(nums: List[int]) -> bool:
    seen: Dict[int, bool] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        if val in seen:
            return True
        seen[val] = True
        i += 1
    return False
