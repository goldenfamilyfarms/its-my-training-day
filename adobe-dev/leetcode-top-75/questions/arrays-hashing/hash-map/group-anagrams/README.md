# Group Anagrams

## Directory
- Data structure: `arrays-hashing`
- Technique: `hash-map`

## Approach
Use character count signature as a grouping key.

## Data Structure Deep Dive
- Use O(1) average lookups to trade space for speed.
- Collision handling keeps operations near-constant in practice.
- Great for complements, counts, and membership checks.

## Complexity
Time O(nk) | Space O(nk)

## Solution References
- Python: `solution.py` → `group_anagrams`
- C++: `solution.cpp` → `groupAnagrams`
- TypeScript: `solution.ts` → `groupAnagrams`
