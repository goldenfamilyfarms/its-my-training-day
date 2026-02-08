#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool wordSearch(std::vector<std::vector<char>>& board, const std::string& word) {
    int rows = static_cast<int>(board.size());
    int cols = static_cast<int>(board[0].size());
    std::function<bool(int, int, int)> dfs = [&](int r, int c, int idx) {
        if (idx == static_cast<int>(word.size())) return true;
        if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
        if (board[r][c] != word[idx]) return false;
        char temp = board[r][c];
        board[r][c] = '#';
        bool found = dfs(r + 1, c, idx + 1) || dfs(r - 1, c, idx + 1) ||
                     dfs(r, c + 1, idx + 1) || dfs(r, c - 1, idx + 1);
        board[r][c] = temp;
        return found;
    };
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (dfs(r, c, 0)) return true;
        }
    }
    return false;
}
