# Technical Interview Questions and Answers

## Staff Backend Engineer - Grafana Databases, Loki Ingest

This document contains 15 technical interview questions with comprehensive senior-level answers. Questions cover Go programming, distributed systems, Loki architecture, Kafka, Kubernetes, and SRE practices.

---

## Question 1: Design a Distributed Log Ingestion Pipeline

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a distributed log ingestion pipeline that can handle 10 million log lines per second from thousands of microservices. The system should support:
- Multi-tenancy with isolation
- At-least-once delivery guarantees
- Query latency under 100ms for recent logs
- Cost-effective long-term storage

Walk through your architecture, component choices, and how you would handle failure scenarios.

### Answer

**High-Level Architecture:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Log Sources   │────▶│   Kafka Cluster │────▶│    Ingesters    │
│  (Microservices)│     │   (Buffering)   │     │  (Processing)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
                ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
                │  Index Store  │              │  Chunk Store  │              │  Query Layer  │
                │  (BoltDB/     │              │  (S3/GCS)     │              │  (Queriers)   │
                │   Cassandra)  │              │               │              │               │
                └───────────────┘              └───────────────┘              └───────────────┘
```

**Component Design:**

1. **Collection Layer (Agents)**

```go
// Agent configuration for multi-tenant log collection
type AgentConfig struct {
    TenantID       string
    BatchSize      int           // 1MB default
    FlushInterval  time.Duration // 1 second
    RetryConfig    RetryConfig
    Compression    string        // snappy, gzip
}

func (a *Agent) pushLogs(ctx context.Context, entries []LogEntry) error {
    batch := a.createBatch(entries)
    
    return retry.Do(ctx, a.config.RetryConfig, func() error {
        return a.client.Push(ctx, batch)
    })
}
```

2. **Buffering Layer (Kafka)**
- Partition by tenant ID for isolation
- Replication factor of 3 for durability
- Retention of 24-48 hours for replay capability

3. **Ingestion Layer**
```go
type Ingester struct {
    streams    map[string]*Stream  // tenant -> stream
    chunks     *ChunkStore
    index      *IndexStore
    flushQueue chan *Chunk
}

func (i *Ingester) Push(ctx context.Context, req *PushRequest) error {
    tenant := tenant.ExtractTenantID(ctx)
    
    stream, err := i.getOrCreateStream(tenant, req.Labels)
    if err != nil {
        return err
    }
    
    for _, entry := range req.Entries {
        if err := stream.Append(entry); err != nil {
            return err
        }
    }
    
    // Check if chunk needs flushing
    if stream.ShouldFlush() {
        i.flushQueue <- stream.CurrentChunk()
    }
    
    return nil
}
```

**Failure Handling:**

- **Ingester failure**: Use a hash ring with replication factor 3. When an ingester fails, its tokens are redistributed, and WAL replay recovers in-flight data.
- **Kafka failure**: Producers buffer locally and retry. Consumer groups rebalance automatically.
- **Storage failure**: Retry with exponential backoff. Use multiple availability zones.

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| Push-based (Loki) | Lower latency, simpler agents | Requires backpressure handling |
| Pull-based (Prometheus) | Natural rate limiting | Higher latency, complex discovery |
| Hybrid | Best of both | Operational complexity |

**Scaling Considerations:**
- Horizontal scaling of ingesters based on write throughput
- Separate read and write paths for independent scaling
- Use consistent hashing for even distribution

---

## Question 2: Implement a Concurrent Rate Limiter in Go

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a thread-safe rate limiter in Go that supports:
- Token bucket algorithm
- Configurable rate and burst size
- Multiple concurrent callers
- Graceful handling of burst traffic

### Answer

```go
package ratelimit

import (
    "context"
    "sync"
    "time"
)

// TokenBucket implements a thread-safe token bucket rate limiter
type TokenBucket struct {
    mu         sync.Mutex
    tokens     float64
    maxTokens  float64
    refillRate float64 // tokens per second
    lastRefill time.Time
}

// NewTokenBucket creates a new rate limiter
// rate: tokens per second, burst: maximum tokens
func NewTokenBucket(rate float64, burst int) *TokenBucket {
    return &TokenBucket{
        tokens:     float64(burst),
        maxTokens:  float64(burst),
        refillRate: rate,
        lastRefill: time.Now(),
    }
}

// Allow checks if n tokens are available, consuming them if so
func (tb *TokenBucket) Allow(n int) bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()
    
    tb.refill()
    
    if tb.tokens >= float64(n) {
        tb.tokens -= float64(n)
        return true
    }
    return false
}

// Wait blocks until n tokens are available or context is cancelled
func (tb *TokenBucket) Wait(ctx context.Context, n int) error {
    for {
        tb.mu.Lock()
        tb.refill()
        
        if tb.tokens >= float64(n) {
            tb.tokens -= float64(n)
            tb.mu.Unlock()
            return nil
        }
        
        // Calculate wait time
        needed := float64(n) - tb.tokens
        waitDuration := time.Duration(needed/tb.refillRate*float64(time.Second))
        tb.mu.Unlock()
        
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(waitDuration):
            // Continue to try again
        }
    }
}

func (tb *TokenBucket) refill() {
    now := time.Now()
    elapsed := now.Sub(tb.lastRefill).Seconds()
    tb.tokens = min(tb.maxTokens, tb.tokens+elapsed*tb.refillRate)
    tb.lastRefill = now
}

func min(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}
```

**Usage Example:**

```go
func main() {
    // 100 requests per second, burst of 10
    limiter := NewTokenBucket(100, 10)
    
    // Non-blocking check
    if limiter.Allow(1) {
        processRequest()
    } else {
        return errors.New("rate limited")
    }
    
    // Blocking wait with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := limiter.Wait(ctx, 1); err != nil {
        return fmt.Errorf("rate limit wait failed: %w", err)
    }
    processRequest()
}
```

**Trade-offs and Alternatives:**

| Algorithm | Use Case | Pros | Cons |
|-----------|----------|------|------|
| Token Bucket | Bursty traffic | Allows bursts, smooth rate | Memory for tokens |
| Leaky Bucket | Strict rate | Constant output rate | No burst handling |
| Sliding Window | API rate limiting | Accurate counting | Higher memory |
| Fixed Window | Simple limiting | Low overhead | Boundary burst issues |

**Production Considerations:**
- Use `golang.org/x/time/rate` for production (battle-tested)
- Consider distributed rate limiting with Redis for multi-instance deployments
- Add metrics for rate limit hits/misses

---

## Question 3: Loki Ingester Scaling Strategy

**Difficulty**: Advanced  
**Category**: Architecture

### Question

You're operating Loki at scale and notice that ingesters are becoming a bottleneck. Describe your approach to scaling the ingester tier, including:
- How you would diagnose the bottleneck
- Scaling strategies (vertical vs horizontal)
- Data distribution and rebalancing
- Impact on query performance

### Answer

**Diagnosing the Bottleneck:**

1. **Key Metrics to Monitor:**
```promql
# Ingester memory pressure
sum(container_memory_working_set_bytes{container="ingester"}) 
  / sum(container_spec_memory_limit_bytes{container="ingester"})

