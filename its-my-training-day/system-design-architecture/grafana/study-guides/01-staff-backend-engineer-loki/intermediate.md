# Intermediate: Staff Backend Engineer - Grafana Databases, Loki Ingest

This document covers intermediate-level topics essential for the Staff Backend Engineer role at Grafana Labs. Building on the fundamentals, we explore Kafka at scale, Kubernetes operations, microservices architecture patterns, and cloud platform expertise. These skills are critical for designing and operating distributed systems like Loki.

## Table of Contents

1. [Kafka at Scale](#kafka-at-scale)
2. [Kubernetes Operations](#kubernetes-operations)
3. [Microservices Architecture Patterns](#microservices-architecture-patterns)
4. [Cloud Platforms](#cloud-platforms)
5. [Related Resources](#related-resources)

---

## Kafka at Scale

Apache Kafka is a distributed event streaming platform used extensively in high-throughput data pipelines. Understanding Kafka's architecture and operational patterns is essential for building scalable log ingestion systems like Loki.

### Kafka Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KAFKA CLUSTER ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         KAFKA BROKERS                                    │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │  Broker 1   │    │  Broker 2   │    │  Broker 3   │                  │   │
│  │  │  (Leader)   │    │  (Follower) │    │  (Follower) │                  │   │
│  │  │             │    │             │    │             │                  │   │
│  │  │ Partition 0 │◄──▶│ Partition 0 │◄──▶│ Partition 0 │                  │   │
│  │  │ (Leader)    │    │ (Replica)   │    │ (Replica)   │                  │   │
│  │  │             │    │             │    │             │                  │   │
│  │  │ Partition 1 │    │ Partition 1 │    │ Partition 1 │                  │   │
│  │  │ (Replica)   │    │ (Leader)    │    │ (Replica)   │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ZOOKEEPER / KRAFT                                │   │
│  │  (Cluster metadata, leader election, configuration management)          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Producer Patterns

Producers send records to Kafka topics. Understanding producer configuration and patterns is crucial for reliable data ingestion.

#### Basic Producer Configuration

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaProducer wraps kafka-go writer with best practices
type KafkaProducer struct {
    writer *kafka.Writer
}

// NewKafkaProducer creates a production-ready Kafka producer
func NewKafkaProducer(brokers []string, topic string) *KafkaProducer {
    writer := &kafka.Writer{
        Addr:         kafka.TCP(brokers...),
        Topic:        topic,
        Balancer:     &kafka.LeastBytes{},  // Load balancing strategy
        BatchSize:    100,                   // Batch messages for efficiency
        BatchTimeout: 10 * time.Millisecond, // Max wait time for batch
        RequiredAcks: kafka.RequireAll,      // Wait for all replicas
        Async:        false,                 // Synchronous for reliability
        Compression:  kafka.Snappy,          // Compress for throughput
        
        // Retry configuration
        MaxAttempts: 3,
        
        // Connection settings
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
    }
    
    return &KafkaProducer{writer: writer}
}

// SendMessage sends a single message with key for partitioning
func (p *KafkaProducer) SendMessage(ctx context.Context, key, value []byte) error {
    return p.writer.WriteMessages(ctx, kafka.Message{
        Key:   key,
        Value: value,
        Time:  time.Now(),
    })
}

// SendBatch sends multiple messages efficiently
func (p *KafkaProducer) SendBatch(ctx context.Context, messages []kafka.Message) error {
    return p.writer.WriteMessages(ctx, messages...)
}

// Close gracefully shuts down the producer
func (p *KafkaProducer) Close() error {
    return p.writer.Close()
}

func main() {
    producer := NewKafkaProducer(
        []string{"kafka-1:9092", "kafka-2:9092", "kafka-3:9092"},
        "log-events",
    )
    defer producer.Close()
    
    ctx := context.Background()
    
    // Send with partition key (ensures ordering for same key)
    err := producer.SendMessage(ctx, 
        []byte("tenant-123"),  // Key determines partition
        []byte(`{"level":"info","message":"User logged in"}`),
    )
    if err != nil {
        log.Printf("Failed to send message: %v", err)
    }
}
```

#### Acknowledgment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `RequireNone` (acks=0) | Fire and forget, no acknowledgment | High throughput, loss acceptable |
| `RequireOne` (acks=1) | Leader acknowledgment only | Balance of speed and reliability |
| `RequireAll` (acks=-1) | All in-sync replicas acknowledge | Maximum reliability |

#### Idempotent Producer Pattern

```go
// Idempotent producer configuration prevents duplicates
// on retries by using sequence numbers
type IdempotentProducerConfig struct {
    EnableIdempotence bool
    MaxInFlightRequests int  // Must be <= 5 for idempotence
    Retries           int
    Acks              string // Must be "all" for idempotence
}

// For exactly-once semantics, combine with transactions
func createIdempotentWriter(brokers []string, topic string) *kafka.Writer {
    return &kafka.Writer{
        Addr:         kafka.TCP(brokers...),
        Topic:        topic,
        RequiredAcks: kafka.RequireAll,
        // Note: kafka-go handles idempotence internally
        // For full exactly-once, use transactional API
    }
}
```

### Consumer Patterns

Consumers read records from Kafka topics. Proper consumer configuration ensures reliable, scalable message processing.

#### Consumer Group Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONSUMER GROUP ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Topic: log-events (6 partitions)                                               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │ P0  │ │ P1  │ │ P2  │ │ P3  │ │ P4  │ │ P5  │                              │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                              │
│     │       │       │       │       │       │                                   │
│     └───────┴───────┼───────┴───────┼───────┘                                   │
│                     │               │                                           │
│  Consumer Group: log-processors                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │ Consumer 1  │    │ Consumer 2  │    │ Consumer 3  │                  │   │
│  │  │ P0, P1      │    │ P2, P3      │    │ P4, P5      │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Consumer Implementation

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaConsumer wraps kafka-go reader with best practices
type KafkaConsumer struct {
    reader *kafka.Reader
}

// NewKafkaConsumer creates a production-ready Kafka consumer
func NewKafkaConsumer(brokers []string, topic, groupID string) *KafkaConsumer {
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers:        brokers,
        Topic:          topic,
        GroupID:        groupID,
        MinBytes:       10e3,              // 10KB min fetch
        MaxBytes:       10e6,              // 10MB max fetch
        MaxWait:        500 * time.Millisecond,
        StartOffset:    kafka.LastOffset, // Start from latest
        CommitInterval: time.Second,      // Auto-commit interval
        
        // Partition assignment strategy
        GroupBalancers: []kafka.GroupBalancer{
            kafka.RangeGroupBalancer{},
            kafka.RoundRobinGroupBalancer{},
        },
        
        // Session and heartbeat
        SessionTimeout:   30 * time.Second,
        HeartbeatInterval: 3 * time.Second,
        
        // Rebalance timeout
        RebalanceTimeout: 60 * time.Second,
    })
    
    return &KafkaConsumer{reader: reader}
}

// ProcessMessages reads and processes messages with manual commit
func (c *KafkaConsumer) ProcessMessages(ctx context.Context, handler func(kafka.Message) error) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            msg, err := c.reader.FetchMessage(ctx)
            if err != nil {
                return fmt.Errorf("fetch message: %w", err)
            }
            
            // Process message
            if err := handler(msg); err != nil {
                log.Printf("Error processing message: %v", err)
                // Decide: skip, retry, or dead-letter queue
                continue
            }
            
            // Commit offset after successful processing
            if err := c.reader.CommitMessages(ctx, msg); err != nil {
                return fmt.Errorf("commit message: %w", err)
            }
        }
    }
}

// Close gracefully shuts down the consumer
func (c *KafkaConsumer) Close() error {
    return c.reader.Close()
}

func main() {
    consumer := NewKafkaConsumer(
        []string{"kafka-1:9092", "kafka-2:9092", "kafka-3:9092"},
        "log-events",
        "log-processors",
    )
    defer consumer.Close()
    
    ctx, cancel := context.WithCancel(context.Background())
    
    // Handle graceful shutdown
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
    go func() {
        <-sigChan
        cancel()
    }()
    
    // Process messages
    err := consumer.ProcessMessages(ctx, func(msg kafka.Message) error {
        fmt.Printf("Received: partition=%d offset=%d key=%s\n",
            msg.Partition, msg.Offset, string(msg.Key))
        return nil
    })
    if err != nil && err != context.Canceled {
        log.Fatalf("Consumer error: %v", err)
    }
}
```

### Partitioning Strategies

Partitioning determines how messages are distributed across partitions, affecting parallelism and ordering guarantees.

#### Partitioning Approaches

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Round Robin** | Distribute evenly across partitions | Maximum parallelism, no ordering |
| **Key-Based** | Hash key to determine partition | Ordering per key (e.g., per tenant) |
| **Custom** | Application-defined logic | Complex routing requirements |

```go
// Custom partitioner for tenant-based routing
type TenantPartitioner struct {
    numPartitions int
}

func (p *TenantPartitioner) Balance(msg kafka.Message, partitions ...int) int {
    // Extract tenant from key
    tenantID := string(msg.Key)
    
    // Consistent hashing for tenant
    hash := fnv.New32a()
    hash.Write([]byte(tenantID))
    
    return int(hash.Sum32()) % len(partitions)
}

// Partition key design for Loki-like systems
type LogMessage struct {
    TenantID  string
    Labels    map[string]string
    Timestamp time.Time
    Line      string
}

func (m *LogMessage) PartitionKey() []byte {
    // Partition by tenant for isolation
    // All logs from same tenant go to same partition
    return []byte(m.TenantID)
}

func (m *LogMessage) OrderingKey() []byte {
    // For strict ordering within a stream
    // Combine tenant + stream labels
    return []byte(fmt.Sprintf("%s:%s", m.TenantID, m.Labels["stream"]))
}
```

### Exactly-Once Semantics

Achieving exactly-once processing requires coordination between producers, consumers, and application state.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         EXACTLY-ONCE SEMANTICS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Idempotent Producer (prevents duplicate sends on retry)                     │
│     ┌─────────────┐                                                             │
│     │  Producer   │──── Sequence Number ────▶ Broker deduplicates              │
│     └─────────────┘                                                             │
│                                                                                  │
│  2. Transactional Producer (atomic writes across partitions)                    │
│     ┌─────────────┐                                                             │
│     │  Producer   │──── Begin Transaction ──▶ Write to multiple partitions     │
│     │             │──── Commit/Abort ───────▶ All or nothing                   │
│     └─────────────┘                                                             │
│                                                                                  │
│  3. Consumer with Transactional Read (read_committed isolation)                 │
│     ┌─────────────┐                                                             │
│     │  Consumer   │──── read_committed ─────▶ Only see committed messages      │
│     └─────────────┘                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Transactional Processing Pattern

```go
// Transactional consumer-producer pattern
// Read from input topic, process, write to output topic atomically
type TransactionalProcessor struct {
    consumer *kafka.Reader
    producer *kafka.Writer
}

func (p *TransactionalProcessor) ProcessWithTransaction(ctx context.Context) error {
    for {
        // Fetch message
        msg, err := p.consumer.FetchMessage(ctx)
        if err != nil {
            return err
        }
        
        // Process and produce atomically
        // Note: Full transactional support requires Kafka's transaction API
        // This is a simplified pattern showing the concept
        
        outputMsg := kafka.Message{
            Key:   msg.Key,
            Value: transform(msg.Value),
        }
        
        // Write to output topic
        if err := p.producer.WriteMessages(ctx, outputMsg); err != nil {
            // Don't commit input - will retry
            return err
        }
        
        // Commit input offset only after successful output
        if err := p.consumer.CommitMessages(ctx, msg); err != nil {
            return err
        }
    }
}

func transform(input []byte) []byte {
    // Transform logic here
    return input
}
```

### Consumer Group Management

Consumer groups enable parallel processing while maintaining ordering guarantees within partitions.

#### Rebalancing Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONSUMER GROUP REBALANCING                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Eager Rebalancing (Stop-the-World):                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. All consumers stop processing                                        │   │
│  │  2. All partitions revoked                                               │   │
│  │  3. Partitions reassigned                                                │   │
│  │  4. Consumers resume                                                     │   │
│  │  Problem: Processing stops during rebalance                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Cooperative Rebalancing (Incremental):                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. Only affected partitions revoked                                     │   │
│  │  2. Other consumers continue processing                                  │   │
│  │  3. Revoked partitions reassigned                                        │   │
│  │  4. Minimal disruption                                                   │   │
│  │  Benefit: Near-zero downtime during rebalance                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Handling Rebalances

```go
// RebalanceHandler manages partition assignment changes
type RebalanceHandler struct {
    partitionState map[int]PartitionState
    mu             sync.RWMutex
}

type PartitionState struct {
    Partition     int
    LastOffset    int64
    ProcessingCtx context.Context
    Cancel        context.CancelFunc
}

// OnPartitionsAssigned called when partitions are assigned
func (h *RebalanceHandler) OnPartitionsAssigned(partitions []int) {
    h.mu.Lock()
    defer h.mu.Unlock()
    
    for _, p := range partitions {
        ctx, cancel := context.WithCancel(context.Background())
        h.partitionState[p] = PartitionState{
            Partition:     p,
            ProcessingCtx: ctx,
            Cancel:        cancel,
        }
        log.Printf("Assigned partition %d", p)
    }
}

// OnPartitionsRevoked called when partitions are revoked
func (h *RebalanceHandler) OnPartitionsRevoked(partitions []int) {
    h.mu.Lock()
    defer h.mu.Unlock()
    
    for _, p := range partitions {
        if state, ok := h.partitionState[p]; ok {
            // Cancel any in-flight processing
            state.Cancel()
            // Commit any pending offsets
            log.Printf("Revoked partition %d at offset %d", p, state.LastOffset)
            delete(h.partitionState, p)
        }
    }
}
```

### Performance Tuning

Optimizing Kafka for high throughput requires tuning both producer and consumer configurations.

#### Producer Tuning

| Parameter | Default | Tuning Guidance |
|-----------|---------|-----------------|
| `batch.size` | 16KB | Increase for throughput (e.g., 64KB-1MB) |
| `linger.ms` | 0 | Add small delay (5-100ms) to batch more |
| `compression.type` | none | Use snappy/lz4 for throughput, gzip for ratio |
| `buffer.memory` | 32MB | Increase for high-volume producers |
| `acks` | 1 | Use "all" for durability, "1" for speed |

#### Consumer Tuning

| Parameter | Default | Tuning Guidance |
|-----------|---------|-----------------|
| `fetch.min.bytes` | 1 | Increase (e.g., 10KB) to batch fetches |
| `fetch.max.wait.ms` | 500 | Balance latency vs throughput |
| `max.partition.fetch.bytes` | 1MB | Increase for large messages |
| `max.poll.records` | 500 | Tune based on processing time |
| `session.timeout.ms` | 10s | Increase for slow consumers |

```go
// High-throughput producer configuration
func NewHighThroughputProducer(brokers []string, topic string) *kafka.Writer {
    return &kafka.Writer{
        Addr:         kafka.TCP(brokers...),
        Topic:        topic,
        Balancer:     &kafka.LeastBytes{},
        BatchSize:    1000,                  // Large batches
        BatchBytes:   1048576,               // 1MB batch size
        BatchTimeout: 50 * time.Millisecond, // Allow batching
        RequiredAcks: kafka.RequireOne,      // Fast acks
        Compression:  kafka.Lz4,             // Fast compression
        Async:        true,                  // Async for throughput
    }
}

// High-throughput consumer configuration
func NewHighThroughputConsumer(brokers []string, topic, groupID string) *kafka.Reader {
    return kafka.NewReader(kafka.ReaderConfig{
        Brokers:     brokers,
        Topic:       topic,
        GroupID:     groupID,
        MinBytes:    100e3,              // 100KB min fetch
        MaxBytes:    50e6,               // 50MB max fetch
        MaxWait:     100 * time.Millisecond,
        QueueCapacity: 1000,             // Internal queue size
    })
}
```

---

## Kubernetes Operations

Operating Kubernetes clusters effectively requires understanding StatefulSets, Operators, resource management, and troubleshooting patterns. These skills are essential for deploying and managing distributed systems like Loki.

> **Related Resource**: For Kubernetes fundamentals, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### StatefulSets for Stateful Workloads

StatefulSets manage stateful applications with stable network identities and persistent storage—essential for databases and distributed systems like Loki ingesters.

#### StatefulSet Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STATEFULSET ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  StatefulSet: loki-ingester                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│  │  │ loki-ingester-0 │  │ loki-ingester-1 │  │ loki-ingester-2 │         │   │
│  │  │                 │  │                 │  │                 │         │   │
│  │  │ Stable DNS:     │  │ Stable DNS:     │  │ Stable DNS:     │         │   │
│  │  │ loki-ingester-0 │  │ loki-ingester-1 │  │ loki-ingester-2 │         │   │
│  │  │ .loki-ingester  │  │ .loki-ingester  │  │ .loki-ingester  │         │   │
│  │  │ .monitoring.svc │  │ .monitoring.svc │  │ .monitoring.svc │         │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │   │
│  │           │                    │                    │                   │   │
│  │           ▼                    ▼                    ▼                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│  │  │ PVC: data-loki- │  │ PVC: data-loki- │  │ PVC: data-loki- │         │   │
│  │  │ ingester-0      │  │ ingester-1      │  │ ingester-2      │         │   │
│  │  │ (Persistent)    │  │ (Persistent)    │  │ (Persistent)    │         │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Headless Service: loki-ingester (clusterIP: None)                             │
│  Enables direct pod-to-pod communication via DNS                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### StatefulSet Example for Loki Ingester

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki-ingester
  namespace: monitoring
spec:
  serviceName: loki-ingester  # Headless service name
  replicas: 3
  podManagementPolicy: Parallel  # Start all pods simultaneously
  
  selector:
    matchLabels:
      app: loki
      component: ingester
  
  # Update strategy
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0  # Update all pods (set higher to canary)
  
  template:
    metadata:
      labels:
        app: loki
        component: ingester
    spec:
      terminationGracePeriodSeconds: 300  # Allow time for graceful shutdown
      
      containers:
        - name: ingester
          image: grafana/loki:2.9.0
          args:
            - -target=ingester
            - -config.file=/etc/loki/config.yaml
          
          ports:
            - name: http
              containerPort: 3100
            - name: grpc
              containerPort: 9095
            - name: memberlist
              containerPort: 7946
          
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
            limits:
              memory: "4Gi"
              cpu: "2"
          
          # Probes for lifecycle management
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          
          livenessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 60
            periodSeconds: 30
          
          # Lifecycle hooks
          lifecycle:
            preStop:
              httpGet:
                path: /ingester/shutdown
                port: http
          
          volumeMounts:
            - name: data
              mountPath: /var/loki
            - name: config
              mountPath: /etc/loki
      
      volumes:
        - name: config
          configMap:
            name: loki-config
  
  # Volume claim templates for persistent storage
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi

---
# Headless service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: loki-ingester
  namespace: monitoring
spec:
  clusterIP: None  # Headless
  selector:
    app: loki
    component: ingester
  ports:
    - name: http
      port: 3100
    - name: grpc
      port: 9095
    - name: memberlist
      port: 7946
```

#### StatefulSet Operations

```bash
# Scale StatefulSet (pods created/deleted in order)
kubectl scale statefulset loki-ingester --replicas=5 -n monitoring

# Rolling update (respects podManagementPolicy)
kubectl rollout restart statefulset loki-ingester -n monitoring

# Check rollout status
kubectl rollout status statefulset loki-ingester -n monitoring

# Canary deployment using partition
kubectl patch statefulset loki-ingester -n monitoring \
  -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":2}}}}'
# Only pods with ordinal >= 2 will be updated

# Force delete stuck pod (use with caution)
kubectl delete pod loki-ingester-1 -n monitoring --force --grace-period=0
```

### Operators and Custom Resources

Kubernetes Operators extend the platform with domain-specific knowledge, automating complex operational tasks.

#### Operator Pattern Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OPERATOR PATTERN                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Custom Resource Definition (CRD)                      │   │
│  │                                                                          │   │
│  │  apiVersion: loki.grafana.com/v1                                        │   │
│  │  kind: LokiStack                                                        │   │
│  │  metadata:                                                              │   │
│  │    name: production                                                     │   │
│  │  spec:                                                                  │   │
│  │    size: 1x.medium                                                      │   │
│  │    storage:                                                             │   │
│  │      type: s3                                                           │   │
│  │      bucket: loki-data                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    │ Watch                                      │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Operator Controller                              │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │   Watch     │───▶│  Reconcile  │───▶│   Update    │                  │   │
│  │  │   Events    │    │   Logic     │    │   Status    │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  │                            │                                             │   │
│  │                            ▼                                             │   │
│  │                    Create/Update/Delete                                  │   │
│  │                    Kubernetes Resources                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Managed Resources                                   │   │
│  │                                                                          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐               │   │
│  │  │StatefulSet│ │ Services  │ │ ConfigMaps│ │  Secrets  │               │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Custom Resource Definition Example

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: lokistacks.loki.grafana.com
spec:
  group: loki.grafana.com
  names:
    kind: LokiStack
    listKind: LokiStackList
    plural: lokistacks
    singular: lokistack
    shortNames:
      - loki
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required:
                - size
                - storage
              properties:
                size:
                  type: string
                  enum: ["1x.extra-small", "1x.small", "1x.medium", "1x.large"]
                storage:
                  type: object
                  required:
                    - type
                  properties:
                    type:
                      type: string
                      enum: ["s3", "gcs", "azure"]
                    bucket:
                      type: string
                    region:
                      type: string
                replication:
                  type: integer
                  minimum: 1
                  maximum: 5
                  default: 3
            status:
              type: object
              properties:
                conditions:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                      status:
                        type: string
                      lastTransitionTime:
                        type: string
                        format: date-time
                      reason:
                        type: string
                      message:
                        type: string
      subresources:
        status: {}
      additionalPrinterColumns:
        - name: Size
          type: string
          jsonPath: .spec.size
        - name: Storage
          type: string
          jsonPath: .spec.storage.type
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
```

#### Operator Controller Implementation (Go)

```go
package controllers

import (
    "context"
    "fmt"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    lokiv1 "github.com/grafana/loki-operator/api/v1"
)

// LokiStackReconciler reconciles a LokiStack object
type LokiStackReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// Reconcile implements the reconciliation loop
func (r *LokiStackReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)
    
    // Fetch the LokiStack instance
    lokiStack := &lokiv1.LokiStack{}
    if err := r.Get(ctx, req.NamespacedName, lokiStack); err != nil {
        if errors.IsNotFound(err) {
            // Object deleted, nothing to do
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }
    
    logger.Info("Reconciling LokiStack", "name", lokiStack.Name)
    
    // Reconcile each component
    if err := r.reconcileIngester(ctx, lokiStack); err != nil {
        return ctrl.Result{}, err
    }
    
    if err := r.reconcileDistributor(ctx, lokiStack); err != nil {
        return ctrl.Result{}, err
    }
    
    if err := r.reconcileQuerier(ctx, lokiStack); err != nil {
        return ctrl.Result{}, err
    }
    
    // Update status
    lokiStack.Status.Conditions = append(lokiStack.Status.Conditions, metav1.Condition{
        Type:               "Ready",
        Status:             metav1.ConditionTrue,
        LastTransitionTime: metav1.Now(),
        Reason:             "ReconcileSuccess",
        Message:            "All components reconciled successfully",
    })
    
    if err := r.Status().Update(ctx, lokiStack); err != nil {
        return ctrl.Result{}, err
    }
    
    return ctrl.Result{}, nil
}

func (r *LokiStackReconciler) reconcileIngester(ctx context.Context, ls *lokiv1.LokiStack) error {
    // Define desired StatefulSet
    desired := &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      fmt.Sprintf("%s-ingester", ls.Name),
            Namespace: ls.Namespace,
        },
        Spec: appsv1.StatefulSetSpec{
            Replicas: int32Ptr(r.getIngesterReplicas(ls.Spec.Size)),
            // ... rest of spec
        },
    }
    
    // Set owner reference for garbage collection
    if err := ctrl.SetControllerReference(ls, desired, r.Scheme); err != nil {
        return err
    }
    
    // Create or update
    existing := &appsv1.StatefulSet{}
    err := r.Get(ctx, client.ObjectKeyFromObject(desired), existing)
    if errors.IsNotFound(err) {
        return r.Create(ctx, desired)
    } else if err != nil {
        return err
    }
    
    // Update if needed
    existing.Spec = desired.Spec
    return r.Update(ctx, existing)
}

// SetupWithManager sets up the controller with the Manager
func (r *LokiStackReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&lokiv1.LokiStack{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Owns(&corev1.ConfigMap{}).
        Complete(r)
}

func int32Ptr(i int32) *int32 { return &i }

func (r *LokiStackReconciler) getIngesterReplicas(size string) int32 {
    switch size {
    case "1x.extra-small":
        return 1
    case "1x.small":
        return 2
    case "1x.medium":
        return 3
    case "1x.large":
        return 5
    default:
        return 3
    }
}
```

### Resource Management and Autoscaling

Effective resource management ensures applications have the resources they need while optimizing cluster utilization.

#### Resource Requests and Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: loki-querier
spec:
  containers:
    - name: querier
      image: grafana/loki:2.9.0
      resources:
        # Requests: guaranteed resources for scheduling
        requests:
          memory: "512Mi"
          cpu: "250m"
          ephemeral-storage: "1Gi"
        # Limits: maximum resources allowed
        limits:
          memory: "2Gi"
          cpu: "2"
          ephemeral-storage: "5Gi"
```

#### Quality of Service (QoS) Classes

| QoS Class | Condition | Eviction Priority |
|-----------|-----------|-------------------|
| **Guaranteed** | requests == limits for all containers | Lowest (last to evict) |
| **Burstable** | At least one request or limit set | Medium |
| **BestEffort** | No requests or limits | Highest (first to evict) |

#### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: loki-querier-hpa
  namespace: monitoring
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: loki-querier
  
  minReplicas: 2
  maxReplicas: 10
  
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    
    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    
    # Custom metrics (e.g., queue depth)
    - type: Pods
      pods:
        metric:
          name: loki_querier_queue_length
        target:
          type: AverageValue
          averageValue: "100"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

#### Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: loki-ingester-vpa
  namespace: monitoring
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: loki-ingester
  
  updatePolicy:
    updateMode: "Auto"  # Auto, Recreate, Initial, Off
  
  resourcePolicy:
    containerPolicies:
      - containerName: ingester
        minAllowed:
          cpu: "100m"
          memory: "256Mi"
        maxAllowed:
          cpu: "4"
          memory: "8Gi"
        controlledResources: ["cpu", "memory"]
        controlledValues: RequestsAndLimits
```

### Network Policies and Service Mesh

Network policies control traffic flow between pods, implementing zero-trust networking.

#### Network Policy Example

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: loki-ingester-policy
  namespace: monitoring
spec:
  podSelector:
    matchLabels:
      app: loki
      component: ingester
  
  policyTypes:
    - Ingress
    - Egress
  
  ingress:
    # Allow from distributors
    - from:
        - podSelector:
            matchLabels:
              app: loki
              component: distributor
      ports:
        - protocol: TCP
          port: 9095  # gRPC
    
    # Allow from queriers
    - from:
        - podSelector:
            matchLabels:
              app: loki
              component: querier
      ports:
        - protocol: TCP
          port: 9095
    
    # Allow memberlist gossip from other ingesters
    - from:
        - podSelector:
            matchLabels:
              app: loki
              component: ingester
      ports:
        - protocol: TCP
          port: 7946
        - protocol: UDP
          port: 7946
    
    # Allow Prometheus scraping
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 3100
  
  egress:
    # Allow to object storage
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - protocol: TCP
          port: 443
    
    # Allow DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    
    # Allow memberlist to other ingesters
    - to:
        - podSelector:
            matchLabels:
              app: loki
              component: ingester
      ports:
        - protocol: TCP
          port: 7946
        - protocol: UDP
          port: 7946
```

### Debugging and Troubleshooting

Effective troubleshooting requires systematic approaches and familiarity with Kubernetes debugging tools.

#### Common Troubleshooting Commands

```bash
# Pod debugging
kubectl describe pod loki-ingester-0 -n monitoring
kubectl logs loki-ingester-0 -n monitoring --previous  # Previous container logs
kubectl logs loki-ingester-0 -n monitoring -f          # Follow logs
kubectl logs loki-ingester-0 -n monitoring --since=1h  # Last hour

# Multi-container pods
kubectl logs loki-ingester-0 -n monitoring -c ingester
kubectl logs loki-ingester-0 -n monitoring --all-containers

# Execute commands in pod
kubectl exec -it loki-ingester-0 -n monitoring -- /bin/sh
kubectl exec loki-ingester-0 -n monitoring -- cat /etc/loki/config.yaml

# Port forwarding for debugging
kubectl port-forward pod/loki-ingester-0 3100:3100 -n monitoring
kubectl port-forward svc/loki-querier 3100:3100 -n monitoring

# Copy files from pod
kubectl cp monitoring/loki-ingester-0:/var/loki/wal ./wal-backup

# Resource usage
kubectl top pods -n monitoring
kubectl top nodes

# Events (sorted by time)
kubectl get events -n monitoring --sort-by='.lastTimestamp'
```

#### Debugging Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TROUBLESHOOTING FLOWCHART                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Pod not starting?                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. kubectl describe pod <name> - Check Events section                  │   │
│  │  2. Common issues:                                                       │   │
│  │     - ImagePullBackOff: Image doesn't exist or auth failed              │   │
│  │     - Pending: Insufficient resources or node selector mismatch         │   │
│  │     - CrashLoopBackOff: Container crashing (check logs)                 │   │
│  │     - Init:Error: Init container failed                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Pod crashing?                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. kubectl logs <pod> --previous - Check crash logs                    │   │
│  │  2. Common issues:                                                       │   │
│  │     - OOMKilled: Increase memory limits                                 │   │
│  │     - Config error: Check ConfigMap/Secret mounts                       │   │
│  │     - Dependency missing: Check init containers, service dependencies   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Service not reachable?                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. kubectl get endpoints <service> - Check if endpoints exist          │   │
│  │  2. kubectl describe svc <service> - Check selector matches pods        │   │
│  │  3. Test from within cluster:                                           │   │
│  │     kubectl run debug --rm -it --image=busybox -- wget -qO- <svc>:port │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Ephemeral Debug Containers

```bash
# Attach debug container to running pod (K8s 1.23+)
kubectl debug -it loki-ingester-0 -n monitoring --image=busybox --target=ingester

# Debug with network tools
kubectl debug -it loki-ingester-0 -n monitoring \
  --image=nicolaka/netshoot --target=ingester

# Create debug pod with node access
kubectl debug node/worker-1 -it --image=busybox
```

#### Resource Debugging

```bash
# Check resource quotas
kubectl describe resourcequota -n monitoring

# Check limit ranges
kubectl describe limitrange -n monitoring

# Check PVC status
kubectl get pvc -n monitoring
kubectl describe pvc data-loki-ingester-0 -n monitoring

# Check storage class
kubectl get storageclass
kubectl describe storageclass fast-ssd
```

---

## Microservices Architecture Patterns

Microservices architecture decomposes applications into loosely coupled services. Understanding these patterns is essential for building and operating distributed systems like Loki.

### Service Decomposition Patterns

#### Domain-Driven Decomposition

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOKI MICROSERVICES DECOMPOSITION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Bounded Contexts:                                                              │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Write Path    │  │   Read Path     │  │   Storage       │                │
│  │                 │  │                 │  │                 │                │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │                │
│  │  │Distributor│  │  │  │  Query    │  │  │  │ Compactor │  │                │
│  │  └───────────┘  │  │  │ Frontend  │  │  │  └───────────┘  │                │
│  │  ┌───────────┐  │  │  └───────────┘  │  │  ┌───────────┐  │                │
│  │  │ Ingester  │  │  │  ┌───────────┐  │  │  │  Index    │  │                │
│  │  └───────────┘  │  │  │  Querier  │  │  │  │ Gateway   │  │                │
│  │                 │  │  └───────────┘  │  │  └───────────┘  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                  │
│  Each bounded context:                                                          │
│  - Has clear responsibilities                                                   │
│  - Can be scaled independently                                                  │
│  - Communicates via well-defined APIs                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Decomposition Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **By Business Capability** | Services aligned with business functions | Clear business domains |
| **By Subdomain** | DDD subdomains become services | Complex domain models |
| **By Data** | Services own their data | Strong data isolation needed |
| **Strangler Fig** | Gradually replace monolith | Legacy modernization |

### Inter-Service Communication

#### gRPC Communication

gRPC is the preferred protocol for internal service communication in high-performance systems.

```go
// Proto definition for Loki push service
syntax = "proto3";

package logproto;

service Pusher {
    rpc Push(PushRequest) returns (PushResponse);
}

message PushRequest {
    repeated StreamAdapter streams = 1;
}

message StreamAdapter {
    string labels = 1;
    repeated EntryAdapter entries = 2;
}

message EntryAdapter {
    google.protobuf.Timestamp timestamp = 1;
    string line = 2;
}

message PushResponse {}
```

```go
// gRPC server implementation
package main

import (
    "context"
    "log"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/keepalive"
    
    "github.com/grafana/loki/pkg/logproto"
)

type PusherServer struct {
    logproto.UnimplementedPusherServer
    ingester Ingester
}

func (s *PusherServer) Push(ctx context.Context, req *logproto.PushRequest) (*logproto.PushResponse, error) {
    for _, stream := range req.Streams {
        if err := s.ingester.Push(ctx, stream); err != nil {
            return nil, err
        }
    }
    return &logproto.PushResponse{}, nil
}

func main() {
    lis, err := net.Listen("tcp", ":9095")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    
    // Configure gRPC server with production settings
    server := grpc.NewServer(
        grpc.MaxRecvMsgSize(100*1024*1024),  // 100MB max message
        grpc.MaxSendMsgSize(100*1024*1024),
        grpc.KeepaliveParams(keepalive.ServerParameters{
            MaxConnectionIdle:     15 * time.Minute,
            MaxConnectionAge:      30 * time.Minute,
            MaxConnectionAgeGrace: 5 * time.Minute,
            Time:                  5 * time.Minute,
            Timeout:               1 * time.Minute,
        }),
        grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
            MinTime:             1 * time.Minute,
            PermitWithoutStream: true,
        }),
    )
    
    logproto.RegisterPusherServer(server, &PusherServer{})
    
    log.Printf("gRPC server listening on :9095")
    if err := server.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

#### gRPC Client with Connection Pooling

```go
// gRPC client with connection management
package main

import (
    "context"
    "sync"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    "google.golang.org/grpc/keepalive"
    
    "github.com/grafana/loki/pkg/logproto"
)

// IngesterPool manages connections to multiple ingesters
type IngesterPool struct {
    clients map[string]logproto.PusherClient
    conns   map[string]*grpc.ClientConn
    mu      sync.RWMutex
}

func NewIngesterPool() *IngesterPool {
    return &IngesterPool{
        clients: make(map[string]logproto.PusherClient),
        conns:   make(map[string]*grpc.ClientConn),
    }
}

func (p *IngesterPool) GetClient(addr string) (logproto.PusherClient, error) {
    p.mu.RLock()
    if client, ok := p.clients[addr]; ok {
        p.mu.RUnlock()
        return client, nil
    }
    p.mu.RUnlock()
    
    // Create new connection
    p.mu.Lock()
    defer p.mu.Unlock()
    
    // Double-check after acquiring write lock
    if client, ok := p.clients[addr]; ok {
        return client, nil
    }
    
    conn, err := grpc.Dial(addr,
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithDefaultCallOptions(
            grpc.MaxCallRecvMsgSize(100*1024*1024),
            grpc.MaxCallSendMsgSize(100*1024*1024),
        ),
        grpc.WithKeepaliveParams(keepalive.ClientParameters{
            Time:                10 * time.Second,
            Timeout:             3 * time.Second,
            PermitWithoutStream: true,
        }),
    )
    if err != nil {
        return nil, err
    }
    
    client := logproto.NewPusherClient(conn)
    p.clients[addr] = client
    p.conns[addr] = conn
    
    return client, nil
}

func (p *IngesterPool) Close() {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    for _, conn := range p.conns {
        conn.Close()
    }
}
```

#### REST API Design

For external APIs and simpler integrations, REST remains valuable.

```go
// REST API with proper patterns
package main

import (
    "encoding/json"
    "net/http"
    "time"

    "github.com/gorilla/mux"
)

// API response structures
type QueryResponse struct {
    Status string      `json:"status"`
    Data   QueryResult `json:"data"`
}

type QueryResult struct {
    ResultType string   `json:"resultType"`
    Result     []Stream `json:"result"`
}

type Stream struct {
    Labels map[string]string `json:"stream"`
    Values [][]string        `json:"values"`
}

// Error response
type ErrorResponse struct {
    Status    string `json:"status"`
    ErrorType string `json:"errorType"`
    Error     string `json:"error"`
}

// Handler with proper error handling
func (s *Server) QueryHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // Parse query parameters
    query := r.URL.Query().Get("query")
    if query == "" {
        writeError(w, http.StatusBadRequest, "bad_request", "query parameter required")
        return
    }
    
    start, err := parseTime(r.URL.Query().Get("start"))
    if err != nil {
        writeError(w, http.StatusBadRequest, "bad_request", "invalid start time")
        return
    }
    
    end, err := parseTime(r.URL.Query().Get("end"))
    if err != nil {
        writeError(w, http.StatusBadRequest, "bad_request", "invalid end time")
        return
    }
    
    // Execute query
    result, err := s.querier.Query(ctx, query, start, end)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "internal_error", err.Error())
        return
    }
    
    // Write response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(QueryResponse{
        Status: "success",
        Data:   result,
    })
}

func writeError(w http.ResponseWriter, status int, errType, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(ErrorResponse{
        Status:    "error",
        ErrorType: errType,
        Error:     message,
    })
}

func setupRoutes() *mux.Router {
    r := mux.NewRouter()
    
    // API versioning
    api := r.PathPrefix("/loki/api/v1").Subrouter()
    
    // Query endpoints
    api.HandleFunc("/query", s.QueryHandler).Methods("GET")
    api.HandleFunc("/query_range", s.QueryRangeHandler).Methods("GET")
    api.HandleFunc("/labels", s.LabelsHandler).Methods("GET")
    api.HandleFunc("/label/{name}/values", s.LabelValuesHandler).Methods("GET")
    
    // Push endpoint
    api.HandleFunc("/push", s.PushHandler).Methods("POST")
    
    // Health endpoints
    r.HandleFunc("/ready", s.ReadyHandler).Methods("GET")
    r.HandleFunc("/metrics", promhttp.Handler().ServeHTTP).Methods("GET")
    
    return r
}
```

### Circuit Breakers and Resilience

Circuit breakers prevent cascading failures by failing fast when downstream services are unhealthy.

#### Circuit Breaker Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CIRCUIT BREAKER STATES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐         Failure threshold         ┌─────────────┐             │
│  │   CLOSED    │ ─────────── exceeded ───────────▶ │    OPEN     │             │
│  │  (Normal)   │                                   │  (Failing)  │             │
│  └──────┬──────┘                                   └──────┬──────┘             │
│         │                                                 │                     │
│         │ Success                              Timeout    │                     │
│         │                                      expires    │                     │
│         │                                                 │                     │
│         │         ┌─────────────┐                        │                     │
│         │         │ HALF-OPEN   │◀───────────────────────┘                     │
│         │         │  (Testing)  │                                              │
│         │         └──────┬──────┘                                              │
│         │                │                                                      │
│         │    Success     │    Failure                                          │
│         │◀───────────────┤────────────────────────────────▶ Back to OPEN       │
│         │                │                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Circuit Breaker Implementation

```go
package resilience

import (
    "context"
    "errors"
    "sync"
    "time"
)

var (
    ErrCircuitOpen = errors.New("circuit breaker is open")
)

type State int

const (
    StateClosed State = iota
    StateOpen
    StateHalfOpen
)

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
    name          string
    maxFailures   int
    timeout       time.Duration
    halfOpenMax   int
    
    mu            sync.RWMutex
    state         State
    failures      int
    successes     int
    lastFailure   time.Time
    halfOpenCalls int
}

func NewCircuitBreaker(name string, maxFailures int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        name:        name,
        maxFailures: maxFailures,
        timeout:     timeout,
        halfOpenMax: 3,
        state:       StateClosed,
    }
}

// Execute runs the given function with circuit breaker protection
func (cb *CircuitBreaker) Execute(ctx context.Context, fn func(context.Context) error) error {
    if !cb.allowRequest() {
        return ErrCircuitOpen
    }
    
    err := fn(ctx)
    cb.recordResult(err)
    return err
}

func (cb *CircuitBreaker) allowRequest() bool {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    switch cb.state {
    case StateClosed:
        return true
    case StateOpen:
        // Check if timeout has passed
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = StateHalfOpen
            cb.halfOpenCalls = 0
            return true
        }
        return false
    case StateHalfOpen:
        // Allow limited requests in half-open state
        if cb.halfOpenCalls < cb.halfOpenMax {
            cb.halfOpenCalls++
            return true
        }
        return false
    }
    return false
}

func (cb *CircuitBreaker) recordResult(err error) {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        cb.successes = 0
        
        if cb.state == StateHalfOpen || cb.failures >= cb.maxFailures {
            cb.state = StateOpen
        }
    } else {
        cb.successes++
        cb.failures = 0
        
        if cb.state == StateHalfOpen && cb.successes >= cb.halfOpenMax {
            cb.state = StateClosed
        }
    }
}

// State returns the current circuit breaker state
func (cb *CircuitBreaker) State() State {
    cb.mu.RLock()
    defer cb.mu.RUnlock()
    return cb.state
}
```

#### Retry with Exponential Backoff

```go
package resilience

import (
    "context"
    "math"
    "math/rand"
    "time"
)

// RetryConfig configures retry behavior
type RetryConfig struct {
    MaxRetries     int
    InitialBackoff time.Duration
    MaxBackoff     time.Duration
    Multiplier     float64
    Jitter         float64  // 0.0 to 1.0
}

func DefaultRetryConfig() RetryConfig {
    return RetryConfig{
        MaxRetries:     3,
        InitialBackoff: 100 * time.Millisecond,
        MaxBackoff:     10 * time.Second,
        Multiplier:     2.0,
        Jitter:         0.2,
    }
}

// RetryWithBackoff retries the function with exponential backoff
func RetryWithBackoff(ctx context.Context, cfg RetryConfig, fn func(context.Context) error) error {
    var lastErr error
    backoff := cfg.InitialBackoff
    
    for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
        if err := fn(ctx); err != nil {
            lastErr = err
            
            // Don't sleep after last attempt
            if attempt == cfg.MaxRetries {
                break
            }
            
            // Calculate backoff with jitter
            sleep := backoff
            if cfg.Jitter > 0 {
                jitter := float64(sleep) * cfg.Jitter * (rand.Float64()*2 - 1)
                sleep = time.Duration(float64(sleep) + jitter)
            }
            
            // Wait or context cancellation
            select {
            case <-ctx.Done():
                return ctx.Err()
            case <-time.After(sleep):
            }
            
            // Increase backoff for next attempt
            backoff = time.Duration(float64(backoff) * cfg.Multiplier)
            if backoff > cfg.MaxBackoff {
                backoff = cfg.MaxBackoff
            }
        } else {
            return nil
        }
    }
    
    return lastErr
}

// Bulkhead limits concurrent requests to a resource
type Bulkhead struct {
    sem chan struct{}
}

func NewBulkhead(maxConcurrent int) *Bulkhead {
    return &Bulkhead{
        sem: make(chan struct{}, maxConcurrent),
    }
}

func (b *Bulkhead) Execute(ctx context.Context, fn func(context.Context) error) error {
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return fn(ctx)
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

### Distributed Tracing Integration

Distributed tracing provides visibility into request flow across services, essential for debugging microservices.

> **Related Resource**: For tracing fundamentals, see [LGTM Stack - Tempo](../../shared-concepts/lgtm-stack.md#tempo-distributed-tracing)

#### OpenTelemetry Integration

```go
package tracing

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

// InitTracer initializes OpenTelemetry tracing
func InitTracer(ctx context.Context, serviceName, tempoEndpoint string) (*sdktrace.TracerProvider, error) {
    // Create OTLP exporter
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint(tempoEndpoint),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }
    
    // Create resource with service information
    res, err := resource.Merge(
        resource.Default(),
        resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName(serviceName),
            semconv.ServiceVersion("1.0.0"),
            attribute.String("environment", "production"),
        ),
    )
    if err != nil {
        return nil, err
    }
    
    // Create tracer provider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.ParentBased(
            sdktrace.TraceIDRatioBased(0.1), // Sample 10% of traces
        )),
    )
    
    // Set global tracer provider
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))
    
    return tp, nil
}

