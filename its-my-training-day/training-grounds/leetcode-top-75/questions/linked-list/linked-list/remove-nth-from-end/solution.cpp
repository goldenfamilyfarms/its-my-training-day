#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

ListNode<int>* removeNthFromEnd(ListNode<int>* head, int n) {
    ListNode<int> dummy(0);
    dummy.next = head;
    ListNode<int>* fast = &dummy;
    ListNode<int>* slow = &dummy;
    for (int i = 0; i < n + 1; ++i) {
        fast = fast->next;
    }
    while (fast) {
        fast = fast->next;
        slow = slow->next;
    }
    slow->next = slow->next->next;
    return dummy.next;
}
