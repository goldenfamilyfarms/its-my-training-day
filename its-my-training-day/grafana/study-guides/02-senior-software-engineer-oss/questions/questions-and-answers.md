# Technical Interview Questions and Answers

## Senior Software Engineer - Grafana OSS Big Tent

This document contains 15 technical interview questions with detailed, senior-level answers. Each answer includes explanations, code examples where applicable, and real-world considerations.

---

## Question 1: Design a Multi-Backend Data Source Plugin

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a Grafana data source plugin that can connect to multiple backend systems (Prometheus, MySQL, and a custom REST API) through a single unified interface. The plugin should:

1. Allow users to configure multiple backends
2. Route queries to the appropriate backend based on query type
3. Support aggregating results from multiple backends
4. Handle failures gracefully with fallback mechanisms

Explain your architecture, key components, and how you would handle cross-backend queries.

### Answer

This is a complex system design problem that requires careful consideration of abstraction, routing, and error handling.

#### Architecture Overview


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-BACKEND DATA SOURCE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         Query Router                                     │    │
│  │  • Parse query type    • Route to backend    • Aggregate results        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                    │                │                │                          │
│                    ▼                ▼                ▼                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Prometheus  │  │   MySQL     │  │  REST API   │  │  Fallback   │            │
│  │  Backend    │  │  Backend    │  │  Backend    │  │  Handler    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Components

**1. Backend Interface Abstraction**

```go
package plugin

import (
    "context"
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// Backend defines the interface all backends must implement
type Backend interface {
    // Name returns the backend identifier
    Name() string
    
    // CanHandle determines if this backend can process the query
    CanHandle(query QueryModel) bool
    
    // Query executes the query and returns data frames
    Query(ctx context.Context, query QueryModel, timeRange backend.TimeRange) (*data.Frame, error)
    
    // HealthCheck verifies backend connectivity
    HealthCheck(ctx context.Context) error
    
    // Close releases backend resources
    Close() error
}

// QueryModel represents a parsed query
type QueryModel struct {
    Type        string            `json:"type"` // "prometheus", "mysql", "rest", "aggregate"
    Expression  string            `json:"expression"`
    Backends    []string          `json:"backends,omitempty"` // For aggregate queries
    Parameters  map[string]string `json:"parameters,omitempty"`
}
```

**2. Query Router Implementation**

```go
package plugin

import (
    "context"
    "fmt"
    "sync"
    
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
    "golang.org/x/sync/errgroup"
)

type QueryRouter struct {
    backends map[string]Backend
    fallback Backend
    mu       sync.RWMutex
}

func NewQueryRouter(backends []Backend, fallback Backend) *QueryRouter {
    router := &QueryRouter{
        backends: make(map[string]Backend),
        fallback: fallback,
    }
    for _, b := range backends {
        router.backends[b.Name()] = b
    }
    return router
}

func (r *QueryRouter) Route(ctx context.Context, query QueryModel, timeRange backend.TimeRange) ([]*data.Frame, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    // Handle aggregate queries across multiple backends
    if query.Type == "aggregate" {
        return r.executeAggregateQuery(ctx, query, timeRange)
    }
    
    // Find appropriate backend
    for _, b := range r.backends {
        if b.CanHandle(query) {
            frame, err := b.Query(ctx, query, timeRange)
            if err != nil {
                // Try fallback on failure
                if r.fallback != nil {
                    return r.executeFallback(ctx, query, timeRange, err)
                }
                return nil, fmt.Errorf("backend %s failed: %w", b.Name(), err)
            }
            return []*data.Frame{frame}, nil
        }
    }
    
    return nil, fmt.Errorf("no backend can handle query type: %s", query.Type)
}

func (r *QueryRouter) executeAggregateQuery(ctx context.Context, query QueryModel, timeRange backend.TimeRange) ([]*data.Frame, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([]*data.Frame, len(query.Backends))
    
    for i, backendName := range query.Backends {
        i, backendName := i, backendName
        g.Go(func() error {
            b, ok := r.backends[backendName]
            if !ok {
                return fmt.Errorf("backend not found: %s", backendName)
            }
            
            frame, err := b.Query(ctx, query, timeRange)
            if err != nil {
                return err
            }
            results[i] = frame
            return nil
        })
    }
    
    if err := g.Wait(); err != nil {
        return nil, err
    }
    
    return results, nil
}

func (r *QueryRouter) executeFallback(ctx context.Context, query QueryModel, timeRange backend.TimeRange, originalErr error) ([]*data.Frame, error) {
    backend.Logger.Warn("Primary backend failed, using fallback", "error", originalErr)
    
    frame, err := r.fallback.Query(ctx, query, timeRange)
    if err != nil {
        return nil, fmt.Errorf("fallback also failed: %w (original: %v)", err, originalErr)
    }
    
    return []*data.Frame{frame}, nil
}
```

**3. Backend Implementations**

```go
// PrometheusBackend implementation
type PrometheusBackend struct {
    client *prometheus.Client
    config PrometheusConfig
}

func (p *PrometheusBackend) Name() string { return "prometheus" }

func (p *PrometheusBackend) CanHandle(query QueryModel) bool {
    return query.Type == "prometheus" || query.Type == "promql"
}

func (p *PrometheusBackend) Query(ctx context.Context, query QueryModel, timeRange backend.TimeRange) (*data.Frame, error) {
    result, warnings, err := p.client.QueryRange(ctx, query.Expression, prometheus.Range{
        Start: timeRange.From,
        End:   timeRange.To,
        Step:  calculateStep(timeRange),
    })
    
    if err != nil {
        return nil, fmt.Errorf("prometheus query failed: %w", err)
    }
    
    if len(warnings) > 0 {
        backend.Logger.Warn("Prometheus warnings", "warnings", warnings)
    }
    
    return convertPrometheusToFrame(result), nil
}
```

#### Trade-offs and Considerations

| Aspect | Approach | Trade-off |
|--------|----------|-----------|
| **Routing** | Query type-based | Simple but requires explicit type in queries |
| **Aggregation** | Parallel execution | Better performance but complex error handling |
| **Fallback** | Single fallback backend | Simple but may not cover all failure modes |
| **Caching** | Per-backend caching | Memory overhead but better hit rates |

#### Real-World Considerations

1. **Connection Pooling**: Each backend should maintain its own connection pool
2. **Circuit Breakers**: Implement circuit breakers to prevent cascade failures
3. **Metrics**: Instrument each backend with latency and error rate metrics
4. **Configuration**: Support hot-reloading of backend configurations

---


## Question 2: Implement Query Handler with Caching

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a query handler for a Grafana data source plugin that includes an LRU cache with TTL (time-to-live). The handler should:

1. Check the cache before executing queries
2. Cache successful query results
3. Handle cache invalidation based on TTL
4. Support cache bypass for specific queries
5. Provide cache statistics for monitoring

Write the Go code for this implementation.

### Answer

Here's a complete implementation of a cached query handler:

```go
package plugin

import (
    "container/list"
    "context"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "sync"
    "sync/atomic"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// CachedQueryHandler wraps query execution with caching
type CachedQueryHandler struct {
    executor    QueryExecutor
    cache       *LRUCache
    stats       *CacheStats
    defaultTTL  time.Duration
}

// QueryExecutor interface for the underlying query implementation
type QueryExecutor interface {
    Execute(ctx context.Context, query backend.DataQuery) backend.DataResponse
}

// CacheStats tracks cache performance metrics
type CacheStats struct {
    Hits       int64
    Misses     int64
    Evictions  int64
    Size       int64
}

// LRUCache implements an LRU cache with TTL support
type LRUCache struct {
    maxSize   int
    ttl       time.Duration
    mu        sync.RWMutex
    items     map[string]*cacheEntry
    evictList *list.List
}

type cacheEntry struct {
    key       string
    response  backend.DataResponse
    expiresAt time.Time
    element   *list.Element
}

// NewCachedQueryHandler creates a new cached handler
func NewCachedQueryHandler(executor QueryExecutor, maxCacheSize int, defaultTTL time.Duration) *CachedQueryHandler {
    return &CachedQueryHandler{
        executor:   executor,
        cache:      NewLRUCache(maxCacheSize, defaultTTL),
        stats:      &CacheStats{},
        defaultTTL: defaultTTL,
    }
}

// NewLRUCache creates a new LRU cache
func NewLRUCache(maxSize int, ttl time.Duration) *LRUCache {
    cache := &LRUCache{
        maxSize:   maxSize,
        ttl:       ttl,
        items:     make(map[string]*cacheEntry),
        evictList: list.New(),
    }
    
    // Start background cleanup
    go cache.cleanupLoop()
    
    return cache
}

// HandleQuery processes a query with caching
func (h *CachedQueryHandler) HandleQuery(ctx context.Context, query backend.DataQuery) backend.DataResponse {
    // Check for cache bypass flag
    var queryModel struct {
        BypassCache bool `json:"bypassCache"`
    }
    json.Unmarshal(query.JSON, &queryModel)
    
    if queryModel.BypassCache {
        return h.executor.Execute(ctx, query)
    }
    
    // Generate cache key
    cacheKey := h.generateCacheKey(query)
    
    // Try to get from cache
    if response, found := h.cache.Get(cacheKey); found {
        atomic.AddInt64(&h.stats.Hits, 1)
        return response
    }
    
    atomic.AddInt64(&h.stats.Misses, 1)
    
    // Execute query
    response := h.executor.Execute(ctx, query)
    
    // Cache successful responses only
    if response.Error == nil {
        h.cache.Set(cacheKey, response)
    }
    
    return response
}

// generateCacheKey creates a unique key for the query
func (h *CachedQueryHandler) generateCacheKey(query backend.DataQuery) string {
    // Include all relevant query parameters in the key
    keyData := struct {
        RefID     string          `json:"refId"`
        JSON      json.RawMessage `json:"json"`
        TimeRange struct {
            From int64 `json:"from"`
            To   int64 `json:"to"`
        } `json:"timeRange"`
        Interval int64 `json:"interval"`
    }{
        RefID:    query.RefID,
        JSON:     query.JSON,
        Interval: query.Interval.Milliseconds(),
    }
    keyData.TimeRange.From = query.TimeRange.From.UnixMilli()
    keyData.TimeRange.To = query.TimeRange.To.UnixMilli()
    
    keyBytes, _ := json.Marshal(keyData)
    hash := sha256.Sum256(keyBytes)
    return hex.EncodeToString(hash[:])
}

// Get retrieves an item from the cache
func (c *LRUCache) Get(key string) (backend.DataResponse, bool) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    entry, exists := c.items[key]
    if !exists {
        return backend.DataResponse{}, false
    }
    
    // Check if expired
    if time.Now().After(entry.expiresAt) {
        c.removeEntry(entry)
        return backend.DataResponse{}, false
    }
    
    // Move to front (most recently used)
    c.evictList.MoveToFront(entry.element)
    
    return entry.response, true
}

// Set adds an item to the cache
func (c *LRUCache) Set(key string, response backend.DataResponse) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    // Update existing entry
    if entry, exists := c.items[key]; exists {
        entry.response = response
        entry.expiresAt = time.Now().Add(c.ttl)
        c.evictList.MoveToFront(entry.element)
        return
    }
    
    // Evict oldest if at capacity
    for len(c.items) >= c.maxSize {
        c.evictOldest()
    }
    
    // Add new entry
    entry := &cacheEntry{
        key:       key,
        response:  response,
        expiresAt: time.Now().Add(c.ttl),
    }
    entry.element = c.evictList.PushFront(entry)
    c.items[key] = entry
}

func (c *LRUCache) evictOldest() {
    element := c.evictList.Back()
    if element != nil {
        entry := element.Value.(*cacheEntry)
        c.removeEntry(entry)
    }
}

func (c *LRUCache) removeEntry(entry *cacheEntry) {
    c.evictList.Remove(entry.element)
    delete(c.items, entry.key)
}

func (c *LRUCache) cleanupLoop() {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        c.mu.Lock()
        now := time.Now()
        for _, entry := range c.items {
            if now.After(entry.expiresAt) {
                c.removeEntry(entry)
            }
        }
        c.mu.Unlock()
    }
}

// GetStats returns current cache statistics
func (h *CachedQueryHandler) GetStats() CacheStats {
    h.cache.mu.RLock()
    size := int64(len(h.cache.items))
    h.cache.mu.RUnlock()
    
    return CacheStats{
        Hits:   atomic.LoadInt64(&h.stats.Hits),
        Misses: atomic.LoadInt64(&h.stats.Misses),
        Size:   size,
    }
}

// InvalidateCache clears all cached entries
func (h *CachedQueryHandler) InvalidateCache() {
    h.cache.mu.Lock()
    defer h.cache.mu.Unlock()
    
    h.cache.items = make(map[string]*cacheEntry)
    h.cache.evictList.Init()
}
```

#### Key Design Decisions

1. **SHA-256 for cache keys**: Ensures consistent key length and handles complex query structures
2. **Atomic counters for stats**: Thread-safe statistics without lock contention
3. **Background cleanup**: Prevents memory leaks from expired entries
4. **Cache bypass flag**: Allows forcing fresh data when needed

---


## Question 3: Plugin Architecture for Streaming Data

**Difficulty**: Advanced  
**Category**: Architecture

### Question

You need to design a Grafana data source plugin that supports real-time streaming data from a WebSocket backend. The plugin should:

1. Maintain persistent WebSocket connections
2. Handle connection failures and automatic reconnection
3. Support multiple concurrent subscriptions
4. Buffer data during brief disconnections
5. Provide backpressure handling when the frontend can't keep up

Explain your architectural decisions and the trade-offs involved.

### Answer

#### Architecture Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STREAMING DATA SOURCE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Connection Manager                                    │    │
│  │  • WebSocket lifecycle    • Reconnection logic    • Health monitoring   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│                    ┌─────────────────┼─────────────────┐                        │
│                    ▼                 ▼                 ▼                        │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Subscription Mgr   │  │  Message Buffer │  │ Backpressure    │             │
│  │  • Topic routing    │  │  • Ring buffer  │  │ Controller      │             │
│  │  • Fan-out          │  │  • Overflow     │  │ • Rate limiting │             │
│  └─────────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Grafana Stream Sender                                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Core Components Implementation

