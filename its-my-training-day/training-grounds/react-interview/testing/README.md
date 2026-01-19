# React Testing Strategies - Interview Deep Dive

Comprehensive testing strategies for React applications, covering unit tests, integration tests, custom hook testing, and accessibility testing.

## 🎯 Testing Philosophy

**Key Principle**: Test behavior, not implementation

```typescript
// ❌ BAD: Testing implementation details
expect(component.state.count).toBe(5);
expect(mockFunction).toHaveBeenCalledTimes(3);

// ✅ GOOD: Testing user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
```

**Why**: Implementation can change without affecting user experience. Tests should remain stable when refactoring.

---

## 📁 Implementation

### 01-comprehensive-testing-strategy.tsx
**Complexity**: ⭐⭐⭐⭐
**Interview Focus**: RTL, Custom hook testing, Accessibility testing, Integration testing

---

## 🔍 Testing Pyramid for React

```
        /\
       /E2\     ← End-to-End (Cypress, Playwright) - Few, critical user flows
      /────\
     /Integ\   ← Integration Tests - Components working together
    /────────\
   /   Unit   \ ← Unit Tests - Individual components, hooks, utilities
  /────────────\
```

**Distribution**:
- 70% Unit tests (fast, isolated, many)
- 20% Integration tests (medium speed, connected)
- 10% E2E tests (slow, expensive, critical paths only)

---

## 🔍 Deep Technical Analysis

### 1. React Testing Library Philosophy

**Guiding Principles**:
1. **Test what users see**: Use `getByText`, `getByRole`, not `getByTestId`
2. **Test interactions**: Click buttons, type in forms
3. **Test outcomes**: Check what appears/disappears
4. **Avoid implementation details**: Don't test state, props directly

```typescript
// ❌ BAD: Testing implementation
import { shallow } from 'enzyme';

const wrapper = shallow(<Counter initialCount={0} />);
expect(wrapper.state('count')).toBe(0);
wrapper.instance().increment();
expect(wrapper.state('count')).toBe(1);

// ✅ GOOD: Testing behavior
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

render(<Counter initialCount={0} />);
expect(screen.getByText('Count: 0')).toBeInTheDocument();

await userEvent.click(screen.getByRole('button', { name: /increment/i }));
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

#### Interview Question: RTL vs Enzyme

**Q: Why is React Testing Library preferred over Enzyme?**
A: "RTL encourages testing from the user's perspective:

**Enzyme problems**:
- ❌ Tests implementation (state, props, instance methods)
- ❌ Tests break on refactoring (class → functional, state → hooks)
- ❌ Can test things users never see
- ❌ Not maintained (last update 2019)

**RTL benefits**:
- ✅ Tests user-visible behavior
- ✅ Refactoring-proof (implementation-agnostic)
- ✅ Accessibility-first (queries by role, label)
- ✅ Actively maintained

Example: Converting class to hooks
```typescript
// Enzyme test breaks:
expect(wrapper.state('count')).toBe(5); // ❌ Functional components have no state

// RTL test still passes:
expect(screen.getByText('Count: 5')).toBeInTheDocument(); // ✅ Still renders same
```"

---

### 2. Query Priority

**RTL Query Hierarchy** (prefer top to bottom):

```typescript
// 1. getByRole - BEST (most accessible)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('heading', { level: 1 });

// 2. getByLabelText - Forms
screen.getByLabelText(/username/i);

// 3. getByPlaceholderText - If no label
screen.getByPlaceholderText(/enter email/i);

// 4. getByText - For non-interactive content
screen.getByText(/compliance status/i);

// 5. getByDisplayValue - Form current values
screen.getByDisplayValue('john@example.com');

// 6. getByAltText - Images
screen.getByAltText(/company logo/i);

// 7. getByTitle - Last resort
screen.getByTitle(/tooltip text/i);

