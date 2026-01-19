# Two Sum

## Directory
- Data structure: `arrays-hashing`
- Technique: `hash-map`

## Approach
Scan once while storing seen values; check complement before inserting.

## Data Structure Deep Dive
- Use O(1) average lookups to trade space for speed.
- Collision handling keeps operations near-constant in practice.
- Great for complements, counts, and membership checks.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `two_sum`
- C++: `solution.cpp` → `twoSum`
- TypeScript: `solution.ts` → `twoSum`
