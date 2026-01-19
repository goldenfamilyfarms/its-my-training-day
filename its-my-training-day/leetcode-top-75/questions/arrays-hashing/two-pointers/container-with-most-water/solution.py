import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def container_with_most_water(heights: List[int]) -> int:
    left = 0
    right = len(heights) - 1
    best = 0
    while left < right:
        width = right - left
        if heights[left] < heights[right]:
            area = heights[left] * width
            if area > best:
                best = area
            left += 1
        else:
            area = heights[right] * width
            if area > best:
                best = area
            right -= 1
    return best
