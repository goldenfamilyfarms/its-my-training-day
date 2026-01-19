# Course Schedule

## Directory
- Data structure: `graphs`
- Technique: `topo-sort`

## Approach
Kahn's algorithm using indegrees and a queue.

## Data Structure Deep Dive
- Track indegrees and peel nodes with zero dependencies.
- Detect cycles by counting visited nodes.
- Builds a valid ordering when constraints form a DAG.

## Complexity
Time O(V+E) | Space O(V+E)

## Solution References
- Python: `solution.py` → `course_schedule`
- C++: `solution.cpp` → `courseSchedule`
- TypeScript: `solution.ts` → `courseSchedule`
