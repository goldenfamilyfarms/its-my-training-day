# React

Favorite: No
Status: Inbox
Created: January 6, 2026
Edited: January 12, 2026 5:20 PM
Archive: No
Pin: No

# REACT FE Mock interviews

Understanding React state and the lifecycle of a componeale user interfaces. In modern React (16.8+), while we primarily use **Hooks**, understanding the underlying lifecycle concepts remains essential.

---

## 1. Why State Management Matters for Rendering

At its core, React is a library that synchronizes your **UI** with your **State**. State management matters because:

- **Triggering Re-renders:** When state changes, React automatically re-renders the component to reflect those changes. Without state, the UI would be static.
- **Predictability:** Centralized or well-managed state ensures that the "source of truth" is consistent across different parts of the application.
- **Performance:** Poor state management (like lifting state too high or unnecessary updates) causes "over-rendering," which slows down the frontend.
- **User Experience:** State handles everything from form inputs and loading spinners to complex data fetched from APIs.

---

## 2. React Class Component Lifecycle Methods

In older Class Components, the lifecycle is divided into three main phases: **Mounting**, **Updating**, and **Unmounting**.

### Mounting (Birth)

These methods run when an instance of a component is being created and inserted into the DOM.

1. **`constructor()`**: Used to initialize local state or bind event handlers.
2. **`static getDerivedStateFromProps()`**: Rare. Used when the state depends on changes in props over time.
3. **`render()`**: The only required method. It examines `this.props` and `this.state` and returns the JSX.
4. **`componentDidMount()`**: Runs immediately after the component is put into the DOM. **Use this for:** API calls, timers, or DOM subscriptions.

### Updating (Growth)

Triggered by changes to props or state.

1. **`shouldComponentUpdate()`**: A performance tool. You can return `false` to tell React to skip the re-render.
2. **`render()`**: Re-renders the UI with new data.
3. **`getSnapshotBeforeUpdate()`**: Captures information from the DOM (like scroll position) before it changes.
4. **`componentDidUpdate()`**: Runs after the update is flushed to the DOM. **Use this for:** Updating the DOM in response to prop/state changes or making network requests based on comparisons of old vs. new data.

### Unmounting (Death)

1. **`componentWillUnmount()`**: Runs immediately before a component is destroyed. **Use this for:** Cleanup (invalidating timers, canceling network requests, or removing event listeners).

---

## 3. What Problems do React Hooks Solve?

Hooks were introduced to address several "pain points" in Class Components:

- **Complexity:** Lifecycle methods often contained a mix of unrelated logic (e.g., `componentDidMount` might handle both data fetching and event listeners).
- **Reusability:** It was difficult to share stateful logic between components without complex patterns like Higher-Order Components (HOCs) or Render Props.
- **"this" Keyword:** Classes require a deep understanding of how `this` works in JavaScript, which is a frequent source of bugs.
- **Giant Components:** Logic becomes hard to follow when it's split across multiple lifecycle methods.

---

## 4. How to Use Common Hooks

Hooks allow you to use state and other React features in functional components.

### `useState`: Managing Local State

This hook returns a pair: the current state value and a function to update it.

JavaScript

# 

`import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count is {count}
    </button>
  );
}`

### `useEffect`: Handling Side Effects

This hook replaces `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`. It takes a function and a **dependency array**.

- **No array:** Runs on every render.
- **Empty array `[]`:** Runs only once (like `componentDidMount`).
- **Array with values `[data]`:** Runs only when `data` changes.
- **Cleanup:** Returning a function inside `useEffect` acts as `componentWillUnmount`.

JavaScript

# 

`useEffect(() => {
  const timer = setInterval(() => console.log('Tick'), 1000);

  // Cleanup function
  return () => clearInterval(timer);
}, []);`

### `useContext`: Avoiding Prop Drilling

Allows you to access global data (like a user theme or auth status) without passing props through every level of the component tree.

---

**Would you like me to create a practical example showing how to refactor a specific Class Component into a Functional Component using Hooks?**

In React, **mounting** is **the process of creating a component instance and inserting its corresponding elements into the actual browser's Document Object Model (DOM) for the first time**.

This is the initial phase of a component's lifecycle, where it transitions from a conceptual idea in your code (a React element) to a visible, interactive part of the webpage.

**Key Concepts of Mounting**

- **DOM Insertion**: Mounting is essentially the React equivalent of using native DOM functions like `appendChild()` to make an element appear on the screen.
- **Initial Render**: A component is *rendered* many times throughout its life, but it is only *mounted* once, during its initial render. Subsequent renders are called "updates".
- **Lifecycle Hooks**: React provides specific methods and hooks that run during and after the mounting phase, allowing developers to perform necessary setup tasks.
    - For **class components**, the `componentDidMount()` lifecycle method is called immediately after the component is inserted into the DOM. This is a common place to fetch data from an API, set up event listeners, or interact directly with the DOM nodes.
    - For **functional components**, the `useEffect` hook with an empty dependency array (`[]`) serves a similar purpose, running the enclosed code after the component has mounted.

**Analogy**

Think of it like building a house:

- **Code** is the blueprint for the house.
- **Mounting** is the act of actually building the house and placing it on the property (the DOM).
- **Rendering** would be rearranging the furniture inside the already built house (updating the component's appearance).

Understanding mounting is crucial for knowing when your components are active and ready for interactions or complex operations.

To illustrate the transition from Class Components to Functional Components, we will refactor a **User Profile Loader**.

This component performs three common tasks:

1. **State Management**: Tracks user data and loading status.
2. **Lifecycle Logic**: Fetches data when the component mounts.
3. **Cleanup**: Clears a timer or subscription when the component unmounts.

---

## 1. The Class Component (The "Old" Way)

In a class, logic is split by *when* it happens (lifecycle methods) rather than *what* it does.

JavaScript

# 

`import React, { Component } from 'react';

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      loading: true,
      secondsActive: 0,
    };
    this.timer = null;
  }

  componentDidMount() {
    // 1. Fetch data
    this.fetchUserData(this.props.userId);

    // 2. Start a timer (Side Effect)
    this.timer = setInterval(() => {
      this.setState((prev) => ({ secondsActive: prev.secondsActive + 1 }));
    }, 1000);
  }

  componentDidUpdate(prevProps) {
    // 3. Re-fetch if the ID changes
    if (prevProps.userId !== this.props.userId) {
      this.fetchUserData(this.props.userId);
    }
  }

  componentWillUnmount() {
    // 4. Cleanup
    clearInterval(this.timer);
  }

  fetchUserData = (id) => {
    this.setState({ loading: true });
    fetch(`https://api.example.com/users/${id}`)
      .then(res => res.json())
      .then(data => this.setState({ user: data, loading: false }));
  }

  render() {
    const { user, loading, secondsActive } = this.state;
    if (loading) return <div>Loading...</div>;
    return (
      <div>
        <h1>{user.name}</h1>
        <p>Time on page: {secondsActive}s</p>
      </div>
    );
  }
}`

---

## 2. The Functional Component (The "Modern" Way)

Using Hooks, we group logic by **concern**. Notice how much cleaner the code becomes when we remove the `this` keyword and constructors.

JavaScript

# 

`import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  // Replace constructor state with useState
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsActive, setSecondsActive] = useState(0);

  // Hook for the Timer (Side Effect + Cleanup)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsActive((prev) => prev + 1);
    }, 1000);

    // This return function is the "componentWillUnmount" equivalent
    return () => clearInterval(timer);
  }, []); // Empty array: run once on mount

  // Hook for Fetching Data (Mount + Update)
  useEffect(() => {
    setLoading(true);
    fetch(`https://api.example.com/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]); // Run whenever userId changes (componentDidUpdate equivalent)

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Time on page: {secondsActive}s</p>
    </div>
  );
}`

---

## Key Differences Explained

### 1. State Declaration

- **Class**: One single `this.state` object.
- **Hooks**: Multiple `useState` calls. This allows you to update `loading` without worrying about accidentally overwriting `user`.

### 2. Side Effect Merging

- **Class**: You had to repeat code in `componentDidMount` and `componentDidUpdate` to ensure the component responded to prop changes.
- **Hooks**: The `useEffect` dependency array `[userId]` handles both the initial mount and any subsequent updates automatically.

### 3. Cleanup Logic

- **Class**: Cleanup logic (like `clearInterval`) is physically separated from the setup logic (`setInterval`).
- **Hooks**: The setup and cleanup live inside the same function, making it much harder to forget to clean up and cause memory leaks.

### 4. Boilerplate

- **Class**: Requires `extends Component`, `constructor(props)`, `super(props)`, and `render()`.
- **Hooks**: Just a plain JavaScript function.

---

**Would you like me to show you how to create a "Custom Hook" from this logic so you can reuse the user-fetching code in other parts of your app?**

## **Type Safety**

```tsx
// Prevents runtime errors
const [user, setUser] = useState<User | null>(null)
// TypeScript catches this error at compile time
setUser("invalid") // Error: string not assignable to User | null

```

Copy

## **State Shape Validation**

```tsx
interface AppState {
  isLoading: boolean
  user: User | null
  theme: 'light' | 'dark'
}

// Ensures state updates match expected structure
const [state, setState] = useState<AppState>({
  isLoading: false,
  user: null,
  theme: 'light'
})

```

Copytsx

## **Action Type Safety**

```tsx
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }

// Reducer with exhaustive type checking
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    // TypeScript ensures all cases are handled
  }
}

```

Copytsx

## **IntelliSense & Autocomplete**

- IDE suggests available state properties
- Autocompletes action types and payloads
- Shows parameter types for state setters

## **Refactoring Safety**

- Renaming state properties updates all references
- Changing state structure shows compilation errors
- Prevents breaking changes from propagating silently

## **Runtime Error Prevention**

- Catches type mismatches before deployment
- Validates state mutations at compile time
- Ensures consistent data flow patterns

TypeScript transforms state management from error-prone guesswork into predictable, maintainable code.

```python
mkdir -p src\components && mkdir -p src\components\ui
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add navigation-menu
npm install @radix-ui/react-navigation-menu class-variance-authority lucide-react
npm install clsx tailwind-merge

```

## Technical Interview Questions & Answers

### React/Frontend Questions (Questions 1-8)

**Question 1: "Our semiconductor manufacturing equipment generates real-time telemetry data at high frequency. How would you architect a React application to display live monitoring dashboards that update every 100ms without causing performance issues?"**

**Senior Developer Answer:**
"For high-frequency real-time data visualization, I'd implement a multi-layered optimization strategy:

First, I'd use WebSocket connections with a message queue pattern. Rather than updating state on every message, I'd batch updates using a buffer:

For the visualization layer, I'd implement virtualization for large datasets using react-window, and use React.memo with careful dependency management:

I'd also implement data decimation strategies, keeping only significant data points for visualization while maintaining full resolution for analysis. The architecture would include a Web Worker for data processing to keep the main thread responsive."

### breakdown

Because it hits the 3 things interviewers care about for this problem:

1. **You understood the real constraint (100ms updates)**
- Updating React state every 100ms (or worse, multiple times inside 100ms) can easily cause re-render storms, dropped frames, and a laggy UI.
- Your answer immediately frames this as a *performance architecture problem*, not “just use state and re-render.”
1. **You proposed the right high-level architecture: decouple ingestion → processing → rendering**
    
    What makes it strong is the implicit pipeline:
    
- **Ingestion:** WebSocket for push-based telemetry
- **Buffering/Batching:** queue/buffer so you *don’t* set state on every packet
- **Processing:** Web Worker to keep parsing/aggregation off the main thread
- **Rendering:** only render what the user can see, and only re-render what changed

That is exactly how you build UIs for high-frequency streams: React is the view layer, not the data pump.

1. **You named concrete techniques that map to real bottlenecks**
    
    Here’s why each technique is “senior-sounding” *and* practically correct:
    

### WebSocket + message queue / buffer

- Raw telemetry can arrive faster than the browser can paint.
- Buffering lets you control update cadence (e.g., 10fps or 30fps) even if messages come at 200fps.
- It shows you understand **backpressure** and **rate limiting** in a UI context.

### Batch updates instead of per-message state updates

- Calling `setState` for every message = lots of reconciliations.
- Batching means fewer renders and more stable frame timing.
- Even better if you coordinate flushes with `requestAnimationFrame` so rendering syncs with browser paint cycles.

### Virtualization (`react-window`)

- If you have long tables/logs/traces, rendering thousands of rows is a guaranteed perf killer.
- Virtualization keeps DOM node count low.
- That’s a very common “real dashboard” issue.

### `React.memo` + dependency discipline

- High-frequency data streams cause re-renders to cascade through component trees.
- Memoization shows you know how to contain re-renders to only the components that truly changed.

### Data decimation / downsampling

- Huge win: you often don’t *need* every point to draw a chart at screen resolution.
- The chart might be 800px wide; drawing 100,000 points is wasteful.
- Decimation (min/max per bucket, LTTB, etc.) preserves meaningful shape while reducing render cost.

### Web Worker for processing

- Telemetry parsing + aggregation can be CPU heavy.
- Doing it on the main thread competes with rendering and user interactions.
- Offloading to a Worker demonstrates you know how to keep the UI responsive.

---

## What would make it even stronger in an interview

If you want to level it up, add 2–3 specifics that show you can actually implement it:

- **“Render at a fixed UI cadence.”**
    
    “Even if telemetry arrives every 100ms, I might render at 250ms (4fps) for some panels and 100ms (10fps) for critical gauges. Users can’t perceive updates faster than the chart can draw anyway.”
    
- **Mention `useRef` for the buffer + scheduled flush**
    
    Buffer data in a ref (no re-render), then flush into state at controlled intervals.
    
- **Mention chart-specific optimizations**
    
    “Prefer Canvas/WebGL charts over SVG for dense plots.” (SVG chokes with too many points.)
    
- **Define separation of concerns**
    
    “A data layer (WebSocket + worker), a state layer (store), and a presentation layer (pure memoized components).”
    

---

## One caution (minor)

Your answer says “update every 100ms.” If you literally re-render the whole dashboard every 100ms, that’s still heavy. The best version of the answer explicitly says:

- **the UI will *ingest* at 100ms**, but it will **render selectively** and **only update components that need it** (and possibly at different cadences).

---

If you want, I can rewrite that answer into a tighter “speak it out loud” version (30–60 seconds) that sounds confident and interview-ready.

---

**Question 2: "Describe how you would implement a complex multi-step configuration wizard in React for setting up semiconductor manufacturing parameters, with validation, state persistence, and the ability to navigate between steps without losing data."**

**Senior Developer Answer:**
"I'd architect this using a combination of Context API for state management and a custom hook pattern for step logic:

```jsx
// Context for wizard state management
const WizardContext = React.createContext();

const WizardProvider = ({ children }) => {
  const [wizardState, setWizardState] = useState(() => {
    // Load from localStorage for persistence
    const saved = localStorage.getItem('wizard-config');
    return saved ? JSON.parse(saved) : {
      currentStep: 0,
      data: {
        processParameters: {},
        equipmentSettings: {},
        qualityThresholds: {},
        safetyChecks: {}
      },
      validationErrors: {},
      completedSteps: new Set()
    };
  });

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem('wizard-config', JSON.stringify(wizardState));
  }, [wizardState]);

  const updateStepData = useCallback((step, data) => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [step]: { ...prev.data[step], ...data }
      }
    }));
  }, []);

  const validateStep = useCallback(async (step) => {
    const validators = {
      processParameters: validateProcessParams,
      equipmentSettings: validateEquipment,
      qualityThresholds: validateQuality,
      safetyChecks: validateSafety
    };

    try {
      await validators[step](wizardState.data[step]);
      setWizardState(prev => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, [step]: null },
        completedSteps: new Set([...prev.completedSteps, step])
      }));
      return true;
    } catch (error) {
      setWizardState(prev => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, [step]: error }
      }));
      return false;
    }
  }, [wizardState.data]);

  return (
    <WizardContext.Provider value={{
      wizardState,
      updateStepData,
      validateStep,
      navigateToStep: (step) => setWizardState(prev => ({ ...prev, currentStep: step }))
    }}>
      {children}
    </WizardContext.Provider>
  );
};

// Custom hook for individual steps
const useWizardStep = (stepName) => {
  const context = useContext(WizardContext);
  const [localState, setLocalState] = useState(context.wizardState.data[stepName]);
  const [isDirty, setIsDirty] = useState(false);

  // Debounced save to context
  const debouncedSave = useMemo(
    () => debounce((data) => {
      context.updateStepData(stepName, data);
      setIsDirty(false);
    }, 500),
    [context, stepName]
  );

  const updateField = (field, value) => {
    const newState = { ...localState, [field]: value };
    setLocalState(newState);
    setIsDirty(true);
    debouncedSave(newState);
  };

  return {
    data: localState,
    updateField,
    isDirty,
    errors: context.wizardState.validationErrors[stepName],
    isCompleted: context.wizardState.completedSteps.has(stepName)
  };
};

```

For complex validations, I'd implement a schema-based validation system using Yup or Zod, with async validation for server-side checks. The UI would show real-time validation feedback and step completion indicators."

### Breakdown

Here’s how I’d answer that at a senior level, in a way that shows structure + tradeoffs + practical implementation.

# **Senior Developer Answer**

I’d treat this like a small state machine with a predictable data model, strong validation, and durable persistence.

**1) Model the wizard as “steps + schema + data”**

I’d define:

- A canonical data object representing the full configuration (e.g., recipeConfig)
- A step definition list (IDs, routes, fields owned by the step, validation rules, next/prev)
- A single source of truth for wizard state:
    - current step
    - form data
    - per-step completion status
    - validation errors
    - dirty flags / last saved timestamp
- 

This avoids “each step owns its own little state” (which is what causes data loss and inconsistency).

**2) Centralize state using a reducer (or a lightweight store)**

For a complex wizard, I prefer useReducer (or Zustand/Redux if the app is already using it) because you get:

- predictable state transitions
- easy debugging (actions tell a story)
- simpler persistence (serialize one object)

Typical actions:

- UPDATE_FIELD({ path, value })
- NEXT_STEP(), PREV_STEP(), GO_TO_STEP(stepId)
- SET_ERRORS(stepId, errors)
- LOAD_SAVED_CONFIG(payload)
- RESET_WIZARD()

This also helps a ton when requirements change (“Step 4 becomes optional if thermal mode is X”).

**3) Validation strategy: step-level + cross-step validation**

For validation I’d use a schema library like Zod or Yup:

- Step-level validation (only validate fields relevant to the current step on “Next”)
- Cross-step validation (validate the whole config before final submit)

Example:

- Step 2 validates temperature range and ramp rate format
- Final submission validates constraints like:
    - “cooling profile must be compatible with packaging type”
    - “pressure limits must match chamber selection”
    - “recipe name must be unique”
- 

I’d show errors inline and at the top of the step, and prevent advancing if blocking errors exist.

**4) Persistence: autosave + restore (local + server)**

To prevent data loss, I’d implement state persistence with two layers:

- Local persistence (fast, resilient):
    - Save to localStorage or IndexedDB
    - Debounce saves (e.g., every 300–500ms after changes)
    - Version the payload (schemaVersion) so changes don’t break restore
- 
- Server persistence (if user sessions matter):
    - Save drafts to an API (e.g., /config-drafts/:id)
    - Use optimistic updates or “saved” indicators
    - Handle conflict resolution (last-write-wins or prompt user)
- 

On load, I’d:

- check server draft first (if logged in)
- fall back to local draft
- validate/upgrade payload if schema changed

**5) Navigation without data loss: never unmount state**

I’d keep wizard state in a parent container (or global store), and render steps as children so moving between steps doesn’t wipe data.

Two common patterns:

- Route-based steps (/wizard/step/3) for deep-linking and browser back/forward support
- In-component stepper for simpler apps

Either way, the step components are “dumb forms”:

- they read from central state
- they dispatch field updates
- they display validation errors
They don’t own the canonical data.

**6) UX details that matter in a manufacturing context**

Because these are manufacturing parameters, I’d add:

- guardrails: min/max sliders, unit labels, and safe defaults
- confirmations for risky changes (e.g., exceeding recommended ranges)
- review step: summary diff + validation warnings before apply
- audit trail: record who changed what and when (if needed)

**7) Submission flow**

On final submit:

- run full schema validation
- transform UI-friendly values to backend payload (units, rounding, enums)
- submit config
- show success + generated config ID
- clear local draft (or keep for “clone recipe”)

# **Short “Speak it out loud” version (20–30 seconds)**

If you want something tighter:

“I’d implement the wizard with a single source of truth for form data using a reducer or store, so navigating between steps never loses state. Each step is a view over the central config object. Validation would be schema-driven—step-level validation on Next and full cross-step validation before submit. For persistence, I’d autosave drafts with debounced writes to localStorage/IndexedDB and optionally sync to a server draft endpoint, with schema versioning for upgrades. Finally, I’d support route-based steps for deep-linking and browser navigation, plus a review step and guardrails since these are manufacturing parameters.”

If you want, I can also give you:

- a follow-up “interviewer drilldown”: “show me the reducer shape/actions,”
- or a whiteboard-level design (components + data flow diagram in words).

---

**Question 3: "How would you optimize a React component that renders a large table of semiconductor wafer test results (10,000+ rows) with features like sorting, filtering, and inline editing?"**

**Senior Developer Answer:**
"For handling large datasets efficiently, I'd implement a virtualized table with multiple optimization layers:

```jsx
import { VariableSizeGrid } from 'react-window';
import { useState, useMemo, useCallback } from 'react';

const WaferTestResultsTable = ({ initialData }) => {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // Virtualized cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const row = processedData[rowIndex];
    const column = columns[columnIndex];
    const cellKey = `${rowIndex}-${columnIndex}`;
    const isEditing = editingCell === cellKey;

    if (isEditing) {
      return (
        <div style={style}>
          <input
            autoFocus
            defaultValue={row[column.key]}
            onBlur={(e) => handleCellEdit(rowIndex, column.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellEdit(rowIndex, column.key, e.target.value);
              }
              if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
          />
        </div>
      );
    }

    return (
      <div
        style={style}
        onClick={() => column.editable && setEditingCell(cellKey)}
        className={`cell ${column.editable ? 'editable' : ''}`}
      >
        {formatCellValue(row[column.key], column.type)}
      </div>
    );
  }, [processedData, editingCell]);

  // Optimized edit handler with batching
  const handleCellEdit = useCallback((rowIndex, columnKey, value) => {
    setData(prevData => {
      const newData = [...prevData];
      const actualIndex = data.indexOf(processedData[rowIndex]);
      newData[actualIndex] = {
        ...newData[actualIndex],
        [columnKey]: value
      };

      // Batch update to backend
      batchUpdate(newData[actualIndex]);
      return newData;
    });
    setEditingCell(null);
  }, [processedData, data]);

  // Implement column width calculation
  const getColumnWidth = useCallback((index) => {
    const column = columns[index];
    return column.width || 150;
  }, []);

  const getRowHeight = useCallback(() => 40, []);

  return (
    <div className="table-container">
      <TableHeader
        columns={columns}
        onSort={setSortConfig}
        onFilter={setFilters}
        sortConfig={sortConfig}
        filters={filters}
      />

      <VariableSizeGrid
        columnCount={columns.length}
        rowCount={processedData.length}
        columnWidth={getColumnWidth}
        rowHeight={getRowHeight}
        height={600}
        width={1200}
        itemData={processedData}
      >
        {Cell}
      </VariableSizeGrid>

      <TableFooter
        totalRows={data.length}
        filteredRows={processedData.length}
      />
    </div>
  );
};

// Batch update utility with debouncing
const batchUpdate = debounce((updates) => {
  fetch('/api/wafer-results/batch', {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}, 1000);

```

I'd also implement lazy loading for initial data fetch, index-based keying for React reconciliation optimization, and Web Worker-based filtering/sorting for datasets exceeding 50,000 rows."

---

**Question 4: "Explain how you would implement error boundaries in a React application monitoring semiconductor equipment, ensuring critical failures are caught, logged, and users see appropriate fallback UIs."**

**Senior Developer Answer:**
"I'd implement a comprehensive error boundary strategy with multiple layers and telemetry integration:

```jsx
// Base error boundary with telemetry
class EquipmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = generateErrorId();

    // Log to monitoring service
    this.logErrorToService({
      errorId,
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userId: this.props.userId,
      equipmentId: this.props.equipmentId,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: getSessionId()
      }
    });

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
      errorId
    }));

    // Check for error threshold
    if (this.state.errorCount > 3) {
      this.escalateToMaintenance();
    }
  }

  logErrorToService = async (errorData) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });

      // Also send to external monitoring (e.g., Sentry)
      if (window.Sentry) {
        window.Sentry.captureException(errorData.error, {
          extra: errorData
        });
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      // Store in localStorage as fallback
      const errors = JSON.parse(localStorage.getItem('offline-errors') || '[]');
      errors.push(errorData);
      localStorage.setItem('offline-errors', JSON.stringify(errors));
    }
  };

  escalateToMaintenance = () => {
    // Trigger maintenance mode for critical equipment
    fetch('/api/equipment/maintenance-mode', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Multiple UI errors detected',
        equipmentId: this.props.equipmentId
      })
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { level = 'page' } = this.props;

      return (
        <ErrorFallback
          level={level}
          errorId={this.state.errorId}
          onReset={this.handleReset}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
const CriticalSystemBoundary = ({ children, equipmentId }) => (
  <EquipmentErrorBoundary level="critical" equipmentId={equipmentId}>
    {children}
  </EquipmentErrorBoundary>
);

const DataVisualizationBoundary = ({ children }) => (
  <EquipmentErrorBoundary level="visualization">
    {children}
  </EquipmentErrorBoundary>
);

// Fallback component with recovery options
const ErrorFallback = ({ level, errorId, onReset, error }) => {
  const [showDetails, setShowDetails] = useState(false);

  const fallbackContent = {
    critical: (
      <div className="error-critical">
        <AlertTriangle size={48} />
        <h2>Critical System Error</h2>
        <p>Equipment monitoring has encountered an error.</p>
        <p>Error ID: {errorId}</p>
        <button onClick={() => window.location.href = '/emergency-shutdown'}>
          Emergency Shutdown
        </button>
      </div>
    ),
    page: (
      <div className="error-page">
        <h2>Something went wrong</h2>
        <p>Error ID: {errorId}</p>
        <button onClick={onReset}>Try Again</button>
        <button onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
        {showDetails && (
          <pre className="error-details">
            {error?.toString()}
          </pre>
        )}
      </div>
    ),
    visualization: (
      <div className="error-visualization">
        <p>Chart temporarily unavailable</p>
        <button onClick={onReset}>Reload Chart</button>
      </div>
    )
  };

  return fallbackContent[level] || fallbackContent.page;
};

// Hook for error handling in functional components
const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const resetError = () => setError(null);

  const captureError = (error) => {
    setError(error);
    // Trigger error boundary
    throw error;
  };

  return { error, resetError, captureError };
};

```

This approach ensures critical equipment monitoring continues even with UI errors, provides detailed diagnostics for debugging, and maintains user confidence with appropriate fallback UIs."

---

**Question 5: "How would you implement micro-frontend architecture for a semiconductor manufacturing platform where different teams maintain different modules (equipment control, quality analysis, inventory management)?"**

**Senior Developer Answer:**
"I'd implement Module Federation with Webpack 5 for a robust micro-frontend architecture:

```jsx
// Host application webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        equipmentControl: 'equipmentControl@http://localhost:3001/remoteEntry.js',
        qualityAnalysis: 'qualityAnalysis@http://localhost:3002/remoteEntry.js',
        inventoryManagement: 'inventory@http://localhost:3003/remoteEntry.js'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        '@semiconductor/shared-ui': { singleton: true },
        '@semiconductor/auth': { singleton: true }
      }
    })
  ]
};

// Host application router with lazy loading
const App = () => {
  const [user, setUser] = useState(null);

  return (
    <AuthProvider value={{ user, setUser }}>
      <Router>
        <NavBar />
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route
                path="/equipment/*"
                element={
                  <RemoteModule
                    module="equipmentControl"
                    component="EquipmentApp"
                    fallback={<EquipmentFallback />}
                  />
                }
              />
              <Route
                path="/quality/*"
                element={
                  <RemoteModule
                    module="qualityAnalysis"
                    component="QualityApp"
                  />
                }
              />
              <Route
                path="/inventory/*"
                element={
                  <RemoteModule
                    module="inventoryManagement"
                    component="InventoryApp"
                  />
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

// Remote module loader with error handling
const RemoteModule = ({ module, component, fallback }) => {
  const [Module, setModule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        // Dynamic import with retry logic
        const container = await loadRemoteContainer(module);
        const factory = await container.get(`./${component}`);
        const Module = factory();
        setModule(() => Module.default || Module);
      } catch (err) {
        console.error(`Failed to load module ${module}:`, err);
        setError(err);

        // Fallback to local version if available
        if (fallback) {
          setModule(() => fallback);
        }
      }
    };

    loadModule();
  }, [module, component]);

  if (error && !fallback) {
    return <div>Failed to load {module} module</div>;
  }

  if (!Module) {
    return <LoadingSpinner />;
  }

  return <Module />;
};

// Shared event bus for cross-module communication
class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

const eventBus = new EventBus();

// Shared state management with Module Federation
const SharedStateProvider = ({ children }) => {
  const [sharedState, setSharedState] = useState({
    selectedEquipment: null,
    activeAlerts: [],
    userPermissions: {}
  });

  useEffect(() => {
    // Subscribe to cross-module events
    const unsubscribe = eventBus.subscribe('equipment:selected', (equipment) => {
      setSharedState(prev => ({ ...prev, selectedEquipment: equipment }));
    });

    return unsubscribe;
  }, []);

  return (
    <SharedStateContext.Provider value={{ sharedState, setSharedState, eventBus }}>
      {children}
    </SharedStateContext.Provider>
  );
};

// Individual micro-frontend configuration
// equipment-control/webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'equipmentControl',
      filename: 'remoteEntry.js',
      exposes: {
        './EquipmentApp': './src/EquipmentApp'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        '@semiconductor/shared-ui': { singleton: true }
      }
    })
  ]
};

```

I'd also implement versioning strategies for independent deployments, shared component libraries with Lerna/Nx, and CI/CD pipelines for each micro-frontend with integration testing."

---

**Question 6: "Walk me through implementing custom React hooks for managing WebSocket connections to semiconductor equipment sensors, including reconnection logic and state synchronization."**

**Senior Developer Answer:**
"I'd create a comprehensive WebSocket management system with automatic reconnection and state synchronization:

```jsx
// Core WebSocket hook with reconnection logic
const useEquipmentWebSocket = (url, options = {}) => {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef(null);
  const messageQueueRef = useRef([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        startHeartbeat();

        // Flush message queue
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          wsRef.current.send(JSON.stringify(queuedMessage));
        }

        onOpen?.(event);
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Handle different message types
        if (message.type === 'pong') {
          // Heartbeat response
          return;
        }

        setLastMessage(message);
        setMessageHistory(prev => [...prev.slice(-99), message]);

        onMessage?.(message);
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        onError?.(event);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed');
        setConnectionState('disconnected');
        stopHeartbeat();

        onClose?.(event);

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          setConnectionState('failed');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('error');
      scheduleReconnect();
    }
  }, [url, maxReconnectAttempts, onOpen, onClose, onError, onMessage]);

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);

    const backoffDelay = Math.min(
      reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      30000
    );

    setConnectionState('reconnecting');
    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, backoffDelay);
  }, [reconnectInterval, connect]);

  const startHeartbeat = useCallback(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatIntervalRef.current);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      messageQueueRef.current.push(message);

      // Attempt to reconnect
      if (connectionState === 'disconnected') {
        connect();
      }
    }
  }, [connectionState, connect]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
  }, [stopHeartbeat]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    connectionState,
    lastMessage,
    messageHistory,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

// Specialized hook for equipment sensor data
const useEquipmentSensors = (equipmentId) => {
  const [sensorData, setSensorData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [syncStatus, setSyncStatus] = useState('syncing');

  const { connectionState, sendMessage, lastMessage } = useEquipmentWebSocket(
    `ws://equipment.local/sensors/${equipmentId}`,
    {
      onMessage: (message) => {
        switch (message.type) {
          case 'sensor_update':
            handleSensorUpdate(message.data);
            break;
          case 'alert':
            handleAlert(message.data);
            break;
          case 'sync_complete':
            setSyncStatus('synced');
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      },
      onOpen: () => {
        // Request initial sync
        sendMessage({ type: 'sync_request', equipmentId });
      }
    }
  );

  const handleSensorUpdate = useCallback((data) => {
    setSensorData(prev => ({
      ...prev,
      [data.sensorId]: {
        value: data.value,
        timestamp: data.timestamp,
        unit: data.unit,
        status: data.status
      }
    }));

    // Check thresholds
    if (data.value > data.threshold?.max || data.value < data.threshold?.min) {
      handleAlert({
        level: 'warning',
        sensorId: data.sensorId,
        message: `Sensor ${data.sensorId} out of range: ${data.value}${data.unit}`
      });
    }
  }, []);

  const handleAlert = useCallback((alert) => {
    setAlerts(prev => [
      ...prev,
      {
        ...alert,
        id: generateId(),
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const updateSensorConfig = useCallback((sensorId, config) => {
    sendMessage({
      type: 'config_update',
      sensorId,
      config
    });
  }, [sendMessage]);

  const acknowledgAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    sendMessage({
      type: 'alert_acknowledged',
      alertId
    });
  }, [sendMessage]);

  return {
    sensorData,
    alerts,
    connectionState,
    syncStatus,
    updateSensorConfig,
    acknowledgAlert
  };
};

// Usage in component
const EquipmentMonitor = ({ equipmentId }) => {
  const {
    sensorData,
    alerts,
    connectionState,
    syncStatus
  } = useEquipmentSensors(equipmentId);

  return (
    <div className="equipment-monitor">
      <ConnectionStatus state={connectionState} />

      {syncStatus === 'syncing' && <LoadingSpinner />}

      {alerts.length > 0 && (
        <AlertPanel alerts={alerts} />
      )}

      <SensorGrid data={sensorData} />
    </div>
  );
};

```

This implementation handles connection resilience, message queueing, state synchronization, and provides a clean API for components to consume real-time sensor data."

---

**Question 7: "How would you implement accessibility (a11y) features in a React application used by semiconductor technicians who may be working in clean rooms with limited visibility or wearing protective equipment?"**

**Senior Developer Answer:**
"I'd implement comprehensive accessibility features specifically tailored for clean room environments:

```jsx
// Accessibility context for user preferences
const AccessibilityContext = React.createContext();

const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('a11y-settings');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      fontSize: 'normal',
      keyboardOnly: false,
      audioAlerts: true,
      hapticFeedback: true,
      voiceCommands: false,
      reducedMotion: false,
      screenReaderMode: false
    };
  });

  // Voice command integration for hands-free operation
  useEffect(() => {
    if (settings.voiceCommands) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };

      recognition.start();
      return () => recognition.stop();
    }
  }, [settings.voiceCommands]);

  const handleVoiceCommand = (command) => {
    const commands = {
      'emergency stop': () => window.dispatchEvent(new CustomEvent('emergency-stop')),
      'next step': () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'next' })),
      'previous step': () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'prev' })),
      'confirm': () => document.activeElement?.click(),
      'read status': () => announceStatus()
    };

    const action = Object.keys(commands).find(key => command.includes(key));
    if (action) {
      commands[action]();
      provideAudioFeedback('Command executed');
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, setSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// High contrast button component for gloved operation
const CleanRoomButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'large',
  critical = false,
  ...props
}) => {
  const { settings } = useContext(AccessibilityContext);
  const [isPressed, setIsPressed] = useState(false);

  // Larger touch targets for gloved hands
  const sizeClasses = {
    large: 'min-w-48 min-h-16 text-2xl',
    xlarge: 'min-w-64 min-h-20 text-3xl',
    critical: 'min-w-80 min-h-24 text-4xl'
  };

  // High contrast color schemes
  const getColorClass = () => {
    if (critical) return 'bg-red-600 text-white border-4 border-red-800';
    if (settings.highContrast) {
      return variant === 'primary'
        ? 'bg-black text-yellow border-4 border-yellow'
        : 'bg-white text-black border-4 border-black';
    }
    return variant === 'primary'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-200 text-gray-800';
  };

  const handleClick = (e) => {
    // Haptic feedback for touch devices
    if (settings.hapticFeedback && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // Audio feedback
    if (settings.audioAlerts) {
      playSound(critical ? 'critical-action' : 'button-click');
    }

    onClick?.(e);
  };

  return (
    <button
      className={`
        ${sizeClasses[critical ? 'critical' : size]}
        ${getColorClass()}
        font-bold rounded-lg px-8 py-4
        focus:ring-4 focus:ring-offset-4
        transition-all duration-200
        ${settings.reducedMotion ? '' : 'hover:scale-105 active:scale-95'}
      `}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      aria-pressed={isPressed}
      {...props}
    >
      {children}
      {critical && (
        <span className="sr-only">Critical action - requires confirmation</span>
      )}
    </button>
  );
};

// Status announcer for screen readers and audio feedback
const StatusAnnouncer = ({ status, priority = 'polite' }) => {
  const { settings } = useContext(AccessibilityContext);
  const announcerRef = useRef();

  useEffect(() => {
    if (status) {
      // Update ARIA live region
      if (announcerRef.current) {
        announcerRef.current.textContent = status;
      }

      // Audio announcement
      if (settings.audioAlerts) {
        speakText(status);
      }
    }
  }, [status, settings.audioAlerts]);

  return (
    <>
      <div
        ref={announcerRef}
        role="status"
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
      />
      {settings.screenReaderMode && (
        <div className="bg-yellow-100 p-4 mt-2 text-black text-xl">
          Status: {status}
        </div>
      )}
    </>
  );
};

// Keyboard navigation hook for equipment controls
const useKeyboardNavigation = (items, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowDown':
        case 'Tab':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
        case 'Shift+Tab':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[focusedIndex]);
          break;
        case 'Escape':
          document.activeElement?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, setFocusedIndex };
};

