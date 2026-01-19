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
def three_sum(nums: List[int]) -> List[List[int]]:
    if len(nums) < 3:
        return []
    _quick_sort(nums, 0, len(nums) - 1)
    result = ArrayList()
    i = 0
    while i < len(nums) - 2:
        if i > 0 and nums[i] == nums[i - 1]:
            i += 1
            continue
        left = i + 1
        right = len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.add([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
        i += 1
    return result.to_list()
