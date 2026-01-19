# Merge Intervals

## Directory
- Data structure: `intervals`
- Technique: `intervals-merge`

## Approach
Sort by start and coalesce overlapping ranges.

## Data Structure Deep Dive
- Sort by start, then merge overlaps in one pass.
- Maintain a current interval window.
- Overlaps collapse into a single range.

## Complexity
Time O(n log n) | Space O(n)

## Solution References
- Python: `solution.py` → `merge_intervals`
- C++: `solution.cpp` → `mergeIntervals`
- TypeScript: `solution.ts` → `mergeIntervals`
