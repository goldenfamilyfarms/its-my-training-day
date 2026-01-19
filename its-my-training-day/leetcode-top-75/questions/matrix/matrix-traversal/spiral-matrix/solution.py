import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def spiral_matrix(matrix: List[List[int]]) -> List[int]:
    result = ArrayList()
    top = 0
    bottom = len(matrix) - 1
    left = 0
    right = len(matrix[0]) - 1
    while top <= bottom and left <= right:
        i = left
        while i <= right:
            result.add(matrix[top][i])
            i += 1
        top += 1
        i = top
        while i <= bottom:
            result.add(matrix[i][right])
            i += 1
        right -= 1
        if top <= bottom:
            i = right
            while i >= left:
                result.add(matrix[bottom][i])
                i -= 1
            bottom -= 1
        if left <= right:
            i = bottom
            while i >= top:
                result.add(matrix[i][left])
                i -= 1
            left += 1
    return result.to_list()
