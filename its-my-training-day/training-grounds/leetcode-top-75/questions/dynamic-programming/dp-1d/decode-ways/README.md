# Decode Ways

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-1d`

## Approach
DP on index with 1- and 2-digit transitions.

## Data Structure Deep Dive
- State depends on a small fixed window of prior states.
- Rolling variables replace full arrays for O(1) memory.
- Transitions are deterministic and local.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `decode_ways`
- C++: `solution.cpp` → `decodeWays`
- TypeScript: `solution.ts` → `decodeWays`
