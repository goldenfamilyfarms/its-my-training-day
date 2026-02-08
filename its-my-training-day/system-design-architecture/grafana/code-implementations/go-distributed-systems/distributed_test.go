// Package concurrency provides tests for distributed system patterns.
package concurrency

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// =============================================================================
// Token Bucket Rate Limiter Tests
// =============================================================================

func TestTokenBucketRateLimiter_Allow(t *testing.T) {
	rl := NewTokenBucketRateLimiter(10, 1) // 10 capacity, 1 token/sec

	// Should allow up to capacity
	for i := 0; i < 10; i++ {
		if !rl.Allow() {
			t.Errorf("Expected Allow() to return true for request %d", i)
		}
	}

	// Should reject when empty
	if rl.Allow() {
		t.Error("Expected Allow() to return false when bucket is empty")
	}
}

func TestTokenBucketRateLimiter_Refill(t *testing.T) {
	rl := NewTokenBucketRateLimiter(10, 100) // 10 capacity, 100 tokens/sec

	// Drain the bucket
	for i := 0; i < 10; i++ {
		rl.Allow()
	}

	// Wait for refill
	time.Sleep(50 * time.Millisecond) // Should add ~5 tokens

	// Should have some tokens now
	tokens := rl.Tokens()
	if tokens < 3 || tokens > 7 {
		t.Errorf("Expected ~5 tokens after 50ms, got %f", tokens)
	}
}

func TestTokenBucketRateLimiter_Wait(t *testing.T) {
	rl := NewTokenBucketRateLimiter(1, 100) // 1 capacity, 100 tokens/sec

	// Use the token
	rl.Allow()

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	start := time.Now()
	err := rl.Wait(ctx)
	elapsed := time.Since(start)

	if err != nil {
		t.Errorf("Expected Wait() to succeed, got error: %v", err)
	}

	if elapsed < 5*time.Millisecond {
		t.Errorf("Expected Wait() to block, but returned in %v", elapsed)
	}
}

func TestTokenBucketRateLimiter_WaitContextCancelled(t *testing.T) {
	rl := NewTokenBucketRateLimiter(1, 0.1) // Very slow refill

	// Use the token
	rl.Allow()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	err := rl.Wait(ctx)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("Expected context.DeadlineExceeded, got: %v", err)
	}
}

func TestTokenBucketRateLimiter_SetRate(t *testing.T) {
	rl := NewTokenBucketRateLimiter(10, 1)

	// Drain bucket
	for i := 0; i < 10; i++ {
		rl.Allow()
	}

	// Increase rate
	rl.SetRate(1000)

	// Wait briefly
	time.Sleep(10 * time.Millisecond)

	// Should have tokens now
	if !rl.Allow() {
		t.Error("Expected Allow() to succeed after rate increase")
	}
}

func TestTokenBucketRateLimiter_Concurrent(t *testing.T) {
	rl := NewTokenBucketRateLimiter(100, 1000)

	var allowed int32
	var wg sync.WaitGroup

	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if rl.Allow() {
				atomic.AddInt32(&allowed, 1)
			}
		}()
	}

	wg.Wait()

	// Should have allowed approximately 100 (capacity)
	if allowed < 90 || allowed > 110 {
		t.Errorf("Expected ~100 allowed requests, got %d", allowed)
	}
}

// =============================================================================
// Circuit Breaker Tests
// =============================================================================

func TestCircuitBreaker_ClosedState(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())

	if cb.State() != CircuitClosed {
		t.Errorf("Expected initial state CLOSED, got %s", cb.State())
	}

	// Successful execution should keep circuit closed
	err := cb.Execute(func() error { return nil })
	if err != nil {
		t.Errorf("Expected no error, got: %v", err)
	}

	if cb.State() != CircuitClosed {
		t.Errorf("Expected state CLOSED after success, got %s", cb.State())
	}
}

