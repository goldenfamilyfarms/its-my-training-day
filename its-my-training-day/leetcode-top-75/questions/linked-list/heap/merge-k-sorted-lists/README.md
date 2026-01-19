# Merge K Sorted Lists

## Directory
- Data structure: `linked-list`
- Technique: `heap`

## Approach
Push list heads into a min-heap and pop in order.

## Data Structure Deep Dive
- Heaps keep min/max at the root with O(log n) updates.
- Use size to measure concurrent usage or top-k.
- Two heaps track lower/upper halves for medians.

## Complexity
Time O(n log k) | Space O(k)

## Solution References
- Python: `solution.py` → `merge_k_sorted_lists`
- C++: `solution.cpp` → `mergeKSortedLists`
- TypeScript: `solution.ts` → `mergeKSortedLists`
