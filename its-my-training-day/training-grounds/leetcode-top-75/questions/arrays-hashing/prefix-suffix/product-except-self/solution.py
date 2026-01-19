import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def product_except_self(nums: List[int]) -> List[int]:
    n = len(nums)
    result = [1] * n
    prefix = 1
    i = 0
    while i < n:
        result[i] = prefix
        prefix *= nums[i]
        i += 1
    suffix = 1
    i = n - 1
    while i >= 0:
        result[i] *= suffix
        suffix *= nums[i]
        i -= 1
    return result
