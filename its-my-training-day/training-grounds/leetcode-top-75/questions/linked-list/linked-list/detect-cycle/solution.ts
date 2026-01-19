import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const detectCycle = (head: ListNode<number> | null): boolean => {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow?.next ?? null;
    fast = fast.next.next;
    if (slow === fast && slow !== null) return true;
  }
  return false;
};
