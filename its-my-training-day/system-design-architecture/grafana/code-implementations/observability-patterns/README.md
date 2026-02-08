# Observability Patterns Examples

This directory contains practical code implementations demonstrating observability patterns essential for Grafana roles, including instrumentation, alerting, and monitoring best practices.

## Purpose

These examples provide hands-on implementations of:

- **Instrumentation Patterns**: Metrics, logging, and tracing instrumentation for Go applications
- **Alerting Configurations**: Prometheus alerting rules and Grafana alert examples
- **Monitoring Best Practices**: Patterns for building observable systems aligned with Grafana's LGTM stack

The code is designed to help candidates:
1. Understand how to instrument applications for observability
2. Practice implementing the three pillars of observability (metrics, logs, traces)
3. Build intuition for alerting strategies and SLO-based monitoring
4. Prepare for technical discussions about observability architecture

## Prerequisites

### Required
- **Go 1.21+** - [Download and install Go](https://go.dev/doc/install)
- **Docker** - For running Prometheus, Grafana, and other observability tools locally
- Basic understanding of Go syntax and HTTP servers
- Familiarity with YAML configuration files

### Recommended
- Understanding of the [LGTM Stack](../../shared-concepts/lgtm-stack.md)
- Familiarity with [Observability Principles](../../shared-concepts/observability-principles.md)
- Basic knowledge of [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Verify Installation

```bash
# Check Go version
go version
# Expected output: go version go1.21.x (or higher)

# Check Docker
docker --version
# Expected output: Docker version 24.x.x (or higher)
```

## Directory Structure

```
observability-patterns/
├── README.md                    # This file
├── instrumentation/             # Application instrumentation examples
│   ├── metrics/                 # Prometheus metrics instrumentation
│   │   ├── main.go              # HTTP server with metrics
│   │   └── metrics.go           # Custom metrics definitions
│   ├── logging/                 # Structured logging patterns
│   │   ├── main.go              # Application with structured logging
│   │   └── logger.go            # Logger configuration
│   └── tracing/                 # Distributed tracing examples
│       ├── main.go              # Service with tracing
│       └── tracing.go           # Trace context propagation
├── alerting/                    # Alerting configuration examples
│   ├── prometheus/              # Prometheus alerting rules
│   │   ├── alerts.yaml          # Alert rule definitions
│   │   └── recording-rules.yaml # Recording rules for efficiency
│   └── grafana/                 # Grafana alerting examples
│       └── alerts.json          # Grafana alert definitions
└── docker-compose.yaml          # Local observability stack setup
```

## Patterns Overview

### Instrumentation Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **RED Metrics** | Rate, Errors, Duration for services | Service-level monitoring |
| **USE Metrics** | Utilization, Saturation, Errors for resources | Resource monitoring |
| **Structured Logging** | JSON-formatted logs with context | Log aggregation with Loki |
| **Trace Context Propagation** | Distributed trace correlation | Request flow analysis with Tempo |
| **Custom Metrics** | Application-specific business metrics | Domain-specific monitoring |

### Alerting Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **SLO-Based Alerts** | Alerts based on error budgets | Service reliability |
| **Multi-Window Alerts** | Different thresholds for different windows | Reducing alert fatigue |
| **Recording Rules** | Pre-computed metrics for efficiency | Dashboard performance |
| **Alert Routing** | Severity-based notification routing | Incident management |

## Setup and Running

### Clone and Navigate

```bash
# Navigate to the examples directory
cd grafana/code-implementations/observability-patterns
```

### Start Local Observability Stack

```bash
# Start Prometheus, Grafana, Loki, and Tempo
docker-compose up -d

# Verify services are running
docker-compose ps

# Access services:
# - Grafana: http://localhost:3000 (admin/admin)
# - Prometheus: http://localhost:9090
# - Loki: http://localhost:3100
# - Tempo: http://localhost:3200
```

### Run Instrumentation Examples

```bash
# Initialize Go module (if not already done)
go mod init observability-patterns
go mod tidy

# Run metrics example
go run instrumentation/metrics/main.go

# Run logging example
go run instrumentation/logging/main.go

# Run tracing example
go run instrumentation/tracing/main.go
```

### Run Tests

```bash
# Run all tests
go test ./...

# Run tests with verbose output
go test -v ./...

# Run tests with coverage
go test -cover ./...
```

## Usage Examples

### Metrics Instrumentation (RED Method)

```go
package main

import (
    "net/http"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    // Rate: Request count
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    // Errors: Error count (subset of requests)
    httpRequestErrors = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_request_errors_total",
            Help: "Total number of HTTP request errors",
        },
        []string{"method", "endpoint", "error_type"},
    )

    // Duration: Request latency
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal, httpRequestErrors, httpRequestDuration)
}

func instrumentHandler(handler http.HandlerFunc, endpoint string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Wrap response writer to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        
        handler(wrapped, r)
        
        duration := time.Since(start).Seconds()
        status := http.StatusText(wrapped.statusCode)
        
        httpRequestsTotal.WithLabelValues(r.Method, endpoint, status).Inc()
        httpRequestDuration.WithLabelValues(r.Method, endpoint).Observe(duration)
        
        if wrapped.statusCode >= 400 {
            httpRequestErrors.WithLabelValues(r.Method, endpoint, status).Inc()
        }
    }
}

func main() {
    http.Handle("/metrics", promhttp.Handler())
    http.HandleFunc("/api/users", instrumentHandler(usersHandler, "/api/users"))
    http.ListenAndServe(":8080", nil)
}
```

### Structured Logging (Loki-Compatible)

```go
package main

import (
    "context"
    "encoding/json"
    "os"
    "time"
)

type LogEntry struct {
    Timestamp string                 `json:"timestamp"`
    Level     string                 `json:"level"`
    Message   string                 `json:"message"`
    Service   string                 `json:"service"`
    TraceID   string                 `json:"trace_id,omitempty"`
    SpanID    string                 `json:"span_id,omitempty"`
    Fields    map[string]interface{} `json:"fields,omitempty"`
}

type Logger struct {
    service string
    encoder *json.Encoder
}

func NewLogger(service string) *Logger {
    return &Logger{
        service: service,
        encoder: json.NewEncoder(os.Stdout),
    }
}

func (l *Logger) Info(ctx context.Context, msg string, fields map[string]interface{}) {
    l.log(ctx, "info", msg, fields)
}

func (l *Logger) Error(ctx context.Context, msg string, err error, fields map[string]interface{}) {
    if fields == nil {
        fields = make(map[string]interface{})
    }
    fields["error"] = err.Error()
    l.log(ctx, "error", msg, fields)
}

func (l *Logger) log(ctx context.Context, level, msg string, fields map[string]interface{}) {
    entry := LogEntry{
        Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
        Level:     level,
        Message:   msg,
        Service:   l.service,
        Fields:    fields,
    }
    
    // Extract trace context if available
    if traceID := ctx.Value("trace_id"); traceID != nil {
        entry.TraceID = traceID.(string)
    }
    if spanID := ctx.Value("span_id"); spanID != nil {
        entry.SpanID = spanID.(string)
    }
    
    l.encoder.Encode(entry)
}

func main() {
    logger := NewLogger("user-service")
    ctx := context.Background()
    
    logger.Info(ctx, "Server starting", map[string]interface{}{
        "port": 8080,
        "env":  "production",
    })
}
```

### Distributed Tracing (OpenTelemetry)

```go
package main

import (
    "context"
    "net/http"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
    "go.opentelemetry.io/otel/trace"
)

var tracer trace.Tracer

func initTracer(ctx context.Context, serviceName string) (*sdktrace.TracerProvider, error) {
    // Create OTLP exporter for Tempo
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // Create resource with service information
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName(serviceName),
            semconv.ServiceVersion("1.0.0"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // Create trace provider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
    )

    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))

    tracer = tp.Tracer(serviceName)
    return tp, nil
}

func tracingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract trace context from incoming request
        ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))
        
        // Start a new span
        ctx, span := tracer.Start(ctx, r.URL.Path,
            trace.WithAttributes(
                attribute.String("http.method", r.Method),
                attribute.String("http.url", r.URL.String()),
            ),
        )
        defer span.End()
        
        // Pass context to handler
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func main() {
    ctx := context.Background()
    tp, _ := initTracer(ctx, "api-gateway")
    defer tp.Shutdown(ctx)
    
    mux := http.NewServeMux()
    mux.HandleFunc("/api/users", usersHandler)
    
    http.ListenAndServe(":8080", tracingMiddleware(mux))
}
```

### Prometheus Alerting Rules

```yaml
# alerting/prometheus/alerts.yaml
groups:
  - name: service-slos
    rules:
      # SLO: 99.9% availability
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.001
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (SLO: 0.1%)"

      # SLO: p99 latency < 500ms
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p99 latency detected"
          description: "p99 latency is {{ $value | humanizeDuration }} (SLO: 500ms)"

      # Multi-window alert for error budget burn
      - alert: ErrorBudgetBurn
        expr: |
          (
            # 1-hour burn rate
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          ) > 14.4 * 0.001
          and
          (
            # 5-minute burn rate
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 14.4 * 0.001
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error budget burning too fast"
          description: "At current rate, monthly error budget will be exhausted"

  - name: resource-alerts
    rules:
      # USE method: Utilization
      - alert: HighCPUUtilization
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU utilization on {{ $labels.instance }}"
          description: "CPU utilization is {{ $value }}%"

      # USE method: Saturation
      - alert: HighMemorySaturation
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
          /
          node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory saturation on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}%"
```

## Testing

All implementations include comprehensive tests demonstrating:

- **Unit Tests**: Verify correct metric registration and logging output
- **Integration Tests**: Verify end-to-end observability pipeline
- **Benchmark Tests**: Measure instrumentation overhead

```bash
# Run all tests
go test ./...

# Run tests with race detector
go test -race ./...

# Run benchmarks to measure instrumentation overhead
go test -bench=. ./instrumentation/...
```

## Related Study Materials

- [Observability Principles](../../shared-concepts/observability-principles.md) - Three pillars and instrumentation patterns
- [LGTM Stack](../../shared-concepts/lgtm-stack.md) - Loki, Grafana, Tempo, Mimir integration
- [Associate Observability Architect Guide](../../study-guides/03-associate-observability-architect/) - Observability fundamentals
- [Senior Observability Architect Guide](../../study-guides/04-observability-architect-senior/) - Enterprise observability strategies

## Best Practices Demonstrated

### Metrics Best Practices
- Use consistent naming conventions (snake_case, units in name)
- Include appropriate labels for cardinality control
- Implement RED (Rate, Errors, Duration) for services
- Implement USE (Utilization, Saturation, Errors) for resources

### Logging Best Practices
- Use structured JSON logging for Loki compatibility
- Include trace context for correlation
- Use appropriate log levels
- Avoid high-cardinality fields in indexed labels

### Tracing Best Practices
- Propagate trace context across service boundaries
- Add meaningful span attributes
- Use semantic conventions for consistency
- Sample appropriately for high-volume services

### Alerting Best Practices
- Base alerts on SLOs and error budgets
- Use multi-window alerting to reduce noise
- Include actionable runbook links
- Route alerts by severity

## External Documentation

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [OpenTelemetry Go Documentation](https://opentelemetry.io/docs/instrumentation/go/)
- [Grafana Alerting Documentation](https://grafana.com/docs/grafana/latest/alerting/)
- [Loki LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [Tempo Tracing Documentation](https://grafana.com/docs/tempo/latest/)

## License

These examples are provided for educational purposes as part of the Grafana Interview Preparation Study Guide.
