# Lowest Common Ancestor of BST

## Directory
- Data structure: `trees`
- Technique: `tree-bst`

## Approach
Use BST ordering to walk down to the split point.

## Data Structure Deep Dive
- Inorder traversal yields sorted values.
- BST constraints prune search to one side.
- Range checks validate structure efficiently.

## Complexity
Time O(h) | Space O(1)

## Solution References
- Python: `solution.py` → `lca_bst`
- C++: `solution.cpp` → `lcaBST`
- TypeScript: `solution.ts` → `lcaBST`
