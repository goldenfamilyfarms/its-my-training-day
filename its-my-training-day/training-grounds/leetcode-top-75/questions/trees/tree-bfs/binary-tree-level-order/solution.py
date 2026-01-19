import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def binary_tree_level_order(root: Optional[TreeNode]) -> List[List[int]]:
    if root is None:
        return []
    result = ArrayList()
    queue = Queue()
    queue.enqueue(root)
    while not queue.is_empty():
        level_size = 0
        temp_queue = Queue()
        while not queue.is_empty():
            temp_queue.enqueue(queue.dequeue())
            level_size += 1
        level = [0] * level_size
        i = 0
        while not temp_queue.is_empty():
            node = temp_queue.dequeue()
            level[i] = node.val
            if node.left:
                queue.enqueue(node.left)
            if node.right:
                queue.enqueue(node.right)
            i += 1
        result.add(level)
    return result.to_list()
