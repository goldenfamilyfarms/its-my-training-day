#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

TreeNode* lcaBST(TreeNode* root, TreeNode* p, TreeNode* q) {
    TreeNode* current = root;
    while (current) {
        if (p->val < current->val && q->val < current->val) {
            current = current->left;
        } else if (p->val > current->val && q->val > current->val) {
            current = current->right;
        } else {
            return current;
        }
    }
    return nullptr;
}
