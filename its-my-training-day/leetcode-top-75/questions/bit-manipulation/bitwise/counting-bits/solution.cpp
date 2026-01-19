#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::vector<int> countingBits(int n) {
    std::vector<int> result(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        result[i] = result[i >> 1] + (i & 1);
    }
    return result;
}