# Write latency
histogram_quantile(0.99, 
  sum(rate(loki_request_duration_seconds_bucket{route="push"}[5m])) by (le))

# Chunk flush rate
sum(rate(loki_ingester_chunks_flushed_total[5m]))

# Stream count per ingester
max(loki_ingester_memory_streams)
```

2. **Common Bottleneck Indicators:**
- High memory utilization (>80%)
- Increasing write latency (p99 > 500ms)
- Chunk flush queue backing up
- Uneven stream distribution

**Scaling Strategies:**

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| Vertical | Quick fix, memory-bound | Increase pod resources |
| Horizontal | Sustained growth | Add more ingester replicas |
| Sharding | High cardinality | Partition by tenant/labels |

**Horizontal Scaling Process:**

```yaml
# Kubernetes StatefulSet scaling
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki-ingester
spec:
  replicas: 10  # Increase from current
  podManagementPolicy: Parallel  # Faster scaling
  template:
    spec:
      containers:
      - name: ingester
        resources:
          requests:
            memory: "8Gi"
            cpu: "2"
          limits:
            memory: "16Gi"
            cpu: "4"
```

**Hash Ring Rebalancing:**

```go
// Loki uses consistent hashing for stream distribution
type Ring struct {
    members    []Member
    replication int
}

// When adding new ingesters:
// 1. New ingester joins ring with virtual tokens
// 2. Streams are gradually migrated based on token ownership
// 3. Old chunks are flushed before handoff

func (r *Ring) AddMember(m Member) {
    // Generate virtual tokens for even distribution
    tokens := r.generateTokens(m, 512)
    
    // Register with ring
    r.members = append(r.members, m)
    
    // Trigger rebalance - affected streams will be
    // redirected to new owner on next write
}
```

**Query Performance Impact:**

During scaling:
- Queries may need to hit more ingesters (fan-out increases)
- In-memory data is distributed across more nodes
- Mitigation: Use query-frontend for caching and parallelization

**Best Practices:**
1. Scale proactively based on growth trends
2. Use pod disruption budgets to prevent simultaneous restarts
3. Monitor ring health during scaling operations
4. Consider time-of-day patterns for scaling decisions

---

## Question 4: Debug High Latency in Log Queries

**Difficulty**: Advanced  
**Category**: Troubleshooting

### Question

Users report that log queries are taking 30+ seconds when they previously completed in under 5 seconds. Walk through your systematic debugging approach, including:
- Initial triage steps
- Metrics and logs to examine
- Common root causes
- Resolution strategies

### Answer

**Systematic Debugging Approach:**

**Step 1: Characterize the Problem**
```bash
# Check if it's all queries or specific patterns
# Look at query frontend metrics
curl -s localhost:3100/metrics | grep loki_query

# Identify slow query patterns
grep "level=warn" /var/log/loki/query-frontend.log | \
  grep "slow query" | \
  jq -r '.query'
```

**Step 2: Examine Key Metrics**
```promql
# Query latency by route
histogram_quantile(0.99,
  sum(rate(loki_request_duration_seconds_bucket[5m])) by (le, route))

# Chunk download time
histogram_quantile(0.99,
  sum(rate(loki_chunk_store_fetched_chunk_bytes_bucket[5m])) by (le))

# Index lookup time
histogram_quantile(0.99,
  sum(rate(loki_index_request_duration_seconds_bucket[5m])) by (le, operation))

# Querier queue depth
sum(loki_query_scheduler_queue_length)
```

**Step 3: Common Root Causes and Solutions**

| Root Cause | Indicators | Solution |
|------------|------------|----------|
| High cardinality labels | Many unique streams, high index size | Review label usage, add limits |
| Large time ranges | Query spans weeks/months | Add query limits, educate users |
| Missing indexes | Full table scans | Verify index configuration |
| Storage throttling | High S3/GCS latency | Check cloud provider limits |
| Insufficient queriers | Queue depth growing | Scale querier tier |
| Memory pressure | OOM kills, GC pauses | Increase resources, tune GC |

**Step 4: Deep Dive Investigation**

```go
// Enable query tracing for detailed breakdown
// Add to query: X-Query-Tags: trace=true

type QueryTrace struct {
    TotalTime      time.Duration
    IndexLookup    time.Duration
    ChunkDownload  time.Duration
    ChunkDecode    time.Duration
    Processing     time.Duration
}

// Example trace output:
// total=32s index=500ms download=28s decode=2s process=1.5s
// This indicates storage/network is the bottleneck
```

**Step 5: Resolution Strategies**

```yaml
# 1. Add query limits to prevent expensive queries
limits_config:
  max_query_length: 720h
  max_query_parallelism: 32
  max_entries_limit_per_query: 10000
  
# 2. Enable caching
query_range:
  cache_results: true
  results_cache:
    cache:
      memcached:
        addresses: "memcached:11211"
        
# 3. Optimize chunk size for query patterns
chunk_store_config:
  chunk_cache_config:
    memcached:
      addresses: "memcached:11211"
```

**Prevention:**
- Set up alerting on query latency percentiles
- Implement query cost estimation and rejection
- Regular review of high-cardinality labels
- Capacity planning based on query patterns

---

## Question 5: Go Channel Patterns for Fan-Out/Fan-In

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a fan-out/fan-in pattern in Go that:
- Distributes work across multiple workers
- Collects results from all workers
- Handles worker failures gracefully
- Supports cancellation via context

### Answer

```go
package fanout

import (
    "context"
    "sync"
)

// Result wraps a value or error from processing
type Result[T any] struct {
    Value T
    Err   error
}

// FanOut distributes items across numWorkers goroutines
// and collects results using fan-in pattern
func FanOut[T, R any](
    ctx context.Context,
    items []T,
    numWorkers int,
    process func(context.Context, T) (R, error),
) []Result[R] {
    // Input channel for distributing work
    inputCh := make(chan T, len(items))
    
    // Output channel for collecting results
    resultCh := make(chan Result[R], len(items))
    
    // WaitGroup to track worker completion
    var wg sync.WaitGroup
    
    // Start workers (fan-out)
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            worker(ctx, inputCh, resultCh, process)
        }()
    }
    
    // Send items to workers
    go func() {
        defer close(inputCh)
        for _, item := range items {
            select {
            case inputCh <- item:
            case <-ctx.Done():
                return
            }
        }
    }()
    
    // Close result channel when all workers done (fan-in)
    go func() {
        wg.Wait()
        close(resultCh)
    }()
    
    // Collect results
    results := make([]Result[R], 0, len(items))
    for result := range resultCh {
        results = append(results, result)
    }
    
    return results
}

