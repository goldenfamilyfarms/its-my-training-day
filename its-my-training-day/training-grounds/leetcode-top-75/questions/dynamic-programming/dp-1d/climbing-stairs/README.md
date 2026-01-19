# Climbing Stairs

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-1d`

## Approach
Fibonacci-style recurrence with rolling variables.

## Data Structure Deep Dive
- State depends on a small fixed window of prior states.
- Rolling variables replace full arrays for O(1) memory.
- Transitions are deterministic and local.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `climbing_stairs`
- C++: `solution.cpp` → `climbingStairs`
- TypeScript: `solution.ts` → `climbingStairs`
