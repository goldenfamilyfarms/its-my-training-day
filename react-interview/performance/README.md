# React Performance Optimization - Interview Deep Dive

Master-level performance optimization techniques for React applications, focusing on rendering optimization, memory management, and computational efficiency at scale.

## 🎯 Overview

Performance optimization is critical for GRC applications that handle:
- **Large datasets**: 10,000+ rows of compliance data
- **Real-time updates**: Streaming control status changes
- **Complex calculations**: Risk scoring, trend analysis
- **Multiple simultaneous users**: Enterprise-scale applications

## 📁 Implementation

### 01-large-table-optimization.tsx
**Complexity**: ⭐⭐⭐⭐⭐
**Interview Focus**: Virtualization, Web Workers, Memoization, Batch updates

#### Problem Statement
Render a table with 10,000+ rows of wafer test results with:
- Inline editing capabilities
- Real-time filtering and sorting
- Maintain 60fps scrolling performance
- Support batch updates to backend

This is a common interview question testing your understanding of:
- When and how to use virtualization
- How to prevent unnecessary re-renders
- How to offload heavy work from main thread
- How to batch operations for efficiency

---

## 🔍 Deep Technical Analysis

### 1. Virtualization Strategy

**Problem**: Rendering 10,000 DOM nodes
```typescript
// ❌ BAD: Renders all 10,000 rows
{data.map(row => <TableRow key={row.id} data={row} />)}

// Memory: ~50MB
// Initial render: ~2000ms
// Scroll performance: Janky, dropped frames
```

**Solution**: react-window / @tanstack/react-virtual
```typescript
// ✅ GOOD: Renders only ~20 visible rows
<VariableSizeGrid
  columnCount={COLUMNS.length}
  rowCount={data.length}
  columnWidth={getColumnWidth}
  rowHeight={getRowHeight}
  height={600}
  width={1200}
>
  {Cell}
</VariableSizeGrid>

// Memory: ~5MB (10x reduction)
// Initial render: ~50ms (40x faster)
// Scroll performance: Smooth 60fps
```

#### How Virtualization Works
```
┌─────────────────────────┐
│ ← Scroll Container →    │
│ ┌───────────────────┐  │ ← overscan (10 rows)
│ │ Row 95 (rendered) │  │
│ │ Row 96 (rendered) │  │
│ ├───────────────────┤  │ ← viewport start
│ │ Row 97 (visible)  │  │
│ │ Row 98 (visible)  │  │
│ │ Row 99 (visible)  │  │
│ │ Row 100 (visible) │  │
│ │ ...               │  │
│ │ Row 115 (visible) │  │
│ ├───────────────────┤  │ ← viewport end
│ │ Row 116(rendered) │  │
│ │ Row 117(rendered) │  │
│ └───────────────────┘  │ ← overscan (10 rows)
│                         │
│ (Rows 0-94: not in DOM)│
│ (Rows 118-10000: not in DOM)
└─────────────────────────┘
```

**Key Parameters**:
- `overscan`: How many rows to render above/below viewport
  - Too low: Blank space when scrolling fast
  - Too high: More DOM nodes, slower performance
  - Sweet spot: 5-15 rows

#### Interview Questions on Virtualization

**Q: When is virtualization necessary?**
A: When rendering all items would:
- Create 500+ DOM nodes
- Cause initial render time > 100ms
- Result in memory usage > 50MB
- Lead to scrolling performance issues

**Q: What are the trade-offs?**
A:
| Aspect | Non-Virtualized | Virtualized |
|--------|----------------|-------------|
| Browser search (Ctrl+F) | ✅ Works | ❌ Only searches visible items |
| Print to PDF | ✅ Prints all | ❌ Only visible items |
| Accessibility | ✅ Full tree | ⚠️ Requires ARIA labels |
| Implementation | ✅ Simple | ❌ Complex |
| Performance | ❌ Poor at scale | ✅ Constant O(1) |

**Q: Alternatives to virtualization?**
A:
1. **Pagination**: Better for many use cases
   - Pros: Simple, works with Ctrl+F, better UX for finding items
   - Cons: Requires clicking through pages, not good for scrolling workflows

2. **Infinite scroll**: Load more as you scroll
   - Pros: Simpler than virtualization, good UX
   - Cons: Eventually accumulates many DOM nodes

3. **Data aggregation**: Show summaries instead of all rows
   - Pros: Much better performance, often better UX
   - Cons: Requires rethinking UI

---

### 2. Memoization Strategy

**Problem**: Cell re-renders on every parent render

```typescript
// ❌ BAD: No memoization
function Cell({ data, columnIndex }) {
  const formatted = formatCurrency(data.value); // Runs every render
  return <div>{formatted}</div>;
}

// Parent renders → All 20 visible cells re-render → formatCurrency runs 20x
```

