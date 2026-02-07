# Fundamentals: Staff Backend Engineer - Grafana Databases, Loki Ingest

This document covers the foundational knowledge required for the Staff Backend Engineer role at Grafana Labs, focusing on Go programming, concurrency primitives, and distributed systems foundations. These concepts form the building blocks for understanding Loki's architecture and contributing to its development.

## Table of Contents

1. [Go Programming Essentials](#go-programming-essentials)
2. [Concurrency Primitives](#concurrency-primitives)
3. [Memory Management and Garbage Collection](#memory-management-and-garbage-collection)
4. [Interface Design and Composition](#interface-design-and-composition)
5. [Distributed Systems Foundations](#distributed-systems-foundations)
6. [Related Resources](#related-resources)

---

## Go Programming Essentials

Go is the primary language used at Grafana Labs for backend services, including Loki, Mimir, and Tempo. Understanding Go's fundamentals is essential for contributing to these projects.

### Syntax Fundamentals

#### Package Structure

Go programs are organized into packages. Every Go file begins with a package declaration.

```go
// Package declaration - every file starts with this
package main

// Import statements - group standard library and external packages
import (
    "context"
    "fmt"
    "time"

    "github.com/grafana/loki/pkg/logproto"
)

// Package-level variables and constants
const (
    DefaultTimeout = 30 * time.Second
    MaxRetries     = 3
)

var (
    // Package-level variables (use sparingly)
    defaultLogger = log.NewNopLogger()
)

// Main function - entry point for executables
func main() {
    fmt.Println("Hello, Grafana!")
}
```

#### Variable Declarations and Types

```go
package main

import "fmt"

func main() {
    // Variable declarations
    var name string = "Loki"           // Explicit type
    var count int                       // Zero value (0)
    age := 25                          // Short declaration (type inferred)
    
    // Multiple declarations
    var (
        host     = "localhost"
        port     = 3100
        enabled  = true
    )
    
    // Constants
    const (
        KB = 1024
        MB = KB * 1024
        GB = MB * 1024
    )
    
    // Basic types
    var (
        b    bool       = true
        s    string     = "hello"
        i    int        = 42          // Platform-dependent size
        i64  int64      = 9223372036854775807
        u    uint       = 42
        f32  float32    = 3.14
        f64  float64    = 3.141592653589793
        c64  complex64  = 1 + 2i
        by   byte       = 255         // Alias for uint8
        r    rune       = '世'        // Alias for int32 (Unicode code point)
    )
    
    fmt.Printf("Name: %s, Count: %d, Age: %d\n", name, count, age)
}
```

#### Composite Types

```go
package main

import "fmt"

func main() {
    // Arrays - fixed size
    var arr [5]int = [5]int{1, 2, 3, 4, 5}
    arr2 := [...]int{1, 2, 3}  // Size inferred from elements
    
    // Slices - dynamic size (most commonly used)
    slice := []int{1, 2, 3, 4, 5}
    slice = append(slice, 6, 7, 8)
    
    // Make slice with length and capacity
    buffer := make([]byte, 0, 1024)  // len=0, cap=1024
    
    // Slice operations
    subSlice := slice[1:4]  // Elements at index 1, 2, 3
    
    // Maps - key-value pairs
    labels := map[string]string{
        "job":       "loki",
        "namespace": "monitoring",
    }
    labels["pod"] = "loki-0"  // Add/update
    delete(labels, "pod")      // Delete
    
    // Check if key exists
    if value, ok := labels["job"]; ok {
        fmt.Printf("Job: %s\n", value)
    }
    
    // Structs
    type LogEntry struct {
        Timestamp time.Time
        Labels    map[string]string
        Line      string
        tenant    string  // Unexported (lowercase)
    }
    
    entry := LogEntry{
        Timestamp: time.Now(),
        Labels:    labels,
        Line:      "Error: connection refused",
    }
    
    // Anonymous struct
    config := struct {
        Host string
        Port int
    }{
        Host: "localhost",
        Port: 3100,
    }
    
    fmt.Printf("Entry: %+v\n", entry)
    fmt.Printf("Config: %+v\n", config)
}
```

### Control Flow

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    // If statements
    x := 10
    if x > 5 {
        fmt.Println("x is greater than 5")
    } else if x == 5 {
        fmt.Println("x equals 5")
    } else {
        fmt.Println("x is less than 5")
    }
    
    // If with initialization
    if err := doSomething(); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
    
    // Switch statements
    status := 200
    switch status {
    case 200, 201:
        fmt.Println("Success")
    case 400:
        fmt.Println("Bad Request")
    case 500:
        fmt.Println("Server Error")
    default:
        fmt.Println("Unknown status")
    }
    
    // Type switch
    var i interface{} = "hello"
    switch v := i.(type) {
    case int:
        fmt.Printf("Integer: %d\n", v)
    case string:
        fmt.Printf("String: %s\n", v)
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }
    
    // For loops (Go's only loop construct)
    // Traditional for
    for i := 0; i < 5; i++ {
        fmt.Println(i)
    }
    
    // While-style
    count := 0
    for count < 5 {
        count++
    }
    
    // Infinite loop
    // for {
    //     // Use break to exit
    // }
    
    // Range over slice
    items := []string{"a", "b", "c"}
    for index, value := range items {
        fmt.Printf("%d: %s\n", index, value)
    }
    
    // Range over map
    labels := map[string]string{"job": "loki"}
    for key, value := range labels {
        fmt.Printf("%s=%s\n", key, value)
    }
    
    // Defer - executes when function returns (LIFO order)
    defer fmt.Println("This prints last")
    defer fmt.Println("This prints second to last")
    fmt.Println("This prints first")
}

func doSomething() error {
    return errors.New("something went wrong")
}
```

### Functions and Methods

```go
package main

import (
    "errors"
    "fmt"
)

// Basic function
func add(a, b int) int {
    return a + b
}

// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

// Named return values
func getCoordinates() (x, y int) {
    x = 10
    y = 20
    return  // Returns x and y
}

// Variadic function
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

// Function as value
func applyOperation(a, b int, op func(int, int) int) int {
    return op(a, b)
}

// Closure
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

// Methods - functions with receivers
type LogStream struct {
    Name   string
    Labels map[string]string
    lines  []string
}

// Value receiver - receives a copy
func (ls LogStream) LineCount() int {
    return len(ls.lines)
}

// Pointer receiver - can modify the struct
func (ls *LogStream) AddLine(line string) {
    ls.lines = append(ls.lines, line)
}

// Constructor pattern
func NewLogStream(name string, labels map[string]string) *LogStream {
    return &LogStream{
        Name:   name,
        Labels: labels,
        lines:  make([]string, 0),
    }
}

func main() {
    // Using functions
    result := add(5, 3)
    fmt.Printf("5 + 3 = %d\n", result)
    
    quotient, err := divide(10, 2)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("10 / 2 = %.2f\n", quotient)
    }
    
    // Variadic
    total := sum(1, 2, 3, 4, 5)
    fmt.Printf("Sum: %d\n", total)
    
    // Function as value
    multiply := func(a, b int) int { return a * b }
    result = applyOperation(5, 3, multiply)
    fmt.Printf("5 * 3 = %d\n", result)
    
    // Closure
    c := counter()
    fmt.Println(c())  // 1
    fmt.Println(c())  // 2
    fmt.Println(c())  // 3
    
    // Methods
    stream := NewLogStream("app-logs", map[string]string{"app": "api"})
    stream.AddLine("First log line")
    stream.AddLine("Second log line")
    fmt.Printf("Line count: %d\n", stream.LineCount())
}
```

### Error Handling

Go uses explicit error handling rather than exceptions. This is a fundamental pattern you'll see throughout Grafana's codebase.

```go
package main

import (
    "errors"
    "fmt"
    "io"
    "os"
)

// Custom error types
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

// Sentinel errors - predefined errors for comparison
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrRateLimited  = errors.New("rate limited")
)

// Error wrapping (Go 1.13+)
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        // Wrap error with context
        return nil, fmt.Errorf("reading config %s: %w", path, err)
    }
    return data, nil
}

// Error checking patterns
func processRequest(id string) error {
    data, err := fetchData(id)
    if err != nil {
        // Check for specific error types
        if errors.Is(err, ErrNotFound) {
            return fmt.Errorf("data for %s not found: %w", id, err)
        }
        
        // Check for error type
        var validErr *ValidationError
        if errors.As(err, &validErr) {
            return fmt.Errorf("invalid data: %s", validErr.Message)
        }
        
        return err
    }
    
    fmt.Printf("Data: %s\n", data)
    return nil
}

func fetchData(id string) (string, error) {
    if id == "" {
        return "", &ValidationError{Field: "id", Message: "cannot be empty"}
    }
    if id == "missing" {
        return "", ErrNotFound
    }
    return "sample data", nil
}

// Defer for cleanup
func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return fmt.Errorf("opening file: %w", err)
    }
    defer f.Close()  // Always close, even on error
    
    // Process file...
    return nil
}