func worker[T, R any](
    ctx context.Context,
    input <-chan T,
    output chan<- Result[R],
    process func(context.Context, T) (R, error),
) {
    for item := range input {
        select {
        case <-ctx.Done():
            return
        default:
            value, err := process(ctx, item)
            output <- Result[R]{Value: value, Err: err}
        }
    }
}
```

**Usage Example:**

```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    urls := []string{
        "https://api.example.com/1",
        "https://api.example.com/2",
        "https://api.example.com/3",
    }
    
    results := FanOut(ctx, urls, 3, func(ctx context.Context, url string) (Response, error) {
        return fetchURL(ctx, url)
    })
    
    for _, r := range results {
        if r.Err != nil {
            log.Printf("Error: %v", r.Err)
            continue
        }
        log.Printf("Success: %v", r.Value)
    }
}
```

**Key Design Decisions:**

1. **Buffered channels**: Prevent goroutine leaks if consumer is slow
2. **Context propagation**: Enable cancellation at any level
3. **Generic types**: Reusable for any input/output types
4. **Error wrapping**: Each result carries its own error

**Alternative Patterns:**

| Pattern | Use Case |
|---------|----------|
| errgroup | Stop on first error |
| Semaphore | Limit concurrent operations |
| Pipeline | Multi-stage processing |
| Worker pool | Long-lived workers |

---

## Question 6: Kafka Consumer Group Rebalancing

**Difficulty**: Advanced  
**Category**: Architecture

### Question

Explain Kafka consumer group rebalancing in detail. How would you minimize rebalancing impact in a high-throughput log ingestion system? Discuss:
- Rebalancing triggers and process
- Impact on message processing
- Strategies to minimize disruption
- Configuration tuning

### Answer

**Rebalancing Process:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Consumer Group Rebalance                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Trigger Event (member join/leave, topic change)             │
│  2. All consumers stop fetching                                  │
│  3. Group coordinator initiates rebalance                        │
│  4. Consumers send JoinGroup request                             │
│  5. Leader assigns partitions (range/round-robin/sticky)         │
│  6. Consumers send SyncGroup request                             │
│  7. Consumers receive assignments and resume                     │
└─────────────────────────────────────────────────────────────────┘
```

**Rebalancing Triggers:**

| Trigger | Cause | Mitigation |
|---------|-------|------------|
| Consumer join | New instance started | Gradual rollout |
| Consumer leave | Crash, shutdown | Graceful shutdown |
| Heartbeat timeout | Network issues, GC pause | Tune session.timeout.ms |
| Subscription change | Topic regex match | Avoid regex subscriptions |

**Impact on Log Ingestion:**

```go
// During rebalance, processing stops
type Consumer struct {
    client    sarama.ConsumerGroup
    handler   ConsumerHandler
    metrics   *Metrics
}

type ConsumerHandler struct {
    ready chan bool
}

func (h *ConsumerHandler) Setup(session sarama.ConsumerGroupSession) error {
    // Called at start of rebalance - prepare for new assignment
    h.metrics.RebalanceStart()
    close(h.ready)
    return nil
}

func (h *ConsumerHandler) Cleanup(session sarama.ConsumerGroupSession) error {
    // Called at end of session - commit offsets, flush buffers
    h.metrics.RebalanceEnd()
    return h.flushPendingWrites()
}
```

**Minimizing Disruption:**

1. **Use Cooperative Sticky Assignor:**
```go
config := sarama.NewConfig()
config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategySticky
config.Consumer.Group.Rebalance.GroupStrategies = []sarama.BalanceStrategy{
    sarama.BalanceStrategyCooperativeSticky,
}
```

2. **Tune Timeouts:**
```go
config.Consumer.Group.Session.Timeout = 30 * time.Second
config.Consumer.Group.Heartbeat.Interval = 10 * time.Second
config.Consumer.Group.Rebalance.Timeout = 60 * time.Second
```

3. **Static Membership:**
```go
// Assign static member IDs to prevent unnecessary rebalances
config.Consumer.Group.Member.UserData = []byte(instanceID)
config.Consumer.Group.InstanceId = instanceID
```

**Configuration Recommendations:**

| Parameter | Default | Recommended | Reason |
|-----------|---------|-------------|--------|
| session.timeout.ms | 10000 | 30000 | Allow for GC pauses |
| heartbeat.interval.ms | 3000 | 10000 | 1/3 of session timeout |
| max.poll.interval.ms | 300000 | 600000 | Allow for slow processing |
| partition.assignment.strategy | range | cooperative-sticky | Incremental rebalance |

---

## Question 7: Design Multi-Tenant Log Storage

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a multi-tenant log storage system that provides:
- Strong isolation between tenants
- Fair resource allocation
- Cost attribution per tenant
- Efficient storage utilization

How would you handle a "noisy neighbor" scenario?

### Answer

**Architecture Overview:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Multi-Tenant Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Tenant A   │    │   Tenant B   │    │   Tenant C   │       │
│  │   Limits:    │    │   Limits:    │    │   Limits:    │       │
│  │   10MB/s     │    │   50MB/s     │    │   100MB/s    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Rate Limiter / Admission Control            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌────────────┐       ┌────────────┐       ┌────────────┐       │
│  │ Ingester 1 │       │ Ingester 2 │       │ Ingester 3 │       │
│  └────────────┘       └────────────┘       └────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Object Storage (S3/GCS) with Prefixes          │    │
│  │   /tenant-a/chunks/    /tenant-b/chunks/    ...          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tenant Isolation Implementation:**

```go
// Per-tenant limits configuration
type TenantLimits struct {
    IngestionRateMB     float64       `yaml:"ingestion_rate_mb"`
    IngestionBurstMB    float64       `yaml:"ingestion_burst_mb"`
    MaxStreamsPerUser   int           `yaml:"max_streams_per_user"`
    MaxLabelNameLength  int           `yaml:"max_label_name_length"`
    MaxLabelValueLength int           `yaml:"max_label_value_length"`
    MaxQueryParallelism int           `yaml:"max_query_parallelism"`
    QueryTimeout        time.Duration `yaml:"query_timeout"`
}

// Tenant-aware rate limiter
type TenantRateLimiter struct {
    limiters map[string]*rate.Limiter
    defaults TenantLimits
    overrides map[string]TenantLimits
    mu       sync.RWMutex
}

func (t *TenantRateLimiter) Allow(tenantID string, bytes int) bool {
    t.mu.RLock()
    limiter, exists := t.limiters[tenantID]
    t.mu.RUnlock()
    
    if !exists {
        limiter = t.createLimiter(tenantID)
    }
    
    return limiter.AllowN(time.Now(), bytes)
}

func (t *TenantRateLimiter) createLimiter(tenantID string) *rate.Limiter {
    limits := t.getLimits(tenantID)
    
    t.mu.Lock()
    defer t.mu.Unlock()
    
    limiter := rate.NewLimiter(
        rate.Limit(limits.IngestionRateMB*1024*1024),
        int(limits.IngestionBurstMB*1024*1024),
    )
    t.limiters[tenantID] = limiter
    return limiter
}
```

**Cost Attribution:**

```go
// Track usage per tenant for billing
type UsageTracker struct {
    store UsageStore
}

type TenantUsage struct {
    TenantID       string
    BytesIngested  int64
    BytesStored    int64
    QueriesRun     int64
    QueryBytesRead int64
    Period         time.Time
}

func (u *UsageTracker) RecordIngestion(tenantID string, bytes int64) {
    u.store.Increment(tenantID, "bytes_ingested", bytes)
}

func (u *UsageTracker) GetMonthlyBill(tenantID string) (*Bill, error) {
    usage, err := u.store.GetUsage(tenantID, currentMonth())
    if err != nil {
        return nil, err
    }
    
    return &Bill{
        IngestionCost: float64(usage.BytesIngested) * pricePerGB / GB,
        StorageCost:   float64(usage.BytesStored) * storagePerGBMonth / GB,
        QueryCost:     float64(usage.QueryBytesRead) * queryPricePerGB / GB,
    }, nil
}
```

