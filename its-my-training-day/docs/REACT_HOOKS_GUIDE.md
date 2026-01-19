# Complete React Hooks Usage Guide

This comprehensive guide documents every React hook usage pattern found throughout this repository. Each hook is explained with real examples from the codebase, showing how it's used in production-ready compliance and GRC applications.

## Table of Contents

1. [Basic Hooks](#basic-hooks)
   - [useState](#usestate)
   - [useEffect](#useeffect)
   - [useContext](#usecontext)
2. [Additional Hooks](#additional-hooks)
   - [useReducer](#usereducer)
   - [useMemo](#usememo)
   - [useCallback](#usecallback)
   - [useRef](#useref)
3. [React 18 Concurrent Hooks](#react-18-concurrent-hooks)
   - [useTransition](#usetransition)
   - [useDeferredValue](#usedeferredvalue)
4. [Third-Party Hooks](#third-party-hooks)
   - [useQuery (React Query)](#usequery-react-query)
   - [useVirtualizer](#usevirtualizer)
5. [Custom Hooks](#custom-hooks)
   - [Custom Hook Patterns](#custom-hook-patterns)
   - [Real Examples from Repository](#real-examples-from-repository)

---

## Basic Hooks

### useState

**Purpose:** Manages component-level state that triggers re-renders when updated.

**Total Usage:** Found in 20+ files across the repository

#### Pattern 1: Simple State Management

**Location:** `interview-questions/07-react-code-splitting.tsx:181`

```typescript
const [showChart, setShowChart] = React.useState(false);
```

**How It's Used:**
- Controls conditional rendering of lazy-loaded components
- Initial value: `false` (chart hidden by default)
- When `setShowChart(true)` is called, triggers re-render and lazy-loads the chart component
- This pattern enables code splitting - chart bundle only loads when needed

**Interview Talking Point:**
"This demonstrates conditional lazy loading. The chart component and its dependencies are only loaded when the user explicitly requests it, reducing initial bundle size."

---

#### Pattern 2: Multiple State Variables

**Location:** `interview-questions/07-react-code-splitting.tsx:214-215`

```typescript
const [library, setLibrary] = React.useState<any>(null);
const [loading, setLoading] = React.useState(false);
```

**How It's Used:**
- Manages two related pieces of state: the loaded library and loading status
- Used for async operations with loading states
- `loading` prevents multiple simultaneous loads
- `library` stores the result of dynamic import

**Key Concept:**
Separate loading state from data state for better UX and error handling.

---

#### Pattern 3: Complex Object State

**Location:** `platform-engineering/react/02-compliance-workflow-wizard.tsx:408-422`

```typescript
const [state, dispatch] = useReducer(workflowReducer, {
  currentStep: 'frameworkSelection',
  completedSteps: new Set(),
  stepData: {
    frameworkSelection: { frameworks: [], scope: { ... } },
    // ... other steps
  },
  validationErrors: {},
  isDirty: false,
});
```

**Note:** This uses `useReducer`, but `useState` is also used for simpler state:

```typescript
const [isSaving, setIsSaving] = useState(false);
```

**How It's Used:**
- `isSaving` tracks auto-save status
- Simple boolean state for UI feedback
- Shows "Saving draft..." message to user

---

#### Pattern 4: State with Set Operations

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:68-69`

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
```

**How It's Used:**
- Uses `Set` for efficient membership testing (O(1) lookup)
- Better than arrays for checking if item exists
- Immutable updates using functional setState pattern

**Example Update Pattern:**
```typescript
setSelectedIds(prev => {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
});
```

**Interview Talking Point:**
"Using Set instead of array for selectedIds provides O(1) lookup time vs O(n) for arrays. This is important when checking selection state for thousands of items."

---

#### Pattern 5: State for Real-Time Data

**Location:** `react-interview/core-concepts/01-real-time-telemetry-dashboard.tsx:27`

```typescript
const [batchedData, setBatchedData] = useState<TelemetryData[]>([]);
```

**How It's Used:**
- Stores batched WebSocket messages
- Updated via `setBatchedData(prev => [...prev, ...bufferRef.current])`
- Batched updates prevent render thrashing from high-frequency updates

**Key Concept:**
Batching state updates for high-frequency data (100ms updates) prevents performance issues.

---

### useEffect

**Purpose:** Handles side effects (API calls, subscriptions, DOM manipulation) and cleanup.

**Total Usage:** Found in 20+ files across the repository

#### Pattern 1: API Data Fetching

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:168-179`

```typescript
useEffect(() => {
  if (!enabled) return;

  fetchData();

  return () => {
    // Cleanup: abort in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [fetchData, enabled]);
```

**How It's Used:**
- Fetches data when component mounts or dependencies change
- Cleanup function aborts in-flight requests on unmount
- Prevents memory leaks and race conditions
- `enabled` flag allows conditional execution

**Key Concepts:**
- **Dependency Array:** `[fetchData, enabled]` - effect runs when these change
- **Cleanup Function:** Aborts requests to prevent state updates on unmounted components
- **Conditional Execution:** Early return if `enabled` is false

---

#### Pattern 2: WebSocket/EventSource Connections

**Location:** `platform-engineering/react/01-real-time-compliance-dashboard.tsx:170-200`

```typescript
useEffect(() => {
  const params = new URLSearchParams({
    frameworks: frameworks.map(f => f.id).join(','),
    tenant: getCurrentTenant(),
  });

  eventSourceRef.current = new EventSource(
    `/api/compliance/stream?${params}`
  );

  eventSourceRef.current.addEventListener('control-update', (event) => {
    const update: ControlUpdate = JSON.parse(event.data);
    dispatch({ type: 'CONTROL_UPDATE', payload: update });
  });

  return () => {
    eventSourceRef.current?.close();
  };
}, [frameworks]);
```

**How It's Used:**
- Sets up Server-Sent Events (SSE) connection
- Listens for real-time compliance updates
- Cleanup closes connection on unmount or when frameworks change
- Prevents memory leaks from open connections

**Interview Talking Point:**
"The cleanup function is critical for WebSocket/SSE connections. Without it, connections stay open even after component unmounts, causing memory leaks."

---

#### Pattern 3: Polling/Interval

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:271-296`

```typescript
useEffect(() => {
  if (!enabled) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  // Immediate execution if requested
  if (immediate) {
    callbackRef.current();
  }

  // Set up polling
  intervalRef.current = setInterval(() => {
    callbackRef.current();
  }, interval);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [enabled, interval, immediate]);
```

**How It's Used:**
- Sets up periodic data refresh (polling)
- Uses `useRef` to store interval ID (doesn't trigger re-renders)
- Cleanup clears interval to prevent memory leaks
- Conditional execution based on `enabled` flag

**Key Concept:**
Using `useRef` for interval IDs prevents unnecessary re-renders while allowing cleanup.

---

#### Pattern 4: Cache Cleanup

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:182-193`

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of dataCache.entries()) {
      if (now - value.timestamp > cacheTime) {
        dataCache.delete(key);
      }
    }
  }, 60 * 1000); // Check every minute

  return () => clearInterval(interval);
}, [cacheTime]);
```

**How It's Used:**
- Periodic cleanup of expired cache entries
- Prevents memory leaks from growing cache
- Runs every minute to check for expired entries
- Cleanup clears interval on unmount

---

#### Pattern 5: Multiple Effects for Separation of Concerns

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx`

Multiple `useEffect` hooks in the same component:

```typescript
// Effect 1: Data fetching
useEffect(() => {
  if (!enabled) return;
  fetchData();
  return () => { /* cleanup */ };
}, [fetchData, enabled]);

// Effect 2: Cache cleanup
useEffect(() => {
  const interval = setInterval(() => { /* cleanup */ }, 60000);
  return () => clearInterval(interval);
}, [cacheTime]);
```

**How It's Used:**
- Separates concerns: one effect per responsibility
- Each effect has its own dependencies and cleanup
- Easier to understand and maintain
- Better than one large effect handling everything

**Interview Talking Point:**
"Separating effects by concern makes code more maintainable. Each effect has a single responsibility and can be optimized independently."

---

### useContext

**Purpose:** Accesses context values without prop drilling.

**Total Usage:** Found in 5+ files

#### Pattern 1: Basic Context Consumption

**Location:** `interview-questions/05-react-context-performance.tsx:76-82`

```typescript
function useComplianceDataSelector<R>(
  selector: Selector<{ controls: Record<string, ComplianceControl>; frameworks: Record<string, Framework> }, R>
): R {
  const context = useContext(ComplianceDataContext);
  if (!context) {
    throw new Error('useComplianceDataSelector must be used within ComplianceDataProvider');
  }

  // Memoize selector result
  return useMemo(() => selector(context), [context, selector]);
}
```

**How It's Used:**
- Accesses context value
- Error handling if used outside provider
- Memoizes selector result to prevent unnecessary recalculations
- Enables fine-grained subscriptions

---

#### Pattern 2: Multiple Contexts

**Location:** `interview-questions/05-react-context-performance.tsx:153-167`

```typescript
export function useComplianceFilters() {
  const context = useContext(ComplianceFiltersContext);
  if (!context) {
    throw new Error('useComplianceFilters must be used within ComplianceProvider');
  }
  return context;
}

export function useComplianceUI() {
  const context = useContext(ComplianceUIContext);
  if (!context) {
    throw new Error('useComplianceUI must be used within ComplianceProvider');
  }
  return context;
}
```

**How It's Used:**
- Custom hooks wrap `useContext` for better DX
- Provides error messages if used incorrectly
- Type-safe access to context values
- Separates concerns by context type

**Interview Talking Point:**
"Wrapping useContext in custom hooks provides better developer experience, type safety, and clear error messages."

---

## Additional Hooks

### useReducer

**Purpose:** Manages complex state with reducer pattern (like Redux).

**Total Usage:** Found in 8+ files

#### Pattern 1: Complex State Management

**Location:** `platform-engineering/react/01-real-time-compliance-dashboard.tsx:167`

```typescript
const [state, dispatch] = useReducer(complianceReducer, initialState);
```

**Reducer Function:**
```typescript
function complianceReducer(
  state: ComplianceState,
  action: ComplianceAction
): ComplianceState {
  switch (action.type) {
    case 'CONTROL_UPDATE': {
      const { controlId, ...updates } = action.payload;
      const control = state.controls[controlId];
      
      if (!control) return state;

      const updatedControls = {
        ...state.controls,
        [controlId]: { ...control, ...updates },
      };

      // Recalculate framework score
      const frameworkId = control.frameworkId;
      const frameworkControls = Object.values(updatedControls).filter(
        c => c.frameworkId === frameworkId
      );
      const compliantCount = frameworkControls.filter(
        c => c.status === 'COMPLIANT'
      ).length;
      const complianceScore = frameworkControls.length > 0
        ? (compliantCount / frameworkControls.length) * 100
        : 0;

      return {
        ...state,
        controls: updatedControls,
        complianceScores: {
          ...state.complianceScores,
          [frameworkId]: complianceScore,
        },
        lastUpdate: new Date().toISOString(),
      };
    }
    // ... other cases
  }
}
```

**How It's Used:**
- Manages complex normalized state (controls, frameworks, scores)
- Actions: `CONTROL_UPDATE`, `FRAMEWORK_SYNC`, `INITIALIZE`
- Calculates derived state (compliance scores) during updates
- Prevents cascading updates with normalized state shape

**Interview Talking Point:**
"useReducer is ideal for complex state with interdependent updates. Here, updating a control automatically recalculates framework compliance scores."

---

#### Pattern 2: Workflow State Machine

**Location:** `platform-engineering/react/02-compliance-workflow-wizard.tsx:111-178`

```typescript
function workflowReducer(
  state: WorkflowState,
  action: WorkflowEvent
): WorkflowState {
  switch (action.type) {
    case 'UPDATE_DATA': {
      const newStepData = {
        ...state.stepData,
        [action.step]: action.data,
      };

      return {
        ...state,
        stepData: newStepData,
        isDirty: true,
        validationErrors: {
          ...state.validationErrors,
          [action.step]: [],
        },
      };
    }
    case 'NEXT': {
      const nextStep = getNextStep(state.currentStep);
      return {
        ...state,
        currentStep: nextStep,
        completedSteps: new Set([...state.completedSteps, state.currentStep]),
      };
    }
    // ... other cases
  }
}
```

**How It's Used:**
- Implements state machine pattern for multi-step wizard
- Actions: `NEXT`, `PREVIOUS`, `GOTO`, `UPDATE_DATA`, `SET_ERRORS`
- Tracks current step, completed steps, validation errors
- Centralized state transitions

**Interview Talking Point:**
"useReducer with state machine pattern provides predictable state transitions. All state changes go through the reducer, making debugging easier."

---

#### Pattern 3: Custom Hook with useReducer

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:111-116`

```typescript
const [state, dispatch] = useReducer(complianceReducer, {
  controls: {},
  loading: false,
  error: null,
  lastFetch: null,
});
```

**How It's Used:**
- Encapsulates reducer logic in custom hook
- Provides loading, error, and data states
- Actions: `FETCH_START`, `FETCH_SUCCESS`, `FETCH_ERROR`, `UPDATE_CONTROL`
- Returns state and dispatch function

---

### useMemo

**Purpose:** Memoizes expensive calculations to prevent unnecessary recalculations.

**Total Usage:** Found in 15+ files

#### Pattern 1: Expensive Calculations

**Location:** `platform-engineering/react/01-real-time-compliance-dashboard.tsx:217-248`

```typescript
function useFrameworkPosture(
  frameworkId: string,
  controls: Record<string, Control>,
  controlsByFramework: Record<string, string[]>
) {
  return useMemo(() => {
    const controlIds = controlsByFramework[frameworkId] || [];
    const frameworkControls = controlIds.map(id => controls[id]).filter(Boolean);
    
    if (frameworkControls.length === 0) {
      return {
        score: 0,
        totalControls: 0,
        compliantCount: 0,
        nonCompliantCount: 0,
        warningCount: 0,
      };
    }

    const compliantCount = frameworkControls.filter(
      c => c.status === 'COMPLIANT'
    ).length;
    const nonCompliantCount = frameworkControls.filter(
      c => c.status === 'NON_COMPLIANT'
    ).length;
    const warningCount = frameworkControls.filter(
      c => c.status === 'WARNING'
    ).length;

    return {
      score: (compliantCount / frameworkControls.length) * 100,
      totalControls: frameworkControls.length,
      compliantCount,
      nonCompliantCount,
      warningCount,
    };
  }, [frameworkId, controls, controlsByFramework]);
}
```

**How It's Used:**
- Calculates compliance metrics (expensive operation)
- Only recalculates when dependencies change
- Prevents unnecessary work on every render
- Returns memoized result

**Interview Talking Point:**
"useMemo prevents recalculating compliance scores on every render. It only recalculates when frameworkId, controls, or controlsByFramework change."

---

#### Pattern 2: Filtered/Sorted Lists

**Location:** `interview-questions/01-react-concurrent-features.tsx:95-103`

```typescript
const filteredControls = useMemo(() => {
  if (!deferredSearchTerm) return controls;
  
  const term = deferredSearchTerm.toLowerCase();
  return controls.filter(control =>
    control.title.toLowerCase().includes(term) ||
    control.id.toLowerCase().includes(term)
  );
}, [controls, deferredSearchTerm]);
```

**How It's Used:**
- Memoizes filtered list
- Only recalculates when controls or search term changes
- Works with `useDeferredValue` for non-blocking filtering
- Prevents re-filtering on unrelated state changes

---

#### Pattern 3: Context Value Memoization

**Location:** `interview-questions/05-react-context-performance.tsx:113-119`

```typescript
const dataValue = useMemo(
  () => ({
    controls: data.controls,
    frameworks: data.frameworks,
  }),
  [data.controls, data.frameworks]
);
```

**How It's Used:**
- Memoizes context value object
- Prevents unnecessary re-renders of context consumers
- Only creates new object when dependencies actually change
- Critical for Context performance

**Interview Talking Point:**
"Memoizing context values prevents all consumers from re-rendering. Without useMemo, a new object is created on every render, causing unnecessary re-renders."

---

#### Pattern 4: Virtualization Data Preparation

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:147-168`

```typescript
const { flatItems, itemOffsets } = useMemo(() => {
  const grouped = groupControls(controls, groupBy);
  const flat: Array<{ type: 'header' | 'control'; name?: string; count?: number; data?: ComplianceControl }> = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  for (const [groupName, groupControls] of Object.entries(grouped)) {
    // Group header
    flat.push({ type: 'header', name: groupName, count: groupControls.length });
    offsets.push(currentOffset);
    currentOffset += GROUP_HEADER_HEIGHT;

    // Group items
    for (const control of groupControls) {
      flat.push({ type: 'control', data: control });
      offsets.push(currentOffset);
      currentOffset += CONTROL_ROW_HEIGHT;
    }
  }

  return { flatItems: flat, itemOffsets: offsets };
}, [controls, groupBy]);
```

**How It's Used:**
- Pre-computes flat list structure for virtualization
- Expensive operation (iterating through all controls)
- Only recalculates when controls or groupBy changes
- Essential for virtualization performance

---

### useCallback

**Purpose:** Memoizes functions to prevent unnecessary re-renders of child components.

**Total Usage:** Found in 12+ files

#### Pattern 1: Stable Function References

**Location:** `interview-questions/05-react-context-performance.tsx:122-124`

```typescript
const updateFilters = useCallback((updates: Partial<FilterState>) => {
  setFilters(prev => ({ ...prev, ...updates }));
}, []);
```

**How It's Used:**
- Creates stable function reference
- Empty dependency array means function never changes
- Prevents context value from changing unnecessarily
- Child components using this function won't re-render

**Interview Talking Point:**
"useCallback with empty deps creates a stable function reference. This is essential when passing functions through context or as props to memoized components."

---

#### Pattern 2: Callback with Dependencies

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:120-166`

```typescript
const fetchData = useCallback(async () => {
  const cacheKey = framework || 'all';
  const cached = dataCache.get(cacheKey);

  // Check if data is still fresh
  if (cached && Date.now() - cached.timestamp < staleTime) {
    dispatch({ type: 'FETCH_SUCCESS', payload: cached.data });
    return;
  }

  // ... rest of fetch logic
}, [framework, staleTime]);
```

**How It's Used:**
- Memoizes async function
- Dependencies: `framework` and `staleTime`
- Function reference changes when dependencies change
- Used in `useEffect` dependency array

**Key Concept:**
When a function is used in `useEffect` dependencies, use `useCallback` to prevent infinite loops.

---

#### Pattern 3: Event Handlers

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:79-94`

```typescript
toggleSelection: useCallback((id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []),
```

**How It's Used:**
- Memoizes toggle function
- Stable reference prevents child re-renders
- Used in custom hook return value
- Empty deps because function doesn't depend on props/state

---

#### Pattern 4: Optimistic Update Handler

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:219-244`

```typescript
const update = useCallback(
  async (item: T) => {
    // Apply optimistic update immediately
    setOptimisticUpdates(prev => new Map(prev).set(item.id, item));

    try {
      const result = await updateFn(item);
      // Remove from optimistic updates on success
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      return result;
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
      throw error;
    }
  },
  [updateFn]
);
```

**How It's Used:**
- Memoizes async update function
- Depends on `updateFn` parameter
- Provides optimistic UI updates
- Handles error rollback

---

### useRef

**Purpose:** Stores mutable values that don't trigger re-renders, or DOM references.

**Total Usage:** Found in 15+ files

#### Pattern 1: DOM Element Reference

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:144`

```typescript
const parentRef = useRef<HTMLDivElement>(null);
```

**Used with Virtualizer:**
```typescript
const virtualizer = useVirtualizer({
  count: flatItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) => /* ... */,
  overscan: 10,
});
```

**How It's Used:**
- Stores reference to scrollable container
- Passed to virtualization library
- Doesn't trigger re-renders when ref changes
- Essential for virtualization

---

#### Pattern 2: Mutable Values (Not State)

**Location:** `react-interview/core-concepts/01-real-time-telemetry-dashboard.tsx:28-31`

```typescript
const wsRef = useRef<WebSocket | null>(null);
const bufferRef = useRef<TelemetryData[]>([]);
const batchTimeoutRef = useRef<number | null>(null);
const frameRequestRef = useRef<number | null>(null);
```

**How It's Used:**
- Stores WebSocket instance (doesn't need to trigger renders)
- Buffer for batching messages
- Timeout/interval IDs for cleanup
- Values persist across renders without causing re-renders

**Interview Talking Point:**
"useRef is perfect for storing values that need to persist across renders but don't need to trigger re-renders. Like WebSocket instances, buffers, or interval IDs."

---

#### Pattern 3: Previous Value Tracking

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:263-264`

```typescript
const callbackRef = useRef(callback);
const intervalRef = useRef<NodeJS.Timeout | null>(null);
```

**How It's Used:**
- `callbackRef` stores latest callback function
- Allows accessing latest callback in interval without re-creating interval
- `intervalRef` stores interval ID for cleanup
- Pattern prevents stale closures

**Update Pattern:**
```typescript
useEffect(() => {
  callbackRef.current = callback; // Always have latest callback
}, [callback]);
```

---

#### Pattern 4: AbortController for Cleanup

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:118`

```typescript
const abortControllerRef = useRef<AbortController | null>(null);
```

**How It's Used:**
- Stores AbortController instance
- Used to cancel in-flight fetch requests
- Cleanup in useEffect:
```typescript
return () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
};
```

**Interview Talking Point:**
"AbortController with useRef allows canceling async operations on unmount, preventing state updates on unmounted components."

---

## React 18 Concurrent Hooks

### useTransition

**Purpose:** Marks state updates as non-urgent, keeping UI responsive during transitions.

**Total Usage:** Found in 1 file

#### Pattern 1: Non-Urgent State Updates

**Location:** `interview-questions/01-react-concurrent-features.tsx:199`

```typescript
const [isPending, startTransition] = useTransition();
```

**Usage:**
```typescript
const handleFrameworkChange = (newFramework: string) => {
  startTransition(() => {
    setFramework(newFramework);
  });
};
```

**How It's Used:**
- Wraps non-urgent state update (framework filter change)
- `isPending` indicates transition is in progress
- UI stays responsive during data loading
- Shows loading indicator while pending

**Interview Talking Point:**
"useTransition allows React to keep the UI responsive during non-urgent updates. Urgent updates (like typing) aren't blocked by transitions."

---

### useDeferredValue

**Purpose:** Defers expensive computations, showing stale data while computing new data.

**Total Usage:** Found in 1 file

#### Pattern 1: Deferred Filtering

**Location:** `interview-questions/01-react-concurrent-features.tsx:92`

```typescript
const deferredSearchTerm = useDeferredValue(searchTerm);
```

**Usage:**
```typescript
const filteredControls = useMemo(() => {
  if (!deferredSearchTerm) return controls;
  
  const term = deferredSearchTerm.toLowerCase();
  return controls.filter(control =>
    control.title.toLowerCase().includes(term) ||
    control.id.toLowerCase().includes(term)
  );
}, [controls, deferredSearchTerm]);

// Show stale data while filtering
const isStale = deferredSearchTerm !== searchTerm;
```

**How It's Used:**
- Defers expensive filtering operation
- Shows stale data while computing
- Smooth transition to new data
- Prevents UI blocking during filtering

**Interview Talking Point:**
"useDeferredValue defers expensive operations. Users see stale data immediately, then smooth transition to new data. Better UX than blocking the UI."

---

## Third-Party Hooks

### useQuery (React Query)

**Purpose:** Manages server state with caching, background updates, and error handling.

**Total Usage:** Found in 1 file

#### Pattern 1: Server State Management

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:48-64`

```typescript
function useComplianceControls(filters: ControlFilters) {
  return useQuery({
    queryKey: ['controls', filters],
    queryFn: async () => {
      const response = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      return response.json() as Promise<ComplianceControl[]>;
    },
    staleTime: 30_000, // 30 seconds
    structuralSharing: true, // Prevents unnecessary re-renders
    placeholderData: (previousData) => previousData, // Instant perceived loading
  });
}
```

**How It's Used:**
- Manages server state separately from UI state
- Automatic caching and background refetching
- `staleTime` controls when data is considered fresh
- `structuralSharing` prevents re-renders when data hasn't changed
- `placeholderData` shows previous data while loading (optimistic UI)

**Interview Talking Point:**
"React Query separates server state from UI state. It handles caching, background updates, and error states automatically, reducing boilerplate."

---

### useVirtualizer

**Purpose:** Virtualizes large lists, only rendering visible items.

**Total Usage:** Found in 3+ files

#### Pattern 1: Basic Virtualization

**Location:** `platform-engineering/react/01-real-time-compliance-dashboard.tsx:260-265`

```typescript
const virtualizer = useVirtualizer({
  count: controls.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72, // Control card height
  overscan: 5,
});
```

**How It's Used:**
- Only renders visible items + overscan
- Reduces DOM nodes from thousands to ~20
- Essential for performance with large lists
- `overscan` renders extra items for smooth scrolling

---

#### Pattern 2: Variable Size Virtualization

**Location:** `platform-engineering/react/03-performance-optimization-large-datasets.tsx:170-176`

```typescript
const virtualizer = useVirtualizer({
  count: flatItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) =>
    flatItems[index].type === 'header' ? GROUP_HEADER_HEIGHT : CONTROL_ROW_HEIGHT,
  overscan: 10,
});
```

**How It's Used:**
- Different sizes for headers vs rows
- Dynamic size calculation based on item type
- Supports grouped lists with headers

---

## Custom Hooks

### Custom Hook Patterns

Custom hooks encapsulate reusable logic. All custom hooks in this repository follow the `use` prefix convention.

#### Pattern 1: Data Fetching Hook

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:97-209`

**Hook:** `useComplianceData`

```typescript
export function useComplianceData(
  framework?: string,
  options: {
    cacheTime?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const [state, dispatch] = useReducer(complianceReducer, {
    controls: {},
    loading: false,
    error: null,
    lastFetch: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Request deduplication
    // Cache checking
    // API call
    // Error handling
  }, [framework, staleTime]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    return () => { /* cleanup */ };
  }, [fetchData, enabled]);

  return {
    ...state,
    refetch: fetchData,
    invalidate,
  };
}
```

**Features:**
- Request deduplication
- Caching with stale time
- Abort controller for cleanup
- Error handling
- Loading states

---

#### Pattern 2: Optimistic Updates Hook

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:212-254`

**Hook:** `useOptimisticUpdate`

```typescript
export function useOptimisticUpdate<T extends { id: string }>(
  updateFn: (item: T) => Promise<T>
) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, T>
  >(new Map());

  const update = useCallback(
    async (item: T) => {
      // Apply optimistic update immediately
      setOptimisticUpdates(prev => new Map(prev).set(item.id, item));

      try {
        const result = await updateFn(item);
        // Remove from optimistic updates on success
        setOptimisticUpdates(prev => {
          const next = new Map(prev);
          next.delete(item.id);
          return next;
        });
        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticUpdates(prev => {
          const next = new Map(prev);
          next.delete(item.id);
          return next;
        });
        throw error;
      }
    },
    [updateFn]
  );

  return { update, getOptimisticValue };
}
```

**Features:**
- Immediate UI updates
- Automatic rollback on error
- Better UX than waiting for server

---

#### Pattern 3: Polling Hook

**Location:** `interview-questions/03-react-custom-hooks-advanced.tsx:257-297`

**Hook:** `usePolling`

```typescript
export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  options: { enabled?: boolean; immediate?: boolean } = {}
) {
  const { enabled = true, immediate = false } = options;
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (immediate) {
      callbackRef.current();
    }

    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, immediate]);
}
```

**Features:**
- Periodic callback execution
- Proper cleanup
- Immediate execution option
- Enable/disable control

---

#### Pattern 4: WebSocket Hook

**Location:** `react-interview/real-time/01-websocket-custom-hooks.tsx:33-402`

**Hook:** `useEquipmentWebSocket`

```typescript
export function useEquipmentWebSocket(
  url: string,
  options: WebSocketOptions = {}
): WebSocketHookReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<any[]>([]);

  // Connection logic with reconnection
  // Heartbeat logic
  // Message queuing
  // Cleanup

  return {
    connectionState,
    lastMessage,
    messageHistory,
    sendMessage,
    disconnect,
    reconnect,
  };
}
```

**Features:**
- Automatic reconnection with exponential backoff
- Heartbeat/ping-pong mechanism
- Message queuing
- Connection state tracking
- Proper cleanup

---

#### Pattern 5: Real-Time Stream Hook

**Location:** `platform-engineering/react/01-real-time-compliance-dashboard.tsx:166-203`

**Hook:** `useComplianceStream`

```typescript
function useComplianceStream(frameworks: Framework[]) {
  const [state, dispatch] = useReducer(complianceReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      frameworks: frameworks.map(f => f.id).join(','),
      tenant: getCurrentTenant(),
    });

    eventSourceRef.current = new EventSource(
      `/api/compliance/stream?${params}`
    );

    eventSourceRef.current.addEventListener('control-update', (event) => {
      const update: ControlUpdate = JSON.parse(event.data);
      dispatch({ type: 'CONTROL_UPDATE', payload: update });
    });

    return () => {
      eventSourceRef.current?.close();
    };
  }, [frameworks]);

  return state;
}
```

**Features:**
- Server-Sent Events (SSE) connection
- Real-time updates via reducer
- Automatic cleanup
- Framework filtering

---

#### Pattern 6: Selector Hook

**Location:** `interview-questions/05-react-context-performance.tsx:73-83`

**Hook:** `useComplianceDataSelector`

```typescript
function useComplianceDataSelector<R>(
  selector: Selector<{ controls: Record<string, ComplianceControl>; frameworks: Record<string, Framework> }, R>
): R {
  const context = useContext(ComplianceDataContext);
  if (!context) {
    throw new Error('useComplianceDataSelector must be used within ComplianceDataProvider');
  }

  // Memoize selector result
  return useMemo(() => selector(context), [context, selector]);
}
```

**Features:**
- Fine-grained subscriptions
- Memoized selector results
- Type-safe selectors
- Prevents unnecessary re-renders

---

#### Pattern 7: Media Query Hook

**Location:** `react-interview/styling/01-css-in-js-vs-traditional.tsx:255`

**Hook:** `useMediaQuery`

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

**Features:**
- Responsive design hook
- Listens to media query changes
- Proper cleanup of event listeners
- Returns boolean for easy conditional rendering

---

#### Pattern 8: Form Hook (React Hook Form)

**Location:** `react-interview/forms/01-advanced-form-validation.tsx:74-100`

**Hook:** `useEquipmentConfigForm` (uses React Hook Form's `useForm`)

```typescript
export function useEquipmentConfigForm(
  initialData?: Partial<EquipmentConfigFormData>,
  onSubmit?: (data: EquipmentConfigFormData) => Promise<void>
) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty, isValid },
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    setError,
    clearErrors,
  } = useForm<EquipmentConfigFormData>({
    resolver: zodResolver(equipmentConfigSchema),
    mode: 'onBlur',
    defaultValues: { /* ... */ },
  });

  // Custom logic with useEffect, useCallback
  // ...

  return { /* form methods */ };
}
```

**Features:**
- Integrates React Hook Form with Zod validation
- Custom hook wraps useForm for domain-specific logic
- Provides form state and methods
- Handles async validation

---

#### Pattern 9: Debugging Hooks

**Location:** `react-interview/debugging/01-react-debugging-techniques.tsx`

**Hooks:** `useWhyDidYouUpdate`, `useMemoryMonitor`, `useRenderTime`

```typescript
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previous = useRef<Record<string, any>>();

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previous.current = props;
  });
}
```

**Features:**
- Debugging utilities
- Tracks prop changes
- Performance monitoring
- Memory leak detection

---

#### Pattern 10: LocalStorage Persistence Hook

**Location:** `react-interview/core-concepts/02-multi-step-configuration-wizard.tsx:76-89`

**Pattern:** useState with localStorage initialization

```typescript
const [wizardState, setWizardState] = useState<WizardState>(() => {
  // Load from localStorage for persistence
  const saved = localStorage.getItem('wizard-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        completedSteps: new Set(parsed.completedSteps || []),
      };
    } catch {
      // If parsing fails, use defaults
    }
  }
  
  return {
    currentStep: 0,
    data: {},
    // ... defaults
  };
});
```

**How It's Used:**
- Lazy initialization of useState
- Loads persisted state from localStorage
- Falls back to defaults on error
- Used with useEffect to save state

**Interview Talking Point:**
"Using a function as useState initializer prevents reading localStorage on every render. The function only runs once during initialization."

---

## Hook Usage Statistics

Based on analysis of the repository:

| Hook | Usage Count | Primary Use Cases |
|------|-------------|-------------------|
| `useState` | 20+ files | Component state, UI state, loading states |
| `useEffect` | 20+ files | API calls, subscriptions, cleanup |
| `useReducer` | 8+ files | Complex state, state machines |
| `useMemo` | 15+ files | Expensive calculations, context values |
| `useCallback` | 12+ files | Stable function references, event handlers |
| `useRef` | 15+ files | DOM refs, mutable values, cleanup refs |
| `useContext` | 5+ files | Context consumption, global state |
| `useTransition` | 1 file | Non-urgent updates |
| `useDeferredValue` | 1 file | Deferred computations |
| `useQuery` | 1 file | Server state management |
| `useVirtualizer` | 3+ files | List virtualization |
| Custom Hooks | 15+ hooks | Reusable logic patterns |

---

## Common Patterns and Best Practices

### Pattern 1: useState vs useReducer

**When to use useState:**
- Simple state (primitives, simple objects)
- Independent state updates
- No complex logic

**When to use useReducer:**
- Complex state with interdependent updates
- State machine patterns
- Multiple related state updates
- Need for predictable state transitions

**Example from repository:**
- `useState` for `showChart` boolean
- `useReducer` for complex compliance state with score calculations

---

### Pattern 2: useMemo vs useCallback

**useMemo:** Memoizes **values** (objects, arrays, computed results)
```typescript
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);
```

**useCallback:** Memoizes **functions** (event handlers, callbacks)
```typescript
const handleClick = useCallback(() => doSomething(id), [id]);
```

**Key Difference:**
- `useMemo` returns a value
- `useCallback` returns a function

---

### Pattern 3: useEffect Dependencies

**Empty Dependencies `[]`:**
- Run once on mount
- Cleanup on unmount
- Example: WebSocket connection setup

**With Dependencies `[dep1, dep2]`:**
- Run when dependencies change
- Cleanup before re-running
- Example: Refetch when framework changes

**No Dependencies (missing array):**
- Run on every render
- **Usually a bug!** Avoid unless intentional

---

### Pattern 4: Cleanup Patterns

**Always cleanup:**
- Subscriptions (WebSocket, EventSource)
- Intervals/timeouts
- AbortControllers
- Event listeners

**Example Pattern:**
```typescript
useEffect(() => {
  const subscription = subscribe();
  const interval = setInterval(() => {}, 1000);
  const controller = new AbortController();

  return () => {
    subscription.unsubscribe();
    clearInterval(interval);
    controller.abort();
  };
}, [deps]);
```

---

## Interview Preparation

### Common Hook Questions

1. **"When would you use useReducer vs useState?"**
   - Answer: UseReducer for complex state, interdependent updates, state machines
   - Example: Compliance dashboard with score calculations

2. **"What's the difference between useMemo and useCallback?"**
   - Answer: useMemo memoizes values, useCallback memoizes functions
   - Example: useMemo for computed metrics, useCallback for event handlers

3. **"How do you prevent memory leaks with useEffect?"**
   - Answer: Always return cleanup function
   - Example: Close WebSocket, clear intervals, abort requests

4. **"When should you use useRef?"**
   - Answer: Mutable values that don't trigger renders, DOM refs, cleanup refs
   - Example: WebSocket instances, interval IDs, DOM element refs

5. **"How does useTransition improve UX?"**
   - Answer: Marks updates as non-urgent, keeps UI responsive
   - Example: Framework filter changes don't block typing

---

## Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Hooks FAQ](https://react.dev/learn/escape-hatches)
- [useEffect Guide](https://react.dev/learn/synchronizing-with-effects)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## Hook Usage by File

### High Hook Usage Files (Learning Examples)

1. **`interview-questions/03-react-custom-hooks-advanced.tsx`**
   - `useState` (2x), `useEffect` (5x), `useReducer` (3x), `useCallback` (5x), `useRef` (4x)
   - Demonstrates: Custom hooks, caching, optimistic updates, polling

2. **`platform-engineering/react/03-performance-optimization-large-datasets.tsx`**
   - `useState` (8x), `useEffect` (3x), `useMemo` (3x), `useCallback` (4x), `useRef` (2x), `useQuery`, `useVirtualizer`
   - Demonstrates: Performance optimization, virtualization, React Query

3. **`react-interview/core-concepts/01-real-time-telemetry-dashboard.tsx`**
   - `useState` (4x), `useEffect` (4x), `useMemo` (3x), `useCallback` (1x), `useRef` (7x), `useVirtualizer`
   - Demonstrates: Real-time data, WebSocket, batching, virtualization

4. **`platform-engineering/react/02-compliance-workflow-wizard.tsx`**
   - `useReducer` (2x), `useCallback` (7x), `useEffect` (2x), `useMemo` (1x), `useState` (2x)
   - Demonstrates: State machine, form validation, auto-save

5. **`react-interview/real-time/01-websocket-custom-hooks.tsx`**
   - `useState` (7x), `useEffect` (2x), `useCallback` (11x), `useRef` (6x)
   - Demonstrates: WebSocket management, reconnection, message queuing

---

## Summary

This repository demonstrates production-ready patterns for all major React hooks:

- **Basic hooks** for state and effects (useState, useEffect, useContext)
- **Performance hooks** for optimization (useMemo, useCallback, useRef)
- **Concurrent hooks** for React 18 features (useTransition, useDeferredValue)
- **Custom hooks** for reusable logic (15+ custom hooks)
- **Third-party hooks** for specialized needs (useQuery, useVirtualizer)

### Key Takeaways

1. **useState** is used 89+ times - most common hook for component state
2. **useEffect** is used 65+ times - essential for side effects and cleanup
3. **useCallback** is used 76+ times - critical for performance optimization
4. **useMemo** is used 25+ times - prevents expensive recalculations
5. **useRef** is used 42+ times - stores mutable values and DOM refs
6. **useReducer** is used 10+ times - manages complex state
7. **Custom hooks** encapsulate reusable patterns - 15+ custom hooks found

Each hook is used appropriately for its use case, with proper cleanup, memoization, and error handling. Study these patterns to master React hooks for technical interviews.

### Quick Reference Table

| Hook | When to Use | Example Use Case | Files to Study |
|------|-------------|------------------|----------------|
| **useState** | Simple state, UI state, loading states | Toggle visibility, form inputs, loading flags | `07-react-code-splitting.tsx`, `03-custom-hooks-advanced.tsx` |
| **useEffect** | Side effects, subscriptions, cleanup | API calls, WebSocket connections, intervals | `01-real-time-compliance-dashboard.tsx`, `03-custom-hooks-advanced.tsx` |
| **useReducer** | Complex state, state machines | Multi-step forms, normalized state, score calculations | `01-real-time-compliance-dashboard.tsx`, `02-compliance-workflow-wizard.tsx` |
| **useMemo** | Expensive calculations, context values | Compliance score calculations, filtered lists | `01-real-time-compliance-dashboard.tsx`, `01-concurrent-features.tsx` |
| **useCallback** | Event handlers, stable function refs | Toggle functions, update handlers, context values | `05-context-performance.tsx`, `03-custom-hooks-advanced.tsx` |
| **useRef** | DOM refs, mutable values, cleanup | Virtualization containers, WebSocket instances, interval IDs | `03-performance-optimization.tsx`, `01-telemetry-dashboard.tsx` |
| **useContext** | Global state, theme, user prefs | Split contexts, selector pattern | `05-context-performance.tsx` |
| **useTransition** | Non-urgent updates | Framework filter changes | `01-concurrent-features.tsx` |
| **useDeferredValue** | Defer expensive computations | Search filtering, large list operations | `01-concurrent-features.tsx` |
| **useQuery** | Server state management | API data fetching with caching | `03-performance-optimization.tsx` |
| **useVirtualizer** | Large list rendering | Tables with 1000+ rows | `01-real-time-compliance-dashboard.tsx`, `03-performance-optimization.tsx` |

### Study Path for Hooks

1. **Start with Basics:**
   - Read `useState` patterns (Patterns 1-5)
   - Read `useEffect` patterns (Patterns 1-5)
   - Understand cleanup functions

2. **Move to Performance:**
   - Study `useMemo` for expensive calculations
   - Study `useCallback` for stable references
   - Understand when to use each

3. **Advanced State:**
   - Learn `useReducer` for complex state
   - Study state machine patterns
   - Understand normalized state

4. **Context Optimization:**
   - Read context splitting patterns
   - Study selector pattern
   - Understand memoization strategies

5. **React 18 Features:**
   - Learn `useTransition` for non-urgent updates
   - Study `useDeferredValue` for deferred computations
   - Understand concurrent rendering

6. **Custom Hooks:**
   - Study all custom hook patterns
   - Understand reusable logic extraction
   - Practice creating your own hooks

### Common Mistakes to Avoid

1. **Missing Cleanup in useEffect:**
   ```typescript
   // ❌ BAD - Memory leak
   useEffect(() => {
     setInterval(() => {}, 1000);
   }, []);

   // ✅ GOOD - Proper cleanup
   useEffect(() => {
     const interval = setInterval(() => {}, 1000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Incorrect useMemo Dependencies:**
   ```typescript
   // ❌ BAD - Missing dependency
   const result = useMemo(() => compute(data), []);

   // ✅ GOOD - Correct dependencies
   const result = useMemo(() => compute(data), [data]);
   ```

3. **Creating Functions in Render:**
   ```typescript
   // ❌ BAD - New function every render
   <Child onClick={() => handleClick(id)} />

   // ✅ GOOD - Stable reference
   const handleClick = useCallback(() => doSomething(id), [id]);
   <Child onClick={handleClick} />
   ```

4. **useState with Function Initializer:**
   ```typescript
   // ❌ BAD - Runs on every render
   const [state, setState] = useState(expensiveComputation());

   // ✅ GOOD - Runs once
   const [state, setState] = useState(() => expensiveComputation());
   ```

---

## Conclusion

This repository contains **89+ useState**, **65+ useEffect**, **76+ useCallback**, and **25+ useMemo** usages, demonstrating real-world patterns for building production React applications. Each pattern is carefully chosen for its specific use case, with proper error handling, cleanup, and performance optimization.

Study these patterns to:
- Understand when to use each hook
- Learn best practices and common pitfalls
- Prepare for technical interviews
- Build production-ready React applications

**Next Steps:**
1. Read through each hook section
2. Study the example files referenced
3. Practice implementing similar patterns
4. Review the interview talking points
5. Test your understanding with the common questions

