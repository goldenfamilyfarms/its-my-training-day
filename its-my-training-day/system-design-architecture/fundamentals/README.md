# Fundamentals

Core concepts that form the foundation of system design. Study these first -- everything in the intermediate and advanced sections builds on this material.

## Study Guides

| # | Topic | Domain | Est. Time |
|---|-------|--------|-----------|
| 01 | [CAP Theorem](./01-cap-theorem.md) | Distributed Systems | 60 min |
| 02 | [Three Pillars of Observability](./02-three-pillars-of-observability.md) | Observability | 45 min |
| 03 | [Cloud Design Patterns](./03-cloud-design-patterns.md) | Solutions Architecture | 60 min |
| 04 | [CI/CD Pipeline Design](./04-ci-cd-pipeline-design.md) | DevOps | 60 min |
| 05 | [Infrastructure as Code](./05-infrastructure-as-code.md) | DevOps | 60 min |
| 06 | [Container Orchestration](./06-container-orchestration.md) | DevOps | 60 min |
| 07 | [SLIs, SLOs, and SLAs](./07-slis-slos-and-slas.md) | Observability | 45 min |
| 08 | [Secret Management](./08-secret-management.md) | DevOps | 30 min |

## Recommended Study Order

1. **CAP Theorem** -- Distributed trade-offs every system design answer relies on
2. **Three Pillars of Observability** -- Metrics, logs, and traces vocabulary
3. **SLIs, SLOs, and SLAs** -- How to define "healthy" for any service
4. **Cloud Design Patterns** -- Resilience, scalability, and operability patterns
5. **CI/CD Pipeline Design** -- Build-once, promote-through-environments pipelines
6. **Infrastructure as Code** -- Declarative infra workflows and state management
7. **Container Orchestration** -- Kubernetes primitives and scaling behavior
8. **Secret Management** -- Storing, rotating, and accessing secrets safely

## What You'll Learn

- How CAP theorem trade-offs inform database and replication choices
- The three observability pillars and how they correlate via trace IDs
- SLI/SLO/SLA definitions, error budgets, and burn-rate alerting
- Core cloud pattern families (resilience, scalability, security)
- CI vs CD stages, immutable artifacts, gates, and rollback
- Declarative infra with plan/apply, drift detection, and policy-as-code
- Kubernetes pods, deployments, services, probes, and autoscaling
- Secrets lifecycle: storage, rotation, least-privilege, leak prevention

## Total Estimated Time: ~7 hours
