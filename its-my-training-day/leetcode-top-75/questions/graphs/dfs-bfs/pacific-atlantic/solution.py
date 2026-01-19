import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def pacific_atlantic(heights: List[List[int]]) -> List[List[int]]:
    if not heights or not heights[0]:
        return []
    rows = len(heights)
    cols = len(heights[0])
    pac = [[False] * cols for _ in range(rows)]
    atl = [[False] * cols for _ in range(rows)]

    def dfs(r: int, c: int, visited: List[List[bool]]):
        visited[r][c] = True
        dr = [1, -1, 0, 0]
        dc = [0, 0, 1, -1]
        i = 0
        while i < 4:
            nr = r + dr[i]
            nc = c + dc[i]
            if 0 <= nr < rows and 0 <= nc < cols:
                if not visited[nr][nc] and heights[nr][nc] >= heights[r][c]:
                    dfs(nr, nc, visited)
            i += 1

    r = 0
    while r < rows:
        dfs(r, 0, pac)
        dfs(r, cols - 1, atl)
        r += 1
    c = 0
    while c < cols:
        dfs(0, c, pac)
        dfs(rows - 1, c, atl)
        c += 1

    result = ArrayList()
    r = 0
    while r < rows:
        c = 0
        while c < cols:
            if pac[r][c] and atl[r][c]:
                result.add([r, c])
            c += 1
        r += 1
    return result.to_list()
