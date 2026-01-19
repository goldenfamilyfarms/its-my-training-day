# Solution: LRU Cache Implementation

## Metadata
- **Problem**: [lru-cache-problem.md](./lru-cache-problem.md)
- **Difficulty**: intermediate
- **Time to Solve**: 20-25 minutes

## Approach

### Problem Analysis

Key observations:
- Need O(1) lookup → requires a hash map
- Need O(1) ordering/reordering → requires a linked list
- Need to track "least recently used" → doubly linked list with head/tail pointers
- Combining dict + doubly linked list gives us both properties

Clarifying questions to ask:
- What should `get` return for missing keys? (-1 or None?)
- Should `put` update the value if key exists? (Yes)
- Are keys always integers? (Assume hashable)

### Solution Strategy

1. Create a doubly linked list node class to store key-value pairs
2. Maintain a dict mapping keys to nodes for O(1) lookup
3. Use dummy head/tail nodes to simplify edge cases
4. Most recent items go after head, least recent before tail
5. On access: move node to front
6. On eviction: remove node before tail

### Why This Approach?

- Dict provides O(1) key lookup
- Doubly linked list provides O(1) insertion/deletion when you have the node reference
- Dummy nodes eliminate null checks for head/tail operations
- This is the standard solution used in production caches

## Solution Code

```python
class ListNode:
    """Doubly linked list node storing key-value pair."""
    
    def __init__(self, key: int = 0, value: int = 0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses a hash map for O(1) lookup and a doubly linked list
    for O(1) ordering. Most recently used items are at the front
    (after head), least recently used at the back (before tail).
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> ListNode
        
        # Dummy head and tail nodes to simplify edge cases
        self.head = ListNode()
        self.tail = ListNode()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: ListNode) -> None:
        """Remove a node from the linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _add_to_front(self, node: ListNode) -> None:
        """Add a node right after head (most recently used position)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: ListNode) -> None:
        """Move existing node to front (mark as recently used)."""
        self._remove(node)
        self._add_to_front(node)
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if not found.
        Marks the key as recently used.
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)  # Mark as recently used
        return node.value
    
    def put(self, key: int, value: int) -> None:
        """
        Insert or update key-value pair.
        Evicts least recently used item if at capacity.
        """
        if key in self.cache:
            # Update existing key
            node = self.cache[key]
            node.value = value
            self._move_to_front(node)
        else:
            # Insert new key
            if len(self.cache) >= self.capacity:
                # Evict least recently used (node before tail)
                lru_node = self.tail.prev
                self._remove(lru_node)
                del self.cache[lru_node.key]
            
            # Add new node
            new_node = ListNode(key, value)
            self.cache[key] = new_node
            self._add_to_front(new_node)
```

## Code Walkthrough

### Key Components

1. **ListNode class** (lines 1-9)
   - Stores key (needed for eviction to delete from dict), value, prev/next pointers
   - Default values simplify dummy node creation

2. **Dummy head/tail** (lines 25-29)
   - Eliminates null checks in add/remove operations
   - Head.next is always the most recently used real node
   - Tail.prev is always the least recently used real node

3. **Helper methods** (lines 31-44)
   - `_remove`: Unlinks a node from the list in O(1)
   - `_add_to_front`: Inserts after head in O(1)
   - `_move_to_front`: Combines remove + add for reordering

4. **get operation** (lines 46-55)
   - O(1) dict lookup
   - Moves accessed node to front
   - Returns -1 for missing keys

5. **put operation** (lines 57-75)
   - Handles update vs insert cases
   - Evicts LRU (tail.prev) when at capacity
   - Stores key in node so we can delete from dict during eviction

### Edge Cases Handled

- **Capacity of 1**: Works because we always evict before insert when full
- **Key update**: Updates value and moves to front without eviction
- **Empty cache get**: Returns -1 without error
- **Repeated access**: Correctly reorders without duplicates

## Complexity Analysis

### Time Complexity
- **get**: O(1)
  - Dict lookup: O(1)
  - Move to front (remove + add): O(1)
  
- **put**: O(1)
  - Dict lookup/insert: O(1)
  - Eviction (remove + dict delete): O(1)
  - Add to front: O(1)

### Space Complexity
- **Overall**: O(capacity)
- **Breakdown**:
  - Dict with up to `capacity` entries: O(capacity)
  - Linked list with up to `capacity` nodes: O(capacity)
  - Two dummy nodes: O(1)

## Alternative Approaches

### Approach 2: Using OrderedDict

```python
from collections import OrderedDict

class LRUCacheSimple:
    """Simplified LRU using Python's OrderedDict."""
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Remove first item (least recently used)
            self.cache.popitem(last=False)
```

- **Time**: O(1) for both operations
- **Space**: O(capacity)
- **Trade-offs**: Much simpler code, but relies on Python-specific data structure. In interviews, you may be asked to implement without OrderedDict to demonstrate understanding.

### Approach 3: Using functools.lru_cache (Decorator)

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(arg):
    # Automatically cached with LRU eviction
    return compute(arg)
```

- **Trade-offs**: Only works for function memoization, not general key-value storage. Good to mention as a Python built-in.

## Interview Tips

### How to Present This Solution

1. Start by clarifying the O(1) requirement—this rules out simple approaches
2. Explain why you need two data structures (dict for lookup, list for ordering)
3. Draw the linked list structure with dummy nodes before coding
4. Implement helper methods first, then the main operations
5. Walk through an example to verify correctness

### Common Follow-up Questions

1. **Q**: How would you make this thread-safe?
   **A**: Add a lock (threading.Lock) around get/put operations, or use a read-write lock for better concurrency on reads.

2. **Q**: How would you add TTL (time-to-live) for entries?
   **A**: Store timestamp in each node, check expiration on get, and optionally run a background cleanup thread.

3. **Q**: What if you need to support `delete(key)`?
   **A**: Look up node in dict, call `_remove(node)`, delete from dict. O(1).

### Mistakes to Avoid

- Forgetting to store the key in the node (needed for eviction)
- Not handling the "update existing key" case in put
- Using a singly linked list (can't remove in O(1) without prev pointer)
- Forgetting to update the dict when evicting

## Related Problems

- [LFU Cache](./lfu-cache-problem.md) (coming soon) - Evict least frequently used
- [Design Twitter](./design-twitter-problem.md) (coming soon) - Uses similar patterns

## References

- [LeetCode 146: LRU Cache](https://leetcode.com/problems/lru-cache/)
- [Python OrderedDict Documentation](https://docs.python.org/3/library/collections.html#collections.OrderedDict)
