package concurrency

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// =============================================================================
// SECTION 1: Basic Goroutine and Channel Tests
// =============================================================================

func TestBasicGoroutineExample(t *testing.T) {
	tasks := []Task{
		{ID: 1, Data: "task-1"},
		{ID: 2, Data: "task-2"},
		{ID: 3, Data: "task-3"},
	}

	results := BasicGoroutineExample(tasks)

	if len(results) != len(tasks) {
		t.Errorf("expected %d results, got %d", len(tasks), len(results))
	}

	// Verify all tasks were processed
	processedIDs := make(map[int]bool)
	for _, r := range results {
		processedIDs[r.TaskID] = true
		if r.Output == "" {
			t.Errorf("task %d has empty output", r.TaskID)
		}
	}

	for _, task := range tasks {
		if !processedIDs[task.ID] {
			t.Errorf("task %d was not processed", task.ID)
		}
	}
}

func TestBasicGoroutineExample_EmptyInput(t *testing.T) {
	results := BasicGoroutineExample([]Task{})
	if len(results) != 0 {
		t.Errorf("expected 0 results for empty input, got %d", len(results))
	}
}

func TestChannelDirectionExample(t *testing.T) {
	tasks := []Task{
		{ID: 1, Data: "data-1"},
		{ID: 2, Data: "data-2"},
	}

	resultChan := ChannelDirectionExample(tasks)

	count := 0
	for result := range resultChan {
		count++
		if result.Output == "" {
			t.Errorf("result for task %d has empty output", result.TaskID)
		}
	}

	if count != len(tasks) {
		t.Errorf("expected %d results, got %d", len(tasks), count)
	}
}

func TestSelectWithTimeoutExample_Success(t *testing.T) {
	ctx := context.Background()
	taskChan := make(chan Task, 1)
	taskChan <- Task{ID: 1, Data: "test-data"}

	result, err := SelectWithTimeoutExample(ctx, taskChan, time.Second)

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if result.TaskID != 1 {
		t.Errorf("expected task ID 1, got %d", result.TaskID)
	}
}

func TestSelectWithTimeoutExample_Timeout(t *testing.T) {
	ctx := context.Background()
	taskChan := make(chan Task) // Unbuffered, no sender

	_, err := SelectWithTimeoutExample(ctx, taskChan, 10*time.Millisecond)

	if err == nil {
		t.Error("expected timeout error, got nil")
	}
}

func TestSelectWithTimeoutExample_ContextCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	taskChan := make(chan Task)

	_, err := SelectWithTimeoutExample(ctx, taskChan, time.Second)

	if err == nil {
		t.Error("expected context cancelled error, got nil")
	}
}

func TestSelectWithTimeoutExample_ChannelClosed(t *testing.T) {
	ctx := context.Background()
	taskChan := make(chan Task)
	close(taskChan)

	_, err := SelectWithTimeoutExample(ctx, taskChan, time.Second)

	if err == nil {
		t.Error("expected channel closed error, got nil")
	}
}

// =============================================================================
// SECTION 2: Worker Pool Tests
// =============================================================================

func TestWorkerPool_BasicOperation(t *testing.T) {
	pool := NewWorkerPool(3, 10)
	pool.Start()
	defer pool.Stop()

	// Submit jobs
	numJobs := 5
	for i := 0; i < numJobs; i++ {
		jobID := i
		err := pool.Submit(Job{
			ID:      jobID,
			Payload: fmt.Sprintf("payload-%d", jobID),
			Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
				return fmt.Sprintf("processed: %v", payload), nil
			},
		})
		if err != nil {
			t.Errorf("failed to submit job %d: %v", jobID, err)
		}
	}

	// Collect results
	results := make([]JobResult, 0, numJobs)
	timeout := time.After(5 * time.Second)
	for i := 0; i < numJobs; i++ {
		select {
		case result := <-pool.Results():
			results = append(results, result)
		case <-timeout:
			t.Fatal("timeout waiting for results")
		}
	}

	if len(results) != numJobs {
		t.Errorf("expected %d results, got %d", numJobs, len(results))
	}

	// Verify no errors
	for _, r := range results {
		if r.Error != nil {
			t.Errorf("job %d failed: %v", r.JobID, r.Error)
		}
	}
}

