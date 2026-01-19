/**
 * Question 4: Comprehensive error boundaries with telemetry and graceful degradation
 * 
 * Implements multi-layer error handling with logging, recovery, and fallback UIs
 * for mission-critical equipment monitoring applications.
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';

// Error types
interface ErrorInfo {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  timestamp: string;
  componentStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'critical' | 'page' | 'visualization';
  name?: string;
  equipmentId?: string;
  autoRecover?: boolean;
  fallback?: (props: {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    reset: () => void;
  }) => ReactNode;
  onReset?: () => void;
}

// Error tracking service
class ErrorTracker {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100;

  captureException(error: Error, context?: Record<string, any>) {
    const errorInfo: ErrorInfo = {
      error,
      errorInfo: context as any,
      errorId: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...context,
    };

    this.errors.push(errorInfo);

    // Send to monitoring service
    this.sendToService(errorInfo);

    // Store in localStorage as fallback
    this.storeLocally(errorInfo);

    return errorInfo.errorId;
  }

  private sendToService(errorInfo: ErrorInfo) {
    // In production, send to Sentry, LogRocket, etc.
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo),
    }).catch(err => {
      console.error('Failed to send error to service:', err);
    });

    // Also send to external monitoring if available
    if (window.Sentry) {
      window.Sentry.captureException(errorInfo.error, {
        extra: errorInfo,
      });
    }
  }

  private storeLocally(errorInfo: ErrorInfo) {
    try {
      const stored = JSON.parse(localStorage.getItem('offline-errors') || '[]');
      stored.push(errorInfo);
      stored.slice(-this.maxErrors); // Keep only last N errors
      localStorage.setItem('offline-errors', JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }

  getErrorRate(): number {
    const oneMinuteAgo = Date.now() - 60000;
    return this.errors.filter(e => 
      new Date(e.timestamp).getTime() > oneMinuteAgo
    ).length;
  }
}

export const errorTracker = new ErrorTracker();

// Alert service for critical errors
class AlertService {
  alertOnCall(alert: { severity: string; message: string; error?: string; stack?: string }) {
    // In production, integrate with PagerDuty, OpsGenie, etc.
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    }).catch(console.error);
  }
}

export const alertService = new AlertService();

// Base error boundary component
export class EquipmentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = errorTracker.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Root',
      userContext: {
        equipmentId: this.props.equipmentId,
        userId: this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });

    this.setState(prevState => ({
      error,
      errorInfo: errorInfo as any,
      errorCount: prevState.errorCount + 1,
      errorId,
    }));

    // Alert on-call if critical component fails
    if (this.props.level === 'critical') {
      alertService.alertOnCall({
        severity: 'high',
        message: `Critical component ${this.props.name} failed`,
        error: error.message,
        stack: errorInfo.componentStack,
      });
    }

    // Auto-recovery attempt
    if (this.props.autoRecover && this.state.errorCount < 3) {
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }, 5000);
    }
  }

  private getCurrentUserId(): string {
    // In production, get from auth context
    return 'user-123';
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorId: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      return (
        <ErrorFallback
          level={this.props.level || 'page'}
          errorId={this.state.errorId}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          critical={this.props.level === 'critical'}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback component
interface ErrorFallbackProps {
  level: 'critical' | 'page' | 'visualization';
  errorId: string | null;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  critical?: boolean;
}

function ErrorFallback({
  level,
  errorId,
  error,
  errorInfo,
  onReset,
  critical = false,
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  const fallbackContent = {
    critical: (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fee', border: '2px solid #f00' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2>Critical System Error</h2>
        <p>Equipment monitoring has encountered a critical error.</p>
        <p>Error ID: {errorId}</p>
        <p>Our team has been automatically notified.</p>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => window.location.href = '/emergency-shutdown'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#d00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Emergency Shutdown
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          }}>
            Try Again
          </button>
        </div>
      </div>
    ),
    page: (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2>Something went wrong</h2>
        <p>Error ID: {errorId}</p>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={onReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
        {showDetails && error && (
          <div style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '4px' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error.toString()}
              {errorInfo?.componentStack && `\n\nComponent Stack:\n${errorInfo.componentStack}`}
            </pre>
          </div>
        )}
      </div>
    ),
    visualization: (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
        <p>Chart temporarily unavailable</p>
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >
          Reload Chart
        </button>
      </div>
    ),
  };

  return fallbackContent[level] || fallbackContent.page;
}

// Specialized error boundaries
export const CriticalSystemBoundary: React.FC<{ children: ReactNode; equipmentId?: string }> = ({ 
  children, 
  equipmentId 
}) => (
  <EquipmentErrorBoundary level="critical" name="CriticalSystem" equipmentId={equipmentId}>
    {children}
  </EquipmentErrorBoundary>
);

export const DataVisualizationBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EquipmentErrorBoundary
    level="visualization"
    name="DataVisualization"
    autoRecover={true}
    fallback={({ reset }) => (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Visualization component failed to load</p>
        <button onClick={reset}>Retry</button>
      </div>
    )}
  >
    {children}
  </EquipmentErrorBoundary>
);

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
    errorTracker.captureException(error, {
      hook: 'useErrorHandler',
    });
    // Re-throw to trigger error boundary
    throw error;
  }, []);

  return { error, resetError, captureError };
}

// Safe component wrapper
export function SafeComponent({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Render error:', error);
    return <>{fallback}</>;
  }
}

// Global error handlers setup
export function setupGlobalErrorHandlers() {
  // Global error handler
  window.addEventListener('error', (event) => {
    errorTracker.captureException(event.error, {
      type: 'unhandledError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureException(event.reason, {
      type: 'unhandledRejection',
      promise: event.promise,
    });
    event.preventDefault();
  });
}

// Example usage component
export function EquipmentDashboard({ equipmentId }: { equipmentId: string }) {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <CriticalSystemBoundary equipmentId={equipmentId}>
      <div className="dashboard">
        <h1>Equipment Monitoring Dashboard</h1>
        
        <DataVisualizationBoundary>
          <div>Real-time charts and visualizations</div>
        </DataVisualizationBoundary>

        <EquipmentErrorBoundary
          name="AlertPanel"
          level="page"
          equipmentId={equipmentId}
        >
          <div>Alert panel</div>
        </EquipmentErrorBoundary>

        <EquipmentErrorBoundary
          name="ControlPanel"
          level="page"
          equipmentId={equipmentId}
        >
          <div>Control panel</div>
        </EquipmentErrorBoundary>
      </div>
    </CriticalSystemBoundary>
  );
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

