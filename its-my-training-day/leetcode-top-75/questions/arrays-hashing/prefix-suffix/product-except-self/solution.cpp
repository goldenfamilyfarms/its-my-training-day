#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::vector<int> productExceptSelf(const std::vector<int>& nums) {
    int n = static_cast<int>(nums.size());
    std::vector<int> result(n, 1);
    int prefix = 1;
    for (int i = 0; i < n; ++i) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; --i) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}
