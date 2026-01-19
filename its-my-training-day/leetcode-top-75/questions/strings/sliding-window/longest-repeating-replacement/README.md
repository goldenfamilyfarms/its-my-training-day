# Longest Repeating Character Replacement

## Directory
- Data structure: `strings`
- Technique: `sliding-window`

## Approach
Track max frequency in window and shrink when replacements exceed k.

## Data Structure Deep Dive
- Expand right to include data, shrink left to restore validity.
- Counts or last-seen indexes enable O(1) window checks.
- Each element enters and leaves the window once.

## Complexity
Time O(n) | Space O(k)

## Solution References
- Python: `solution.py` → `longest_repeating_character_replacement`
- C++: `solution.cpp` → `longestRepeatingCharacterReplacement`
- TypeScript: `solution.ts` → `longestRepeatingCharacterReplacement`
