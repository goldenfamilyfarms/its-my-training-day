# Longest Consecutive Sequence

## Directory
- Data structure: `arrays-hashing`
- Technique: `hash-map`

## Approach
Start sequences at numbers with no predecessor and extend forward.

## Data Structure Deep Dive
- Use O(1) average lookups to trade space for speed.
- Collision handling keeps operations near-constant in practice.
- Great for complements, counts, and membership checks.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `longest_consecutive`
- C++: `solution.cpp` → `longestConsecutive`
- TypeScript: `solution.ts` → `longestConsecutive`
