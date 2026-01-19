# Practice Exercise: LRU Cache Implementation

## Metadata
- **Related Study Guide**: [python-decorators-study-guide](../fundamentals/python-decorators-study-guide.md)
- **Track**: python-backend
- **Difficulty**: intermediate
- **Time Limit**: 30 minutes
- **Type**: coding

## Problem Statement

Design and implement a Least Recently Used (LRU) Cache. This is a classic data structure interview question that tests your understanding of hash maps, linked lists, and cache eviction policies.

An LRU Cache should support the following operations:
- `get(key)`: Return the value if the key exists, otherwise return -1
- `put(key, value)`: Insert or update the value. If the cache reaches capacity, evict the least recently used item before inserting.

Both operations must run in O(1) average time complexity.

## Requirements

### Functional Requirements
- Initialize the cache with a positive capacity
- `get(key)` returns the value and marks the key as recently used
- `put(key, value)` inserts/updates and marks as recently used
- When capacity is exceeded, evict the least recently used item
- Handle edge cases (capacity of 1, updating existing keys)

### Non-Functional Requirements
- O(1) time complexity for both get and put operations
- Clean, Pythonic implementation
- Should work with any hashable key type

## Constraints

- 1 <= capacity <= 3000
- 0 <= key <= 10^4
- 0 <= value <= 10^5
- At most 2 * 10^5 calls to get and put

## Input/Output Examples

### Example 1
**Input:**
```python
cache = LRUCache(2)  # capacity = 2

cache.put(1, 1)      # cache: {1=1}
cache.put(2, 2)      # cache: {1=1, 2=2}
cache.get(1)         # returns 1, cache: {2=2, 1=1} (1 is now most recent)
cache.put(3, 3)      # evicts key 2, cache: {1=1, 3=3}
cache.get(2)         # returns -1 (not found)
cache.put(4, 4)      # evicts key 1, cache: {3=3, 4=4}
cache.get(1)         # returns -1 (not found)
cache.get(3)         # returns 3
cache.get(4)         # returns 4
```

**Output:**
```
1
-1
-1
3
4
```

### Example 2: Capacity of 1
**Input:**
```python
cache = LRUCache(1)
cache.put(1, 1)
cache.put(2, 2)      # evicts 1
cache.get(1)         # returns -1
cache.get(2)         # returns 2
```

**Output:**
```
-1
2
```

## Hints (Optional)

<details>
<summary>Hint 1: Getting Started</summary>

Think about what data structures give you O(1) access:
- Hash map (dict): O(1) lookup by key
- But how do you track "least recently used" in O(1)?

You need to combine two data structures.

</details>

<details>
<summary>Hint 2: Key Insight</summary>

A doubly linked list lets you:
- Remove any node in O(1) if you have a reference to it
- Add to head/tail in O(1)

If you store nodes in a dict, you get O(1) lookup AND O(1) reordering.

The pattern: `dict[key] -> linked list node`

</details>

<details>
<summary>Hint 3: Algorithm Pattern</summary>

Use a doubly linked list where:
- Head = most recently used
- Tail = least recently used

For `get(key)`:
1. Look up node in dict
2. Move node to head (mark as recently used)
3. Return value

For `put(key, value)`:
1. If key exists: update value, move to head
2. If new key: create node, add to head, add to dict
3. If over capacity: remove tail node, delete from dict

</details>

## Evaluation Criteria

- [ ] Correctness: All operations work as specified
- [ ] Code Quality: Clean implementation with clear variable names
- [ ] Efficiency: O(1) time complexity for get and put
- [ ] Edge Cases: Handles capacity=1, key updates, empty cache
- [ ] Explanation: Can explain why this achieves O(1) complexity

---

**When you're ready, check your solution against:** [lru-cache-solution.md](./lru-cache-solution.md)
