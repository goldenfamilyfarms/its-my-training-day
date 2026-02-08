# Find Minimum in Rotated Sorted Array

## Directory
- Data structure: `arrays-hashing`
- Technique: `binary-search`

## Approach
Binary search the rotation point using the right boundary.

## Data Structure Deep Dive
- Exploit monotonic property to halve the search space.
- Update bounds based on which side preserves invariants.
- Guarantees O(log n) time on sorted or rotated arrays.

## Complexity
Time O(log n) | Space O(1)

## Solution References
- Python: `solution.py` → `find_min_rotated`
- C++: `solution.cpp` → `findMinRotated`
- TypeScript: `solution.ts` → `findMinRotated`