```go
package plugin

import (
    "context"
    "encoding/json"
    "sync"
    "time"

    "github.com/gorilla/websocket"
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// StreamingDatasource handles real-time data streaming
type StreamingDatasource struct {
    connManager    *ConnectionManager
    subscriptions  *SubscriptionManager
    buffer         *MessageBuffer
    backpressure   *BackpressureController
}

// ConnectionManager handles WebSocket lifecycle
type ConnectionManager struct {
    url            string
    conn           *websocket.Conn
    mu             sync.RWMutex
    connected      bool
    reconnectDelay time.Duration
    maxRetries     int
    onMessage      func([]byte)
    onConnect      func()
    onDisconnect   func()
    stopCh         chan struct{}
}

func NewConnectionManager(url string) *ConnectionManager {
    return &ConnectionManager{
        url:            url,
        reconnectDelay: time.Second,
        maxRetries:     10,
        stopCh:         make(chan struct{}),
    }
}

func (cm *ConnectionManager) Connect(ctx context.Context) error {
    cm.mu.Lock()
    defer cm.mu.Unlock()
    
    conn, _, err := websocket.DefaultDialer.DialContext(ctx, cm.url, nil)
    if err != nil {
        return err
    }
    
    cm.conn = conn
    cm.connected = true
    
    if cm.onConnect != nil {
        cm.onConnect()
    }
    
    // Start read loop
    go cm.readLoop()
    
    return nil
}

func (cm *ConnectionManager) readLoop() {
    defer func() {
        cm.mu.Lock()
        cm.connected = false
        cm.mu.Unlock()
        
        if cm.onDisconnect != nil {
            cm.onDisconnect()
        }
        
        // Attempt reconnection
        go cm.reconnect()
    }()
    
    for {
        select {
        case <-cm.stopCh:
            return
        default:
            _, message, err := cm.conn.ReadMessage()
            if err != nil {
                backend.Logger.Error("WebSocket read error", "error", err)
                return
            }
            
            if cm.onMessage != nil {
                cm.onMessage(message)
            }
        }
    }
}

func (cm *ConnectionManager) reconnect() {
    for i := 0; i < cm.maxRetries; i++ {
        select {
        case <-cm.stopCh:
            return
        case <-time.After(cm.reconnectDelay * time.Duration(i+1)):
            ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
            err := cm.Connect(ctx)
            cancel()
            
            if err == nil {
                backend.Logger.Info("WebSocket reconnected")
                return
            }
            
            backend.Logger.Warn("Reconnection attempt failed", "attempt", i+1, "error", err)
        }
    }
    
    backend.Logger.Error("Max reconnection attempts reached")
}

// SubscriptionManager handles multiple concurrent subscriptions
type SubscriptionManager struct {
    subscriptions map[string]*Subscription
    mu            sync.RWMutex
}

type Subscription struct {
    ID       string
    Topic    string
    Sender   *backend.StreamSender
    Filter   func([]byte) bool
    cancelFn context.CancelFunc
}

func (sm *SubscriptionManager) Subscribe(ctx context.Context, topic string, sender *backend.StreamSender) (string, error) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    
    ctx, cancel := context.WithCancel(ctx)
    
    sub := &Subscription{
        ID:       generateSubscriptionID(),
        Topic:    topic,
        Sender:   sender,
        cancelFn: cancel,
    }
    
    sm.subscriptions[sub.ID] = sub
    
    return sub.ID, nil
}

func (sm *SubscriptionManager) Unsubscribe(id string) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    
    if sub, exists := sm.subscriptions[id]; exists {
        sub.cancelFn()
        delete(sm.subscriptions, id)
    }
}

func (sm *SubscriptionManager) Broadcast(topic string, frame *data.Frame) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    
    for _, sub := range sm.subscriptions {
        if sub.Topic == topic {
            // Non-blocking send with backpressure awareness
            go func(s *Subscription) {
                if err := s.Sender.SendFrame(frame, data.IncludeAll); err != nil {
                    backend.Logger.Warn("Failed to send frame", "subscription", s.ID, "error", err)
                }
            }(sub)
        }
    }
}

// MessageBuffer provides buffering during disconnections
type MessageBuffer struct {
    buffer   [][]byte
    maxSize  int
    mu       sync.Mutex
    overflow int64
}

func NewMessageBuffer(maxSize int) *MessageBuffer {
    return &MessageBuffer{
        buffer:  make([][]byte, 0, maxSize),
        maxSize: maxSize,
    }
}

func (mb *MessageBuffer) Add(message []byte) {
    mb.mu.Lock()
    defer mb.mu.Unlock()
    
    if len(mb.buffer) >= mb.maxSize {
        // Ring buffer behavior - drop oldest
        mb.buffer = mb.buffer[1:]
        mb.overflow++
    }
    
    mb.buffer = append(mb.buffer, message)
}

func (mb *MessageBuffer) Drain() [][]byte {
    mb.mu.Lock()
    defer mb.mu.Unlock()
    
    messages := mb.buffer
    mb.buffer = make([][]byte, 0, mb.maxSize)
    
    return messages
}

// BackpressureController manages flow control
type BackpressureController struct {
    maxPending   int
    pending      int64
    dropPolicy   DropPolicy
    mu           sync.Mutex
}

type DropPolicy int

const (
    DropOldest DropPolicy = iota
    DropNewest
    Block
)

func (bp *BackpressureController) CanSend() bool {
    bp.mu.Lock()
    defer bp.mu.Unlock()
    
    return bp.pending < int64(bp.maxPending)
}

func (bp *BackpressureController) Acquire() bool {
    bp.mu.Lock()
    defer bp.mu.Unlock()
    
    if bp.pending >= int64(bp.maxPending) {
        return false
    }
    
    bp.pending++
    return true
}

func (bp *BackpressureController) Release() {
    bp.mu.Lock()
    defer bp.mu.Unlock()
    
    if bp.pending > 0 {
        bp.pending--
    }
}

func generateSubscriptionID() string {
    return fmt.Sprintf("sub-%d", time.Now().UnixNano())
}
```

#### Trade-offs Analysis

| Decision | Pros | Cons |
|----------|------|------|
| **Ring buffer for messages** | Bounded memory, no OOM | Data loss during extended outages |
| **Per-subscription goroutines** | Non-blocking broadcasts | Goroutine overhead |
| **Exponential backoff reconnect** | Prevents thundering herd | Slower recovery |
| **Drop oldest backpressure** | Maintains freshness | Historical data loss |

#### Real-World Considerations

1. **Heartbeat mechanism**: Implement ping/pong to detect stale connections
2. **Graceful shutdown**: Drain buffers and close subscriptions cleanly
3. **Metrics**: Track connection uptime, message rates, and buffer utilization
4. **Authentication**: Handle token refresh for long-lived connections

---


## Question 4: Debug Slow Data Source Queries

**Difficulty**: Intermediate  
**Category**: Troubleshooting

### Question

Users report that a Grafana data source plugin is experiencing slow query performance. Queries that previously took 200ms are now taking 5-10 seconds. The backend database hasn't changed, and there are no obvious errors in the logs.

Describe your systematic approach to debugging this issue. What tools would you use? What are the most likely causes?

### Answer

#### Systematic Debugging Approach

**Step 1: Gather Information**

```bash
# Check Grafana server logs for slow query warnings
grep -i "slow\|timeout\|latency" /var/log/grafana/grafana.log

# Check plugin-specific logs
grep "mydatasource" /var/log/grafana/grafana.log | tail -100

# Monitor system resources
top -p $(pgrep grafana)
vmstat 1 10
```

**Step 2: Enable Detailed Tracing**

```go
// Add instrumentation to the query handler
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    start := time.Now()
    defer func() {
        backend.Logger.Info("QueryData completed",
            "duration", time.Since(start),
            "queries", len(req.Queries),
        )
    }()
    
    response := backend.NewQueryDataResponse()
    
    for _, query := range req.Queries {
        queryStart := time.Now()
        
        // Parse query
        parseStart := time.Now()
        qm, err := parseQuery(query)
        parseDuration := time.Since(parseStart)
        
        // Get connection
        connStart := time.Now()
        conn, err := d.pool.Get(ctx)
        connDuration := time.Since(connStart)
        
        // Execute query
        execStart := time.Now()
        result, err := conn.Execute(ctx, qm.Expression)
        execDuration := time.Since(execStart)
        
        // Transform results
        transformStart := time.Now()
        frame := transformToFrame(result)
        transformDuration := time.Since(transformStart)
        
        backend.Logger.Debug("Query breakdown",
            "refId", query.RefID,
            "parse", parseDuration,
            "connection", connDuration,
            "execute", execDuration,
            "transform", transformDuration,
            "total", time.Since(queryStart),
        )
        
        response.Responses[query.RefID] = backend.DataResponse{Frames: []*data.Frame{frame}}
    }
    
    return response, nil
}
```

**Step 3: Check Common Causes**

| Cause | Symptoms | Diagnosis | Solution |
|-------|----------|-----------|----------|
| **Connection pool exhaustion** | High connection wait times | Pool stats show 0 available | Increase pool size or fix leaks |
| **DNS resolution delays** | Intermittent slowness | tcpdump shows DNS queries | Use IP addresses or local DNS cache |
| **Network latency** | Consistent added latency | ping/traceroute to backend | Check network path, use closer endpoint |
| **Memory pressure** | GC pauses in logs | GODEBUG=gctrace=1 | Reduce allocations, increase memory |
| **Lock contention** | CPU high but throughput low | pprof mutex profile | Reduce lock scope, use RWMutex |
| **Backend query plan changes** | Specific queries slow | EXPLAIN on backend | Add indexes, optimize queries |

**Step 4: Use Go Profiling**

```go
import (
    "net/http"
    _ "net/http/pprof"
)

func init() {
    // Enable pprof endpoint (development only!)
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
}
```

```bash
# CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Memory profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine analysis
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Block profile (for lock contention)
go tool pprof http://localhost:6060/debug/pprof/block
```

**Step 5: Check Connection Pool Health**

```go
// Add pool monitoring
func (d *Datasource) monitorPool() {
    ticker := time.NewTicker(10 * time.Second)
    for range ticker.C {
        stats := d.pool.Stats()
        backend.Logger.Info("Connection pool stats",
            "active", stats.ActiveCount,
            "idle", stats.IdleCount,
            "waitCount", stats.WaitCount,
            "waitDuration", stats.WaitDuration,
        )
        
        // Alert if pool is exhausted
        if stats.IdleCount == 0 && stats.WaitCount > 10 {
            backend.Logger.Warn("Connection pool exhausted!")
        }
    }
}
```

#### Most Likely Causes (Ranked)

1. **Connection pool exhaustion** (40%) - Connections not being returned
2. **Backend performance degradation** (25%) - Index issues, table growth
3. **Network issues** (15%) - DNS, routing changes, firewall rules
4. **Memory/GC pressure** (10%) - Large result sets causing GC pauses
5. **Lock contention** (10%) - Concurrent access patterns

#### Resolution Checklist

- [ ] Verify connection pool is properly releasing connections
- [ ] Check backend query execution plans
- [ ] Review network path and DNS resolution
- [ ] Analyze memory allocation patterns
- [ ] Profile for lock contention
- [ ] Check for goroutine leaks

---


## Question 5: Go HTTP Middleware for Authentication

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a Go HTTP middleware chain for a Grafana plugin's resource handler that includes:

1. Request logging with timing
2. JWT token validation
3. Rate limiting per API key
4. Panic recovery

The middleware should be composable and follow Go best practices.

### Answer

```go
package middleware

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "strings"
    "sync"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/time/rate"
)

// Middleware type for composable handlers
type Middleware func(http.Handler) http.Handler

// Chain applies middlewares in order (first middleware is outermost)
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

// ========================================
// 1. Logging Middleware
// ========================================

type responseRecorder struct {
    http.ResponseWriter
    statusCode int
    size       int
}

func (r *responseRecorder) WriteHeader(code int) {
    r.statusCode = code
    r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
    n, err := r.ResponseWriter.Write(b)
    r.size += n
    return n, err
}

// LoggingMiddleware logs request details with timing
func LoggingMiddleware(logger Logger) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Wrap response writer to capture status code
            recorder := &responseRecorder{
                ResponseWriter: w,
                statusCode:     http.StatusOK,
            }
            
            // Process request
            next.ServeHTTP(recorder, r)
            
            // Log request details
            logger.Info("HTTP request",
                "method", r.Method,
                "path", r.URL.Path,
                "status", recorder.statusCode,
                "size", recorder.size,
                "duration", time.Since(start),
                "remote_addr", r.RemoteAddr,
                "user_agent", r.UserAgent(),
            )
        })
    }
}

// ========================================
// 2. JWT Authentication Middleware
// ========================================

type Claims struct {
    UserID string   `json:"user_id"`
    Roles  []string `json:"roles"`
    jwt.RegisteredClaims
}

type contextKey string

const (
    UserContextKey   contextKey = "user"
    ClaimsContextKey contextKey = "claims"
)

// JWTAuthMiddleware validates JWT tokens
func JWTAuthMiddleware(secretKey []byte, requiredRoles ...string) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract token from Authorization header
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                writeError(w, http.StatusUnauthorized, "Missing authorization header")
                return
            }
            
            // Parse "Bearer <token>" format
            parts := strings.SplitN(authHeader, " ", 2)
            if len(parts) != 2 || parts[0] != "Bearer" {
                writeError(w, http.StatusUnauthorized, "Invalid authorization format")
                return
            }
            
            tokenString := parts[1]
            
            // Parse and validate token
            token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
                // Validate signing method
                if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                    return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
                }
                return secretKey, nil
            })
            
            if err != nil {
                writeError(w, http.StatusUnauthorized, "Invalid token: "+err.Error())
                return
            }
            
            claims, ok := token.Claims.(*Claims)
            if !ok || !token.Valid {
                writeError(w, http.StatusUnauthorized, "Invalid token claims")
                return
            }
            
            // Check required roles
            if len(requiredRoles) > 0 && !hasRequiredRole(claims.Roles, requiredRoles) {
                writeError(w, http.StatusForbidden, "Insufficient permissions")
                return
            }
            
            // Add claims to context
            ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
            ctx = context.WithValue(ctx, UserContextKey, claims.UserID)
            
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func hasRequiredRole(userRoles, requiredRoles []string) bool {
    roleSet := make(map[string]bool)
    for _, role := range userRoles {
        roleSet[role] = true
    }
    
    for _, required := range requiredRoles {
        if roleSet[required] {
            return true
        }
    }
    return false
}

// ========================================
// 3. Rate Limiting Middleware
// ========================================

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewRateLimiter(requestsPerSecond float64, burst int) *RateLimiter {
    return &RateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     rate.Limit(requestsPerSecond),
        burst:    burst,
    }
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
    rl.mu.RLock()
    limiter, exists := rl.limiters[key]
    rl.mu.RUnlock()
    
    if exists {
        return limiter
    }
    
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    // Double-check after acquiring write lock
    if limiter, exists = rl.limiters[key]; exists {
        return limiter
    }
    
    limiter = rate.NewLimiter(rl.rate, rl.burst)
    rl.limiters[key] = limiter
    
    return limiter
}

// RateLimitMiddleware limits requests per API key
func RateLimitMiddleware(rl *RateLimiter) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Use API key or IP as rate limit key
            key := r.Header.Get("X-API-Key")
            if key == "" {
                key = r.RemoteAddr
            }
            
            limiter := rl.getLimiter(key)
            
            if !limiter.Allow() {
                w.Header().Set("Retry-After", "1")
                writeError(w, http.StatusTooManyRequests, "Rate limit exceeded")
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

// ========================================
// 4. Recovery Middleware
// ========================================

// RecoveryMiddleware handles panics gracefully
func RecoveryMiddleware(logger Logger) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if err := recover(); err != nil {
                    // Log the panic with stack trace
                    logger.Error("Panic recovered",
                        "error", err,
                        "path", r.URL.Path,
                        "method", r.Method,
                    )
                    
                    writeError(w, http.StatusInternalServerError, "Internal server error")
                }
            }()
            
            next.ServeHTTP(w, r)
        })
    }
}

// ========================================
// Helper Functions
// ========================================

func writeError(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(map[string]string{
        "error": message,
    })
}

// Logger interface for dependency injection
type Logger interface {
    Info(msg string, keysAndValues ...interface{})
    Error(msg string, keysAndValues ...interface{})
}

// ========================================
// Usage Example
// ========================================

func SetupHandler(logger Logger, jwtSecret []byte) http.Handler {
    // Create rate limiter: 100 requests/second with burst of 10
    rateLimiter := NewRateLimiter(100, 10)
    
    // Create the main handler
    mux := http.NewServeMux()
    mux.HandleFunc("/api/query", queryHandler)
    mux.HandleFunc("/api/health", healthHandler)
    
    // Apply middleware chain
    // Order: Recovery -> Logging -> RateLimit -> Auth -> Handler
    handler := Chain(
        mux,
        RecoveryMiddleware(logger),
        LoggingMiddleware(logger),
        RateLimitMiddleware(rateLimiter),
        JWTAuthMiddleware(jwtSecret, "user", "admin"),
    )
    
    return handler
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
    // Access user from context
    userID := r.Context().Value(UserContextKey).(string)
    
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Query executed",
        "user":    userID,
    })
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}
```

