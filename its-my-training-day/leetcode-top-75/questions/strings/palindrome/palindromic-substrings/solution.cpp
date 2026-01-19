#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int palindromicSubstrings(const std::string& s) {
    int count = 0;
    auto expand = [&](int l, int r) {
        int left = l;
        int right = r;
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
            count += 1;
            left -= 1;
            right += 1;
        }
    };
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        expand(i, i);
        expand(i, i + 1);
    }
    return count;
}
