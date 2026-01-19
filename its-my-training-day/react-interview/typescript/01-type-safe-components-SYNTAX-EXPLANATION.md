# Syntax Explanation: `useTemperatureSensor` Hook (Lines 144-307)

This document explains the TypeScript and React syntax used in the `useTemperatureSensor` custom hook.

## Function Signature (Lines 145-148)

```typescript
export function useTemperatureSensor(
  equipmentId: string,
  options: SensorHookOptions = {}
): UseTemperatureSensorReturn {
```

### Breakdown:
- **`export function`**: Exports the function for use in other modules
- **`useTemperatureSensor`**: Function name following React hook naming convention (starts with "use")
- **`equipmentId: string`**: Required parameter with explicit string type annotation
- **`options: SensorHookOptions = {}`**: Optional parameter with:
  - Type: `SensorHookOptions` (extends `QueryOptions` with additional properties)
  - Default value: `{}` (empty object) - uses object destructuring defaults if not provided
- **`: UseTemperatureSensorReturn`**: Return type annotation - the hook returns an object matching this interface

---

## Destructuring with Defaults (Lines 149-156)

```typescript
const {
  realtime = false,
  threshold,
  transform,
  enabled = true,
  retry = 3,
  ...queryOptions
} = options;
```

### Syntax Elements:

1. **Object Destructuring**: Extracts properties from `options` object
2. **Default Values**: 
   - `realtime = false` - if `realtime` is undefined, defaults to `false`
   - `enabled = true` - if `enabled` is undefined, defaults to `true`
   - `retry = 3` - if `retry` is undefined, defaults to `3`
3. **Optional Properties**: `threshold` and `transform` can be undefined
4. **Rest Operator (`...queryOptions`)**: Collects all remaining properties from `options` that weren't explicitly destructured into a new object

**Example:**
```typescript
// If called with:
useTemperatureSensor('eq-001', { realtime: true, threshold: 50, staleTime: 1000 })

// Then:
// realtime = true (from options)
// threshold = 50 (from options)
// transform = undefined (not provided)
// enabled = true (default)
// retry = 3 (default)
// queryOptions = { staleTime: 1000 } (rest of properties)
```

---

## useState with Generic Type (Lines 158-166)

```typescript
const [state, setState] = useState<QueryState<TemperatureReading>>({
  data: null,
  error: null,
  isLoading: true,
  isError: false,
  isSuccess: false,
  isFetching: false,
  fetchedAt: null,
});
```

### Syntax Breakdown:

1. **Array Destructuring**: `[state, setState]` - React hook pattern
   - `state`: Current state value
   - `setState`: Function to update state

2. **Generic Type Parameter**: `<QueryState<TemperatureReading>>`
   - `useState<T>` - TypeScript generic syntax
   - `QueryState<TemperatureReading>` - The state shape is `QueryState` where `T` is `TemperatureReading`
   - This ensures `state.data` is typed as `TemperatureReading | null`

3. **Initial State Object**: Matches the `QueryState<TemperatureReading>` interface:
   - All properties initialized with appropriate default values
   - `data: null` - no data initially
   - `isLoading: true` - starts in loading state

---

## Multiple useState Hooks (Lines 168-169)

```typescript
const [alerts, setAlerts] = useState<Alert[]>([]);
const [isRealtime, setIsRealtime] = useState(false);
```

### Explanation:

1. **`useState<Alert[]>([])`**: 
   - Generic type `Alert[]` means array of `Alert` objects
   - Initial value: empty array `[]`
   - TypeScript infers `alerts` as `Alert[]` and `setAlerts` as `React.Dispatch<React.SetStateAction<Alert[]>>`

2. **`useState(false)`**: 
   - TypeScript infers type from initial value
   - `isRealtime` is `boolean`, `setIsRealtime` is `React.Dispatch<React.SetStateAction<boolean>>`

---

## useCallback Hook (Lines 171-234)

```typescript
const fetchData = useCallback(async (): Promise<void> => {
  // ... function body
}, [equipmentId, enabled, threshold, transform]);
```

