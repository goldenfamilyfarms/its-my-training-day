# Number of Connected Components in an Undirected Graph

## Directory
- Data structure: `graphs`
- Technique: `union-find`

## Approach
Union edges and count distinct parents.

## Data Structure Deep Dive
- Union merges sets; find locates the representative.
- Path compression keeps operations nearly constant.
- Great for connectivity and cycle detection.

## Complexity
Time O(E α(n)) | Space O(n)

## Solution References
- Python: `solution.py` → `number_of_connected_components`
- C++: `solution.cpp` → `numberOfConnectedComponents`
- TypeScript: `solution.ts` → `numberOfConnectedComponents`