func TestCircuitBreaker_OpensOnFailures(t *testing.T) {
	config := CircuitBreakerConfig{
		FailureThreshold: 3,
		SuccessThreshold: 2,
		Timeout:          100 * time.Millisecond,
	}
	cb := NewCircuitBreaker(config)

	testErr := errors.New("test error")

	// Cause failures to open circuit
	for i := 0; i < 3; i++ {
		cb.Execute(func() error { return testErr })
	}

	if cb.State() != CircuitOpen {
		t.Errorf("Expected state OPEN after failures, got %s", cb.State())
	}

	// Should reject requests when open
	err := cb.Execute(func() error { return nil })
	if !errors.Is(err, ErrCircuitOpen) {
		t.Errorf("Expected ErrCircuitOpen, got: %v", err)
	}
}

func TestCircuitBreaker_TransitionsToHalfOpen(t *testing.T) {
	config := CircuitBreakerConfig{
		FailureThreshold: 2,
		SuccessThreshold: 1,
		Timeout:          50 * time.Millisecond,
		MaxConcurrent:    1,
	}
	cb := NewCircuitBreaker(config)

	// Open the circuit
	for i := 0; i < 2; i++ {
		cb.Execute(func() error { return errors.New("fail") })
	}

	if cb.State() != CircuitOpen {
		t.Fatalf("Expected OPEN state, got %s", cb.State())
	}

	// Wait for timeout
	time.Sleep(60 * time.Millisecond)

	// Next request should transition to half-open
	err := cb.Execute(func() error { return nil })
	if err != nil {
		t.Errorf("Expected success in half-open, got: %v", err)
	}

	// Should be closed after success
	if cb.State() != CircuitClosed {
		t.Errorf("Expected CLOSED after success in half-open, got %s", cb.State())
	}
}

func TestCircuitBreaker_HalfOpenFailureReopens(t *testing.T) {
	config := CircuitBreakerConfig{
		FailureThreshold: 2,
		SuccessThreshold: 2,
		Timeout:          50 * time.Millisecond,
		MaxConcurrent:    1,
	}
	cb := NewCircuitBreaker(config)

	// Open the circuit
	for i := 0; i < 2; i++ {
		cb.Execute(func() error { return errors.New("fail") })
	}

	// Wait for timeout
	time.Sleep(60 * time.Millisecond)

	// Fail in half-open state
	cb.Execute(func() error { return errors.New("fail again") })

	if cb.State() != CircuitOpen {
		t.Errorf("Expected OPEN after half-open failure, got %s", cb.State())
	}
}

func TestCircuitBreaker_Reset(t *testing.T) {
	config := CircuitBreakerConfig{
		FailureThreshold: 2,
		SuccessThreshold: 1,
		Timeout:          1 * time.Hour, // Long timeout
	}
	cb := NewCircuitBreaker(config)

	// Open the circuit
	for i := 0; i < 2; i++ {
		cb.Execute(func() error { return errors.New("fail") })
	}

	if cb.State() != CircuitOpen {
		t.Fatalf("Expected OPEN state, got %s", cb.State())
	}

	// Manual reset
	cb.Reset()

	if cb.State() != CircuitClosed {
		t.Errorf("Expected CLOSED after reset, got %s", cb.State())
	}

	// Should accept requests
	err := cb.Execute(func() error { return nil })
	if err != nil {
		t.Errorf("Expected success after reset, got: %v", err)
	}
}

func TestCircuitBreaker_StateChangeCallback(t *testing.T) {
	config := CircuitBreakerConfig{
		FailureThreshold: 2,
		SuccessThreshold: 1,
		Timeout:          50 * time.Millisecond,
	}
	cb := NewCircuitBreaker(config)

	var transitions []string
	cb.OnStateChange(func(from, to CircuitState) {
		transitions = append(transitions, from.String()+"->"+to.String())
	})

	// Open circuit
	for i := 0; i < 2; i++ {
		cb.Execute(func() error { return errors.New("fail") })
	}

	// Wait and recover
	time.Sleep(60 * time.Millisecond)
	cb.Execute(func() error { return nil })

	expected := []string{"CLOSED->OPEN", "OPEN->HALF-OPEN", "HALF-OPEN->CLOSED"}
	if len(transitions) != len(expected) {
		t.Errorf("Expected %d transitions, got %d: %v", len(expected), len(transitions), transitions)
	}
}

