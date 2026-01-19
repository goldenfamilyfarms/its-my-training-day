import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def _quick_sort(nums: List[int], left: int, right: int) -> None:
    if left >= right:
        return
    pivot = nums[(left + right) // 2]
    i = left
    j = right
    while i <= j:
        while nums[i] < pivot:
            i += 1
        while nums[j] > pivot:
            j -= 1
        if i <= j:
            nums[i], nums[j] = nums[j], nums[i]
            i += 1
            j -= 1
    if left < j:
        _quick_sort(nums, left, j)
    if i < right:
        _quick_sort(nums, i, right)
def meeting_rooms_ii(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    _quick_sort(intervals, 0, len(intervals) - 1)
    heap = MinHeap()
    heap.push(intervals[0][1])
    i = 1
    while i < len(intervals):
        if heap.peek() is not None and intervals[i][0] >= heap.peek():
            heap.pop()
        heap.push(intervals[i][1])
        i += 1
    return heap.size()