// TracingMiddleware adds tracing to HTTP handlers
func TracingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tracer := otel.Tracer("http-server")
        
        // Extract context from incoming request
        ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))
        
        // Start span
        ctx, span := tracer.Start(ctx, r.URL.Path,
            trace.WithSpanKind(trace.SpanKindServer),
            trace.WithAttributes(
                semconv.HTTPMethod(r.Method),
                semconv.HTTPURL(r.URL.String()),
                semconv.HTTPUserAgent(r.UserAgent()),
            ),
        )
        defer span.End()
        
        // Wrap response writer to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        
        // Call next handler
        next.ServeHTTP(wrapped, r.WithContext(ctx))
        
        // Record response attributes
        span.SetAttributes(semconv.HTTPStatusCode(wrapped.statusCode))
        if wrapped.statusCode >= 400 {
            span.SetStatus(codes.Error, http.StatusText(wrapped.statusCode))
        }
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (w *responseWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}

// TracedHTTPClient creates an HTTP client with tracing
func TracedHTTPClient() *http.Client {
    return &http.Client{
        Transport: &tracingTransport{
            base: http.DefaultTransport,
        },
    }
}

type tracingTransport struct {
    base http.RoundTripper
}

func (t *tracingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
    tracer := otel.Tracer("http-client")
    
    ctx, span := tracer.Start(req.Context(), req.URL.Path,
        trace.WithSpanKind(trace.SpanKindClient),
        trace.WithAttributes(
            semconv.HTTPMethod(req.Method),
            semconv.HTTPURL(req.URL.String()),
        ),
    )
    defer span.End()
    
    // Inject context into outgoing request
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))
    
    resp, err := t.base.RoundTrip(req.WithContext(ctx))
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return nil, err
    }
    
    span.SetAttributes(semconv.HTTPStatusCode(resp.StatusCode))
    return resp, nil
}
```

#### Trace Context Propagation

```go
// Propagating trace context through gRPC
package tracing

