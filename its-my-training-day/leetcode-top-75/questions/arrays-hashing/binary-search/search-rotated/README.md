# Search in Rotated Sorted Array

## Directory
- Data structure: `arrays-hashing`
- Technique: `binary-search`

## Approach
Binary search while determining which side is sorted.

## Data Structure Deep Dive
- Exploit monotonic property to halve the search space.
- Update bounds based on which side preserves invariants.
- Guarantees O(log n) time on sorted or rotated arrays.

## Complexity
Time O(log n) | Space O(1)

## Solution References
- Python: `solution.py` → `search_rotated`
- C++: `solution.cpp` → `searchRotated`
- TypeScript: `solution.ts` → `searchRotated`
