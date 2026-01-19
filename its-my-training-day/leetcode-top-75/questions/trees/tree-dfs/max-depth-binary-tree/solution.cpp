#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int maxDepthBinaryTree(TreeNode* root) {
    if (!root) return 0;
    int left = maxDepthBinaryTree(root->left);
    int right = maxDepthBinaryTree(root->right);
    return 1 + (left > right ? left : right);
}
