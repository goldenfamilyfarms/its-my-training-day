# Longest Increasing Subsequence

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-lis`

## Approach
Maintain minimal tail for each length using binary search.

## Data Structure Deep Dive
- Maintain minimal tail per length for O(n log n).
- Binary search places each value into the tightest slot.
- Tail array is not the sequence, only its envelope.

## Complexity
Time O(n log n) | Space O(n)

## Solution References
- Python: `solution.py` → `longest_increasing_subsequence`
- C++: `solution.cpp` → `longestIncreasingSubsequence`
- TypeScript: `solution.ts` → `longestIncreasingSubsequence`
