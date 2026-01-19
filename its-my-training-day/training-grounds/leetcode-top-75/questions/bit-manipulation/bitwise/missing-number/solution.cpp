#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int missingNumber(const std::vector<int>& nums) {
    int xorVal = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        xorVal ^= i;
        xorVal ^= nums[i];
    }
    xorVal ^= static_cast<int>(nums.size());
    return xorVal;
}
