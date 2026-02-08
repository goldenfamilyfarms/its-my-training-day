// Package observability provides tests for instrumentation patterns.
package observability

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// =============================================================================
// SECTION 1: Counter Tests
// =============================================================================

func TestCounter_Inc(t *testing.T) {
	counter := NewCounter(MetricOpts{
		Namespace: "test",
		Name:      "requests_total",
		Help:      "Test counter",
		Labels:    []string{"method", "status"},
	})

	// Test basic increment
	counter.Inc("GET", "200")
	if got := counter.Value("GET", "200"); got != 1 {
		t.Errorf("Counter.Inc() = %v, want 1", got)
	}

	// Test multiple increments
	counter.Inc("GET", "200")
	counter.Inc("GET", "200")
	if got := counter.Value("GET", "200"); got != 3 {
		t.Errorf("Counter.Inc() after 3 calls = %v, want 3", got)
	}

	// Test different label values
	counter.Inc("POST", "201")
	if got := counter.Value("POST", "201"); got != 1 {
		t.Errorf("Counter.Inc() for different labels = %v, want 1", got)
	}
}

func TestCounter_Add(t *testing.T) {
	counter := NewCounter(MetricOpts{
		Namespace: "test",
		Name:      "bytes_total",
		Help:      "Test counter",
	})

	counter.Add(100)
	if got := counter.Value(); got != 100 {
		t.Errorf("Counter.Add(100) = %v, want 100", got)
	}

	// Negative values should be ignored
	counter.Add(-50)
	if got := counter.Value(); got != 100 {
		t.Errorf("Counter.Add(-50) should be ignored, got %v, want 100", got)
	}
}

func TestCounter_FullName(t *testing.T) {
	tests := []struct {
		name      string
		opts      MetricOpts
		wantName  string
	}{
		{
			name: "full name with namespace and subsystem",
			opts: MetricOpts{
				Namespace: "grafana",
				Subsystem: "http",
				Name:      "requests_total",
			},
			wantName: "grafana_http_requests_total",
		},
		{
			name: "name with namespace only",
			opts: MetricOpts{
				Namespace: "grafana",
				Name:      "requests_total",
			},
			wantName: "grafana_requests_total",
		},
		{
			name: "name only",
			opts: MetricOpts{
				Name: "requests_total",
			},
			wantName: "requests_total",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.opts.FullName(); got != tt.wantName {
				t.Errorf("MetricOpts.FullName() = %v, want %v", got, tt.wantName)
			}
		})
	}
}

// =============================================================================
// SECTION 2: Gauge Tests
// =============================================================================

func TestGauge_SetAndValue(t *testing.T) {
	gauge := NewGauge(MetricOpts{
		Namespace: "test",
		Name:      "connections",
		Help:      "Test gauge",
	})

	gauge.Set(10)
	if got := gauge.Value(); got != 10 {
		t.Errorf("Gauge.Set(10) = %v, want 10", got)
	}

	gauge.Set(5)
	if got := gauge.Value(); got != 5 {
		t.Errorf("Gauge.Set(5) = %v, want 5", got)
	}
}

func TestGauge_IncDec(t *testing.T) {
	gauge := NewGauge(MetricOpts{
		Namespace: "test",
		Name:      "active_requests",
		Help:      "Test gauge",
	})

	gauge.Inc()
	gauge.Inc()
	gauge.Inc()
	if got := gauge.Value(); got != 3 {
		t.Errorf("Gauge after 3 Inc() = %v, want 3", got)
	}

	gauge.Dec()
	if got := gauge.Value(); got != 2 {
		t.Errorf("Gauge after Dec() = %v, want 2", got)
	}
}

func TestGauge_Add(t *testing.T) {
	gauge := NewGauge(MetricOpts{
		Namespace: "test",
		Name:      "queue_size",
		Help:      "Test gauge",
	})

	gauge.Add(10)
	if got := gauge.Value(); got != 10 {
		t.Errorf("Gauge.Add(10) = %v, want 10", got)
	}

	// Gauges can decrease
	gauge.Add(-5)
	if got := gauge.Value(); got != 5 {
		t.Errorf("Gauge.Add(-5) = %v, want 5", got)
	}
}

// =============================================================================
// SECTION 3: Histogram Tests
// =============================================================================

