#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

ListNode<int>* reverseLinkedList(ListNode<int>* head) {
    ListNode<int>* prev = nullptr;
    ListNode<int>* current = head;
    while (current != nullptr) {
        ListNode<int>* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}
