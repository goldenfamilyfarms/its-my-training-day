#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::string longestPalindromicSubstring(const std::string& s) {
    if (s.empty()) return "";
    int start = 0;
    int end = 0;
    auto expand = [&](int l, int r) {
        int left = l;
        int right = r;
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
            left -= 1;
            right += 1;
        }
        left += 1;
        right -= 1;
        if (right - left > end - start) {
            start = left;
            end = right;
        }
    };
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        expand(i, i);
        expand(i, i + 1);
    }
    return s.substr(start, end - start + 1);
}
