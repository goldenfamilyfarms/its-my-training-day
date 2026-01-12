/**
 * Question 3: Optimize React component rendering large table (10,000+ rows)
 * 
 * Implements virtualization, memoization, inline editing, sorting, and filtering
 * with Web Worker support for heavy operations.
 */

import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { VariableSizeGrid } from 'react-window';

// Types
interface WaferTestResult {
  id: string;
  waferId: string;
  testName: string;
  result: number;
  status: 'pass' | 'fail' | 'warning';
  timestamp: number;
  operator: string;
  notes?: string;
}

interface SortConfig {
  key: keyof WaferTestResult;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  [key: string]: string | number | boolean;
}

// Memoized cell component
interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    rows: WaferTestResult[];
    columns: ColumnDef[];
    editingCell: string | null;
    onCellEdit: (rowIndex: number, columnKey: string, value: any) => void;
    onCellClick: (rowIndex: number, columnIndex: number) => void;
  };
}

const Cell = memo(({ columnIndex, rowIndex, style, data }: CellProps) => {
  const { rows, columns, editingCell, onCellEdit, onCellClick } = data;
  const row = rows[rowIndex];
  const column = columns[columnIndex];
  const cellKey = `${rowIndex}-${columnIndex}`;
  const isEditing = editingCell === cellKey;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onCellEdit(rowIndex, column.key, e.target.value);
  }, [rowIndex, column.key, onCellEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCellEdit(rowIndex, column.key, e.currentTarget.value);
    } else if (e.key === 'Escape') {
      onCellClick(-1, -1); // Cancel editing
    }
  }, [rowIndex, column.key, onCellEdit, onCellClick]);

  const cellValue = row[column.key as keyof WaferTestResult];
  const formattedValue = column.format ? column.format(cellValue) : String(cellValue);

  if (isEditing && column.editable) {
    return (
      <div style={style} className="cell editing">
        <input
          ref={inputRef}
          type={column.inputType || 'text'}
          defaultValue={String(cellValue)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', height: '100%', padding: '4px' }}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      onClick={() => column.editable && onCellClick(rowIndex, columnIndex)}
      className={`cell ${column.editable ? 'editable' : ''} ${row.status}`}
      title={column.editable ? 'Click to edit' : ''}
    >
      {formattedValue}
    </div>
  );
});

Cell.displayName = 'Cell';

// Column definitions
interface ColumnDef {
  key: keyof WaferTestResult;
  label: string;
  width: number;
  editable?: boolean;
  inputType?: string;
  format?: (value: any) => string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'waferId', label: 'Wafer ID', width: 150 },
  { key: 'testName', label: 'Test Name', width: 200 },
  { key: 'result', label: 'Result', width: 120, editable: true, inputType: 'number', format: (v) => v.toFixed(3) },
  { key: 'status', label: 'Status', width: 100, editable: true },
  { key: 'operator', label: 'Operator', width: 150, editable: true },
  { key: 'timestamp', label: 'Timestamp', width: 180, format: (v) => new Date(v).toLocaleString() },
  { key: 'notes', label: 'Notes', width: 250, editable: true },
];

// Batch update utility with debouncing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

