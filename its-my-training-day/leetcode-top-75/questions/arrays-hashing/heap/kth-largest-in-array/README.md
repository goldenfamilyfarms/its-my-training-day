# Kth Largest Element in an Array

## Directory
- Data structure: `arrays-hashing`
- Technique: `heap`

## Approach
Keep a min-heap of size k; root is the kth largest.

## Data Structure Deep Dive
- Heaps keep min/max at the root with O(log n) updates.
- Use size to measure concurrent usage or top-k.
- Two heaps track lower/upper halves for medians.

## Complexity
Time O(n log k) | Space O(k)

## Solution References
- Python: `solution.py` → `kth_largest_in_array`
- C++: `solution.cpp` → `kthLargestInArray`
- TypeScript: `solution.ts` → `kthLargestInArray`
