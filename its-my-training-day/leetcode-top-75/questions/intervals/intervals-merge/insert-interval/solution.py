import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def insert_interval(intervals: List[List[int]], new_interval: List[int]) -> List[List[int]]:
    result = ArrayList()
    i = 0
    while i < len(intervals) and intervals[i][1] < new_interval[0]:
        result.add(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= new_interval[1]:
        if intervals[i][0] < new_interval[0]:
            new_interval[0] = intervals[i][0]
        if intervals[i][1] > new_interval[1]:
            new_interval[1] = intervals[i][1]
        i += 1
    result.add(new_interval)
    while i < len(intervals):
        result.add(intervals[i])
        i += 1
    return result.to_list()
