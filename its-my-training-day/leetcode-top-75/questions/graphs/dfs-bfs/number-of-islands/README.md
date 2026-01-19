# Number of Islands

## Directory
- Data structure: `graphs`
- Technique: `dfs-bfs`

## Approach
DFS flood-fill each land cell to mark visited.

## Data Structure Deep Dive
- DFS explores depth; BFS explores breadth/levels.
- Visited tracking prevents cycles and repeats.
- Use DFS for connectivity and BFS for shortest layers.

## Complexity
Time O(mn) | Space O(mn)

## Solution References
- Python: `solution.py` → `number_of_islands`
- C++: `solution.cpp` → `numberOfIslands`
- TypeScript: `solution.ts` → `numberOfIslands`
