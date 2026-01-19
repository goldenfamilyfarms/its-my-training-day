import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def subtree_of_another_tree(root: Optional[TreeNode], sub_root: Optional[TreeNode]) -> bool:
    def is_same(a: Optional[TreeNode], b: Optional[TreeNode]) -> bool:
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        if a.val != b.val:
            return False
        return is_same(a.left, b.left) and is_same(a.right, b.right)

    if root is None:
        return sub_root is None
    if is_same(root, sub_root):
        return True
    return subtree_of_another_tree(root.left, sub_root) or subtree_of_another_tree(root.right, sub_root)
