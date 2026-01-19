/**
 * Interview Question 5: React Context Performance Optimization
 * 
 * Implement a compliance context provider that efficiently manages global state
 * for a large application without causing unnecessary re-renders. Demonstrate:
 * - Context splitting to prevent cascading re-renders
 * - Memoization strategies for context values
 * - Selector pattern for fine-grained subscriptions
 * - Context composition for complex state
 * 
 * Key Technical Requirements:
 * - Split contexts by update frequency
 * - Use selectors to subscribe to specific state slices
 * - Memoize context values properly
 * - Prevent unnecessary re-renders
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useRef } from 'react';

// Types
interface ComplianceState {
  controls: Record<string, ComplianceControl>;
  frameworks: Record<string, Framework>;
  filters: FilterState;
  ui: UIState;
}

interface ComplianceControl {
  id: string;
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  frameworkId: string;
}

interface Framework {
  id: string;
  name: string;
  complianceScore: number;
}

interface FilterState {
  searchTerm: string;
  statusFilter: string[];
  frameworkFilter: string[];
}

interface UIState {
  selectedControlId: string | null;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

// Split contexts by update frequency
const ComplianceDataContext = createContext<{
  controls: Record<string, ComplianceControl>;
  frameworks: Record<string, Framework>;
} | null>(null);

const ComplianceFiltersContext = createContext<{
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;
} | null>(null);

const ComplianceUIContext = createContext<{
  ui: UIState;
  updateUI: (updates: Partial<UIState>) => void;
} | null>(null);

// Selector type for fine-grained subscriptions
type Selector<T, R> = (state: T) => R;

// Custom hook with selector pattern
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

// Provider component with split contexts
interface ComplianceProviderProps {
  children: React.ReactNode;
  initialData: {
    controls: Record<string, ComplianceControl>;
    frameworks: Record<string, Framework>;
  };
}

export function ComplianceProvider({ children, initialData }: ComplianceProviderProps) {
  // Data state (updates infrequently)
  const [data, setData] = useState(initialData);
  
  // Filters state (updates frequently)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: [],
    frameworkFilter: [],
  });

  // UI state (updates frequently)
  const [ui, setUI] = useState<UIState>({
    selectedControlId: null,
    sidebarOpen: true,
    theme: 'light',
  });

  // Memoize data context value (only changes when data changes)
  const dataValue = useMemo(
    () => ({
      controls: data.controls,
      frameworks: data.frameworks,
    }),
    [data.controls, data.frameworks]
  );

  // Memoize filters context value with stable update function
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const filtersValue = useMemo(
    () => ({ filters, updateFilters }),
    [filters, updateFilters]
  );

  // Memoize UI context value with stable update function
  const updateUI = useCallback((updates: Partial<UIState>) => {
    setUI(prev => ({ ...prev, ...updates }));
  }, []);

  const uiValue = useMemo(
    () => ({ ui, updateUI }),
    [ui, updateUI]
  );

  return (
    <ComplianceDataContext.Provider value={dataValue}>
      <ComplianceFiltersContext.Provider value={filtersValue}>
        <ComplianceUIContext.Provider value={uiValue}>
          {children}
        </ComplianceUIContext.Provider>
      </ComplianceFiltersContext.Provider>
    </ComplianceDataContext.Provider>
  );
}

// Custom hooks for each context
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

// Selector-based hooks for fine-grained subscriptions
export function useControl(controlId: string): ComplianceControl | undefined {
  return useComplianceDataSelector(state => state.controls[controlId]);
}

export function useFramework(frameworkId: string): Framework | undefined {
  return useComplianceDataSelector(state => state.frameworks[frameworkId]);
}

export function useCompliantControlsCount(): number {
  return useComplianceDataSelector(state =>
    Object.values(state.controls).filter(c => c.status === 'COMPLIANT').length
  );
}

// Example component using optimized context
export function ControlList() {
  // Only re-renders when filters change, not when data changes
  const { filters, updateFilters } = useComplianceFilters();
  
  // Only re-renders when this specific control changes
  const controls = useComplianceDataSelector(state => {
    let filtered = Object.values(state.controls);
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      );
    }
    
    if (filters.statusFilter.length > 0) {
      filtered = filtered.filter(c => filters.statusFilter.includes(c.status));
    }
    
    if (filters.frameworkFilter.length > 0) {
      filtered = filtered.filter(c => filters.frameworkFilter.includes(c.frameworkId));
    }
    
    return filtered;
  });

  return (
    <div>
      <input
        value={filters.searchTerm}
        onChange={(e) => updateFilters({ searchTerm: e.target.value })}
        placeholder="Search controls..."
      />
      {controls.map(control => (
        <ControlItem key={control.id} controlId={control.id} />
      ))}
    </div>
  );
}

// Component that only re-renders when its specific control changes
function ControlItem({ controlId }: { controlId: string }) {
  const control = useControl(controlId);
  const { ui, updateUI } = useComplianceUI();

  if (!control) return null;

  return (
    <div
      onClick={() => updateUI({ selectedControlId: controlId })}
      style={{
        backgroundColor: ui.selectedControlId === controlId ? '#e0e0e0' : 'white',
      }}
    >
      {control.title} - {control.status}
    </div>
  );
}

/**
 * Key Concepts Explained:
 * 
 * 1. Context Splitting: Separate contexts by update frequency. Prevents
 *    components from re-rendering when unrelated state changes.
 * 
 * 2. Memoization: Memoize context values to prevent unnecessary re-renders.
 *    Only create new object when dependencies actually change.
 * 
 * 3. Selector Pattern: Use selectors to subscribe to specific state slices.
 *    Components only re-render when selected data changes.
 * 
 * 4. Stable Functions: Use useCallback for update functions to prevent
 *    context value changes when functions are recreated.
 * 
 * Interview Talking Points:
 * - Context splitting: Reduces re-renders, better performance
 * - Selector pattern: Fine-grained subscriptions, like Redux selectors
 * - Memoization: Essential for context performance, prevent object recreation
 * - When to use Context vs other state: Global state, theme, user preferences
 */

