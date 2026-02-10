# Intermediate

Practical application of system design concepts. These guides cover common patterns and architectural decisions you'll encounter in production systems and interview deep-dives.

## Prerequisites

Complete the [fundamentals/](../fundamentals/) section first, especially:
- Three Pillars of Observability (for metrics, tracing, and logging guides)
- Cloud Design Patterns (for serverless and cost guides)
- CI/CD Pipeline Design (for deployment and GitOps guides)

## Study Guides

| # | Topic | Domain | Est. Time |
|---|-------|--------|-----------|
| 01 | [Metrics Architecture](./01-metrics-architecture.md) | Observability | 60 min |
| 02 | [Log Aggregation Patterns](./02-log-aggregation-patterns.md) | Observability | 45 min |
| 03 | [Distributed Tracing](./03-distributed-tracing.md) | Observability | 60 min |
| 04 | [Alerting Strategy](./04-alerting-strategy.md) | Observability | 45 min |
| 05 | [Deployment Strategies](./05-deployment-strategies.md) | DevOps | 45 min |
| 06 | [GitOps Patterns](./06-gitops-patterns.md) | DevOps | 45 min |
| 07 | [Environment Management](./07-environment-management.md) | DevOps | 30 min |
| 08 | [Serverless Patterns](./08-serverless-patterns.md) | Solutions Architecture | 60 min |
| 09 | [Cost Optimization](./09-cost-optimization.md) | Solutions Architecture | 45 min |

## Recommended Study Order

1. **Metrics Architecture** -- End-to-end metrics pipeline, pull vs push, cardinality
2. **Log Aggregation Patterns** -- Structured logs, pipelines, retention trade-offs
3. **Distributed Tracing** -- Trace/span concepts, context propagation, sampling
4. **Alerting Strategy** -- Symptom vs cause alerting, burn-rate patterns, runbooks
5. **Deployment Strategies** -- Rolling vs blue/green vs canary trade-offs
6. **GitOps Patterns** -- Desired-state reconciliation via Git
7. **Environment Management** -- Dev/stage/prod parity, feature flags, config promotion
8. **Serverless Patterns** -- Event-driven design, idempotency, cold starts
9. **Cost Optimization** -- Right-sizing, autoscaling, commitment discounts, FinOps

## What You'll Learn

- How to design metric collection, storage, and query pipelines
- Structured logging at scale with backpressure and cost control
- Debugging latency across services with distributed tracing
- SLO-based burn-rate alerting and alert hygiene practices
- Rolling, blue-green, and canary deployments with safe rollback
- Git-driven infrastructure reconciliation and drift prevention
- Environment parity strategies and release controls
- Event-driven serverless patterns and concurrency management
- Cloud cost levers: compute, storage, egress, and managed services

## Total Estimated Time: ~7 hours
