# Junior Study Material: Backend Engineer Path (Loki + Go + Distributed Systems)

This companion is for **junior engineers** using the `01-staff-backend-engineer-loki` guide without getting overwhelmed. The official role docs are intentionally deep; this file gives you a **practical route** through the same topic space.

## How this maps to “Topics Covered”

- **Go Programming**: you’ll learn how to read Go services and reason about concurrency and performance.
- **Observability**: you’ll learn how the Loki ingest pipeline behaves under load and how to observe it.
- **Kubernetes**: you’ll learn how stateful components behave (ingesters, WAL, PVCs) and how to debug them.
- **Architecture**: you’ll learn the ingestion vs query trade-offs, and how to explain them clearly.

## Prerequisites (minimum viable)

- You can read basic Go (functions, structs, interfaces).
- You can run basic `kubectl get/describe/logs`.
- You know what metrics/logs/traces are (skim `../../shared-concepts/observability-principles.md` first).

If any of those feel shaky, do **Week 1–2** in `../README.md` (the junior curriculum index) first.

## Learning outcomes (what “done” looks like)

By the end you should be able to:

- **Explain Loki write path** at a high level: client → distributor → ingester → chunk/WAL → object storage.
- **Explain why ingestion is hard**: high throughput, ordering, backpressure, and multi-tenant isolation.
- **Debug an ingestion incident** using:
  - metrics (rate/error/latency),
  - logs (error details),
  - tracing (request flow, if present),
  - Kubernetes events/pod lifecycle.
- **Make one explicit trade-off** in design: e.g., durability vs latency; cost vs query speed.

## Week-by-week (4 weeks, junior pace)

### Week 1 — Go concurrency fundamentals (the minimum you need)

Read (skimming is ok; focus on concepts):
- `./fundamentals.md` sections on **goroutines**, **channels**, **select**, and **sync primitives**.
- Optional: `../../code-implementations/go-distributed-systems/concurrency.go`

Core concepts you must understand:

#### Goroutines are cheap, but not free

- Goroutines are lightweight, but you can still overload:
  - CPU with too many runnable goroutines,
  - memory with stacks + allocations,
  - latency with contention.

#### Channels are coordination, not a queueing system by default

- A buffered channel can absorb bursts **up to its capacity**.
- When full, the producer blocks: that’s backpressure.
- When unbuffered, send/recv synchronize: great for correctness, bad for throughput if misused.

#### `select` is about *making progress safely*

You use `select` to:
- stop work when context is canceled,
- avoid deadlocks,
- implement timeouts,
- merge multiple streams.

Hands-on lab (small):

1. In `go-distributed-systems`, find the worker pool example (or create one).
2. Add:
   - a `context.Context` cancellation path
   - a timeout
   - a counter metric (conceptually) for “jobs processed”
3. Write down:
   - where backpressure happens,
   - what happens when the consumer is slow.

Check your understanding (answer in 3–5 sentences each):
- Why is a large buffered channel not a “fix” for slow consumers?
- What does it mean when a goroutine is “blocked” and why should you care?
- When would you prefer a mutex over a channel?

### Week 2 — Distributed systems foundations you’ll actually use

Read:
- `./fundamentals.md` section **Distributed Systems Foundations**
- Skim CAP + consistency + sharding + replication; don’t memorize definitions—learn the *trade-offs*.

Core concepts you must understand:

#### CAP theorem in practice (for your mental model)

- Partitions happen. For cross-node systems you **design** around them.
- You usually choose **availability** for ingest pipelines and accept **eventual consistency** in some areas.

#### Replication factor and quorum thinking

Even if Loki isn’t a Dynamo clone, quorum language is useful:

- **N** replicas total.
- **W** acknowledgements required for a write to “succeed.”
- **R** replicas consulted for a read.
- If \(W + R > N\), you can often get stronger read-your-writes behavior (at a cost).

#### Sharding is for scaling, but creates “blast radius” questions

When you shard:
- you get parallelism,
- you also get: rebalancing, skew/hot shards, and operational complexity.

Hands-on lab (paper design):

Design a “toy Loki ingest” on paper:

- Inputs: `tenant_id`, `labels`, `timestamp`, `line`.
- Goal: high-throughput ingestion with per-tenant isolation.
- Decide:
  - shard key (tenant? tenant+stream?)
  - replication strategy
  - how you handle an ingester failure
  - what you do when downstream storage is slow

Check your understanding:
- What are the consequences of sharding by “tenant only”?
- What does “eventual consistency” mean for a user running a query right after ingestion?
- How do you avoid “hot partitions”?

### Week 3 — Kafka + backpressure (ingestion reality)

Read:
- `./intermediate.md` section **Kafka at Scale** (focus: partitioning, consumer groups, rebalancing, tuning)

Core concepts you must understand:

#### Ordering is partition-scoped

- Kafka gives ordering **within a partition**.
- If you need ordering per tenant/stream, your partition key must reflect that.

#### Rebalancing is “normal”, but it hurts if you’re not ready

During rebalances:
- partitions move,
- caches go cold,
- throughput drops,
- offset commit semantics matter.

#### Exactly-once is expensive; idempotence is often enough

For juniors: start by reasoning about:
- at-least-once processing + idempotent writes,
then later graduate to:
- full transactional semantics where required.

