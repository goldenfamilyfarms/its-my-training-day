// Package concurrency provides practical implementations of distributed system patterns
// commonly used in Grafana's backend services like Loki, Mimir, and Tempo.
//
// This file demonstrates:
// - Token bucket rate limiter for controlling request rates
// - Circuit breaker pattern for fault tolerance
// - Retry with exponential backoff and jitter
// - Proper error handling throughout
//
// These patterns are essential for building resilient, scalable distributed
// systems and are frequently discussed in Grafana backend engineering interviews.
package concurrency

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

// =============================================================================
// SECTION 1: Token Bucket Rate Limiter
// =============================================================================

// TokenBucketRateLimiter implements the token bucket algorithm for rate limiting.
// This pattern is used extensively in Grafana services for:
// - Limiting API request rates per tenant
// - Controlling log ingestion rates in Loki
// - Managing query concurrency in Mimir
//
// How it works:
// - Bucket holds up to 'capacity' tokens
// - Tokens are added at 'refillRate' per second
// - Each request consumes one token
// - If no tokens available, request is rejected or waits
//
// Benefits:
// - Allows bursts up to bucket capacity
// - Smooths out traffic over time
// - Simple and efficient implementation
type TokenBucketRateLimiter struct {
	capacity   float64       // Maximum tokens in bucket
	tokens     float64       // Current token count
	refillRate float64       // Tokens added per second
	lastRefill time.Time     // Last time tokens were added
	mu         sync.Mutex    // Protects token state
}

// NewTokenBucketRateLimiter creates a new rate limiter with the specified capacity
// and refill rate. The bucket starts full.
//
// Parameters:
// - capacity: Maximum number of tokens (allows bursts up to this size)
// - refillRate: Tokens added per second (sustained rate limit)
//
// Example: NewTokenBucketRateLimiter(100, 10) allows 100 burst requests,
// then sustains 10 requests per second.
func NewTokenBucketRateLimiter(capacity, refillRate float64) *TokenBucketRateLimiter {
	if capacity <= 0 {
		capacity = 1
	}
	if refillRate <= 0 {
		refillRate = 1
	}

	return &TokenBucketRateLimiter{
		capacity:   capacity,
		tokens:     capacity, // Start with full bucket
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

// Allow checks if a request should be allowed and consumes a token if so.
// Returns true if the request is allowed, false if rate limited.
// This is a non-blocking operation.
func (rl *TokenBucketRateLimiter) Allow() bool {
	return rl.AllowN(1)
}

// AllowN checks if n tokens are available and consumes them if so.
// Useful for requests that consume different amounts of resources.
func (rl *TokenBucketRateLimiter) AllowN(n float64) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.refill()

	if rl.tokens >= n {
		rl.tokens -= n
		return true
	}
	return false
}

// Wait blocks until a token is available or context is cancelled.
// Returns nil if token acquired, error if context cancelled.
func (rl *TokenBucketRateLimiter) Wait(ctx context.Context) error {
	return rl.WaitN(ctx, 1)
}

// WaitN blocks until n tokens are available or context is cancelled.
func (rl *TokenBucketRateLimiter) WaitN(ctx context.Context, n float64) error {
	// Fast path: try to acquire immediately
	if rl.AllowN(n) {
		return nil
	}

	// Slow path: wait for tokens
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if rl.AllowN(n) {
				return nil
			}
		}
	}
}

// refill adds tokens based on elapsed time since last refill.
// Must be called with mutex held.
func (rl *TokenBucketRateLimiter) refill() {
	now := time.Now()
	elapsed := now.Sub(rl.lastRefill).Seconds()
	rl.lastRefill = now

	// Add tokens based on elapsed time
	rl.tokens += elapsed * rl.refillRate

	// Cap at capacity
	if rl.tokens > rl.capacity {
		rl.tokens = rl.capacity
	}
}

// Tokens returns the current number of available tokens.
// Useful for monitoring and debugging.
func (rl *TokenBucketRateLimiter) Tokens() float64 {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.refill()
	return rl.tokens
}

// SetRate dynamically adjusts the refill rate.
// Useful for adaptive rate limiting based on system load.
func (rl *TokenBucketRateLimiter) SetRate(newRate float64) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.refill() // Apply pending refill at old rate
	rl.refillRate = newRate
}