**Solution**: Multi-layer memoization

```typescript
// ✅ GOOD: Memoized cell component
const Cell = memo(({ data, columnIndex, rowIndex, style }: CellProps) => {
  // Only runs when data.value changes
  const formattedValue = useMemo(() =>
    column.format ? column.format(data.value) : String(data.value),
    [data.value, column.format]
  );

  return <div style={style}>{formattedValue}</div>;
});

// Parent renders → Cell compares props → Props unchanged → Skip render
```

#### Memoization Decision Tree

```
Should I use React.memo?
│
├─ Component renders often? → YES
│  ├─ Props are primitives/simple objects? → YES → Use memo()
│  └─ Props are complex objects/functions? → Use memo() + useMemo for props
│
├─ Component has expensive render? → YES → Use memo()
│
└─ Component rarely renders? → NO → Don't use memo (overhead not worth it)


Should I use useMemo?
│
├─ Computation takes > 5ms? → YES → Use useMemo
├─ Value passed as prop to memoized component? → YES → Use useMemo
├─ Value used as dependency in useEffect? → MAYBE → Use if complex
└─ Simple calculation (< 1ms)? → NO → Don't use useMemo
```

#### Interview Questions on Memoization

**Q: What's the difference between React.memo, useMemo, and useCallback?**
A:
```typescript
// React.memo: Memoizes entire component
const MemoizedComponent = memo(MyComponent);

// useMemo: Memoizes a computed value
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// useCallback: Memoizes a function (syntax sugar for useMemo)
const handleClick = useCallback(() => doSomething(id), [id]);
// Equivalent to:
const handleClick = useMemo(() => () => doSomething(id), [id]);
```

**Q: Can you over-memoize?**
A: Yes! Memoization has costs:
```typescript
// ❌ OVER-MEMOIZATION: More expensive than just computing
const sum = useMemo(() => a + b, [a, b]);
// Cost of memoization: ~0.1ms
// Cost of computation: ~0.001ms

// ✅ GOOD MEMOIZATION: Saves time
const filteredData = useMemo(() =>
  data.filter(item => item.value > threshold),
  [data, threshold]
);
// Cost of memoization: ~0.1ms
// Cost of computation: ~50ms (for 10,000 items)
```

**Q: Why doesn't React memoize everything by default?**
A: Because:
1. Memory overhead: Storing previous props/values
2. Comparison overhead: Deep equality checks are expensive
3. Most components are fast enough without it
4. Premature optimization is wasteful

---

### 3. Web Worker Offloading

**Problem**: Heavy operations block main thread

```typescript
// ❌ BAD: Filtering 10,000 items blocks UI for ~100ms
const filtered = data.filter(row =>
  row.status === 'pass' && row.value > threshold
);
// Main thread blocked → UI frozen → User clicks don't register
```

**Solution**: Offload to Web Worker

```typescript
// ✅ GOOD: Worker processes data in background
workerRef.current.postMessage({ data, filters, sortConfig });
// Main thread free → UI responsive → User can keep working

workerRef.current.onmessage = (e) => {
  setProcessedData(e.data.result); // Update when ready
};
```

#### When to Use Web Workers

```
Operation Time vs. Dataset Size
│
│ 1000ms ├─────────────────────────────────┐ → MUST use Worker
│        │                                  │
│ 100ms  ├──────────┐   Worker Zone        │
│        │          │                       │
│ 50ms   ├────┐     │                      │
│        │    │     └──────────────────────┘
│ 10ms   │    │ Maybe Worker
│        │    └─────┐
│ 1ms    │          │ Main Thread OK
│        └──────────┴─────────────────────
│        100   1K    10K    100K   1M
│                Dataset Size
```

**Use Worker When**:
- Operation takes > 50ms
- User needs to interact during processing
- Processing can be done asynchronously
- Data transfer overhead < computation time

