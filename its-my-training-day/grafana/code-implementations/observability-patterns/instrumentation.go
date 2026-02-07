// Package observability provides practical implementations of instrumentation patterns
// commonly used in Grafana's observability ecosystem (LGTM stack).
//
// This file demonstrates the three pillars of observability:
// - Metrics: Prometheus instrumentation using the RED method (Rate, Errors, Duration)
// - Logging: Structured logging patterns compatible with Loki
// - Tracing: OpenTelemetry tracing setup for Tempo integration
//
// These patterns are essential for building observable applications and are
// frequently discussed in Grafana observability architect interviews.
//
// Key Concepts Demonstrated:
// - RED Method: Rate (requests/sec), Errors (error rate), Duration (latency)
// - Structured Logging: JSON format with trace correlation for Loki
// - Distributed Tracing: Context propagation and span management
// - HTTP Middleware: Combining all three pillars in a single middleware chain
package observability

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"
)

// =============================================================================
// SECTION 1: Prometheus Metrics Instrumentation (RED Method)
// =============================================================================

// MetricType represents the type of Prometheus metric.
type MetricType int

const (
	// CounterMetric is a monotonically increasing counter
	CounterMetric MetricType = iota
	// GaugeMetric is a value that can go up and down
	GaugeMetric
	// HistogramMetric tracks distributions of values
	HistogramMetric
	// SummaryMetric calculates quantiles over a sliding time window
	SummaryMetric
)

// String returns the metric type name.
func (mt MetricType) String() string {
	switch mt {
	case CounterMetric:
		return "counter"
	case GaugeMetric:
		return "gauge"
	case HistogramMetric:
		return "histogram"
	case SummaryMetric:
		return "summary"
	default:
		return "unknown"
	}
}

// MetricOpts holds configuration for creating metrics.
// This mirrors the prometheus.Opts pattern used in the official client.
type MetricOpts struct {
	// Namespace is the metric namespace (e.g., "grafana", "loki")
	Namespace string
	// Subsystem is the metric subsystem (e.g., "http", "query")
	Subsystem string
	// Name is the metric name (e.g., "requests_total")
	Name string
	// Help is the metric description
	Help string
	// Labels are the label names for this metric
	Labels []string
	// Buckets are histogram bucket boundaries (for histograms only)
	Buckets []float64
}

// FullName returns the fully qualified metric name.
// Format: namespace_subsystem_name
func (o MetricOpts) FullName() string {
	if o.Namespace != "" && o.Subsystem != "" {
		return fmt.Sprintf("%s_%s_%s", o.Namespace, o.Subsystem, o.Name)
	}
	if o.Namespace != "" {
		return fmt.Sprintf("%s_%s", o.Namespace, o.Name)
	}
	if o.Subsystem != "" {
		return fmt.Sprintf("%s_%s", o.Subsystem, o.Name)
	}
	return o.Name
}

// DefaultHistogramBuckets provides sensible defaults for HTTP latency histograms.
// These buckets cover typical web service latencies from 5ms to 10s.
var DefaultHistogramBuckets = []float64{
	0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
}

// Counter represents a Prometheus counter metric.
// Counters only increase and reset to zero on restart.
//
// Use cases:
// - Total requests served
// - Total errors encountered
// - Total bytes processed
type Counter struct {
	opts   MetricOpts
	values map[string]float64
	mu     sync.RWMutex
}

// NewCounter creates a new counter metric.
func NewCounter(opts MetricOpts) *Counter {
	return &Counter{
		opts:   opts,
		values: make(map[string]float64),
	}
}

// Inc increments the counter by 1 for the given label values.
func (c *Counter) Inc(labelValues ...string) {
	c.Add(1, labelValues...)
}

// Add adds the given value to the counter for the given label values.
// Value must be non-negative.
func (c *Counter) Add(value float64, labelValues ...string) {
	if value < 0 {
		return // Counters cannot decrease
	}

	key := c.labelKey(labelValues)
	c.mu.Lock()
	c.values[key] += value
	c.mu.Unlock()
}

// Value returns the current counter value for the given label values.
func (c *Counter) Value(labelValues ...string) float64 {
	key := c.labelKey(labelValues)
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.values[key]
}

// labelKey creates a unique key from label values.
func (c *Counter) labelKey(labelValues []string) string {
	if len(labelValues) == 0 {
		return ""
	}
	key := ""
	for i, v := range labelValues {
		if i > 0 {
			key += ","
		}
		key += v
	}
	return key
}

// Describe returns the metric description in Prometheus format.
func (c *Counter) Describe() string {
	return fmt.Sprintf("# HELP %s %s\n# TYPE %s counter",
		c.opts.FullName(), c.opts.Help, c.opts.FullName())
}

// Gauge represents a Prometheus gauge metric.
// Gauges can increase and decrease.
//
// Use cases:
// - Current number of active connections
// - Current memory usage
// - Current queue depth
type Gauge struct {
	opts   MetricOpts
	values map[string]float64
	mu     sync.RWMutex
}

// NewGauge creates a new gauge metric.
func NewGauge(opts MetricOpts) *Gauge {
	return &Gauge{
		opts:   opts,
		values: make(map[string]float64),
	}
}

// Set sets the gauge to the given value.
func (g *Gauge) Set(value float64, labelValues ...string) {
	key := g.labelKey(labelValues)
	g.mu.Lock()
	g.values[key] = value
	g.mu.Unlock()
}

// Inc increments the gauge by 1.
func (g *Gauge) Inc(labelValues ...string) {
	g.Add(1, labelValues...)
}

// Dec decrements the gauge by 1.
func (g *Gauge) Dec(labelValues ...string) {
	g.Add(-1, labelValues...)
}

// Add adds the given value to the gauge (can be negative).
func (g *Gauge) Add(value float64, labelValues ...string) {
	key := g.labelKey(labelValues)
	g.mu.Lock()
	g.values[key] += value
	g.mu.Unlock()
}

// Value returns the current gauge value.
func (g *Gauge) Value(labelValues ...string) float64 {
	key := g.labelKey(labelValues)
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.values[key]
}