// =============================================================================
// SECTION 2: Circuit Breaker Pattern
// =============================================================================

// CircuitState represents the current state of the circuit breaker.
type CircuitState int32

const (
	// CircuitClosed - Normal operation, requests flow through
	CircuitClosed CircuitState = iota
	// CircuitOpen - Failure threshold exceeded, requests are rejected
	CircuitOpen
	// CircuitHalfOpen - Testing if service has recovered
	CircuitHalfOpen
)

// String returns a human-readable state name.
func (s CircuitState) String() string {
	switch s {
	case CircuitClosed:
		return "CLOSED"
	case CircuitOpen:
		return "OPEN"
	case CircuitHalfOpen:
		return "HALF-OPEN"
	default:
		return "UNKNOWN"
	}
}

// CircuitBreakerConfig holds configuration for the circuit breaker.
type CircuitBreakerConfig struct {
	// FailureThreshold is the number of failures before opening the circuit
	FailureThreshold int
	// SuccessThreshold is the number of successes in half-open state to close
	SuccessThreshold int
	// Timeout is how long to wait before transitioning from open to half-open
	Timeout time.Duration
	// MaxConcurrent limits concurrent requests in half-open state (0 = no limit)
	MaxConcurrent int
}

// DefaultCircuitBreakerConfig returns sensible defaults for most use cases.
func DefaultCircuitBreakerConfig() CircuitBreakerConfig {
	return CircuitBreakerConfig{
		FailureThreshold: 5,
		SuccessThreshold: 2,
		Timeout:          30 * time.Second,
		MaxConcurrent:    1,
	}
}

// CircuitBreaker implements the circuit breaker pattern for fault tolerance.
// This pattern is critical in distributed systems for:
// - Preventing cascade failures across services
// - Allowing failing services time to recover
// - Providing fast failure instead of slow timeouts
// - Reducing load on struggling services
//
// State Machine:
//
//	CLOSED --[failures >= threshold]--> OPEN
//	OPEN --[timeout expires]--> HALF-OPEN
//	HALF-OPEN --[success >= threshold]--> CLOSED
//	HALF-OPEN --[failure]--> OPEN
//
// In Grafana services, circuit breakers protect:
// - Queries to downstream storage (S3, GCS, etc.)
// - Cross-service communication (Loki -> Mimir)
// - External API calls (alerting webhooks)
type CircuitBreaker struct {
	config CircuitBreakerConfig

	state           int32     // Atomic: current circuit state
	failures        int32     // Atomic: consecutive failure count
	successes       int32     // Atomic: consecutive success count in half-open
	lastFailureTime time.Time // Time of last failure
	halfOpenCount   int32     // Atomic: current requests in half-open state

	mu sync.RWMutex // Protects lastFailureTime

	// Callbacks for monitoring
	onStateChange func(from, to CircuitState)
}

// NewCircuitBreaker creates a new circuit breaker with the given configuration.
func NewCircuitBreaker(config CircuitBreakerConfig) *CircuitBreaker {
	if config.FailureThreshold <= 0 {
		config.FailureThreshold = 5
	}
	if config.SuccessThreshold <= 0 {
		config.SuccessThreshold = 2
	}
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Second
	}

	return &CircuitBreaker{
		config: config,
		state:  int32(CircuitClosed),
	}
}

// ErrCircuitOpen is returned when the circuit is open and rejecting requests.
var ErrCircuitOpen = errors.New("circuit breaker is open")

// ErrTooManyConcurrent is returned when too many requests are in half-open state.
var ErrTooManyConcurrent = errors.New("too many concurrent requests in half-open state")

// Execute runs the given function through the circuit breaker.
// Returns ErrCircuitOpen if the circuit is open.
// Records success/failure and updates circuit state accordingly.
func (cb *CircuitBreaker) Execute(fn func() error) error {
	// Check if we can proceed
	if err := cb.beforeRequest(); err != nil {
		return err
	}

	// Execute the function
	err := fn()

	// Record the result
	cb.afterRequest(err)

	return err
}