// Panic and recover (use sparingly)
func safeOperation() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()
    
    // This would normally crash the program
    panic("something went terribly wrong")
}

func main() {
    // Error handling examples
    if err := processRequest(""); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
    
    if err := processRequest("missing"); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
    
    if err := safeOperation(); err != nil {
        fmt.Printf("Recovered: %v\n", err)
    }
}
```

---

## Concurrency Primitives

Go's concurrency model is built on goroutines and channels, making it well-suited for building distributed systems like Loki. Understanding these primitives is crucial for working with Grafana's backend services.

### Goroutines

Goroutines are lightweight threads managed by the Go runtime. They're the foundation of Go's concurrency model.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Basic goroutine
func sayHello(name string) {
    fmt.Printf("Hello, %s!\n", name)
}

// Goroutine with WaitGroup for synchronization
func processItems(items []string) {
    var wg sync.WaitGroup
    
    for _, item := range items {
        wg.Add(1)
        go func(i string) {
            defer wg.Done()
            // Simulate processing
            time.Sleep(100 * time.Millisecond)
            fmt.Printf("Processed: %s\n", i)
        }(item)  // Pass item as parameter to avoid closure issues
    }
    
    wg.Wait()  // Wait for all goroutines to complete
    fmt.Println("All items processed")
}

// Worker pool pattern (common in Loki)
func workerPool(numWorkers int, jobs <-chan int, results chan<- int) {
    var wg sync.WaitGroup
    
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for job := range jobs {
                // Process job
                result := job * 2
                fmt.Printf("Worker %d processed job %d -> %d\n", workerID, job, result)
                results <- result
            }
        }(i)
    }
    
    wg.Wait()
    close(results)
}

func main() {
    // Start a goroutine
    go sayHello("Grafana")
    
    // Process items concurrently
    items := []string{"log1", "log2", "log3", "log4", "log5"}
    processItems(items)
    
    // Worker pool example
    jobs := make(chan int, 10)
    results := make(chan int, 10)
    
    // Start workers
    go workerPool(3, jobs, results)
    
    // Send jobs
    for i := 1; i <= 5; i++ {
        jobs <- i
    }
    close(jobs)
    
    // Collect results
    for result := range results {
        fmt.Printf("Result: %d\n", result)
    }
}
```

### Channels