// labelKey creates a unique key from label values.
func (g *Gauge) labelKey(labelValues []string) string {
	if len(labelValues) == 0 {
		return ""
	}
	key := ""
	for i, v := range labelValues {
		if i > 0 {
			key += ","
		}
		key += v
	}
	return key
}

// Describe returns the metric description in Prometheus format.
func (g *Gauge) Describe() string {
	return fmt.Sprintf("# HELP %s %s\n# TYPE %s gauge",
		g.opts.FullName(), g.opts.Help, g.opts.FullName())
}

// Histogram represents a Prometheus histogram metric.
// Histograms track the distribution of values in configurable buckets.
//
// Use cases:
// - Request latency distribution
// - Response size distribution
// - Query execution time
//
// The RED method uses histograms for the "Duration" component.
type Histogram struct {
	opts    MetricOpts
	buckets []float64
	counts  map[string]*histogramData
	mu      sync.RWMutex
}

// histogramData holds the internal state for a histogram.
type histogramData struct {
	bucketCounts []uint64  // Count per bucket
	sum          float64   // Sum of all observed values
	count        uint64    // Total number of observations
}

// NewHistogram creates a new histogram metric.
func NewHistogram(opts MetricOpts) *Histogram {
	buckets := opts.Buckets
	if len(buckets) == 0 {
		buckets = DefaultHistogramBuckets
	}

	return &Histogram{
		opts:    opts,
		buckets: buckets,
		counts:  make(map[string]*histogramData),
	}
}

// Observe records a value in the histogram.
func (h *Histogram) Observe(value float64, labelValues ...string) {
	key := h.labelKey(labelValues)

	h.mu.Lock()
	defer h.mu.Unlock()

	data, exists := h.counts[key]
	if !exists {
		data = &histogramData{
			bucketCounts: make([]uint64, len(h.buckets)+1), // +1 for +Inf bucket
		}
		h.counts[key] = data
	}

	// Update sum and count
	data.sum += value
	data.count++

	// Update bucket counts
	for i, bound := range h.buckets {
		if value <= bound {
			data.bucketCounts[i]++
		}
	}
	// Always increment +Inf bucket
	data.bucketCounts[len(h.buckets)]++
}

// ObserveDuration is a convenience method for timing operations.
// It observes the duration since the given start time in seconds.
func (h *Histogram) ObserveDuration(start time.Time, labelValues ...string) {
	duration := time.Since(start).Seconds()
	h.Observe(duration, labelValues...)
}

// Sum returns the sum of all observed values.
func (h *Histogram) Sum(labelValues ...string) float64 {
	key := h.labelKey(labelValues)
	h.mu.RLock()
	defer h.mu.RUnlock()

	if data, exists := h.counts[key]; exists {
		return data.sum
	}
	return 0
}

// Count returns the total number of observations.
func (h *Histogram) Count(labelValues ...string) uint64 {
	key := h.labelKey(labelValues)
	h.mu.RLock()
	defer h.mu.RUnlock()

	if data, exists := h.counts[key]; exists {
		return data.count
	}
	return 0
}

// labelKey creates a unique key from label values.
func (h *Histogram) labelKey(labelValues []string) string {
	if len(labelValues) == 0 {
		return ""
	}
	key := ""
	for i, v := range labelValues {
		if i > 0 {
			key += ","
		}
		key += v
	}
	return key
}

// Describe returns the metric description in Prometheus format.
func (h *Histogram) Describe() string {
	return fmt.Sprintf("# HELP %s %s\n# TYPE %s histogram",
		h.opts.FullName(), h.opts.Help, h.opts.FullName())
}

// =============================================================================
// SECTION 2: RED Method Metrics
// =============================================================================

// REDMetrics implements the RED method for service-level monitoring.
// RED stands for:
// - Rate: Number of requests per second
// - Errors: Number of failed requests per second
// - Duration: Distribution of request latencies
//
// This is the standard approach for monitoring request-driven services
// and is widely used in Grafana's own services.
//
// Example Prometheus queries:
// - Rate: rate(http_requests_total[5m])
// - Error Rate: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
// - p99 Latency: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
type REDMetrics struct {
	// RequestsTotal counts total requests (Rate component)
	RequestsTotal *Counter
	// RequestErrors counts failed requests (Errors component)
	RequestErrors *Counter
	// RequestDuration tracks request latency distribution (Duration component)
	RequestDuration *Histogram
	// InFlightRequests tracks currently processing requests (optional)
	InFlightRequests *Gauge
}

// NewREDMetrics creates a new set of RED metrics for a service.
// namespace is typically the service name (e.g., "loki", "mimir")
// subsystem is the component (e.g., "http", "grpc", "query")
func NewREDMetrics(namespace, subsystem string) *REDMetrics {
	return &REDMetrics{
		RequestsTotal: NewCounter(MetricOpts{
			Namespace: namespace,
			Subsystem: subsystem,
			Name:      "requests_total",
			Help:      "Total number of requests processed",
			Labels:    []string{"method", "endpoint", "status"},
		}),
		RequestErrors: NewCounter(MetricOpts{
			Namespace: namespace,
			Subsystem: subsystem,
			Name:      "request_errors_total",
			Help:      "Total number of request errors",
			Labels:    []string{"method", "endpoint", "error_type"},
		}),
		RequestDuration: NewHistogram(MetricOpts{
			Namespace: namespace,
			Subsystem: subsystem,
			Name:      "request_duration_seconds",
			Help:      "Request duration in seconds",
			Labels:    []string{"method", "endpoint"},
			Buckets:   DefaultHistogramBuckets,
		}),
		InFlightRequests: NewGauge(MetricOpts{
			Namespace: namespace,
			Subsystem: subsystem,
			Name:      "requests_in_flight",
			Help:      "Number of requests currently being processed",
			Labels:    []string{"method", "endpoint"},
		}),
	}
}

