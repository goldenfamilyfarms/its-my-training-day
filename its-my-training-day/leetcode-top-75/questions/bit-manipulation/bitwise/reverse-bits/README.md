# Reverse Bits

## Directory
- Data structure: `bit-manipulation`
- Technique: `bitwise`

## Approach
Shift result left and append the lowest bit 32 times.

## Data Structure Deep Dive
- Bitwise ops compress logic into O(1) space.
- XOR cancels identical values; AND clears lowest set bit.
- Shift operations walk or construct bit patterns.

## Complexity
Time O(1) | Space O(1)

## Solution References
- Python: `solution.py` → `reverse_bits`
- C++: `solution.cpp` → `reverseBits`
- TypeScript: `solution.ts` → `reverseBits`
