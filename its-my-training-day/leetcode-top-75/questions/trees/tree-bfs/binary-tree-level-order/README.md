# Binary Tree Level Order Traversal

## Directory
- Data structure: `trees`
- Technique: `tree-bfs`

## Approach
BFS with level-size loops to build layers.

## Data Structure Deep Dive
- Queue keeps nodes per level for ordered traversal.
- Level-size loops isolate each depth.
- Useful for views, layer summaries, or serialization.

## Complexity
Time O(n) | Space O(w)

## Solution References
- Python: `solution.py` → `binary_tree_level_order`
- C++: `solution.cpp` → `binaryTreeLevelOrder`
- TypeScript: `solution.ts` → `binaryTreeLevelOrder`
