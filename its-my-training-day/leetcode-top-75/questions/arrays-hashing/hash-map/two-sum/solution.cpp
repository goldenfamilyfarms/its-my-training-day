#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int need = target - nums[i];
        if (seen.find(need) != seen.end()) {
            std::vector<int> out(2);
            out[0] = seen[need];
            out[1] = i;
            return out;
        }
        seen[nums[i]] = i;
    }
    return std::vector<int>();
}
