# Serialize and Deserialize Binary Tree

## Directory
- Data structure: `trees`
- Technique: `tree-serialize`

## Approach
Level-order traversal with null markers for structure.

## Data Structure Deep Dive
- Level order with null markers preserves structure.
- Parsing rebuilds nodes in BFS order.
- Stable encoding supports round-trip reconstruction.

## Complexity
Time O(n) | Space O(n)

## Solution References
- Python: `solution.py` → `serialize_binary_tree / deserialize_binary_tree`
- C++: `solution.cpp` → `serializeBinaryTree / deserializeBinaryTree`
- TypeScript: `solution.ts` → `serializeBinaryTree / deserializeBinaryTree`