import (
    "context"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/propagation"
    "google.golang.org/grpc"
    "google.golang.org/grpc/metadata"
)

// UnaryClientInterceptor propagates trace context in gRPC calls
func UnaryClientInterceptor() grpc.UnaryClientInterceptor {
    return func(ctx context.Context, method string, req, reply interface{},
        cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
        
        tracer := otel.Tracer("grpc-client")
        ctx, span := tracer.Start(ctx, method)
        defer span.End()
        
        // Inject trace context into metadata
        md, ok := metadata.FromOutgoingContext(ctx)
        if !ok {
            md = metadata.New(nil)
        }
        
        carrier := &metadataCarrier{md: md}
        otel.GetTextMapPropagator().Inject(ctx, carrier)
        ctx = metadata.NewOutgoingContext(ctx, md)
        
        err := invoker(ctx, method, req, reply, cc, opts...)
        if err != nil {
            span.RecordError(err)
        }
        return err
    }
}

// UnaryServerInterceptor extracts trace context from gRPC calls
func UnaryServerInterceptor() grpc.UnaryServerInterceptor {
    return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo,
        handler grpc.UnaryHandler) (interface{}, error) {
        
        // Extract trace context from metadata
        md, ok := metadata.FromIncomingContext(ctx)
        if ok {
            carrier := &metadataCarrier{md: md}
            ctx = otel.GetTextMapPropagator().Extract(ctx, carrier)
        }
        
        tracer := otel.Tracer("grpc-server")
        ctx, span := tracer.Start(ctx, info.FullMethod)
        defer span.End()
        
        resp, err := handler(ctx, req)
        if err != nil {
            span.RecordError(err)
        }
        return resp, err
    }
}