Channels are Go's primary mechanism for communication between goroutines. They provide a way to safely share data.

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // Unbuffered channel - synchronous
    ch := make(chan string)
    
    go func() {
        ch <- "Hello from goroutine"  // Blocks until received
    }()
    
    msg := <-ch  // Blocks until sent
    fmt.Println(msg)
    
    // Buffered channel - asynchronous up to buffer size
    buffered := make(chan int, 3)
    buffered <- 1  // Doesn't block
    buffered <- 2  // Doesn't block
    buffered <- 3  // Doesn't block
    // buffered <- 4  // Would block - buffer full
    
    fmt.Println(<-buffered)  // 1
    fmt.Println(<-buffered)  // 2
    fmt.Println(<-buffered)  // 3
    
    // Channel directions (for function signatures)
    sendOnly := make(chan<- int)    // Can only send
    receiveOnly := make(<-chan int) // Can only receive
    _ = sendOnly
    _ = receiveOnly
    
    // Closing channels
    dataCh := make(chan int, 5)
    go func() {
        for i := 0; i < 5; i++ {
            dataCh <- i
        }
        close(dataCh)  // Signal no more data
    }()
    
    // Range over channel until closed
    for value := range dataCh {
        fmt.Printf("Received: %d\n", value)
    }
    
    // Check if channel is closed
    ch2 := make(chan int)
    close(ch2)
    value, ok := <-ch2
    if !ok {
        fmt.Println("Channel is closed")
    }
    _ = value
    
    // Nil channels block forever (useful in select)
    var nilCh chan int
    // <-nilCh  // Would block forever
    _ = nilCh
}

// Producer-Consumer pattern
func producer(ch chan<- int, count int) {
    for i := 0; i < count; i++ {
        ch <- i
        time.Sleep(100 * time.Millisecond)
    }
    close(ch)
}

func consumer(ch <-chan int, done chan<- bool) {
    for value := range ch {
        fmt.Printf("Consumed: %d\n", value)
    }
    done <- true
}

// Fan-out pattern (one producer, multiple consumers)
func fanOut() {
    jobs := make(chan int, 100)
    
    // Start multiple consumers
    for i := 0; i < 3; i++ {
        go func(id int) {
            for job := range jobs {
                fmt.Printf("Worker %d processing job %d\n", id, job)
                time.Sleep(50 * time.Millisecond)
            }
        }(i)
    }
    
    // Send jobs
    for i := 0; i < 10; i++ {
        jobs <- i
    }
    close(jobs)
}

// Fan-in pattern (multiple producers, one consumer)
func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for value := range c {
                out <- value
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

### Select Statement

The `select` statement lets a goroutine wait on multiple channel operations. It's essential for building responsive concurrent systems.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(100 * time.Millisecond)
        ch1 <- "from channel 1"
    }()
    
    go func() {
        time.Sleep(200 * time.Millisecond)
        ch2 <- "from channel 2"
    }()
    
    // Basic select - waits for first available
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received", msg2)
        }
    }
    
    // Select with timeout
    ch3 := make(chan string)
    select {
    case msg := <-ch3:
        fmt.Println("Received:", msg)
    case <-time.After(500 * time.Millisecond):
        fmt.Println("Timeout!")
    }
    
    // Select with default (non-blocking)
    ch4 := make(chan string)
    select {
    case msg := <-ch4:
        fmt.Println("Received:", msg)
    default:
        fmt.Println("No message available")
    }
    
    // Context cancellation pattern (very common in Grafana code)
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    resultCh := make(chan string)
    go func() {
        // Simulate long operation
        time.Sleep(1 * time.Second)
        resultCh <- "operation complete"
    }()
    
    select {
    case result := <-resultCh:
        fmt.Println("Result:", result)
    case <-ctx.Done():
        fmt.Println("Context cancelled:", ctx.Err())
    }
}

// Ticker pattern for periodic operations
func periodicTask(ctx context.Context, interval time.Duration) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            fmt.Println("Tick at", time.Now())
            // Perform periodic task
        case <-ctx.Done():
            fmt.Println("Stopping periodic task")
            return
        }
    }
}

// Rate limiting with select
func rateLimitedProcessor(ctx context.Context, items <-chan string, rateLimit time.Duration) {
    limiter := time.NewTicker(rateLimit)
    defer limiter.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-limiter.C:
            select {
            case item, ok := <-items:
                if !ok {
                    return
                }
                fmt.Printf("Processing: %s\n", item)
            default:
                // No items available
            }
        }
    }
}
```

### Synchronization Primitives

Beyond channels, Go provides traditional synchronization primitives in the `sync` package.

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
    "time"
)

// Mutex - mutual exclusion lock
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// RWMutex - allows multiple readers or one writer
type SafeCache struct {
    mu    sync.RWMutex
    items map[string]string
}

func (c *SafeCache) Get(key string) (string, bool) {
    c.mu.RLock()  // Multiple goroutines can read simultaneously
    defer c.mu.RUnlock()
    value, ok := c.items[key]
    return value, ok
}

func (c *SafeCache) Set(key, value string) {
    c.mu.Lock()  // Exclusive access for writing
    defer c.mu.Unlock()
    c.items[key] = value
}

// Once - ensures function runs exactly once
var (
    instance *Database
    once     sync.Once
)

type Database struct {
    connection string
}

func GetDatabase() *Database {
    once.Do(func() {
        fmt.Println("Initializing database connection...")
        instance = &Database{connection: "connected"}
    })
    return instance
}

// WaitGroup - wait for goroutines to complete
func processWithWaitGroup() {
    var wg sync.WaitGroup
    
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            time.Sleep(100 * time.Millisecond)
            fmt.Printf("Task %d complete\n", id)
        }(i)
    }
    
    wg.Wait()
    fmt.Println("All tasks complete")
}

// Cond - condition variable for signaling
type Queue struct {
    items []int
    cond  *sync.Cond
}

func NewQueue() *Queue {
    return &Queue{
        items: make([]int, 0),
        cond:  sync.NewCond(&sync.Mutex{}),
    }
}

func (q *Queue) Enqueue(item int) {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()
    q.items = append(q.items, item)
    q.cond.Signal()  // Wake one waiting goroutine
}

func (q *Queue) Dequeue() int {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()
    for len(q.items) == 0 {
        q.cond.Wait()  // Release lock and wait
    }
    item := q.items[0]
    q.items = q.items[1:]
    return item
}

// Pool - reusable object pool (reduces GC pressure)
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func processWithPool() {
    // Get buffer from pool
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)  // Return to pool when done
    
    // Use buffer...
    copy(buf, []byte("Hello, World!"))
}

// Atomic operations - lock-free synchronization
type AtomicCounter struct {
    value int64
}

func (c *AtomicCounter) Increment() {
    atomic.AddInt64(&c.value, 1)
}

func (c *AtomicCounter) Value() int64 {
    return atomic.LoadInt64(&c.value)
}

func (c *AtomicCounter) CompareAndSwap(old, new int64) bool {
    return atomic.CompareAndSwapInt64(&c.value, old, new)
}

func main() {
    // SafeCounter example
    counter := &SafeCounter{}
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    
    wg.Wait()
    fmt.Printf("Counter value: %d\n", counter.Value())
    
    // Singleton pattern with Once
    db1 := GetDatabase()
    db2 := GetDatabase()
    fmt.Printf("Same instance: %v\n", db1 == db2)
    
    // Atomic counter
    atomicCounter := &AtomicCounter{}
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            atomicCounter.Increment()
        }()
    }
    wg.Wait()
    fmt.Printf("Atomic counter: %d\n", atomicCounter.Value())
}
```