// =============================================================================
// Retryer Tests
// =============================================================================

func TestRetryer_SuccessOnFirstAttempt(t *testing.T) {
	r := NewRetryer(DefaultRetryConfig())

	result, err := r.Do(func() error { return nil })

	if err != nil {
		t.Errorf("Expected no error, got: %v", err)
	}
	if result.Attempts != 1 {
		t.Errorf("Expected 1 attempt, got %d", result.Attempts)
	}
}

func TestRetryer_SuccessAfterRetries(t *testing.T) {
	config := RetryConfig{
		MaxRetries:        3,
		InitialBackoff:    1 * time.Millisecond,
		MaxBackoff:        10 * time.Millisecond,
		BackoffMultiplier: 2.0,
	}
	r := NewRetryer(config)

	attempts := 0
	result, err := r.Do(func() error {
		attempts++
		if attempts < 3 {
			return errors.New("transient error")
		}
		return nil
	})

	if err != nil {
		t.Errorf("Expected success, got: %v", err)
	}
	if result.Attempts != 3 {
		t.Errorf("Expected 3 attempts, got %d", result.Attempts)
	}
}

func TestRetryer_ExhaustsRetries(t *testing.T) {
	config := RetryConfig{
		MaxRetries:        2,
		InitialBackoff:    1 * time.Millisecond,
		MaxBackoff:        10 * time.Millisecond,
		BackoffMultiplier: 2.0,
	}
	r := NewRetryer(config)

	testErr := errors.New("persistent error")
	result, err := r.Do(func() error { return testErr })

	if !errors.Is(err, testErr) {
		t.Errorf("Expected persistent error, got: %v", err)
	}
	if result.Attempts != 3 { // Initial + 2 retries
		t.Errorf("Expected 3 attempts, got %d", result.Attempts)
	}
}

func TestRetryer_RespectsContext(t *testing.T) {
	config := RetryConfig{
		MaxRetries:        10,
		InitialBackoff:    100 * time.Millisecond,
		MaxBackoff:        1 * time.Second,
		BackoffMultiplier: 2.0,
	}
	r := NewRetryer(config)

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	result, err := r.DoWithContext(ctx, func(ctx context.Context) error {
		return errors.New("always fail")
	})

	if !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("Expected context.DeadlineExceeded, got: %v", err)
	}
	if result.Attempts > 2 {
		t.Errorf("Expected few attempts before timeout, got %d", result.Attempts)
	}
}

func TestRetryer_CustomRetryableCheck(t *testing.T) {
	permanentErr := errors.New("permanent error")
	transientErr := errors.New("transient error")

	config := RetryConfig{
		MaxRetries:        3,
		InitialBackoff:    1 * time.Millisecond,
		BackoffMultiplier: 1.0,
		IsRetryable: func(err error) bool {
			return !errors.Is(err, permanentErr)
		},
	}
	r := NewRetryer(config)

	// Permanent error should not retry
	result, _ := r.Do(func() error { return permanentErr })
	if result.Attempts != 1 {
		t.Errorf("Expected 1 attempt for permanent error, got %d", result.Attempts)
	}

	// Transient error should retry
	attempts := 0
	result, _ = r.Do(func() error {
		attempts++
		if attempts < 3 {
			return transientErr
		}
		return nil
	})
	if result.Attempts != 3 {
		t.Errorf("Expected 3 attempts for transient error, got %d", result.Attempts)
	}
}

// =============================================================================
// Resilient Client Tests
// =============================================================================

func TestResilientClient_Success(t *testing.T) {
	config := ResilientClientConfig{
		CircuitBreaker: DefaultCircuitBreakerConfig(),
		Retry:          DefaultRetryConfig(),
	}
	client := NewResilientClient(config)

	err := client.Execute(context.Background(), func(ctx context.Context) error {
		return nil
	})

	if err != nil {
		t.Errorf("Expected success, got: %v", err)
	}
}

