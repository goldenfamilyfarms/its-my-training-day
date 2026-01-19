# Maximum Depth of Binary Tree

## Directory
- Data structure: `trees`
- Technique: `tree-dfs`

## Approach
Depth-first recursion returns max of left/right depths.

## Data Structure Deep Dive
- Recursive traversal collects or aggregates subtree data.
- Postorder is ideal for combine/return patterns.
- Null checks guard recursion base cases.

## Complexity
Time O(n) | Space O(h)

## Solution References
- Python: `solution.py` → `max_depth_binary_tree`
- C++: `solution.cpp` → `maxDepthBinaryTree`
- TypeScript: `solution.ts` → `maxDepthBinaryTree`
