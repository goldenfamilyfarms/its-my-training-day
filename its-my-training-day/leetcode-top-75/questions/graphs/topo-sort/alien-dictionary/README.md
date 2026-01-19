# Alien Dictionary

## Directory
- Data structure: `graphs`
- Technique: `topo-sort`

## Approach
Build precedence edges from adjacent words then topo sort.

## Data Structure Deep Dive
- Track indegrees and peel nodes with zero dependencies.
- Detect cycles by counting visited nodes.
- Builds a valid ordering when constraints form a DAG.

## Complexity
Time O(V+E) | Space O(V+E)

## Solution References
- Python: `solution.py` → `alien_dictionary`
- C++: `solution.cpp` → `alienDictionary`
- TypeScript: `solution.ts` → `alienDictionary`
