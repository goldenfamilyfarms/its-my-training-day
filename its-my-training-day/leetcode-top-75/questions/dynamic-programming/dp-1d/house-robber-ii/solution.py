import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def house_robber_ii(nums: List[int]) -> int:
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]

    def rob_range(left: int, right: int) -> int:
        prev1 = 0
        prev2 = 0
        i = left
        while i <= right:
            take = prev2 + nums[i]
            skip = prev1
            current = take if take > skip else skip
            prev2 = prev1
            prev1 = current
            i += 1
        return prev1

    return max(rob_range(0, len(nums) - 2), rob_range(1, len(nums) - 1))
