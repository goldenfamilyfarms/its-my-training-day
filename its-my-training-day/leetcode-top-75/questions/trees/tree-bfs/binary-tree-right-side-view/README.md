# Binary Tree Right Side View

## Directory
- Data structure: `trees`
- Technique: `tree-bfs`

## Approach
BFS by level and record the last node at each depth.

## Data Structure Deep Dive
- Queue keeps nodes per level for ordered traversal.
- Level-size loops isolate each depth.
- Useful for views, layer summaries, or serialization.

## Complexity
Time O(n) | Space O(w)

## Solution References
- Python: `solution.py` → `binary_tree_right_side_view`
- C++: `solution.cpp` → `binaryTreeRightSideView`
- TypeScript: `solution.ts` → `binaryTreeRightSideView`
