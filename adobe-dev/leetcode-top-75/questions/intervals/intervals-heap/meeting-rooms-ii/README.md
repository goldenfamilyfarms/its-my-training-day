# Meeting Rooms II

## Directory
- Data structure: `intervals`
- Technique: `intervals-heap`

## Approach
Use a min-heap of end times to reuse rooms.

## Data Structure Deep Dive
- Min-heap tracks earliest ending active interval.
- Pop when a new interval can reuse a resource.
- Heap size equals peak concurrent usage.

## Complexity
Time O(n log n) | Space O(n)

## Solution References
- Python: `solution.py` → `meeting_rooms_ii`
- C++: `solution.cpp` → `meetingRoomsII`
- TypeScript: `solution.ts` → `meetingRoomsII`
