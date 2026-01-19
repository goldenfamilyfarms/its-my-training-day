#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::string serializeBinaryTree(TreeNode* root) {
    if (!root) return "";
    ArrayList<std::string> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        TreeNode* node = queue.dequeue();
        if (!node) {
            result.add("#");
        } else {
            result.add(std::to_string(node->val));
            queue.enqueue(node->left);
            queue.enqueue(node->right);
        }
    }
    std::vector<std::string> out = toVector(result);
    std::string s;
    for (int i = 0; i < static_cast<int>(out.size()); ++i) {
        if (i > 0) s += ",";
        s += out[i];
    }
    return s;
}
TreeNode* deserializeBinaryTree(const std::string& data) {
    if (data.empty()) return nullptr;
    ArrayList<std::string> valuesList;
    std::string token;
    for (int i = 0; i <= static_cast<int>(data.size()); ++i) {
        if (i == static_cast<int>(data.size()) || data[i] == ',') {
            valuesList.add(token);
            token.clear();
        } else {
            token += data[i];
        }
    }
    std::vector<std::string> values = toVector(valuesList);
    if (values[0] == "#") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(values[0]));
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    int i = 1;
    while (i < static_cast<int>(values.size())) {
        TreeNode* node = queue.dequeue();
        if (values[i] != "#") {
            node->left = new TreeNode(std::stoi(values[i]));
            queue.enqueue(node->left);
        }
        i += 1;
        if (i < static_cast<int>(values.size()) && values[i] != "#") {
            node->right = new TreeNode(std::stoi(values[i]));
            queue.enqueue(node->right);
        }
        i += 1;
    }
    return root;
}
