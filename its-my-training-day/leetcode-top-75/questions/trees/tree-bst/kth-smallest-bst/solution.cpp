#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int kthSmallestBST(TreeNode* root, int k) {
    Stack<TreeNode*> stack;
    TreeNode* current = root;
    int count = 0;
    while (current || !stack.empty()) {
        while (current) {
            stack.push(current);
            current = current->left;
        }
        current = stack.pop();
        count += 1;
        if (count == k) return current->val;
        current = current->right;
    }
    return -1;
}
