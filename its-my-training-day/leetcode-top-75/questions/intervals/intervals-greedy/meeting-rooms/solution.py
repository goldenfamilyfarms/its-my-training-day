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
def meeting_rooms(intervals: List[List[int]]) -> bool:
    if not intervals:
        return True
    _quick_sort(intervals, 0, len(intervals) - 1)
    i = 1
    while i < len(intervals):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
        i += 1
    return True
