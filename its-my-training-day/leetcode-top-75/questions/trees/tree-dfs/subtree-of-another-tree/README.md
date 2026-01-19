# Subtree of Another Tree

## Directory
- Data structure: `trees`
- Technique: `tree-dfs`

## Approach
DFS each node and compare subtree equality.

## Data Structure Deep Dive
- Recursive traversal collects or aggregates subtree data.
- Postorder is ideal for combine/return patterns.
- Null checks guard recursion base cases.

## Complexity
Time O(n*m) | Space O(h)

## Solution References
- Python: `solution.py` → `subtree_of_another_tree`
- C++: `solution.cpp` → `subtreeOfAnotherTree`
- TypeScript: `solution.ts` → `subtreeOfAnotherTree`
