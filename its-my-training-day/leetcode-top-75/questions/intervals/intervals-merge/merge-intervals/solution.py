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
def merge_intervals(intervals: List[List[int]]) -> List[List[int]]:
    if not intervals:
        return []
    _quick_sort(intervals, 0, len(intervals) - 1)
    result = ArrayList()
    current = intervals[0]
    i = 1
    while i < len(intervals):
        if intervals[i][0] <= current[1]:
            if intervals[i][1] > current[1]:
                current[1] = intervals[i][1]
        else:
            result.add(current)
            current = intervals[i]
        i += 1
    result.add(current)
    return result.to_list()
