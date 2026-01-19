# Find Median from Data Stream

## Directory
- Data structure: `heap`
- Technique: `heap`

## Approach
Maintain max-heap for lower half and min-heap for upper half.

## Data Structure Deep Dive
- Heaps keep min/max at the root with O(log n) updates.
- Use size to measure concurrent usage or top-k.
- Two heaps track lower/upper halves for medians.

## Complexity
Time O(log n) | Space O(n)

## Solution References
- Python: `solution.py` → `MedianFinder`
- C++: `solution.cpp` → `MedianFinder`
- TypeScript: `solution.ts` → `MedianFinder`
