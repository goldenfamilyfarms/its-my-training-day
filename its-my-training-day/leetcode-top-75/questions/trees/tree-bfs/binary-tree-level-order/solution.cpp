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
std::vector<std::vector<int>> binaryTreeLevelOrder(TreeNode* root) {
    if (!root) return std::vector<std::vector<int>>();
    ArrayList<std::vector<int>> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        Queue<TreeNode*> temp;
        int levelSize = 0;
        while (!queue.empty()) {
            temp.enqueue(queue.dequeue());
            levelSize += 1;
        }
        std::vector<int> level(levelSize);
        int i = 0;
        while (!temp.empty()) {
            TreeNode* node = temp.dequeue();
            level[i] = node->val;
            if (node->left) queue.enqueue(node->left);
            if (node->right) queue.enqueue(node->right);
            i += 1;
        }
        result.add(level);
    }
    return toVector(result);
}
