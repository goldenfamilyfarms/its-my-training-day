# Go Distributed Systems Examples

This directory contains practical Go code implementations demonstrating concurrency patterns and distributed systems concepts essential for Grafana backend engineering roles.

## Purpose

These examples provide hands-on implementations of:

- **Concurrency Patterns**: Core Go concurrency primitives and patterns used extensively in Grafana's backend services
- **Distributed Patterns**: Common patterns for building resilient, scalable distributed systems like Loki, Mimir, and Tempo

The code is designed to help candidates:
1. Understand Go's concurrency model through working examples
2. Practice implementing patterns commonly discussed in technical interviews
3. Build intuition for distributed systems challenges faced at Grafana scale

## Prerequisites

### Required
- **Go 1.21+** - [Download and install Go](https://go.dev/doc/install)
- Basic understanding of Go syntax and types
- Familiarity with command-line operations

### Recommended
- Understanding of concurrent programming concepts
- Familiarity with distributed systems fundamentals (see [shared-concepts](../../shared-concepts/))

### Verify Installation

```bash
# Check Go version
go version

# Expected output: go version go1.21.x (or higher)
```

## Directory Structure

```
go-distributed-systems/
├── README.md                    # This file
├── concurrency.go               # Concurrency pattern implementations
│                                # - Basic goroutine and channel examples
│                                # - Worker pool with configurable workers
│                                # - Fan-out/fan-in pattern
│                                # - Pipeline pattern
│                                # - Error group pattern
│                                # - Semaphore pattern
├── concurrency_test.go          # Tests for concurrency patterns
├── distributed.go               # Distributed system patterns
│                                # - Token bucket rate limiter
│                                # - Sliding window rate limiter
│                                # - Circuit breaker pattern (closed/open/half-open)
│                                # - Retry with exponential backoff and jitter
│                                # - Combined resilient client pattern
│                                # - Error type helpers (retryable/permanent)
└── distributed_test.go          # Tests for distributed patterns
```

## Patterns Overview

### Concurrency Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Goroutines & Channels** | Basic concurrency primitives | Parallel task execution |
| **Worker Pool** | Fixed pool of workers processing jobs | Rate-limited parallel processing |
| **Fan-Out/Fan-In** | Distribute work, collect results | Parallel data processing pipelines |
| **Select Statement** | Multiplexing channel operations | Timeout handling, cancellation |

### Distributed Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Token Bucket Rate Limiter** | Token bucket algorithm with burst support | API rate limiting, resource protection |
| **Sliding Window Rate Limiter** | Accurate per-window rate limiting | Strict rate compliance |
| **Circuit Breaker** | Fail-fast with closed/open/half-open states | Resilient service communication |
| **Retry with Backoff** | Exponential backoff with jitter | Transient failure recovery |
| **Resilient Client** | Combined rate limit + circuit breaker + retry | Production service calls |

## Setup and Running

### Clone and Navigate

```bash
# Navigate to the examples directory
cd grafana/code-implementations/go-distributed-systems
```

### Initialize Go Module (if not already done)

```bash
# Initialize the Go module
go mod init go-distributed-systems

# Download dependencies (if any)
go mod tidy
```

### Run Examples

```bash
# Run a specific example
go run concurrency/worker-pool/main.go

# Run all tests
go test ./...

# Run tests with verbose output
go test -v ./...

# Run tests with coverage
go test -cover ./...
```

### Run Benchmarks

```bash
# Run benchmarks for a specific package
go test -bench=. ./concurrency/worker-pool/

# Run benchmarks with memory allocation stats
go test -bench=. -benchmem ./...
```

## Usage Examples

### Worker Pool Pattern

```go
package main

import (
    "context"
    "fmt"
    "go-distributed-systems"
)

func main() {
    // Create a worker pool with 5 workers and queue size of 100
    pool := concurrency.NewWorkerPool(5, 100)
    pool.Start()
    defer pool.Stop()
    
    // Submit jobs
    for i := 0; i < 100; i++ {
        jobID := i
        pool.Submit(concurrency.Job{
            ID:      jobID,
            Payload: fmt.Sprintf("task-%d", jobID),
            Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
                // Process the payload
                return fmt.Sprintf("processed: %v", payload), nil
            },
        })
    }
    
    // Collect results
    for i := 0; i < 100; i++ {
        result := <-pool.Results()
        fmt.Printf("Job %d completed: %v\n", result.JobID, result.Result)
    }
}
```

### Fan-Out/Fan-In Pattern

```go
package main

import (
    "context"
    "fmt"
    "go-distributed-systems"
)

func main() {
    // Create fan-out/fan-in processor with 4 workers
    fanout := concurrency.NewFanOutFanIn(4)
    
    // Prepare items to process
    items := []interface{}{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    
    // Process items in parallel
    results := fanout.Process(context.Background(), items, func(ctx context.Context, item interface{}) (interface{}, error) {
        num := item.(int)
        return num * 2, nil
    })
    
    // Print results
    for _, r := range results {
        fmt.Printf("Input: %v, Output: %v\n", r.Input, r.Output)
    }
}
```

### Semaphore Pattern

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "go-distributed-systems"
)