// RecordRequest records metrics for a completed request.
// This is the primary method for instrumenting HTTP handlers.
func (r *REDMetrics) RecordRequest(method, endpoint, status string, duration time.Duration, err error) {
	// Rate: Increment total requests
	r.RequestsTotal.Inc(method, endpoint, status)

	// Duration: Record latency
	r.RequestDuration.Observe(duration.Seconds(), method, endpoint)

	// Errors: Record if this was an error
	if err != nil {
		errorType := categorizeError(err)
		r.RequestErrors.Inc(method, endpoint, errorType)
	}
}

// StartRequest marks the beginning of a request (for in-flight tracking).
func (r *REDMetrics) StartRequest(method, endpoint string) {
	r.InFlightRequests.Inc(method, endpoint)
}

// EndRequest marks the end of a request (for in-flight tracking).
func (r *REDMetrics) EndRequest(method, endpoint string) {
	r.InFlightRequests.Dec(method, endpoint)
}

// categorizeError determines the error type for metrics labeling.
// This helps with error analysis and alerting.
func categorizeError(err error) string {
	if err == nil {
		return "none"
	}

	// Check for common error types
	errStr := err.Error()

	// Timeout errors
	if contains(errStr, "timeout", "deadline exceeded", "context deadline") {
		return "timeout"
	}

	// Connection errors
	if contains(errStr, "connection refused", "connection reset", "no route to host") {
		return "connection"
	}

	// Authentication/Authorization errors
	if contains(errStr, "unauthorized", "forbidden", "authentication") {
		return "auth"
	}

	// Validation errors
	if contains(errStr, "invalid", "validation", "bad request") {
		return "validation"
	}

	// Rate limiting
	if contains(errStr, "rate limit", "too many requests", "throttled") {
		return "rate_limit"
	}

	return "internal"
}

// contains checks if the string contains any of the substrings (case-insensitive).
func contains(s string, substrs ...string) bool {
	sLower := toLower(s)
	for _, sub := range substrs {
		if containsSubstring(sLower, toLower(sub)) {
			return true
		}
	}
	return false
}

// toLower converts a string to lowercase (simple ASCII implementation).
func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

// containsSubstring checks if s contains substr.
func containsSubstring(s, substr string) bool {
	if len(substr) > len(s) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// =============================================================================
// SECTION 3: Structured Logging for Loki Compatibility
// =============================================================================

// LogLevel represents the severity level of a log entry.
type LogLevel int

const (
	// DebugLevel is for detailed debugging information
	DebugLevel LogLevel = iota
	// InfoLevel is for general operational information
	InfoLevel
	// WarnLevel is for warning conditions
	WarnLevel
	// ErrorLevel is for error conditions
	ErrorLevel
	// FatalLevel is for fatal conditions that require immediate attention
	FatalLevel
)

// String returns the log level name.
func (l LogLevel) String() string {
	switch l {
	case DebugLevel:
		return "debug"
	case InfoLevel:
		return "info"
	case WarnLevel:
		return "warn"
	case ErrorLevel:
		return "error"
	case FatalLevel:
		return "fatal"
	default:
		return "unknown"
	}
}

// LogEntry represents a structured log entry compatible with Loki.
// The JSON format allows Loki to parse and index fields for efficient querying.
//
// Key fields for Loki compatibility:
// - timestamp: RFC3339Nano format for precise ordering
// - level: Enables filtering by severity
// - service: Enables filtering by service name
// - trace_id/span_id: Enables correlation with Tempo traces
//
// LogQL query examples:
// - {service="api-gateway"} |= "error"
// - {service="api-gateway"} | json | level="error"
// - {service="api-gateway"} | json | duration > 1s
type LogEntry struct {
	// Timestamp in RFC3339Nano format
	Timestamp string `json:"timestamp"`
	// Level is the log severity
	Level string `json:"level"`
	// Message is the log message
	Message string `json:"message"`
	// Service is the service name (used as Loki label)
	Service string `json:"service"`
	// TraceID for correlation with distributed traces
	TraceID string `json:"trace_id,omitempty"`
	// SpanID for correlation with specific spans
	SpanID string `json:"span_id,omitempty"`
	// Caller is the source file and line number
	Caller string `json:"caller,omitempty"`
	// Fields contains additional structured data
	Fields map[string]interface{} `json:"fields,omitempty"`
}

// Logger provides structured logging compatible with Loki.
// It outputs JSON-formatted logs that can be easily parsed and queried.
//
// Best practices for Loki-compatible logging:
// 1. Use consistent field names across services
// 2. Include trace context for correlation
// 3. Avoid high-cardinality fields in labels
// 4. Use structured fields instead of string interpolation
// 5. Include relevant context (user_id, request_id, etc.)
type Logger struct {
	service     string
	level       LogLevel
	output      io.Writer
	encoder     *json.Encoder
	mu          sync.Mutex
	fields      map[string]interface{} // Default fields added to all logs
	includeCaller bool
}

// LoggerOption is a function that configures a Logger.
type LoggerOption func(*Logger)

// WithLevel sets the minimum log level.
func WithLevel(level LogLevel) LoggerOption {
	return func(l *Logger) {
		l.level = level
	}
}

// WithOutput sets the output writer.
func WithOutput(w io.Writer) LoggerOption {
	return func(l *Logger) {
		l.output = w
		l.encoder = json.NewEncoder(w)
	}
}

// WithFields sets default fields added to all log entries.
func WithFields(fields map[string]interface{}) LoggerOption {
	return func(l *Logger) {
		l.fields = fields
	}
}

// WithCaller enables including caller information in logs.
func WithCaller(include bool) LoggerOption {
	return func(l *Logger) {
		l.includeCaller = include
	}
}

// NewLogger creates a new structured logger.
func NewLogger(service string, opts ...LoggerOption) *Logger {
	logger := &Logger{
		service:       service,
		level:         InfoLevel,
		output:        os.Stdout,
		fields:        make(map[string]interface{}),
		includeCaller: false,
	}
	logger.encoder = json.NewEncoder(logger.output)

	for _, opt := range opts {
		opt(logger)
	}

	return logger
}

// Debug logs a debug message.
func (l *Logger) Debug(ctx context.Context, msg string, fields map[string]interface{}) {
	l.log(ctx, DebugLevel, msg, fields, nil)
}

// Info logs an info message.
func (l *Logger) Info(ctx context.Context, msg string, fields map[string]interface{}) {
	l.log(ctx, InfoLevel, msg, fields, nil)
}

// Warn logs a warning message.
func (l *Logger) Warn(ctx context.Context, msg string, fields map[string]interface{}) {
	l.log(ctx, WarnLevel, msg, fields, nil)
}

// Error logs an error message with the error included.
func (l *Logger) Error(ctx context.Context, msg string, err error, fields map[string]interface{}) {
	l.log(ctx, ErrorLevel, msg, fields, err)
}

// Fatal logs a fatal message. Note: This does not exit the program.
func (l *Logger) Fatal(ctx context.Context, msg string, err error, fields map[string]interface{}) {
	l.log(ctx, FatalLevel, msg, fields, err)
}

// log is the internal logging method.
func (l *Logger) log(ctx context.Context, level LogLevel, msg string, fields map[string]interface{}, err error) {
	// Check log level
	if level < l.level {
		return
	}

	// Build log entry
	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     level.String(),
		Message:   msg,
		Service:   l.service,
	}

	// Extract trace context from context
	if traceID := ctx.Value(TraceIDKey); traceID != nil {
		if id, ok := traceID.(string); ok {
			entry.TraceID = id
		}
	}
	if spanID := ctx.Value(SpanIDKey); spanID != nil {
		if id, ok := spanID.(string); ok {
			entry.SpanID = id
		}
	}

	// Add caller information if enabled
	if l.includeCaller {
		_, file, line, ok := runtime.Caller(2)
		if ok {
			entry.Caller = fmt.Sprintf("%s:%d", file, line)
		}
	}

	// Merge fields: default fields + provided fields + error
	mergedFields := make(map[string]interface{})
	for k, v := range l.fields {
		mergedFields[k] = v
	}
	for k, v := range fields {
		mergedFields[k] = v
	}
	if err != nil {
		mergedFields["error"] = err.Error()
		mergedFields["error_type"] = categorizeError(err)
	}
	if len(mergedFields) > 0 {
		entry.Fields = mergedFields
	}

	// Write log entry
	l.mu.Lock()
	defer l.mu.Unlock()

	if encodeErr := l.encoder.Encode(entry); encodeErr != nil {
		// Fallback to stderr if encoding fails
		fmt.Fprintf(os.Stderr, "failed to encode log entry: %v\n", encodeErr)
	}
}

