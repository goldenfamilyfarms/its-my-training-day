#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int longestCommonSubsequence(const std::string& text1, const std::string& text2) {
    int n = static_cast<int>(text1.size());
    int m = static_cast<int>(text2.size());
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[n][m];
}
