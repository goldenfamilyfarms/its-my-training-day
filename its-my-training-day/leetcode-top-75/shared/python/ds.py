class ArrayList:
    def __init__(self, capacity=4):
        if capacity < 1:
            capacity = 1
        self._capacity = capacity
        self._size = 0
        self._data = [None] * self._capacity

    def _grow(self):
        new_capacity = self._capacity * 2
        new_data = [None] * new_capacity
        i = 0
        while i < self._size:
            new_data[i] = self._data[i]
            i += 1
        self._data = new_data
        self._capacity = new_capacity

    def add(self, value):
        if self._size >= self._capacity:
            self._grow()
        self._data[self._size] = value
        self._size += 1

    def get(self, index):
        if index < 0 or index >= self._size:
            raise IndexError("index out of bounds")
        return self._data[index]

    def set(self, index, value):
        if index < 0 or index >= self._size:
            raise IndexError("index out of bounds")
        self._data[index] = value

    def size(self):
        return self._size

    def remove_last(self):
        if self._size == 0:
            return None
        value = self._data[self._size - 1]
        self._data[self._size - 1] = None
        self._size -= 1
        return value

    def to_list(self):
        result = [None] * self._size
        i = 0
        while i < self._size:
            result[i] = self._data[i]
            i += 1
        return result


class ListNode:
    def __init__(self, val=0, next_node=None):
        self.val = val
        self.next = next_node


class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def add_last(self, value):
        node = ListNode(value)
        if self.tail is None:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self._size += 1

    def remove_first(self):
        if self.head is None:
            return None
        value = self.head.val
        self.head = self.head.next
        if self.head is None:
            self.tail = None
        self._size -= 1
        return value

    def size(self):
        return self._size


class Stack:
    def __init__(self):
        self._items = ArrayList()

    def push(self, value):
        self._items.add(value)

    def pop(self):
        return self._items.remove_last()

    def peek(self):
        if self._items.size() == 0:
            return None
        return self._items.get(self._items.size() - 1)

    def is_empty(self):
        return self._items.size() == 0


class Queue:
    def __init__(self):
        self._items = LinkedList()

    def enqueue(self, value):
        self._items.add_last(value)

    def dequeue(self):
        return self._items.remove_first()

    def is_empty(self):
        return self._items.size() == 0


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Graph:
    def __init__(self, n):
        self.n = n
        self.adj = [None] * n
        i = 0
        while i < n:
            self.adj[i] = ArrayList()
            i += 1

    def add_edge(self, u, v):
        self.adj[u].add(v)


class MinHeap:
    def __init__(self):
        self._data = ArrayList()

    def size(self):
        return self._data.size()

    def peek(self):
        if self._data.size() == 0:
            return None
        return self._data.get(0)

    def push(self, value):
        self._data.add(value)
        self._sift_up(self._data.size() - 1)

    def pop(self):
        if self._data.size() == 0:
            return None
        top = self._data.get(0)
        last = self._data.remove_last()
        if self._data.size() > 0:
            self._data.set(0, last)
            self._sift_down(0)
        return top

    def _sift_up(self, idx):
        while idx > 0:
            parent = (idx - 1) // 2
            if self._data.get(parent) <= self._data.get(idx):
                break
            self._swap(parent, idx)
            idx = parent

    def _sift_down(self, idx):
        size = self._data.size()
        while True:
            left = idx * 2 + 1
            right = idx * 2 + 2
            smallest = idx
            if left < size and self._data.get(left) < self._data.get(smallest):
                smallest = left
            if right < size and self._data.get(right) < self._data.get(smallest):
                smallest = right
            if smallest == idx:
                break
            self._swap(idx, smallest)
            idx = smallest

    def _swap(self, i, j):
        temp = self._data.get(i)
        self._data.set(i, self._data.get(j))
        self._data.set(j, temp)


class MaxHeap:
    def __init__(self):
        self._data = ArrayList()

    def size(self):
        return self._data.size()

    def peek(self):
        if self._data.size() == 0:
            return None
        return self._data.get(0)

    def push(self, value):
        self._data.add(value)
        self._sift_up(self._data.size() - 1)

    def pop(self):
        if self._data.size() == 0:
            return None
        top = self._data.get(0)
        last = self._data.remove_last()
        if self._data.size() > 0:
            self._data.set(0, last)
            self._sift_down(0)
        return top

    def _sift_up(self, idx):
        while idx > 0:
            parent = (idx - 1) // 2
            if self._data.get(parent) >= self._data.get(idx):
                break
            self._swap(parent, idx)
            idx = parent

    def _sift_down(self, idx):
        size = self._data.size()
        while True:
            left = idx * 2 + 1
            right = idx * 2 + 2
            largest = idx
            if left < size and self._data.get(left) > self._data.get(largest):
                largest = left
            if right < size and self._data.get(right) > self._data.get(largest):
                largest = right
            if largest == idx:
                break
            self._swap(idx, largest)
            idx = largest

    def _swap(self, i, j):
        temp = self._data.get(i)
        self._data.set(i, self._data.get(j))
        self._data.set(j, temp)
