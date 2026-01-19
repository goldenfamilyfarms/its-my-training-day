import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def valid_parentheses(s: str) -> bool:
    stack = Stack()
    pairs = {")": "(", "]": "[", "}": "{"}
    i = 0
    while i < len(s):
        ch = s[i]
        if ch in pairs:
            top = stack.pop()
            if top is None or top != pairs[ch]:
                return False
        else:
            stack.push(ch)
        i += 1
    return stack.is_empty()