**Don't Use Worker When**:
- Operation takes < 16ms (one frame)
- Need result immediately (blocking anyway)
- Data transfer overhead > computation time
- Need access to DOM (Workers can't access DOM)

#### Web Worker Communication Pattern

```typescript
// Create worker with inline code
const workerCode = `
  self.onmessage = function(e) {
    const { data, operation } = e.data;
    const result = processData(data, operation);
    self.postMessage({ result });
  };
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

// Send data to worker (transferred, not copied)
worker.postMessage({
  data: new Float64Array(buffer), // Transferable
  operation: 'filter'
}, [buffer]); // Transfer ownership

// Receive results
worker.onmessage = (e) => {
  const { result } = e.data;
  updateUI(result);
};
```

#### Interview Questions on Web Workers

**Q: What's the overhead of using a Web Worker?**
A:
```typescript
// Data transfer cost
const data = new Array(10000).fill(0).map((_, i) => ({ id: i, value: i }));
const serialized = JSON.stringify(data); // ~500KB
// Transfer time: ~10ms

// If computation time < 10ms, worker is slower!
// Break-even point: computation time > data transfer time
```

**Q: How do you handle errors in Web Workers?**
A:
```typescript
worker.onerror = (error) => {
  console.error('Worker error:', error);
  // Fallback to main thread processing
  const result = processDataMainThread(data);
  updateUI(result);
};

worker.onmessageerror = (error) => {
  console.error('Serialization error:', error);
};
```

**Q: Can Workers share data?**
A: Yes, with SharedArrayBuffer (advanced):
```typescript
const buffer = new SharedArrayBuffer(1024);
const array = new Int32Array(buffer);

// Share between workers
worker1.postMessage({ buffer });
worker2.postMessage({ buffer });

// Both can read/write atomically
Atomics.store(array, 0, 123);
const value = Atomics.load(array, 0);
```

---

### 4. Batch Update Strategy

**Problem**: Individual updates cause many API calls

```typescript
// ❌ BAD: Edit 10 cells → 10 API calls
function handleCellEdit(rowId, columnKey, value) {
  await fetch(`/api/update`, {
    method: 'PATCH',
    body: JSON.stringify({ rowId, columnKey, value })
  });
}

// 10 edits = 10 requests = High server load + slow
```

**Solution**: Debounced batch updates

```typescript
// ✅ GOOD: Collect updates, send batch after delay
const pendingUpdates = useRef(new Map());

function handleCellEdit(rowId, columnKey, value) {
  // Add to pending updates
  pendingUpdates.current.set(rowId, { ...row, [columnKey]: value });

  // Debounce: Send batch after 1 second of no edits
  debouncedBatchUpdate();
}

const debouncedBatchUpdate = debounce(() => {
  const updates = Array.from(pendingUpdates.current.values());
  fetch('/api/batch-update', {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  pendingUpdates.current.clear();
}, 1000);

// 10 edits → Wait 1s → 1 batched request
```

#### Batching Strategies

**1. Time-based (Debouncing)**
```typescript
// Wait N ms after last change
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
```

**2. Count-based**
```typescript
// Send batch after N changes
if (pendingUpdates.size >= 100) {
  flushBatch();
}
```

**3. Time + Count**
```typescript
// Whichever comes first
if (pendingUpdates.size >= 100 || timeSinceLastFlush > 5000) {
  flushBatch();
}
```

**4. React 18 Automatic Batching**
```typescript
// React 18 automatically batches these
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setData(d => [...d, newItem]);
  // Only one render, not three!
}
```

---

## 🎓 Study Strategy

### For Your Interview (Jan 13)

**Must Know**:
1. How virtualization works (can draw diagram)
2. When to use React.memo vs useMemo vs useCallback
3. Web Worker communication pattern
4. Batching strategies

**Practice Explaining**:
```
"For 10,000 rows, I implemented virtualization using react-window, which
renders only the visible ~20 rows plus 10 overscan rows. This reduced
initial render from 2 seconds to 50ms and memory usage by 90%.

For the cells, I used React.memo to prevent re-renders when parent updates,
and useMemo for expensive formatting operations. This ensures smooth 60fps
scrolling even during real-time updates.

For filtering and sorting, I offload work to a Web Worker when the dataset
exceeds 1,000 items, keeping the main thread free for user interactions.
The worker communication overhead (~10ms) is acceptable since the computation
takes ~100ms+.

Finally, I batch edit operations using a debounced update pattern, collecting
changes in a Map and flushing to the API after 1 second of inactivity. This
reduces API calls by 90% and improves server efficiency."
```

---

## 🔑 Key Metrics to Remember

- **Virtualization break-even**: ~500 items
- **Target frame time**: 16ms (60fps)
- **Worker break-even**: ~50ms computation time
- **Batch window**: 1000-2000ms for user edits
- **Memory reduction**: 10x with virtualization
- **Render speed up**: 40x with virtualization

---

## 💡 Common Interview Questions

**Q: How do you identify performance bottlenecks?**
A: Use React DevTools Profiler:
1. Record interaction
2. Identify slow components (> 16ms)
3. Check "Why did this render?"
4. Look for unnecessary renders
5. Profile after fixes

**Q: What's your performance optimization process?**
A:
1. **Measure first**: Use Profiler, don't guess
2. **Identify bottleneck**: Rendering? Computation? Network?
3. **Choose solution**: Memoization? Virtualization? Worker?
4. **Measure improvement**: Verify it actually helped
5. **Watch for regressions**: Add performance tests

**Q: How do you prevent performance regressions?**
A:
- Lighthouse CI in pipeline
- Bundle size budgets
- Render time tests
- Memory leak tests

---

Good luck with your Adobe TechGRC interview! 🚀
