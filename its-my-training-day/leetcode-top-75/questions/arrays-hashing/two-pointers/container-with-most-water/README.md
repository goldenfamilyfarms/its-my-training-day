# Container With Most Water

## Directory
- Data structure: `arrays-hashing`
- Technique: `two-pointers`

## Approach
Move the shorter boundary inward while tracking max area.

## Data Structure Deep Dive
- Pointers move monotonically to shrink the search space.
- Works best on sorted data or symmetric constraints.
- Avoids extra memory while keeping linear time.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `container_with_most_water`
- C++: `solution.cpp` → `containerWithMostWater`
- TypeScript: `solution.ts` → `containerWithMostWater`
