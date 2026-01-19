# React Technical Interview Questions - Platform Engineering

This directory contains senior-level React implementations for compliance and GRC platform engineering. Each file demonstrates production-ready patterns, performance optimizations, and best practices for building complex React applications.

## Directory Contents

### 01-real-time-compliance-dashboard.tsx
**Question:** Design a real-time compliance dashboard that shows compliance posture across multiple frameworks (SOC 2, FedRAMP, ISO) with streaming updates.

**Key Concepts Demonstrated:**
- **Server-Sent Events (SSE)** for one-way real-time data streaming
- **Normalized state management** using useReducer to prevent cascading updates
- **Virtualization** with @tanstack/react-virtual for rendering large lists efficiently
- **Memoized selectors** using useMemo to prevent expensive recalculations
- **State shape optimization** - storing data in normalized form (Record<string, T>) for O(1) lookups

**Step-by-Step Implementation:**

1. **State Architecture:**
   - Normalized state: `{ frameworks: Record<id, Framework>, controls: Record<id, Control> }`
   - Index structure: `controlsByFramework: Record<frameworkId, controlId[]>` for fast lookups
   - Why normalized? Prevents duplicate data and makes updates atomic

2. **Real-Time Updates:**
   - EventSource API for SSE connection
   - Event listeners for 'control-update' and 'framework-sync' events
   - Automatic reconnection handling (simplified in example)
   - Batch updates to prevent render thrashing

3. **Performance Optimizations:**
   - Virtualization: Only render visible items (useVirtualizer)
   - Memoized calculations: useFrameworkPosture hook uses useMemo
   - Normalized lookups: O(1) access instead of O(n) filtering

4. **Component Structure:**
   - Custom hook: `useComplianceStream` encapsulates SSE logic
   - Memoized selector: `useFrameworkPosture` for expensive calculations
   - Virtualized grid: `ControlGrid` component for large lists

**Interview Talking Points:**
- Why SSE over WebSocket? One-way data, simpler, HTTP-based
- Normalized state trade-offs: More complex updates, but better performance
- Virtualization: Essential for 1000+ items, reduces DOM nodes
- Memoization strategy: When to use useMemo vs useCallback

---

### 02-compliance-workflow-wizard.tsx
**Question:** Build a multi-step compliance workflow wizard with validation, persistence, and cross-step dependencies.

**Key Concepts Demonstrated:**
- **State machine pattern** for workflow orchestration
- **Schema-driven validation** with Zod
- **Auto-save with debouncing** for draft persistence
- **Cross-step dependency resolution**
- **Compound component pattern** for flexible UI composition

**Step-by-Step Implementation:**

1. **State Machine:**
   - Reducer pattern: `workflowReducer` handles all state transitions
   - Step navigation: NEXT, PREVIOUS, GOTO actions
   - Completed steps tracking: Set<StepId> for progress indication
   - Validation state: Separate errors per step

2. **Validation Strategy:**
   - Zod schemas for type-safe validation
   - Custom refinements for cross-field validation
   - Error mapping: Zod errors → ValidationError[]
   - Real-time validation on data changes

3. **Persistence:**
   - Custom hook: `useWorkflowPersistence` with debouncing
   - Auto-save: 2-second debounce to prevent excessive API calls
   - Draft loading: Initialize state from saved drafts
   - Dirty state tracking: Only save when data changes

4. **Step Dependencies:**
   - Dependency graph: Steps can depend on previous steps
   - Validation blocking: Can't proceed if dependencies invalid
   - Data sharing: Step data accessible across steps via state

**Interview Talking Points:**
- State machine benefits: Predictable state transitions, easier testing
- Zod vs manual validation: Type inference, better DX
- Debouncing strategy: Balance between UX and server load
- When to use Context vs Props: Global workflow state vs step-specific

---

### 03-performance-optimization-large-datasets.tsx
**Question:** Optimize React rendering for displaying thousands of controls with filtering, sorting, and grouping.

**Key Concepts Demonstrated:**
- **React Query** for server state management
- **Virtualization with grouping** support
- **Web Workers** for heavy filtering/sorting (concept shown)
- **Batched real-time updates** to prevent render thrashing
- **Memoization strategies** at component and selector levels

**Step-by-Step Implementation:**

1. **Server State Management:**
   - React Query: Separates server state from UI state
   - Query keys: `['controls', filters]` for cache invalidation
   - Stale time: 30 seconds for compliance data
   - Structural sharing: Prevents unnecessary re-renders

