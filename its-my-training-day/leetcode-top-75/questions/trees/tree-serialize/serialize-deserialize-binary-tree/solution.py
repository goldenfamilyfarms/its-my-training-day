import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def serialize_binary_tree(root: Optional[TreeNode]) -> str:
    if root is None:
        return ""
    result = ArrayList()
    queue = Queue()
    queue.enqueue(root)
    while not queue.is_empty():
        node = queue.dequeue()
        if node is None:
            result.add("#")
        else:
            result.add(str(node.val))
            queue.enqueue(node.left)
            queue.enqueue(node.right)
    return ",".join(result.to_list())
def deserialize_binary_tree(data: str) -> Optional[TreeNode]:
    if not data:
        return None
    values = data.split(",")
    root_val = values[0]
    if root_val == "#":
        return None
    root = TreeNode(int(root_val))
    queue = Queue()
    queue.enqueue(root)
    i = 1
    while i < len(values):
        node = queue.dequeue()
        left_val = values[i]
        i += 1
        if left_val != "#":
            node.left = TreeNode(int(left_val))
            queue.enqueue(node.left)
        right_val = values[i] if i < len(values) else "#"
        i += 1
        if right_val != "#":
            node.right = TreeNode(int(right_val))
            queue.enqueue(node.right)
    return root
