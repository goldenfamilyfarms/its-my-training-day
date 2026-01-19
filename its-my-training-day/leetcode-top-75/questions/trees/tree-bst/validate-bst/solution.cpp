#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool validateBST(TreeNode* root) {
    std::function<bool(TreeNode*, long long, long long)> helper = [&](TreeNode* node, long long low, long long high) {
        if (!node) return true;
        if (node->val <= low || node->val >= high) return false;
        return helper(node->left, low, node->val) && helper(node->right, node->val, high);
    };
    return helper(root, -1000000000000LL, 1000000000000LL);
}
