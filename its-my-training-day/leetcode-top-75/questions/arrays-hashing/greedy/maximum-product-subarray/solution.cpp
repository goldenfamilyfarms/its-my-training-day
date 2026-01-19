#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int maximumProductSubarray(const std::vector<int>& nums) {
    int maxVal = nums[0];
    int minVal = nums[0];
    int best = nums[0];
    for (int i = 1; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        if (val < 0) {
            int tmp = maxVal;
            maxVal = minVal;
            minVal = tmp;
        }
        maxVal = std::max(val, maxVal * val);
        minVal = std::min(val, minVal * val);
        if (maxVal > best) best = maxVal;
    }
    return best;
}
