#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

void reorderList(ListNode<int>* head) {
    if (!head || !head->next) return;
    ListNode<int>* slow = head;
    ListNode<int>* fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode<int>* second = reverseLinkedList(slow->next);
    slow->next = nullptr;
    ListNode<int>* first = head;
    while (second) {
        ListNode<int>* temp1 = first->next;
        ListNode<int>* temp2 = second->next;
        first->next = second;
        second->next = temp1;
        first = temp1;
        second = temp2;
    }
}
