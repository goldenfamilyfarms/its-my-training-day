/**
 * Interview Question 3: Advanced Custom Hooks for Compliance Data Management
 * 
 * Create a set of custom React hooks for managing compliance data that demonstrate:
 * - Complex state management with useReducer
 * - Async operations with proper error handling
 * - Optimistic updates
 * - Cache invalidation strategies
 * - Request deduplication
 * 
 * Key Technical Requirements:
 * - useComplianceData hook with caching and deduplication
 * - useOptimisticUpdate hook for immediate UI feedback
 * - usePolling hook for periodic data refresh
 * - Proper cleanup and memory leak prevention
 */

import { useState, useEffect, useReducer, useRef, useCallback } from 'react';

// Types
interface ComplianceControl {
  id: string;
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  lastUpdated: string;
}

interface ComplianceState {
  controls: Record<string, ComplianceControl>;
  loading: boolean;
  error: Error | null;
  lastFetch: number | null;
}

type ComplianceAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ComplianceControl[] }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'UPDATE_CONTROL'; payload: ComplianceControl }
  | { type: 'INVALIDATE_CACHE' };

// Global cache for request deduplication
const requestCache = new Map<string, Promise<ComplianceControl[]>>();
const dataCache = new Map<string, { data: ComplianceControl[]; timestamp: number }>();

// Reducer for compliance state
function complianceReducer(
  state: ComplianceState,
  action: ComplianceAction
): ComplianceState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS': {
      const controls = action.payload.reduce(
        (acc, control) => ({ ...acc, [control.id]: control }),
        {} as Record<string, ComplianceControl>
      );
      return {
        ...state,
        controls: { ...state.controls, ...controls },
        loading: false,
        error: null,
        lastFetch: Date.now(),
      };
    }

    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'UPDATE_CONTROL':
      return {
        ...state,
        controls: {
          ...state.controls,
          [action.payload.id]: action.payload,
        },
      };

    case 'INVALIDATE_CACHE':
      return {
        ...state,
        lastFetch: null,
      };

    default:
      return state;
  }
}

// Custom hook: useComplianceData with caching and deduplication
export function useComplianceData(
  framework?: string,
  options: {
    cacheTime?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    enabled = true,
  } = options;

  const [state, dispatch] = useReducer(complianceReducer, {
    controls: {},
    loading: false,
    error: null,
    lastFetch: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = framework || 'all';
    const cached = dataCache.get(cacheKey);

    // Check if data is still fresh
    if (cached && Date.now() - cached.timestamp < staleTime) {
      dispatch({ type: 'FETCH_SUCCESS', payload: cached.data });
      return;
    }

    // Check if request is already in flight (deduplication)
    const existingRequest = requestCache.get(cacheKey);
    if (existingRequest) {
      try {
        const data = await existingRequest;
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'FETCH_ERROR', payload: error as Error });
      }
      return;
    }

    // Create new request
    dispatch({ type: 'FETCH_START' });
    abortControllerRef.current = new AbortController();

    const request = fetchComplianceControls(framework, {
      signal: abortControllerRef.current.signal,
    });

    requestCache.set(cacheKey, request);

    try {
      const data = await request;
      
      // Update cache
      dataCache.set(cacheKey, { data, timestamp: Date.now() });
      
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        dispatch({ type: 'FETCH_ERROR', payload: error as Error });
      }
    } finally {
      requestCache.delete(cacheKey);
    }
  }, [framework, staleTime]);

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

  // Cleanup old cache entries
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

  const invalidate = useCallback(() => {
    if (framework) {
      dataCache.delete(framework);
    } else {
      dataCache.clear();
    }
    dispatch({ type: 'INVALIDATE_CACHE' });
  }, [framework]);

  return {
    ...state,
    refetch: fetchData,
    invalidate,
  };
}

// Custom hook: useOptimisticUpdate for immediate UI feedback
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

  const getOptimisticValue = useCallback(
    (id: string, currentValue: T | undefined): T | undefined => {
      return optimisticUpdates.get(id) || currentValue;
    },
    [optimisticUpdates]
  );

  return { update, getOptimisticValue };
}

// Custom hook: usePolling for periodic data refresh
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
}

// Simulated API function
async function fetchComplianceControls(
  framework?: string,
  options?: { signal?: AbortSignal }
): Promise<ComplianceControl[]> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (options?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const mockControls: ComplianceControl[] = Array.from({ length: 10 }, (_, i) => ({
    id: `control-${i}`,
    title: `Control ${i}`,
    status: ['COMPLIANT', 'NON_COMPLIANT', 'WARNING'][i % 3] as ComplianceControl['status'],
    lastUpdated: new Date().toISOString(),
  }));

  if (framework) {
    return mockControls; // Filtered in real implementation
  }

  return mockControls;
}

// Example usage component
export function ComplianceDataExample() {
  const { controls, loading, error, refetch, invalidate } = useComplianceData('SOC2', {
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  const { update, getOptimisticValue } = useOptimisticUpdate<ComplianceControl>(
    async (control) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return control;
    }
  );

  // Poll for updates every 30 seconds
  usePolling(() => {
    refetch();
  }, 30 * 1000, { enabled: true, immediate: false });

  const handleUpdate = async (id: string) => {
    const control = controls[id];
    if (!control) return;

    await update({
      ...control,
      status: control.status === 'COMPLIANT' ? 'NON_COMPLIANT' : 'COMPLIANT',
    });
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <div>
        {Object.values(controls).map(control => {
          const optimisticControl = getOptimisticValue(control.id, control);
          return (
            <div key={control.id}>
              {optimisticControl.title} - {optimisticControl.status}
              <button onClick={() => handleUpdate(control.id)}>Toggle</button>
            </div>
          );
        })}
      </div>
      <button onClick={invalidate}>Invalidate Cache</button>
    </div>
  );
}

/**
 * Key Concepts Explained:
 * 
 * 1. Request Deduplication: Multiple components requesting same data only trigger
 *    one API call. Prevents duplicate requests.
 * 
 * 2. Cache Management: Time-based cache with stale time. Data is considered fresh
 *    for a period, then refetched in background.
 * 
 * 3. Optimistic Updates: Update UI immediately, revert on error. Better UX than
 *    waiting for server response.
 * 
 * 4. Polling: Periodic data refresh. Useful for real-time-ish data without WebSocket.
 * 
 * 5. Cleanup: Proper cleanup prevents memory leaks (abort controllers, intervals, cache).
 * 
 * Interview Talking Points:
 * - Request deduplication: Prevents duplicate API calls, improves performance
 * - Cache strategy: Balance freshness vs performance, when to invalidate
 * - Optimistic updates: Better UX, but need error handling
 * - Polling trade-offs: Simple but inefficient, WebSocket better for real-time
 */