#### Key Design Decisions

1. **Composable middleware**: Each middleware is independent and can be reused
2. **Context propagation**: User information flows through request context
3. **Per-key rate limiting**: Prevents abuse while allowing legitimate traffic
4. **Graceful panic recovery**: Prevents server crashes from affecting other requests

---


## Question 6: CI/CD Pipeline for Plugin Development

**Difficulty**: Intermediate  
**Category**: Architecture

### Question

Design a CI/CD pipeline for a Grafana data source plugin that includes:

1. Automated testing (unit, integration, E2E)
2. Security scanning
3. Multi-platform builds (Linux, macOS, Windows)
4. Plugin signing for Grafana marketplace
5. Staged deployments (staging → production)

Explain your pipeline stages and the tools you would use.

### Answer

#### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE STAGES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PR/Push          Merge to Main        Release Tag         Post-Release         │
│  ┌─────────┐      ┌─────────┐          ┌─────────┐         ┌─────────┐          │
│  │  Lint   │      │  Build  │          │  Sign   │         │ Deploy  │          │
│  │  Test   │ ───► │  Scan   │ ───────► │ Package │ ──────► │ Monitor │          │
│  │  Build  │      │  E2E    │          │ Release │         │ Rollback│          │
│  └─────────┘      └─────────┘          └─────────┘         └─────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### GitHub Actions Implementation

```yaml
# .github/workflows/ci-cd.yml
name: Plugin CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  GO_VERSION: '1.21'
  NODE_VERSION: '18'
  PLUGIN_ID: 'myorg-datasource'

jobs:
  # ============================================
  # Stage 1: Lint and Static Analysis
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          go mod download
      
      - name: Go lint
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
          args: --timeout=5m
      
      - name: TypeScript lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck

  # ============================================
  # Stage 2: Unit Tests
  # ============================================
  test-unit:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          go mod download
      
      - name: Go unit tests
        run: |
          go test -v -race -coverprofile=coverage-go.out ./...
          go tool cover -func=coverage-go.out
      
      - name: Frontend unit tests
        run: npm run test:ci -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage-go.out,./coverage/lcov.info

  # ============================================
  # Stage 3: Security Scanning
  # ============================================
  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Go vulnerability check
        uses: golang/govulncheck-action@v1
      
      - name: Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}

  # ============================================
  # Stage 4: Multi-Platform Build
  # ============================================
  build:
    runs-on: ubuntu-latest
    needs: [test-unit, security]
    strategy:
      matrix:
        include:
          - goos: linux
            goarch: amd64
          - goos: linux
            goarch: arm64
          - goos: darwin
            goarch: amd64
          - goos: darwin
            goarch: arm64
          - goos: windows
            goarch: amd64
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
      
      - name: Build backend
        env:
          GOOS: ${{ matrix.goos }}
          GOARCH: ${{ matrix.goarch }}
        run: |
          go build -ldflags="-w -s" -o dist/gpx_${{ env.PLUGIN_ID }}_${{ matrix.goos }}_${{ matrix.goarch }} ./pkg
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-${{ matrix.goos }}-${{ matrix.goarch }}
          path: dist/

  build-frontend:
    runs-on: ubuntu-latest
    needs: [test-unit, security]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Build frontend
        run: |
          npm ci
          npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: dist/

  # ============================================
  # Stage 5: E2E Tests
  # ============================================
  test-e2e:
    runs-on: ubuntu-latest
    needs: [build, build-frontend]
    services:
      grafana:
        image: grafana/grafana:latest
        ports:
          - 3000:3000
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist/
          merge-multiple: true
      
      - name: Setup Grafana with plugin
        run: |
          docker cp dist/ grafana:/var/lib/grafana/plugins/${{ env.PLUGIN_ID }}
          docker restart grafana
          sleep 30
      
      - name: Run E2E tests
        run: npm run e2e
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-screenshots
          path: e2e/screenshots/

  # ============================================
  # Stage 6: Package and Sign (Release only)
  # ============================================
  package:
    runs-on: ubuntu-latest
    needs: test-e2e
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist/
          merge-multiple: true
      
      - name: Package plugin
        run: |
          cd dist
          zip -r ../${{ env.PLUGIN_ID }}-${{ github.ref_name }}.zip .
      
      - name: Sign plugin
        env:
          GRAFANA_ACCESS_POLICY_TOKEN: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
        run: |
          npx @grafana/sign-plugin@latest
      
      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            ${{ env.PLUGIN_ID }}-${{ github.ref_name }}.zip
            dist/MANIFEST.txt

  # ============================================
  # Stage 7: Deploy to Staging
  # ============================================
  deploy-staging:
    runs-on: ubuntu-latest
    needs: package
    environment: staging
    steps:
      - name: Deploy to staging Grafana
        run: |
          curl -X POST "${{ secrets.STAGING_GRAFANA_URL }}/api/plugins/${{ env.PLUGIN_ID }}/install" \
            -H "Authorization: Bearer ${{ secrets.STAGING_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"version": "${{ github.ref_name }}"}'
      
      - name: Smoke test
        run: |
          sleep 60
          curl -f "${{ secrets.STAGING_GRAFANA_URL }}/api/plugins/${{ env.PLUGIN_ID }}/health"

  # ============================================
  # Stage 8: Deploy to Production
  # ============================================
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production
    steps:
      - name: Deploy to production
        run: |
          curl -X POST "${{ secrets.PROD_GRAFANA_URL }}/api/plugins/${{ env.PLUGIN_ID }}/install" \
            -H "Authorization: Bearer ${{ secrets.PROD_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"version": "${{ github.ref_name }}"}'
      
      - name: Verify deployment
        run: |
          sleep 120
          curl -f "${{ secrets.PROD_GRAFANA_URL }}/api/plugins/${{ env.PLUGIN_ID }}/health"
```

#### Key Pipeline Features

| Feature | Tool/Approach | Purpose |
|---------|---------------|---------|
| **Linting** | golangci-lint, ESLint | Code quality enforcement |
| **Security** | Trivy, govulncheck | Vulnerability detection |
| **Multi-platform** | Matrix builds | Support all Grafana platforms |
| **Plugin signing** | @grafana/sign-plugin | Marketplace distribution |
| **Staged deploy** | GitHub Environments | Safe production rollouts |

---


## Question 7: Design BigQuery Data Source Integration

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a Grafana data source plugin for Google BigQuery that handles:

1. Large result sets (millions of rows)
2. Query cost estimation before execution
3. Caching to reduce BigQuery costs
4. Support for parameterized queries
5. Integration with Grafana variables

Explain your design decisions and how you would handle BigQuery-specific challenges.

### Answer

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BIGQUERY DATA SOURCE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         Query Processor                                  │    │
│  │  • SQL parsing    • Variable substitution    • Cost estimation          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│                    ┌─────────────────┼─────────────────┐                        │
│                    ▼                 ▼                 ▼                        │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Cost Estimator    │  │  Query Cache    │  │  Result Streamer│             │
│  │   • Dry run API     │  │  • Hash-based   │  │  • Pagination   │             │
│  │   • Byte estimation │  │  • TTL-based    │  │  • Chunking     │             │
│  └─────────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    BigQuery Client (with retry)                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Core Implementation

```go
package plugin

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "regexp"
    "strings"
    "time"

    "cloud.google.com/go/bigquery"
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
    "google.golang.org/api/iterator"
)

// BigQueryDatasource handles BigQuery queries
type BigQueryDatasource struct {
    client       *bigquery.Client
    cache        *QueryCache
    maxRowsLimit int64
    costWarning  float64 // Cost threshold for warnings (in USD)
}

// QueryModel represents a BigQuery query
type QueryModel struct {
    RawSQL        string            `json:"rawSql"`
    Format        string            `json:"format"` // "time_series" or "table"
    Location      string            `json:"location"`
    MaxRows       int64             `json:"maxRows"`
    BypassCache   bool              `json:"bypassCache"`
    EstimateCost  bool              `json:"estimateCost"`
}

// QueryData handles query requests
func (d *BigQueryDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()
    
    for _, query := range req.Queries {
        response.Responses[query.RefID] = d.executeQuery(ctx, query, req.PluginContext)
    }
    
    return response, nil
}

func (d *BigQueryDatasource) executeQuery(ctx context.Context, query backend.DataQuery, pCtx backend.PluginContext) backend.DataResponse {
    // Parse query model
    var qm QueryModel
    if err := json.Unmarshal(query.JSON, &qm); err != nil {
        return backend.ErrDataResponse(backend.StatusBadRequest, "Invalid query: "+err.Error())
    }
    
    // Substitute Grafana variables
    processedSQL := d.substituteVariables(qm.RawSQL, query.TimeRange)
    
    // Check cache first (unless bypassed)
    cacheKey := d.generateCacheKey(processedSQL, query.TimeRange)
    if !qm.BypassCache {
        if cached, found := d.cache.Get(cacheKey); found {
            return cached
        }
    }
    
    // Estimate cost if requested
    if qm.EstimateCost {
        cost, err := d.estimateQueryCost(ctx, processedSQL)
        if err != nil {
            backend.Logger.Warn("Cost estimation failed", "error", err)
        } else if cost > d.costWarning {
            backend.Logger.Warn("High cost query detected", "estimated_cost_usd", cost)
        }
    }
    
    // Execute query with streaming for large results
    frames, err := d.executeWithStreaming(ctx, processedSQL, qm)
    if err != nil {
        return backend.ErrDataResponse(backend.StatusInternal, "Query failed: "+err.Error())
    }
    
    response := backend.DataResponse{Frames: frames}
    
    // Cache successful results
    d.cache.Set(cacheKey, response)
    
    return response
}

// substituteVariables replaces Grafana variables in SQL
func (d *BigQueryDatasource) substituteVariables(sql string, timeRange backend.TimeRange) string {
    // Replace time range macros
    sql = strings.ReplaceAll(sql, "$__timeFrom", fmt.Sprintf("TIMESTAMP('%s')", timeRange.From.Format(time.RFC3339)))
    sql = strings.ReplaceAll(sql, "$__timeTo", fmt.Sprintf("TIMESTAMP('%s')", timeRange.To.Format(time.RFC3339)))
    
    // Replace interval macro
    interval := timeRange.To.Sub(timeRange.From)
    sql = strings.ReplaceAll(sql, "$__interval", fmt.Sprintf("INTERVAL %d SECOND", int(interval.Seconds()/100)))
    
    // Replace time filter macro
    timeFilter := fmt.Sprintf("timestamp BETWEEN TIMESTAMP('%s') AND TIMESTAMP('%s')",
        timeRange.From.Format(time.RFC3339),
        timeRange.To.Format(time.RFC3339))
    sql = strings.ReplaceAll(sql, "$__timeFilter", timeFilter)
    
    return sql
}

// estimateQueryCost uses BigQuery dry run to estimate cost
func (d *BigQueryDatasource) estimateQueryCost(ctx context.Context, sql string) (float64, error) {
    q := d.client.Query(sql)
    q.DryRun = true
    
    job, err := q.Run(ctx)
    if err != nil {
        return 0, err
    }
    
    status := job.LastStatus()
    if status.Statistics == nil {
        return 0, fmt.Errorf("no statistics available")
    }
    
    // BigQuery pricing: $5 per TB processed (as of 2024)
    bytesProcessed := status.Statistics.TotalBytesProcessed
    costPerTB := 5.0
    costUSD := float64(bytesProcessed) / (1024 * 1024 * 1024 * 1024) * costPerTB
    
    return costUSD, nil
}

// executeWithStreaming handles large result sets efficiently
func (d *BigQueryDatasource) executeWithStreaming(ctx context.Context, sql string, qm QueryModel) ([]*data.Frame, error) {
    q := d.client.Query(sql)
    if qm.Location != "" {
        q.Location = qm.Location
    }
    
    it, err := q.Read(ctx)
    if err != nil {
        return nil, err
    }
    
    // Determine max rows
    maxRows := qm.MaxRows
    if maxRows <= 0 || maxRows > d.maxRowsLimit {
        maxRows = d.maxRowsLimit
    }
    
    // Build frame incrementally
    var timestamps []time.Time
    var values []float64
    var labels []string
    
    rowCount := int64(0)
    for {
        var row map[string]bigquery.Value
        err := it.Next(&row)
        if err == iterator.Done {
            break
        }
        if err != nil {
            return nil, err
        }
        
        // Extract values based on format
        if ts, ok := row["timestamp"].(time.Time); ok {
            timestamps = append(timestamps, ts)
        }
        if val, ok := row["value"].(float64); ok {
            values = append(values, val)
        }
        if label, ok := row["label"].(string); ok {
            labels = append(labels, label)
        }
        
        rowCount++
        if rowCount >= maxRows {
            backend.Logger.Warn("Result truncated", "maxRows", maxRows)
            break
        }
    }
    
    // Create data frame
    frame := data.NewFrame("results")
    
    if len(timestamps) > 0 {
        frame.Fields = append(frame.Fields, data.NewField("time", nil, timestamps))
    }
    if len(values) > 0 {
        frame.Fields = append(frame.Fields, data.NewField("value", nil, values))
    }
    if len(labels) > 0 {
        frame.Fields = append(frame.Fields, data.NewField("label", nil, labels))
    }
    
    // Add metadata
    frame.Meta = &data.FrameMeta{
        ExecutedQueryString: sql,
        Custom: map[string]interface{}{
            "rowCount":  rowCount,
            "truncated": rowCount >= maxRows,
        },
    }
    
    return []*data.Frame{frame}, nil
}

func (d *BigQueryDatasource) generateCacheKey(sql string, timeRange backend.TimeRange) string {
    key := fmt.Sprintf("%s:%d:%d", sql, timeRange.From.Unix(), timeRange.To.Unix())
    hash := sha256.Sum256([]byte(key))
    return hex.EncodeToString(hash[:])
}

// Variable query support for Grafana template variables
func (d *BigQueryDatasource) MetricFindQuery(ctx context.Context, query string) ([]string, error) {
    q := d.client.Query(query)
    
    it, err := q.Read(ctx)
    if err != nil {
        return nil, err
    }
    
    var results []string
    for {
        var row []bigquery.Value
        err := it.Next(&row)
        if err == iterator.Done {
            break
        }
        if err != nil {
            return nil, err
        }
        
        if len(row) > 0 {
            results = append(results, fmt.Sprintf("%v", row[0]))
        }
    }
    
    return results, nil
}
```