func main() {
    // Create semaphore limiting to 3 concurrent operations
    sem := concurrency.NewSemaphore(3)
    var wg sync.WaitGroup
    
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            // Acquire semaphore slot
            if err := sem.Acquire(context.Background()); err != nil {
                return
            }
            defer sem.Release()
            
            // Perform rate-limited operation
            fmt.Printf("Worker %d executing\n", id)
        }(i)
    }
    
    wg.Wait()
}
```

### Circuit Breaker Pattern

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "time"
    
    "go-distributed-systems"
)

func main() {
    // Create circuit breaker with configuration
    cb := concurrency.NewCircuitBreaker(concurrency.CircuitBreakerConfig{
        FailureThreshold: 5,           // Open after 5 failures
        SuccessThreshold: 2,           // Close after 2 successes in half-open
        Timeout:          30 * time.Second, // Wait before trying half-open
        MaxConcurrent:    1,           // Limit concurrent requests in half-open
    })
    
    // Optional: Monitor state changes
    cb.OnStateChange(func(from, to concurrency.CircuitState) {
        fmt.Printf("Circuit state changed: %s -> %s\n", from, to)
    })
    
    // Execute with circuit breaker protection
    err := cb.ExecuteWithContext(context.Background(), func(ctx context.Context) error {
        // Your potentially failing operation
        return callExternalService(ctx)
    })
    
    if errors.Is(err, concurrency.ErrCircuitOpen) {
        fmt.Println("Circuit is open, failing fast")
    } else if err != nil {
        fmt.Printf("Operation failed: %v\n", err)
    }
}
```

### Rate Limiter Pattern

```go
package main

import (
    "context"
    "fmt"
    
    "go-distributed-systems"
)

func main() {
    // Create token bucket rate limiter: 100 capacity, 10 tokens/second refill
    limiter := concurrency.NewTokenBucketRateLimiter(100, 10)
    
    // Non-blocking check
    if limiter.Allow() {
        // Proceed with rate-limited operation
        makeAPICall()
    } else {
        fmt.Println("Rate limited, try again later")
    }
    
    // Blocking wait for permission
    if err := limiter.Wait(context.Background()); err != nil {
        // Context cancelled or deadline exceeded
        return
    }
    makeAPICall()
    
    // Check available tokens for monitoring
    fmt.Printf("Available tokens: %.2f\n", limiter.Tokens())
}
```

### Retry with Backoff Pattern

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "time"
    
    "go-distributed-systems"
)

func main() {
    // Create retryer with exponential backoff and jitter
    retryer := concurrency.NewRetryer(concurrency.RetryConfig{
        MaxRetries:        3,
        InitialBackoff:    100 * time.Millisecond,
        MaxBackoff:        30 * time.Second,
        BackoffMultiplier: 2.0,
        JitterFraction:    0.2, // 20% jitter to prevent thundering herd
    })
    
    // Execute with retry
    result, err := retryer.DoWithContext(context.Background(), func(ctx context.Context) error {
        return callUnreliableService(ctx)
    })
    
    if err != nil {
        fmt.Printf("Failed after %d attempts in %v: %v\n", 
            result.Attempts, result.Duration, err)
    } else {
        fmt.Printf("Succeeded after %d attempts\n", result.Attempts)
    }
}
```

### Resilient Client (Combined Patterns)

```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "go-distributed-systems"
)

func main() {
    // Create resilient client combining rate limiting, circuit breaker, and retry
    client := concurrency.NewResilientClient(concurrency.ResilientClientConfig{
        CircuitBreaker: concurrency.CircuitBreakerConfig{
            FailureThreshold: 5,
            SuccessThreshold: 2,
            Timeout:          30 * time.Second,
        },
        Retry: concurrency.RetryConfig{
            MaxRetries:        3,
            InitialBackoff:    100 * time.Millisecond,
            BackoffMultiplier: 2.0,
        },
        RateLimit: &struct {
            Capacity   float64
            RefillRate float64
        }{
            Capacity:   100,
            RefillRate: 10,
        },
    })
    
    // Execute with full resilience stack
    err := client.Execute(context.Background(), func(ctx context.Context) error {
        return callExternalAPI(ctx)
    })
    
    if err != nil {
        fmt.Printf("Request failed: %v\n", err)
    }
    
    // Monitor circuit breaker state
    fmt.Printf("Circuit state: %s\n", client.CircuitBreaker().State())
}
```

## Testing

All implementations include comprehensive tests demonstrating:

- **Unit Tests**: Verify correct behavior for specific inputs
- **Property-Based Tests**: Verify invariants hold across many inputs
- **Benchmark Tests**: Measure performance characteristics

```bash
# Run all tests
go test ./...

# Run tests for a specific package
go test ./concurrency/worker-pool/

# Run with race detector (important for concurrency code)
go test -race ./...
```

## Related Study Materials

- [Go Programming Fundamentals](../../study-guides/01-staff-backend-engineer-loki/fundamentals.md) - Go basics and concurrency primitives
- [Distributed Systems Concepts](../../shared-concepts/kubernetes-fundamentals.md) - Kubernetes and distributed systems
- [Observability Principles](../../shared-concepts/observability-principles.md) - Metrics, logging, and tracing

## Best Practices Demonstrated

### Error Handling
- All functions return errors explicitly
- Errors are wrapped with context using `fmt.Errorf` with `%w`
- No silent failures or ignored errors

### Concurrency Safety
- Proper use of mutexes for shared state
- Channel-based communication where appropriate
- Context-based cancellation and timeouts

### Testing
- Table-driven tests for comprehensive coverage
- Race condition detection with `-race` flag
- Benchmarks for performance-critical code

## Contributing

When adding new patterns:

1. Create a new directory under the appropriate category
2. Include a `main.go` with runnable example
3. Include `*_test.go` with unit tests
4. Update this README with the new pattern

## License

These examples are provided for educational purposes as part of the Grafana Interview Preparation Study Guide.
