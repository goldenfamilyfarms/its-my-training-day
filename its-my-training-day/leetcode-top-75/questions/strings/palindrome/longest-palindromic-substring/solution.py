import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def longest_palindromic_substring(s: str) -> str:
    if not s:
        return ""
    start = 0
    end = 0

    def expand(l: int, r: int) -> None:
        nonlocal start, end
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        l += 1
        r -= 1
        if r - l > end - start:
            start = l
            end = r

    i = 0
    while i < len(s):
        expand(i, i)
        expand(i, i + 1)
        i += 1
    return s[start:end + 1]
