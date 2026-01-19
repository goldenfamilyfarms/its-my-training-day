# Encode and Decode Strings

## Directory
- Data structure: `strings`
- Technique: `encoding`

## Approach
Use length-prefix encoding; decode by reading length then slice.

## Data Structure Deep Dive
- Length-prefix encoding avoids delimiter collisions.
- Decode by reading length then slicing.
- Round-trip correctness is explicit and deterministic.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `encode_strings / decode_strings`
- C++: `solution.cpp` → `encodeStrings / decodeStrings`
- TypeScript: `solution.ts` → `encodeStrings / decodeStrings`
