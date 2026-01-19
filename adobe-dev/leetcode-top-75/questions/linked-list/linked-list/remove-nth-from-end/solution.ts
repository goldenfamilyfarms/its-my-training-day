import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const removeNthFromEnd = (head: ListNode<number> | null, n: number): ListNode<number> | null => {
  const dummy = new ListNode<number>(0, head);
  let fast: ListNode<number> | null = dummy;
  let slow: ListNode<number> | null = dummy;
  for (let i = 0; i < n + 1; i += 1) {
    fast = fast?.next ?? null;
  }
  while (fast !== null) {
    fast = fast.next;
    slow = slow?.next ?? null;
  }
  if (slow !== null && slow.next !== null) slow.next = slow.next.next;
  return dummy.next;
};
