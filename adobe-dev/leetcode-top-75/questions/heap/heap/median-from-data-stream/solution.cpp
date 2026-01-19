#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

class MedianFinder {
public:
    void addNum(int num) {
        if (low.size() == 0 || num <= low.peek()) low.push(num);
        else high.push(num);
        if (low.size() > high.size() + 1) high.push(low.pop());
        else if (high.size() > low.size()) low.push(high.pop());
    }

    double findMedian() {
        if (low.size() > high.size()) return static_cast<double>(low.peek());
        return (low.peek() + high.peek()) / 2.0;
    }

private:
    MaxHeap<int> low;
    MinHeap<int> high;
};
