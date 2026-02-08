# Advanced: Senior Observability Architect

This document covers advanced-level expertise for the Senior Observability Architect role at Grafana Labs. It focuses on ROI analysis and value realization, multi-tenant architectures, enterprise-scale design patterns, multi-cloud strategies, and comprehensive SLO/SLI/SLA frameworks with capacity planning—the strategic skills needed to lead enterprise observability transformations.

## Table of Contents

1. [ROI Analysis and Value Realization](#roi-analysis-and-value-realization)
2. [Multi-Tenant Architectures](#multi-tenant-architectures)
3. [Enterprise-Scale Design Patterns](#enterprise-scale-design-patterns)
4. [Multi-Cloud Strategies](#multi-cloud-strategies)
5. [SLOs, SLIs, SLAs, and Capacity Planning](#slos-slis-slas-and-capacity-planning)
6. [Practical Examples](#practical-examples)
7. [Key Takeaways](#key-takeaways)

---

## ROI Analysis and Value Realization

As a Senior Observability Architect, you must demonstrate the business value of observability investments. This requires understanding financial metrics, building compelling business cases, and continuously measuring and communicating value.

> **📚 Related Content**: For technical discovery and roadmap development, see [Intermediate](./intermediate.md)

### Total Cost of Ownership (TCO) Analysis

TCO analysis helps organizations understand the true cost of their observability solutions, including hidden costs often overlooked.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY TCO FRAMEWORK                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DIRECT COSTS                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Category              │ Components                    │ % of TCO        │   │
│  │───────────────────────┼───────────────────────────────┼─────────────────│   │
│  │ Infrastructure        │ Compute, storage, network     │ 30-40%          │   │
│  │ Licensing             │ Software licenses, SaaS fees  │ 20-30%          │   │
│  │ Personnel             │ Platform team salaries        │ 25-35%          │   │
│  │ Training              │ Certifications, workshops     │ 2-5%            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  INDIRECT COSTS (Often Hidden)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Category              │ Components                    │ Impact          │   │
│  │───────────────────────┼───────────────────────────────┼─────────────────│   │
│  │ Integration           │ Custom connectors, migrations │ Medium-High     │   │
│  │ Maintenance           │ Upgrades, patches, tuning     │ Medium          │   │
│  │ Opportunity Cost      │ Time spent on tooling vs.     │ High            │   │
│  │                       │ product development           │                 │   │
│  │ Technical Debt        │ Workarounds, legacy support   │ Medium-High     │   │
│  │ Context Switching     │ Multiple tools, fragmented UX │ Medium          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


#### TCO Calculation Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TCO COMPARISON: SELF-HOSTED vs. GRAFANA CLOUD                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SCENARIO: Enterprise with 500 services, 10M active series, 5TB logs/day        │
│                                                                                  │
│  SELF-HOSTED (3-Year TCO)                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Cost Category                              │ Annual Cost  │ 3-Year     │   │
│  │────────────────────────────────────────────┼──────────────┼────────────│   │
│  │ Infrastructure (K8s clusters, storage)     │ $480,000     │ $1,440,000 │   │
│  │ Platform Team (3 FTEs @ $150K loaded)      │ $450,000     │ $1,350,000 │   │
│  │ Training and Certifications                │ $30,000      │ $90,000    │   │
│  │ Professional Services (initial setup)      │ $100,000     │ $100,000   │   │
│  │ Maintenance and Upgrades (20% of infra)    │ $96,000      │ $288,000   │   │
│  │────────────────────────────────────────────┼──────────────┼────────────│   │
│  │ TOTAL                                      │ $1,156,000   │ $3,268,000 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  GRAFANA CLOUD (3-Year TCO)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Cost Category                              │ Annual Cost  │ 3-Year     │   │
│  │────────────────────────────────────────────┼──────────────┼────────────│   │
│  │ Grafana Cloud Subscription                 │ $600,000     │ $1,800,000 │   │
│  │ Platform Team (1 FTE @ $150K loaded)       │ $150,000     │ $450,000   │   │
│  │ Training                                   │ $15,000      │ $45,000    │   │
│  │ Integration/Migration (one-time)           │ $50,000      │ $50,000    │   │
│  │────────────────────────────────────────────┼──────────────┼────────────│   │
│  │ TOTAL                                      │ $815,000     │ $2,345,000 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  3-YEAR SAVINGS: $923,000 (28% reduction)                                       │
│  Additional Benefits: Faster time-to-value, reduced operational risk            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Return on Investment (ROI) Calculations

ROI demonstrates the financial return from observability investments. Focus on quantifiable benefits that resonate with executives.

#### ROI Formula and Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY ROI CALCULATION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ROI = (Total Benefits - Total Costs) / Total Costs × 100%                      │
│                                                                                  │
│  QUANTIFIABLE BENEFITS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  1. INCIDENT COST REDUCTION                                             │   │
│  │     ┌─────────────────────────────────────────────────────────────┐     │   │
│  │     │ Savings = (Old MTTR - New MTTR) × Incidents/Year × Cost/Hour│     │   │
│  │     │                                                             │     │   │
│  │     │ Example:                                                    │     │   │
│  │     │ • Old MTTR: 4 hours → New MTTR: 0.5 hours                  │     │   │
│  │     │ • P1 Incidents/Year: 50                                    │     │   │
│  │     │ • Cost per hour of downtime: $50,000                       │     │   │
│  │     │ • Savings: (4 - 0.5) × 50 × $50,000 = $8,750,000          │     │   │
│  │     └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  │  2. DEVELOPER PRODUCTIVITY GAINS                                        │   │
│  │     ┌─────────────────────────────────────────────────────────────┐     │   │
│  │     │ Savings = Developers × Hours Saved/Week × Weeks × Hourly Rate│    │   │
│  │     │                                                             │     │   │
│  │     │ Example:                                                    │     │   │
│  │     │ • Developers: 200                                          │     │   │
│  │     │ • Hours saved per week: 2 (debugging time reduction)       │     │   │
│  │     │ • Weeks per year: 50                                       │     │   │
│  │     │ • Loaded hourly rate: $100                                 │     │   │
│  │     │ • Savings: 200 × 2 × 50 × $100 = $2,000,000               │     │   │
│  │     └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  │  3. TOOL CONSOLIDATION SAVINGS                                          │   │
│  │     ┌─────────────────────────────────────────────────────────────┐     │   │
│  │     │ Savings = Legacy Tool Costs - New Platform Costs            │     │   │
│  │     │                                                             │     │   │
│  │     │ Example:                                                    │     │   │
│  │     │ • Legacy tools (Datadog, Splunk, New Relic): $1,200,000    │     │   │
│  │     │ • New unified platform: $600,000                           │     │   │
│  │     │ • Savings: $600,000                                        │     │   │
│  │     └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  │  4. PREVENTED REVENUE LOSS                                              │   │
│  │     ┌─────────────────────────────────────────────────────────────┐     │   │
│  │     │ Value = Prevented Outages × Average Revenue Impact          │     │   │
│  │     │                                                             │     │   │
│  │     │ Example:                                                    │     │   │
│  │     │ • Major outages prevented: 3 per year                      │     │   │
│  │     │ • Average revenue impact per outage: $500,000              │     │   │
│  │     │ • Value: 3 × $500,000 = $1,500,000                        │     │   │
│  │     └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TOTAL ANNUAL BENEFITS: $12,850,000                                             │
│  TOTAL ANNUAL COSTS: $815,000                                                   │
│  ROI: ($12,850,000 - $815,000) / $815,000 × 100% = 1,477%                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Value Stream Mapping

Value stream mapping helps identify where observability delivers the most impact in your software delivery lifecycle.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY VALUE STREAM MAP                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SOFTWARE DELIVERY LIFECYCLE                                                    │
│                                                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │
│  │  Plan   │──▶│  Code   │──▶│  Build  │──▶│ Deploy  │──▶│ Operate │          │
│  └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘          │
│       │             │             │             │             │                │
│       ▼             ▼             ▼             ▼             ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    OBSERVABILITY VALUE POINTS                           │   │
│  │                                                                          │   │
│  │  PLAN           CODE           BUILD         DEPLOY        OPERATE      │   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │   │
│  │  │Capacity │   │Dev      │   │Pipeline │   │Canary   │   │Incident │   │   │
│  │  │Planning │   │Feedback │   │Metrics  │   │Analysis │   │Response │   │   │
│  │  │         │   │         │   │         │   │         │   │         │   │   │
│  │  │SLO      │   │Local    │   │Build    │   │Deploy   │   │Root     │   │   │
│  │  │Targets  │   │Debugging│   │Quality  │   │Verify   │   │Cause    │   │   │
│  │  │         │   │         │   │         │   │         │   │Analysis │   │   │
│  │  │Error    │   │Trace    │   │Test     │   │Rollback │   │         │   │   │
│  │  │Budgets  │   │Analysis │   │Coverage │   │Triggers │   │Alerting │   │   │
│  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   │   │
│  │                                                                          │   │
│  │  VALUE DELIVERED:                                                        │   │
│  │  • Faster feedback loops (hours → minutes)                              │   │
│  │  • Earlier defect detection (production → development)                  │   │
│  │  • Reduced change failure rate (15% → 5%)                               │   │
│  │  • Faster recovery (hours → minutes)                                    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Business Case Development

Build compelling business cases that resonate with different stakeholders.

**Business Case Template**:

```markdown
# Observability Platform Business Case

## Executive Summary
[One paragraph: Problem, solution, expected ROI, timeline]

## Current State Challenges
1. **Operational Inefficiency**: MTTR of 4 hours costs $X per incident
2. **Tool Sprawl**: 5 different monitoring tools, $X annual spend
3. **Developer Productivity**: 20% of engineering time on debugging
4. **Customer Impact**: 3 major outages in past year, $X revenue impact

## Proposed Solution
- Unified observability platform (Grafana LGTM stack)
- Phased implementation over 12 months
- Dedicated platform team of 3 FTEs

## Financial Analysis

| Metric | Year 1 | Year 2 | Year 3 | Total |
|--------|--------|--------|--------|-------|
| Investment | $500K | $300K | $300K | $1.1M |
| Benefits | $2M | $4M | $5M | $11M |
| Net Value | $1.5M | $3.7M | $4.7M | $9.9M |
| Cumulative ROI | 300% | 617% | 900% | - |

## Risk Analysis
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Adoption resistance | Medium | High | Executive sponsorship, change management |
| Technical complexity | Low | Medium | Phased approach, expert support |
| Resource constraints | Medium | Medium | Dedicated team, clear priorities |

## Recommendation
Proceed with Phase 1 investment of $200K to deploy foundation and validate ROI with pilot teams.

## Success Metrics
- MTTR reduction: 75% within 12 months
- Tool consolidation: 3 tools sunset within 18 months
- Developer satisfaction: >4.0/5.0 within 6 months
```

### Continuous Value Demonstration

Establish mechanisms to continuously measure and communicate value.

#### Value Realization Dashboard

```yaml
# Grafana Dashboard JSON Model (simplified)
# Value Realization Executive Dashboard

panels:
  - title: "MTTR Trend"
    type: timeseries
    description: "Mean Time to Resolution over time"
    targets:
      - expr: 'avg(incident_resolution_time_minutes)'
    thresholds:
      - value: 30
        color: green
      - value: 60
        color: yellow
      - value: 120
        color: red

  - title: "Incident Cost Savings"
    type: stat
    description: "Cumulative savings from reduced MTTR"
    targets:
      - expr: 'sum(incident_cost_savings_dollars)'
    
  - title: "Platform Adoption"
    type: gauge
    description: "Percentage of teams onboarded"
    targets:
      - expr: 'count(teams_onboarded) / count(teams_total) * 100'
    thresholds:
      - value: 50
        color: yellow
      - value: 80
        color: green

  - title: "Developer Productivity Index"
    type: timeseries
    description: "Hours saved per developer per week"
    targets:
      - expr: 'avg(developer_hours_saved_weekly)'

  - title: "Cost per Service Monitored"
    type: stat
    description: "Observability cost efficiency"
    targets:
      - expr: 'sum(observability_costs) / count(services_monitored)'
```

---

## Multi-Tenant Architectures

> **📚 Related Content**: For enterprise architecture principles, see [Fundamentals](./fundamentals.md)

Multi-tenant observability architectures enable organizations to share infrastructure while maintaining isolation, security, and cost attribution across teams, business units, or customers.

### Tenant Isolation Strategies

Different isolation levels provide varying trade-offs between cost efficiency and security.


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ISOLATION LEVELS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LEVEL 1: LOGICAL ISOLATION (Soft Multi-Tenancy)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    SHARED INFRASTRUCTURE                        │    │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │    │   │
│  │  │  │Tenant A │  │Tenant B │  │Tenant C │  │Tenant D │            │    │   │
│  │  │  │(labels) │  │(labels) │  │(labels) │  │(labels) │            │    │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │    │   │
│  │  │                                                                 │    │   │
│  │  │  Isolation: Labels/namespaces, RBAC                            │    │   │
│  │  │  Pros: Cost-efficient, simple operations                       │    │   │
│  │  │  Cons: Noisy neighbor risk, limited isolation                  │    │   │
│  │  │  Use Case: Internal teams, dev/test environments               │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LEVEL 2: NAMESPACE ISOLATION (Medium Multi-Tenancy)                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    SHARED CONTROL PLANE                         │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │   │
│  │  │  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │              │    │   │
│  │  │  │  Namespace  │  │  Namespace  │  │  Namespace  │              │    │   │
│  │  │  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │              │    │   │
│  │  │  │  │ Mimir │  │  │  │ Mimir │  │  │  │ Mimir │  │              │    │   │
│  │  │  │  │ Loki  │  │  │  │ Loki  │  │  │  │ Loki  │  │              │    │   │
│  │  │  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │              │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │   │
│  │  │                                                                 │    │   │
│  │  │  Isolation: K8s namespaces, network policies, resource quotas  │    │   │
│  │  │  Pros: Better isolation, per-tenant scaling                    │    │   │
│  │  │  Cons: Higher operational overhead, more resources             │    │   │
│  │  │  Use Case: Business units, regulated environments              │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LEVEL 3: CLUSTER ISOLATION (Hard Multi-Tenancy)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │  Tenant A   │    │  Tenant B   │    │  Tenant C   │                  │   │
│  │  │  Cluster    │    │  Cluster    │    │  Cluster    │                  │   │
│  │  │  ┌───────┐  │    │  ┌───────┐  │    │  ┌───────┐  │                  │   │
│  │  │  │ Full  │  │    │  │ Full  │  │    │  │ Full  │  │                  │   │
│  │  │  │ Stack │  │    │  │ Stack │  │    │  │ Stack │  │                  │   │
│  │  │  └───────┘  │    │  └───────┘  │    │  └───────┘  │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  │                                                                          │   │
│  │  Isolation: Separate clusters, accounts, networks                       │   │
│  │  Pros: Maximum isolation, compliance-friendly                           │   │
│  │  Cons: Highest cost, complex management                                 │   │
│  │  Use Case: External customers, highly regulated industries              │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### LGTM Stack Multi-Tenancy Configuration

The Grafana LGTM stack provides native multi-tenancy support through the `X-Scope-OrgID` header.

#### Mimir Multi-Tenant Configuration

```yaml
# mimir-config.yaml - Multi-tenant configuration
multitenancy_enabled: true

# Tenant-specific limits
limits:
  # Default limits for all tenants
  ingestion_rate: 25000                    # samples/second
  ingestion_burst_size: 500000             # samples
  max_global_series_per_user: 1500000      # active series limit
  max_fetched_series_per_query: 100000     # query result limit
  max_fetched_chunks_per_query: 2000000    # chunks per query
  max_query_parallelism: 32                # concurrent query shards
  
  # Retention settings
  compactor_blocks_retention_period: 365d  # 1 year retention

# Per-tenant overrides
overrides:
  # Premium tier tenant
  tenant-enterprise-a:
    ingestion_rate: 100000
    max_global_series_per_user: 10000000
    max_fetched_series_per_query: 500000
    compactor_blocks_retention_period: 730d  # 2 years
    
  # Standard tier tenant
  tenant-standard-b:
    ingestion_rate: 50000
    max_global_series_per_user: 3000000
    max_fetched_series_per_query: 200000
    
  # Basic tier tenant
  tenant-basic-c:
    ingestion_rate: 10000
    max_global_series_per_user: 500000
    max_fetched_series_per_query: 50000
    compactor_blocks_retention_period: 90d

# Runtime configuration for dynamic updates
runtime_config:
  file: /etc/mimir/runtime.yaml
  period: 10s
```

#### Loki Multi-Tenant Configuration

```yaml
# loki-config.yaml - Multi-tenant configuration
auth_enabled: true

limits_config:
  # Default limits
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
  max_streams_per_user: 10000
  max_line_size: 256kb
  max_entries_limit_per_query: 5000
  max_query_series: 500
  retention_period: 744h  # 31 days

# Per-tenant overrides
overrides:
  tenant-enterprise-a:
    ingestion_rate_mb: 50
    ingestion_burst_size_mb: 100
    max_streams_per_user: 100000
    max_entries_limit_per_query: 50000
    retention_period: 8760h  # 1 year
    
  tenant-standard-b:
    ingestion_rate_mb: 20
    max_streams_per_user: 25000
    retention_period: 2160h  # 90 days
    
  tenant-basic-c:
    ingestion_rate_mb: 5
    max_streams_per_user: 5000
    retention_period: 336h  # 14 days
```

### Resource Quotas and Limits

Implement Kubernetes resource quotas to enforce tenant boundaries.

```yaml
# tenant-resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-enterprise-a-quota
  namespace: observability-tenant-a
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "200Gi"
    limits.cpu: "100"
    limits.memory: "400Gi"
    persistentvolumeclaims: "20"
    requests.storage: "5Ti"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-enterprise-a-limits
  namespace: observability-tenant-a
spec:
  limits:
    - type: Container
      default:
        cpu: "2"
        memory: "4Gi"
      defaultRequest:
        cpu: "500m"
        memory: "1Gi"
      max:
        cpu: "8"
        memory: "32Gi"
    - type: PersistentVolumeClaim
      max:
        storage: "500Gi"
```


### Data Segregation Patterns

Ensure tenant data remains isolated at the storage layer.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA SEGREGATION ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  OBJECT STORAGE LAYOUT                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  s3://observability-data/                                               │   │
│  │  ├── mimir/                                                             │   │
│  │  │   ├── tenant-a/                                                      │   │
│  │  │   │   ├── blocks/                                                    │   │
│  │  │   │   ├── rules/                                                     │   │
│  │  │   │   └── alertmanager/                                              │   │
│  │  │   ├── tenant-b/                                                      │   │
│  │  │   │   ├── blocks/                                                    │   │
│  │  │   │   ├── rules/                                                     │   │
│  │  │   │   └── alertmanager/                                              │   │
│  │  │   └── tenant-c/                                                      │   │
│  │  │       └── ...                                                        │   │
│  │  ├── loki/                                                              │   │
│  │  │   ├── tenant-a/                                                      │   │
│  │  │   │   ├── chunks/                                                    │   │
│  │  │   │   └── index/                                                     │   │
│  │  │   ├── tenant-b/                                                      │   │
│  │  │   └── tenant-c/                                                      │   │
│  │  └── tempo/                                                             │   │
│  │      ├── tenant-a/                                                      │   │
│  │      ├── tenant-b/                                                      │   │
│  │      └── tenant-c/                                                      │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SECURITY CONTROLS                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • IAM policies restrict access to tenant-specific prefixes             │   │
│  │ • Encryption keys per tenant (optional, for compliance)                │   │
│  │ • Audit logging for all data access                                    │   │
│  │ • Cross-tenant access explicitly denied at API layer                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Billing and Chargeback Models

Implement cost attribution to enable fair billing across tenants.

#### Usage Metrics Collection

```yaml
# Prometheus recording rules for tenant usage tracking
groups:
  - name: tenant_usage_metrics
    interval: 1m
    rules:
      # Metrics ingestion rate per tenant
      - record: tenant:mimir_ingestion_rate:sum
        expr: |
          sum by (tenant) (
            rate(cortex_distributor_received_samples_total[5m])
          )
      
      # Active series per tenant
      - record: tenant:mimir_active_series:sum
        expr: |
          sum by (tenant) (
            cortex_ingester_active_series
          )
      
      # Log ingestion rate per tenant (bytes/second)
      - record: tenant:loki_ingestion_bytes:sum
        expr: |
          sum by (tenant) (
            rate(loki_distributor_bytes_received_total[5m])
          )
      
      # Trace spans per tenant
      - record: tenant:tempo_spans_received:sum
        expr: |
          sum by (tenant) (
            rate(tempo_distributor_spans_received_total[5m])
          )
      
      # Query load per tenant
      - record: tenant:query_requests:sum
        expr: |
          sum by (tenant) (
            rate(cortex_query_frontend_queries_total[5m])
          )
```

#### Chargeback Calculation Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CHARGEBACK CALCULATION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COST COMPONENTS                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  1. INGESTION COSTS                                                     │   │
│  │     Cost = Samples Ingested × $0.0001 per 1000 samples                  │   │
│  │                                                                          │   │
│  │  2. STORAGE COSTS                                                       │   │
│  │     Cost = Active Series × Days × $0.00001 per series-day               │   │
│  │          + Log GB Stored × $0.10 per GB-month                           │   │
│  │          + Trace GB Stored × $0.15 per GB-month                         │   │
│  │                                                                          │   │
│  │  3. QUERY COSTS                                                         │   │
│  │     Cost = Query Compute Units × $0.001 per unit                        │   │
│  │     (Compute units based on data scanned and query complexity)          │   │
│  │                                                                          │   │
│  │  4. INFRASTRUCTURE ALLOCATION                                           │   │
│  │     Cost = (Tenant Usage / Total Usage) × Infrastructure Costs          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  EXAMPLE MONTHLY BILL                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Tenant: enterprise-a                                                    │   │
│  │ Period: January 2024                                                    │   │
│  │                                                                          │   │
│  │ Metrics:                                                                │   │
│  │   Active Series: 5,000,000 avg                                         │   │
│  │   Samples Ingested: 12.96B (5M × 86400 × 30)                           │   │
│  │   Ingestion Cost: $1,296.00                                            │   │
│  │   Storage Cost: $1,500.00                                              │   │
│  │                                                                          │   │
│  │ Logs:                                                                   │   │
│  │   Volume: 500 GB/day × 30 = 15 TB                                      │   │
│  │   Storage Cost: $1,500.00                                              │   │
│  │                                                                          │   │
│  │ Traces:                                                                 │   │
│  │   Volume: 100 GB/day × 30 = 3 TB                                       │   │
│  │   Storage Cost: $450.00                                                │   │
│  │                                                                          │   │
│  │ Queries:                                                                │   │
│  │   Compute Units: 500,000                                               │   │
│  │   Query Cost: $500.00                                                  │   │
│  │                                                                          │   │
│  │ Infrastructure Share: $2,000.00                                        │   │
│  │                                                                          │   │
│  │ TOTAL: $7,246.00                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Compliance Considerations

Multi-tenant architectures must address regulatory and compliance requirements.

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Data Residency** | Region-specific storage buckets, geo-fencing | Audit storage locations |
| **Data Isolation** | Tenant ID in all data paths, RBAC enforcement | Penetration testing |
| **Encryption** | TLS in transit, AES-256 at rest, optional per-tenant keys | Key management audit |
| **Audit Logging** | All API calls logged with tenant context | Log retention verification |
| **Access Control** | SSO integration, MFA required, least privilege | Access reviews |
| **Data Retention** | Configurable per tenant, automated deletion | Retention policy audit |
| **Right to Deletion** | Tenant data purge capability | Deletion verification |

---

## Enterprise-Scale Design Patterns

> **📚 Related Content**: For LGTM stack details, see [LGTM Stack](../../shared-concepts/lgtm-stack.md)

Enterprise-scale observability requires architectural patterns that handle massive data volumes, global distribution, and complex organizational requirements.

### Federated Observability Architectures

Federated architectures distribute observability infrastructure while maintaining centralized visibility.


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FEDERATED OBSERVABILITY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌─────────────────────────────┐                         │
│                         │     GLOBAL GRAFANA          │                         │
│                         │   (Central Visualization)   │                         │
│                         │                             │                         │
│                         │  • Cross-region dashboards  │                         │
│                         │  • Global SLO tracking      │                         │
│                         │  • Executive reporting      │                         │
│                         └──────────────┬──────────────┘                         │
│                                        │                                        │
│              ┌─────────────────────────┼─────────────────────────┐              │
│              │                         │                         │              │
│              ▼                         ▼                         ▼              │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐  │
│  │   REGION: US-EAST   │   │   REGION: EU-WEST   │   │   REGION: APAC      │  │
│  │                     │   │                     │   │                     │  │
│  │  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │  │
│  │  │ Regional      │  │   │  │ Regional      │  │   │  │ Regional      │  │  │
│  │  │ Grafana       │  │   │  │ Grafana       │  │   │  │ Grafana       │  │  │
│  │  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │  │
│  │                     │   │                     │   │                     │  │
│  │  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │  │
│  │  │ Mimir         │  │   │  │ Mimir         │  │   │  │ Mimir         │  │  │
│  │  │ (Metrics)     │  │   │  │ (Metrics)     │  │   │  │ (Metrics)     │  │  │
│  │  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │  │
│  │                     │   │                     │   │                     │  │
│  │  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │  │
│  │  │ Loki          │  │   │  │ Loki          │  │   │  │ Loki          │  │  │
│  │  │ (Logs)        │  │   │  │ (Logs)        │  │   │  │ (Logs)        │  │  │
│  │  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │  │
│  │                     │   │                     │   │                     │  │
│  │  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │  │
│  │  │ Tempo         │  │   │  │ Tempo         │  │   │  │ Tempo         │  │  │
│  │  │ (Traces)      │  │   │  │ (Traces)      │  │   │  │ (Traces)      │  │  │
│  │  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │  │
│  │                     │   │                     │   │                     │  │
│  │  Services: 500      │   │  Services: 300      │   │  Services: 200      │  │
│  │  Teams: 50          │   │  Teams: 30          │   │  Teams: 20          │  │
│  └─────────────────────┘   └─────────────────────┘   └─────────────────────┘  │
│                                                                                  │
│  DATA FLOW PATTERNS:                                                            │
│  • Local data stays local (data sovereignty)                                    │
│  • Aggregated metrics federated to global (recording rules)                     │
│  • Cross-region queries via Grafana data source proxying                        │
│  • Alerts processed locally, escalations to global                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Federation Configuration

```yaml
# Global Grafana - Data source configuration for federation
apiVersion: 1
datasources:
  # US-East Mimir (federated)
  - name: Mimir-US-East
    type: prometheus
    url: https://mimir.us-east.internal:8080/prometheus
    access: proxy
    jsonData:
      httpHeaderName1: X-Scope-OrgID
      timeInterval: 15s
    secureJsonData:
      httpHeaderValue1: global-reader
      
  # EU-West Mimir (federated)
  - name: Mimir-EU-West
    type: prometheus
    url: https://mimir.eu-west.internal:8080/prometheus
    access: proxy
    jsonData:
      httpHeaderName1: X-Scope-OrgID
    secureJsonData:
      httpHeaderValue1: global-reader
      
  # APAC Mimir (federated)
  - name: Mimir-APAC
    type: prometheus
    url: https://mimir.apac.internal:8080/prometheus
    access: proxy
    jsonData:
      httpHeaderName1: X-Scope-OrgID
    secureJsonData:
      httpHeaderValue1: global-reader

  # Mixed data source for cross-region queries
  - name: Global-Metrics
    type: prometheus
    url: https://mimir-global.internal:8080/prometheus
    access: proxy
    jsonData:
      exemplarTraceIdDestinations:
        - name: traceID
          datasourceUid: tempo-global
```

### Global vs. Regional Deployments

Choose deployment topology based on data residency, latency, and compliance requirements.

| Factor | Global Deployment | Regional Deployment | Hybrid |
|--------|-------------------|---------------------|--------|
| **Data Residency** | Single location | Per-region compliance | Flexible |
| **Query Latency** | Higher for remote users | Low for local users | Optimized |
| **Operational Complexity** | Lower | Higher | Medium |
| **Cost** | Lower (economies of scale) | Higher (duplication) | Medium |
| **Failure Blast Radius** | Global | Regional | Regional |
| **Cross-Region Visibility** | Native | Requires federation | Native + local |

### Scalability Patterns

Design for horizontal scalability to handle enterprise data volumes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING PATTERNS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PATTERN 1: SHARDING BY TENANT                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────┐                                                    │   │
│  │  │   Load Balancer │                                                    │   │
│  │  │   (Tenant Hash) │                                                    │   │
│  │  └────────┬────────┘                                                    │   │
│  │           │                                                             │   │
│  │     ┌─────┼─────┬─────────┐                                            │   │
│  │     │     │     │         │                                            │   │
│  │     ▼     ▼     ▼         ▼                                            │   │
│  │  ┌─────┐┌─────┐┌─────┐┌─────┐                                          │   │
│  │  │Shard││Shard││Shard││Shard│  (Tenant A-F, G-L, M-R, S-Z)            │   │
│  │  │  1  ││  2  ││  3  ││  4  │                                          │   │
│  │  └─────┘└─────┘└─────┘└─────┘                                          │   │
│  │                                                                          │   │
│  │  Pros: Predictable scaling, tenant isolation                            │   │
│  │  Cons: Uneven distribution if tenant sizes vary                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  PATTERN 2: SHARDING BY TIME                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Write Path:                    Read Path:                              │   │
│  │  ┌─────────────────┐           ┌─────────────────┐                     │   │
│  │  │ Current Ingester│           │  Query Frontend │                     │   │
│  │  │   (Hot Data)    │           │  (Time Routing) │                     │   │
│  │  └────────┬────────┘           └────────┬────────┘                     │   │
│  │           │                             │                               │   │
│  │           ▼                       ┌─────┼─────┐                         │   │
│  │  ┌─────────────────┐              │     │     │                         │   │
│  │  │  Object Storage │              ▼     ▼     ▼                         │   │
│  │  │  (Time Blocks)  │           ┌─────┐┌─────┐┌─────┐                   │   │
│  │  │  ├── 2024-01/   │           │Last ││Last ││Last │                   │   │
│  │  │  ├── 2024-02/   │           │24h  ││7d   ││30d  │                   │   │
│  │  │  └── 2024-03/   │           └─────┘└─────┘└─────┘                   │   │
│  │  └─────────────────┘                                                    │   │
│  │                                                                          │   │
│  │  Pros: Natural data lifecycle, efficient compaction                     │   │
│  │  Cons: Hot spots for recent data queries                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  PATTERN 3: FUNCTIONAL SHARDING                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    INGESTION CLUSTER                            │    │   │
│  │  │  Optimized for: High write throughput, low latency              │    │   │
│  │  │  Components: Distributors, Ingesters                            │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                          │   │
│  │                              ▼                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    QUERY CLUSTER                                │    │   │
│  │  │  Optimized for: Complex queries, high concurrency               │    │   │
│  │  │  Components: Query Frontends, Queriers, Store Gateways          │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  Pros: Independent scaling of read/write paths                          │   │
│  │  Cons: More complex deployment, potential consistency delays            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Disaster Recovery Design

Enterprise observability platforms require robust disaster recovery strategies.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PRIMARY REGION (US-EAST)              SECONDARY REGION (US-WEST)               │
│  ┌─────────────────────────┐          ┌─────────────────────────┐              │
│  │                         │          │                         │              │
│  │  ┌─────────────────┐   │          │  ┌─────────────────┐   │              │
│  │  │    Grafana      │   │          │  │    Grafana      │   │              │
│  │  │   (Active)      │   │   ───▶   │  │   (Standby)     │   │              │
│  │  └─────────────────┘   │  Config  │  └─────────────────┘   │              │
│  │                         │   Sync   │                         │              │
│  │  ┌─────────────────┐   │          │  ┌─────────────────┐   │              │
│  │  │     Mimir       │   │          │  │     Mimir       │   │              │
│  │  │   (Active)      │   │          │  │   (Standby)     │   │              │
│  │  └────────┬────────┘   │          │  └────────┬────────┘   │              │
│  │           │             │          │           │             │              │
│  │           ▼             │          │           ▼             │              │
│  │  ┌─────────────────┐   │          │  ┌─────────────────┐   │              │
│  │  │  Object Storage │   │   ───▶   │  │  Object Storage │   │              │
│  │  │   (Primary)     │   │  Cross-  │  │   (Replica)     │   │              │
│  │  └─────────────────┘   │  Region  │  └─────────────────┘   │              │
│  │                         │   Repl   │                         │              │
│  └─────────────────────────┘          └─────────────────────────┘              │
│                                                                                  │
│  RECOVERY OBJECTIVES                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Component        │ RPO (Data Loss)  │ RTO (Downtime)  │ Strategy       │   │
│  │──────────────────┼──────────────────┼─────────────────┼────────────────│   │
│  │ Grafana Config   │ 0 (GitOps)       │ < 15 minutes    │ Active-Standby │   │
│  │ Metrics (Mimir)  │ < 5 minutes      │ < 30 minutes    │ Cross-region   │   │
│  │ Logs (Loki)      │ < 5 minutes      │ < 30 minutes    │ Cross-region   │   │
│  │ Traces (Tempo)   │ < 15 minutes     │ < 1 hour        │ Async repl     │   │
│  │ Alerts           │ 0 (GitOps)       │ < 15 minutes    │ Active-Standby │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  FAILOVER PROCEDURE                                                             │
│  1. Detect primary region failure (automated health checks)                     │
│  2. Verify secondary region health                                              │
│  3. Update DNS to point to secondary region                                     │
│  4. Activate standby components                                                 │
│  5. Notify stakeholders                                                         │
│  6. Begin root cause analysis on primary                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### High Availability at Scale

Design for zero-downtime operations even during failures and maintenance.

```yaml
# High Availability Configuration for Mimir
# Ensures no single point of failure

# Ingester configuration for HA
ingester:
  ring:
    replication_factor: 3           # Data replicated to 3 ingesters
    heartbeat_period: 5s
    heartbeat_timeout: 1m
    
  # Zone-aware replication
  availability_zone: ${AVAILABILITY_ZONE}
  
# Distributor configuration
distributor:
  ring:
    kvstore:
      store: memberlist            # Gossip-based membership
  ha_tracker:
    enable_ha_tracker: true
    kvstore:
      store: consul
    
# Query configuration for HA
querier:
  # Query multiple store-gateways for redundancy
  store_gateway_addresses: dns+store-gateway-headless:9095
  
# Store-gateway configuration
store_gateway:
  sharding_ring:
    replication_factor: 3
    
# Compactor configuration (single active, multiple standby)
compactor:
  sharding_ring:
    kvstore:
      store: consul
```

---

## Multi-Cloud Strategies

> **📚 Related Content**: For Kubernetes fundamentals, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

Enterprise organizations increasingly operate across multiple cloud providers. Your observability strategy must provide unified visibility while respecting cloud-specific constraints.

### Cloud-Agnostic Architectures

Design observability solutions that work consistently across cloud providers.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CLOUD-AGNOSTIC OBSERVABILITY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ABSTRACTION LAYERS                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              UNIFIED VISUALIZATION (Grafana)                    │    │   │
│  │  │  • Consistent dashboards across clouds                         │    │   │
│  │  │  • Unified alerting and notification                           │    │   │
│  │  │  • Cross-cloud correlation                                     │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              UNIFIED DATA LAYER (LGTM Stack)                    │    │   │
│  │  │  • Cloud-agnostic storage (S3-compatible)                      │    │   │
│  │  │  • Consistent query interfaces (PromQL, LogQL)                 │    │   │
│  │  │  • Portable configuration                                      │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              UNIFIED COLLECTION (Grafana Alloy / OTEL)          │    │   │
│  │  │  • Single agent for all telemetry types                        │    │   │
│  │  │  • Cloud-native integrations                                   │    │   │
│  │  │  • Consistent labeling and metadata                            │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              INFRASTRUCTURE ABSTRACTION (Kubernetes)            │    │   │
│  │  │  • EKS (AWS) / GKE (GCP) / AKS (Azure)                        │    │   │
│  │  │  • Consistent deployment via Helm/Kustomize                    │    │   │
│  │  │  • GitOps for configuration management                         │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Cross-Cloud Observability

Implement unified observability across AWS, GCP, and Azure.

#### Unified Collection with Grafana Alloy

```yaml
# alloy-config.river - Multi-cloud collection configuration

// AWS CloudWatch metrics integration
prometheus.exporter.cloudwatch "aws_metrics" {
  sts_region = "us-east-1"
  
  discovery {
    type = "AWS/EC2"
    regions = ["us-east-1", "us-west-2"]
    
    metric {
      name = "CPUUtilization"
      statistics = ["Average", "Maximum"]
      period = "5m"
    }
    metric {
      name = "NetworkIn"
      statistics = ["Sum"]
      period = "5m"
    }
  }
  
  discovery {
    type = "AWS/RDS"
    regions = ["us-east-1"]
    
    metric {
      name = "DatabaseConnections"
      statistics = ["Average"]
      period = "1m"
    }
  }
}

// GCP Cloud Monitoring integration
prometheus.exporter.gcp "gcp_metrics" {
  project_ids = ["my-gcp-project"]
  
  metrics_prefixes = [
    "compute.googleapis.com/",
    "cloudsql.googleapis.com/",
    "kubernetes.io/",
  ]
}

// Azure Monitor integration
prometheus.exporter.azure "azure_metrics" {
  subscriptions = ["subscription-id"]
  
  resource_type = "Microsoft.Compute/virtualMachines"
  metrics = ["Percentage CPU", "Network In Total"]
}

// Unified labeling for all cloud metrics
prometheus.relabel "cloud_labels" {
  forward_to = [prometheus.remote_write.mimir.receiver]
  
  rule {
    source_labels = ["__meta_cloud_provider"]
    target_label = "cloud"
  }
  
  rule {
    source_labels = ["__meta_cloud_region"]
    target_label = "region"
  }
  
  rule {
    action = "labeldrop"
    regex = "__meta_.*"
  }
}

// Remote write to central Mimir
prometheus.remote_write "mimir" {
  endpoint {
    url = "https://mimir.observability.internal/api/v1/push"
    
    headers = {
      "X-Scope-OrgID" = "multi-cloud",
    }
  }
}
```

### Data Synchronization Patterns

Handle data consistency across cloud boundaries.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-CLOUD DATA SYNCHRONIZATION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PATTERN 1: CENTRALIZED AGGREGATION                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │     AWS                    GCP                    Azure                  │   │
│  │  ┌─────────┐           ┌─────────┐           ┌─────────┐               │   │
│  │  │ Alloy   │           │ Alloy   │           │ Alloy   │               │   │
│  │  └────┬────┘           └────┬────┘           └────┬────┘               │   │
│  │       │                     │                     │                     │   │
│  │       └─────────────────────┼─────────────────────┘                     │   │
│  │                             │                                           │   │
│  │                             ▼                                           │   │
│  │                    ┌─────────────────┐                                  │   │
│  │                    │  Central LGTM   │                                  │   │
│  │                    │  (Single Cloud) │                                  │   │
│  │                    └─────────────────┘                                  │   │
│  │                                                                          │   │
│  │  Pros: Simple architecture, single source of truth                      │   │
│  │  Cons: Single point of failure, egress costs, latency                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  PATTERN 2: FEDERATED WITH GLOBAL VIEW                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │     AWS                    GCP                    Azure                  │   │
│  │  ┌─────────┐           ┌─────────┐           ┌─────────┐               │   │
│  │  │ Local   │           │ Local   │           │ Local   │               │   │
│  │  │ LGTM    │           │ LGTM    │           │ LGTM    │               │   │
│  │  └────┬────┘           └────┬────┘           └────┬────┘               │   │
│  │       │                     │                     │                     │   │
│  │       └─────────────────────┼─────────────────────┘                     │   │
│  │                             │                                           │   │
│  │                             ▼                                           │   │
│  │                    ┌─────────────────┐                                  │   │
│  │                    │ Global Grafana  │                                  │   │
│  │                    │ (Federation)    │                                  │   │
│  │                    └─────────────────┘                                  │   │
│  │                                                                          │   │
│  │  Pros: Data locality, reduced egress, fault isolation                   │   │
│  │  Cons: Complex queries, eventual consistency                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  PATTERN 3: HYBRID (Recommended for Enterprise)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │     AWS                    GCP                    Azure                  │   │
│  │  ┌─────────┐           ┌─────────┐           ┌─────────┐               │   │
│  │  │ Local   │           │ Local   │           │ Local   │               │   │
│  │  │ LGTM    │           │ LGTM    │           │ LGTM    │               │   │
│  │  │ (Full)  │           │ (Full)  │           │ (Full)  │               │   │
│  │  └────┬────┘           └────┬────┘           └────┬────┘               │   │
│  │       │                     │                     │                     │   │
│  │       │    Aggregated       │    Aggregated       │                     │   │
│  │       │    Metrics Only     │    Metrics Only     │                     │   │
│  │       └─────────────────────┼─────────────────────┘                     │   │
│  │                             │                                           │   │
│  │                             ▼                                           │   │
│  │                    ┌─────────────────┐                                  │   │
│  │                    │  Global LGTM    │                                  │   │
│  │                    │  (Aggregates +  │                                  │   │
│  │                    │   Federation)   │                                  │   │
│  │                    └─────────────────┘                                  │   │
│  │                                                                          │   │
│  │  Pros: Best of both worlds, optimized for cost and performance          │   │
│  │  Cons: Most complex to implement and operate                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Vendor Lock-in Mitigation

Strategies to maintain flexibility and avoid vendor lock-in.

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Open Standards** | OpenTelemetry for instrumentation, Prometheus for metrics | Portable telemetry |
| **Abstraction Layers** | Kubernetes for compute, S3-compatible for storage | Cloud portability |
| **GitOps** | All configuration in Git, Helm/Kustomize for deployment | Reproducible deployments |
| **API Compatibility** | Use standard APIs (Prometheus, Jaeger, OpenSearch) | Tool interchangeability |
| **Data Export** | Regular data exports, standard formats (OTLP, Parquet) | Data portability |
| **Multi-Cloud Testing** | Regular DR drills across clouds | Validated portability |

### Hybrid Cloud Considerations

Many enterprises maintain on-premises infrastructure alongside cloud deployments.

```yaml
# Hybrid cloud collection architecture
# On-premises to cloud connectivity

# On-premises Alloy configuration
server:
  log_level: info

# Collect from on-premises infrastructure
prometheus.scrape "onprem_servers" {
  targets = [
    {"__address__" = "server1.internal:9100"},
    {"__address__" = "server2.internal:9100"},
    {"__address__" = "server3.internal:9100"},
  ]
  
  forward_to = [prometheus.relabel.add_location.receiver]
}

# Add location labels
prometheus.relabel "add_location" {
  forward_to = [prometheus.remote_write.cloud.receiver]
  
  rule {
    target_label = "cloud"
    replacement = "on-premises"
  }
  
  rule {
    target_label = "datacenter"
    replacement = "dc1"
  }
}

# Remote write to cloud (via secure tunnel)
prometheus.remote_write "cloud" {
  endpoint {
    url = "https://mimir.cloud.example.com/api/v1/push"
    
    # mTLS authentication
    tls_config {
      cert_file = "/etc/alloy/certs/client.crt"
      key_file = "/etc/alloy/certs/client.key"
      ca_file = "/etc/alloy/certs/ca.crt"
    }
    
    headers = {
      "X-Scope-OrgID" = "hybrid-cloud",
    }
  }
  
  # Queue configuration for unreliable connectivity
  queue_config {
    capacity = 100000
    max_shards = 50
    max_samples_per_send = 5000
    batch_send_deadline = "30s"
    min_backoff = "1s"
    max_backoff = "5m"
  }
}
```

---

## SLOs, SLIs, SLAs, and Capacity Planning

> **📚 Related Content**: For observability principles, see [Observability Principles](../../shared-concepts/observability-principles.md)

Service Level Objectives (SLOs) are the foundation of reliability engineering. As a Senior Observability Architect, you'll design and implement SLO frameworks that drive operational excellence.


### SLO Framework Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLO FRAMEWORK HIERARCHY                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SLA (Service Level Agreement)                    │   │
│  │  External commitment to customers, contractual, financial penalties     │   │
│  │  Example: "99.9% availability, measured monthly"                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SLO (Service Level Objective)                    │   │
│  │  Internal target, more stringent than SLA, drives engineering decisions │   │
│  │  Example: "99.95% availability, measured over 28-day rolling window"    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SLI (Service Level Indicator)                    │   │
│  │  Quantitative measure of service behavior, the metric behind the SLO    │   │
│  │  Example: "Successful requests / Total requests"                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Error Budget                                     │   │
│  │  Allowed unreliability = 1 - SLO target                                 │   │
│  │  Example: 99.95% SLO = 0.05% error budget = 21.6 minutes/month          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### SLI Selection and Measurement

Choose SLIs that accurately reflect user experience.

#### Common SLI Types

| SLI Type | Definition | Measurement | Use Case |
|----------|------------|-------------|----------|
| **Availability** | Proportion of time service is operational | `up{job="service"} == 1` | All services |
| **Latency** | Time to serve a request | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` | User-facing APIs |
| **Error Rate** | Proportion of failed requests | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` | All APIs |
| **Throughput** | Requests processed per unit time | `rate(http_requests_total[5m])` | Batch processing |
| **Correctness** | Proportion of correct responses | Custom validation metrics | Data pipelines |
| **Freshness** | Age of data | `time() - last_update_timestamp` | Real-time systems |

#### SLI Implementation in Prometheus

```yaml
# Recording rules for SLI calculation
groups:
  - name: sli_recording_rules
    interval: 30s
    rules:
      # Availability SLI: Service is responding
      - record: sli:availability:ratio
        expr: |
          avg_over_time(up{job="api-gateway"}[5m])
      
      # Latency SLI: P99 latency under threshold
      - record: sli:latency:ratio
        expr: |
          sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
          /
          sum(rate(http_request_duration_seconds_count[5m]))
      
      # Error Rate SLI: Successful requests ratio
      - record: sli:errors:ratio
        expr: |
          1 - (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          )
      
      # Combined SLI (all conditions must be met)
      - record: sli:combined:ratio
        expr: |
          min(
            sli:availability:ratio,
            sli:latency:ratio,
            sli:errors:ratio
          )
```

### SLO Definition and Implementation

Define SLOs that balance reliability with development velocity.

```yaml
# SLO definitions using Sloth (SLO generator for Prometheus)
version: "prometheus/v1"
service: "api-gateway"
labels:
  team: platform
  tier: critical

slos:
  # Availability SLO
  - name: "availability"
    objective: 99.95
    description: "API Gateway must be available 99.95% of the time"
    sli:
      events:
        error_query: sum(rate(http_requests_total{job="api-gateway",status=~"5.."}[{{.window}}]))
        total_query: sum(rate(http_requests_total{job="api-gateway"}[{{.window}}]))
    alerting:
      name: APIGatewayAvailabilitySLOBreach
      labels:
        severity: critical
      annotations:
        summary: "API Gateway availability SLO is at risk"
        runbook: "https://runbooks.internal/api-gateway-availability"
      page_alert:
        labels:
          severity: critical
      ticket_alert:
        labels:
          severity: warning

  # Latency SLO
  - name: "latency"
    objective: 99.0
    description: "99% of requests must complete within 500ms"
    sli:
      events:
        error_query: |
          sum(rate(http_request_duration_seconds_count{job="api-gateway"}[{{.window}}]))
          -
          sum(rate(http_request_duration_seconds_bucket{job="api-gateway",le="0.5"}[{{.window}}]))
        total_query: sum(rate(http_request_duration_seconds_count{job="api-gateway"}[{{.window}}]))
    alerting:
      name: APIGatewayLatencySLOBreach
      labels:
        severity: warning
```

### Error Budget Policies

Define how error budgets drive operational decisions.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ERROR BUDGET POLICY FRAMEWORK                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ERROR BUDGET CALCULATION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  SLO Target: 99.95%                                                     │   │
│  │  Error Budget: 100% - 99.95% = 0.05%                                    │   │
│  │                                                                          │   │
│  │  Monthly Error Budget (30 days):                                        │   │
│  │  0.05% × 30 days × 24 hours × 60 minutes = 21.6 minutes                │   │
│  │                                                                          │   │
│  │  Weekly Error Budget (7 days):                                          │   │
│  │  0.05% × 7 days × 24 hours × 60 minutes = 5.04 minutes                 │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ERROR BUDGET CONSUMPTION THRESHOLDS                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Budget Remaining │ Status    │ Actions                                 │   │
│  │  ─────────────────┼───────────┼─────────────────────────────────────────│   │
│  │  > 50%            │ 🟢 Green  │ Normal operations, feature development  │   │
│  │  25% - 50%        │ 🟡 Yellow │ Increased monitoring, cautious releases │   │
│  │  10% - 25%        │ 🟠 Orange │ Freeze non-critical changes, focus on   │   │
│  │                   │           │ reliability improvements                │   │
│  │  < 10%            │ 🔴 Red    │ Emergency mode: only critical fixes,    │   │
│  │                   │           │ all hands on reliability                │   │
│  │  Exhausted        │ ⚫ Black  │ Incident declared, postmortem required  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  POLICY ACTIONS BY THRESHOLD                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  🟢 GREEN (>50% remaining):                                             │   │
│  │  • Normal sprint velocity                                               │   │
│  │  • Feature releases proceed as planned                                  │   │
│  │  • Standard change management                                           │   │
│  │                                                                          │   │
│  │  🟡 YELLOW (25-50% remaining):                                          │   │
│  │  • Review upcoming releases for risk                                    │   │
│  │  • Increase testing coverage                                            │   │
│  │  • Daily error budget review                                            │   │
│  │                                                                          │   │
│  │  🟠 ORANGE (10-25% remaining):                                          │   │
│  │  • Freeze non-critical deployments                                      │   │
│  │  • Prioritize reliability work                                          │   │
│  │  • Escalate to engineering leadership                                   │   │
│  │                                                                          │   │
│  │  🔴 RED (<10% remaining):                                               │   │
│  │  • Emergency change freeze                                              │   │
│  │  • All engineering focus on reliability                                 │   │
│  │  • Executive notification                                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Capacity Planning

Proactive capacity planning ensures your observability platform scales with business growth.

#### Capacity Forecasting

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CAPACITY FORECASTING MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  METRICS CAPACITY PLANNING                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Current State:                                                         │   │
│  │  • Active Series: 5,000,000                                            │   │
│  │  • Ingestion Rate: 500,000 samples/second                              │   │
│  │  • Storage: 2 TB (30-day retention)                                    │   │
│  │                                                                          │   │
│  │  Growth Factors:                                                        │   │
│  │  • New services: +20% per quarter                                      │   │
│  │  • Increased instrumentation: +10% per quarter                         │   │
│  │  • New teams onboarding: +15% per quarter                              │   │
│  │                                                                          │   │
│  │  Quarterly Growth Rate: ~45% compound                                   │   │
│  │                                                                          │   │
│  │  12-Month Forecast:                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Quarter │ Active Series │ Ingestion Rate │ Storage │ Cost      │   │   │
│  │  │─────────┼───────────────┼────────────────┼─────────┼───────────│   │   │
│  │  │ Q1      │ 5.0M          │ 500K/s         │ 2 TB    │ $10,000   │   │   │
│  │  │ Q2      │ 7.25M         │ 725K/s         │ 3 TB    │ $14,500   │   │   │
│  │  │ Q3      │ 10.5M         │ 1.05M/s        │ 4.5 TB  │ $21,000   │   │   │
│  │  │ Q4      │ 15.2M         │ 1.52M/s        │ 6.5 TB  │ $30,400   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LOGS CAPACITY PLANNING                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Current State:                                                         │   │
│  │  • Daily Volume: 500 GB/day                                            │   │
│  │  • Retention: 30 days                                                  │   │
│  │  • Total Storage: 15 TB                                                │   │
│  │                                                                          │   │
│  │  Growth Factors:                                                        │   │
│  │  • Increased logging verbosity: +5% per quarter                        │   │
│  │  • New services: +20% per quarter                                      │   │
│  │  • Extended retention requirements: +30 days in Q3                     │   │
│  │                                                                          │   │
│  │  12-Month Forecast:                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Quarter │ Daily Volume │ Retention │ Total Storage │ Cost      │   │   │
│  │  │─────────┼──────────────┼───────────┼───────────────┼───────────│   │   │
│  │  │ Q1      │ 500 GB       │ 30 days   │ 15 TB         │ $1,500    │   │   │
│  │  │ Q2      │ 625 GB       │ 30 days   │ 18.75 TB      │ $1,875    │   │   │
│  │  │ Q3      │ 781 GB       │ 60 days   │ 46.9 TB       │ $4,690    │   │   │
│  │  │ Q4      │ 976 GB       │ 60 days   │ 58.6 TB       │ $5,860    │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Performance Modeling

Use historical data to model system performance under load.

```yaml
# Prometheus recording rules for capacity metrics
groups:
  - name: capacity_planning
    interval: 5m
    rules:
      # Current resource utilization
      - record: capacity:cpu_utilization:avg
        expr: |
          avg(
            rate(container_cpu_usage_seconds_total{namespace="observability"}[5m])
            /
            container_spec_cpu_quota{namespace="observability"} * 100000
          ) by (pod)
      
      - record: capacity:memory_utilization:avg
        expr: |
          avg(
            container_memory_usage_bytes{namespace="observability"}
            /
            container_spec_memory_limit_bytes{namespace="observability"}
          ) by (pod)
      
      # Growth rate calculations
      - record: capacity:active_series:growth_rate_weekly
        expr: |
          (
            sum(cortex_ingester_active_series)
            -
            sum(cortex_ingester_active_series offset 7d)
          )
          /
          sum(cortex_ingester_active_series offset 7d)
      
      # Time to capacity exhaustion
      - record: capacity:storage:days_until_full
        expr: |
          (
            sum(kubelet_volume_stats_capacity_bytes{namespace="observability"})
            -
            sum(kubelet_volume_stats_used_bytes{namespace="observability"})
          )
          /
          (
            sum(rate(kubelet_volume_stats_used_bytes{namespace="observability"}[7d]))
            * 86400
          )
```

#### Load Testing Strategies

Validate capacity assumptions through systematic load testing.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOAD TESTING FRAMEWORK                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TEST TYPES                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  1. BASELINE TEST                                                       │   │
│  │     Purpose: Establish normal operating parameters                      │   │
│  │     Load: Current production traffic                                    │   │
│  │     Duration: 1 hour                                                    │   │
│  │     Metrics: Latency, throughput, resource utilization                  │   │
│  │                                                                          │   │
│  │  2. STRESS TEST                                                         │   │
│  │     Purpose: Find breaking points                                       │   │
│  │     Load: Gradually increase until failure                              │   │
│  │     Duration: Until system degrades                                     │   │
│  │     Metrics: Max throughput, failure modes                              │   │
│  │                                                                          │   │
│  │  3. SPIKE TEST                                                          │   │
│  │     Purpose: Test sudden traffic increases                              │   │
│  │     Load: 10x normal traffic instantly                                  │   │
│  │     Duration: 15 minutes                                                │   │
│  │     Metrics: Recovery time, data loss                                   │   │
│  │                                                                          │   │
│  │  4. SOAK TEST                                                           │   │
│  │     Purpose: Find memory leaks, resource exhaustion                     │   │
│  │     Load: 80% of capacity                                               │   │
│  │     Duration: 24-72 hours                                               │   │
│  │     Metrics: Resource trends, stability                                 │   │
│  │                                                                          │   │
│  │  5. CAPACITY TEST                                                       │   │
│  │     Purpose: Validate forecasted capacity                               │   │
│  │     Load: Projected Q4 traffic                                          │   │
│  │     Duration: 4 hours                                                   │   │
│  │     Metrics: All SLIs meet targets                                      │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LOAD TESTING CHECKLIST                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ □ Isolated test environment (not production)                            │   │
│  │ □ Realistic data patterns (not synthetic)                               │   │
│  │ □ Monitoring in place before test starts                                │   │
│  │ □ Rollback plan if test impacts production                              │   │
│  │ □ Stakeholder notification                                              │   │
│  │ □ Results documented and compared to baseline                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Practical Examples

### Example 1: Enterprise SLO Dashboard

```yaml
# Grafana Dashboard for SLO Tracking
# File: slo-dashboard.json (simplified YAML representation)

title: "Enterprise SLO Dashboard"
uid: "enterprise-slo"
tags: ["slo", "reliability", "executive"]

templating:
  - name: service
    type: query
    query: 'label_values(slo_target, service)'
  - name: window
    type: custom
    options: ["7d", "28d", "30d"]

panels:
  - title: "SLO Status Overview"
    type: stat
    gridPos: {x: 0, y: 0, w: 24, h: 4}
    targets:
      - expr: |
          count(slo_current >= slo_target) / count(slo_target) * 100
    fieldConfig:
      thresholds:
        - value: 90
          color: green
        - value: 75
          color: yellow
        - value: 0
          color: red

  - title: "Error Budget Remaining"
    type: gauge
    gridPos: {x: 0, y: 4, w: 8, h: 6}
    targets:
      - expr: |
          (1 - (1 - slo_current{service="$service"}) / (1 - slo_target{service="$service"})) * 100
    fieldConfig:
      max: 100
      thresholds:
        - value: 50
          color: green
        - value: 25
          color: yellow
        - value: 10
          color: orange
        - value: 0
          color: red

  - title: "SLO Trend (28 days)"
    type: timeseries
    gridPos: {x: 8, y: 4, w: 16, h: 6}
    targets:
      - expr: 'slo_current{service="$service"}'
        legendFormat: "Current SLO"
      - expr: 'slo_target{service="$service"}'
        legendFormat: "Target"

  - title: "Error Budget Burn Rate"
    type: timeseries
    gridPos: {x: 0, y: 10, w: 12, h: 6}
    targets:
      - expr: |
          rate(slo_errors_total{service="$service"}[1h])
          /
          rate(slo_requests_total{service="$service"}[1h])
          /
          (1 - slo_target{service="$service"})
        legendFormat: "Burn Rate (1 = sustainable)"
    fieldConfig:
      custom:
        thresholdsStyle:
          mode: line
      thresholds:
        - value: 1
          color: yellow
        - value: 2
          color: red

  - title: "Incidents Impact on Error Budget"
    type: table
    gridPos: {x: 12, y: 10, w: 12, h: 6}
    targets:
      - expr: |
          topk(10, 
            sum by (incident_id, description) (
              increase(slo_errors_total{service="$service"}[7d])
            )
          )
```


### Example 2: Multi-Tenant Cost Attribution Report

```python
#!/usr/bin/env python3
"""
Multi-Tenant Cost Attribution Report Generator

This script generates monthly cost reports for each tenant based on
their observability platform usage.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List
import json

@dataclass
class TenantUsage:
    tenant_id: str
    active_series_avg: float
    samples_ingested: int
    log_bytes_ingested: int
    trace_spans_ingested: int
    query_compute_units: int

@dataclass
class CostModel:
    # Cost per unit (example pricing)
    cost_per_1k_series_day: float = 0.01
    cost_per_1m_samples: float = 0.10
    cost_per_gb_logs: float = 0.50
    cost_per_1m_spans: float = 0.30
    cost_per_1k_query_units: float = 0.05
    infrastructure_base_cost: float = 5000.0

def calculate_tenant_cost(usage: TenantUsage, model: CostModel, days: int = 30) -> Dict:
    """Calculate cost breakdown for a tenant."""
    
    # Metrics cost
    series_cost = (usage.active_series_avg / 1000) * days * model.cost_per_1k_series_day
    samples_cost = (usage.samples_ingested / 1_000_000) * model.cost_per_1m_samples
    metrics_total = series_cost + samples_cost
    
    # Logs cost
    log_gb = usage.log_bytes_ingested / (1024 ** 3)
    logs_total = log_gb * model.cost_per_gb_logs
    
    # Traces cost
    traces_total = (usage.trace_spans_ingested / 1_000_000) * model.cost_per_1m_spans
    
    # Query cost
    query_total = (usage.query_compute_units / 1000) * model.cost_per_1k_query_units
    
    # Total
    usage_total = metrics_total + logs_total + traces_total + query_total
    
    return {
        "tenant_id": usage.tenant_id,
        "period_days": days,
        "breakdown": {
            "metrics": {
                "active_series_cost": round(series_cost, 2),
                "ingestion_cost": round(samples_cost, 2),
                "total": round(metrics_total, 2)
            },
            "logs": {
                "volume_gb": round(log_gb, 2),
                "total": round(logs_total, 2)
            },
            "traces": {
                "spans_millions": round(usage.trace_spans_ingested / 1_000_000, 2),
                "total": round(traces_total, 2)
            },
            "queries": {
                "compute_units_k": round(usage.query_compute_units / 1000, 2),
                "total": round(query_total, 2)
            }
        },
        "usage_total": round(usage_total, 2),
        "generated_at": datetime.utcnow().isoformat()
    }

def generate_chargeback_report(tenants: List[TenantUsage], model: CostModel) -> Dict:
    """Generate complete chargeback report for all tenants."""
    
    reports = [calculate_tenant_cost(t, model) for t in tenants]
    total_usage_cost = sum(r["usage_total"] for r in reports)
    
    # Allocate infrastructure cost proportionally
    for report in reports:
        proportion = report["usage_total"] / total_usage_cost if total_usage_cost > 0 else 0
        infra_share = model.infrastructure_base_cost * proportion
        report["infrastructure_share"] = round(infra_share, 2)
        report["grand_total"] = round(report["usage_total"] + infra_share, 2)
    
    return {
        "report_type": "monthly_chargeback",
        "period": f"{datetime.utcnow().strftime('%Y-%m')}",
        "tenants": reports,
        "summary": {
            "total_usage_cost": round(total_usage_cost, 2),
            "infrastructure_cost": model.infrastructure_base_cost,
            "grand_total": round(total_usage_cost + model.infrastructure_base_cost, 2)
        }
    }

# Example usage
if __name__ == "__main__":
    tenants = [
        TenantUsage(
            tenant_id="enterprise-a",
            active_series_avg=5_000_000,
            samples_ingested=12_960_000_000,
            log_bytes_ingested=500 * 30 * (1024 ** 3),  # 500 GB/day * 30 days
            trace_spans_ingested=100_000_000,
            query_compute_units=500_000
        ),
        TenantUsage(
            tenant_id="standard-b",
            active_series_avg=1_000_000,
            samples_ingested=2_592_000_000,
            log_bytes_ingested=100 * 30 * (1024 ** 3),
            trace_spans_ingested=20_000_000,
            query_compute_units=100_000
        ),
    ]
    
    report = generate_chargeback_report(tenants, CostModel())
    print(json.dumps(report, indent=2))
```

### Example 3: Capacity Planning Automation

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
)

// CapacityMetrics holds current capacity measurements
type CapacityMetrics struct {
	ActiveSeries     float64
	IngestionRate    float64
	StorageUsedGB    float64
	StorageCapacityGB float64
	CPUUtilization   float64
	MemoryUtilization float64
}

// CapacityForecast predicts future capacity needs
type CapacityForecast struct {
	CurrentMetrics    CapacityMetrics
	WeeklyGrowthRate  float64
	DaysUntilCapacity int
	RecommendedAction string
}

// CapacityPlanner analyzes and forecasts capacity
type CapacityPlanner struct {
	client v1.API
}

// NewCapacityPlanner creates a new capacity planner
func NewCapacityPlanner(prometheusURL string) (*CapacityPlanner, error) {
	client, err := api.NewClient(api.Config{
		Address: prometheusURL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Prometheus client: %w", err)
	}

	return &CapacityPlanner{
		client: v1.NewAPI(client),
	}, nil
}

// GetCurrentMetrics fetches current capacity metrics
func (cp *CapacityPlanner) GetCurrentMetrics(ctx context.Context) (*CapacityMetrics, error) {
	metrics := &CapacityMetrics{}

	// Query active series
	result, _, err := cp.client.Query(ctx, 
		`sum(cortex_ingester_active_series)`, 
		time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to query active series: %w", err)
	}
	if vec, ok := result.(model.Vector); ok && len(vec) > 0 {
		metrics.ActiveSeries = float64(vec[0].Value)
	}

	// Query ingestion rate
	result, _, err = cp.client.Query(ctx,
		`sum(rate(cortex_distributor_received_samples_total[5m]))`,
		time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to query ingestion rate: %w", err)
	}
	if vec, ok := result.(model.Vector); ok && len(vec) > 0 {
		metrics.IngestionRate = float64(vec[0].Value)
	}

	// Query storage utilization
	result, _, err = cp.client.Query(ctx,
		`sum(kubelet_volume_stats_used_bytes{namespace="observability"}) / 1024 / 1024 / 1024`,
		time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to query storage used: %w", err)
	}
	if vec, ok := result.(model.Vector); ok && len(vec) > 0 {
		metrics.StorageUsedGB = float64(vec[0].Value)
	}

	return metrics, nil
}

// CalculateForecast generates capacity forecast
func (cp *CapacityPlanner) CalculateForecast(ctx context.Context) (*CapacityForecast, error) {
	current, err := cp.GetCurrentMetrics(ctx)
	if err != nil {
		return nil, err
	}

	// Calculate weekly growth rate from historical data
	growthQuery := `
		(sum(cortex_ingester_active_series) - sum(cortex_ingester_active_series offset 7d))
		/ sum(cortex_ingester_active_series offset 7d)
	`
	result, _, err := cp.client.Query(ctx, growthQuery, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to calculate growth rate: %w", err)
	}

	var growthRate float64
	if vec, ok := result.(model.Vector); ok && len(vec) > 0 {
		growthRate = float64(vec[0].Value)
	}

	// Calculate days until capacity exhaustion
	storageGrowthPerDay := current.StorageUsedGB * growthRate / 7
	remainingStorage := current.StorageCapacityGB - current.StorageUsedGB
	daysUntilFull := int(remainingStorage / storageGrowthPerDay)

	// Determine recommended action
	var action string
	switch {
	case daysUntilFull < 7:
		action = "CRITICAL: Immediate capacity expansion required"
	case daysUntilFull < 30:
		action = "WARNING: Plan capacity expansion within 2 weeks"
	case daysUntilFull < 90:
		action = "INFO: Schedule capacity review for next quarter"
	default:
		action = "OK: Capacity sufficient for foreseeable future"
	}

	return &CapacityForecast{
		CurrentMetrics:    *current,
		WeeklyGrowthRate:  growthRate * 100, // Convert to percentage
		DaysUntilCapacity: daysUntilFull,
		RecommendedAction: action,
	}, nil
}

func main() {
	planner, err := NewCapacityPlanner("http://prometheus:9090")
	if err != nil {
		log.Fatalf("Failed to create capacity planner: %v", err)
	}

	ctx := context.Background()
	forecast, err := planner.CalculateForecast(ctx)
	if err != nil {
		log.Fatalf("Failed to calculate forecast: %v", err)
	}

	fmt.Printf("Capacity Forecast Report\n")
	fmt.Printf("========================\n")
	fmt.Printf("Active Series: %.0f\n", forecast.CurrentMetrics.ActiveSeries)
	fmt.Printf("Ingestion Rate: %.0f samples/sec\n", forecast.CurrentMetrics.IngestionRate)
	fmt.Printf("Storage Used: %.2f GB\n", forecast.CurrentMetrics.StorageUsedGB)
	fmt.Printf("Weekly Growth Rate: %.2f%%\n", forecast.WeeklyGrowthRate)
	fmt.Printf("Days Until Capacity: %d\n", forecast.DaysUntilCapacity)
	fmt.Printf("Recommendation: %s\n", forecast.RecommendedAction)
}
```

---

## Key Takeaways

### ROI Analysis and Value Realization

1. **Quantify Everything**: Convert observability benefits into financial metrics (MTTR reduction, productivity gains, prevented outages)
2. **Build Compelling Business Cases**: Align technical investments with business outcomes
3. **Continuous Value Demonstration**: Establish dashboards and reports that show ongoing ROI
4. **TCO Awareness**: Consider hidden costs like integration, maintenance, and opportunity costs

### Multi-Tenant Architectures

1. **Choose Appropriate Isolation**: Match isolation level to security and compliance requirements
2. **Implement Fair Billing**: Use usage-based chargeback models for cost transparency
3. **Plan for Growth**: Design tenant limits that can scale with business needs
4. **Ensure Compliance**: Address data residency, encryption, and audit requirements

### Enterprise-Scale Design Patterns

1. **Federate for Scale**: Use federated architectures for global organizations
2. **Design for Failure**: Implement disaster recovery with clear RPO/RTO targets
3. **Scale Horizontally**: Use sharding patterns appropriate for your data characteristics
4. **Automate Operations**: Reduce operational burden through GitOps and automation

### Multi-Cloud Strategies

1. **Embrace Open Standards**: Use OpenTelemetry and Prometheus for portability
2. **Abstract Infrastructure**: Kubernetes provides consistent deployment across clouds
3. **Plan Data Flows**: Choose centralized, federated, or hybrid based on requirements
4. **Mitigate Lock-in**: Maintain flexibility through abstraction and standard APIs

### SLOs, SLIs, SLAs, and Capacity Planning

1. **Start with User Experience**: Choose SLIs that reflect what users care about
2. **Set Realistic Targets**: SLOs should be achievable but drive improvement
3. **Use Error Budgets**: Let error budgets guide operational decisions
4. **Plan Proactively**: Use forecasting to stay ahead of capacity needs
5. **Test Assumptions**: Validate capacity plans through systematic load testing

---

## Next Steps

After mastering these advanced concepts:

1. **Practice with Questions**: Test your knowledge with [Technical Questions](./questions/questions-and-answers.md)
2. **Hands-On Implementation**: Work through [Code Implementations](../../code-implementations/)
3. **Review Fundamentals**: Ensure solid foundation with [Fundamentals](./fundamentals.md)
4. **Explore Intermediate Topics**: Deepen skills with [Intermediate](./intermediate.md)

---

## Additional Resources

### Internal References

- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md) - Platform overview
- [LGTM Stack](../../shared-concepts/lgtm-stack.md) - Technical deep dive
- [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md) - Infrastructure foundation
- [Observability Principles](../../shared-concepts/observability-principles.md) - Core concepts

### External Resources

- [Google SRE Book - SLOs](https://sre.google/sre-book/service-level-objectives/)
- [Grafana SLO Documentation](https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/)
- [OpenSLO Specification](https://openslo.com/)
- [FinOps Foundation](https://www.finops.org/) - Cloud cost management
- [CNCF Multi-Tenancy Working Group](https://github.com/kubernetes-sigs/multi-tenancy)

---

**Congratulations!** You've completed the advanced content for the Senior Observability Architect role. Continue to the [Questions](./questions/) section to test your knowledge.
