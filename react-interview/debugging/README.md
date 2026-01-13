# React Debugging Techniques - Interview Deep Dive

Production-ready debugging strategies for React applications using DevTools, profiling, and error tracking.

## 🎯 Key Tools

- **React DevTools**: Component inspection, profiling
- **Chrome DevTools**: Network, performance, memory
- **Error Tracking**: Sentry, DataDog
- **Logging**: Structured logging with context

---

## React DevTools

### Component Inspector

**Viewing component props/state**:
- Open React DevTools
- Select component in tree
- View props, hooks, rendered by

**Searching components**:
- Cmd/Ctrl + F in DevTools
- Search by component name, prop value, or text content

### Profiler

**Recording performance**:
1. Click "Profiler" tab
2. Click record (red circle)
3. Perform action
4. Stop recording
5. Analyze flame graph

**What to look for**:
- Components taking > 16ms to render
- Unnecessary re-renders (same props/state)
- Deep component trees

---

## Performance Debugging

### Finding Unnecessary Re-renders

```typescript
// Add to component
useEffect(() => {
  console.log('Component rendered', { props, state });
});

// Use React DevTools "Highlight updates"
// Settings → Profiler → Highlight updates when components render
```

**Common causes**:
- Inline object/array props: `<Component config={{}} />`
- Inline functions: `<Component onClick={() => {}} />`
- Missing memoization: Expensive calculations on every render
- Context updates: All consumers re-render

### Memory Leaks

**Common causes**:
- Event listeners not cleaned up
- Timers not cleared
- WebSocket connections not closed
- Component unmounted but async operation continues

```typescript
// ❌ BAD: Memory leak
useEffect(() => {
  const interval = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  // Missing cleanup!
});

// ✅ GOOD: Cleanup
useEffect(() => {
  const interval = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Detecting memory leaks**:
1. Chrome DevTools → Performance
2. Take heap snapshot
3. Perform action (mount/unmount component)
4. Take another snapshot
5. Compare snapshots (should show memory released)

---

## Production Debugging

### Error Boundaries with Sentry

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <YourApp />
    </Sentry.ErrorBoundary>
  );
}
```

### Structured Logging

```typescript
// Add context to all logs
const logger = {
  error: (message: string, context?: object) => {
    console.error('[ERROR]', message, {
      ...context,
      userId: getUserId(),
      timestamp: Date.now(),
      route: window.location.pathname,
    });

    // Send to logging service
    sendToDataDog({ level: 'error', message, ...context });
  },
};

// Usage
logger.error('Failed to load compliance data', {
  controlId: 'AC-1',
  error: error.message,
});
```

---

## 🔑 Key Techniques

- ✅ React DevTools for component inspection
- ✅ Profiler for performance bottlenecks
- ✅ Chrome DevTools for memory leaks
- ✅ Error boundaries with Sentry
- ✅ Structured logging with context
- ✅ Source maps for production debugging

Good luck with your Adobe TechGRC interview! 🚀
