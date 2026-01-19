/**
 * Question 14: Comprehensive Testing Strategy
 * 
 * Implements unit tests, integration tests, and E2E tests for
 * mission-critical equipment monitoring dashboard.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Example component to test
interface TemperatureDisplayProps {
  equipmentId: string;
  temperature: number;
  threshold: number;
  onThresholdChange?: (threshold: number) => void;
}

function TemperatureDisplay({ 
  equipmentId, 
  temperature, 
  threshold,
  onThresholdChange 
}: TemperatureDisplayProps) {
  const status = temperature > threshold ? 'critical' : 'normal';
  
  return (
    <div data-testid={`temperature-display-${equipmentId}`}>
      <h3>Temperature Monitor</h3>
      <div data-testid="temperature-value">
        {temperature.toFixed(1)}°C
      </div>
      <div data-testid="status-badge" className={`status-${status}`}>
        {status === 'critical' ? 'Critical' : 'Normal'}
      </div>
      {temperature > threshold && (
        <div data-testid="alert-panel" role="alert">
          Temperature exceeded threshold of {threshold}°C
        </div>
      )}
      {onThresholdChange && (
        <input
          data-testid="threshold-input"
          type="number"
          defaultValue={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
        />
      )}
    </div>
  );
}

// Unit Tests
describe('TemperatureDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays temperature value correctly', () => {
    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
      />
    );

    expect(screen.getByTestId('temperature-value')).toHaveTextContent('850.0°C');
  });

  it('shows normal status when temperature is below threshold', () => {
    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
      />
    );

    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('Normal');
    expect(statusBadge).toHaveClass('status-normal');
  });

  it('shows critical status and alert when temperature exceeds threshold', () => {
    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={1050}
        threshold={1000}
      />
    );

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Critical');
    expect(screen.getByTestId('alert-panel')).toBeInTheDocument();
    expect(screen.getByTestId('alert-panel')).toHaveTextContent(
      'Temperature exceeded threshold of 1000°C'
    );
  });

  it('calls onThresholdChange when threshold input changes', async () => {
    const user = userEvent.setup();
    const handleThresholdChange = vi.fn();

    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
        onThresholdChange={handleThresholdChange}
      />
    );

    const thresholdInput = screen.getByTestId('threshold-input');
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '900');

    expect(handleThresholdChange).toHaveBeenCalledWith(900);
  });
});

// Integration Tests
describe('Equipment Dashboard Integration', () => {
  it('handles multiple sensor updates', async () => {
    const { rerender } = render(
      <TemperatureDisplay equipmentId="eq-123" temperature={800} threshold={1000} />
    );

    expect(screen.getByTestId('temperature-value')).toHaveTextContent('800.0°C');

    // Simulate real-time update
    rerender(
      <TemperatureDisplay equipmentId="eq-123" temperature={1050} threshold={1000} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('temperature-value')).toHaveTextContent('1050.0°C');
      expect(screen.getByTestId('alert-panel')).toBeInTheDocument();
    });
  });

  it('handles threshold adjustment workflow', async () => {
    const user = userEvent.setup();
    const handleThresholdChange = vi.fn();

    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
        onThresholdChange={handleThresholdChange}
      />
    );

    // Initially normal
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Normal');

    // Change threshold
    const thresholdInput = screen.getByTestId('threshold-input');
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '800');

    expect(handleThresholdChange).toHaveBeenCalledWith(800);
  });
});

// Custom Hook Testing
function useTemperatureSensor(equipmentId: string) {
  const [temperature, setTemperature] = React.useState(850);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    // Simulate fetch
    setIsLoading(true);
    setTimeout(() => {
      setTemperature(850);
      setIsLoading(false);
    }, 100);
  }, [equipmentId]);

  return { temperature, isLoading };
}

describe('useTemperatureSensor Hook', () => {
  it('fetches initial temperature data', async () => {
    const { result } = renderHook(() => useTemperatureSensor('eq-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.temperature).toBe(850);
  });
});

// Mock Service Worker setup for API mocking
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/equipment/:id/temperature', () => {
    return HttpResponse.json({ temperature: 850, timestamp: Date.now() });
  }),
  http.post('/api/equipment/:id/threshold', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, threshold: body.threshold });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// E2E Test Example (would use Playwright in real implementation)
describe('E2E: Equipment Monitoring Flow', () => {
  it('monitors equipment and responds to alerts', async () => {
    // This would be a Playwright test in practice
    // For now, showing the structure
    
    // 1. Navigate to dashboard
    // await page.goto('/equipment/eq-123');
    
    // 2. Verify initial state
    // await expect(page.locator('[data-testid="temperature-value"]')).toContainText('850°C');
    
    // 3. Simulate threshold breach
    // await page.route('**/api/equipment/eq-123/temperature', route => 
    //   route.fulfill({ json: { temperature: 1050 } })
    // );
    
    // 4. Verify alert appears
    // await expect(page.locator('[data-testid="alert-panel"]')).toBeVisible();
  });
});

// Test utilities
export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Performance testing
describe('Performance Tests', () => {
  it('renders large dataset efficiently', async () => {
    const startTime = performance.now();
    
    const { container } = render(
      <div>
        {Array.from({ length: 1000 }, (_, i) => (
          <TemperatureDisplay
            key={i}
            equipmentId={`eq-${i}`}
            temperature={850 + i}
            threshold={1000}
          />
        ))}
      </div>
    );

    const renderTime = performance.now() - startTime;
    
    // Should render 1000 components in under 1 second
    expect(renderTime).toBeLessThan(1000);
    expect(container.querySelectorAll('[data-testid^="temperature-display"]')).toHaveLength(1000);
  });
});

// Accessibility testing
describe('Accessibility Tests', () => {
  it('has proper ARIA attributes', () => {
    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={1050}
        threshold={1000}
      />
    );

    const alertPanel = screen.getByTestId('alert-panel');
    expect(alertPanel).toHaveAttribute('role', 'alert');
  });

  it('has accessible status indicators', () => {
    render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
      />
    );

    const statusBadge = screen.getByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('Normal');
  });
});

// Snapshot testing
describe('Snapshot Tests', () => {
  it('matches snapshot for normal state', () => {
    const { container } = render(
      <TemperatureDisplay
        equipmentId="eq-123"
        temperature={850}
        threshold={1000}
      />
    );

    expect(container).toMatchSnapshot();
  });
});