#### BigQuery-Specific Challenges and Solutions

| Challenge | Solution | Trade-off |
|-----------|----------|-----------|
| **Large results** | Streaming with row limits | May truncate data |
| **Query costs** | Dry run estimation + caching | Extra API call overhead |
| **Slow queries** | Async execution with polling | Complex state management |
| **Variable substitution** | Custom macro processor | Limited SQL validation |
| **Authentication** | Service account + workload identity | Key management complexity |

#### Cost Optimization Strategies

1. **Aggressive caching**: Cache results based on query + time range hash
2. **Partition pruning**: Encourage use of partitioned tables
3. **Column selection**: Warn users about SELECT * queries
4. **Query quotas**: Implement per-user/org query limits

---


## Question 8: Implement Connection Pool Manager

**Difficulty**: Advanced  
**Category**: Coding

### Question

Implement a connection pool manager in Go for a Grafana data source plugin that:

1. Maintains a pool of reusable database connections
2. Supports configurable min/max pool sizes
3. Implements health checking with automatic connection recycling
4. Handles connection timeouts and retries
5. Provides metrics for monitoring pool health

Write production-quality Go code with proper error handling.

### Answer

```go
package pool

import (
    "context"
    "database/sql"
    "errors"
    "sync"
    "sync/atomic"
    "time"
)

// Errors
var (
    ErrPoolClosed     = errors.New("connection pool is closed")
    ErrPoolExhausted  = errors.New("connection pool exhausted")
    ErrAcquireTimeout = errors.New("timeout waiting for connection")
)

// Connection wraps a database connection with metadata
type Connection struct {
    DB        *sql.Conn
    CreatedAt time.Time
    LastUsed  time.Time
    UseCount  int64
}

// PoolConfig holds pool configuration
type PoolConfig struct {
    MinSize         int
    MaxSize         int
    MaxIdleTime     time.Duration
    MaxLifetime     time.Duration
    HealthCheckFreq time.Duration
    AcquireTimeout  time.Duration
    ConnectFunc     func(ctx context.Context) (*sql.Conn, error)
}

// PoolStats holds pool statistics
type PoolStats struct {
    TotalConnections  int64
    IdleConnections   int64
    ActiveConnections int64
    WaitCount         int64
    WaitDuration      time.Duration
    MaxIdleTimeClosed int64
    MaxLifetimeClosed int64
    HealthCheckFailed int64
}

// ConnectionPool manages a pool of database connections
type ConnectionPool struct {
    config     PoolConfig
    mu         sync.Mutex
    cond       *sync.Cond
    idle       []*Connection
    active     map[*Connection]struct{}
    closed     bool
    stopHealth chan struct{}
    
    // Metrics (atomic)
    stats struct {
        waitCount         int64
        totalWaitDuration int64
        maxIdleClosed     int64
        maxLifetimeClosed int64
        healthCheckFailed int64
    }
}

// NewConnectionPool creates a new connection pool
func NewConnectionPool(config PoolConfig) (*ConnectionPool, error) {
    if config.MinSize < 0 {
        config.MinSize = 0
    }
    if config.MaxSize <= 0 {
        config.MaxSize = 10
    }
    if config.MaxIdleTime <= 0 {
        config.MaxIdleTime = 10 * time.Minute
    }
    if config.MaxLifetime <= 0 {
        config.MaxLifetime = 1 * time.Hour
    }
    if config.HealthCheckFreq <= 0 {
        config.HealthCheckFreq = 30 * time.Second
    }
    if config.AcquireTimeout <= 0 {
        config.AcquireTimeout = 30 * time.Second
    }
    
    pool := &ConnectionPool{
        config:     config,
        idle:       make([]*Connection, 0, config.MaxSize),
        active:     make(map[*Connection]struct{}),
        stopHealth: make(chan struct{}),
    }
    pool.cond = sync.NewCond(&pool.mu)
    
    // Pre-populate with minimum connections
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    for i := 0; i < config.MinSize; i++ {
        conn, err := pool.createConnection(ctx)
        if err != nil {
            pool.Close()
            return nil, err
        }
        pool.idle = append(pool.idle, conn)
    }
    
    // Start health check goroutine
    go pool.healthCheckLoop()
    
    return pool, nil
}

// Acquire gets a connection from the pool
func (p *ConnectionPool) Acquire(ctx context.Context) (*Connection, error) {
    startWait := time.Now()
    atomic.AddInt64(&p.stats.waitCount, 1)
    
    p.mu.Lock()
    defer p.mu.Unlock()
    
    for {
        // Check if pool is closed
        if p.closed {
            return nil, ErrPoolClosed
        }
        
        // Try to get an idle connection
        if len(p.idle) > 0 {
            conn := p.idle[len(p.idle)-1]
            p.idle = p.idle[:len(p.idle)-1]
            
            // Check if connection is still valid
            if p.isConnectionValid(conn) {
                p.active[conn] = struct{}{}
                conn.LastUsed = time.Now()
                conn.UseCount++
                
                atomic.AddInt64(&p.stats.totalWaitDuration, int64(time.Since(startWait)))
                return conn, nil
            }
            
            // Connection invalid, close it
            p.closeConnection(conn)
            continue
        }
        
        // Try to create a new connection if under max
        if len(p.active) < p.config.MaxSize {
            p.mu.Unlock()
            conn, err := p.createConnection(ctx)
            p.mu.Lock()
            
            if err != nil {
                return nil, err
            }
            
            p.active[conn] = struct{}{}
            atomic.AddInt64(&p.stats.totalWaitDuration, int64(time.Since(startWait)))
            return conn, nil
        }
        
        // Wait for a connection to become available
        done := make(chan struct{})
        go func() {
            select {
            case <-ctx.Done():
                p.cond.Broadcast()
            case <-done:
            }
        }()
        
        p.cond.Wait()
        close(done)
        
        // Check context timeout
        if ctx.Err() != nil {
            return nil, ErrAcquireTimeout
        }
    }
}

// Release returns a connection to the pool
func (p *ConnectionPool) Release(conn *Connection) {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    // Remove from active
    delete(p.active, conn)
    
    if p.closed {
        p.closeConnection(conn)
        return
    }
    
    // Check if connection should be recycled
    if !p.isConnectionValid(conn) {
        p.closeConnection(conn)
        p.cond.Signal()
        return
    }
    
    // Return to idle pool
    conn.LastUsed = time.Now()
    p.idle = append(p.idle, conn)
    p.cond.Signal()
}

// Stats returns current pool statistics
func (p *ConnectionPool) Stats() PoolStats {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    return PoolStats{
        TotalConnections:  int64(len(p.idle) + len(p.active)),
        IdleConnections:   int64(len(p.idle)),
        ActiveConnections: int64(len(p.active)),
        WaitCount:         atomic.LoadInt64(&p.stats.waitCount),
        WaitDuration:      time.Duration(atomic.LoadInt64(&p.stats.totalWaitDuration)),
        MaxIdleTimeClosed: atomic.LoadInt64(&p.stats.maxIdleClosed),
        MaxLifetimeClosed: atomic.LoadInt64(&p.stats.maxLifetimeClosed),
        HealthCheckFailed: atomic.LoadInt64(&p.stats.healthCheckFailed),
    }
}

// Close shuts down the pool
func (p *ConnectionPool) Close() error {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if p.closed {
        return nil
    }
    
    p.closed = true
    close(p.stopHealth)
    
    // Close all idle connections
    for _, conn := range p.idle {
        p.closeConnection(conn)
    }
    p.idle = nil
    
    // Signal all waiters
    p.cond.Broadcast()
    
    return nil
}

func (p *ConnectionPool) createConnection(ctx context.Context) (*Connection, error) {
    db, err := p.config.ConnectFunc(ctx)
    if err != nil {
        return nil, err
    }
    
    return &Connection{
        DB:        db,
        CreatedAt: time.Now(),
        LastUsed:  time.Now(),
        UseCount:  0,
    }, nil
}

func (p *ConnectionPool) closeConnection(conn *Connection) {
    if conn.DB != nil {
        conn.DB.Close()
    }
}

func (p *ConnectionPool) isConnectionValid(conn *Connection) bool {
    now := time.Now()
    
    // Check max lifetime
    if now.Sub(conn.CreatedAt) > p.config.MaxLifetime {
        atomic.AddInt64(&p.stats.maxLifetimeClosed, 1)
        return false
    }
    
    // Check max idle time
    if now.Sub(conn.LastUsed) > p.config.MaxIdleTime {
        atomic.AddInt64(&p.stats.maxIdleClosed, 1)
        return false
    }
    
    return true
}

func (p *ConnectionPool) healthCheckLoop() {
    ticker := time.NewTicker(p.config.HealthCheckFreq)
    defer ticker.Stop()
    
    for {
        select {
        case <-p.stopHealth:
            return
        case <-ticker.C:
            p.performHealthCheck()
        }
    }
}

func (p *ConnectionPool) performHealthCheck() {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if p.closed {
        return
    }
    
    // Check each idle connection
    healthy := make([]*Connection, 0, len(p.idle))
    for _, conn := range p.idle {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        err := conn.DB.PingContext(ctx)
        cancel()
        
        if err != nil {
            atomic.AddInt64(&p.stats.healthCheckFailed, 1)
            p.closeConnection(conn)
            continue
        }
        
        if p.isConnectionValid(conn) {
            healthy = append(healthy, conn)
        } else {
            p.closeConnection(conn)
        }
    }
    
    p.idle = healthy
    
    // Ensure minimum connections
    for len(p.idle)+len(p.active) < p.config.MinSize {
        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        conn, err := p.createConnection(ctx)
        cancel()
        
        if err != nil {
            break
        }
        p.idle = append(p.idle, conn)
    }
}

// Example usage
func ExampleUsage() {
    pool, err := NewConnectionPool(PoolConfig{
        MinSize:         2,
        MaxSize:         10,
        MaxIdleTime:     5 * time.Minute,
        MaxLifetime:     30 * time.Minute,
        HealthCheckFreq: 30 * time.Second,
        AcquireTimeout:  10 * time.Second,
        ConnectFunc: func(ctx context.Context) (*sql.Conn, error) {
            // Create actual database connection
            db, _ := sql.Open("postgres", "connection-string")
            return db.Conn(ctx)
        },
    })
    if err != nil {
        panic(err)
    }
    defer pool.Close()
    
    // Acquire connection
    ctx := context.Background()
    conn, err := pool.Acquire(ctx)
    if err != nil {
        panic(err)
    }
    defer pool.Release(conn)
    
    // Use connection
    // conn.DB.QueryContext(ctx, "SELECT ...")
}
```

#### Key Design Features

1. **Condition variable for waiting**: Efficient blocking when pool is exhausted
2. **Atomic metrics**: Thread-safe statistics without lock contention
3. **Background health checks**: Proactive connection validation
4. **Graceful degradation**: Automatic connection recycling on failures

---


## Question 9: Plugin Performance Degradation

**Difficulty**: Advanced  
**Category**: Scenario-Based

### Question

You're the on-call engineer and receive an alert that a Grafana data source plugin you maintain is causing dashboard load times to increase from 2 seconds to 30+ seconds. The plugin serves 500+ dashboards across the organization.

Walk through your incident response process. What immediate actions would you take? How would you diagnose the root cause? What would your communication look like?

### Answer

#### Incident Response Timeline

**T+0 minutes: Initial Assessment**

```bash
# 1. Check current error rates and latency
curl -s "http://grafana:3000/api/plugins/mydatasource/metrics" | jq '.latency_p99'

# 2. Check Grafana server health
curl -s "http://grafana:3000/api/health"

# 3. Quick log scan for errors
grep -i "error\|panic\|timeout" /var/log/grafana/grafana.log | tail -50
```

**T+2 minutes: Immediate Mitigation**

```go
// If plugin has feature flags, disable problematic features
// Example: Disable caching if cache is suspected
config.CacheEnabled = false

// Or implement circuit breaker activation
circuitBreaker.Trip()
```

**T+5 minutes: Communication**

```markdown
**Incident Update - Dashboard Performance Degradation**

**Status**: Investigating
**Impact**: Dashboard load times increased to 30+ seconds
**Affected**: All dashboards using [plugin-name] data source
**Start Time**: [timestamp]

**Current Actions**:
- Investigating root cause
- Monitoring error rates
- Preparing rollback if needed

**Next Update**: 15 minutes
```

#### Diagnostic Process

