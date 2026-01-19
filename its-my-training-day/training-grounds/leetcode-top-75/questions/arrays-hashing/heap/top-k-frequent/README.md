# Top K Frequent Elements

## Directory
- Data structure: `arrays-hashing`
- Technique: `heap`

## Approach
Count frequencies then maintain a size-k min-heap.

## Data Structure Deep Dive
- Heaps keep min/max at the root with O(log n) updates.
- Use size to measure concurrent usage or top-k.
- Two heaps track lower/upper halves for medians.

## Complexity
Time O(n log k) | Space O(n)

## Solution References
- Python: `solution.py` → `top_k_frequent`
- C++: `solution.cpp` → `topKFrequent`
- TypeScript: `solution.ts` → `topKFrequent`