type metadataCarrier struct {
    md metadata.MD
}

func (c *metadataCarrier) Get(key string) string {
    values := c.md.Get(key)
    if len(values) > 0 {
        return values[0]
    }
    return ""
}

func (c *metadataCarrier) Set(key, value string) {
    c.md.Set(key, value)
}

func (c *metadataCarrier) Keys() []string {
    keys := make([]string, 0, len(c.md))
    for k := range c.md {
        keys = append(keys, k)
    }
    return keys
}
```

---

## Cloud Platforms

Understanding cloud platforms is essential for deploying and operating distributed systems at scale. This section covers AWS, GCP, and Azure fundamentals relevant to Loki and observability workloads.

### Cloud Platform Fundamentals

#### Multi-Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-CLOUD ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Application Layer                                 │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │    Loki     │    │   Grafana   │    │    Mimir    │                  │   │
│  │  │  (Logs)     │    │   (UI)      │    │  (Metrics)  │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                    ┌───────────────┼───────────────┐                           │
│                    │               │               │                           │
│                    ▼               ▼               ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Abstraction Layer                                   │   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │ Object Store│    │ Kubernetes  │    │   IAM/Auth  │                  │   │
│  │  │  Interface  │    │  Interface  │    │  Interface  │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│         ┌──────────────────────────┼──────────────────────────┐                │
│         │                          │                          │                │
│         ▼                          ▼                          ▼                │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│  │     AWS     │           │     GCP     │           │    Azure    │          │
│  │             │           │             │           │             │          │
│  │  S3, EKS,   │           │  GCS, GKE,  │           │ Blob, AKS,  │          │
│  │  IAM        │           │  IAM        │           │  AAD        │          │
│  └─────────────┘           └─────────────┘           └─────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Object Storage Patterns

Object storage is the backbone of modern observability systems, providing cost-effective, durable storage for logs, metrics, and traces.

#### Cloud Object Storage Comparison

| Feature | AWS S3 | GCP GCS | Azure Blob |
|---------|--------|---------|------------|
| **Durability** | 99.999999999% (11 9s) | 99.999999999% | 99.999999999% |
| **Availability** | 99.99% (Standard) | 99.99% (Standard) | 99.99% (Hot) |
| **Storage Classes** | Standard, IA, Glacier | Standard, Nearline, Coldline, Archive | Hot, Cool, Archive |
| **Consistency** | Strong (2020+) | Strong | Strong |
| **Max Object Size** | 5 TB | 5 TB | 190.7 TB (block blob) |

#### Object Storage Client Implementation

```go
package storage