func TestResilientClient_WithRateLimiter(t *testing.T) {
	config := ResilientClientConfig{
		CircuitBreaker: DefaultCircuitBreakerConfig(),
		Retry:          DefaultRetryConfig(),
		RateLimit: &struct {
			Capacity   float64
			RefillRate float64
		}{
			Capacity:   2,
			RefillRate: 1,
		},
	}
	client := NewResilientClient(config)

	// First two should succeed
	for i := 0; i < 2; i++ {
		err := client.Execute(context.Background(), func(ctx context.Context) error {
			return nil
		})
		if err != nil {
			t.Errorf("Request %d: expected success, got: %v", i, err)
		}
	}

	// Third should be rate limited
	err := client.Execute(context.Background(), func(ctx context.Context) error {
		return nil
	})
	if !errors.Is(err, ErrRateLimited) {
		t.Errorf("Expected ErrRateLimited, got: %v", err)
	}
}

func TestResilientClient_CircuitOpens(t *testing.T) {
	config := ResilientClientConfig{
		CircuitBreaker: CircuitBreakerConfig{
			FailureThreshold: 2,
			SuccessThreshold: 1,
			Timeout:          1 * time.Hour,
		},
		Retry: RetryConfig{
			MaxRetries:     0, // No retries to simplify test
			InitialBackoff: 1 * time.Millisecond,
		},
	}
	client := NewResilientClient(config)

	// Cause failures
	for i := 0; i < 2; i++ {
		client.Execute(context.Background(), func(ctx context.Context) error {
			return errors.New("fail")
		})
	}

	// Circuit should be open
	if client.CircuitBreaker().State() != CircuitOpen {
		t.Errorf("Expected circuit OPEN, got %s", client.CircuitBreaker().State())
	}
}

// =============================================================================
// Sliding Window Rate Limiter Tests
// =============================================================================

func TestSlidingWindowRateLimiter_Allow(t *testing.T) {
	rl := NewSlidingWindowRateLimiter(100*time.Millisecond, 5)

	// Should allow up to max
	for i := 0; i < 5; i++ {
		if !rl.Allow() {
			t.Errorf("Expected Allow() to return true for request %d", i)
		}
	}

	// Should reject when at limit
	if rl.Allow() {
		t.Error("Expected Allow() to return false when at limit")
	}
}

func TestSlidingWindowRateLimiter_WindowSlides(t *testing.T) {
	rl := NewSlidingWindowRateLimiter(50*time.Millisecond, 3)

	// Use all requests
	for i := 0; i < 3; i++ {
		rl.Allow()
	}

	// Wait for window to slide
	time.Sleep(60 * time.Millisecond)

	// Should allow again
	if !rl.Allow() {
		t.Error("Expected Allow() to return true after window slides")
	}
}

// =============================================================================
// Error Wrapper Tests
// =============================================================================

func TestRetryableError(t *testing.T) {
	originalErr := errors.New("original error")
	wrapped := WrapRetryable(originalErr)

	if !IsRetryable(wrapped) {
		t.Error("Expected IsRetryable to return true")
	}

	if !errors.Is(wrapped, originalErr) {
		t.Error("Expected wrapped error to unwrap to original")
	}
}

func TestPermanentError(t *testing.T) {
	originalErr := errors.New("original error")
	wrapped := WrapPermanent(originalErr)

	if !IsPermanent(wrapped) {
		t.Error("Expected IsPermanent to return true")
	}

	if !errors.Is(wrapped, originalErr) {
		t.Error("Expected wrapped error to unwrap to original")
	}
}

func TestWrapNilError(t *testing.T) {
	if WrapRetryable(nil) != nil {
		t.Error("Expected WrapRetryable(nil) to return nil")
	}
	if WrapPermanent(nil) != nil {
		t.Error("Expected WrapPermanent(nil) to return nil")
	}
}
