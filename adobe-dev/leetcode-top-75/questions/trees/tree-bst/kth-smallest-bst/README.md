# Kth Smallest Element in a BST

## Directory
- Data structure: `trees`
- Technique: `tree-bst`

## Approach
Inorder traversal counting nodes until k.

## Data Structure Deep Dive
- Inorder traversal yields sorted values.
- BST constraints prune search to one side.
- Range checks validate structure efficiently.

## Complexity
Time O(n) | Space O(h)

## Solution References
- Python: `solution.py` → `kth_smallest_bst`
- C++: `solution.cpp` → `kthSmallestBST`
- TypeScript: `solution.ts` → `kthSmallestBST`
