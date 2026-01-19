#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int longestIncreasingSubsequence(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    std::vector<int> tails(nums.size(), 0);
    int size = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        int left = 0;
        int right = size;
        while (left < right) {
            int mid = (left + right) / 2;
            if (tails[mid] < val) left = mid + 1;
            else right = mid;
        }
        tails[left] = val;
        if (left == size) size += 1;
    }
    return size;
}