func TestWorkerPool_ErrorHandling(t *testing.T) {
	pool := NewWorkerPool(2, 10)
	pool.Start()
	defer pool.Stop()

	expectedErr := errors.New("intentional error")

	err := pool.Submit(Job{
		ID:      1,
		Payload: "test",
		Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
			return nil, expectedErr
		},
	})
	if err != nil {
		t.Fatalf("failed to submit job: %v", err)
	}

	select {
	case result := <-pool.Results():
		if result.Error == nil {
			t.Error("expected error in result, got nil")
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for result")
	}
}

func TestWorkerPool_PanicRecovery(t *testing.T) {
	pool := NewWorkerPool(1, 10)
	pool.Start()
	defer pool.Stop()

	err := pool.Submit(Job{
		ID:      1,
		Payload: "test",
		Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
			panic("intentional panic")
		},
	})
	if err != nil {
		t.Fatalf("failed to submit job: %v", err)
	}

	select {
	case result := <-pool.Results():
		if result.Error == nil {
			t.Error("expected error from panic recovery, got nil")
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for result")
	}
}

func TestWorkerPool_NilHandler(t *testing.T) {
	pool := NewWorkerPool(1, 10)
	pool.Start()
	defer pool.Stop()

	err := pool.Submit(Job{
		ID:      1,
		Payload: "test",
		Handler: nil, // Nil handler
	})
	if err != nil {
		t.Fatalf("failed to submit job: %v", err)
	}

	select {
	case result := <-pool.Results():
		if result.Error == nil {
			t.Error("expected error for nil handler, got nil")
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for result")
	}
}

func TestWorkerPool_SubmitWithTimeout(t *testing.T) {
	// Create pool with small queue
	pool := NewWorkerPool(1, 1)
	pool.Start()
	defer pool.Stop()

	// Fill the queue with a slow job
	slowHandler := func(ctx context.Context, payload interface{}) (interface{}, error) {
		time.Sleep(100 * time.Millisecond)
		return nil, nil
	}

	// First job should succeed
	err := pool.Submit(Job{ID: 1, Payload: "first", Handler: slowHandler})
	if err != nil {
		t.Fatalf("first submit failed: %v", err)
	}

	// Second job should timeout (queue is full, worker is busy)
	err = pool.SubmitWithTimeout(Job{ID: 2, Payload: "second", Handler: slowHandler}, 10*time.Millisecond)
	if err == nil {
		t.Error("expected timeout error, got nil")
	}
}

func TestWorkerPool_StopWithTimeout(t *testing.T) {
	pool := NewWorkerPool(2, 10)
	pool.Start()

	// Submit a quick job
	err := pool.Submit(Job{
		ID:      1,
		Payload: "test",
		Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
			return "done", nil
		},
	})
	if err != nil {
		t.Fatalf("failed to submit job: %v", err)
	}

	// Stop should complete quickly
	err = pool.StopWithTimeout(time.Second)
	if err != nil {
		t.Errorf("stop with timeout failed: %v", err)
	}
}

func TestWorkerPool_ConcurrentSubmit(t *testing.T) {
	pool := NewWorkerPool(5, 100)
	pool.Start()
	defer pool.Stop()

	numJobs := 50
	var wg sync.WaitGroup
	var submitErrors int32

	// Submit jobs concurrently
	for i := 0; i < numJobs; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			err := pool.Submit(Job{
				ID:      id,
				Payload: id,
				Handler: func(ctx context.Context, payload interface{}) (interface{}, error) {
					return payload, nil
				},
			})
			if err != nil {
				atomic.AddInt32(&submitErrors, 1)
			}
		}(i)
	}

	wg.Wait()

	if submitErrors > 0 {
		t.Errorf("had %d submit errors", submitErrors)
	}

	// Collect all results
	collected := 0
	timeout := time.After(5 * time.Second)
	for collected < numJobs {
		select {
		case <-pool.Results():
			collected++
		case <-timeout:
			t.Fatalf("timeout: only collected %d of %d results", collected, numJobs)
		}
	}
}

// =============================================================================
// SECTION 3: Fan-Out/Fan-In Tests
// =============================================================================

func TestFanOutFanIn_Process(t *testing.T) {
	fanout := NewFanOutFanIn(3)

	items := []interface{}{1, 2, 3, 4, 5}
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		num := item.(int)
		return num * 2, nil
	}

	results := fanout.Process(context.Background(), items, processor)

	if len(results) != len(items) {
		t.Errorf("expected %d results, got %d", len(items), len(results))
	}

	// Verify all items were processed
	for _, r := range results {
		if r.Error != nil {
			t.Errorf("unexpected error for item %v: %v", r.Input, r.Error)
		}
		expected := r.Input.(int) * 2
		if r.Output != expected {
			t.Errorf("expected output %d, got %v", expected, r.Output)
		}
	}
}