// 8. getByTestId - WORST (use only when necessary)
screen.getByTestId('custom-component');
```

**Why this order?**
- Top queries test accessibility (screen readers use roles/labels)
- Bottom queries don't test real user experience

#### Interview Question: Query Selection

**Q: When would you use getByTestId?**
A: "Only as a last resort when:

1. **Third-party components**: Can't modify to add roles
```typescript
// Can't add role to library component
screen.getByTestId('react-select-dropdown');
```

2. **Dynamic content**: Text/roles change frequently
```typescript
// Error message text changes based on validation
screen.getByTestId('error-message');
```

3. **Non-semantic elements**: No appropriate role
```typescript
// Decorative SVG with no role
screen.getByTestId('loading-spinner');
```

For everything else, use semantic queries:
```typescript
// ✅ Instead of getByTestId('submit-button'):
screen.getByRole('button', { name: /submit/i });

// ✅ Instead of getByTestId('error-text'):
screen.getByText(/invalid email/i);
```"

---

### 3. Testing Custom Hooks

**renderHook utility** from RTL:

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

**Testing hooks with dependencies** (Context, Props):

```typescript
describe('useWebSocket', () => {
  it('establishes connection on mount', () => {
    const mockWs = vi.fn(() => ({
      close: vi.fn(),
      send: vi.fn(),
    }));

    global.WebSocket = mockWs as any;

    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    expect(mockWs).toHaveBeenCalledWith('ws://localhost:8080');
  });

  it('reconnects on connection loss', async () => {
    // ... test reconnection logic
  });
});