// Equipment control panel with full accessibility
const EquipmentControlPanel = ({ equipment }) => {
  const { settings } = useContext(AccessibilityContext);
  const [currentStatus, setCurrentStatus] = useState('');

  const controls = [
    { id: 'start', label: 'Start Process', action: 'start' },
    { id: 'stop', label: 'Stop Process', action: 'stop', critical: true },
    { id: 'pause', label: 'Pause', action: 'pause' }
  ];

  const { focusedIndex } = useKeyboardNavigation(controls, (control) => {
    executeControl(control);
  });

  return (
    <div
      role="region"
      aria-label="Equipment Control Panel"
      className={settings.highContrast ? 'bg-white text-black' : ''}
    >
      <h2 className="text-3xl font-bold mb-6" id="panel-title">
        Equipment Controls - {equipment.name}
      </h2>

      <StatusAnnouncer status={currentStatus} priority="assertive" />

      <div className="grid gap-6" role="group" aria-labelledby="panel-title">
        {controls.map((control, index) => (
          <CleanRoomButton
            key={control.id}
            onClick={() => executeControl(control)}
            critical={control.critical}
            aria-describedby={`${control.id}-desc`}
            tabIndex={focusedIndex === index ? 0 : -1}
            data-focused={focusedIndex === index}
          >
            {control.label}
            <span id={`${control.id}-desc`} className="sr-only">
              {control.critical ? 'This action will stop all processes immediately' : ''}
            </span>
          </CleanRoomButton>
        ))}
      </div>

      <SkipLink href="#main-content">Skip to main content</SkipLink>
    </div>
  );
};

```

This implementation addresses clean room challenges with large touch targets for gloved operation, high contrast modes for foggy face shields, voice commands for hands-free control, and comprehensive keyboard navigation for efficiency."

---

**Question 8: "Describe how you would implement state management for a complex React application without using Redux, specifically for semiconductor manufacturing workflows with real-time data updates."**

**Senior Developer Answer:**
"I'd implement a custom state management solution using React's built-in features combined with observables for real-time data:

```jsx
// Observable state manager using Proxy and EventEmitter pattern
class ObservableStore extends EventTarget {
  constructor(initialState) {
    super();
    this._state = this.createProxy(initialState);
    this._subscribers = new Map();
    this._history = [];
    this._historyIndex = -1;
  }

  createProxy(obj, path = []) {
    return new Proxy(obj, {
      get: (target, property) => {
        const value = target[property];
        if (value && typeof value === 'object') {
          return this.createProxy(value, [...path, property]);
        }
        return value;
      },
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;

        // Track changes
        this.notifyChange([...path, property], oldValue, value);

        // Update history for time-travel debugging
        this._history = this._history.slice(0, this._historyIndex + 1);
        this._history.push({
          timestamp: Date.now(),
          path: [...path, property],
          oldValue,
          newValue: value
        });
        this._historyIndex++;

        return true;
      }
    });
  }

  notifyChange(path, oldValue, newValue) {
    const event = new CustomEvent('statechange', {
      detail: { path, oldValue, newValue }
    });
    this.dispatchEvent(event);

    // Notify specific subscribers
    const pathStr = path.join('.');
    this._subscribers.forEach((callback, subscribedPath) => {
      if (pathStr.startsWith(subscribedPath)) {
        callback({ path, oldValue, newValue });
      }
    });
  }

  get state() {
    return this._state;
  }

  subscribe(path, callback) {
    const pathStr = Array.isArray(path) ? path.join('.') : path;
    this._subscribers.set(pathStr, callback);

    return () => {
      this._subscribers.delete(pathStr);
    };
  }

  // Time-travel debugging
  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      const { path, oldValue } = this._history[this._historyIndex + 1];
      this.setValueAtPath(path, oldValue);
    }
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      const { path, newValue } = this._history[this._historyIndex];
      this.setValueAtPath(path, newValue);
    }
  }

  setValueAtPath(path, value) {
    let current = this._state;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }
}

// Create stores for different domains
const manufacturingStore = new ObservableStore({
  equipment: {
    waferProcessor: { status: 'idle', temperature: 0, pressure: 0 },
    photolithography: { status: 'idle', alignment: 0 }
  },
  processes: {
    active: [],
    queued: [],
    completed: []
  },
  quality: {
    defectRate: 0,
    yield: 100,
    measurements: []
  }
});

// Custom hook for subscribing to store changes
const useObservableStore = (store, path) => {
  const [value, setValue] = useState(() => {
    if (!path) return store.state;

    const pathArray = path.split('.');
    let current = store.state;
    for (const key of pathArray) {
      current = current[key];
    }
    return current;
  });

  useEffect(() => {
    const unsubscribe = store.subscribe(path || '', (change) => {
      // Get updated value
      let current = store.state;
      if (path) {
        const pathArray = path.split('.');
        for (const key of pathArray) {
          current = current[key];
        }
      }
      setValue(current);
    });

    return unsubscribe;
  }, [store, path]);

  return value;
};

// Context-based state management with reducer pattern
const ManufacturingContext = React.createContext();

const manufacturingReducer = (state, action) => {
  switch (action.type) {
    case 'START_PROCESS':
      return {
        ...state,
        processes: {
          ...state.processes,
          active: [...state.processes.active, action.payload],
          queued: state.processes.queued.filter(p => p.id !== action.payload.id)
        }
      };

    case 'UPDATE_EQUIPMENT':
      return {
        ...state,
        equipment: {
          ...state.equipment,
          [action.payload.id]: {
            ...state.equipment[action.payload.id],
            ...action.payload.data
          }
        }
      };

    case 'QUALITY_MEASUREMENT':
      return {
        ...state,
        quality: {
          ...state.quality,
          measurements: [...state.quality.measurements, action.payload],
          defectRate: calculateDefectRate([...state.quality.measurements, action.payload])
        }
      };

    default:
      return state;
  }
};

// Provider with middleware support
const ManufacturingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    manufacturingReducer,
    initialState,
    (initial) => {
      // Load from localStorage if available
      const stored = localStorage.getItem('manufacturing-state');
      return stored ? JSON.parse(stored) : initial;
    }
  );

  // Middleware for logging and persistence
  const enhancedDispatch = useCallback((action) => {
    console.log('Action:', action);

    // Pre-dispatch middleware
    if (action.type === 'START_PROCESS') {
      // Validate process before starting
      if (!validateProcess(action.payload)) {
        console.error('Invalid process configuration');
        return;
      }
    }

    dispatch(action);

    // Post-dispatch effects
    if (action.type === 'UPDATE_EQUIPMENT' && action.payload.data.status === 'error') {
      // Send alert
      sendAlert({
        level: 'critical',
        message: `Equipment ${action.payload.id} error`,
        equipment: action.payload.id
      });
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('manufacturing-state', JSON.stringify(state));
  }, [state]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://manufacturing.local/realtime');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      switch (update.type) {
        case 'equipment_update':
          enhancedDispatch({
            type: 'UPDATE_EQUIPMENT',
            payload: update.data
          });
          break;

        case 'quality_data':
          enhancedDispatch({
            type: 'QUALITY_MEASUREMENT',
            payload: update.data
          });
          break;
      }
    };

    return () => ws.close();
  }, [enhancedDispatch]);

  return (
    <ManufacturingContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </ManufacturingContext.Provider>
  );
};

// Custom hooks for specific state slices
const useEquipmentStatus = (equipmentId) => {
  const { state } = useContext(ManufacturingContext);
  return state.equipment[equipmentId];
};

const useProcessQueue = () => {
  const { state, dispatch } = useContext(ManufacturingContext);

  const startProcess = useCallback((process) => {
    dispatch({ type: 'START_PROCESS', payload: process });
  }, [dispatch]);

  return {
    active: state.processes.active,
    queued: state.processes.queued,
    startProcess
  };
};

// Usage example
const EquipmentDashboard = () => {
  const waferProcessor = useObservableStore(manufacturingStore, 'equipment.waferProcessor');
  const { active, startProcess } = useProcessQueue();

  return (
    <div>
      <h2>Wafer Processor Status: {waferProcessor.status}</h2>
      <p>Temperature: {waferProcessor.temperature}°C</p>
      <p>Active Processes: {active.length}</p>
      <button onClick={() => startProcess({ id: '123', type: 'oxidation' })}>
        Start Oxidation
      </button>
    </div>
  );
};

```

This approach provides fine-grained reactivity, time-travel debugging, middleware support, and efficient updates without the overhead of Redux."

---

### Linux/Backend Questions (Questions 9-15)

**Question 9: "You're deploying a containerized semiconductor control system on Linux. Walk through setting up a secure, high-performance environment with real-time constraints and hardware access requirements."**

**Senior Developer Answer:**
"I'd configure a real-time Linux environment optimized for semiconductor control systems:

```bash
# 1. Install RT-PREEMPT kernel for real-time capabilities
sudo apt-get install linux-image-rt-amd64
sudo apt-get install linux-headers-rt-amd64

# Configure GRUB for RT kernel
sudo nano /etc/default/grub
# Add: GRUB_CMDLINE_LINUX="isolcpus=2-7 rcu_nocbs=2-7 nohz_full=2-7 intel_pstate=disable"

# 2. CPU isolation and affinity configuration
# Create systemd service for CPU shielding
cat << 'EOF' > /etc/systemd/system/cpu-shield.service
[Unit]
Description=CPU Shielding for RT processes
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-rt-cpus.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# CPU setup script
cat << 'EOF' > /usr/local/bin/setup-rt-cpus.sh
#!/bin/bash
# Disable IRQ balancing for isolated CPUs
echo 0 > /proc/irq/default_smp_affinity

# Set IRQ affinity to housekeeping CPUs (0-1)
for irq in /proc/irq/[0-9]*; do
    echo 3 > $irq/smp_affinity 2>/dev/null
done

# Configure CPU frequency governor
for cpu in /sys/devices/system/cpu/cpu[2-7]/cpufreq/scaling_governor; do
    echo performance > $cpu
done

# Disable CPU idle states for RT cores
for cpu in /sys/devices/system/cpu/cpu[2-7]/cpuidle/state*/disable; do
    echo 1 > $cpu
done
EOF

# 3. Docker configuration for hardware access
# Create custom Docker daemon config
cat << 'EOF' > /etc/docker/daemon.json
{
  "default-runtime": "nvidia",
  "runtimes": {
    "nvidia": {
      "path": "nvidia-container-runtime",
      "runtimeArgs": []
    }
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "10"
  },
  "default-ulimits": {
    "memlock": {
      "Name": "memlock",
      "Hard": -1,
      "Soft": -1
    },
    "rtprio": {
      "Name": "rtprio",
      "Hard": 99,
      "Soft": 99
    }
  }
}
EOF

# 4. Container deployment with hardware access
# Dockerfile for semiconductor control application
cat << 'EOF' > Dockerfile
FROM ubuntu:22.04-rt

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libudev-dev \
    libusb-1.0-0-dev \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install RT utilities
RUN apt-get install -y \
    rt-tests \
    stress-ng \
    numactl \
    hwloc

# Create non-root user with RT capabilities
RUN groupadd -g 1000 semiconductor && \
    useradd -u 1000 -g semiconductor -m semiconductor && \
    usermod -a -G dialout,gpio,i2c,spi semiconductor

# Set capabilities for RT scheduling
RUN setcap cap_sys_nice=ep /usr/bin/node

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --chown=semiconductor:semiconductor . .

USER semiconductor

# Set RT scheduling priority
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV GODEBUG="madvdontneed=1"

CMD ["node", "server.js"]
EOF

# 5. Docker Compose with security and performance settings
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  control-system:
    build: .
    image: semiconductor-control:latest
    container_name: semiconductor-control

    # Security options
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined  # Required for RT scheduling
      - apparmor:unconfined

    # Capabilities
    cap_add:
      - SYS_NICE      # RT scheduling
      - SYS_RAWIO     # Direct hardware access
      - NET_ADMIN     # Network configuration
      - IPC_LOCK      # Memory locking

    # Device access
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # Serial devices
      - /dev/spidev0.0:/dev/spidev0.0  # SPI
      - /dev/i2c-1:/dev/i2c-1  # I2C
      - /dev/mem:/dev/mem  # Direct memory access

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

    # CPU affinity
    cpuset: "2-5"

    # Memory and scheduling
    mem_swappiness: 0
    memswap_limit: 8G
    oom_kill_disable: true

    # RT scheduling priority
    ulimits:
      rtprio: 99
      memlock: -1
      nofile:
        soft: 65536
        hard: 65536

    # Networking
    network_mode: host

    # Volumes
    volumes:
      - /sys:/sys:ro
      - /dev/shm:/dev/shm
      - ./data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock:ro

    # Environment
    environment:
      - RT_RUNTIME_GREED=100000
      - RT_RUNTIME_SHARE=950000
      - MALLOC_ARENA_MAX=2
      - NODE_ENV=production

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 40s

    restart: unless-stopped

    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
        labels: "service=control-system"

  monitoring:
    image: grafana/grafana:latest
    container_name: semiconductor-monitoring

    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
      - GF_INSTALL_PLUGINS=redis-datasource

    ports:
      - "3001:3000"

    depends_on:
      - control-system

    restart: unless-stopped

volumes:
  grafana-data:
    driver: local
EOF

# 6. Security hardening script
cat << 'EOF' > security-setup.sh
#!/bin/bash

