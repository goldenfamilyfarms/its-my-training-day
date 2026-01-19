# Reorder List

## Directory
- Data structure: `linked-list`
- Technique: `linked-list`

## Approach
Find middle, reverse second half, then weave lists.

## Data Structure Deep Dive
- Pointer updates are O(1) once nodes are located.
- Dummy nodes simplify head edge cases.
- Fast/slow pointers avoid extra passes.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `reorder_list`
- C++: `solution.cpp` → `reorderList`
- TypeScript: `solution.ts` → `reorderList`
