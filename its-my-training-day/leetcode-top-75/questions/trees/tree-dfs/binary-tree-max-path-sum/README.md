# Binary Tree Maximum Path Sum

## Directory
- Data structure: `trees`
- Technique: `tree-dfs`

## Approach
Postorder DFS returns max gain; update global best.

## Data Structure Deep Dive
- Recursive traversal collects or aggregates subtree data.
- Postorder is ideal for combine/return patterns.
- Null checks guard recursion base cases.

## Complexity
Time O(n) | Space O(h)

## Solution References
- Python: `solution.py` → `binary_tree_max_path_sum`
- C++: `solution.cpp` → `binaryTreeMaxPathSum`
- TypeScript: `solution.ts` → `binaryTreeMaxPathSum`
