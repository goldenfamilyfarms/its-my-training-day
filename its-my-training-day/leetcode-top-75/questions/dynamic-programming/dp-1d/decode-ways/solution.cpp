#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int decodeWays(const std::string& s) {
    if (s.empty() || s[0] == '0') return 0;
    int prev2 = 1;
    int prev1 = 1;
    for (int i = 1; i < static_cast<int>(s.size()); ++i) {
        int current = 0;
        if (s[i] != '0') current += prev1;
        int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
        if (two >= 10 && two <= 26) current += prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}