**Step 1: Identify the Bottleneck**

```go
// Add emergency instrumentation
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    // Trace each phase
    phases := make(map[string]time.Duration)
    
    start := time.Now()
    
    // Phase 1: Parse queries
    parseStart := time.Now()
    queries := parseQueries(req.Queries)
    phases["parse"] = time.Since(parseStart)
    
    // Phase 2: Get connections
    connStart := time.Now()
    conn, err := d.pool.Acquire(ctx)
    phases["connection"] = time.Since(connStart)
    
    // Phase 3: Execute
    execStart := time.Now()
    results, err := d.execute(ctx, conn, queries)
    phases["execute"] = time.Since(execStart)
    
    // Phase 4: Transform
    transformStart := time.Now()
    frames := transform(results)
    phases["transform"] = time.Since(transformStart)
    
    // Log if slow
    total := time.Since(start)
    if total > 5*time.Second {
        backend.Logger.Error("Slow query detected",
            "total", total,
            "phases", phases,
            "query_count", len(req.Queries),
        )
    }
    
    return &backend.QueryDataResponse{Responses: frames}, nil
}
```

**Step 2: Check Resource Utilization**

```bash
# Memory usage
ps aux | grep grafana

# CPU and goroutines (if pprof enabled)
curl http://localhost:6060/debug/pprof/goroutine?debug=1 | head -20

# Connection pool status
curl http://localhost:6060/debug/pool/stats
```

**Step 3: Database/Backend Health**

```sql
-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'grafana';
```

#### Common Root Causes and Solutions

| Root Cause | Symptoms | Immediate Fix | Long-term Fix |
|------------|----------|---------------|---------------|
| **Connection pool exhaustion** | High wait times, timeouts | Increase pool size | Fix connection leaks |
| **Backend overload** | Slow query execution | Add query timeout | Query optimization |
| **Memory leak** | Growing memory, GC pauses | Restart plugin | Fix allocation patterns |
| **Cache stampede** | Spike after cache expiry | Stagger TTLs | Implement cache warming |
| **N+1 queries** | Many small queries | Batch queries | Query consolidation |

#### Rollback Decision Tree

```
Is the issue causing data loss?
├── Yes → Immediate rollback
└── No → Continue diagnosis
    │
    ├── Can you identify root cause in 15 min?
    │   ├── Yes → Fix forward
    │   └── No → Rollback
    │
    └── Is there a safe degraded mode?
        ├── Yes → Enable degraded mode
        └── No → Rollback
```

#### Post-Incident Actions

1. **Root Cause Analysis (RCA)** document
2. **Runbook update** with new diagnostic steps
3. **Monitoring improvements** - add missing metrics
4. **Load testing** to prevent recurrence
5. **Blameless postmortem** meeting

---


## Question 10: Data Source Configuration Best Practices

**Difficulty**: Intermediate  
**Category**: Architecture

### Question

What are the best practices for designing the configuration interface for a Grafana data source plugin? Consider:

1. Secure credential handling
2. Connection validation
3. Default values and validation
4. User experience for complex configurations

Provide examples of good and bad configuration patterns.

### Answer

#### Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA SOURCE CONFIGURATION LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    User Interface (ConfigEditor)                         │    │
│  │  • Input validation    • Help text    • Conditional fields              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Configuration Storage                                 │    │
│  │  ┌─────────────────┐              ┌─────────────────┐                   │    │
│  │  │   jsonData      │              │ secureJsonData  │                   │    │
│  │  │  (plain text)   │              │  (encrypted)    │                   │    │
│  │  │  • URL          │              │  • API keys     │                   │    │
│  │  │  • Options      │              │  • Passwords    │                   │    │
│  │  │  • Timeouts     │              │  • Tokens       │                   │    │
│  │  └─────────────────┘              └─────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Best Practices Implementation

**1. Secure Credential Handling**

```typescript
// ✅ GOOD: Use secureJsonData for sensitive fields
interface MySecureJsonData {
  apiKey?: string;
  password?: string;
  privateKey?: string;
}

interface MyDataSourceOptions extends DataSourceJsonData {
  url: string;
  timeout: number;
  // ❌ BAD: Never store credentials in jsonData
  // apiKey: string; // DON'T DO THIS
}

// ConfigEditor component
export function ConfigEditor({ options, onOptionsChange }: Props) {
  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: event.target.value,
      },
    });
  };

  const onResetAPIKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  return (
    <SecretInput
      isConfigured={options.secureJsonFields?.apiKey}
      value={options.secureJsonData?.apiKey || ''}
      placeholder="Enter API key"
      onReset={onResetAPIKey}
      onChange={onAPIKeyChange}
    />
  );
}
```

**2. Connection Validation**

```go
// Backend health check with detailed feedback
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    // Parse configuration
    config, err := parseConfig(req.PluginContext.DataSourceInstanceSettings)
    if err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Invalid configuration: %v", err),
        }, nil
    }
    
    // Validate URL format
    if _, err := url.Parse(config.URL); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: "Invalid URL format",
        }, nil
    }
    
    // Test connection with timeout
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    client := d.createClient(config)
    
    // Perform actual connectivity test
    if err := client.Ping(ctx); err != nil {
        // Provide actionable error messages
        if errors.Is(err, context.DeadlineExceeded) {
            return &backend.CheckHealthResult{
                Status:  backend.HealthStatusError,
                Message: "Connection timeout - check network connectivity and firewall rules",
            }, nil
        }
        
        if strings.Contains(err.Error(), "certificate") {
            return &backend.CheckHealthResult{
                Status:  backend.HealthStatusError,
                Message: "TLS certificate error - verify certificate or enable 'Skip TLS Verify'",
            }, nil
        }
        
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Connection failed: %v", err),
        }, nil
    }
    
    // Test authentication
    if err := client.TestAuth(ctx); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: "Authentication failed - verify credentials",
        }, nil
    }
    
    return &backend.CheckHealthResult{
        Status:  backend.HealthStatusOk,
        Message: "Successfully connected to data source",
    }, nil
}
```

**3. Default Values and Validation**

```typescript
// ✅ GOOD: Provide sensible defaults with validation
export const defaultQuery: Partial<MyQuery> = {
  format: 'time_series',
  maxDataPoints: 1000,
  intervalMs: 1000,
};

// Validation schema
const configSchema = {
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'URL must start with http:// or https://',
  },
  timeout: {
    required: false,
    default: 30,
    min: 1,
    max: 300,
    message: 'Timeout must be between 1 and 300 seconds',
  },
  maxConnections: {
    required: false,
    default: 10,
    min: 1,
    max: 100,
  },
};

// Validation function
function validateConfig(config: MyDataSourceOptions): ValidationResult {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(configSchema)) {
    const value = config[field as keyof MyDataSourceOptions];
    
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (rules.pattern && value && !rules.pattern.test(value as string)) {
      errors.push(rules.message);
    }
    
    if (rules.min !== undefined && (value as number) < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

**4. User Experience Patterns**

```typescript
// ✅ GOOD: Progressive disclosure for complex configs
export function ConfigEditor({ options, onOptionsChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div>
      {/* Essential fields always visible */}
      <InlineField label="URL" required tooltip="Base URL of your data source">
        <Input value={options.jsonData.url} onChange={onURLChange} />
      </InlineField>
      
      <InlineField label="API Key" required>
        <SecretInput {...apiKeyProps} />
      </InlineField>
      
      {/* Advanced options collapsed by default */}
      <Collapse label="Advanced Options" isOpen={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)}>
        <InlineField label="Timeout (seconds)" tooltip="Query timeout in seconds">
          <Input type="number" value={options.jsonData.timeout || 30} onChange={onTimeoutChange} />
        </InlineField>
        
        <InlineField label="Max Connections" tooltip="Maximum concurrent connections">
          <Input type="number" value={options.jsonData.maxConnections || 10} onChange={onMaxConnsChange} />
        </InlineField>
        
        <InlineField label="Skip TLS Verify" tooltip="Skip TLS certificate verification (not recommended for production)">
          <Switch value={options.jsonData.tlsSkipVerify} onChange={onTLSChange} />
        </InlineField>
      </Collapse>
    </div>
  );
}
```

#### Configuration Anti-Patterns

| ❌ Bad Practice | ✅ Good Practice |
|-----------------|------------------|
| Store passwords in jsonData | Use secureJsonData for all secrets |
| No input validation | Validate on change and on save |
| Cryptic error messages | Provide actionable error messages |
| All options visible at once | Use progressive disclosure |
| No default values | Provide sensible defaults |
| Hard-coded timeouts | Make timeouts configurable |

---


## Question 11: Design Plugin Health Check System

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a comprehensive health check system for a Grafana data source plugin that:

1. Monitors multiple backend dependencies
2. Provides granular health status (not just up/down)
3. Supports health check caching to prevent overload
4. Exposes metrics for alerting
5. Handles partial failures gracefully

Explain your design and provide implementation details.

### Answer

#### Health Check Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK SYSTEM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Health Check Orchestrator                             │    │
│  │  • Parallel checks    • Result aggregation    • Caching                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                    │                │                │                          │
│                    ▼                ▼                ▼                          │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Database Check     │  │  Cache Check    │  │  External API   │             │
│  │  • Connection       │  │  • Redis ping   │  │  • HTTP check   │             │
│  │  • Query latency    │  │  • Memory usage │  │  • Auth verify  │             │
│  └─────────────────────┘  └─────────────────┘  └─────────────────┘             │
│                    │                │                │                          │
│                    └────────────────┼────────────────┘                          │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Health Status Aggregator                              │    │
│  │  • Weighted scoring    • Degraded detection    • Metrics export         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Implementation

```go
package health

import (
    "context"
    "sync"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/prometheus/client_golang/prometheus"
)

// HealthStatus represents granular health states
type HealthStatus string

const (
    StatusHealthy  HealthStatus = "healthy"
    StatusDegraded HealthStatus = "degraded"
    StatusUnhealthy HealthStatus = "unhealthy"
)

// ComponentHealth represents health of a single component
type ComponentHealth struct {
    Name        string            `json:"name"`
    Status      HealthStatus      `json:"status"`
    Message     string            `json:"message"`
    Latency     time.Duration     `json:"latency"`
    LastChecked time.Time         `json:"lastChecked"`
    Details     map[string]string `json:"details,omitempty"`
}

// HealthChecker interface for individual health checks
type HealthChecker interface {
    Name() string
    Check(ctx context.Context) ComponentHealth
    Weight() int // Importance weight for aggregation
    Critical() bool // If true, failure = overall unhealthy
}

// HealthCheckSystem orchestrates all health checks
type HealthCheckSystem struct {
    checkers    []HealthChecker
    cache       *healthCache
    cacheTTL    time.Duration
    metrics     *healthMetrics
    mu          sync.RWMutex
}

type healthCache struct {
    result    *AggregatedHealth
    expiresAt time.Time
    mu        sync.RWMutex
}

type healthMetrics struct {
    checkDuration *prometheus.HistogramVec
    checkStatus   *prometheus.GaugeVec
    overallStatus prometheus.Gauge
}

// AggregatedHealth represents overall system health
type AggregatedHealth struct {
    Status     HealthStatus      `json:"status"`
    Message    string            `json:"message"`
    Score      float64           `json:"score"` // 0-100
    Components []ComponentHealth `json:"components"`
    CheckedAt  time.Time         `json:"checkedAt"`
}

// NewHealthCheckSystem creates a new health check system
func NewHealthCheckSystem(cacheTTL time.Duration) *HealthCheckSystem {
    return &HealthCheckSystem{
        checkers: make([]HealthChecker, 0),
        cache: &healthCache{},
        cacheTTL: cacheTTL,
        metrics: newHealthMetrics(),
    }
}

func newHealthMetrics() *healthMetrics {
    return &healthMetrics{
        checkDuration: prometheus.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    "datasource_health_check_duration_seconds",
                Help:    "Duration of health checks by component",
                Buckets: []float64{0.01, 0.05, 0.1, 0.5, 1, 5},
            },
            []string{"component"},
        ),
        checkStatus: prometheus.NewGaugeVec(
            prometheus.GaugeOpts{
                Name: "datasource_health_check_status",
                Help: "Health check status by component (1=healthy, 0.5=degraded, 0=unhealthy)",
            },
            []string{"component"},
        ),
        overallStatus: prometheus.NewGauge(
            prometheus.GaugeOpts{
                Name: "datasource_health_overall_status",
                Help: "Overall health status (1=healthy, 0.5=degraded, 0=unhealthy)",
            },
        ),
    }
}

// RegisterChecker adds a health checker
func (h *HealthCheckSystem) RegisterChecker(checker HealthChecker) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.checkers = append(h.checkers, checker)
}

// Check performs health check with caching
func (h *HealthCheckSystem) Check(ctx context.Context) *AggregatedHealth {
    // Check cache first
    h.cache.mu.RLock()
    if h.cache.result != nil && time.Now().Before(h.cache.expiresAt) {
        result := h.cache.result
        h.cache.mu.RUnlock()
        return result
    }
    h.cache.mu.RUnlock()
    
    // Perform fresh check
    result := h.performCheck(ctx)
    
    // Update cache
    h.cache.mu.Lock()
    h.cache.result = result
    h.cache.expiresAt = time.Now().Add(h.cacheTTL)
    h.cache.mu.Unlock()
    
    return result
}

func (h *HealthCheckSystem) performCheck(ctx context.Context) *AggregatedHealth {
    h.mu.RLock()
    checkers := h.checkers
    h.mu.RUnlock()
    
    // Run checks in parallel
    results := make([]ComponentHealth, len(checkers))
    var wg sync.WaitGroup
    
    for i, checker := range checkers {
        wg.Add(1)
        go func(idx int, c HealthChecker) {
            defer wg.Done()
            
            start := time.Now()
            result := c.Check(ctx)
            duration := time.Since(start)
            
            result.Latency = duration
            result.LastChecked = time.Now()
            results[idx] = result
            
            // Update metrics
            h.metrics.checkDuration.WithLabelValues(c.Name()).Observe(duration.Seconds())
            h.metrics.checkStatus.WithLabelValues(c.Name()).Set(statusToFloat(result.Status))
        }(i, checker)
    }
    
    wg.Wait()
    
    // Aggregate results
    return h.aggregate(checkers, results)
}

