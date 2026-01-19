#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int maximumSubarray(const std::vector<int>& nums) {
    int best = nums[0];
    int current = nums[0];
    for (int i = 1; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        if (current + val > val) current = current + val;
        else current = val;
        if (current > best) best = current;
    }
    return best;
}
