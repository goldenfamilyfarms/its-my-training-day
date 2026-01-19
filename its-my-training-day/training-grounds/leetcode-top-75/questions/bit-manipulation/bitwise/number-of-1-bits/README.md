# Number of 1 Bits

## Directory
- Data structure: `bit-manipulation`
- Technique: `bitwise`

## Approach
Clear the lowest set bit repeatedly and count steps.

## Data Structure Deep Dive
- Bitwise ops compress logic into O(1) space.
- XOR cancels identical values; AND clears lowest set bit.
- Shift operations walk or construct bit patterns.

## Complexity
Time O(k) | Space O(1)

## Solution References
- Python: `solution.py` → `number_of_1_bits`
- C++: `solution.cpp` → `numberOf1Bits`
- TypeScript: `solution.ts` → `numberOf1Bits`
