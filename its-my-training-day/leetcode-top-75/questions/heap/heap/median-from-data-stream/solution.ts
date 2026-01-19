import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

export class MedianFinder {
  private low: MaxHeap<number>;
  private high: MinHeap<number>;

  constructor() {
    this.low = new MaxHeap<number>();
    this.high = new MinHeap<number>();
  }

  addNum(num: number): void {
    if (this.low.size() === 0 || num <= (this.low.peek() as number)) this.low.push(num);
    else this.high.push(num);
    if (this.low.size() > this.high.size() + 1) this.high.push(this.low.pop() as number);
    else if (this.high.size() > this.low.size()) this.low.push(this.high.pop() as number);
  }

  findMedian(): number {
    if (this.low.size() > this.high.size()) return this.low.peek() as number;
    return ((this.low.peek() as number) + (this.high.peek() as number)) / 2;
  }
}
