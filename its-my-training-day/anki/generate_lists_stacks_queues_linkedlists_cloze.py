import os
import random

import genanki


MODEL_ID = random.randrange(1 << 30, 1 << 31)
DECK_ID = random.randrange(1 << 30, 1 << 31)


cloze_model = genanki.Model(
    MODEL_ID,
    "Cloze DS Model",
    fields=[
        {"name": "Text"},
        {"name": "Extra"},
    ],
    templates=[
        {
            "name": "Cloze Card",
            "qfmt": "{{cloze:Text}}",
            "afmt": "{{cloze:Text}}<hr>{{Extra}}",
        }
    ],
    model_type=genanki.Model.CLOZE,
)


deck = genanki.Deck(
    DECK_ID,
    "Data Structures Cloze: Lists, Stacks, Queues, Linked Lists",
)


cloze_cards = [
    # 1
    {
        "text": "Python lists store elements in {{c1::contiguous memory}}, enabling {{c2::O(1)}} random access.",
        "extra": "Array-style layout allows pointer arithmetic for index lookup.",
    },
    # 2
    {
        "text": "Dynamic array append is {{c1::amortized O(1)}} because capacity grows by {{c2::resizing}} in chunks.",
        "extra": "Occasional O(n) resize is spread across many inserts.",
    },
    # 3
    {
        "text": "Inserting into the middle of an array is {{c1::O(n)}} due to {{c2::shifting elements}} to the right.",
        "extra": "Shift cost grows with the number of trailing elements.",
    },
    # 4
    {
        "text": "Deleting from the middle of an array is {{c1::O(n)}} because elements must be {{c2::shifted left}}.",
        "extra": "Only deleting from the end is O(1).",
    },
    # 5
    {
        "text": "Array slicing like arr[a:b] creates a {{c1::new list}} and runs in {{c2::O(k)}} for k elements.",
        "extra": "Slicing is a shallow copy.",
    },
    # 6
    {
        "text": "The expression arr[:] returns a {{c1::shallow copy}} of the list, not a {{c2::view}}.",
        "extra": "Nested objects are still shared.",
    },
    # 7
    {
        "text": "Negative indices count from the {{c1::end}} of the list, so arr[-1] is the {{c2::last element}}.",
        "extra": "arr[-2] is the second to last element.",
    },
    # 8
    {
        "text": "Two pointers on a sorted array move {{c1::inward}} to find target sums in {{c2::O(n)}} time.",
        "extra": "Increase left for a larger sum, decrease right for a smaller sum.",
    },
    # 9
    {
        "text": "Removing duplicates from a sorted array uses {{c1::slow/fast pointers}} and runs in {{c2::O(n)}} time.",
        "extra": "Slow marks the next unique position.",
    },
    # 10
    {
        "text": "For the container-with-most-water problem, always move the {{c1::shorter}} pointer because it {{c2::limits the area}}.",
        "extra": "Moving the taller pointer cannot increase height.",
    },
    # 11
    {
        "text": "Dutch National Flag uses {{c1::three pointers}} (low, mid, high) to partition in {{c2::O(n)}} time.",
        "extra": "Do not advance mid after swapping with high.",
    },
    # 12
    {
        "text": "Sliding window runs in {{c1::O(n)}} because each element is added once and {{c2::removed once}}.",
        "extra": "The window expands with right and shrinks with left.",
    },
    # 13
    {
        "text": "Longest substring without repeats tracks {{c1::last seen index}} to jump the {{c2::left pointer}}.",
        "extra": "Prevents scanning characters twice.",
    },
    # 14
    {
        "text": "Minimum window substring uses a {{c1::formed counter}} so validity checks are {{c2::O(1)}}.",
        "extra": "Track counts for required characters.",
    },
    # 15
    {
        "text": "With negatives, longest subarray sum k uses {{c1::prefix sums}} and a {{c2::hash map}}.",
        "extra": "Look for current_sum - k in the map.",
    },
    # 16
    {
        "text": "A stack is {{c1::LIFO}}; push and pop are {{c2::O(1)}} operations.",
        "extra": "Access is restricted to the top element.",
    },
    # 17
    {
        "text": "Valid parentheses uses a stack to match {{c1::opening}} with {{c2::closing}} brackets.",
        "extra": "The stack must be empty at the end.",
    },
    # 18
    {
        "text": "A monotonic stack maintains {{c1::sorted order}} to answer next greater elements in {{c2::O(n)}}.",
        "extra": "Each index is pushed and popped at most once.",
    },
    # 19
    {
        "text": "Daily temperatures stores {{c1::indices}} of a decreasing stack and fills answer when a {{c2::warmer}} day appears.",
        "extra": "Distances come from current index minus previous index.",
    },
    # 20
    {
        "text": "Reverse Polish Notation evaluates by popping {{c1::two operands}}; order matters for {{c2::- and /}}.",
        "extra": "Use a stack of integers.",
    },
    # 21
    {
        "text": "Decoding k[...], on ']' pop until {{c1::'['}}, then repeat the substring {{c2::k times}}.",
        "extra": "A stack handles nesting depth.",
    },
    # 22
    {
        "text": "Asteroid collision uses a stack of {{c1::right-moving}} asteroids; collisions occur with {{c2::left-moving}} ones.",
        "extra": "Continue until current is destroyed or stack is clear.",
    },
    # 23
    {
        "text": "A queue is {{c1::FIFO}}; enqueue at {{c2::rear}} and dequeue from front.",
        "extra": "Opposite access discipline of a stack.",
    },
    # 24
    {
        "text": "Array-based queue dequeue is {{c1::O(n)}} because elements {{c2::shift left}}.",
        "extra": "Avoid shifting by using a head index or circular buffer.",
    },
    # 25
    {
        "text": "Two-stack queue is {{c1::amortized O(1)}} since each element moves at most {{c2::twice}}.",
        "extra": "Transfer only when output stack is empty.",
    },
    # 26
    {
        "text": "Circular queue uses modulo: new_index = {{c1::(index + 1) % capacity}} to {{c2::wrap around}}.",
        "extra": "Track size to distinguish full from empty.",
    },
    # 27
    {
        "text": "BFS processes nodes level by level using a {{c1::queue}} and a {{c2::level_size}} loop.",
        "extra": "Level size isolates each depth for per-level logic.",
    },
    # 28
    {
        "text": "Linked list nodes are {{c1::non-contiguous}} in memory, so random access is {{c2::O(n)}}.",
        "extra": "Must traverse from the head.",
    },
    # 29
    {
        "text": "In a singly linked list, inserting at the {{c1::head}} is {{c2::O(1)}}.",
        "extra": "No traversal needed when head pointer is known.",
    },
    # 30
    {
        "text": "Reversing a linked list iteratively uses {{c1::prev, curr, next}} pointers and runs in {{c2::O(n)}}.",
        "extra": "Reverse each link one by one.",
    },
    # 31
    {
        "text": "Fast/slow pointers find the middle because fast moves {{c1::2x}} as fast as slow.",
        "extra": "When fast hits the end, slow is at mid.",
    },
    # 32
    {
        "text": "Cycle detection (Floyd) works because in a cycle fast gains {{c1::1 step}} per iteration, so {{c2::they meet}}.",
        "extra": "If no cycle, fast reaches None.",
    },
    # 33
    {
        "text": "To find cycle start, reset one pointer to {{c1::head}} and move both {{c2::one step}}.",
        "extra": "They meet at the entry point.",
    },
    # 34
    {
        "text": "Remove nth from end by keeping a {{c1::gap of n+1}} between fast and slow, using a {{c2::dummy node}}.",
        "extra": "Slow lands just before the target.",
    },
    # 35
    {
        "text": "Merge two sorted lists with a {{c1::dummy head}} to avoid special cases for the {{c2::first node}}.",
        "extra": "Advance the pointer with the smaller value.",
    },
    # 36
    {
        "text": "Palindrome list: find middle, {{c1::reverse second half}}, then {{c2::compare halves}}.",
        "extra": "Optional restore by reversing again.",
    },
    # 37
    {
        "text": "Reorder list L0->Ln->L1... uses {{c1::find middle}}, {{c2::reverse second half}}, then merge.",
        "extra": "Combines multiple linked list patterns.",
    },
    # 38
    {
        "text": "Add two numbers as lists by tracking {{c1::carry}} while traversing both lists until {{c2::exhausted}}.",
        "extra": "Process least significant digits first.",
    },
    # 39
    {
        "text": "Merge sort suits linked lists because it avoids {{c1::random access}} and merges in {{c2::O(1) space}}.",
        "extra": "Split with fast/slow and merge sorted halves.",
    },
    # 40
    {
        "text": "Reverse k-group first checks there are {{c1::k nodes}}; otherwise leave the tail {{c2::unchanged}}.",
        "extra": "Prevents partial reversal.",
    },
    # 41
    {
        "text": "Rotate list by k: connect tail to head to form a {{c1::cycle}}, then break at {{c2::length - k}}.",
        "extra": "Use k % length to optimize large k.",
    },
    # 42
    {
        "text": "Array access arr[i] uses {{c1::base + i * size}} to compute {{c2::address}}.",
        "extra": "Pointer arithmetic enables O(1) indexing.",
    },
    # 43
    {
        "text": "Appending to an array may trigger {{c1::resize}} which copies all elements in {{c2::O(n)}}.",
        "extra": "This happens infrequently.",
    },
    # 44
    {
        "text": "A list pop from the end is {{c1::O(1)}}, while pop from the middle is {{c2::O(n)}}.",
        "extra": "Middle removal shifts elements.",
    },
    # 45
    {
        "text": "Two pointers for sorted two-sum: if sum &lt; target move {{c1::left}}; if sum &gt; target move {{c2::right}}.",
        "extra": "Sorted order enables monotonic adjustments.",
    },
    # 46
    {
        "text": "Sliding window for fixed size k updates sum by {{c1::add right}} and {{c2::subtract left}}.",
        "extra": "Avoid recomputing the whole window.",
    },
    # 47
    {
        "text": "A deque supports {{c1::O(1)}} insertions/removals at {{c2::both ends}}.",
        "extra": "Useful for window max/min with indices.",
    },
    # 48
    {
        "text": "Monotonic queue for window max keeps values in {{c1::decreasing}} order and drops out-of-window {{c2::indices}}.",
        "extra": "Front holds the current maximum.",
    },
    # 49
    {
        "text": "Balanced parentheses: when a closing bracket appears, it must match the {{c1::top}} of the {{c2::stack}}.",
        "extra": "Otherwise the string is invalid.",
    },
    # 50
    {
        "text": "Stack-based DFS pushes neighbors and marks {{c1::visited}} to avoid {{c2::cycles}}.",
        "extra": "Works similarly to recursive DFS.",
    },
    # 51
    {
        "text": "Queue-based BFS guarantees {{c1::shortest path}} in unweighted graphs because it explores by {{c2::levels}}.",
        "extra": "Each edge is processed at most twice.",
    },
    # 52
    {
        "text": "Linked list deletion needs access to the {{c1::previous node}} to update its {{c2::next}} pointer.",
        "extra": "Use a dummy node to simplify head removal.",
    },
    # 53
    {
        "text": "Detect intersection of two linked lists by aligning lengths and advancing the {{c1::longer}} list by {{c2::diff}}.",
        "extra": "Then move both pointers together.",
    },
    # 54
    {
        "text": "Another intersection method: pointer A goes to {{c1::headB}} at end, pointer B to {{c2::headA}}.",
        "extra": "They meet at intersection or None.",
    },
    # 55
    {
        "text": "Remove duplicates from a sorted linked list by skipping nodes where current.val {{c1::== next.val}}.",
        "extra": "Only one pass needed.",
    },
    # 56
    {
        "text": "Partition list around x by building {{c1::before}} and {{c2::after}} lists and concatenating.",
        "extra": "Preserves relative order within each partition.",
    },
    # 57
    {
        "text": "Find kth from end using two pointers with a {{c1::k}} node gap; when fast hits end, slow is at {{c2::kth}}.",
        "extra": "Same pattern as remove nth from end.",
    },
    # 58
    {
        "text": "In a circular queue, empty is when size == {{c1::0}}, full is when size == {{c2::capacity}}.",
        "extra": "Size avoids ambiguity between front and rear.",
    },
    # 59
    {
        "text": "A stack can be implemented with a list using append as {{c1::push}} and pop as {{c2::pop}}.",
        "extra": "Both operations are O(1).",
    },
    # 60
    {
        "text": "For queue with head index, memory can grow because old items are not {{c1::removed}}; occasionally {{c2::compact}}.",
        "extra": "Circular buffer avoids this issue.",
    },
    # 61
    {
        "text": "In BFS level order, process exactly {{c1::level_size}} nodes to keep level boundaries {{c2::intact}}.",
        "extra": "Enqueue children as you go.",
    },
    # 62
    {
        "text": "An array of objects uses {{c1::references}}; copying the array does not {{c2::clone}} the objects.",
        "extra": "Shallow copy shares inner objects.",
    },
    # 63
    {
        "text": "When reversing k nodes, the original head becomes the {{c1::tail}} of that group and should point to the {{c2::next group}}.",
        "extra": "Connect groups carefully.",
    },
    # 64
    {
        "text": "In decode-string, numbers may be {{c1::multiple digits}}; read them until a {{c2::non-digit}}.",
        "extra": "Supports patterns like 12[ab].",
    },
    # 65
    {
        "text": "Monotonic stack for next smaller keeps elements in {{c1::increasing}} order, popping while current is {{c2::smaller}}.",
        "extra": "Mirror of next greater pattern.",
    },
    # 66
    {
        "text": "In two-sum sorted, once left meets right, the search is {{c1::complete}} because all pairs have been {{c2::tested}}.",
        "extra": "Pointers move monotonically.",
    },
    # 67
    {
        "text": "Sliding window max with deque stores {{c1::indices}} so you can drop items that are {{c2::out of window}}.",
        "extra": "Front is always the max index.",
    },
    # 68
    {
        "text": "Linked list insertion after a node is {{c1::O(1)}} once the node is found; finding it is {{c2::O(n)}}.",
        "extra": "Traversal dominates cost.",
    },
    # 69
    {
        "text": "Deleting a node with only its pointer (no head) copies value from {{c1::next}} and bypasses {{c2::next.next}}.",
        "extra": "Cannot delete the tail this way.",
    },
    # 70
    {
        "text": "A stack can track minimum by storing pairs of {{c1::value}} and {{c2::current min}}.",
        "extra": "Min retrieval is O(1).",
    },
    # 71
    {
        "text": "Queue using two stacks: on dequeue, if output stack is empty, {{c1::transfer}} all elements from input, reversing {{c2::order}}.",
        "extra": "Maintains FIFO behavior.",
    },
    # 72
    {
        "text": "Time complexity of BFS on adjacency list is {{c1::O(V+E)}} because each vertex and edge is {{c2::processed once}}.",
        "extra": "Queue operations are O(1).",
    },
    # 73
    {
        "text": "List resizing often doubles capacity to keep amortized insertions at {{c1::O(1)}} with a constant {{c2::growth factor}}.",
        "extra": "Common strategy in dynamic arrays.",
    },
    # 74
    {
        "text": "For a palindrome list, if you reverse the second half, comparison only needs {{c1::half}} the nodes and remains {{c2::O(n)}}.",
        "extra": "Early exit on mismatch.",
    },
    # 75
    {
        "text": "In a singly linked list, to remove head safely, use a {{c1::dummy}} node and return {{c2::dummy.next}}.",
        "extra": "Simplifies edge cases.",
    },
]


if len(cloze_cards) < 75:
    raise ValueError(f"Need at least 75 cards, got {len(cloze_cards)}")


for card in cloze_cards:
    note = genanki.Note(
        model=cloze_model,
        fields=[card["text"], card["extra"]],
    )
    deck.add_note(note)


output_path = os.path.join(
    os.path.dirname(__file__),
    "lists_stacks_queues_linkedlists_cloze.apkg",
)
package = genanki.Package(deck)
package.write_to_file(output_path)

print("Anki deck created.")
print(f"Total cards: {len(cloze_cards)}")
print(f"File: {output_path}")