# Enable SELinux/AppArmor
aa-enforce /etc/apparmor.d/*

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # SSH
ufw allow 3000/tcp  # Application
ufw allow 3001/tcp  # Monitoring
ufw enable

# Kernel hardening
cat >> /etc/sysctl.conf << EOL
# Network security
net.ipv4.tcp_syncookies = 1
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0

# Memory protection
kernel.randomize_va_space = 2
kernel.exec-shield = 1
kernel.dmesg_restrict = 1

# RT performance
kernel.sched_rt_runtime_us = 950000
kernel.sched_rt_period_us = 1000000
vm.swappiness = 0
EOL

sysctl -p

# Setup audit logging
auditctl -w /app -p wa -k semiconductor_app
auditctl -w /etc/docker -p wa -k docker_config
EOF

# 7. Performance monitoring setup
cat << 'EOF' > monitor.sh
#!/bin/bash

# Check RT latency
cyclictest -m -n -p 99 -t 4 -a 2-5 -l 100000 -q > /var/log/rt-latency.log &

# Monitor system metrics
while true; do
    # CPU utilization for RT cores
    mpstat -P 2-5 1 1 | tail -n 4

    # Memory usage
    free -h

    # Process RT priorities
    ps -eLo pid,tid,class,rtprio,ni,pri,psr,pcpu,comm | grep -E "FF|RR"

    # Hardware interrupts
    cat /proc/interrupts | grep -E "CPU2|CPU3|CPU4|CPU5"

    sleep 5
done
EOF

chmod +x security-setup.sh monitor.sh
./security-setup.sh

```

This setup ensures deterministic real-time performance, secure hardware access, CPU isolation for critical processes, and comprehensive monitoring for semiconductor control systems."

---

**Question 10: "Design and implement a Git workflow and CI/CD pipeline for this semiconductor software team, considering hardware-in-the-loop testing and regulatory compliance requirements."**

**Senior Developer Answer:**
"I'll design a comprehensive GitOps workflow with hardware-in-the-loop (HIL) testing and compliance tracking:

```yaml
# .github/workflows/semiconductor-ci-cd.yml
name: Semiconductor Software CI/CD Pipeline

on:
  push:
    branches: [develop, staging, main]
  pull_request:
    types: [opened, synchronize, reopened]
  release:
    types: [created]

env:
  NODE_VERSION: '18.x'
  DOCKER_REGISTRY: registry.semiconductor.local
  COMPLIANCE_SERVER: https://compliance.semiconductor.local

jobs:
  # Stage 1: Code Quality & Security Scanning
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm audit fix

      - name: Run linting
        run: |
          npm run lint
          npm run lint:styles

      - name: Type checking
        run: npm run type-check

      - name: Security scanning with Snyk
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: |
          npm install -g snyk
          snyk test --severity-threshold=high
          snyk monitor

      - name: SAST with Semgrep
        run: |
          pip install semgrep
          semgrep --config=auto --json -o semgrep-results.json .

      - name: License compliance check
        run: |
          npm install -g license-checker
          license-checker --production --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC'

      - name: Upload scan results
        uses: actions/upload-artifact@v3
        with:
          name: security-scan-results
          path: |
            semgrep-results.json
            snyk-report.json

  # Stage 2: Unit & Integration Tests
  test-suite:
    runs-on: ubuntu-latest
    needs: code-quality
    strategy:
      matrix:
        test-suite: [unit, integration, performance]

    steps:
      - uses: actions/checkout@v3

      - name: Setup test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          npm ci

      - name: Run ${{ matrix.test-suite }} tests
        run: |
          if [ "${{ matrix.test-suite }}" == "unit" ]; then
            npm run test:unit -- --coverage --maxWorkers=4
          elif [ "${{ matrix.test-suite }}" == "integration" ]; then
            npm run test:integration
          elif [ "${{ matrix.test-suite }}" == "performance" ]; then
            npm run test:performance
          fi

      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests

  # Stage 3: Build & Container Scanning
  build-and-scan:
    runs-on: ubuntu-latest
    needs: test-suite
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Generate metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_REGISTRY }}/semiconductor-control
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-

      - name: Build image
        id: build
        uses: docker/build-push-action@v4
        with:
          context: .
          push: false
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          outputs: type=docker,dest=/tmp/image.tar

      - name: Container scanning with Trivy
        run: |
          wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
          echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
          sudo apt-get update && sudo apt-get install -y trivy

          docker load --input /tmp/image.tar
          trivy image --severity HIGH,CRITICAL --exit-code 1 --format json -o trivy-report.json ${{ steps.meta.outputs.tags }}

      - name: SBOM generation
        run: |
          docker run --rm -v /tmp:/tmp anchore/syft:latest \
            docker-archive:/tmp/image.tar \
            -o spdx-json=/tmp/sbom.spdx.json

      - name: Sign container image
        env:
          COSIGN_KEY: ${{ secrets.COSIGN_KEY }}
        run: |
          echo "$COSIGN_KEY" | base64 -d > cosign.key
          cosign sign --key cosign.key ${{ steps.meta.outputs.tags }}

      - name: Push to registry
        if: github.event_name != 'pull_request'
        run: |
          docker login -u ${{ secrets.REGISTRY_USERNAME }} -p ${{ secrets.REGISTRY_PASSWORD }} ${{ env.DOCKER_REGISTRY }}
          docker push ${{ steps.meta.outputs.tags }}

  # Stage 4: Hardware-in-the-Loop Testing
  hardware-in-loop-test:
    runs-on: [self-hosted, semiconductor-lab]
    needs: build-and-scan
    if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Reserve HIL test bench
        id: reserve
        run: |
          RESERVATION_ID=$(curl -X POST ${{ env.COMPLIANCE_SERVER }}/api/hil/reserve \
            -H "Authorization: Bearer ${{ secrets.HIL_TOKEN }}" \
            -d '{"duration": 3600, "equipment": "wafer-processor-01"}' \
            | jq -r '.reservation_id')
          echo "reservation-id=$RESERVATION_ID" >> $GITHUB_OUTPUT

      - name: Deploy to HIL environment
        run: |
          # Deploy container to HIL test bench
          ssh hil-controller@semiconductor-lab << EOF
            docker pull ${{ needs.build-and-scan.outputs.image-tag }}
            docker stop semiconductor-control || true
            docker run -d \
              --name semiconductor-control \
              --privileged \
              --device=/dev/ttyUSB0 \
              --device=/dev/spidev0.0 \
              --network host \
              ${{ needs.build-and-scan.outputs.image-tag }}
          EOF

      - name: Execute HIL test suite
        run: |
          python3 scripts/hil_tests.py \
            --config hil-config.yaml \
            --reservation-id ${{ steps.reserve.outputs.reservation-id }} \
            --output-dir ./hil-results

      - name: Validate equipment responses
        run: |
          # Check sensor readings
          python3 scripts/validate_sensors.py \
            --expected-values expected-sensors.json \
            --actual-values ./hil-results/sensor-data.json \
            --tolerance 0.01

      - name: Performance validation
        run: |
          # Validate RT performance metrics
          python3 scripts/validate_performance.py \
            --latency-log ./hil-results/rt-latency.log \
            --max-latency-us 100 \
            --percentile-99-us 50

      - name: Generate compliance report
        run: |
          python3 scripts/generate_compliance_report.py \
            --test-results ./hil-results \
            --template compliance-template.docx \
            --output compliance-report-${{ github.sha }}.pdf

      - name: Release HIL test bench
        if: always()
        run: |
          curl -X DELETE ${{ env.COMPLIANCE_SERVER }}/api/hil/reserve/${{ steps.reserve.outputs.reservation-id }} \
            -H "Authorization: Bearer ${{ secrets.HIL_TOKEN }}"

      - name: Upload HIL results
        uses: actions/upload-artifact@v3
        with:
          name: hil-test-results
          path: |
            hil-results/
            compliance-report-*.pdf

  # Stage 5: Compliance & Documentation
  compliance-validation:
    runs-on: ubuntu-latest
    needs: [build-and-scan, hardware-in-loop-test]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Generate compliance documentation
        run: |
          # Generate FDA 21 CFR Part 11 compliance docs
          python3 scripts/generate_compliance_docs.py \
            --standard "FDA-21-CFR-11" \
            --test-results ./test-results \
            --output ./compliance-docs

      - name: Audit trail generation
        run: |
          # Create immutable audit log
          cat << EOF > audit-entry.json
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "commit_sha": "${{ github.sha }}",
            "author": "${{ github.actor }}",
            "image_digest": "${{ needs.build-and-scan.outputs.image-digest }}",
            "test_results": {
              "unit_tests": "passed",
              "integration_tests": "passed",
              "hil_tests": "passed",
              "security_scan": "passed"
            },
            "approvals": []
          }
          EOF

          # Sign audit entry
          openssl dgst -sha256 -sign audit-key.pem -out audit-entry.sig audit-entry.json

          # Submit to compliance server
          curl -X POST ${{ env.COMPLIANCE_SERVER }}/api/audit \
            -H "Content-Type: application/json" \
            -d @audit-entry.json

      - name: Update validation matrix
        run: |
          python3 scripts/update_validation_matrix.py \
            --version ${{ github.ref_name }} \
            --test-results ./test-results \
            --compliance-docs ./compliance-docs

  # Stage 6: Deployment
  deploy:
    runs-on: ubuntu-latest
    needs: [compliance-validation]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          # Blue-green deployment
          ./scripts/deploy.sh \
            --environment production \
            --image ${{ needs.build-and-scan.outputs.image-tag }} \
            --strategy blue-green \
            --health-check-url https://production.semiconductor.local/health

      - name: Smoke tests
        run: |
          npm run test:e2e:production

      - name: Update deployment record
        run: |
          curl -X POST ${{ env.COMPLIANCE_SERVER }}/api/deployments \
            -H "Content-Type: application/json" \
            -d '{
              "environment": "production",
              "version": "${{ github.ref_name }}",
              "image": "${{ needs.build-and-scan.outputs.image-tag }}",
              "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
            }'

```

```bash
# Git workflow configuration
cat << 'EOF' > .gitmessage
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Type: feat, fix, docs, style, refactor, test, chore, perf, security
# Scope: component, module, or subsystem
# Subject: imperative mood, max 50 chars
# Body: explain what and why, not how
# Footer: references to issues, compliance requirements
#
# Example:
# feat(control-system): add temperature monitoring for wafer processor
#
# Implemented real-time temperature monitoring with 1ms sampling rate.
# Added alerts for out-of-range values per ISO 14644 requirements.
#
# Refs: SEMI-001, FDA-21-CFR-11
# Closes: #123
EOF

# Branch protection rules
cat << 'EOF' > .github/branch-protection.yml
protection_rules:
  - name: main
    required_reviews: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    required_status_checks:
      - code-quality
      - test-suite
      - build-and-scan
      - hardware-in-loop-test
      - compliance-validation
    enforce_admins: true
    restrictions:
      teams: ["semiconductor-leads"]
    require_signed_commits: true

  - name: staging
    required_reviews: 1
    required_status_checks:
      - code-quality
      - test-suite
      - build-and-scan
EOF

```

This pipeline ensures code quality, security scanning, hardware validation, regulatory compliance, and traceable deployments with full audit trails for semiconductor manufacturing software."

---

**Question 11: "You're seeing intermittent performance issues in the React app running on Linux servers. Walk through your debugging approach, including specific Linux tools and React profiling techniques."**

**Senior Developer Answer:**
"I'd implement a systematic debugging approach combining Linux system analysis with React profiling:

```bash
# 1. System-level performance analysis script
cat << 'EOF' > diagnose-performance.sh
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="perf-report-$TIMESTAMP"
mkdir -p $REPORT_DIR

echo "Starting comprehensive performance diagnosis..."

# CPU analysis
echo "=== CPU Analysis ===" | tee -a $REPORT_DIR/cpu.log
# Check CPU throttling
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq > $REPORT_DIR/cpu-freq.log
# CPU utilization per core
mpstat -P ALL 1 10 > $REPORT_DIR/mpstat.log
# Process CPU usage
pidstat -u -p $(pgrep -f node) 1 10 > $REPORT_DIR/pidstat-cpu.log

# Memory analysis
echo "=== Memory Analysis ===" | tee -a $REPORT_DIR/memory.log
# Memory usage details
free -m > $REPORT_DIR/free.log
cat /proc/meminfo > $REPORT_DIR/meminfo.log
# Node.js memory
pid=$(pgrep -f node)
pmap -x $pid > $REPORT_DIR/pmap.log
cat /proc/$pid/status | grep -E "Vm|Rss" > $REPORT_DIR/process-memory.log

# I/O analysis
echo "=== I/O Analysis ===" | tee -a $REPORT_DIR/io.log
iostat -x 1 10 > $REPORT_DIR/iostat.log
iotop -b -n 10 -d 1 > $REPORT_DIR/iotop.log
pidstat -d -p $(pgrep -f node) 1 10 > $REPORT_DIR/pidstat-io.log

# Network analysis
echo "=== Network Analysis ===" | tee -a $REPORT_DIR/network.log
ss -tunap > $REPORT_DIR/connections.log
netstat -i > $REPORT_DIR/interfaces.log
tc -s qdisc show > $REPORT_DIR/traffic-control.log
# Check for packet loss
ping -c 100 -i 0.2 localhost > $REPORT_DIR/ping-localhost.log

# Node.js specific
echo "=== Node.js Analysis ===" | tee -a $REPORT_DIR/nodejs.log
# Generate heap snapshot
kill -USR2 $(pgrep -f node)
# Check event loop lag
cat << 'SCRIPT' > check-event-loop.js
const { performance, PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`Event Loop Lag: ${entry.duration}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

let last = process.hrtime.bigint();
setInterval(() => {
  const now = process.hrtime.bigint();
  const delay = Number(now - last) / 1000000 - 100;
  if (delay > 10) {
    console.log(`Event loop blocked for ${delay}ms`);
  }
  last = now;
}, 100);
SCRIPT

# System calls trace
strace -c -p $(pgrep -f node) -f -o $REPORT_DIR/strace.log &
STRACE_PID=$!
sleep 10
kill $STRACE_PID

# Generate flame graph
perf record -F 99 -p $(pgrep -f node) -g -- sleep 10
perf script > $REPORT_DIR/perf.script
EOF

chmod +x diagnose-performance.sh

# 2. React Performance Profiling Setup
cat << 'EOF' > src/utils/performanceProfiler.js
import { Profiler, unstable_trace as trace } from 'react';

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.slowComponents = new Map();
    this.renderCounts = new Map();

    // Performance Observer for Web Vitals
    this.setupWebVitals();

    // Long task detection
    this.setupLongTaskDetection();
  }

  setupWebVitals() {
    // First Contentful Paint, Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log(`${entry.name}: ${entry.startTime}ms`);
        this.reportMetric({
          metric: entry.name,
          value: entry.startTime,
          timestamp: Date.now()
        });
      }
    }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const delay = entry.processingStart - entry.startTime;
        console.log(`FID: ${delay}ms`);
        this.reportMetric({
          metric: 'first-input-delay',
          value: delay,
          timestamp: Date.now()
        });
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log(`CLS: ${clsValue}`);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  setupLongTaskDetection() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`Long task detected: ${entry.duration}ms`, {
          startTime: entry.startTime,
          attribution: entry.attribution
        });

        // Send to monitoring service
        this.reportMetric({
          metric: 'long-task',
          value: entry.duration,
          startTime: entry.startTime,
          timestamp: Date.now()
        });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  onRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    // Track slow renders
    if (actualDuration > 16) {
      const count = this.slowComponents.get(id) || 0;
      this.slowComponents.set(id, count + 1);

      console.warn(`Slow render in ${id}:`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        interactions: Array.from(interactions)
      });
    }

    // Track render counts
    const renderCount = this.renderCounts.get(id) || 0;
    this.renderCounts.set(id, renderCount + 1);

    // Store metrics
    this.metrics.push({
      componentId: id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      timestamp: Date.now()
    });

    // Report if buffer is full
    if (this.metrics.length >= 100) {
      this.flushMetrics();
    }
  };

  reportMetric(metric) {
    // Send to backend monitoring
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(console.error);
  }

  flushMetrics() {
    if (this.metrics.length === 0) return;

    const report = {
      metrics: this.metrics,
      slowComponents: Array.from(this.slowComponents.entries()),
      renderCounts: Array.from(this.renderCounts.entries()),
      timestamp: Date.now()
    };

    this.reportMetric(report);
    this.metrics = [];
  }

  generateReport() {
    return {
      slowComponents: Array.from(this.slowComponents.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      excessiveRenders: Array.from(this.renderCounts.entries())
        .filter(([_, count]) => count > 50)
        .sort((a, b) => b[1] - a[1]),
      metrics: this.metrics
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// HOC for profiling components
export const withProfiler = (Component, id = Component.name) => {
  return (props) => (
    <Profiler id={id} onRender={performanceMonitor.onRenderCallback}>
      <Component {...props} />
    </Profiler>
  );
};

// Custom hook for measuring effects
export const useEffectProfiler = (effect, deps, name = 'effect') => {
  useEffect(() => {
    const startTime = performance.now();

    const cleanup = effect();

    const duration = performance.now() - startTime;
    if (duration > 10) {
      console.warn(`Slow effect ${name}: ${duration.toFixed(2)}ms`);
    }

    return cleanup;
  }, deps);
};

// React DevTools integration
if (process.env.NODE_ENV === 'development') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    ...window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
    onCommitFiberRoot: (id, root, priorityLevel) => {
      console.log('Commit:', { id, priorityLevel });
    }
  };
}
EOF

# 3. Memory leak detection
cat << 'EOF' > debug-memory-leak.js
const v8 = require('v8');
const fs = require('fs');

class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.heapGrowth = [];

    // Take initial snapshot
    this.takeSnapshot('initial');

    // Monitor heap growth
    setInterval(() => this.checkHeapGrowth(), 30000);
  }

  takeSnapshot(label) {
    const heapSnapshot = v8.writeHeapSnapshot();
    const filename = `heap-${label}-${Date.now()}.heapsnapshot`;

    fs.renameSync(heapSnapshot, filename);
    console.log(`Heap snapshot saved: ${filename}`);

    this.snapshots.push({
      label,
      filename,
      timestamp: Date.now(),
      heapUsed: process.memoryUsage().heapUsed
    });
  }

  checkHeapGrowth() {
    const memUsage = process.memoryUsage();
    this.heapGrowth.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });

    // Check for continuous growth
    if (this.heapGrowth.length > 5) {
      const recent = this.heapGrowth.slice(-5);
      const growing = recent.every((curr, idx) =>
        idx === 0 || curr.heapUsed > recent[idx - 1].heapUsed
      );

      if (growing) {
        console.warn('Potential memory leak detected!');
        this.takeSnapshot('potential-leak');

        // Force garbage collection if available
        if (global.gc) {
          console.log('Running garbage collection...');
          global.gc();

          // Check if memory decreased after GC
          setTimeout(() => {
            const afterGC = process.memoryUsage().heapUsed;
            const beforeGC = this.heapGrowth[this.heapGrowth.length - 1].heapUsed;

            if (afterGC >= beforeGC * 0.9) {
              console.error('Memory not released after GC - likely leak!');
            }
          }, 1000);
        }
      }
    }

    // Alert if heap usage is too high
    if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
      console.error('Heap usage critical:', {
        used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${(memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)}%`
      });
    }
  }

  getReport() {
    return {
      snapshots: this.snapshots,
      heapGrowth: this.heapGrowth,
      currentMemory: process.memoryUsage()
    };
  }
}

// Chrome DevTools Protocol integration for React profiling
const CDP = require('chrome-remote-interface');

async function profileReactApp() {
  const client = await CDP({ port: 9222 });
  const { Runtime, Profiler, HeapProfiler } = client;

  await Runtime.enable();
  await Profiler.enable();
  await HeapProfiler.enable();

  // Start CPU profiling
  await Profiler.start();

  // Start sampling heap profiling
  await HeapProfiler.startSampling();

  // Run for 60 seconds
  setTimeout(async () => {
    // Stop CPU profiling
    const cpuProfile = await Profiler.stop();
    fs.writeFileSync('cpu-profile.json', JSON.stringify(cpuProfile.profile));

    // Stop heap profiling
    const heapProfile = await HeapProfiler.stopSampling();
    fs.writeFileSync('heap-profile.json', JSON.stringify(heapProfile.profile));

    console.log('Profiling complete. Files saved.');

    client.close();
  }, 60000);
}

module.exports = { MemoryLeakDetector, profileReactApp };
EOF

# 4. Production monitoring integration
cat << 'EOF' > monitoring-setup.sh
#!/bin/bash

# Setup Prometheus node exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.5.0.linux-amd64.tar.gz
sudo mv node_exporter-1.5.0.linux-amd64/node_exporter /usr/local/bin/

# Create systemd service
sudo cat << SERVICE > /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \
  --collector.filesystem.mount-points-exclude="^/(dev|proc|sys|run)($|/)" \
  --collector.netclass.ignored-devices="^(veth.*|docker.*|br.*)$"

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# Configure application metrics endpoint
cat << 'APP' > src/metrics-endpoint.js
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// Collect default metrics
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const renderDuration = new promClient.Histogram({
  name: 'react_render_duration_milliseconds',
  help: 'React component render duration',
  labelNames: ['component', 'phase'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

module.exports = { httpDuration, renderDuration, register: promClient.register };
APP
EOF

# 5. Real-time debugging dashboard
cat << 'EOF' > public/debug-dashboard.html
<!DOCTYPE html>
<html>
<head>
    <title>Performance Debug Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .metric-card {
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px;
            border-radius: 5px;
        }
        .warning { color: orange; }
        .critical { color: red; }
    </style>
</head>
<body>
    <h1>Real-time Performance Metrics</h1>

    <div id="metrics-container"></div>

    <canvas id="performance-chart"></canvas>

    <script>
        const ws = new WebSocket('ws://localhost:3001/metrics');
        const metricsData = {
            timestamps: [],
            cpu: [],
            memory: [],
            fps: [],
            renderTime: []
        };

        const chart = new Chart(document.getElementById('performance-chart'), {
            type: 'line',
            data: {
                labels: metricsData.timestamps,
                datasets: [
                    {
                        label: 'CPU %',
                        data: metricsData.cpu,
                        borderColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: 'Memory MB',
                        data: metricsData.memory,
                        borderColor: 'rgb(54, 162, 235)'
                    },
                    {
                        label: 'FPS',
                        data: metricsData.fps,
                        borderColor: 'rgb(75, 192, 192)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Update chart
            metricsData.timestamps.push(new Date().toLocaleTimeString());
            metricsData.cpu.push(data.cpu);
            metricsData.memory.push(data.memory / 1024 / 1024);
            metricsData.fps.push(data.fps);

            // Keep last 50 data points
            if (metricsData.timestamps.length > 50) {
                Object.keys(metricsData).forEach(key => {
                    metricsData[key].shift();
                });
            }

            chart.update();

            // Update metrics display
            updateMetricsDisplay(data);

```

```
    function updateMetricsDisplay(data) {
        const container = document.getElementById('metrics-container');
        container.innerHTML = `
            <div class="metric-card ${data.cpu > 80 ? 'critical' : data.cpu > 60 ? 'warning' : ''}">
                CPU: ${data.cpu.toFixed(2)}%
            </div>
            <div class="metric-card ${data.memory > 1000000000 ? 'critical' : ''}">
                Memory: ${(data.memory / 1024 / 1024).toFixed(2)}MB
            </div>
            <div class="metric-card ${data.fps < 30 ? 'critical' : data.fps < 50 ? 'warning' : ''}">
                FPS: ${data.fps}
            </div>
            <div class="metric-card">
                Event Loop Lag: ${data.eventLoopLag || 0}ms
            </div>
        `;
    }
</script>

```

</body>
</html>
EOF
```

This comprehensive debugging approach identifies system bottlenecks, React rendering issues, memory leaks, and provides real-time monitoring to quickly isolate performance problems."

---

**Question 12: "Explain how you would implement secure communication between the React frontend and backend services in a semiconductor manufacturing environment with strict security requirements."**

**Senior Developer Answer:**
"I'd implement defense-in-depth security architecture with multiple layers of protection:

```jsx
// 1. Frontend Security Implementation
// src/security/secureApiClient.js
import forge from 'node-forge';
import CryptoJS from 'crypto-js';

class SecureApiClient {
  constructor() {
    this.sessionKey = null;
    this.csrfToken = null;
    this.publicKey = null;
    this.requestQueue = [];
    this.isInitialized = false;

    this.initializeSecurity();
  }

  async initializeSecurity() {
    try {
      // 1. Fetch server's public key
      const keyResponse = await fetch('/api/security/public-key');
      const { publicKey, sessionId } = await keyResponse.json();
      this.publicKey = forge.pki.publicKeyFromPem(publicKey);

      // 2. Generate client keypair
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      this.clientPrivateKey = keypair.privateKey;

      // 3. Exchange keys and establish session
      const handshake = await this.performHandshake(keypair.publicKey);
      this.sessionKey = handshake.sessionKey;
      this.csrfToken = handshake.csrfToken;

      // 4. Setup certificate pinning
      await this.setupCertificatePinning();

      // 5. Initialize request integrity checking
      this.setupIntegrityChecking();

      this.isInitialized = true;
      this.processQueuedRequests();

    } catch (error) {
      console.error('Security initialization failed:', error);
      throw new Error('Failed to establish secure connection');
    }
  }

  async performHandshake(clientPublicKey) {
    // Generate session key
    const sessionKey = forge.random.getBytesSync(32);

    // Encrypt session key with server's public key
    const encryptedSessionKey = this.publicKey.encrypt(sessionKey, 'RSA-OAEP');

    // Sign the handshake
    const md = forge.md.sha256.create();
    md.update(sessionKey);
    const signature = this.clientPrivateKey.sign(md);

    const response = await fetch('/api/security/handshake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Certificate': forge.pki.certificateToPem(this.clientCert)
      },
      body: JSON.stringify({
        clientPublicKey: forge.pki.publicKeyToPem(clientPublicKey),
        encryptedSessionKey: forge.util.encode64(encryptedSessionKey),
        signature: forge.util.encode64(signature)
      })
    });

    const data = await response.json();

    return {
      sessionKey,
      csrfToken: data.csrfToken
    };
  }

  async makeSecureRequest(endpoint, options = {}) {
    if (!this.isInitialized) {
      // Queue request until security is initialized
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ endpoint, options, resolve, reject });
      });
    }

    // Generate request ID and timestamp
    const requestId = this.generateRequestId();
    const timestamp = Date.now();

    // Prepare request body
    let body = options.body;
    if (body) {
      // Encrypt sensitive data
      body = this.encryptData(body);
    }

    // Generate HMAC for request integrity
    const hmac = this.generateHMAC({
      method: options.method || 'GET',
      endpoint,
      body,
      timestamp,
      requestId
    });

    // Make request with security headers
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': this.csrfToken,
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-HMAC': hmac,
        'X-Session-ID': this.sessionId,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });

    // Verify response integrity
    await this.verifyResponse(response);

    // Decrypt response if needed
    const data = await response.json();
    if (data.encrypted) {
      return this.decryptData(data.payload);
    }

    return data;
  }

  encryptData(data) {
    // AES encryption with session key
    const iv = CryptoJS.lib.WordArray.random(128/8);
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      CryptoJS.enc.Hex.parse(this.sessionKey),
      { iv: iv }
    );

    return {
      encrypted: true,
      iv: iv.toString(),
      data: encrypted.toString()
    };
  }

  decryptData(encryptedData) {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData.data,
      CryptoJS.enc.Hex.parse(this.sessionKey),
      { iv: CryptoJS.enc.Hex.parse(encryptedData.iv) }
    );

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  }

  generateHMAC(requestData) {
    const message = `${requestData.method}|${requestData.endpoint}|${requestData.timestamp}|${requestData.requestId}`;
    const hmac = CryptoJS.HmacSHA256(message, this.sessionKey);
    return hmac.toString();
  }

  async verifyResponse(response) {
    const responseHMAC = response.headers.get('X-Response-HMAC');
    const responseTimestamp = response.headers.get('X-Response-Timestamp');

    // Verify HMAC
    const expectedHMAC = this.generateHMAC({
      method: 'RESPONSE',
      endpoint: response.url,
      timestamp: responseTimestamp,
      requestId: response.headers.get('X-Request-ID')
    });

    if (responseHMAC !== expectedHMAC) {
      throw new Error('Response integrity check failed');
    }

    // Verify timestamp (prevent replay attacks)
    const timeDiff = Date.now() - parseInt(responseTimestamp);
    if (timeDiff > 30000) { // 30 seconds
      throw new Error('Response timestamp expired');
    }
  }

  setupCertificatePinning() {
    // Pin expected certificate fingerprints
    this.pinnedCertificates = [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    ];

    // Verify certificate on each request
    this.verifyCertificate = (cert) => {
      const fingerprint = this.calculateFingerprint(cert);
      if (!this.pinnedCertificates.includes(fingerprint)) {
        throw new Error('Certificate pinning validation failed');
      }
    };
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 2. Backend Security Implementation (Node.js/Express)
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SecureBackend {
  constructor(app) {
    this.app = app;
    this.sessions = new Map();
    this.setupSecurity();
  }

  setupSecurity() {
    // 1. Basic security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // 2. Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      // Custom key generator for behind proxy
      keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress;
      }
    });
    this.app.use('/api', limiter);

    // 3. Input validation middleware
    this.app.use(this.validateInput.bind(this));

    // 4. Authentication middleware
    this.app.use(this.authenticateRequest.bind(this));

    // 5. Request integrity verification
    this.app.use(this.verifyRequestIntegrity.bind(this));

    // 6. Setup security endpoints
    this.setupSecurityEndpoints();
  }

  validateInput(req, res, next) {
    // Sanitize all inputs
    const sanitize = (obj) => {
      if (typeof obj !== 'object') return obj;

      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove potential XSS vectors
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitize(obj[key]);
        }
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.query) {
      req.query = sanitize(req.query);
    }
    if (req.params) {
      req.params = sanitize(req.params);
    }

    // Validate against schema
    if (req.route && this.schemas[req.route.path]) {
      const schema = this.schemas[req.route.path];
      const validation = schema.validate(req.body);

      if (validation.error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.details
        });
      }
    }

    next();
  }

  authenticateRequest(req, res, next) {
    // Skip auth for public endpoints
    const publicEndpoints = ['/api/security/public-key', '/api/security/handshake'];
    if (publicEndpoints.includes(req.path)) {
      return next();
    }

    // Verify session
    const sessionId = req.headers['x-session-id'];
    const session = this.sessions.get(sessionId);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['RS256'],
        issuer: 'semiconductor-system',
        audience: 'semiconductor-api'
      });

      req.user = decoded;
      req.session = session;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  verifyRequestIntegrity(req, res, next) {
    const hmac = req.headers['x-hmac'];
    const timestamp = req.headers['x-timestamp'];
    const requestId = req.headers['x-request-id'];

    // Verify timestamp to prevent replay attacks
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 30000) {
      return res.status(400).json({ error: 'Request expired' });
    }

    // Verify HMAC
    const message = `${req.method}|${req.originalUrl}|${timestamp}|${requestId}`;
    const expectedHMAC = crypto
      .createHmac('sha256', req.session?.sessionKey || '')
      .update(message)
      .digest('hex');

    if (hmac !== expectedHMAC) {
      return res.status(400).json({ error: 'Request integrity check failed' });
    }

    // Check for request replay
    if (this.recentRequests.has(requestId)) {
      return res.status(400).json({ error: 'Duplicate request detected' });
    }

    this.recentRequests.set(requestId, Date.now());

    // Clean old request IDs
    setTimeout(() => {
      this.recentRequests.delete(requestId);
    }, 60000);

    next();
  }

  setupSecurityEndpoints() {
    // Public key exchange endpoint
    this.app.get('/api/security/public-key', (req, res) => {
      res.json({
        publicKey: this.serverPublicKey,
        sessionId: crypto.randomBytes(32).toString('hex')
      });
    });

    // Handshake endpoint
    this.app.post('/api/security/handshake', async (req, res) => {
      const { clientPublicKey, encryptedSessionKey, signature } = req.body;

      // Verify client certificate if using mTLS
      if (req.client.authorized) {
        const cert = req.socket.getPeerCertificate();
        // Verify certificate details
        if (!this.verifyCertificate(cert)) {
          return res.status(401).json({ error: 'Invalid client certificate' });
        }
      }

      // Decrypt session key
      const sessionKey = crypto.privateDecrypt(
        {
          key: this.serverPrivateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(encryptedSessionKey, 'base64')
      );

      // Store session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const csrfToken = crypto.randomBytes(32).toString('hex');

      this.sessions.set(sessionId, {
        sessionKey: sessionKey.toString('hex'),
        clientPublicKey,
        csrfToken,
        createdAt: Date.now()
      });

      // Generate JWT
      const token = jwt.sign(
        {
          sessionId,
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        },
        process.env.JWT_SECRET,
        {
          algorithm: 'RS256',
          issuer: 'semiconductor-system',
          audience: 'semiconductor-api'
        }
      );

      res.json({
        sessionId,
        csrfToken,
        token
      });
    });
  }
}

// 3. Network Security Configuration (nginx)
const nginxConfig = `
# /etc/nginx/sites-available/semiconductor-app
server {
    listen 443 ssl http2;
    server_name semiconductor.local;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    ssl_client_certificate /etc/nginx/certs/ca.crt;
    ssl_verify_client optional;

    # Strong SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Request size limits
    client_max_body_size 10M;
    client_body_buffer_size 1K;
    client_header_buffer_size 1K;
    large_client_header_buffers 2 1K;

    # Proxy to backend
    location /api {
        # Check client certificate
        if ($ssl_client_verify != SUCCESS) {
            return 403;
        }

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header SSL-Client-Cert $ssl_client_cert;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        root /var/www/semiconductor-app;
        try_files $uri $uri/ /index.html;

        # Cache control
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
`;

export { SecureApiClient, SecureBackend };

```

This implementation provides end-to-end encryption, mutual TLS authentication, request integrity verification, protection against common attacks (XSS, CSRF, replay), and comprehensive audit logging suitable for semiconductor manufacturing security requirements."

---

**Question 13: "How would you handle data synchronization between multiple React clients and backend services in a semiconductor facility where network connectivity might be intermittent?"**

**Senior Developer Answer:**
"I'd implement a robust offline-first architecture with conflict resolution and eventual consistency:

```jsx
// 1. Offline-First Data Synchronization System
class OfflineDataSync {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.conflictResolver = new ConflictResolver();
    this.networkMonitor = new NetworkMonitor();
    this.initializeDatabase();
  }

  async initializeDatabase() {
    // IndexedDB for offline storage
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SemiconductorDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.setupSyncWorker();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Equipment data store
        if (!db.objectStoreNames.contains('equipment')) {
          const equipmentStore = db.createObjectStore('equipment', {
            keyPath: 'id'
          });
          equipmentStore.createIndex('lastModified', 'lastModified');
          equipmentStore.createIndex('syncStatus', 'syncStatus');
        }

        // Process data store
        if (!db.objectStoreNames.contains('processes')) {
          const processStore = db.createObjectStore('processes', {
            keyPath: 'id'
          });
          processStore.createIndex('timestamp', 'timestamp');
          processStore.createIndex('status', 'status');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('priority', 'priority');
        }

        // Conflict store
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'id' });
        }
      };
    });
  }

  async saveData(storeName, data, options = {}) {
    const transaction = this.db.transaction([storeName, 'syncQueue'], 'readwrite');
    const store = transaction.objectStore(storeName);
    const syncStore = transaction.objectStore('syncQueue');

    // Add metadata
    const enrichedData = {
      ...data,
      localVersion: (data.localVersion || 0) + 1,
      lastModified: Date.now(),
      deviceId: this.getDeviceId(),
      syncStatus: 'pending'
    };

    // Save to local store
    await this.promisifyRequest(store.put(enrichedData));

    // Add to sync queue if online operation
    if (options.sync !== false) {
      const syncOperation = {
        operation: 'update',
        storeName,
        data: enrichedData,
        timestamp: Date.now(),
        priority: options.priority || 'normal',
        retryCount: 0
      };

      await this.promisifyRequest(syncStore.add(syncOperation));

      // Attempt immediate sync if online
      if (this.networkMonitor.isOnline()) {
        this.processSyncQueue();
      }
    }

    return enrichedData;
  }

  async processSyncQueue() {
    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('priority');

    // Get pending operations sorted by priority
    const operations = await this.promisifyRequest(index.getAll());

    // Group operations by type for batch processing
    const batches = this.groupOperations(operations);

    for (const batch of batches) {
      try {
        await this.syncBatch(batch);
      } catch (error) {
        console.error('Batch sync failed:', error);
        await this.handleSyncError(batch, error);
      }
    }
  }

  async syncBatch(operations) {
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operations,
        deviceId: this.getDeviceId(),
        timestamp: Date.now()
      })
    });

    const result = await response.json();

    // Process sync results
    for (const op of result.processed) {
      if (op.status === 'success') {
        await this.markSynced(op.id);
      } else if (op.status === 'conflict') {
        await this.handleConflict(op);
      } else if (op.status === 'error') {
        await this.requeueOperation(op);
      }
    }

    // Apply remote changes
    if (result.remoteChanges) {
      await this.applyRemoteChanges(result.remoteChanges);
    }
  }

  async handleConflict(operation) {
    const localData = await this.getLocalData(operation.storeName, operation.dataId);
    const remoteData = operation.remoteData;

    // Attempt automatic resolution
    const resolution = this.conflictResolver.resolve(
      localData,
      remoteData,
      operation.conflictType
    );

    if (resolution.automatic) {
      // Apply resolved data
      await this.saveData(operation.storeName, resolution.data, { sync: false });
      await this.markSynced(operation.id);
    } else {
      // Store for manual resolution
      await this.storeConflict({
        id: `${operation.storeName}-${operation.dataId}`,
        localData,
        remoteData,
        operation,
        timestamp: Date.now()
      });

      // Notify UI
      this.emitEvent('conflict:detected', {
        storeName: operation.storeName,
        dataId: operation.dataId
      });
    }
  }

  groupOperations(operations) {
    const groups = {};

    operations.forEach(op => {
      const key = `${op.storeName}-${op.operation}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(op);
    });

    // Convert to batches with size limits
    const batches = [];
    Object.values(groups).forEach(group => {
      while (group.length > 0) {
        batches.push(group.splice(0, 50)); // Max 50 operations per batch
      }
    });

    return batches;
  }

  setupSyncWorker() {
    // Register service worker for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        return registration.sync.register('data-sync');
      });
    }

    // Periodic sync when online
    this.networkMonitor.on('online', () => {
      this.processSyncQueue();
    });

    // Sync on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.networkMonitor.isOnline()) {
        this.processSyncQueue();
      }
    });
  }

  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}

// 2. Conflict Resolution Strategy
class ConflictResolver {
  constructor() {
    this.strategies = {
      'last-write-wins': this.lastWriteWins,
      'first-write-wins': this.firstWriteWins,
      'merge': this.merge,
      'custom': this.custom
    };
  }

  resolve(localData, remoteData, conflictType) {
    // Determine resolution strategy based on data type
    const strategy = this.getStrategy(conflictType);

    try {
      const resolved = this.strategies[strategy].call(
        this,
        localData,
        remoteData
      );

      return {
        automatic: true,
        data: resolved
      };
    } catch (error) {
      // Manual resolution required
      return {
        automatic: false,
        reason: error.message
      };
    }
  }

  lastWriteWins(local, remote) {
    return local.lastModified > remote.lastModified ? local : remote;
  }

  firstWriteWins(local, remote) {
    return local.createdAt < remote.createdAt ? local : remote;
  }

  merge(local, remote) {
    // For equipment settings, merge non-conflicting fields
    const merged = { ...remote };

    // Identify changed fields
    const localChanges = this.getChangedFields(local.originalData, local);
    const remoteChanges = this.getChangedFields(remote.originalData, remote);

    // Apply non-conflicting changes
    Object.keys(localChanges).forEach(field => {
      if (!remoteChanges[field]) {
        merged[field] = local[field];
      } else if (localChanges[field] === remoteChanges[field]) {
        // Same change on both sides
        merged[field] = local[field];
      } else {
        // Conflict - needs manual resolution
        throw new Error(`Conflict in field: ${field}`);
      }
    });

    // Update version vector
    merged.versionVector = this.mergeVersionVectors(
      local.versionVector,
      remote.versionVector
    );

    return merged;
  }

  custom(local, remote) {
    // Domain-specific resolution rules
    if (local.type === 'process-parameter') {
      // For safety-critical parameters, always choose more conservative value
      if (local.temperature !== remote.temperature) {
        return {
          ...local,
          temperature: Math.min(local.temperature, remote.temperature),
          _mergeNote: 'Selected lower temperature for safety'
        };
      }
    }

    throw new Error('Manual resolution required');
  }

  getChangedFields(original, current) {
    const changes = {};

    Object.keys(current).forEach(key => {
      if (original[key] !== current[key]) {
        changes[key] = current[key];
      }
    });

    return changes;
  }

  mergeVersionVectors(v1, v2) {
    const merged = { ...v1 };

    Object.keys(v2).forEach(deviceId => {
      merged[deviceId] = Math.max(merged[deviceId] || 0, v2[deviceId]);
    });

    return merged;
  }

  getStrategy(conflictType) {
    // Determine strategy based on conflict type
    const strategyMap = {
      'equipment-settings': 'merge',
      'process-parameters': 'custom',
      'measurement-data': 'last-write-wins',
      'user-preferences': 'last-write-wins',
      'audit-logs': 'merge'
    };

    return strategyMap[conflictType] || 'last-write-wins';
  }
}

// 3. Network Monitoring and Adaptive Sync
class NetworkMonitor extends EventTarget {
  constructor() {
    super();
    this.online = navigator.onLine;
    this.connectionQuality = this.measureConnection();
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Basic online/offline events
    window.addEventListener('online', () => {
      this.online = true;
      this.dispatchEvent(new Event('online'));
    });

    window.addEventListener('offline', () => {
      this.online = false;
      this.dispatchEvent(new Event('offline'));
    });

    // Network Information API for connection quality
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.connectionQuality = this.measureConnection();
        this.dispatchEvent(new CustomEvent('quality-change', {
          detail: this.connectionQuality
        }));
      });
    }

    // Periodic connectivity check
    setInterval(() => this.checkConnectivity(), 30000);
  }

  async checkConnectivity() {
    try {
      const start = performance.now();
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const latency = performance.now() - start;

      this.updateConnectionQuality({ latency, online: true });
    } catch (error) {
      this.online = false;
      this.dispatchEvent(new Event('offline'));
    }
  }

  measureConnection() {
    if (!navigator.connection) {
      return { quality: 'unknown', effectiveType: 'unknown' };
    }

    const conn = navigator.connection;

    return {
      quality: this.calculateQuality(conn),
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    };
  }

  calculateQuality(connection) {
    if (connection.effectiveType === '4g' && connection.rtt < 100) {
      return 'excellent';
    } else if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
      return 'good';
    } else if (connection.effectiveType === '2g') {
      return 'poor';
    } else {
      return 'very-poor';
    }
  }

  updateConnectionQuality(metrics) {
    this.connectionQuality = {
      ...this.connectionQuality,
      ...metrics
    };

    // Adjust sync strategy based on quality
    this.dispatchEvent(new CustomEvent('strategy-update', {
      detail: this.getSyncStrategy()
    }));
  }

  getSyncStrategy() {
    const quality = this.connectionQuality.quality;

    return {
      batchSize: quality === 'excellent' ? 100 : quality === 'good' ? 50 : 10,
      syncInterval: quality === 'excellent' ? 5000 : quality === 'good' ? 30000 : 60000,
      compressionEnabled: quality === 'poor' || quality === 'very-poor',
      deltaSync: quality !== 'excellent',
      priority: quality === 'poor' ? ['critical'] : ['critical', 'high', 'normal']
    };
  }

  isOnline() {
    return this.online;
  }
}

// 4. React Hook for Offline-First Data
const useOfflineData = (storeName, query = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [conflicts, setConflicts] = useState([]);
  const syncManager = useRef(new OfflineDataSync());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Load from local database
        const localData = await syncManager.current.getLocalData(storeName, query);
        setData(localData);

        // Attempt to sync if online
        if (navigator.onLine) {
          setSyncStatus('syncing');
          const syncedData = await syncManager.current.syncData(storeName, query);
          setData(syncedData);
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to sync events
    const handleSync = (event) => {
      if (event.detail.storeName === storeName) {
        setData(event.detail.data);
        setSyncStatus('synced');
      }
    };

    const handleConflict = (event) => {
      if (event.detail.storeName === storeName) {
        setConflicts(prev => [...prev, event.detail]);
      }
    };

    syncManager.current.addEventListener('data-synced', handleSync);
    syncManager.current.addEventListener('conflict-detected', handleConflict);

    return () => {
      syncManager.current.removeEventListener('data-synced', handleSync);
      syncManager.current.removeEventListener('conflict-detected', handleConflict);
    };
  }, [storeName, JSON.stringify(query)]);

  const updateData = useCallback(async (id, updates) => {
    try {
      const updated = await syncManager.current.saveData(storeName, {
        ...updates,
        id
      });

      setData(prev => prev.map(item =>
        item.id === id ? updated : item
      ));

      return updated;
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }, [storeName]);

  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      await syncManager.current.resolveConflict(conflictId, resolution);
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }, []);

  return {
    data,
    loading,
    syncStatus,
    conflicts,
    updateData,
    resolveConflict
  };
};

// 5. Service Worker for Background Sync
// sw.js
self.addEventListener('sync', event => {
  if (event.tag === 'data-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const db = await openDatabase();
  const operations = await getPendingSyncOperations(db);

  if (operations.length === 0) return;

  try {
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations })
    });

    const result = await response.json();
    await processSyncResult(db, result);
  } catch (error) {
    console.error('Background sync failed:', error);
    // Will retry on next sync event
  }
}

export { OfflineDataSync, useOfflineData, NetworkMonitor, ConflictResolver };

```

This implementation ensures data consistency across multiple clients with intermittent connectivity, automatic conflict resolution where possible, and manual resolution workflows for complex conflicts, all while maintaining a responsive user experience."

---

**Question 14: "Describe your approach to testing this semiconductor control application, including unit tests, integration tests, and hardware simulation tests."**

**Senior Developer Answer:**
"I'd implement a comprehensive testing strategy covering all layers with hardware simulation capabilities:

```jsx
// 1. Unit Testing Setup with Jest and React Testing Library
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js'
  ]
};

// 2. React Component Testing
// src/components/__tests__/EquipmentControl.test.jsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentControl } from '../EquipmentControl';
import { EquipmentProvider } from '../../contexts/EquipmentContext';
import { mockWebSocket } from '../../test/mocks/websocket';

describe('EquipmentControl Component', () => {
  let mockWs;

  beforeEach(() => {
    mockWs = mockWebSocket();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockWs.cleanup();
  });

  describe('Rendering and Initialization', () => {
    it('should render equipment control panel with correct initial state', () => {
      const equipment = {
        id: 'wafer-proc-01',
        name: 'Wafer Processor',
        status: 'idle',
        temperature: 25,
        pressure: 1.0
      };

      render(
        <EquipmentProvider>
          <EquipmentControl equipment={equipment} />
        </EquipmentProvider>
      );

      expect(screen.getByRole('heading', { name: /Wafer Processor/i })).toBeInTheDocument();
      expect(screen.getByText(/Status: idle/i)).toBeInTheDocument();
      expect(screen.getByText(/Temperature: 25°C/i)).toBeInTheDocument();
    });

    it('should establish WebSocket connection on mount', async () => {
      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      await waitFor(() => {
        expect(mockWs.connect).toHaveBeenCalledWith('ws://equipment.local/test-01');
      });
    });
  });

  describe('User Interactions', () => {
    it('should start process when start button is clicked', async () => {
      const onProcessStart = jest.fn();
      const user = userEvent.setup();

      render(
        <EquipmentProvider>
          <EquipmentControl
            equipment={{ id: 'test-01', status: 'idle' }}
            onProcessStart={onProcessStart}
          />
        </EquipmentProvider>
      );

      const startButton = screen.getByRole('button', { name: /Start Process/i });
      await user.click(startButton);

      expect(onProcessStart).toHaveBeenCalledWith({
        equipmentId: 'test-01',
        timestamp: expect.any(Number)
      });
    });

    it('should validate parameters before starting process', async () => {
      const user = userEvent.setup();

      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      // Set invalid temperature
      const tempInput = screen.getByLabelText(/Target Temperature/i);
      await user.clear(tempInput);
      await user.type(tempInput, '500'); // Above maximum

      const startButton = screen.getByRole('button', { name: /Start Process/i });
      await user.click(startButton);

      expect(screen.getByText(/Temperature must be between/i)).toBeInTheDocument();
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('should handle emergency stop with confirmation', async () => {
      const user = userEvent.setup();
      const onEmergencyStop = jest.fn();

      render(
        <EquipmentProvider>
          <EquipmentControl
            equipment={{ id: 'test-01', status: 'running' }}
            onEmergencyStop={onEmergencyStop}
          />
        </EquipmentProvider>
      );

      const emergencyButton = screen.getByRole('button', { name: /Emergency Stop/i });
      await user.click(emergencyButton);

      // Confirmation dialog should appear
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      await user.click(confirmButton);

      expect(onEmergencyStop).toHaveBeenCalledWith({
        equipmentId: 'test-01',
        reason: 'manual',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update display when receiving WebSocket messages', async () => {
      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      // Simulate incoming WebSocket message
      await waitFor(() => {
        mockWs.simulateMessage({
          type: 'sensor_update',
          data: {
            temperature: 150,
            pressure: 2.5,
            status: 'running'
          }
        });
      });

      expect(screen.getByText(/Temperature: 150°C/i)).toBeInTheDocument();
      expect(screen.getByText(/Pressure: 2.5 bar/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: running/i)).toBeInTheDocument();
    });

    it('should display alerts for out-of-range values', async () => {
      render(
        <EquipmentProvider>
          <EquipmentControl
            equipment={{
              id: 'test-01',
              thresholds: { temperature: { min: 20, max: 200 } }
            }}
          />
        </EquipmentProvider>
      );

      mockWs.simulateMessage({
        type: 'sensor_update',
        data: { temperature: 250 }
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Temperature exceeds maximum/i);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when WebSocket connection fails', async () => {
      mockWs.simulateError('Connection refused');

      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reconnect/i })).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock API failure
      global.fetch = jest.fn(() => Promise.reject(new Error('API Error')));

      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save settings/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      const startButton = screen.getByRole('button', { name: /Start Process/i });
      const stopButton = screen.getByRole('button', { name: /Stop Process/i });

      // Tab navigation
      startButton.focus();
      expect(startButton).toHaveFocus();

      userEvent.tab();
      expect(stopButton).toHaveFocus();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <EquipmentProvider>
          <EquipmentControl equipment={{ id: 'test-01' }} />
        </EquipmentProvider>
      );

      expect(screen.getByRole('region', { name: /Equipment Control/i })).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/Temperature Input/i)).toHaveAttribute('aria-describedby');
    });
  });
});

// 3. Integration Testing
// src/test/integration/equipment-workflow.test.js
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('Equipment Workflow Integration', () => {
  it('should complete full equipment operation workflow', async () => {
    const user = userEvent.setup();

    // Mock backend responses
    server.use(
      rest.post('/api/equipment/:id/start', (req, res, ctx) => {
        return res(ctx.json({
          status: 'success',
          processId: 'proc-123'
        }));
      }),
      rest.get('/api/equipment/:id/status', (req, res, ctx) => {
        return res(ctx.json({
          status: 'running',
          progress: 50,
          estimatedCompletion: Date.now() + 3600000
        }));
      })
    );

    const { getByRole, getByText, queryByText } = render(<App />);

    // Login
    await user.type(getByRole('textbox', { name: /username/i }), 'operator');
    await user.type(getByRole('textbox', { name: /password/i }), 'password');
    await user.click(getByRole('button', { name: /login/i }));

    // Navigate to equipment
    await waitFor(() => {
      expect(getByText(/Equipment Dashboard/i)).toBeInTheDocument();
    });

    // Select equipment
    await user.click(getByText(/Wafer Processor 01/i));

    // Configure parameters
    await user.type(getByRole('spinbutton', { name: /temperature/i }), '150');
    await user.type(getByRole('spinbutton', { name: /duration/i }), '30');

    // Start process
    await user.click(getByRole('button', { name: /start process/i }));

    // Verify process started
    await waitFor(() => {
      expect(getByText(/Process Started/i)).toBeInTheDocument();
      expect(getByText(/Progress: 50%/i)).toBeInTheDocument();
    });

    // Stop process
    await user.click(getByRole('button', { name: /stop process/i }));
    await user.click(getByRole('button', { name: /confirm/i }));

    // Verify stopped
    await waitFor(() => {
      expect(queryByText(/Process Started/i)).not.toBeInTheDocument();
      expect(getByText(/Process Stopped/i)).toBeInTheDocument();
    });
  });
});

// 4. Hardware Simulation Testing
// src/test/hardware/equipment-simulator.js
class EquipmentSimulator {
  constructor(config = {}) {
    this.config = {
      responseDelay: 100,
      errorRate: 0.01,
      ...config
    };

    this.state = {
      temperature: 25,
      pressure: 1.0,
      status: 'idle',
      errors: []
    };

    this.connections = new Map();
  }

  connect(equipmentId) {
    const connection = {
      id: equipmentId,
      socket: new MockWebSocket(),
      intervals: []
    };

    this.connections.set(equipmentId, connection);

    // Simulate sensor data stream
    const sensorInterval = setInterval(() => {
      this.sendSensorData(connection);
    }, 1000);

    connection.intervals.push(sensorInterval);

    return connection.socket;
  }

  sendSensorData(connection) {
    // Simulate realistic sensor variations
    const temp = this.state.temperature + (Math.random() - 0.5) * 2;
    const pressure = this.state.pressure + (Math.random() - 0.5) * 0.1;

    // Random errors based on error rate
    if (Math.random() < this.config.errorRate) {
      this.simulateError(connection);
      return;
    }

    connection.socket.send({
      type: 'sensor_update',
      data: {
        temperature: parseFloat(temp.toFixed(2)),
        pressure: parseFloat(pressure.toFixed(3)),
        timestamp: Date.now()
      }
    });
  }

  simulateError(connection) {
    const errors = [
      'SENSOR_DISCONNECTED',
      'TEMPERATURE_OUT_OF_RANGE',
      'PRESSURE_UNSTABLE',
      'COMMUNICATION_ERROR'
    ];

    const error = errors[Math.floor(Math.random() * errors.length)];

    connection.socket.send({
      type: 'error',
      data: {
        code: error,
        message: `Simulated error: ${error}`,
        timestamp: Date.now()
      }
    });

    this.state.errors.push({
      equipmentId: connection.id,
      error,
      timestamp: Date.now()
    });
  }

  startProcess(equipmentId, parameters) {
    const connection = this.connections.get(equipmentId);
    if (!connection) throw new Error('Equipment not connected');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.state.status = 'running';
        this.state.temperature = parameters.temperature || 150;

        // Simulate temperature ramp-up
        let currentTemp = 25;
        const rampInterval = setInterval(() => {
          currentTemp += 5;
          if (currentTemp >= this.state.temperature) {
            currentTemp = this.state.temperature;
            clearInterval(rampInterval);
          }

          connection.socket.send({
            type: 'sensor_update',
            data: {
              temperature: currentTemp,
              status: 'running'
            }
          });
        }, 200);

        connection.intervals.push(rampInterval);

        resolve({
          status: 'success',
          processId: `sim-${Date.now()}`
        });
      }, this.config.responseDelay);
    });
  }

  disconnect(equipmentId) {
    const connection = this.connections.get(equipmentId);
    if (connection) {
      connection.intervals.forEach(clearInterval);
      connection.socket.close();
      this.connections.delete(equipmentId);
    }
  }
}

// 5. End-to-End Testing with Cypress
// cypress/integration/semiconductor-e2e.spec.js
describe('Semiconductor Control System E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('operator', 'password');
  });

  it('should handle complete manufacturing process', () => {
    // Navigate to equipment
    cy.get('[data-cy=equipment-list]').should('be.visible');
    cy.get('[data-cy=equipment-wafer-01]').click();

    // Wait for equipment to load
    cy.get('[data-cy=equipment-status]').should('contain', 'idle');

    // Configure process parameters
    cy.get('[data-cy=param-temperature]').clear().type('150');
    cy.get('[data-cy=param-pressure]').clear().type('2.5');
    cy.get('[data-cy=param-duration]').clear().type('30');

    // Verify parameter validation
    cy.get('[data-cy=param-temperature]').clear().type('500');
    cy.get('[data-cy=validation-error]').should('contain', 'exceeds maximum');
    cy.get('[data-cy=param-temperature]').clear().type('150');

    // Start process
    cy.get('[data-cy=start-process]').click();
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-yes]').click();

    // Verify process started
    cy.get('[data-cy=equipment-status]').should('contain', 'running');
    cy.get('[data-cy=process-progress]').should('be.visible');

    // Monitor real-time updates
    cy.get('[data-cy=sensor-temperature]').should('exist');
    cy.get('[data-cy=sensor-pressure]').should('exist');

    // Test emergency stop
    cy.get('[data-cy=emergency-stop]').click();
    cy.get('[data-cy=emergency-confirm]').click();

    // Verify process stopped
    cy.get('[data-cy=equipment-status]').should('contain', 'stopped');
    cy.get('[data-cy=alert-emergency]').should('be.visible');

    // Check audit log
    cy.get('[data-cy=view-audit-log]').click();
    cy.get('[data-cy=audit-entries]').should('contain', 'Emergency Stop');
  });

  it('should handle network disruptions', () => {
    cy.get('[data-cy=equipment-wafer-01]').click();

    // Simulate offline
    cy.window().then(win => {
      win.dispatchEvent(new Event('offline'));
    });

    cy.get('[data-cy=offline-indicator]').should('be.visible');

    // Verify offline functionality
    cy.get('[data-cy=param-temperature]').type('150');
    cy.get('[data-cy=start-process]').click();
    cy.get('[data-cy=offline-warning]').should('contain', 'queued for sync');

    // Restore connection
    cy.window().then(win => {
      win.dispatchEvent(new Event('online'));
    });

    cy.get('[data-cy=sync-indicator]').should('be.visible');
    cy.get('[data-cy=sync-status]').should('contain', 'Synced');
  });
});

// 6. Performance Testing
// src/test/performance/load-test.js
import { performance } from 'perf_hooks';

class PerformanceTestRunner {
  async runLoadTest(config) {
    const results = {
      renderTimes: [],
      apiResponseTimes: [],
      memoryUsage: [],
      errors: []
    };

    for (let i = 0; i < config.iterations; i++) {
      const iterationResult = await this.runIteration(config);
      results.renderTimes.push(iterationResult.renderTime);
      results.apiResponseTimes.push(...iterationResult.apiTimes);
      results.memoryUsage.push(iterationResult.memory);
    }

    return this.analyzeResults(results);
  }

  async runIteration(config) {
    const startTime = performance.now();

    // Render component with large dataset
    const component = render(
      <EquipmentDashboard
        equipmentCount={config.equipmentCount}
        sensorCount={config.sensorCount}
      />
    );

    const renderTime = performance.now() - startTime;

    // Measure API response times
    const apiTimes = await this.measureApiPerformance(config);

    // Measure memory
    const memory = process.memoryUsage();

    component.unmount();

    return { renderTime, apiTimes, memory };
  }

  analyzeResults(results) {
    return {
      renderTime: {
        avg: this.average(results.renderTimes),
        p95: this.percentile(results.renderTimes, 95),
        p99: this.percentile(results.renderTimes, 99),
        max: Math.max(...results.renderTimes)
      },
      apiResponseTime: {
        avg: this.average(results.apiResponseTimes),
        p95: this.percentile(results.apiResponseTimes, 95),
        p99: this.percentile(results.apiResponseTimes, 99)
      },
      memoryUsage: {
        avg: this.average(results.memoryUsage.map(m => m.heapUsed)),
        max: Math.max(...results.memoryUsage.map(m => m.heapUsed))
      },
      errors: results.errors
    };
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export { EquipmentSimulator, PerformanceTestRunner };

```

This comprehensive testing strategy ensures reliability through unit tests with high coverage, integration tests for workflows, hardware simulation for realistic testing, end-to-end tests for complete user journeys, and performance testing to ensure the system meets real-time requirements for semiconductor manufacturing."

---

**Question 15: "How would you design the CI/CD pipeline to handle the specific requirements of hardware testing and compliance for semiconductor software?"**

**Senior Developer Answer:**
"I'd implement a multi-stage CI/CD pipeline with hardware-in-the-loop testing and compliance gates:

```yaml
# .gitlab-ci.yml - Main CI/CD Pipeline
stages:
  - pre-check
  - build
  - test
  - hardware-test
  - compliance
  - security-scan
  - deploy
  - post-deploy

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2
  HIL_LAB_URL: "https://hil-lab.semiconductor.local"
  COMPLIANCE_SERVER: "https://compliance.semiconductor.local"

# 1. Pre-check Stage - Fast feedback
license-check:
  stage: pre-check
  image: node:${NODE_VERSION}
  script:
    - npm ci --audit=false
    - npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;ISC" --excludePrivatePackages
    - |
      # Check for GPL licenses
      if npx license-checker --production | grep -E "GPL|LGPL|AGPL"; then
        echo "Found restricted licenses"
        exit 1
      fi
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

code-quality:
  stage: pre-check
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm run format:check
    - |
      # Complexity analysis
      npx complexity-report src/**/*.js --format json > complexity.json
      python3 scripts/check_complexity.py complexity.json --max-complexity 10
  artifacts:
    reports:
      codequality: complexity.json

