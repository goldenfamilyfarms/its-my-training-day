# LGTM Stack: Grafana's Observability Platform

This document provides comprehensive coverage of the LGTM stack (Loki, Grafana, Tempo, Mimir) plus Pyroscope, which together form Grafana's complete observability platform. Understanding these components and their query languages (PromQL and LogQL) is essential for all Grafana-related roles.

## Table of Contents

1. [LGTM Stack Overview](#lgtm-stack-overview)
2. [Loki: Log Aggregation](#loki-log-aggregation)
3. [Grafana: Unified Visualization](#grafana-unified-visualization)
4. [Tempo: Distributed Tracing](#tempo-distributed-tracing)
5. [Mimir: Scalable Metrics Storage](#mimir-scalable-metrics-storage)
6. [Pyroscope: Continuous Profiling](#pyroscope-continuous-profiling)
7. [PromQL Fundamentals](#promql-fundamentals)
8. [LogQL Fundamentals](#logql-fundamentals)
9. [Integration Patterns](#integration-patterns)

---

## LGTM Stack Overview

The LGTM stack represents Grafana Labs' approach to building a complete, horizontally scalable observability platform. Each component is designed to handle a specific telemetry type while sharing common architectural patterns.

### Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LGTM STACK ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                          ┌─────────────────────────┐                            │
│                          │        GRAFANA          │                            │
│                          │   (Unified Dashboard)   │                            │
│                          └───────────┬─────────────┘                            │
│                                      │                                          │
│         ┌────────────────────────────┼────────────────────────────┐            │
│         │                            │                            │            │
│         ▼                            ▼                            ▼            │
│  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐        │
│  │    MIMIR    │            │    LOKI     │            │   TEMPO     │        │
│  │  (Metrics)  │            │   (Logs)    │            │  (Traces)   │        │
│  │   PromQL    │            │   LogQL     │            │  TraceQL    │        │
│  └──────┬──────┘            └──────┬──────┘            └──────┬──────┘        │
│         │                          │                          │                │
│         └──────────────────────────┼──────────────────────────┘                │
│                                    │                                            │
│                          ┌─────────┴─────────┐                                 │
│                          │    PYROSCOPE      │                                 │
│                          │   (Profiling)     │                                 │
│                          └───────────────────┘                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Summary

| Component | Telemetry Type | Query Language | Key Feature |
|-----------|---------------|----------------|-------------|
| **Mimir** | Metrics | PromQL | Horizontally scalable Prometheus |
| **Loki** | Logs | LogQL | Label-based log indexing |
| **Tempo** | Traces | TraceQL | No indexing required |
| **Grafana** | Visualization | - | Unified observability UI |
| **Pyroscope** | Profiles | - | Continuous profiling |

### Design Principles

All LGTM components share common architectural principles:

1. **Horizontal Scalability**: Each component scales out by adding more instances
2. **Object Storage Backend**: Use cheap object storage (S3, GCS, Azure Blob) for data
3. **Microservices Architecture**: Components can run as monolith or microservices
4. **Label-Based Organization**: Consistent labeling across all telemetry types
5. **Multi-Tenancy**: Built-in support for tenant isolation

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │ Application │                                                                │
│  │   Workload  │                                                                │
│  └──────┬──────┘                                                                │
│         │                                                                        │
│         ├──────────────────┬──────────────────┬──────────────────┐              │
│         │                  │                  │                  │              │
│         ▼                  ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ Prometheus  │    │  Promtail/  │    │   OTLP/     │    │  Profiling  │      │
│  │   Scrape    │    │  Alloy      │    │   Jaeger    │    │   Agent     │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │                  │              │
│         ▼                  ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │    MIMIR    │    │    LOKI     │    │   TEMPO     │    │  PYROSCOPE  │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │                  │              │
│         └──────────────────┴──────────────────┴──────────────────┘              │
│                                    │                                            │
│                                    ▼                                            │
│                          ┌─────────────────┐                                   │
│                          │     GRAFANA     │                                   │
│                          │  (Correlation)  │                                   │
│                          └─────────────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Loki: Log Aggregation

Loki is a horizontally scalable, highly available log aggregation system inspired by Prometheus. Unlike traditional log systems, Loki indexes only metadata (labels), not the log content itself, making it cost-effective and efficient.

### Loki Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LOKI ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           WRITE PATH                                     │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │  Promtail/  │───▶│ Distributor │───▶│  Ingester   │                  │   │
│  │  │   Alloy     │    │             │    │             │                  │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘                  │   │
│  │                                               │                          │   │
│  │                                               ▼                          │   │
│  │                                        ┌─────────────┐                   │   │
│  │                                        │   Object    │                   │   │
│  │                                        │   Storage   │                   │   │
│  │                                        │ (S3/GCS/etc)│                   │   │
│  │                                        └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           READ PATH                                      │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   Grafana   │───▶│   Query     │───▶│  Querier    │                  │   │
│  │  │             │    │  Frontend   │    │             │                  │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘                  │   │
│  │                                               │                          │   │
│  │                          ┌────────────────────┼────────────────────┐     │   │
│  │                          │                    │                    │     │   │
│  │                          ▼                    ▼                    ▼     │   │
│  │                   ┌─────────────┐      ┌─────────────┐      ┌──────────┐│   │
│  │                   │  Ingester   │      │   Object    │      │  Index   ││   │
│  │                   │  (Recent)   │      │   Storage   │      │  Gateway ││   │
│  │                   └─────────────┘      └─────────────┘      └──────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Scaling |
|-----------|---------|---------|
| **Distributor** | Receives logs, validates, and forwards to ingesters | Stateless, horizontal |
| **Ingester** | Builds compressed chunks, writes to storage | Stateful, replication factor |
| **Querier** | Executes LogQL queries against storage and ingesters | Stateless, horizontal |
| **Query Frontend** | Query scheduling, splitting, caching | Stateless, horizontal |
| **Compactor** | Compacts index files, applies retention | Single instance or sharded |
| **Index Gateway** | Serves index queries (TSDB mode) | Stateless, horizontal |

### Label-Based Indexing

Loki's key innovation is indexing only labels, not log content:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LABEL-BASED INDEXING                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Traditional Log System:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Full-text index of ALL log content → Expensive storage & compute       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Loki Approach:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Index ONLY labels → Cheap storage, grep-like content search            │   │
│  │                                                                          │   │
│  │  Labels (Indexed):          Log Content (Compressed, Not Indexed):      │   │
│  │  ┌─────────────────┐        ┌─────────────────────────────────────┐     │   │
│  │  │ job="api"       │   ──▶  │ 2024-01-15 10:23:45 INFO Request... │     │   │
│  │  │ namespace="prod"│        │ 2024-01-15 10:23:46 DEBUG User...   │     │   │
│  │  │ pod="api-xyz"   │        │ 2024-01-15 10:23:47 ERROR Failed... │     │   │
│  │  └─────────────────┘        └─────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Log Ingestion Patterns

#### Using Promtail

Promtail is Loki's native log collector:

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # Keep only pods with logging enabled
      - source_labels: [__meta_kubernetes_pod_annotation_logging_enabled]
        action: keep
        regex: "true"
      # Set namespace label
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      # Set pod label
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      # Set container label
      - source_labels: [__meta_kubernetes_pod_container_name]
        target_label: container
    pipeline_stages:
      - docker: {}
      - multiline:
          firstline: '^\d{4}-\d{2}-\d{2}'
          max_wait_time: 3s
```

#### Using Grafana Alloy

Grafana Alloy (formerly Grafana Agent) provides a unified collector:

```hcl
// alloy-config.alloy
loki.source.file "logs" {
  targets = [
    {__path__ = "/var/log/*.log", job = "varlogs"},
  ]
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```

### Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Monolithic** | All components in single binary | Development, small deployments |
| **Simple Scalable** | Read, write, backend separation | Medium deployments |
| **Microservices** | Each component separate | Large-scale production |

```yaml
# Simple Scalable Deployment Example
# Write Path
loki-write:
  replicas: 3
  args:
    - -target=write

# Read Path  
loki-read:
  replicas: 2
  args:
    - -target=read

# Backend (Compactor, Index Gateway)
loki-backend:
  replicas: 1
  args:
    - -target=backend
```

---

## Grafana: Unified Visualization

While Grafana's core architecture is covered in [grafana-ecosystem.md](./grafana-ecosystem.md), this section focuses on its role as the unified visualization layer for the LGTM stack.

### LGTM Integration Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GRAFANA LGTM INTEGRATION                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         UNIFIED DASHBOARD                                │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Metrics   │  │    Logs     │  │   Traces    │  │  Profiles   │    │   │
│  │  │   Panel     │  │   Panel     │  │   Panel     │  │   Panel     │    │   │
│  │  │  (Mimir)    │  │   (Loki)    │  │  (Tempo)    │  │ (Pyroscope) │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  │         │                │                │                │            │   │
│  │         └────────────────┴────────────────┴────────────────┘            │   │
│  │                                   │                                      │   │
│  │                          ┌────────┴────────┐                            │   │
│  │                          │   Correlation   │                            │   │
│  │                          │     Engine      │                            │   │
│  │                          └─────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Correlation Capabilities

Grafana enables seamless navigation between telemetry types:

| Feature | Description | Example |
|---------|-------------|---------|
| **Exemplars** | Link metrics to traces | Click spike → see trace |
| **Derived Fields** | Extract trace IDs from logs | Log line → trace view |
| **Data Links** | Custom navigation between panels | Metric → related logs |
| **Explore** | Ad-hoc investigation across sources | Unified troubleshooting |

#### Exemplar Configuration

```yaml
# Prometheus scrape config with exemplars
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['localhost:8080']
    # Enable exemplar storage
    enable_features:
      - exemplar-storage
```

#### Derived Fields for Log-to-Trace

```json
{
  "derivedFields": [
    {
      "matcherRegex": "traceID=(\\w+)",
      "name": "TraceID",
      "url": "${__value.raw}",
      "datasourceUid": "tempo",
      "urlDisplayLabel": "View Trace"
    }
  ]
}
```

---

## Tempo: Distributed Tracing

Tempo is a high-scale, cost-effective distributed tracing backend. It requires only object storage and doesn't need a dedicated indexing cluster.

### Tempo Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TEMPO ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           WRITE PATH                                     │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   OTLP/     │───▶│ Distributor │───▶│  Ingester   │                  │   │
│  │  │   Jaeger/   │    │             │    │             │                  │   │
│  │  │   Zipkin    │    └─────────────┘    └──────┬──────┘                  │   │
│  │  └─────────────┘                              │                          │   │
│  │                                               ▼                          │   │
│  │                                        ┌─────────────┐                   │   │
│  │                                        │   Object    │                   │   │
│  │                                        │   Storage   │                   │   │
│  │                                        └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           READ PATH                                      │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   Grafana   │───▶│   Query     │───▶│  Querier    │                  │   │
│  │  │             │    │  Frontend   │    │             │                  │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘                  │   │
│  │                                               │                          │   │
│  │                          ┌────────────────────┼────────────────────┐     │   │
│  │                          │                    │                    │     │   │
│  │                          ▼                    ▼                    ▼     │   │
│  │                   ┌─────────────┐      ┌─────────────┐      ┌──────────┐│   │
│  │                   │  Ingester   │      │   Object    │      │ Metrics  ││   │
│  │                   │  (Recent)   │      │   Storage   │      │Generator ││   │
│  │                   └─────────────┘      └─────────────┘      └──────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Distributor** | Receives spans, routes to ingesters | Multi-protocol support |
| **Ingester** | Batches spans, writes to storage | WAL for durability |
| **Querier** | Executes TraceQL queries | Parallel block scanning |
| **Query Frontend** | Query scheduling and caching | Query splitting |
| **Compactor** | Compacts blocks, manages retention | Block optimization |
| **Metrics Generator** | Generates metrics from traces | RED metrics, service graphs |

### Distributed Tracing Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DISTRIBUTED TRACE ANATOMY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Trace ID: abc123                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ Span: HTTP GET /api/users (Root Span)                           │    │   │
│  │  │ Service: api-gateway                                            │    │   │
│  │  │ Duration: 250ms                                                 │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │       │                                                                  │   │
│  │       ├──────────────────────────────────────┐                          │   │
│  │       │                                      │                          │   │
│  │       ▼                                      ▼                          │   │
│  │  ┌─────────────────────┐            ┌─────────────────────┐            │   │
│  │  │ Span: Auth Check    │            │ Span: Get Users     │            │   │
│  │  │ Service: auth-svc   │            │ Service: user-svc   │            │   │
│  │  │ Duration: 50ms      │            │ Duration: 180ms     │            │   │
│  │  └─────────────────────┘            └──────────┬──────────┘            │   │
│  │                                                │                        │   │
│  │                                                ▼                        │   │
│  │                                     ┌─────────────────────┐            │   │
│  │                                     │ Span: DB Query      │            │   │
│  │                                     │ Service: user-svc   │            │   │
│  │                                     │ Duration: 120ms     │            │   │
│  │                                     └─────────────────────┘            │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### TraceQL Basics

TraceQL is Tempo's query language for searching and analyzing traces:

```
# Basic TraceQL Syntax
{ <spanset-filter> } | <pipeline>

# Find traces by service name
{ resource.service.name = "api-gateway" }

# Find traces with errors
{ status = error }

# Find slow spans
{ duration > 500ms }

# Combine conditions
{ resource.service.name = "api-gateway" && status = error && duration > 100ms }

# Find traces with specific attributes
{ span.http.method = "POST" && span.http.status_code >= 400 }
```

#### TraceQL Examples

```
# Find all traces from a specific service with errors
{ resource.service.name = "checkout-service" && status = error }

# Find traces where database queries are slow
{ name = "SELECT" && duration > 1s }

# Find traces with high span count (complex operations)
{ } | count() > 50

# Find traces by trace ID
{ trace:id = "abc123def456" }

# Aggregate: Find services with highest error rates
{ status = error } | rate() by (resource.service.name)
```

### Ingestion Protocols

Tempo supports multiple ingestion protocols:

| Protocol | Port | Use Case |
|----------|------|----------|
| **OTLP gRPC** | 4317 | OpenTelemetry native |
| **OTLP HTTP** | 4318 | OpenTelemetry HTTP |
| **Jaeger gRPC** | 14250 | Jaeger clients |
| **Jaeger Thrift HTTP** | 14268 | Jaeger HTTP |
| **Zipkin** | 9411 | Zipkin clients |

```yaml
# Tempo configuration for multi-protocol ingestion
distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318
    jaeger:
      protocols:
        grpc:
          endpoint: 0.0.0.0:14250
        thrift_http:
          endpoint: 0.0.0.0:14268
    zipkin:
      endpoint: 0.0.0.0:9411
```

---

## Mimir: Scalable Metrics Storage

Mimir is a horizontally scalable, highly available, multi-tenant time series database for long-term storage of Prometheus metrics.

### Mimir Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MIMIR ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           WRITE PATH                                     │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │ Prometheus  │───▶│ Distributor │───▶│  Ingester   │                  │   │
│  │  │   Remote    │    │             │    │             │                  │   │
│  │  │   Write     │    └─────────────┘    └──────┬──────┘                  │   │
│  │  └─────────────┘                              │                          │   │
│  │                                               ▼                          │   │
│  │                                        ┌─────────────┐                   │   │
│  │                                        │   Object    │                   │   │
│  │                                        │   Storage   │                   │   │
│  │                                        └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           READ PATH                                      │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   Grafana   │───▶│   Query     │───▶│  Querier    │                  │   │
│  │  │             │    │  Frontend   │    │             │                  │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘                  │   │
│  │                                               │                          │   │
│  │                          ┌────────────────────┼────────────────────┐     │   │
│  │                          │                    │                    │     │   │
│  │                          ▼                    ▼                    ▼     │   │
│  │                   ┌─────────────┐      ┌─────────────┐      ┌──────────┐│   │
│  │                   │  Ingester   │      │ Store       │      │  Ruler   ││   │
│  │                   │  (Recent)   │      │ Gateway     │      │          ││   │
│  │                   └─────────────┘      └─────────────┘      └──────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Scaling |
|-----------|---------|---------|
| **Distributor** | Receives samples, validates, shards to ingesters | Stateless, horizontal |
| **Ingester** | Builds TSDB blocks, writes to storage | Stateful, zone-aware |
| **Querier** | Executes PromQL queries | Stateless, horizontal |
| **Query Frontend** | Query scheduling, splitting, caching | Stateless, horizontal |
| **Store Gateway** | Serves queries from object storage | Stateful (caching) |
| **Compactor** | Compacts TSDB blocks | Sharded |
| **Ruler** | Evaluates recording/alerting rules | Stateless, sharded |
| **Alertmanager** | Handles alert routing and notifications | Stateful (HA) |

### Horizontal Scaling

Mimir achieves horizontal scaling through consistent hashing and sharding:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MIMIR HORIZONTAL SCALING                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Incoming Metrics                                                               │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         DISTRIBUTOR                                      │   │
│  │                    (Consistent Hash Ring)                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                          │
│       │  Hash(tenant_id + metric_name + labels) → Ingester                      │
│       │                                                                          │
│       ├──────────────────┬──────────────────┬──────────────────┐                │
│       │                  │                  │                  │                │
│       ▼                  ▼                  ▼                  ▼                │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │Ingester 1│      │Ingester 2│      │Ingester 3│      │Ingester N│           │
│  │ Zone A   │      │ Zone B   │      │ Zone C   │      │ Zone A   │           │
│  └──────────┘      └──────────┘      └──────────┘      └──────────┘           │
│                                                                                  │
│  Replication Factor: 3 (each sample written to 3 ingesters in different zones) │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy

Mimir provides native multi-tenancy with tenant isolation:

```yaml
# Mimir multi-tenant configuration
multitenancy_enabled: true

limits:
  # Per-tenant limits
  ingestion_rate: 100000           # samples/sec
  ingestion_burst_size: 200000
  max_series_per_user: 5000000
  max_series_per_metric: 50000
  max_label_names_per_series: 30
  max_label_value_length: 2048
  
  # Query limits
  max_fetched_series_per_query: 100000
  max_fetched_chunks_per_query: 2000000
```

### Long-Term Storage

Mimir uses object storage for cost-effective long-term retention:

```yaml
# Mimir storage configuration
blocks_storage:
  backend: s3
  s3:
    endpoint: s3.amazonaws.com
    bucket_name: mimir-blocks
    region: us-east-1
  bucket_store:
    sync_dir: /data/tsdb-sync
    bucket_index:
      enabled: true
  tsdb:
    dir: /data/tsdb
    block_ranges_period: [2h]
    retention_period: 24h  # Local retention before upload
```

---

## Pyroscope: Continuous Profiling

Pyroscope provides continuous profiling, allowing you to understand CPU, memory, and other resource usage at the code level.

### Pyroscope Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PYROSCOPE ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        APPLICATION LAYER                                 │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Go App    │  │  Java App   │  │ Python App  │  │  Node App   │    │   │
│  │  │  (pprof)    │  │  (async-    │  │  (py-spy)   │  │  (v8)       │    │   │
│  │  │             │  │  profiler)  │  │             │  │             │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  │         │                │                │                │            │   │
│  │         └────────────────┴────────────────┴────────────────┘            │   │
│  │                                   │                                      │   │
│  │                          ┌────────┴────────┐                            │   │
│  │                          │  Grafana Alloy  │                            │   │
│  │                          │  (Collection)   │                            │   │
│  │                          └────────┬────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PYROSCOPE SERVER                                 │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │ Distributor │───▶│  Ingester   │───▶│   Object    │                  │   │
│  │  │             │    │             │    │   Storage   │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐                                     │   │
│  │  │   Query     │───▶│  Querier    │                                     │   │
│  │  │  Frontend   │    │             │                                     │   │
│  │  └─────────────┘    └─────────────┘                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Profile Types

| Profile Type | Description | Use Case |
|--------------|-------------|----------|
| **CPU** | Time spent executing code | Find hot paths |
| **Memory (Alloc)** | Memory allocations | Find memory-heavy code |
| **Memory (Inuse)** | Current memory usage | Find memory leaks |
| **Goroutines** | Active goroutines (Go) | Find goroutine leaks |
| **Mutex** | Lock contention | Find concurrency issues |
| **Block** | Blocking operations | Find I/O bottlenecks |

### Flame Graphs

Flame graphs visualize profiling data hierarchically:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLAME GRAPH ANATOMY                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Width = Time/Resource spent in function                                        │
│  Height = Call stack depth                                                      │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                              main()                                      │   │
│  ├─────────────────────────────────────┬───────────────────────────────────┤   │
│  │           handleRequest()           │         processQueue()            │   │
│  ├───────────────────┬─────────────────┼─────────────────┬─────────────────┤   │
│  │   parseJSON()     │   queryDB()     │   serialize()   │   sendMetric()  │   │
│  ├─────────┬─────────┼────────┬────────┼────────┬────────┼────────┬────────┤   │
│  │ decode  │ validate│ connect│ execute│ marshal│ encode │  http  │  retry │   │
│  └─────────┴─────────┴────────┴────────┴────────┴────────┴────────┴────────┘   │
│                                                                                  │
│  Reading: queryDB() takes significant time → investigate database queries       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Instrumentation Examples

#### Go Application

```go
package main

import (
    "os"
    "runtime"
    
    "github.com/grafana/pyroscope-go"
)

func main() {
    // Configure Pyroscope
    runtime.SetMutexProfileFraction(5)
    runtime.SetBlockProfileRate(5)
    
    pyroscope.Start(pyroscope.Config{
        ApplicationName: "my-service",
        ServerAddress:   "http://pyroscope:4040",
        Logger:          pyroscope.StandardLogger,
        Tags: map[string]string{
            "env":     "production",
            "version": "1.0.0",
        },
        ProfileTypes: []pyroscope.ProfileType{
            pyroscope.ProfileCPU,
            pyroscope.ProfileAllocObjects,
            pyroscope.ProfileAllocSpace,
            pyroscope.ProfileInuseObjects,
            pyroscope.ProfileInuseSpace,
            pyroscope.ProfileGoroutines,
            pyroscope.ProfileMutexCount,
            pyroscope.ProfileMutexDuration,
            pyroscope.ProfileBlockCount,
            pyroscope.ProfileBlockDuration,
        },
    })
    
    // Your application code
    runServer()
}
```

#### Using Grafana Alloy

```hcl
// Alloy configuration for Pyroscope
pyroscope.scrape "default" {
  targets = [
    {"__address__" = "localhost:6060", "service_name" = "my-go-service"},
  ]
  forward_to = [pyroscope.write.default.receiver]
  
  profiling_config {
    profile.process_cpu { enabled = true }
    profile.memory { enabled = true }
    profile.goroutine { enabled = true }
    profile.mutex { enabled = true }
    profile.block { enabled = true }
  }
}

pyroscope.write "default" {
  endpoint {
    url = "http://pyroscope:4040"
  }
}
```

---

## PromQL Fundamentals

PromQL (Prometheus Query Language) is the query language used by Prometheus and Mimir for querying metrics data.

### Data Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PROMETHEUS DATA MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Metric Name + Labels = Time Series                                             │
│                                                                                  │
│  http_requests_total{method="GET", status="200", path="/api/users"}             │
│  ├─────────────────┤ ├─────────────────────────────────────────────┤            │
│       Metric Name                      Labels                                    │
│                                                                                  │
│  Time Series Data:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Timestamp          │ Value                                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ 1705312800         │ 1523                                               │   │
│  │ 1705312815         │ 1547                                               │   │
│  │ 1705312830         │ 1589                                               │   │
│  │ 1705312845         │ 1612                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Metric Types

| Type | Description | Example |
|------|-------------|---------|
| **Counter** | Monotonically increasing value | `http_requests_total` |
| **Gauge** | Value that can go up or down | `temperature_celsius` |
| **Histogram** | Samples in configurable buckets | `http_request_duration_seconds` |
| **Summary** | Similar to histogram with quantiles | `http_request_duration_seconds` |

### Selectors

```promql
# Instant vector selector - returns current value
http_requests_total

# Label matching
http_requests_total{method="GET"}                    # Exact match
http_requests_total{method!="GET"}                   # Not equal
http_requests_total{method=~"GET|POST"}              # Regex match
http_requests_total{method!~"DELETE|PUT"}            # Negative regex

# Range vector selector - returns values over time range
http_requests_total[5m]                              # Last 5 minutes
http_requests_total{method="GET"}[1h]                # Last hour

# Offset modifier - query historical data
http_requests_total offset 1h                        # Value 1 hour ago
http_requests_total[5m] offset 1d                    # 5 min range, 1 day ago
```

### Operators

#### Arithmetic Operators

```promql
# Basic arithmetic
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
node_filesystem_avail_bytes / node_filesystem_size_bytes * 100

# With scalar
http_requests_total * 2
temperature_celsius * 9/5 + 32
```

#### Comparison Operators

```promql
# Filter results
http_requests_total > 1000
node_cpu_seconds_total{mode="idle"} < 0.1

# Boolean result (1 or 0)
http_requests_total > bool 1000
```

#### Logical Operators

```promql
# AND - intersection of two vectors
http_requests_total{status="500"} and http_requests_total{method="POST"}

# OR - union of two vectors
http_requests_total{status="500"} or http_requests_total{status="503"}

# UNLESS - set difference
http_requests_total unless http_requests_total{status="200"}
```

### Functions

#### Rate and Increase

```promql
# rate() - per-second average rate of increase (for counters)
rate(http_requests_total[5m])

# irate() - instant rate based on last two data points
irate(http_requests_total[5m])

# increase() - total increase over time range
increase(http_requests_total[1h])

# Example: Request rate per second
rate(http_requests_total{job="api"}[5m])
```

#### Aggregation Functions

```promql
# sum - total across all series
sum(http_requests_total)

# avg - average value
avg(node_cpu_seconds_total{mode="idle"})

# min/max - minimum/maximum value
max(node_memory_MemTotal_bytes)

# count - number of series
count(up{job="prometheus"})

# topk/bottomk - top/bottom K series
topk(5, rate(http_requests_total[5m]))

# quantile - calculate quantile
quantile(0.95, http_request_duration_seconds)
```

#### Aggregation with Grouping

```promql
# Sum by specific labels
sum by (method) (rate(http_requests_total[5m]))

# Sum without specific labels
sum without (instance) (rate(http_requests_total[5m]))

# Multiple grouping labels
sum by (method, status) (rate(http_requests_total[5m]))
```

### Practical PromQL Examples

```promql
# 1. Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100

# 2. 95th percentile latency (histogram)
histogram_quantile(0.95, 
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)

# 3. Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 4. CPU usage percentage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 5. Disk space usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# 6. Request rate by service
sum by (service) (rate(http_requests_total[5m]))

# 7. Saturation - queue depth
avg_over_time(queue_depth[5m])

# 8. Availability (uptime percentage)
avg_over_time(up{job="my-service"}[24h]) * 100

# 9. Apdex score calculation
(
  sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
  +
  sum(rate(http_request_duration_seconds_bucket{le="2.0"}[5m])) / 2
)
/
sum(rate(http_request_duration_seconds_count[5m]))

# 10. Pod restart rate
sum by (pod) (increase(kube_pod_container_status_restarts_total[1h]))
```

---

## LogQL Fundamentals

LogQL is Loki's query language, combining log filtering with metric generation capabilities.

### Query Types

LogQL supports two types of queries:

| Type | Description | Returns |
|------|-------------|---------|
| **Log Queries** | Filter and return log lines | Log entries |
| **Metric Queries** | Aggregate logs into metrics | Time series |

### Log Stream Selectors

```logql
# Basic stream selector
{job="api-gateway"}

# Multiple label matchers
{job="api-gateway", namespace="production"}

# Label matching operators
{job="api-gateway"}                    # Exact match
{job!="api-gateway"}                   # Not equal
{job=~"api-.*"}                        # Regex match
{job!~"test-.*"}                       # Negative regex

# Combining matchers
{namespace="production", container=~"api|web"}
```

### Log Pipeline

The log pipeline processes log lines through a series of stages:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LOG PIPELINE STAGES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  {stream selector} | stage1 | stage2 | stage3 | ...                             │
│                                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Stream    │───▶│   Line      │───▶│   Parser    │───▶│   Label     │      │
│  │  Selector   │    │   Filter    │    │             │    │   Filter    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                                  │
│  Stage Types:                                                                    │
│  • Line Filters: |=, !=, |~, !~                                                 │
│  • Parsers: json, logfmt, pattern, regexp, unpack                               │
│  • Label Filters: | label op value                                              │
│  • Line Formatters: | line_format "template"                                    │
│  • Label Formatters: | label_format label="template"                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Line Filters

```logql
# Contains string
{job="api"} |= "error"

# Does not contain string
{job="api"} != "debug"

# Regex match
{job="api"} |~ "error|warn"

# Negative regex match
{job="api"} !~ "health|ready"

# Case insensitive (using regex)
{job="api"} |~ "(?i)error"

# Chaining filters
{job="api"} |= "error" != "timeout" |~ "user_id=\\d+"
```

### Parsers

#### JSON Parser

```logql
# Parse JSON logs
{job="api"} | json

# Extract specific fields
{job="api"} | json level, message, user_id

# Example log: {"level":"error","message":"failed","user_id":123}
# Creates labels: level="error", message="failed", user_id="123"

# Filter on parsed fields
{job="api"} | json | level="error"
```

#### Logfmt Parser

```logql
# Parse logfmt logs
{job="api"} | logfmt

# Example log: level=error msg="request failed" user_id=123
# Creates labels: level="error", msg="request failed", user_id="123"

# Filter on parsed fields
{job="api"} | logfmt | level="error" | user_id > 100
```

#### Pattern Parser

```logql
# Pattern parser for custom formats
{job="nginx"} | pattern `<ip> - - [<timestamp>] "<method> <path> <_>" <status> <size>`

# Example log: 192.168.1.1 - - [15/Jan/2024:10:23:45] "GET /api/users HTTP/1.1" 200 1234
# Creates labels: ip="192.168.1.1", method="GET", path="/api/users", status="200", size="1234"

# Filter on parsed fields
{job="nginx"} | pattern `<_> "<method> <path> <_>" <status> <_>` | status >= 400
```

#### Regexp Parser

```logql
# Regexp parser with named capture groups
{job="api"} | regexp `(?P<level>\w+)\s+(?P<message>.+)`

# Example log: ERROR Failed to connect to database
# Creates labels: level="ERROR", message="Failed to connect to database"
```

### Label Filters

```logql
# Comparison operators
{job="api"} | json | status_code >= 400
{job="api"} | json | duration > 1s
{job="api"} | json | level = "error"

# String operators
{job="api"} | json | message =~ ".*timeout.*"
{job="api"} | json | user_id != ""

# Combining filters
{job="api"} | json | level="error" and status_code >= 500
{job="api"} | json | level="error" or level="warn"
```

### Line and Label Formatters

```logql
# Line formatter - modify log line output
{job="api"} | json | line_format "{{.level}}: {{.message}}"

# Label formatter - create/modify labels
{job="api"} | json | label_format level_upper="{{.level | ToUpper}}"

# Template functions
{job="api"} | json | line_format `{{ .timestamp | date "2006-01-02" }} - {{ .message }}`
```

### Metric Queries

LogQL can generate metrics from logs using aggregation functions:

#### Log Range Aggregations

```logql
# Count log lines per time interval
count_over_time({job="api"}[5m])

# Rate of log lines per second
rate({job="api"}[5m])

# Bytes rate
bytes_rate({job="api"}[5m])

# Count errors per minute
count_over_time({job="api"} |= "error" [1m])
```

#### Unwrap - Extract Numeric Values

```logql
# Extract and aggregate numeric values from logs
# Example log: {"level":"info","duration_ms":150,"status":200}

# Average duration
avg_over_time({job="api"} | json | unwrap duration_ms [5m])

# Max duration
max_over_time({job="api"} | json | unwrap duration_ms [5m])

# Sum of bytes
sum_over_time({job="api"} | json | unwrap bytes [5m])

# Quantile of duration
quantile_over_time(0.95, {job="api"} | json | unwrap duration_ms [5m])
```

#### Aggregation Operators

```logql
# Sum by label
sum by (level) (count_over_time({job="api"} | json [5m]))

# Average by label
avg by (status_code) (avg_over_time({job="api"} | json | unwrap duration_ms [5m]))

# Top K
topk(5, sum by (path) (rate({job="api"} | json [5m])))
```

### Practical LogQL Examples

```logql
# 1. Error rate per service
sum by (service) (rate({namespace="production"} |= "error" [5m]))

# 2. 95th percentile response time from logs
quantile_over_time(0.95, 
  {job="api"} | json | unwrap response_time_ms [5m]
) by (endpoint)

# 3. Count of 5xx errors by path
sum by (path) (
  count_over_time({job="nginx"} | pattern `<_> "<_> <path> <_>" <status> <_>` | status >= 500 [5m])
)

# 4. Log volume by level
sum by (level) (bytes_over_time({job="api"} | json [1h]))

# 5. Unique users with errors
count(
  sum by (user_id) (
    count_over_time({job="api"} | json | level="error" [1h])
  )
)

# 6. Slow requests (> 1 second)
{job="api"} | json | response_time_ms > 1000

# 7. Failed authentication attempts
{job="auth"} | json | event="login_failed" | line_format "{{.timestamp}} - {{.username}} from {{.ip}}"

# 8. Error messages grouped by type
sum by (error_type) (
  count_over_time({job="api"} | json | level="error" [1h])
)

# 9. Request rate comparison (current vs 1 hour ago)
sum(rate({job="api"}[5m])) / sum(rate({job="api"}[5m] offset 1h))

# 10. Log entries with stack traces
{job="api"} |= "Exception" |~ "at .+\\(.+:\\d+\\)"
```

---

## Integration Patterns

### Correlating Telemetry Types

The LGTM stack enables powerful correlations between different telemetry types:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TELEMETRY CORRELATION PATTERNS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    METRICS → TRACES (Exemplars)                          │   │
│  │                                                                          │   │
│  │  High latency spike in metrics → Click to see example trace              │   │
│  │                                                                          │   │
│  │  histogram_quantile(0.99, rate(http_duration_bucket[5m]))               │   │
│  │                           │                                              │   │
│  │                           ▼                                              │   │
│  │                    [Exemplar: trace_id=abc123]                           │   │
│  │                           │                                              │   │
│  │                           ▼                                              │   │
│  │                    Tempo: Full trace details                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LOGS → TRACES (Derived Fields)                        │   │
│  │                                                                          │   │
│  │  Error log with trace ID → Click to see full trace                       │   │
│  │                                                                          │   │
│  │  {job="api"} |= "error" | json                                          │   │
│  │  Log: {"level":"error","trace_id":"abc123","message":"timeout"}         │   │
│  │                           │                                              │   │
│  │                           ▼                                              │   │
│  │                    Tempo: Full trace details                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TRACES → PROFILES (Span Profiles)                     │   │
│  │                                                                          │   │
│  │  Slow span in trace → View CPU profile for that span                     │   │
│  │                                                                          │   │
│  │  TraceQL: { duration > 1s }                                             │   │
│  │                           │                                              │   │
│  │                           ▼                                              │   │
│  │                    Pyroscope: Flame graph for span                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Unified Collection with Grafana Alloy

Grafana Alloy provides a single agent for collecting all telemetry types:

```hcl
// Complete Alloy configuration for LGTM stack

// ============ METRICS ============
prometheus.scrape "default" {
  targets = [
    {"__address__" = "localhost:8080", "job" = "my-service"},
  ]
  forward_to = [prometheus.remote_write.mimir.receiver]
}

prometheus.remote_write "mimir" {
  endpoint {
    url = "http://mimir:9009/api/v1/push"
  }
}

// ============ LOGS ============
loki.source.file "logs" {
  targets = [
    {__path__ = "/var/log/app/*.log", job = "my-service"},
  ]
  forward_to = [loki.process.default.receiver]
}

loki.process "default" {
  stage.json {
    expressions = {
      level = "level",
      trace_id = "trace_id",
    }
  }
  stage.labels {
    values = {
      level = "",
    }
  }
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}

// ============ TRACES ============
otelcol.receiver.otlp "default" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }
  http {
    endpoint = "0.0.0.0:4318"
  }
  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
    tls {
      insecure = true
    }
  }
}

// ============ PROFILES ============
pyroscope.scrape "default" {
  targets = [
    {"__address__" = "localhost:6060", "service_name" = "my-service"},
  ]
  forward_to = [pyroscope.write.default.receiver]
}

pyroscope.write "default" {
  endpoint {
    url = "http://pyroscope:4040"
  }
}
```

### Best Practices

#### Label Consistency

Maintain consistent labels across all telemetry types for easy correlation:

```yaml
# Recommended label schema
labels:
  service: "api-gateway"        # Service name
  namespace: "production"       # Kubernetes namespace
  environment: "prod"           # Environment
  version: "1.2.3"             # Application version
  instance: "pod-xyz"          # Instance identifier
```

#### Cardinality Management

| Telemetry | Cardinality Concern | Mitigation |
|-----------|---------------------|------------|
| **Metrics** | High-cardinality labels | Avoid user IDs, request IDs in labels |
| **Logs** | Too many unique streams | Limit dynamic labels, use structured logging |
| **Traces** | Span attributes | Use sampling, limit custom attributes |

#### Sampling Strategies

```yaml
# Tempo sampling configuration
distributor:
  receivers:
    otlp:
      protocols:
        grpc:
  
# Tail-based sampling
overrides:
  defaults:
    ingestion:
      rate_strategy: local
      rate_limit_bytes: 15000000
```

### Troubleshooting Workflow

A typical troubleshooting workflow using the LGTM stack:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TROUBLESHOOTING WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. ALERT FIRES                                                                 │
│     │                                                                            │
│     ▼                                                                            │
│  2. CHECK METRICS (Mimir)                                                       │
│     • Error rate spike?                                                         │
│     • Latency increase?                                                         │
│     • Resource saturation?                                                      │
│     │                                                                            │
│     ▼                                                                            │
│  3. EXAMINE LOGS (Loki)                                                         │
│     • Filter by time range                                                      │
│     • Search for errors                                                         │
│     • Extract trace IDs                                                         │
│     │                                                                            │
│     ▼                                                                            │
│  4. TRACE ANALYSIS (Tempo)                                                      │
│     • View full request path                                                    │
│     • Identify slow spans                                                       │
│     • Find error sources                                                        │
│     │                                                                            │
│     ▼                                                                            │
│  5. PROFILE INVESTIGATION (Pyroscope)                                           │
│     • CPU hotspots                                                              │
│     • Memory allocations                                                        │
│     • Lock contention                                                           │
│     │                                                                            │
│     ▼                                                                            │
│  6. ROOT CAUSE IDENTIFIED → FIX DEPLOYED                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

The LGTM stack provides a comprehensive observability platform:

| Component | Purpose | Query Language | Key Strength |
|-----------|---------|----------------|--------------|
| **Loki** | Log aggregation | LogQL | Cost-effective, label-based |
| **Grafana** | Visualization | - | Unified interface, correlation |
| **Tempo** | Distributed tracing | TraceQL | No indexing, scalable |
| **Mimir** | Metrics storage | PromQL | Horizontally scalable |
| **Pyroscope** | Continuous profiling | - | Code-level insights |

### Key Takeaways

1. **Unified Architecture**: All components share similar microservices patterns
2. **Object Storage**: Cost-effective storage using S3/GCS/Azure Blob
3. **Label-Based**: Consistent labeling enables correlation across telemetry types
4. **Query Languages**: PromQL for metrics, LogQL for logs, TraceQL for traces
5. **Horizontal Scaling**: All components scale out by adding instances
6. **Multi-Tenancy**: Built-in tenant isolation for enterprise deployments

### Further Reading

- [Grafana Ecosystem Overview](./grafana-ecosystem.md)
- [Kubernetes Fundamentals](./kubernetes-fundamentals.md)
- [Observability Principles](./observability-principles.md)
