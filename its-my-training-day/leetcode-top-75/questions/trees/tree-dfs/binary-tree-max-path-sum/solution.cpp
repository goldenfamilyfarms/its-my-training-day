#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int binaryTreeMaxPathSum(TreeNode* root) {
    int best = -1000000000;
    std::function<int(TreeNode*)> dfs = [&](TreeNode* node) {
        if (!node) return 0;
        int left = dfs(node->left);
        int right = dfs(node->right);
        if (left < 0) left = 0;
        if (right < 0) right = 0;
        int total = node->val + left + right;
        if (total > best) best = total;
        return node->val + (left > right ? left : right);
    };
    dfs(root);
    return best;
}
