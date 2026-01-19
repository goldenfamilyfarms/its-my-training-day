# Node.js Technical Interview Questions - Platform Engineering

This directory contains senior-level Node.js implementations for compliance and GRC platform engineering. Each file demonstrates production-ready patterns, architectural decisions, and best practices for building scalable backend systems.

## Directory Contents

### 01-control-evidence-collection-api.ts
**Question:** Design a Node.js API that collects compliance evidence from multiple cloud providers (AWS, Azure, GCP) with rate limiting, error handling, and evidence validation.

**Key Concepts Demonstrated:**
- **Adapter Pattern** for cloud provider abstraction
- **Token Bucket Rate Limiting** for API throttling
- **Parallel collection** with error boundaries
- **Cryptographic hashing** for evidence integrity
- **Factory pattern** for collector creation

**Step-by-Step Implementation:**

1. **Adapter Pattern:**
   ```typescript
   interface EvidenceCollector {
     collectEvidence(control: ControlType, scope: CollectionScope): Promise<Evidence>;
   }
   ```
   - Common interface for all providers
   - Provider-specific implementations (AWS, Azure, GCP)
   - Easy to add new providers

2. **Rate Limiting:**
   - Token bucket algorithm
   - Configurable capacity and refill rate
   - Automatic waiting when tokens exhausted
   - Per-provider rate limiters

3. **Evidence Collection:**
   - Parallel collection from multiple providers
   - Error handling per provider (Promise.allSettled)
   - Evidence validation (hash, freshness, required fields)
   - Health status tracking

4. **Architecture Benefits:**
   - Single responsibility: Each collector handles one provider
   - Open/closed principle: Easy to extend without modification
   - Dependency inversion: Depend on abstractions, not implementations

**Interview Talking Points:**
- Why adapter pattern? Unified interface, easy testing, provider abstraction
- Token bucket vs leaky bucket: Token bucket allows bursts, more flexible
- Error handling strategy: Fail gracefully, don't block other providers
- Evidence integrity: Cryptographic hashing prevents tampering

---

### 02-event-driven-compliance-monitoring.ts
**Question:** Design an event-driven system that monitors compliance control states and triggers automated remediation with reliable event processing.

**Key Concepts Demonstrated:**
- **Event Sourcing** for complete audit trail
- **At-least-once delivery** guarantees
- **Partitioned ordering** for parallel processing
- **Idempotency** for safe retries
- **Dead letter queue** for failed events

**Step-by-Step Implementation:**

1. **Event Sourcing:**
   - Append-only event store
   - Complete audit trail
   - Point-in-time reconstruction
   - Event replay capability

2. **Ordered Processing:**
   - Partition by control ID for parallel processing
   - Sequence numbers for ordering
   - Event buffering for out-of-order events
   - Mutex for partition-level locking

3. **Idempotency:**
   - Idempotency keys: `remediation:${eventId}`
   - TTL-based expiration
   - Skip already-processed events
   - Safe retries

4. **Dead Letter Queue:**
   - Failed events stored in DLQ
   - Manual review and retry
   - Error tracking
   - Alerting on DLQ size

