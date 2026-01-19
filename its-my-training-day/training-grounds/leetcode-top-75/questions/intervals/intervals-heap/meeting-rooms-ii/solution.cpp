#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

static void quickSortIntervals(std::vector<std::vector<int>>& intervals, int left, int right) {
    if (left >= right) return;
    std::vector<int> pivot = intervals[(left + right) / 2];
    int i = left;
    int j = right;
    while (i <= j) {
        while (intervals[i][0] < pivot[0]) i += 1;
        while (intervals[j][0] > pivot[0]) j -= 1;
        if (i <= j) {
            std::vector<int> temp = intervals[i];
            intervals[i] = intervals[j];
            intervals[j] = temp;
            i += 1;
            j -= 1;
        }
    }
    if (left < j) quickSortIntervals(intervals, left, j);
    if (i < right) quickSortIntervals(intervals, i, right);
}

template <typename T>
int meetingRoomsII(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return 0;
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    MinHeap<int> heap;
    heap.push(intervals[0][1]);
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (heap.size() > 0 && intervals[i][0] >= heap.peek()) {
            heap.pop();
        }
        heap.push(intervals[i][1]);
    }
    return static_cast<int>(heap.size());
}
