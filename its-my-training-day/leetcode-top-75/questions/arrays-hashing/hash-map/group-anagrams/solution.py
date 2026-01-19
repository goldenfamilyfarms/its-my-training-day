import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def group_anagrams(strs: List[str]) -> List[List[str]]:
    groups: Dict[Tuple[int, ...], ArrayList] = {}
    i = 0
    while i < len(strs):
        s = strs[i]
        count = [0] * 26
        j = 0
        while j < len(s):
            count[ord(s[j]) - 97] += 1
            j += 1
        key = tuple(count)
        if key not in groups:
            groups[key] = ArrayList()
        groups[key].add(s)
        i += 1
    result = ArrayList()
    for key in groups:
        result.add(groups[key].to_list())
    return result.to_list()
