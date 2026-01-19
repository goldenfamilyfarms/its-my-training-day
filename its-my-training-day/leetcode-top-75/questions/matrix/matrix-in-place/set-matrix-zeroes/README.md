# Set Matrix Zeroes

## Directory
- Data structure: `matrix`
- Technique: `matrix-in-place`

## Approach
Use first row/column as markers and track initial zeros.

## Data Structure Deep Dive
- Reuse matrix borders or sentinel rows/cols for markers.
- Avoids extra memory allocations.
- In-place transforms preserve O(1) space.

## Complexity
Time O(mn) | Space O(1)

## Solution References
- Python: `solution.py` → `set_matrix_zeroes`
- C++: `solution.cpp` → `setMatrixZeroes`
- TypeScript: `solution.ts` → `setMatrixZeroes`