func (h *HealthCheckSystem) aggregate(checkers []HealthChecker, results []ComponentHealth) *AggregatedHealth {
    var totalWeight int
    var weightedScore float64
    var criticalFailure bool
    var degradedComponents []string
    var unhealthyComponents []string
    
    for i, result := range results {
        weight := checkers[i].Weight()
        totalWeight += weight
        
        switch result.Status {
        case StatusHealthy:
            weightedScore += float64(weight) * 100
        case StatusDegraded:
            weightedScore += float64(weight) * 50
            degradedComponents = append(degradedComponents, result.Name)
        case StatusUnhealthy:
            weightedScore += 0
            unhealthyComponents = append(unhealthyComponents, result.Name)
            if checkers[i].Critical() {
                criticalFailure = true
            }
        }
    }
    
    score := weightedScore / float64(totalWeight)
    
    // Determine overall status
    var status HealthStatus
    var message string
    
    if criticalFailure {
        status = StatusUnhealthy
        message = fmt.Sprintf("Critical component(s) unhealthy: %v", unhealthyComponents)
    } else if score >= 90 {
        status = StatusHealthy
        message = "All components healthy"
    } else if score >= 50 {
        status = StatusDegraded
        message = fmt.Sprintf("Degraded components: %v", degradedComponents)
    } else {
        status = StatusUnhealthy
        message = fmt.Sprintf("Multiple components unhealthy: %v", unhealthyComponents)
    }
    
    // Update overall metric
    h.metrics.overallStatus.Set(statusToFloat(status))
    
    return &AggregatedHealth{
        Status:     status,
        Message:    message,
        Score:      score,
        Components: results,
        CheckedAt:  time.Now(),
    }
}

func statusToFloat(status HealthStatus) float64 {
    switch status {
    case StatusHealthy:
        return 1.0
    case StatusDegraded:
        return 0.5
    default:
        return 0.0
    }
}

// Example health checkers

// DatabaseHealthChecker checks database connectivity
type DatabaseHealthChecker struct {
    pool *ConnectionPool
}

func (d *DatabaseHealthChecker) Name() string { return "database" }
func (d *DatabaseHealthChecker) Weight() int { return 10 }
func (d *DatabaseHealthChecker) Critical() bool { return true }

func (d *DatabaseHealthChecker) Check(ctx context.Context) ComponentHealth {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    start := time.Now()
    conn, err := d.pool.Acquire(ctx)
    if err != nil {
        return ComponentHealth{
            Name:    "database",
            Status:  StatusUnhealthy,
            Message: fmt.Sprintf("Failed to acquire connection: %v", err),
        }
    }
    defer d.pool.Release(conn)
    
    // Test query
    if err := conn.DB.PingContext(ctx); err != nil {
        return ComponentHealth{
            Name:    "database",
            Status:  StatusUnhealthy,
            Message: fmt.Sprintf("Ping failed: %v", err),
        }
    }
    
    latency := time.Since(start)
    
    // Check latency thresholds
    status := StatusHealthy
    message := "Database responding normally"
    
    if latency > 1*time.Second {
        status = StatusDegraded
        message = fmt.Sprintf("High latency: %v", latency)
    }
    
    return ComponentHealth{
        Name:    "database",
        Status:  status,
        Message: message,
        Details: map[string]string{
            "pool_active": fmt.Sprintf("%d", d.pool.Stats().ActiveConnections),
            "pool_idle":   fmt.Sprintf("%d", d.pool.Stats().IdleConnections),
        },
    }
}

// CacheHealthChecker checks cache health
type CacheHealthChecker struct {
    cache *QueryCache
}

func (c *CacheHealthChecker) Name() string { return "cache" }
func (c *CacheHealthChecker) Weight() int { return 3 }
func (c *CacheHealthChecker) Critical() bool { return false } // Cache failure is not critical

func (c *CacheHealthChecker) Check(ctx context.Context) ComponentHealth {
    stats := c.cache.Stats()
    
    hitRate := float64(stats.Hits) / float64(stats.Hits+stats.Misses) * 100
    
    status := StatusHealthy
    message := fmt.Sprintf("Cache hit rate: %.1f%%", hitRate)
    
    if hitRate < 50 && stats.Hits+stats.Misses > 100 {
        status = StatusDegraded
        message = fmt.Sprintf("Low cache hit rate: %.1f%%", hitRate)
    }
    
    return ComponentHealth{
        Name:    "cache",
        Status:  status,
        Message: message,
        Details: map[string]string{
            "hits":     fmt.Sprintf("%d", stats.Hits),
            "misses":   fmt.Sprintf("%d", stats.Misses),
            "size":     fmt.Sprintf("%d", stats.Size),
            "hit_rate": fmt.Sprintf("%.2f", hitRate),
        },
    }
}
```

#### Integration with Grafana Health Check

```go
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    health := d.healthSystem.Check(ctx)
    
    var status backend.HealthStatus
    switch health.Status {
    case StatusHealthy:
        status = backend.HealthStatusOk
    case StatusDegraded:
        status = backend.HealthStatusOk // Still operational
    default:
        status = backend.HealthStatusError
    }
    
    // Include detailed health info in response
    details, _ := json.Marshal(health)
    
    return &backend.CheckHealthResult{
        Status:  status,
        Message: health.Message,
        JSONDetails: details,
    }, nil
}
```

---


## Question 12: Debug Memory Leak in Plugin

**Difficulty**: Advanced  
**Category**: Troubleshooting

### Question

A Grafana data source plugin you maintain is experiencing memory growth over time. The plugin's memory usage starts at 100MB and grows to 2GB+ over 24 hours, eventually causing OOM kills.

Describe your approach to identifying and fixing the memory leak. What tools would you use? What are common causes of memory leaks in Go plugins?

### Answer

#### Memory Leak Investigation Process

**Step 1: Enable Memory Profiling**

```go
import (
    "net/http"
    _ "net/http/pprof"
    "runtime"
)

func init() {
    // Enable pprof endpoint (development/debugging only)
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    // Enable more detailed memory stats
    runtime.MemProfileRate = 1
}
```

**Step 2: Capture Memory Profiles**

```bash
# Capture heap profile
curl -o heap1.prof http://localhost:6060/debug/pprof/heap

# Wait some time for memory to grow
sleep 3600

# Capture another profile
curl -o heap2.prof http://localhost:6060/debug/pprof/heap

# Compare profiles
go tool pprof -base heap1.prof heap2.prof

# Interactive analysis
go tool pprof -http=:8080 heap2.prof
```

**Step 3: Analyze Goroutine Leaks**

```bash
# Check goroutine count over time
curl http://localhost:6060/debug/pprof/goroutine?debug=1 | head -5

# Full goroutine dump
curl http://localhost:6060/debug/pprof/goroutine?debug=2 > goroutines.txt
```

#### Common Memory Leak Patterns in Go Plugins

**1. Goroutine Leaks (Most Common)**

```go
// ❌ BAD: Goroutine leak - channel never closed
func (d *Datasource) StartStreaming(ctx context.Context) {
    go func() {
        for {
            select {
            case data := <-d.dataChan:
                // Process data
                process(data)
            // Missing: case <-ctx.Done(): return
            }
        }
    }()
}

// ✅ GOOD: Proper goroutine lifecycle management
func (d *Datasource) StartStreaming(ctx context.Context) {
    go func() {
        defer backend.Logger.Info("Streaming goroutine exited")
        for {
            select {
            case <-ctx.Done():
                return // Exit when context cancelled
            case data := <-d.dataChan:
                process(data)
            }
        }
    }()
}
```

**2. Unclosed Resources**

```go
// ❌ BAD: Connection leak
func (d *Datasource) Query(ctx context.Context, query string) ([]byte, error) {
    conn, err := d.pool.Acquire(ctx)
    if err != nil {
        return nil, err
    }
    // Missing: defer d.pool.Release(conn)
    
    result, err := conn.Execute(ctx, query)
    if err != nil {
        return nil, err // Connection leaked on error!
    }
    
    d.pool.Release(conn)
    return result, nil
}

// ✅ GOOD: Always release with defer
func (d *Datasource) Query(ctx context.Context, query string) ([]byte, error) {
    conn, err := d.pool.Acquire(ctx)
    if err != nil {
        return nil, err
    }
    defer d.pool.Release(conn) // Always released
    
    return conn.Execute(ctx, query)
}
```

**3. Unbounded Caches/Maps**

```go
// ❌ BAD: Unbounded cache growth
type Datasource struct {
    cache map[string]*QueryResult // Grows forever!
}

func (d *Datasource) Query(key string) *QueryResult {
    if result, ok := d.cache[key]; ok {
        return result
    }
    result := d.executeQuery(key)
    d.cache[key] = result // Never evicted!
    return result
}

// ✅ GOOD: Bounded cache with eviction
type Datasource struct {
    cache *lru.Cache // Fixed size LRU cache
}

func NewDatasource() *Datasource {
    cache, _ := lru.New(1000) // Max 1000 entries
    return &Datasource{cache: cache}
}
```

**4. Slice Append Without Preallocation**

```go
// ❌ BAD: Repeated allocations
func processLargeDataset(data []Record) []Result {
    var results []Result // Starts at 0 capacity
    for _, record := range data {
        results = append(results, transform(record)) // Many reallocations
    }
    return results
}

// ✅ GOOD: Preallocate when size is known
func processLargeDataset(data []Record) []Result {
    results := make([]Result, 0, len(data)) // Preallocate
    for _, record := range data {
        results = append(results, transform(record))
    }
    return results
}
```

**5. Closure Capturing**

```go
// ❌ BAD: Closure captures large object
func (d *Datasource) ProcessQueries(queries []Query) {
    for _, query := range queries {
        go func() {
            // query variable captured - may hold reference longer than needed
            result := d.execute(query)
            d.sendResult(result)
        }()
    }
}

// ✅ GOOD: Pass as parameter
func (d *Datasource) ProcessQueries(queries []Query) {
    for _, query := range queries {
        go func(q Query) {
            result := d.execute(q)
            d.sendResult(result)
        }(query) // Copy passed to goroutine
    }
}
```

#### Memory Leak Detection Code

```go
package debug

