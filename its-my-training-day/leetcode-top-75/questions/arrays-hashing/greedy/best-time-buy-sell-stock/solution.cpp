#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int bestTimeBuySellStock(const std::vector<int>& prices) {
    if (prices.empty()) return 0;
    int minPrice = prices[0];
    int maxProfit = 0;
    for (int i = 1; i < static_cast<int>(prices.size()); ++i) {
        if (prices[i] < minPrice) {
            minPrice = prices[i];
        } else {
            int profit = prices[i] - minPrice;
            if (profit > maxProfit) maxProfit = profit;
        }
    }
    return maxProfit;
}
