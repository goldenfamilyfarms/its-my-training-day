import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def top_k_frequent(nums: List[int], k: int) -> List[int]:
    freq: Dict[int, int] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        freq[val] = freq.get(val, 0) + 1
        i += 1
    heap = MinHeap()
    for key in freq:
        heap.push((freq[key], key))
        if heap.size() > k:
            heap.pop()
    result = [0] * k
    i = k - 1
    while i >= 0:
        result[i] = heap.pop()[1]
        i -= 1
    return result