Hands-on lab (mental simulation):

Consider an ingestion consumer:
- It reads log batches from Kafka.
- It writes to ingesters.

Answer these questions:

1. If the ingester slows down, where does pressure build up first?
   - in the consumer (processing time),
   - in Kafka (lag),
   - in memory (buffers),
   - or in network retries?
2. What happens if you “fix” the consumer by increasing concurrency without limits?
3. If you commit offsets **before** writing to ingesters, what failure mode do you create?
4. If you commit offsets **after** writing, what failure mode do you accept?

#### Backpressure is your friend (when controlled)

For ingestion pipelines, the healthiest state is usually:

- producers can burst a little,
- buffers absorb spikes,
- consumers apply **bounded concurrency**,
- the system sheds load gracefully (rate limits) before it melts down.

Practical knobs (conceptual, not Loki-specific):

- **Bounded queue**: limit in-memory buffering.
- **Bulkhead**: cap concurrent requests to downstream dependencies.
- **Circuit breaker**: fail fast when downstream is unhealthy.
- **Rate limiting**: per-tenant and global.
- **Load shedding**: drop low-value traffic first (e.g., debug logs in prod).

Mini-exercise:

- Write a paragraph describing how you would implement **bounded concurrency** in Go:
  - what do you cap (goroutines, in-flight requests, batch size)?
  - what happens when the cap is hit (block, drop, retry, redirect)?

### Week 4 — Loki ingest architecture + Kubernetes operations (day-2 skills)

Read:
- `./intermediate.md` section **Kubernetes Operations** (focus: StatefulSets, storage, debugging)
- `./advanced.md` (skim) section **Loki Architecture Deep Dive** (you don’t need every detail; aim for the mental model)

If `./advanced.md` feels too heavy, use this simplified model first:

#### Loki write path (simplified mental model)

```
Clients / Agents
   |
   v
Distributor (stateless)  -- validates + load balances -->
   |
   v
Ingester (stateful) -- builds chunks, uses WAL, keeps recent data in memory -->
   |
   v
Object Storage (durable chunks) + Index (for query lookup)
```

Key ideas:

- **Distributor is stateless**: scale it horizontally.
- **Ingester is stateful**: it holds “in-progress” data, so shutdown and upgrades matter.
- **WAL exists to reduce data loss** during crashes/restarts.
- **Object storage is the long-term durable store** (and is often your biggest cost lever).

#### Kubernetes: why StatefulSets matter here

For stateful components:

- stable identity (`pod-0`, `pod-1`, …) makes coordination easier,
- persistent volumes keep WAL/chunks across restarts,
- termination grace period + preStop hooks are critical for “flush before exit.”

Hands-on lab (Kubernetes debugging muscle)

Using the repo manifests as reference:

- Look at `../../code-implementations/kubernetes-configs/statefulsets/loki-statefulset.yaml`
- Identify and explain:
  - where persistence is configured (PVC / volume mounts),
  - how readiness is determined (probe endpoints),
  - what happens on termination (grace period, preStop hook),
  - how many replicas you’d want and why.

Write your own “day-2 checklist” (keep it short, but real):

- Before scaling ingesters:
  - what metrics do you check?
  - what failure modes do you watch for?
- Before upgrading:
  - what rollback signal do you define?
  - what’s your safe rollout plan?

## Capstone (pick one, 4–8 hours)

### Capstone A — Design: “Ingest 10× more logs without outages”

Scenario:
- current ingestion: 500 GB/day
- target ingestion: 5 TB/day
- constraints: keep query performance acceptable; cost can grow but must be controlled

Deliverable (write a short design doc):

1. **Assumptions**: tenants, log format, retention, query patterns.
2. **Bottlenecks** you expect: network, CPU, memory, storage, Kafka, cardinality.
3. **Scaling plan**:
   - where do you scale stateless vs stateful components?
   - what do you shard on?
4. **Protection**:
   - rate limiting strategy (global + per-tenant),
   - backpressure strategy (where you block vs where you shed).
5. **Observability**:
   - 5 key metrics you’d alert on,
   - 5 key dashboards/panels,
   - 1 example alert with a runbook outline.

### Capstone B — Implementation: “Bounded ingestion worker”

Using the Go examples in `../../code-implementations/go-distributed-systems/`:

- implement a bounded worker pool that:
  - accepts “log batches”,
  - simulates downstream latency/errors,
  - tracks:
    - throughput,
    - in-flight concurrency,
    - error rate,
    - queue depth,
  - applies:
    - timeouts,
    - retries with backoff,
    - circuit breaker.

Write a brief README-style note:
- what knobs exist,
- how to tune them,
- what failure mode each knob prevents.

## “Interview-style” prompts (junior level)

- Explain the difference between:
  - buffering vs backpressure,
  - concurrency vs parallelism,
  - durability vs availability in ingestion.
- Why do stateful services need more careful rollout plans than stateless ones?
- Give one example of “the system is healthy but users are unhappy.” What would you check?

## Where to go next

- If you want to go deeper into Loki internals: `./advanced.md`
- If you want more distributed patterns in Go: `../../code-implementations/go-distributed-systems/`
- If you want to practice troubleshooting: pick scenarios from `03-associate-observability-architect/`

