/**
 * Interview Question 1: React Concurrent Features and Suspense
 * 
 * Implement a compliance dashboard that uses React 18 concurrent features
 * including Suspense, useTransition, and useDeferredValue to handle expensive
 * compliance calculations without blocking the UI.
 * 
 * Key Technical Requirements:
 * - Use Suspense boundaries for async data loading
 * - Implement useTransition for non-urgent state updates
 * - Use useDeferredValue for expensive filtering operations
 * - Show loading states appropriately
 * - Maintain responsive UI during heavy computations
 */

import React, { useState, useTransition, useDeferredValue, Suspense, useMemo } from 'react';

// Types
interface ComplianceControl {
  id: string;
  framework: 'SOC2' | 'FEDRAMP' | 'ISO27001';
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  lastAssessedAt: string;
  evidenceCount: number;
}

interface ComplianceMetrics {
  totalControls: number;
  compliantCount: number;
  nonCompliantCount: number;
  complianceScore: number;
}

// Simulated async data fetching with Suspense
function createResource<T>(promise: Promise<T>) {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T | Error;
  
  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (error) => {
      status = 'error';
      result = error;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender; // Suspense will catch this
      } else if (status === 'error') {
        throw result;
      } else {
        return result as T;
      }
    },
  };
}

// Async data fetcher
async function fetchComplianceControls(framework?: string): Promise<ComplianceControl[]> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockControls: ComplianceControl[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `control-${i}`,
    framework: ['SOC2', 'FEDRAMP', 'ISO27001'][i % 3] as ComplianceControl['framework'],
    title: `Control ${i}: Security Requirement`,
    status: ['COMPLIANT', 'NON_COMPLIANT', 'WARNING'][i % 3] as ComplianceControl['status'],
    lastAssessedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    evidenceCount: Math.floor(Math.random() * 10),
  }));

  if (framework) {
    return mockControls.filter(c => c.framework === framework);
  }
  return mockControls;
}

// Component that uses Suspense
interface ControlListProps {
  resource: ReturnType<typeof createResource<ComplianceControl[]>>;
  searchTerm: string;
}

function ControlList({ resource, searchTerm }: ControlListProps) {
  const controls = resource.read(); // May suspend
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  // Expensive filtering operation - deferred to prevent blocking
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

  return (
    <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <div className="mb-2 text-sm text-gray-500">
        {isStale && 'Filtering...'} Showing {filteredControls.length} controls
      </div>
      <div className="space-y-2">
        {filteredControls.map(control => (
          <div
            key={control.id}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{control.title}</h3>
                <p className="text-sm text-gray-500">{control.id}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                control.status === 'COMPLIANT' ? 'bg-green-100 text-green-800' :
                control.status === 'NON_COMPLIANT' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {control.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading fallback
function ControlListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

// Metrics calculation component
interface MetricsDisplayProps {
  controls: ComplianceControl[];
}

function MetricsDisplay({ controls }: MetricsDisplayProps) {
  const metrics: ComplianceMetrics = useMemo(() => {
    const compliantCount = controls.filter(c => c.status === 'COMPLIANT').length;
    const nonCompliantCount = controls.filter(c => c.status === 'NON_COMPLIANT').length;
    
    return {
      totalControls: controls.length,
      compliantCount,
      nonCompliantCount,
      complianceScore: controls.length > 0
        ? (compliantCount / controls.length) * 100
        : 0,
    };
  }, [controls]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{metrics.totalControls}</div>
        <div className="text-sm text-gray-500">Total Controls</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold text-green-600">{metrics.compliantCount}</div>
        <div className="text-sm text-gray-500">Compliant</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold text-red-600">{metrics.nonCompliantCount}</div>
        <div className="text-sm text-gray-500">Non-Compliant</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{metrics.complianceScore.toFixed(1)}%</div>
        <div className="text-sm text-gray-500">Compliance Score</div>
      </div>
    </div>
  );
}

// Main dashboard component
export function ConcurrentComplianceDashboard() {
  const [framework, setFramework] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Create resource for Suspense
  const controlsResource = useMemo(
    () => createResource(fetchComplianceControls(framework || undefined)),
    [framework]
  );

  // Non-urgent state update using transition
  const handleFrameworkChange = (newFramework: string) => {
    startTransition(() => {
      setFramework(newFramework);
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Dashboard</h1>

      {/* Framework filter with transition */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Framework:</label>
        <select
          value={framework}
          onChange={(e) => handleFrameworkChange(e.target.value)}
          className="border rounded-lg px-4 py-2"
          disabled={isPending}
        >
          <option value="">All Frameworks</option>
          <option value="SOC2">SOC 2</option>
          <option value="FEDRAMP">FedRAMP</option>
          <option value="ISO27001">ISO 27001</option>
        </select>
        {isPending && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
      </div>

      {/* Search with deferred value */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search controls..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        />
      </div>

      {/* Suspense boundary for async data */}
      <Suspense fallback={<ControlListSkeleton />}>
        <ControlList resource={controlsResource} searchTerm={searchTerm} />
      </Suspense>
    </div>
  );
}

/**
 * Key Concepts Explained:
 * 
 * 1. Suspense: Allows components to "suspend" rendering while waiting for async data.
 *    The fallback UI is shown during loading. This provides better UX than loading states.
 * 
 * 2. useTransition: Marks state updates as non-urgent, allowing React to keep the UI
 *    responsive. The isPending flag indicates when a transition is in progress.
 * 
 * 3. useDeferredValue: Defers expensive computations (like filtering) to prevent blocking
 *    the UI. Shows stale data while computing, then smoothly transitions to new data.
 * 
 * 4. Resource Pattern: Wraps promises to work with Suspense. The read() method throws
 *    the promise if pending, which Suspense catches.
 * 
 * Interview Talking Points:
 * - When to use Suspense: Async data loading, code splitting
 * - useTransition vs useDeferredValue: Transition for state updates, deferred for values
 * - Performance benefits: Non-blocking UI, better perceived performance
 * - Trade-offs: More complex, requires Suspense boundaries
 */

export default ConcurrentComplianceDashboard;