**Noisy Neighbor Mitigation:**

| Strategy | Implementation | Trade-off |
|----------|----------------|-----------|
| Rate limiting | Per-tenant token buckets | May drop legitimate traffic |
| Request queuing | Priority queues per tenant | Added latency |
| Resource quotas | K8s resource quotas | Operational complexity |
| Dedicated pools | Separate ingester pools | Higher cost |

```yaml
# Loki configuration for noisy neighbor protection
limits_config:
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  max_streams_per_user: 10000
  max_global_streams_per_user: 50000
  max_query_parallelism: 16
  
overrides:
  tenant-premium:
    ingestion_rate_mb: 100
    max_query_parallelism: 64
```

---

## Question 8: Implement Circuit Breaker Pattern

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a circuit breaker pattern in Go that:
- Tracks failure rates over a sliding window
- Transitions between closed, open, and half-open states
- Supports configurable thresholds
- Is thread-safe for concurrent use

### Answer

```go
package circuitbreaker

import (
    "context"
    "errors"
    "sync"
    "time"
)

var (
    ErrCircuitOpen = errors.New("circuit breaker is open")
)

type State int

const (
    StateClosed State = iota
    StateOpen
    StateHalfOpen
)

type CircuitBreaker struct {
    mu              sync.RWMutex
    state           State
    failures        int
    successes       int
    lastFailure     time.Time
    
    // Configuration
    failureThreshold int
    successThreshold int
    timeout          time.Duration
    
    // Metrics
    onStateChange    func(from, to State)
}

type Config struct {
    FailureThreshold int           // Failures before opening
    SuccessThreshold int           // Successes in half-open to close
    Timeout          time.Duration // Time before half-open
    OnStateChange    func(from, to State)
}

func New(cfg Config) *CircuitBreaker {
    return &CircuitBreaker{
        state:            StateClosed,
        failureThreshold: cfg.FailureThreshold,
        successThreshold: cfg.SuccessThreshold,
        timeout:          cfg.Timeout,
        onStateChange:    cfg.OnStateChange,
    }
}

func (cb *CircuitBreaker) Execute(ctx context.Context, fn func() error) error {
    if !cb.allowRequest() {
        return ErrCircuitOpen
    }
    
    err := fn()
    cb.recordResult(err)
    return err
}

func (cb *CircuitBreaker) allowRequest() bool {
    cb.mu.RLock()
    state := cb.state
    lastFailure := cb.lastFailure
    cb.mu.RUnlock()
    
    switch state {
    case StateClosed:
        return true
    case StateOpen:
        // Check if timeout has passed
        if time.Since(lastFailure) > cb.timeout {
            cb.transitionTo(StateHalfOpen)
            return true
        }
        return false
    case StateHalfOpen:
        return true
    }
    return false
}

func (cb *CircuitBreaker) recordResult(err error) {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if err != nil {
        cb.failures++
        cb.successes = 0
        cb.lastFailure = time.Now()
        
        if cb.state == StateClosed && cb.failures >= cb.failureThreshold {
            cb.setState(StateOpen)
        } else if cb.state == StateHalfOpen {
            cb.setState(StateOpen)
        }
    } else {
        cb.successes++
        
        if cb.state == StateHalfOpen && cb.successes >= cb.successThreshold {
            cb.failures = 0
            cb.setState(StateClosed)
        }
    }
}

func (cb *CircuitBreaker) transitionTo(state State) {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    cb.setState(state)
}

func (cb *CircuitBreaker) setState(state State) {
    if cb.state == state {
        return
    }
    old := cb.state
    cb.state = state
    if cb.onStateChange != nil {
        go cb.onStateChange(old, state)
    }
}

func (cb *CircuitBreaker) State() State {
    cb.mu.RLock()
    defer cb.mu.RUnlock()
    return cb.state
}
```

**Usage Example:**

```go
func main() {
    cb := circuitbreaker.New(circuitbreaker.Config{
        FailureThreshold: 5,
        SuccessThreshold: 2,
        Timeout:          30 * time.Second,
        OnStateChange: func(from, to circuitbreaker.State) {
            log.Printf("Circuit breaker: %v -> %v", from, to)
        },
    })
    
    err := cb.Execute(context.Background(), func() error {
        return callExternalService()
    })
    
    if errors.Is(err, circuitbreaker.ErrCircuitOpen) {
        // Use fallback or return cached data
        return getCachedResponse()
    }
}
```

**State Diagram:**

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
    ┌─────────┐  failure >= threshold   ┌─────────┐
    │ CLOSED  │ ───────────────────────▶│  OPEN   │
    └─────────┘                         └─────────┘
         ▲                                    │
         │                                    │ timeout
         │ success >= threshold               │ elapsed
         │                                    ▼
         │                             ┌───────────┐
         └─────────────────────────────│ HALF-OPEN │
                                       └───────────┘
                                             │
                                             │ failure
                                             ▼
                                       ┌─────────┐
                                       │  OPEN   │
                                       └─────────┘
```

**Production Considerations:**
- Use `github.com/sony/gobreaker` for production
- Add metrics for state transitions and failure rates
- Consider per-endpoint circuit breakers
- Implement fallback strategies

---

## Question 9: Incident Response: Ingester OOM

**Difficulty**: Advanced  
**Category**: Scenario-Based

### Question

You receive a PagerDuty alert at 3 AM: "Loki ingester pods are OOMKilled repeatedly." Walk through your incident response process, including:
- Immediate mitigation steps
- Root cause investigation
- Communication with stakeholders
- Post-incident actions

### Answer

**Incident Response Timeline:**

**T+0: Alert Received**
```bash
# Acknowledge alert and start incident channel
# Check current state
kubectl get pods -l app=loki-ingester -w

# Output shows:
# loki-ingester-0   0/1   OOMKilled   5   10m
# loki-ingester-1   0/1   OOMKilled   4   8m
# loki-ingester-2   1/1   Running     0   2m
```

**T+5: Immediate Mitigation**
```bash
# Option 1: Increase memory limits temporarily
kubectl patch statefulset loki-ingester -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"ingester","resources":{"limits":{"memory":"32Gi"}}}]}}}}'

# Option 2: Scale out to distribute load
kubectl scale statefulset loki-ingester --replicas=6

# Option 3: Enable rate limiting if not already
kubectl edit configmap loki-config
# Add: ingestion_rate_mb: 10
```

**T+10: Assess Impact**
```promql
# Check data loss
sum(increase(loki_ingester_wal_replay_failed_total[1h]))

# Check write success rate
sum(rate(loki_request_duration_seconds_count{status_code="200",route="push"}[5m]))
/ sum(rate(loki_request_duration_seconds_count{route="push"}[5m]))

# Check affected tenants
topk(10, sum by (tenant) (rate(loki_distributor_bytes_received_total[5m])))
```

**T+15: Root Cause Investigation**
```bash
# Check memory growth pattern
kubectl top pods -l app=loki-ingester --containers

