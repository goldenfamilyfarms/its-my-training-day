import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const mergeTwoSortedLists = (
  l1: ListNode<number> | null,
  l2: ListNode<number> | null
): ListNode<number> | null => {
  const dummy = new ListNode<number>(0);
  let current = dummy;
  let a = l1;
  let b = l2;
  while (a !== null && b !== null) {
    if (a.val <= b.val) {
      current.next = a;
      a = a.next;
    } else {
      current.next = b;
      b = b.next;
    }
    current = current.next as ListNode<number>;
  }
  current.next = a !== null ? a : b;
  return dummy.next;
};
