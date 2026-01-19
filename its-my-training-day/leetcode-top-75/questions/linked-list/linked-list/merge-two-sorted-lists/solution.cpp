#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

ListNode<int>* mergeTwoSortedLists(ListNode<int>* l1, ListNode<int>* l2) {
    ListNode<int> dummy(0);
    ListNode<int>* current = &dummy;
    while (l1 && l2) {
        if (l1->val <= l2->val) {
            current->next = l1;
            l1 = l1->next;
        } else {
            current->next = l2;
            l2 = l2->next;
        }
        current = current->next;
    }
    current->next = l1 ? l1 : l2;
    return dummy.next;
}
