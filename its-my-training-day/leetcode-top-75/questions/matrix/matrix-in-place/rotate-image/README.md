# Rotate Image

## Directory
- Data structure: `matrix`
- Technique: `matrix-in-place`

## Approach
Rotate layer by layer swapping four cells at a time.

## Data Structure Deep Dive
- Reuse matrix borders or sentinel rows/cols for markers.
- Avoids extra memory allocations.
- In-place transforms preserve O(1) space.

## Complexity
Time O(n^2) | Space O(1)

## Solution References
- Python: `solution.py` → `rotate_image`
- C++: `solution.cpp` → `rotateImage`
- TypeScript: `solution.ts` → `rotateImage`