// With returns a new logger with additional default fields.
// This is useful for adding context that should be included in all subsequent logs.
func (l *Logger) With(fields map[string]interface{}) *Logger {
	newFields := make(map[string]interface{})
	for k, v := range l.fields {
		newFields[k] = v
	}
	for k, v := range fields {
		newFields[k] = v
	}

	return &Logger{
		service:       l.service,
		level:         l.level,
		output:        l.output,
		encoder:       l.encoder,
		fields:        newFields,
		includeCaller: l.includeCaller,
	}
}

// =============================================================================
// SECTION 4: OpenTelemetry Tracing Setup
// =============================================================================

// Context keys for trace propagation.
type contextKey string

const (
	// TraceIDKey is the context key for trace ID
	TraceIDKey contextKey = "trace_id"
	// SpanIDKey is the context key for span ID
	SpanIDKey contextKey = "span_id"
	// ParentSpanIDKey is the context key for parent span ID
	ParentSpanIDKey contextKey = "parent_span_id"
	// SampledKey is the context key for sampling decision
	SampledKey contextKey = "sampled"
)

// SpanKind represents the type of span.
type SpanKind int

const (
	// SpanKindInternal is for internal operations
	SpanKindInternal SpanKind = iota
	// SpanKindServer is for server-side request handling
	SpanKindServer
	// SpanKindClient is for client-side request making
	SpanKindClient
	// SpanKindProducer is for message producers
	SpanKindProducer
	// SpanKindConsumer is for message consumers
	SpanKindConsumer
)

// String returns the span kind name.
func (sk SpanKind) String() string {
	switch sk {
	case SpanKindInternal:
		return "internal"
	case SpanKindServer:
		return "server"
	case SpanKindClient:
		return "client"
	case SpanKindProducer:
		return "producer"
	case SpanKindConsumer:
		return "consumer"
	default:
		return "unknown"
	}
}

// SpanStatus represents the status of a span.
type SpanStatus int

const (
	// SpanStatusUnset indicates the status is not set
	SpanStatusUnset SpanStatus = iota
	// SpanStatusOK indicates the operation completed successfully
	SpanStatusOK
	// SpanStatusError indicates the operation failed
	SpanStatusError
)

// String returns the span status name.
func (ss SpanStatus) String() string {
	switch ss {
	case SpanStatusUnset:
		return "unset"
	case SpanStatusOK:
		return "ok"
	case SpanStatusError:
		return "error"
	default:
		return "unknown"
	}
}

// Span represents a unit of work in a distributed trace.
// Spans are the building blocks of distributed tracing, representing
// individual operations within a request flow.
//
// Key concepts:
// - TraceID: Unique identifier for the entire trace (shared across services)
// - SpanID: Unique identifier for this specific span
// - ParentSpanID: Links this span to its parent (for building the trace tree)
// - Attributes: Key-value pairs providing context about the operation
//
// In Grafana's Tempo, spans are stored and can be queried by:
// - Service name
// - Operation name
// - Duration
// - Attributes
type Span struct {
	TraceID      string
	SpanID       string
	ParentSpanID string
	Name         string
	Kind         SpanKind
	StartTime    time.Time
	EndTime      time.Time
	Status       SpanStatus
	StatusMsg    string
	Attributes   map[string]interface{}
	Events       []SpanEvent
	mu           sync.Mutex
}

// SpanEvent represents an event that occurred during a span.
// Events are useful for recording significant moments within an operation.
type SpanEvent struct {
	Name       string
	Timestamp  time.Time
	Attributes map[string]interface{}
}

