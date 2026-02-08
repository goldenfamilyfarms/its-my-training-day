#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int longestConsecutive(const std::vector<int>& nums) {
    std::unordered_map<int, bool> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        seen[nums[i]] = true;
    }
    int longest = 0;
    for (int val : nums) {
        if (seen.find(val - 1) == seen.end()) {
            int length = 1;
            int current = val + 1;
            while (seen.find(current) != seen.end()) {
                length += 1;
                current += 1;
            }
            if (length > longest) longest = length;
        }
    }
    return longest;
}
