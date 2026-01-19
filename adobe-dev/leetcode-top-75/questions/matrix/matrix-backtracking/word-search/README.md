# Word Search

## Directory
- Data structure: `matrix`
- Technique: `matrix-backtracking`

## Approach
DFS with visited marking for each start cell.

## Data Structure Deep Dive
- DFS explores 4-neighbor paths with visited marking.
- Backtracking restores the cell after exploration.
- Prune early on character mismatch.

## Complexity
Time O(mn*4^k) | Space O(k)

## Solution References
- Python: `solution.py` → `word_search`
- C++: `solution.cpp` → `wordSearch`
- TypeScript: `solution.ts` → `wordSearch`