// ExecuteWithContext runs the given function with context support.
func (cb *CircuitBreaker) ExecuteWithContext(ctx context.Context, fn func(context.Context) error) error {
	if err := cb.beforeRequest(); err != nil {
		return err
	}

	err := fn(ctx)
	cb.afterRequest(err)

	return err
}

// beforeRequest checks if the request should proceed.
func (cb *CircuitBreaker) beforeRequest() error {
	state := CircuitState(atomic.LoadInt32(&cb.state))

	switch state {
	case CircuitClosed:
		return nil

	case CircuitOpen:
		// Check if timeout has elapsed
		cb.mu.RLock()
		lastFailure := cb.lastFailureTime
		cb.mu.RUnlock()

		if time.Since(lastFailure) >= cb.config.Timeout {
			// Transition to half-open
			if atomic.CompareAndSwapInt32(&cb.state, int32(CircuitOpen), int32(CircuitHalfOpen)) {
				atomic.StoreInt32(&cb.successes, 0)
				atomic.StoreInt32(&cb.halfOpenCount, 0)
				cb.notifyStateChange(CircuitOpen, CircuitHalfOpen)
			}
			return cb.beforeRequest() // Re-check in new state
		}
		return ErrCircuitOpen

	case CircuitHalfOpen:
		// Limit concurrent requests in half-open state
		if cb.config.MaxConcurrent > 0 {
			current := atomic.AddInt32(&cb.halfOpenCount, 1)
			if int(current) > cb.config.MaxConcurrent {
				atomic.AddInt32(&cb.halfOpenCount, -1)
				return ErrTooManyConcurrent
			}
		}
		return nil
	}

	return nil
}

// afterRequest records the result and updates state.
func (cb *CircuitBreaker) afterRequest(err error) {
	state := CircuitState(atomic.LoadInt32(&cb.state))

	// Decrement half-open counter if applicable
	if state == CircuitHalfOpen && cb.config.MaxConcurrent > 0 {
		atomic.AddInt32(&cb.halfOpenCount, -1)
	}

	if err != nil {
		cb.recordFailure()
	} else {
		cb.recordSuccess()
	}
}

// recordFailure handles a failed request.
func (cb *CircuitBreaker) recordFailure() {
	state := CircuitState(atomic.LoadInt32(&cb.state))

	cb.mu.Lock()
	cb.lastFailureTime = time.Now()
	cb.mu.Unlock()

	switch state {
	case CircuitClosed:
		failures := atomic.AddInt32(&cb.failures, 1)
		if int(failures) >= cb.config.FailureThreshold {
			if atomic.CompareAndSwapInt32(&cb.state, int32(CircuitClosed), int32(CircuitOpen)) {
				cb.notifyStateChange(CircuitClosed, CircuitOpen)
			}
		}

	case CircuitHalfOpen:
		// Any failure in half-open goes back to open
		if atomic.CompareAndSwapInt32(&cb.state, int32(CircuitHalfOpen), int32(CircuitOpen)) {
			atomic.StoreInt32(&cb.failures, int32(cb.config.FailureThreshold))
			cb.notifyStateChange(CircuitHalfOpen, CircuitOpen)
		}
	}
}

// recordSuccess handles a successful request.
func (cb *CircuitBreaker) recordSuccess() {
	state := CircuitState(atomic.LoadInt32(&cb.state))

	switch state {
	case CircuitClosed:
		// Reset failure count on success
		atomic.StoreInt32(&cb.failures, 0)

	case CircuitHalfOpen:
		successes := atomic.AddInt32(&cb.successes, 1)
		if int(successes) >= cb.config.SuccessThreshold {
			if atomic.CompareAndSwapInt32(&cb.state, int32(CircuitHalfOpen), int32(CircuitClosed)) {
				atomic.StoreInt32(&cb.failures, 0)
				atomic.StoreInt32(&cb.successes, 0)
				cb.notifyStateChange(CircuitHalfOpen, CircuitClosed)
			}
		}
	}
}

// notifyStateChange calls the state change callback if set.
func (cb *CircuitBreaker) notifyStateChange(from, to CircuitState) {
	if cb.onStateChange != nil {
		cb.onStateChange(from, to)
	}
}