func TestHistogram_Observe(t *testing.T) {
	histogram := NewHistogram(MetricOpts{
		Namespace: "test",
		Name:      "request_duration_seconds",
		Help:      "Test histogram",
		Buckets:   []float64{0.1, 0.5, 1.0, 5.0},
	})

	histogram.Observe(0.05)
	histogram.Observe(0.3)
	histogram.Observe(0.8)
	histogram.Observe(2.0)
	histogram.Observe(10.0)

	if got := histogram.Count(); got != 5 {
		t.Errorf("Histogram.Count() = %v, want 5", got)
	}

	expectedSum := 0.05 + 0.3 + 0.8 + 2.0 + 10.0
	if got := histogram.Sum(); got != expectedSum {
		t.Errorf("Histogram.Sum() = %v, want %v", got, expectedSum)
	}
}

func TestHistogram_ObserveDuration(t *testing.T) {
	histogram := NewHistogram(MetricOpts{
		Namespace: "test",
		Name:      "operation_duration_seconds",
		Help:      "Test histogram",
	})

	start := time.Now()
	time.Sleep(10 * time.Millisecond)
	histogram.ObserveDuration(start)

	if got := histogram.Count(); got != 1 {
		t.Errorf("Histogram.Count() after ObserveDuration = %v, want 1", got)
	}

	// Duration should be at least 10ms (0.01s)
	if got := histogram.Sum(); got < 0.01 {
		t.Errorf("Histogram.Sum() = %v, want >= 0.01", got)
	}
}

func TestHistogram_WithLabels(t *testing.T) {
	histogram := NewHistogram(MetricOpts{
		Namespace: "test",
		Name:      "request_duration_seconds",
		Help:      "Test histogram",
		Labels:    []string{"method", "endpoint"},
	})

	histogram.Observe(0.1, "GET", "/api/users")
	histogram.Observe(0.2, "GET", "/api/users")
	histogram.Observe(0.5, "POST", "/api/users")

	if got := histogram.Count("GET", "/api/users"); got != 2 {
		t.Errorf("Histogram.Count(GET, /api/users) = %v, want 2", got)
	}

	if got := histogram.Count("POST", "/api/users"); got != 1 {
		t.Errorf("Histogram.Count(POST, /api/users) = %v, want 1", got)
	}
}

// =============================================================================
// SECTION 4: RED Metrics Tests
// =============================================================================

func TestREDMetrics_RecordRequest(t *testing.T) {
	red := NewREDMetrics("test", "http")

	// Record successful request
	red.RecordRequest("GET", "/api/users", "OK", 100*time.Millisecond, nil)

	if got := red.RequestsTotal.Value("GET", "/api/users", "OK"); got != 1 {
		t.Errorf("RequestsTotal = %v, want 1", got)
	}

	// Record failed request
	err := errors.New("connection timeout")
	red.RecordRequest("POST", "/api/users", "Internal Server Error", 500*time.Millisecond, err)

	if got := red.RequestsTotal.Value("POST", "/api/users", "Internal Server Error"); got != 1 {
		t.Errorf("RequestsTotal for error = %v, want 1", got)
	}

	if got := red.RequestErrors.Value("POST", "/api/users", "timeout"); got != 1 {
		t.Errorf("RequestErrors = %v, want 1", got)
	}
}

func TestREDMetrics_InFlightRequests(t *testing.T) {
	red := NewREDMetrics("test", "http")

	red.StartRequest("GET", "/api/users")
	red.StartRequest("GET", "/api/users")

	if got := red.InFlightRequests.Value("GET", "/api/users"); got != 2 {
		t.Errorf("InFlightRequests = %v, want 2", got)
	}

	red.EndRequest("GET", "/api/users")

	if got := red.InFlightRequests.Value("GET", "/api/users"); got != 1 {
		t.Errorf("InFlightRequests after end = %v, want 1", got)
	}
}