const batchUpdate = debounce((updates: WaferTestResult[]) => {
  fetch('/api/wafer-results/batch', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(console.error);
}, 1000);

// Web Worker for heavy filtering/sorting
function createFilterSortWorker() {
  const workerCode = `
    self.onmessage = function(e) {
      const { data, filters, sortConfig } = e.data;
      
      let filtered = [...data];
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            filtered = filtered.filter(row => {
              const cellValue = row[key];
              if (typeof value === 'string') {
                return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
              }
              return cellValue === value;
            });
          }
        });
      }
      
      // Apply sorting
      if (sortConfig && sortConfig.key) {
        filtered.sort((a, b) => {
          const aVal = a[sortConfig.key];
          const bVal = b[sortConfig.key];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }
      
      self.postMessage({ result: filtered });
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// Main table component
interface WaferTestResultsTableProps {
  initialData: WaferTestResult[];
}

export function WaferTestResultsTable({ initialData }: WaferTestResultsTableProps) {
  const [data, setData] = useState<WaferTestResult[]>(initialData);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<WaferTestResult[]>(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingUpdatesRef = useRef<Map<string, WaferTestResult>>(new Map());

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = createFilterSortWorker();
    
    workerRef.current.onmessage = (e) => {
      setProcessedData(e.data.result);
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Process data in worker when filters or sort changes
  useEffect(() => {
    if (workerRef.current && data.length > 1000) {
      setIsProcessing(true);
      workerRef.current.postMessage({ data, filters, sortConfig });
    } else {
      // For smaller datasets, process in main thread
      let filtered = [...data];

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered = filtered.filter(row => {
            const cellValue = row[key as keyof WaferTestResult];
            if (typeof value === 'string') {
              return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
            }
            return cellValue === value;
          });
        }
      });

      if (sortConfig) {
        filtered.sort((a, b) => {
          const aVal = a[sortConfig.key];
          const bVal = b[sortConfig.key];
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }

      setProcessedData(filtered);
    }
  }, [data, filters, sortConfig]);

  // Optimized edit handler with batching
  const handleCellEdit = useCallback((rowIndex: number, columnKey: string, value: any) => {
    const actualRow = processedData[rowIndex];
    const actualIndex = data.findIndex(r => r.id === actualRow.id);
    
    if (actualIndex === -1) return;

    setData(prevData => {
      const newData = [...prevData];
      const updatedRow = {
        ...newData[actualIndex],
        [columnKey]: value,
      };
      newData[actualIndex] = updatedRow;

      // Batch update to backend
      pendingUpdatesRef.current.set(updatedRow.id, updatedRow);
      
      // Flush batch after delay
      setTimeout(() => {
        if (pendingUpdatesRef.current.size > 0) {
          const updates = Array.from(pendingUpdatesRef.current.values());
          batchUpdate(updates);
          pendingUpdatesRef.current.clear();
        }
      }, 1000);

      return newData;
    });

    setEditingCell(null);
  }, [processedData, data]);

  const handleCellClick = useCallback((rowIndex: number, columnIndex: number) => {
    if (rowIndex >= 0 && columnIndex >= 0) {
      setEditingCell(`${rowIndex}-${columnIndex}`);
    } else {
      setEditingCell(null);
    }
  }, []);

  const handleSort = useCallback((columnKey: keyof WaferTestResult) => {
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, []);

  const handleFilter = useCallback((columnKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value || undefined,
    }));
  }, []);

  const getColumnWidth = useCallback((index: number) => {
    return COLUMNS[index]?.width || 150;
  }, []);

  const getRowHeight = useCallback(() => 40, []);

  const gridData = useMemo(() => ({
    rows: processedData,
    columns: COLUMNS,
    editingCell,
    onCellEdit: handleCellEdit,
    onCellClick: handleCellClick,
  }), [processedData, editingCell, handleCellEdit, handleCellClick]);

  return (
    <div className="table-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with filters and sort */}
      <div style={{ padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {COLUMNS.map(column => (
            <div key={column.key} style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{column.label}</label>
              <input
                type="text"
                placeholder={`Filter ${column.label}`}
                value={filters[column.key] || ''}
                onChange={(e) => handleFilter(column.key, e.target.value)}
                style={{ padding: '4px', fontSize: '12px' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Total: {data.length} | Filtered: {processedData.length}
            {isProcessing && <span style={{ marginLeft: '10px', color: '#666' }}>Processing...</span>}
          </div>
          <button onClick={() => setFilters({})} style={{ padding: '5px 10px' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Virtualized grid */}
      <div style={{ flex: 1, position: 'relative' }}>
        <VariableSizeGrid
          columnCount={COLUMNS.length}
          rowCount={processedData.length}
          columnWidth={getColumnWidth}
          rowHeight={getRowHeight}
          height={600}
          width={1200}
          itemData={gridData}
        >
          {Cell}
        </VariableSizeGrid>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Rows: {data.length}</span>
          <span>Filtered Rows: {processedData.length}</span>
        </div>
      </div>
    </div>
  );
}

export default WaferTestResultsTable;

