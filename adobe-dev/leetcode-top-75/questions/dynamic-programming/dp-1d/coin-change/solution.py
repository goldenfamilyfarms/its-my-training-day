import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def coin_change(coins: List[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    i = 1
    while i <= amount:
        j = 0
        while j < len(coins):
            coin = coins[j]
            if coin <= i:
                cand = dp[i - coin] + 1
                if cand < dp[i]:
                    dp[i] = cand
            j += 1
        i += 1
    return -1 if dp[amount] == amount + 1 else dp[amount]
