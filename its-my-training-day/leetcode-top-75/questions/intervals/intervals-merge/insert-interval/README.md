# Insert Interval

## Directory
- Data structure: `intervals`
- Technique: `intervals-merge`

## Approach
Append non-overlapping, merge overlaps, then add the rest.

## Data Structure Deep Dive
- Sort by start, then merge overlaps in one pass.
- Maintain a current interval window.
- Overlaps collapse into a single range.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `insert_interval`
- C++: `solution.cpp` → `insertInterval`
- TypeScript: `solution.ts` → `insertInterval`
