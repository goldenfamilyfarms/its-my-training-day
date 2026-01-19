#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

TreeNode* invertBinaryTree(TreeNode* root) {
    if (!root) return nullptr;
    TreeNode* left = invertBinaryTree(root->left);
    TreeNode* right = invertBinaryTree(root->right);
    root->left = right;
    root->right = left;
    return root;
}
