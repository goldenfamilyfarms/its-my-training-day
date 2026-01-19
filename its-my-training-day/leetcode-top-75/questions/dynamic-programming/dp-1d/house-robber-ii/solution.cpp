#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int houseRobberII(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    if (nums.size() == 1) return nums[0];
    auto robRange = [&](int left, int right) {
        int prev1 = 0;
        int prev2 = 0;
        for (int i = left; i <= right; ++i) {
            int take = prev2 + nums[i];
            int skip = prev1;
            int current = take > skip ? take : skip;
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    };
    int a = robRange(0, static_cast<int>(nums.size()) - 2);
    int b = robRange(1, static_cast<int>(nums.size()) - 1);
    return a > b ? a : b;
}
