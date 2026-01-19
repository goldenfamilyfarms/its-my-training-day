# Implement Trie (Prefix Tree)

## Directory
- Data structure: `strings`
- Technique: `trie`

## Approach
Each node stores children and end-of-word flag.

## Data Structure Deep Dive
- Each character moves down one level of the tree.
- Prefix queries are O(length) regardless of word count.
- Nodes mark terminal words for exact match.

## Complexity
Time O(k) | Space O(k * alphabet)

## Solution References
- Python: `solution.py` → `Trie`
- C++: `solution.cpp` → `Trie`
- TypeScript: `solution.ts` → `Trie`
