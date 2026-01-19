/**
 * Question: React Performance Optimization for Large Compliance Data Sets
 * 
 * Optimize React rendering performance for displaying thousands of controls 
 * with filtering, sorting, and grouping capabilities while maintaining real-time updates.
 * 
 * Key Technical Decisions:
 * - React Query for server state management
 * - Virtualization with grouping support
 * - Web Workers for heavy filtering/sorting
 * - Batched real-time updates
 * - Memoization at appropriate levels
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

// Types
interface ComplianceControl {
  id: string;
  frameworkType: 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'NOT_ASSESSED';
  lastAssessedAt: string;
  evidenceCount: number;
}

interface ControlFilters {
  status?: ComplianceControl['status'][];
  framework?: ComplianceControl['frameworkType'][];
  searchTerm?: string;
  sortBy?: 'status' | 'title' | 'lastAssessedAt';
  sortDir?: 'asc' | 'desc';
}

interface SortConfig {
  field: 'status' | 'title' | 'lastAssessedAt';
  direction: 'asc' | 'desc';
}

interface ControlUpdate {
  controlId: string;
  changes: Partial<ComplianceControl>;
}

// Server State Management with React Query
function useComplianceControls(filters: ControlFilters) {
  return useQuery({
    queryKey: ['controls', filters],
    queryFn: async () => {
      // In real implementation, would call API
      const response = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      return response.json() as Promise<ComplianceControl[]>;
    },
    staleTime: 30_000, // 30 seconds - compliance data doesn't change that fast
    structuralSharing: true, // Prevents unnecessary re-renders
    placeholderData: (previousData) => previousData, // Instant perceived loading
  });
}

// Separate UI State
function useControlUIState() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'status',
    direction: 'asc',
  });

  return {
    selectedIds,
    expandedGroups,
    sortConfig,
    toggleSelection: useCallback((id: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }, []),
    toggleGroup: useCallback((group: string) => {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.has(group) ? next.delete(group) : next.add(group);
        return next;
      });
    }, []),
    setSortConfig,
  };
}

// Grouping Helper
type GroupBy = 'framework' | 'status' | 'none';

function groupControls(
  controls: ComplianceControl[],
  groupBy: GroupBy
): Record<string, ComplianceControl[]> {
  if (groupBy === 'none') {
    return { 'All Controls': controls };
  }

  const grouped: Record<string, ComplianceControl[]> = {};

  for (const control of controls) {
    let key: string;
    if (groupBy === 'framework') {
      key = control.frameworkType;
    } else {
      key = control.status;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(control);
  }

  return grouped;
}

// Virtualized Control Table with Grouping
interface VirtualizedControlTableProps {
  controls: ComplianceControl[];
  groupBy: GroupBy;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}

const GROUP_HEADER_HEIGHT = 48;
const CONTROL_ROW_HEIGHT = 72;

function VirtualizedControlTable({
  controls,
  groupBy,
  selectedIds,
  onSelect,
}: VirtualizedControlTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Pre-compute groups and their positions
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

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      flatItems[index].type === 'header' ? GROUP_HEADER_HEIGHT : CONTROL_ROW_HEIGHT,
    overscan: 10, // Render extra items for smooth scrolling
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto" style={{ height: '600px' }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index];

          return item.type === 'header' ? (
            <GroupHeader
              key={`header-${item.name}`}
              name={item.name!}
              count={item.count!}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                height: GROUP_HEADER_HEIGHT,
                width: '100%',
              }}
            />
          ) : (
            <ControlRow
              key={item.data!.id}
              control={item.data!}
              isSelected={selectedIds.has(item.data!.id)}
              onSelect={() => onSelect(item.data!.id)}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                height: CONTROL_ROW_HEIGHT,
                width: '100%',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Group Header Component
interface GroupHeaderProps {
  name: string;
  count: number;
  style: React.CSSProperties;
}

function GroupHeader({ name, count, style }: GroupHeaderProps) {
  return (
    <div
      style={style}
      className="bg-gray-100 border-b border-gray-200 px-4 py-2 font-semibold flex items-center justify-between"
    >
      <span>{name}</span>
      <span className="text-sm text-gray-500">{count} controls</span>
    </div>
  );
}

// Control Row Component with Memoization
interface ControlRowProps {
  control: ComplianceControl;
  isSelected: boolean;
  onSelect: () => void;
  style: React.CSSProperties;
}

const ControlRow = React.memo(function ControlRow({
  control,
  isSelected,
  onSelect,
  style,
}: ControlRowProps) {
  // Memoize computed values
  const statusBadge = useMemo(() => {
    const configs = {
      COMPLIANT: { className: 'bg-green-100 text-green-800', label: 'Compliant' },
      NON_COMPLIANT: { className: 'bg-red-100 text-red-800', label: 'Non-Compliant' },
      WARNING: { className: 'bg-yellow-100 text-yellow-800', label: 'Warning' },
      NOT_ASSESSED: { className: 'bg-gray-100 text-gray-800', label: 'Not Assessed' },
    };
    return configs[control.status];
  }, [control.status]);

  // Memoize handlers to prevent child re-renders
  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  return (
    <div
      style={style}
      className="flex items-center border-b border-gray-200 px-4 hover:bg-gray-50 cursor-pointer"
      onClick={handleClick}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleClick}
        className="mr-4"
      />
      <div className="flex-1">
        <div className="font-medium">{control.title}</div>
        <div className="text-sm text-gray-500">ID: {control.id}</div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
        <span className="text-sm text-gray-500">{control.evidenceCount} evidence</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - skip style comparison for virtual rows
  return (
    prevProps.control.id === nextProps.control.id &&
    prevProps.control.status === nextProps.control.status &&
    prevProps.control.lastAssessedAt === nextProps.control.lastAssessedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// Filtering with Web Workers (simplified - would use actual Worker in production)
function useFilteredControls(
  controls: ComplianceControl[],
  filters: ControlFilters
) {
  const [filtered, setFiltered] = useState<ComplianceControl[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setIsFiltering(true);

    // Debounce filter operations
    const timeoutId = setTimeout(() => {
      let results = controls;

      if (filters.status?.length) {
        results = results.filter(c => filters.status!.includes(c.status));
      }

      if (filters.framework?.length) {
        results = results.filter(c => filters.framework!.includes(c.frameworkType));
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(c =>
          c.title.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term)
        );
      }

      // Sort
      if (filters.sortBy) {
        results = [...results].sort((a, b) => {
          const aVal = a[filters.sortBy!];
          const bVal = b[filters.sortBy!];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return filters.sortDir === 'desc' ? -comparison : comparison;
        });
      }

      setFiltered(results);
      setIsFiltering(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [controls, filters]);

  return { filtered, isFiltering };
}

// Real-Time Updates with Batching
function useRealtimeControlUpdates(queryClient: QueryClient) {
  useEffect(() => {
    const eventSource = new EventSource('/api/controls/stream');

    // Batch updates that arrive in quick succession
    const pendingUpdates: ControlUpdate[] = [];
    let flushTimeout: NodeJS.Timeout;

    eventSource.onmessage = (event) => {
      pendingUpdates.push(JSON.parse(event.data));

      clearTimeout(flushTimeout);
      flushTimeout = setTimeout(() => {
        // Apply batched updates to query cache
        queryClient.setQueryData<ComplianceControl[]>(
          ['controls'],
          (old) => {
            if (!old) return old;

            const updates = new Map(pendingUpdates.map(u => [u.controlId, u]));
            pendingUpdates.length = 0; // Clear batch

            return old.map(control => {
              const update = updates.get(control.id);
              return update ? { ...control, ...update.changes } : control;
            });
          }
        );
      }, 100); // 100ms batching window
    };

    return () => {
      clearTimeout(flushTimeout);
      eventSource.close();
    };
  }, [queryClient]);
}

// Main Performance-Optimized Dashboard Component
interface ComplianceDashboardProps {
  initialFilters?: ControlFilters;
}

export function PerformanceOptimizedComplianceDashboard({
  initialFilters = {},
}: ComplianceDashboardProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ControlFilters>(initialFilters);
  const [groupBy, setGroupBy] = useState<GroupBy>('framework');

  const { data: controls = [], isLoading } = useComplianceControls(filters);
  const { filtered, isFiltering } = useFilteredControls(controls, filters);
  const uiState = useControlUIState();

  // Set up real-time updates
  useRealtimeControlUpdates(queryClient);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Compliance Controls Dashboard</h1>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search controls..."
            value={filters.searchTerm || ''}
            onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
            className="border rounded-lg px-4 py-2 flex-1"
          />
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as GroupBy)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="none">No Grouping</option>
            <option value="framework">Group by Framework</option>
            <option value="status">Group by Status</option>
          </select>
        </div>

        {isFiltering && (
          <div className="text-sm text-gray-500">Filtering...</div>
        )}
      </div>

      {/* Virtualized Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <VirtualizedControlTable
          controls={filtered}
          groupBy={groupBy}
          selectedIds={uiState.selectedIds}
          onSelect={uiState.toggleSelection}
        />
      )}

      {/* Selection Summary */}
      {uiState.selectedIds.size > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {uiState.selectedIds.size} control(s) selected
        </div>
      )}
    </div>
  );
}

