#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool validAnagram(const std::string& s, const std::string& t) {
    if (s.size() != t.size()) return false;
    std::unordered_map<char, int> count;
    for (char ch : s) count[ch] += 1;
    for (char ch : t) {
        if (count.find(ch) == count.end()) return false;
        count[ch] -= 1;
        if (count[ch] < 0) return false;
    }
    return true;
}