import (
    "runtime"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

// MemoryMonitor tracks memory usage over time
type MemoryMonitor struct {
    interval    time.Duration
    threshold   uint64
    stopCh      chan struct{}
    alertFunc   func(stats runtime.MemStats)
}

func NewMemoryMonitor(interval time.Duration, thresholdMB uint64) *MemoryMonitor {
    return &MemoryMonitor{
        interval:  interval,
        threshold: thresholdMB * 1024 * 1024,
        stopCh:    make(chan struct{}),
    }
}

func (m *MemoryMonitor) Start() {
    go func() {
        ticker := time.NewTicker(m.interval)
        defer ticker.Stop()
        
        var lastAlloc uint64
        
        for {
            select {
            case <-m.stopCh:
                return
            case <-ticker.C:
                var stats runtime.MemStats
                runtime.ReadMemStats(&stats)
                
                // Log memory stats
                backend.Logger.Info("Memory stats",
                    "alloc_mb", stats.Alloc/1024/1024,
                    "total_alloc_mb", stats.TotalAlloc/1024/1024,
                    "sys_mb", stats.Sys/1024/1024,
                    "num_gc", stats.NumGC,
                    "goroutines", runtime.NumGoroutine(),
                )
                
                // Check for rapid growth
                if lastAlloc > 0 {
                    growth := stats.Alloc - lastAlloc
                    if growth > 100*1024*1024 { // 100MB growth
                        backend.Logger.Warn("Rapid memory growth detected",
                            "growth_mb", growth/1024/1024,
                        )
                    }
                }
                lastAlloc = stats.Alloc
                
                // Alert if threshold exceeded
                if stats.Alloc > m.threshold && m.alertFunc != nil {
                    m.alertFunc(stats)
                }
            }
        }
    }()
}

func (m *MemoryMonitor) Stop() {
    close(m.stopCh)
}

// ForceGC triggers garbage collection and returns freed memory
func ForceGC() uint64 {
    var before, after runtime.MemStats
    runtime.ReadMemStats(&before)
    runtime.GC()
    runtime.ReadMemStats(&after)
    
    freed := before.Alloc - after.Alloc
    backend.Logger.Info("GC completed", "freed_mb", freed/1024/1024)
    
    return freed
}
```

#### Investigation Checklist

- [ ] Check goroutine count trend over time
- [ ] Profile heap allocations with pprof
- [ ] Review all `go func()` calls for proper exit conditions
- [ ] Verify all resources (connections, files) are closed
- [ ] Check for unbounded maps/slices
- [ ] Review closure variable captures
- [ ] Check for circular references preventing GC

---


## Question 13: Design Prometheus Query Optimizer

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a query optimization layer for a Grafana data source plugin that queries Prometheus. The optimizer should:

1. Detect and optimize inefficient PromQL patterns
2. Implement query result caching with intelligent invalidation
3. Support query splitting for large time ranges
4. Provide query cost estimation
5. Handle rate limiting gracefully

Explain your design decisions and trade-offs.

### Answer

#### Query Optimizer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROMETHEUS QUERY OPTIMIZER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Query Analyzer                                        │    │
│  │  • Parse PromQL    • Detect patterns    • Estimate cost                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│                    ┌─────────────────┼─────────────────┐                        │
│                    ▼                 ▼                 ▼                        │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Query Rewriter     │  │  Time Splitter  │  │  Cache Manager  │             │
│  │  • Optimize funcs   │  │  • Chunk ranges │  │  • Smart TTL    │             │
│  │  • Add hints        │  │  • Parallel exec│  │  • Invalidation │             │
│  └─────────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Rate Limiter & Circuit Breaker                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Implementation

```go
package optimizer

import (
    "context"
    "fmt"
    "regexp"
    "strings"
    "sync"
    "time"

    "github.com/prometheus/prometheus/promql/parser"
    "golang.org/x/sync/errgroup"
    "golang.org/x/time/rate"
)

// QueryOptimizer optimizes Prometheus queries
type QueryOptimizer struct {
    cache        *QueryCache
    rateLimiter  *rate.Limiter
    maxTimeRange time.Duration
    chunkSize    time.Duration
    client       PrometheusClient
}

// OptimizationResult contains the optimized query and metadata
type OptimizationResult struct {
    OriginalQuery  string
    OptimizedQuery string
    Optimizations  []string
    EstimatedCost  QueryCost
    ShouldSplit    bool
    Chunks         []TimeChunk
}

type QueryCost struct {
    EstimatedSamples int64
    EstimatedBytes   int64
    Complexity       string // "low", "medium", "high"
}

type TimeChunk struct {
    Start time.Time
    End   time.Time
}

// NewQueryOptimizer creates a new optimizer
func NewQueryOptimizer(client PrometheusClient, cacheSize int) *QueryOptimizer {
    return &QueryOptimizer{
        cache:        NewQueryCache(cacheSize, 5*time.Minute),
        rateLimiter:  rate.NewLimiter(rate.Limit(100), 10), // 100 queries/sec
        maxTimeRange: 24 * time.Hour,
        chunkSize:    1 * time.Hour,
        client:       client,
    }
}

// Optimize analyzes and optimizes a PromQL query
func (o *QueryOptimizer) Optimize(query string, start, end time.Time) (*OptimizationResult, error) {
    result := &OptimizationResult{
        OriginalQuery:  query,
        OptimizedQuery: query,
        Optimizations:  make([]string, 0),
    }
    
    // Parse the query
    expr, err := parser.ParseExpr(query)
    if err != nil {
        return nil, fmt.Errorf("invalid PromQL: %w", err)
    }
    
    // Analyze and optimize
    result.OptimizedQuery = o.rewriteQuery(expr, &result.Optimizations)
    result.EstimatedCost = o.estimateCost(expr, start, end)
    
    // Determine if query should be split
    timeRange := end.Sub(start)
    if timeRange > o.maxTimeRange {
        result.ShouldSplit = true
        result.Chunks = o.splitTimeRange(start, end)
        result.Optimizations = append(result.Optimizations, 
            fmt.Sprintf("Split into %d chunks", len(result.Chunks)))
    }
    
    return result, nil
}

// rewriteQuery applies optimization rules
func (o *QueryOptimizer) rewriteQuery(expr parser.Expr, optimizations *[]string) string {
    query := expr.String()
    
    // Optimization 1: Replace rate() with irate() for short ranges
    // irate() is more efficient for instant vectors
    if strings.Contains(query, "rate(") {
        // Only for dashboard queries with short intervals
        *optimizations = append(*optimizations, "Consider irate() for short time ranges")
    }
    
    // Optimization 2: Add __name__ matcher for better index usage
    if !strings.Contains(query, "__name__") && !strings.Contains(query, "{") {
        *optimizations = append(*optimizations, "Add explicit metric name matcher for better performance")
    }
    
    // Optimization 3: Detect high-cardinality patterns
    highCardinalityPatterns := []string{
        `{job=~".+"}`,           // Regex matching all jobs
        `{instance=~".+"}`,      // Regex matching all instances
        `{__name__=~".+"}`,      // Regex matching all metrics
    }
    
    for _, pattern := range highCardinalityPatterns {
        if strings.Contains(query, pattern) {
            *optimizations = append(*optimizations, 
                fmt.Sprintf("Warning: High cardinality pattern detected: %s", pattern))
        }
    }
    
    // Optimization 4: Suggest recording rules for complex queries
    if o.isComplexQuery(expr) {
        *optimizations = append(*optimizations, 
            "Consider creating a recording rule for this complex query")
    }
    
    // Optimization 5: Optimize sum by() ordering
    query = o.optimizeSumBy(query, optimizations)
    
    return query
}

func (o *QueryOptimizer) isComplexQuery(expr parser.Expr) bool {
    // Count nested aggregations
    nestingLevel := 0
    parser.Inspect(expr, func(node parser.Node, path []parser.Node) error {
        if _, ok := node.(*parser.AggregateExpr); ok {
            nestingLevel++
        }
        return nil
    })
    return nestingLevel > 2
}

func (o *QueryOptimizer) optimizeSumBy(query string, optimizations *[]string) string {
    // Optimize: sum by (a, b, c) -> sum by (c, b, a) if c has lower cardinality
    // This is a simplified example - real implementation would analyze label cardinality
    
    sumByPattern := regexp.MustCompile(`sum\s+by\s*\(([^)]+)\)`)
    matches := sumByPattern.FindStringSubmatch(query)
    
    if len(matches) > 1 {
        labels := strings.Split(matches[1], ",")
        if len(labels) > 1 {
            *optimizations = append(*optimizations, 
                "Consider ordering sum by() labels from lowest to highest cardinality")
        }
    }
    
    return query
}

// estimateCost estimates query cost
func (o *QueryOptimizer) estimateCost(expr parser.Expr, start, end time.Time) QueryCost {
    timeRange := end.Sub(start)
    
    // Count metric selectors
    selectorCount := 0
    parser.Inspect(expr, func(node parser.Node, path []parser.Node) error {
        if _, ok := node.(*parser.VectorSelector); ok {
            selectorCount++
        }
        return nil
    })
    
    // Estimate samples based on time range and typical scrape interval
    scrapeInterval := 15 * time.Second
    samplesPerSeries := int64(timeRange / scrapeInterval)
    
    // Rough estimate: assume 100 series per selector (varies widely)
    estimatedSeries := int64(selectorCount * 100)
    estimatedSamples := estimatedSeries * samplesPerSeries
    
    // Estimate bytes (8 bytes per sample + overhead)
    estimatedBytes := estimatedSamples * 16
    
    complexity := "low"
    if estimatedSamples > 1000000 {
        complexity = "high"
    } else if estimatedSamples > 100000 {
        complexity = "medium"
    }
    
    return QueryCost{
        EstimatedSamples: estimatedSamples,
        EstimatedBytes:   estimatedBytes,
        Complexity:       complexity,
    }
}

// splitTimeRange splits a large time range into chunks
func (o *QueryOptimizer) splitTimeRange(start, end time.Time) []TimeChunk {
    var chunks []TimeChunk
    
    current := start
    for current.Before(end) {
        chunkEnd := current.Add(o.chunkSize)
        if chunkEnd.After(end) {
            chunkEnd = end
        }
        
        chunks = append(chunks, TimeChunk{
            Start: current,
            End:   chunkEnd,
        })
        
        current = chunkEnd
    }
    
    return chunks
}

// ExecuteOptimized executes an optimized query
func (o *QueryOptimizer) ExecuteOptimized(ctx context.Context, query string, start, end time.Time) ([]byte, error) {
    // Check rate limit
    if !o.rateLimiter.Allow() {
        return nil, fmt.Errorf("rate limit exceeded")
    }
    
    // Optimize query
    result, err := o.Optimize(query, start, end)
    if err != nil {
        return nil, err
    }
    
    // Check cache
    cacheKey := fmt.Sprintf("%s:%d:%d", result.OptimizedQuery, start.Unix(), end.Unix())
    if cached, found := o.cache.Get(cacheKey); found {
        return cached, nil
    }
    
    var data []byte
    
    if result.ShouldSplit {
        // Execute chunks in parallel
        data, err = o.executeChunked(ctx, result.OptimizedQuery, result.Chunks)
    } else {
        // Execute single query
        data, err = o.client.Query(ctx, result.OptimizedQuery, start, end)
    }
    
    if err != nil {
        return nil, err
    }
    
    // Cache result with TTL based on time range
    ttl := o.calculateCacheTTL(start, end)
    o.cache.SetWithTTL(cacheKey, data, ttl)
    
    return data, nil
}

func (o *QueryOptimizer) executeChunked(ctx context.Context, query string, chunks []TimeChunk) ([]byte, error) {
    results := make([][]byte, len(chunks))
    
    g, ctx := errgroup.WithContext(ctx)
    
    // Limit concurrent chunk queries
    sem := make(chan struct{}, 5)
    
    for i, chunk := range chunks {
        i, chunk := i, chunk
        g.Go(func() error {
            sem <- struct{}{}
            defer func() { <-sem }()
            
            data, err := o.client.Query(ctx, query, chunk.Start, chunk.End)
            if err != nil {
                return err
            }
            results[i] = data
            return nil
        })
    }
    
    if err := g.Wait(); err != nil {
        return nil, err
    }
    
    // Merge results
    return o.mergeResults(results), nil
}

func (o *QueryOptimizer) mergeResults(results [][]byte) []byte {
    // Implementation depends on result format
    // For time series, concatenate and sort by timestamp
    return nil // Simplified
}

func (o *QueryOptimizer) calculateCacheTTL(start, end time.Time) time.Duration {
    // Recent data: short TTL (data may still be arriving)
    // Historical data: longer TTL (data is stable)
    
    age := time.Since(end)
    
    if age < 5*time.Minute {
        return 30 * time.Second // Very recent
    } else if age < 1*time.Hour {
        return 2 * time.Minute // Recent
    } else if age < 24*time.Hour {
        return 10 * time.Minute // Today
    }
    
    return 1 * time.Hour // Historical
}

// PrometheusClient interface
type PrometheusClient interface {
    Query(ctx context.Context, query string, start, end time.Time) ([]byte, error)
}
```

#### Optimization Rules Summary

| Pattern | Issue | Optimization |
|---------|-------|--------------|
| `rate()` on short ranges | Unnecessary computation | Suggest `irate()` |
| `{job=~".+"}` | High cardinality | Warn user |
| Nested aggregations | Complex query | Suggest recording rule |
| Large time ranges | Memory/timeout | Split into chunks |
| Repeated queries | Redundant load | Cache results |

---


## Question 14: Implement Retry Logic with Backoff

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a robust retry mechanism in Go for a Grafana data source plugin that:

1. Supports exponential backoff with jitter
2. Allows configurable retry policies per operation type
3. Handles different error types appropriately (retryable vs non-retryable)
4. Provides observability through metrics and logging
5. Supports context cancellation

Write production-quality Go code.

### Answer

```go
package retry

import (
    "context"
    "errors"
    "fmt"
    "math"
    "math/rand"
    "net"
    "strings"
    "sync/atomic"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/prometheus/client_golang/prometheus"
)

// Errors
var (
    ErrMaxRetriesExceeded = errors.New("maximum retries exceeded")
    ErrNonRetryable       = errors.New("non-retryable error")
)

// RetryableError wraps an error that should be retried
type RetryableError struct {
    Err error
}

func (e *RetryableError) Error() string {
    return e.Err.Error()
}

func (e *RetryableError) Unwrap() error {
    return e.Err
}

// Policy defines retry behavior
type Policy struct {
    MaxRetries      int
    InitialInterval time.Duration
    MaxInterval     time.Duration
    Multiplier      float64
    JitterFactor    float64 // 0-1, percentage of interval to randomize
}

// DefaultPolicy returns a sensible default retry policy
func DefaultPolicy() Policy {
    return Policy{
        MaxRetries:      3,
        InitialInterval: 100 * time.Millisecond,
        MaxInterval:     10 * time.Second,
        Multiplier:      2.0,
        JitterFactor:    0.2,
    }
}

// AggressivePolicy for critical operations
func AggressivePolicy() Policy {
    return Policy{
        MaxRetries:      5,
        InitialInterval: 50 * time.Millisecond,
        MaxInterval:     30 * time.Second,
        Multiplier:      2.0,
        JitterFactor:    0.3,
    }
}

// ConservativePolicy for non-critical operations
func ConservativePolicy() Policy {
    return Policy{
        MaxRetries:      2,
        InitialInterval: 500 * time.Millisecond,
        MaxInterval:     5 * time.Second,
        Multiplier:      1.5,
        JitterFactor:    0.1,
    }
}

// Retryer handles retry logic with observability
type Retryer struct {
    policy  Policy
    metrics *retryMetrics
    
    // Statistics
    totalAttempts   int64
    totalSuccesses  int64
    totalFailures   int64
}

type retryMetrics struct {
    attempts *prometheus.CounterVec
    duration *prometheus.HistogramVec
    errors   *prometheus.CounterVec
}

func newRetryMetrics(name string) *retryMetrics {
    return &retryMetrics{
        attempts: prometheus.NewCounterVec(
            prometheus.CounterOpts{
                Name: fmt.Sprintf("%s_retry_attempts_total", name),
                Help: "Total number of retry attempts",
            },
            []string{"operation", "result"},
        ),
        duration: prometheus.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    fmt.Sprintf("%s_retry_duration_seconds", name),
                Help:    "Duration of operations including retries",
                Buckets: []float64{0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30},
            },
            []string{"operation"},
        ),
        errors: prometheus.NewCounterVec(
            prometheus.CounterOpts{
                Name: fmt.Sprintf("%s_retry_errors_total", name),
                Help: "Total number of errors by type",
            },
            []string{"operation", "error_type"},
        ),
    }
}

// NewRetryer creates a new retryer with the given policy
func NewRetryer(policy Policy, metricsName string) *Retryer {
    return &Retryer{
        policy:  policy,
        metrics: newRetryMetrics(metricsName),
    }
}

// Operation is a function that can be retried
type Operation func(ctx context.Context) error

// OperationWithResult is a function that returns a result
type OperationWithResult[T any] func(ctx context.Context) (T, error)

// Do executes an operation with retry logic
func (r *Retryer) Do(ctx context.Context, operationName string, op Operation) error {
    start := time.Now()
    defer func() {
        r.metrics.duration.WithLabelValues(operationName).Observe(time.Since(start).Seconds())
    }()
    
    var lastErr error
    
    for attempt := 0; attempt <= r.policy.MaxRetries; attempt++ {
        atomic.AddInt64(&r.totalAttempts, 1)
        
        // Check context before attempting
        if ctx.Err() != nil {
            return ctx.Err()
        }
        
        // Execute operation
        err := op(ctx)
        
        if err == nil {
            atomic.AddInt64(&r.totalSuccesses, 1)
            r.metrics.attempts.WithLabelValues(operationName, "success").Inc()
            
            if attempt > 0 {
                backend.Logger.Info("Operation succeeded after retry",
                    "operation", operationName,
                    "attempts", attempt+1,
                )
            }
            return nil
        }
        
        lastErr = err
        
        // Check if error is retryable
        if !r.isRetryable(err) {
            atomic.AddInt64(&r.totalFailures, 1)
            r.metrics.attempts.WithLabelValues(operationName, "non_retryable").Inc()
            r.metrics.errors.WithLabelValues(operationName, classifyError(err)).Inc()
            
            backend.Logger.Warn("Non-retryable error",
                "operation", operationName,
                "error", err,
            )
            return fmt.Errorf("%w: %v", ErrNonRetryable, err)
        }
        
        // Don't sleep after last attempt
        if attempt == r.policy.MaxRetries {
            break
        }
        
        // Calculate backoff with jitter
        backoff := r.calculateBackoff(attempt)
        
        backend.Logger.Debug("Retrying operation",
            "operation", operationName,
            "attempt", attempt+1,
            "max_attempts", r.policy.MaxRetries+1,
            "backoff", backoff,
            "error", err,
        )
        
        r.metrics.attempts.WithLabelValues(operationName, "retry").Inc()
        
        // Wait with context awareness
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(backoff):
            // Continue to next attempt
        }
    }
    
    atomic.AddInt64(&r.totalFailures, 1)
    r.metrics.attempts.WithLabelValues(operationName, "exhausted").Inc()
    r.metrics.errors.WithLabelValues(operationName, classifyError(lastErr)).Inc()
    
    backend.Logger.Error("Max retries exceeded",
        "operation", operationName,
        "attempts", r.policy.MaxRetries+1,
        "last_error", lastErr,
    )
    
    return fmt.Errorf("%w after %d attempts: %v", ErrMaxRetriesExceeded, r.policy.MaxRetries+1, lastErr)
}

