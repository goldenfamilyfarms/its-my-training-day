import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def minimum_window_substring(s: str, t: str) -> str:
    if not t:
        return ""
    target: Dict[str, int] = {}
    i = 0
    while i < len(t):
        ch = t[i]
        target[ch] = target.get(ch, 0) + 1
        i += 1
    need = len(target)
    formed = 0
    window: Dict[str, int] = {}
    left = 0
    best_len = 1 << 30
    best = (0, 0)
    right = 0
    while right < len(s):
        ch = s[right]
        window[ch] = window.get(ch, 0) + 1
        if ch in target and window[ch] == target[ch]:
            formed += 1
        while left <= right and formed == need:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best = (left, right)
            left_ch = s[left]
            window[left_ch] -= 1
            if left_ch in target and window[left_ch] < target[left_ch]:
                formed -= 1
            left += 1
        right += 1
    if best_len == 1 << 30:
        return ""
    return s[best[0]:best[1] + 1]
