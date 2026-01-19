/**
 * Question 8: State Management Without Redux
 * 
 * Implements complex state management using Context API + useReducer
 * with middleware support, real-time updates, and persistence for
 * semiconductor manufacturing workflows.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';

// Types
interface Equipment {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'maintenance' | 'error';
  temperature: number;
  pressure: number;
  lastUpdate: number;
}

interface Process {
  id: string;
  equipmentId: string;
  type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

interface QualityMeasurement {
  id: string;
  processId: string;
  timestamp: number;
  yield: number;
  defectRate: number;
}

interface ManufacturingState {
  equipment: Record<string, Equipment>;
  processes: {
    active: Process[];
    queued: Process[];
    completed: Process[];
  };
  qualityData: QualityMeasurement[];
  alerts: Alert[];
  user: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

interface Alert {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  equipmentId?: string;
  timestamp: number;
  acknowledged: boolean;
}

// Action types
type ManufacturingAction =
  | { type: 'UPDATE_EQUIPMENT'; payload: { id: string; data: Partial<Equipment> } }
  | { type: 'START_PROCESS'; payload: Process }
  | { type: 'COMPLETE_PROCESS'; payload: { id: string; endTime: number } }
  | { type: 'FAIL_PROCESS'; payload: { id: string; error: string } }
  | { type: 'ADD_QUALITY_MEASUREMENT'; payload: QualityMeasurement }
  | { type: 'ADD_ALERT'; payload: Omit<Alert, 'id' | 'timestamp'> }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: string }
  | { type: 'SET_USER'; payload: ManufacturingState['user'] }
  | { type: 'RESET_STATE' }
  | { type: 'LOAD_STATE'; payload: Partial<ManufacturingState> };

// Initial state
const initialState: ManufacturingState = {
  equipment: {},
  processes: {
    active: [],
    queued: [],
    completed: [],
  },
  qualityData: [],
  alerts: [],
  user: null,
};

// Reducer
function manufacturingReducer(
  state: ManufacturingState,
  action: ManufacturingAction
): ManufacturingState {
  switch (action.type) {
    case 'UPDATE_EQUIPMENT': {
      const { id, data } = action.payload;
      return {
        ...state,
        equipment: {
          ...state.equipment,
          [id]: {
            ...state.equipment[id],
            ...data,
            lastUpdate: Date.now(),
          },
        },
      };
    }

    case 'START_PROCESS': {
      const process = { ...action.payload, status: 'running' as const, startTime: Date.now() };
      return {
        ...state,
        processes: {
          ...state.processes,
          queued: state.processes.queued.filter(p => p.id !== process.id),
          active: [...state.processes.active, process],
        },
      };
    }

    case 'COMPLETE_PROCESS': {
      const { id, endTime } = action.payload;
      const process = state.processes.active.find(p => p.id === id);
      if (!process) return state;

      return {
        ...state,
        processes: {
          ...state.processes,
          active: state.processes.active.filter(p => p.id !== id),
          completed: [...state.processes.completed, { ...process, status: 'completed', endTime }],
        },
      };
    }

    case 'FAIL_PROCESS': {
      const { id } = action.payload;
      return {
        ...state,
        processes: {
          ...state.processes,
          active: state.processes.active.filter(p => p.id !== id),
          completed: [
            ...state.processes.completed,
            {
              ...state.processes.active.find(p => p.id === id)!,
              status: 'failed',
              endTime: Date.now(),
            },
          ],
        },
      };
    }

    case 'ADD_QUALITY_MEASUREMENT': {
      return {
        ...state,
        qualityData: [...state.qualityData.slice(-99), action.payload], // Keep last 100
      };
    }

    case 'ADD_ALERT': {
      const alert: Alert = {
        ...action.payload,
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        acknowledged: false,
      };
      return {
        ...state,
        alerts: [...state.alerts, alert],
      };
    }

    case 'ACKNOWLEDGE_ALERT': {
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload ? { ...alert, acknowledged: true } : alert
        ),
      };
    }

    case 'SET_USER': {
      return {
        ...state,
        user: action.payload,
      };
    }

    case 'RESET_STATE': {
      return initialState;
    }

    case 'LOAD_STATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}

// Middleware type
type Middleware = (
  action: ManufacturingAction,
  state: ManufacturingState,
  next: (action: ManufacturingAction) => ManufacturingState
) => ManufacturingState;

// Middleware implementations
const loggingMiddleware: Middleware = (action, state, next) => {
  console.log('[Action]', action.type, action);
  const newState = next(action);
  console.log('[State Update]', { before: state, after: newState });
  return newState;
};

const persistenceMiddleware: Middleware = (action, state, next) => {
  const newState = next(action);
  
  // Persist to localStorage (debounced in real implementation)
  try {
    const toPersist = {
      equipment: newState.equipment,
      processes: newState.processes,
      user: newState.user,
    };
    localStorage.setItem('manufacturing-state', JSON.stringify(toPersist));
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
  
  return newState;
};

const alertingMiddleware: Middleware = (action, state, next) => {
  const newState = next(action);
  
  // Check for critical conditions after state update
  if (action.type === 'UPDATE_EQUIPMENT') {
    const equipment = newState.equipment[action.payload.id];
    if (equipment) {
      if (equipment.temperature > 1000) {
        // Auto-add alert for high temperature
        if (!state.alerts.some(a => a.equipmentId === equipment.id && !a.acknowledged)) {
          // This would trigger another action, but for simplicity we'll handle it here
          console.warn('High temperature detected:', equipment);
        }
      }
    }
  }
  
  return newState;
};

// Context
interface ManufacturingContextValue {
  state: ManufacturingState;
  dispatch: React.Dispatch<ManufacturingAction>;
  startProcess: (process: Omit<Process, 'id' | 'status'>) => void;
  updateEquipment: (id: string, data: Partial<Equipment>) => void;
  acknowledgeAlert: (alertId: string) => void;
}

const ManufacturingContext = createContext<ManufacturingContextValue | null>(null);

// Provider with middleware support
interface ManufacturingProviderProps {
  children: ReactNode;
  middlewares?: Middleware[];
}

export function ManufacturingProvider({ 
  children, 
  middlewares = [loggingMiddleware, persistenceMiddleware, alertingMiddleware] 
}: ManufacturingProviderProps) {
  const [state, baseDispatch] = useReducer(manufacturingReducer, initialState, (initial) => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('manufacturing-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
    return initial;
  });

  // Enhanced dispatch with middleware
  const dispatch = useCallback((action: ManufacturingAction) => {
    let currentState = state;
    
    const enhancedDispatch = (action: ManufacturingAction): ManufacturingState => {
      // Apply all middlewares
      let newState = currentState;
      for (const middleware of middlewares) {
        newState = middleware(action, currentState, (action) => {
          return manufacturingReducer(currentState, action);
        });
        currentState = newState;
      }
      return newState;
    };
    
    const newState = enhancedDispatch(action);
    baseDispatch(action); // Update React state
  }, [state, middlewares]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://manufacturing.local/realtime');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'equipment_update':
          dispatch({
            type: 'UPDATE_EQUIPMENT',
            payload: { id: update.equipmentId, data: update.data },
          });
          break;
        
        case 'quality_data':
          dispatch({
            type: 'ADD_QUALITY_MEASUREMENT',
            payload: update.data,
          });
          break;
        
        case 'alert':
          dispatch({
            type: 'ADD_ALERT',
            payload: update.data,
          });
          break;
      }
    };
    
    return () => ws.close();
  }, [dispatch]);

  // Helper functions
  const startProcess = useCallback((process: Omit<Process, 'id' | 'status'>) => {
    const newProcess: Process = {
      ...process,
      id: `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
    };
    dispatch({ type: 'START_PROCESS', payload: newProcess });
  }, [dispatch]);

  const updateEquipment = useCallback((id: string, data: Partial<Equipment>) => {
    dispatch({ type: 'UPDATE_EQUIPMENT', payload: { id, data } });
  }, [dispatch]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId });
  }, [dispatch]);

  const value: ManufacturingContextValue = {
    state,
    dispatch,
    startProcess,
    updateEquipment,
    acknowledgeAlert,
  };

  return (
    <ManufacturingContext.Provider value={value}>
      {children}
    </ManufacturingContext.Provider>
  );
}

// Custom hooks
export function useManufacturing() {
  const context = useContext(ManufacturingContext);
  if (!context) {
    throw new Error('useManufacturing must be used within ManufacturingProvider');
  }
  return context;
}

export function useEquipment(equipmentId: string) {
  const { state } = useManufacturing();
  return state.equipment[equipmentId];
}

export function useProcessQueue() {
  const { state, startProcess } = useManufacturing();
  return {
    active: state.processes.active,
    queued: state.processes.queued,
    completed: state.processes.completed,
    startProcess,
  };
}

export function useAlerts() {
  const { state, acknowledgeAlert } = useManufacturing();
  return {
    alerts: state.alerts.filter(a => !a.acknowledged),
    allAlerts: state.alerts,
    acknowledgeAlert,
  };
}

// Example usage component
export function EquipmentDashboard() {
  const { state } = useManufacturing();
  const processQueue = useProcessQueue();
  const alerts = useAlerts();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manufacturing Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Alerts ({alerts.alerts.length})</h2>
        {alerts.alerts.map(alert => (
          <div key={alert.id} style={{ 
            padding: '10px', 
            marginBottom: '10px',
            backgroundColor: alert.level === 'critical' ? '#fee' : '#fff3cd',
            border: '1px solid #ccc'
          }}>
            <p>{alert.message}</p>
            <button onClick={() => alerts.acknowledgeAlert(alert.id)}>Acknowledge</button>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Equipment Status</h2>
        {Object.values(state.equipment).map(equipment => (
          <div key={equipment.id} style={{ 
            padding: '10px', 
            marginBottom: '10px',
            border: '1px solid #ddd'
          }}>
            <h3>{equipment.name}</h3>
            <p>Status: {equipment.status}</p>
            <p>Temperature: {equipment.temperature}°C</p>
            <p>Pressure: {equipment.pressure} kPa</p>
          </div>
        ))}
      </div>

      <div>
        <h2>Process Queue</h2>
        <p>Active: {processQueue.active.length}</p>
        <p>Queued: {processQueue.queued.length}</p>
        <p>Completed: {processQueue.completed.length}</p>
      </div>
    </div>
  );
}

