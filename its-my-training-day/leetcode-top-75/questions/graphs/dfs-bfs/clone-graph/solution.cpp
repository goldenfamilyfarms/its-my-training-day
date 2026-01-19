#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

GraphNode* cloneGraph(GraphNode* node) {
    if (node == nullptr) return nullptr;
    std::unordered_map<GraphNode*, GraphNode*> clones;
    std::function<GraphNode*(GraphNode*)> dfs = [&](GraphNode* curr) {
        if (clones.find(curr) != clones.end()) return clones[curr];
        GraphNode* copy = new GraphNode(curr->val);
        clones[curr] = copy;
        for (std::size_t i = 0; i < curr->neighbors.size(); ++i) {
            copy->neighbors.add(dfs(curr->neighbors.get(i)));
        }
        return copy;
    };
    return dfs(node);
}
