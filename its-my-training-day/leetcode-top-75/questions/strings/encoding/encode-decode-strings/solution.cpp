#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::string encodeStrings(const std::vector<std::string>& strs) {
    ArrayList<std::string> parts;
    for (int i = 0; i < static_cast<int>(strs.size()); ++i) {
        parts.add(std::to_string(strs[i].size()));
        parts.add("#");
        parts.add(strs[i]);
    }
    std::vector<std::string> out = toVector(parts);
    std::string result;
    for (int i = 0; i < static_cast<int>(out.size()); ++i) {
        result += out[i];
    }
    return result;
}
std::vector<std::string> decodeStrings(const std::string& s) {
    ArrayList<std::string> result;
    int i = 0;
    while (i < static_cast<int>(s.size())) {
        int j = i;
        while (s[j] != '#') j += 1;
        int length = std::stoi(s.substr(i, j - i));
        int start = j + 1;
        result.add(s.substr(start, length));
        i = start + length;
    }
    return toVector(result);
}
