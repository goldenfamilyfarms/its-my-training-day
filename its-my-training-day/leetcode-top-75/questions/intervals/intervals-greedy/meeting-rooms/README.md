# Meeting Rooms

## Directory
- Data structure: `intervals`
- Technique: `intervals-greedy`

## Approach
Sort by start and detect any overlap.

## Data Structure Deep Dive
- Sort by end to minimize removals or conflicts.
- Pick the earliest finishing intervals first.
- Conflicts are detected by comparing boundaries.

## Complexity
Time O(n log n) | Space O(1)

## Solution References
- Python: `solution.py` → `meeting_rooms`
- C++: `solution.cpp` → `meetingRooms`
- TypeScript: `solution.ts` → `meetingRooms`
