#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool jumpGame(const std::vector<int>& nums) {
    int reach = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (i > reach) return false;
        if (i + nums[i] > reach) reach = i + nums[i];
    }
    return true;
}
