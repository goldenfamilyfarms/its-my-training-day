#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int longestRepeatingCharacterReplacement(const std::string& s, int k) {
    std::unordered_map<char, int> counts;
    int left = 0;
    int maxCount = 0;
    int best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        counts[ch] += 1;
        if (counts[ch] > maxCount) maxCount = counts[ch];
        int window = right - left + 1;
        if (window - maxCount > k) {
            counts[s[left]] -= 1;
            left += 1;
        } else {
            if (window > best) best = window;
        }
    }
    return best;
}
