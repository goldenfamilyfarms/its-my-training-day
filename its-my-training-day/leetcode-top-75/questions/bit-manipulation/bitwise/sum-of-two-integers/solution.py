import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def sum_of_two_integers(a: int, b: int) -> int:
    mask = 0xFFFFFFFF
    while b != 0:
        carry = (a & b) & mask
        a = (a ^ b) & mask
        b = (carry << 1) & mask
    if a & (1 << 31):
        return ~(a ^ mask)
    return a
