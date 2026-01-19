# Combination Sum

## Directory
- Data structure: `dynamic-programming`
- Technique: `backtracking`

## Approach
DFS with pruning; allow reuse by staying at same index.

## Data Structure Deep Dive
- Explore choices depth-first with pruning on invalid state.
- Restore state after each recursive call.
- Useful for combinations, paths, and permutations.

## Complexity
Time O(2^n) | Space O(n)

## Solution References
- Python: `solution.py` → `combination_sum`
- C++: `solution.cpp` → `combinationSum`
- TypeScript: `solution.ts` → `combinationSum`
