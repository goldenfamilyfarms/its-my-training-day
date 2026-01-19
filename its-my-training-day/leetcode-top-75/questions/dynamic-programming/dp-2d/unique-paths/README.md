# Unique Paths

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-2d`

## Approach
DP on grid with dp[r][c] = top + left.

## Data Structure Deep Dive
- Two-dimensional states capture both sequences or grid axes.
- Each cell depends on adjacent subproblems.
- Often compressible to a single row with care.

## Complexity
Time O(mn) | Space O(n)

## Solution References
- Python: `solution.py` → `unique_paths`
- C++: `solution.cpp` → `uniquePaths`
- TypeScript: `solution.ts` → `uniquePaths`
