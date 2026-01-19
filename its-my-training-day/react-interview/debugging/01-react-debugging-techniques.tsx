/**
 * Question 11: React Debugging Techniques
 * 
 * Comprehensive debugging strategies for React applications including
 * React DevTools, performance profiling, memory leak detection, and
 * production debugging techniques.
 */

import React, { useEffect, useRef, Profiler, ProfilerOnRenderCallback } from 'react';

// Performance monitoring hook
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
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

// Render performance profiler
interface PerformanceProfilerProps {
  id: string;
  children: React.ReactNode;
  onRender?: ProfilerOnRenderCallback;
}

export function PerformanceProfiler({ id, children, onRender }: PerformanceProfilerProps) {
  const defaultOnRender: ProfilerOnRenderCallback = (
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
      console.warn(`[Performance] Slow render in ${id}:`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        interactions: Array.from(interactions),
      });
    }

    // Send to monitoring service
    if (window.performance && 'mark' in window.performance) {
      window.performance.mark(`${id}-${phase}-end`);
    }
  };

  return (
    <Profiler id={id} onRender={onRender || defaultOnRender}>
      {children}
    </Profiler>
  );
}

// Memory leak detector
export class MemoryLeakDetector {
  private snapshots: Array<{ label: string; timestamp: number; heapUsed: number }> = [];
  private heapGrowth: Array<{ timestamp: number; heapUsed: number }> = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private componentName: string) {
    this.takeSnapshot('initial');
    this.startMonitoring();
  }

  private startMonitoring() {
    this.intervalId = setInterval(() => {
      this.checkHeapGrowth();
    }, 30000); // Check every 30 seconds
  }

  takeSnapshot(label: string) {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.snapshots.push({
        label,
        timestamp: Date.now(),
        heapUsed: memory.usedJSHeapSize,
      });
      console.log(`[Memory] Snapshot ${label}:`, {
        heapUsed: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }

  private checkHeapGrowth() {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    this.heapGrowth.push({
      timestamp: Date.now(),
      heapUsed: memory.usedJSHeapSize,
    });

    // Check for continuous growth
    if (this.heapGrowth.length > 5) {
      const recent = this.heapGrowth.slice(-5);
      const growing = recent.every((curr, idx) =>
        idx === 0 || curr.heapUsed > recent[idx - 1].heapUsed
      );

      if (growing) {
        console.warn(`[Memory Leak] Potential memory leak detected in ${this.componentName}!`);
        this.takeSnapshot('potential-leak');
      }
    }
  }

  getReport() {
    return {
      component: this.componentName,
      snapshots: this.snapshots,
      heapGrowth: this.heapGrowth,
    };
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Hook for memory monitoring
export function useMemoryMonitor(componentName: string) {
  const detectorRef = useRef<MemoryLeakDetector | null>(null);

  useEffect(() => {
    detectorRef.current = new MemoryLeakDetector(componentName);

    return () => {
      detectorRef.current?.cleanup();
    };
  }, [componentName]);

  return {
    takeSnapshot: (label: string) => detectorRef.current?.takeSnapshot(label),
    getReport: () => detectorRef.current?.getReport(),
  };
}

// React DevTools integration
export function setupReactDevToolsIntegration() {
  if (process.env.NODE_ENV === 'development' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    // Track fiber commits
    const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function(id, root, priorityLevel) {
      console.log('[React DevTools] Commit:', { id, priorityLevel });
      if (originalOnCommitFiberRoot) {
        originalOnCommitFiberRoot.call(this, id, root, priorityLevel);
      }
    };
  }
}

// Error boundary with debugging info
export class DebugErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Error Boundary] ${this.props.componentName}:`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.componentName,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', border: '2px solid red' }}>
          <h2>Error in {this.props.componentName}</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance metrics collector
export class PerformanceMetrics {
  private metrics: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }> = [];

  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    if (duration > 16) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.metrics.push({
        name,
        duration,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[Performance] Failed operation: ${name} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getSlowOperations(threshold: number = 100) {
    return this.metrics.filter(m => m.duration > threshold);
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMetrics = new PerformanceMetrics();

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    if (renderTime > 16) {
      console.warn(`[Render Time] ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });
}

// Network request debugging
export function setupNetworkDebugging() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const startTime = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    try {
      const response = await originalFetch.apply(this, args);
      const duration = performance.now() - startTime;
      
      console.log(`[Network] ${args[1]?.method || 'GET'} ${url}:`, {
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
        size: response.headers.get('content-length'),
      });
      
      if (duration > 1000) {
        console.warn(`[Network] Slow request: ${url} took ${duration.toFixed(2)}ms`);
      }
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Network] Failed: ${url} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  };
}

// State debugging hook
export function useDebugState<T>(state: T, label: string) {
  const prevStateRef = useRef<T>();

  useEffect(() => {
    if (prevStateRef.current !== undefined && prevStateRef.current !== state) {
      console.log(`[State Change] ${label}:`, {
        from: prevStateRef.current,
        to: state,
      });
    }
    prevStateRef.current = state;
  }, [state, label]);
}

// Production debugging utilities
export function setupProductionDebugging() {
  // Only enable in development or with debug flag
  if (process.env.NODE_ENV === 'development' || 
      new URLSearchParams(window.location.search).has('debug')) {
    
    // Expose debugging utilities to window
    (window as any).__REACT_DEBUG__ = {
      performanceMetrics,
      clearMetrics: () => performanceMetrics.clear(),
      getSlowOperations: (threshold?: number) => performanceMetrics.getSlowOperations(threshold),
    };

    setupNetworkDebugging();
    setupReactDevToolsIntegration();
  }
}

// Example usage component
export function DebuggableComponent({ data }: { data: any }) {
  useWhyDidYouUpdate('DebuggableComponent', { data });
  useRenderTime('DebuggableComponent');
  useDebugState(data, 'DebuggableComponent.data');
  const memoryMonitor = useMemoryMonitor('DebuggableComponent');

  useEffect(() => {
    setupProductionDebugging();
  }, []);

  return (
    <PerformanceProfiler id="DebuggableComponent">
      <div>
        <h2>Debuggable Component</h2>
        <p>Data: {JSON.stringify(data)}</p>
        <button onClick={() => memoryMonitor.takeSnapshot('user-action')}>
          Take Memory Snapshot
        </button>
      </div>
    </PerformanceProfiler>
  );
}

// Extend Window interface
declare global {
  interface Window {
    __REACT_DEBUG__?: {
      performanceMetrics: PerformanceMetrics;
      clearMetrics: () => void;
      getSlowOperations: (threshold?: number) => any[];
    };
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

