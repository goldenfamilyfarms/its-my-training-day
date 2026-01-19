import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def word_break(s: str, word_dict: List[str]) -> bool:
    word_set = {}
    i = 0
    while i < len(word_dict):
        word_set[word_dict[i]] = True
        i += 1
    dp = [False] * (len(s) + 1)
    dp[0] = True
    i = 1
    while i <= len(s):
        j = 0
        while j < i:
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
            j += 1
        i += 1
    return dp[len(s)]
