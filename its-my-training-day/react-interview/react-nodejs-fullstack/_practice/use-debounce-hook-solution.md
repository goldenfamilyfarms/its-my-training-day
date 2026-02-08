# Solution: Custom useDebounce Hook

## Metadata
- **Problem**: [use-debounce-hook-problem.md](./use-debounce-hook-problem.md)
- **Difficulty**: intermediate
- **Time to Solve**: 15-20 minutes

## Approach

### Problem Analysis

Key observations:
- We need to delay state updates, not prevent them entirely
- Each new value should reset the delay timer
- Memory leaks from orphaned timers must be prevented
- This is a classic "trailing debounce" pattern

Clarifying questions to ask in an interview:
- Should the debounced value update immediately on first change, or wait for the delay? (Answer: wait)
- Should we support a "leading" option that fires immediately then debounces? (Answer: not for this basic version)
- What should happen if delay is 0? (Answer: behave like no debounce)

### Solution Strategy

1. Store the debounced value in state
2. Use an effect that runs when the input value changes
3. Set a timer to update the debounced value after the delay
4. Clean up the timer if value changes before it fires or component unmounts

### Why This Approach?

- Uses React's built-in cleanup mechanism for proper resource management
- Leverages the effect dependency array to automatically handle value changes
- Simple and composable—can be used with any value type

## Solution Code

```typescript
import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value.
 * Returns the debounced value that only updates after the specified delay
 * has passed without the value changing.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: cancel the timer if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
}

export default useDebounce;
```

## Code Walkthrough

### Key Components

1. **State initialization** (line 14)
   - Initialize `debouncedValue` with the initial `value`
   - This ensures the hook returns something immediately, not undefined

2. **Effect setup** (lines 16-25)
   - Creates a new timer each time `value` or `delay` changes
   - Timer callback updates the debounced state after the delay

3. **Cleanup function** (lines 22-24)
   - Cancels the pending timer when:
     - The value changes (effect re-runs, cleanup runs first)
     - The component unmounts
   - Prevents memory leaks and stale updates

### Edge Cases Handled

- **Rapid changes**: Each change cancels the previous timer, only the last value propagates
- **Component unmount**: Cleanup prevents setState on unmounted component
- **Zero delay**: Timer fires immediately (setTimeout with 0 still defers to next tick)
- **Generic types**: Works with any value type thanks to TypeScript generics

## Complexity Analysis

### Time Complexity
- **Overall**: O(1) per value change
- **Breakdown**:
  - setTimeout/clearTimeout: O(1)
  - State updates: O(1)

### Space Complexity
- **Overall**: O(1)
- **Breakdown**:
  - One timer reference: O(1)
  - One state value: O(1)

## Alternative Approaches

### Approach 2: Using useRef for Timer

```typescript
import { useState, useEffect, useRef } from 'react';

function useDebounceWithRef<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
```

- **Time**: O(1)
- **Space**: O(1)
- **Trade-offs**: More explicit timer management, useful if you need to access the timer elsewhere. The cleanup-based approach is cleaner for this use case.

### Approach 3: With Leading Edge Option

```typescript
function useDebounceAdvanced<T>(
  value: T, 
  delay: number, 
  options: { leading?: boolean } = {}
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (options.leading && isFirstRender.current) {
      setDebouncedValue(value);
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, options.leading]);

  return debouncedValue;
}
```

This version fires immediately on first change, then debounces subsequent changes.

## Interview Tips

### How to Present This Solution

1. Start by explaining what debouncing is and why it's useful (API calls, performance)
2. Sketch out the hook signature before implementing
3. Explain the cleanup pattern—interviewers love seeing you handle edge cases
4. Mention that this is a "trailing" debounce and ask if they want "leading" behavior

### Common Follow-up Questions

1. **Q**: How would you add a "leading" option that fires immediately?
   **A**: Track if it's the first render with useRef, update immediately on first change, then debounce subsequent changes.

2. **Q**: What's the difference between debounce and throttle?
   **A**: Debounce waits for a pause in events, throttle limits to one event per time period. Debounce is better for search inputs, throttle for scroll handlers.

3. **Q**: How would you test this hook?
   **A**: Use React Testing Library with `renderHook`, fake timers (`jest.useFakeTimers`), and `act()` to advance time.

### Mistakes to Avoid

- Forgetting the cleanup function (causes memory leaks and React warnings)
- Not including `delay` in the dependency array (stale closure)
- Using `setInterval` instead of `setTimeout` (wrong pattern)
- Initializing state as `undefined` instead of the initial value

## Related Problems

- [Custom useThrottle Hook](./use-throttle-hook-problem.md) (coming soon)
- [Custom useFetch with Debounced Search](./use-fetch-debounced-problem.md) (coming soon)

## References

- [React useEffect Documentation](https://react.dev/reference/react/useEffect)
- [Debouncing and Throttling Explained](https://css-tricks.com/debouncing-throttling-explained-examples/)
