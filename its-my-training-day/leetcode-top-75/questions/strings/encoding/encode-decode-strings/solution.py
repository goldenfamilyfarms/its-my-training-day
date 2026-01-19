import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def encode_strings(strs: List[str]) -> str:
    parts = ArrayList()
    i = 0
    while i < len(strs):
        s = strs[i]
        parts.add(str(len(s)))
        parts.add("#")
        parts.add(s)
        i += 1
    return "".join(parts.to_list())
def decode_strings(s: str) -> List[str]:
    result = ArrayList()
    i = 0
    while i < len(s):
        j = i
        while s[j] != "#":
            j += 1
        length = int(s[i:j])
        start = j + 1
        result.add(s[start:start + length])
        i = start + length
    return result.to_list()
