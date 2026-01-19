# Compliance & GRC Cloud Infrastructure - Technical Interview Questions

This directory contains implementations for multi-cloud compliance monitoring and real-time event processing.

## Directory Contents

### 01-multi-cloud-abstraction.ts
**Question:** How would you design a compliance monitoring system that works across AWS, Azure, and GCP without platform-specific code duplication?

**Key Concepts Demonstrated:**
- **Adapter pattern** for cloud provider abstraction
- **Resource normalization** to canonical types
- **Unified schema** with cloud-specific extensions
- **Feature flags** for gradual rollout
- **Single control evaluation** across all clouds

**Step-by-Step Implementation:**

1. **Adapter Pattern:**
   - Common interface for all providers
   - Provider-specific implementations
   - Resource normalization
   - Unified API

2. **Resource Normalization:**
   - Canonical resource types
   - Cloud-specific mapping
   - Unified properties
   - Extension points

3. **Unified Compliance:**
   - Single control evaluation
   - Multi-cloud aggregation
   - Cross-cloud reporting
   - Unified dashboard

**Interview Talking Points:**
- Adapter pattern: Reduce duplication, easy to extend
- Resource normalization: Unified model, cloud-specific details
- Multi-cloud: Single codebase, multiple providers

---

### 02-real-time-event-streams.ts
**Question:** Explain how you would implement real-time compliance monitoring using cloud-native event streams.

**Key Concepts Demonstrated:**
- **Event normalization** across cloud providers
- **Event enrichment** with context
- **Stateful evaluation** for correlated controls
- **Processing pipeline** with buffering
- **Lag monitoring** for observability

**Step-by-Step Implementation:**

1. **Event Normalization:**
   - Cloud-specific events → Standard format
   - Resource identification
   - Timestamp normalization
   - Event type mapping

2. **Event Enrichment:**
   - Add context (tags, ownership)
   - Historical data
   - Relationships
   - Metadata

3. **Stateful Evaluation:**
   - Correlated controls
   - State management
   - Event correlation
   - Temporal queries

4. **Processing Pipeline:**
   - Event ingestion
   - Normalization
   - Enrichment
   - Evaluation
   - Storage

**Interview Talking Points:**
- Event normalization: Unified processing, cloud abstraction
- Enrichment: Add context, improve evaluation
- Stateful evaluation: Handle correlated controls

---

## Common Patterns

### Multi-Cloud Patterns

1. **Adapter Pattern:**
   - Provider abstraction
   - Unified interface
   - Easy extension

2. **Resource Normalization:**
   - Canonical types
   - Cloud mapping
   - Unified properties

### Event Processing Patterns

1. **Event Normalization:**
   - Standard format
   - Provider mapping
   - Type conversion

2. **Event Enrichment:**
   - Context addition
   - Relationship resolution
   - Metadata enhancement

---

## Interview Preparation Tips

### When Discussing Multi-Cloud:

1. **Abstraction:**
   - How to abstract differences?
   - How to handle provider-specific features?
   - How to maintain consistency?

2. **Event Processing:**
   - How to normalize events?
   - How to handle different formats?
   - How to ensure ordering?

---

## Additional Resources

- [AWS EventBridge](https://aws.amazon.com/eventbridge/)
- [Azure Event Grid](https://azure.microsoft.com/en-us/services/event-grid/)
- [GCP Eventarc](https://cloud.google.com/eventarc)