---

## Memory Management and Garbage Collection

Understanding Go's memory model and garbage collector is important for writing efficient code, especially in high-throughput systems like Loki.

### Stack vs Heap Allocation

```go
package main

import "fmt"

// Stack allocation - fast, automatic cleanup
func stackAllocation() int {
    x := 42  // Allocated on stack
    return x // Value copied on return
}

// Heap allocation - escape analysis determines this
func heapAllocation() *int {
    x := 42   // Escapes to heap because we return a pointer
    return &x // Pointer to heap-allocated memory
}

// Escape analysis examples
type LargeStruct struct {
    data [1024]byte
}

// Value receiver - struct copied (may stay on stack)
func (ls LargeStruct) Process() {
    // ls is a copy
}

// Pointer receiver - struct may escape to heap
func (ls *LargeStruct) ProcessPtr() {
    // ls points to original
}

// Slice internals
func sliceMemory() {
    // Slice header (24 bytes on 64-bit): pointer, length, capacity
    // Backing array allocated separately
    
    s := make([]int, 0, 100)  // Backing array on heap
    
    // Slicing doesn't copy data
    s = append(s, 1, 2, 3, 4, 5)
    sub := s[1:3]  // sub shares backing array with s
    
    // Modifying sub affects s
    sub[0] = 100
    fmt.Println(s)  // [1 100 3 4 5]
    
    // To avoid sharing, use copy
    independent := make([]int, len(sub))
    copy(independent, sub)
}

// Map internals
func mapMemory() {
    // Maps are pointers to runtime.hmap
    // Buckets allocated on heap
    
    m := make(map[string]int, 100)  // Pre-allocate buckets
    m["key"] = 42
    
    // Maps grow automatically but never shrink
    // For large maps that shrink, consider recreating
}

func main() {
    // Run with: go build -gcflags="-m" to see escape analysis
    _ = stackAllocation()
    _ = heapAllocation()
    sliceMemory()
    mapMemory()
}
```

### Garbage Collection

Go uses a concurrent, tri-color mark-and-sweep garbage collector. Understanding its behavior helps write GC-friendly code.

```go
package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

// GC-friendly patterns

// 1. Reuse allocations with sync.Pool
var bufPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 4096)
    },
}

func processData(data []byte) {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf)
    
    // Use buf for processing...
    copy(buf, data)
}

// 2. Pre-allocate slices when size is known
func efficientSlice(n int) []int {
    // Good: pre-allocate
    result := make([]int, 0, n)
    for i := 0; i < n; i++ {
        result = append(result, i)
    }
    return result
}

func inefficientSlice(n int) []int {
    // Bad: multiple reallocations
    var result []int
    for i := 0; i < n; i++ {
        result = append(result, i)  // May reallocate multiple times
    }
    return result
}

// 3. Avoid string concatenation in loops
func efficientStringBuild(items []string) string {
    // Good: use strings.Builder
    var builder strings.Builder
    builder.Grow(1024)  // Pre-allocate
    for _, item := range items {
        builder.WriteString(item)
    }
    return builder.String()
}

// 4. Use value types for small structs
type Point struct {
    X, Y float64
}

func processPoints(points []Point) {  // Value slice, not pointer slice
    for i := range points {
        points[i].X *= 2
        points[i].Y *= 2
    }
}

// 5. Reduce pointer chasing
type Node struct {
    Value int
    Next  *Node  // Pointer chasing - GC must trace
}

type FlatList struct {
    Values []int  // Contiguous memory - GC-friendly
}

// GC tuning and monitoring
func gcStats() {
    var stats runtime.MemStats
    runtime.ReadMemStats(&stats)
    
    fmt.Printf("Alloc: %d MB\n", stats.Alloc/1024/1024)
    fmt.Printf("TotalAlloc: %d MB\n", stats.TotalAlloc/1024/1024)
    fmt.Printf("Sys: %d MB\n", stats.Sys/1024/1024)
    fmt.Printf("NumGC: %d\n", stats.NumGC)
    fmt.Printf("GCCPUFraction: %.4f\n", stats.GCCPUFraction)
}

// GOGC environment variable controls GC frequency
// GOGC=100 (default): GC when heap doubles
// GOGC=50: GC more frequently (lower memory, more CPU)
// GOGC=200: GC less frequently (higher memory, less CPU)
// GOGC=off: Disable GC (use with caution)

func main() {
    // Force GC (rarely needed in production)
    runtime.GC()
    
    // Get number of goroutines
    fmt.Printf("Goroutines: %d\n", runtime.NumGoroutine())
    
    // Set max CPUs
    runtime.GOMAXPROCS(runtime.NumCPU())
    
    gcStats()
}
```

