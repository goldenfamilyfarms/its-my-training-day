import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def kth_largest_in_array(nums: List[int], k: int) -> int:
    heap = MinHeap()
    i = 0
    while i < len(nums):
        heap.push(nums[i])
        if heap.size() > k:
            heap.pop()
        i += 1
    return heap.peek()
