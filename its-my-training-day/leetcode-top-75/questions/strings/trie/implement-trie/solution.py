import os
import sys
from typing import List, Dict, Optional, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap

class TrieNode:
    def __init__(self):
        self.children = [None] * 26
        self.is_end = False
class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        i = 0
        while i < len(word):
            idx = ord(word[i]) - 97
            if node.children[idx] is None:
                node.children[idx] = TrieNode()
            node = node.children[idx]
            i += 1
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        i = 0
        while i < len(word):
            idx = ord(word[i]) - 97
            if node.children[idx] is None:
                return False
            node = node.children[idx]
            i += 1
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        i = 0
        while i < len(prefix):
            idx = ord(prefix[i]) - 97
            if node.children[idx] is None:
                return False
            node = node.children[idx]
            i += 1
        return True
