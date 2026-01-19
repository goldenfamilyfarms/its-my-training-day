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
std::vector<int> binaryTreeRightSideView(TreeNode* root) {
    if (!root) return std::vector<int>();
    ArrayList<int> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        Queue<TreeNode*> temp;
        int levelSize = 0;
        while (!queue.empty()) {
            temp.enqueue(queue.dequeue());
            levelSize += 1;
        }
        int lastVal = 0;
        while (!temp.empty()) {
            TreeNode* node = temp.dequeue();
            lastVal = node->val;
            if (node->left) queue.enqueue(node->left);
            if (node->right) queue.enqueue(node->right);
        }
        result.add(lastVal);
    }
    return toVector(result);
}