---

## Interface Design and Composition

Go's interface system enables powerful abstractions through composition rather than inheritance. This pattern is used extensively in Grafana's codebase.

### Interface Basics

```go
package main

import (
    "fmt"
    "io"
)

// Interface definition - implicit implementation
type Writer interface {
    Write(p []byte) (n int, err error)
}

type Reader interface {
    Read(p []byte) (n int, err error)
}

// Interface composition
type ReadWriter interface {
    Reader
    Writer
}

// Implementing interfaces
type Buffer struct {
    data []byte
}

func (b *Buffer) Write(p []byte) (n int, err error) {
    b.data = append(b.data, p...)
    return len(p), nil
}

func (b *Buffer) Read(p []byte) (n int, err error) {
    if len(b.data) == 0 {
        return 0, io.EOF
    }
    n = copy(p, b.data)
    b.data = b.data[n:]
    return n, nil
}

// Accept interfaces, return structs
func ProcessData(r Reader) error {
    buf := make([]byte, 1024)
    for {
        n, err := r.Read(buf)
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
        fmt.Printf("Read %d bytes\n", n)
    }
    return nil
}

// Empty interface - accepts any type
func printAny(v interface{}) {
    fmt.Printf("Type: %T, Value: %v\n", v, v)
}

// Type assertion
func processValue(v interface{}) {
    // Type assertion with ok check
    if str, ok := v.(string); ok {
        fmt.Printf("String: %s\n", str)
        return
    }
    
    // Type switch
    switch val := v.(type) {
    case int:
        fmt.Printf("Integer: %d\n", val)
    case string:
        fmt.Printf("String: %s\n", val)
    case []byte:
        fmt.Printf("Bytes: %v\n", val)
    default:
        fmt.Printf("Unknown type: %T\n", val)
    }
}

func main() {
    buf := &Buffer{}
    buf.Write([]byte("Hello, World!"))
    
    // Buffer implements ReadWriter
    var rw ReadWriter = buf
    _ = rw
    
    // Process with interface
    buf2 := &Buffer{}
    buf2.Write([]byte("Test data"))
    ProcessData(buf2)
    
    // Empty interface
    printAny(42)
    printAny("hello")
    printAny([]int{1, 2, 3})
}
```

### Interface Design Patterns

```go
package main

import (
    "context"
    "fmt"
    "time"
)

// Small, focused interfaces (Interface Segregation Principle)

// Bad: Large interface
type BadStorage interface {
    Read(key string) ([]byte, error)
    Write(key string, value []byte) error
    Delete(key string) error
    List(prefix string) ([]string, error)
    Watch(prefix string) (<-chan Event, error)
    Backup() error
    Restore(path string) error
}

// Good: Small, composable interfaces
type Reader interface {
    Read(key string) ([]byte, error)
}

type Writer interface {
    Write(key string, value []byte) error
}

type Deleter interface {
    Delete(key string) error
}

type Lister interface {
    List(prefix string) ([]string, error)
}

// Compose as needed
type ReadWriter interface {
    Reader
    Writer
}

type Storage interface {
    Reader
    Writer
    Deleter
    Lister
}

// Functional options pattern with interfaces
type ServerOption func(*Server)

type Server struct {
    host    string
    port    int
    timeout time.Duration
    logger  Logger
}

type Logger interface {
    Info(msg string, args ...interface{})
    Error(msg string, args ...interface{})
}

func WithHost(host string) ServerOption {
    return func(s *Server) {
        s.host = host
    }
}

func WithPort(port int) ServerOption {
    return func(s *Server) {
        s.port = port
    }
}

func WithTimeout(timeout time.Duration) ServerOption {
    return func(s *Server) {
        s.timeout = timeout
    }
}

func WithLogger(logger Logger) ServerOption {
    return func(s *Server) {
        s.logger = logger
    }
}

func NewServer(opts ...ServerOption) *Server {
    s := &Server{
        host:    "localhost",
        port:    8080,
        timeout: 30 * time.Second,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Decorator pattern with interfaces
type LogStore interface {
    Store(ctx context.Context, entry LogEntry) error
    Query(ctx context.Context, query string) ([]LogEntry, error)
}

type LogEntry struct {
    Timestamp time.Time
    Message   string
    Labels    map[string]string
}

// Base implementation
type InMemoryStore struct {
    entries []LogEntry
}

func (s *InMemoryStore) Store(ctx context.Context, entry LogEntry) error {
    s.entries = append(s.entries, entry)
    return nil
}

func (s *InMemoryStore) Query(ctx context.Context, query string) ([]LogEntry, error) {
    // Simple implementation
    return s.entries, nil
}

// Decorator: Add metrics
type MetricsDecorator struct {
    store   LogStore
    metrics *Metrics
}

type Metrics struct {
    storeCount int
    queryCount int
}

func (d *MetricsDecorator) Store(ctx context.Context, entry LogEntry) error {
    d.metrics.storeCount++
    return d.store.Store(ctx, entry)
}

func (d *MetricsDecorator) Query(ctx context.Context, query string) ([]LogEntry, error) {
    d.metrics.queryCount++
    return d.store.Query(ctx, query)
}

// Decorator: Add caching
type CachingDecorator struct {
    store LogStore
    cache map[string][]LogEntry
}

func (d *CachingDecorator) Store(ctx context.Context, entry LogEntry) error {
    // Invalidate cache on write
    d.cache = make(map[string][]LogEntry)
    return d.store.Store(ctx, entry)
}

func (d *CachingDecorator) Query(ctx context.Context, query string) ([]LogEntry, error) {
    if cached, ok := d.cache[query]; ok {
        return cached, nil
    }
    result, err := d.store.Query(ctx, query)
    if err == nil {
        d.cache[query] = result
    }
    return result, err
}

// Dependency injection with interfaces
type Service struct {
    store  LogStore
    logger Logger
}

func NewService(store LogStore, logger Logger) *Service {
    return &Service{
        store:  store,
        logger: logger,
    }
}

func (s *Service) ProcessLog(ctx context.Context, msg string) error {
    entry := LogEntry{
        Timestamp: time.Now(),
        Message:   msg,
    }
    
    if err := s.store.Store(ctx, entry); err != nil {
        s.logger.Error("Failed to store log", "error", err)
        return err
    }
    
    s.logger.Info("Log stored successfully")
    return nil
}

func main() {
    // Create server with options
    server := NewServer(
        WithHost("0.0.0.0"),
        WithPort(3100),
        WithTimeout(60*time.Second),
    )
    fmt.Printf("Server: %+v\n", server)
    
    // Compose decorators
    baseStore := &InMemoryStore{}
    metrics := &Metrics{}
    
    // Wrap with metrics
    metricsStore := &MetricsDecorator{
        store:   baseStore,
        metrics: metrics,
    }
    
    // Wrap with caching
    cachedStore := &CachingDecorator{
        store: metricsStore,
        cache: make(map[string][]LogEntry),
    }
    
    // Use the decorated store
    ctx := context.Background()
    cachedStore.Store(ctx, LogEntry{Message: "test"})
    cachedStore.Query(ctx, "all")
    
    fmt.Printf("Store count: %d, Query count: %d\n", 
        metrics.storeCount, metrics.queryCount)
}
```

