// Package concurrency provides practical implementations of Go concurrency patterns
// commonly used in Grafana's backend services like Loki, Mimir, and Tempo.
//
// This file demonstrates:
// - Basic goroutine and channel patterns
// - Worker pool implementation with configurable workers
// - Fan-out/fan-in pattern for parallel processing
// - Proper error handling throughout
//
// These patterns are essential for building high-performance, scalable distributed
// systems and are frequently discussed in Grafana backend engineering interviews.
package concurrency

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// =============================================================================
// SECTION 1: Basic Goroutine and Channel Examples
// =============================================================================

// Task represents a unit of work to be processed.
// In Loki, similar structures represent log entries or query chunks.
type Task struct {
	ID   int
	Data string
}

// Result represents the outcome of processing a task.
type Result struct {
	TaskID    int
	Output    string
	Error     error
	Duration  time.Duration
	ProcessedAt time.Time
}

// BasicGoroutineExample demonstrates launching goroutines and collecting results
// via channels. This is the foundation of Go's concurrency model.
//
// Pattern: Launch N goroutines, each sends result to a shared channel.
// The main goroutine collects all results.
func BasicGoroutineExample(tasks []Task) []Result {
	// Create a buffered channel to avoid blocking goroutines
	// Buffer size equals task count to prevent deadlock
	resultChan := make(chan Result, len(tasks))

	// Launch a goroutine for each task
	for _, task := range tasks {
		// Capture task in closure to avoid race condition
		go func(t Task) {
			start := time.Now()
			// Simulate processing
			output := fmt.Sprintf("Processed: %s", t.Data)
			
			resultChan <- Result{
				TaskID:      t.ID,
				Output:      output,
				Duration:    time.Since(start),
				ProcessedAt: time.Now(),
			}
		}(task)
	}

	// Collect all results
	results := make([]Result, 0, len(tasks))
	for i := 0; i < len(tasks); i++ {
		results = append(results, <-resultChan)
	}

	return results
}

// ChannelDirectionExample demonstrates typed channel directions for safer code.
// Send-only and receive-only channels prevent misuse at compile time.
func ChannelDirectionExample(tasks []Task) <-chan Result {
	// Return a receive-only channel
	out := make(chan Result, len(tasks))

	go func() {
		defer close(out) // Always close channels when done sending
		for _, task := range tasks {
			out <- Result{
				TaskID: task.ID,
				Output: fmt.Sprintf("Processed: %s", task.Data),
			}
		}
	}()

	return out
}

// SelectWithTimeoutExample demonstrates the select statement for multiplexing
// channel operations with timeout handling. This pattern is crucial for
// preventing goroutine leaks and handling slow operations.
func SelectWithTimeoutExample(ctx context.Context, taskChan <-chan Task, timeout time.Duration) (Result, error) {
	select {
	case task, ok := <-taskChan:
		if !ok {
			return Result{}, errors.New("task channel closed")
		}
		return Result{
			TaskID: task.ID,
			Output: fmt.Sprintf("Processed: %s", task.Data),
		}, nil

	case <-time.After(timeout):
		return Result{}, fmt.Errorf("timeout after %v waiting for task", timeout)

	case <-ctx.Done():
		return Result{}, fmt.Errorf("context cancelled: %w", ctx.Err())
	}
}

// =============================================================================
// SECTION 2: Worker Pool Implementation
// =============================================================================

// WorkerPool manages a fixed number of worker goroutines that process jobs
// from a shared queue. This pattern is used extensively in Loki for:
// - Processing log ingestion batches
// - Executing parallel queries across chunks
// - Handling concurrent write requests
//
// Benefits:
// - Bounded concurrency prevents resource exhaustion
// - Reuses goroutines reducing allocation overhead
// - Provides backpressure when workers are busy
type WorkerPool struct {
	numWorkers int
	jobQueue   chan Job
	results    chan JobResult
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
	started    bool
	mu         sync.Mutex
}

// Job represents work to be processed by the worker pool.
type Job struct {
	ID      int
	Payload interface{}
	// Handler is the function that processes this job
	Handler func(ctx context.Context, payload interface{}) (interface{}, error)
}