# 2. Build Stage
build-application:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      # Build with build arguments for traceability
      docker build \
        --build-arg BUILD_NUMBER=$CI_PIPELINE_ID \
        --build-arg GIT_COMMIT=$CI_COMMIT_SHA \
        --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --label "maintainer=semiconductor-team" \
        --label "version=$CI_COMMIT_TAG" \
        --label "compliance.fda21cfr11=pending" \
        -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        -t $CI_REGISTRY_IMAGE:latest .

    - |
      # Generate SBOM (Software Bill of Materials)
      docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        anchore/syft:latest \
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        -o spdx-json > sbom.spdx.json

    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  artifacts:
    paths:
      - sbom.spdx.json
    expire_in: 30 days

# 3. Test Stage - Parallel test execution
unit-tests:
  stage: test
  image: node:${NODE_VERSION}
  parallel: 4
  script:
    - npm ci
    - |
      # Split tests for parallel execution
      TESTS=$(find src -name "*.test.js" -o -name "*.spec.js")
      TOTAL=$(echo "$TESTS" | wc -l)
      CHUNK_SIZE=$((TOTAL / CI_NODE_TOTAL + 1))
      START=$((CHUNK_SIZE * (CI_NODE_INDEX - 1) + 1))
      END=$((CHUNK_SIZE * CI_NODE_INDEX))

      TEST_FILES=$(echo "$TESTS" | sed -n "${START},${END}p")
      npm test -- --coverage --maxWorkers=2 $TEST_FILES
  coverage: '/Lines\s*:\s*([0-9.]+)%/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

integration-tests:
  stage: test
  services:
    - postgres:14
    - redis:7
  variables:
    POSTGRES_DB: semiconductor_test
    POSTGRES_PASSWORD: testpass
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    reports:
      junit: test-results/integration/*.xml

# 4. Hardware-in-the-Loop Testing
reserve-hardware:
  stage: hardware-test
  image: python:3.10
  script:
    - pip install requests pyyaml
    - |
      python3 << 'EOF'
      import requests
      import yaml
      import os
      import time

      # Reserve HIL test bench
      reservation_request = {
          "pipeline_id": os.environ['CI_PIPELINE_ID'],
          "equipment_type": "wafer_processor",
          "duration_minutes": 60,
          "priority": "high" if "hotfix" in os.environ.get('CI_COMMIT_BRANCH', '') else "normal"
      }

      response = requests.post(
          f"{os.environ['HIL_LAB_URL']}/api/reservations",
          json=reservation_request,
          headers={"Authorization": f"Bearer {os.environ['HIL_API_TOKEN']}"}
      )

      if response.status_code == 200:
          reservation = response.json()
          print(f"Reserved: {reservation['reservation_id']}")

          # Save reservation details
          with open('reservation.yaml', 'w') as f:
              yaml.dump(reservation, f)
      else:
          print(f"Reservation failed: {response.text}")
          exit(1)
      EOF
  artifacts:
    paths:
      - reservation.yaml
  rules:
    - if: '$CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "staging"'

hardware-test-execution:
  stage: hardware-test
  image: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  needs: ["reserve-hardware", "build-application"]
  script:
    - |
      # Load reservation details
      RESERVATION_ID=$(cat reservation.yaml | grep reservation_id | cut -d' ' -f2)
      HIL_ENDPOINT=$(cat reservation.yaml | grep endpoint | cut -d' ' -f2)

      # Deploy to HIL environment
      ssh -o StrictHostKeyChecking=no hil-operator@$HIL_ENDPOINT << 'ENDSSH'
        docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
        docker stop semiconductor-test || true
        docker run -d \
          --name semiconductor-test \
          --privileged \
          --network host \
          --device /dev/ttyUSB0:/dev/ttyUSB0 \
          --device /dev/spidev0.0:/dev/spidev0.0 \
          -e TEST_MODE=hardware \
          -e HIL_CONFIG=/config/hil-test.yaml \
          $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
      ENDSSH

      # Execute HIL test suite
      python3 scripts/hil_test_runner.py \
        --reservation-id $RESERVATION_ID \
        --test-suite comprehensive \
        --output-dir ./hil-results

      # Validate results
      python3 scripts/validate_hil_results.py \
        --results ./hil-results \
        --thresholds config/hil-thresholds.yaml
  after_script:
    - |
      # Release hardware reservation
      RESERVATION_ID=$(cat reservation.yaml | grep reservation_id | cut -d' ' -f2)
      curl -X DELETE "$HIL_LAB_URL/api/reservations/$RESERVATION_ID" \
        -H "Authorization: Bearer $HIL_API_TOKEN"
  artifacts:
    paths:
      - hil-results/
    reports:
      junit: hil-results/junit/*.xml
  timeout: 2 hours

# 5. Compliance & Validation
compliance-validation:
  stage: compliance
  image: python:3.10
  needs: ["unit-tests", "integration-tests", "hardware-test-execution"]
  script:
    - pip install jinja2 pyyaml jsonschema
    - |
      python3 << 'EOF'
      import os
      import json
      import yaml
      from datetime import datetime

      class ComplianceValidator:
          def __init__(self):
              self.results = {
                  "timestamp": datetime.utcnow().isoformat(),
                  "pipeline_id": os.environ['CI_PIPELINE_ID'],
                  "commit_sha": os.environ['CI_COMMIT_SHA'],
                  "validations": []
              }

          def validate_fda_21cfr11(self):
              """Validate FDA 21 CFR Part 11 compliance"""
              checks = {
                  "electronic_signatures": self.check_electronic_signatures(),
                  "audit_trails": self.check_audit_trails(),
                  "access_controls": self.check_access_controls(),
                  "data_integrity": self.check_data_integrity(),
                  "change_control": self.check_change_control()
              }

              return all(checks.values())

          def check_electronic_signatures(self):
              # Verify digital signatures on critical operations
              signature_files = [
                  "src/security/signatures.js",
                  "src/audit/signing.js"
              ]
              return all(os.path.exists(f) for f in signature_files)

          def check_audit_trails(self):
              # Verify audit logging implementation
              audit_tests = json.load(open("test-results/audit-tests.json"))
              return audit_tests["passed"] == audit_tests["total"]

          def check_access_controls(self):
              # Verify RBAC implementation
              with open("src/auth/rbac.config.json") as f:
                  rbac = json.load(f)
                  required_roles = ["operator", "supervisor", "admin", "qa"]
                  return all(role in rbac["roles"] for role in required_roles)

          def check_data_integrity(self):
              # Verify data validation and checksums
              integrity_report = json.load(open("test-results/integrity.json"))
              return integrity_report["hash_validation"] == "passed"

          def check_change_control(self):
              # Verify change management process
              return os.environ.get('CI_MERGE_REQUEST_APPROVED') == 'true'

          def validate_iso_14644(self):
              """Validate ISO 14644 cleanroom standards compliance"""
              # Check contamination control features
              features = [
                  "particle_monitoring",
                  "environmental_controls",
                  "gowning_procedures",
                  "material_transfer"
              ]

              config = yaml.load(open("config/cleanroom.yaml"), Loader=yaml.SafeLoader)
              return all(f in config["features"] for f in features)

          def generate_report(self):
              self.results["fda_21cfr11"] = self.validate_fda_21cfr11()
              self.results["iso_14644"] = self.validate_iso_14644()

              with open("compliance-report.json", "w") as f:
                  json.dump(self.results, f, indent=2)

              # Generate PDF report
              os.system("python3 scripts/generate_compliance_pdf.py compliance-report.json")

              return self.results["fda_21cfr11"] and self.results["iso_14644"]

      validator = ComplianceValidator()
      if not validator.generate_report():
          print("Compliance validation failed")
          exit(1)
      EOF
  artifacts:
    paths:
      - compliance-report.json
      - compliance-report.pdf
    expire_in: 5 years  # Regulatory requirement

# 6. Security Scanning
security-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - |
      # Scan container image
      trivy image \
        --severity HIGH,CRITICAL \
        --format json \
        --output container-scan.json \
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

      # Scan IaC
      trivy config \
        --severity HIGH,CRITICAL \
        --format json \
        --output iac-scan.json \
        .

      # Check for secrets
      trivy repo \
        --severity HIGH,CRITICAL \
        --format json \
        --output secrets-scan.json \
        .
  artifacts:
    reports:
      container_scanning: container-scan.json
      sast: iac-scan.json
      secret_detection: secrets-scan.json

# 7. Deployment Stages
.deploy_template:
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq
    - |
      # Verify image signatures
      cosign verify \
        --key /secrets/cosign.pub \
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy-staging:
  extends: .deploy_template
  stage: deploy
  environment:
    name: staging
    url: https://staging.semiconductor.local
  script:
    - |
      # Blue-green deployment to staging
      ./scripts/deploy.sh \
        --environment staging \
        --image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        --strategy blue-green \
        --health-check-url https://staging.semiconductor.local/health
  only:
    - staging

deploy-production:
  extends: .deploy_template
  stage: deploy
  environment:
    name: production
    url: https://production.semiconductor.local
  script:
    - |
      # Canary deployment to production
      ./scripts/deploy.sh \
        --environment production \
        --image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        --strategy canary \
        --canary-percentage 10 \
        --canary-duration 3600 \
        --rollback-on-error true
  when: manual
  only:
    - main
  needs:
    - compliance-validation
    - security-scan

# 8. Post-deployment Validation
post-deploy-validation:
  stage: post-deploy
  image: node:${NODE_VERSION}
  script:
    - |
      # Run smoke tests
      npm run test:e2e:production -- --smoke

      # Verify critical paths
      python3 scripts/verify_critical_paths.py \
        --environment $CI_ENVIRONMENT_NAME \
        --timeout 60

      # Check system health
      for i in {1..10}; do
        HEALTH=$(curl -s https://$CI_ENVIRONMENT_URL/health | jq -r '.status')
        if [ "$HEALTH" != "healthy" ]; then
          echo "Health check failed"
          exit 1
        fi
        sleep 6
      done
  environment:
    name: $CI_COMMIT_BRANCH
  rules:
    - if: '$CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "staging"'

# 9. Rollback Job
rollback:
  stage: post-deploy
  image: alpine:latest
  script:
    - |
      echo "Rolling back deployment"
      ./scripts/rollback.sh \
        --environment $ENVIRONMENT \
        --previous-version $PREVIOUS_VERSION
  when: manual
  only:
    - main
    - staging

```

```python
# scripts/hil_test_runner.py
#!/usr/bin/env python3

import asyncio
import json
import yaml
import time
from dataclasses import dataclass
from typing import List, Dict, Any
import aiohttp
import numpy as np

@dataclass
class HILTestCase:
    name: str
    equipment_id: str
    parameters: Dict[str, Any]
    expected_results: Dict[str, Any]
    timeout: int = 300

class HILTestRunner:
    def __init__(self, reservation_id: str, config_path: str):
        self.reservation_id = reservation_id
        self.config = self.load_config(config_path)
        self.results = []
        self.session = None

    async def run_test_suite(self, suite_name: str):
        """Execute complete HIL test suite"""
        test_suite = self.config['test_suites'][suite_name]

        async with aiohttp.ClientSession() as self.session:
            # Initialize equipment
            await self.initialize_equipment()

            # Run test cases
            for test_case in test_suite['tests']:
                result = await self.run_test_case(HILTestCase(**test_case))
                self.results.append(result)

                # Check for critical failures
                if result['status'] == 'critical_failure':
                    await self.emergency_shutdown()
                    break

            # Cleanup
            await self.cleanup_equipment()

        return self.generate_report()

    async def run_test_case(self, test_case: HILTestCase):
        """Execute individual test case"""
        print(f"Running test: {test_case.name}")

        result = {
            'name': test_case.name,
            'start_time': time.time(),
            'status': 'pending'
        }

        try:
            # Configure equipment
            await self.configure_equipment(
                test_case.equipment_id,
                test_case.parameters
            )

            # Start process
            process_id = await self.start_process(test_case.equipment_id)

            # Monitor execution
            measurements = await self.monitor_process(
                process_id,
                test_case.timeout
            )

            # Validate results
            validation = self.validate_results(
                measurements,
                test_case.expected_results
            )

            result.update({
                'status': 'passed' if validation['passed'] else 'failed',
                'measurements': measurements,
                'validation': validation,
                'end_time': time.time()
            })

        except Exception as e:
            result.update({
                'status': 'error',
                'error': str(e),
                'end_time': time.time()
            })

        return result

    async def monitor_process(self, process_id: str, timeout: int):
        """Monitor equipment process execution"""
        measurements = []
        start_time = time.time()

        while time.time() - start_time < timeout:
            # Get sensor data
            data = await self.get_sensor_data(process_id)
            measurements.append(data)

            # Check for completion
            if data.get('status') == 'completed':
                break

            # Check for errors
            if data.get('status') == 'error':
                raise Exception(f"Process error: {data.get('error')}")

            await asyncio.sleep(1)

        return measurements

    def validate_results(self, measurements: List[Dict], expected: Dict):
        """Validate test results against expected values"""
        validation = {
            'passed': True,
            'checks': []
        }

        # Statistical analysis
        if measurements:
            temps = [m['temperature'] for m in measurements if 'temperature' in m]
            pressures = [m['pressure'] for m in measurements if 'pressure' in m]

            if temps and 'temperature' in expected:
                temp_check = {
                    'parameter': 'temperature',
                    'mean': np.mean(temps),
                    'std': np.std(temps),
                    'expected': expected['temperature'],
                    'tolerance': expected.get('temperature_tolerance', 2.0)
                }

                temp_check['passed'] = abs(
                    temp_check['mean'] - temp_check['expected']
                ) <= temp_check['tolerance']

                validation['checks'].append(temp_check)
                validation['passed'] &= temp_check['passed']

            # Additional validations...

        return validation

    def generate_report(self):
        """Generate test report"""
        report = {
            'reservation_id': self.reservation_id,
            'timestamp': time.time(),
            'total_tests': len(self.results),
            'passed': sum(1 for r in self.results if r['status'] == 'passed'),
            'failed': sum(1 for r in self.results if r['status'] == 'failed'),
            'errors': sum(1 for r in self.results if r['status'] == 'error'),
            'test_results': self.results
        }

        # Generate JUnit XML for CI integration
        self.generate_junit_xml(report)

        return report

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--reservation-id', required=True)
    parser.add_argument('--test-suite', required=True)
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args()

    runner = HILTestRunner(args.reservation_id, 'config/hil-tests.yaml')
    results = asyncio.run(runner.run_test_suite(args.test_suite))

    with open(f'{args.output_dir}/results.json', 'w') as f:
        json.dump(results, f, indent=2)

```

This CI/CD pipeline ensures comprehensive testing including hardware-in-the-loop validation, regulatory compliance verification, security scanning at multiple levels, traceable deployments with rollback capabilities, and complete audit trails for semiconductor manufacturing requirements."

---

I've provided 15 detailed technical interview questions with comprehensive senior-level answers covering React/frontend development (8 questions) and Linux/backend systems (7 questions), all contextualized for the semiconductor manufacturing domain. Each answer demonstrates:

1. **Deep technical knowledge** with specific code examples and implementation details
2. **Problem-solving approach** showing systematic thinking and best practices
3. **Industry context** incorporating semiconductor-specific requirements
4. **Production-ready solutions** with error handling, security, and scalability considerations
5. **Senior-level insights** including architecture decisions, trade-offs, and team considerations

The answers range from React performance optimization and state management to Linux real-time configuration, security implementation, and CI/CD pipeline design - all crucial for a software developer role in semiconductor manufacturing. Each response provides working code examples that you can discuss and explain during your interview preparation.

# React Centered Questions

# React/Frontend Technical Interview Preparation

## Interview with Benjamin Cells - Senior Software Engineering Lead

Here are 15 React-focused technical questions that align with your senior-level experience and the semiconductor manufacturing equipment context:

---

## 1. Complex State Management Architecture

**Question:** "In our semiconductor manufacturing equipment, we have real-time sensor data flowing from multiple machines (temperature, pressure, vacuum levels) that needs to be displayed across several dashboard components. How would you architect the state management for this scenario, and what trade-offs would you consider between Context API, Redux, Zustand, or other solutions?"

**Detailed Answer:**
"For real-time manufacturing equipment monitoring, I'd approach this systematically:

**Architecture Decision:**
I'd likely choose **Zustand** for this use case, here's my reasoning:

1. **Performance considerations**: With real-time sensor data, we're dealing with frequent updates (potentially hundreds per second). Redux's immutability pattern and middleware overhead could become a bottleneck. Zustand uses a subscription model that allows components to subscribe to specific slices of state, preventing unnecessary re-renders.
2. **Implementation approach**:

```jsx
// stores/equipmentStore.js
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useEquipmentStore = create(
  subscribeWithSelector((set, get) => ({
    sensors: {
      chamber1: { temp: 0, pressure: 0, vacuum: 0, timestamp: null },
      chamber2: { temp: 0, pressure: 0, vacuum: 0, timestamp: null },
      // ... more chambers
    },

    alerts: [],

    updateSensorData: (chamberId, sensorType, value) =>
      set((state) => ({
        sensors: {
          ...state.sensors,
          [chamberId]: {
            ...state.sensors[chamberId],
            [sensorType]: value,
            timestamp: Date.now()
          }
        }
      })),

    addAlert: (alert) =>
      set((state) => ({
        alerts: [...state.alerts, { ...alert, id: Date.now() }]
      })),
  }))
);

```

1. **Selective subscriptions** to prevent over-rendering:

```jsx
// Component only re-renders when chamber1 temp changes
function TemperatureMonitor() {
  const chamber1Temp = useEquipmentStore(
    (state) => state.sensors.chamber1.temp
  );

  return <div>Chamber 1: {chamber1Temp}°C</div>;
}

```

1. **WebSocket integration pattern**:

```jsx
// hooks/useEquipmentWebSocket.js
export function useEquipmentWebSocket() {
  const updateSensorData = useEquipmentStore(state => state.updateSensorData);
  const addAlert = useEquipmentStore(state => state.addAlert);

  useEffect(() => {
    const ws = new WebSocket('wss://equipment-api/sensors');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Batch updates to prevent excessive re-renders
      if (data.type === 'SENSOR_BATCH') {
        data.readings.forEach(reading => {
          updateSensorData(reading.chamberId, reading.type, reading.value);

          // Check thresholds
          if (reading.value > reading.threshold) {
            addAlert({
              chamberId: reading.chamberId,
              severity: 'high',
              message: `${reading.type} exceeded threshold`
            });
          }
        });
      }
    };

    return () => ws.close();
  }, [updateSensorData, addAlert]);
}

```

**Trade-offs I'd consider:**

- **Context API**: Too many re-renders with high-frequency updates. Every context consumer re-renders when any value changes unless heavily optimized with `useMemo`.
- **Redux**: Excellent dev tools and time-travel debugging which is valuable for reproducing manufacturing issues. However, boilerplate and performance overhead. I might use it if we need middleware like Redux-Saga for complex async orchestration of equipment sequences.
- **Zustand**: Best performance for real-time data, minimal boilerplate, but less mature ecosystem for debugging compared to Redux.

**My recommendation**: Start with Zustand for the real-time sensor data, but if we need complex orchestration of manufacturing sequences (e.g., multi-step wafer processing), I'd introduce Redux Toolkit with RTK Query for those specific workflows while keeping Zustand for high-frequency sensor updates."

---

## 2. Performance Optimization for Data-Heavy Dashboards

**Question:** "Our equipment dashboard needs to render 50+ line charts showing historical sensor data over 24-hour periods, each with thousands of data points. Users are complaining about lag when interacting with the dashboard. Walk me through your debugging process and optimization strategies."

**Detailed Answer:**
"This is a classic performance problem I've dealt with extensively in observability dashboards. Here's my systematic approach:

**Phase 1: Profiling & Diagnosis**

1. **React DevTools Profiler**:

```jsx
// Wrap the dashboard to measure render times
import { Profiler } from 'react';

function Dashboard() {
  const onRenderCallback = (
    id, phase, actualDuration, baseDuration, startTime, commitTime
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);

    // Send to analytics if duration exceeds threshold
    if (actualDuration > 16) { // 60fps = 16ms per frame
      analytics.track('slow_render', {
        component: id,
        duration: actualDuration,
        phase
      });
    }
  };

  return (
    <Profiler id="Dashboard" onRender={onRenderCallback}>
      <DashboardContent />
    </Profiler>
  );
}

```

1. **Chrome Performance tab**: Record while interacting to identify long tasks, forced reflows, and excessive component updates.

**Phase 2: Optimization Strategies**

**Strategy 1: Virtualization**

```jsx
// Only render visible charts using react-window
import { FixedSizeList as List } from 'react-window';

function ChartGrid({ charts }) {
  const Row = ({ index, style }) => {
    const chart = charts[index];
    return (
      <div style={style}>
        <MemoizedChart data={chart.data} config={chart.config} />
      </div>
    );
  };

  return (
    <List
      height={800}
      itemCount={charts.length}
      itemSize={250}
      width="100%"
    >
      {Row}
    </List>
  );
}

```

**Strategy 2: Data Downsampling**

```jsx
// Reduce data points while preserving visual fidelity
function downsampleData(data, targetPoints = 500) {
  if (data.length <= targetPoints) return data;

  // Largest Triangle Three Buckets (LTTB) algorithm
  const bucketSize = (data.length - 2) / (targetPoints - 2);
  const sampled = [data[0]]; // Always keep first point

  for (let i = 0; i < targetPoints - 2; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Find point with largest triangle area
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    const avgNext = calculateAverage(
      data.slice(bucketEnd, bucketEnd + Math.floor(bucketSize))
    );

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = triangleArea(
        sampled[sampled.length - 1],
        data[j],
        avgNext
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    sampled.push(data[maxAreaIndex]);
  }

  sampled.push(data[data.length - 1]); // Always keep last point
  return sampled;
}

function ChartWithDownsampling({ data }) {
  const downsampledData = useMemo(
    () => downsampleData(data, 500),
    [data]
  );

  return <LineChart data={downsampledData} />;
}

```

**Strategy 3: Memoization & Component Optimization**

```jsx
// Prevent unnecessary re-renders
const MemoizedChart = memo(function Chart({ data, config }) {
  // Use canvas instead of SVG for better performance with large datasets
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Use requestAnimationFrame for smooth rendering
    const renderChart = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Batch draw operations
      ctx.beginPath();
      data.forEach((point, i) => {
        const x = (i / data.length) * canvas.width;
        const y = canvas.height - (point.value / config.maxValue) * canvas.height;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    requestAnimationFrame(renderChart);
  }, [data, config]);

  return <canvas ref={canvasRef} width={800} height={300} />;
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.config.maxValue === nextProps.config.maxValue &&
    prevProps.data[0]?.timestamp === nextProps.data[0]?.timestamp
  );
});

```

**Strategy 4: Lazy Loading & Code Splitting**

```jsx
// Lazy load chart library
const LazyChart = lazy(() => import('./HeavyChartComponent'));

function DashboardSection({ isVisible }) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      {isVisible && <LazyChart />}
    </Suspense>
  );
}

// Use Intersection Observer to load charts on demand
function LazyLoadedChart({ data }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Load slightly before visible
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? <MemoizedChart data={data} /> : <ChartPlaceholder />}
    </div>
  );
}

```

**Strategy 5: Web Workers for Data Processing**

```jsx
// Offload heavy data processing to Web Worker
// workers/dataProcessor.js
self.addEventListener('message', (e) => {
  const { data, operation } = e.data;

  let result;
  switch (operation) {
    case 'downsample':
      result = downsampleData(data, 500);
      break;
    case 'calculateStats':
      result = calculateStatistics(data);
      break;
  }

  self.postMessage(result);
});

// hooks/useDataWorker.js
export function useDataWorker() {
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/dataProcessor.js', import.meta.url)
    );

    return () => workerRef.current?.terminate();
  }, []);

  const processData = useCallback((data, operation) => {
    return new Promise((resolve) => {
      workerRef.current.postMessage({ data, operation });
      workerRef.current.onmessage = (e) => resolve(e.data);
    });
  }, []);

  return processData;
}

```

**Measurable Outcomes:**

- Target: 60fps during interactions (16.67ms per frame)
- Initial load time reduced by 70% with lazy loading
- Smooth scrolling with virtualization
- Memory usage reduced by downsampling from 5000 to 500 points per chart

**Monitoring:**

```jsx
// Add performance marks for ongoing monitoring
useEffect(() => {
  performance.mark('dashboard-render-start');
  return () => {
    performance.mark('dashboard-render-end');
    performance.measure(
      'dashboard-render',
      'dashboard-render-start',
      'dashboard-render-end'
    );

    const measure = performance.getEntriesByName('dashboard-render')[0];
    if (measure.duration > 1000) {
      // Alert if render takes > 1 second
      console.warn('Slow dashboard render:', measure.duration);
    }
  };
}, []);

```

This approach has consistently delivered 3-5x performance improvements in my observability dashboards at Charter."

---

## 3. Real-Time Data Synchronization Strategy

**Question:** "Multiple users need to monitor the same equipment simultaneously, and changes made by one user (like setting temperature thresholds) should reflect immediately for all users. How would you implement real-time synchronization, and what edge cases would you handle?"

**Detailed Answer:**
"This requires a robust real-time architecture with conflict resolution. Here's how I'd build it:

**Architecture Overview:**

**1. WebSocket Connection Management**

```jsx
// lib/realtimeConnection.js
class EquipmentSyncManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageQueue = [];
    this.connectionState = 'disconnected';
    this.listeners = new Map();
  }

  connect(userId, equipmentId) {
    this.ws = new WebSocket(
      `wss://equipment-api/sync/${equipmentId}?userId=${userId}`
    );

    this.ws.onopen = () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;

      // Send queued messages
      this.flushMessageQueue();

      // Subscribe to equipment state
      this.send({
        type: 'SUBSCRIBE',
        channels: ['equipment_state', 'user_actions', 'alerts']
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect();
    };

    this.ws.onclose = () => {
      this.connectionState = 'disconnected';
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection_failed');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => this.connect(), delay);
  }

  send(message) {
    if (this.connectionState !== 'connected') {
      // Queue messages while disconnected
      this.messageQueue.push(message);
      return;
    }

    this.ws.send(JSON.stringify({
      ...message,
      timestamp: Date.now(),
      clientId: this.userId
    }));
  }

  handleMessage(message) {
    this.emit(message.type, message.data);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

export const syncManager = new EquipmentSyncManager();

```

**2. React Integration with Optimistic Updates**

```jsx
// hooks/useRealtimeSync.js
export function useRealtimeSync(equipmentId) {
  const [state, setState] = useState({
    equipment: null,
    users: [],
    pendingUpdates: new Map(),
    conflictResolution: null
  });

  const userId = useCurrentUser().id;

  useEffect(() => {
    syncManager.connect(userId, equipmentId);

    // Handle incoming state updates from other users
    syncManager.on('STATE_UPDATE', (update) => {
      setState(prev => {
        // Check if we have a pending update for this field
        const pendingKey = `${update.field}-${update.timestamp}`;

        if (prev.pendingUpdates.has(pendingKey)) {
          // Our update was acknowledged
          const newPending = new Map(prev.pendingUpdates);
          newPending.delete(pendingKey);

          return {
            ...prev,
            equipment: { ...prev.equipment, ...update.data },
            pendingUpdates: newPending
          };
        }

        // Check for conflicts
        const hasConflict = Array.from(prev.pendingUpdates.values())
          .some(pending => pending.field === update.field);

        if (hasConflict) {
          // Last-write-wins with server timestamp
          return {
            ...prev,
            conflictResolution: {
              field: update.field,
              serverValue: update.data[update.field],
              localValue: prev.equipment[update.field],
              serverTimestamp: update.timestamp
            }
          };
        }

        return {
          ...prev,
          equipment: { ...prev.equipment, ...update.data }
        };
      });
    });

    // Track active users
    syncManager.on('USER_JOINED', (user) => {
      setState(prev => ({
        ...prev,
        users: [...prev.users, user]
      }));
    });

    syncManager.on('USER_LEFT', (user) => {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== user.id)
      }));
    });

    return () => syncManager.disconnect();
  }, [equipmentId, userId]);

  // Optimistic update with conflict detection
  const updateEquipment = useCallback((field, value) => {
    const updateId = `${field}-${Date.now()}`;

    // Optimistic update
    setState(prev => {
      const newPending = new Map(prev.pendingUpdates);
      newPending.set(updateId, { field, value, timestamp: Date.now() });

      return {
        ...prev,
        equipment: { ...prev.equipment, [field]: value },
        pendingUpdates: newPending
      };
    });

    // Send to server
    syncManager.send({
      type: 'UPDATE_EQUIPMENT',
      updateId,
      field,
      value,
      equipmentId
    });

    // Timeout for update acknowledgment
    setTimeout(() => {
      setState(prev => {
        if (prev.pendingUpdates.has(updateId)) {
          // Update wasn't acknowledged, show error
          console.error('Update timeout for:', field);
          return {
            ...prev,
            pendingUpdates: new Map(
              Array.from(prev.pendingUpdates).filter(([k]) => k !== updateId)
            )
          };
        }
        return prev;
      });
    }, 5000);
  }, [equipmentId]);

  return {
    equipment: state.equipment,
    activeUsers: state.users,
    updateEquipment,
    hasPendingUpdates: state.pendingUpdates.size > 0,
    conflictResolution: state.conflictResolution
  };
}

```

**3. UI Components with Conflict Resolution**

```jsx
function TemperatureControl({ equipmentId }) {
  const {
    equipment,
    activeUsers,
    updateEquipment,
    hasPendingUpdates,
    conflictResolution
  } = useRealtimeSync(equipmentId);

  const [localValue, setLocalValue] = useState(equipment?.temperature || 0);

  // Sync local state with equipment state
  useEffect(() => {
    if (equipment?.temperature !== undefined) {
      setLocalValue(equipment.temperature);
    }
  }, [equipment?.temperature]);

  const handleChange = (e) => {
    const value = parseFloat(e.target.value);
    setLocalValue(value);

    // Debounce updates to reduce network traffic
    debouncedUpdate(value);
  };

  const debouncedUpdate = useMemo(
    () => debounce((value) => {
      updateEquipment('temperature', value);
    }, 300),
    [updateEquipment]
  );

  return (
    <div className="temperature-control">
      <div className="control-header">
        <label>Temperature Setpoint</label>
        <ActiveUsers users={activeUsers} />
        {hasPendingUpdates && (
          <Spinner size="sm" label="Syncing..." />
        )}
      </div>

      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        disabled={hasPendingUpdates}
      />

      {conflictResolution?.field === 'temperature' && (
        <ConflictDialog
          conflict={conflictResolution}
          onResolve={(useServer) => {
            if (useServer) {
              setLocalValue(conflictResolution.serverValue);
            } else {
              updateEquipment('temperature', localValue);
            }
          }}
        />
      )}
    </div>
  );
}

function ConflictDialog({ conflict, onResolve }) {
  return (
    <Dialog>
      <h3>Update Conflict Detected</h3>
      <p>
        Another user modified {conflict.field} while you were editing.
      </p>
      <div className="conflict-options">
        <div>
          <strong>Your value:</strong> {conflict.localValue}
        </div>
        <div>
          <strong>Server value:</strong> {conflict.serverValue}
        </div>
      </div>
      <div className="actions">
        <Button onClick={() => onResolve(true)}>
          Use Server Value
        </Button>
        <Button onClick={() => onResolve(false)} variant="primary">
          Keep My Value
        </Button>
      </div>
    </Dialog>
  );
}

```

**4. Presence & Awareness**

```jsx
function ActiveUsers({ users }) {
  return (
    <div className="active-users">
      {users.map(user => (
        <Tooltip key={user.id} content={`${user.name} is viewing`}>
          <Avatar
            src={user.avatar}
            size="sm"
            className={`user-avatar ${user.isEditing ? 'editing' : ''}`}
          />
        </Tooltip>
      ))}
    </div>
  );
}

// Track what field users are editing
function useFieldPresence(field) {
  const { activeUsers } = useRealtimeSync();
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) {
      syncManager.send({
        type: 'USER_EDITING',
        field
      });
    } else {
      syncManager.send({
        type: 'USER_STOPPED_EDITING',
        field
      });
    }
  }, [focused, field]);

  const editingUsers = activeUsers.filter(u => u.editingField === field);

  return { editingUsers, setFocused };
}

```

**Edge Cases Handled:**

1. **Network disconnection**: Queue updates, auto-reconnect with exponential backoff
2. **Concurrent edits**: Optimistic updates + conflict resolution dialog
3. **Stale data**: Server timestamp comparison, last-write-wins
4. **Message ordering**: Server-side sequencing with message IDs
5. **Connection recovery**: Resume from last known state, replay missed updates
6. **Rate limiting**: Debounced updates, batch operations
7. **Session hijacking**: JWT tokens, connection validation

This architecture has handled 100+ concurrent users in my observability platform without conflicts."

---

## 4. Custom Hook Design & Reusability

**Question:** "You need to create a custom hook that fetches equipment sensor data, handles loading/error states, implements retry logic, and supports real-time updates. How would you design this hook to be reusable across different types of equipment and sensors?"

**Detailed Answer:**

"I'd design a composable hook architecture that separates concerns and maximizes reusability. Here's my approach:

**Base Layer: Generic Data Fetching Hook**

```jsx
// hooks/useQuery.js
export function useQuery(queryFn, options = {}) {
  const {
    enabled = true,
    refetchInterval = null,
    retry = 3,
    retryDelay = (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess,
    onError,
    staleTime = 0
  } = options;

  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
    isFetching: false,
    fetchedAt: null
  });

  const retryCount = useRef(0);
  const abortController = useRef(null);
  const refetchTimer = useRef(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    // Cancel previous request
    abortController.current?.abort();
    abortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      isFetching: true,
      isLoading: !isRefetch && !prev.data
    }));

    try {
      const data = await queryFn({
        signal: abortController.current.signal
      });

      retryCount.current = 0;

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        fetchedAt: Date.now()
      });

      onSuccess?.(data);

    } catch (error) {
      if (error.name === 'AbortError') return;

      // Retry logic
      if (retryCount.current < retry) {
        retryCount.current++;
        const delay = retryDelay(retryCount.current - 1);

        setTimeout(() => fetchData(isRefetch), delay);
        return;
      }

      setState(prev => ({
        ...prev,
        error,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isFetching: false
      }));

      onError?.(error);
    }
  }, [queryFn, retry, retryDelay, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    fetchData();

    return () => {
      abortController.current?.abort();
      clearInterval(refetchTimer.current);
    };
  }, [enabled, fetchData]);

  // Polling
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    refetchTimer.current = setInterval(() => {
      // Only refetch if data is stale
      const isStale = Date.now() - state.fetchedAt > staleTime;
      if (isStale) {
        fetchData(true);
      }
    }, refetchInterval);

    return () => clearInterval(refetchTimer.current);
  }, [enabled, refetchInterval, staleTime, fetchData, state.fetchedAt]);

  const refetch = useCallback(() => {
    retryCount.current = 0;
    return fetchData(true);
  }, [fetchData]);

  return {
    ...state,
    refetch
  };
}

```

**Mid Layer: Equipment-Specific Hook**

```jsx
// hooks/useEquipmentSensor.js
export function useEquipmentSensor(equipmentId, sensorType, options = {}) {
  const {
    realtime = false,
    transform = (data) => data,
    threshold = null,
    ...queryOptions
  } = options;

  // Fetch historical data
  const query = useQuery(
    async ({ signal }) => {
      const response = await fetch(
        `/api/equipment/${equipmentId}/sensors/${sensorType}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return transform(data);
    },
    {
      ...queryOptions,
      refetchInterval: realtime ? 5000 : null,
      staleTime: realtime ? 5000 : 30000
    }
  );

  // WebSocket for real-time updates
  const [realtimeData, setRealtimeData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!realtime || !query.isSuccess) return;

    const ws = new WebSocket(
      `wss://equipment-api/${equipmentId}/sensors/${sensorType}/stream`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const transformed = transform(data);

      setRealtimeData(transformed);

      // Check threshold
      if (threshold && transformed.value > threshold) {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          timestamp: transformed.timestamp,
          value: transformed.value,
          threshold,
          severity: 'high'
        }]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fallback to polling
      query.refetch();
    };

    return () => ws.close();
  }, [realtime, query.isSuccess, equipmentId, sensorType, threshold, transform]);

  // Merge historical and realtime data
  const currentData = realtimeData || query.data;

  return {
    ...query,
    data: currentData,
    alerts,
    clearAlerts: () => setAlerts([]),
    isRealtime: realtime && realtimeData !== null
  };
}

```

**Top Layer: Domain-Specific Hooks**

```jsx
// hooks/useTemperatureSensor.js
export function useTemperatureSensor(equipmentId, options = {}) {
  const {
    unit = 'celsius',
    threshold = 1000,
    ...rest
  } = options;

  return useEquipmentSensor(equipmentId, 'temperature', {
    ...rest,
    threshold,
    transform: (data) => {
      // Convert units if needed
      const value = unit === 'fahrenheit'
        ? (data.value * 9/5) + 32
        : data.value;

      return {
        ...data,
        value,
        unit,
        status: getTemperatureStatus(value, threshold)
      };
    }
  });
}

function getTemperatureStatus(value, threshold) {
  const percentage = (value / threshold) * 100;

  if (percentage < 70) return 'normal';
  if (percentage < 90) return 'warning';
  return 'critical';
}

// hooks/usePressureSensor.js
export function usePressureSensor(equipmentId, options = {}) {
  const {
    unit = 'pascal',
    range = { min: 0, max: 101325 },
    ...rest
  } = options;

  return useEquipmentSensor(equipmentId, 'pressure', {
    ...rest,
    transform: (data) => {
      const normalized = (data.value - range.min) / (range.max - range.min);

      return {
        ...data,
        unit,
        normalized,
        inRange: data.value >= range.min && data.value <= range.max
      };
    }
  });
}

// hooks/useMultipleSensors.js
export function useMultipleSensors(equipmentId, sensorTypes, options = {}) {
  const sensors = sensorTypes.map(type => {
    const hookMap = {
      temperature: useTemperatureSensor,
      pressure: usePressureSensor,
      vacuum: useVacuumSensor
    };

    const hook = hookMap[type] || useEquipmentSensor;
    return hook(equipmentId, options);
  });

  const isLoading = sensors.some(s => s.isLoading);
  const isError = sensors.some(s => s.isError);
  const allAlerts = sensors.flatMap(s => s.alerts);

  return {
    sensors,
    isLoading,
    isError,
    allAlerts,
    refetchAll: () => sensors.forEach(s => s.refetch())
  };
}

```

**Usage Examples:**

```jsx
// Simple usage - temperature monitoring
function TemperatureDisplay({ equipmentId }) {
  const { data, isLoading, error, alerts } = useTemperatureSensor(
    equipmentId,
    {
      unit: 'celsius',
      threshold: 1000,
      realtime: true,
      retry: 5
    }
  );

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <StatusBadge status={data.status} />
      <h2>{data.value}°{data.unit}</h2>
      {alerts.length > 0 && <AlertPanel alerts={alerts} />}
    </div>
  );
}

// Advanced usage - multiple sensors with dependencies
function EquipmentDashboard({ equipmentId }) {
  const {
    sensors,
    isLoading,
    allAlerts,
    refetchAll
  } = useMultipleSensors(
    equipmentId,
    ['temperature', 'pressure', 'vacuum'],
    {
      realtime: true,
      refetchInterval: 10000,
      onError: (error) => {
        toast.error(`Sensor error: ${error.message}`);
      }
    }
  );

  // Derived state from multiple sensors
  const systemStatus = useMemo(() => {
    const statuses = sensors.map(s => s.data?.status);

    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'normal';
  }, [sensors]);

  return (
    <div className="dashboard">
      <SystemStatus status={systemStatus} />
      <Button onClick={refetchAll}>Refresh All</Button>

      {sensors.map((sensor, i) => (
        <SensorCard key={i} sensor={sensor} />
      ))}

      {allAlerts.length > 0 && (
        <AlertFeed alerts={allAlerts} />
      )}
    </div>
  );
}

// Complex usage - conditional fetching with dependencies
function ProcessMonitor({ processId }) {
  const [equipment, setEquipment] = useState(null);

  // Fetch process details first
  const process = useQuery(
    async () => {
      const res = await fetch(`/api/processes/${processId}`);
      return res.json();
    },
    {
      onSuccess: (data) => setEquipment(data.equipmentId)
    }
  );

  // Conditional sensor monitoring based on process data
  const sensor = useTemperatureSensor(equipment, {
    enabled: !!equipment, // Only fetch if we have equipment ID
    threshold: process.data?.maxTemperature,
    realtime: process.data?.status === 'running'
  });

  return (
    <ProcessView
      process={process.data}
      sensor={sensor.data}
      isLoading={process.isLoading || sensor.isLoading}
    />
  );
}

```

**Key Design Decisions:**

1. **Composition over configuration**: Layer hooks for flexibility
2. **Separation of concerns**: Data fetching, transformation, and domain logic separate
3. **Type safety**: Could add TypeScript generics for stronger typing
4. **Performance**: Automatic abort, stale time, conditional fetching
5. **Error handling**: Retry logic, error boundaries, user feedback
6. **Testability**: Each layer can be tested independently with mock data

This pattern has scaled across 50+ different sensor types in my observability platform."

---

## 5. Error Boundaries and Graceful Degradation

**Question:** "Equipment monitoring is mission-critical. If one dashboard component fails, we can't let it crash the entire application. How would you implement comprehensive error handling and graceful degradation?"

**Detailed Answer:**

"For mission-critical applications, I implement a defense-in-depth error handling strategy with multiple layers of protection:

**Layer 1: Global Error Boundary**

```jsx
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1
    }));

    // Log to error tracking service
    errorTracker.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Root',
      userContext: {
        equipmentId: this.props.equipmentId,
        userId: getCurrentUserId(),
        timestamp: new Date().toISOString()
      }
    });

    // Alert on-call if critical component fails
    if (this.props.critical) {
      alertOnCall({
        severity: 'high',
        message: `Critical component ${this.props.name} failed`,
        error: error.message,
        stack: errorInfo.componentStack
      });
    }

    // Auto-recovery attempt
    if (this.props.autoRecover && this.state.errorCount < 3) {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 5000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });

    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI based on severity
      return this.props.fallback ? (
        this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset
        })
      ) : (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          critical={this.props.critical}
        />
      );
    }

    return this.props.children;
  }
}

// Enhanced fallback component
function ErrorFallback({ error, errorInfo, onReset, critical }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`error-fallback ${critical ? 'critical' : 'standard'}`}>
      <div className="error-icon">
        {critical ? <AlertTriangle size={48} /> : <AlertCircle size={48} />}
      </div>

      <h2>
        {critical ? 'Critical Component Error' : 'Something went wrong'}
      </h2>

      <p>{error?.message || 'An unexpected error occurred'}</p>

      <div className="error-actions">
        <Button onClick={onReset} variant="primary">
          Try Again
        </Button>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="secondary"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {showDetails && (
        <ErrorDetails error={error} errorInfo={errorInfo} />
      )}

      {critical && (
        <div className="critical-notice">
          <strong>This is a critical component.</strong>
          <p>Our team has been automatically notified.</p>
        </div>
      )}
    </div>
  );
}

```

**Layer 2: Component-Level Error Boundaries**

```jsx
// Wrap critical sections with granular error boundaries
function EquipmentDashboard({ equipmentId }) {
  return (
    <div className="dashboard">
      {/* Critical components get isolated error boundaries */}
      <ErrorBoundary
        name="RealTimeMonitor"
        critical={true}
        equipmentId={equipmentId}
        fallback={({ error, reset }) => (
          <CriticalComponentFallback
            title="Real-time Monitor Offline"
            error={error}
            onReset={reset}
          />
        )}
      >
        <RealTimeMonitor equipmentId={equipmentId} />
      </ErrorBoundary>

      {/* Non-critical components can gracefully degrade */}
      <ErrorBoundary
        name="HistoricalCharts"
        equipmentId={equipmentId}
        autoRecover={true}
        fallback={() => (
          <SkeletonLoader message="Loading historical data..." />
        )}
      >
        <HistoricalCharts equipmentId={equipmentId} />
      </ErrorBoundary>

      {/* Multiple isolated sections */}
      <ErrorBoundary name="AlertPanel" equipmentId={equipmentId}>
        <AlertPanel equipmentId={equipmentId} />
      </ErrorBoundary>

      <ErrorBoundary name="ControlPanel" equipmentId={equipmentId}>
        <ControlPanel equipmentId={equipmentId} />
      </ErrorBoundary>
    </div>
  );
}

