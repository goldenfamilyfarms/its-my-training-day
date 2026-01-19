#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::vector<std::vector<int>> combinationSum(const std::vector<int>& candidates, int target) {
    ArrayList<std::vector<int>> result;
    ArrayList<int> path;

    std::function<void(int, int)> backtrack = [&](int start, int total) {
        if (total == target) {
            result.add(toVector(path));
            return;
        }
        if (total > target) return;
        for (int i = start; i < static_cast<int>(candidates.size()); ++i) {
            path.add(candidates[i]);
            backtrack(i, total + candidates[i]);
            path.removeLast();
        }
    };

    backtrack(0, 0);
    return toVector(result);
}