func TestCategorizeError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantType string
	}{
		{
			name:     "timeout error",
			err:      errors.New("context deadline exceeded"),
			wantType: "timeout",
		},
		{
			name:     "connection error",
			err:      errors.New("connection refused"),
			wantType: "connection",
		},
		{
			name:     "auth error",
			err:      errors.New("unauthorized access"),
			wantType: "auth",
		},
		{
			name:     "validation error",
			err:      errors.New("invalid input"),
			wantType: "validation",
		},
		{
			name:     "rate limit error",
			err:      errors.New("rate limit exceeded"),
			wantType: "rate_limit",
		},
		{
			name:     "generic error",
			err:      errors.New("something went wrong"),
			wantType: "internal",
		},
		{
			name:     "nil error",
			err:      nil,
			wantType: "none",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := categorizeError(tt.err); got != tt.wantType {
				t.Errorf("categorizeError() = %v, want %v", got, tt.wantType)
			}
		})
	}
}

// =============================================================================
// SECTION 5: Logger Tests
// =============================================================================

func TestLogger_Info(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))

	ctx := context.Background()
	logger.Info(ctx, "test message", map[string]interface{}{
		"key": "value",
	})

	var entry LogEntry
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log entry: %v", err)
	}

	if entry.Level != "info" {
		t.Errorf("Log level = %v, want info", entry.Level)
	}
	if entry.Message != "test message" {
		t.Errorf("Log message = %v, want 'test message'", entry.Message)
	}
	if entry.Service != "test-service" {
		t.Errorf("Log service = %v, want 'test-service'", entry.Service)
	}
	if entry.Fields["key"] != "value" {
		t.Errorf("Log fields[key] = %v, want 'value'", entry.Fields["key"])
	}
}

func TestLogger_Error(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))

	ctx := context.Background()
	testErr := errors.New("test error")
	logger.Error(ctx, "operation failed", testErr, nil)

	var entry LogEntry
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log entry: %v", err)
	}

	if entry.Level != "error" {
		t.Errorf("Log level = %v, want error", entry.Level)
	}
	if entry.Fields["error"] != "test error" {
		t.Errorf("Log fields[error] = %v, want 'test error'", entry.Fields["error"])
	}
}

func TestLogger_WithTraceContext(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))

	ctx := context.WithValue(context.Background(), TraceIDKey, "trace-123")
	ctx = context.WithValue(ctx, SpanIDKey, "span-456")

	logger.Info(ctx, "traced message", nil)

	var entry LogEntry
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log entry: %v", err)
	}

	if entry.TraceID != "trace-123" {
		t.Errorf("Log trace_id = %v, want 'trace-123'", entry.TraceID)
	}
	if entry.SpanID != "span-456" {
		t.Errorf("Log span_id = %v, want 'span-456'", entry.SpanID)
	}
}

func TestLogger_LevelFiltering(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf), WithLevel(WarnLevel))

	ctx := context.Background()

	// Debug and Info should be filtered
	logger.Debug(ctx, "debug message", nil)
	logger.Info(ctx, "info message", nil)

	if buf.Len() > 0 {
		t.Error("Debug and Info messages should be filtered when level is Warn")
	}

	// Warn should pass through
	logger.Warn(ctx, "warn message", nil)

	if buf.Len() == 0 {
		t.Error("Warn message should not be filtered")
	}
}

func TestLogger_With(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))

	// Create a child logger with additional fields
	childLogger := logger.With(map[string]interface{}{
		"request_id": "req-123",
	})

	ctx := context.Background()
	childLogger.Info(ctx, "child message", nil)

	var entry LogEntry
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log entry: %v", err)
	}

	if entry.Fields["request_id"] != "req-123" {
		t.Errorf("Child logger should include parent fields, got %v", entry.Fields)
	}
}

// =============================================================================
// SECTION 6: Tracer Tests
// =============================================================================

func TestTracer_StartSpan(t *testing.T) {
	tracer := NewTracer(TracerConfig{
		ServiceName:    "test-service",
		ServiceVersion: "1.0.0",
		Sampler:        &AlwaysSampler{},
	})

	ctx := context.Background()
	ctx, span := tracer.StartSpan(ctx, "test-operation", SpanKindServer)

	if span.Name != "test-operation" {
		t.Errorf("Span name = %v, want 'test-operation'", span.Name)
	}
	if span.Kind != SpanKindServer {
		t.Errorf("Span kind = %v, want SpanKindServer", span.Kind)
	}
	if span.TraceID == "" {
		t.Error("Span should have a trace ID")
	}
	if span.SpanID == "" {
		t.Error("Span should have a span ID")
	}

	// Check context has trace info
	if ctx.Value(TraceIDKey) != span.TraceID {
		t.Error("Context should contain trace ID")
	}
	if ctx.Value(SpanIDKey) != span.SpanID {
		t.Error("Context should contain span ID")
	}
}