```

**Layer 3: Try-Catch in Async Operations**

```jsx
// hooks/useSafeAsync.js
export function useSafeAsync(asyncFunction, dependencies) {
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: false
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await asyncFunction(...args);
      setState({ data, error: null, isLoading: false });
      return { data, error: null };

    } catch (error) {
      // Categorize errors
      const categorizedError = categorizeError(error);

      setState({
        data: null,
        error: categorizedError,
        isLoading: false
      });

      // Log non-user errors
      if (categorizedError.type !== 'user') {
        errorTracker.captureException(error, {
          category: categorizedError.type,
          recoverable: categorizedError.recoverable
        });
      }

      return { data: null, error: categorizedError };
    }
  }, dependencies);

  return { ...state, execute };
}

function categorizeError(error) {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect to server',
      recoverable: true,
      userMessage: 'Please check your internet connection'
    };
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;

    if (status >= 400 && status < 500) {
      return {
        type: 'user',
        message: error.response.data?.message || 'Invalid request',
        recoverable: false,
        userMessage: 'Please check your input and try again'
      };
    }

    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error',
        recoverable: true,
        userMessage: 'Something went wrong on our end. Please try again.'
      };
    }
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timed out',
      recoverable: true,
      userMessage: 'Request took too long. Please try again.'
    };
  }

  // Default
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    recoverable: false,
    userMessage: 'Something unexpected happened. Our team has been notified.'
  };
}

```

**Layer 4: Component-Level Safety**

```jsx
// Safe component wrapper for dangerous operations
function SafeComponent({ children, fallback = null }) {
  try {
    return children;
  } catch (error) {
    console.error('Render error:', error);
    return fallback;
  }
}

// Safe rendering helper
function useSafeRender(renderFn, fallback = null) {
  try {
    return renderFn();
  } catch (error) {
    console.error('Render error in useSafeRender:', error);
    return fallback;
  }
}

// Example usage in chart component
function TemperatureChart({ data }) {
  const chartContent = useSafeRender(
    () => {
      // Potentially dangerous chart rendering
      if (!data || data.length === 0) {
        throw new Error('No data available');
      }

      return <LineChart data={data} />;
    },
    <EmptyState message="No temperature data available" />
  );

  return (
    <div className="chart-container">
      <h3>Temperature Over Time</h3>
      {chartContent}
    </div>
  );
}

```

**Layer 5: Graceful Degradation Strategies**

```jsx
// Progressive enhancement for features
function AdvancedChart({ data, fallbackChart }) {
  const [useAdvanced, setUseAdvanced] = useState(true);

  // Feature detection
  const supportsWebGL = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      );
    } catch {
      return false;
    }
  }, []);

  // Fallback on error
  const handleChartError = useCallback(() => {
    setUseAdvanced(false);
    errorTracker.captureMessage('Advanced chart failed, falling back');
  }, []);

  if (!supportsWebGL || !useAdvanced) {
    return fallbackChart || <BasicChart data={data} />;
  }

  return (
    <ErrorBoundary
      onError={handleChartError}
      fallback={fallbackChart || <BasicChart data={data} />}
    >
      <AdvancedWebGLChart data={data} />
    </ErrorBoundary>
  );
}

// Data validation with fallbacks
function DataTable({ data }) {
  const validatedData = useMemo(() => {
    try {
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
      }

      return data.map((row, index) => {
        try {
          // Validate each row
          return validateRow(row);
        } catch (rowError) {
          console.warn(`Invalid row ${index}:`, rowError);
          return null; // Skip invalid rows
        }
      }).filter(Boolean);

    } catch (error) {
      console.error('Data validation failed:', error);
      return []; // Return empty array on complete failure
    }
  }, [data]);

  if (validatedData.length === 0) {
    return <EmptyState message="No valid data to display" />;
  }

  return (
    <table>
      {/* Render validated data */}
    </table>
  );
}

```

**Layer 6: Global Error Monitoring**

```jsx
// Initialize error tracking on app mount
function App() {
  useEffect(() => {
    // Global error handler
    window.addEventListener('error', (event) => {
      errorTracker.captureException(event.error, {
        type: 'unhandledError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorTracker.captureException(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise
      });

      // Prevent default browser console error
      event.preventDefault();
    });

    // Report app health metrics
    const healthCheck = setInterval(() => {
      reportHealth({
        memoryUsage: performance.memory?.usedJSHeapSize,
        errorRate: errorTracker.getErrorRate(),
        activeConnections: getActiveConnectionCount()
      });
    }, 60000); // Every minute

    return () => {
      clearInterval(healthCheck);
    };
  }, []);

  return (
    <ErrorBoundary
      name="Root"
      critical={true}
      fallback={() => <CriticalErrorPage />}
    >
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}

```

**Key Strategies:**

1. **Isolation**: Error boundaries prevent cascading failures
2. **Categorization**: Different error types get different handling
3. **User Communication**: Clear, actionable error messages
4. **Automatic Recovery**: Try to self-heal when possible
5. **Fallback UIs**: Always show something useful
6. **Telemetry**: Log everything for post-mortem analysis
7. **Progressive Enhancement**: Degrade gracefully when features fail

This multi-layer approach has maintained 99.9% uptime in production observability dashboards."

---

I'll continue with the remaining 10 questions. Would you like me to proceed with questions 6-15, covering topics like:

- Testing strategies for React components
- TypeScript integration
- Build optimization & bundle size
- Accessibility (a11y) implementation
- Form handling with validation
- CSS-in-JS vs traditional styling
- Component library architecture
- CI/CD for React applications
- Debugging techniques
- Migration strategies (class to functional components)

# React/Frontend Technical Interview Preparation (Continued)

## Questions 6-15

---

## 6. Comprehensive Testing Strategy

**Question:** "How would you implement a comprehensive testing strategy for a mission-critical equipment monitoring dashboard? Walk me through unit tests, integration tests, and E2E tests, including specific examples."

**Detailed Answer:**

"For mission-critical applications, I implement a testing pyramid with focus on reliability and maintainability:

**Testing Philosophy:**

- 70% Unit Tests (fast, isolated)
- 20% Integration Tests (component interactions)
- 10% E2E Tests (critical user flows)

**Layer 1: Unit Testing with Vitest/Jest + React Testing Library**

```jsx
// components/TemperatureDisplay.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemperatureDisplay } from './TemperatureDisplay';
import { useTemperatureSensor } from '@/hooks/useTemperatureSensor';

// Mock the custom hook
vi.mock('@/hooks/useTemperatureSensor');

describe('TemperatureDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state while fetching data', () => {
    useTemperatureSensor.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      alerts: []
    });

    render(<TemperatureDisplay equipmentId="eq-123" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('displays temperature data when loaded', () => {
    useTemperatureSensor.mockReturnValue({
      data: {
        value: 850,
        unit: 'celsius',
        status: 'normal',
        timestamp: '2026-01-07T10:00:00Z'
      },
      isLoading: false,
      error: null,
      alerts: []
    });

    render(<TemperatureDisplay equipmentId="eq-123" />);

    expect(screen.getByText('850°C')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Normal');
    expect(screen.getByTestId('status-badge')).toHaveClass('status-normal');
  });

  it('displays error state with retry option', async () => {
    const mockRefetch = vi.fn();
    useTemperatureSensor.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network connection failed'),
      alerts: [],
      refetch: mockRefetch
    });

    const user = userEvent.setup();
    render(<TemperatureDisplay equipmentId="eq-123" />);

    expect(screen.getByRole('alert')).toHaveTextContent(/network connection failed/i);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('displays alerts when threshold exceeded', () => {
    useTemperatureSensor.mockReturnValue({
      data: {
        value: 1050,
        unit: 'celsius',
        status: 'critical',
        timestamp: '2026-01-07T10:00:00Z'
      },
      isLoading: false,
      error: null,
      alerts: [
        {
          id: 1,
          timestamp: '2026-01-07T10:00:00Z',
          value: 1050,
          threshold: 1000,
          severity: 'high'
        }
      ]
    });

    render(<TemperatureDisplay equipmentId="eq-123" />);

    expect(screen.getByTestId('alert-panel')).toBeInTheDocument();
    expect(screen.getByText(/temperature exceeded threshold/i)).toBeInTheDocument();
    expect(screen.getByText('1050°C > 1000°C')).toBeInTheDocument();
  });

  it('updates display when real-time data changes', async () => {
    const { rerender } = render(<TemperatureDisplay equipmentId="eq-123" />);

    // Initial state
    useTemperatureSensor.mockReturnValue({
      data: { value: 800, unit: 'celsius', status: 'normal' },
      isLoading: false,
      error: null,
      alerts: []
    });

    rerender(<TemperatureDisplay equipmentId="eq-123" />);
    expect(screen.getByText('800°C')).toBeInTheDocument();

    // Simulate real-time update
    useTemperatureSensor.mockReturnValue({
      data: { value: 850, unit: 'celsius', status: 'warning' },
      isLoading: false,
      error: null,
      alerts: []
    });

    rerender(<TemperatureDisplay equipmentId="eq-123" />);

    await waitFor(() => {
      expect(screen.getByText('850°C')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent('Warning');
    });
  });
});

```

**Testing Custom Hooks:**

```jsx
// hooks/useTemperatureSensor.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTemperatureSensor } from './useTemperatureSensor';

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  static instances = [];
  static reset() {
    this.instances = [];
  }
}

global.WebSocket = MockWebSocket;

describe('useTemperatureSensor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches initial temperature data', async () => {
    const mockData = {
      value: 850,
      timestamp: '2026-01-07T10:00:00Z'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() =>
      useTemperatureSensor('eq-123', {
        unit: 'celsius',
        threshold: 1000
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      value: 850,
      unit: 'celsius',
      status: 'normal',
      timestamp: mockData.timestamp
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/equipment/eq-123/sensors/temperature',
      expect.any(Object)
    );
  });

  it('establishes WebSocket connection when realtime enabled', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 850 })
    });

    const { result } = renderHook(() =>
      useTemperatureSensor('eq-123', {
        realtime: true,
        threshold: 1000
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify WebSocket was created
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain('eq-123');
    expect(MockWebSocket.instances[0].url).toContain('temperature');
  });

  it('triggers alert when threshold exceeded', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 850 })
    });

    const { result } = renderHook(() =>
      useTemperatureSensor('eq-123', {
        realtime: true,
        threshold: 1000
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate WebSocket message with threshold exceeded
    const ws = MockWebSocket.instances[0];
    ws.onmessage({
      data: JSON.stringify({
        value: 1050,
        timestamp: '2026-01-07T10:05:00Z'
      })
    });

    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0]).toMatchObject({
        value: 1050,
        threshold: 1000,
        severity: 'high'
      });
    });
  });

  it('retries on fetch failure', async () => {
    // First two calls fail, third succeeds
    fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 850 })
      });

    const { result } = renderHook(() =>
      useTemperatureSensor('eq-123', {
        retry: 3,
        retryDelay: () => 100 // Fast retry for testing
      })
    );

    // Should eventually succeed after retries
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('cleans up WebSocket on unmount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 850 })
    });

    const { result, unmount } = renderHook(() =>
      useTemperatureSensor('eq-123', { realtime: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.closed).toBeUndefined();

    unmount();

    expect(ws.closed).toBe(true);
  });
});

```

**Layer 2: Integration Testing**

```jsx
// __tests__/integration/EquipmentDashboard.test.jsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentDashboard } from '@/pages/EquipmentDashboard';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Setup MSW (Mock Service Worker) for API mocking
describe('EquipmentDashboard Integration', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  function renderDashboard() {
    return render(
      <QueryClientProvider client={queryClient}>
        <EquipmentDashboard equipmentId="eq-123" />
      </QueryClientProvider>
    );
  }

  it('loads and displays multiple sensor data', async () => {
    renderDashboard();

    // Should show loading states initially
    expect(screen.getAllByLabelText(/loading/i)).toHaveLength(3);

    // Wait for all sensors to load
    await waitFor(() => {
      expect(screen.getByText('850°C')).toBeInTheDocument();
      expect(screen.getByText('101.3 kPa')).toBeInTheDocument();
      expect(screen.getByText('1.2e-6 Torr')).toBeInTheDocument();
    });
  });

  it('handles sensor threshold adjustment workflow', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('850°C')).toBeInTheDocument();
    });

    // Open settings panel
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Change temperature threshold
    const thresholdInput = screen.getByLabelText(/temperature threshold/i);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '900');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify API was called with new threshold
    await waitFor(() => {
      expect(screen.getByText(/threshold updated/i)).toBeInTheDocument();
    });

    // Verify threshold is reflected in UI
    expect(screen.getByText('900°C')).toBeInTheDocument();
  });

  it('displays alerts when multiple sensors exceed thresholds', async () => {
    // Mock API to return high values
    server.use(
      http.get('/api/equipment/eq-123/sensors/temperature', () => {
        return HttpResponse.json({
          value: 1050,
          timestamp: new Date().toISOString()
        });
      }),
      http.get('/api/equipment/eq-123/sensors/pressure', () => {
        return HttpResponse.json({
          value: 150000, // Exceeds normal range
          timestamp: new Date().toISOString()
        });
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('alert-panel')).toBeInTheDocument();
    });

    const alertPanel = screen.getByTestId('alert-panel');

    // Should show alerts for both sensors
    expect(within(alertPanel).getByText(/temperature exceeded/i)).toBeInTheDocument();
    expect(within(alertPanel).getByText(/pressure exceeded/i)).toBeInTheDocument();
  });

  it('handles real-time updates across multiple components', async () => {
    const { rerender } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('850°C')).toBeInTheDocument();
    });

    // Simulate WebSocket update
    const mockWsMessage = {
      type: 'SENSOR_UPDATE',
      data: {
        temperature: 875,
        pressure: 102000,
        timestamp: new Date().toISOString()
      }
    };

    // Trigger WebSocket message (via test utility)
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify(mockWsMessage)
      })
    );

    // All components should update
    await waitFor(() => {
      expect(screen.getByText('875°C')).toBeInTheDocument();
      expect(screen.getByText('102.0 kPa')).toBeInTheDocument();
    });
  });

  it('maintains state when switching between tabs', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('850°C')).toBeInTheDocument();
    });

    // Switch to historical view
    const historyTab = screen.getByRole('tab', { name: /history/i });
    await user.click(historyTab);

    await waitFor(() => {
      expect(screen.getByTestId('historical-chart')).toBeInTheDocument();
    });

    // Switch back to real-time view
    const realtimeTab = screen.getByRole('tab', { name: /real-time/i });
    await user.click(realtimeTab);

    // Data should still be present (not refetched)
    expect(screen.getByText('850°C')).toBeInTheDocument();
  });
});

```

**Layer 3: E2E Testing with Playwright**

```jsx
// e2e/equipment-monitoring.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Equipment Monitoring Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/equipment/eq-123');

    // Wait for initial load
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
  });

  test('monitors equipment in real-time and responds to alerts', async ({ page }) => {
    // Verify initial state
    await expect(page.locator('[data-testid="temperature-display"]'))
      .toContainText('850°C');

    // Verify status is normal
    await expect(page.locator('[data-testid="status-badge"]'))
      .toHaveClass(/status-normal/);

    // Simulate threshold breach via API
    await page.route('**/api/equipment/eq-123/sensors/temperature',
      route => route.fulfill({
        json: { value: 1050, timestamp: new Date().toISOString() }
      })
    );

    // Wait for alert to appear
    await expect(page.locator('[data-testid="alert-panel"]'))
      .toBeVisible({ timeout: 10000 });

    // Verify alert details
    const alert = page.locator('[data-testid="alert-item"]').first();
    await expect(alert).toContainText('Temperature exceeded threshold');
    await expect(alert).toContainText('1050°C');

    // Acknowledge alert
    await alert.locator('button', { hasText: 'Acknowledge' }).click();

    // Verify alert is marked as acknowledged
    await expect(alert).toHaveClass(/acknowledged/);
  });

  test('handles connection loss and recovery', async ({ page, context }) => {
    // Verify initial connection
    await expect(page.locator('[data-testid="connection-status"]'))
      .toContainText('Connected');

    // Simulate offline
    await context.setOffline(true);

    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]'))
      .toContainText('Disconnected', { timeout: 5000 });

    // Should show reconnecting indicator
    await expect(page.locator('[data-testid="reconnecting-banner"]'))
      .toBeVisible();

    // Restore connection
    await context.setOffline(false);

    // Should reconnect and sync data
    await expect(page.locator('[data-testid="connection-status"]'))
      .toContainText('Connected', { timeout: 10000 });

    // Data should be up to date
    await expect(page.locator('[data-testid="temperature-display"]'))
      .toContainText(/\d+°C/);
  });

  test('adjusts thresholds with immediate UI feedback', async ({ page }) => {
    // Open settings
    await page.click('[data-testid="settings-button"]');

    // Change temperature threshold
    const thresholdInput = page.locator('[data-testid="temperature-threshold-input"]');
    await thresholdInput.fill('900');

    // Save
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('[data-testid="toast-notification"]'))
      .toContainText('Settings saved successfully');

    // Verify new threshold is displayed
    await expect(page.locator('[data-testid="threshold-display"]'))
      .toContainText('900°C');
  });

  test('renders complex dashboard with 50+ charts without performance issues', async ({ page }) => {
    await page.goto('/equipment/eq-123/advanced-dashboard');

    // Measure performance
    const navigationTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(performance.timing))
    );

    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // All charts should render
    const chartCount = await page.locator('[data-testid="chart"]').count();
    expect(chartCount).toBeGreaterThanOrEqual(50);

    // Scrolling should be smooth (measure FPS)
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    const fpsResults = await page.evaluate(async () => {
      return new Promise(resolve => {
        let frames = 0;
        const startTime = performance.now();

        function countFrame() {
          frames++;
          const elapsed = performance.now() - startTime;

          if (elapsed < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames);
          }
        }

        // Scroll while measuring
        window.scrollBy(0, 1000);
        requestAnimationFrame(countFrame);
      });
    });

    // Should maintain at least 50 FPS while scrolling
    expect(fpsResults).toBeGreaterThan(50);
  });

  test('handles concurrent user actions without data loss', async ({ browser }) => {
    // Open two tabs simulating different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/equipment/eq-123');
    await page2.goto('/equipment/eq-123');

    // Wait for both to load
    await page1.waitForSelector('[data-testid="dashboard-loaded"]');
    await page2.waitForSelector('[data-testid="dashboard-loaded"]');

    // User 1 changes threshold
    await page1.click('[data-testid="settings-button"]');
    await page1.fill('[data-testid="temperature-threshold-input"]', '900');
    await page1.click('button:has-text("Save")');

    // User 2 should see the update
    await expect(page2.locator('[data-testid="threshold-display"]'))
      .toContainText('900°C', { timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});

```

**Test Utilities & Helpers:**

```jsx
// test-utils/renderWithProviders.jsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

export function renderWithProviders(ui, options = {}) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    initialRoute = '/',
    ...renderOptions
  } = options;

  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
}

// test-utils/mockWebSocket.js
export class MockWebSocketServer {
  constructor() {
    this.connections = new Map();
  }

  connect(url, client) {
    this.connections.set(url, client);
  }

  send(url, message) {
    const client = this.connections.get(url);
    if (client && client.onmessage) {
      client.onmessage({ data: JSON.stringify(message) });
    }
  }

  close(url) {
    const client = this.connections.get(url);
    if (client && client.onclose) {
      client.onclose();
    }
    this.connections.delete(url);
  }

  reset() {
    this.connections.clear();
  }
}

```

**Coverage Goals:**

- Unit tests: >80% coverage
- Integration tests: Critical user flows
- E2E tests: Happy paths and error scenarios
- Performance tests: Load time, FPS, memory usage

This comprehensive testing approach has caught 90% of bugs before production in my experience."

---

## 7. TypeScript Integration & Type Safety

**Question:** "We're considering adding TypeScript to improve code quality and catch errors early. How would you integrate TypeScript into our React codebase, and what patterns would you use for type safety with our equipment monitoring system?"

**Detailed Answer:**

"TypeScript is essential for mission-critical applications. Here's my systematic approach to integration:

**Phase 1: Project Setup & Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",

    /* Strict Type Checking */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    /* Additional Checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,

    /* Module Resolution */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/types/*": ["src/types/*"]
    },

    /* Emit */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",

    /* Interop */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    /* Type Checking Performance */
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}

```

**Phase 2: Domain Type Definitions**

```tsx
// types/equipment.ts
/**
 * Equipment domain types for semiconductor manufacturing
 */

// Base sensor data structure
export interface SensorReading<T = number> {
  value: T;
  unit: string;
  timestamp: string; // ISO 8601
  quality: 'good' | 'uncertain' | 'bad';
  metadata?: Record<string, unknown>;
}

// Equipment status
export type EquipmentStatus =
  | 'idle'
  | 'running'
  | 'maintenance'
  | 'error'
  | 'offline';

// Sensor types
export type SensorType =
  | 'temperature'
  | 'pressure'
  | 'vacuum'
  | 'flow_rate'
  | 'power'
  | 'vibration';

// Temperature-specific types
export interface TemperatureReading extends SensorReading<number> {
  unit: 'celsius' | 'fahrenheit' | 'kelvin';
  status: 'normal' | 'warning' | 'critical';
  threshold: number;
}

export interface TemperatureSensorConfig {
  equipmentId: string;
  sensorId: string;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: TemperatureReading['unit'];
}

// Pressure-specific types
export interface PressureReading extends SensorReading<number> {
  unit: 'pascal' | 'psi' | 'bar' | 'torr';
  range: {
    min: number;
    max: number;
  };
  inRange: boolean;
}

// Generic sensor data with discriminated unions
export type AnySensorReading =
  | ({ type: 'temperature' } & TemperatureReading)
  | ({ type: 'pressure' } & PressureReading)
  | ({ type: 'vacuum' } & SensorReading<number>);

// Equipment model
export interface Equipment {
  id: string;
  name: string;
  type: 'cvd' | 'etch' | 'lithography' | 'metrology';
  status: EquipmentStatus;
  location: {
    facility: string;
    room: string;
    position: string;
  };
  sensors: SensorConfiguration[];
  lastMaintenance: string;
  nextMaintenance: string;
  metadata: EquipmentMetadata;
}

export interface SensorConfiguration {
  id: string;
  type: SensorType;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface EquipmentMetadata {
  manufacturer: string;
  model: string;
  serialNumber: string;
  installDate: string;
  warrantyExpiry: string;
  specifications: Record<string, unknown>;
}

// Alert types
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  equipmentId: string;
  sensorId: string;
  type: SensorType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

```

**Phase 3: Hook Type Definitions**

```tsx
// types/hooks.ts
import { type AnySensorReading, type Alert, type ApiError } from './equipment';

/**
 * Query state for data fetching hooks
 */
export interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  fetchedAt: number | null;
}

/**
 * Query options for data fetching
 */
export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  retry?: number | boolean;
  retryDelay?: (attemptIndex: number) => number;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Sensor hook options
 */
export interface SensorHookOptions extends QueryOptions {
  realtime?: boolean;
  transform?: (data: unknown) => unknown;
  threshold?: number;
}

/**
 * Temperature sensor hook return type
 */
export interface UseTemperatureSensorReturn extends QueryState<TemperatureReading> {
  alerts: Alert[];
  clearAlerts: () => void;
  isRealtime: boolean;
  refetch: () => Promise<void>;
}

/**
 * WebSocket connection state
 */
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

export interface WebSocketState {
  state: ConnectionState;
  lastConnected: number | null;
  reconnectAttempts: number;
}

```

**Phase 4: Typed Custom Hooks**

```tsx
// hooks/useTemperatureSensor.ts
import { useState, useEffect, useCallback } from 'react';
import type {
  TemperatureReading,
  Alert,
  ApiError,
  SensorHookOptions,
  UseTemperatureSensorReturn
} from '@/types';

export function useTemperatureSensor(
  equipmentId: string,
  options: SensorHookOptions = {}
): UseTemperatureSensorReturn {
  const {
    realtime = false,
    threshold,
    transform,
    enabled = true,
    retry = 3,
    ...queryOptions
  } = options;

  const [state, setState] = useState<QueryState<TemperatureReading>>({
    data: null,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
    isFetching: false,
    fetchedAt: null
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isFetching: true }));

    try {
      const response = await fetch(
        `/api/equipment/${equipmentId}/sensors/temperature`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      let data: TemperatureReading = json.data;

      // Apply transform if provided
      if (transform) {
        data = transform(data) as TemperatureReading;
      }

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        fetchedAt: Date.now()
      });

      // Check threshold
      if (threshold && data.value > threshold) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          equipmentId,
          sensorId: 'temp-001',
          type: 'temperature',
          severity: 'high',
          message: `Temperature ${data.value}°C exceeded threshold ${threshold}°C`,
          value: data.value,
          threshold,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        setAlerts(prev => [...prev, alert]);
      }
    } catch (err) {
      const error: ApiError = {
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500
      };

      setState(prev => ({
        ...prev,
        error,
        isLoading: false,
        isError: true,
        isFetching: false
      }));
    }
  }, [equipmentId, enabled, threshold, transform]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!realtime || !state.isSuccess) return;

    const ws = new WebSocket(
      `wss://equipment-api/${equipmentId}/sensors/temperature/stream`
    );

    ws.onopen = () => {
      setIsRealtime(true);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const data: TemperatureReading = JSON.parse(event.data);

      setState(prev => ({
        ...prev,
        data: transform ? (transform(data) as TemperatureReading) : data,
        fetchedAt: Date.now()
      }));

      // Check threshold
      if (threshold && data.value > threshold) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          equipmentId,
          sensorId: 'temp-001',
          type: 'temperature',
          severity: 'high',
          message: `Temperature ${data.value}°C exceeded threshold ${threshold}°C`,
          value: data.value,
          threshold,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        setAlerts(prev => [...prev, alert]);
      }
    };

    ws.onerror = () => {
      setIsRealtime(false);
    };

    ws.onclose = () => {
      setIsRealtime(false);
    };

    return () => {
      ws.close();
    };
  }, [realtime, state.isSuccess, equipmentId, threshold, transform]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    ...state,
    alerts,
    clearAlerts,
    isRealtime,
    refetch
  };
}

```

**Phase 5: Typed Components**

```tsx
// components/TemperatureDisplay.tsx
import React from 'react';
import type { TemperatureReading, Alert } from '@/types';
import { useTemperatureSensor } from '@/hooks/useTemperatureSensor';

interface TemperatureDisplayProps {
  equipmentId: string;
  unit?: 'celsius' | 'fahrenheit';
  threshold?: number;
  realtime?: boolean;
  className?: string;
  onAlertClick?: (alert: Alert) => void;
}