import (
    "context"
    "fmt"
    "io"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

// ObjectStore provides a cloud-agnostic interface for object storage
type ObjectStore interface {
    Put(ctx context.Context, key string, data io.Reader, size int64) error
    Get(ctx context.Context, key string) (io.ReadCloser, error)
    Delete(ctx context.Context, key string) error
    List(ctx context.Context, prefix string) ([]string, error)
}

// S3Store implements ObjectStore for AWS S3
type S3Store struct {
    client *s3.Client
    bucket string
}

func NewS3Store(ctx context.Context, bucket, region string) (*S3Store, error) {
    cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
    if err != nil {
        return nil, fmt.Errorf("loading AWS config: %w", err)
    }
    
    return &S3Store{
        client: s3.NewFromConfig(cfg),
        bucket: bucket,
    }, nil
}

func (s *S3Store) Put(ctx context.Context, key string, data io.Reader, size int64) error {
    _, err := s.client.PutObject(ctx, &s3.PutObjectInput{
        Bucket:        aws.String(s.bucket),
        Key:           aws.String(key),
        Body:          data,
        ContentLength: aws.Int64(size),
    })
    return err
}

func (s *S3Store) Get(ctx context.Context, key string) (io.ReadCloser, error) {
    result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    if err != nil {
        return nil, err
    }
    return result.Body, nil
}

func (s *S3Store) Delete(ctx context.Context, key string) error {
    _, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    return err
}

func (s *S3Store) List(ctx context.Context, prefix string) ([]string, error) {
    var keys []string
    paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
        Bucket: aws.String(s.bucket),
        Prefix: aws.String(prefix),
    })
    
    for paginator.HasMorePages() {
        page, err := paginator.NextPage(ctx)
        if err != nil {
            return nil, err
        }
        for _, obj := range page.Contents {
            keys = append(keys, *obj.Key)
        }
    }
    return keys, nil
}
```

#### Storage Lifecycle Policies

```yaml
# AWS S3 Lifecycle Policy for Loki data
# Terraform configuration
resource "aws_s3_bucket_lifecycle_configuration" "loki_lifecycle" {
  bucket = aws_s3_bucket.loki_data.id

  rule {
    id     = "loki-chunks-lifecycle"
    status = "Enabled"

    filter {
      prefix = "chunks/"
    }

    # Move to Infrequent Access after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete after 365 days
    expiration {
      days = 365
    }
  }

  rule {
    id     = "loki-index-lifecycle"
    status = "Enabled"

    filter {
      prefix = "index/"
    }

    # Keep index in standard storage longer for query performance
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 365
    }
  }
}
```

### Managed Kubernetes Services

Each cloud provider offers managed Kubernetes with unique features and integrations.

#### Managed Kubernetes Comparison

| Feature | AWS EKS | GCP GKE | Azure AKS |
|---------|---------|---------|-----------|
| **Control Plane Cost** | $0.10/hour | Free (Autopilot: per pod) | Free |
| **Node Auto-provisioning** | Karpenter, Cluster Autoscaler | Autopilot, NAP | Cluster Autoscaler |
| **Max Nodes** | 5,000 | 15,000 | 5,000 |
| **GPU Support** | Yes | Yes | Yes |
| **Spot/Preemptible** | Spot Instances | Spot VMs | Spot VMs |
| **Private Clusters** | Yes | Yes | Yes |

#### EKS Configuration for Loki

```yaml
# eksctl cluster configuration
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: loki-cluster
  region: us-west-2
  version: "1.28"

