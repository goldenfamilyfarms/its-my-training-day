# Jump Game

## Directory
- Data structure: `dynamic-programming`
- Technique: `greedy`

## Approach
Track the farthest reachable index while scanning.

## Data Structure Deep Dive
- Track the best choice so far and never revisit earlier states.
- Correctness depends on a proven locally optimal rule.
- Greedy often reduces to a single pass with constant memory.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `jump_game`
- C++: `solution.cpp` → `jumpGame`
- TypeScript: `solution.ts` → `jumpGame`