export const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({
  equipmentId,
  unit = 'celsius',
  threshold = 1000,
  realtime = false,
  className = '',
  onAlertClick
}) => {
  const { data, isLoading, error, alerts, clearAlerts, isRealtime } =
    useTemperatureSensor(equipmentId, {
      realtime,
      threshold,
      transform: (rawData): TemperatureReading => {
        const data = rawData as TemperatureReading;

        // Convert units if needed
        const value = unit === 'fahrenheit'
          ? (data.value * 9 / 5) + 32
          : data.value;

        return {
          ...data,
          value,
          unit,
          status: getStatus(value, threshold)
        };
      }
    });

  if (isLoading) {
    return (
      <div className={`temperature-display loading ${className}`}>
        <div className="spinner" role="status" aria-label="Loading temperature data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`temperature-display error ${className}`} role="alert">
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`temperature-display ${className}`}>
      <div className="display-header">
        <h3>Temperature</h3>
        {isRealtime && <LiveIndicator />}
      </div>

      <div className="temperature-value">
        <span className="value">{data.value.toFixed(1)}</span>
        <span className="unit">°{data.unit === 'celsius' ? 'C' : 'F'}</span>
      </div>

      <StatusBadge
        status={data.status}
        data-testid="status-badge"
      />

      {alerts.length > 0 && (
        <AlertPanel
          alerts={alerts}
          onClear={clearAlerts}
          onAlertClick={onAlertClick}
          data-testid="alert-panel"
        />
      )}
    </div>
  );
};

function getStatus(
  value: number,
  threshold: number
): 'normal' | 'warning' | 'critical' {
  const percentage = (value / threshold) * 100;

  if (percentage < 70) return 'normal';
  if (percentage < 90) return 'warning';
  return 'critical';
}

// Type-safe status badge component
interface StatusBadgeProps {
  status: 'normal' | 'warning' | 'critical';
  'data-testid'?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, 'data-testid': testId }) => {
  const statusConfig: Record<StatusBadgeProps['status'], { label: string; className: string }> = {
    normal: { label: 'Normal', className: 'status-normal' },
    warning: { label: 'Warning', className: 'status-warning' },
    critical: { label: 'Critical', className: 'status-critical' }
  };

  const config = statusConfig[status];

  return (
    <div
      className={`status-badge ${config.className}`}
      data-testid={testId}
    >
      {config.label}
    </div>
  );
};

// Type-safe alert panel
interface AlertPanelProps {
  alerts: Alert[];
  onClear: () => void;
  onAlertClick?: (alert: Alert) => void;
  'data-testid'?: string;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onClear,
  onAlertClick,
  'data-testid': testId
}) => {
  return (
    <div className="alert-panel" data-testid={testId}>
      <div className="alert-header">
        <h4>Alerts ({alerts.length})</h4>
        <button onClick={onClear}>Clear All</button>
      </div>

      <ul className="alert-list">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`alert-item severity-${alert.severity}`}
            onClick={() => onAlertClick?.(alert)}
            data-testid="alert-item"
          >
            <div className="alert-message">{alert.message}</div>
            <div className="alert-details">
              {alert.value}°C &gt; {alert.threshold}°C
            </div>
            <time className="alert-time">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
};

const LiveIndicator: React.FC = () => (
  <div className="live-indicator">
    <span className="pulse" />
    <span>Live</span>
  </div>
);

```

**Phase 6: Generic Type Utilities**

```tsx
// types/utils.ts

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract return type from async function
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

/**
 * Branded types for IDs to prevent mixing
 */
export type Brand<T, TBrand extends string> = T & { __brand: TBrand };

export type EquipmentId = Brand<string, 'EquipmentId'>;
export type SensorId = Brand<string, 'SensorId'>;
export type AlertId = Brand<string, 'AlertId'>;

// Usage examples:
// const equipmentId: EquipmentId = 'eq-123' as EquipmentId;
// const sensorId: SensorId = 'sensor-456' as SensorId;
// This prevents accidentally passing a sensorId where equipmentId is expected

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys of type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Example: Get all string keys from a type
// type StringKeys = KeysOfType<Equipment, string>;

/**
 * Strict Omit that errors on non-existent keys
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

```

**Phase 7: Runtime Type Validation with Zod**

```tsx
// schemas/equipment.schema.ts
import { z } from 'zod';

export const SensorReadingSchema = z.object({
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  quality: z.enum(['good', 'uncertain', 'bad']),
  metadata: z.record(z.unknown()).optional()
});

export const TemperatureReadingSchema = SensorReadingSchema.extend({
  unit: z.enum(['celsius', 'fahrenheit', 'kelvin']),
  status: z.enum(['normal', 'warning', 'critical']),
  threshold: z.number()
});

export const EquipmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['cvd', 'etch', 'lithography', 'metrology']),
  status: z.enum(['idle', 'running', 'maintenance', 'error', 'offline']),
  location: z.object({
    facility: z.string(),
    room: z.string(),
    position: z.string()
  }),
  sensors: z.array(z.object({
    id: z.string(),
    type: z.string(),
    enabled: z.boolean(),
    config: z.record(z.unknown())
  })),
  lastMaintenance: z.string().datetime(),
  nextMaintenance: z.string().datetime(),
  metadata: z.record(z.unknown())
});

// Type inference from schema
export type ValidatedEquipment = z.infer<typeof EquipmentSchema>;

// Usage in API calls
async function fetchEquipment(id: string): Promise<ValidatedEquipment> {
  const response = await fetch(`/api/equipment/${id}`);
  const json = await response.json();

  // Runtime validation with automatic type narrowing
  return EquipmentSchema.parse(json.data);
}

```

**Benefits of This Approach:**

1. **Type Safety**: Catch errors at compile time
2. **IntelliSense**: Better developer experience
3. **Refactoring**: Safe large-scale changes
4. **Documentation**: Types serve as documentation
5. **Runtime Validation**: Zod ensures API data matches types
6. **Branded Types**: Prevent ID mixing bugs

This TypeScript strategy has eliminated entire categories of bugs in my production code."

---

## 8. Build Optimization & Bundle Size Management

**Question:** "Our dashboard is becoming slow to load. How would you analyze and optimize our bundle size, implement code splitting, and improve initial load performance?"

**Detailed Answer:**

"Bundle optimization is critical for production performance. Here's my comprehensive approach:

**Phase 1: Analysis & Profiling**

```bash
# Install bundle analyzer
npm install --save-dev @bundle-analyzer/webpack-plugin

# Add to vite.config.ts or webpack config

```

```tsx
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'bundle-analysis.html'
    })
  ],

  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },

    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // All other vendor code
            return 'vendor';
          }

          // Feature-based chunks
          if (id.includes('/features/monitoring/')) {
            return 'monitoring';
          }
          if (id.includes('/features/analytics/')) {
            return 'analytics';
          }
          if (id.includes('/features/alerts/')) {
            return 'alerts';
          }
        },

        // Consistent chunk naming
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },

    // Set chunk size warning limit
    chunkSizeWarningLimit: 600,

    // Source maps for production debugging (optional)
    sourcemap: true
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query'
    ],
    exclude: [
      // Don't pre-bundle large optional deps
      '@tensorflow/tfjs'
    ]
  }
});

```

**Phase 2: Lazy Loading & Code Splitting**

```tsx
// router/index.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';

// Eager load critical routes
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';

// Lazy load non-critical routes
const EquipmentDashboard = lazy(() =>
  import('@/pages/EquipmentDashboard').then(module => ({
    default: module.EquipmentDashboard
  }))
);

const HistoricalAnalytics = lazy(() =>
  import('@/pages/HistoricalAnalytics')
);

const AlertManagement = lazy(() =>
  import('@/pages/AlertManagement')
);

const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage')
);

// Preload route on hover for perceived performance
function PreloadLink({ to, children }: { to: string; children: React.ReactNode }) {
  const handleMouseEnter = () => {
    // Map route to lazy component
    const preloadMap: Record<string, () => Promise<any>> = {
      '/equipment': () => import('@/pages/EquipmentDashboard'),
      '/analytics': () => import('@/pages/HistoricalAnalytics'),
      '/alerts': () => import('@/pages/AlertManagement'),
      '/settings': () => import('@/pages/SettingsPage')
    };

    preloadMap[to]?.();
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'equipment/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EquipmentDashboard />
          </Suspense>
        )
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HistoricalAnalytics />
          </Suspense>
        )
      },
      {
        path: 'alerts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AlertManagement />
          </Suspense>
        )
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        )
      }
    ]
  }
]);

```

**Phase 3: Component-Level Code Splitting**

```tsx
// Lazy load heavy components within pages
import { lazy, Suspense, useState } from 'react';

const HeavyChart = lazy(() => import('@/components/charts/AdvancedChart'));
const DataTable = lazy(() => import('@/components/DataTable'));
const ExportModal = lazy(() => import('@/components/ExportModal'));

export function EquipmentDashboard() {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="dashboard">
      <DashboardHeader />

      {/* Real-time data - eagerly loaded */}
      <RealTimeMonitor />

      {/* Heavy chart - lazy loaded */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={chartData} />
      </Suspense>

      {/* Large table - lazy loaded */}
      <Suspense fallback={<TableSkeleton />}>
        <DataTable data={tableData} />
      </Suspense>

      {/* Modal - only loaded when needed */}
      {showExportModal && (
        <Suspense fallback={<ModalSkeleton />}>
          <ExportModal onClose={() => setShowExportModal(false)} />
        </Suspense>
      )}
    </div>
  );
}

```

**Phase 4: Library Optimization**

```tsx
// Bad: Imports entire library (200kb+)
import _ from 'lodash';
const result = _.debounce(fn, 300);

// Good: Import only what you need (5kb)
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// Or use tree-shakeable alternative
import { debounce } from 'lodash-es';

// Replace moment.js (67kb) with date-fns (tree-shakeable)
// Bad:
import moment from 'moment';
moment(date).format('YYYY-MM-DD');

// Good:
import { format } from 'date-fns';
format(date, 'yyyy-MM-dd');

// For icons, use selective imports
// Bad: Imports all icons (500kb+)
import * as Icons from 'lucide-react';

// Good: Import only needed icons (1-2kb each)
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

```

**Phase 5: Dynamic Imports for Features**

```tsx
// Conditionally load features
async function loadAdvancedFeatures() {
  if (userHasAccess('advanced-analytics')) {
    const { AdvancedAnalytics } = await import('@/features/advanced-analytics');
    return AdvancedAnalytics;
  }
  return null;
}

// Load only when needed
function FeatureGate({ children }) {
  const [Feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvancedFeatures().then(component => {
      setFeature(() => component);
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton />;
  if (!Feature) return children; // Fallback to basic features

  return <Feature />;
}

```

**Phase 6: Asset Optimization**

```tsx
// vite.config.ts - Image optimization
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 85 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      }
    })
  ]
});

// Component-level image optimization
function OptimizedImage({ src, alt, ...props }) {
  return (
    <picture>
      {/* WebP for modern browsers */}
      <source srcSet={`${src}.webp`} type="image/webp" />

      {/* Fallback to original */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
}

```

**Phase 7: Performance Monitoring**

```tsx
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private constructor() {
    this.setupObservers();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  private setupObservers() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime
            });

            // Send to analytics
            analytics.track('long_task', {
              duration: entry.duration,
              url: window.location.pathname
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }

        if (cls > 0.1) {
          console.warn('High CLS detected:', cls);
          analytics.track('high_cls', { cls });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Track bundle load times
  trackBundleLoad(bundleName: string) {
    performance.mark(`${bundleName}-load-start`);

    return () => {
      performance.mark(`${bundleName}-load-end`);
      performance.measure(
        `${bundleName}-load`,
        `${bundleName}-load-start`,
        `${bundleName}-load-end`
      );

      const measure = performance.getEntriesByName(`${bundleName}-load`)[0];

      if (measure.duration > 1000) {
        console.warn(`Slow bundle load: ${bundleName} (${measure.duration}ms)`);
        analytics.track('slow_bundle_load', {
          bundle: bundleName,
          duration: measure.duration
        });
      }
    };
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return {
      lcp: this.getLCP(),
      fid: this.getFID(),
      cls: this.getCLS()
    };
  }

  private getLCP() {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve((lastEntry as any).renderTime || (lastEntry as any).loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }

  private getFID() {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        resolve((firstInput as any).processingStart - firstInput.startTime);
      }).observe({ entryTypes: ['first-input'] });
    });
  }

  private getCLS() {
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });

    return cls;
  }
}

// Usage in app
const perfMonitor = PerformanceMonitor.getInstance();

```

**Phase 8: Webpack Bundle Analyzer Alternative**

```bash
# Analyze bundle with source-map-explorer
npm install --save-dev source-map-explorer

# Add to package.json
"scripts": {
  "analyze": "source-map-explorer 'dist/assets/*.js'"
}

# Run analysis
npm run build
npm run analyze

```

**Results & Metrics:**

**Before Optimization:**

- Initial bundle: 2.5MB
- FCP: 3.2s
- LCP: 4.8s
- TTI: 5.5s

**After Optimization:**

- Initial bundle: 350KB (86% reduction)
- FCP: 0.8s (75% improvement)
- LCP: 1.2s (75% improvement)
- TTI: 1.8s (67% improvement)

**Key Strategies:**

1. Route-based code splitting
2. Component-level lazy loading
3. Tree-shaking unused code
4. Selective library imports
5. Asset optimization
6. Performance monitoring

This approach reduced load times by 75% in my observability platform."

---

# React/Frontend Technical Interview Preparation (Continued)

## Questions 9-15

---

## 9. Accessibility (a11y) Implementation

**Question:** "Equipment operators may have various accessibility needs. How would you ensure our monitoring dashboard is fully accessible, and what specific considerations would you make for screen readers, keyboard navigation, and WCAG compliance?"

**Detailed Answer:**

"Accessibility is critical for mission-critical applications. Here's my comprehensive approach:

**Phase 1: Semantic HTML & ARIA Implementation**

```tsx
// components/TemperatureMonitor.tsx
import { useEffect, useRef, useState } from 'react';
import { useTemperatureSensor } from '@/hooks/useTemperatureSensor';

export function TemperatureMonitor({ equipmentId }: { equipmentId: string }) {
  const { data, isLoading, error, alerts } = useTemperatureSensor(equipmentId, {
    realtime: true,
    threshold: 1000
  });

  const previousStatus = useRef(data?.status);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce status changes to screen readers
  useEffect(() => {
    if (data && previousStatus.current !== data.status) {
      const announcement = `Temperature status changed to ${data.status}. Current temperature: ${data.value} degrees ${data.unit}`;

      // Update live region
      if (announcementRef.current) {
        announcementRef.current.textContent = announcement;
      }

      previousStatus.current = data.status;
    }
  }, [data]);

  if (isLoading) {
    return (
      <div
        className="temperature-monitor"
        role="status"
        aria-live="polite"
        aria-label="Loading temperature data"
      >
        <div className="spinner" aria-hidden="true" />
        <span className="sr-only">Loading temperature data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="temperature-monitor error"
        role="alert"
        aria-live="assertive"
      >
        <svg aria-hidden="true" className="error-icon">
          <use href="#icon-error" />
        </svg>
        <p>
          <strong>Error loading temperature data:</strong> {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
          <span className="sr-only"> loading temperature data</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  const statusLabel = getStatusLabel(data.status);

  return (
    <section
      className="temperature-monitor"
      aria-labelledby="temp-heading"
    >
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <header>
        <h2 id="temp-heading">Temperature Monitor</h2>
        {data.timestamp && (
          <time
            dateTime={data.timestamp}
            aria-label={`Last updated ${new Date(data.timestamp).toLocaleString()}`}
          >
            {new Date(data.timestamp).toLocaleTimeString()}
          </time>
        )}
      </header>

      {/* Main temperature display */}
      <div
        className="temperature-display"
        role="img"
        aria-label={`Current temperature: ${data.value} degrees ${data.unit}. Status: ${statusLabel}`}
      >
        <span className="value" aria-hidden="true">
          {data.value.toFixed(1)}
        </span>
        <span className="unit" aria-hidden="true">
          °{data.unit === 'celsius' ? 'C' : 'F'}
        </span>

        {/* Status indicator */}
        <div
          className={`status-badge status-${data.status}`}
          role="status"
          aria-label={statusLabel}
        >
          <span aria-hidden="true">{data.status}</span>
        </div>
      </div>

      {/* Threshold information */}
      <div className="threshold-info">
        <progress
          value={data.value}
          max={data.threshold}
          aria-label={`Temperature is ${((data.value / data.threshold) * 100).toFixed(0)}% of threshold`}
        >
          {data.value} / {data.threshold}
        </progress>
        <p className="threshold-text">
          Threshold: <data value={data.threshold}>{data.threshold}°{data.unit === 'celsius' ? 'C' : 'F'}</data>
        </p>
      </div>

      {/* Alert section */}
      {alerts.length > 0 && (
        <div
          className="alerts-section"
          role="region"
          aria-labelledby="alerts-heading"
          aria-live="polite"
        >
          <h3 id="alerts-heading">
            Active Alerts <span className="badge">{alerts.length}</span>
          </h3>
          <ul>
            {alerts.map((alert) => (
              <li key={alert.id} role="alert">
                <AlertItem alert={alert} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    normal: 'Normal - Temperature within safe range',
    warning: 'Warning - Temperature approaching threshold',
    critical: 'Critical - Temperature has exceeded threshold'
  };
  return labels[status] || status;
}

// Screen reader only text helper
// styles/accessibility.css
/*
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
*/

```

**Phase 2: Keyboard Navigation**

```tsx
// components/EquipmentDashboard.tsx
import { useState, useRef, useEffect, KeyboardEvent } from 'react';

export function EquipmentDashboard() {
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Skip to main content link
  const skipToMainContent = () => {
    const mainContent = document.getElementById('main-content');
    mainContent?.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Alt + 1-9 to jump to sections
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const sections = dashboardRef.current?.querySelectorAll('[data-section]');
        const section = sections?.[sectionIndex] as HTMLElement;
        section?.focus();
      }

      // Escape to close modals/menus
      if (e.key === 'Escape') {
        // Handle modal close
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          e.preventDefault();
          // Trigger close handler
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard as any);
    return () => window.removeEventListener('keydown', handleKeyboard as any);
  }, []);

  return (
    <>
      {/* Skip link for keyboard users */}

        href="#main-content"
        className="skip-link sr-only-focusable"
        onClick={(e) => {
          e.preventDefault();
          skipToMainContent();
        }}
      >
        Skip to main content
      </a>

      <div ref={dashboardRef} className="dashboard">
        {/* Keyboard shortcuts help */}
        <aside
          className="keyboard-shortcuts"
          role="complementary"
          aria-label="Keyboard shortcuts"
        >
          <button
            type="button"
            aria-label="Show keyboard shortcuts"
            aria-expanded={false}
          >
            <kbd>?</kbd> Shortcuts
          </button>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Equipment monitoring dashboard"
        >
          <FocusableSection
            id="realtime-monitor"
            title="Real-time Monitor"
            shortcut="1"
          >
            <TemperatureMonitor equipmentId="eq-123" />
          </FocusableSection>

          <FocusableSection
            id="historical-charts"
            title="Historical Data"
            shortcut="2"
          >
            <HistoricalCharts equipmentId="eq-123" />
          </FocusableSection>

          <FocusableSection
            id="alerts"
            title="Alerts"
            shortcut="3"
          >
            <AlertPanel equipmentId="eq-123" />
          </FocusableSection>
        </main>
      </div>
    </>
  );
}

interface FocusableSectionProps {
  id: string;
  title: string;
  shortcut?: string;
  children: React.ReactNode;
}

function FocusableSection({ id, title, shortcut, children }: FocusableSectionProps) {
  return (
    <section
      id={id}
      data-section
      tabIndex={-1}
      aria-labelledby={`${id}-heading`}
      className="focusable-section"
    >
      <h2 id={`${id}-heading`}>
        {title}
        {shortcut && (
          <span className="shortcut-hint" aria-label={`Keyboard shortcut: Alt + ${shortcut}`}>
            <kbd aria-hidden="true">Alt + {shortcut}</kbd>
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

```

**Phase 3: Focus Management**

```tsx
// hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      }
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// Usage in Modal component
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useFocusTrap(isOpen);

  return (
    <div
      ref={modalRef as any}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={isOpen ? 'modal open' : 'modal'}
    >
      <div className="modal-content">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="close-button"
        >
          <span aria-hidden="true">×</span>
        </button>
        {children}
      </div>
    </div>
  );
}

```

**Phase 4: Accessible Forms**

```tsx
// components/EquipmentSettingsForm.tsx
import { useState } from 'react';
import { useId } from 'react';

interface FormErrors {
  threshold?: string;
  email?: string;
}

export function EquipmentSettingsForm() {
  const [formData, setFormData] = useState({
    threshold: 1000,
    email: '',
    notifications: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Generate unique IDs for form fields
  const thresholdId = useId();
  const emailId = useId();
  const notificationsId = useId();
  const errorSummaryId = useId();

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'threshold':
        if (value < 0) return 'Threshold must be positive';
        if (value > 2000) return 'Threshold cannot exceed 2000°C';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
    }
    return undefined;
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate if field has been touched
    if (touched.has(name)) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => new Set(prev).add(name));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Focus first error field
      const firstErrorField = document.getElementById(
        Object.keys(newErrors)[0] === 'threshold' ? thresholdId : emailId
      );
      firstErrorField?.focus();

      return;
    }

    // Submit form
    console.log('Form submitted:', formData);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby={hasErrors ? errorSummaryId : undefined}
      noValidate
    >
      <h2>Equipment Settings</h2>

      {/* Error summary for screen readers */}
      {hasErrors && (
        <div
          id={errorSummaryId}
          role="alert"
          aria-live="polite"
          className="error-summary"
        >
          <h3>There are {Object.keys(errors).length} errors in the form:</h3>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a href={`#${field === 'threshold' ? thresholdId : emailId}`}>
                  {error}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Threshold field */}
      <div className="form-group">
        <label htmlFor={thresholdId}>
          Temperature Threshold
          <span aria-label="required">*</span>
        </label>
        <input
          id={thresholdId}
          type="number"
          value={formData.threshold}
          onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
          onBlur={() => handleBlur('threshold')}
          aria-invalid={!!errors.threshold}
          aria-describedby={errors.threshold ? `${thresholdId}-error` : `${thresholdId}-hint`}
          aria-required="true"
          min="0"
          max="2000"
          step="10"
        />
        <span id={`${thresholdId}-hint`} className="hint">
          Enter threshold between 0 and 2000°C
        </span>
        {errors.threshold && (
          <span
            id={`${thresholdId}-error`}
            role="alert"
            className="error-message"
          >
            {errors.threshold}
          </span>
        )}
      </div>

      {/* Email field */}
      <div className="form-group">
        <label htmlFor={emailId}>
          Notification Email
        </label>
        <input
          id={emailId}
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          autoComplete="email"
        />
        {errors.email && (
          <span
            id={`${emailId}-error`}
            role="alert"
            className="error-message"
          >
            {errors.email}
          </span>
        )}
      </div>

      {/* Checkbox */}
      <div className="form-group">
        <label>
          <input
            id={notificationsId}
            type="checkbox"
            checked={formData.notifications}
            onChange={(e) => handleChange('notifications', e.target.checked)}
            aria-describedby={`${notificationsId}-description`}
          />
          Enable email notifications
        </label>
        <span id={`${notificationsId}-description`} className="hint">
          Receive alerts when threshold is exceeded
        </span>
      </div>

      {/* Submit button */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={hasErrors}
          aria-disabled={hasErrors}
        >
          Save Settings
        </button>
        <button
          type="button"
          onClick={() => setFormData({ threshold: 1000, email: '', notifications: true })}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

```

**Phase 5: Accessible Data Visualizations**

```tsx
// components/AccessibleChart.tsx
import { useMemo } from 'react';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface AccessibleChartProps {
  data: DataPoint[];
  title: string;
  unit: string;
}

export function AccessibleChart({ data, title, unit }: AccessibleChartProps) {
  const stats = useMemo(() => {
    const values = data.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1]
    };
  }, [data]);

  return (
    <figure
      role="img"
      aria-labelledby="chart-title"
      aria-describedby="chart-summary"
    >
      <figcaption id="chart-title">{title}</figcaption>

      {/* Textual description for screen readers */}
      <div id="chart-summary" className="sr-only">
        Temperature chart showing data from {new Date(data[0].timestamp).toLocaleString()}
        to {new Date(data[data.length - 1].timestamp).toLocaleString()}.
        Current temperature is {stats.latest.toFixed(1)} {unit}.
        Average: {stats.avg.toFixed(1)} {unit}.
        Range: {stats.min.toFixed(1)} to {stats.max.toFixed(1)} {unit}.
      </div>

      {/* Visual chart */}
      <div className="chart-visual" aria-hidden="true">
        <LineChart data={data} />
      </div>

      {/* Data table alternative for screen readers */}
      <details className="chart-data-table">
        <summary>View data table</summary>
        <table>
          <caption>{title} - Detailed Data</caption>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Temperature ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, i) => (
              <tr key={i}>
                <td>{new Date(point.timestamp).toLocaleString()}</td>
                <td>{point.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Average</th>
              <td>{stats.avg.toFixed(2)}</td>
            </tr>
            <tr>
              <th scope="row">Minimum</th>
              <td>{stats.min.toFixed(2)}</td>
            </tr>
            <tr>
              <th scope="row">Maximum</th>
              <td>{stats.max.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </details>
    </figure>
  );
}

```

**Phase 6: Color Contrast & Visual Accessibility**

```css
/* styles/accessibility.css */

/* WCAG AA: 4.5:1 for normal text, 3:1 for large text */
:root {
  /* Color system with accessible contrasts */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #4a4a4a;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;

  /* Status colors with sufficient contrast */
  --color-status-normal: #22c55e;
  --color-status-normal-bg: #f0fdf4;
  --color-status-warning: #f59e0b;
  --color-status-warning-bg: #fffbeb;
  --color-status-critical: #ef4444;
  --color-status-critical-bg: #fef2f2;

  /* Focus indicator */
  --color-focus: #2563eb;
  --focus-ring-width: 3px;
}

/* High contrast focus indicators */
*:focus {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: 2px;
}

/* Remove outline for mouse users, keep for keyboard */
*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: 2px;
}

/* Ensure text has sufficient contrast */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-normal {
  background: var(--color-status-normal-bg);
  color: #15803d; /* Dark green for contrast */
  border: 1px solid var(--color-status-normal);
}

.status-warning {
  background: var(--color-status-warning-bg);
  color: #92400e; /* Dark orange for contrast */
  border: 1px solid var(--color-status-warning);
}

.status-critical {
  background: var(--color-status-critical-bg);
  color: #991b1b; /* Dark red for contrast */
  border: 1px solid var(--color-status-critical);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-text-primary: #000000;
    --color-bg-primary: #ffffff;
    --focus-ring-width: 4px;
  }

  .status-badge {
    border-width: 2px;
  }
}

/* Dark mode with accessible colors */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f5f5f5;
    --color-text-secondary: #d4d4d4;
    --color-bg-primary: #1a1a1a;
    --color-bg-secondary: #2a2a2a;
  }
}

```

**Phase 7: Testing Accessibility**

```tsx
// __tests__/accessibility/TemperatureMonitor.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TemperatureMonitor } from '@/components/TemperatureMonitor';

expect.extend(toHaveNoViolations);

describe('TemperatureMonitor Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <TemperatureMonitor equipmentId="eq-123" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper heading hierarchy', () => {
    const { container } = render(
      <TemperatureMonitor equipmentId="eq-123" />
    );

    const h2 = container.querySelector('h2');
    const h3 = container.querySelector('h3');

    expect(h2).toBeInTheDocument();
    if (h3) {
      // h3 should come after h2
      expect(h2?.compareDocumentPosition(h3)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    }
  });

  it('all images have alt text', () => {
    const { container } = render(
      <TemperatureMonitor equipmentId="eq-123" />
    );

    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  });

  it('form inputs have labels', () => {
    const { container } = render(
      <EquipmentSettingsForm />
    );

    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeInTheDocument();
      }
    });
  });
});

```

**Key WCAG 2.1 AA Compliance Checklist:**

✅ **Perceivable:**

- Text alternatives for non-text content
- Captions for audio/video
- Content can be presented in different ways
- Color is not the only visual means of conveying information
- Sufficient contrast ratios (4.5:1 for normal text, 3:1 for large)

✅ **Operable:**

- All functionality available via keyboard
- No keyboard traps
- Sufficient time to read content
- No content that causes seizures
- Clear navigation and focus indicators

✅ **Understandable:**

- Text is readable (language attribute set)
- Content appears and operates predictably
- Users are helped to avoid and correct mistakes
- Clear error messages with suggestions

✅ **Robust:**

- Compatible with assistive technologies
- Valid HTML with proper ARIA attributes
- Status messages programmatically determined

This comprehensive approach ensures our application is usable by everyone, regardless of ability."

---

## 10. Form Handling with Advanced Validation

**Question:** "We need robust form handling for equipment configuration with complex validation rules, async validation, field dependencies, and error recovery. How would you implement this?"

**Detailed Answer:**

"I'd build a type-safe, performant form system with comprehensive validation. Here's my approach:

**Phase 1: Form State Management with React Hook Form**

```tsx
// hooks/useEquipmentConfigForm.ts
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback } from 'react';

// Validation schema with complex rules
const equipmentConfigSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),

  temperatureThreshold: z.number()
    .min(0, 'Temperature must be positive')
    .max(2000, 'Temperature cannot exceed 2000°C'),

  pressureRange: z.object({
    min: z.number(),
    max: z.number()
  }).refine(
    (data) => data.min < data.max,
    {
      message: 'Minimum pressure must be less than maximum',
      path: ['min']
    }
  ),

  sensors: z.array(z.object({
    id: z.string(),
    type: z.enum(['temperature', 'pressure', 'vacuum', 'flow_rate']),
    enabled: z.boolean(),
    pollingInterval: z.number()
      .min(1000, 'Minimum polling interval is 1 second')
      .max(60000, 'Maximum polling interval is 60 seconds'),
    calibrationDate: z.string().datetime().optional(),
  })).min(1, 'At least one sensor must be configured'),

  notificationEmail: z.string()
    .email('Invalid email address')
    .or(z.literal('')), // Allow empty

  alertSettings: z.object({
    enabled: z.boolean(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    recipients: z.array(z.string().email()).min(1).optional()
  }).refine(
    (data) => !data.enabled || (data.recipients && data.recipients.length > 0),
    {
      message: 'At least one recipient required when alerts enabled',
      path: ['recipients']
    }
  ),

  maintenanceSchedule: z.object({
    frequency: z.enum(['weekly', 'monthly', 'quarterly']),
    nextDate: z.string().datetime(),
  }).refine(
    (data) => new Date(data.nextDate) > new Date(),
    {
      message: 'Maintenance date must be in the future',
      path: ['nextDate']
    }
  )
});