vpc:
  cidr: 10.0.0.0/16
  nat:
    gateway: HighlyAvailable

iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        name: loki
        namespace: monitoring
      attachPolicyARNs:
        - arn:aws:iam::aws:policy/AmazonS3FullAccess
      wellKnownPolicies:
        autoScaler: true

managedNodeGroups:
  - name: loki-ingesters
    instanceType: r6i.2xlarge
    desiredCapacity: 3
    minSize: 3
    maxSize: 10
    volumeSize: 100
    volumeType: gp3
    labels:
      workload: loki-ingester
    taints:
      - key: dedicated
        value: loki-ingester
        effect: NoSchedule
    iam:
      withAddonPolicies:
        ebs: true
        efs: true

  - name: loki-queriers
    instanceType: c6i.2xlarge
    desiredCapacity: 2
    minSize: 2
    maxSize: 20
    spot: true
    labels:
      workload: loki-querier

addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: aws-ebs-csi-driver
    version: latest
```

#### GKE Configuration for Loki

```yaml
# Terraform GKE configuration
resource "google_container_cluster" "loki" {
  name     = "loki-cluster"
  location = "us-central1"
  
  # Use regional cluster for HA
  node_locations = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c",
  ]

  # Enable Autopilot for simplified operations
  enable_autopilot = false  # Set true for Autopilot mode

  # Workload Identity for secure GCS access
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Network configuration
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Maintenance window
  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T09:00:00Z"
      end_time   = "2024-01-01T17:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }
}