2. **Virtualization with Groups:**
   - Flat item list: Headers and rows in single array
   - Dynamic sizing: Different heights for headers vs rows
   - Group calculation: Pre-compute groups and offsets
   - Overscan: Render extra items for smooth scrolling

3. **Filtering Strategy:**
   - Debounced filtering: 150ms delay to prevent excessive work
   - Web Worker concept: Offload heavy filtering to worker thread
   - Memoized results: Only recalculate when filters change
   - Loading states: Show feedback during filtering

4. **Real-Time Updates:**
   - EventSource for streaming updates
   - Batching: Collect updates in 100ms window
   - Query cache updates: Optimistic updates to React Query cache
   - Conflict resolution: Last-write-wins strategy

5. **Component Memoization:**
   - React.memo: ControlRow component with custom comparison
   - useMemo: Status badge calculation
   - useCallback: Event handlers to prevent child re-renders
   - Custom comparison: Skip style prop in memo check

**Interview Talking Points:**
- React Query benefits: Caching, background updates, optimistic updates
- Virtualization trade-offs: More complex, but essential for performance
- When to use Web Workers: CPU-intensive operations, large datasets
- Memoization strategy: Profile first, memoize expensive operations

---

## Common Patterns Across All Files

### State Management Patterns

1. **Normalized State:**
   ```typescript
   // Instead of:
   controls: Control[]  // O(n) lookups
   
   // Use:
   controls: Record<string, Control>  // O(1) lookups
   ```

2. **Index Structures:**
   ```typescript
   // Fast lookups by framework
   controlsByFramework: Record<string, string[]>
   ```

3. **Reducer Pattern:**
   - Centralized state updates
   - Predictable state transitions
   - Easier testing and debugging

### Performance Optimization Patterns

1. **Virtualization:**
   - Essential for 1000+ items
   - Only render visible items
   - Reduces DOM nodes significantly

2. **Memoization:**
   - useMemo for expensive calculations
   - useCallback for stable function references
   - React.memo for component memoization

3. **Batching:**
   - Batch state updates
   - Batch API calls
   - Batch real-time updates

### Real-Time Data Patterns

1. **SSE vs WebSocket:**
   - SSE: One-way, HTTP-based, simpler
   - WebSocket: Two-way, more complex, lower latency

2. **Update Batching:**
   - Collect updates in time window
   - Apply all at once
   - Prevents render thrashing

### Form and Validation Patterns

1. **Schema Validation:**
   - Zod for type-safe validation
   - Runtime validation
   - Type inference

2. **Error Handling:**
   - Field-level errors
   - Cross-field validation
   - User-friendly error messages

---

## Interview Preparation Tips

### When Discussing These Implementations:

1. **Explain the Problem First:**
   - What challenge does this solve?
   - What are the constraints?
   - What are the requirements?

2. **Discuss Trade-offs:**
   - Why this approach vs alternatives?
   - What are the performance implications?
   - What are the maintenance costs?

3. **Performance Considerations:**
   - How does it scale?
   - What are the bottlenecks?
   - How would you optimize further?

4. **Error Handling:**
   - What edge cases are covered?
   - How do you handle failures?
   - What's the recovery strategy?

5. **Testing Strategy:**
   - How would you test this?
   - What are the test cases?
   - How do you test real-time updates?

### Key React Concepts to Master:

- **Hooks:** useState, useEffect, useReducer, useMemo, useCallback, useRef
- **Performance:** Virtualization, memoization, code splitting
- **State Management:** Context API, Redux patterns, React Query
- **Real-Time:** SSE, WebSocket, polling strategies
- **Forms:** Validation, controlled components, form libraries
- **TypeScript:** Type safety, discriminated unions, generics

---

## Dependencies

```json
{
  "@tanstack/react-virtual": "^3.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zod": "^3.22.0",
  "react": "^18.0.0"
}
```

---

## Running the Code

Each file is self-contained and can be used as reference. To use in a project:

1. Install dependencies:
```bash
npm install @tanstack/react-virtual @tanstack/react-query zod
```

2. Import components:
```typescript
import { ComplianceDashboard } from './01-real-time-compliance-dashboard';
```

3. Use in your app:
```tsx
<ComplianceDashboard frameworks={frameworks} />
```

---

## Additional Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Virtualization Guide](https://tanstack.com/virtual/latest)
- [Zod Documentation](https://zod.dev/)

