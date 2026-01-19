#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int numberOfIslands(std::vector<std::vector<char>> grid) {
    if (grid.empty()) return 0;
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    int count = 0;
    std::function<void(int, int)> dfs = [&](int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        if (grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    };
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] == '1') {
                count += 1;
                dfs(r, c);
            }
        }
    }
    return count;
}