// JobResult contains the outcome of processing a job.
type JobResult struct {
	JobID     int
	Result    interface{}
	Error     error
	Duration  time.Duration
	WorkerID  int
}

// NewWorkerPool creates a new worker pool with the specified number of workers.
// The queueSize determines how many jobs can be buffered before Submit blocks.
func NewWorkerPool(numWorkers, queueSize int) *WorkerPool {
	if numWorkers <= 0 {
		numWorkers = 1
	}
	if queueSize <= 0 {
		queueSize = 100
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &WorkerPool{
		numWorkers: numWorkers,
		jobQueue:   make(chan Job, queueSize),
		results:    make(chan JobResult, queueSize),
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Start launches the worker goroutines. Must be called before submitting jobs.
func (wp *WorkerPool) Start() {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if wp.started {
		return
	}
	wp.started = true

	// Launch worker goroutines
	for i := 0; i < wp.numWorkers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

// worker is the main loop for each worker goroutine.
func (wp *WorkerPool) worker(workerID int) {
	defer wp.wg.Done()

	for {
		select {
		case <-wp.ctx.Done():
			return

		case job, ok := <-wp.jobQueue:
			if !ok {
				return // Channel closed, exit worker
			}

			start := time.Now()
			var result interface{}
			var err error

			// Execute the job handler with panic recovery
			func() {
				defer func() {
					if r := recover(); r != nil {
						err = fmt.Errorf("panic in job %d: %v", job.ID, r)
					}
				}()

				if job.Handler != nil {
					result, err = job.Handler(wp.ctx, job.Payload)
				} else {
					err = errors.New("job handler is nil")
				}
			}()

			// Send result (non-blocking with select to handle shutdown)
			select {
			case wp.results <- JobResult{
				JobID:    job.ID,
				Result:   result,
				Error:    err,
				Duration: time.Since(start),
				WorkerID: workerID,
			}:
			case <-wp.ctx.Done():
				return
			}
		}
	}
}

// Submit adds a job to the queue. Blocks if the queue is full.
// Returns an error if the pool is shutting down.
func (wp *WorkerPool) Submit(job Job) error {
	select {
	case <-wp.ctx.Done():
		return errors.New("worker pool is shutting down")
	case wp.jobQueue <- job:
		return nil
	}
}

// SubmitWithTimeout adds a job to the queue with a timeout.
// Returns an error if the timeout expires before the job is queued.
func (wp *WorkerPool) SubmitWithTimeout(job Job, timeout time.Duration) error {
	select {
	case <-wp.ctx.Done():
		return errors.New("worker pool is shutting down")
	case wp.jobQueue <- job:
		return nil
	case <-time.After(timeout):
		return fmt.Errorf("timeout submitting job %d after %v", job.ID, timeout)
	}
}

// Results returns the channel for receiving job results.
func (wp *WorkerPool) Results() <-chan JobResult {
	return wp.results
}

// Stop gracefully shuts down the worker pool.
// It stops accepting new jobs and waits for in-flight jobs to complete.
func (wp *WorkerPool) Stop() {
	wp.cancel()        // Signal workers to stop
	close(wp.jobQueue) // Close job queue
	wp.wg.Wait()       // Wait for all workers to finish
	close(wp.results)  // Close results channel
}

// StopWithTimeout attempts graceful shutdown with a timeout.
// If workers don't finish in time, it returns an error.
func (wp *WorkerPool) StopWithTimeout(timeout time.Duration) error {
	wp.cancel()
	close(wp.jobQueue)

	done := make(chan struct{})
	go func() {
		wp.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		close(wp.results)
		return nil
	case <-time.After(timeout):
		return errors.New("timeout waiting for workers to finish")
	}
}

// =============================================================================
// SECTION 3: Fan-Out/Fan-In Pattern
// =============================================================================

// FanOutFanIn implements the fan-out/fan-in pattern for parallel processing.
// This pattern is used in Loki for:
// - Distributing query execution across multiple chunks
// - Parallel log line parsing and labeling
// - Concurrent metric aggregation
//
// Fan-Out: Distribute work to multiple goroutines
// Fan-In: Collect results from multiple goroutines into a single channel
type FanOutFanIn struct {
	numWorkers int
}

// NewFanOutFanIn creates a new fan-out/fan-in processor.
func NewFanOutFanIn(numWorkers int) *FanOutFanIn {
	if numWorkers <= 0 {
		numWorkers = 1
	}
	return &FanOutFanIn{numWorkers: numWorkers}
}

// ProcessFunc is the function signature for processing items.
type ProcessFunc func(ctx context.Context, item interface{}) (interface{}, error)

// ProcessResult contains the result of processing an item.
type ProcessResult struct {
	Index    int
	Input    interface{}
	Output   interface{}
	Error    error
	Duration time.Duration
}

// Process distributes items across workers and collects results.
// Results are returned in the order they complete, not input order.
func (f *FanOutFanIn) Process(ctx context.Context, items []interface{}, processor ProcessFunc) []ProcessResult {
	if len(items) == 0 {
		return nil
	}

	// Create channels for fan-out and fan-in
	inputChan := make(chan indexedItem, len(items))
	resultChan := make(chan ProcessResult, len(items))

	// Fan-out: Start workers
	var wg sync.WaitGroup
	for i := 0; i < f.numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			f.worker(ctx, inputChan, resultChan, processor)
		}()
	}

	// Send items to workers
	go func() {
		for i, item := range items {
			select {
			case inputChan <- indexedItem{index: i, item: item}:
			case <-ctx.Done():
				break
			}
		}
		close(inputChan)
	}()

	// Wait for workers to finish, then close results
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Fan-in: Collect results
	results := make([]ProcessResult, 0, len(items))
	for result := range resultChan {
		results = append(results, result)
	}

	return results
}

// ProcessOrdered is like Process but returns results in input order.
// This is useful when result ordering matters.
func (f *FanOutFanIn) ProcessOrdered(ctx context.Context, items []interface{}, processor ProcessFunc) []ProcessResult {
	unordered := f.Process(ctx, items, processor)

	// Sort results by index
	ordered := make([]ProcessResult, len(items))
	for _, r := range unordered {
		if r.Index >= 0 && r.Index < len(ordered) {
			ordered[r.Index] = r
		}
	}

	return ordered
}

// indexedItem wraps an item with its original index for ordered processing.
type indexedItem struct {
	index int
	item  interface{}
}

// worker processes items from the input channel and sends results to output.
func (f *FanOutFanIn) worker(ctx context.Context, input <-chan indexedItem, output chan<- ProcessResult, processor ProcessFunc) {
	for {
		select {
		case <-ctx.Done():
			return

		case item, ok := <-input:
			if !ok {
				return
			}

			start := time.Now()
			result, err := f.safeProcess(ctx, item.item, processor)

			select {
			case output <- ProcessResult{
				Index:    item.index,
				Input:    item.item,
				Output:   result,
				Error:    err,
				Duration: time.Since(start),
			}:
			case <-ctx.Done():
				return
			}
		}
	}
}

// safeProcess wraps the processor with panic recovery.
func (f *FanOutFanIn) safeProcess(ctx context.Context, item interface{}, processor ProcessFunc) (result interface{}, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic during processing: %v", r)
		}
	}()

	return processor(ctx, item)
}

