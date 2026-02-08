#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int coinChange(const std::vector<int>& coins, int amount) {
    std::vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; ++i) {
        for (int j = 0; j < static_cast<int>(coins.size()); ++j) {
            int coin = coins[j];
            if (coin <= i) {
                int cand = dp[i - coin] + 1;
                if (cand < dp[i]) dp[i] = cand;
            }
        }
    }
    return dp[amount] == amount + 1 ? -1 : dp[amount];
}
