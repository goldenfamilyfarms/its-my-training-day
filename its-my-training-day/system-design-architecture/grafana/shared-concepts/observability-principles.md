# Observability Principles: A Comprehensive Guide

This document provides comprehensive coverage of observability principles, including the three pillars (metrics, logs, traces), instrumentation patterns, SLOs/SLIs/SLAs, alerting strategies, and advanced concepts like cardinality management and sampling. Understanding these principles is essential for all Grafana-related roles.

## Table of Contents

1. [Observability vs Monitoring](#observability-vs-monitoring)
2. [The Three Pillars of Observability](#the-three-pillars-of-observability)
3. [Pillar Relationships and Correlation](#pillar-relationships-and-correlation)
4. [Instrumentation Patterns](#instrumentation-patterns)
5. [SLOs, SLIs, and SLAs](#slos-slis-and-slas)
6. [Error Budgets](#error-budgets)
7. [Alerting Strategies](#alerting-strategies)
8. [Cardinality Management](#cardinality-management)
9. [Sampling Strategies](#sampling-strategies)
10. [Best Practices](#best-practices)

---

## Observability vs Monitoring

Understanding the distinction between observability and monitoring is fundamental to building effective systems.

### Definitions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING vs OBSERVABILITY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MONITORING                              OBSERVABILITY                           │
│  ──────────                              ─────────────                           │
│  "Is the system working?"                "Why is the system behaving this way?"  │
│                                                                                  │
│  ┌─────────────────────────┐            ┌─────────────────────────┐             │
│  │ • Predefined dashboards │            │ • Ad-hoc exploration    │             │
│  │ • Known failure modes   │            │ • Unknown-unknowns      │             │
│  │ • Threshold-based alerts│            │ • Correlation & context │             │
│  │ • Binary health checks  │            │ • Deep system insight   │             │
│  │ • Reactive approach     │            │ • Proactive debugging   │             │
│  └─────────────────────────┘            └─────────────────────────┘             │
│                                                                                  │
│  Example Questions:                      Example Questions:                      │
│  • Is CPU > 80%?                        • Why did latency spike at 3pm?         │
│  • Is the service up?                   • What changed between deployments?     │
│  • Are error rates normal?              • Which users are affected by this bug? │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Monitoring | Observability |
|--------|------------|---------------|
| **Focus** | Known problems | Unknown problems |
| **Approach** | Reactive | Proactive |
| **Questions** | Predefined | Ad-hoc |
| **Data** | Aggregated metrics | High-cardinality telemetry |
| **Analysis** | Dashboard-driven | Exploration-driven |
| **Failure Modes** | Anticipated | Emergent |

### The Observability Maturity Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY MATURITY LEVELS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Level 4: Predictive                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • ML-based anomaly detection  • Capacity forecasting  • Auto-remediation│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          ▲                                      │
│  Level 3: Proactive                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • SLO-based alerting  • Error budgets  • Distributed tracing            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          ▲                                      │
│  Level 2: Reactive                       │                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Centralized logging  • Basic metrics  • Threshold alerts              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          ▲                                      │
│  Level 1: Minimal                        │                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Application logs on disk  • Manual health checks  • No correlation    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Three Pillars of Observability

The three pillars—metrics, logs, and traces—provide complementary views into system behavior. Each pillar has unique strengths and use cases.


### Overview of the Three Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       THE THREE PILLARS OF OBSERVABILITY                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌─────────────┐                                    │
│                              │   System    │                                    │
│                              │  Behavior   │                                    │
│                              └──────┬──────┘                                    │
│                                     │                                           │
│              ┌──────────────────────┼──────────────────────┐                   │
│              │                      │                      │                   │
│              ▼                      ▼                      ▼                   │
│       ┌─────────────┐        ┌─────────────┐        ┌─────────────┐           │
│       │   METRICS   │        │    LOGS     │        │   TRACES    │           │
│       │             │        │             │        │             │           │
│       │  "What is   │        │  "What      │        │  "How does  │           │
│       │  happening?"│        │  happened?" │        │  it flow?"  │           │
│       │             │        │             │        │             │           │
│       │ • Numeric   │        │ • Text      │        │ • Spans     │           │
│       │ • Aggregated│        │ • Detailed  │        │ • Context   │           │
│       │ • Time-based│        │ • Events    │        │ • Causality │           │
│       └─────────────┘        └─────────────┘        └─────────────┘           │
│                                                                                  │
│       Best for:              Best for:              Best for:                   │
│       • Alerting             • Debugging            • Request flow              │
│       • Trends               • Audit trails         • Latency analysis          │
│       • Capacity             • Error details        • Dependencies              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Metrics

Metrics are numeric measurements collected at regular intervals. They are highly efficient for storage and querying, making them ideal for alerting and trend analysis.

#### Metric Types

| Type | Description | Example | Use Case |
|------|-------------|---------|----------|
| **Counter** | Monotonically increasing value | `http_requests_total` | Request counts, errors |
| **Gauge** | Value that can go up or down | `temperature_celsius` | CPU usage, queue depth |
| **Histogram** | Distribution of values in buckets | `request_duration_seconds` | Latency percentiles |
| **Summary** | Pre-calculated quantiles | `request_duration_quantile` | Client-side percentiles |

#### Metric Anatomy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           METRIC STRUCTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  http_requests_total{method="GET", status="200", service="api"} 1234567         │
│  ├──────────────────┤├─────────────────────────────────────────┤├──────┤        │
│         │                              │                           │             │
│    Metric Name                     Labels                       Value            │
│                                                                                  │
│  Components:                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Metric Name: Describes what is being measured                           │   │
│  │              Convention: <namespace>_<name>_<unit>                      │   │
│  │              Example: http_request_duration_seconds                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Labels: Key-value pairs providing dimensions                            │   │
│  │         Enable filtering, grouping, and aggregation                     │   │
│  │         High cardinality labels can cause performance issues            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Value: The numeric measurement at a point in time                       │   │
│  │        Stored with timestamp for time-series analysis                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Metric Best Practices

```go
// Good: Meaningful metric names with appropriate labels
var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "status", "handler"},
    )
    
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request latency in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "handler"},
    )
)

// Bad: High cardinality labels (user_id, request_id)
// This creates millions of time series!
var badMetric = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "requests_by_user",
    },
    []string{"user_id", "request_id"}, // DON'T DO THIS
)
```

### Pillar 2: Logs

Logs are timestamped, immutable records of discrete events. They provide detailed context about what happened in a system.

#### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| **TRACE** | Fine-grained debugging | Function entry/exit |
| **DEBUG** | Diagnostic information | Variable values, state |
| **INFO** | Normal operations | Request processed, job completed |
| **WARN** | Potential issues | Retry attempted, deprecated API |
| **ERROR** | Failures requiring attention | Request failed, exception caught |
| **FATAL** | Critical failures | Application crash, data corruption |

#### Structured Logging

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    UNSTRUCTURED vs STRUCTURED LOGS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  UNSTRUCTURED (Bad):                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 2024-01-15 10:23:45 ERROR Failed to process order 12345 for user john   │   │
│  │ because payment gateway returned timeout after 30 seconds               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Problems: Hard to parse, inconsistent format, difficult to query              │
│                                                                                  │
│  STRUCTURED (Good):                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ {                                                                        │   │
│  │   "timestamp": "2024-01-15T10:23:45.123Z",                              │   │
│  │   "level": "error",                                                      │   │
│  │   "message": "Failed to process order",                                  │   │
│  │   "order_id": "12345",                                                   │   │
│  │   "user_id": "john",                                                     │   │
│  │   "error_type": "payment_timeout",                                       │   │
│  │   "timeout_seconds": 30,                                                 │   │
│  │   "trace_id": "abc123def456",                                           │   │
│  │   "service": "order-processor"                                          │   │
│  │ }                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Benefits: Machine-parseable, queryable, correlatable                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Structured Logging Example (Go)

```go
import (
    "go.uber.org/zap"
)

func processOrder(ctx context.Context, orderID string) error {
    logger := zap.L().With(
        zap.String("order_id", orderID),
        zap.String("trace_id", getTraceID(ctx)),
    )
    
    logger.Info("Processing order started")
    
    if err := validateOrder(orderID); err != nil {
        logger.Error("Order validation failed",
            zap.Error(err),
            zap.String("validation_stage", "payment"),
        )
        return err
    }
    
    logger.Info("Order processed successfully",
        zap.Duration("processing_time", time.Since(start)),
    )
    return nil
}
```

### Pillar 3: Traces

Traces track the journey of a request through a distributed system, showing the causal relationship between services.

#### Trace Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRACE ANATOMY                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TRACE: A complete request journey (identified by Trace ID)                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736                              │   │
│  │                                                                          │   │
│  │ SPAN: A single unit of work within a trace                              │   │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Span ID: a2fb4a1d1a96d312                                           │ │   │
│  │ │ Parent Span ID: (none - root span)                                  │ │   │
│  │ │ Operation: HTTP GET /api/checkout                                   │ │   │
│  │ │ Service: api-gateway                                                │ │   │
│  │ │ Start Time: 2024-01-15T10:23:45.000Z                               │ │   │
│  │ │ Duration: 250ms                                                     │ │   │
│  │ │ Status: OK                                                          │ │   │
│  │ │                                                                      │ │   │
│  │ │ Attributes (Tags):                                                  │ │   │
│  │ │   http.method: GET                                                  │ │   │
│  │ │   http.url: /api/checkout                                           │ │   │
│  │ │   http.status_code: 200                                             │ │   │
│  │ │   user.id: user-123                                                 │ │   │
│  │ │                                                                      │ │   │
│  │ │ Events (Logs within span):                                          │ │   │
│  │ │   10:23:45.050 - "Validating cart items"                           │ │   │
│  │ │   10:23:45.100 - "Cart validation complete"                        │ │   │
│  │ └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │   └──► Child Span: inventory-check (50ms)                               │   │
│  │   └──► Child Span: payment-process (150ms)                              │   │
│  │            └──► Child Span: fraud-check (30ms)                          │   │
│  │            └──► Child Span: charge-card (100ms)                         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Context Propagation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT PROPAGATION                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Service A                    Service B                    Service C            │
│  ┌─────────┐                 ┌─────────┐                 ┌─────────┐           │
│  │ Create  │  HTTP Headers   │ Extract │  HTTP Headers   │ Extract │           │
│  │ Span    │ ──────────────► │ Context │ ──────────────► │ Context │           │
│  │         │                 │ Create  │                 │ Create  │           │
│  │         │                 │ Child   │                 │ Child   │           │
│  └─────────┘                 └─────────┘                 └─────────┘           │
│                                                                                  │
│  HTTP Headers for W3C Trace Context:                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-a2fb4a1d1a96d312-01   │   │
│  │              ├─┤├──────────────────────────────────┤├──────────────────┤├┤  │
│  │            version        trace-id                   parent-id      flags   │
│  │                                                                              │
│  │ tracestate: vendor1=value1,vendor2=value2                                   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

## Pillar Relationships and Correlation

The true power of observability comes from correlating data across all three pillars.

### Correlation Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TELEMETRY CORRELATION PATTERNS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌─────────────────┐                                     │
│                         │    METRICS      │                                     │
│                         │  (Aggregated)   │                                     │
│                         └────────┬────────┘                                     │
│                                  │                                              │
│                           Exemplars                                             │
│                      (Link to specific traces)                                  │
│                                  │                                              │
│                                  ▼                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │      LOGS       │◄───│     TRACES      │───►│    PROFILES     │            │
│  │   (Detailed)    │    │   (Causality)   │    │  (Performance)  │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                      │                      │                      │
│           │              Trace ID                       │                      │
│           └──────────────────────┴──────────────────────┘                      │
│                                                                                  │
│  Correlation Keys:                                                              │
│  • Trace ID: Links logs, traces, and profiles for a single request             │
│  • Span ID: Links specific log entries to trace spans                          │
│  • Exemplars: Links metric data points to representative traces                │
│  • Labels: Consistent labeling enables cross-pillar filtering                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Correlation Workflow Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DEBUGGING WORKFLOW WITH CORRELATION                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. ALERT FIRES                                                                 │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Alert: "High error rate on checkout service"                        │    │
│     │ Metric: http_requests_total{status="500"} > threshold               │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  2. EXAMINE METRICS                                                             │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Dashboard shows spike in 500 errors starting at 14:32               │    │
│     │ Click on exemplar to see a specific failing request                 │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  3. FOLLOW TRACE                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Trace shows: api-gateway → checkout → payment-service (ERROR)       │    │
│     │ Payment service span shows 5s timeout                               │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  4. EXAMINE LOGS                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Filter logs by trace_id from the failing trace                      │    │
│     │ Log: "Connection pool exhausted, waiting for available connection"  │    │
│     │ Root cause: Database connection pool too small for traffic spike    │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Implementing Correlation

```go
// Example: Adding trace context to logs
import (
    "context"
    "go.opentelemetry.io/otel/trace"
    "go.uber.org/zap"
)

func LogWithTrace(ctx context.Context, logger *zap.Logger, msg string, fields ...zap.Field) {
    span := trace.SpanFromContext(ctx)
    if span.SpanContext().IsValid() {
        fields = append(fields,
            zap.String("trace_id", span.SpanContext().TraceID().String()),
            zap.String("span_id", span.SpanContext().SpanID().String()),
        )
    }
    logger.Info(msg, fields...)
}

// Example: Recording exemplars with metrics
func recordRequestMetric(ctx context.Context, duration float64, status int) {
    span := trace.SpanFromContext(ctx)
    
    // Record histogram with exemplar
    httpRequestDuration.WithLabelValues("GET", "/api/checkout").
        (prometheus.ExemplarObserver).ObserveWithExemplar(
            duration,
            prometheus.Labels{
                "trace_id": span.SpanContext().TraceID().String(),
            },
        )
}
```

### When to Use Each Pillar

| Scenario | Primary Pillar | Supporting Pillars |
|----------|---------------|-------------------|
| "Is the system healthy?" | Metrics | - |
| "Why is latency high?" | Traces | Metrics (identify), Logs (details) |
| "What caused this error?" | Logs | Traces (context) |
| "Which service is slow?" | Traces | Metrics (quantify) |
| "What's the error rate trend?" | Metrics | Logs (examples) |
| "What happened at 3pm?" | Logs | Metrics (correlation) |

---

## Instrumentation Patterns

Instrumentation is the process of adding observability to your applications. There are two main approaches: automatic and manual.

### Automatic vs Manual Instrumentation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    INSTRUMENTATION APPROACHES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AUTOMATIC INSTRUMENTATION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Agent-based or library-based                                          │   │
│  │ • Zero or minimal code changes                                          │   │
│  │ • Covers common frameworks (HTTP, gRPC, databases)                      │   │
│  │ • Good for getting started quickly                                      │   │
│  │                                                                          │   │
│  │ Pros:                           Cons:                                   │   │
│  │ ✓ Quick to implement            ✗ Limited customization                 │   │
│  │ ✓ Consistent coverage           ✗ May miss business logic               │   │
│  │ ✓ Low maintenance               ✗ Potential performance overhead        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  MANUAL INSTRUMENTATION                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Code-level integration                                                │   │
│  │ • Full control over what's captured                                     │   │
│  │ • Custom business metrics and spans                                     │   │
│  │ • Required for domain-specific observability                            │   │
│  │                                                                          │   │
│  │ Pros:                           Cons:                                   │   │
│  │ ✓ Full customization            ✗ More development effort               │   │
│  │ ✓ Business context              ✗ Requires maintenance                  │   │
│  │ ✓ Precise control               ✗ Risk of inconsistency                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  RECOMMENDED: Combine both approaches                                           │
│  • Use automatic for infrastructure (HTTP, DB, messaging)                       │
│  • Use manual for business logic and custom metrics                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### OpenTelemetry Overview

OpenTelemetry (OTel) is the industry standard for instrumentation, providing vendor-neutral APIs and SDKs.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OPENTELEMETRY ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         APPLICATION                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │   │
│  │  │   OTel API  │  │   OTel SDK  │  │ Auto-Instr. │                     │   │
│  │  │  (Tracing)  │  │ (Processing)│  │  Libraries  │                     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │   │
│  │         └────────────────┴────────────────┘                             │   │
│  │                          │                                              │   │
│  │                          ▼                                              │   │
│  │                   ┌─────────────┐                                       │   │
│  │                   │  Exporters  │                                       │   │
│  │                   │ OTLP/Jaeger │                                       │   │
│  │                   └──────┬──────┘                                       │   │
│  └──────────────────────────┼──────────────────────────────────────────────┘   │
│                             │                                                   │
│                             ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    OTEL COLLECTOR (Optional)                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │   │
│  │  │  Receivers  │─▶│ Processors  │─▶│  Exporters  │                     │   │
│  │  │ OTLP/Jaeger │  │ Batch/Filter│  │ OTLP/Vendor │                     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                             │                                                   │
│              ┌──────────────┼──────────────┐                                   │
│              ▼              ▼              ▼                                   │
│       ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │
│       │    Tempo    │ │    Mimir    │ │    Loki     │                         │
│       │  (Traces)   │ │  (Metrics)  │ │   (Logs)    │                         │
│       └─────────────┘ └─────────────┘ └─────────────┘                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### OpenTelemetry Go Example

```go
package main

import (
    "context"
    "log"
    "net/http"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
    "go.opentelemetry.io/otel/trace"
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

var tracer trace.Tracer

func initTracer() func() {
    ctx := context.Background()
    
    // Create OTLP exporter
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Create resource with service information
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName("my-service"),
            semconv.ServiceVersion("1.0.0"),
            attribute.String("environment", "production"),
        ),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Create trace provider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
    )
    
    otel.SetTracerProvider(tp)
    tracer = tp.Tracer("my-service")
    
    return func() {
        tp.Shutdown(ctx)
    }
}

// Manual instrumentation example
func processOrder(ctx context.Context, orderID string) error {
    // Create a span for this operation
    ctx, span := tracer.Start(ctx, "processOrder",
        trace.WithAttributes(
            attribute.String("order.id", orderID),
        ),
    )
    defer span.End()
    
    // Add events during processing
    span.AddEvent("Validating order")
    if err := validateOrder(ctx, orderID); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return err
    }
    
    span.AddEvent("Processing payment")
    if err := processPayment(ctx, orderID); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return err
    }
    
    span.SetStatus(codes.Ok, "Order processed successfully")
    return nil
}

func main() {
    cleanup := initTracer()
    defer cleanup()
    
    // Automatic HTTP instrumentation
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        orderID := r.URL.Query().Get("order_id")
        
        if err := processOrder(ctx, orderID); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        
        w.WriteHeader(http.StatusOK)
    })
    
    // Wrap handler with OTel instrumentation
    wrappedHandler := otelhttp.NewHandler(handler, "checkout")
    
    http.ListenAndServe(":8080", wrappedHandler)
}
```

### RED Method (Request-oriented)

The RED method focuses on request-driven services:

| Metric | Description | Example |
|--------|-------------|---------|
| **R**ate | Requests per second | `rate(http_requests_total[5m])` |
| **E**rrors | Failed requests per second | `rate(http_requests_total{status=~"5.."}[5m])` |
| **D**uration | Request latency distribution | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` |

### USE Method (Resource-oriented)

The USE method focuses on system resources:

| Metric | Description | Example |
|--------|-------------|---------|
| **U**tilization | % time resource is busy | `avg(rate(node_cpu_seconds_total{mode!="idle"}[5m]))` |
| **S**aturation | Queue depth, waiting work | `node_load1 / count(node_cpu_seconds_total{mode="idle"})` |
| **E**rrors | Error events | `rate(node_disk_io_time_weighted_seconds_total[5m])` |

### Four Golden Signals

Google's SRE book defines four golden signals for monitoring:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FOUR GOLDEN SIGNALS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. LATENCY                                                              │   │
│  │     Time to service a request                                           │   │
│  │     • Distinguish successful vs failed request latency                  │   │
│  │     • Track percentiles (p50, p90, p99), not just averages              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  2. TRAFFIC                                                              │   │
│  │     Demand on the system                                                │   │
│  │     • HTTP requests per second                                          │   │
│  │     • Transactions per second                                           │   │
│  │     • Messages processed per second                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  3. ERRORS                                                               │   │
│  │     Rate of failed requests                                             │   │
│  │     • Explicit errors (HTTP 5xx)                                        │   │
│  │     • Implicit errors (wrong content, slow responses)                   │   │
│  │     • Policy violations (SLO breaches)                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  4. SATURATION                                                           │   │
│  │     How "full" the service is                                           │   │
│  │     • Memory utilization                                                │   │
│  │     • CPU utilization                                                   │   │
│  │     • Queue depths                                                      │   │
│  │     • Thread pool usage                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## SLOs, SLIs, and SLAs

Service Level concepts are fundamental to reliability engineering and form the foundation of modern observability practices.

### Definitions and Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLI → SLO → SLA HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SLI (Service Level Indicator)                                          │   │
│  │  ─────────────────────────────                                          │   │
│  │  A quantitative measure of service behavior                             │   │
│  │                                                                          │   │
│  │  Examples:                                                               │   │
│  │  • Request latency (p99 < 200ms)                                        │   │
│  │  • Error rate (% of requests returning 5xx)                             │   │
│  │  • Availability (% of successful health checks)                         │   │
│  │  • Throughput (requests per second)                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SLO (Service Level Objective)                                          │   │
│  │  ─────────────────────────────                                          │   │
│  │  A target value or range for an SLI                                     │   │
│  │                                                                          │   │
│  │  Examples:                                                               │   │
│  │  • 99.9% of requests complete in < 200ms                                │   │
│  │  • Error rate < 0.1% over 30 days                                       │   │
│  │  • 99.95% availability per month                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SLA (Service Level Agreement)                                          │   │
│  │  ─────────────────────────────                                          │   │
│  │  A contract with consequences for meeting/missing SLOs                  │   │
│  │                                                                          │   │
│  │  Examples:                                                               │   │
│  │  • 99.9% uptime or customer receives service credits                    │   │
│  │  • Response time guarantees with financial penalties                    │   │
│  │  • Support response time commitments                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Key Insight: SLOs should be stricter than SLAs to provide a safety buffer     │
│               SLA = 99.9% → SLO = 99.95% → Internal target = 99.99%            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Common SLI Categories

| Category | SLI Type | Measurement | Good For |
|----------|----------|-------------|----------|
| **Availability** | Success rate | Successful requests / Total requests | APIs, services |
| **Latency** | Response time | Time to first byte, total duration | User-facing services |
| **Throughput** | Request rate | Requests processed per second | Batch systems |
| **Quality** | Correctness | Valid responses / Total responses | Data pipelines |
| **Freshness** | Data age | Time since last update | Real-time systems |
| **Coverage** | Completeness | Items processed / Items expected | ETL jobs |

### SLI Specification Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLI SPECIFICATION TEMPLATE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SLI Name: API Request Latency                                                  │
│  ─────────────────────────────                                                  │
│                                                                                  │
│  Description: Time from request received to response sent                       │
│                                                                                  │
│  Measurement Point: Load balancer access logs                                   │
│                                                                                  │
│  Good Events: Requests completing in < 200ms                                    │
│  Valid Events: All non-health-check requests                                    │
│                                                                                  │
│  Formula: count(latency < 200ms) / count(all requests) * 100                   │
│                                                                                  │
│  PromQL Example:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ sum(rate(http_request_duration_seconds_bucket{le="0.2"}[5m]))           │   │
│  │ /                                                                        │   │
│  │ sum(rate(http_request_duration_seconds_count[5m]))                      │   │
│  │ * 100                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Exclusions:                                                                    │
│  • Health check endpoints (/health, /ready)                                    │
│  • Internal monitoring requests                                                │
│  • Requests during planned maintenance windows                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### SLO Window Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLO WINDOW TYPES                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CALENDAR WINDOWS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Fixed time periods (monthly, quarterly)                               │   │
│  │ • Easy to understand and communicate                                    │   │
│  │ • Aligns with business reporting cycles                                 │   │
│  │ • Risk: Error budget resets can cause end-of-period risk-taking        │   │
│  │                                                                          │   │
│  │ Example: "99.9% availability per calendar month"                        │   │
│  │                                                                          │   │
│  │ Jan 1 ─────────────────────────────────────────────── Jan 31            │   │
│  │ [                    30-day window                        ]             │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ROLLING WINDOWS                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Sliding time period (last 30 days)                                    │   │
│  │ • Smoother error budget consumption                                     │   │
│  │ • Better reflects recent service behavior                               │   │
│  │ • More complex to implement and explain                                 │   │
│  │                                                                          │   │
│  │ Example: "99.9% availability over rolling 30 days"                      │   │
│  │                                                                          │   │
│  │ ──────[    30-day window    ]──────────────────────────────             │   │
│  │ ───────[    30-day window    ]─────────────────────────────             │   │
│  │ ────────[    30-day window    ]────────────────────────────             │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  RECOMMENDATION: Use rolling windows for operational decisions,                 │
│                  calendar windows for business reporting                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Calculating SLO Compliance

```go
// Example: SLO compliance calculation in Go
type SLOCalculator struct {
    goodEvents  float64
    totalEvents float64
    target      float64 // e.g., 99.9
}

func (s *SLOCalculator) CurrentSLI() float64 {
    if s.totalEvents == 0 {
        return 100.0
    }
    return (s.goodEvents / s.totalEvents) * 100
}

func (s *SLOCalculator) IsCompliant() bool {
    return s.CurrentSLI() >= s.target
}

func (s *SLOCalculator) ErrorBudgetRemaining() float64 {
    allowedBadEvents := s.totalEvents * (100 - s.target) / 100
    actualBadEvents := s.totalEvents - s.goodEvents
    return allowedBadEvents - actualBadEvents
}

func (s *SLOCalculator) ErrorBudgetPercentRemaining() float64 {
    allowedBadEvents := s.totalEvents * (100 - s.target) / 100
    if allowedBadEvents == 0 {
        return 100.0
    }
    actualBadEvents := s.totalEvents - s.goodEvents
    return ((allowedBadEvents - actualBadEvents) / allowedBadEvents) * 100
}
```

---

## Error Budgets

Error budgets quantify the acceptable amount of unreliability, enabling data-driven decisions about reliability vs. feature velocity.

### Error Budget Concept

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ERROR BUDGET FUNDAMENTALS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Error Budget = 100% - SLO Target                                               │
│                                                                                  │
│  Example: 99.9% availability SLO                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Error Budget = 100% - 99.9% = 0.1%                                      │   │
│  │                                                                          │   │
│  │ In a 30-day month (43,200 minutes):                                     │   │
│  │ Allowed downtime = 43,200 × 0.001 = 43.2 minutes                        │   │
│  │                                                                          │   │
│  │ In requests (1M requests/month):                                        │   │
│  │ Allowed failures = 1,000,000 × 0.001 = 1,000 failed requests            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Common SLO Targets and Error Budgets:                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ SLO Target │ Error Budget │ Monthly Downtime │ Daily Downtime          │   │
│  │────────────│──────────────│──────────────────│─────────────────────────│   │
│  │   99%      │    1%        │   7.3 hours      │   14.4 minutes          │   │
│  │   99.9%    │    0.1%      │   43.8 minutes   │   1.44 minutes          │   │
│  │   99.95%   │    0.05%     │   21.9 minutes   │   43.2 seconds          │   │
│  │   99.99%   │    0.01%     │   4.38 minutes   │   8.64 seconds          │   │
│  │   99.999%  │    0.001%    │   26.3 seconds   │   0.86 seconds          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Error Budget Policies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ERROR BUDGET POLICY FRAMEWORK                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Budget Status          │ Actions                                               │
│  ───────────────────────│─────────────────────────────────────────────────────  │
│                         │                                                        │
│  ✅ Budget > 50%        │ • Normal development velocity                         │
│     (Healthy)           │ • Feature releases proceed as planned                 │
│                         │ • Experimentation encouraged                          │
│                         │                                                        │
│  ⚠️  Budget 25-50%      │ • Increased caution on risky changes                  │
│     (Warning)           │ • Enhanced testing requirements                       │
│                         │ • Review upcoming releases for risk                   │
│                         │                                                        │
│  🔶 Budget 10-25%       │ • Freeze non-critical feature releases                │
│     (Critical)          │ • Focus on reliability improvements                   │
│                         │ • Require SRE approval for deployments                │
│                         │                                                        │
│  🔴 Budget < 10%        │ • Complete feature freeze                             │
│     (Exhausted)         │ • All hands on reliability                            │
│                         │ • Only critical security fixes deployed               │
│                         │ • Post-incident review required                       │
│                         │                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Error Budget Burn Rate

Burn rate measures how quickly the error budget is being consumed relative to the expected rate.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BURN RATE CALCULATION                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Burn Rate = (Actual Error Rate) / (Allowed Error Rate)                         │
│                                                                                  │
│  Example:                                                                        │
│  • SLO: 99.9% (allowed error rate = 0.1%)                                       │
│  • Current error rate: 0.5%                                                     │
│  • Burn rate = 0.5% / 0.1% = 5x                                                 │
│                                                                                  │
│  Interpretation:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Burn Rate │ Meaning                                                     │   │
│  │───────────│─────────────────────────────────────────────────────────────│   │
│  │    1x     │ Consuming budget at expected rate (sustainable)             │   │
│  │    2x     │ Will exhaust budget in half the window time                 │   │
│  │    5x     │ Will exhaust budget in 1/5 of window time                   │   │
│  │   10x     │ Critical - budget exhausted in 3 days (30-day window)       │   │
│  │   36x     │ Severe - budget exhausted in ~20 hours (30-day window)      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Multi-Window Burn Rate Alerting:                                               │
│  • Short window (5m) + high burn rate (14.4x) = Page immediately               │
│  • Medium window (1h) + medium burn rate (6x) = Page                           │
│  • Long window (6h) + low burn rate (1x) = Ticket                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### PromQL for Error Budget Monitoring

```promql
# Current SLI (availability over last 30 days)
sum(rate(http_requests_total{status!~"5.."}[30d]))
/
sum(rate(http_requests_total[30d]))

# Error budget remaining (as percentage)
1 - (
  (1 - (sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))))
  /
  (1 - 0.999)  # SLO target
)

# Burn rate (1-hour window)
(
  sum(rate(http_requests_total{status=~"5.."}[1h]))
  /
  sum(rate(http_requests_total[1h]))
)
/
(1 - 0.999)  # Allowed error rate

# Multi-window burn rate alert (fast burn)
(
  # Short window (5m) burn rate > 14.4x
  (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) / (1 - 0.999) > 14.4
  AND
  # Confirmed over 1h window
  (sum(rate(http_requests_total{status=~"5.."}[1h])) / sum(rate(http_requests_total[1h]))) / (1 - 0.999) > 14.4
)
```

---

## Alerting Strategies

Effective alerting is crucial for maintaining service reliability while avoiding alert fatigue.

### Alerting Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALERTING PRINCIPLES                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GOOD ALERTS                           BAD ALERTS                               │
│  ───────────                           ──────────                               │
│  ✅ Actionable                         ❌ Informational only                    │
│  ✅ Symptom-based                      ❌ Cause-based                           │
│  ✅ User-impact focused                ❌ Internal metrics focused              │
│  ✅ Appropriately urgent               ❌ Everything is critical                │
│  ✅ Well-documented runbook            ❌ No remediation guidance               │
│  ✅ Low false positive rate            ❌ Frequent false alarms                 │
│                                                                                  │
│  Key Questions Before Creating an Alert:                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Does this require immediate human action?                            │   │
│  │ 2. Can I write a runbook for this alert?                                │   │
│  │ 3. Is this detecting a symptom or a cause?                              │   │
│  │ 4. Will this alert fire during normal operations?                       │   │
│  │ 5. What's the user impact if I don't respond?                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Alert Severity Levels

| Severity | Response Time | Channel | Example |
|----------|---------------|---------|---------|
| **Critical (P1)** | Immediate (< 5 min) | Page on-call | Service down, data loss |
| **High (P2)** | < 30 minutes | Page during business hours | Degraded performance |
| **Medium (P3)** | < 4 hours | Slack/Email | Non-critical component issue |
| **Low (P4)** | Next business day | Ticket | Capacity warning |

### SLO-Based Alerting

SLO-based alerting focuses on user impact rather than arbitrary thresholds.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLO-BASED ALERTING STRATEGY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Traditional Alerting (Threshold-based):                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Alert when CPU > 80%                                                  │   │
│  │ • Alert when error rate > 1%                                            │   │
│  │ • Alert when latency p99 > 500ms                                        │   │
│  │                                                                          │   │
│  │ Problems:                                                                │   │
│  │ • Arbitrary thresholds                                                  │   │
│  │ • May not reflect user impact                                           │   │
│  │ • High false positive rate                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SLO-Based Alerting (Error Budget Burn Rate):                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Alert when burning error budget too fast                              │   │
│  │ • Directly tied to user-facing SLOs                                     │   │
│  │ • Severity based on time to budget exhaustion                           │   │
│  │                                                                          │   │
│  │ Benefits:                                                                │   │
│  │ • Alerts only when users are impacted                                   │   │
│  │ • Severity matches business impact                                      │   │
│  │ • Reduces alert fatigue                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Window, Multi-Burn-Rate Alerting

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-WINDOW BURN RATE ALERTS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  For a 30-day SLO window with 99.9% target:                                     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Severity │ Long Window │ Short Window │ Burn Rate │ Budget Consumed    │   │
│  │──────────│─────────────│──────────────│───────────│────────────────────│   │
│  │ Page     │ 1 hour      │ 5 minutes    │ 14.4x     │ 2% in 1 hour       │   │
│  │ Page     │ 6 hours     │ 30 minutes   │ 6x        │ 5% in 6 hours      │   │
│  │ Ticket   │ 3 days      │ 6 hours      │ 1x        │ 10% in 3 days      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Why Multi-Window?                                                              │
│  • Short window: Detects issues quickly                                         │
│  • Long window: Confirms issue is sustained (reduces false positives)           │
│  • Both must trigger for alert to fire                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Prometheus Alerting Rules Example

```yaml
# prometheus-alerts.yaml
groups:
  - name: slo-alerts
    rules:
      # Fast burn alert - pages immediately
      - alert: HighErrorBudgetBurn
        expr: |
          (
            # 5-minute burn rate > 14.4x
            (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))
            / (1 - 0.999) > 14.4
          )
          and
          (
            # Confirmed over 1-hour window
            (sum(rate(http_requests_total{status=~"5.."}[1h])) / sum(rate(http_requests_total[1h])))
            / (1 - 0.999) > 14.4
          )
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error budget burn rate detected"
          description: "Service is consuming error budget at 14.4x the sustainable rate"
          runbook_url: "https://runbooks.example.com/slo-burn"
      
      # Slow burn alert - creates ticket
      - alert: SlowErrorBudgetBurn
        expr: |
          (
            # 6-hour burn rate > 1x
            (sum(rate(http_requests_total{status=~"5.."}[6h])) / sum(rate(http_requests_total[6h])))
            / (1 - 0.999) > 1
          )
          and
          (
            # Confirmed over 3-day window
            (sum(rate(http_requests_total{status=~"5.."}[3d])) / sum(rate(http_requests_total[3d])))
            / (1 - 0.999) > 1
          )
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Slow error budget burn detected"
          description: "Service is slowly consuming error budget"
```

### Alert Routing and Escalation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALERT ROUTING ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │ Prometheus  │                                                                │
│  │   Alerts    │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      ALERTMANAGER                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │   │
│  │  │   Routing   │─▶│  Grouping   │─▶│  Silencing  │                     │   │
│  │  │    Rules    │  │             │  │  Inhibition │                     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                        │
│         ├──────────────────┬──────────────────┬──────────────────┐              │
│         ▼                  ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  PagerDuty  │    │    Slack    │    │    Email    │    │   Webhook   │      │
│  │  (Critical) │    │  (Warning)  │    │   (Info)    │    │  (Custom)   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Alertmanager Configuration Example

```yaml
# alertmanager.yaml
global:
  resolve_timeout: 5m
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    
    # Warning alerts go to Slack
    - match:
        severity: warning
      receiver: 'slack-warnings'
    
    # Info alerts go to email
    - match:
        severity: info
      receiver: 'email-notifications'

receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<pagerduty-service-key>'
        severity: critical
  
  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<slack-webhook-url>'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
  
  - name: 'email-notifications'
    email_configs:
      - to: 'team@example.com'
        send_resolved: true

# Inhibition rules - suppress lower severity when higher fires
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

---

## Cardinality Management

Cardinality refers to the number of unique time series in your metrics system. High cardinality can cause performance issues and increased costs.

### Understanding Cardinality

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CARDINALITY EXPLAINED                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Cardinality = Unique combinations of metric name + label values                │
│                                                                                  │
│  Example:                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ http_requests_total{method, status, endpoint, instance}                 │   │
│  │                                                                          │   │
│  │ method:   GET, POST, PUT, DELETE           = 4 values                   │   │
│  │ status:   200, 201, 400, 404, 500          = 5 values                   │   │
│  │ endpoint: /api/users, /api/orders, ...     = 50 values                  │   │
│  │ instance: pod-1, pod-2, ..., pod-10        = 10 values                  │   │
│  │                                                                          │   │
│  │ Total cardinality = 4 × 5 × 50 × 10 = 10,000 time series               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  HIGH CARDINALITY LABELS (Avoid):                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ❌ user_id          - Millions of unique values                         │   │
│  │ ❌ request_id       - Unique per request                                │   │
│  │ ❌ email            - Unbounded                                         │   │
│  │ ❌ timestamp        - Infinite values                                   │   │
│  │ ❌ full_url         - Query params create explosion                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LOW CARDINALITY LABELS (Good):                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ method           - GET, POST, PUT, DELETE                            │   │
│  │ ✅ status_code      - 200, 400, 500, etc.                               │   │
│  │ ✅ service          - Bounded set of services                           │   │
│  │ ✅ region           - us-east-1, eu-west-1, etc.                        │   │
│  │ ✅ environment      - prod, staging, dev                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Cardinality Impact

| Cardinality Level | Time Series | Impact |
|-------------------|-------------|--------|
| Low | < 10,000 | Normal operation |
| Medium | 10,000 - 100,000 | Monitor closely |
| High | 100,000 - 1,000,000 | Performance degradation |
| Extreme | > 1,000,000 | System instability, OOM |

### Cardinality Management Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CARDINALITY REDUCTION STRATEGIES                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. LABEL DESIGN                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Use bounded label values                                              │   │
│  │ • Bucket continuous values (latency_bucket instead of exact latency)    │   │
│  │ • Normalize paths (/api/users/{id} instead of /api/users/123)          │   │
│  │ • Remove unnecessary labels                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  2. METRIC RELABELING                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # prometheus.yml - Drop high cardinality labels                         │   │
│  │ metric_relabel_configs:                                                 │   │
│  │   - source_labels: [__name__]                                           │   │
│  │     regex: 'http_requests_total'                                        │   │
│  │     action: labeldrop                                                   │   │
│  │     regex: 'request_id'                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  3. RECORDING RULES                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # Pre-aggregate to reduce query-time cardinality                        │   │
│  │ groups:                                                                 │   │
│  │   - name: aggregations                                                  │   │
│  │     rules:                                                              │   │
│  │       - record: http_requests:rate5m                                    │   │
│  │         expr: sum by (service, status) (rate(http_requests_total[5m])) │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  4. SERIES LIMITS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # Mimir/Cortex limits                                                   │   │
│  │ limits:                                                                 │   │
│  │   max_series_per_user: 1000000                                         │   │
│  │   max_series_per_metric: 50000                                         │   │
│  │   max_label_names_per_series: 30                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Monitoring Cardinality

```promql
# Total active time series
prometheus_tsdb_head_series

# Time series by metric name
topk(10, count by (__name__) ({__name__=~".+"}))

# Cardinality by label
count(count by (service) (http_requests_total))

# Series created rate (detect cardinality explosions)
rate(prometheus_tsdb_head_series_created_total[5m])
```

---

## Sampling Strategies

Sampling reduces the volume of telemetry data while maintaining statistical significance and debugging capability.

### Why Sample?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SAMPLING TRADE-OFFS                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT SAMPLING                        WITH SAMPLING                          │
│  ─────────────────                       ─────────────                          │
│  ✅ Complete data                        ✅ Reduced costs                       │
│  ✅ Debug any request                    ✅ Lower storage requirements          │
│  ❌ High storage costs                   ✅ Better performance                  │
│  ❌ Performance overhead                 ⚠️  May miss rare events               │
│  ❌ Expensive queries                    ⚠️  Statistical accuracy varies        │
│                                                                                  │
│  When to Sample:                                                                │
│  • High-volume services (>10K requests/second)                                  │
│  • Development/staging environments                                             │
│  • Non-critical telemetry                                                       │
│                                                                                  │
│  When NOT to Sample:                                                            │
│  • Error traces (always capture)                                                │
│  • High-value transactions                                                      │
│  • Security-relevant events                                                     │
│  • Low-volume services                                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Sampling Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SAMPLING STRATEGY COMPARISON                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. HEAD-BASED SAMPLING                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Decision made at trace start (first span)                               │   │
│  │                                                                          │   │
│  │ Request ──► Sample? ──► Yes ──► Trace entire request                    │   │
│  │                    └──► No  ──► Drop entire request                     │   │
│  │                                                                          │   │
│  │ Pros: Simple, consistent, low overhead                                  │   │
│  │ Cons: May miss interesting traces decided early                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  2. TAIL-BASED SAMPLING                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Decision made after trace completes                                     │   │
│  │                                                                          │   │
│  │ Request ──► Collect all spans ──► Analyze ──► Keep interesting traces   │   │
│  │                                                                          │   │
│  │ Criteria for keeping:                                                   │   │
│  │ • Contains errors                                                       │   │
│  │ • High latency (> p99)                                                  │   │
│  │ • Specific attributes present                                           │   │
│  │                                                                          │   │
│  │ Pros: Captures all interesting traces                                   │   │
│  │ Cons: Higher resource usage, complexity                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  3. PROBABILISTIC SAMPLING                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Random sampling based on probability                                    │   │
│  │                                                                          │   │
│  │ Example: 10% sampling rate                                              │   │
│  │ if hash(trace_id) % 100 < 10 { keep trace }                            │   │
│  │                                                                          │   │
│  │ Pros: Simple, predictable volume                                        │   │
│  │ Cons: May miss rare but important events                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  4. RATE-LIMITING SAMPLING                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Keep N traces per second/minute                                         │   │
│  │                                                                          │   │
│  │ Example: Max 100 traces/second                                          │   │
│  │ Automatically adjusts sampling rate based on traffic                    │   │
│  │                                                                          │   │
│  │ Pros: Predictable costs, handles traffic spikes                         │   │
│  │ Cons: May under-sample during low traffic                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### OpenTelemetry Sampling Configuration

```go
// Head-based probabilistic sampling
import (
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func initTracerWithSampling() *sdktrace.TracerProvider {
    // Sample 10% of traces
    sampler := sdktrace.TraceIDRatioBased(0.1)
    
    // Or use parent-based sampling (respects parent's decision)
    parentSampler := sdktrace.ParentBased(
        sdktrace.TraceIDRatioBased(0.1),
        sdktrace.WithLocalParentSampled(sdktrace.AlwaysSample()),
        sdktrace.WithLocalParentNotSampled(sdktrace.NeverSample()),
        sdktrace.WithRemoteParentSampled(sdktrace.AlwaysSample()),
        sdktrace.WithRemoteParentNotSampled(sdktrace.NeverSample()),
    )
    
    return sdktrace.NewTracerProvider(
        sdktrace.WithSampler(parentSampler),
        // ... other options
    )
}

// Custom sampler - always sample errors
type ErrorSampler struct {
    baseSampler sdktrace.Sampler
}

func (s *ErrorSampler) ShouldSample(p sdktrace.SamplingParameters) sdktrace.SamplingResult {
    // Check if this is an error span
    for _, attr := range p.Attributes {
        if attr.Key == "error" && attr.Value.AsBool() {
            return sdktrace.SamplingResult{
                Decision:   sdktrace.RecordAndSample,
                Tracestate: trace.SpanContextFromContext(p.ParentContext).TraceState(),
            }
        }
    }
    // Fall back to base sampler
    return s.baseSampler.ShouldSample(p)
}
```

### OTel Collector Tail Sampling

```yaml
# otel-collector-config.yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      # Always sample errors
      - name: errors-policy
        type: status_code
        status_code:
          status_codes: [ERROR]
      
      # Sample slow traces (> 1s)
      - name: latency-policy
        type: latency
        latency:
          threshold_ms: 1000
      
      # Probabilistic sampling for everything else
      - name: probabilistic-policy
        type: probabilistic
        probabilistic:
          sampling_percentage: 10
      
      # Rate limiting
      - name: rate-limiting-policy
        type: rate_limiting
        rate_limiting:
          spans_per_second: 1000

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch]
      exporters: [otlp/tempo]
```

---

## Best Practices

### Observability Implementation Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY BEST PRACTICES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INSTRUMENTATION                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Use OpenTelemetry for vendor-neutral instrumentation                 │   │
│  │ ✅ Combine automatic and manual instrumentation                         │   │
│  │ ✅ Add business context to spans and logs                               │   │
│  │ ✅ Use consistent naming conventions                                    │   │
│  │ ✅ Include trace IDs in all logs                                        │   │
│  │ ❌ Don't instrument everything - focus on critical paths                │   │
│  │ ❌ Don't use high-cardinality labels in metrics                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  METRICS                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Follow RED method for services                                       │   │
│  │ ✅ Follow USE method for resources                                      │   │
│  │ ✅ Use histograms for latency (not averages)                            │   │
│  │ ✅ Monitor cardinality                                                  │   │
│  │ ✅ Use recording rules for expensive queries                            │   │
│  │ ❌ Don't create metrics with unbounded label values                     │   │
│  │ ❌ Don't rely solely on averages for latency                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LOGGING                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Use structured logging (JSON)                                        │   │
│  │ ✅ Include correlation IDs (trace_id, span_id)                          │   │
│  │ ✅ Use appropriate log levels                                           │   │
│  │ ✅ Log actionable information                                           │   │
│  │ ❌ Don't log sensitive data (PII, credentials)                          │   │
│  │ ❌ Don't log at DEBUG level in production                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TRACING                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Propagate context across service boundaries                          │   │
│  │ ✅ Add meaningful span names and attributes                             │   │
│  │ ✅ Record errors with stack traces                                      │   │
│  │ ✅ Use sampling for high-volume services                                │   │
│  │ ❌ Don't create spans for every function call                           │   │
│  │ ❌ Don't include sensitive data in span attributes                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### SLO Best Practices

| Practice | Description |
|----------|-------------|
| **Start simple** | Begin with 1-2 SLOs per service, expand as needed |
| **Measure from user perspective** | Use load balancer metrics, not internal metrics |
| **Set realistic targets** | Base on historical data, not aspirations |
| **Document everything** | SLI definitions, measurement methods, exclusions |
| **Review regularly** | Quarterly SLO reviews to adjust targets |
| **Automate reporting** | Dashboard showing SLO compliance and error budget |

### Alerting Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALERTING BEST PRACTICES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DO:                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Alert on symptoms, not causes                                        │   │
│  │ ✅ Use SLO-based alerting where possible                                │   │
│  │ ✅ Include runbook links in alert annotations                           │   │
│  │ ✅ Set appropriate severity levels                                      │   │
│  │ ✅ Use multi-window burn rates to reduce noise                          │   │
│  │ ✅ Review and tune alerts regularly                                     │   │
│  │ ✅ Track alert metrics (MTTA, MTTR, false positive rate)               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  DON'T:                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ❌ Alert on every metric threshold                                      │   │
│  │ ❌ Create alerts without runbooks                                       │   │
│  │ ❌ Page for non-urgent issues                                           │   │
│  │ ❌ Ignore alert fatigue                                                 │   │
│  │ ❌ Set and forget alerts                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Alert Quality Metrics:                                                         │
│  • False Positive Rate: < 5% of pages should be false alarms                   │
│  • Actionability: 100% of pages should require human action                    │
│  • Time to Acknowledge: < 5 minutes for critical alerts                        │
│  • Time to Resolve: Track and improve over time                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Observability Maturity Assessment

| Level | Characteristics | Next Steps |
|-------|-----------------|------------|
| **Level 1: Reactive** | Basic logging, manual health checks | Implement centralized logging, basic metrics |
| **Level 2: Proactive** | Centralized logs, metrics dashboards, threshold alerts | Add distributed tracing, SLO-based alerting |
| **Level 3: Predictive** | Full telemetry correlation, error budgets, automated runbooks | ML-based anomaly detection, auto-remediation |
| **Level 4: Autonomous** | Self-healing systems, predictive scaling, chaos engineering | Continuous improvement, advanced AIOps |

---

## Summary

Observability is the foundation of reliable systems. Key takeaways:

1. **Three Pillars**: Metrics for alerting, logs for debugging, traces for understanding request flow
2. **Correlation**: Link telemetry across pillars using trace IDs and consistent labels
3. **SLOs**: Define user-centric reliability targets with error budgets
4. **Alerting**: Focus on symptoms and user impact, not internal metrics
5. **Cardinality**: Design metrics with bounded label values
6. **Sampling**: Balance data completeness with cost and performance

## Related Documentation

- [Grafana Ecosystem](./grafana-ecosystem.md) - Grafana architecture and components
- [LGTM Stack](./lgtm-stack.md) - Loki, Grafana, Tempo, Mimir integration
- [Kubernetes Fundamentals](./kubernetes-fundamentals.md) - K8s concepts for observability