#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int containerWithMostWater(const std::vector<int>& heights) {
    int left = 0;
    int right = static_cast<int>(heights.size()) - 1;
    int best = 0;
    while (left < right) {
        int width = right - left;
        if (heights[left] < heights[right]) {
            int area = heights[left] * width;
            if (area > best) best = area;
            left += 1;
        } else {
            int area = heights[right] * width;
            if (area > best) best = area;
            right -= 1;
        }
    }
    return best;
}
