#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int sumOfTwoIntegers(int a, int b) {
    unsigned int mask = 0xFFFFFFFF;
    while (b != 0) {
        unsigned int carry = (a & b) & mask;
        a = (a ^ b) & mask;
        b = (carry << 1) & mask;
    }
    return a;
}
