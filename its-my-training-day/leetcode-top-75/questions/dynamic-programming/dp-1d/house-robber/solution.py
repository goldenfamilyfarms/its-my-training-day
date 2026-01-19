import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def house_robber(nums: List[int]) -> int:
    prev1 = 0
    prev2 = 0
    i = 0
    while i < len(nums):
        take = prev2 + nums[i]
        skip = prev1
        current = take if take > skip else skip
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1
