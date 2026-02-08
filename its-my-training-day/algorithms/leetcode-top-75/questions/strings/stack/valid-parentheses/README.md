# Valid Parentheses

## Directory
- Data structure: `strings`
- Technique: `stack`

## Approach
Push openings and pop on closing bracket mismatches.

## Data Structure Deep Dive
- LIFO ordering matches nested structure parsing.
- Push on open, pop on close or resolution.
- Stack state encodes the current frontier.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `valid_parentheses`
- C++: `solution.cpp` → `validParentheses`
- TypeScript: `solution.ts` → `validParentheses`