### Syntax Elements:

1. **`useCallback`**: Memoizes the function to prevent recreation on every render
2. **`async (): Promise<void>`**: 
   - `async` - asynchronous function
   - `(): Promise<void>` - returns a Promise that resolves to void (no return value)
3. **Dependency Array `[equipmentId, enabled, threshold, transform]`**:
   - Function is recreated only when these values change
   - Prevents unnecessary re-renders of components using this hook

### Inside fetchData (Lines 172-233):

```typescript
if (!enabled) return;
```

**Early Return Pattern**: Exits function early if disabled, preventing unnecessary work.

```typescript
setState(prev => ({ ...prev, isFetching: true }));
```

**Functional Update Pattern**:
- `prev =>` - receives previous state
- `{ ...prev, isFetching: true }` - spread operator creates new object with updated property
- Ensures we're working with latest state value

```typescript
const response = await fetch(`/api/equipment/${equipmentId}/sensors/temperature`);
```

**Template Literal**: Uses backticks and `${}` for string interpolation.

```typescript
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
```

**Error Throwing**: Throws error if HTTP request failed.

```typescript
const json = await response.json();
let data: TemperatureReading = json.data;
```

**Type Assertion**: 
- `let` allows reassignment (needed for transform)
- `: TemperatureReading` - explicit type annotation
- Assumes `json.data` matches `TemperatureReading` structure

```typescript
if (transform) {
  data = transform(data) as TemperatureReading;
}
```

**Conditional Transform**:
- Checks if `transform` function exists (not undefined)
- `transform(data)` - calls transform function
- `as TemperatureReading` - type assertion (tells TypeScript the result is `TemperatureReading`)

```typescript
setState({
  data,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
  isFetching: false,
  fetchedAt: Date.now(),
});
```

**Object Shorthand**: `data` is equivalent to `data: data` when property name matches variable name.

```typescript
const alert: Alert = {
  id: `alert-${Date.now()}`,
  equipmentId,
  sensorId: 'temp-001',
  // ... more properties
};
```

**Object Literal with Type Annotation**: Creates object matching `Alert` interface.

```typescript
setAlerts(prev => [...prev, alert]);
```

**Array Spread for Immutability**:
- `[...prev]` - creates new array with all previous items
- `alert` - adds new alert to end
- React requires new array reference to detect state change

```typescript
catch (err) {
  const error: ApiError = {
    code: 'FETCH_ERROR',
    message: err instanceof Error ? err.message : 'Unknown error',
    statusCode: 500,
  };
```

**Error Handling**:
- `catch (err)` - catches any thrown error
- `err instanceof Error` - type guard to check if error is Error instance
- Ternary operator: `condition ? valueIfTrue : valueIfFalse`

```typescript
setState(prev => ({
  ...prev,
  error,
  isLoading: false,
  isError: true,
  isFetching: false,
}));
```

**Partial State Update**: Only updates specified properties, keeps others from `prev`.

---

## useEffect for WebSocket (Lines 237-286)

```typescript
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
    // ... update state
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
```

### Syntax Breakdown:

1. **`useEffect(() => { ... }, [deps])`**: 
   - Runs effect when dependencies change
   - Returns cleanup function

2. **Early Return**: `if (!realtime || !state.isSuccess) return;`
   - Exits early if conditions not met
   - Prevents WebSocket creation

3. **WebSocket API**:
   - `new WebSocket(url)` - creates WebSocket connection
   - Event handlers: `onopen`, `onmessage`, `onerror`, `onclose`

4. **Arrow Functions as Event Handlers**:
   ```typescript
   ws.onmessage = (event: MessageEvent<string>) => { ... }
   ```
   - `event: MessageEvent<string>` - typed event parameter
   - `string` generic means message data is string

5. **JSON Parsing**:
   ```typescript
   const data: TemperatureReading = JSON.parse(event.data);
   ```
   - `JSON.parse()` - converts string to object
   - Type assertion assumes parsed data matches `TemperatureReading`

