# Advanced

Complex systems architecture, enterprise-scale patterns, and operational excellence. These topics come up in staff/principal-level interviews and require solid understanding of both fundamentals and intermediate material.

## Prerequisites

Complete [fundamentals/](../fundamentals/) and [intermediate/](../intermediate/) first. Key dependencies:
- Cloud Design Patterns + Cost Optimization (for multi-region and DR)
- SLIs/SLOs/SLAs + Alerting Strategy (for reliability and incident response)
- CI/CD + Deployment Strategies (for migration planning)

## Study Guides

| # | Topic | Domain | Est. Time |
|---|-------|--------|-----------|
| 01 | [Multi-Region Architecture](./01-multi-region-architecture.md) | Solutions Architecture | 90 min |
| 02 | [Disaster Recovery Strategies](./02-disaster-recovery-strategies.md) | Solutions Architecture | 60 min |
| 03 | [Security Architecture](./03-security-architecture.md) | Solutions Architecture | 60 min |
| 04 | [Data Architecture](./04-data-architecture.md) | Solutions Architecture | 60 min |
| 05 | [Reliability Engineering](./05-reliability-engineering.md) | DevOps | 45 min |
| 06 | [Incident Response](./06-incident-response.md) | Observability | 45 min |
| 07 | [Migration Strategies](./07-migration-strategies.md) | Solutions Architecture | 45 min |
| 08 | [Cost-Effective Observability](./08-cost-effective-observability.md) | Observability | 30 min |

## Recommended Study Order

1. **Multi-Region Architecture** -- Active-active vs active-passive, data replication
2. **Disaster Recovery Strategies** -- RTO/RPO, failover tiers, game days
3. **Security Architecture** -- Defense-in-depth, zero trust, threat modeling
4. **Data Architecture** -- OLTP vs OLAP, lakes vs warehouses, governance
5. **Reliability Engineering** -- Error budgets, circuit breakers, bulkheads
6. **Incident Response** -- Triage checklists, stabilization, blameless postmortems
7. **Migration Strategies** -- 6R framework, strangler pattern, cutover planning
8. **Cost-Effective Observability** -- Sampling, retention tiering, cost guardrails

## What You'll Learn

- Active-active and active-passive multi-region designs with traffic management
- RTO/RPO definitions, DR tiers from backup/restore to hot standby
- Defense-in-depth, identity-first design, and secure-by-default services
- OLTP vs OLAP trade-offs, data pipelines, quality, and lineage
- SRE error budgets, defensive dependency patterns, operational discipline
- First-10-minutes triage, stabilize-first mitigations, postmortem practices
- 6R migration framework, strangler fig, parallel runs, and rollback
- Observability cost drivers and guardrails for sustainable monitoring

## Total Estimated Time: ~7 hours
