import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def longest_increasing_subsequence(nums: List[int]) -> int:
    if not nums:
        return 0
    tails = [0] * len(nums)
    size = 0
    i = 0
    while i < len(nums):
        val = nums[i]
        left = 0
        right = size
        while left < right:
            mid = (left + right) // 2
            if tails[mid] < val:
                left = mid + 1
            else:
                right = mid
        tails[left] = val
        if left == size:
            size += 1
        i += 1
    return size