// DoWithResult executes an operation that returns a result
func DoWithResult[T any](r *Retryer, ctx context.Context, operationName string, op OperationWithResult[T]) (T, error) {
    var result T
    
    err := r.Do(ctx, operationName, func(ctx context.Context) error {
        var opErr error
        result, opErr = op(ctx)
        return opErr
    })
    
    return result, err
}

// calculateBackoff calculates the backoff duration for an attempt
func (r *Retryer) calculateBackoff(attempt int) time.Duration {
    // Exponential backoff
    backoff := float64(r.policy.InitialInterval) * math.Pow(r.policy.Multiplier, float64(attempt))
    
    // Cap at max interval
    if backoff > float64(r.policy.MaxInterval) {
        backoff = float64(r.policy.MaxInterval)
    }
    
    // Add jitter
    if r.policy.JitterFactor > 0 {
        jitter := backoff * r.policy.JitterFactor
        backoff = backoff - jitter + (rand.Float64() * 2 * jitter)
    }
    
    return time.Duration(backoff)
}

// isRetryable determines if an error should be retried
func (r *Retryer) isRetryable(err error) bool {
    if err == nil {
        return false
    }
    
    // Check for explicitly retryable errors
    var retryableErr *RetryableError
    if errors.As(err, &retryableErr) {
        return true
    }
    
    // Check for context errors (not retryable)
    if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
        return false
    }
    
    // Check for network errors (usually retryable)
    var netErr net.Error
    if errors.As(err, &netErr) {
        return netErr.Temporary() || netErr.Timeout()
    }
    
    // Check error message for common retryable patterns
    errMsg := strings.ToLower(err.Error())
    retryablePatterns := []string{
        "connection refused",
        "connection reset",
        "timeout",
        "temporary failure",
        "service unavailable",
        "too many requests",
        "rate limit",
        "503",
        "502",
        "504",
    }
    
    for _, pattern := range retryablePatterns {
        if strings.Contains(errMsg, pattern) {
            return true
        }
    }
    
    // Non-retryable patterns
    nonRetryablePatterns := []string{
        "authentication",
        "unauthorized",
        "forbidden",
        "not found",
        "bad request",
        "invalid",
        "401",
        "403",
        "404",
        "400",
    }
    
    for _, pattern := range nonRetryablePatterns {
        if strings.Contains(errMsg, pattern) {
            return false
        }
    }
    
    // Default: retry unknown errors
    return true
}

// classifyError returns a category for the error
func classifyError(err error) string {
    if err == nil {
        return "none"
    }
    
    errMsg := strings.ToLower(err.Error())
    
    switch {
    case strings.Contains(errMsg, "timeout"):
        return "timeout"
    case strings.Contains(errMsg, "connection"):
        return "connection"
    case strings.Contains(errMsg, "auth"):
        return "authentication"
    case strings.Contains(errMsg, "rate"):
        return "rate_limit"
    default:
        return "unknown"
    }
}

// Stats returns retry statistics
func (r *Retryer) Stats() (attempts, successes, failures int64) {
    return atomic.LoadInt64(&r.totalAttempts),
        atomic.LoadInt64(&r.totalSuccesses),
        atomic.LoadInt64(&r.totalFailures)
}

// Example usage
func ExampleUsage() {
    retryer := NewRetryer(DefaultPolicy(), "datasource")
    
    ctx := context.Background()
    
    // Simple operation
    err := retryer.Do(ctx, "query", func(ctx context.Context) error {
        // Perform operation
        return nil
    })
    if err != nil {
        // Handle error
    }
    
    // Operation with result
    result, err := DoWithResult(retryer, ctx, "fetch_data", func(ctx context.Context) ([]byte, error) {
        // Fetch data
        return []byte("data"), nil
    })
    if err != nil {
        // Handle error
    }
    _ = result
}
```

#### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Exponential backoff** | Prevents thundering herd, gives backend time to recover |
| **Jitter** | Distributes retry attempts, prevents synchronized retries |
| **Error classification** | Different errors need different handling |
| **Context awareness** | Respects cancellation, prevents zombie operations |
| **Metrics integration** | Enables alerting on retry patterns |

---


## Question 15: Plugin Marketplace Release Strategy

**Difficulty**: Advanced  
**Category**: Scenario-Based

### Question

You're preparing to release a major version (v2.0) of a popular Grafana data source plugin to the Grafana marketplace. The new version includes breaking changes to the query format and configuration schema.

Describe your release strategy including:

1. How to handle backward compatibility
2. Migration path for existing users
3. Communication and documentation plan
4. Rollback strategy if issues arise
5. Monitoring and success metrics

### Answer

#### Release Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    V2.0 RELEASE TIMELINE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Week -4        Week -2        Week 0         Week +1        Week +4            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│  │  Beta   │   │  RC     │   │  GA     │   │ Monitor │   │ Deprecate│           │
│  │ Release │──▶│ Release │──▶│ Release │──▶│ & Fix   │──▶│ v1.x    │           │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘           │
│       │             │             │             │             │                  │
│       ▼             ▼             ▼             ▼             ▼                  │
│  • Early        • Migration   • Announce    • Track       • Security           │
│    adopters       testing       widely        adoption      fixes only         │
│  • Feedback     • Docs final  • Support     • Fix issues  • EOL notice         │
│                                  ready                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 1. Backward Compatibility Strategy

```go
// Version detection and compatibility layer
package plugin

import (
    "encoding/json"
    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

// QueryModel supports both v1 and v2 formats
type QueryModel struct {
    // Version field for explicit versioning
    Version int `json:"version,omitempty"`
    
    // V1 fields (deprecated but supported)
    LegacyQuery string `json:"query,omitempty"`      // v1
    LegacyFormat string `json:"format,omitempty"`    // v1
    
    // V2 fields
    Expression  string            `json:"expression,omitempty"`  // v2
    OutputFormat string           `json:"outputFormat,omitempty"` // v2
    Options     map[string]any    `json:"options,omitempty"`      // v2
}

// ParseQuery handles both v1 and v2 query formats
func ParseQuery(raw json.RawMessage) (*QueryModel, error) {
    var qm QueryModel
    if err := json.Unmarshal(raw, &qm); err != nil {
        return nil, err
    }
    
    // Auto-detect version if not specified
    if qm.Version == 0 {
        if qm.Expression != "" {
            qm.Version = 2
        } else if qm.LegacyQuery != "" {
            qm.Version = 1
        }
    }
    
    // Migrate v1 to v2 format internally
    if qm.Version == 1 {
        qm = migrateV1ToV2(qm)
        backend.Logger.Warn("Using deprecated v1 query format - please migrate to v2",
            "query", qm.LegacyQuery,
        )
    }
    
    return &qm, nil
}

func migrateV1ToV2(v1 QueryModel) QueryModel {
    return QueryModel{
        Version:      2,
        Expression:   v1.LegacyQuery,
        OutputFormat: mapLegacyFormat(v1.LegacyFormat),
        Options:      make(map[string]any),
    }
}

func mapLegacyFormat(legacy string) string {
    switch legacy {
    case "time_series":
        return "timeseries"
    case "table":
        return "table"
    default:
        return "auto"
    }
}

// Config migration
type ConfigMigrator struct{}

func (m *ConfigMigrator) MigrateConfig(settings backend.DataSourceInstanceSettings) (backend.DataSourceInstanceSettings, error) {
    var config map[string]any
    if err := json.Unmarshal(settings.JSONData, &config); err != nil {
        return settings, err
    }
    
    // Check config version
    version, _ := config["configVersion"].(float64)
    
    if version < 2 {
        // Migrate v1 config to v2
        config = m.migrateConfigV1ToV2(config)
        
        newJSON, err := json.Marshal(config)
        if err != nil {
            return settings, err
        }
        settings.JSONData = newJSON
        
        backend.Logger.Info("Migrated config from v1 to v2")
    }
    
    return settings, nil
}

func (m *ConfigMigrator) migrateConfigV1ToV2(v1 map[string]any) map[string]any {
    v2 := make(map[string]any)
    v2["configVersion"] = 2
    
    // Map old field names to new
    if url, ok := v1["url"]; ok {
        v2["endpoint"] = url
    }
    if timeout, ok := v1["timeout"]; ok {
        v2["queryTimeout"] = timeout
    }
    
    // Preserve unknown fields
    for k, v := range v1 {
        if _, exists := v2[k]; !exists {
            v2[k] = v
        }
    }
    
    return v2
}
```

#### 2. Migration Documentation

```markdown
# Migration Guide: v1.x to v2.0

## Breaking Changes

### Query Format Changes

| v1.x Field | v2.0 Field | Notes |
|------------|------------|-------|
| `query` | `expression` | Renamed for clarity |
| `format` | `outputFormat` | Values changed (see below) |

### Format Value Changes

| v1.x Value | v2.0 Value |
|------------|------------|
| `time_series` | `timeseries` |
| `table` | `table` |

### Configuration Changes

| v1.x Field | v2.0 Field | Notes |
|------------|------------|-------|
| `url` | `endpoint` | Renamed |
| `timeout` | `queryTimeout` | Renamed, now in seconds |

## Automatic Migration

The plugin automatically migrates v1 queries and configurations when detected.
You will see deprecation warnings in the Grafana logs.

## Manual Migration Steps

1. **Update saved queries** in dashboards:
   ```json
   // Before (v1)
   {"query": "SELECT * FROM metrics", "format": "time_series"}
   
   // After (v2)
   {"expression": "SELECT * FROM metrics", "outputFormat": "timeseries"}
   ```

2. **Update data source configuration**:
   - Go to Configuration > Data Sources
   - Select your data source
   - The plugin will auto-migrate on save

3. **Update provisioning files** if using provisioning:
   ```yaml
   # Before (v1)
   jsonData:
     url: "http://backend:8080"
     timeout: 30
   
   # After (v2)
   jsonData:
     configVersion: 2
     endpoint: "http://backend:8080"
     queryTimeout: 30
   ```

## Timeline

- **v2.0 GA**: [Date] - v1 format supported with warnings
- **v2.1**: [Date + 3 months] - v1 format deprecated
- **v3.0**: [Date + 12 months] - v1 format removed
```

#### 3. Communication Plan

```markdown
## Communication Timeline

### Week -4: Beta Announcement
- Blog post: "Introducing v2.0 Beta - What's New"
- GitHub release notes with migration guide link
- Community forum announcement
- Email to plugin subscribers

### Week -2: RC Announcement
- Blog post: "v2.0 Release Candidate - Last Call for Feedback"
- Updated documentation
- Migration tool release

### Week 0: GA Release
- Blog post: "v2.0 Now Available"
- Social media announcements
- Grafana newsletter inclusion
- Direct outreach to large users

### Week +2: Follow-up
- Blog post: "v2.0 Adoption Update and FAQ"
- Address common migration issues
```

#### 4. Rollback Strategy

```yaml
# Rollback runbook
name: Plugin v2.0 Rollback Procedure

triggers:
  - Error rate > 5% for 15 minutes
  - P1 bug affecting > 10% of users
  - Data integrity issues

steps:
  1. Assess Impact:
     - Check error dashboards
     - Review support tickets
     - Identify affected users
  
  2. Communication:
     - Post status update
     - Notify support team
     - Alert stakeholders
  
  3. Rollback Options:
     a. Grafana Marketplace:
        - Unpublish v2.0
        - v1.x remains available
        - Users can downgrade manually
     
     b. Self-hosted:
        - Provide v1.x download link
        - Document downgrade steps
  
  4. Post-Rollback:
     - Root cause analysis
     - Fix and re-test
     - Plan re-release

rollback_commands:
  # For Kubernetes deployments
  helm rollback grafana-plugin 1
  
  # For manual installations
  grafana-cli plugins install myorg-datasource 1.9.0
```

#### 5. Success Metrics Dashboard

```yaml
# Metrics to track
adoption_metrics:
  - name: v2_adoption_rate
    query: |
      sum(plugin_version{version="2.0"}) / 
      sum(plugin_version) * 100
    target: ">50% within 30 days"
  
  - name: migration_success_rate
    query: |
      sum(config_migration_success) / 
      sum(config_migration_attempts) * 100
    target: ">99%"

quality_metrics:
  - name: error_rate
    query: |
      sum(rate(query_errors_total[5m])) / 
      sum(rate(query_total[5m])) * 100
    target: "<1%"
  
  - name: p99_latency
    query: |
      histogram_quantile(0.99, 
        sum(rate(query_duration_seconds_bucket[5m])) by (le))
    target: "<5s"

support_metrics:
  - name: migration_support_tickets
    source: zendesk
    target: "<50 tickets in first week"
  
  - name: github_issues
    source: github
    target: "<20 new issues in first week"
```

#### Release Checklist

- [ ] All breaking changes documented
- [ ] Migration guide complete
- [ ] Backward compatibility layer tested
- [ ] Rollback procedure documented
- [ ] Monitoring dashboards ready
- [ ] Support team briefed
- [ ] Communication plan executed
- [ ] Beta feedback addressed
- [ ] Security review complete
- [ ] Performance benchmarks pass

---

## Summary

These 15 questions cover the key competencies expected for the Senior Software Engineer - Grafana OSS Big Tent role:

| Category | Questions | Key Topics |
|----------|-----------|------------|
| **System Design** | 1, 3, 7, 11, 13 | Plugin architecture, streaming, BigQuery, health checks, optimization |
| **Coding** | 2, 5, 8, 14 | Caching, middleware, connection pools, retry logic |
| **Architecture** | 6, 10 | CI/CD pipelines, configuration best practices |
| **Troubleshooting** | 4, 12 | Performance debugging, memory leak investigation |
| **Scenario-Based** | 9, 15 | Incident response, release management |

### Preparation Tips

1. **Practice coding**: Write actual Go code for the coding questions
2. **Draw diagrams**: System design questions benefit from visual explanations
3. **Think aloud**: Explain your reasoning during the interview
4. **Consider trade-offs**: There's rarely one "right" answer
5. **Use real examples**: Draw from your experience when possible

### Additional Resources

- [Grafana Plugin Development Guide](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [Go Best Practices](https://go.dev/doc/effective_go)
- [Grafana Plugin SDK](https://github.com/grafana/grafana-plugin-sdk-go)

---

**Good luck with your interview!** 🚀
