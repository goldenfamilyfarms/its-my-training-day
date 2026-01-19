#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool graphValidTree(int n, const std::vector<std::vector<int>>& edges) {
    if (static_cast<int>(edges.size()) != n - 1) return false;
    std::vector<int> parent(n);
    for (int i = 0; i < n; ++i) parent[i] = i;
    auto find = [&](int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != x) {
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    };
    for (int i = 0; i < static_cast<int>(edges.size()); ++i) {
        int a = edges[i][0];
        int b = edges[i][1];
        int pa = find(a);
        int pb = find(b);
        if (pa == pb) return false;
        parent[pb] = pa;
    }
    return true;
}
