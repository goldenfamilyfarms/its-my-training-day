import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def merge_k_sorted_lists(lists: List[Optional[ListNode]]) -> Optional[ListNode]:
    heap = MinHeap()
    i = 0
    while i < len(lists):
        if lists[i]:
            heap.push((lists[i].val, i, lists[i]))
        i += 1
    dummy = ListNode(0)
    current = dummy
    while heap.size() > 0:
        val, idx, node = heap.pop()
        current.next = node
        current = current.next
        if node.next:
            heap.push((node.next.val, idx, node.next))
    return dummy.next
