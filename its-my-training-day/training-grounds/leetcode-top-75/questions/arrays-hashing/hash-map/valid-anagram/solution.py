import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def valid_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count: Dict[str, int] = {}
    i = 0
    while i < len(s):
        ch = s[i]
        count[ch] = count.get(ch, 0) + 1
        i += 1
    i = 0
    while i < len(t):
        ch = t[i]
        if ch not in count:
            return False
        count[ch] -= 1
        if count[ch] < 0:
            return False
        i += 1
    return True
