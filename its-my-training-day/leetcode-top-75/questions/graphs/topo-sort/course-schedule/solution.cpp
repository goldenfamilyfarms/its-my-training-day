#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

bool courseSchedule(int numCourses, const std::vector<std::vector<int>>& prerequisites) {
    std::vector<ArrayList<int>> graph(numCourses);
    std::vector<int> indegree(numCourses, 0);
    for (int i = 0; i < static_cast<int>(prerequisites.size()); ++i) {
        int a = prerequisites[i][0];
        int b = prerequisites[i][1];
        graph[b].add(a);
        indegree[a] += 1;
    }
    Queue<int> queue;
    for (int i = 0; i < numCourses; ++i) {
        if (indegree[i] == 0) queue.enqueue(i);
    }
    int visited = 0;
    while (!queue.empty()) {
        int node = queue.dequeue();
        visited += 1;
        ArrayList<int>& neighbors = graph[node];
        for (std::size_t i = 0; i < neighbors.size(); ++i) {
            int next = neighbors.get(i);
            indegree[next] -= 1;
            if (indegree[next] == 0) queue.enqueue(next);
        }
    }
    return visited == numCourses;
}
