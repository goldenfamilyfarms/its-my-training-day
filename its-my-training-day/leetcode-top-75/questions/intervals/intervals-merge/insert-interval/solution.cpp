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
std::vector<std::vector<int>> insertInterval(std::vector<std::vector<int>> intervals, std::vector<int> newInterval) {
    ArrayList<std::vector<int>> result;
    int i = 0;
    while (i < static_cast<int>(intervals.size()) && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i]);
        i += 1;
    }
    while (i < static_cast<int>(intervals.size()) && intervals[i][0] <= newInterval[1]) {
        if (intervals[i][0] < newInterval[0]) newInterval[0] = intervals[i][0];
        if (intervals[i][1] > newInterval[1]) newInterval[1] = intervals[i][1];
        i += 1;
    }
    result.add(newInterval);
    while (i < static_cast<int>(intervals.size())) {
        result.add(intervals[i]);
        i += 1;
    }
    return toVector(result);
}
