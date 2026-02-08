# Coin Change

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-1d`

## Approach
Bottom-up DP: dp[i] is min coins to make amount i.

## Data Structure Deep Dive
- State depends on a small fixed window of prior states.
- Rolling variables replace full arrays for O(1) memory.
- Transitions are deterministic and local.

## Complexity
Time O(n * c) | Space O(n)

## Solution References
- Python: `solution.py` → `coin_change`
- C++: `solution.cpp` → `coinChange`
- TypeScript: `solution.ts` → `coinChange`
