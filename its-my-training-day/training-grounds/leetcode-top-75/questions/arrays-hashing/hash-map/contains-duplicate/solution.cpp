#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool containsDuplicate(const std::vector<int>& nums) {
    std::unordered_map<int, bool> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (seen.find(nums[i]) != seen.end()) return true;
        seen[nums[i]] = true;
    }
    return false;
}
