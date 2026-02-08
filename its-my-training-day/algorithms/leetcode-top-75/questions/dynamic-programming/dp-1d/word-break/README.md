# Word Break

## Directory
- Data structure: `dynamic-programming`
- Technique: `dp-1d`

## Approach
DP over prefixes; dp[i] true if some dp[j] and s[j:i] in dict.

## Data Structure Deep Dive
- State depends on a small fixed window of prior states.
- Rolling variables replace full arrays for O(1) memory.
- Transitions are deterministic and local.

## Complexity
Time O(n^2) | Space O(n)

## Solution References
- Python: `solution.py` → `word_break`
- C++: `solution.cpp` → `wordBreak`
- TypeScript: `solution.ts` → `wordBreak`
