#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int numberOf1Bits(unsigned int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1);
        count += 1;
    }
    return count;
}
