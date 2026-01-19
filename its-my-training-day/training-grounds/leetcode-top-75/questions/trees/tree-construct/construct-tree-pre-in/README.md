# Construct Binary Tree from Preorder and Inorder

## Directory
- Data structure: `trees`
- Technique: `tree-construct`

## Approach
Use preorder root and inorder split with index map.

## Data Structure Deep Dive
- Preorder gives root; inorder splits left/right.
- Index map avoids repeated linear scans.
- Subarray boundaries define subtree recursion.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `build_tree_pre_in`
- C++: `solution.cpp` → `buildTreePreIn`
- TypeScript: `solution.ts` → `buildTreePreIn`
