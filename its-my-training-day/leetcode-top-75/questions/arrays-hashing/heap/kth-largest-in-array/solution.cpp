#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

int kthLargestInArray(const std::vector<int>& nums, int k) {
    MinHeap<int> heap;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        heap.push(nums[i]);
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    return heap.peek();
}