# Analyze heap profile
kubectl port-forward loki-ingester-2 6060:6060
go tool pprof http://localhost:6060/debug/pprof/heap

# Common findings:
# 1. High cardinality labels causing stream explosion
# 2. Large log lines not being rejected
# 3. Chunk flush backlog
```

**T+30: Communication**
```markdown
## Incident Update - Loki Ingestion Degradation

**Status**: Mitigating
**Impact**: Log ingestion delayed for some tenants
**Start Time**: 03:00 UTC
**Current Actions**: 
- Increased ingester memory limits
- Scaled ingester tier from 3 to 6 replicas
- Investigating root cause

**Next Update**: 04:00 UTC or sooner if status changes
```

**T+60: Stabilization Confirmed**
```bash
# Verify stability
kubectl get pods -l app=loki-ingester
# All pods Running, no restarts in 30 minutes

# Verify write path
curl -s localhost:3100/ready
# ready
```

**Post-Incident Actions:**

| Action | Owner | Timeline |
|--------|-------|----------|
| Write postmortem | On-call engineer | 48 hours |
| Add cardinality alerting | Platform team | 1 week |
| Implement stream limits | Platform team | 2 weeks |
| Review tenant limits | Product team | 1 week |
| Update runbook | On-call engineer | 1 week |

**Postmortem Template:**
```markdown
## Incident: Loki Ingester OOM - 2024-01-15

### Summary
Loki ingesters experienced repeated OOM kills due to a tenant 
deploying a new application with high-cardinality labels.

### Impact
- Duration: 45 minutes
- Data loss: ~2% of logs during incident window
- Affected tenants: 3 (tenant-x, tenant-y, tenant-z)

### Root Cause
Tenant-x deployed application logging with request_id as a label,
creating millions of unique streams.

### Resolution
1. Increased memory limits (temporary)
2. Added per-tenant stream limits
3. Worked with tenant to fix label usage

### Action Items
1. [ ] Add alerting on stream count growth rate
2. [ ] Implement automatic label cardinality detection
3. [ ] Update onboarding docs with label best practices
```

---

## Question 10: CAP Theorem in Log Aggregation

**Difficulty**: Intermediate  
**Category**: Architecture

### Question

Explain how the CAP theorem applies to log aggregation systems like Loki. What trade-offs does Loki make, and how would you adjust these for different use cases?

### Answer

**CAP Theorem Overview:**

```
                    Consistency
                        ▲
                       /│\
                      / │ \
                     /  │  \
                    /   │   \
                   /    │    \
                  /     │     \
                 /      │      \
                /   CA  │  CP   \
               /        │        \
              ──────────┼──────────
             /          │          \
            /     AP    │           \
           /            │            \
          ▼─────────────┴─────────────▼
    Availability              Partition
                              Tolerance
```

**Loki's CAP Position: AP (Availability + Partition Tolerance)**

Loki prioritizes:
- **Availability**: Writes succeed even during partial failures
- **Partition Tolerance**: System continues operating during network splits
- **Eventual Consistency**: Queries may not see most recent data immediately

**How Loki Implements AP:**

```go
// Loki uses replication for availability
type Distributor struct {
    ring           *ring.Ring
    replicationFactor int  // Default: 3
}

func (d *Distributor) Push(ctx context.Context, req *PushRequest) error {
    // Find ingesters responsible for this stream
    ingesters, err := d.ring.Get(streamHash, ring.Write, nil)
    if err != nil {
        return err
    }
    
    // Write to multiple ingesters (quorum write)
    // Success if majority respond
    successCount := 0
    for _, ing := range ingesters {
        if err := ing.Push(ctx, req); err == nil {
            successCount++
        }
    }
    
    // Quorum: need replicationFactor/2 + 1 successes
    if successCount >= d.replicationFactor/2+1 {
        return nil
    }
    return ErrWriteFailed
}
```

**Trade-off Analysis:**

| Scenario | Loki Behavior | Alternative |
|----------|---------------|-------------|
| Network partition | Accepts writes on available side | Reject writes (CP) |
| Ingester failure | Continues with remaining replicas | Block until recovery |
| Query during write | May miss in-flight data | Strong read-after-write |

**Adjusting for Different Use Cases:**

**1. Compliance/Audit Logs (Need stronger consistency):**
```yaml
# Increase replication and require all replicas
ingester:
  replication_factor: 3
  
distributor:
  # Require all replicas to acknowledge
  ring:
    replication_factor: 3
    
# Add write-ahead log for durability
ingester:
  wal:
    enabled: true
    dir: /data/wal
```

**2. High-Volume Debug Logs (Prioritize availability):**
```yaml
# Accept more data loss for higher throughput
ingester:
  replication_factor: 2
  
limits_config:
  # Allow dropping during overload
  ingestion_rate_strategy: local
```

**3. Real-Time Alerting (Need low latency):**
```yaml
# Reduce chunk flush interval for faster queryability
ingester:
  chunk_idle_period: 30s
  chunk_retain_period: 1m
  
# Enable tail queries for real-time
querier:
  tail_max_duration: 1h
```

**Key Insight:**
Log aggregation systems typically choose AP because:
1. Logs are append-only (no conflicts)
2. Missing some logs is better than blocking all writes
3. Eventual consistency is acceptable for most queries

---

## Question 11: Optimize Chunk Storage for Cost

**Difficulty**: Advanced  
**Category**: System Design

### Question

You're running Loki with 50TB of log data and storage costs are becoming significant. Design a strategy to optimize storage costs while maintaining query performance. Consider:
- Compression algorithms
- Retention policies
- Storage tiering
- Index optimization

### Answer

**Current State Analysis:**

```promql
# Storage breakdown
sum(loki_store_chunks_bytes_total) by (tenant)

# Compression ratio
sum(loki_chunk_store_decompressed_bytes_total) 
/ sum(loki_chunk_store_compressed_bytes_total)

# Query patterns - identify hot vs cold data
histogram_quantile(0.99, 
  sum(rate(loki_index_request_duration_seconds_bucket[24h])) by (le, period))
```

**Optimization Strategy:**

**1. Compression Optimization**

```yaml
# Compare compression algorithms
schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb-shipper
      object_store: s3
      schema: v12
      index:
        prefix: index_
        period: 24h
      chunks:
        # Use ZSTD for better compression ratio
        compression: zstd
```

| Algorithm | Compression Ratio | CPU Cost | Use Case |
|-----------|-------------------|----------|----------|
| Snappy | 2-3x | Low | High throughput |
| Gzip | 4-6x | Medium | Balanced |
| ZSTD | 5-8x | Medium | Best ratio |
| LZ4 | 2-3x | Very Low | Real-time |

**2. Tiered Retention Policy**

```yaml
# Different retention per tenant/log type
limits_config:
  retention_period: 30d  # Default
  
overrides:
  production:
    retention_period: 90d
  development:
    retention_period: 7d
  audit:
    retention_period: 365d
    
# Stream-based retention
compactor:
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