func TestTracer_ChildSpan(t *testing.T) {
	tracer := NewTracer(TracerConfig{
		ServiceName: "test-service",
		Sampler:     &AlwaysSampler{},
	})

	ctx := context.Background()
	ctx, parentSpan := tracer.StartSpan(ctx, "parent", SpanKindServer)
	_, childSpan := tracer.StartSpan(ctx, "child", SpanKindInternal)

	// Child should have same trace ID
	if childSpan.TraceID != parentSpan.TraceID {
		t.Error("Child span should have same trace ID as parent")
	}

	// Child should reference parent
	if childSpan.ParentSpanID != parentSpan.SpanID {
		t.Errorf("Child parent span ID = %v, want %v", childSpan.ParentSpanID, parentSpan.SpanID)
	}
}

func TestSpan_SetAttribute(t *testing.T) {
	span := &Span{
		Attributes: make(map[string]interface{}),
	}

	span.SetAttribute("http.method", "GET")
	span.SetAttribute("http.status_code", 200)

	if span.Attributes["http.method"] != "GET" {
		t.Errorf("Attribute http.method = %v, want 'GET'", span.Attributes["http.method"])
	}
	if span.Attributes["http.status_code"] != 200 {
		t.Errorf("Attribute http.status_code = %v, want 200", span.Attributes["http.status_code"])
	}
}

func TestSpan_AddEvent(t *testing.T) {
	span := &Span{
		Events: make([]SpanEvent, 0),
	}

	span.AddEvent("cache_hit", map[string]interface{}{
		"key": "user:123",
	})

	if len(span.Events) != 1 {
		t.Fatalf("Expected 1 event, got %d", len(span.Events))
	}

	event := span.Events[0]
	if event.Name != "cache_hit" {
		t.Errorf("Event name = %v, want 'cache_hit'", event.Name)
	}
	if event.Attributes["key"] != "user:123" {
		t.Errorf("Event attribute key = %v, want 'user:123'", event.Attributes["key"])
	}
}

func TestSpan_RecordError(t *testing.T) {
	span := &Span{
		Events:     make([]SpanEvent, 0),
		Attributes: make(map[string]interface{}),
	}

	testErr := errors.New("test error")
	span.RecordError(testErr)

	if span.Status != SpanStatusError {
		t.Errorf("Span status = %v, want SpanStatusError", span.Status)
	}
	if span.StatusMsg != "test error" {
		t.Errorf("Span status message = %v, want 'test error'", span.StatusMsg)
	}
	if len(span.Events) != 1 {
		t.Fatal("Expected exception event to be recorded")
	}
	if span.Events[0].Name != "exception" {
		t.Errorf("Event name = %v, want 'exception'", span.Events[0].Name)
	}
}

func TestSpan_Duration(t *testing.T) {
	span := &Span{
		StartTime: time.Now(),
	}

	time.Sleep(10 * time.Millisecond)
	span.End()

	duration := span.Duration()
	if duration < 10*time.Millisecond {
		t.Errorf("Span duration = %v, want >= 10ms", duration)
	}
}

func TestRatioSampler(t *testing.T) {
	// Test 0% sampling
	sampler0 := NewRatioSampler(0.0)
	sampled := false
	for i := 0; i < 100; i++ {
		if sampler0.ShouldSample("trace-" + string(rune(i))) {
			sampled = true
			break
		}
	}
	if sampled {
		t.Error("0% sampler should not sample any traces")
	}

	// Test 100% sampling
	sampler100 := NewRatioSampler(1.0)
	allSampled := true
	for i := 0; i < 100; i++ {
		if !sampler100.ShouldSample("trace-" + string(rune(i))) {
			allSampled = false
			break
		}
	}
	if !allSampled {
		t.Error("100% sampler should sample all traces")
	}
}

// =============================================================================
// SECTION 7: HTTP Middleware Tests
// =============================================================================

