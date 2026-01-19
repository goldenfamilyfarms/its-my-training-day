# Error Handling & Error Boundaries - Interview Deep Dive

Production-grade error handling patterns for React applications, covering error boundaries, graceful degradation, and error recovery strategies.

## 🎯 Why Error Handling Matters

In GRC/compliance applications, errors can have serious consequences:
- **Compliance data loss**: Failed evidence uploads
- **Audit trail gaps**: Unrecorded compliance actions
- **User trust**: Blank screens damage credibility
- **Regulatory risk**: System failures during audits

**Key Principle**: Fail gracefully, log thoroughly, recover automatically when possible.

## 📁 Implementation

### 01-error-boundaries-comprehensive.tsx
**Complexity**: ⭐⭐⭐⭐
**Interview Focus**: Error Boundaries, Error Recovery, Fallback UIs, Error Logging

---

## 🔍 Deep Technical Analysis

### 1. Error Boundary Basics

**What Error Boundaries Catch**:
```typescript
// ✅ Caught by Error Boundaries
class MyComponent extends React.Component {
  render() {
    throw new Error('Render error'); // ✅ Caught
  }
}

function MyComponent() {
  const data = null;
  return <div>{data.property}</div>; // ✅ Caught (TypeError)
}

useEffect(() => {
  throw new Error('Effect error'); // ✅ Caught
}, []);
```

**What Error Boundaries DON'T Catch**:
```typescript
// ❌ NOT Caught by Error Boundaries
function MyComponent() {
  const handleClick = () => {
    throw new Error('Event handler error'); // ❌ Not caught
  };

  setTimeout(() => {
    throw new Error('Async error'); // ❌ Not caught
  }, 1000);

  return <button onClick={handleClick}>Click</button>;
}

// ❌ Errors in Error Boundary itself
// ❌ Server-side rendering errors
```

**Why this limitation?**
Error Boundaries use `componentDidCatch`, which only catches errors during:
- Render phase
- Lifecycle methods
- Constructors of child components

Event handlers run AFTER render, so they're not caught.

#### Interview Question: Error Boundaries

**Q: How do you handle errors in event handlers since Error Boundaries don't catch them?**
A: "Use try-catch with error logging:

```typescript
function ComplianceForm() {
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    try {
      await submitComplianceData(formData);
    } catch (error) {
      // Log to error tracking service
      logError(error, { context: 'compliance_form_submit', userId });

      // Show user-friendly error
      setError(error instanceof Error ? error : new Error('Unknown error'));

      // Show error in UI
      toast.error('Failed to submit compliance data. Please try again.');
    }
  };

  if (error) {
    return <ErrorMessage error={error} onRetry={() => setError(null)} />;
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

For async errors (Promises, setTimeout):
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await api.fetchComplianceData();
      setData(data);
    } catch (error) {
      setError(error);
      logError(error, { context: 'compliance_data_fetch' });
    }
  };

  fetchData();
}, []);
```"

---

### 2. Multi-Layer Error Boundaries

**Pattern**: Different boundaries for different app sections

```typescript
function App() {
  return (
    <ErrorBoundary
      FallbackComponent={RootErrorFallback}
      onError={(error, errorInfo) => {
        // Log to error tracking (Sentry, DataDog, etc.)
        logError('ROOT', error, errorInfo);
      }}
    >
      <Header /> {/* Critical: Navigation */}

      <MainContent>
        <ErrorBoundary
          FallbackComponent={SidebarErrorFallback}
          onError={(error, errorInfo) => logError('SIDEBAR', error, errorInfo)}
        >
          <Sidebar /> {/* Non-critical: Can fail independently */}
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={ComplianceModuleErrorFallback}
          onError={(error, errorInfo) => logError('COMPLIANCE', error, errorInfo)}
          onReset={() => {
            // Reset compliance module state
            clearComplianceCache();
            refetchComplianceData();
          }}
        >
          <ComplianceModule /> {/* Critical: Main feature */}
        </ErrorBoundary>
      </MainContent>

      <Footer />
    </ErrorBoundary>
  );
}
```

