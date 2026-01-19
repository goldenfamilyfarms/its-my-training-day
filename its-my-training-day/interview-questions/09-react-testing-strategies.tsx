/**
 * Interview Question 9: Comprehensive React Testing Strategies
 * 
 * Implement a complete testing suite for a compliance component that demonstrates:
 * - Unit testing with React Testing Library
 * - Integration testing for component interactions
 * - Custom hook testing
 * - Async operation testing
 * - Mocking strategies
 * - Accessibility testing
 * 
 * Key Technical Requirements:
 * - Test component rendering and interactions
 * - Test custom hooks in isolation
 * - Test async data fetching
 * - Test error states and edge cases
 * - Ensure accessibility compliance
 */

import React, { useState, useEffect } from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';

// Component to test
interface ComplianceControl {
  id: string;
  title: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
}

interface ComplianceListProps {
  controls: ComplianceControl[];
  onControlClick?: (control: ComplianceControl) => void;
  loading?: boolean;
  error?: Error | null;
}

export function ComplianceList({
  controls,
  onControlClick,
  loading = false,
  error = null,
}: ComplianceListProps) {
  if (loading) {
    return <div role="status" aria-live="polite">Loading controls...</div>;
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive">
        Error: {error.message}
      </div>
    );
  }

  if (controls.length === 0) {
    return <div>No controls found</div>;
  }

  return (
    <ul role="list" aria-label="Compliance controls">
      {controls.map(control => (
        <li key={control.id}>
          <button
            onClick={() => onControlClick?.(control)}
            aria-label={`${control.title}, status: ${control.status}`}
          >
            <span>{control.title}</span>
            <span className={`status-${control.status.toLowerCase()}`}>
              {control.status}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Custom hook to test
export function useComplianceControls(framework?: string) {
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchControls() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchComplianceControls(framework);
        if (!cancelled) {
          setControls(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    fetchControls();

    return () => {
      cancelled = true;
    };
  }, [framework]);

  return { controls, loading, error };
}

// Mock API function
async function fetchComplianceControls(framework?: string): Promise<ComplianceControl[]> {
  // Would be actual API call in production
  return [
    { id: '1', title: 'Control 1', status: 'COMPLIANT' },
    { id: '2', title: 'Control 2', status: 'NON_COMPLIANT' },
  ];
}

// ========== TEST SUITE ==========

describe('ComplianceList Component', () => {
  const mockControls: ComplianceControl[] = [
    { id: '1', title: 'Access Control', status: 'COMPLIANT' },
    { id: '2', title: 'Encryption', status: 'NON_COMPLIANT' },
    { id: '3', title: 'Logging', status: 'WARNING' },
  ];

  it('renders list of controls', () => {
    render(<ComplianceList controls={mockControls} />);
    
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Access Control')).toBeInTheDocument();
    expect(screen.getByText('Encryption')).toBeInTheDocument();
    expect(screen.getByText('Logging')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ComplianceList controls={[]} loading={true} />);
    
    expect(screen.getByRole('status')).toHaveTextContent('Loading controls...');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows error state', () => {
    const error = new Error('Failed to load controls');
    render(<ComplianceList controls={[]} error={error} />);
    
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Failed to load controls');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('shows empty state', () => {
    render(<ComplianceList controls={[]} />);
    
    expect(screen.getByText('No controls found')).toBeInTheDocument();
  });

  it('calls onControlClick when control is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<ComplianceList controls={mockControls} onControlClick={handleClick} />);
    
    const button = screen.getByLabelText(/Access Control/);
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledWith(mockControls[0]);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<ComplianceList controls={mockControls} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Compliance controls');
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('displays status with correct class names', () => {
    render(<ComplianceList controls={mockControls} />);
    
    const compliantButton = screen.getByLabelText(/Access Control/);
    expect(compliantButton.querySelector('.status-compliant')).toBeInTheDocument();
  });
});

describe('useComplianceControls Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches controls on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useComplianceControls());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.controls).toEqual([]);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.controls.length).toBeGreaterThan(0);
  });

  it('handles fetch errors', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useComplianceControls());
    
    await waitForNextUpdate();
    
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
    
    global.fetch = originalFetch;
  });

  it('refetches when framework changes', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ framework }) => useComplianceControls(framework),
      { initialProps: { framework: 'SOC2' } }
    );
    
    await waitForNextUpdate();
    const firstControls = result.current.controls;
    
    rerender({ framework: 'FEDRAMP' });
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    expect(result.current.controls).not.toEqual(firstControls);
  });

  it('cancels fetch on unmount', async () => {
    const { result, unmount } = renderHook(() => useComplianceControls());
    
    unmount();
    
    // Should not update state after unmount
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current.loading).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('loads and displays controls from API', async () => {
    const mockControls: ComplianceControl[] = [
      { id: '1', title: 'Test Control', status: 'COMPLIANT' },
    ];
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockControls,
    });

    function TestComponent() {
      const { controls, loading, error } = useComplianceControls();
      
      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      
      return <ComplianceList controls={controls} />;
    }

    render(<TestComponent />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Control')).toBeInTheDocument();
    });
  });
});

/**
 * Key Concepts Explained:
 * 
 * 1. React Testing Library: Tests behavior, not implementation. Encourages
 *    accessible, user-centric tests.
 * 
 * 2. Query Methods: Use role-based queries (getByRole) for accessibility.
 *    Prefer semantic queries over test IDs.
 * 
 * 3. Async Testing: Use waitFor and waitForNextUpdate for async operations.
 *    Don't use arbitrary timeouts.
 * 
 * 4. Custom Hook Testing: Use renderHook to test hooks in isolation.
 *    Test state changes and side effects.
 * 
 * 5. Mocking: Mock external dependencies (API calls, modules). Use jest.fn()
 *    for function mocks, jest.mock() for module mocks.
 * 
 * Interview Talking Points:
 * - Testing philosophy: Test behavior, not implementation details
 * - Accessibility: Use role-based queries, test ARIA attributes
 * - Async testing: Proper waiting strategies, avoid flaky tests
 * - Coverage: Aim for high coverage, but focus on critical paths
 */

