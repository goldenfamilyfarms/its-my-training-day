import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export const mergeKSortedLists = (lists: Array<ListNode<number> | null>): ListNode<number> | null => {
  type NodeEntry = { val: number; idx: number; node: ListNode<number> };
  const heap = new MinHeap<NodeEntry>();
  for (let i = 0; i < lists.length; i += 1) {
    if (lists[i] !== null) {
      heap.push({ val: (lists[i] as ListNode<number>).val, idx: i, node: lists[i] as ListNode<number> });
    }
  }
  const dummy = new ListNode<number>(0);
  let current = dummy;
  while (heap.size() > 0) {
    const top = heap.pop() as NodeEntry;
    current.next = top.node;
    current = current.next as ListNode<number>;
    if (top.node.next !== null) {
      heap.push({ val: top.node.next.val, idx: top.idx, node: top.node.next });
    }
  }
  return dummy.next;
};
