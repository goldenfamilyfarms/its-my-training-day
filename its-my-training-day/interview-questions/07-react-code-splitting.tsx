/**
 * Interview Question 7: React Code Splitting and Lazy Loading
 * 
 * Implement a compliance dashboard with code splitting to optimize initial
 * bundle size and improve load times. Demonstrate:
 * - Route-based code splitting with React.lazy
 * - Component-level code splitting
 * - Dynamic imports for heavy libraries
 * - Preloading strategies
 * - Error boundaries for lazy-loaded components
 * 
 * Key Technical Requirements:
 * - Split routes into separate chunks
 * - Lazy load heavy components (charts, tables)
 * - Preload on hover/focus
 * - Handle loading and error states
 */

import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Error Boundary for lazy-loaded components
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LazyComponentErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-300 rounded bg-red-50">
            <h2 className="text-red-800 font-bold">Error loading component</h2>
            <p className="text-red-600">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3">Loading...</span>
    </div>
  );
}

// Lazy-loaded route components
const Dashboard = lazy(() => import('./routes/Dashboard'));
const ControlsList = lazy(() => import('./routes/ControlsList'));
const Reports = lazy(() => import('./routes/Reports'));
const Settings = lazy(() => import('./routes/Settings'));

// Preload function for route components
function preloadRoute(importFn: () => Promise<{ default: React.ComponentType }>) {
  return () => {
    importFn();
  };
}

// Lazy-loaded heavy component (e.g., chart library)
const ComplianceChart = lazy(() =>
  import('./components/ComplianceChart').catch(() => ({
    default: () => <div>Chart component failed to load</div>,
  }))
);

// Component with preload on hover
interface PreloadableLinkProps {
  to: string;
  children: ReactNode;
  preload: () => void;
}

function PreloadableLink({ to, children, preload }: PreloadableLinkProps) {
  return (
    <Link
      to={to}
      onMouseEnter={preload}
      onFocus={preload}
      className="block p-2 hover:bg-gray-100 rounded"
    >
      {children}
    </Link>
  );
}

// Main App with code splitting
export function ComplianceApp() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-xl font-bold mb-4">Compliance Dashboard</h1>
          <ul className="space-y-2">
            <li>
              <PreloadableLink
                to="/"
                preload={preloadRoute(() => import('./routes/Dashboard'))}
              >
                Dashboard
              </PreloadableLink>
            </li>
            <li>
              <PreloadableLink
                to="/controls"
                preload={preloadRoute(() => import('./routes/ControlsList'))}
              >
                Controls
              </PreloadableLink>
            </li>
            <li>
              <PreloadableLink
                to="/reports"
                preload={preloadRoute(() => import('./routes/Reports'))}
              >
                Reports
              </PreloadableLink>
            </li>
            <li>
              <PreloadableLink
                to="/settings"
                preload={preloadRoute(() => import('./routes/Settings'))}
              >
                Settings
              </PreloadableLink>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <LazyComponentErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/controls" element={<ControlsList />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
          </LazyComponentErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Example route component (would be in separate file)
export function Dashboard() {
  const [showChart, setShowChart] = React.useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      <button
        onClick={() => setShowChart(true)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Show Compliance Chart
      </button>

      {showChart && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ComplianceChart />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}
    </div>
  );
}

// Dynamic import for heavy library
export async function loadHeavyLibrary() {
  // Only import when needed
  const heavyLibrary = await import('heavy-library');
  return heavyLibrary;
}

// Component that uses dynamic import
export function HeavyComponentWrapper() {
  const [library, setLibrary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const lib = await loadHeavyLibrary();
      setLibrary(lib);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!library) {
    return (
      <button onClick={loadLibrary} className="px-4 py-2 bg-blue-600 text-white rounded">
        Load Heavy Library
      </button>
    );
  }

  return <div>Library loaded: {library.name}</div>;
}

/**
 * Key Concepts Explained:
 * 
 * 1. React.lazy: Lazy load components, creates separate chunks.
 *    Reduces initial bundle size.
 * 
 * 2. Suspense: Shows fallback UI while lazy component loads.
 *    Better UX than loading states.
 * 
 * 3. Route-based Splitting: Split by routes, load on navigation.
 *    Most common splitting strategy.
 * 
 * 4. Preloading: Load chunks before user navigates (on hover).
 *    Improves perceived performance.
 * 
 * 5. Error Boundaries: Handle lazy loading failures gracefully.
 *    Prevents entire app crash.
 * 
 * Interview Talking Points:
 * - Code splitting benefits: Smaller initial bundle, faster load time
 * - When to split: Routes, heavy components, rarely used features
 * - Preloading strategy: Balance between preload and bandwidth
 * - Error handling: Error boundaries for lazy components, retry logic
 */

export default ComplianceApp;