**3. Storage Tiering Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Storage Tiering                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Hot Tier (0-7 days)          Warm Tier (7-30 days)             │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │   S3 Standard   │          │  S3 Standard-IA │               │
│  │   $0.023/GB     │   ───▶   │   $0.0125/GB    │               │
│  └─────────────────┘          └─────────────────┘               │
│                                        │                         │
│                                        ▼                         │
│                               Cold Tier (30-365 days)            │
│                               ┌─────────────────┐               │
│                               │  S3 Glacier     │               │
│                               │  $0.004/GB      │               │
│                               └─────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```yaml
# S3 lifecycle policy
storage_config:
  aws:
    s3: s3://loki-chunks
    s3forcepathstyle: true
    
# Apply via AWS CLI or Terraform
# aws s3api put-bucket-lifecycle-configuration
lifecycle_rules:
  - id: "tiering"
    transitions:
      - days: 7
        storage_class: STANDARD_IA
      - days: 30
        storage_class: GLACIER
```

**4. Index Optimization**

```yaml
# Use TSDB index for better efficiency (Loki 2.8+)
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: s3
      schema: v13
      index:
        prefix: index_
        period: 24h

# Benefits:
# - 10x smaller index size
# - Faster queries
# - Lower storage costs
```

**Cost Projection:**

| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| ZSTD compression | 50TB | 35TB | 30% |
| Storage tiering | $1,150/mo | $650/mo | 43% |
| TSDB index | 5TB index | 500GB | 90% |
| Retention tuning | 50TB | 40TB | 20% |
| **Total** | **$1,500/mo** | **$700/mo** | **53%** |

---

## Question 12: Go Memory Leak Investigation

**Difficulty**: Advanced  
**Category**: Troubleshooting

### Question

A Go service is showing steadily increasing memory usage over time, eventually leading to OOM kills. Describe your systematic approach to identifying and fixing the memory leak.

### Answer

**Investigation Process:**

**Step 1: Confirm Memory Growth Pattern**
```bash
# Monitor memory over time
kubectl top pod my-service-0 --containers

# Check Go runtime metrics
curl -s localhost:6060/debug/vars | jq '.memstats'
```

```promql
# Prometheus queries
go_memstats_heap_alloc_bytes{job="my-service"}
go_memstats_heap_inuse_bytes{job="my-service"}
go_goroutines{job="my-service"}
```

**Step 2: Enable Profiling**
```go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    // ... rest of application
}
```

**Step 3: Capture Heap Profiles**
```bash
# Take baseline
curl -s http://localhost:6060/debug/pprof/heap > heap1.prof

# Wait for memory growth (e.g., 1 hour)
curl -s http://localhost:6060/debug/pprof/heap > heap2.prof

# Compare profiles
go tool pprof -base heap1.prof heap2.prof
(pprof) top 20
(pprof) list <function_name>
```

**Common Memory Leak Patterns:**

**1. Goroutine Leak**
```go
// BAD: Goroutine never exits
func processRequests(ch <-chan Request) {
    for {
        select {
        case req := <-ch:
            go handle(req)  // Spawns goroutines that may block forever
        }
    }
}

// GOOD: Use context for cancellation
func processRequests(ctx context.Context, ch <-chan Request) {
    for {
        select {
        case <-ctx.Done():
            return
        case req := <-ch:
            go handleWithContext(ctx, req)
        }
    }
}
```

**2. Slice/Map Growth**
```go
// BAD: Map grows unbounded
type Cache struct {
    data map[string][]byte
}

func (c *Cache) Set(key string, value []byte) {
    c.data[key] = value  // Never evicted
}

// GOOD: Use LRU cache with size limit
type Cache struct {
    data *lru.Cache
}

func NewCache(maxSize int) *Cache {
    cache, _ := lru.New(maxSize)
    return &Cache{data: cache}
}
```

**3. Forgotten Timers/Tickers**
```go
// BAD: Timer never stopped
func pollWithTimeout() {
    timer := time.NewTimer(5 * time.Second)
    // If function returns early, timer leaks
}

// GOOD: Always stop timers
func pollWithTimeout() {
    timer := time.NewTimer(5 * time.Second)
    defer timer.Stop()
    
    select {
    case <-timer.C:
        // timeout
    case result := <-resultCh:
        return result
    }
}
```

**4. Closure Capturing**
```go
// BAD: Closure captures large slice
func process(data []byte) {
    go func() {
        // Entire 'data' slice kept in memory
        log.Printf("processed %d bytes", len(data))
    }()
}

// GOOD: Capture only what's needed
func process(data []byte) {
    size := len(data)
    go func() {
        log.Printf("processed %d bytes", size)
    }()
}
```

**Step 4: Check Goroutine Count**
```bash
curl -s http://localhost:6060/debug/pprof/goroutine?debug=1 | head -100

# Look for patterns like:
# 10000 @ 0x... 0x... 0x...
# goroutine profile: total 10000
```

**Step 5: Analyze with Trace**
```bash
# Capture execution trace
curl -s http://localhost:6060/debug/pprof/trace?seconds=30 > trace.out
go tool trace trace.out
```

**Prevention Strategies:**

| Strategy | Implementation |
|----------|----------------|
| Bounded caches | Use LRU with max size |
| Context propagation | Cancel goroutines on shutdown |
| Resource pools | sync.Pool for frequent allocations |
| Finalizers | runtime.SetFinalizer for cleanup |
| Regular profiling | Automated heap profile collection |

---

## Question 13: Design Log Retention Policy System

**Difficulty**: Advanced  
**Category**: System Design

### Question

Design a flexible log retention policy system that supports:
- Per-tenant retention periods
- Per-stream retention based on labels
- Compliance requirements (legal hold)
- Cost optimization through tiered storage

### Answer

**System Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Retention Policy System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Policy Manager  │───▶│  Policy Store    │                   │
│  │  (API Server)    │    │  (PostgreSQL)    │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ Retention Worker │───▶│  Chunk Store     │                   │
│  │ (Compactor)      │    │  (S3/GCS)        │                   │
│  └──────────────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  Audit Logger    │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Model:**

```go
type RetentionPolicy struct {
    ID          string            `json:"id"`
    TenantID    string            `json:"tenant_id"`
    Name        string            `json:"name"`
    Selector    LabelSelector     `json:"selector"`
    Retention   RetentionConfig   `json:"retention"`
    LegalHold   *LegalHold        `json:"legal_hold,omitempty"`
    Priority    int               `json:"priority"`
    CreatedAt   time.Time         `json:"created_at"`
    UpdatedAt   time.Time         `json:"updated_at"`
}

type LabelSelector struct {
    MatchLabels      map[string]string `json:"match_labels"`
    MatchExpressions []LabelRequirement `json:"match_expressions"`
}

type RetentionConfig struct {
    Period       time.Duration `json:"period"`
    StorageTiers []StorageTier `json:"storage_tiers"`
}

type StorageTier struct {
    Age          time.Duration `json:"age"`
    StorageClass string        `json:"storage_class"`
}

type LegalHold struct {
    ID        string    `json:"id"`
    Reason    string    `json:"reason"`
    ExpiresAt time.Time `json:"expires_at"`
    CreatedBy string    `json:"created_by"`
}
```

**Policy Evaluation Engine:**

