# System Design & Architecture

## Overview

This training track covers system design and architecture topics essential for senior engineering, architect, and staff-level interviews. Content spans distributed systems fundamentals, observability, cloud solutions design, DevOps practices, and structured frameworks for tackling system design interviews.

All 25 study guides are organized into three progressive tiers. Start at fundamentals and work your way up.

## Study Guide Structure

| Section | Guides | Focus | Est. Time |
|---------|--------|-------|-----------|
| [fundamentals/](./fundamentals/) | 8 | CAP theorem, observability pillars, cloud patterns, CI/CD, IaC, K8s, SLOs, secrets | ~7 hrs |
| [intermediate/](./intermediate/) | 9 | Metrics, logging, tracing, alerting, deployments, GitOps, serverless, cost | ~7 hrs |
| [advanced/](./advanced/) | 8 | Multi-region, DR, security, data architecture, SRE, incident response, migration | ~7 hrs |

### Interview Prep

| Resource | Description |
|----------|-------------|
| [interview-prep/](./interview-prep/) | RESHADED framework, mock interview template, practice exercises |
| [interview-prep/practice/](./interview-prep/practice/) | Worked problems (URL shortener) with reference solutions |
| [interview-prep/mock-interview-template.md](./interview-prep/mock-interview-template.md) | 60-minute mock session template with self-evaluation rubric |

### Grafana Role-Specific Paths

| Resource | Description |
|----------|-------------|
| [grafana/](./grafana/) | 4 role-specific study paths with their own fundamentals/intermediate/advanced tiers |
| [MASTER_STUDY_PLAN_README.md](./MASTER_STUDY_PLAN_README.md) | 14-day intensive study plan for Grafana interviews |

## Recommended Study Order

```
fundamentals/  ──>  intermediate/  ──>  advanced/
     │                                       │
     └──> interview-prep/ (use throughout) <─┘
```

1. **fundamentals/** -- Core distributed systems and infrastructure knowledge
2. **interview-prep/** -- Learn the RESHADED framework early, practice throughout
3. **intermediate/** -- Practical patterns for observability, deployment, and cost
4. **advanced/** -- Enterprise-scale architecture and operational excellence

## All 25 Study Guides at a Glance

### Fundamentals

| # | Guide | Domain |
|---|-------|--------|
| 01 | [CAP Theorem](./fundamentals/01-cap-theorem.md) | Distributed Systems |
| 02 | [Three Pillars of Observability](./fundamentals/02-three-pillars-of-observability.md) | Observability |
| 03 | [Cloud Design Patterns](./fundamentals/03-cloud-design-patterns.md) | Solutions Architecture |
| 04 | [CI/CD Pipeline Design](./fundamentals/04-ci-cd-pipeline-design.md) | DevOps |
| 05 | [Infrastructure as Code](./fundamentals/05-infrastructure-as-code.md) | DevOps |
| 06 | [Container Orchestration](./fundamentals/06-container-orchestration.md) | DevOps |
| 07 | [SLIs, SLOs, and SLAs](./fundamentals/07-slis-slos-and-slas.md) | Observability |
| 08 | [Secret Management](./fundamentals/08-secret-management.md) | DevOps |

### Intermediate

| # | Guide | Domain |
|---|-------|--------|
| 01 | [Metrics Architecture](./intermediate/01-metrics-architecture.md) | Observability |
| 02 | [Log Aggregation Patterns](./intermediate/02-log-aggregation-patterns.md) | Observability |
| 03 | [Distributed Tracing](./intermediate/03-distributed-tracing.md) | Observability |
| 04 | [Alerting Strategy](./intermediate/04-alerting-strategy.md) | Observability |
| 05 | [Deployment Strategies](./intermediate/05-deployment-strategies.md) | DevOps |
| 06 | [GitOps Patterns](./intermediate/06-gitops-patterns.md) | DevOps |
| 07 | [Environment Management](./intermediate/07-environment-management.md) | DevOps |
| 08 | [Serverless Patterns](./intermediate/08-serverless-patterns.md) | Solutions Architecture |
| 09 | [Cost Optimization](./intermediate/09-cost-optimization.md) | Solutions Architecture |

### Advanced

| # | Guide | Domain |
|---|-------|--------|
| 01 | [Multi-Region Architecture](./advanced/01-multi-region-architecture.md) | Solutions Architecture |
| 02 | [Disaster Recovery Strategies](./advanced/02-disaster-recovery-strategies.md) | Solutions Architecture |
| 03 | [Security Architecture](./advanced/03-security-architecture.md) | Solutions Architecture |
| 04 | [Data Architecture](./advanced/04-data-architecture.md) | Solutions Architecture |
| 05 | [Reliability Engineering](./advanced/05-reliability-engineering.md) | DevOps |
| 06 | [Incident Response](./advanced/06-incident-response.md) | Observability |
| 07 | [Migration Strategies](./advanced/07-migration-strategies.md) | Solutions Architecture |
| 08 | [Cost-Effective Observability](./advanced/08-cost-effective-observability.md) | Observability |

## Prerequisites

- Understanding of basic networking (HTTP, TCP/IP, DNS)
- Familiarity with databases (SQL and NoSQL concepts)
- Experience with at least one cloud platform (AWS, GCP, Azure)
- Basic understanding of containerization and deployment

## Interview Relevance

System design topics appear in interviews for:
- **Senior Software Engineer**: Design scalable services, data pipelines
- **Staff/Principal Engineer**: Cross-system architecture, technical strategy
- **Solutions Architect**: Cloud patterns, customer-facing designs
- **Platform Engineer**: Infrastructure, deployment, observability

## Flashcards

- **[_anki/](./_anki/)** -- Generated Anki flashcard decks

## Total Estimated Time: ~21 hours (study guides) + practice
