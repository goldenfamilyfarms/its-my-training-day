#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool subtreeOfAnotherTree(TreeNode* root, TreeNode* subRoot) {
    std::function<bool(TreeNode*, TreeNode*)> same = [&](TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a->val != b->val) return false;
        return same(a->left, b->left) && same(a->right, b->right);
    };
    if (!root) return subRoot == nullptr;
    if (same(root, subRoot)) return true;
    return subtreeOfAnotherTree(root->left, subRoot) || subtreeOfAnotherTree(root->right, subRoot);
}
