/**
 * Question 6: Custom React hooks for WebSocket connections
 * 
 * Implements WebSocket management with automatic reconnection, state synchronization,
 * heartbeat, and message queuing for semiconductor equipment sensors.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: any) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface WebSocketHookReturn {
  connectionState: ConnectionState;
  lastMessage: any;
  messageHistory: any[];
  sendMessage: (message: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

// Core WebSocket hook with reconnection logic
export function useEquipmentWebSocket(
  url: string,
  options: WebSocketOptions = {}
): WebSocketHookReturn {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<any[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        startHeartbeat();

        // Flush message queue
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(queuedMessage));
          }
        }

        onOpen?.(event);
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Handle different message types
        if (message.type === 'pong') {
          // Heartbeat response
          return;
        }

        setLastMessage(message);
        setMessageHistory(prev => [...prev.slice(-99), message]); // Keep last 100 messages

        onMessage?.(message);
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        onError?.(event);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed');
        setConnectionState('disconnected');
        stopHeartbeat();

        onClose?.(event);

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          setConnectionState('failed');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('error');
      scheduleReconnect();
    }
  }, [url, maxReconnectAttempts, onOpen, onClose, onError, onMessage]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const backoffDelay = Math.min(
      reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      30000 // Max 30 seconds
    );

    setConnectionState('reconnecting');
    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, backoffDelay);
  }, [reconnectInterval, connect]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      messageQueueRef.current.push(message);

      // Attempt to reconnect
      if (connectionState === 'disconnected') {
        connect();
      }
    }
  }, [connectionState, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
  }, [stopHeartbeat]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // Only run on mount/unmount

  return {
    connectionState,
    lastMessage,
    messageHistory,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

// Specialized hook for equipment sensor data
interface SensorData {
  sensorId: string;
  value: number;
  timestamp: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface SensorAlert {
  id: string;
  sensorId: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

interface UseEquipmentSensorsReturn {
  sensorData: Record<string, SensorData>;
  alerts: SensorAlert[];
  syncStatus: 'syncing' | 'synced' | 'error';
  updateSensorConfig: (sensorId: string, config: any) => void;
  acknowledgeAlert: (alertId: string) => void;
  connectionState: ConnectionState;
}

export function useEquipmentSensors(
  equipmentId: string
): UseEquipmentSensorsReturn {
  const [sensorData, setSensorData] = useState<Record<string, SensorData>>({});
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');

  const { connectionState, sendMessage, lastMessage } = useEquipmentWebSocket(
    `ws://equipment.local/sensors/${equipmentId}`,
    {
      onMessage: (message) => {
        switch (message.type) {
          case 'sensor_update':
            handleSensorUpdate(message.data);
            break;
          case 'alert':
            handleAlert(message.data);
            break;
          case 'sync_complete':
            setSyncStatus('synced');
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      },
      onOpen: () => {
        // Request initial sync
        sendMessage({ type: 'sync_request', equipmentId });
      },
      onError: () => {
        setSyncStatus('error');
      },
    }
  );

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(prev => ({
      ...prev,
      [data.sensorId]: {
        ...data,
        status: getSensorStatus(data.value, data.sensorId),
      },
    }));

    // Check thresholds
    const threshold = getThresholdForSensor(data.sensorId);
    if (threshold && (data.value > threshold.max || data.value < threshold.min)) {
      handleAlert({
        level: 'warning',
        sensorId: data.sensorId,
        message: `Sensor ${data.sensorId} out of range: ${data.value}${data.unit}`,
      });
    }
  }, []);

  const handleAlert = useCallback((alert: Omit<SensorAlert, 'id' | 'timestamp'>) => {
    setAlerts(prev => [
      ...prev,
      {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const updateSensorConfig = useCallback((sensorId: string, config: any) => {
    sendMessage({
      type: 'config_update',
      sensorId,
      config,
    });
  }, [sendMessage]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    sendMessage({
      type: 'alert_acknowledge',
      alertId,
    });
  }, [sendMessage]);

  return {
    sensorData,
    alerts,
    syncStatus,
    updateSensorConfig,
    acknowledgeAlert,
    connectionState,
  };
}

// Helper functions
function getSensorStatus(value: number, sensorId: string): 'normal' | 'warning' | 'critical' {
  const threshold = getThresholdForSensor(sensorId);
  if (!threshold) return 'normal';

  if (value > threshold.criticalMax || value < threshold.criticalMin) {
    return 'critical';
  }
  if (value > threshold.warningMax || value < threshold.warningMin) {
    return 'warning';
  }
  return 'normal';
}

function getThresholdForSensor(sensorId: string): {
  min: number;
  max: number;
  warningMin: number;
  warningMax: number;
  criticalMin: number;
  criticalMax: number;
} | null {
  // In production, fetch from configuration
  const thresholds: Record<string, any> = {
    'temp-001': { min: 0, max: 1000, warningMin: 100, warningMax: 900, criticalMin: 0, criticalMax: 1000 },
    'pressure-001': { min: 0, max: 100000, warningMin: 10000, warningMax: 90000, criticalMin: 0, criticalMax: 100000 },
  };

  return thresholds[sensorId] || null;
}

// Example usage component
export function EquipmentSensorMonitor({ equipmentId }: { equipmentId: string }) {
  const { sensorData, alerts, syncStatus, acknowledgeAlert, connectionState } = 
    useEquipmentSensors(equipmentId);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Equipment Sensors: {equipmentId}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Connection: {connectionState}</p>
        <p>Sync Status: {syncStatus}</p>
      </div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
          <h3>Alerts ({alerts.length})</h3>
          {alerts.map(alert => (
            <div key={alert.id} style={{ marginBottom: '10px' }}>
              <p>{alert.message}</p>
              <button onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3>Sensor Data</h3>
        {Object.entries(sensorData).map(([sensorId, data]) => (
          <div key={sensorId} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
            <div><strong>{sensorId}</strong></div>
            <div>Value: {data.value} {data.unit}</div>
            <div>Status: <span style={{ color: data.status === 'critical' ? 'red' : data.status === 'warning' ? 'orange' : 'green' }}>
              {data.status}
            </span></div>
            <div>Time: {new Date(data.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

