#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool validPalindrome(const std::string& s) {
    int left = 0;
    int right = static_cast<int>(s.size()) - 1;
    while (left < right) {
        while (left < right && !std::isalnum(s[left])) left += 1;
        while (left < right && !std::isalnum(s[right])) right -= 1;
        if (std::tolower(s[left]) != std::tolower(s[right])) return false;
        left += 1;
        right -= 1;
    }
    return true;
}
