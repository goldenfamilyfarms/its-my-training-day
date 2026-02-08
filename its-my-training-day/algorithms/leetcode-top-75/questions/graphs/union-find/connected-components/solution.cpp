#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int numberOfConnectedComponents(int n, const std::vector<std::vector<int>>& edges) {
    std::vector<int> parent(n);
    for (int i = 0; i < n; ++i) parent[i] = i;
    int count = n;
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
        if (pa != pb) {
            parent[pb] = pa;
            count -= 1;
        }
    }
    return count;
}
