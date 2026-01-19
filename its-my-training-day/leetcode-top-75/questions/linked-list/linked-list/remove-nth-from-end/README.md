# Remove Nth Node From End

## Directory
- Data structure: `linked-list`
- Technique: `linked-list`

## Approach
Two pointers with a gap of n+1 and a dummy head.

## Data Structure Deep Dive
- Pointer updates are O(1) once nodes are located.
- Dummy nodes simplify head edge cases.
- Fast/slow pointers avoid extra passes.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `remove_nth_from_end`
- C++: `solution.cpp` → `removeNthFromEnd`
- TypeScript: `solution.ts` → `removeNthFromEnd`