**Architecture**:
```
┌─────────────────────────────────────────┐
│         Root Error Boundary             │ ← Catches catastrophic errors
│  ┌────────────┐  ┌──────────────────┐  │
│  │  Sidebar   │  │  Main Content    │  │
│  │  Boundary  │  │  ┌────────────┐  │  │
│  │            │  │  │ Module     │  │  │
│  │            │  │  │ Boundary   │  │  │
│  │            │  │  │            │  │  │
│  └────────────┘  │  └────────────┘  │  │
│                  └──────────────────┘  │
└─────────────────────────────────────────┘
```

**Benefits**:
- ✅ Isolated failures (sidebar error doesn't break main content)
- ✅ Granular error logging (know which module failed)
- ✅ Targeted recovery (reset only affected module)
- ✅ Better UX (partial functionality remains)

#### Interview Question: Error Boundary Strategy

**Q: How do you decide where to place Error Boundaries?**
A: "I place boundaries based on:

1. **Feature boundaries**: Each major feature (dashboard, reports, settings)
2. **Criticality**: Wrap non-critical features to prevent taking down critical ones
3. **Recovery strategy**: Where I can meaningfully recover or retry
4. **User impact**: Balance between isolation and too many error states

Example for GRC app:
```
Root Boundary: Entire app
  ├─ Dashboard Boundary: Main compliance dashboard
  ├─ Reports Boundary: Report generation module
  ├─ Settings Boundary: User settings (non-critical)
  └─ Data Table Boundary: Large data tables (memory intensive)
```

Each boundary has appropriate fallback:
- Root: 'Something went wrong, refresh page'
- Dashboard: 'Dashboard unavailable, try again' with retry button
- Settings: 'Settings temporarily unavailable' with continue button
- Data Table: 'Table failed to load' with refresh button"

---

### 3. Automatic Error Recovery

**Pattern**: Reset error boundary after user action or timeout

```typescript
function ErrorBoundaryWithReset() {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error state
  const resetError = () => {
    setError(null);
    setErrorInfo(null);
    setRetryCount(0);
  };

  // Automatic retry with exponential backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

      const timeout = setTimeout(() => {
        console.log(`Auto-retry ${retryCount + 1}/3 after ${delay}ms`);
        setRetryCount(prev => prev + 1);
        resetError(); // This will re-render children
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [error, retryCount]);

  if (error) {
    if (retryCount >= 3) {
      return <FatalErrorFallback error={error} />;
    }

    return (
      <RetryingErrorFallback
        error={error}
        retryCount={retryCount}
        onManualRetry={resetError}
      />
    );
  }

  return (
    <ErrorBoundaryComponent
      onError={(error, errorInfo) => {
        setError(error);
        setErrorInfo(errorInfo);
        logError(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

**Recovery Strategies**:
1. **Immediate retry**: For transient failures (network blips)
2. **Exponential backoff**: For potentially sustained issues
3. **Manual retry**: User-triggered after auto-retry exhausted
4. **Graceful degradation**: Show cached data with "may be stale" warning

---

### 4. Error Logging & Telemetry

**Pattern**: Comprehensive error context

```typescript
interface ErrorContext {
  userId?: string;
  sessionId: string;
  route: string;
  timestamp: number;
  componentStack?: string;
  errorBoundary: string;
  retryCount: number;
  additionalData?: Record<string, any>;
}

function logError(
  boundaryName: string,
  error: Error,
  errorInfo: ErrorInfo,
  context?: Partial<ErrorContext>
) {
  const errorContext: ErrorContext = {
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    route: window.location.pathname,
    timestamp: Date.now(),
    componentStack: errorInfo.componentStack,
    errorBoundary: boundaryName,
    retryCount: 0,
    ...context,
  };

  // Log to multiple destinations
  console.error('[Error Boundary]', boundaryName, error, errorContext);

  // Send to error tracking service
  sendToSentry({
    error,
    context: errorContext,
    tags: {
      errorBoundary: boundaryName,
      route: errorContext.route,
    },
    level: 'error',
  });

  // Send to internal telemetry
  sendTelemetry('error_boundary_caught', {
    error_message: error.message,
    error_stack: error.stack,
    ...errorContext,
  });

  // For critical errors, also send alert
  if (boundaryName === 'ROOT' || boundaryName === 'COMPLIANCE') {
    sendCriticalAlert({
      subject: `Error in ${boundaryName}`,
      error: error.message,
      userId: errorContext.userId,
      route: errorContext.route,
    });
  }
}
```

**Key Information to Log**:
- ✅ Error message and stack trace
- ✅ Component stack (where error originated)
- ✅ User ID and session ID
- ✅ Current route/page
- ✅ Timestamp
- ✅ Browser/device info
- ✅ Recent user actions (breadcrumbs)
- ✅ App state snapshot (Redux/Context)

---

### 5. User-Friendly Error Messages

**Problem**: Technical errors confuse users

```typescript
// ❌ BAD: Exposes technical details
<div>
  Error: Cannot read property 'data' of undefined at ComplianceTable.tsx:42
</div>
```

**Solution**: User-friendly messages with actionable steps

```typescript
// ✅ GOOD: Clear, actionable error messages
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const userFriendlyMessage = getErrorMessage(error);
  const suggestions = getErrorSuggestions(error);

  return (
    <div className="error-container">
      <AlertCircle className="error-icon" />

      <h2>Something went wrong</h2>

      <p className="error-message">{userFriendlyMessage}</p>

      {suggestions.length > 0 && (
        <div className="error-suggestions">
          <p>Try these steps:</p>
          <ul>
            {suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="error-actions">
        <button onClick={resetErrorBoundary}>
          Try Again
        </button>
        <button onClick={() => window.location.href = '/'}>
          Go to Home
        </button>
        <button onClick={() => reportError(error)}>
          Report Issue
        </button>
      </div>

      {/* Technical details in expandable section */}
      <details className="error-technical-details">
        <summary>Technical details</summary>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </details>
    </div>
  );
}

function getErrorMessage(error: Error): string {
  // Map technical errors to user-friendly messages
  if (error.message.includes('NetworkError')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error.message.includes('Permission denied')) {
    return "You don't have permission to access this resource. Contact your administrator.";
  }

  if (error.message.includes('undefined')) {
    return 'Some data failed to load. This may be temporary.';
  }

  return 'An unexpected error occurred. We\'ve been notified and are working on it.';
}

function getErrorSuggestions(error: Error): string[] {
  const suggestions: string[] = [];

  if (error.message.includes('NetworkError')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Disable any VPN or proxy');
    suggestions.push('Try refreshing the page');
  }

  if (error.message.includes('Permission')) {
    suggestions.push('Log out and log back in');
    suggestions.push('Contact your system administrator');
  }

  suggestions.push('If the problem persists, report the issue using the button below');

  return suggestions;
}
```

---

### 6. React Query Integration

**Pattern**: Error boundaries for async data fetching

```typescript
function ComplianceDataTable() {
  const { data, error, isError, refetch } = useQuery(
    ['compliance-data'],
    fetchComplianceData,
    {
      // Don't throw errors to Error Boundary (handle locally)
      useErrorBoundary: false,

      // Retry failed requests
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Show stale data while refetching
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isError) {
    return (
      <ErrorMessage
        error={error}
        onRetry={refetch}
        message="Failed to load compliance data"
      />
    );
  }

  return <Table data={data} />;
}
```

**When to use Error Boundary vs local error handling**:
- **Error Boundary**: Component crashes (render errors, unrecoverable)
- **Local handling**: Async operations, API calls, user actions

---

## 🎓 Study Strategy

### Must Know

1. **What Error Boundaries catch** (and don't catch)
2. **Multi-layer Error Boundary strategy**
3. **Automatic recovery patterns**
4. **Error logging best practices**
5. **User-friendly error messages**

### Practice Explaining

"For error handling in our GRC application, I implemented multi-layer Error Boundaries:

Root boundary catches catastrophic errors, while feature-specific boundaries isolate failures in non-critical modules. This ensures the sidebar failing doesn't break the main compliance dashboard.

For error recovery, I implement exponential backoff automatic retry (1s, 2s, 4s) for transient failures, with manual retry for sustained issues.

All errors are logged with comprehensive context (user ID, route, component stack) to Sentry for debugging, with user-friendly messages hiding technical details.

For async operations like API calls, I use try-catch with React Query's built-in retry logic rather than Error Boundaries, since boundaries don't catch async errors."

---

## 🔑 Key Patterns

- ✅ Multi-layer boundaries for isolation
- ✅ Automatic retry with exponential backoff
- ✅ Comprehensive error logging with context
- ✅ User-friendly error messages
- ✅ Graceful degradation (show stale data)
- ✅ try-catch for event handlers and async
- ✅ React Query integration

---

Good luck with your Adobe TechGRC interview! 🚀