6. **Cleanup Function**:
   ```typescript
   return () => {
     ws.close();
   };
   ```
   - Runs when component unmounts or dependencies change
   - Closes WebSocket to prevent memory leaks

7. **Dependency Array**: `[realtime, state.isSuccess, equipmentId, threshold, transform]`
   - Effect re-runs when any dependency changes
   - Recreates WebSocket connection if needed

---

## useEffect for Initial Fetch (Lines 289-291)

```typescript
useEffect(() => {
  fetchData();
}, [fetchData]);
```

**Simple Effect**:
- Calls `fetchData` when component mounts
- Re-runs if `fetchData` function reference changes (which happens when its dependencies change)

---

## useCallback for Helper Functions (Lines 293-299)

```typescript
const clearAlerts = useCallback(() => {
  setAlerts([]);
}, []);

const refetch = useCallback(async () => {
  await fetchData();
}, [fetchData]);
```

### Explanation:

1. **`clearAlerts`**:
   - Empty dependency array `[]` - function never changes
   - Resets alerts array to empty

2. **`refetch`**:
   - Depends on `fetchData` - recreates when `fetchData` changes
   - `async () => { await fetchData() }` - async wrapper function

---

## Return Statement (Lines 301-307)

```typescript
return {
  ...state,
  alerts,
  clearAlerts,
  isRealtime,
  refetch,
};
```

### Syntax:

1. **Object Spread**: `...state`
   - Spreads all properties from `state` object into return object
   - Includes: `data`, `error`, `isLoading`, `isError`, `isSuccess`, `isFetching`, `fetchedAt`

2. **Property Shorthand**: `alerts`, `clearAlerts`, etc.
   - Equivalent to `alerts: alerts`
   - Only works when property name matches variable name

3. **Return Type**: Matches `UseTemperatureSensorReturn` interface
   - TypeScript ensures all required properties are returned
   - Provides type safety for consumers of the hook

---

## Key TypeScript Patterns Used

### 1. **Generic Types**
```typescript
useState<QueryState<TemperatureReading>>
```
- Provides type safety for state structure

### 2. **Type Assertions**
```typescript
data = transform(data) as TemperatureReading;
```
- Tells TypeScript the type when it can't infer it

### 3. **Type Guards**
```typescript
err instanceof Error ? err.message : 'Unknown error'
```
- Runtime type checking for safe property access

### 4. **Optional Properties**
```typescript
options: SensorHookOptions = {}
```
- Properties can be undefined, handled with defaults

### 5. **Rest/Spread Operators**
```typescript
...prev  // spread
...queryOptions  // rest
```
- Create new objects/arrays (immutability)
- Collect remaining properties

### 6. **Template Literals**
```typescript
`/api/equipment/${equipmentId}/sensors/temperature`
```
- String interpolation with variables

---

## React Patterns Used

### 1. **Custom Hook Pattern**
- Function starting with "use"
- Uses other hooks internally
- Returns state and functions for component use

### 2. **Memoization**
- `useCallback` prevents function recreation
- Reduces unnecessary re-renders

### 3. **Effect Cleanup**
- Returns cleanup function from `useEffect`
- Prevents memory leaks (closes WebSocket)

### 4. **Functional State Updates**
- `setState(prev => ({ ...prev, ... }))`
- Ensures working with latest state

### 5. **Immutable Updates**
- Always creates new objects/arrays
- Required for React to detect changes

---

## Interview Talking Points

1. **Type Safety**: "This hook uses TypeScript generics to ensure type safety throughout, preventing runtime errors."

2. **Performance**: "I use `useCallback` to memoize functions and prevent unnecessary re-renders of consuming components."

3. **Error Handling**: "The hook handles both HTTP errors and WebSocket errors gracefully, with proper error state management."

4. **Real-time Updates**: "The WebSocket integration provides real-time updates while maintaining the same state structure as the initial fetch."

5. **Cleanup**: "The cleanup function in the WebSocket effect ensures connections are properly closed, preventing memory leaks."

6. **Flexibility**: "The hook accepts optional transform functions and thresholds, making it reusable across different sensor types."

