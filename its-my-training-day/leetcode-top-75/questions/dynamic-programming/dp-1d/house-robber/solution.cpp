#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int houseRobber(const std::vector<int>& nums) {
    int prev1 = 0;
    int prev2 = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int take = prev2 + nums[i];
        int skip = prev1;
        int current = take > skip ? take : skip;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}
