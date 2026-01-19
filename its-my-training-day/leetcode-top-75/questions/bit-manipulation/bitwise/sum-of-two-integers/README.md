# Sum of Two Integers

## Directory
- Data structure: `bit-manipulation`
- Technique: `bitwise`

## Approach
Use XOR for sum and AND+shift for carry until carry is zero.

## Data Structure Deep Dive
- Bitwise ops compress logic into O(1) space.
- XOR cancels identical values; AND clears lowest set bit.
- Shift operations walk or construct bit patterns.

## Complexity
Time O(1) | Space O(1)

## Solution References
- Python: `solution.py` → `sum_of_two_integers`
- C++: `solution.cpp` → `sumOfTwoIntegers`
- TypeScript: `solution.ts` → `sumOfTwoIntegers`