func TestFanOutFanIn_ProcessOrdered(t *testing.T) {
	fanout := NewFanOutFanIn(3)

	items := []interface{}{1, 2, 3, 4, 5}
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		return item.(int) * 2, nil
	}

	results := fanout.ProcessOrdered(context.Background(), items, processor)

	if len(results) != len(items) {
		t.Errorf("expected %d results, got %d", len(items), len(results))
	}

	// Verify order is preserved
	for i, r := range results {
		if r.Index != i {
			t.Errorf("expected index %d, got %d", i, r.Index)
		}
	}
}

func TestFanOutFanIn_EmptyInput(t *testing.T) {
	fanout := NewFanOutFanIn(3)

	results := fanout.Process(context.Background(), []interface{}{}, nil)

	if results != nil {
		t.Errorf("expected nil for empty input, got %v", results)
	}
}

func TestFanOutFanIn_ErrorHandling(t *testing.T) {
	fanout := NewFanOutFanIn(2)

	items := []interface{}{1, 2, 3}
	expectedErr := errors.New("processing error")
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		if item.(int) == 2 {
			return nil, expectedErr
		}
		return item, nil
	}

	results := fanout.Process(context.Background(), items, processor)

	errorCount := 0
	for _, r := range results {
		if r.Error != nil {
			errorCount++
		}
	}

	if errorCount != 1 {
		t.Errorf("expected 1 error, got %d", errorCount)
	}
}

func TestFanOutFanIn_PanicRecovery(t *testing.T) {
	fanout := NewFanOutFanIn(2)

	items := []interface{}{1, 2}
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		if item.(int) == 2 {
			panic("intentional panic")
		}
		return item, nil
	}

	results := fanout.Process(context.Background(), items, processor)

	if len(results) != 2 {
		t.Errorf("expected 2 results, got %d", len(results))
	}

	// Find the panicked result
	var panicResult *ProcessResult
	for i := range results {
		if results[i].Input == 2 {
			panicResult = &results[i]
			break
		}
	}

	if panicResult == nil {
		t.Fatal("could not find result for item 2")
	}

	if panicResult.Error == nil {
		t.Error("expected error from panic recovery, got nil")
	}
}

func TestFanOutFanIn_ContextCancellation(t *testing.T) {
	fanout := NewFanOutFanIn(2)

	ctx, cancel := context.WithCancel(context.Background())

	items := []interface{}{1, 2, 3, 4, 5}
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(100 * time.Millisecond):
			return item, nil
		}
	}

	// Cancel after a short delay
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	results := fanout.Process(ctx, items, processor)

	// Some results may have errors due to cancellation
	// This is expected behavior
	t.Logf("Got %d results after cancellation", len(results))
}

// =============================================================================
// SECTION 4: Error Group Tests
// =============================================================================

func TestErrorGroup_NoErrors(t *testing.T) {
	eg := NewErrorGroup(context.Background())

	eg.Go(func(ctx context.Context) error {
		return nil
	})

	eg.Go(func(ctx context.Context) error {
		return nil
	})

	err := eg.Wait()
	if err != nil {
		t.Errorf("expected no error, got: %v", err)
	}
}

