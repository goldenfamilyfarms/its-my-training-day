# Graph Valid Tree

## Directory
- Data structure: `graphs`
- Technique: `union-find`

## Approach
Tree requires n-1 edges and no cycles in union-find.

## Data Structure Deep Dive
- Union merges sets; find locates the representative.
- Path compression keeps operations nearly constant.
- Great for connectivity and cycle detection.

## Complexity
Time O(E α(n)) | Space O(n)

## Solution References
- Python: `solution.py` → `graph_valid_tree`
- C++: `solution.cpp` → `graphValidTree`
- TypeScript: `solution.ts` → `graphValidTree`
