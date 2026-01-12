/**
 * Question 7: Accessibility (a11y) Implementation
 * 
 * Comprehensive WCAG 2.1 AA compliance for semiconductor equipment monitoring
 * with support for clean room environments, keyboard navigation, and screen readers.
 */

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';

// Types
interface FocusableElement {
  id: string;
  element: HTMLElement;
  order: number;
}

// Keyboard navigation hook
export function useKeyboardNavigation() {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusableElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerElement = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      focusableElementsRef.current.set(id, element);
    } else {
      focusableElementsRef.current.delete(id);
    }
  }, []);

  const focusElement = useCallback((id: string) => {
    const element = focusableElementsRef.current.get(id);
    if (element) {
      element.focus();
      setFocusedId(id);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const elements = Array.from(focusableElementsRef.current.entries());
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = focusedId 
        ? elements.findIndex(([id]) => id === focusedId)
        : -1;
      
      const nextIndex = e.key === 'ArrowDown'
        ? (currentIndex + 1) % elements.length
        : (currentIndex - 1 + elements.length) % elements.length;
      
      if (elements[nextIndex]) {
        focusElement(elements[nextIndex][0]);
      }
    }
  }, [focusedId, focusElement]);

  return { registerElement, focusElement, handleKeyDown, focusedId };
}

// Focus trap hook
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as any);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
      
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({ isOpen, onClose, title, children }: AccessibleModalProps) {
  const modalRef = useFocusTrap(isOpen);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Dialog opened: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, title]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef as any}
        className="modal-content"
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id={titleId}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 10px',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Accessible form component
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function AccessibleFormField({
  id,
  label,
  error,
  required,
  hint,
  children,
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span aria-label="required" style={{ color: 'red' }}>
            *
          </span>
        )}
      </label>
      {hint && (
        <div id={hintId} className="field-hint" style={{ fontSize: '12px', color: '#666' }}>
          {hint}
        </div>
      )}
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : 'false',
        'aria-describedby': [error ? errorId : null, hint ? hintId : null]
          .filter(Boolean)
          .join(' ') || undefined,
      })}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible data table
interface AccessibleTableProps {
  caption: string;
  headers: string[];
  data: Array<Record<string, any>>;
  rowKey: string;
}

export function AccessibleTable({ caption, headers, data, rowKey }: AccessibleTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <caption style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'left' }}>
        {caption}
      </caption>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              scope="col"
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                textAlign: 'left',
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row[rowKey]}>
            {headers.map((header, index) => (
              <td
                key={index}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                }}
              >
                {row[header]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Skip link component
export function SkipLink({ targetId, label = 'Skip to main content' }: { targetId: string; label?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '0',
        backgroundColor: '#000',
        color: '#fff',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 100,
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      {label}
    </a>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </span>
  );
}

// Live region for announcements
export function LiveRegion({ children, priority = 'polite' }: { children: React.ReactNode; priority?: 'polite' | 'assertive' }) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Example accessible dashboard
export function AccessibleEquipmentDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');

  const handleAlert = useCallback(() => {
    setAnnouncement('New alert received: Temperature threshold exceeded');
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  return (
    <div>
      <SkipLink targetId="main-content" />
      
      <header role="banner" style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h1>Equipment Monitoring Dashboard</h1>
        <nav role="navigation" aria-label="Main navigation">
          <ul style={{ listStyle: 'none', display: 'flex', gap: '20px' }}>
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#equipment">Equipment</a></li>
            <li><a href="#alerts">Alerts</a></li>
          </ul>
        </nav>
      </header>

      <main id="main-content" role="main" style={{ padding: '20px' }}>
        <h2>Equipment Status</h2>
        
        <AccessibleTable
          caption="Current equipment status and metrics"
          headers={['Equipment', 'Status', 'Temperature', 'Pressure']}
          data={[
            { id: '1', Equipment: 'Wafer Processor 1', Status: 'Running', Temperature: '850°C', Pressure: '101.3 kPa' },
            { id: '2', Equipment: 'Wafer Processor 2', Status: 'Idle', Temperature: '25°C', Pressure: '100.0 kPa' },
          ]}
          rowKey="id"
        />

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Open settings dialog"
            style={{ padding: '10px 20px', marginRight: '10px' }}
          >
            Settings
          </button>
          <button
            onClick={handleAlert}
            aria-label="Trigger test alert"
            style={{ padding: '10px 20px' }}
          >
            Test Alert
          </button>
        </div>

        <AccessibleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Equipment Settings"
        >
          <form>
            <AccessibleFormField
              id="temperature-threshold"
              label="Temperature Threshold"
              required
              hint="Enter value between 0 and 2000°C"
              error={undefined}
            >
              <input type="number" min="0" max="2000" />
            </AccessibleFormField>
            
            <AccessibleFormField
              id="pressure-threshold"
              label="Pressure Threshold"
              required
            >
              <input type="number" min="0" max="1000" />
            </AccessibleFormField>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" style={{ padding: '10px 20px', marginRight: '10px' }}>
                Save
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </AccessibleModal>
      </main>

      <LiveRegion priority="assertive">
        {announcement}
      </LiveRegion>

      <footer role="contentinfo" style={{ padding: '20px', backgroundColor: '#f5f5f5', marginTop: '40px' }}>
        <p>&copy; 2026 Equipment Monitoring System</p>
      </footer>
    </div>
  );
}

