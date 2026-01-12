/**
 * Question: Designing a Real-Time Compliance Dashboard
 * 
 * We need to build a dashboard that shows compliance posture across multiple 
 * frameworks (SOC 2, FedRAMP, ISO) in near real-time. This implementation 
 * demonstrates how to architect the React frontend to handle streaming compliance 
 * data from multiple sources while maintaining performance.
 * 
 * Key Technical Decisions:
 * - Server-Sent Events (SSE) for real-time updates (simpler than WebSockets for one-way data)
 * - Normalized state shape to prevent update cascades
 * - Virtualization for high-cardinality data rendering
 * - Memoized selectors for expensive compliance calculations
 */

import React, { useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// Types
type Framework = 'SOC2' | 'FEDRAMP' | 'ISO27001';

interface Framework {
  id: string;
  name: Framework;
  description: string;
}

interface Control {
  id: string;
  frameworkId: string;
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'NOT_ASSESSED';
  lastAssessedAt: string;
  evidenceCount: number;
}

interface Evidence {
  id: string;
  controlId: string;
  collectedAt: string;
  type: string;
  data: unknown;
}

interface ComplianceState {
  frameworks: Record<string, Framework>;
  controls: Record<string, Control>;
  evidence: Record<string, Evidence>;
  controlsByFramework: Record<string, string[]>;
  complianceScores: Record<string, number>;
  lastUpdate: string;
}

interface ControlUpdate {
  controlId: string;
  status: Control['status'];
  lastAssessedAt: string;
  evidenceCount: number;
}

type ComplianceAction =
  | { type: 'CONTROL_UPDATE'; payload: ControlUpdate }
  | { type: 'FRAMEWORK_SYNC'; payload: { frameworks: Framework[]; controls: Control[] } }
  | { type: 'INITIALIZE'; payload: ComplianceState };

// Initial state
const initialState: ComplianceState = {
  frameworks: {},
  controls: {},
  evidence: {},
  controlsByFramework: {},
  complianceScores: {},
  lastUpdate: new Date().toISOString(),
};

// Reducer
function complianceReducer(
  state: ComplianceState,
  action: ComplianceAction
): ComplianceState {
  switch (action.type) {
    case 'CONTROL_UPDATE': {
      const { controlId, ...updates } = action.payload;
      const control = state.controls[controlId];
      
      if (!control) return state;

      const updatedControls = {
        ...state.controls,
        [controlId]: { ...control, ...updates },
      };

      // Recalculate framework score
      const frameworkId = control.frameworkId;
      const frameworkControls = Object.values(updatedControls).filter(
        c => c.frameworkId === frameworkId
      );
      const compliantCount = frameworkControls.filter(
        c => c.status === 'COMPLIANT'
      ).length;
      const complianceScore = frameworkControls.length > 0
        ? (compliantCount / frameworkControls.length) * 100
        : 0;

      return {
        ...state,
        controls: updatedControls,
        complianceScores: {
          ...state.complianceScores,
          [frameworkId]: complianceScore,
        },
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'FRAMEWORK_SYNC': {
      const frameworks = action.payload.frameworks.reduce(
        (acc, f) => ({ ...acc, [f.id]: f }),
        {} as Record<string, Framework>
      );
      const controls = action.payload.controls.reduce(
        (acc, c) => ({ ...acc, [c.id]: c }),
        {} as Record<string, Control>
      );

      // Build controlsByFramework index
      const controlsByFramework: Record<string, string[]> = {};
      Object.values(controls).forEach(control => {
        if (!controlsByFramework[control.frameworkId]) {
          controlsByFramework[control.frameworkId] = [];
        }
        controlsByFramework[control.frameworkId].push(control.id);
      });

      // Calculate compliance scores
      const complianceScores: Record<string, number> = {};
      Object.entries(controlsByFramework).forEach(([frameworkId, controlIds]) => {
        const frameworkControls = controlIds.map(id => controls[id]);
        const compliantCount = frameworkControls.filter(
          c => c.status === 'COMPLIANT'
        ).length;
        complianceScores[frameworkId] = frameworkControls.length > 0
          ? (compliantCount / frameworkControls.length) * 100
          : 0;
      });

      return {
        ...state,
        frameworks,
        controls,
        controlsByFramework,
        complianceScores,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'INITIALIZE':
      return action.payload;

    default:
      return state;
  }
}

// Custom hook for compliance event stream
function useComplianceStream(frameworks: Framework[]) {
  const [state, dispatch] = useReducer(complianceReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      frameworks: frameworks.map(f => f.id).join(','),
      tenant: getCurrentTenant(), // Assume this function exists
    });

    eventSourceRef.current = new EventSource(
      `/api/compliance/stream?${params}`
    );

    eventSourceRef.current.addEventListener('control-update', (event) => {
      const update: ControlUpdate = JSON.parse(event.data);
      // Batch updates to prevent render thrashing
      dispatch({ type: 'CONTROL_UPDATE', payload: update });
    });

    eventSourceRef.current.addEventListener('framework-sync', (event) => {
      // Full framework state sync - happens periodically for consistency
      const data = JSON.parse(event.data);
      dispatch({ type: 'FRAMEWORK_SYNC', payload: data });
    });

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Implement reconnection logic here
    };

    return () => {
      eventSourceRef.current?.close();
    };
  }, [frameworks]);

  return state;
}

// Helper function (would be implemented elsewhere)
function getCurrentTenant(): string {
  // Implementation would get tenant from auth context
  return 'default-tenant';
}

// Memoized selector for framework posture
function useFrameworkPosture(
  frameworkId: string,
  controls: Record<string, Control>,
  controlsByFramework: Record<string, string[]>
) {
  return useMemo(() => {
    const controlIds = controlsByFramework[frameworkId] || [];
    const frameworkControls = controlIds.map(id => controls[id]).filter(Boolean);
    
    if (frameworkControls.length === 0) {
      return {
        score: 0,
        totalControls: 0,
        compliantCount: 0,
        nonCompliantCount: 0,
        warningCount: 0,
      };
    }

    const compliantCount = frameworkControls.filter(
      c => c.status === 'COMPLIANT'
    ).length;
    const nonCompliantCount = frameworkControls.filter(
      c => c.status === 'NON_COMPLIANT'
    ).length;
    const warningCount = frameworkControls.filter(
      c => c.status === 'WARNING'
    ).length;

    return {
      score: (compliantCount / frameworkControls.length) * 100,
      totalControls: frameworkControls.length,
      compliantCount,
      nonCompliantCount,
      warningCount,
    };
  }, [frameworkId, controls, controlsByFramework]);
}

// Virtualized control grid component
interface ControlGridProps {
  controls: Control[];
  onControlClick?: (controlId: string) => void;
}

function ControlGrid({ controls, onControlClick }: ControlGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: controls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Control card height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ControlCard
            key={controls[virtualRow.index].id}
            control={controls[virtualRow.index]}
            onClick={() => onControlClick?.(controls[virtualRow.index].id)}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              width: '100%',
              height: virtualRow.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Control card component
interface ControlCardProps {
  control: Control;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function ControlCard({ control, onClick, style }: ControlCardProps) {
  const statusColors = {
    COMPLIANT: 'bg-green-100 text-green-800',
    NON_COMPLIANT: 'bg-red-100 text-red-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    NOT_ASSESSED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div
      style={style}
      onClick={onClick}
      className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{control.title}</h3>
          <p className="text-sm text-gray-500">ID: {control.id}</p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              statusColors[control.status]
            }`}
          >
            {control.status.replace('_', ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {control.evidenceCount} evidence
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Last assessed: {new Date(control.lastAssessedAt).toLocaleString()}
      </p>
    </div>
  );
}

// Framework panel component
interface FrameworkPanelProps {
  framework: Framework;
  controls: Control[];
  posture: ReturnType<typeof useFrameworkPosture>;
}

function FrameworkPanel({ framework, controls, posture }: FrameworkPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{framework.name}</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {posture.score.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Compliance Score</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold">{posture.totalControls}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {posture.compliantCount}
          </div>
          <div className="text-xs text-gray-500">Compliant</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {posture.nonCompliantCount}
          </div>
          <div className="text-xs text-gray-500">Non-Compliant</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">
            {posture.warningCount}
          </div>
          <div className="text-xs text-gray-500">Warnings</div>
        </div>
      </div>

      <ControlGrid controls={controls} />
    </div>
  );
}

// Main dashboard component
interface ComplianceDashboardProps {
  frameworks: Framework[];
}

export function ComplianceDashboard({ frameworks }: ComplianceDashboardProps) {
  const state = useComplianceStream(frameworks);

  const frameworkPanels = useMemo(() => {
    return frameworks.map(framework => {
      const controlIds = state.controlsByFramework[framework.id] || [];
      const controls = controlIds
        .map(id => state.controls[id])
        .filter(Boolean) as Control[];
      const posture = useFrameworkPosture(
        framework.id,
        state.controls,
        state.controlsByFramework
      );

      return {
        framework,
        controls,
        posture,
      };
    });
  }, [frameworks, state]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(state.lastUpdate).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {frameworkPanels.map(({ framework, controls, posture }) => (
          <FrameworkPanel
            key={framework.id}
            framework={framework}
            controls={controls}
            posture={posture}
          />
        ))}
      </div>
    </div>
  );
}

