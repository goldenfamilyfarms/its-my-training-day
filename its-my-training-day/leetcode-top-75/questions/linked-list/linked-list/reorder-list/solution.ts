import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const reorderList = (head: ListNode<number> | null): void => {
  if (head === null || head.next === null) return;
  let slow: ListNode<number> | null = head;
  let fast: ListNode<number> | null = head;
  while (fast?.next && fast.next.next) {
    slow = slow?.next ?? null;
    fast = fast.next.next;
  }
  const second = reverseLinkedList(slow?.next ?? null);
  if (slow) slow.next = null;
  let first = head;
  let secondNode = second;
  while (secondNode !== null) {
    const temp1 = first.next;
    const temp2 = secondNode.next;
    first.next = secondNode;
    secondNode.next = temp1;
    first = temp1 as ListNode<number>;
    secondNode = temp2;
  }
};