resource "google_container_node_pool" "loki_ingesters" {
  name       = "loki-ingesters"
  cluster    = google_container_cluster.loki.name
  location   = google_container_cluster.loki.location
  
  initial_node_count = 3

  autoscaling {
    min_node_count = 3
    max_node_count = 10
  }

  node_config {
    machine_type = "n2-highmem-8"
    disk_size_gb = 100
    disk_type    = "pd-ssd"

    labels = {
      workload = "loki-ingester"
    }

    taint {
      key    = "dedicated"
      value  = "loki-ingester"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
```

### Cost Optimization Strategies

Optimizing cloud costs is essential for operating observability systems at scale.

#### Cost Optimization Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COST OPTIMIZATION PILLARS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. RIGHT-SIZING                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Monitor actual resource utilization                                   │   │
│  │  • Use VPA recommendations for container sizing                          │   │
│  │  • Choose appropriate instance types for workload patterns               │   │
│  │  • Avoid over-provisioning "just in case"                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  2. SPOT/PREEMPTIBLE INSTANCES                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Use for stateless, fault-tolerant workloads (queriers)               │   │
│  │  • Implement graceful shutdown handling                                  │   │
│  │  • Mix with on-demand for baseline capacity                             │   │
│  │  • Savings: 60-90% vs on-demand                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  3. STORAGE TIERING                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Implement lifecycle policies for object storage                       │   │
│  │  • Move cold data to cheaper storage classes                            │   │
│  │  • Use appropriate retention policies                                    │   │
│  │  • Consider compression ratios                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  4. RESERVED CAPACITY                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Commit to 1-3 year reservations for baseline workloads               │   │
│  │  • Use Savings Plans (AWS) or CUDs (GCP) for flexibility                │   │
│  │  • Savings: 30-72% vs on-demand                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Cost-Optimized Loki Deployment

```yaml
# Kubernetes deployment with cost optimization
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki-querier
  namespace: monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: loki
      component: querier
  template:
    metadata:
      labels:
        app: loki
        component: querier
    spec:
      # Use spot instances for queriers (stateless)
      nodeSelector:
        node.kubernetes.io/lifecycle: spot
      
      # Tolerate spot instance interruption
      tolerations:
        - key: "kubernetes.io/spot"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
      
      # Spread across availability zones
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: loki
              component: querier
      
      # Graceful shutdown for spot interruption
      terminationGracePeriodSeconds: 30
      
      containers:
        - name: querier
          image: grafana/loki:2.9.0
          args:
            - -target=querier
            - -config.file=/etc/loki/config.yaml
          
          # Right-sized resources based on actual usage
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2"
          
          # Handle SIGTERM for graceful shutdown
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]
```

#### Cost Monitoring and Alerting

```go
// Cost tracking metrics for observability workloads
package cost

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Track storage costs
    storageBytes = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "loki_storage_bytes_total",
            Help: "Total bytes stored in object storage",
        },
        []string{"tenant", "storage_class"},
    )
    
    // Track ingestion volume
    ingestedBytes = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "loki_ingested_bytes_total",
            Help: "Total bytes ingested",
        },
        []string{"tenant"},
    )
    
    // Track query costs (compute)
    queryDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "loki_query_duration_seconds",
            Help:    "Query duration in seconds",
            Buckets: prometheus.ExponentialBuckets(0.1, 2, 10),
        },
        []string{"tenant", "query_type"},
    )
    
    // Track data scanned (affects cost)
    bytesScanned = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "loki_query_bytes_scanned_total",
            Help: "Total bytes scanned by queries",
        },
        []string{"tenant"},
    )
)

