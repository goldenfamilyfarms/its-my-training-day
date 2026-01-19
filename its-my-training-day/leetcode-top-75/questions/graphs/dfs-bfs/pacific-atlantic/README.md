# Pacific Atlantic Water Flow

## Directory
- Data structure: `graphs`
- Technique: `dfs-bfs`

## Approach
Reverse-flow DFS from borders into higher/equal cells.

## Data Structure Deep Dive
- DFS explores depth; BFS explores breadth/levels.
- Visited tracking prevents cycles and repeats.
- Use DFS for connectivity and BFS for shortest layers.

## Complexity
Time O(mn) | Space O(mn)

## Solution References
- Python: `solution.py` → `pacific_atlantic`
- C++: `solution.cpp` → `pacificAtlantic`
- TypeScript: `solution.ts` → `pacificAtlantic`