// =============================================================================
// SECTION 4: Pipeline Pattern
// =============================================================================

// Pipeline implements a multi-stage processing pipeline where each stage
// runs concurrently. This pattern is used in Loki for:
// - Log ingestion: Parse -> Label -> Index -> Store
// - Query execution: Fetch -> Filter -> Aggregate -> Format
//
// Each stage is a goroutine that reads from input channel and writes to output.
type Pipeline struct {
	stages []PipelineStage
}

// PipelineStage represents a single stage in the pipeline.
type PipelineStage struct {
	Name    string
	Process func(ctx context.Context, in <-chan interface{}) <-chan interface{}
}

// NewPipeline creates a new pipeline with the given stages.
func NewPipeline(stages ...PipelineStage) *Pipeline {
	return &Pipeline{stages: stages}
}

// Run executes the pipeline, connecting all stages.
// Returns a channel that emits final results.
func (p *Pipeline) Run(ctx context.Context, input <-chan interface{}) <-chan interface{} {
	if len(p.stages) == 0 {
		return input
	}

	// Chain stages together
	current := input
	for _, stage := range p.stages {
		current = stage.Process(ctx, current)
	}

	return current
}

// =============================================================================
// SECTION 5: Error Group Pattern
// =============================================================================

// ErrorGroup manages a group of goroutines and collects their errors.
// Unlike sync.WaitGroup, it captures errors from goroutines.
// This is similar to golang.org/x/sync/errgroup but simplified.
type ErrorGroup struct {
	wg     sync.WaitGroup
	mu     sync.Mutex
	errors []error
	ctx    context.Context
	cancel context.CancelFunc
}

