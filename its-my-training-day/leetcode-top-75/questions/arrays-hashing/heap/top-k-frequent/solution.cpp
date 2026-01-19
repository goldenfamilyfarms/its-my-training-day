#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

std::vector<int> topKFrequent(const std::vector<int>& nums, int k) {
    std::unordered_map<int, int> freq;
    for (int val : nums) freq[val] += 1;
    struct Pair {
        int count;
        int value;
        bool operator<(const Pair& other) const { return count < other.count; }
        bool operator>(const Pair& other) const { return count > other.count; }
    };
    MinHeap<Pair> heap;
    for (auto& kv : freq) {
        heap.push({kv.second, kv.first});
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    std::vector<int> result(k);
    for (int i = k - 1; i >= 0; --i) {
        result[i] = heap.pop().value;
    }
    return result;
}
