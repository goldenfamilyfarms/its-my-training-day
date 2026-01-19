# Longest Substring Without Repeating Characters

## Directory
- Data structure: `strings`
- Technique: `sliding-window`

## Approach
Track last seen index to move the left boundary quickly.

## Data Structure Deep Dive
- Expand right to include data, shrink left to restore validity.
- Counts or last-seen indexes enable O(1) window checks.
- Each element enters and leaves the window once.

## Complexity
Time O(n) | Space O(k)

## Solution References
- Python: `solution.py` → `longest_substring_without_repeating`
- C++: `solution.cpp` → `longestSubstringWithoutRepeating`
- TypeScript: `solution.ts` → `longestSubstringWithoutRepeating`