// Tracer creates and manages spans for distributed tracing.
// This implementation demonstrates the core concepts of OpenTelemetry tracing
// that would be used with Grafana Tempo.
//
// In production, you would use the official OpenTelemetry SDK:
// - go.opentelemetry.io/otel
// - go.opentelemetry.io/otel/sdk/trace
// - go.opentelemetry.io/otel/exporters/otlp/otlptrace
type Tracer struct {
	serviceName    string
	serviceVersion string
	sampler        Sampler
	exporter       SpanExporter
	spans          []*Span
	mu             sync.Mutex
}

// Sampler determines whether a trace should be sampled.
type Sampler interface {
	ShouldSample(traceID string) bool
}

// SpanExporter exports completed spans to a backend (e.g., Tempo).
type SpanExporter interface {
	Export(spans []*Span) error
}

// AlwaysSampler samples all traces.
type AlwaysSampler struct{}

// ShouldSample always returns true.
func (s *AlwaysSampler) ShouldSample(traceID string) bool {
	return true
}

// RatioSampler samples a percentage of traces.
type RatioSampler struct {
	ratio float64
}

// NewRatioSampler creates a sampler that samples the given ratio of traces.
// ratio should be between 0.0 and 1.0.
func NewRatioSampler(ratio float64) *RatioSampler {
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	return &RatioSampler{ratio: ratio}
}

// ShouldSample returns true based on the configured ratio.
func (s *RatioSampler) ShouldSample(traceID string) bool {
	// Simple hash-based sampling for consistent decisions
	if len(traceID) == 0 {
		return false
	}
	hash := uint64(0)
	for _, c := range traceID {
		hash = hash*31 + uint64(c)
	}
	return float64(hash%1000)/1000.0 < s.ratio
}

// ConsoleExporter exports spans to the console (for debugging).
type ConsoleExporter struct {
	output  io.Writer
	encoder *json.Encoder
}

// NewConsoleExporter creates a new console exporter.
func NewConsoleExporter(output io.Writer) *ConsoleExporter {
	return &ConsoleExporter{
		output:  output,
		encoder: json.NewEncoder(output),
	}
}

// Export writes spans to the console in JSON format.
func (e *ConsoleExporter) Export(spans []*Span) error {
	for _, span := range spans {
		if err := e.encoder.Encode(span); err != nil {
			return fmt.Errorf("failed to export span: %w", err)
		}
	}
	return nil
}

// TracerConfig holds configuration for the tracer.
type TracerConfig struct {
	ServiceName    string
	ServiceVersion string
	Sampler        Sampler
	Exporter       SpanExporter
}

// NewTracer creates a new tracer with the given configuration.
func NewTracer(config TracerConfig) *Tracer {
	sampler := config.Sampler
	if sampler == nil {
		sampler = &AlwaysSampler{}
	}

	exporter := config.Exporter
	if exporter == nil {
		exporter = NewConsoleExporter(os.Stdout)
	}

	return &Tracer{
		serviceName:    config.ServiceName,
		serviceVersion: config.ServiceVersion,
		sampler:        sampler,
		exporter:       exporter,
		spans:          make([]*Span, 0),
	}
}

// StartSpan creates a new span and returns a context with the span.
// The span should be ended by calling span.End() when the operation completes.
func (t *Tracer) StartSpan(ctx context.Context, name string, kind SpanKind) (context.Context, *Span) {
	// Generate trace ID (or use existing from context)
	traceID := ""
	if existingTraceID := ctx.Value(TraceIDKey); existingTraceID != nil {
		traceID = existingTraceID.(string)
	} else {
		traceID = generateID()
	}

	// Check sampling decision
	if !t.sampler.ShouldSample(traceID) {
		// Return a no-op span for non-sampled traces
		return ctx, &Span{TraceID: traceID, Name: name}
	}

	// Get parent span ID from context
	parentSpanID := ""
	if existingSpanID := ctx.Value(SpanIDKey); existingSpanID != nil {
		parentSpanID = existingSpanID.(string)
	}

	// Create new span
	span := &Span{
		TraceID:      traceID,
		SpanID:       generateID(),
		ParentSpanID: parentSpanID,
		Name:         name,
		Kind:         kind,
		StartTime:    time.Now(),
		Status:       SpanStatusUnset,
		Attributes:   make(map[string]interface{}),
		Events:       make([]SpanEvent, 0),
	}

	// Add service attributes
	span.Attributes["service.name"] = t.serviceName
	span.Attributes["service.version"] = t.serviceVersion

	// Create new context with span information
	ctx = context.WithValue(ctx, TraceIDKey, span.TraceID)
	ctx = context.WithValue(ctx, SpanIDKey, span.SpanID)
	ctx = context.WithValue(ctx, SampledKey, true)

	return ctx, span
}

// generateID generates a random ID for traces and spans.
// In production, use a proper ID generator (e.g., UUID or W3C trace context format).
func generateID() string {
	const chars = "0123456789abcdef"
	id := make([]byte, 16)
	for i := range id {
		id[i] = chars[time.Now().UnixNano()%int64(len(chars))]
		time.Sleep(time.Nanosecond) // Ensure uniqueness
	}
	return string(id)
}

// SetAttribute adds an attribute to the span.
func (s *Span) SetAttribute(key string, value interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Attributes[key] = value
}

// SetAttributes adds multiple attributes to the span.
func (s *Span) SetAttributes(attrs map[string]interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for k, v := range attrs {
		s.Attributes[k] = v
	}
}

// AddEvent adds an event to the span.
func (s *Span) AddEvent(name string, attrs map[string]interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Events = append(s.Events, SpanEvent{
		Name:       name,
		Timestamp:  time.Now(),
		Attributes: attrs,
	})
}

// SetStatus sets the span status.
func (s *Span) SetStatus(status SpanStatus, message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Status = status
	s.StatusMsg = message
}

// RecordError records an error on the span.
func (s *Span) RecordError(err error) {
	if err == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Status = SpanStatusError
	s.StatusMsg = err.Error()
	s.Events = append(s.Events, SpanEvent{
		Name:      "exception",
		Timestamp: time.Now(),
		Attributes: map[string]interface{}{
			"exception.type":    fmt.Sprintf("%T", err),
			"exception.message": err.Error(),
		},
	})
}

