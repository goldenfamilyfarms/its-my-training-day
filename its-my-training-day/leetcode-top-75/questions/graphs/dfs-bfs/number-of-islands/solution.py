import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def number_of_islands(grid: List[List[str]]) -> int:
    if not grid:
        return 0
    rows = len(grid)
    cols = len(grid[0])
    count = 0

    def dfs(r: int, c: int):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    r = 0
    while r < rows:
        c = 0
        while c < cols:
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
            c += 1
        r += 1
    return count
