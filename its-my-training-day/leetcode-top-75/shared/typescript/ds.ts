export class ArrayList<T> {
  private data: (T | null)[];
  private sizeValue: number;
  private capacity: number;

  constructor(capacity = 4) {
    this.capacity = capacity < 1 ? 1 : capacity;
    this.data = new Array(this.capacity);
    this.sizeValue = 0;
  }

  private grow(): void {
    const newCapacity = this.capacity * 2;
    const newData = new Array(newCapacity);
    for (let i = 0; i < this.sizeValue; i += 1) {
      newData[i] = this.data[i];
    }
    this.data = newData;
    this.capacity = newCapacity;
  }

  add(value: T): void {
    if (this.sizeValue >= this.capacity) {
      this.grow();
    }
    this.data[this.sizeValue] = value;
    this.sizeValue += 1;
  }

  get(index: number): T {
    if (index < 0 || index >= this.sizeValue) {
      throw new Error("index out of bounds");
    }
    return this.data[index] as T;
  }

  set(index: number, value: T): void {
    if (index < 0 || index >= this.sizeValue) {
      throw new Error("index out of bounds");
    }
    this.data[index] = value;
  }

  size(): number {
    return this.sizeValue;
  }

  removeLast(): T | null {
    if (this.sizeValue === 0) {
      return null;
    }
    const value = this.data[this.sizeValue - 1] as T;
    this.data[this.sizeValue - 1] = null;
    this.sizeValue -= 1;
    return value;
  }

  toArray(): T[] {
    const result = new Array(this.sizeValue) as T[];
    for (let i = 0; i < this.sizeValue; i += 1) {
      result[i] = this.data[i] as T;
    }
    return result;
  }
}

export class ListNode<T> {
  val: T;
  next: ListNode<T> | null;

  constructor(val: T, next: ListNode<T> | null = null) {
    this.val = val;
    this.next = next;
  }
}

export class LinkedList<T> {
  head: ListNode<T> | null;
  tail: ListNode<T> | null;
  private sizeValue: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.sizeValue = 0;
  }

  addLast(value: T): void {
    const node = new ListNode(value);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.sizeValue += 1;
  }

  removeFirst(): T | null {
    if (this.head === null) {
      return null;
    }
    const value = this.head.val;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    }
    this.sizeValue -= 1;
    return value;
  }

  size(): number {
    return this.sizeValue;
  }
}

export class Stack<T> {
  private items: ArrayList<T>;

  constructor() {
    this.items = new ArrayList<T>();
  }

  push(value: T): void {
    this.items.add(value);
  }

  pop(): T | null {
    return this.items.removeLast();
  }

  peek(): T | null {
    if (this.items.size() === 0) {
      return null;
    }
    return this.items.get(this.items.size() - 1);
  }

  isEmpty(): boolean {
    return this.items.size() === 0;
  }
}

export class Queue<T> {
  private items: LinkedList<T>;

  constructor() {
    this.items = new LinkedList<T>();
  }

  enqueue(value: T): void {
    this.items.addLast(value);
  }

  dequeue(): T | null {
    return this.items.removeFirst();
  }

  isEmpty(): boolean {
    return this.items.size() === 0;
  }
}

export class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

export class Graph {
  private adj: ArrayList<number>[];

  constructor(n: number) {
    this.adj = new Array(n);
    for (let i = 0; i < n; i += 1) {
      this.adj[i] = new ArrayList<number>();
    }
  }

  addEdge(u: number, v: number): void {
    this.adj[u].add(v);
  }

  neighbors(u: number): ArrayList<number> {
    return this.adj[u];
  }
}

export class MinHeap<T> {
  private data: ArrayList<T>;

  constructor() {
    this.data = new ArrayList<T>();
  }

  size(): number {
    return this.data.size();
  }

  peek(): T | null {
    if (this.data.size() === 0) {
      return null;
    }
    return this.data.get(0);
  }

  push(value: T): void {
    this.data.add(value);
    this.siftUp(this.data.size() - 1);
  }

  pop(): T | null {
    if (this.data.size() === 0) {
      return null;
    }
    const top = this.data.get(0);
    const last = this.data.removeLast();
    if (this.data.size() > 0 && last !== null) {
      this.data.set(0, last);
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(idx: number): void {
    let i = idx;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if ((this.data.get(parent) as unknown as number) <= (this.data.get(i) as unknown as number)) {
        break;
      }
      this.swap(parent, i);
      i = parent;
    }
  }

  private siftDown(idx: number): void {
    let i = idx;
    const size = this.data.size();
    while (true) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let smallest = i;
      if (left < size && (this.data.get(left) as unknown as number) < (this.data.get(smallest) as unknown as number)) {
        smallest = left;
      }
      if (right < size && (this.data.get(right) as unknown as number) < (this.data.get(smallest) as unknown as number)) {
        smallest = right;
      }
      if (smallest === i) {
        break;
      }
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.data.get(i);
    this.data.set(i, this.data.get(j));
    this.data.set(j, temp);
  }
}

export class MaxHeap<T> {
  private data: ArrayList<T>;

  constructor() {
    this.data = new ArrayList<T>();
  }

  size(): number {
    return this.data.size();
  }

  peek(): T | null {
    if (this.data.size() === 0) {
      return null;
    }
    return this.data.get(0);
  }

  push(value: T): void {
    this.data.add(value);
    this.siftUp(this.data.size() - 1);
  }

  pop(): T | null {
    if (this.data.size() === 0) {
      return null;
    }
    const top = this.data.get(0);
    const last = this.data.removeLast();
    if (this.data.size() > 0 && last !== null) {
      this.data.set(0, last);
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(idx: number): void {
    let i = idx;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if ((this.data.get(parent) as unknown as number) >= (this.data.get(i) as unknown as number)) {
        break;
      }
      this.swap(parent, i);
      i = parent;
    }
  }

  private siftDown(idx: number): void {
    let i = idx;
    const size = this.data.size();
    while (true) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let largest = i;
      if (left < size && (this.data.get(left) as unknown as number) > (this.data.get(largest) as unknown as number)) {
        largest = left;
      }
      if (right < size && (this.data.get(right) as unknown as number) > (this.data.get(largest) as unknown as number)) {
        largest = right;
      }
      if (largest === i) {
        break;
      }
      this.swap(i, largest);
      i = largest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.data.get(i);
    this.data.set(i, this.data.get(j));
    this.data.set(j, temp);
  }
}