func TestResponseWriter_CapturesStatusCode(t *testing.T) {
	recorder := httptest.NewRecorder()
	wrapped := NewResponseWriter(recorder)

	wrapped.WriteHeader(http.StatusNotFound)

	if wrapped.StatusCode() != http.StatusNotFound {
		t.Errorf("StatusCode() = %v, want %v", wrapped.StatusCode(), http.StatusNotFound)
	}
}

func TestResponseWriter_CapturesBytesWritten(t *testing.T) {
	recorder := httptest.NewRecorder()
	wrapped := NewResponseWriter(recorder)

	data := []byte("Hello, World!")
	wrapped.Write(data)

	if wrapped.BytesWritten() != len(data) {
		t.Errorf("BytesWritten() = %v, want %v", wrapped.BytesWritten(), len(data))
	}
}

func TestResponseWriter_DefaultsTo200(t *testing.T) {
	recorder := httptest.NewRecorder()
	wrapped := NewResponseWriter(recorder)

	// Write without explicit WriteHeader
	wrapped.Write([]byte("OK"))

	if wrapped.StatusCode() != http.StatusOK {
		t.Errorf("Default StatusCode() = %v, want %v", wrapped.StatusCode(), http.StatusOK)
	}
}

func TestObservabilityMiddleware_Handler(t *testing.T) {
	middleware := NewObservabilityMiddleware("test-service")

	// Create a test handler
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with middleware
	wrapped := middleware.Handler(handler)

	// Create test request
	req := httptest.NewRequest("GET", "/api/test", nil)
	rec := httptest.NewRecorder()

	// Execute
	wrapped.ServeHTTP(rec, req)

	// Verify response
	if rec.Code != http.StatusOK {
		t.Errorf("Response code = %v, want %v", rec.Code, http.StatusOK)
	}

	// Verify trace headers are set
	if rec.Header().Get("X-Trace-ID") == "" {
		t.Error("X-Trace-ID header should be set")
	}
}

func TestObservabilityMiddleware_TracePropagation(t *testing.T) {
	middleware := NewObservabilityMiddleware("test-service")

	var capturedTraceID string
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if traceID := r.Context().Value(TraceIDKey); traceID != nil {
			capturedTraceID = traceID.(string)
		}
		w.WriteHeader(http.StatusOK)
	})

	wrapped := middleware.Handler(handler)

	// Create request with trace context
	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("X-Trace-ID", "incoming-trace-123")
	rec := httptest.NewRecorder()

	wrapped.ServeHTTP(rec, req)

	if capturedTraceID != "incoming-trace-123" {
		t.Errorf("Trace ID not propagated, got %v, want 'incoming-trace-123'", capturedTraceID)
	}
}

func TestObservabilityMiddleware_ErrorHandling(t *testing.T) {
	middleware := NewObservabilityMiddleware("test-service")

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	})

	wrapped := middleware.Handler(handler)

	req := httptest.NewRequest("GET", "/api/test", nil)
	rec := httptest.NewRecorder()

	wrapped.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("Response code = %v, want %v", rec.Code, http.StatusInternalServerError)
	}
}

// =============================================================================
// SECTION 8: Error Handling Tests
// =============================================================================

func TestWrapError(t *testing.T) {
	ctx := context.WithValue(context.Background(), TraceIDKey, "trace-123")
	ctx = context.WithValue(ctx, SpanIDKey, "span-456")

	originalErr := errors.New("original error")
	wrappedErr := WrapError(ctx, originalErr, "TestOperation", nil)

	obsErr, ok := wrappedErr.(*ObservabilityError)
	if !ok {
		t.Fatal("Expected ObservabilityError")
	}

	if obsErr.TraceID != "trace-123" {
		t.Errorf("TraceID = %v, want 'trace-123'", obsErr.TraceID)
	}
	if obsErr.SpanID != "span-456" {
		t.Errorf("SpanID = %v, want 'span-456'", obsErr.SpanID)
	}
	if obsErr.Operation != "TestOperation" {
		t.Errorf("Operation = %v, want 'TestOperation'", obsErr.Operation)
	}

	// Test error message includes trace ID
	if !strings.Contains(obsErr.Error(), "trace-123") {
		t.Error("Error message should contain trace ID")
	}
}

