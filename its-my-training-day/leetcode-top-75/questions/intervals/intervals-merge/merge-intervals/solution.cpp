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
std::vector<std::vector<int>> mergeIntervals(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return std::vector<std::vector<int>>();
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    ArrayList<std::vector<int>> result;
    std::vector<int> current = intervals[0];
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (intervals[i][0] <= current[1]) {
            if (intervals[i][1] > current[1]) current[1] = intervals[i][1];
        } else {
            result.add(current);
            current = intervals[i];
        }
    }
    result.add(current);
    return toVector(result);
}