describe('useAuth', () => {
  it('returns user from context', () => {
    const wrapper = ({ children }) => (
      <AuthProvider user={{ id: '1', name: 'Test' }}>
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({ id: '1', name: 'Test' });
  });
});
```

---

### 4. Testing Asynchronous Behavior

**waitFor, findBy queries**:

```typescript
describe('ComplianceDataTable', () => {
  it('loads and displays compliance data', async () => {
    // Mock API
    mockApi.getComplianceData.mockResolvedValue([
      { id: '1', status: 'pass', control: 'AC-1' },
      { id: '2', status: 'fail', control: 'AC-2' },
    ]);

    render(<ComplianceDataTable />);

    // Initially shows loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    expect(await screen.findByText('AC-1')).toBeInTheDocument();
    expect(await screen.findByText('AC-2')).toBeInTheDocument();

    // Loading indicator gone
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('shows error on fetch failure', async () => {
    mockApi.getComplianceData.mockRejectedValue(new Error('Network error'));

    render(<ComplianceDataTable />);

    // Wait for error message
    expect(
      await screen.findByText(/failed to load compliance data/i)
    ).toBeInTheDocument();

    // Verify retry button present
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('refetches data on retry', async () => {
    mockApi.getComplianceData
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ id: '1', status: 'pass', control: 'AC-1' }]);

    render(<ComplianceDataTable />);

    // Wait for error
    await screen.findByText(/failed to load/i);

    // Click retry
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Data loads successfully
    expect(await screen.findByText('AC-1')).toBeInTheDocument();
  });
});
```

**findBy vs waitFor**:
```typescript
// ✅ findBy: Combines getBy + waitFor (preferred)
const element = await screen.findByText('Loaded');

// ⚠️ waitFor: More flexible but verbose
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

---

### 5. Testing User Interactions

**userEvent (preferred over fireEvent)**:

```typescript
import userEvent from '@testing-library/user-event';

describe('ComplianceForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<ComplianceForm onSubmit={mockSubmit} />);

    // Type in form fields
    await user.type(
      screen.getByLabelText(/control id/i),
      'AC-1'
    );

    await user.type(
      screen.getByLabelText(/evidence/i),
      'Access control list reviewed'
    );

    // Select dropdown
    await user.selectOptions(
      screen.getByLabelText(/status/i),
      'pass'
    );

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify submission
    expect(mockSubmit).toHaveBeenCalledWith({
      controlId: 'AC-1',
      evidence: 'Access control list reviewed',
      status: 'pass',
    });
  });

  it('shows validation errors for invalid data', async () => {
    const user = userEvent.setup();

    render(<ComplianceForm />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Validation errors appear
    expect(await screen.findByText(/control id is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/evidence is required/i)).toBeInTheDocument();
  });
});
```

**userEvent vs fireEvent**:
```typescript
// ❌ fireEvent: Dispatches events directly (not realistic)
fireEvent.change(input, { target: { value: 'test' } });
fireEvent.click(button);

// ✅ userEvent: Simulates real user interactions
await userEvent.type(input, 'test'); // Fires keyDown, keyPress, input, keyUp
await userEvent.click(button); // Fires mouseOver, mouseDown, focus, mouseUp, click
```

userEvent is slower but more realistic (catches issues fireEvent misses).

---

### 6. Accessibility Testing

**jest-axe for automated a11y testing**:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ComplianceTable accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ComplianceTable data={mockData} />);

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<ComplianceTable data={mockData} />);

    // Table has accessible name
    expect(screen.getByRole('table', { name: /compliance controls/i })).toBeInTheDocument();

    // Column headers
    expect(screen.getByRole('columnheader', { name: /control id/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();

    // Rows have proper structure
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ComplianceTable data={mockData} />);

    const firstRow = screen.getAllByRole('row')[1];

    // Tab to table
    await user.tab();

    // Keyboard navigation
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('row')[2]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(firstRow).toHaveFocus();
  });
});
```

**Manual accessibility checks**:
- ✅ Can navigate with keyboard only
- ✅ Screen reader announces content correctly
- ✅ Focus indicators visible
- ✅ Color contrast sufficient
- ✅ Form labels associated correctly

---

### 7. Integration Testing

**Testing multiple components together**:

```typescript
describe('Compliance workflow integration', () => {
  it('completes full compliance review workflow', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <ComplianceWorkflow />
      </QueryClientProvider>
    );

    // Step 1: Select framework
    await user.click(screen.getByLabelText(/soc 2/i));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Map controls
    expect(await screen.findByText(/control mapping/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/ac-1/i));
    await user.click(screen.getByLabelText(/ac-2/i));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Upload evidence
    const file = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload evidence/i);
    await user.upload(input, file);

    expect(await screen.findByText('evidence.pdf')).toBeInTheDocument();

    // Step 4: Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Success message
    expect(
      await screen.findByText(/compliance review submitted/i)
    ).toBeInTheDocument();
  });
});
```

---

### 8. Mocking Strategies

**API mocks with MSW (Mock Service Worker)**:

```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/compliance/controls', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', controlId: 'AC-1', status: 'pass' },
        { id: '2', controlId: 'AC-2', status: 'fail' },
      ])
    );
  }),

  rest.post('/api/compliance/submit', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('loads compliance controls', async () => {
  render(<ComplianceTable />);

  expect(await screen.findByText('AC-1')).toBeInTheDocument();
  expect(await screen.findByText('AC-2')).toBeInTheDocument();
});
```

**Component mocks**:
```typescript
// Mock heavy third-party component
vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ pageNumber }: any) => <div data-testid={`pdf-page-${pageNumber}`} />,
}));
```

---

## 🎓 Study Strategy

### Must Know

1. **RTL philosophy**: Test behavior, not implementation
2. **Query priority**: getByRole > getByLabelText > ... > getByTestId
3. **Async testing**: findBy, waitFor patterns
4. **userEvent**: Realistic user interactions
5. **Accessibility testing**: jest-axe, manual checks

### Practice Explaining

"For testing React components, I use React Testing Library because it encourages testing from the user's perspective rather than implementation details. This makes tests more resilient to refactoring.

I prioritize semantic queries like `getByRole` and `getByLabelText`, which also test accessibility, only falling back to `getByTestId` when absolutely necessary.

For user interactions, I use `userEvent` instead of `fireEvent` because it simulates real user behavior more accurately, catching issues like missing event handlers that `fireEvent` would miss.

For asynchronous behavior, I use `findBy` queries which combine `getBy` with `waitFor`, and I test both success and error states.

I also integrate automated accessibility testing with jest-axe to catch WCAG violations, and test keyboard navigation to ensure the app is accessible."

---

## 🔑 Key Patterns

- ✅ Test behavior, not implementation
- ✅ Prefer getByRole over getByTestId
- ✅ Use userEvent for realistic interactions
- ✅ Test async with findBy/waitFor
- ✅ Mock APIs with MSW
- ✅ Automated a11y tests with jest-axe
- ✅ Integration tests for critical workflows

---

Good luck with your Adobe TechGRC interview! 🚀
