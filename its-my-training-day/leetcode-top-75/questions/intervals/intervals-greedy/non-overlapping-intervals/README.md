# Non-overlapping Intervals

## Directory
- Data structure: `intervals`
- Technique: `intervals-greedy`

## Approach
Sort by start and greedily keep the smallest end on overlap.

## Data Structure Deep Dive
- Sort by end to minimize removals or conflicts.
- Pick the earliest finishing intervals first.
- Conflicts are detected by comparing boundaries.

## Complexity
Time O(n log n) | Space O(1)

## Solution References
- Python: `solution.py` → `non_overlapping_intervals`
- C++: `solution.cpp` → `nonOverlappingIntervals`
- TypeScript: `solution.ts` → `nonOverlappingIntervals`
