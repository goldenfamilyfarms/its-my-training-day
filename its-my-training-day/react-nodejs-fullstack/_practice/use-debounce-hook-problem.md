# Practice Exercise: Custom useDebounce Hook

## Metadata
- **Related Study Guide**: [react-hooks-study-guide](../fundamentals/react-hooks-study-guide.md)
- **Track**: react-nodejs-fullstack
- **Difficulty**: intermediate
- **Time Limit**: 25 minutes
- **Type**: coding

## Problem Statement

Implement a custom React hook called `useDebounce` that delays updating a value until a specified amount of time has passed since the last change. This is commonly used for search inputs to avoid making API calls on every keystroke.

Your hook should accept a value and a delay (in milliseconds), and return the debounced value that only updates after the user stops changing the input for the specified delay period.

## Requirements

### Functional Requirements
- Accept any value type (string, number, object, etc.)
- Accept a delay parameter in milliseconds
- Return the debounced value
- Update the debounced value only after the delay has passed with no new changes
- Cancel pending updates when the component unmounts

### Non-Functional Requirements
- Must be a reusable custom hook
- Should handle rapid value changes efficiently
- Must clean up timers to prevent memory leaks

## Constraints

- Must use React hooks (useState, useEffect)
- Cannot use external debounce libraries (lodash, etc.)
- Should work with React 18+

## Input/Output Examples

### Example 1: Search Input
**Usage:**
```tsx
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearch) {
      // API call only happens 500ms after user stops typing
      fetchSearchResults(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return <input onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

**Behavior:**
- User types "react" quickly (r-e-a-c-t in 200ms)
- API call is made once with "react" after 500ms of no typing
- Not 5 separate API calls for each letter

### Example 2: Window Resize
**Usage:**
```tsx
function ResizeHandler() {
  const [windowSize, setWindowSize] = useState(window.innerWidth);
  const debouncedSize = useDebounce(windowSize, 300);
  
  // Expensive layout calculation only runs after resize stops
  useEffect(() => {
    recalculateLayout(debouncedSize);
  }, [debouncedSize]);
}
```

## Hints (Optional)

<details>
<summary>Hint 1: Getting Started</summary>

You'll need two pieces of state management:
1. `useState` to store the debounced value
2. `useEffect` to handle the timing logic

Think about what should trigger the effect to run.

</details>

<details>
<summary>Hint 2: Key Insight</summary>

The core pattern is:
1. When the value changes, set a timer
2. If the value changes again before the timer fires, cancel the old timer and set a new one
3. When the timer fires, update the debounced value

`setTimeout` returns an ID you can use with `clearTimeout`.

</details>

<details>
<summary>Hint 3: Cleanup Pattern</summary>

The `useEffect` cleanup function is perfect for this:

```tsx
useEffect(() => {
  // Set up timer
  const timer = setTimeout(() => {
    // Update debounced value
  }, delay);
  
  // Cleanup: cancel timer
  return () => clearTimeout(timer);
}, [value, delay]);
```

</details>

## Evaluation Criteria

- [ ] Correctness: Hook returns debounced value after specified delay
- [ ] Code Quality: Clean, readable implementation following React conventions
- [ ] Efficiency: Properly cancels pending timers on value change
- [ ] Edge Cases: Handles component unmount, zero delay, undefined values
- [ ] Explanation: Can explain why cleanup is necessary and how debouncing works

---

**When you're ready, check your solution against:** [use-debounce-hook-solution.md](./use-debounce-hook-solution.md)
