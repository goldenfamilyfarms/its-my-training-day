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
std::vector<int> spiralMatrix(const std::vector<std::vector<int>>& matrix) {
    ArrayList<int> result;
    int top = 0;
    int bottom = static_cast<int>(matrix.size()) - 1;
    int left = 0;
    int right = static_cast<int>(matrix[0].size()) - 1;
    while (top <= bottom && left <= right) {
        for (int i = left; i <= right; ++i) result.add(matrix[top][i]);
        top += 1;
        for (int i = top; i <= bottom; ++i) result.add(matrix[i][right]);
        right -= 1;
        if (top <= bottom) {
            for (int i = right; i >= left; --i) result.add(matrix[bottom][i]);
            bottom -= 1;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; --i) result.add(matrix[i][left]);
            left += 1;
        }
    }
    return toVector(result);
}