// End marks the span as complete.
func (s *Span) End() {
	s.mu.Lock()
	s.EndTime = time.Now()
	s.mu.Unlock()
}

// Duration returns the span duration.
func (s *Span) Duration() time.Duration {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.EndTime.IsZero() {
		return time.Since(s.StartTime)
	}
	return s.EndTime.Sub(s.StartTime)
}

// Export exports all collected spans.
func (t *Tracer) Export() error {
	t.mu.Lock()
	spans := t.spans
	t.spans = make([]*Span, 0)
	t.mu.Unlock()

	if len(spans) == 0 {
		return nil
	}

	return t.exporter.Export(spans)
}

// RecordSpan adds a completed span to the tracer for export.
func (t *Tracer) RecordSpan(span *Span) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.spans = append(t.spans, span)
}

// =============================================================================
// SECTION 5: HTTP Middleware Combining All Three Pillars
// =============================================================================

// ResponseWriter wraps http.ResponseWriter to capture status code and bytes written.
// This is essential for accurate metrics collection.
type ResponseWriter struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
	wroteHeader  bool
}

// NewResponseWriter creates a new wrapped response writer.
func NewResponseWriter(w http.ResponseWriter) *ResponseWriter {
	return &ResponseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK, // Default to 200
	}
}

// WriteHeader captures the status code.
func (rw *ResponseWriter) WriteHeader(code int) {
	if !rw.wroteHeader {
		rw.statusCode = code
		rw.wroteHeader = true
		rw.ResponseWriter.WriteHeader(code)
	}
}

// Write captures bytes written and ensures header is written.
func (rw *ResponseWriter) Write(b []byte) (int, error) {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.bytesWritten += n
	return n, err
}

// StatusCode returns the captured status code.
func (rw *ResponseWriter) StatusCode() int {
	return rw.statusCode
}

// BytesWritten returns the total bytes written.
func (rw *ResponseWriter) BytesWritten() int {
	return rw.bytesWritten
}

// ObservabilityMiddleware combines metrics, logging, and tracing into a single
// HTTP middleware. This demonstrates the integration of all three pillars.
//
// The middleware:
// 1. Extracts or creates trace context
// 2. Starts a span for the request
// 3. Logs the request start
// 4. Tracks in-flight requests
// 5. Captures response status and duration
// 6. Records metrics (RED method)
// 7. Logs the request completion
// 8. Ends the span
//
// This pattern is used throughout Grafana's services for consistent observability.
type ObservabilityMiddleware struct {
	metrics *REDMetrics
	logger  *Logger
	tracer  *Tracer
}

// NewObservabilityMiddleware creates a new observability middleware.
func NewObservabilityMiddleware(serviceName string) *ObservabilityMiddleware {
	return &ObservabilityMiddleware{
		metrics: NewREDMetrics(serviceName, "http"),
		logger:  NewLogger(serviceName, WithCaller(true)),
		tracer: NewTracer(TracerConfig{
			ServiceName:    serviceName,
			ServiceVersion: "1.0.0",
			Sampler:        NewRatioSampler(1.0), // Sample all in development
		}),
	}
}

// WithMetrics sets custom metrics.
func (m *ObservabilityMiddleware) WithMetrics(metrics *REDMetrics) *ObservabilityMiddleware {
	m.metrics = metrics
	return m
}

// WithLogger sets a custom logger.
func (m *ObservabilityMiddleware) WithLogger(logger *Logger) *ObservabilityMiddleware {
	m.logger = logger
	return m
}

// WithTracer sets a custom tracer.
func (m *ObservabilityMiddleware) WithTracer(tracer *Tracer) *ObservabilityMiddleware {
	m.tracer = tracer
	return m
}