---

## Distributed Systems Foundations

Understanding distributed systems concepts is essential for working on Loki and other Grafana backend services. This section covers the theoretical foundations that inform the design of these systems.

### CAP Theorem and Trade-offs

The CAP theorem states that a distributed system can only provide two of three guarantees: Consistency, Availability, and Partition Tolerance.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CAP THEOREM                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              Consistency                                         │
│                                   ▲                                              │
│                                  /│\                                             │
│                                 / │ \                                            │
│                                /  │  \                                           │
│                               /   │   \                                          │
│                              /    │    \                                         │
│                             /  CP │ CA  \                                        │
│                            /      │      \                                       │
│                           /       │       \                                      │
│                          /        │        \                                     │
│                         ▼─────────┴─────────▼                                    │
│                   Partition              Availability                            │
│                   Tolerance                                                      │
│                         └────────AP────────┘                                     │
│                                                                                  │
│  CP Systems: Choose consistency over availability during partitions              │
│  Examples: ZooKeeper, etcd, HBase                                               │
│                                                                                  │
│  AP Systems: Choose availability over consistency during partitions              │
│  Examples: Cassandra, DynamoDB, Loki (for writes)                               │
│                                                                                  │
│  CA Systems: Not possible in distributed systems (partitions happen)             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Consistency Models

Different consistency models offer different trade-offs between correctness and performance.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONSISTENCY SPECTRUM                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Stronger ◄──────────────────────────────────────────────────────► Weaker       │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │Linearizable │  │ Sequential  │  │   Causal    │  │  Eventual   │            │
│  │             │  │             │  │             │  │             │            │
│  │ Real-time   │  │ Total order │  │ Respects    │  │ Eventually  │            │
│  │ ordering    │  │ of ops      │  │ causality   │  │ converges   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Lower latency ◄─────────────────────────────────────────────► Higher latency   │
│  Higher availability ◄───────────────────────────────► Lower availability       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

LINEARIZABILITY (Strong Consistency)
────────────────────────────────────
- Operations appear to execute atomically at some point between invocation and response
- All clients see the same order of operations
- Highest consistency guarantee, but highest latency

Example: Single-leader database with synchronous replication

SEQUENTIAL CONSISTENCY
──────────────────────
- Operations from each client appear in the order they were issued
- Different clients may see different orderings
- Weaker than linearizable but still provides strong guarantees

CAUSAL CONSISTENCY
──────────────────
- Operations that are causally related are seen in the same order by all clients
- Concurrent operations may be seen in different orders
- Good balance of consistency and availability

Example: If A causes B, all clients see A before B

EVENTUAL CONSISTENCY
────────────────────
- If no new updates are made, all replicas will eventually converge
- No guarantees about when convergence happens
- Highest availability, lowest latency

