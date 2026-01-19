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
std::vector<std::vector<int>> pacificAtlantic(std::vector<std::vector<int>> heights) {
    int rows = static_cast<int>(heights.size());
    if (rows == 0) return std::vector<std::vector<int>>();
    int cols = static_cast<int>(heights[0].size());
    std::vector<std::vector<bool>> pac(rows, std::vector<bool>(cols, false));
    std::vector<std::vector<bool>> atl(rows, std::vector<bool>(cols, false));

    std::function<void(int, int, std::vector<std::vector<bool>>&)> dfs =
        [&](int r, int c, std::vector<std::vector<bool>>& visited) {
            visited[r][c] = true;
            int dr[4] = {1, -1, 0, 0};
            int dc[4] = {0, 0, 1, -1};
            for (int i = 0; i < 4; ++i) {
                int nr = r + dr[i];
                int nc = c + dc[i];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (!visited[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                        dfs(nr, nc, visited);
                    }
                }
            }
        };

    for (int r = 0; r < rows; ++r) {
        dfs(r, 0, pac);
        dfs(r, cols - 1, atl);
    }
    for (int c = 0; c < cols; ++c) {
        dfs(0, c, pac);
        dfs(rows - 1, c, atl);
    }

    ArrayList<std::vector<int>> result;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (pac[r][c] && atl[r][c]) {
                std::vector<int> cell(2);
                cell[0] = r;
                cell[1] = c;
                result.add(cell);
            }
        }
    }
    return toVector(result);
}