// NewErrorGroup creates a new error group with context.
func NewErrorGroup(ctx context.Context) *ErrorGroup {
	ctx, cancel := context.WithCancel(ctx)
	return &ErrorGroup{
		ctx:    ctx,
		cancel: cancel,
	}
}

// Go launches a goroutine and tracks its error.
func (eg *ErrorGroup) Go(f func(ctx context.Context) error) {
	eg.wg.Add(1)
	go func() {
		defer eg.wg.Done()

		if err := f(eg.ctx); err != nil {
			eg.mu.Lock()
			eg.errors = append(eg.errors, err)
			eg.mu.Unlock()
		}
	}()
}

// GoWithCancel launches a goroutine that cancels the group on error.
// This is useful when any failure should stop all goroutines.
func (eg *ErrorGroup) GoWithCancel(f func(ctx context.Context) error) {
	eg.wg.Add(1)
	go func() {
		defer eg.wg.Done()

		if err := f(eg.ctx); err != nil {
			eg.mu.Lock()
			eg.errors = append(eg.errors, err)
			eg.mu.Unlock()
			eg.cancel() // Cancel all other goroutines
		}
	}()
}

// Wait blocks until all goroutines complete and returns combined errors.
func (eg *ErrorGroup) Wait() error {
	eg.wg.Wait()

	eg.mu.Lock()
	defer eg.mu.Unlock()

	if len(eg.errors) == 0 {
		return nil
	}

	if len(eg.errors) == 1 {
		return eg.errors[0]
	}

	return fmt.Errorf("multiple errors: %v", eg.errors)
}

// Errors returns all collected errors.
func (eg *ErrorGroup) Errors() []error {
	eg.mu.Lock()
	defer eg.mu.Unlock()

	result := make([]error, len(eg.errors))
	copy(result, eg.errors)
	return result
}

// Context returns the group's context.
func (eg *ErrorGroup) Context() context.Context {
	return eg.ctx
}

// =============================================================================
// SECTION 6: Semaphore Pattern
// =============================================================================

// Semaphore limits concurrent access to a resource.
// This is useful for rate limiting or bounding parallelism.
type Semaphore struct {
	sem chan struct{}
}

// NewSemaphore creates a semaphore with the given capacity.
func NewSemaphore(capacity int) *Semaphore {
	if capacity <= 0 {
		capacity = 1
	}
	return &Semaphore{
		sem: make(chan struct{}, capacity),
	}
}

// Acquire blocks until a slot is available or context is cancelled.
func (s *Semaphore) Acquire(ctx context.Context) error {
	select {
	case s.sem <- struct{}{}:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// TryAcquire attempts to acquire without blocking.
// Returns true if acquired, false otherwise.
func (s *Semaphore) TryAcquire() bool {
	select {
	case s.sem <- struct{}{}:
		return true
	default:
		return false
	}
}

// Release releases a slot back to the semaphore.
func (s *Semaphore) Release() {
	select {
	case <-s.sem:
	default:
		// Semaphore was empty, this is a programming error
		panic("semaphore: release without acquire")
	}
}

// Available returns the number of available slots.
func (s *Semaphore) Available() int {
	return cap(s.sem) - len(s.sem)
}
