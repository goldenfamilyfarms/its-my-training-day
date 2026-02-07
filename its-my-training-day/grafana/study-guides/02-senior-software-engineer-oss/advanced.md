# Advanced: Senior Software Engineer - Grafana OSS

This document covers advanced-level topics for the Senior Software Engineer role on the Grafana OSS Big Tent team. These concepts build on fundamentals and intermediate knowledge, focusing on complex architectures, performance optimization, and enterprise-grade integrations.

## Table of Contents

1. [Complex Plugin Architectures](#complex-plugin-architectures)
2. [Performance Optimization](#performance-optimization)
3. [Observability Integration Patterns](#observability-integration-patterns)
4. [Data Source Deep Dives](#data-source-deep-dives)
5. [Frontend Technologies Overview](#frontend-technologies-overview)
6. [Practical Exercises](#practical-exercises)

---

## Complex Plugin Architectures

Building production-grade Grafana plugins requires understanding advanced architectural patterns, streaming data, and multi-tenant considerations.

> **Related Reading**: For plugin development basics, see [Intermediate Guide](./intermediate.md#grafana-plugin-development)

### Streaming Data Architecture

Real-time data streaming is essential for live dashboards and alerting. Grafana supports streaming through the plugin SDK.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      STREAMING DATA ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Backend   │    │  Stream Handler │    │    Grafana      │                 │
│  │   System    │───▶│    (Plugin)     │───▶│    Frontend     │                 │
│  │             │    │                 │    │                 │                 │
│  │  WebSocket  │    │  • Subscribe    │    │  • Live panels  │                 │
│  │  gRPC       │    │  • Transform    │    │  • Real-time    │                 │
│  │  Kafka      │    │  • Buffer       │    │    updates      │                 │
│  └─────────────┘    └─────────────────┘    └─────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


#### Implementing Streaming Data Source

```go
package plugin

import (
    "context"
    "encoding/json"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
    "github.com/grafana/grafana-plugin-sdk-go/live"
)

// StreamHandler implements backend.StreamHandler for live data
type StreamHandler struct {
    datasource *Datasource
}

// SubscribeStream handles new stream subscriptions
func (s *StreamHandler) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
    // Parse the channel path to determine what data to stream
    // Path format: ds/<datasource-uid>/<channel-type>/<metric-name>
    channelPath := req.Path
    
    // Validate subscription request
    if !s.isValidChannel(channelPath) {
        return &backend.SubscribeStreamResponse{
            Status: backend.SubscribeStreamStatusNotFound,
        }, nil
    }

    // Return initial data frame schema
    return &backend.SubscribeStreamResponse{
        Status: backend.SubscribeStreamStatusOK,
        Data:   s.getInitialFrame(channelPath),
    }, nil
}

// RunStream handles the actual data streaming
func (s *StreamHandler) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
    // Parse stream configuration
    var config streamConfig
    if err := json.Unmarshal(req.Data, &config); err != nil {
        return err
    }

    // Create ticker for periodic updates
    ticker := time.NewTicker(time.Duration(config.IntervalMs) * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            // Fetch latest data from backend
            frame, err := s.fetchLatestData(ctx, config)
            if err != nil {
                // Log error but continue streaming
                backend.Logger.Error("Failed to fetch data", "error", err)
                continue
            }

            // Send frame to Grafana
            if err := sender.SendFrame(frame, data.IncludeAll); err != nil {
                return err
            }
        }
    }
}

// PublishStream handles data published to the stream (bidirectional)
func (s *StreamHandler) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
    // Handle incoming data from frontend (e.g., user interactions)
    var payload publishPayload
    if err := json.Unmarshal(req.Data, &payload); err != nil {
        return &backend.PublishStreamResponse{
            Status: backend.PublishStreamStatusPermissionDenied,
        }, nil
    }

    // Process the published data
    if err := s.processPublishedData(ctx, payload); err != nil {
        return &backend.PublishStreamResponse{
            Status: backend.PublishStreamStatusPermissionDenied,
        }, nil
    }

    return &backend.PublishStreamResponse{
        Status: backend.PublishStreamStatusOK,
    }, nil
}

type streamConfig struct {
    MetricName string `json:"metricName"`
    IntervalMs int    `json:"intervalMs"`
    BufferSize int    `json:"bufferSize"`
}

type publishPayload struct {
    Action string          `json:"action"`
    Data   json.RawMessage `json:"data"`
}

func (s *StreamHandler) fetchLatestData(ctx context.Context, config streamConfig) (*data.Frame, error) {
    // Implement actual data fetching logic
    now := time.Now()
    
    frame := data.NewFrame("stream",
        data.NewField("time", nil, []time.Time{now}),
        data.NewField("value", nil, []float64{42.0}), // Replace with actual data
    )
    
    return frame, nil
}

func (s *StreamHandler) isValidChannel(path string) bool {
    // Implement channel validation
    return true
}

func (s *StreamHandler) getInitialFrame(path string) json.RawMessage {
    frame := data.NewFrame("initial")
    bytes, _ := json.Marshal(frame)
    return bytes
}

func (s *StreamHandler) processPublishedData(ctx context.Context, payload publishPayload) error {
    // Implement publish handling
    return nil
}
```


### Multi-Tenant Plugin Architecture

Enterprise deployments require plugins that handle multiple tenants with proper isolation and resource management.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-TENANT PLUGIN ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        Instance Manager                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │    │
│  │  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │  │  Tenant N   │    │    │
│  │  │  Instance   │  │  Instance   │  │  Instance   │  │  Instance   │    │    │
│  │  │             │  │             │  │             │  │             │    │    │
│  │  │ • Config    │  │ • Config    │  │ • Config    │  │ • Config    │    │    │
│  │  │ • Pool      │  │ • Pool      │  │ • Pool      │  │ • Pool      │    │    │
│  │  │ • Cache     │  │ • Cache     │  │ • Cache     │  │ • Cache     │    │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Features:                                                                       │
│  • Per-tenant connection pools    • Isolated caches                             │
│  • Resource quotas                • Tenant-specific configuration               │
│  • Metrics per tenant             • Graceful instance disposal                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Multi-Tenant Instance Management

```go
package plugin

import (
    "context"
    "fmt"
    "sync"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

// TenantInstance represents a per-tenant datasource instance
type TenantInstance struct {
    settings    backend.DataSourceInstanceSettings
    config      *TenantConfig
    pool        *ConnectionPool
    cache       *QueryCache
    rateLimiter *RateLimiter
    metrics     *TenantMetrics
    
    mu          sync.RWMutex
    disposed    bool
}

// TenantConfig holds tenant-specific configuration
type TenantConfig struct {
    TenantID        string
    MaxConnections  int
    QueryTimeout    time.Duration
    CacheTTL        time.Duration
    RateLimit       int // queries per second
    MaxCacheSize    int
}

// NewTenantInstance creates a new tenant-specific instance
func NewTenantInstance(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
    // Parse tenant configuration from settings
    config, err := parseTenantConfig(settings)
    if err != nil {
        return nil, fmt.Errorf("failed to parse tenant config: %w", err)
    }

    // Create connection pool with tenant-specific limits
    pool, err := NewConnectionPool(ConnectionPoolConfig{
        MaxSize:     config.MaxConnections,
        MinSize:     1,
        MaxIdleTime: 5 * time.Minute,
        HealthCheck: 30 * time.Second,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create connection pool: %w", err)
    }

    // Create query cache
    cache := NewQueryCache(QueryCacheConfig{
        MaxSize: config.MaxCacheSize,
        TTL:     config.CacheTTL,
    })

    // Create rate limiter
    rateLimiter := NewRateLimiter(config.RateLimit)

    // Create metrics collector
    metrics := NewTenantMetrics(config.TenantID)

    return &TenantInstance{
        settings:    settings,
        config:      config,
        pool:        pool,
        cache:       cache,
        rateLimiter: rateLimiter,
        metrics:     metrics,
    }, nil
}

// QueryData executes a query with tenant isolation
func (t *TenantInstance) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    t.mu.RLock()
    if t.disposed {
        t.mu.RUnlock()
        return nil, fmt.Errorf("instance has been disposed")
    }
    t.mu.RUnlock()

    // Check rate limit
    if !t.rateLimiter.Allow() {
        t.metrics.RecordRateLimited()
        return nil, fmt.Errorf("rate limit exceeded for tenant %s", t.config.TenantID)
    }

    response := backend.NewQueryDataResponse()

    for _, query := range req.Queries {
        // Check cache first
        cacheKey := t.generateCacheKey(query)
        if cached, ok := t.cache.Get(cacheKey); ok {
            t.metrics.RecordCacheHit()
            response.Responses[query.RefID] = cached
            continue
        }
        t.metrics.RecordCacheMiss()

        // Execute query with timeout
        ctx, cancel := context.WithTimeout(ctx, t.config.QueryTimeout)
        result := t.executeQuery(ctx, query)
        cancel()

        // Cache successful results
        if result.Error == nil {
            t.cache.Set(cacheKey, result)
        }

        response.Responses[query.RefID] = result
        t.metrics.RecordQuery(result.Error == nil)
    }

    return response, nil
}

// Dispose cleans up tenant resources
func (t *TenantInstance) Dispose() {
    t.mu.Lock()
    defer t.mu.Unlock()

    if t.disposed {
        return
    }

    t.disposed = true

    // Close connection pool
    if t.pool != nil {
        t.pool.Close()
    }

    // Clear cache
    if t.cache != nil {
        t.cache.Clear()
    }

    // Stop rate limiter
    if t.rateLimiter != nil {
        t.rateLimiter.Stop()
    }

    // Flush metrics
    if t.metrics != nil {
        t.metrics.Flush()
    }

    backend.Logger.Info("Tenant instance disposed", "tenant", t.config.TenantID)
}

func (t *TenantInstance) executeQuery(ctx context.Context, query backend.DataQuery) backend.DataResponse {
    // Get connection from pool
    conn, err := t.pool.Get(ctx)
    if err != nil {
        return backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("connection error: %v", err))
    }
    defer t.pool.Put(conn)

    // Execute query
    // ... implementation details
    return backend.DataResponse{}
}

func (t *TenantInstance) generateCacheKey(query backend.DataQuery) string {
    return fmt.Sprintf("%s:%s:%d:%d", t.config.TenantID, query.RefID, 
        query.TimeRange.From.UnixMilli(), query.TimeRange.To.UnixMilli())
}

func parseTenantConfig(settings backend.DataSourceInstanceSettings) (*TenantConfig, error) {
    // Parse configuration from settings.JSONData
    return &TenantConfig{
        TenantID:       settings.UID,
        MaxConnections: 10,
        QueryTimeout:   30 * time.Second,
        CacheTTL:       5 * time.Minute,
        RateLimit:      100,
        MaxCacheSize:   1000,
    }, nil
}
```


### Plugin State Management

Complex plugins require sophisticated state management for handling concurrent operations, caching, and resource lifecycle.

#### Connection Pool Implementation

```go
package plugin

import (
    "context"
    "errors"
    "sync"
    "time"
)

// Connection represents a backend connection
type Connection interface {
    Execute(ctx context.Context, query string) ([]byte, error)
    Ping(ctx context.Context) error
    Close() error
}

// ConnectionPool manages a pool of reusable connections
type ConnectionPool struct {
    config      ConnectionPoolConfig
    factory     ConnectionFactory
    connections chan Connection
    mu          sync.Mutex
    size        int
    closed      bool
    healthStop  chan struct{}
}

type ConnectionPoolConfig struct {
    MaxSize     int
    MinSize     int
    MaxIdleTime time.Duration
    HealthCheck time.Duration
}

type ConnectionFactory func() (Connection, error)

// NewConnectionPool creates a new connection pool
func NewConnectionPool(config ConnectionPoolConfig) (*ConnectionPool, error) {
    pool := &ConnectionPool{
        config:      config,
        connections: make(chan Connection, config.MaxSize),
        healthStop:  make(chan struct{}),
    }

    // Pre-populate with minimum connections
    for i := 0; i < config.MinSize; i++ {
        conn, err := pool.factory()
        if err != nil {
            pool.Close()
            return nil, err
        }
        pool.connections <- conn
        pool.size++
    }

    // Start health check goroutine
    go pool.healthCheckLoop()

    return pool, nil
}

// Get retrieves a connection from the pool
func (p *ConnectionPool) Get(ctx context.Context) (Connection, error) {
    p.mu.Lock()
    if p.closed {
        p.mu.Unlock()
        return nil, errors.New("pool is closed")
    }
    p.mu.Unlock()

    select {
    case conn := <-p.connections:
        // Validate connection before returning
        if err := conn.Ping(ctx); err != nil {
            conn.Close()
            return p.createConnection()
        }
        return conn, nil
    default:
        // No available connection, try to create new one
        return p.createConnection()
    }
}

// Put returns a connection to the pool
func (p *ConnectionPool) Put(conn Connection) {
    p.mu.Lock()
    defer p.mu.Unlock()

    if p.closed {
        conn.Close()
        return
    }

    select {
    case p.connections <- conn:
        // Connection returned to pool
    default:
        // Pool is full, close the connection
        conn.Close()
        p.size--
    }
}

func (p *ConnectionPool) createConnection() (Connection, error) {
    p.mu.Lock()
    defer p.mu.Unlock()

    if p.size >= p.config.MaxSize {
        return nil, errors.New("pool exhausted")
    }

    conn, err := p.factory()
    if err != nil {
        return nil, err
    }

    p.size++
    return conn, nil
}

func (p *ConnectionPool) healthCheckLoop() {
    ticker := time.NewTicker(p.config.HealthCheck)
    defer ticker.Stop()

    for {
        select {
        case <-p.healthStop:
            return
        case <-ticker.C:
            p.performHealthCheck()
        }
    }
}

func (p *ConnectionPool) performHealthCheck() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Check each connection in the pool
    checked := 0
    for checked < len(p.connections) {
        select {
        case conn := <-p.connections:
            if err := conn.Ping(ctx); err != nil {
                conn.Close()
                p.mu.Lock()
                p.size--
                p.mu.Unlock()
            } else {
                p.connections <- conn
            }
            checked++
        default:
            return
        }
    }
}

// Close shuts down the pool and all connections
func (p *ConnectionPool) Close() {
    p.mu.Lock()
    defer p.mu.Unlock()

    if p.closed {
        return
    }

    p.closed = true
    close(p.healthStop)

    // Close all connections
    close(p.connections)
    for conn := range p.connections {
        conn.Close()
    }
}

// Stats returns pool statistics
func (p *ConnectionPool) Stats() PoolStats {
    p.mu.Lock()
    defer p.mu.Unlock()

    return PoolStats{
        Size:      p.size,
        Available: len(p.connections),
        MaxSize:   p.config.MaxSize,
    }
}

type PoolStats struct {
    Size      int
    Available int
    MaxSize   int
}
```


---

## Performance Optimization

Performance is critical for Grafana plugins handling large datasets and high query volumes. This section covers optimization techniques at multiple levels.

> **Related Reading**: For observability metrics, see [Observability Principles](../../shared-concepts/observability-principles.md)

### Query Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      QUERY OPTIMIZATION LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Layer 1: Query Planning                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • Query parsing and validation                                           │    │
│  │ • Predicate pushdown to backend                                          │    │
│  │ • Time range optimization                                                │    │
│  │ • Query splitting for parallelization                                    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Layer 2: Execution                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • Connection pooling                                                     │    │
│  │ • Parallel query execution                                               │    │
│  │ • Streaming results                                                      │    │
│  │ • Memory-efficient processing                                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Layer 3: Caching                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • Query result caching                                                   │    │
│  │ • Metadata caching                                                       │    │
│  │ • Schema caching                                                         │    │
│  │ • Invalidation strategies                                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Query Cache Implementation

```go
package plugin

import (
    "container/list"
    "sync"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

// QueryCache implements an LRU cache with TTL for query results
type QueryCache struct {
    maxSize   int
    ttl       time.Duration
    mu        sync.RWMutex
    items     map[string]*cacheItem
    evictList *list.List
    hits      int64
    misses    int64
}

type cacheItem struct {
    key       string
    value     backend.DataResponse
    expiresAt time.Time
    element   *list.Element
}

type QueryCacheConfig struct {
    MaxSize int
    TTL     time.Duration
}

// NewQueryCache creates a new query cache
func NewQueryCache(config QueryCacheConfig) *QueryCache {
    cache := &QueryCache{
        maxSize:   config.MaxSize,
        ttl:       config.TTL,
        items:     make(map[string]*cacheItem),
        evictList: list.New(),
    }

    // Start cleanup goroutine
    go cache.cleanupLoop()

    return cache
}

// Get retrieves a cached result
func (c *QueryCache) Get(key string) (backend.DataResponse, bool) {
    c.mu.RLock()
    item, exists := c.items[key]
    c.mu.RUnlock()

    if !exists {
        c.mu.Lock()
        c.misses++
        c.mu.Unlock()
        return backend.DataResponse{}, false
    }

    // Check expiration
    if time.Now().After(item.expiresAt) {
        c.mu.Lock()
        c.removeItem(item)
        c.misses++
        c.mu.Unlock()
        return backend.DataResponse{}, false
    }

    // Move to front (most recently used)
    c.mu.Lock()
    c.evictList.MoveToFront(item.element)
    c.hits++
    c.mu.Unlock()

    return item.value, true
}

// Set stores a result in the cache
func (c *QueryCache) Set(key string, value backend.DataResponse) {
    c.mu.Lock()
    defer c.mu.Unlock()

    // Check if key already exists
    if item, exists := c.items[key]; exists {
        item.value = value
        item.expiresAt = time.Now().Add(c.ttl)
        c.evictList.MoveToFront(item.element)
        return
    }

    // Evict if at capacity
    for len(c.items) >= c.maxSize {
        c.evictOldest()
    }

    // Add new item
    item := &cacheItem{
        key:       key,
        value:     value,
        expiresAt: time.Now().Add(c.ttl),
    }
    item.element = c.evictList.PushFront(item)
    c.items[key] = item
}

func (c *QueryCache) evictOldest() {
    element := c.evictList.Back()
    if element != nil {
        item := element.Value.(*cacheItem)
        c.removeItem(item)
    }
}

func (c *QueryCache) removeItem(item *cacheItem) {
    c.evictList.Remove(item.element)
    delete(c.items, item.key)
}

func (c *QueryCache) cleanupLoop() {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        c.cleanup()
    }
}

func (c *QueryCache) cleanup() {
    c.mu.Lock()
    defer c.mu.Unlock()

    now := time.Now()
    for _, item := range c.items {
        if now.After(item.expiresAt) {
            c.removeItem(item)
        }
    }
}

// Clear removes all items from the cache
func (c *QueryCache) Clear() {
    c.mu.Lock()
    defer c.mu.Unlock()

    c.items = make(map[string]*cacheItem)
    c.evictList.Init()
}

// Stats returns cache statistics
func (c *QueryCache) Stats() CacheStats {
    c.mu.RLock()
    defer c.mu.RUnlock()

    total := c.hits + c.misses
    hitRate := float64(0)
    if total > 0 {
        hitRate = float64(c.hits) / float64(total)
    }

    return CacheStats{
        Size:    len(c.items),
        MaxSize: c.maxSize,
        Hits:    c.hits,
        Misses:  c.misses,
        HitRate: hitRate,
    }
}

type CacheStats struct {
    Size    int
    MaxSize int
    Hits    int64
    Misses  int64
    HitRate float64
}
```


### Parallel Query Execution

Executing multiple queries in parallel significantly improves dashboard load times.

```go
package plugin

import (
    "context"
    "sync"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "golang.org/x/sync/errgroup"
    "golang.org/x/sync/semaphore"
)

// ParallelQueryExecutor handles concurrent query execution
type ParallelQueryExecutor struct {
    maxConcurrency int64
    semaphore      *semaphore.Weighted
    datasource     *Datasource
}

// NewParallelQueryExecutor creates a new parallel executor
func NewParallelQueryExecutor(ds *Datasource, maxConcurrency int) *ParallelQueryExecutor {
    return &ParallelQueryExecutor{
        maxConcurrency: int64(maxConcurrency),
        semaphore:      semaphore.NewWeighted(int64(maxConcurrency)),
        datasource:     ds,
    }
}

// ExecuteQueries runs multiple queries in parallel with bounded concurrency
func (e *ParallelQueryExecutor) ExecuteQueries(ctx context.Context, queries []backend.DataQuery) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()
    var mu sync.Mutex

    g, ctx := errgroup.WithContext(ctx)

    for _, query := range queries {
        query := query // capture loop variable

        g.Go(func() error {
            // Acquire semaphore slot
            if err := e.semaphore.Acquire(ctx, 1); err != nil {
                return err
            }
            defer e.semaphore.Release(1)

            // Execute individual query
            result := e.datasource.executeQuery(ctx, query)

            // Store result thread-safely
            mu.Lock()
            response.Responses[query.RefID] = result
            mu.Unlock()

            return nil
        })
    }

    // Wait for all queries to complete
    if err := g.Wait(); err != nil {
        return nil, err
    }

    return response, nil
}

// ExecuteQueriesWithPriority executes queries with priority ordering
func (e *ParallelQueryExecutor) ExecuteQueriesWithPriority(ctx context.Context, queries []PrioritizedQuery) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()
    var mu sync.Mutex

    // Sort queries by priority
    sortByPriority(queries)

    // Create priority-based worker pools
    highPriorityPool := make(chan PrioritizedQuery, len(queries))
    lowPriorityPool := make(chan PrioritizedQuery, len(queries))

    // Distribute queries to pools
    for _, q := range queries {
        if q.Priority == PriorityHigh {
            highPriorityPool <- q
        } else {
            lowPriorityPool <- q
        }
    }
    close(highPriorityPool)
    close(lowPriorityPool)

    var wg sync.WaitGroup

    // Process high priority queries first
    for i := 0; i < int(e.maxConcurrency); i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for q := range highPriorityPool {
                result := e.datasource.executeQuery(ctx, q.Query)
                mu.Lock()
                response.Responses[q.Query.RefID] = result
                mu.Unlock()
            }
        }()
    }
    wg.Wait()

    // Then process low priority queries
    for i := 0; i < int(e.maxConcurrency); i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for q := range lowPriorityPool {
                result := e.datasource.executeQuery(ctx, q.Query)
                mu.Lock()
                response.Responses[q.Query.RefID] = result
                mu.Unlock()
            }
        }()
    }
    wg.Wait()

    return response, nil
}

type QueryPriority int

const (
    PriorityHigh QueryPriority = iota
    PriorityNormal
    PriorityLow
)

type PrioritizedQuery struct {
    Query    backend.DataQuery
    Priority QueryPriority
}

func sortByPriority(queries []PrioritizedQuery) {
    // Sort implementation - high priority first
}
```

### Memory-Efficient Data Processing

Processing large datasets requires careful memory management to avoid OOM issues.

```go
package plugin

import (
    "context"
    "io"

    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// StreamingDataProcessor processes data in chunks to minimize memory usage
type StreamingDataProcessor struct {
    chunkSize int
    buffer    []byte
}

// NewStreamingDataProcessor creates a new streaming processor
func NewStreamingDataProcessor(chunkSize int) *StreamingDataProcessor {
    return &StreamingDataProcessor{
        chunkSize: chunkSize,
        buffer:    make([]byte, chunkSize),
    }
}

// ProcessStream reads and processes data in chunks
func (p *StreamingDataProcessor) ProcessStream(ctx context.Context, reader io.Reader, processor func(chunk []byte) error) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            n, err := reader.Read(p.buffer)
            if n > 0 {
                if err := processor(p.buffer[:n]); err != nil {
                    return err
                }
            }
            if err == io.EOF {
                return nil
            }
            if err != nil {
                return err
            }
        }
    }
}

// DataFrameBuilder builds data frames incrementally
type DataFrameBuilder struct {
    name       string
    fields     []*data.Field
    maxRows    int
    currentRow int
}

// NewDataFrameBuilder creates a new incremental frame builder
func NewDataFrameBuilder(name string, maxRows int) *DataFrameBuilder {
    return &DataFrameBuilder{
        name:    name,
        maxRows: maxRows,
    }
}

// AddField adds a field definition
func (b *DataFrameBuilder) AddField(name string, fieldType data.FieldType) {
    field := data.NewFieldFromFieldType(fieldType, b.maxRows)
    field.Name = name
    b.fields = append(b.fields, field)
}

// AppendRow adds a row of values
func (b *DataFrameBuilder) AppendRow(values ...interface{}) error {
    if b.currentRow >= b.maxRows {
        return ErrFrameFull
    }

    for i, v := range values {
        if i < len(b.fields) {
            b.fields[i].Set(b.currentRow, v)
        }
    }
    b.currentRow++
    return nil
}

// Build creates the final data frame
func (b *DataFrameBuilder) Build() *data.Frame {
    // Trim fields to actual size
    for _, field := range b.fields {
        if b.currentRow < b.maxRows {
            field.Delete(b.currentRow, b.maxRows-b.currentRow)
        }
    }

    return data.NewFrame(b.name, b.fields...)
}

var ErrFrameFull = &FrameFullError{}

type FrameFullError struct{}

func (e *FrameFullError) Error() string {
    return "data frame is full"
}

// MemoryLimitedBuffer provides a buffer with memory limits
type MemoryLimitedBuffer struct {
    maxBytes    int64
    currentSize int64
    data        [][]byte
}

// NewMemoryLimitedBuffer creates a new memory-limited buffer
func NewMemoryLimitedBuffer(maxBytes int64) *MemoryLimitedBuffer {
    return &MemoryLimitedBuffer{
        maxBytes: maxBytes,
        data:     make([][]byte, 0),
    }
}

// Write adds data to the buffer if within limits
func (b *MemoryLimitedBuffer) Write(p []byte) (int, error) {
    if b.currentSize+int64(len(p)) > b.maxBytes {
        return 0, ErrMemoryLimitExceeded
    }

    // Make a copy to avoid data races
    chunk := make([]byte, len(p))
    copy(chunk, p)

    b.data = append(b.data, chunk)
    b.currentSize += int64(len(p))

    return len(p), nil
}

// Bytes returns all buffered data
func (b *MemoryLimitedBuffer) Bytes() []byte {
    result := make([]byte, 0, b.currentSize)
    for _, chunk := range b.data {
        result = append(result, chunk...)
    }
    return result
}

var ErrMemoryLimitExceeded = &MemoryLimitError{}

type MemoryLimitError struct{}

func (e *MemoryLimitError) Error() string {
    return "memory limit exceeded"
}
```


### Rate Limiting and Backpressure

Protecting backend systems from overload is essential for production stability.

```go
package plugin

import (
    "context"
    "sync"
    "time"

    "golang.org/x/time/rate"
)

// RateLimiter implements token bucket rate limiting
type RateLimiter struct {
    limiter *rate.Limiter
    mu      sync.Mutex
    stopped bool
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(requestsPerSecond int) *RateLimiter {
    return &RateLimiter{
        limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), requestsPerSecond),
    }
}

// Allow checks if a request is allowed
func (r *RateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()

    if r.stopped {
        return false
    }

    return r.limiter.Allow()
}

// Wait blocks until a request is allowed or context is cancelled
func (r *RateLimiter) Wait(ctx context.Context) error {
    r.mu.Lock()
    if r.stopped {
        r.mu.Unlock()
        return ErrRateLimiterStopped
    }
    r.mu.Unlock()

    return r.limiter.Wait(ctx)
}

// Stop stops the rate limiter
func (r *RateLimiter) Stop() {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.stopped = true
}

var ErrRateLimiterStopped = &RateLimiterStoppedError{}

type RateLimiterStoppedError struct{}

func (e *RateLimiterStoppedError) Error() string {
    return "rate limiter stopped"
}

// AdaptiveRateLimiter adjusts rate based on backend response times
type AdaptiveRateLimiter struct {
    baseRate     float64
    currentRate  float64
    minRate      float64
    maxRate      float64
    limiter      *rate.Limiter
    mu           sync.Mutex
    latencies    []time.Duration
    targetP99    time.Duration
    adjustPeriod time.Duration
    stopCh       chan struct{}
}

// NewAdaptiveRateLimiter creates an adaptive rate limiter
func NewAdaptiveRateLimiter(config AdaptiveRateLimiterConfig) *AdaptiveRateLimiter {
    arl := &AdaptiveRateLimiter{
        baseRate:     config.BaseRate,
        currentRate:  config.BaseRate,
        minRate:      config.MinRate,
        maxRate:      config.MaxRate,
        limiter:      rate.NewLimiter(rate.Limit(config.BaseRate), int(config.BaseRate)),
        targetP99:    config.TargetP99,
        adjustPeriod: config.AdjustPeriod,
        latencies:    make([]time.Duration, 0, 1000),
        stopCh:       make(chan struct{}),
    }

    go arl.adjustLoop()

    return arl
}

type AdaptiveRateLimiterConfig struct {
    BaseRate     float64
    MinRate      float64
    MaxRate      float64
    TargetP99    time.Duration
    AdjustPeriod time.Duration
}

// RecordLatency records a request latency for rate adjustment
func (a *AdaptiveRateLimiter) RecordLatency(d time.Duration) {
    a.mu.Lock()
    defer a.mu.Unlock()

    a.latencies = append(a.latencies, d)

    // Keep only recent latencies
    if len(a.latencies) > 1000 {
        a.latencies = a.latencies[500:]
    }
}

// Allow checks if a request is allowed
func (a *AdaptiveRateLimiter) Allow() bool {
    return a.limiter.Allow()
}

func (a *AdaptiveRateLimiter) adjustLoop() {
    ticker := time.NewTicker(a.adjustPeriod)
    defer ticker.Stop()

    for {
        select {
        case <-a.stopCh:
            return
        case <-ticker.C:
            a.adjust()
        }
    }
}

func (a *AdaptiveRateLimiter) adjust() {
    a.mu.Lock()
    defer a.mu.Unlock()

    if len(a.latencies) < 10 {
        return
    }

    // Calculate P99 latency
    p99 := a.calculateP99()

    // Adjust rate based on P99
    if p99 > a.targetP99 {
        // Decrease rate
        a.currentRate = a.currentRate * 0.9
        if a.currentRate < a.minRate {
            a.currentRate = a.minRate
        }
    } else if p99 < a.targetP99/2 {
        // Increase rate
        a.currentRate = a.currentRate * 1.1
        if a.currentRate > a.maxRate {
            a.currentRate = a.maxRate
        }
    }

    a.limiter.SetLimit(rate.Limit(a.currentRate))
    a.limiter.SetBurst(int(a.currentRate))

    // Clear latencies
    a.latencies = a.latencies[:0]
}

func (a *AdaptiveRateLimiter) calculateP99() time.Duration {
    // Sort latencies and return P99
    sorted := make([]time.Duration, len(a.latencies))
    copy(sorted, a.latencies)
    
    // Simple sort for demonstration
    for i := 0; i < len(sorted); i++ {
        for j := i + 1; j < len(sorted); j++ {
            if sorted[i] > sorted[j] {
                sorted[i], sorted[j] = sorted[j], sorted[i]
            }
        }
    }

    idx := int(float64(len(sorted)) * 0.99)
    if idx >= len(sorted) {
        idx = len(sorted) - 1
    }

    return sorted[idx]
}

// Stop stops the adaptive rate limiter
func (a *AdaptiveRateLimiter) Stop() {
    close(a.stopCh)
}
```


---

## Observability Integration Patterns

Integrating observability into Grafana plugins enables monitoring, debugging, and performance analysis.

> **Related Reading**: For observability fundamentals, see [Observability Principles](../../shared-concepts/observability-principles.md) and [LGTM Stack](../../shared-concepts/lgtm-stack.md)

### Plugin Instrumentation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PLUGIN OBSERVABILITY STACK                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         Your Plugin                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │    │
│  │  │   Metrics   │  │   Traces    │  │    Logs     │  │  Profiles   │    │    │
│  │  │             │  │             │  │             │  │             │    │    │
│  │  │ • Counters  │  │ • Spans     │  │ • Structured│  │ • CPU       │    │    │
│  │  │ • Gauges    │  │ • Context   │  │ • Levels    │  │ • Memory    │    │    │
│  │  │ • Histograms│  │ • Baggage   │  │ • Fields    │  │ • Goroutines│    │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │    │
│  └─────────┼────────────────┼────────────────┼────────────────┼───────────┘    │
│            │                │                │                │                 │
│            ▼                ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Mimir     │  │   Tempo     │  │    Loki     │  │  Pyroscope  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Metrics Instrumentation

```go
package plugin

import (
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

// PluginMetrics holds all plugin metrics
type PluginMetrics struct {
    queryDuration    *prometheus.HistogramVec
    queryTotal       *prometheus.CounterVec
    queryErrors      *prometheus.CounterVec
    activeQueries    prometheus.Gauge
    cacheHits        prometheus.Counter
    cacheMisses      prometheus.Counter
    connectionPool   *prometheus.GaugeVec
}

// NewPluginMetrics creates and registers plugin metrics
func NewPluginMetrics(namespace, subsystem string) *PluginMetrics {
    return &PluginMetrics{
        queryDuration: promauto.NewHistogramVec(
            prometheus.HistogramOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "query_duration_seconds",
                Help:      "Duration of query execution in seconds",
                Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
            },
            []string{"datasource", "query_type", "status"},
        ),
        queryTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "queries_total",
                Help:      "Total number of queries executed",
            },
            []string{"datasource", "query_type"},
        ),
        queryErrors: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "query_errors_total",
                Help:      "Total number of query errors",
            },
            []string{"datasource", "error_type"},
        ),
        activeQueries: promauto.NewGauge(
            prometheus.GaugeOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "active_queries",
                Help:      "Number of currently executing queries",
            },
        ),
        cacheHits: promauto.NewCounter(
            prometheus.CounterOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "cache_hits_total",
                Help:      "Total number of cache hits",
            },
        ),
        cacheMisses: promauto.NewCounter(
            prometheus.CounterOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "cache_misses_total",
                Help:      "Total number of cache misses",
            },
        ),
        connectionPool: promauto.NewGaugeVec(
            prometheus.GaugeOpts{
                Namespace: namespace,
                Subsystem: subsystem,
                Name:      "connection_pool",
                Help:      "Connection pool statistics",
            },
            []string{"state"}, // active, idle, waiting
        ),
    }
}

// RecordQuery records query metrics
func (m *PluginMetrics) RecordQuery(datasource, queryType string, duration time.Duration, err error) {
    status := "success"
    if err != nil {
        status = "error"
        m.queryErrors.WithLabelValues(datasource, classifyError(err)).Inc()
    }

    m.queryDuration.WithLabelValues(datasource, queryType, status).Observe(duration.Seconds())
    m.queryTotal.WithLabelValues(datasource, queryType).Inc()
}

// QueryInProgress tracks active queries
func (m *PluginMetrics) QueryInProgress() func() {
    m.activeQueries.Inc()
    return func() {
        m.activeQueries.Dec()
    }
}

// RecordCacheHit records a cache hit
func (m *PluginMetrics) RecordCacheHit() {
    m.cacheHits.Inc()
}

// RecordCacheMiss records a cache miss
func (m *PluginMetrics) RecordCacheMiss() {
    m.cacheMisses.Inc()
}

// UpdateConnectionPool updates connection pool metrics
func (m *PluginMetrics) UpdateConnectionPool(active, idle, waiting int) {
    m.connectionPool.WithLabelValues("active").Set(float64(active))
    m.connectionPool.WithLabelValues("idle").Set(float64(idle))
    m.connectionPool.WithLabelValues("waiting").Set(float64(waiting))
}

func classifyError(err error) string {
    // Classify error types for metrics
    switch {
    case isTimeoutError(err):
        return "timeout"
    case isConnectionError(err):
        return "connection"
    case isAuthError(err):
        return "auth"
    default:
        return "unknown"
    }
}

func isTimeoutError(err error) bool   { return false } // Implement
func isConnectionError(err error) bool { return false } // Implement
func isAuthError(err error) bool       { return false } // Implement
```


#### Distributed Tracing Integration

```go
package plugin

import (
    "context"
    "fmt"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

// Tracer provides distributed tracing for the plugin
type Tracer struct {
    tracer trace.Tracer
}

// NewTracer creates a new tracer
func NewTracer(serviceName string) *Tracer {
    return &Tracer{
        tracer: otel.Tracer(serviceName),
    }
}

// StartSpan starts a new span
func (t *Tracer) StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
    return t.tracer.Start(ctx, name, opts...)
}

// TraceQuery wraps query execution with tracing
func (t *Tracer) TraceQuery(ctx context.Context, datasource, queryType, query string, fn func(context.Context) error) error {
    ctx, span := t.tracer.Start(ctx, "query",
        trace.WithAttributes(
            attribute.String("datasource", datasource),
            attribute.String("query_type", queryType),
            attribute.String("query", truncateQuery(query)),
        ),
    )
    defer span.End()

    err := fn(ctx)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
    } else {
        span.SetStatus(codes.Ok, "")
    }

    return err
}

// TraceConnection wraps connection operations with tracing
func (t *Tracer) TraceConnection(ctx context.Context, operation string, fn func(context.Context) error) error {
    ctx, span := t.tracer.Start(ctx, fmt.Sprintf("connection.%s", operation))
    defer span.End()

    err := fn(ctx)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
    }

    return err
}

// AddSpanAttributes adds attributes to the current span
func AddSpanAttributes(ctx context.Context, attrs ...attribute.KeyValue) {
    span := trace.SpanFromContext(ctx)
    span.SetAttributes(attrs...)
}

// AddSpanEvent adds an event to the current span
func AddSpanEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
    span := trace.SpanFromContext(ctx)
    span.AddEvent(name, trace.WithAttributes(attrs...))
}

func truncateQuery(query string) string {
    if len(query) > 500 {
        return query[:500] + "..."
    }
    return query
}

// Example usage in QueryData handler
func (d *Datasource) QueryDataWithTracing(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()

    for _, query := range req.Queries {
        var result backend.DataResponse

        err := d.tracer.TraceQuery(ctx, d.settings.Name, "timeseries", query.JSON, func(ctx context.Context) error {
            // Add query-specific attributes
            AddSpanAttributes(ctx,
                attribute.Int64("time_range_from", query.TimeRange.From.UnixMilli()),
                attribute.Int64("time_range_to", query.TimeRange.To.UnixMilli()),
            )

            // Execute query
            result = d.executeQuery(ctx, query)
            return result.Error
        })

        if err != nil {
            result = backend.ErrDataResponse(backend.StatusInternal, err.Error())
        }

        response.Responses[query.RefID] = result
    }

    return response, nil
}
```

#### Structured Logging

```go
package plugin

import (
    "context"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend/log"
    "go.opentelemetry.io/otel/trace"
)

// Logger provides structured logging with context
type Logger struct {
    logger log.Logger
}

// NewLogger creates a new structured logger
func NewLogger() *Logger {
    return &Logger{
        logger: log.DefaultLogger,
    }
}

// WithContext returns a logger with trace context
func (l *Logger) WithContext(ctx context.Context) log.Logger {
    span := trace.SpanFromContext(ctx)
    if span.SpanContext().IsValid() {
        return l.logger.With(
            "trace_id", span.SpanContext().TraceID().String(),
            "span_id", span.SpanContext().SpanID().String(),
        )
    }
    return l.logger
}

// LogQuery logs query execution details
func (l *Logger) LogQuery(ctx context.Context, datasource, query string, duration time.Duration, err error) {
    logger := l.WithContext(ctx)

    fields := []interface{}{
        "datasource", datasource,
        "query", truncateQuery(query),
        "duration_ms", duration.Milliseconds(),
    }

    if err != nil {
        fields = append(fields, "error", err.Error())
        logger.Error("Query failed", fields...)
    } else {
        logger.Info("Query executed", fields...)
    }
}

// LogConnection logs connection events
func (l *Logger) LogConnection(ctx context.Context, event string, details map[string]interface{}) {
    logger := l.WithContext(ctx)

    fields := make([]interface{}, 0, len(details)*2+2)
    fields = append(fields, "event", event)
    for k, v := range details {
        fields = append(fields, k, v)
    }

    logger.Info("Connection event", fields...)
}

// LogError logs errors with context
func (l *Logger) LogError(ctx context.Context, msg string, err error, fields ...interface{}) {
    logger := l.WithContext(ctx)
    fields = append(fields, "error", err.Error())
    logger.Error(msg, fields...)
}

// LogDebug logs debug information
func (l *Logger) LogDebug(ctx context.Context, msg string, fields ...interface{}) {
    logger := l.WithContext(ctx)
    logger.Debug(msg, fields...)
}
```


---

## Data Source Deep Dives

Understanding the integration patterns for major data sources is essential for building robust Grafana plugins and dashboards.

> **Related Reading**: For LGTM stack details, see [LGTM Stack](../../shared-concepts/lgtm-stack.md)

### Prometheus Integration

Prometheus is the de facto standard for metrics collection in cloud-native environments.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PROMETHEUS INTEGRATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Grafana   │    │   Prometheus    │    │    Targets      │                 │
│  │             │───▶│     Server      │◄───│                 │                 │
│  │  PromQL     │    │                 │    │  • Applications │                 │
│  │  Queries    │    │  • TSDB         │    │  • Exporters    │                 │
│  │             │    │  • Rules        │    │  • Services     │                 │
│  └─────────────┘    │  • Alerts       │    └─────────────────┘                 │
│                     └─────────────────┘                                         │
│                                                                                  │
│  Query Types:                                                                    │
│  • Instant queries: Single point in time                                        │
│  • Range queries: Time series over interval                                     │
│  • Metadata queries: Labels, series, targets                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Prometheus Client Implementation

```go
package datasource

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// PrometheusClient handles Prometheus API interactions
type PrometheusClient struct {
    baseURL    string
    httpClient *http.Client
    headers    map[string]string
}

// NewPrometheusClient creates a new Prometheus client
func NewPrometheusClient(baseURL string, timeout time.Duration) *PrometheusClient {
    return &PrometheusClient{
        baseURL: baseURL,
        httpClient: &http.Client{
            Timeout: timeout,
        },
        headers: make(map[string]string),
    }
}

// QueryRange executes a range query
func (c *PrometheusClient) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*data.Frame, error) {
    params := url.Values{}
    params.Set("query", query)
    params.Set("start", fmt.Sprintf("%d", start.Unix()))
    params.Set("end", fmt.Sprintf("%d", end.Unix()))
    params.Set("step", step.String())

    resp, err := c.doRequest(ctx, "/api/v1/query_range", params)
    if err != nil {
        return nil, err
    }

    return c.parseRangeResponse(resp)
}

// QueryInstant executes an instant query
func (c *PrometheusClient) QueryInstant(ctx context.Context, query string, timestamp time.Time) (*data.Frame, error) {
    params := url.Values{}
    params.Set("query", query)
    params.Set("time", fmt.Sprintf("%d", timestamp.Unix()))

    resp, err := c.doRequest(ctx, "/api/v1/query", params)
    if err != nil {
        return nil, err
    }

    return c.parseInstantResponse(resp)
}

// GetLabelValues retrieves values for a label
func (c *PrometheusClient) GetLabelValues(ctx context.Context, label string, matchers []string) ([]string, error) {
    params := url.Values{}
    for _, m := range matchers {
        params.Add("match[]", m)
    }

    endpoint := fmt.Sprintf("/api/v1/label/%s/values", url.PathEscape(label))
    resp, err := c.doRequest(ctx, endpoint, params)
    if err != nil {
        return nil, err
    }

    var result struct {
        Status string   `json:"status"`
        Data   []string `json:"data"`
    }
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    return result.Data, nil
}

// GetSeries retrieves series matching selectors
func (c *PrometheusClient) GetSeries(ctx context.Context, matchers []string, start, end time.Time) ([]map[string]string, error) {
    params := url.Values{}
    for _, m := range matchers {
        params.Add("match[]", m)
    }
    params.Set("start", fmt.Sprintf("%d", start.Unix()))
    params.Set("end", fmt.Sprintf("%d", end.Unix()))

    resp, err := c.doRequest(ctx, "/api/v1/series", params)
    if err != nil {
        return nil, err
    }

    var result struct {
        Status string              `json:"status"`
        Data   []map[string]string `json:"data"`
    }
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    return result.Data, nil
}

func (c *PrometheusClient) doRequest(ctx context.Context, endpoint string, params url.Values) ([]byte, error) {
    reqURL := fmt.Sprintf("%s%s?%s", c.baseURL, endpoint, params.Encode())

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
    if err != nil {
        return nil, err
    }

    for k, v := range c.headers {
        req.Header.Set(k, v)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("prometheus returned status %d", resp.StatusCode)
    }

    var buf []byte
    buf = make([]byte, 0, 1024*1024) // 1MB initial capacity
    // Read response body
    // ... implementation
    return buf, nil
}

func (c *PrometheusClient) parseRangeResponse(resp []byte) (*data.Frame, error) {
    var result prometheusResponse
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    if result.Status != "success" {
        return nil, fmt.Errorf("prometheus error: %s", result.Error)
    }

    // Convert to Grafana data frame
    return convertMatrixToFrame(result.Data.Result)
}

func (c *PrometheusClient) parseInstantResponse(resp []byte) (*data.Frame, error) {
    // Similar to parseRangeResponse but for vector results
    return nil, nil
}

type prometheusResponse struct {
    Status string `json:"status"`
    Error  string `json:"error,omitempty"`
    Data   struct {
        ResultType string        `json:"resultType"`
        Result     []interface{} `json:"result"`
    } `json:"data"`
}

func convertMatrixToFrame(result []interface{}) (*data.Frame, error) {
    // Convert Prometheus matrix result to Grafana data frame
    return data.NewFrame("prometheus"), nil
}
```

#### Advanced PromQL Patterns

```promql
# Rate calculation with proper handling of counter resets
rate(http_requests_total{job="api-server"}[5m])

# Histogram quantile calculation
histogram_quantile(0.99, 
    sum(rate(http_request_duration_seconds_bucket{job="api-server"}[5m])) by (le)
)

# Aggregation across multiple dimensions
sum by (service, method) (
    rate(http_requests_total{status=~"5.."}[5m])
) / sum by (service, method) (
    rate(http_requests_total[5m])
) * 100

# Subquery for moving average
avg_over_time(
    rate(http_requests_total[5m])[1h:1m]
)

# Recording rule for expensive queries
# rules.yml
groups:
  - name: api_server
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      - record: job:http_request_latency_p99:5m
        expr: |
          histogram_quantile(0.99,
            sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
          )
```


### Loki Integration

Loki is Grafana's log aggregation system, designed for efficiency and cost-effectiveness.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOKI INTEGRATION ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Grafana   │    │      Loki       │    │    Log Sources  │                 │
│  │             │───▶│                 │◄───│                 │                 │
│  │  LogQL      │    │  • Distributor  │    │  • Promtail     │                 │
│  │  Queries    │    │  • Ingester     │    │  • Fluentd      │                 │
│  │             │    │  • Querier      │    │  • Logstash     │                 │
│  └─────────────┘    │  • Compactor    │    │  • Direct API   │                 │
│                     └─────────────────┘    └─────────────────┘                 │
│                                                                                  │
│  Query Types:                                                                    │
│  • Log queries: Return log lines                                                │
│  • Metric queries: Return numeric time series from logs                         │
│  • Label queries: Return label names and values                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Loki Client Implementation

```go
package datasource

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// LokiClient handles Loki API interactions
type LokiClient struct {
    baseURL    string
    httpClient *http.Client
    orgID      string
}

// NewLokiClient creates a new Loki client
func NewLokiClient(baseURL string, orgID string, timeout time.Duration) *LokiClient {
    return &LokiClient{
        baseURL: baseURL,
        orgID:   orgID,
        httpClient: &http.Client{
            Timeout: timeout,
        },
    }
}

// QueryRange executes a LogQL range query
func (c *LokiClient) QueryRange(ctx context.Context, query string, start, end time.Time, limit int, direction string) (*LokiQueryResult, error) {
    params := url.Values{}
    params.Set("query", query)
    params.Set("start", fmt.Sprintf("%d", start.UnixNano()))
    params.Set("end", fmt.Sprintf("%d", end.UnixNano()))
    params.Set("limit", fmt.Sprintf("%d", limit))
    params.Set("direction", direction) // "forward" or "backward"

    return c.doQuery(ctx, "/loki/api/v1/query_range", params)
}

// QueryInstant executes a LogQL instant query
func (c *LokiClient) QueryInstant(ctx context.Context, query string, timestamp time.Time, limit int) (*LokiQueryResult, error) {
    params := url.Values{}
    params.Set("query", query)
    params.Set("time", fmt.Sprintf("%d", timestamp.UnixNano()))
    params.Set("limit", fmt.Sprintf("%d", limit))

    return c.doQuery(ctx, "/loki/api/v1/query", params)
}

// GetLabels retrieves all label names
func (c *LokiClient) GetLabels(ctx context.Context, start, end time.Time) ([]string, error) {
    params := url.Values{}
    params.Set("start", fmt.Sprintf("%d", start.UnixNano()))
    params.Set("end", fmt.Sprintf("%d", end.UnixNano()))

    resp, err := c.doRequest(ctx, "/loki/api/v1/labels", params)
    if err != nil {
        return nil, err
    }

    var result struct {
        Status string   `json:"status"`
        Data   []string `json:"data"`
    }
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    return result.Data, nil
}

// GetLabelValues retrieves values for a specific label
func (c *LokiClient) GetLabelValues(ctx context.Context, label string, start, end time.Time, query string) ([]string, error) {
    params := url.Values{}
    params.Set("start", fmt.Sprintf("%d", start.UnixNano()))
    params.Set("end", fmt.Sprintf("%d", end.UnixNano()))
    if query != "" {
        params.Set("query", query)
    }

    endpoint := fmt.Sprintf("/loki/api/v1/label/%s/values", url.PathEscape(label))
    resp, err := c.doRequest(ctx, endpoint, params)
    if err != nil {
        return nil, err
    }

    var result struct {
        Status string   `json:"status"`
        Data   []string `json:"data"`
    }
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    return result.Data, nil
}

// TailLogs streams logs in real-time
func (c *LokiClient) TailLogs(ctx context.Context, query string, delayFor time.Duration, limit int) (<-chan *LokiStreamEntry, error) {
    params := url.Values{}
    params.Set("query", query)
    params.Set("delay_for", fmt.Sprintf("%d", int(delayFor.Seconds())))
    params.Set("limit", fmt.Sprintf("%d", limit))

    // WebSocket connection for tailing
    // ... implementation
    return nil, nil
}

func (c *LokiClient) doQuery(ctx context.Context, endpoint string, params url.Values) (*LokiQueryResult, error) {
    resp, err := c.doRequest(ctx, endpoint, params)
    if err != nil {
        return nil, err
    }

    var result LokiQueryResult
    if err := json.Unmarshal(resp, &result); err != nil {
        return nil, err
    }

    return &result, nil
}

func (c *LokiClient) doRequest(ctx context.Context, endpoint string, params url.Values) ([]byte, error) {
    reqURL := fmt.Sprintf("%s%s?%s", c.baseURL, endpoint, params.Encode())

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
    if err != nil {
        return nil, err
    }

    if c.orgID != "" {
        req.Header.Set("X-Scope-OrgID", c.orgID)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // Read and return response
    return nil, nil
}

// LokiQueryResult represents a Loki query response
type LokiQueryResult struct {
    Status string `json:"status"`
    Data   struct {
        ResultType string            `json:"resultType"` // "streams" or "matrix"
        Result     []json.RawMessage `json:"result"`
        Stats      LokiQueryStats    `json:"stats"`
    } `json:"data"`
}

type LokiQueryStats struct {
    Summary struct {
        BytesProcessedPerSecond int64   `json:"bytesProcessedPerSecond"`
        LinesProcessedPerSecond int64   `json:"linesProcessedPerSecond"`
        TotalBytesProcessed     int64   `json:"totalBytesProcessed"`
        TotalLinesProcessed     int64   `json:"totalLinesProcessed"`
        ExecTime                float64 `json:"execTime"`
    } `json:"summary"`
}

type LokiStreamEntry struct {
    Stream map[string]string `json:"stream"`
    Values [][]string        `json:"values"` // [timestamp, line]
}

// ToDataFrame converts Loki result to Grafana data frame
func (r *LokiQueryResult) ToDataFrame() (*data.Frame, error) {
    // Convert based on result type
    return data.NewFrame("loki"), nil
}
```

#### Advanced LogQL Patterns

```logql
# Basic log stream selection
{namespace="production", app="api-server"}

# Filter with regex
{app="api-server"} |~ "error|Error|ERROR"

# JSON parsing and filtering
{app="api-server"} 
    | json 
    | status_code >= 500 
    | line_format "{{.method}} {{.path}} - {{.status_code}}"

# Log-based metrics (rate of errors)
sum(rate({app="api-server"} |= "error" [5m])) by (pod)

# Quantile from log-derived metrics
quantile_over_time(0.99, 
    {app="api-server"} 
    | json 
    | unwrap duration [5m]
) by (endpoint)

# Pattern matching for unstructured logs
{app="legacy-service"} 
    | pattern "<timestamp> <level> <message>"
    | level = "ERROR"

# Aggregation with grouping
sum by (status_code) (
    count_over_time({app="api-server"} | json [1h])
)
```


### MySQL Integration

MySQL is a widely-used relational database with specific optimization patterns for Grafana integration.

```go
package datasource

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    _ "github.com/go-sql-driver/mysql"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// MySQLClient handles MySQL database interactions
type MySQLClient struct {
    db      *sql.DB
    timeout time.Duration
}

// MySQLConfig holds MySQL connection configuration
type MySQLConfig struct {
    Host            string
    Port            int
    User            string
    Password        string
    Database        string
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
    Timeout         time.Duration
    TLSConfig       string // "true", "false", "skip-verify", or custom config name
}

// NewMySQLClient creates a new MySQL client
func NewMySQLClient(config MySQLConfig) (*MySQLClient, error) {
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&timeout=%s&tls=%s",
        config.User,
        config.Password,
        config.Host,
        config.Port,
        config.Database,
        config.Timeout.String(),
        config.TLSConfig,
    )

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, fmt.Errorf("failed to open database: %w", err)
    }

    // Configure connection pool
    db.SetMaxOpenConns(config.MaxOpenConns)
    db.SetMaxIdleConns(config.MaxIdleConns)
    db.SetConnMaxLifetime(config.ConnMaxLifetime)

    // Verify connection
    ctx, cancel := context.WithTimeout(context.Background(), config.Timeout)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        db.Close()
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    return &MySQLClient{
        db:      db,
        timeout: config.Timeout,
    }, nil
}

// Query executes a query and returns a data frame
func (c *MySQLClient) Query(ctx context.Context, query string, args ...interface{}) (*data.Frame, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    rows, err := c.db.QueryContext(ctx, query, args...)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()

    return c.rowsToFrame(rows)
}

// QueryTimeSeries executes a time series query with proper time column handling
func (c *MySQLClient) QueryTimeSeries(ctx context.Context, query string, timeColumn string, valueColumns []string) (*data.Frame, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    rows, err := c.db.QueryContext(ctx, query)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()

    return c.rowsToTimeSeriesFrame(rows, timeColumn, valueColumns)
}

func (c *MySQLClient) rowsToFrame(rows *sql.Rows) (*data.Frame, error) {
    columns, err := rows.ColumnTypes()
    if err != nil {
        return nil, err
    }

    // Create fields based on column types
    fields := make([]*data.Field, len(columns))
    for i, col := range columns {
        fields[i] = c.createField(col)
    }

    // Scan rows
    for rows.Next() {
        values := make([]interface{}, len(columns))
        valuePtrs := make([]interface{}, len(columns))
        for i := range values {
            valuePtrs[i] = &values[i]
        }

        if err := rows.Scan(valuePtrs...); err != nil {
            return nil, err
        }

        for i, v := range values {
            fields[i].Append(c.convertValue(v, columns[i]))
        }
    }

    return data.NewFrame("mysql", fields...), nil
}

func (c *MySQLClient) rowsToTimeSeriesFrame(rows *sql.Rows, timeColumn string, valueColumns []string) (*data.Frame, error) {
    // Specialized handling for time series data
    return data.NewFrame("mysql_timeseries"), nil
}

func (c *MySQLClient) createField(col *sql.ColumnType) *data.Field {
    name := col.Name()
    dbType := col.DatabaseTypeName()

    switch dbType {
    case "INT", "BIGINT", "SMALLINT", "TINYINT":
        return data.NewField(name, nil, []int64{})
    case "FLOAT", "DOUBLE", "DECIMAL":
        return data.NewField(name, nil, []float64{})
    case "DATETIME", "TIMESTAMP", "DATE":
        return data.NewField(name, nil, []time.Time{})
    case "TINYINT(1)": // Boolean
        return data.NewField(name, nil, []bool{})
    default:
        return data.NewField(name, nil, []string{})
    }
}

func (c *MySQLClient) convertValue(v interface{}, col *sql.ColumnType) interface{} {
    if v == nil {
        return nil
    }
    // Type conversion logic
    return v
}

// Close closes the database connection
func (c *MySQLClient) Close() error {
    return c.db.Close()
}

// Ping checks database connectivity
func (c *MySQLClient) Ping(ctx context.Context) error {
    return c.db.PingContext(ctx)
}
```

### PostgreSQL Integration

PostgreSQL offers advanced features like JSONB, arrays, and window functions useful for analytics.

```go
package datasource

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/data"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

// PostgreSQLClient handles PostgreSQL database interactions
type PostgreSQLClient struct {
    pool    *pgxpool.Pool
    timeout time.Duration
}

// PostgreSQLConfig holds PostgreSQL connection configuration
type PostgreSQLConfig struct {
    Host            string
    Port            int
    User            string
    Password        string
    Database        string
    SSLMode         string // "disable", "require", "verify-ca", "verify-full"
    MaxConns        int32
    MinConns        int32
    MaxConnLifetime time.Duration
    MaxConnIdleTime time.Duration
    Timeout         time.Duration
}

// NewPostgreSQLClient creates a new PostgreSQL client
func NewPostgreSQLClient(ctx context.Context, config PostgreSQLConfig) (*PostgreSQLClient, error) {
    connString := fmt.Sprintf(
        "postgres://%s:%s@%s:%d/%s?sslmode=%s",
        config.User,
        config.Password,
        config.Host,
        config.Port,
        config.Database,
        config.SSLMode,
    )

    poolConfig, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, fmt.Errorf("failed to parse config: %w", err)
    }

    // Configure pool
    poolConfig.MaxConns = config.MaxConns
    poolConfig.MinConns = config.MinConns
    poolConfig.MaxConnLifetime = config.MaxConnLifetime
    poolConfig.MaxConnIdleTime = config.MaxConnIdleTime

    pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to create pool: %w", err)
    }

    // Verify connection
    if err := pool.Ping(ctx); err != nil {
        pool.Close()
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    return &PostgreSQLClient{
        pool:    pool,
        timeout: config.Timeout,
    }, nil
}

// Query executes a query and returns a data frame
func (c *PostgreSQLClient) Query(ctx context.Context, query string, args ...interface{}) (*data.Frame, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    rows, err := c.pool.Query(ctx, query, args...)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()

    return c.rowsToFrame(rows)
}

// QueryWithPrepare uses prepared statements for repeated queries
func (c *PostgreSQLClient) QueryWithPrepare(ctx context.Context, name, query string, args ...interface{}) (*data.Frame, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    conn, err := c.pool.Acquire(ctx)
    if err != nil {
        return nil, err
    }
    defer conn.Release()

    // Prepare statement (cached per connection)
    _, err = conn.Conn().Prepare(ctx, name, query)
    if err != nil {
        return nil, fmt.Errorf("prepare failed: %w", err)
    }

    rows, err := conn.Query(ctx, name, args...)
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer rows.Close()

    return c.rowsToFrame(rows)
}

// QueryJSON handles JSONB columns efficiently
func (c *PostgreSQLClient) QueryJSON(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    rows, err := c.pool.Query(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results []map[string]interface{}
    for rows.Next() {
        var jsonData map[string]interface{}
        if err := rows.Scan(&jsonData); err != nil {
            return nil, err
        }
        results = append(results, jsonData)
    }

    return results, nil
}

func (c *PostgreSQLClient) rowsToFrame(rows pgx.Rows) (*data.Frame, error) {
    fieldDescs := rows.FieldDescriptions()

    // Create fields based on PostgreSQL types
    fields := make([]*data.Field, len(fieldDescs))
    for i, fd := range fieldDescs {
        fields[i] = c.createFieldFromPgType(fd)
    }

    // Scan rows
    for rows.Next() {
        values, err := rows.Values()
        if err != nil {
            return nil, err
        }

        for i, v := range values {
            fields[i].Append(v)
        }
    }

    return data.NewFrame("postgresql", fields...), nil
}

func (c *PostgreSQLClient) createFieldFromPgType(fd pgx.FieldDescription) *data.Field {
    name := string(fd.Name)
    // Map PostgreSQL OIDs to Grafana field types
    return data.NewField(name, nil, []interface{}{})
}

// Close closes the connection pool
func (c *PostgreSQLClient) Close() {
    c.pool.Close()
}

// Ping checks database connectivity
func (c *PostgreSQLClient) Ping(ctx context.Context) error {
    return c.pool.Ping(ctx)
}

// Stats returns pool statistics
func (c *PostgreSQLClient) Stats() *pgxpool.Stat {
    return c.pool.Stat()
}
```


### BigQuery Integration

Google BigQuery is a serverless data warehouse requiring specific patterns for cost-effective querying.

```go
package datasource

import (
    "context"
    "fmt"
    "time"

    "cloud.google.com/go/bigquery"
    "github.com/grafana/grafana-plugin-sdk-go/data"
    "google.golang.org/api/iterator"
    "google.golang.org/api/option"
)

// BigQueryClient handles BigQuery interactions
type BigQueryClient struct {
    client    *bigquery.Client
    projectID string
    timeout   time.Duration
}

// BigQueryConfig holds BigQuery configuration
type BigQueryConfig struct {
    ProjectID          string
    CredentialsJSON    []byte
    Location           string
    MaxBillingTier     int
    MaxBytesBilled     int64
    UseQueryCache      bool
    UseLegacySQL       bool
    Timeout            time.Duration
}

// NewBigQueryClient creates a new BigQuery client
func NewBigQueryClient(ctx context.Context, config BigQueryConfig) (*BigQueryClient, error) {
    var opts []option.ClientOption
    if len(config.CredentialsJSON) > 0 {
        opts = append(opts, option.WithCredentialsJSON(config.CredentialsJSON))
    }

    client, err := bigquery.NewClient(ctx, config.ProjectID, opts...)
    if err != nil {
        return nil, fmt.Errorf("failed to create BigQuery client: %w", err)
    }

    return &BigQueryClient{
        client:    client,
        projectID: config.ProjectID,
        timeout:   config.Timeout,
    }, nil
}

// Query executes a BigQuery query
func (c *BigQueryClient) Query(ctx context.Context, query string, params []bigquery.QueryParameter) (*data.Frame, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()

    q := c.client.Query(query)
    q.Parameters = params

    // Configure query job
    q.QueryConfig = bigquery.QueryConfig{
        Q:                query,
        Parameters:       params,
        UseStandardSQL:   true,
        DisableQueryCache: false,
    }

    job, err := q.Run(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to run query: %w", err)
    }

    status, err := job.Wait(ctx)
    if err != nil {
        return nil, fmt.Errorf("query job failed: %w", err)
    }

    if err := status.Err(); err != nil {
        return nil, fmt.Errorf("query error: %w", err)
    }

    // Read results
    it, err := job.Read(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to read results: %w", err)
    }

    return c.iteratorToFrame(it)
}

// QueryDryRun estimates query cost without executing
func (c *BigQueryClient) QueryDryRun(ctx context.Context, query string) (*BigQueryCostEstimate, error) {
    q := c.client.Query(query)
    q.DryRun = true

    job, err := q.Run(ctx)
    if err != nil {
        return nil, err
    }

    status := job.LastStatus()
    stats := status.Statistics

    return &BigQueryCostEstimate{
        TotalBytesProcessed: stats.TotalBytesProcessed,
        EstimatedCostUSD:    float64(stats.TotalBytesProcessed) / 1e12 * 5.0, // $5 per TB
        CacheHit:            stats.Query.CacheHit,
    }, nil
}

// QueryWithPartitionFilter ensures partition pruning for cost optimization
func (c *BigQueryClient) QueryWithPartitionFilter(ctx context.Context, table, partitionColumn string, start, end time.Time, selectColumns []string) (*data.Frame, error) {
    query := fmt.Sprintf(`
        SELECT %s
        FROM %s
        WHERE %s BETWEEN @start AND @end
    `, 
        joinColumns(selectColumns),
        table,
        partitionColumn,
    )

    params := []bigquery.QueryParameter{
        {Name: "start", Value: start},
        {Name: "end", Value: end},
    }

    return c.Query(ctx, query, params)
}

// StreamingInsert inserts rows using streaming API
func (c *BigQueryClient) StreamingInsert(ctx context.Context, dataset, table string, rows []map[string]interface{}) error {
    inserter := c.client.Dataset(dataset).Table(table).Inserter()

    var valueSavers []*bigquery.ValuesSaver
    for _, row := range rows {
        valueSavers = append(valueSavers, &bigquery.ValuesSaver{
            Row: row,
        })
    }

    return inserter.Put(ctx, valueSavers)
}

func (c *BigQueryClient) iteratorToFrame(it *bigquery.RowIterator) (*data.Frame, error) {
    schema := it.Schema

    // Create fields from schema
    fields := make([]*data.Field, len(schema))
    for i, field := range schema {
        fields[i] = c.createFieldFromBQType(field)
    }

    // Read all rows
    for {
        var row []bigquery.Value
        err := it.Next(&row)
        if err == iterator.Done {
            break
        }
        if err != nil {
            return nil, err
        }

        for i, v := range row {
            fields[i].Append(c.convertBQValue(v, schema[i]))
        }
    }

    return data.NewFrame("bigquery", fields...), nil
}

func (c *BigQueryClient) createFieldFromBQType(field *bigquery.FieldSchema) *data.Field {
    name := field.Name

    switch field.Type {
    case bigquery.IntegerFieldType:
        return data.NewField(name, nil, []int64{})
    case bigquery.FloatFieldType:
        return data.NewField(name, nil, []float64{})
    case bigquery.BooleanFieldType:
        return data.NewField(name, nil, []bool{})
    case bigquery.TimestampFieldType, bigquery.DateFieldType, bigquery.DateTimeFieldType:
        return data.NewField(name, nil, []time.Time{})
    default:
        return data.NewField(name, nil, []string{})
    }
}

func (c *BigQueryClient) convertBQValue(v bigquery.Value, schema *bigquery.FieldSchema) interface{} {
    if v == nil {
        return nil
    }
    return v
}

// Close closes the BigQuery client
func (c *BigQueryClient) Close() error {
    return c.client.Close()
}

// BigQueryCostEstimate represents query cost estimation
type BigQueryCostEstimate struct {
    TotalBytesProcessed int64
    EstimatedCostUSD    float64
    CacheHit            bool
}

func joinColumns(columns []string) string {
    if len(columns) == 0 {
        return "*"
    }
    result := columns[0]
    for i := 1; i < len(columns); i++ {
        result += ", " + columns[i]
    }
    return result
}
```

#### BigQuery Cost Optimization Patterns

```sql
-- Use partitioned tables with partition filters
SELECT *
FROM `project.dataset.events`
WHERE _PARTITIONTIME BETWEEN '2024-01-01' AND '2024-01-31'
  AND event_type = 'purchase'

-- Use clustered tables for common filter columns
CREATE TABLE `project.dataset.events_clustered`
PARTITION BY DATE(timestamp)
CLUSTER BY user_id, event_type
AS SELECT * FROM `project.dataset.events`

-- Avoid SELECT * - specify only needed columns
SELECT user_id, event_type, timestamp, value
FROM `project.dataset.events`
WHERE DATE(timestamp) = CURRENT_DATE()

-- Use approximate aggregation for large datasets
SELECT
  APPROX_COUNT_DISTINCT(user_id) as unique_users,
  APPROX_QUANTILES(value, 100)[OFFSET(99)] as p99_value
FROM `project.dataset.events`

-- Materialize expensive subqueries
WITH daily_stats AS (
  SELECT
    DATE(timestamp) as date,
    COUNT(*) as event_count,
    SUM(value) as total_value
  FROM `project.dataset.events`
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  GROUP BY 1
)
SELECT * FROM daily_stats
WHERE event_count > 1000
```


---

## Frontend Technologies Overview

While the Senior Software Engineer OSS role focuses on Go backend development, understanding frontend technologies is valuable for full-stack plugin development.

> **Related Reading**: For plugin frontend basics, see [Intermediate Guide](./intermediate.md#frontend-plugin-development-typescriptreact)

### TypeScript Fundamentals

TypeScript adds static typing to JavaScript, improving code quality and developer experience.

```typescript
// Type definitions for Grafana plugin development
interface DataSourceSettings {
  url: string;
  basicAuth: boolean;
  jsonData: {
    timeout: number;
    maxRetries: number;
    customHeaders?: Record<string, string>;
  };
  secureJsonData?: {
    apiKey?: string;
    password?: string;
  };
}

// Generic types for query handling
interface Query<T extends QueryType = QueryType> {
  refId: string;
  queryType: T;
  datasource: DataSourceRef;
  hide?: boolean;
}

type QueryType = 'timeseries' | 'table' | 'logs';

interface TimeSeriesQuery extends Query<'timeseries'> {
  expr: string;
  legendFormat?: string;
  interval?: string;
}

interface TableQuery extends Query<'table'> {
  rawSql: string;
  format: 'table' | 'time_series';
}

// Type guards for runtime type checking
function isTimeSeriesQuery(query: Query): query is TimeSeriesQuery {
  return query.queryType === 'timeseries';
}

function isTableQuery(query: Query): query is TableQuery {
  return query.queryType === 'table';
}

// Utility types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Example usage
function processQuery(query: Query): void {
  if (isTimeSeriesQuery(query)) {
    console.log('Processing time series:', query.expr);
  } else if (isTableQuery(query)) {
    console.log('Processing table query:', query.rawSql);
  }
}
```

### React Patterns for Grafana Plugins

React is the UI framework for Grafana plugin development.

```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAsync } from 'react-use';
import { SelectableValue } from '@grafana/data';
import { Select, InlineField, Input, Button } from '@grafana/ui';

// Custom hook for data fetching
function useMetrics(datasource: DataSource) {
  const [metrics, setMetrics] = useState<SelectableValue<string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await datasource.getMetrics();
      setMetrics(result.map(m => ({ label: m, value: m })));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [datasource]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

// Query editor component with hooks
interface QueryEditorProps {
  query: TimeSeriesQuery;
  onChange: (query: TimeSeriesQuery) => void;
  onRunQuery: () => void;
  datasource: DataSource;
}

export function QueryEditor({ query, onChange, onRunQuery, datasource }: QueryEditorProps) {
  const { metrics, loading, error } = useMetrics(datasource);
  
  // Memoize expensive computations
  const filteredMetrics = useMemo(() => {
    if (!query.expr) return metrics;
    return metrics.filter(m => 
      m.label?.toLowerCase().includes(query.expr.toLowerCase())
    );
  }, [metrics, query.expr]);

  // Debounced query execution
  const debouncedRunQuery = useMemo(
    () => debounce(onRunQuery, 500),
    [onRunQuery]
  );

  const handleExprChange = useCallback((value: string) => {
    onChange({ ...query, expr: value });
    debouncedRunQuery();
  }, [query, onChange, debouncedRunQuery]);

  const handleMetricSelect = useCallback((selected: SelectableValue<string>) => {
    if (selected.value) {
      onChange({ ...query, expr: selected.value });
      onRunQuery();
    }
  }, [query, onChange, onRunQuery]);

  if (error) {
    return <div className="alert alert-error">Failed to load metrics: {error.message}</div>;
  }

  return (
    <div className="gf-form-group">
      <InlineField label="Metric" labelWidth={12}>
        <Select
          options={filteredMetrics}
          value={query.expr}
          onChange={handleMetricSelect}
          isLoading={loading}
          isClearable
          placeholder="Select metric..."
          width={40}
        />
      </InlineField>
      
      <InlineField label="Expression" labelWidth={12}>
        <Input
          value={query.expr}
          onChange={(e) => handleExprChange(e.currentTarget.value)}
          placeholder="Enter PromQL expression..."
          width={60}
        />
      </InlineField>
      
      <InlineField label="Legend" labelWidth={12}>
        <Input
          value={query.legendFormat || ''}
          onChange={(e) => onChange({ ...query, legendFormat: e.currentTarget.value })}
          placeholder="{{label}}"
          width={30}
        />
      </InlineField>
    </div>
  );
}

// Utility function
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}
```


### Redux State Management

Redux provides predictable state management for complex plugin applications.

```typescript
import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// State types
interface QueryState {
  queries: Record<string, Query>;
  activeQueryId: string | null;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  results: Record<string, QueryResult>;
}

interface QueryResult {
  frames: DataFrame[];
  executedAt: number;
  duration: number;
}

// Initial state
const initialState: QueryState = {
  queries: {},
  activeQueryId: null,
  loading: {},
  errors: {},
  results: {},
};

// Slice with reducers
const querySlice = createSlice({
  name: 'queries',
  initialState,
  reducers: {
    addQuery: (state, action: PayloadAction<Query>) => {
      state.queries[action.payload.refId] = action.payload;
    },
    updateQuery: (state, action: PayloadAction<{ refId: string; updates: Partial<Query> }>) => {
      const { refId, updates } = action.payload;
      if (state.queries[refId]) {
        state.queries[refId] = { ...state.queries[refId], ...updates };
      }
    },
    removeQuery: (state, action: PayloadAction<string>) => {
      delete state.queries[action.payload];
      delete state.loading[action.payload];
      delete state.errors[action.payload];
      delete state.results[action.payload];
    },
    setActiveQuery: (state, action: PayloadAction<string | null>) => {
      state.activeQueryId = action.payload;
    },
    queryStarted: (state, action: PayloadAction<string>) => {
      state.loading[action.payload] = true;
      delete state.errors[action.payload];
    },
    querySucceeded: (state, action: PayloadAction<{ refId: string; result: QueryResult }>) => {
      const { refId, result } = action.payload;
      state.loading[refId] = false;
      state.results[refId] = result;
    },
    queryFailed: (state, action: PayloadAction<{ refId: string; error: string }>) => {
      const { refId, error } = action.payload;
      state.loading[refId] = false;
      state.errors[refId] = error;
    },
  },
});

// Export actions
export const {
  addQuery,
  updateQuery,
  removeQuery,
  setActiveQuery,
  queryStarted,
  querySucceeded,
  queryFailed,
} = querySlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    queries: querySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredPaths: ['queries.results'],
      },
    }),
});

// Type exports
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export const selectAllQueries = (state: RootState) => Object.values(state.queries.queries);
export const selectQueryById = (refId: string) => (state: RootState) => state.queries.queries[refId];
export const selectActiveQuery = (state: RootState) => 
  state.queries.activeQueryId ? state.queries.queries[state.queries.activeQueryId] : null;
export const selectQueryLoading = (refId: string) => (state: RootState) => state.queries.loading[refId] ?? false;
export const selectQueryError = (refId: string) => (state: RootState) => state.queries.errors[refId];
export const selectQueryResult = (refId: string) => (state: RootState) => state.queries.results[refId];

// Async thunk for query execution
import { createAsyncThunk } from '@reduxjs/toolkit';

export const executeQuery = createAsyncThunk(
  'queries/execute',
  async ({ refId, datasource }: { refId: string; datasource: DataSource }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const query = state.queries.queries[refId];
    
    if (!query) {
      throw new Error(`Query ${refId} not found`);
    }

    dispatch(queryStarted(refId));
    
    const startTime = Date.now();
    try {
      const result = await datasource.query({ targets: [query] });
      const duration = Date.now() - startTime;
      
      dispatch(querySucceeded({
        refId,
        result: {
          frames: result.data,
          executedAt: startTime,
          duration,
        },
      }));
      
      return result;
    } catch (error) {
      dispatch(queryFailed({
        refId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      throw error;
    }
  }
);
```

### RxJS for Reactive Data Handling

RxJS enables reactive programming patterns for handling asynchronous data streams.

```typescript
import { Observable, Subject, BehaviorSubject, combineLatest, timer } from 'rxjs';
import { 
  map, 
  filter, 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  catchError, 
  retry,
  shareReplay,
  takeUntil,
  tap
} from 'rxjs/operators';

// Query service using RxJS
class QueryService {
  private destroy$ = new Subject<void>();
  private querySubject = new BehaviorSubject<Query | null>(null);
  private refreshInterval$ = new BehaviorSubject<number>(0);

  // Observable of query results
  results$: Observable<QueryResult>;

  constructor(private datasource: DataSource) {
    this.results$ = combineLatest([
      this.querySubject.pipe(filter((q): q is Query => q !== null)),
      this.refreshInterval$,
    ]).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      ),
      switchMap(([query, interval]) => {
        const execute$ = this.executeQuery(query);
        
        if (interval > 0) {
          // Auto-refresh at specified interval
          return timer(0, interval).pipe(
            switchMap(() => execute$)
          );
        }
        
        return execute$;
      }),
      shareReplay(1),
      takeUntil(this.destroy$),
    );
  }

  private executeQuery(query: Query): Observable<QueryResult> {
    return new Observable<QueryResult>(subscriber => {
      const startTime = Date.now();
      
      this.datasource.query({ targets: [query] })
        .then(result => {
          subscriber.next({
            frames: result.data,
            executedAt: startTime,
            duration: Date.now() - startTime,
          });
          subscriber.complete();
        })
        .catch(error => subscriber.error(error));
    }).pipe(
      retry({ count: 3, delay: 1000 }),
      catchError(error => {
        console.error('Query failed:', error);
        throw error;
      }),
    );
  }

  setQuery(query: Query): void {
    this.querySubject.next(query);
  }

  setRefreshInterval(ms: number): void {
    this.refreshInterval$.next(ms);
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Streaming data handler
class StreamingDataHandler {
  private data$ = new Subject<DataPoint>();
  private buffer: DataPoint[] = [];
  private maxBufferSize = 1000;

  // Aggregated data stream
  aggregated$: Observable<AggregatedData>;

  constructor() {
    this.aggregated$ = this.data$.pipe(
      tap(point => this.addToBuffer(point)),
      debounceTime(100),
      map(() => this.calculateAggregates()),
      shareReplay(1),
    );
  }

  push(point: DataPoint): void {
    this.data$.next(point);
  }

  private addToBuffer(point: DataPoint): void {
    this.buffer.push(point);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize);
    }
  }

  private calculateAggregates(): AggregatedData {
    if (this.buffer.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = this.buffer.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}

interface DataPoint {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

interface AggregatedData {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

// React hook for RxJS integration
function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable$.subscribe({
      next: setValue,
      error: console.error,
    });

    return () => subscription.unsubscribe();
  }, [observable$]);

  return value;
}
```


---

## Practical Exercises

Apply your advanced knowledge with these hands-on exercises.

### Exercise 1: Build a Streaming Data Source Plugin

**Objective**: Create a data source plugin that streams real-time data.

**Requirements**:
1. Implement `StreamHandler` interface
2. Support configurable update intervals
3. Handle backpressure when clients can't keep up
4. Include proper error handling and reconnection logic

**Starter Code**:
```go
package plugin

// Implement a streaming data source that:
// 1. Connects to a WebSocket endpoint
// 2. Transforms incoming messages to Grafana data frames
// 3. Handles connection drops with exponential backoff
// 4. Supports multiple concurrent subscribers

type StreamingDatasource struct {
    // Your implementation
}

// Implement these methods:
// - SubscribeStream
// - RunStream
// - PublishStream (optional)
```

### Exercise 2: Implement Query Result Caching

**Objective**: Build a caching layer with intelligent invalidation.

**Requirements**:
1. LRU eviction policy
2. TTL-based expiration
3. Cache key generation based on query parameters
4. Metrics for cache hit/miss rates
5. Support for cache warming

**Evaluation Criteria**:
- Thread safety
- Memory efficiency
- Cache hit rate > 80% for repeated queries
- Proper handling of time-range queries

### Exercise 3: Multi-Database Query Federation

**Objective**: Create a plugin that queries multiple databases and combines results.

**Requirements**:
1. Support Prometheus, MySQL, and PostgreSQL backends
2. Execute queries in parallel
3. Merge results into unified data frames
4. Handle partial failures gracefully
5. Implement query cost estimation

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FEDERATED QUERY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │   Grafana   │                                                                │
│  │   Query     │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      Federation Plugin                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │    │
│  │  │  Prometheus │  │    MySQL    │  │  PostgreSQL │                     │    │
│  │  │   Client    │  │   Client    │  │   Client    │                     │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │    │
│  │         │                │                │                             │    │
│  │         └────────────────┼────────────────┘                             │    │
│  │                          ▼                                              │    │
│  │                   Result Merger                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Exercise 4: Performance Profiling and Optimization

**Objective**: Profile and optimize a slow data source plugin.

**Scenario**: A plugin is experiencing:
- High memory usage during large queries
- Slow response times for complex aggregations
- Connection pool exhaustion under load

**Tasks**:
1. Use pprof to identify bottlenecks
2. Implement streaming result processing
3. Add connection pool monitoring
4. Optimize JSON serialization
5. Add query result pagination

**Profiling Commands**:
```bash
# CPU profiling
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Memory profiling
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine analysis
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Block profiling (contention)
go tool pprof http://localhost:6060/debug/pprof/block
```

### Exercise 5: Observability Integration

**Objective**: Add comprehensive observability to an existing plugin.

**Requirements**:
1. Prometheus metrics for:
   - Query latency histogram
   - Error rates by type
   - Connection pool utilization
   - Cache hit/miss rates

2. Distributed tracing with:
   - Span per query
   - Backend call spans
   - Error recording
   - Baggage propagation

3. Structured logging with:
   - Trace correlation
   - Query context
   - Performance metrics

**Deliverables**:
- Grafana dashboard for plugin monitoring
- Alert rules for error rates and latency
- Runbook for common issues

---

## Summary

This advanced guide covered:

1. **Complex Plugin Architectures**: Streaming data, multi-tenant isolation, and state management
2. **Performance Optimization**: Caching, parallel execution, memory management, and rate limiting
3. **Observability Integration**: Metrics, tracing, and structured logging
4. **Data Source Deep Dives**: Prometheus, Loki, MySQL, PostgreSQL, and BigQuery integration patterns
5. **Frontend Technologies**: TypeScript, React, Redux, and RxJS for plugin development

### Key Takeaways

- **Design for scale**: Consider multi-tenancy, connection pooling, and resource limits from the start
- **Optimize strategically**: Profile before optimizing, cache intelligently, and process data in streams
- **Instrument everything**: Metrics, traces, and logs are essential for production debugging
- **Understand your data sources**: Each backend has unique optimization patterns and best practices
- **Full-stack awareness**: Backend engineers benefit from understanding frontend patterns

### Next Steps

1. Review the [Questions and Answers](./questions/questions-and-answers.md) for interview preparation
2. Practice with the [Code Implementations](../../code-implementations/) examples
3. Explore the [Grafana Plugin SDK documentation](https://grafana.com/docs/grafana/latest/developers/plugins/)
4. Contribute to Grafana OSS projects on GitHub

> **Cross-Reference**: For foundational concepts, review [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md) and [LGTM Stack](../../shared-concepts/lgtm-stack.md)