```go
type PolicyEngine struct {
    policies []RetentionPolicy
    store    PolicyStore
}

func (e *PolicyEngine) GetEffectiveRetention(
    tenantID string, 
    labels map[string]string,
) (time.Duration, error) {
    // Get all policies for tenant, sorted by priority
    policies, err := e.store.GetPolicies(tenantID)
    if err != nil {
        return 0, err
    }
    
    // Find first matching policy
    for _, policy := range policies {
        if policy.Selector.Matches(labels) {
            // Check for legal hold
            if policy.LegalHold != nil && 
               time.Now().Before(policy.LegalHold.ExpiresAt) {
                return math.MaxInt64, nil // Never delete
            }
            return policy.Retention.Period, nil
        }
    }
    
    // Return default retention
    return e.getDefaultRetention(tenantID), nil
}

func (s *LabelSelector) Matches(labels map[string]string) bool {
    // Check exact matches
    for k, v := range s.MatchLabels {
        if labels[k] != v {
            return false
        }
    }
    
    // Check expressions (In, NotIn, Exists, DoesNotExist)
    for _, expr := range s.MatchExpressions {
        if !expr.Matches(labels) {
            return false
        }
    }
    
    return true
}
```

**Retention Worker (Compactor):**

```go
type RetentionWorker struct {
    engine     *PolicyEngine
    chunkStore ChunkStore
    indexStore IndexStore
    audit      AuditLogger
}

func (w *RetentionWorker) Run(ctx context.Context) error {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            if err := w.processRetention(ctx); err != nil {
                log.Printf("retention error: %v", err)
            }
        }
    }
}

func (w *RetentionWorker) processRetention(ctx context.Context) error {
    // Iterate through all chunks
    chunks, err := w.chunkStore.ListChunks(ctx)
    if err != nil {
        return err
    }
    
    for _, chunk := range chunks {
        retention, err := w.engine.GetEffectiveRetention(
            chunk.TenantID, 
            chunk.Labels,
        )
        if err != nil {
            continue
        }
        
        if time.Since(chunk.CreatedAt) > retention {
            // Delete chunk
            if err := w.chunkStore.Delete(ctx, chunk.ID); err != nil {
                log.Printf("failed to delete chunk %s: %v", chunk.ID, err)
                continue
            }
            
            // Audit log
            w.audit.Log(AuditEvent{
                Action:   "chunk_deleted",
                TenantID: chunk.TenantID,
                ChunkID:  chunk.ID,
                Reason:   "retention_policy",
                Policy:   retention.String(),
            })
        }
    }
    
    return nil
}
```

**API Endpoints:**

```go
// Policy management API
POST   /api/v1/policies              // Create policy
GET    /api/v1/policies              // List policies
GET    /api/v1/policies/{id}         // Get policy
PUT    /api/v1/policies/{id}         // Update policy
DELETE /api/v1/policies/{id}         // Delete policy

// Legal hold management
POST   /api/v1/legal-holds           // Create legal hold
DELETE /api/v1/legal-holds/{id}      // Release legal hold
GET    /api/v1/legal-holds           // List active holds
```

**Compliance Considerations:**
- Immutable audit logs for all deletions
- Legal hold prevents deletion regardless of retention
- Support for data subject access requests (DSAR)
- Encryption at rest for sensitive logs

---

## Question 14: Implement Distributed Tracing Context

**Difficulty**: Intermediate  
**Category**: Coding

### Question

Implement a distributed tracing context propagation system in Go that:
- Generates and propagates trace IDs across service boundaries
- Supports W3C Trace Context format
- Integrates with HTTP clients and servers
- Is thread-safe for concurrent requests

### Answer

```go
package tracing

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "net/http"
    "strings"
)

// TraceContext holds distributed tracing information
type TraceContext struct {
    TraceID    string
    SpanID     string
    ParentID   string
    Sampled    bool
}

type contextKey struct{}

var traceContextKey = contextKey{}

// NewTraceContext creates a new trace context with generated IDs
func NewTraceContext() *TraceContext {
    return &TraceContext{
        TraceID: generateID(16), // 128-bit
        SpanID:  generateID(8),  // 64-bit
        Sampled: true,
    }
}

// NewChildContext creates a child span from parent context
func NewChildContext(parent *TraceContext) *TraceContext {
    return &TraceContext{
        TraceID:  parent.TraceID,
        SpanID:   generateID(8),
        ParentID: parent.SpanID,
        Sampled:  parent.Sampled,
    }
}

func generateID(bytes int) string {
    b := make([]byte, bytes)
    rand.Read(b)
    return hex.EncodeToString(b)
}

// FromContext extracts trace context from context.Context
func FromContext(ctx context.Context) *TraceContext {
    if tc, ok := ctx.Value(traceContextKey).(*TraceContext); ok {
        return tc
    }
    return nil
}

// WithContext adds trace context to context.Context
func WithContext(ctx context.Context, tc *TraceContext) context.Context {
    return context.WithValue(ctx, traceContextKey, tc)
}

// W3C Trace Context Header Format
// traceparent: 00-{trace-id}-{span-id}-{flags}
const (
    TraceparentHeader = "traceparent"
    TracestateHeader  = "tracestate"
)

// ParseTraceparent parses W3C traceparent header
func ParseTraceparent(header string) (*TraceContext, error) {
    parts := strings.Split(header, "-")
    if len(parts) != 4 {
        return nil, fmt.Errorf("invalid traceparent format")
    }
    
    version := parts[0]
    if version != "00" {
        return nil, fmt.Errorf("unsupported version: %s", version)
    }
    
    return &TraceContext{
        TraceID: parts[1],
        SpanID:  parts[2],
        Sampled: parts[3] == "01",
    }, nil
}

// ToTraceparent formats trace context as W3C traceparent header
func (tc *TraceContext) ToTraceparent() string {
    flags := "00"
    if tc.Sampled {
        flags = "01"
    }
    return fmt.Sprintf("00-%s-%s-%s", tc.TraceID, tc.SpanID, flags)
}
```

**HTTP Middleware:**

```go
// ServerMiddleware extracts or creates trace context for incoming requests
func ServerMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        var tc *TraceContext
        
        // Try to extract from incoming request
        if header := r.Header.Get(TraceparentHeader); header != "" {
            var err error
            tc, err = ParseTraceparent(header)
            if err != nil {
                // Invalid header, create new context
                tc = NewTraceContext()
            } else {
                // Create child span
                tc = NewChildContext(tc)
            }
        } else {
            // No trace context, create new one
            tc = NewTraceContext()
        }
        
        // Add to request context
        ctx := WithContext(r.Context(), tc)
        
        // Add trace ID to response headers for debugging
        w.Header().Set("X-Trace-ID", tc.TraceID)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// ClientTransport propagates trace context to outgoing requests
type ClientTransport struct {
    Base http.RoundTripper
}

func (t *ClientTransport) RoundTrip(r *http.Request) (*http.Response, error) {
    tc := FromContext(r.Context())
    if tc != nil {
        // Create child span for outgoing request
        child := NewChildContext(tc)
        r.Header.Set(TraceparentHeader, child.ToTraceparent())
    }
    
    base := t.Base
    if base == nil {
        base = http.DefaultTransport
    }
    return base.RoundTrip(r)
}
```

