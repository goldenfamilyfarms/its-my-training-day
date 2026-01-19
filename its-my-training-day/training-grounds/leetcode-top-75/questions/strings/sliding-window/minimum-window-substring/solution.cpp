#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::string minimumWindowSubstring(const std::string& s, const std::string& t) {
    if (t.empty()) return "";
    std::unordered_map<char, int> target;
    for (char ch : t) target[ch] += 1;
    int need = static_cast<int>(target.size());
    int formed = 0;
    std::unordered_map<char, int> window;
    int left = 0;
    int bestLen = 1 << 30;
    int bestL = 0;
    int bestR = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        window[ch] += 1;
        if (target.find(ch) != target.end() && window[ch] == target[ch]) {
            formed += 1;
        }
        while (left <= right && formed == need) {
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestL = left;
                bestR = right;
            }
            char leftCh = s[left];
            window[leftCh] -= 1;
            if (target.find(leftCh) != target.end() && window[leftCh] < target[leftCh]) {
                formed -= 1;
            }
            left += 1;
        }
    }
    if (bestLen == (1 << 30)) return "";
    return s.substr(bestL, bestLen);
}