func TestWrapError_NilError(t *testing.T) {
	ctx := context.Background()
	wrappedErr := WrapError(ctx, nil, "TestOperation", nil)

	if wrappedErr != nil {
		t.Error("WrapError(nil) should return nil")
	}
}

func TestErrorHandler_Handle(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))
	handler := NewErrorHandler(logger, "test")

	ctx := context.Background()
	testErr := errors.New("test error")

	handled := handler.Handle(ctx, testErr, "TestOperation", nil)

	if !handled {
		t.Error("Handle should return true for non-nil error")
	}

	// Verify error was logged
	if buf.Len() == 0 {
		t.Error("Error should be logged")
	}

	// Verify metric was recorded
	if handler.metrics.Value("TestOperation", "internal") != 1 {
		t.Error("Error metric should be recorded")
	}
}

func TestErrorHandler_HandleNilError(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))
	handler := NewErrorHandler(logger, "test")

	ctx := context.Background()
	handled := handler.Handle(ctx, nil, "TestOperation", nil)

	if handled {
		t.Error("Handle should return false for nil error")
	}

	if buf.Len() > 0 {
		t.Error("Nil error should not be logged")
	}
}

// =============================================================================
// SECTION 9: Health Check Tests
// =============================================================================

func TestHealthChecker_Check(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))
	checker := NewHealthChecker(logger, "test")

	// Register a healthy check
	checker.Register("database", func(ctx context.Context) HealthCheck {
		return HealthCheck{
			Status:  HealthStatusHealthy,
			Message: "Connected",
		}
	})

	// Register an unhealthy check
	checker.Register("cache", func(ctx context.Context) HealthCheck {
		return HealthCheck{
			Status:  HealthStatusUnhealthy,
			Message: "Connection refused",
		}
	})

	results := checker.Check(context.Background())

	if len(results) != 2 {
		t.Fatalf("Expected 2 health check results, got %d", len(results))
	}

	// Find results by name
	var dbResult, cacheResult HealthCheck
	for _, r := range results {
		switch r.Name {
		case "database":
			dbResult = r
		case "cache":
			cacheResult = r
		}
	}

	if dbResult.Status != HealthStatusHealthy {
		t.Errorf("Database status = %v, want healthy", dbResult.Status)
	}
	if cacheResult.Status != HealthStatusUnhealthy {
		t.Errorf("Cache status = %v, want unhealthy", cacheResult.Status)
	}
}

func TestHealthChecker_OverallStatus(t *testing.T) {
	var buf bytes.Buffer
	logger := NewLogger("test-service", WithOutput(&buf))

	tests := []struct {
		name     string
		statuses []HealthStatus
		want     HealthStatus
	}{
		{
			name:     "all healthy",
			statuses: []HealthStatus{HealthStatusHealthy, HealthStatusHealthy},
			want:     HealthStatusHealthy,
		},
		{
			name:     "one degraded",
			statuses: []HealthStatus{HealthStatusHealthy, HealthStatusDegraded},
			want:     HealthStatusDegraded,
		},
		{
			name:     "one unhealthy",
			statuses: []HealthStatus{HealthStatusHealthy, HealthStatusUnhealthy},
			want:     HealthStatusUnhealthy,
		},
		{
			name:     "degraded and unhealthy",
			statuses: []HealthStatus{HealthStatusDegraded, HealthStatusUnhealthy},
			want:     HealthStatusUnhealthy,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			checker := NewHealthChecker(logger, "test")

			for i, status := range tt.statuses {
				s := status // capture for closure
				checker.Register(string(rune('a'+i)), func(ctx context.Context) HealthCheck {
					return HealthCheck{Status: s}
				})
			}

			got := checker.OverallStatus(context.Background())
			if got != tt.want {
				t.Errorf("OverallStatus() = %v, want %v", got, tt.want)
			}
		})
	}
}

// =============================================================================
// SECTION 10: Example Service Tests
// =============================================================================

func TestExampleService_ProcessRequest(t *testing.T) {
	service := NewExampleService("test-service")

	ctx := context.Background()
	err := service.ProcessRequest(ctx, "req-123", map[string]string{"key": "value"})

	if err != nil {
		t.Errorf("ProcessRequest() error = %v, want nil", err)
	}
}
