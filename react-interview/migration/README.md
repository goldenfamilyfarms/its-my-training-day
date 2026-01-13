# Class to Functional Component Migration - Interview Deep Dive

Strategies for migrating legacy class components to modern functional components with hooks.

## 🎯 Why Migrate?

- **Smaller bundle**: Hooks produce less code
- **Better patterns**: Custom hooks for logic reuse
- **Modern ecosystem**: New libraries use hooks
- **Future-proof**: React team focuses on functional components
- **Concurrent mode**: Only works with functional components

---

## Lifecycle Method Mapping

### componentDidMount

```typescript
// Class component
class MyComponent extends React.Component {
  componentDidMount() {
    fetchData();
  }
}

// Functional component
function MyComponent() {
  useEffect(() => {
    fetchData();
  }, []); // Empty deps = runs once on mount
}
```

### componentDidUpdate

```typescript
// Class: Runs on every update
componentDidUpdate(prevProps) {
  if (prevProps.userId !== this.props.userId) {
    fetchUserData(this.props.userId);
  }
}

// Functional: Runs when deps change
useEffect(() => {
  fetchUserData(userId);
}, [userId]);
```

### componentWillUnmount

```typescript
// Class
componentWillUnmount() {
  clearInterval(this.interval);
}

// Functional
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval); // Cleanup function
}, []);
```

---

## State Migration

### Simple State

```typescript
// Class
this.state = { count: 0 };
this.setState({ count: 1 });

// Functional
const [count, setCount] = useState(0);
setCount(1);
```

### Complex State

```typescript
// Class: One setState call
this.setState({
  user: { name: 'Alice', email: 'alice@example.com' },
  loading: false,
});

// Functional: Multiple useState calls
const [user, setUser] = useState({ name: '', email: '' });
const [loading, setLoading] = useState(false);

// Or single state object with useReducer
const [state, dispatch] = useReducer(reducer, initialState);
```

---

## Instance Variables to Refs

```typescript
// Class
class Timer extends React.Component {
  interval = null;

  componentDidMount() {
    this.interval = setInterval(() => {}, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
}

// Functional
function Timer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {}, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);
}
```

---

## Context Migration

```typescript
// Class
class MyComponent extends React.Component {
  static contextType = ThemeContext;

  render() {
    const theme = this.context;
  }
}

// Functional
function MyComponent() {
  const theme = useContext(ThemeContext);
}
```

---

## Error Boundaries (Still Require Classes)

```typescript
// Error boundaries must be class components (no hook alternative yet)
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

---

## Migration Strategy

### 1. Bottom-Up Approach
- Start with leaf components (no children)
- Move up the tree
- Test after each migration

### 2. Extract Custom Hooks
```typescript
// Before: Logic in component
class UserProfile extends React.Component {
  state = { user: null, loading: true };

  componentDidMount() {
    fetchUser(this.props.userId).then(user => {
      this.setState({ user, loading: false });
    });
  }
}

// After: Extract to custom hook
function useUser(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(user => {
      setUser(user);
      setLoading(false);
    });
  }, [userId]);

  return { user, loading };
}

function UserProfile({ userId }: Props) {
  const { user, loading } = useUser(userId);
  // ...
}
```

### 3. Test Coverage
- Add tests before migrating
- Ensure tests pass after migration
- Test all lifecycle scenarios

---

## 🔑 Key Mappings

- `componentDidMount` → `useEffect(() => {}, [])`
- `componentDidUpdate` → `useEffect(() => {}, [deps])`
- `componentWillUnmount` → `useEffect(() => () => cleanup, [])`
- `this.state` → `useState`
- `this.instanceVar` → `useRef`
- `static contextType` → `useContext`
- Complex state → `useReducer`

**Note**: Error boundaries still require class components.

Good luck with your Adobe TechGRC interview! 🚀
