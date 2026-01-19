import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

class MedianFinder:
    def __init__(self):
        self.low = MaxHeap()
        self.high = MinHeap()

    def add_num(self, num: int) -> None:
        if self.low.size() == 0 or num <= self.low.peek():
            self.low.push(num)
        else:
            self.high.push(num)
        if self.low.size() > self.high.size() + 1:
            self.high.push(self.low.pop())
        elif self.high.size() > self.low.size():
            self.low.push(self.high.pop())

    def find_median(self) -> float:
        if self.low.size() > self.high.size():
            return float(self.low.peek())
        return (self.low.peek() + self.high.peek()) / 2.0
