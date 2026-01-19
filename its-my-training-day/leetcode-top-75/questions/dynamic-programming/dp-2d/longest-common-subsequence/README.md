# Longest Common Subsequence

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-2d`

## Approach
DP grid comparing prefixes of both strings.

## Data Structure Deep Dive
- Two-dimensional states capture both sequences or grid axes.
- Each cell depends on adjacent subproblems.
- Often compressible to a single row with care.

## Complexity
Time O(n*m) | Space O(n*m)

## Solution References
- Python: `solution.py` → `longest_common_subsequence`
- C++: `solution.cpp` → `longestCommonSubsequence`
- TypeScript: `solution.ts` → `longestCommonSubsequence`
