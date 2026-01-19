# Study Guide: React Hooks

## Metadata
- **Track**: react-nodejs-fullstack
- **Subdomain**: fundamentals
- **Difficulty**: intermediate
- **Target Roles**: Frontend Engineer, Full Stack Engineer, React Developer
- **Source JD**: N/A
- **Estimated Time**: 90 minutes
- **Created**: 2024-01-15
- **Last Modified**: 2024-01-15

## Overview

React Hooks revolutionized how we write React components by enabling state and lifecycle features in functional components. Understanding hooks deeply is essential for any React interview—interviewers expect senior candidates to explain not just how to use hooks, but why they work the way they do, common pitfalls, and advanced patterns.

---

## Questions

### Q1: Can you explain the rules of hooks and why they exist?

**Answer:**

React enforces two fundamental rules for hooks:

1. **Only call hooks at the top level** - Never call hooks inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - Call hooks from functional components or custom hooks, not regular JavaScript functions

These rules exist because React relies on the **order of hook calls** to associate state with the correct hook. React maintains an internal list of hooks for each component, and it uses the call order to match state values between renders.

```javascript
// ❌ Bad - conditional hook call
function MyComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // Breaks on re-render!
  }
  const [count, setCount] = useState(0);
}

// ✅ Good - hooks at top level
function MyComponent({ isLoggedIn }) {
  const [user, setUser] = useState(null);
  const [count, setCount] = useState(0);
  
  // Use conditional logic inside the component body instead
  useEffect(() => {
    if (isLoggedIn) {
      fetchUser().then(setUser);
    }
  }, [isLoggedIn]);
}
```

If you call hooks conditionally, the order changes between renders, causing React to associate the wrong state with the wrong hook.

**Key Concepts:**
- **Hook call order**: React uses array indices internally to track hooks
- **Consistent rendering**: Same hooks must be called in same order every render
- **ESLint plugin**: `eslint-plugin-react-hooks` enforces these rules automatically

**Follow-up Questions:**
1. What happens internally when you violate the rules of hooks?
2. How does the ESLint plugin detect hook rule violations?
3. Can you call a hook inside a callback function? Why or why not?

---

### Q2: What's the difference between useState and useReducer? When would you choose one over the other?

**Answer:**

Both manage state, but they're optimized for different scenarios:

**useState** is ideal for:
- Simple, independent state values
- State that doesn't have complex update logic
- When state updates don't depend on previous state in complex ways

**useReducer** is better for:
- Complex state objects with multiple sub-values
- State transitions that depend on the previous state
- When you want to centralize update logic
- When state updates are triggered from deep in the component tree

```javascript
// useState - simple counter
const [count, setCount] = useState(0);
const increment = () => setCount(prev => prev + 1);

// useReducer - complex form state
const initialState = { name: '', email: '', errors: {}, isSubmitting: false };

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return initialState;
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(formReducer, initialState);
```

A key advantage of useReducer is **testability**—the reducer is a pure function you can unit test independently of React.

**Key Concepts:**
- **Reducer pattern**: (state, action) => newState, borrowed from Redux
- **Dispatch stability**: dispatch function identity is stable across renders
- **State colocation**: Related state logic lives together in the reducer

**Follow-up Questions:**
1. Can you use useReducer with useContext to create a Redux-like pattern?
2. How does useReducer handle async operations?
3. What are the performance implications of useState vs useReducer?

---

### Q3: Explain the useEffect cleanup function. When does it run and why is it important?

**Answer:**

The cleanup function is returned from useEffect and handles resource cleanup to prevent memory leaks and stale operations:

```javascript
useEffect(() => {
  // Setup: runs after render
  const subscription = dataSource.subscribe(handleChange);
  
  // Cleanup: returned function
  return () => {
    subscription.unsubscribe();
  };
}, [dataSource]);
```

**When cleanup runs:**
1. **Before the effect runs again** (when dependencies change)
2. **When the component unmounts**

This is crucial for:
- Canceling network requests
- Unsubscribing from subscriptions
- Clearing timers/intervals
- Removing event listeners

```javascript
// Common pattern: canceling fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
      }
    }
  }
  
  fetchData();
  
  return () => controller.abort();
}, [url]);
```

Without cleanup, you risk:
- Memory leaks from orphaned subscriptions
- State updates on unmounted components (React warning)
- Race conditions from stale async operations

**Key Concepts:**
- **Effect lifecycle**: mount → update → cleanup → update → cleanup → unmount
- **Closure capture**: Cleanup closes over values from its render
- **AbortController**: Modern way to cancel fetch requests

**Follow-up Questions:**
1. What happens if you forget to clean up a setInterval?
2. How do you handle cleanup for async operations that can't be cancelled?
3. Why does React warn about state updates on unmounted components?

---

### Q4: What is the useCallback hook and how does it relate to React.memo?

**Answer:**

`useCallback` memoizes a function reference, returning the same function instance between renders unless dependencies change:

```javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

This is primarily useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders.

**The connection to React.memo:**

```javascript
// Child component wrapped in memo
const ExpensiveList = React.memo(({ items, onItemClick }) => {
  console.log('ExpensiveList rendered');
  return items.map(item => (
    <div key={item.id} onClick={() => onItemClick(item.id)}>
      {item.name}
    </div>
  ));
});

