import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

class TrieNode {
  children: (TrieNode | null)[];
  isEnd: boolean;
  constructor() {
    this.children = new Array(26).fill(null);
    this.isEnd = false;
  }
}
export class Trie {
  private root: TrieNode;
  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const idx = word.charCodeAt(i) - 97;
      if (node.children[idx] === null) node.children[idx] = new TrieNode();
      node = node.children[idx] as TrieNode;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const idx = word.charCodeAt(i) - 97;
      if (node.children[idx] === null) return false;
      node = node.children[idx] as TrieNode;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (let i = 0; i < prefix.length; i += 1) {
      const idx = prefix.charCodeAt(i) - 97;
      if (node.children[idx] === null) return false;
      node = node.children[idx] as TrieNode;
    }
    return true;
  }
}
