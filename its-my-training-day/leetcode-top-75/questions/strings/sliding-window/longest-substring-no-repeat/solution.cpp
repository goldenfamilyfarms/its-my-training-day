#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int longestSubstringWithoutRepeating(const std::string& s) {
    std::unordered_map<char, int> last;
    int left = 0;
    int best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        if (last.find(ch) != last.end() && last[ch] >= left) {
            left = last[ch] + 1;
        }
        last[ch] = right;
        int length = right - left + 1;
        if (length > best) best = length;
    }
    return best;
}
