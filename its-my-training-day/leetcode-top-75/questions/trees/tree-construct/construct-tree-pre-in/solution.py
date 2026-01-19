import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

def build_tree_pre_in(preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
    index_map = {}
    i = 0
    while i < len(inorder):
        index_map[inorder[i]] = i
        i += 1

    def helper(pre_left: int, pre_right: int, in_left: int, in_right: int) -> Optional[TreeNode]:
        if pre_left > pre_right:
            return None
        root_val = preorder[pre_left]
        root = TreeNode(root_val)
        mid = index_map[root_val]
        left_size = mid - in_left
        root.left = helper(pre_left + 1, pre_left + left_size, in_left, mid - 1)
        root.right = helper(pre_left + left_size + 1, pre_right, mid + 1, in_right)
        return root

    return helper(0, len(preorder) - 1, 0, len(inorder) - 1)