type EquipmentConfigFormData = z.infer<typeof equipmentConfigSchema>;

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
    clearErrors
  } = useForm<EquipmentConfigFormData>({
    resolver: zodResolver(equipmentConfigSchema),
    mode: 'onBlur', // Validate on blur
    defaultValues: {
      sensors: [
        {
          id: 'sensor-1',
          type: 'temperature',
          enabled: true,
          pollingInterval: 5000
        }
      ],
      alertSettings: {
        enabled: false,
        severity: 'medium'
      },
      ...initialData
    }
  });

  // Dynamic field array for sensors
  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
    update: updateSensor
  } = useFieldArray({
    control,
    name: 'sensors'
  });

  // Watch specific fields for conditional logic
  const alertsEnabled = watch('alertSettings.enabled');
  const selectedSensors = watch('sensors');

  // Async validation for equipment ID uniqueness
  const validateEquipmentId = useCallback(async (equipmentId: string) => {
    try {
      const response = await fetch(`/api/equipment/validate/${equipmentId}`);
      const { exists } = await response.json();

      if (exists) {
        setError('equipmentId', {
          type: 'manual',
          message: 'Equipment ID already exists'
        });
        return false;
      }

      clearErrors('equipmentId');
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [setError, clearErrors]);

  // Cross-field validation
  const validateForm = useCallback(async () => {
    const values = getValues();

    // Check if temperature threshold is reasonable for sensor types
    const hasTempSensor = values.sensors.some(s => s.type === 'temperature');
    if (hasTempSensor && values.temperatureThreshold < 100) {
      setError('temperatureThreshold', {
        type: 'manual',
        message: 'Temperature threshold seems unusually low for selected sensors'
      });
      return false;
    }

    return true;
  }, [getValues, setError]);

  // Custom submit handler with error recovery
  const onSubmitForm = handleSubmit(async (data) => {
    try {
      // Additional validation
      const isValid = await validateForm();
      if (!isValid) return;

      // Call provided submit handler
      await onSubmit?.(data);

      // Reset dirty state after successful submit
      reset(data);

    } catch (error) {
      // Handle API errors
      if (error instanceof Error) {
        setError('root.serverError', {
          type: 'manual',
          message: error.message
        });
      }
    }
  });

  // Add new sensor
  const addSensor = useCallback((type: 'temperature' | 'pressure' | 'vacuum' | 'flow_rate') => {
    appendSensor({
      id: `sensor-${Date.now()}`,
      type,
      enabled: true,
      pollingInterval: 5000
    });
  }, [appendSensor]);

  // Autosave draft
  const saveDraft = useCallback(async () => {
    const values = getValues();
    try {
      await fetch('/api/equipment/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [getValues]);

  return {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    watch,
    setValue,
    trigger,
    reset,
    onSubmit: onSubmitForm,

    // Sensor management
    sensorFields,
    addSensor,
    removeSensor,
    updateSensor,

    // Validation helpers
    validateEquipmentId,
    validateForm,

    // Utilities
    saveDraft,
    alertsEnabled,
    selectedSensors
  };
}

```

**Phase 2: Form Component with Complex UI**

```tsx
// components/EquipmentConfigForm.tsx
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useEquipmentConfigForm } from '@/hooks/useEquipmentConfigForm';
import { useDebounce } from '@/hooks/useDebounce';

interface EquipmentConfigFormProps {
  initialData?: any;
  onSuccess?: (data: any) => void;
}

export function EquipmentConfigForm({ initialData, onSuccess }: EquipmentConfigFormProps) {
  const {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    watch,
    setValue,
    trigger,
    onSubmit,
    sensorFields,
    addSensor,
    removeSensor,
    validateEquipmentId,
    saveDraft,
    alertsEnabled
  } = useEquipmentConfigForm(initialData, async (data) => {
    // Submit to API
    const response = await fetch('/api/equipment/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to save configuration');
    }

    onSuccess?.(data);
  });

  // Autosave draft every 30 seconds if form is dirty
  const debouncedSaveDraft = useDebounce(saveDraft, 30000);

  useEffect(() => {
    if (isDirty) {
      debouncedSaveDraft();
    }
  }, [isDirty, debouncedSaveDraft]);

  // Async validation for equipment ID
  const equipmentId = watch('equipmentId');
  const debouncedEquipmentId = useDebounce(equipmentId, 500);

  useEffect(() => {
    if (debouncedEquipmentId && debouncedEquipmentId.length > 0) {
      validateEquipmentId(debouncedEquipmentId);
    }
  }, [debouncedEquipmentId, validateEquipmentId]);

  return (
    <form onSubmit={onSubmit} className="equipment-config-form">
      {/* Server error display */}
      {errors.root?.serverError && (
        <div role="alert" className="error-banner">
          <strong>Error:</strong> {errors.root.serverError.message}
        </div>
      )}

      {/* Auto-save indicator */}
      {isDirty && (
        <div className="autosave-indicator">
          <span>Unsaved changes</span>
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSubmitting}
          >
            Save Draft
          </button>
        </div>
      )}

      <fieldset>
        <legend>Basic Configuration</legend>

        {/* Equipment ID with async validation */}
        <div className="form-group">
          <label htmlFor="equipmentId">
            Equipment ID *
          </label>
          <input
            id="equipmentId"
            {...register('equipmentId')}
            aria-invalid={!!errors.equipmentId}
            aria-describedby={errors.equipmentId ? 'equipmentId-error' : undefined}
          />
          {errors.equipmentId && (
            <span id="equipmentId-error" role="alert" className="error-message">
              {errors.equipmentId.message}
            </span>
          )}
        </div>

        {/* Temperature threshold */}
        <div className="form-group">
          <label htmlFor="temperatureThreshold">
            Temperature Threshold (°C) *
          </label>
          <input
            id="temperatureThreshold"
            type="number"
            step="10"
            {...register('temperatureThreshold', { valueAsNumber: true })}
            aria-invalid={!!errors.temperatureThreshold}
            aria-describedby={errors.temperatureThreshold ? 'temperatureThreshold-error' : undefined}
          />
          {errors.temperatureThreshold && (
            <span id="temperatureThreshold-error" role="alert" className="error-message">
              {errors.temperatureThreshold.message}
            </span>
          )}
        </div>

        {/* Pressure range with dependent validation */}
        <fieldset className="form-group">
          <legend>Pressure Range (Pa)</legend>

          <div className="range-inputs">
            <div>
              <label htmlFor="pressureRange.min">Minimum</label>
              <input
                id="pressureRange.min"
                type="number"
                {...register('pressureRange.min', { valueAsNumber: true })}
                onBlur={() => trigger('pressureRange')}
              />
            </div>

            <div>
              <label htmlFor="pressureRange.max">Maximum</label>
              <input
                id="pressureRange.max"
                type="number"
                {...register('pressureRange.max', { valueAsNumber: true })}
                onBlur={() => trigger('pressureRange')}
              />
            </div>
          </div>

          {errors.pressureRange?.min && (
            <span role="alert" className="error-message">
              {errors.pressureRange.min.message}
            </span>
          )}
        </fieldset>
      </fieldset>

      {/* Dynamic sensor fields */}
      <fieldset>
        <legend>Sensors</legend>

        {sensorFields.map((field, index) => (
          <div key={field.id} className="sensor-config">
            <h4>Sensor {index + 1}</h4>

            <div className="form-group">
              <label htmlFor={`sensors.${index}.type`}>Type</label>
              <select
                id={`sensors.${index}.type`}
                {...register(`sensors.${index}.type`)}
              >
                <option value="temperature">Temperature</option>
                <option value="pressure">Pressure</option>
                <option value="vacuum">Vacuum</option>
                <option value="flow_rate">Flow Rate</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  {...register(`sensors.${index}.enabled`)}
                />
                Enabled
              </label>
            </div>

            <div className="form-group">
              <label htmlFor={`sensors.${index}.pollingInterval`}>
                Polling Interval (ms)
              </label>
              <input
                id={`sensors.${index}.pollingInterval`}
                type="number"
                step="1000"
                {...register(`sensors.${index}.pollingInterval`, { valueAsNumber: true })}
              />
              {errors.sensors?.[index]?.pollingInterval && (
                <span role="alert" className="error-message">
                  {errors.sensors[index]?.pollingInterval?.message}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeSensor(index)}
              disabled={sensorFields.length === 1}
            >
              Remove Sensor
            </button>
          </div>
        ))}

        {errors.sensors && typeof errors.sensors === 'object' && 'message' in errors.sensors && (
          <span role="alert" className="error-message">
            {errors.sensors.message as string}
          </span>
        )}

        <div className="add-sensor-buttons">
          <button type="button" onClick={() => addSensor('temperature')}>
            + Temperature Sensor
          </button>
          <button type="button" onClick={() => addSensor('pressure')}>
            + Pressure Sensor
          </button>
          <button type="button" onClick={() => addSensor('vacuum')}>
            + Vacuum Sensor
          </button>
        </div>
      </fieldset>

      {/* Conditional alert settings */}
      <fieldset>
        <legend>Alert Settings</legend>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              {...register('alertSettings.enabled')}
            />
            Enable Alerts
          </label>
        </div>

        {alertsEnabled && (
          <>
            <div className="form-group">
              <label htmlFor="alertSettings.severity">Severity</label>
              <select
                id="alertSettings.severity"
                {...register('alertSettings.severity')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="alertSettings.recipients">
                Recipients (comma-separated emails)
              </label>
              <Controller
                name="alertSettings.recipients"
                control={control}
                render={({ field }) => (
                  <input
                    id="alertSettings.recipients"
                    value={field.value?.join(', ') || ''}
                    onChange={(e) => {
                      const emails = e.target.value
                        .split(',')
                        .map(email => email.trim())
                        .filter(Boolean);
                      field.onChange(emails);
                    }}
                    aria-invalid={!!errors.alertSettings?.recipients}
                  />
                )}
              />
              {errors.alertSettings?.recipients && (
                <span role="alert" className="error-message">
                  {errors.alertSettings.recipients.message}
                </span>
              )}
            </div>
          </>
        )}
      </fieldset>

      {/* Maintenance schedule */}
      <fieldset>
        <legend>Maintenance Schedule</legend>

        <div className="form-group">
          <label htmlFor="maintenanceSchedule.frequency">Frequency</label>
          <select
            id="maintenanceSchedule.frequency"
            {...register('maintenanceSchedule.frequency')}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maintenanceSchedule.nextDate">
            Next Maintenance Date
          </label>
          <input
            id="maintenanceSchedule.nextDate"
            type="datetime-local"
            {...register('maintenanceSchedule.nextDate')}
            aria-invalid={!!errors.maintenanceSchedule?.nextDate}
          />
          {errors.maintenanceSchedule?.nextDate && (
            <span role="alert" className="error-message">
              {errors.maintenanceSchedule.nextDate.message}
            </span>
          )}
        </div>
      </fieldset>

      {/* Form actions */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('Discard all changes?')) {
              window.location.reload();
            }
          }}
          disabled={!isDirty}
        >
          Cancel
        </button>
      </div>

      {/* Form validation summary */}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="validation-summary">
          <h4>Please fix the following errors:</h4>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                {field}: {error?.message as string}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

```

**Phase 3: Custom Validation Hook**

```tsx
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

```

**Key Features Implemented:**

1. **Type-Safe Validation**: Zod schema with TypeScript inference
2. **Async Validation**: Equipment ID uniqueness check
3. **Cross-Field Validation**: Pressure range, alert recipients
4. **Conditional Fields**: Alert settings shown only when enabled
5. **Dynamic Arrays**: Add/remove sensors
6. **Autosave**: Draft saved every 30 seconds
7. **Error Recovery**: Server errors displayed clearly
8. **Accessibility**: Proper ARIA attributes, error messages
9. **Performance**: Debounced validation, memoization
10. **UX**: Loading states, disabled buttons, confirmation dialogs

This comprehensive form system handles the most complex validation scenarios while maintaining excellent UX."

---

Due to length constraints, I'll provide a summary of the remaining questions (11-15) and can elaborate on any specific one:

## Questions 11-15 Summary:

**11. CSS-in-JS vs Traditional Styling**

- Compare styled-components, Emotion, Tailwind, CSS Modules
- Performance implications, bundle size
- Dynamic styling with TypeScript
- Theme system architecture

**12. Component Library Architecture**

- Building reusable components
- Prop API design
- Composition patterns
- Documentation with Storybook

**13. CI/CD for React Applications**

- Automated testing pipelines
- Build optimization
- Deployment strategies
- Environment management

**14. Advanced Debugging Techniques**

- React DevTools profiler
- Performance bottleneck identification
- Memory leak detection
- Production error tracking

**15. Migration Strategies**

- Class to functional components
- JavaScript to TypeScript
- Legacy state management to modern solutions
- Incremental adoption strategies

# React/Frontend Technical Interview Preparation (Final Section)

## Questions 11-15

---

## 11. CSS-in-JS vs Traditional Styling Approaches

**Question:** "Our team is debating between CSS-in-JS solutions like styled-components, utility-first frameworks like Tailwind, and traditional CSS Modules. What would you recommend for our equipment monitoring dashboard, and how would you implement a cohesive styling system?"

**Detailed Answer:**

"For a mission-critical dashboard, I'd recommend a **hybrid approach** combining Tailwind for utility classes with CSS Modules for complex components. Here's my reasoning and implementation:

**Analysis of Options:**

```tsx
// Comparison Matrix
const stylingComparison = {
  'CSS Modules': {
    pros: [
      'Zero runtime overhead',
      'Scoped by default',
      'Standard CSS syntax',
      'Excellent tree-shaking',
      'Best performance'
    ],
    cons: [
      'No dynamic theming without CSS variables',
      'Verbose for simple utilities',
      'Requires build tooling'
    ],
    bundleImpact: '0kb runtime'
  },

  'Tailwind CSS': {
    pros: [
      'Rapid development',
      'Consistent design system',
      'Excellent purging/tree-shaking',
      'No context switching',
      'Mobile-first by default'
    ],
    cons: [
      'Learning curve',
      'Verbose HTML',
      'Harder to implement complex animations',
      'Less semantic'
    ],
    bundleImpact: '~10-50kb after purging'
  },

  'styled-components': {
    pros: [
      'True CSS-in-JS with props',
      'Dynamic theming',
      'Automatic critical CSS',
      'Component-scoped'
    ],
    cons: [
      'Runtime overhead (~16kb)',
      'Server-side rendering complexity',
      'Slower than static solutions',
      'Bundle size impact'
    ],
    bundleImpact: '~16kb runtime + styles'
  },

  'Emotion': {
    pros: [
      'Similar to styled-components',
      'Better performance than styled-components',
      'Flexible API'
    ],
    cons: [
      'Still has runtime overhead (~8kb)',
      'Learning curve'
    ],
    bundleImpact: '~8kb runtime + styles'
  }
};

```

**Recommended Architecture: Tailwind + CSS Modules + CSS Variables**

```tsx
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Equipment status colors
        status: {
          normal: 'rgb(var(--color-status-normal) / <alpha-value>)',
          warning: 'rgb(var(--color-status-warning) / <alpha-value>)',
          critical: 'rgb(var(--color-status-critical) / <alpha-value>)',
          offline: 'rgb(var(--color-status-offline) / <alpha-value>)',
        },
        // Brand colors
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          // ... rest of scale
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        }
      },

      // Custom animations for real-time indicators
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },

      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },

      // Custom spacing for dashboard grids
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

```

**CSS Variables for Theming:**

```css
/* styles/theme.css */
:root {
  /* Color system using RGB for alpha support */
  --color-primary-50: 239 246 255;
  --color-primary-100: 219 234 254;
  --color-primary-500: 59 130 246;
  --color-primary-900: 30 58 138;

  /* Status colors */
  --color-status-normal: 34 197 94;
  --color-status-warning: 245 158 11;
  --color-status-critical: 239 68 68;
  --color-status-offline: 107 114 128;

  /* Background colors */
  --color-bg-primary: 255 255 255;
  --color-bg-secondary: 249 250 251;
  --color-bg-tertiary: 243 244 246;

  /* Text colors */
  --color-text-primary: 17 24 39;
  --color-text-secondary: 75 85 99;
  --color-text-tertiary: 156 163 175;

  /* Border colors */
  --color-border-primary: 229 231 235;
  --color-border-secondary: 209 213 219;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Spacing */
  --spacing-unit: 0.25rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Dark mode */
[data-theme='dark'] {
  --color-bg-primary: 17 24 39;
  --color-bg-secondary: 31 41 55;
  --color-bg-tertiary: 55 65 81;

  --color-text-primary: 243 244 246;
  --color-text-secondary: 209 213 219;
  --color-text-tertiary: 156 163 175;

  --color-border-primary: 55 65 81;
  --color-border-secondary: 75 85 99;
}

/* High contrast mode */
[data-theme='high-contrast'] {
  --color-text-primary: 0 0 0;
  --color-bg-primary: 255 255 255;
  --color-border-primary: 0 0 0;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-base: 0ms;
    --transition-slow: 0ms;
  }
}

```

**Hybrid Component Example:**

```tsx
// components/TemperatureCard/TemperatureCard.tsx
import { useMemo } from 'react';
import clsx from 'clsx';
import styles from './TemperatureCard.module.css';

interface TemperatureCardProps {
  value: number;
  unit: 'celsius' | 'fahrenheit';
  status: 'normal' | 'warning' | 'critical';
  threshold: number;
  timestamp: string;
  className?: string;
}

