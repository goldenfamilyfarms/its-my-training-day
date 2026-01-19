#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

TreeNode* buildTreePreIn(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::unordered_map<int, int> index;
    for (int i = 0; i < static_cast<int>(inorder.size()); ++i) {
        index[inorder[i]] = i;
    }
    std::function<TreeNode*(int, int, int, int)> helper = [&](int preL, int preR, int inL, int inR) {
        if (preL > preR) return static_cast<TreeNode*>(nullptr);
        int rootVal = preorder[preL];
        TreeNode* root = new TreeNode(rootVal);
        int mid = index[rootVal];
        int leftSize = mid - inL;
        root->left = helper(preL + 1, preL + leftSize, inL, mid - 1);
        root->right = helper(preL + leftSize + 1, preR, mid + 1, inR);
        return root;
    };
    return helper(0, static_cast<int>(preorder.size()) - 1, 0, static_cast<int>(inorder.size()) - 1);
}
