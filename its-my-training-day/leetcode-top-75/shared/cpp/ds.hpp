#pragma once

#include <cstddef>
#include <stdexcept>
#include <string>

template <typename T>
class ArrayList {
public:
    ArrayList() : _size(0), _capacity(4) {
        _data = new T[_capacity];
    }

    ~ArrayList() {
        delete[] _data;
    }

    void add(const T& value) {
        if (_size >= _capacity) {
            grow();
        }
        _data[_size++] = value;
    }

    T get(std::size_t index) const {
        if (index >= _size) {
            throw std::out_of_range("index out of bounds");
        }
        return _data[index];
    }

    void set(std::size_t index, const T& value) {
        if (index >= _size) {
            throw std::out_of_range("index out of bounds");
        }
        _data[index] = value;
    }

    std::size_t size() const {
        return _size;
    }

    T removeLast() {
        if (_size == 0) {
            return T();
        }
        T value = _data[_size - 1];
        _size -= 1;
        return value;
    }

private:
    std::size_t _size;
    std::size_t _capacity;
    T* _data;

    void grow() {
        std::size_t newCapacity = _capacity * 2;
        T* newData = new T[newCapacity];
        for (std::size_t i = 0; i < _size; ++i) {
            newData[i] = _data[i];
        }
        delete[] _data;
        _data = newData;
        _capacity = newCapacity;
    }
};

template <typename T>
struct ListNode {
    T val;
    ListNode* next;
    ListNode(const T& v) : val(v), next(nullptr) {}
};

template <typename T>
class LinkedList {
public:
    LinkedList() : head(nullptr), tail(nullptr), _size(0) {}

    void addLast(const T& value) {
        ListNode<T>* node = new ListNode<T>(value);
        if (tail == nullptr) {
            head = node;
            tail = node;
        } else {
            tail->next = node;
            tail = node;
        }
        _size += 1;
    }

    bool empty() const {
        return _size == 0;
    }

    T removeFirst() {
        if (head == nullptr) {
            return T();
        }
        ListNode<T>* node = head;
        T value = node->val;
        head = head->next;
        if (head == nullptr) {
            tail = nullptr;
        }
        delete node;
        _size -= 1;
        return value;
    }

private:
    ListNode<T>* head;
    ListNode<T>* tail;
    std::size_t _size;
};

template <typename T>
class Stack {
public:
    void push(const T& value) {
        _items.add(value);
    }

    T pop() {
        return _items.removeLast();
    }

    T peek() const {
        if (_items.size() == 0) {
            return T();
        }
        return _items.get(_items.size() - 1);
    }

    bool empty() const {
        return _items.size() == 0;
    }

private:
    ArrayList<T> _items;
};

template <typename T>
class Queue {
public:
    void enqueue(const T& value) {
        _items.addLast(value);
    }

    T dequeue() {
        return _items.removeFirst();
    }

    bool empty() const {
        return _items.empty();
    }

private:
    LinkedList<T> _items;
};

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Graph {
public:
    Graph(int n) : _n(n), _adj(nullptr) {
        _adj = new ArrayList<int>[_n];
    }

    ~Graph() {
        delete[] _adj;
    }

    void addEdge(int u, int v) {
        _adj[u].add(v);
    }

    ArrayList<int>& neighbors(int u) {
        return _adj[u];
    }

private:
    int _n;
    ArrayList<int>* _adj;
};

template <typename T>
class MinHeap {
public:
    std::size_t size() const {
        return _data.size();
    }

    T peek() const {
        if (_data.size() == 0) {
            return T();
        }
        return _data.get(0);
    }

    void push(const T& value) {
        _data.add(value);
        siftUp(_data.size() - 1);
    }

    T pop() {
        if (_data.size() == 0) {
            return T();
        }
        T top = _data.get(0);
        T last = _data.removeLast();
        if (_data.size() > 0) {
            _data.set(0, last);
            siftDown(0);
        }
        return top;
    }

private:
    ArrayList<T> _data;

    void siftUp(std::size_t idx) {
        while (idx > 0) {
            std::size_t parent = (idx - 1) / 2;
            if (_data.get(parent) <= _data.get(idx)) {
                break;
            }
            swap(idx, parent);
            idx = parent;
        }
    }

    void siftDown(std::size_t idx) {
        std::size_t size = _data.size();
        while (true) {
            std::size_t left = idx * 2 + 1;
            std::size_t right = idx * 2 + 2;
            std::size_t smallest = idx;
            if (left < size && _data.get(left) < _data.get(smallest)) {
                smallest = left;
            }
            if (right < size && _data.get(right) < _data.get(smallest)) {
                smallest = right;
            }
            if (smallest == idx) {
                break;
            }
            swap(idx, smallest);
            idx = smallest;
        }
    }

    void swap(std::size_t i, std::size_t j) {
        T temp = _data.get(i);
        _data.set(i, _data.get(j));
        _data.set(j, temp);
    }
};

template <typename T>
class MaxHeap {
public:
    std::size_t size() const {
        return _data.size();
    }

    T peek() const {
        if (_data.size() == 0) {
            return T();
        }
        return _data.get(0);
    }

    void push(const T& value) {
        _data.add(value);
        siftUp(_data.size() - 1);
    }

    T pop() {
        if (_data.size() == 0) {
            return T();
        }
        T top = _data.get(0);
        T last = _data.removeLast();
        if (_data.size() > 0) {
            _data.set(0, last);
            siftDown(0);
        }
        return top;
    }

private:
    ArrayList<T> _data;

    void siftUp(std::size_t idx) {
        while (idx > 0) {
            std::size_t parent = (idx - 1) / 2;
            if (_data.get(parent) >= _data.get(idx)) {
                break;
            }
            swap(idx, parent);
            idx = parent;
        }
    }

    void siftDown(std::size_t idx) {
        std::size_t size = _data.size();
        while (true) {
            std::size_t left = idx * 2 + 1;
            std::size_t right = idx * 2 + 2;
            std::size_t largest = idx;
            if (left < size && _data.get(left) > _data.get(largest)) {
                largest = left;
            }
            if (right < size && _data.get(right) > _data.get(largest)) {
                largest = right;
            }
            if (largest == idx) {
                break;
            }
            swap(idx, largest);
            idx = largest;
        }
    }

    void swap(std::size_t i, std::size_t j) {
        T temp = _data.get(i);
        _data.set(i, _data.get(j));
        _data.set(j, temp);
    }
};
