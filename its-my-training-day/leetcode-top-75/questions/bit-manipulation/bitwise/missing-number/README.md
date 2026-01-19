# Missing Number

## Directory
- Data structure: `bit-manipulation`
- Technique: `bitwise`

## Approach
XOR all indices and values; pairs cancel out.

## Data Structure Deep Dive
- Bitwise ops compress logic into O(1) space.
- XOR cancels identical values; AND clears lowest set bit.
- Shift operations walk or construct bit patterns.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `missing_number`
- C++: `solution.cpp` → `missingNumber`
- TypeScript: `solution.ts` → `missingNumber`
