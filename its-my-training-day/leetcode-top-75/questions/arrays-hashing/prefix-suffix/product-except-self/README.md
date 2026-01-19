# Product of Array Except Self

## Directory
- Data structure: `arrays-hashing`
- Technique: `prefix-suffix`

## Approach
Build prefix products, then multiply by suffix products in reverse.

## Data Structure Deep Dive
- Prefix accumulates left side state; suffix handles right side.
- Avoids nested loops by reusing partial results.
- Builds outputs in two linear sweeps.

## Complexity
Time O(n) | Space O(1) extra

## Solution References
- Python: `solution.py` → `product_except_self`
- C++: `solution.cpp` → `productExceptSelf`
- TypeScript: `solution.ts` → `productExceptSelf`
