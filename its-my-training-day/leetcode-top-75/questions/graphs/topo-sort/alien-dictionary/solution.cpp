#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::string alienDictionary(const std::vector<std::string>& words) {
    std::unordered_map<char, ArrayList<char>> graph;
    std::unordered_map<char, int> indegree;
    for (const std::string& w : words) {
        for (char ch : w) {
            if (graph.find(ch) == graph.end()) graph[ch] = ArrayList<char>();
            if (indegree.find(ch) == indegree.end()) indegree[ch] = 0;
        }
    }
    for (int i = 0; i + 1 < static_cast<int>(words.size()); ++i) {
        const std::string& a = words[i];
        const std::string& b = words[i + 1];
        int j = 0;
        while (j < static_cast<int>(a.size()) && j < static_cast<int>(b.size()) && a[j] == b[j]) {
            j += 1;
        }
        if (j < static_cast<int>(a.size()) && j < static_cast<int>(b.size())) {
            graph[a[j]].add(b[j]);
            indegree[b[j]] += 1;
        } else if (a.size() > b.size()) {
            return "";
        }
    }
    Queue<char> queue;
    for (auto& kv : indegree) {
        if (kv.second == 0) queue.enqueue(kv.first);
    }
    ArrayList<char> order;
    while (!queue.empty()) {
        char ch = queue.dequeue();
        order.add(ch);
        ArrayList<char>& neighbors = graph[ch];
        for (std::size_t i = 0; i < neighbors.size(); ++i) {
            char nxt = neighbors.get(i);
            indegree[nxt] -= 1;
            if (indegree[nxt] == 0) queue.enqueue(nxt);
        }
    }
    if (order.size() != indegree.size()) return "";
    std::string result;
    std::vector<char> orderVec = toVector(order);
    result.assign(orderVec.begin(), orderVec.end());
    return result;
}