// OnStateChange sets a callback for state transitions.
// Useful for logging and metrics.
func (cb *CircuitBreaker) OnStateChange(fn func(from, to CircuitState)) {
	cb.onStateChange = fn
}

// State returns the current circuit state.
func (cb *CircuitBreaker) State() CircuitState {
	return CircuitState(atomic.LoadInt32(&cb.state))
}

// Failures returns the current failure count.
func (cb *CircuitBreaker) Failures() int {
	return int(atomic.LoadInt32(&cb.failures))
}

// Reset manually resets the circuit breaker to closed state.
// Use with caution - typically for administrative purposes.
func (cb *CircuitBreaker) Reset() {
	oldState := CircuitState(atomic.SwapInt32(&cb.state, int32(CircuitClosed)))
	atomic.StoreInt32(&cb.failures, 0)
	atomic.StoreInt32(&cb.successes, 0)
	if oldState != CircuitClosed {
		cb.notifyStateChange(oldState, CircuitClosed)
	}
}

// =============================================================================
// SECTION 3: Retry with Exponential Backoff and Jitter
// =============================================================================

// RetryConfig holds configuration for retry behavior.
type RetryConfig struct {
	// MaxRetries is the maximum number of retry attempts (0 = no retries)
	MaxRetries int
	// InitialBackoff is the delay before the first retry
	InitialBackoff time.Duration
	// MaxBackoff caps the maximum delay between retries
	MaxBackoff time.Duration
	// BackoffMultiplier increases delay exponentially (typically 2.0)
	BackoffMultiplier float64
	// JitterFraction adds randomness to prevent thundering herd (0.0-1.0)
	JitterFraction float64
	// RetryableErrors defines which errors should trigger a retry
	// If nil, all errors are retryable
	RetryableErrors []error
	// IsRetryable is a custom function to determine if an error is retryable
	// Takes precedence over RetryableErrors if set
	IsRetryable func(error) bool
}

// DefaultRetryConfig returns sensible defaults for most use cases.
func DefaultRetryConfig() RetryConfig {
	return RetryConfig{
		MaxRetries:        3,
		InitialBackoff:    100 * time.Millisecond,
		MaxBackoff:        30 * time.Second,
		BackoffMultiplier: 2.0,
		JitterFraction:    0.2,
	}
}

// RetryResult contains information about a retry operation.
type RetryResult struct {
	Attempts  int           // Total attempts made (including initial)
	Duration  time.Duration // Total time spent
	LastError error         // Last error encountered (nil if successful)
}

// Retryer implements retry logic with exponential backoff and jitter.
// This pattern is essential in distributed systems for:
// - Handling transient failures (network blips, temporary overload)
// - Avoiding thundering herd with jitter
// - Giving failing services time to recover
//
// In Grafana services, retry is used for:
// - Object storage operations (S3, GCS)
// - Cross-service RPC calls
// - Database connections
// - External webhook delivery
//
// Exponential Backoff Formula:
//
//	delay = min(initialBackoff * (multiplier ^ attempt), maxBackoff)
//	jitter = delay * random(0, jitterFraction)
//	finalDelay = delay + jitter
type Retryer struct {
	config RetryConfig
	rng    *rand.Rand
	mu     sync.Mutex
}