Example: DNS, Cassandra with low consistency level
```

### Consensus Algorithms Overview

Consensus algorithms allow distributed systems to agree on values despite failures.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONSENSUS ALGORITHMS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RAFT (Used by etcd, Consul)                                                    │
│  ───────────────────────────                                                    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │    ┌──────────┐         ┌──────────┐         ┌──────────┐              │   │
│  │    │ Follower │◄───────▶│  Leader  │◄───────▶│ Follower │              │   │
│  │    └──────────┘         └──────────┘         └──────────┘              │   │
│  │                               │                                         │   │
│  │                               │ Heartbeats                              │   │
│  │                               │ Log Replication                         │   │
│  │                               ▼                                         │   │
│  │                         ┌──────────┐                                   │   │
│  │                         │ Follower │                                   │   │
│  │                         └──────────┘                                   │   │
│  │                                                                          │   │
│  │  Key Concepts:                                                          │   │
│  │  • Leader Election: Followers become candidates after timeout           │   │
│  │  • Log Replication: Leader replicates entries to followers             │   │
│  │  • Safety: Only candidates with up-to-date logs can become leader      │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  PAXOS (Theoretical foundation)                                                 │
│  ──────────────────────────────                                                 │
│  • Proposers: Propose values                                                    │
│  • Acceptors: Accept/reject proposals                                           │
│  • Learners: Learn the chosen value                                             │
│  • Two-phase protocol: Prepare → Accept                                         │
│                                                                                  │
│  GOSSIP PROTOCOLS (Used by Cassandra, Memberlist)                               │
│  ────────────────────────────────────────────────                               │
│  • Epidemic-style information dissemination                                     │
│  • Each node periodically shares state with random peers                        │
│  • Eventually consistent, highly available                                      │
│  • Used for: Membership, failure detection, metadata propagation                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Sharding Strategies

Sharding distributes data across multiple nodes to achieve horizontal scalability.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SHARDING STRATEGIES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. HASH-BASED SHARDING                                                         │
│  ──────────────────────                                                         │
│                                                                                  │
│     shard = hash(key) % num_shards                                              │
│                                                                                  │
│     ┌─────────┐                                                                 │
│     │  Key    │──▶ hash() ──▶ mod N ──▶ Shard                                  │
│     └─────────┘                                                                 │
│                                                                                  │
│     Pros: Even distribution, simple                                             │
│     Cons: Resharding requires data movement                                     │
│                                                                                  │
│  2. CONSISTENT HASHING (Used by Loki, Cassandra)                                │
│  ───────────────────────────────────────────────                                │
│                                                                                  │
│              Node A                                                              │
│                 ●                                                                │
│            ╱         ╲                                                          │
│          ╱             ╲                                                        │
│     Node D ●             ● Node B                                               │
│          ╲             ╱                                                        │
│            ╲         ╱                                                          │
│                 ●                                                                │
│              Node C                                                              │
│                                                                                  │
│     • Keys and nodes mapped to same hash ring                                   │
│     • Key assigned to first node clockwise                                      │
│     • Adding/removing nodes only affects neighbors                              │
│     • Virtual nodes improve distribution                                        │
│                                                                                  │
│  3. RANGE-BASED SHARDING                                                        │
│  ──────────────────────                                                         │
│                                                                                  │
│     Shard 1: A-M    Shard 2: N-Z                                               │
│                                                                                  │
│     Pros: Range queries efficient                                               │
│     Cons: Hot spots possible, manual rebalancing                                │
│                                                                                  │
│  4. DIRECTORY-BASED SHARDING                                                    │
│  ─────────────────────────                                                      │
│                                                                                  │
│     ┌─────────────┐                                                             │
│     │  Directory  │                                                             │
│     │   Service   │                                                             │
│     └──────┬──────┘                                                             │
│            │                                                                     │
│     ┌──────┴──────┬──────────────┐                                             │
│     ▼             ▼              ▼                                              │
│  Shard 1      Shard 2        Shard 3                                           │
│                                                                                  │
│     Pros: Flexible placement                                                    │
│     Cons: Directory is single point of failure                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Replication Patterns

Replication provides fault tolerance and can improve read performance.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REPLICATION PATTERNS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SINGLE-LEADER (Primary-Replica)                                             │
│  ──────────────────────────────────                                             │
│                                                                                  │
│     ┌──────────┐                                                                │
│     │  Leader  │◄─── All Writes                                                 │
│     └────┬─────┘                                                                │
│          │ Replication                                                          │
│     ┌────┴────┬────────────┐                                                   │
│     ▼         ▼            ▼                                                    │
│  ┌──────┐ ┌──────┐    ┌──────┐                                                 │
│  │Replica│ │Replica│    │Replica│◄─── Reads                                     │
│  └──────┘ └──────┘    └──────┘                                                 │
│                                                                                  │
│  Pros: Simple, strong consistency possible                                      │
│  Cons: Leader is bottleneck, failover complexity                                │
│                                                                                  │
│  2. MULTI-LEADER                                                                │
│  ──────────────                                                                 │
│                                                                                  │
│     ┌──────────┐         ┌──────────┐                                          │
│     │ Leader 1 │◄───────▶│ Leader 2 │                                          │
│     └────┬─────┘         └────┬─────┘                                          │
│          │                    │                                                 │
│     ┌────┴────┐          ┌────┴────┐                                           │
│     ▼         ▼          ▼         ▼                                           │
│  Replica   Replica    Replica   Replica                                        │
│                                                                                  │
│  Pros: Better write availability, geographic distribution                       │
│  Cons: Conflict resolution required                                             │
│                                                                                  │
│  3. LEADERLESS (Dynamo-style)                                                   │
│  ────────────────────────────                                                   │
│                                                                                  │
│     ┌──────┐   ┌──────┐   ┌──────┐                                             │
│     │Node 1│◄─▶│Node 2│◄─▶│Node 3│                                             │
│     └──────┘   └──────┘   └──────┘                                             │
│         ▲          ▲          ▲                                                 │
│         └──────────┴──────────┘                                                 │
│              Client writes to                                                   │
│              multiple nodes                                                     │
│                                                                                  │
│  Quorum: W + R > N for consistency                                              │
│  • N = total replicas                                                           │
│  • W = write quorum                                                             │
│  • R = read quorum                                                              │
│                                                                                  │
│  Example: N=3, W=2, R=2                                                         │
│  • Write succeeds if 2 of 3 nodes acknowledge                                   │
│  • Read from 2 nodes, return latest version                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Practical Example: Distributed Counter

Here's a Go implementation demonstrating distributed systems concepts:

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// CRDT: Conflict-free Replicated Data Type
// G-Counter (Grow-only Counter) - eventually consistent

type GCounter struct {
    mu       sync.RWMutex
    nodeID   string
    counters map[string]int64  // nodeID -> count
}

func NewGCounter(nodeID string) *GCounter {
    return &GCounter{
        nodeID:   nodeID,
        counters: make(map[string]int64),
    }
}

// Increment only affects local node's counter
func (g *GCounter) Increment(delta int64) {
    g.mu.Lock()
    defer g.mu.Unlock()
    g.counters[g.nodeID] += delta
}

// Value returns the sum of all node counters
func (g *GCounter) Value() int64 {
    g.mu.RLock()
    defer g.mu.RUnlock()
    
    var total int64
    for _, count := range g.counters {
        total += count
    }
    return total
}

// Merge combines state from another counter (idempotent)
func (g *GCounter) Merge(other *GCounter) {
    g.mu.Lock()
    defer g.mu.Unlock()
    other.mu.RLock()
    defer other.mu.RUnlock()
    
    for nodeID, count := range other.counters {
        if count > g.counters[nodeID] {
            g.counters[nodeID] = count
        }
    }
}

// State returns a copy of the counter state for replication
func (g *GCounter) State() map[string]int64 {
    g.mu.RLock()
    defer g.mu.RUnlock()
    
    state := make(map[string]int64)
    for k, v := range g.counters {
        state[k] = v
    }
    return state
}

// Consistent Hashing Ring
type HashRing struct {
    mu       sync.RWMutex
    nodes    []string
    replicas int  // Virtual nodes per physical node
}

func NewHashRing(replicas int) *HashRing {
    return &HashRing{
        nodes:    make([]string, 0),
        replicas: replicas,
    }
}

func (r *HashRing) AddNode(node string) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.nodes = append(r.nodes, node)
}

func (r *HashRing) RemoveNode(node string) {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    for i, n := range r.nodes {
        if n == node {
            r.nodes = append(r.nodes[:i], r.nodes[i+1:]...)
            return
        }
    }
}

func (r *HashRing) GetNode(key string) string {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    if len(r.nodes) == 0 {
        return ""
    }
    
    // Simple hash (use better hash in production)
    hash := 0
    for _, c := range key {
        hash = hash*31 + int(c)
    }
    
    return r.nodes[hash%len(r.nodes)]
}

// Circuit Breaker Pattern
type CircuitBreaker struct {
    mu              sync.Mutex
    failures        int
    successes       int
    state           string  // "closed", "open", "half-open"
    threshold       int
    resetTimeout    time.Duration
    lastFailureTime time.Time
}

func NewCircuitBreaker(threshold int, resetTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:        "closed",
        threshold:    threshold,
        resetTimeout: resetTimeout,
    }
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    cb.mu.Lock()
    
    // Check if circuit should transition from open to half-open
    if cb.state == "open" {
        if time.Since(cb.lastFailureTime) > cb.resetTimeout {
            cb.state = "half-open"
        } else {
            cb.mu.Unlock()
            return fmt.Errorf("circuit breaker is open")
        }
    }
    cb.mu.Unlock()
    
    // Execute the function
    err := fn()
    
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if err != nil {
        cb.failures++
        cb.lastFailureTime = time.Now()
        
        if cb.failures >= cb.threshold {
            cb.state = "open"
        }
        return err
    }
    
    // Success
    if cb.state == "half-open" {
        cb.state = "closed"
        cb.failures = 0
    }
    cb.successes++
    return nil
}

func main() {
    // G-Counter example
    counter1 := NewGCounter("node1")
    counter2 := NewGCounter("node2")
    
    // Each node increments locally
    counter1.Increment(5)
    counter1.Increment(3)
    counter2.Increment(7)
    
    fmt.Printf("Counter1 value: %d\n", counter1.Value())  // 8
    fmt.Printf("Counter2 value: %d\n", counter2.Value())  // 7
    
    // Merge states (simulating replication)
    counter1.Merge(counter2)
    counter2.Merge(counter1)
    
    fmt.Printf("After merge - Counter1: %d\n", counter1.Value())  // 15
    fmt.Printf("After merge - Counter2: %d\n", counter2.Value())  // 15
    
    // Hash ring example
    ring := NewHashRing(3)
    ring.AddNode("node1")
    ring.AddNode("node2")
    ring.AddNode("node3")
    
    keys := []string{"user:123", "user:456", "user:789"}
    for _, key := range keys {
        node := ring.GetNode(key)
        fmt.Printf("Key %s -> Node %s\n", key, node)
    }
    
    // Circuit breaker example
    cb := NewCircuitBreaker(3, 5*time.Second)
    
    // Simulate failures
    for i := 0; i < 5; i++ {
        err := cb.Execute(func() error {
            return fmt.Errorf("simulated failure")
        })
        fmt.Printf("Attempt %d: %v\n", i+1, err)
    }
}
```

---

## Related Resources

### Shared Concepts

For foundational knowledge that applies across all Grafana roles, refer to these shared concept documents:

- **[Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md)**: Overview of Grafana architecture, components, and the broader ecosystem
- **[LGTM Stack](../../shared-concepts/lgtm-stack.md)**: Deep dive into Loki, Grafana, Tempo, Mimir, and Pyroscope, including PromQL and LogQL fundamentals
- **[Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)**: Core Kubernetes concepts essential for deploying and operating Grafana services
- **[Observability Principles](../../shared-concepts/observability-principles.md)**: The three pillars of observability, instrumentation patterns, and SLO/SLI/SLA concepts

### Next Steps

After mastering these fundamentals, proceed to:

- **[Intermediate Topics](./intermediate.md)**: Kafka at scale, Kubernetes operations, microservices patterns
- **[Advanced Topics](./advanced.md)**: Loki internals, distributed storage optimization, SRE practices

### External Resources

- [Go Documentation](https://go.dev/doc/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Concurrency Patterns](https://go.dev/blog/pipelines)
- [Designing Data-Intensive Applications](https://dataintensive.net/) by Martin Kleppmann
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
