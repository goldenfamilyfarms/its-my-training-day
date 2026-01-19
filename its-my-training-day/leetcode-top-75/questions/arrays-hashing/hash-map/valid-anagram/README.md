# Valid Anagram

## Directory
- Data structure: `arrays-hashing`
- Technique: `hash-map`

## Approach
Count characters and validate all counts return to zero.

## Data Structure Deep Dive
- Use O(1) average lookups to trade space for speed.
- Collision handling keeps operations near-constant in practice.
- Great for complements, counts, and membership checks.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `valid_anagram`
- C++: `solution.cpp` → `validAnagram`
- TypeScript: `solution.ts` → `validAnagram`
