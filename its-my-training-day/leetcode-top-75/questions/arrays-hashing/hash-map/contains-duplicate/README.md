# Contains Duplicate

## Directory
- Data structure: `arrays-hashing`
- Technique: `hash-map`

## Approach
Insert elements into a set; if already present, a duplicate exists.

## Data Structure Deep Dive
- Use O(1) average lookups to trade space for speed.
- Collision handling keeps operations near-constant in practice.
- Great for complements, counts, and membership checks.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `contains_duplicate`
- C++: `solution.cpp` → `containsDuplicate`
- TypeScript: `solution.ts` → `containsDuplicate`