**Usage Example:**

```go
func main() {
    // Server setup
    mux := http.NewServeMux()
    mux.HandleFunc("/api/data", handleData)
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: ServerMiddleware(mux),
    }
    
    // Client setup
    client := &http.Client{
        Transport: &ClientTransport{},
    }
    
    // Making traced request
    ctx := WithContext(context.Background(), NewTraceContext())
    req, _ := http.NewRequestWithContext(ctx, "GET", "http://service-b/api", nil)
    resp, _ := client.Do(req)
}

func handleData(w http.ResponseWriter, r *http.Request) {
    tc := FromContext(r.Context())
    log.Printf("trace_id=%s span_id=%s", tc.TraceID, tc.SpanID)
    
    // Call downstream service with trace propagation
    client := &http.Client{Transport: &ClientTransport{}}
    req, _ := http.NewRequestWithContext(r.Context(), "GET", "http://downstream/api", nil)
    client.Do(req)
}
```

**Production Recommendations:**
- Use OpenTelemetry SDK for full-featured tracing
- Add sampling strategies for high-volume services
- Include baggage propagation for cross-cutting concerns
- Integrate with Tempo or Jaeger for visualization

---

## Question 15: Production Rollout Strategy

**Difficulty**: Advanced  
**Category**: Scenario-Based

### Question

You need to roll out a major version upgrade of Loki (e.g., 2.8 to 2.9) in production with zero downtime. The upgrade includes schema changes and new features. Describe your rollout strategy, including:
- Pre-rollout preparation
- Rollout phases
- Rollback plan
- Success criteria

### Answer

**Pre-Rollout Preparation (1-2 weeks before):**

**1. Review Release Notes and Breaking Changes**
```markdown
## Loki 2.9 Breaking Changes Checklist
- [ ] Schema v13 requires migration
- [ ] Deprecated config options removed
- [ ] New index format (TSDB)
- [ ] API changes in /loki/api/v1/query
```

**2. Staging Environment Validation**
```bash
# Deploy to staging
helm upgrade loki grafana/loki --version 5.x.x \
  --namespace loki-staging \
  -f values-staging.yaml

# Run integration tests
./scripts/integration-tests.sh --env staging

# Load test with production-like traffic
k6 run --vus 100 --duration 1h load-test.js
```

**3. Backup Critical Data**
```bash
# Backup configuration
kubectl get configmap loki-config -o yaml > loki-config-backup.yaml

# Snapshot persistent volumes (if applicable)
kubectl get pvc -l app=loki -o json | jq -r '.items[].metadata.name' | \
  xargs -I {} aws ec2 create-snapshot --volume-id {}

# Export current metrics for comparison
promtool query instant http://prometheus:9090 \
  'loki_ingester_memory_streams' > pre-upgrade-metrics.json
```

**Rollout Phases:**

**Phase 1: Canary Deployment (Day 1)**
```yaml
# Deploy single canary ingester
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki-ingester-canary
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ingester
        image: grafana/loki:2.9.0
        # Same config as production
```

```bash
# Monitor canary for 4-6 hours
watch -n 30 'kubectl logs loki-ingester-canary-0 --tail=50'

# Compare metrics
promtool query instant http://prometheus:9090 \
  'histogram_quantile(0.99, sum(rate(loki_request_duration_seconds_bucket{pod=~"loki-ingester-canary.*"}[5m])) by (le))'
```

**Phase 2: Rolling Update - Read Path (Day 2)**
```bash
# Update queriers first (stateless, easy rollback)
kubectl set image deployment/loki-querier \
  querier=grafana/loki:2.9.0

# Verify queries still work
curl -G -s "http://loki:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="test"}' | jq .status
```

**Phase 3: Rolling Update - Write Path (Day 3-4)**
```bash
# Update distributors
kubectl set image deployment/loki-distributor \
  distributor=grafana/loki:2.9.0

# Update ingesters with controlled rollout
kubectl rollout restart statefulset/loki-ingester \
  --max-unavailable=1

# Monitor ring health during rollout
watch -n 10 'curl -s http://loki:3100/ring | jq ".shards | length"'
```

**Phase 4: Schema Migration (Day 5)**
```yaml
# Add new schema config (runs alongside old)
schema_config:
  configs:
    # Keep old schema for existing data
    - from: 2023-01-01
      store: boltdb-shipper
      schema: v12
    # New schema for new data
    - from: 2024-01-15
      store: tsdb
      schema: v13
```

**Rollback Plan:**

```bash
# Immediate rollback script
#!/bin/bash
set -e

echo "Starting rollback to Loki 2.8.x"

# 1. Stop new writes
kubectl scale deployment/loki-distributor --replicas=0

# 2. Rollback images
kubectl set image statefulset/loki-ingester ingester=grafana/loki:2.8.6
kubectl set image deployment/loki-querier querier=grafana/loki:2.8.6
kubectl set image deployment/loki-distributor distributor=grafana/loki:2.8.6

# 3. Wait for rollout
kubectl rollout status statefulset/loki-ingester --timeout=10m

# 4. Restore writes
kubectl scale deployment/loki-distributor --replicas=3

# 5. Verify
curl -s http://loki:3100/ready
```

**Success Criteria:**

| Metric | Threshold | Check Command |
|--------|-----------|---------------|
| Write latency p99 | < 500ms | `histogram_quantile(0.99, ...)` |
| Query latency p99 | < 2s | `histogram_quantile(0.99, ...)` |
| Error rate | < 0.1% | `sum(rate(errors[5m]))/sum(rate(total[5m]))` |
| Ingester restarts | 0 | `kube_pod_container_status_restarts_total` |
| Ring health | 100% | `loki_ring_members` |

**Post-Rollout:**

```markdown
## Rollout Completion Checklist
- [ ] All components on new version
- [ ] Metrics within normal range for 24 hours
- [ ] No customer-reported issues
- [ ] Documentation updated
- [ ] Runbooks updated for new features
- [ ] Team notified of completion
```

---

## Summary

These 15 questions cover the key competencies expected for a Staff Backend Engineer role at Grafana, focusing on Loki and distributed systems:

| Category | Questions | Key Topics |
|----------|-----------|------------|
| System Design | 1, 7, 11, 13 | Log pipelines, multi-tenancy, storage optimization |
| Coding | 2, 5, 8, 14 | Go concurrency, rate limiting, circuit breakers |
| Architecture | 3, 6, 10 | Scaling, Kafka, CAP theorem |
| Troubleshooting | 4, 12 | Query latency, memory leaks |
| Scenario-Based | 9, 15 | Incident response, production rollouts |

**Preparation Tips:**
1. Practice coding questions with actual Go code
2. Draw architecture diagrams for system design questions
3. Prepare real examples from your experience for scenario questions
4. Review Loki documentation and source code
5. Understand trade-offs, not just solutions

---

**Related Resources:**
- [Fundamentals](../fundamentals.md)
- [Intermediate](../intermediate.md)
- [Advanced](../advanced.md)
- [Go Distributed Systems Examples](../../../code-implementations/go-distributed-systems/)
- [LGTM Stack Overview](../../../shared-concepts/lgtm-stack.md)
