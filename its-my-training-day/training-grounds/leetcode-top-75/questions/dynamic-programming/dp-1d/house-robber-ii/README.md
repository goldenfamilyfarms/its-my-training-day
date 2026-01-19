# House Robber II

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-1d`

## Approach
Run House Robber twice, excluding first or last house.

## Data Structure Deep Dive
- State depends on a small fixed window of prior states.
- Rolling variables replace full arrays for O(1) memory.
- Transitions are deterministic and local.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `house_robber_ii`
- C++: `solution.cpp` → `houseRobberII`
- TypeScript: `solution.ts` → `houseRobberII`
