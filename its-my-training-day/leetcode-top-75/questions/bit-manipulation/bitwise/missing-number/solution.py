import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def missing_number(nums: List[int]) -> int:
    xor_val = 0
    i = 0
    while i < len(nums):
        xor_val ^= i
        xor_val ^= nums[i]
        i += 1
    xor_val ^= len(nums)
    return xor_val