export function TemperatureCard({
  value,
  unit,
  status,
  threshold,
  timestamp,
  className
}: TemperatureCardProps) {
  // Compute percentage for visual indicator
  const percentage = useMemo(() => {
    return Math.min((value / threshold) * 100, 100);
  }, [value, threshold]);

  return (
    <div
      className={clsx(
        // Tailwind utilities for layout and spacing
        'relative rounded-lg border p-6 shadow-md transition-all',
        // Tailwind utilities for responsive design
        'hover:shadow-lg',
        // Status-specific Tailwind classes
        status === 'normal' && 'border-status-normal/20 bg-status-normal/5',
        status === 'warning' && 'border-status-warning/20 bg-status-warning/5',
        status === 'critical' && 'border-status-critical/20 bg-status-critical/5',
        // CSS Module for complex animations
        styles.card,
        status === 'critical' && styles.cardPulsing,
        className
      )}
    >
      {/* Live indicator with CSS Module animation */}
      <div className={clsx('absolute top-4 right-4 flex items-center gap-2')}>
        <span className={styles.liveIndicator} aria-hidden="true" />
        <span className="text-xs text-text-secondary">Live</span>
      </div>

      {/* Main content with Tailwind utilities */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">
          Temperature
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text-primary">
            {value.toFixed(1)}
          </span>
          <span className="text-2xl text-text-secondary">
            °{unit === 'celsius' ? 'C' : 'F'}
          </span>
        </div>

        {/* Status badge */}
        <div
          className={clsx(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
            status === 'normal' && 'bg-status-normal/10 text-status-normal',
            status === 'warning' && 'bg-status-warning/10 text-status-warning',
            status === 'critical' && 'bg-status-critical/10 text-status-critical'
          )}
        >
          <span className={styles.statusDot} data-status={status} />
          <span className="capitalize">{status}</span>
        </div>

        {/* Progress bar with CSS Module for complex styling */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Threshold</span>
            <span>{threshold}°{unit === 'celsius' ? 'C' : 'F'}</span>
          </div>

          <div className={styles.progressBar}>
            <div
              className={clsx(
                styles.progressFill,
                status === 'normal' && styles.progressNormal,
                status === 'warning' && styles.progressWarning,
                status === 'critical' && styles.progressCritical
              )}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={threshold}
              aria-label={`Temperature is ${percentage.toFixed(0)}% of threshold`}
            />
          </div>
        </div>

        {/* Timestamp */}
        <time className="block text-xs text-text-tertiary">
          Last updated: {new Date(timestamp).toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
}

```

**CSS Module for Complex Styling:**

```css
/* components/TemperatureCard/TemperatureCard.module.css */

/* Card pulse animation for critical status */
.cardPulsing {
  animation: cardPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes cardPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgb(var(--color-status-critical) / 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgb(var(--color-status-critical) / 0);
  }
}

/* Live indicator with custom animation */
.liveIndicator {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgb(var(--color-status-normal));
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Status dot with specific colors */
.statusDot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.statusDot[data-status='normal'] {
  background-color: rgb(var(--color-status-normal));
}

.statusDot[data-status='warning'] {
  background-color: rgb(var(--color-status-warning));
}

.statusDot[data-status='critical'] {
  background-color: rgb(var(--color-status-critical));
  animation: criticalPulse 1s ease-in-out infinite;
}

@keyframes criticalPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* Progress bar with gradient and animation */
.progressBar {
  position: relative;
  width: 100%;
  height: 8px;
  background-color: rgb(var(--color-bg-tertiary));
  border-radius: 9999px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: 9999px;
  transition: width var(--transition-base);
  position: relative;
  overflow: hidden;
}

/* Animated shimmer effect */
.progressFill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progressNormal {
  background: linear-gradient(
    90deg,
    rgb(var(--color-status-normal) / 0.8),
    rgb(var(--color-status-normal))
  );
}

.progressWarning {
  background: linear-gradient(
    90deg,
    rgb(var(--color-status-warning) / 0.8),
    rgb(var(--color-status-warning))
  );
}

.progressCritical {
  background: linear-gradient(
    90deg,
    rgb(var(--color-status-critical) / 0.8),
    rgb(var(--color-status-critical))
  );
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .card {
    padding: 1rem;
  }
}

```

**Theme Context for Runtime Theming:**

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Check high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }

    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleChange = () => {
      // Only update if user hasn't manually set a theme
      if (!localStorage.getItem('theme')) {
        if (highContrastQuery.matches) {
          setTheme('high-contrast');
        } else if (darkModeQuery.matches) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      }
    };

    darkModeQuery.addEventListener('change', handleChange);
    highContrastQuery.addEventListener('change', handleChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleChange);
      highContrastQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

```

**Performance Comparison:**

```tsx
// Performance test results from production dashboard

const performanceMetrics = {
  'CSS Modules + Tailwind (Recommended)': {
    bundleSize: '45kb (after purging)',
    runtimeOverhead: '0ms',
    firstPaint: '1.2s',
    styleRecalc: '8ms per update',
    memoryUsage: '2.1MB'
  },

  'styled-components': {
    bundleSize: '62kb',
    runtimeOverhead: '~3ms per component',
    firstPaint: '1.5s',
    styleRecalc: '12ms per update',
    memoryUsage: '3.8MB'
  },

  'Emotion': {
    bundleSize: '53kb',
    runtimeOverhead: '~2ms per component',
    firstPaint: '1.4s',
    styleRecalc: '10ms per update',
    memoryUsage: '3.2MB'
  }
};

```

**Utility Functions for Dynamic Styles:**

```tsx
// utils/styles.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate status-based classes
 */
export function getStatusClasses(status: string) {
  const baseClasses = 'rounded-full px-3 py-1 text-xs font-medium';

  const statusClasses = {
    normal: 'bg-status-normal/10 text-status-normal border border-status-normal/20',
    warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    critical: 'bg-status-critical/10 text-status-critical border border-status-critical/20',
    offline: 'bg-status-offline/10 text-status-offline border border-status-offline/20'
  };

  return cn(baseClasses, statusClasses[status as keyof typeof statusClasses]);
}

/**
 * Responsive container classes
 */
export function getContainerClasses(size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'xl') {
  const sizes = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  return cn('mx-auto px-4 sm:px-6 lg:px-8', sizes[size]);
}

```

**Why This Hybrid Approach?**

1. **Performance**: No runtime overhead from Tailwind utilities
2. **Flexibility**: CSS Modules for complex animations/interactions
3. **Developer Experience**: Rapid development with Tailwind
4. **Maintainability**: CSS variables for easy theming
5. **Bundle Size**: Excellent tree-shaking with both solutions
6. **Type Safety**: Can generate TypeScript types from CSS Modules
7. **Accessibility**: Easy to implement responsive and reduced-motion preferences

**Migration Strategy:**

```tsx
// If migrating from styled-components:

// Before (styled-components):
const Button = styled.button<{ variant: string }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: ${props => props.variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#2563eb' : '#4b5563'};
  }
`;

// After (Tailwind + TypeScript):
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md px-4 py-2 text-white transition-colors',
        variant === 'primary' && 'bg-primary-500 hover:bg-primary-600',
        variant === 'secondary' && 'bg-gray-500 hover:bg-gray-600'
      )}
      {...props}
    >
      {children}
    </button>
  );
}

```

This hybrid approach has delivered the best results in my production dashboards - combining performance, maintainability, and developer experience."

---

## 12. Component Library Architecture

**Question:** "We want to build a reusable component library for our equipment monitoring interfaces that can be used across multiple projects. How would you architect this library for maximum reusability, type safety, and documentation?"

**Detailed Answer:**

"I'd build a comprehensive component library using a monorepo structure with strong conventions. Here's my architecture:

**Phase 1: Project Structure**

```bash
equipment-ui/
├── packages/
│   ├── core/                    # Core components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   ├── Button.module.css
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Input/
│   │   │   │   ├── Select/
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── charts/                  # Chart components
│   │   ├── src/
│   │   │   ├── LineChart/
│   │   │   ├── BarChart/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── equipment/               # Domain-specific components
│   │   ├── src/
│   │   │   ├── TemperatureMonitor/
│   │   │   ├── PressureGauge/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── icons/                   # Icon library
│       ├── src/
│       └── package.json
│
├── apps/
│   └── storybook/              # Documentation site
│       ├── .storybook/
│       └── stories/
│
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config
└── tsconfig.json              # Base TypeScript config

```

**Phase 2: Base Component Pattern**

```tsx
// packages/core/src/components/Button/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import styles from './Button.module.css';

/**
 * Button variants using CVA for type-safe variant generation
 */
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * Button component props extending HTML button attributes
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Loading state - shows spinner and disables button
   */
  isLoading?: boolean;

  /**
   * Icon to display before button text
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display after button text
   */
  rightIcon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Button component for user interactions
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          isLoading && styles.loading,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className={styles.spinner} role="status" aria-label="Loading">
            <span className="sr-only">Loading...</span>
          </span>
        )}

        {!isLoading && leftIcon && (
          <span className={styles.iconLeft} aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {children}

        {!isLoading && rightIcon && (
          <span className={styles.iconRight} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

```

**Phase 3: Compound Component Pattern**

```tsx
// packages/core/src/components/Card/Card.tsx
import { createContext, useContext, HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Card context for sharing state between compound components
 */
interface CardContextValue {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardContext = createContext<CardContextValue>({ padding: 'md' });

/**
 * Main Card component
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      shadow = 'md',
      hover = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const shadowClasses = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    return (
      <CardContext.Provider value={{ padding }}>
        <div
          ref={ref}
          className={cn(
            'rounded-lg border border-gray-200 bg-white',
            shadowClasses[shadow],
            hover && 'transition-shadow hover:shadow-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header subcomponent
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ divider = false, className, children, ...props }, ref) => {
    const { padding } = useContext(CardContext);

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding || 'md'],
          divider && 'border-b border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'Card.Header';

/**
 * Card Body subcomponent
 */
export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { padding } = useContext(CardContext);

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(paddingClasses[padding || 'md'], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'Card.Body';

/**
 * Card Footer subcomponent
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ divider = false, className, children, ...props }, ref) => {
    const { padding } = useContext(CardContext);

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding || 'md'],
          divider && 'border-t border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

// Export as compound component
export const CardCompound = Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

```

**Phase 4: Polymorphic Component Pattern**

```tsx
// packages/core/src/components/Text/Text.tsx
import { ElementType, ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Polymorphic component props that allow changing the rendered element
 */
type PolymorphicRef<T extends ElementType> = ComponentPropsWithoutRef<T>['ref'];

type PolymorphicComponentProps<T extends ElementType, Props = {}> = {
  as?: T;
} & Props &
  Omit<ComponentPropsWithoutRef<T>, keyof Props | 'as'>;

/**
 * Text component props
 */
export interface TextOwnProps {
  variant?: 'body' | 'caption' | 'overline' | 'code';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  className?: string;
}

export type TextProps<T extends ElementType = 'span'> = PolymorphicComponentProps
  T,
  TextOwnProps
>;

/**
 * Polymorphic Text component that can render as different elements
 *
 * @example
 * ```tsx
 * <Text as="p" variant="body" size="md">
 *   Regular paragraph
 * </Text>
 *
 * <Text as="h2" size="xl" weight="bold">
 *   Heading
 * </Text>
 *
 * <Text as="a" href="/link" color="primary">
 *   Link text
 * </Text>
 * ```
 */
export const Text = forwardRef(
  <T extends ElementType = 'span'>(
    {
      as,
      variant = 'body',
      size = 'md',
      weight = 'normal',
      color = 'primary',
      align = 'left',
      truncate = false,
      className,
      children,
      ...props
    }: TextProps<T>,
    ref: PolymorphicRef<T>
  ) => {
    const Component = as || 'span';

    const variantClasses = {
      body: 'font-sans',
      caption: 'font-sans text-sm',
      overline: 'font-sans text-xs uppercase tracking-wider',
      code: 'font-mono',
    };

    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const colorClasses = {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      tertiary: 'text-text-tertiary',
      danger: 'text-red-600',
      success: 'text-green-600',
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          weightClasses[weight],
          colorClasses[color],
          alignClasses[align],
          truncate && 'truncate',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

```

**Phase 5: Storybook Documentation**

```tsx
// packages/core/src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ChevronRight, Download } from 'lucide-react';

/**
 * Button component for triggering actions and events
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Button size',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Supports loading states, icons, and full accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default button with primary variant
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * All button variants displayed together
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * Button sizes from small to large
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Button with loading state
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Loading',
  },
};

/**
 * Button with left icon
 */
export const WithLeftIcon: Story = {
  args: {
    variant: 'primary',
    leftIcon: <Download className="h-4 w-4" />,
    children: 'Download',
  },
};

/**
 * Button with right icon
 */
export const WithRightIcon: Story = {
  args: {
    variant: 'primary',
    rightIcon: <ChevronRight className="h-4 w-4" />,
    children: 'Next',
  },
};

/**
 * Icon-only button
 */
export const IconButton: Story = {
  args: {
    variant: 'ghost',
    size: 'icon',
    'aria-label': 'Download',
    children: <Download className="h-4 w-4" />,
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full Width Button',
  },
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click me',
    isLoading: false,
    disabled: false,
  },
};

```

**Phase 6: Package Configuration**

```json
// packages/core/package.json
{
  "name": "@equipment-ui/core",
  "version": "1.0.0",
  "description": "Core UI components for equipment monitoring",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}

```

**Phase 7: Build Configuration**

```tsx
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"', // For Next.js App Router compatibility
    };
  },
});

```

**Phase 8: API Design Guidelines**

```tsx
// docs/API_GUIDELINES.md
/**
 * Component API Design Principles
 *
 * 1. Prop Naming Conventions:
 *    - Boolean props: is*, has*, should* (e.g., isLoading, hasError)
 *    - Event handlers: on* (e.g., onClick, onSubmit)
 *    - Render props: render* (e.g., renderFooter)
 *
 * 2. Default Props:
 *    - Always provide sensible defaults
 *    - Document default values in JSDoc
 *
 * 3. Composition:
 *    - Prefer composition over configuration
 *    - Use compound components for complex UIs
 *    - Support render props for flexibility
 *
 * 4. TypeScript:
 *    - Export all prop interfaces
 *    - Use discriminated unions for variant props
 *    - Leverage generics for polymorphic components
 *
 * 5. Accessibility:
 *    - All interactive elements must be keyboard accessible
 *    - Provide ARIA labels where needed
 *    - Support screen readers
 *
 * 6. Performance:
 *    - Use React.memo for expensive components
 *    - Avoid inline functions in render
 *    - Lazy load heavy dependencies
 */

// Example of well-designed component API
interface WellDesignedProps {
  // 1. Required props first
  children: React.ReactNode;

  // 2. Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';

  // 3. Boolean flags
  isLoading?: boolean;
  isDisabled?: boolean;

  // 4. Event handlers
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (value: string) => void;

  // 5. Render props
  renderIcon?: () => React.ReactNode;

  // 6. Style overrides
  className?: string;
  style?: React.CSSProperties;

  // 7. Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

```

**Phase 9: Testing Strategy**

```tsx
// packages/core/src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('applies variant classes', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('renders with left icon', () => {
      render(
        <Button leftIcon={<span data-testid="icon">→</span>}>
          Next
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} isLoading>
          Click
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Accessible</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('announces loading state to screen readers', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('States', () => {
    it('shows loading spinner when isLoading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      render(
        <Button isLoading leftIcon={<span data-testid="icon">→</span>}>
          Next
        </Button>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });
});

```

**Key Architectural Decisions:**

1. **Monorepo Structure**: Organized by domain (core, charts, equipment)
2. **Compound Components**: Flexible composition patterns
3. **Polymorphic Components**: Type-safe element rendering
4. **CVA for Variants**: Type-safe variant management
5. **Storybook Documentation**: Interactive component playground
6. **Comprehensive Testing**: Unit, integration, and a11y tests
7. **TypeScript First**: Full type safety across library
8. **Tree-Shakeable**: ESM exports for optimal bundling

This architecture has scaled to 100+ components in production with excellent DX and maintainability."

---

Due to space, I'll provide concise implementations for questions 13-15. Let me know if you want me to expand any!

## 13. CI/CD Pipeline (Concise)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build

      - name: Analyze bundle
        run: npm run analyze

      - name: Check bundle size
        uses: andresz1/size-limit-action@v1

```

## 14. Debugging Techniques (Concise)

```tsx
// React DevTools + Performance monitoring
function useWhyDidYouUpdate(name: string, props: any) {
  const previousProps = useRef<any>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: any = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

```

## 15. Migration Strategy (Concise)

```tsx
// Incremental TypeScript migration
// Step 1: Add tsconfig.json with allowJs: true
// Step 2: Rename .jsx to .tsx one file at a time
// Step 3: Add types incrementally

// Class to Function migration
// Before:
class OldComponent extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    this.setState(prev => ({ count: prev.count + 1 }));
  };

  render() {
    return <button onClick={this.handleClick}>{this.state.count}</button>;
  }
}

// After:
function NewComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
}

```

---

This completes all 15 comprehensive technical interview questions! Each covers critical React/frontend topics you'll encounter in senior-level interviews for the equipment monitoring position. Would you like me to elaborate further on questions 13-15, or would you like practice scenarios for answering these in the actual interview?

# Concept REACT Questions

# **Technical Interview Practice: Software Developer (React-focused)**

Below are 15 technical interview questions based on the provided job description (with a strong emphasis on React/front-end skills, as well as Linux and CI/CD expertise). Each question is followed by a detailed answer that a senior software developer might give. These answers are thorough to help practice articulating problem-solving skills and deep understanding.

## **Front-End (React) Questions**

**Question 1:** *What are the advantages of React’s component-based architecture, and how do functional components differ from class components? When might you use one over the other?*

**Answer:** React’s component-based architecture encourages **modularity and reusability**. **Each UI element can be encapsulated as a self-contained component with its own logic and styling,** which makes the codebase more maintainable. This modular approach means you can build **complex UIs by composing simpler components**, leading to cleaner separation of concerns. It also makes testing easier (each component can be tested in isolation) and improves reusability since components can be shared across different parts of the application.

## State

**State is:**

- Data that can change
- Private to each component
- Causes re-renders when updated

**useState gives you:**

- Current value ()
    
    ```
    count
    ```
    
- Function to update it ()
    
    ```
    setCount
    ```
    

**When state changes:**

- React re-renders the component
- User sees the updated value

## Functional components and class components are two ways to define React components.

### **Functional components**

are plain JavaScript functions that return JSX; they became the standard with the introduction of Hooks. 

They are *stateless* by default (prior to Hooks) but can use the React Hooks API (like **`useState`**, **`useEffect`**) to manage state and side effects. 

More concise and easier to read, and they avoid the pitfalls of JavaScript’s **`this`** context (since you don’t use **`this`** in functional components). 

### **Class components**,

 are defined as ES6 classes that extend **`React.Component`**. 

They have a state and lifecycle methods (like **`componentDidMount`**, **`shouldComponentUpdate`**, etc.). Class components were the only way to manage state and lifecycle before Hooks were introduced. In modern React development, you’d use functional components in almost all cases because Hooks provide all the capabilities (and more) that class lifecycle methods offered. 

For example, **`useEffect`** can handle component mount/unmount and updates. One of the few scenarios where you *might* still use a class component is if you need an **Error Boundary** (as of now, error boundary components must be classes, since they rely on **`componentDidCatch`**). 

Overall, functional components are preferred for new code due to their simplicity and the powerful features Hooks provide, while class components are mostly seen in older codebases or for specific use cases like error boundaries.

**Question 2:** *How do you manage state in a React application? Explain the difference between state and props, and when would you use local component state versus a global state management solution (like Context or Redux).*

**Answer:** In React, **state** refers to data that is managed within a component and can change over time (triggering re-renders), whereas **props** are inputs to a component, passed down from parent components, and are read-only from the child’s perspective. In other words, *state is owned locally* and controlled by the component itself, while *props are external* and controlled by whatever renders the component. For example, a **`<Button>`** component might have an internal state for whether it is hovered, but it might receive a prop for **`label`** text from its parent.

To manage state in functional components, I commonly use Hooks like **`useState`** for simpler state values and **`useReducer`** for more complex state logic or when the state updates involve multiple sub-values and transitions (this is analogous to Redux but on a component scope). For instance, in a form component with many input fields, a **`useReducer`** can manage the form state more cleanly than multiple **`useState`** calls. When state needs to be **shared across multiple components**, lifting state up to the nearest common ancestor is one approach (passing it down via props), but this can become cumbersome if many distant components need the data. In those cases, I consider **global state management** solutions:

- **Context API:** React’s Context is good for situational global-ish state or configurations (like current user, theme, locale) that many components need. It avoids prop-drilling by providing a way to supply values deep into the component tree. I often use Context for things like theming or simple global flags because it’s built-in and lightweight.
- **Redux (or other libraries like Zustand, MobX):** These are useful when the app state is large or very dynamic, and you want a single source of truth plus powerful capabilities like time-travel debugging or middleware for side effects. In a complex application, if I find that state management via lifting state or Context is getting unwieldy (for example, lots of nested updates or difficulty tracing state changes), I’d use Redux. Redux stores the global state in a single store and uses reducers to describe how state updates happen in response to actions. This can simplify understanding the flow of data in large apps, although it introduces more boilerplate.

In summary, I use **local component state** (**`useState`**/**`useReducer`**) for component-specific data and ephemeral UI state, and reach for **Context or Redux** when state must be shared widely or kept in sync across many parts of the app. Always differentiate props vs state: props are inputs that shouldn’t be modified by the component (instead, changes in props come from above), whereas state is internal and can be updated by the component itself. A good rule of thumb is to elevate state to the lowest common ancestor of all components that need it, and if that common ancestor becomes something like the root of the app or a major section, it might be time to use a global store or Context for cleanliness.

**Question 3:** *Can you describe the lifecycle of a React component, particularly a functional component using Hooks? How does **`useEffect`** relate to lifecycle events like componentDidMount or componentDidUpdate?*

**Answer:** React components go through a series of phases: mounting, updating, and unmounting. In class components, these are managed by methods (constructor, **`render()`**, **`componentDidMount`**, **`componentDidUpdate`**, **`componentWillUnmount`**, etc.). In functional components, Hooks provide a way to tap into these lifecycle phases. Here’s how it works for a functional component:

- **Initial Render (Mounting):** The component function runs for the first time, constructing the initial UI. If you have a **`useEffect`** Hook with an empty dependency array (**`useEffect(..., [])`**), that effect will run *after* the first render (equivalent to **`componentDidMount`**). This is typically where you perform setup logic like fetching initial data or setting up subscriptions, since it runs once on mount.
- **Updating (Re-rendering due to state/props changes):** Whenever state changes via a Hook like **`useState`** or new props are passed in, the component re-renders. After each render, any **`useEffect`** Hooks will run *if their dependencies have changed*. For example, **`useEffect(() => { ... }, [someValue])`** will run the effect callback after a render whenever **`someValue`** has changed since the last run. This behavior covers what **`componentDidUpdate`** would do in classes. You can have multiple **`useEffect`** hooks in a component to separate concerns (each effect can watch different dependencies).
- **Cleanup and Unmounting:** If your effect returns a function, React will run that cleanup function before the effect is re-run the next time *and* also before the component unmounts. This is analogous to **`componentWillUnmount`**. For instance, if you set up a timer or subscribe to an event in an effect, your effect’s return function should clear the timer or unsubscribe from the event. This prevents memory leaks and unintended behavior. Example:
    
    ```jsx
    useEffect(() => {
    const handler =addEventListener('resize', onWindowResize);
    return() => {
    // cleanup on unmount
    window.removeEventListener('resize', onWindowResize);
        };
    }, []);
    
    ```
    

So **`useEffect`** is a Hook that combines the capabilities of multiple class lifecycle methods. By choosing dependency arrays appropriately, you can make an effect run only on mount (empty array), on every update (no dependency array or dependencies that change each time), or on specific updates (only when certain values change). This gives fine-grained control. A key thing to remember is that the functional component will re-run its entire body on each render, so you want to avoid heavy computations in the body (or use **`useMemo`**) and be careful with effects to not create infinite loops (ensure that your dependency array includes all values used inside the effect, or otherwise you might unintentionally re-run it too often).

**Question 4:** *Explain the concept of the virtual DOM in React. How does React’s reconciliation process work, and why is using a virtual DOM beneficial for performance?*

**Answer:** The **Virtual DOM** is an in-memory representation of the real DOM (Document Object Model) that React uses behind the scenes. Rather than manipulating the browser’s DOM directly for every UI update (which can be slow), React creates a lightweight copy (the virtual DOM) and performs diffing on it first. Here’s what happens:

1. When your component state or props change, React will produce a new virtual DOM tree representation of the UI for the new state.
2. It then **diffs** this new virtual DOM tree against the previous virtual DOM tree (the one representing the UI before the state change). This process is called **reconciliation**. React’s diffing algorithm efficiently figures out what has changed – for example, maybe one list item was added, or a button’s text changed.
3. After computing the differences, React will **update the real DOM only where necessary**. If only one DOM element changed, React will only touch that element in the real DOM, leaving the rest of the page as-is.

This approach is beneficial for performance because DOM manipulations (like adding/removing elements, changing attributes, etc.) are relatively expensive operations in a web browser. By minimizing direct DOM updates and batching them, React avoids layout thrashing and other performance issues. The virtual DOM updates are very fast (as it’s just JavaScript object manipulations in memory), and the reconciliation algorithm is optimized (it assumes elements with the same key and type are the same, etc., to make diffing nearly O(n) in complexity). Using **keys** on list elements, for instance, helps React identify which items are changed or moved, so it can re-order or update DOM elements smartly rather than re-rendering the entire list.

In summary, the virtual DOM serves as a performant middle layer: you write your UI code as if you’re re-rendering everything on each update, but React, via the virtual DOM, ensures that only the minimal necessary changes actually happen in the real DOM. This results in smooth and efficient updates, even for complex, dynamic UIs.

**Question 5:** *What strategies do you use to optimize the performance of a React application? For instance, how can you reduce unnecessary re-renders or improve load time for a large app?*

**Answer:** Optimizing a React app involves looking at both **render performance** and **load performance**. Here are several strategies I use:

- **Memoization to Prevent Unneeded Re-renders:** If a component re-renders frequently with the same props, I wrap it in **`React.memo`** so that it only re-renders when its props actually change (this is like a functional component equivalent of **`shouldComponentUpdate`**). Similarly, for expensive calculations inside a component, I use **`useMemo`** to memoize the result so it doesn’t redo the work on every render unless its inputs change. For functions that are passed as props to child components, I use **`useCallback`** to avoid passing a new function object on each render (which could trigger the child to re-render). These tools help cut down on needless recalculation and DOM diffing.
- **Splitting and Lazy Loading Code:** For large applications, I implement code-splitting using dynamic **`import()`** and React.lazy/Suspense. This means breaking the bundle into smaller chunks that can be loaded on demand. For example, if certain routes or components aren’t needed upfront, I load them only when the user navigates there. This improves initial load time because the user doesn’t download all of the app’s code at once. Using webpack or other bundlers, I ensure common dependencies are split into vendor chunks and utilize caching.
- **Optimizing List Rendering:** When rendering long lists, I use techniques like **windowing or virtualization** (e.g., using libraries like **`react-window`** or **`react-virtualized`**). This means only render what’s visible on screen (plus a little buffer) instead of thousands of off-screen items. It drastically reduces DOM node count and improves scroll performance.
- **Avoiding Expensive Operations in the Main Thread:** If I have any heavy computations or data transformations, I ensure they are either done in web workers (to offload from the main thread) or at least debounced/throttled so as not to block UI updates. Also, I pay attention to not do heavy work inside the rendering cycle. For example, parsing large data should ideally happen outside of the React render path or in an effect that doesn’t block the initial paint.
- **Using Proper Keys and Managing State Location:** I make sure list items have stable, unique keys so that React’s reconciliation can do its job efficiently (incorrect or changing keys can cause unnecessary re-renders or even remounting of components). I also lift state up or down appropriately; sometimes a piece of state is better managed in a lower-level component to avoid causing a large portion of the app to re-render. In contrast, if two sibling components need to share data and coordinate, lifting that state up to a parent (or using a global store) can avoid excessive prop drilling or inconsistent state.
- **Profiling and Monitoring:** I use React’s Developer Tools Profiler to identify performance bottlenecks – it can show which components re-render frequently and how long renders take. Based on that, I target the worst offenders for optimization. Additionally, using browser dev tools to monitor paint/flame charts helps pinpoint slow functions or layout trashing issues.
- **Leveraging Latest React Features:** I keep an eye on React improvements – for example, React 18 introduced automatic batching of state updates (so multiple state updates in an event loop are batched into one render) which improves performance without extra work. Also features like **`useTransition`** can help with smoothing UI transitions by deferring non-urgent updates. As a senior dev, I ensure the team’s React version is up-to-date to benefit from such improvements.

By combining these strategies – preventing unnecessary updates, cutting down initial bundle size, and using efficient rendering techniques – I can significantly boost a React app’s performance both in how fast it loads and how smoothly it runs.

**Question 6:** *How do you typically handle data fetching and asynchronous operations in React? For example, if you need to call an API when a component mounts or when a certain prop changes, how do you implement that and manage things like loading state or cleanup?*

**Answer:** The primary place to handle data fetching in a React functional component is inside the **`useEffect`** Hook. For example, if I want to fetch data on component mount, I would use **`useEffect(() => { ... fetch logic ... }, [])`** with an empty dependency array so it runs once after the initial render. If the fetch depends on some prop or state (say, a user ID), I include that in the dependency array so it re-runs whenever that value changes. Inside the effect, I typically do something like:

```jsx
useEffect(() => {
let isMounted =true;
setLoading(true);
fetchData(props.id)
      .then(response => {
if (isMounted) {
setData(response);
setLoading(false);
        }
      })
      .catch(error => {
if (isMounted) {
setError(error);
setLoading(false);
        }
      });
return() => {
// Cleanup
      isMounted =false;
    };
}, [props.id]);

```

Here I use a flag **`isMounted`** (or I could use an AbortController with **`fetch`**) to ensure I don’t try to update state if the component has unmounted before the fetch completes. This pattern helps prevent memory leaks or React state warnings. In the above, I’m also managing **loading state** (e.g., showing a spinner while data is loading) and capturing any **errors** to perhaps display an error message or do retry logic.

Key considerations for data fetching in React:

- **Loading and Error States:** I always include local state for **`loading`** and **`error`** conditions. That way the UI can react (show a loader, show an error message) while waiting for the async operation.
- **Dependencies and Avoiding Infinite Loops:** It’s important to set the dependency array correctly. If you call a function inside the effect that is defined outside, you might need to include it in dependencies. If that function is stable (doesn’t change identity each render), it’s fine; if not, you might wrap it in **`useCallback`** or just write the fetch logic directly in the effect. I’m cautious to avoid leaving the dependency array empty when it shouldn’t be, as that can lead to stale data if a prop changes, or conversely including things that change every render (which can cause the effect to run every time – an infinite loop if the effect updates state each run).
- **Cleanup:** As shown, if the effect subscribes to something (like a websocket or an event emitter), I return a cleanup function to unsubscribe on unmount. For fetches, if using the Fetch API, I might use an AbortController’s signal to cancel the request on unmount. If using axios or another library, they often have cancellation mechanisms too. Cleanup ensures we don’t attempt state updates on unmounted components and free up resources.
- **Using external libraries:** In more complex apps, rather than writing a lot of useEffect logic manually, I might use libraries like **React Query (TanStack Query)**, SWR, or Apollo Client (for GraphQL). These provide hooks that manage loading/error state, caching, and re-fetching out of the box, which can greatly simplify code. For example, React Query’s **`useQuery`** hook lets me declare what data I need and handles caching and updating it on changes or intervals.

Overall, I ensure that data fetching logic is robust: it should handle errors, avoid memory leaks, and not degrade performance (e.g., avoid calling the API more times than necessary). By carefully controlling when the effect runs and cleaning up after it, the component remains stable even as asynchronous events resolve.

**Question 7:** *Suppose a component in your React app isn’t updating when its props or state change. What could be some reasons for this, and how would you go about debugging and fixing the issue?*

**Answer:** If a React component isn’t updating as expected in response to prop or state changes, there are a few common culprits to investigate:

- **Incorrect State Update:** Perhaps the state is being mutated directly instead of using the state setter. In React, you must use the updater function from **`useState`** (or **`this.setState`** in classes) to ensure the component knows to re-render. If someone wrote code like **`stateVar.push(newItem)`** or **`stateObject.prop = newValue`** without cloning the object/array, React might not detect the change. The fix is to treat state as immutable: e.g., **`setList([...list, newItem])`** instead of **`list.push`**.
- **Props not actually changing:** The parent component might not be passing new props, or might be passing an object/array that looks new but actually isn’t changed in content. If a parent is re-rendering and passing the same reference (like the same object) each time, the child won’t see a difference. Or the parent might be missing a state update itself. I would use React DevTools to inspect the props that the component is receiving in real time. If the props values are truly not changing when expected, the bug might be upstream (e.g., the logic that triggers new props isn’t running).
- **React Memo/PureComponent optimization preventing update:** If the component is wrapped in **`React.memo`** or if it’s a class that implements **`shouldComponentUpdate`**/**`PureComponent`**, it might be erroneously deciding not to update. For example, if **`React.memo`** is used with a custom comparison that’s wrong, or if it’s a **`PureComponent`** and a prop is a complex object that changed deep inside but still has the same reference, the component will not re-render. The debugging step is to confirm if such an optimization wrapper is present. If so, you might remove it temporarily to see if the issue goes away, and then adjust the comparison or how props are passed (perhaps pass primitive props or different keys to force update).
- **Key Misuse in Lists:** If this component is part of a list and the list is rendered with keys, an incorrect key (e.g., using index or a non-unique value) can cause React to recycle a component instance instead of remounting or updating it with new props. This sometimes manifests as components not updating or showing stale data because React thinks it’s the same component as before due to the key. Ensuring unique, stable keys for list items will fix this.
- **Lifecycle quirks or timing issues:** In some cases, if a state update is happening but an earlier state update hasn’t finished (especially with class components and **`setState`** being async), or multiple state updates are batched, it might appear not to update immediately. With Hooks this is less common, but I might double-check if there’s any asynchronous behavior (like an effect that might overwrite state unexpectedly).

**Debugging approach:** I would start by adding some logging or breakpoints to verify that the code path setting the state or passing the props is actually running. If state updates are involved, I’d log the old and new state values. With React DevTools, I’d inspect the component: check its props and state at runtime to confirm whether they have the expected values when the UI is stale. If the state *has* the correct new value but the UI isn’t reflecting it, that’s a big clue (pointing to maybe a PureComponent/memo issue or something preventing render). If the state isn’t even updating, then I know the issue is with how the state update is triggered.

Once I identify the likely cause, I apply the fix: e.g., if it’s a direct mutation issue, refactor to use setter and immutable updates. If it’s a memoization issue, correct the comparison or remove memo if not needed. If it’s keys, fix the key assignment. After the change, I test again to ensure the component updates as expected. This systematic approach – inspect props/state, isolate potential causes, and verify fixes – usually resolves the majority of “component not updating” problems in React.

**Question 8:** *What is your approach to testing React applications? What kinds of tests do you write for front-end code, and what tools or frameworks do you use to ensure your components and logic work correctly?*

**Answer:** Testing is crucial for front-end code to catch regressions and ensure reliability. I approach it in layers:

- **Unit Tests for Components and Utilities:** I write unit tests for React components using **Jest** as the test runner and **React Testing Library (RTL)** for rendering components. RTL is great because it encourages testing the component output and behavior rather than implementation details. For example, I might render a **`<LoginForm />`** component with RTL, simulate user typing and clicking (using **`fireEvent`** or RTL’s user-event utilities), and then assert that certain outcomes occur (like an error message appears or a callback was called with the right data). I also write pure unit tests for any utility functions or calculations (these might be plain Jest tests without needing React). If I have Redux reducers or custom hooks, those can be unit tested as well (for hooks, React Testing Library has a **`renderHook`** utility via **`@testing-library/react-hooks`**).
- **Integration Tests:** These tests ensure multiple units work together. For example, I might mount a component that includes a couple of child components to test their interaction. With React Testing Library, this is often similar to unit tests (since RTL doesn’t really distinguish, it always mounts the components). But I consider a test more “integration” when it involves external boundaries – like making sure a component properly calls an API service. In such cases, I often mock the API calls (using Jest mocks or libraries like **`msw`** - Mock Service Worker - to simulate a server) and then test the overall data flow (the component triggers a call, loading state shows, then data is rendered).
- **End-to-End (E2E) Tests:** For high-level sanity and the user’s perspective, I use tools like **Cypress** or **Playwright** to run the application in a headless browser and simulate user interactions throughout the app. E2E tests might cover stories like “user can log in and see the dashboard” – clicking through actual UI, navigating pages, and verifying the final outcomes or critical UI elements. These tests give confidence that the whole system (frontend, and possibly backend if using a test environment) works together correctly.

In terms of workflow, I set up tests to run in our CI/CD pipeline so that no broken code gets merged (tests act as a safety net). I aim for a good balance of coverage: critical logic and complex components definitely get unit/integration tests. I also like to add regression tests when we fix bugs – if a bug was found in a component, adding a test for that specific case ensures it doesn’t sneak back in later.

A senior-level mindset to testing React is also about **testing the contract of components rather than implementation**. For example, instead of saying “after clicking this, state X should be true” (which ties to implementation), I’d say “after clicking, I expect to see element Y on the page” or “a function prop was called with value Z”. This way tests remain robust even if we refactor internal state management. By using tools like React Testing Library, which encourages querying the DOM similar to how a user would (via text content or roles), we ensure tests are aligned with user-visible behavior.

Lastly, I keep tests maintainable and run them regularly. Fast feedback from unit tests (which run in seconds) helps during development, and a few longer-running E2E tests can run on CI for full confidence. This multi-level testing approach helps catch issues early and often, making the codebase more robust.

## **General Software Development Questions**

**Question 9:** *You’re developing on a Linux environment, and a React-based web application that runs fine on your local machine is behaving unexpectedly (errors or performance issues) once deployed to a Linux server. How would you troubleshoot and resolve the issues in the Linux environment?*

**Answer:** When something works on my machine but not on a Linux server, I systematically go through possible differences and use debugging tools available on Linux:

1. **Environment Parity:** First, check that the runtime environment is the same. This includes Node.js version (if it’s a Node/React SSR app or build process issue), environment variables, and configuration files. For instance, maybe an API base URL or a feature flag is different in production and causing errors. I’ll verify that all required environment vars are set properly on the server. Also, ensure the build process ran correctly on Linux – sometimes case-sensitivity issues (Windows vs Linux filesystem) or line-ending differences can trip things up.
2. **Logs and Error Messages:** I’ll look at all relevant logs. If it’s a client-side error, I might not have direct logs, but I can use the browser’s console (via the dev tools in a test environment) or attach a remote debugging session if possible. For server-side logs (if there’s a Node server serving the React app or an API server), I’d check those via **`journalctl`** (for systemd services) or log files in **`/var/log`** or wherever the application writes logs. Often the logs will show stack traces or specific error messages (e.g., “Cannot find module X” indicating a dependency issue, or an uncaught exception).
3. **Reproduce and Inspect:** If possible, I try to SSH into the Linux server or a staging box that simulates it. I run diagnostic tools:
    - For performance issues, use **`top`** or **`htop`** to see CPU and memory usage, and **`iotop`** or similar if disk or network might be bottlenecked. This tells me if the app is consuming too much memory or CPU which could point to inefficiencies or leaks.
    - If it’s a crash or error, I might run the service manually (if it’s a Node app, **`node server.js`** in the environment to see direct output, or even attach a debugger/**`gdb`** if it’s a compiled binary crashing).
    - For front-end issues, I ensure the static files are served correctly (check Nginx or Apache configs if relevant, verify that the built JS/CSS files are present in the right directory). I’ve seen cases where the build on Linux failed to include some asset due to a path issue, leading to missing file errors.
4. **Network and Dependencies:** Verify that the server can reach any external services the app needs. For example, if the React app calls a backend API, on the server or network it might be blocked or the URL might be different. I’ll use tools like **`curl`** on the server to hit those endpoints and ensure they resolve. Also verify no firewall or CORS issues in production.
5. **Comparative Debugging:** Compare the behavior step-by-step. If there’s an error message in the browser in production, I might add temporary debug info or use a monitoring tool (like Sentry for front-end error tracking) to capture stack traces. If the issue is performance (e.g., slower on server), maybe the production build is using a different config – I’ll ensure that the React app is built in production mode (which enables optimizations). If it was accidentally running a dev build on the server, that could slow it down significantly.
6. **Linux-specific Checks:** Linux is case-sensitive with file paths, so ensure that import statements in React (like importing images or other files) match the exact case of filenames. A common bug that appears only on Linux is importing **`./MyComponent`** when the file is actually **`myComponent.js`** (works on Windows, fails on Linux). Also check file permissions on the server if the app needs to read/write files.

Once I’ve identified the likely cause, I’ll fix it. For example, if logs show an out-of-memory error, maybe the app needs more memory or has a memory leak – I’d profile memory usage or increase resources. If it’s a missing dependency, I’ll install it or adjust the build. If it’s an environment config, correct the variable or update documentation so it doesn’t happen again. After applying the fix, I’d redeploy and closely monitor the Linux server’s behavior (perhaps via the logs and using **`watch`** on resource usage) to confirm the issue is resolved. This methodical approach ensures I cover differences in environment, code, and infrastructure to pinpoint why “it works on my machine” but not on the server.

**Question 10:** *Continuous Integration/Continuous Deployment (CI/CD) is mentioned in the job requirements. Can you describe how you would set up a CI/CD pipeline for a software project (for example, this React application)? What stages would you include and what’s accomplished in each stage?*

**Answer:** A CI/CD pipeline is a series of automated steps that software goes through on every change, to build, test, and deploy the application reliably. For a React-based project (and generally most software projects), I would set up the pipeline with stages like the following:

- **Build Stage:** As soon as code is pushed or a pull request is opened, the pipeline kicks off by installing dependencies and building the application. For a React app, this might mean running **`npm ci`** (clean install) and then **`npm run build`** to produce an optimized production build. If it’s a full-stack project, this stage might also compile backend code or create Docker images. The goal is to verify that the code compiles successfully and to package it for the next steps. If the build fails (syntax errors, failed type-checking, etc.), the pipeline stops and developers are alerted.
- **Test Stage:** Once the build is successful, I run automated tests. This includes unit tests and integration tests (for example, using Jest for JavaScript tests). In a CI environment, I’d likely run something like **`npm test -- --ci`** to run the test suite and output results. If there are any failing tests, the pipeline fails here to prevent bad code from moving forward. This stage can also include other quality checks: linting (ensuring code style and catching simple errors via ESLint), type checks (TypeScript compile, if applicable), and maybe security scans (using a tool like npm audit or Snyk to detect vulnerable dependencies). In a senior role, I ensure test coverage is sufficient and perhaps enforce a coverage threshold in CI, so if coverage drops below a certain percentage due to a change, the pipeline can warn or fail.
- **Integration/Deployment Stage:** After tests pass, the next stage is to deploy the new build. In a typical scenario, I would first deploy to a **staging environment**. This could mean pushing a Docker container to a registry and then deploying it to a staging server or Kubernetes cluster, or uploading the static build to a staging S3 bucket for front-end, etc. The idea is to integrate the code into a production-like environment. If using infrastructure-as-code, this stage might also run Terraform/Ansible scripts to ensure the environment is correct. Automated smoke tests or sanity checks can run here to verify the deployment (for example, ping an API endpoint or load the front-end to make sure it’s serving). If everything looks good on staging, then a promotion to production can be either automatic or manual (depending on the team’s practices). For full CD, it might automatically deploy to production, perhaps with a canary or blue-green deployment strategy to minimize risk.
- **Post-Deployment Stage:** After deployment, I like to include steps for notifications and monitoring. The pipeline can send a Slack message or email that deployment succeeded (or failed). Also, if we have monitoring hooks (like hitting a health-check endpoint repeatedly, or running end-to-end tests on the deployed environment), those can be part of the pipeline or triggered right after. Some pipelines also include a step to **tag the release** in version control or update a change log.

In practice, I often use tools like **GitHub Actions**, **GitLab CI**, or **Jenkins** to define these stages in a YAML file or through a UI. Each stage may run in a fresh environment (container) with required dependencies (Node, etc.). I also configure the pipeline to run in parallel where possible – for instance, run front-end and back-end tests in parallel to reduce total time, or build multiple combinations if needed (like different OS or Node versions if that’s a requirement).

The key benefits and goals I ensure with CI/CD are:

- **Consistency:** Every code change goes through the same process, reducing “it works on my machine” issues.
- **Quality Assurance:** By the time code is deployed, it’s already built and tested automatically, which catches bugs early.
- **Speed and Iteration:** Automating the deployment means developers can merge code frequently (continuous integration) and see it in a test or production environment quickly (continuous deployment). This fosters an iterative approach and quick feedback from users or testers.
- **Rollback Plan:** Although not a stage per se, I ensure our deployment approach allows easy rollback if something goes wrong in production. That might mean keeping the previous version’s artifacts around or using deployment strategies where we can quickly switch back.

Overall, a solid CI/CD pipeline is like a safety net and an assembly line: as a senior developer I’d both contribute to its design and also trust it to handle the repetitive tasks, so the team can focus on writing code and delivering features confidently.

**Question 11:** *Git and version control workflows are important. Can you describe a Git workflow that you have used in a team environment (for example, Git Flow, trunk-based development, etc.) and how you handle tasks like feature development, code reviews, and deployment using Git?*

**Answer:** I’ve used a few different Git workflows, and the choice often depends on team size and release strategy. Let me describe one common approach I’ve used – a **Feature Branch workflow with Pull Requests**, which is somewhat a blend of Git Flow and trunk-based ideas:

- **Main Branches:** We maintain a **`main`** branch (sometimes called **`master`**) which always contains the code ready for production. In some cases, we also have a **`develop`** branch that is the integration branch for the next release (that’s more Git Flow style). Lately, many teams (including ones I’ve led) prefer a simpler model with just a **`main`** (production) and use short-lived feature branches.
- **Feature Branches:** For any new feature or bug fix, I create a separate branch off of **`main`** (e.g., **`feature/add-user-login`**). Work is done on that branch in commits, which I try to keep focused (perhaps one commit per logical change or per day of work). I also frequently sync with **`main`** if other changes are merged, to minimize drift.
- **Commits and Messages:** I emphasize writing clear commit messages (present-tense, describing what the change does, e.g., “Add debounce utility for search input to reduce API calls”). This makes code review and future debugging easier. Small, frequent commits are preferred, as they’re easier to manage and revert if needed.
- **Push and Pull Request:** Once the feature is complete (or at a good checkpoint), I push the branch to the remote (GitHub/GitLab) and open a Pull Request (PR) to merge into **`main`** (or **`develop`** if using that intermediate). The PR process is where code review happens. Senior developers (including myself) will review others’ PRs for design, correctness, and style, and vice versa. We might use required approvals in GitHub to ensure at least one or two peers review each change.
- **Continuous Integration Checks:** The PR will trigger the CI pipeline (like we discussed earlier). So automated tests and linters run on the feature branch. The PR won’t be merged until these checks pass, which enforces that the branch is in a healthy state.
- **Merge Strategy:** After approval and passing checks, we merge the PR. Depending on team preference, we might **squash merge** (combine all those feature branch commits into one commit on **`main`** for cleanliness) or do a normal merge commit. In some projects, we use rebase to maintain a linear history (particularly in open-source projects or when we don’t want merge commits cluttering history).
- **Handling Releases/Deployments:** If we have a separate **`release`** or **`develop`** branch, we periodically merge develop into main for a release (that’s more Git Flow – with version tags, etc.). In a simpler trunk-based approach, each merge to **`main`** could automatically trigger a deployment to a staging environment, and when we’re ready to go live, we tag a release on **`main`** and deploy to production. In either case, we use Git tags (like **`v1.2.0`**) to mark official release points. Hotfixes (urgent bug fixes on production) are typically done by branching off the **`main`** (or a release tag), fixing the bug, and then merging back into **`main`** (and also cherry-picking into **`develop`** if that branch exists).
- **Branch Protection:** We usually protect the main branches (main/develop) so you can’t push directly to them. This ensures everything goes through PRs and CI. That adds a safety net and enforces the workflow.

I’ve also worked with **trunk-based development**, where developers merge small changes into **`main`** very frequently (even multiple times a day) behind feature flags. This works well in continuous deployment environments. Key to that is having great automated tests and CI so that **`main`** is always stable.

In summary, the workflow I use promotes collaboration (via code reviews), ensures quality (via CI checks), and keeps a clean history. By isolating feature development in branches, we reduce interference between developers, but by merging back regularly, we avoid huge merge conflicts or divergence. It’s a balance that allows for both parallel work and integration. As a senior dev, I might also mentor others in writing good commit messages and PR descriptions, because those practices make the workflow smooth for the whole team.

**Question 12:** *In JavaScript, what is a debounce function and how would you implement one? For example, if you have a search box that triggers an API call on each keystroke, how could you use debouncing to improve performance?*

**Answer:** **Debouncing** is a programming technique used to ensure that a function isn’t called too frequently. In the context of a search box, without debouncing, if a user types quickly, you might fire off an API request on every single keystroke, which could overwhelm the server or cause race conditions with outdated results. Debouncing will delay the execution of the function until a certain amount of time has passed without any new trigger events. In other words, it *groups rapid calls into one*.

Here’s how I would implement a debounce function in JavaScript:

1. I’d create a function (let’s call it **`debounce`**) that takes two arguments: the actual callback function we want to throttle (e.g., the API call trigger) and a delay (e.g., 300 milliseconds).
2. Inside **`debounce`**, we maintain a timer variable (closure-scoped) that will hold a **`setTimeout`** ID.
3. The **`debounce`** function returns a new function (this is the function that will be called on every keystroke, for instance). In that returned function, we do the following:
    - If a previous timeout is still pending (i.e., the user is in the middle of typing and hasn’t paused for 300ms yet), we **`clearTimeout`** to cancel that scheduled call.
    - Then we set a new timeout with the given delay. When that timeout completes (i.e., the user has stopped typing for 300ms), it will call the original callback function (and typically we pass along any arguments from the event).
4. This way, if the user keeps typing, the timer keeps resetting and the actual API call function only runs after they pause briefly.

In code, a simple implementation could be:

```jsx
functiondebounce(func, delay) {
let timeoutId;
returnfunction(...args) {
if (timeoutId) {
clearTimeout(timeoutId);
    }
    timeoutId =setTimeout(() => {
func(...args);
    }, delay);
  };
}

```

If I use this for a search input’s **`onChange`** handler:

```jsx
const handleSearch =debounce((query) => {
// API call for search with query
},300);

```

Now, as the user types, **`handleSearch`** is invoked but it will only actually call the API 300ms after the user stops typing. If the user presses another key before 300ms passes, the previous call is canceled and a new timer starts.

The benefit is improved performance and avoiding unnecessary calls. It also provides a better user experience because it waits until the user has finished a burst of typing rather than potentially showing interim results that quickly update again.

As a senior developer, I’m mindful of using debouncing (or its cousin, **throttling**) in scenarios like:

- Search inputs (to limit API calls).
- Window resize or scroll events (which can fire dozens of times per second; debouncing can update a layout or perform calculations after the user has finished resizing).
- Button mash prevention (debounce a function so it can’t be called repeatedly within a short time).

This pattern of wrapping a function to control its execution is very powerful for controlling load and behavior in a UI. In fact, many utility libraries like Lodash provide a **`debounce`** function out of the box, which I could use instead of writing my own. But it’s important to understand how it works under the hood, as I demonstrated, to use it effectively.

**Question 13:** *On your resume, you mention using design patterns like Factory and Adapter. Can you explain one of those design patterns (Factory or Adapter) and give an example of how you’ve applied it in a project?*

**Answer:** Certainly. I’ll explain the **Factory Pattern**, as it’s something I’ve used commonly. The Factory Pattern is a creational design pattern that provides an interface for creating objects in a superclass, but allows subclasses or specific classes to alter the type of objects that will be created. In simpler terms, instead of instantiating classes directly in your code (**`new SomeClass()`**), you call a factory method that returns an instance of an appropriate class for you. This is useful when you have a family of related classes and you want to abstract the selection logic away from the client code.

**How it works:** You might have an abstract class or interface (Product) and multiple concrete subclasses (ConcreteProductA, ConcreteProductB, etc.). The factory class (or method) decides which subclass to instantiate based on some input or configuration, and returns an object of type Product. The calling code just knows it got a Product and doesn’t care which one specifically.

**Example from my experience:** In one project, we were building an observability platform that could send alerts to different channels (email, Slack, PagerDuty, etc.). We implemented a Factory pattern for the “Notifier” component. We had an interface **`Notifier`** with a method **`send(notification)`**. Then we had classes like **`EmailNotifier`**, **`SlackNotifier`**, **`PagerDutyNotifier`** each implementing **`Notifier`** differently. We wrote a factory method like **`NotifierFactory.createNotifier(channelType)`** which would internally do something like:

```python
if channelType =='email':
return EmailNotifier(...)
elif channelType =='slack':
return SlackNotifier(...)
elif channelType =='pagerduty':
return PagerDutyNotifier(...)

```

This factory took care of deciding which notifier to use based on the input (perhaps configured per alert). The rest of the system just called **`NotifierFactory.createNotifier(config.type)`** and then used the returned object to **`send()`**. This made it easy to add new notification channels in the future — we’d just create a new class and update the factory, without touching the high-level logic that triggers notifications. It also made testing easier: we could inject a mock notifier via the factory if needed.

Another quick example: I worked on a system orchestrating different cloud providers. We had a **`CloudProviderFactory`** that given a provider name (“AWS”, “GCP”, “Azure”) would return an object that implemented a common interface for managing resources. The calling code didn’t need **`if/else`** all over the place for each cloud; it just asked the factory and got the right object for the job.

By contrast, the **Adapter Pattern** (just to briefly mention) is about taking an interface that a client expects and adapting another interface to match it. I used an Adapter when integrating a new logging library into an existing system that expected a certain log interface. Instead of rewriting all the code, I wrote an Adapter that took calls from our system (say, **`log.warn("message")`**) and translated them to the new library’s method calls under the hood. This allowed us to plug in the new component without changing the whole codebase.

In summary, design patterns like Factory and Adapter are tools I use to write flexible, maintainable code. The Factory pattern helps centralize object creation logic and makes it easy to extend, and I’ve applied it in scenarios where the system needs to decide between multiple implementations at runtime.

**Question 14:** *You have experience with microservices and distributed systems. What are some challenges you’ve faced in monitoring or debugging a microservices-based application, and how did you address them? For instance, how would you trace a request that spans multiple services to find where a slowdown or error is occurring?*

**Answer:** In a microservices architecture, one request from a user might travel through numerous services (for example, an API gateway -> service A -> service B -> database, etc.). Monitoring and debugging in this setup is challenging because:

- There isn’t a single log or single place to see the whole picture; information is spread across many services.
- Failures can be partial (one service down or slow) and can cascade or cause timeouts elsewhere.
- It’s hard to trace a unique transaction through multiple hops without a strategy.

**Challenges and solutions:**

- **Distributed Tracing:** One of the most powerful techniques I’ve used is implementing distributed tracing. Essentially, I propagate a **correlation ID or trace ID** with each request. For example, when a request comes into Service A (perhaps carrying an HTTP header like **`X-Trace-ID`**), if it doesn’t have one, Service A generates a unique ID and passes it along to any calls it makes to Service B (often via that same header). Service B does the same to Service C, etc. Now, all logs or monitoring data associated with that initial request can be tagged with the same ID. I’ve used **OpenTelemetry** and Jaeger to handle this in code. With tracing in place, I can use a tracing UI (Jaeger, Zipkin, or commercial APM tools) to see a timeline of the request across services – e.g., Service A took 50ms, Service B took 200ms (maybe 180ms of that was a database call), etc. If a request is slow or fails, this pinpoint which service or even which function call was the bottleneck.
- **Centralized Logging:** Alongside tracing, I set up centralized logging (using tools like Elasticsearch/ELK stack or hosted services). Each service writes logs to a central store, and each log entry includes the service name, severity, and that correlation ID. Then I can search the logs easily. If an error happened with a certain user request, I search by the correlation ID and see a combined view of logs from all services for that operation. This is much faster than SSHing into each box or checking multiple log files individually. In one situation, this helped me trace a bug where an auth token was getting lost between services – the logs in one service showed it received token X, but logs in the next service showed a null token; the gap pointed to an issue in an API gateway not forwarding a header.
- **Metrics and Alerts:** Each microservice reports metrics (via Prometheus, for example). I ensure we have dashboards and alerts for things like error rates per service, request latency, memory/CPU usage, etc. For debugging performance problems, having a **timeline of latency** for each service is useful. If we see that service B’s latency spiked at 3pm, and that correlates with overall user requests slowing down, we know where to zoom in. We might also discover that it was due to an external call or DB query in service B. I’ve used tools like Grafana to set up such dashboards. A specific challenge we solved was a chain of timeouts: Service A would timeout waiting for B after 2 seconds, but B had a 5-second timeout waiting on C, so A would always cut out early. By reviewing metrics and traces, we identified the mismatched timeouts and fixed them to be consistent and properly staggered (A’s timeout > B’s > C’s, etc.).
- **Resilience Patterns:** While not exactly “monitoring”, part of addressing microservice issues is building resilience: using **circuit breakers** (via libraries like Hystrix or Resilience4j) so if Service B is down, Service A fails fast or returns a fallback rather than hanging; implementing retries with backoff for transient failures; and load balancing. In practice, we had an issue where one slow downstream service caused request threads to pile up in upstream services, eventually exhausting resources. We introduced a circuit breaker so that if that downstream was unresponsive, the upstream would stop waiting on it after a short time and return a graceful error, preventing a cascade failure.
- **Debugging approach:** If I suspect a particular service is the culprit (say service B), I’ll zoom into its logs and maybe even do a live debug on a staging instance. But often it’s the interplay that’s the issue. That’s where **trace** logs at the debug level can help if enabled temporarily – capturing the input/output of each service for a problematic request. In one case, to debug data inconsistency, I had to correlate user IDs across three services and see where a field got dropped; logging each step with the trace ID helped find the service and even the code path causing it.

In summary, the key to monitoring and debugging microservices is **observability** – having the right hooks (traces, logs, metrics) in place to see what’s happening in the system as a whole. By using distributed tracing to tie events together and centralizing information, I turn the microservice complexity from a black box into something navigable. As a result, when an issue like a slowdown occurs, I can follow the request path through services and quickly zero in on the bottleneck or failure point, then address it either by fixing the bug or improving the system’s resilience to that class of failure.

**Question 15:** *Imagine you discover a piece of code in the project that is running inefficiently with O(n²) complexity (for example, a double nested loop processing a large array). This is causing performance issues as the data grows. How would you approach optimizing this code?*

**Answer:** When faced with an **inefficient O(n²) algorithm**, my approach is systematic:

1. **Understand the Code and Confirm the Bottleneck:** First, I ensure that this code is indeed the performance bottleneck. I might use profiling tools or timing logs to measure how long this part takes with large inputs. Assuming it is the culprit, I carefully read what the double loop is doing to fully grasp the problem it’s solving. Sometimes nested loops are necessary, but often they indicate things like duplicate work or brute-force checks that could be optimized.
2. **Look for a More Efficient Algorithm:** Often, an O(n²) loop is doing something like comparing all pairs, searching within an array repeatedly, etc. I ask: can this be done in O(n log n) or O(n) with a different approach? Common strategies:
    - **Use a Hash Set or Map:** If the double loop is checking for duplicates or membership (one loop inside another to search), using a hash set can cut that to linear time. For example, if we’re removing duplicates from a list by nested loops, switching to using a Set to track seen elements eliminates the inner loop.
    - **Sorting:** If the task is something like finding intersections between two lists or pairs that fulfill a condition, sorting the data can reduce complexity. Sorting is O(n log n), and then a single loop or two-pointer technique can sometimes replace nested loops.
    - **Break out of loops early:** Sometimes the O(n²) arises from worst-case scenarios but we can break out earlier. For example, if we’re looking for something and find it, we don’t need to continue the inner loop.
    - **Caching results:** If the inner loop is performing a calculation that gets repeated, store those results. Dynamic programming is an example where caching subproblem results avoids exponential blow-ups. In this context, maybe it’s not DP per se, but memoization of expensive computations could help.
3. **Consider Data Structures:** The choice of data structure can drastically change complexity. For instance, if the code is checking for connections between entities using nested loops, maybe using an adjacency list or index for lookups will help. I recall optimizing a nested loop that was checking every object’s field against every other for a condition – replacing it with a Map from field value to objects made it near O(n) because you directly find matches.
4. **Implement the Change and Test:** After deciding on an approach (say, replacing nested loops with a hash map lookup), I’d implement it carefully. Ensure that the new method still produces the correct result for all cases (including edge cases). Then test performance again with large input to verify the improvement. For example, if a dataset of 10,000 items took 20 seconds before, after optimization maybe it’s down to 0.5 seconds – I’d confirm that kind of gain.
5. **Iterate if Necessary:** If one optimization isn’t enough (maybe data is even larger, or the problem is inherently complex), I consider more radical changes – can we parallelize the work (multithreading or splitting the data and using web workers, etc.), or offload to a specialized system (database or an asynchronous batch process) so it’s not blocking the main flow? In one scenario, an O(n²) piece of code was building a report in memory; we solved it by streaming the processing and using a database join instead of in-memory comparisons.
6. **Example to illustrate:** Suppose we have an array of records and we need to find all duplicate entries based on a key. A naive approach might be two nested loops comparing each pair of records (O(n²)). An optimized approach is to use a hash set: one pass through the array, and for each record check if we’ve seen its key in the set already. If yes, it’s a duplicate; if no, add it to the set. That turns it into O(n) on average. I would implement that and remove the double loop. Another example: if we were checking every pair for some relationship (like two numbers summing to X), a common optimization is sorting the list and then using two pointers from both ends to find pairs in O(n) instead of O(n²).

Throughout this process, I also consider the trade-offs – e.g., using a hash map uses more memory, so I ensure that’s acceptable. As a senior dev, I not only fix the code but also comment or document the reasoning so future maintainers understand the change. In code review, I’d explain: “Replaced nested loops with hash map lookup to improve worst-case complexity from quadratic to linear.” Finally, I verify that the overall user experience or system performance issue is resolved by this optimization, and keep an eye on it in production if needed (maybe using monitoring to ensure the performance is now within targets).

# 

#