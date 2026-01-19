import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def jump_game(nums: List[int]) -> bool:
    reach = 0
    i = 0
    while i < len(nums):
        if i > reach:
            return False
        if i + nums[i] > reach:
            reach = i + nums[i]
        i += 1
    return True
