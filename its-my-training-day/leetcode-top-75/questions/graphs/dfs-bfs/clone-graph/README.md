# Clone Graph

## Directory
- Data structure: `graphs`
- Technique: `dfs-bfs`

## Approach
DFS with hashmap to clone nodes and neighbors.

## Data Structure Deep Dive
- DFS explores depth; BFS explores breadth/levels.
- Visited tracking prevents cycles and repeats.
- Use DFS for connectivity and BFS for shortest layers.

## Complexity
Time O(V+E) | Space O(V)

## Solution References
- Python: `solution.py` → `clone_graph`
- C++: `solution.cpp` → `cloneGraph`
- TypeScript: `solution.ts` → `cloneGraph`
