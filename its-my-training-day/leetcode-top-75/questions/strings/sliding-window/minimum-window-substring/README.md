# Minimum Window Substring

## Directory
- Data structure: `strings`
- Technique: `sliding-window`

## Approach
Expand to satisfy all counts, then shrink to minimize.

## Data Structure Deep Dive
- Expand right to include data, shrink left to restore validity.
- Counts or last-seen indexes enable O(1) window checks.
- Each element enters and leaves the window once.

## Complexity
Time O(n) | Space O(k)

## Solution References
- Python: `solution.py` → `minimum_window_substring`
- C++: `solution.cpp` → `minimumWindowSubstring`
- TypeScript: `solution.ts` → `minimumWindowSubstring`
