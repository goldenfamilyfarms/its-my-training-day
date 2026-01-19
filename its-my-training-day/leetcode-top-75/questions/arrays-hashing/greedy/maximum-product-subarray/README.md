# Maximum Product Subarray

## Directory
- Data structure: `arrays-hashing`
- Technique: `greedy`

## Approach
Track current max/min products to handle sign flips.

## Data Structure Deep Dive
- Track the best choice so far and never revisit earlier states.
- Correctness depends on a proven locally optimal rule.
- Greedy often reduces to a single pass with constant memory.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `maximum_product_subarray`
- C++: `solution.cpp` → `maximumProductSubarray`
- TypeScript: `solution.ts` → `maximumProductSubarray`