// Handler wraps an HTTP handler with observability instrumentation.
func (m *ObservabilityMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		endpoint := r.URL.Path
		method := r.Method

		// Extract trace context from headers (W3C Trace Context format)
		ctx := m.extractTraceContext(r)

		// Start a new span
		ctx, span := m.tracer.StartSpan(ctx, fmt.Sprintf("%s %s", method, endpoint), SpanKindServer)
		defer func() {
			span.End()
			m.tracer.RecordSpan(span)
		}()

		// Add HTTP attributes to span
		span.SetAttributes(map[string]interface{}{
			"http.method":      method,
			"http.url":         r.URL.String(),
			"http.target":      r.URL.Path,
			"http.host":        r.Host,
			"http.scheme":      r.URL.Scheme,
			"http.user_agent":  r.UserAgent(),
			"http.request_id":  r.Header.Get("X-Request-ID"),
			"net.peer.ip":      r.RemoteAddr,
		})

		// Log request start
		m.logger.Info(ctx, "request started", map[string]interface{}{
			"method":     method,
			"path":       endpoint,
			"remote_addr": r.RemoteAddr,
			"user_agent": r.UserAgent(),
		})

		// Track in-flight requests
		m.metrics.StartRequest(method, endpoint)
		defer m.metrics.EndRequest(method, endpoint)

		// Wrap response writer to capture status code
		wrapped := NewResponseWriter(w)

		// Inject trace context into response headers
		m.injectTraceContext(ctx, wrapped)

		// Call the next handler
		var handlerErr error
		func() {
			defer func() {
				if rec := recover(); rec != nil {
					handlerErr = fmt.Errorf("panic: %v", rec)
					span.RecordError(handlerErr)
					wrapped.WriteHeader(http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(wrapped, r.WithContext(ctx))
		}()

		// Calculate duration
		duration := time.Since(start)

		// Determine status string
		statusCode := wrapped.StatusCode()
		status := http.StatusText(statusCode)

		// Check for errors
		if statusCode >= 400 {
			if handlerErr == nil {
				handlerErr = fmt.Errorf("HTTP %d: %s", statusCode, status)
			}
			span.SetStatus(SpanStatusError, handlerErr.Error())
		} else {
			span.SetStatus(SpanStatusOK, "")
		}

		// Add response attributes to span
		span.SetAttributes(map[string]interface{}{
			"http.status_code":    statusCode,
			"http.response_size":  wrapped.BytesWritten(),
		})

		// Record metrics
		m.metrics.RecordRequest(method, endpoint, status, duration, handlerErr)

		// Log request completion
		logFields := map[string]interface{}{
			"method":        method,
			"path":          endpoint,
			"status":        statusCode,
			"duration_ms":   duration.Milliseconds(),
			"bytes_written": wrapped.BytesWritten(),
		}

		if handlerErr != nil {
			m.logger.Error(ctx, "request completed with error", handlerErr, logFields)
		} else {
			m.logger.Info(ctx, "request completed", logFields)
		}
	})
}

// extractTraceContext extracts trace context from incoming request headers.
// Supports W3C Trace Context format (traceparent header).
func (m *ObservabilityMiddleware) extractTraceContext(r *http.Request) context.Context {
	ctx := r.Context()

	// Try to extract W3C traceparent header
	// Format: version-trace_id-parent_id-flags
	// Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
	traceparent := r.Header.Get("traceparent")
	if traceparent != "" {
		parts := splitString(traceparent, '-')
		if len(parts) >= 4 {
			ctx = context.WithValue(ctx, TraceIDKey, parts[1])
			ctx = context.WithValue(ctx, ParentSpanIDKey, parts[2])
			// Check if sampled (last character of flags)
			if len(parts[3]) > 0 && parts[3][len(parts[3])-1] == '1' {
				ctx = context.WithValue(ctx, SampledKey, true)
			}
		}
	}

	// Also check for custom headers (common in some systems)
	if traceID := r.Header.Get("X-Trace-ID"); traceID != "" {
		ctx = context.WithValue(ctx, TraceIDKey, traceID)
	}
	if spanID := r.Header.Get("X-Span-ID"); spanID != "" {
		ctx = context.WithValue(ctx, ParentSpanIDKey, spanID)
	}

	return ctx
}

// injectTraceContext injects trace context into response headers.
func (m *ObservabilityMiddleware) injectTraceContext(ctx context.Context, w http.ResponseWriter) {
	if traceID := ctx.Value(TraceIDKey); traceID != nil {
		w.Header().Set("X-Trace-ID", traceID.(string))
	}
	if spanID := ctx.Value(SpanIDKey); spanID != nil {
		w.Header().Set("X-Span-ID", spanID.(string))
	}
}

// splitString splits a string by a separator.
func splitString(s string, sep byte) []string {
	var parts []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			parts = append(parts, s[start:i])
			start = i + 1
		}
	}
	parts = append(parts, s[start:])
	return parts
}

// =============================================================================
// SECTION 6: Error Handling Patterns
// =============================================================================

// ObservabilityError wraps an error with observability context.
// This allows errors to carry trace information for debugging.
type ObservabilityError struct {
	Err       error
	TraceID   string
	SpanID    string
	Operation string
	Timestamp time.Time
	Fields    map[string]interface{}
}

// Error implements the error interface.
func (e *ObservabilityError) Error() string {
	if e.TraceID != "" {
		return fmt.Sprintf("[trace_id=%s] %s: %v", e.TraceID, e.Operation, e.Err)
	}
	return fmt.Sprintf("%s: %v", e.Operation, e.Err)
}

// Unwrap returns the underlying error.
func (e *ObservabilityError) Unwrap() error {
	return e.Err
}

// WrapError wraps an error with observability context from the given context.
func WrapError(ctx context.Context, err error, operation string, fields map[string]interface{}) error {
	if err == nil {
		return nil
	}

	obsErr := &ObservabilityError{
		Err:       err,
		Operation: operation,
		Timestamp: time.Now(),
		Fields:    fields,
	}

	if traceID := ctx.Value(TraceIDKey); traceID != nil {
		obsErr.TraceID = traceID.(string)
	}
	if spanID := ctx.Value(SpanIDKey); spanID != nil {
		obsErr.SpanID = spanID.(string)
	}

	return obsErr
}

// ErrorHandler provides consistent error handling with observability.
type ErrorHandler struct {
	logger  *Logger
	metrics *Counter
}

// NewErrorHandler creates a new error handler.
func NewErrorHandler(logger *Logger, namespace string) *ErrorHandler {
	return &ErrorHandler{
		logger: logger,
		metrics: NewCounter(MetricOpts{
			Namespace: namespace,
			Name:      "errors_total",
			Help:      "Total number of errors",
			Labels:    []string{"operation", "error_type"},
		}),
	}
}

// Handle logs and records metrics for an error.
// Returns true if an error was handled, false if err was nil.
func (h *ErrorHandler) Handle(ctx context.Context, err error, operation string, fields map[string]interface{}) bool {
	if err == nil {
		return false
	}

	// Categorize the error
	errorType := categorizeError(err)

	// Record metric
	h.metrics.Inc(operation, errorType)

	// Merge fields
	logFields := make(map[string]interface{})
	for k, v := range fields {
		logFields[k] = v
	}
	logFields["operation"] = operation
	logFields["error_type"] = errorType

	// Log the error
	h.logger.Error(ctx, "operation failed", err, logFields)

	return true
}

// HandleWithRecovery wraps a function with panic recovery and error handling.
func (h *ErrorHandler) HandleWithRecovery(ctx context.Context, operation string, fn func() error) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic in %s: %v", operation, r)
			h.Handle(ctx, err, operation, map[string]interface{}{
				"panic": true,
			})
		}
	}()

	err = fn()
	if err != nil {
		h.Handle(ctx, err, operation, nil)
	}
	return err
}

// =============================================================================
// SECTION 7: Example Usage and Best Practices
// =============================================================================

// ExampleService demonstrates how to use all observability patterns together.
// This is a reference implementation showing best practices.
type ExampleService struct {
	metrics      *REDMetrics
	logger       *Logger
	tracer       *Tracer
	errorHandler *ErrorHandler
}

