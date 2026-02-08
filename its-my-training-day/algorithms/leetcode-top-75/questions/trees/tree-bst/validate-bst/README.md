# Validate Binary Search Tree

## Directory
- Data structure: `trees`
- Technique: `tree-bst`

## Approach
DFS with value bounds for each subtree.

## Data Structure Deep Dive
- Inorder traversal yields sorted values.
- BST constraints prune search to one side.
- Range checks validate structure efficiently.

## Complexity
Time O(n) | Space O(h)

## Solution References
- Python: `solution.py` → `validate_bst`
- C++: `solution.cpp` → `validateBST`
- TypeScript: `solution.ts` → `validateBST`
