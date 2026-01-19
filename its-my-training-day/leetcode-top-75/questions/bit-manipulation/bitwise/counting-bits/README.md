# Counting Bits

## Directory
- Data structure: `bit-manipulation`
- Technique: `bitwise`

## Approach
DP: bits[i] = bits[i >> 1] + (i & 1).

## Data Structure Deep Dive
- Bitwise ops compress logic into O(1) space.
- XOR cancels identical values; AND clears lowest set bit.
- Shift operations walk or construct bit patterns.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `counting_bits`
- C++: `solution.cpp` → `countingBits`
- TypeScript: `solution.ts` → `countingBits`
