/**
 * Question 1: Real-time telemetry data dashboard with 100ms updates
 * 
 * Architecture for high-frequency real-time data visualization without performance issues.
 * Implements batching, virtualization, Web Workers, and data decimation strategies.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// Types
interface TelemetryData {
  id: string;
  timestamp: number;
  sensorId: string;
  value: number;
  unit: string;
}

interface BatchedUpdate {
  data: TelemetryData[];
  timestamp: number;
}

// WebSocket connection with message queue and batching
function useTelemetryWebSocket(url: string, batchInterval: number = 100) {
  const [batchedData, setBatchedData] = useState<TelemetryData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<TelemetryData[]>([]);
  const batchTimeoutRef = useRef<number | null>(null);
  const frameRequestRef = useRef<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: TelemetryData = JSON.parse(event.data);
      
      // Add to buffer instead of immediately updating state
      bufferRef.current.push(data);

      // Schedule batch flush using requestAnimationFrame for smooth rendering
      if (!frameRequestRef.current) {
        frameRequestRef.current = requestAnimationFrame(() => {
          flushBatch();
          frameRequestRef.current = null;
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, attempting reconnect...');
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic would go here
        }
      }, 3000);
    };

    const flushBatch = () => {
      if (bufferRef.current.length > 0) {
        // Batch all buffered messages
        setBatchedData(prev => [...prev, ...bufferRef.current]);
        bufferRef.current = [];
      }
    };

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      ws.close();
    };
  }, [url, batchInterval]);

  return batchedData;
}

// Data decimation for chart rendering (LTTB - Largest Triangle Three Buckets)
function decimateData(data: TelemetryData[], maxPoints: number): TelemetryData[] {
  if (data.length <= maxPoints) return data;

  const bucketSize = (data.length - 2) / (maxPoints - 2);
  const decimated: TelemetryData[] = [data[0]]; // Always include first point

  let a = 0;

  for (let i = 0; i < maxPoints - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);

    let maxArea = -1;
    let maxAreaIndex = rangeStart;

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (data[a].timestamp - data[j].timestamp) * (data[data.length - 1].value - data[a].value) -
        (data[a].timestamp - data[data.length - 1].timestamp) * (data[j].value - data[a].value)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    decimated.push(data[maxAreaIndex]);
    a = maxAreaIndex;
  }

  decimated.push(data[data.length - 1]); // Always include last point
  return decimated;
}

// Web Worker for heavy data processing
const createDataProcessorWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { data, operation } = e.data;
      
      if (operation === 'decimate') {
        const maxPoints = e.data.maxPoints || 1000;
        const decimated = decimateData(data, maxPoints);
        self.postMessage({ result: decimated });
      } else if (operation === 'filter') {
        const filtered = data.filter(item => 
          item.value >= e.data.min && item.value <= e.data.max
        );
        self.postMessage({ result: filtered });
      }
    };
    
    function decimateData(data, maxPoints) {
      if (data.length <= maxPoints) return data;
      const bucketSize = (data.length - 2) / (maxPoints - 2);
      const decimated = [data[0]];
      let a = 0;
      
      for (let i = 0; i < maxPoints - 2; i++) {
        const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
        const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
        let maxArea = -1;
        let maxAreaIndex = rangeStart;
        
        for (let j = rangeStart; j < rangeEnd; j++) {
          const area = Math.abs(
            (data[a].timestamp - data[j].timestamp) * (data[data.length - 1].value - data[a].value) -
            (data[a].timestamp - data[data.length - 1].timestamp) * (data[j].value - data[a].value)
          ) * 0.5;
          if (area > maxArea) {
            maxArea = area;
            maxAreaIndex = j;
          }
        }
        decimated.push(data[maxAreaIndex]);
        a = maxAreaIndex;
      }
      decimated.push(data[data.length - 1]);
      return decimated;
    }
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

// Memoized sensor row component
interface SensorRowProps {
  data: TelemetryData;
  index: number;
}

const SensorRow = memo(({ data, index }: SensorRowProps) => {
  const statusColor = useMemo(() => {
    if (data.value > 1000) return 'red';
    if (data.value > 800) return 'orange';
    return 'green';
  }, [data.value]);

  return (
    <div
      style={{
        display: 'flex',
        padding: '8px',
        borderBottom: '1px solid #eee',
        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
      }}
    >
      <span style={{ width: '150px' }}>{data.sensorId}</span>
      <span style={{ width: '100px', color: statusColor, fontWeight: 'bold' }}>
        {data.value.toFixed(2)}
      </span>
      <span style={{ width: '80px' }}>{data.unit}</span>
      <span style={{ width: '200px', fontSize: '12px', color: '#666' }}>
        {new Date(data.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
});

SensorRow.displayName = 'SensorRow';

// Virtualized table for large datasets
interface VirtualizedSensorTableProps {
  data: TelemetryData[];
}

function VirtualizedSensorTable({ data }: VirtualizedSensorTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
        border: '1px solid #ddd',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <SensorRow data={data[virtualRow.index]} index={virtualRow.index} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Main dashboard component
interface TelemetryDashboardProps {
  websocketUrl: string;
  maxDisplayPoints?: number;
}

export function TelemetryDashboard({ 
  websocketUrl, 
  maxDisplayPoints = 1000 
}: TelemetryDashboardProps) {
  const rawData = useTelemetryWebSocket(websocketUrl, 100);
  const workerRef = useRef<Worker | null>(null);
  const [processedData, setProcessedData] = useState<TelemetryData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = createDataProcessorWorker();
    
    workerRef.current.onmessage = (e) => {
      setProcessedData(e.data.result);
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Process data in worker when raw data changes
  useEffect(() => {
    if (rawData.length > maxDisplayPoints && workerRef.current) {
      setIsProcessing(true);
      workerRef.current.postMessage({
        data: rawData,
        operation: 'decimate',
        maxPoints: maxDisplayPoints,
      });
    } else {
      setProcessedData(rawData);
    }
  }, [rawData, maxDisplayPoints]);

  // Group data by sensor for summary view
  const sensorSummary = useMemo(() => {
    const summary = new Map<string, { latest: TelemetryData; count: number }>();
    
    rawData.forEach(item => {
      const existing = summary.get(item.sensorId);
      if (!existing || item.timestamp > existing.latest.timestamp) {
        summary.set(item.sensorId, { latest: item, count: (existing?.count || 0) + 1 });
      } else {
        summary.set(item.sensorId, { latest: existing.latest, count: existing.count + 1 });
      }
    });

    return Array.from(summary.values());
  }, [rawData]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Real-Time Telemetry Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Total Data Points: {rawData.length}</p>
        <p>Displayed Points: {processedData.length}</p>
        {isProcessing && <p>Processing data in background...</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Sensor Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {sensorSummary.map(({ latest }) => (
            <div
              key={latest.sensorId}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{latest.sensorId}</div>
              <div style={{ fontSize: '24px', color: latest.value > 1000 ? 'red' : 'green' }}>
                {latest.value.toFixed(2)} {latest.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2>Detailed View (Virtualized)</h2>
      <VirtualizedSensorTable data={processedData} />
    </div>
  );
}

export default TelemetryDashboard;

