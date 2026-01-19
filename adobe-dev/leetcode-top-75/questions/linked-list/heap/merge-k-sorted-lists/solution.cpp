#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

ListNode<int>* mergeKSortedLists(const std::vector<ListNode<int>*>& lists) {
    struct HeapNode {
        int val;
        int idx;
        ListNode<int>* node;
        bool operator<(const HeapNode& other) const { return val < other.val; }
        bool operator>(const HeapNode& other) const { return val > other.val; }
    };
    MinHeap<HeapNode> heap;
    for (int i = 0; i < static_cast<int>(lists.size()); ++i) {
        if (lists[i]) {
            heap.push({lists[i]->val, i, lists[i]});
        }
    }
    ListNode<int> dummy(0);
    ListNode<int>* current = &dummy;
    while (heap.size() > 0) {
        HeapNode top = heap.pop();
        current->next = top.node;
        current = current->next;
        if (top.node->next) {
            heap.push({top.node->next->val, top.idx, top.node->next});
        }
    }
    return dummy.next;
}
