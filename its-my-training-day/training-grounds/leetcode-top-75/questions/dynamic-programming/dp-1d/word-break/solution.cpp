#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool wordBreak(const std::string& s, const std::vector<std::string>& wordDict) {
    std::unordered_map<std::string, bool> wordSet;
    for (int i = 0; i < static_cast<int>(wordDict.size()); ++i) {
        wordSet[wordDict[i]] = true;
    }
    std::vector<bool> dp(s.size() + 1, false);
    dp[0] = true;
    for (int i = 1; i <= static_cast<int>(s.size()); ++i) {
        for (int j = 0; j < i; ++j) {
            if (dp[j] && wordSet.find(s.substr(j, i - j)) != wordSet.end()) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.size()];
}