5. **Event Bus Architecture:**
   - Publish-subscribe pattern
   - Multiple handlers per event type
   - Handler isolation (one failure doesn't block others)
   - Metrics and observability

**Interview Talking Points:**
- Event sourcing benefits: Audit trail, replay, time travel debugging
- Ordering strategy: Partition-level ordering allows parallelism
- Idempotency: Essential for distributed systems, safe retries
- Dead letter queue: Prevents event loss, enables manual intervention

---

### 03-compliance-rule-engine.ts
**Question:** Design a rule engine that evaluates compliance controls against configurable rules with support for complex Boolean logic.

**Key Concepts Demonstrated:**
- **JSON-based DSL** for rule definition
- **Pre-compilation** for performance
- **Batch evaluation** with concurrency control
- **Rule validation** framework
- **Extensible operator system**

**Step-by-Step Implementation:**

1. **Rule DSL:**
   ```typescript
   {
     type: 'and',
     conditions: [
       { type: 'simple', field: 'encryption', operator: 'equals', value: true },
       { type: 'simple', field: 'mfa', operator: 'equals', value: true }
     ]
   }
   ```
   - Declarative rule definition
   - Supports AND, OR, NOT operators
   - Nested conditions
   - Type-safe evaluation

2. **Compilation:**
   - Pre-compile rules to functions
   - Optimize condition evaluation
   - Cache compiled rules
   - Fast runtime evaluation

3. **Evaluation Context:**
   - Control data
   - Evidence data
   - Computed fields (daysSinceLastAssessment)
   - Metadata

4. **Batch Processing:**
   - Parallel evaluation with concurrency limit
   - Chunked processing for large datasets
   - Summary statistics
   - Error isolation

5. **Validation:**
   - Rule structure validation
   - Compilation testing
   - Operator validation
   - Field path validation

**Interview Talking Points:**
- DSL benefits: Non-developers can write rules, version control, testing
- Pre-compilation: Performance optimization, catch errors early
- Evaluation strategy: Context building, field accessors, operator extensibility
- Batch processing: Concurrency control, error handling, progress tracking

---

## Common Patterns Across All Files

### Design Patterns

1. **Adapter Pattern:**
   - Unified interface for different providers
   - Easy to add new providers
   - Testable with mocks

2. **Factory Pattern:**
   - Centralized object creation
   - Configuration management
   - Dependency injection

3. **Strategy Pattern:**
   - Pluggable algorithms (rate limiting, evaluation)
   - Runtime selection
   - Easy to extend

### Error Handling Patterns

1. **Graceful Degradation:**
   - Continue processing on partial failures
   - Error boundaries per provider
   - Fallback strategies

2. **Retry Logic:**
   - Exponential backoff
   - Max retry attempts
   - Circuit breakers

3. **Error Tracking:**
   - Structured logging
   - Error metrics
   - Alerting

### Performance Patterns

1. **Parallel Processing:**
   - Promise.all for independent operations
   - Concurrency control for rate limiting
   - Batch processing for efficiency

2. **Caching:**
   - Compiled rules cache
   - Collector instances cache
   - Rate limiter state

3. **Lazy Loading:**
   - Load collectors on demand
   - Initialize clients lazily
   - Defer expensive operations

### Observability Patterns

1. **Metrics:**
   - Processing duration
   - Error rates
   - Throughput

2. **Logging:**
   - Structured logs
   - Correlation IDs
   - Context propagation

3. **Tracing:**
   - Request tracing
   - Event correlation
   - Performance profiling

---

## Interview Preparation Tips

### When Discussing These Implementations:

1. **Architecture Decisions:**
   - Why this pattern?
   - What are the alternatives?
   - What are the trade-offs?

2. **Scalability:**
   - How does it scale?
   - What are the bottlenecks?
   - How to handle 100,000+ resources?

3. **Reliability:**
   - How to handle failures?
   - What's the recovery strategy?
   - How to ensure data consistency?

4. **Performance:**
   - What are the performance characteristics?
   - How to optimize?
   - What are the bottlenecks?

5. **Testing:**
   - How to test async code?
   - How to test event-driven systems?
   - How to test rate limiters?

### Key Node.js Concepts to Master:

- **Async Patterns:** Promises, async/await, streams
- **Error Handling:** Try/catch, error boundaries, retry logic
- **Design Patterns:** Adapter, Factory, Strategy, Observer
- **Performance:** Parallel processing, caching, lazy loading
- **Observability:** Logging, metrics, tracing
- **TypeScript:** Type safety, generics, discriminated unions

---

## Dependencies

```json
{
  "uuid": "^9.0.0",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0"
}
```

---

## Running the Code

Each file is self-contained and can be used as reference. To use in a project:

1. Install dependencies:
```bash
npm install uuid @types/node typescript
```

2. Compile TypeScript:
```bash
npx tsc --noEmit
```

3. Import and use:
```typescript
import { EvidenceCollectionService } from './01-control-evidence-collection-api';
```

---

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript)
- [Event Sourcing Patterns](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Rate Limiting Strategies](https://stripe.com/blog/rate-limiters)

