import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def set_matrix_zeroes(matrix: List[List[int]]) -> None:
    rows = len(matrix)
    cols = len(matrix[0])
    row_zero = False
    col_zero = False
    r = 0
    while r < rows:
        if matrix[r][0] == 0:
            col_zero = True
        r += 1
    c = 0
    while c < cols:
        if matrix[0][c] == 0:
            row_zero = True
        c += 1
    r = 1
    while r < rows:
        c = 1
        while c < cols:
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0
            c += 1
        r += 1
    r = 1
    while r < rows:
        if matrix[r][0] == 0:
            c = 1
            while c < cols:
                matrix[r][c] = 0
                c += 1
        r += 1
    c = 1
    while c < cols:
        if matrix[0][c] == 0:
            r = 1
            while r < rows:
                matrix[r][c] = 0
                r += 1
        c += 1
    if row_zero:
        c = 0
        while c < cols:
            matrix[0][c] = 0
            c += 1
    if col_zero:
        r = 0
        while r < rows:
            matrix[r][0] = 0
            r += 1