// Cost estimation based on cloud pricing
type CostEstimator struct {
    storagePrice    float64 // per GB/month
    ingestPrice     float64 // per GB
    queryPrice      float64 // per GB scanned
}

func NewCostEstimator(cloud string) *CostEstimator {
    switch cloud {
    case "aws":
        return &CostEstimator{
            storagePrice: 0.023,  // S3 Standard
            ingestPrice:  0.005,  // PUT requests
            queryPrice:   0.0004, // GET requests
        }
    case "gcp":
        return &CostEstimator{
            storagePrice: 0.020,  // GCS Standard
            ingestPrice:  0.005,
            queryPrice:   0.0004,
        }
    default:
        return &CostEstimator{}
    }
}

func (e *CostEstimator) EstimateMonthlyCost(
    storageGB, ingestGBPerDay, queryGBPerDay float64,
) float64 {
    storageCost := storageGB * e.storagePrice
    ingestCost := ingestGBPerDay * 30 * e.ingestPrice
    queryCost := queryGBPerDay * 30 * e.queryPrice
    
    return storageCost + ingestCost + queryCost
}
```

---

## Related Resources

### Shared Concepts
- [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md) - Core Kubernetes concepts and architecture
- [LGTM Stack](../../shared-concepts/lgtm-stack.md) - Loki, Grafana, Tempo, Mimir overview
- [Observability Principles](../../shared-concepts/observability-principles.md) - Metrics, logs, traces fundamentals

### Code Implementations
- [Go Distributed Systems](../../code-implementations/go-distributed-systems/) - Concurrency and distributed patterns
- [Kubernetes Configs](../../code-implementations/kubernetes-configs/) - Deployment manifests and operators
- [Observability Patterns](../../code-implementations/observability-patterns/) - Instrumentation examples

### Prerequisites
- [Fundamentals](./fundamentals.md) - Go basics, concurrency primitives, distributed systems foundations

### Next Steps
- [Advanced](./advanced.md) - Loki internals, distributed storage optimization, SRE practices
- [Questions](./questions/) - Technical interview questions and answers

---

## Summary

This intermediate guide covered essential topics for the Staff Backend Engineer role:

1. **Kafka at Scale**: Producer/consumer patterns, partitioning strategies, exactly-once semantics, consumer group management, and performance tuning for high-throughput data pipelines.

2. **Kubernetes Operations**: StatefulSets for stateful workloads, Operators and CRDs for automation, resource management and autoscaling, network policies, and debugging techniques.

3. **Microservices Architecture**: Service decomposition patterns, gRPC and REST communication, circuit breakers and resilience patterns, and distributed tracing integration.

4. **Cloud Platforms**: Multi-cloud architecture, object storage patterns across AWS/GCP/Azure, managed Kubernetes services, and cost optimization strategies.

These skills form the foundation for building and operating distributed systems like Loki at scale. The next step is the [Advanced guide](./advanced.md), which covers Loki internals, distributed storage optimization, and SRE practices.