// NewExampleService creates a new example service with full observability.
func NewExampleService(serviceName string) *ExampleService {
	logger := NewLogger(serviceName,
		WithLevel(InfoLevel),
		WithCaller(true),
		WithFields(map[string]interface{}{
			"version": "1.0.0",
			"env":     "production",
		}),
	)

	return &ExampleService{
		metrics: NewREDMetrics(serviceName, "api"),
		logger:  logger,
		tracer: NewTracer(TracerConfig{
			ServiceName:    serviceName,
			ServiceVersion: "1.0.0",
			Sampler:        NewRatioSampler(0.1), // Sample 10% in production
		}),
		errorHandler: NewErrorHandler(logger, serviceName),
	}
}

// ProcessRequest demonstrates a fully instrumented request handler.
func (s *ExampleService) ProcessRequest(ctx context.Context, requestID string, data interface{}) error {
	// Start a span for this operation
	ctx, span := s.tracer.StartSpan(ctx, "ProcessRequest", SpanKindInternal)
	defer func() {
		span.End()
		s.tracer.RecordSpan(span)
	}()

	// Add request context to span
	span.SetAttributes(map[string]interface{}{
		"request.id":   requestID,
		"request.type": fmt.Sprintf("%T", data),
	})

	// Log the start of processing
	s.logger.Info(ctx, "processing request", map[string]interface{}{
		"request_id": requestID,
	})

	// Simulate processing with potential error
	err := s.doWork(ctx, data)
	if err != nil {
		// Record error on span
		span.RecordError(err)

		// Handle error with logging and metrics
		s.errorHandler.Handle(ctx, err, "ProcessRequest", map[string]interface{}{
			"request_id": requestID,
		})

		return WrapError(ctx, err, "ProcessRequest", map[string]interface{}{
			"request_id": requestID,
		})
	}

	// Log successful completion
	s.logger.Info(ctx, "request processed successfully", map[string]interface{}{
		"request_id": requestID,
	})

	return nil
}

// doWork simulates actual work being done.
func (s *ExampleService) doWork(ctx context.Context, data interface{}) error {
	// Create a child span for the work
	ctx, span := s.tracer.StartSpan(ctx, "doWork", SpanKindInternal)
	defer func() {
		span.End()
		s.tracer.RecordSpan(span)
	}()

	// Add an event to mark progress
	span.AddEvent("work_started", map[string]interface{}{
		"data_type": fmt.Sprintf("%T", data),
	})

	// Simulate work
	time.Sleep(10 * time.Millisecond)

	// Add completion event
	span.AddEvent("work_completed", nil)

	return nil
}

// Metrics returns the service metrics for external access.
func (s *ExampleService) Metrics() *REDMetrics {
	return s.metrics
}

// Logger returns the service logger for external access.
func (s *ExampleService) Logger() *Logger {
	return s.logger
}

// Tracer returns the service tracer for external access.
func (s *ExampleService) Tracer() *Tracer {
	return s.tracer
}

// =============================================================================
// SECTION 8: Health Check with Observability
// =============================================================================

// HealthStatus represents the health status of a component.
type HealthStatus string

const (
	// HealthStatusHealthy indicates the component is healthy
	HealthStatusHealthy HealthStatus = "healthy"
	// HealthStatusDegraded indicates the component is degraded but functional
	HealthStatusDegraded HealthStatus = "degraded"
	// HealthStatusUnhealthy indicates the component is unhealthy
	HealthStatusUnhealthy HealthStatus = "unhealthy"
)

// HealthCheck represents a health check result.
type HealthCheck struct {
	Name      string                 `json:"name"`
	Status    HealthStatus           `json:"status"`
	Message   string                 `json:"message,omitempty"`
	Duration  time.Duration          `json:"duration_ms"`
	Timestamp time.Time              `json:"timestamp"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

// HealthChecker provides health checking with observability.
type HealthChecker struct {
	checks  map[string]func(context.Context) HealthCheck
	logger  *Logger
	metrics *Gauge
	mu      sync.RWMutex
}

// NewHealthChecker creates a new health checker.
func NewHealthChecker(logger *Logger, namespace string) *HealthChecker {
	return &HealthChecker{
		checks: make(map[string]func(context.Context) HealthCheck),
		logger: logger,
		metrics: NewGauge(MetricOpts{
			Namespace: namespace,
			Name:      "health_status",
			Help:      "Health status of components (1=healthy, 0.5=degraded, 0=unhealthy)",
			Labels:    []string{"component"},
		}),
	}
}

// Register adds a health check.
func (h *HealthChecker) Register(name string, check func(context.Context) HealthCheck) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.checks[name] = check
}

// Check runs all health checks and returns the results.
func (h *HealthChecker) Check(ctx context.Context) []HealthCheck {
	h.mu.RLock()
	checks := make(map[string]func(context.Context) HealthCheck)
	for k, v := range h.checks {
		checks[k] = v
	}
	h.mu.RUnlock()

	results := make([]HealthCheck, 0, len(checks))
	for name, check := range checks {
		start := time.Now()
		result := check(ctx)
		result.Name = name
		result.Duration = time.Since(start)
		result.Timestamp = time.Now()

		// Update metrics
		var metricValue float64
		switch result.Status {
		case HealthStatusHealthy:
			metricValue = 1.0
		case HealthStatusDegraded:
			metricValue = 0.5
		case HealthStatusUnhealthy:
			metricValue = 0.0
		}
		h.metrics.Set(metricValue, name)

		// Log unhealthy checks
		if result.Status != HealthStatusHealthy {
			h.logger.Warn(ctx, "health check not healthy", map[string]interface{}{
				"component": name,
				"status":    string(result.Status),
				"message":   result.Message,
			})
		}

		results = append(results, result)
	}

	return results
}

// OverallStatus returns the overall health status based on all checks.
func (h *HealthChecker) OverallStatus(ctx context.Context) HealthStatus {
	results := h.Check(ctx)

	hasUnhealthy := false
	hasDegraded := false

	for _, result := range results {
		switch result.Status {
		case HealthStatusUnhealthy:
			hasUnhealthy = true
		case HealthStatusDegraded:
			hasDegraded = true
		}
	}

	if hasUnhealthy {
		return HealthStatusUnhealthy
	}
	if hasDegraded {
		return HealthStatusDegraded
	}
	return HealthStatusHealthy
}