// NewRetryer creates a new retryer with the given configuration.
func NewRetryer(config RetryConfig) *Retryer {
	if config.MaxRetries < 0 {
		config.MaxRetries = 0
	}
	if config.InitialBackoff <= 0 {
		config.InitialBackoff = 100 * time.Millisecond
	}
	if config.MaxBackoff <= 0 {
		config.MaxBackoff = 30 * time.Second
	}
	if config.BackoffMultiplier <= 0 {
		config.BackoffMultiplier = 2.0
	}
	if config.JitterFraction < 0 || config.JitterFraction > 1 {
		config.JitterFraction = 0.2
	}

	return &Retryer{
		config: config,
		rng:    rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Do executes the function with retry logic.
// Returns the result of the last attempt and retry information.
func (r *Retryer) Do(fn func() error) (RetryResult, error) {
	return r.DoWithContext(context.Background(), func(ctx context.Context) error {
		return fn()
	})
}

// DoWithContext executes the function with retry logic and context support.
// The context is passed to the function and used for cancellation.
func (r *Retryer) DoWithContext(ctx context.Context, fn func(context.Context) error) (RetryResult, error) {
	start := time.Now()
	result := RetryResult{}

	for attempt := 0; attempt <= r.config.MaxRetries; attempt++ {
		result.Attempts = attempt + 1

		// Execute the function
		err := fn(ctx)
		if err == nil {
			result.Duration = time.Since(start)
			return result, nil
		}

		result.LastError = err

		// Check if we should retry
		if attempt >= r.config.MaxRetries {
			break
		}

		if !r.isRetryable(err) {
			break
		}

		// Calculate backoff with jitter
		backoff := r.calculateBackoff(attempt)

		// Wait for backoff or context cancellation
		select {
		case <-ctx.Done():
			result.Duration = time.Since(start)
			result.LastError = ctx.Err()
			return result, ctx.Err()
		case <-time.After(backoff):
			// Continue to next attempt
		}
	}

	result.Duration = time.Since(start)
	return result, result.LastError
}

// isRetryable determines if an error should trigger a retry.
func (r *Retryer) isRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Custom function takes precedence
	if r.config.IsRetryable != nil {
		return r.config.IsRetryable(err)
	}

	// Check against list of retryable errors
	if len(r.config.RetryableErrors) > 0 {
		for _, retryableErr := range r.config.RetryableErrors {
			if errors.Is(err, retryableErr) {
				return true
			}
		}
		return false
	}

	// Default: all errors are retryable
	return true
}

// calculateBackoff computes the delay for a given attempt with jitter.
func (r *Retryer) calculateBackoff(attempt int) time.Duration {
	// Exponential backoff: initialBackoff * (multiplier ^ attempt)
	backoff := float64(r.config.InitialBackoff) * math.Pow(r.config.BackoffMultiplier, float64(attempt))

	// Cap at max backoff
	if backoff > float64(r.config.MaxBackoff) {
		backoff = float64(r.config.MaxBackoff)
	}

	// Add jitter to prevent thundering herd
	if r.config.JitterFraction > 0 {
		r.mu.Lock()
		jitter := backoff * r.config.JitterFraction * r.rng.Float64()
		r.mu.Unlock()
		backoff += jitter
	}

	return time.Duration(backoff)
}

// =============================================================================
// SECTION 4: Combined Resilience Pattern
// =============================================================================

// ResilientClient combines circuit breaker and retry for robust service calls.
// This is a common pattern in production systems where you want:
// - Retries for transient failures
// - Circuit breaking for persistent failures
// - Rate limiting to protect downstream services
//
// Order of operations:
// 1. Check rate limiter (optional)
// 2. Check circuit breaker
// 3. Execute with retry
// 4. Update circuit breaker state
type ResilientClient struct {
	circuitBreaker *CircuitBreaker
	retryer        *Retryer
	rateLimiter    *TokenBucketRateLimiter // Optional
}

// ResilientClientConfig holds configuration for the resilient client.
type ResilientClientConfig struct {
	CircuitBreaker CircuitBreakerConfig
	Retry          RetryConfig
	RateLimit      *struct {
		Capacity   float64
		RefillRate float64
	}
}

// NewResilientClient creates a new resilient client with the given configuration.
func NewResilientClient(config ResilientClientConfig) *ResilientClient {
	client := &ResilientClient{
		circuitBreaker: NewCircuitBreaker(config.CircuitBreaker),
		retryer:        NewRetryer(config.Retry),
	}

	if config.RateLimit != nil {
		client.rateLimiter = NewTokenBucketRateLimiter(
			config.RateLimit.Capacity,
			config.RateLimit.RefillRate,
		)
	}

	return client
}

// ErrRateLimited is returned when the rate limiter rejects a request.
var ErrRateLimited = errors.New("rate limited")

// Execute runs the function through rate limiter, circuit breaker, and retry.
func (rc *ResilientClient) Execute(ctx context.Context, fn func(context.Context) error) error {
	// Step 1: Check rate limiter (if configured)
	if rc.rateLimiter != nil {
		if !rc.rateLimiter.Allow() {
			return ErrRateLimited
		}
	}

	// Step 2: Execute through circuit breaker with retry
	return rc.circuitBreaker.ExecuteWithContext(ctx, func(ctx context.Context) error {
		result, err := rc.retryer.DoWithContext(ctx, fn)
		if err != nil {
			return fmt.Errorf("failed after %d attempts: %w", result.Attempts, err)
		}
		return nil
	})
}

// CircuitBreaker returns the underlying circuit breaker for monitoring.
func (rc *ResilientClient) CircuitBreaker() *CircuitBreaker {
	return rc.circuitBreaker
}

// RateLimiter returns the underlying rate limiter for monitoring.
func (rc *ResilientClient) RateLimiter() *TokenBucketRateLimiter {
	return rc.rateLimiter
}

// =============================================================================
// SECTION 5: Utility Functions and Helpers
// =============================================================================

// RetryableError wraps an error to indicate it should be retried.
type RetryableError struct {
	Err error
}

func (e *RetryableError) Error() string {
	return fmt.Sprintf("retryable: %v", e.Err)
}

func (e *RetryableError) Unwrap() error {
	return e.Err
}

// IsRetryable checks if an error is marked as retryable.
func IsRetryable(err error) bool {
	var retryable *RetryableError
	return errors.As(err, &retryable)
}

// WrapRetryable wraps an error to mark it as retryable.
func WrapRetryable(err error) error {
	if err == nil {
		return nil
	}
	return &RetryableError{Err: err}
}

// PermanentError wraps an error to indicate it should NOT be retried.
type PermanentError struct {
	Err error
}

func (e *PermanentError) Error() string {
	return fmt.Sprintf("permanent: %v", e.Err)
}

func (e *PermanentError) Unwrap() error {
	return e.Err
}

// IsPermanent checks if an error is marked as permanent (non-retryable).
func IsPermanent(err error) bool {
	var permanent *PermanentError
	return errors.As(err, &permanent)
}

// WrapPermanent wraps an error to mark it as permanent (non-retryable).
func WrapPermanent(err error) error {
	if err == nil {
		return nil
	}
	return &PermanentError{Err: err}
}

// =============================================================================
// SECTION 6: Sliding Window Rate Limiter (Alternative Implementation)
// =============================================================================

// SlidingWindowRateLimiter implements a sliding window rate limiter.
// Unlike token bucket, this provides more accurate rate limiting by
// tracking requests in a sliding time window.
//
// Use cases:
// - API rate limiting with strict per-second/minute limits
// - Compliance with external API rate limits
// - Fair resource allocation across tenants
type SlidingWindowRateLimiter struct {
	windowSize time.Duration
	maxRequests int
	requests   []time.Time
	mu         sync.Mutex
}

// NewSlidingWindowRateLimiter creates a new sliding window rate limiter.
// windowSize is the duration of the sliding window.
// maxRequests is the maximum requests allowed in the window.
func NewSlidingWindowRateLimiter(windowSize time.Duration, maxRequests int) *SlidingWindowRateLimiter {
	if windowSize <= 0 {
		windowSize = time.Second
	}
	if maxRequests <= 0 {
		maxRequests = 1
	}

	return &SlidingWindowRateLimiter{
		windowSize:  windowSize,
		maxRequests: maxRequests,
		requests:    make([]time.Time, 0, maxRequests),
	}
}

// Allow checks if a request should be allowed.
func (rl *SlidingWindowRateLimiter) Allow() bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.windowSize)

	// Remove expired requests
	validRequests := make([]time.Time, 0, len(rl.requests))
	for _, t := range rl.requests {
		if t.After(windowStart) {
			validRequests = append(validRequests, t)
		}
	}
	rl.requests = validRequests

	// Check if we can accept this request
	if len(rl.requests) >= rl.maxRequests {
		return false
	}

	// Record this request
	rl.requests = append(rl.requests, now)
	return true
}

// RequestsInWindow returns the current number of requests in the window.
func (rl *SlidingWindowRateLimiter) RequestsInWindow() int {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.windowSize)

	count := 0
	for _, t := range rl.requests {
		if t.After(windowStart) {
			count++
		}
	}
	return count
}
