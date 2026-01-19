#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

static std::vector<T> toVector(const ArrayList<T>& list) {
    std::vector<T> out(list.size());
    for (std::size_t i = 0; i < list.size(); ++i) {
        out[i] = list.get(i);
    }
    return out;
}
std::vector<std::vector<std::string>> groupAnagrams(const std::vector<std::string>& strs) {
    std::unordered_map<std::string, ArrayList<std::string>> groups;
    for (const std::string& s : strs) {
        int count[26] = {0};
        for (char ch : s) count[ch - 'a'] += 1;
        std::string key;
        for (int i = 0; i < 26; ++i) {
            key += std::to_string(count[i]) + "#";
        }
        if (groups.find(key) == groups.end()) groups[key] = ArrayList<std::string>();
        groups[key].add(s);
    }
    ArrayList<std::vector<std::string>> result;
    for (auto& kv : groups) {
        result.add(toVector(kv.second));
    }
    return toVector(result);
}
