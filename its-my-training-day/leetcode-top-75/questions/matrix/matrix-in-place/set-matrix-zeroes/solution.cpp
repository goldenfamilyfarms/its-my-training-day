#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

void setMatrixZeroes(std::vector<std::vector<int>>& matrix) {
    int rows = static_cast<int>(matrix.size());
    int cols = static_cast<int>(matrix[0].size());
    bool rowZero = false;
    bool colZero = false;
    for (int r = 0; r < rows; ++r) {
        if (matrix[r][0] == 0) colZero = true;
    }
    for (int c = 0; c < cols; ++c) {
        if (matrix[0][c] == 0) rowZero = true;
    }
    for (int r = 1; r < rows; ++r) {
        for (int c = 1; c < cols; ++c) {
            if (matrix[r][c] == 0) {
                matrix[r][0] = 0;
                matrix[0][c] = 0;
            }
        }
    }
    for (int r = 1; r < rows; ++r) {
        if (matrix[r][0] == 0) {
            for (int c = 1; c < cols; ++c) {
                matrix[r][c] = 0;
            }
        }
    }
    for (int c = 1; c < cols; ++c) {
        if (matrix[0][c] == 0) {
            for (int r = 1; r < rows; ++r) {
                matrix[r][c] = 0;
            }
        }
    }
    if (rowZero) {
        for (int c = 0; c < cols; ++c) matrix[0][c] = 0;
    }
    if (colZero) {
        for (int r = 0; r < rows; ++r) matrix[r][0] = 0;
    }
}
