import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def combination_sum(candidates: List[int], target: int) -> List[List[int]]:
    result = ArrayList()
    path = ArrayList()

    def backtrack(start: int, total: int) -> None:
        if total == target:
            result.add(path.to_list())
            return
        if total > target:
            return
        i = start
        while i < len(candidates):
            path.add(candidates[i])
            backtrack(i, total + candidates[i])
            path.remove_last()
            i += 1

    backtrack(0, 0)
    return result.to_list()
