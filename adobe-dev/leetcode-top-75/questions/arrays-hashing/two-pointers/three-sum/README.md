# 3Sum

## Directory
- Data structure: `arrays-hashing`
- Technique: `two-pointers`

## Approach
Sort then fix one index and use two pointers to find complements.

## Data Structure Deep Dive
- Pointers move monotonically to shrink the search space.
- Works best on sorted data or symmetric constraints.
- Avoids extra memory while keeping linear time.

## Complexity
Time O(n^2) | Space O(1) extra

## Solution References
- Python: `solution.py` → `three_sum`
- C++: `solution.cpp` → `threeSum`
- TypeScript: `solution.ts` → `threeSum`