func TestErrorGroup_SingleError(t *testing.T) {
	eg := NewErrorGroup(context.Background())

	expectedErr := errors.New("test error")

	eg.Go(func(ctx context.Context) error {
		return expectedErr
	})

	eg.Go(func(ctx context.Context) error {
		return nil
	})

	err := eg.Wait()
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestErrorGroup_MultipleErrors(t *testing.T) {
	eg := NewErrorGroup(context.Background())

	eg.Go(func(ctx context.Context) error {
		return errors.New("error 1")
	})

	eg.Go(func(ctx context.Context) error {
		return errors.New("error 2")
	})

	err := eg.Wait()
	if err == nil {
		t.Error("expected error, got nil")
	}

	errs := eg.Errors()
	if len(errs) != 2 {
		t.Errorf("expected 2 errors, got %d", len(errs))
	}
}

func TestErrorGroup_GoWithCancel(t *testing.T) {
	eg := NewErrorGroup(context.Background())

	var secondStarted atomic.Bool
	var secondCancelled atomic.Bool

	// First goroutine fails immediately
	eg.GoWithCancel(func(ctx context.Context) error {
		return errors.New("immediate failure")
	})

	// Second goroutine should be cancelled
	eg.GoWithCancel(func(ctx context.Context) error {
		secondStarted.Store(true)
		select {
		case <-ctx.Done():
			secondCancelled.Store(true)
			return ctx.Err()
		case <-time.After(time.Second):
			return nil
		}
	})

	err := eg.Wait()
	if err == nil {
		t.Error("expected error, got nil")
	}

	// Give some time for the second goroutine to notice cancellation
	time.Sleep(50 * time.Millisecond)

	if secondStarted.Load() && !secondCancelled.Load() {
		t.Error("second goroutine was not cancelled")
	}
}

// =============================================================================
// SECTION 5: Semaphore Tests
// =============================================================================

func TestSemaphore_BasicOperation(t *testing.T) {
	sem := NewSemaphore(2)

	if sem.Available() != 2 {
		t.Errorf("expected 2 available, got %d", sem.Available())
	}

	// Acquire first slot
	err := sem.Acquire(context.Background())
	if err != nil {
		t.Errorf("first acquire failed: %v", err)
	}
	if sem.Available() != 1 {
		t.Errorf("expected 1 available, got %d", sem.Available())
	}

	// Acquire second slot
	err = sem.Acquire(context.Background())
	if err != nil {
		t.Errorf("second acquire failed: %v", err)
	}
	if sem.Available() != 0 {
		t.Errorf("expected 0 available, got %d", sem.Available())
	}

	// Release one slot
	sem.Release()
	if sem.Available() != 1 {
		t.Errorf("expected 1 available after release, got %d", sem.Available())
	}
}

func TestSemaphore_TryAcquire(t *testing.T) {
	sem := NewSemaphore(1)

	// First try should succeed
	if !sem.TryAcquire() {
		t.Error("first TryAcquire should succeed")
	}

	// Second try should fail (no blocking)
	if sem.TryAcquire() {
		t.Error("second TryAcquire should fail")
	}

	// Release and try again
	sem.Release()
	if !sem.TryAcquire() {
		t.Error("TryAcquire after release should succeed")
	}
}

func TestSemaphore_AcquireWithCancellation(t *testing.T) {
	sem := NewSemaphore(1)

	// Acquire the only slot
	err := sem.Acquire(context.Background())
	if err != nil {
		t.Fatalf("initial acquire failed: %v", err)
	}

	// Try to acquire with cancelled context
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err = sem.Acquire(ctx)
	if err == nil {
		t.Error("expected error for cancelled context, got nil")
	}
}

func TestSemaphore_ConcurrentAccess(t *testing.T) {
	sem := NewSemaphore(3)
	var maxConcurrent int32
	var currentConcurrent int32
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			err := sem.Acquire(context.Background())
			if err != nil {
				return
			}
			defer sem.Release()

			// Track concurrent access
			current := atomic.AddInt32(&currentConcurrent, 1)
			for {
				max := atomic.LoadInt32(&maxConcurrent)
				if current <= max || atomic.CompareAndSwapInt32(&maxConcurrent, max, current) {
					break
				}
			}

			time.Sleep(10 * time.Millisecond)
			atomic.AddInt32(&currentConcurrent, -1)
		}()
	}

	wg.Wait()

	if maxConcurrent > 3 {
		t.Errorf("max concurrent exceeded semaphore capacity: %d > 3", maxConcurrent)
	}
}

func TestSemaphore_ReleasePanic(t *testing.T) {
	sem := NewSemaphore(1)

	// Release without acquire should panic
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic on release without acquire")
		}
	}()

	sem.Release()
}

// =============================================================================
// Benchmarks
// =============================================================================

func BenchmarkWorkerPool(b *testing.B) {
	pool := NewWorkerPool(4, 100)
	pool.Start()
	defer pool.Stop()

	handler := func(ctx context.Context, payload interface{}) (interface{}, error) {
		return payload, nil
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = pool.Submit(Job{ID: i, Payload: i, Handler: handler})
	}

	// Drain results
	go func() {
		for range pool.Results() {
		}
	}()
}

func BenchmarkFanOutFanIn(b *testing.B) {
	fanout := NewFanOutFanIn(4)
	processor := func(ctx context.Context, item interface{}) (interface{}, error) {
		return item, nil
	}

	items := make([]interface{}, 100)
	for i := range items {
		items[i] = i
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = fanout.Process(context.Background(), items, processor)
	}
}

func BenchmarkSemaphore(b *testing.B) {
	sem := NewSemaphore(10)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = sem.Acquire(ctx)
		sem.Release()
	}
}
