/**
 * TypeScript Integration & Type Safety
 * 
 * Demonstrates comprehensive TypeScript patterns for React components,
 * hooks, and type-safe state management for equipment monitoring.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Domain types
export type EquipmentStatus = 'idle' | 'running' | 'maintenance' | 'error' | 'offline';
export type SensorType = 'temperature' | 'pressure' | 'vacuum' | 'flow_rate' | 'power';

export interface SensorReading<T = number> {
  value: T;
  unit: string;
  timestamp: string; // ISO 8601
  quality: 'good' | 'uncertain' | 'bad';
  metadata?: Record<string, unknown>;
}

export interface TemperatureReading extends SensorReading<number> {
  unit: 'celsius' | 'fahrenheit' | 'kelvin';
  status: 'normal' | 'warning' | 'critical';
  threshold: number;
}

export interface PressureReading extends SensorReading<number> {
  unit: 'pascal' | 'psi' | 'bar' | 'torr';
  range: {
    min: number;
    max: number;
  };
  inRange: boolean;
}

// Discriminated union for sensor readings
export type AnySensorReading =
  | ({ type: 'temperature' } & TemperatureReading)
  | ({ type: 'pressure' } & PressureReading)
  | ({ type: 'vacuum' } & SensorReading<number>);

// Equipment model
export interface Equipment {
  id: string;
  name: string;
  type: 'cvd' | 'etch' | 'lithography' | 'metrology';
  status: EquipmentStatus;
  location: {
    facility: string;
    room: string;
    position: string;
  };
  sensors: SensorConfiguration[];
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface SensorConfiguration {
  id: string;
  type: SensorType;
  enabled: boolean;
  config: Record<string, unknown>;
}

// Alert types
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  equipmentId: string;
  sensorId: string;
  type: SensorType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

// Hook types
export interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  fetchedAt: number | null;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  retry?: number | boolean;
  retryDelay?: (attemptIndex: number) => number;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
}

export interface SensorHookOptions extends QueryOptions {
  realtime?: boolean;
  transform?: <TInput, TOutput>(data: TInput) => TOutput;
  threshold?: number;
}

export interface UseTemperatureSensorReturn extends QueryState<TemperatureReading> {
  alerts: Alert[];
  clearAlerts: () => void;
  isRealtime: boolean;
  refetch: () => Promise<void>;
}

// Type-safe hook
export function useTemperatureSensor(
  equipmentId: string,
  options: SensorHookOptions = {}
): UseTemperatureSensorReturn {
  const {
    realtime = false,
    threshold,
    transform,
    enabled = true,
    retry = 3,
    ...queryOptions
  } = options;

  const [state, setState] = useState<QueryState<TemperatureReading>>({
    data: null,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
    isFetching: false,
    fetchedAt: null,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isFetching: true }));

    try {
      const response = await fetch(
        `/api/equipment/${equipmentId}/sensors/temperature`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      let data: TemperatureReading = json.data;

      // Apply transform if provided
      if (transform) {
        data = transform(data) as TemperatureReading;
      }

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        fetchedAt: Date.now(),
      });

      // Check threshold
      if (threshold && data.value > threshold) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          equipmentId,
          sensorId: 'temp-001',
          type: 'temperature',
          severity: 'high',
          message: `Temperature ${data.value}°C exceeded threshold ${threshold}°C`,
          value: data.value,
          threshold,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };
        setAlerts(prev => [...prev, alert]);
      }
    } catch (err) {
      const error: ApiError = {
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      };

      setState(prev => ({
        ...prev,
        error,
        isLoading: false,
        isError: true,
        isFetching: false,
      }));
    }
  }, [equipmentId, enabled, threshold, transform]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!realtime || !state.isSuccess) return;

    const ws = new WebSocket(
      `wss://equipment-api/${equipmentId}/sensors/temperature/stream`
    );

    ws.onopen = () => {
      setIsRealtime(true);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const data: TemperatureReading = JSON.parse(event.data);

      setState(prev => ({
        ...prev,
        data: transform ? (transform(data) as TemperatureReading) : data,
        fetchedAt: Date.now(),
      }));

      // Check threshold
      if (threshold && data.value > threshold) {
        const alert: Alert = {
          id: `alert-${Date.now()}`,
          equipmentId,
          sensorId: 'temp-001',
          type: 'temperature',
          severity: 'high',
          message: `Temperature ${data.value}°C exceeded threshold ${threshold}°C`,
          value: data.value,
          threshold,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };
        setAlerts(prev => [...prev, alert]);
      }
    };

    ws.onerror = () => {
      setIsRealtime(false);
    };

    ws.onclose = () => {
      setIsRealtime(false);
    };

    return () => {
      ws.close();
    };
  }, [realtime, state.isSuccess, equipmentId, threshold, transform]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    ...state,
    alerts,
    clearAlerts,
    isRealtime,
    refetch,
  };
}

// Type-safe component props
interface TemperatureDisplayProps {
  equipmentId: string;
  unit?: 'celsius' | 'fahrenheit';
  threshold?: number;
  realtime?: boolean;
  className?: string;
  onAlertClick?: (alert: Alert) => void;
}

// Type-safe component
export const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({
  equipmentId,
  unit = 'celsius',
  threshold = 1000,
  realtime = false,
  className = '',
  onAlertClick,
}) => {
  const { data, isLoading, error, alerts, clearAlerts, isRealtime } =
    useTemperatureSensor(equipmentId, {
      realtime,
      threshold,
      transform: (rawData): TemperatureReading => {
        const data = rawData as TemperatureReading;

        // Convert units if needed
        const value = unit === 'fahrenheit'
          ? (data.value * 9 / 5) + 32
          : data.value;

        return {
          ...data,
          value,
          unit,
          status: getStatus(value, threshold),
        };
      },
    });

  if (isLoading) {
    return (
      <div className={`temperature-display loading ${className}`}>
        <div className="spinner" role="status" aria-label="Loading temperature data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`temperature-display error ${className}`} role="alert">
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`temperature-display ${className}`}>
      <div className="display-header">
        <h3>Temperature</h3>
        {isRealtime && <LiveIndicator />}
      </div>

      <div className="temperature-value">
        <span className="value">{data.value.toFixed(1)}</span>
        <span className="unit">°{data.unit === 'celsius' ? 'C' : 'F'}</span>
      </div>

      <StatusBadge
        status={data.status}
        data-testid="status-badge"
      />

      {alerts.length > 0 && (
        <AlertPanel
          alerts={alerts}
          onClear={clearAlerts}
          onAlertClick={onAlertClick}
          data-testid="alert-panel"
        />
      )}
    </div>
  );
};

// Helper function with type narrowing
function getStatus(
  value: number,
  threshold: number
): 'normal' | 'warning' | 'critical' {
  const percentage = (value / threshold) * 100;

  if (percentage < 70) return 'normal';
  if (percentage < 90) return 'warning';
  return 'critical';
}

// Type-safe status badge component
interface StatusBadgeProps {
  status: 'normal' | 'warning' | 'critical';
  'data-testid'?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, 'data-testid': testId }) => {
  const statusConfig: Record<StatusBadgeProps['status'], { label: string; className: string }> = {
    normal: { label: 'Normal', className: 'status-normal' },
    warning: { label: 'Warning', className: 'status-warning' },
    critical: { label: 'Critical', className: 'status-critical' },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`status-badge ${config.className}`}
      data-testid={testId}
    >
      {config.label}
    </div>
  );
};

// Type-safe alert panel
interface AlertPanelProps {
  alerts: Alert[];
  onClear: () => void;
  onAlertClick?: (alert: Alert) => void;
  'data-testid'?: string;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onClear,
  onAlertClick,
  'data-testid': testId,
}) => {
  return (
    <div data-testid={testId} role="alert">
      <h4>Alerts ({alerts.length})</h4>
      {alerts.map(alert => (
        <div
          key={alert.id}
          onClick={() => onAlertClick?.(alert)}
          style={{ cursor: onAlertClick ? 'pointer' : 'default' }}
        >
          {alert.message}
        </div>
      ))}
      <button onClick={onClear}>Clear Alerts</button>
    </div>
  );
};

// Live indicator component
const LiveIndicator: React.FC = () => (
  <span className="live-indicator" aria-label="Real-time data">
    ● Live
  </span>
);

// Type guard functions
export function isTemperatureReading(
  reading: AnySensorReading
): reading is { type: 'temperature' } & TemperatureReading {
  return reading.type === 'temperature';
}

export function isPressureReading(
  reading: AnySensorReading
): reading is { type: 'pressure' } & PressureReading {
  return reading.type === 'pressure';
}

// Type-safe utility function
export function getControlHierarchy(control: AnySensorReading): string[] {
  if (isTemperatureReading(control)) {
    return [control.unit, control.status, String(control.threshold)];
  }
  if (isPressureReading(control)) {
    return [control.unit, String(control.range.min), String(control.range.max)];
  }
  return [control.unit];
}