// Parent component
function Parent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([...]);
  
  // ❌ Without useCallback - new function every render
  // ExpensiveList re-renders even when items haven't changed
  const handleClick = (id) => console.log(id);
  
  // ✅ With useCallback - stable function reference
  const handleClick = useCallback((id) => {
    console.log(id);
  }, []);
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveList items={items} onItemClick={handleClick} />
    </>
  );
}
```

**Important caveat:** Don't use useCallback everywhere! It has overhead. Only use it when:
1. Passing callbacks to memoized children
2. The callback is a dependency of another hook
3. You've measured a performance problem

**Key Concepts:**
- **Referential equality**: `{} !== {}` but memoized values maintain identity
- **Dependency array**: Function is recreated when dependencies change
- **Premature optimization**: useCallback has cost; measure before using

**Follow-up Questions:**
1. What's the difference between useCallback and useMemo?
2. When would useCallback actually hurt performance?
3. How do you handle callbacks that need access to current state without adding it to dependencies?

---

### Q5: How do you create a custom hook and what are the best practices?

**Answer:**

Custom hooks extract reusable stateful logic into functions. They must start with "use" and can call other hooks:

```javascript
// Custom hook for form input handling
function useInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);
  
  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  return {
    value,
    onChange: handleChange,
    reset,
  };
}

// Usage
function LoginForm() {
  const email = useInput('');
  const password = useInput('');
  
  return (
    <form>
      <input type="email" {...email} />
      <input type="password" {...password} />
      <button type="button" onClick={() => {
        email.reset();
        password.reset();
      }}>Clear</button>
    </form>
  );
}
```

**Best practices:**

1. **Name starts with "use"** - Required for hook rules enforcement
2. **Single responsibility** - Each hook does one thing well
3. **Return consistent shape** - Object for multiple values, tuple for simple cases
4. **Handle cleanup** - If your hook sets up subscriptions, clean them up
5. **Document dependencies** - Make clear what the hook depends on

```javascript
// More complex example: data fetching hook
function useFetch(url) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  
  useEffect(() => {
    const controller = new AbortController();
    
    setState(s => ({ ...s, loading: true, error: null }));
    
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') {
          setState({ data: null, loading: false, error });
        }
      });
    
    return () => controller.abort();
  }, [url]);
  
  return state;
}
```

**Key Concepts:**
- **Logic extraction**: Move stateful logic out of components
- **Composition**: Custom hooks can use other custom hooks
- **Testing**: Custom hooks can be tested with @testing-library/react-hooks

**Follow-up Questions:**
1. How do you test custom hooks?
2. Can custom hooks return JSX?
3. How do you share state between components using custom hooks?

---

### Q6: What are the common pitfalls with the useEffect dependency array?

**Answer:**

The dependency array is one of the most error-prone aspects of hooks. Common pitfalls include:

**1. Missing dependencies (stale closures):**
```javascript
// ❌ Bug: count is stale, always logs initial value
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // Always 0!
  }, 1000);
  return () => clearInterval(id);
}, []); // Missing 'count' dependency

// ✅ Fix: use functional update or add dependency
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1); // Functional update doesn't need count
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**2. Object/array dependencies causing infinite loops:**
```javascript
// ❌ Bug: options is new object every render
function Component({ userId }) {
  const options = { userId, limit: 10 };
  
  useEffect(() => {
    fetchData(options);
  }, [options]); // Infinite loop!
}

// ✅ Fix: memoize or use primitive dependencies
function Component({ userId }) {
  const options = useMemo(() => ({ userId, limit: 10 }), [userId]);
  
  useEffect(() => {
    fetchData(options);
  }, [options]);
}
```

**3. Functions as dependencies:**
```javascript
// ❌ Problem: fetchData is new function every render
function Component({ userId }) {
  const fetchData = () => api.get(`/users/${userId}`);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Runs every render!
}

// ✅ Fix: useCallback or move function inside effect
function Component({ userId }) {
  useEffect(() => {
    const fetchData = () => api.get(`/users/${userId}`);
    fetchData();
  }, [userId]);
}
```

**4. Lying about dependencies:**
```javascript
// ❌ Dangerous: ESLint warning suppressed
useEffect(() => {
  doSomething(a, b, c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [a]); // Intentionally omitting b and c - BUG!
```

**Key Concepts:**
- **Closure capture**: Effects close over values from their render
- **Referential equality**: Objects/arrays are compared by reference
- **Exhaustive deps**: ESLint rule catches most issues

**Follow-up Questions:**
1. How does the useEvent RFC propose to solve some of these issues?
2. When is it actually safe to omit a dependency?
3. How do you debug stale closure issues?

---

## Summary

### Key Takeaways
1. Hooks rely on call order—always call them at the top level unconditionally
2. useReducer is preferable for complex state with multiple related values
3. Always clean up effects that create subscriptions, timers, or async operations
4. useCallback and useMemo are optimization tools—measure before using
5. Custom hooks extract reusable stateful logic and must start with "use"
6. The dependency array requires careful attention to avoid stale closures and infinite loops

### Common Mistakes to Avoid
- Calling hooks conditionally or in loops
- Forgetting cleanup functions for subscriptions and timers
- Over-using useCallback/useMemo without measuring
- Ignoring ESLint exhaustive-deps warnings
- Creating new objects/arrays in render that are used as dependencies

### Related Topics
- [State Management](./state-management-study-guide.md)
- [Component Lifecycle](./component-lifecycle-study-guide.md)
- [Performance Optimization](./performance-optimization-study-guide.md)

---

## Practice Exercises

- [Custom Hook Implementation](./../_practice/custom-hook-problem.md)
