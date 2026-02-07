# Senior Observability Architect - Questions and Answers

This document contains 15 technical interview questions with detailed senior-level answers for the Senior Observability Architect role at Grafana Labs.

---

## System Design Questions

### Question 1: Design an Enterprise Observability Platform for a Fortune 500 Company

**Difficulty**: Advanced  
**Category**: System Design

#### Question

You've been engaged by a Fortune 500 financial services company with 500+ microservices across 3 cloud providers (AWS, GCP, Azure) and on-premises data centers. They currently have fragmented monitoring with Datadog for some teams, Splunk for logs, and various Prometheus instances. Design a unified enterprise observability platform that addresses their needs for the next 5 years.

Consider:
- Data sovereignty requirements (EU data must stay in EU)
- 10 million active metric series, 5TB logs/day, 1 billion spans/day
- 200+ engineering teams with varying maturity levels
- Strict compliance requirements (SOC2, PCI-DSS)
- Budget constraints requiring demonstrable ROI

#### Answer

**Executive Summary**

I would design a federated observability architecture using the Grafana LGTM stack with regional deployments to address data sovereignty, centralized governance for compliance, and a phased migration approach to manage risk and demonstrate ROI.

**Architecture Design**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE OBSERVABILITY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      GLOBAL LAYER                                        │   │
│  │  Central Grafana │ Global Alerting │ Governance & Compliance             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │                            │                            │            │
│         ▼                            ▼                            ▼            │
│  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐    │
│  │   US REGION     │        │   EU REGION     │        │   APAC REGION   │    │
│  │  Mimir/Loki/    │        │  Mimir/Loki/    │        │  Mimir/Loki/    │    │
│  │  Tempo          │        │  Tempo          │        │  Tempo          │    │
│  │  AWS + On-Prem  │        │  GCP + Azure    │        │  AWS + Azure    │    │
│  └─────────────────┘        └─────────────────┘        └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions**

1. **Federated Architecture for Data Sovereignty**
   - Deploy regional LGTM stacks in US, EU, and APAC
   - EU data never leaves EU region (GDPR compliance)
   - Central Grafana uses data source federation for global views
   - Cross-region queries only for aggregated, non-PII metrics

2. **Multi-Tenant Design**
   - Use Mimir/Loki native multi-tenancy with `X-Scope-OrgID`
   - Per-team resource quotas and rate limits
   - Grafana organizations aligned with business units
   - RBAC integrated with corporate SSO (Okta/Azure AD)

3. **Collection Strategy**
   - Grafana Alloy as unified collection agent across all environments
   - OpenTelemetry for application instrumentation
   - Cloud-native integrations for managed services

4. **Compliance Controls**
   - Audit logging for all data access
   - Encryption at rest (AES-256) and in transit (TLS 1.3)
   - Data retention policies aligned with PCI-DSS (1 year for audit data)

**Capacity Planning**

| Component | Per Region | Total | Storage (Annual) |
|-----------|------------|-------|------------------|
| Mimir Ingesters | 9 (3 per AZ) | 27 | 50TB |
| Loki Ingesters | 6 (2 per AZ) | 18 | 1.8PB |
| Tempo | 3 | 9 | 500TB |

**ROI Justification**

| Benefit | Annual Value |
|---------|--------------|
| Tool consolidation | $2.4M |
| MTTR reduction (4hr → 30min) | $8.75M |
| Developer productivity | $2M |
| **Total Annual Benefit** | **$13.15M** |
| **Platform Cost** | **$1.5M** |
| **ROI** | **776%** |

---

### Question 2: Architect a Multi-Region Observability Solution with Data Sovereignty

**Difficulty**: Advanced  
**Category**: System Design

#### Question

A European healthcare company is expanding to the US and Asia. They need an observability solution that keeps patient-related data in the originating region (GDPR, HIPAA), provides global visibility for the SRE team, supports 50 Kubernetes clusters across 3 regions, and must handle 99.99% availability requirements. How would you architect this solution?

#### Answer

**Architecture: Data-Local, Visibility-Global**

I would implement an architecture where telemetry data remains in its originating region while providing aggregated, anonymized views globally.

**Data Classification and Handling**

| Data Type | Classification | Handling | Global Visibility |
|-----------|---------------|----------|-------------------|
| Patient IDs | PHI/PII | Region-locked, encrypted | Never |
| Request traces with patient context | PHI | Region-locked | Anonymized spans only |
| Infrastructure metrics | Non-sensitive | Region-local | Aggregated via recording rules |
| SLO metrics | Non-sensitive | Region-local | Federated queries allowed |

**High Availability Design (99.99%)**

```yaml
# Per-region HA configuration
mimir:
  ingesters:
    replicas: 6  # 2 per AZ
    replication_factor: 3
  distributors:
    replicas: 3
  queriers:
    replicas: 6
  ingester:
    ring:
      zone_awareness_enabled: true
```

**Recording Rules for Global Aggregation (PII-Free)**

```yaml
groups:
  - name: global_slos
    interval: 1m
    rules:
      - record: region:request_success_rate:5m
        expr: |
          sum(rate(http_requests_total{status=~"2.."}[5m])) by (region, service)
          / sum(rate(http_requests_total[5m])) by (region, service)
```

**Compliance Controls**
- Network Isolation: VPC peering only for control plane
- Encryption: Customer-managed keys (CMK) per region
- Access Logging: All queries logged with user identity
- Data Retention: Configurable per region (EU: 90 days, US: 1 year for HIPAA)

---

### Question 3: Design a Federated Observability Architecture for Multi-Cloud

**Difficulty**: Advanced  
**Category**: System Design

#### Question

A large e-commerce company runs workloads across AWS (primary), GCP (ML workloads), and Azure (acquired company). Design an architecture that provides consistent observability across all clouds, minimizes data egress costs, supports 1000+ services, and enables gradual migration from cloud-native tools.

#### Answer

**Architecture: Hub-and-Spoke with Local Processing**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL HUB (AWS)                                        │
│  Grafana (Primary UI) │ Global Alertmanager │ Cross-Cloud Dashboards            │
│  MIMIR GLOBAL VIEW (Federated queries to regional instances)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│         │ (Private Link)         │ (VPN)                      │ (VPN)          │
│         ▼                        ▼                            ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   AWS SPOKE     │    │   GCP SPOKE     │    │  AZURE SPOKE    │            │
│  │  Mimir/Loki/    │    │  Mimir/Loki/    │    │  Mimir/Loki/    │            │
│  │  Tempo + Alloy  │    │  Tempo + Alloy  │    │  Tempo + Alloy  │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Data Egress Optimization Strategy**

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| Local storage | Each cloud stores its own data | 90% egress reduction |
| Recording rules | Pre-aggregate before federation | 80% query egress reduction |
| Selective federation | Only SLO/golden signals cross clouds | 95% reduction |
| Compression | gRPC with compression | 60% bandwidth reduction |

**Unified Labeling Standard**

```yaml
labels:
  cloud: aws | gcp | azure
  region: us-east-1 | us-central1 | eastus
  environment: production | staging | development
  team: platform | payments | search | ml
  service: api-gateway | checkout | recommendations
```

**Migration Path**

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1 | Months 1-2 | Deploy LGTM in AWS, parallel run |
| Phase 2 | Months 3-4 | Migrate AWS teams, deploy GCP spoke |
| Phase 3 | Months 5-6 | Migrate GCP teams, deploy Azure spoke |
| Phase 4 | Months 7-8 | Complete migration, sunset cloud-native tools |

---

### Question 4: Create an Observability Platform Migration Strategy from Legacy Monitoring

**Difficulty**: Advanced  
**Category**: System Design

#### Question

A company is running Nagios for infrastructure monitoring, Splunk for logs (costing $3M/year), and has no distributed tracing. Design a migration strategy that minimizes risk, demonstrates value quickly, handles political challenges, and provides clear timeline and success metrics.

#### Answer

**Migration Strategy: Parallel Run with Progressive Cutover**

**Phase 1: Foundation (Weeks 1-6)**
- Deploy Grafana + Mimir + Loki in parallel
- Dual-write metrics from 3 pilot services
- Ship logs to both Splunk and Loki
- Success: Platform stable 2 weeks, pilot team satisfaction > 4/5

**Phase 2: Expansion (Weeks 7-16)**
- Migrate 50% of teams
- Deploy Tempo for distributed tracing
- Implement SLO framework
- Success: 25% MTTR reduction, first SLOs defined

**Phase 3: Consolidation (Weeks 17-24)**
- Complete team migration (90%+)
- Reduce Splunk license by 50%
- Decommission Nagios
- Success: $1.5M annual savings realized

**Phase 4: Optimization (Weeks 25-36)**
- Complete Splunk sunset
- Implement cost attribution
- Establish Observability Center of Excellence
- Success: Full $3M savings, 75% MTTR improvement

**Stakeholder Management**

| Stakeholder | Concerns | Mitigation |
|-------------|----------|------------|
| Splunk Power Users | Loss of familiar tool | Training, query translation guide |
| Finance | ROI uncertainty | Phased investment, monthly reporting |
| Security | Compliance continuity | Parallel logging, compliance mapping |
| Engineering | Team disruption | Opt-in migration, dedicated support |

**Quick Wins for Early Value**
- Week 2: Real-time Grafana dashboards (visual improvement)
- Week 4: First distributed trace (new capability)
- Week 6: SLO dashboard for pilot service (strategic value)
- Week 8: First incident resolved faster (MTTR proof point)

---

## Architecture Questions

### Question 5: Multi-Tenant Observability Architecture with Tenant Isolation

**Difficulty**: Advanced  
**Category**: Architecture

#### Question

You're designing an observability platform for a SaaS company that needs to provide observability-as-a-service to 500 enterprise customers. Each customer requires strict data isolation, custom retention policies, and the ability to set their own alerts. How would you architect the multi-tenant solution?

#### Answer

**Multi-Tenant Architecture Design**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT OBSERVABILITY PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CONTROL PLANE (Shared)                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Tenant Manager  │  │ Billing/Metering│  │ Provisioning    │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  DATA PLANE (Isolated by X-Scope-OrgID)                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED INFRASTRUCTURE                                │   │
│  │  Mimir (Multi-Tenant) │ Loki (Multi-Tenant) │ Tempo (Multi-Tenant)     │   │
│  │  Grafana (Multi-Org)  │ Alertmanager (Multi-Tenant)                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Tenant A (X-Scope-OrgID: tenant-a) ─── Isolated storage prefix               │
│  Tenant B (X-Scope-OrgID: tenant-b) ─── Isolated storage prefix               │
│  Tenant C (X-Scope-OrgID: tenant-c) ─── Isolated storage prefix               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Tenant Isolation Mechanisms**

| Layer | Isolation Method | Implementation |
|-------|-----------------|----------------|
| API | X-Scope-OrgID header | Enforced at ingress |
| Storage | Tenant-prefixed paths | s3://bucket/tenant-id/... |
| Compute | Per-tenant rate limits | Mimir/Loki limits config |
| Network | Network policies | K8s NetworkPolicy per tenant |
| Access | RBAC + SSO | Grafana organizations |

**Per-Tenant Configuration**

```yaml
# mimir-runtime.yaml - Per-tenant overrides
overrides:
  tenant-enterprise-001:
    ingestion_rate: 100000
    max_global_series_per_user: 10000000
    compactor_blocks_retention_period: 730d  # 2 years
    
  tenant-standard-002:
    ingestion_rate: 25000
    max_global_series_per_user: 2000000
    compactor_blocks_retention_period: 365d
    
  tenant-basic-003:
    ingestion_rate: 5000
    max_global_series_per_user: 500000
    compactor_blocks_retention_period: 90d
```

**Noisy Neighbor Protection**
- Per-tenant rate limiting at distributor level
- Query concurrency limits per tenant
- Separate query queues with fair scheduling
- Resource quotas in Kubernetes

---

### Question 6: High Availability Observability Stack Design

**Difficulty**: Advanced  
**Category**: Architecture

#### Question

Design a highly available observability stack that can survive the loss of an entire availability zone and maintain 99.99% uptime. The system must handle 5 million active series, 2TB logs/day, and support 100 concurrent dashboard users.

#### Answer

**HA Architecture Principles**

1. **Zone-Aware Replication**: All stateful components replicated across 3 AZs
2. **No Single Points of Failure**: Every component has redundancy
3. **Graceful Degradation**: System remains functional with reduced capacity during failures

**Component HA Configuration**

```yaml
# Mimir HA Configuration
mimir:
  ingesters:
    replicas: 9  # 3 per AZ
    replication_factor: 3
    zone_awareness_enabled: true
  distributors:
    replicas: 6  # 2 per AZ, stateless
  queriers:
    replicas: 6
  query_frontend:
    replicas: 3
  compactor:
    replicas: 2  # Active-passive
  store_gateway:
    replicas: 6
    sharding_enabled: true
```

**Pod Disruption Budgets**

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: mimir-ingester-pdb
spec:
  minAvailable: 6  # Survive 1 AZ loss (3 pods)
  selector:
    matchLabels:
      app: mimir-ingester
```

**Failure Scenarios and Recovery**

| Scenario | Impact | Recovery Time | Mitigation |
|----------|--------|---------------|------------|
| Single pod failure | None | Immediate | Replication factor 3 |
| Single AZ failure | Reduced capacity | Immediate | Zone-aware replication |
| Object storage outage | Query degradation | Minutes | Multi-region replication |
| Network partition | Regional impact | Minutes | Health checks, failover |

**Availability Calculation**

```
Component Availability:
- Ingestion path: 99.99% (3 AZs, RF=3)
- Query path: 99.99% (stateless, auto-scaling)
- Storage: 99.999% (S3/GCS SLA)
- Overall: 99.99% (limited by weakest link)
```

---

### Question 7: Edge Computing Observability Architecture

**Difficulty**: Intermediate  
**Category**: Architecture

#### Question

A retail company has 5,000 stores, each with local edge computing infrastructure running inventory and POS systems. They need observability for these edge locations with intermittent connectivity. How would you design the observability architecture?

#### Answer

**Edge Observability Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    EDGE OBSERVABILITY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CENTRAL (Cloud)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Grafana │ Mimir │ Loki │ Alertmanager │ Fleet Management                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                          │
│                    Batch upload when connected                                  │
│         ┌────────────────────────────┼────────────────────────────┐            │
│         │                            │                            │            │
│  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐    │
│  │   STORE 1       │        │   STORE 2       │        │   STORE N       │    │
│  │  ┌───────────┐  │        │  ┌───────────┐  │        │  ┌───────────┐  │    │
│  │  │ Alloy     │  │        │  │ Alloy     │  │        │  │ Alloy     │  │    │
│  │  │ (Buffer)  │  │        │  │ (Buffer)  │  │        │  │ (Buffer)  │  │    │
│  │  └───────────┘  │        │  └───────────┘  │        │  └───────────┘  │    │
│  │  Local Alerting │        │  Local Alerting │        │  Local Alerting │    │
│  │  POS │ Inventory│        │  POS │ Inventory│        │  POS │ Inventory│    │
│  └─────────────────┘        └─────────────────┘        └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions**

1. **Local Buffering**: Grafana Alloy with WAL for offline resilience
2. **Store-and-Forward**: Queue data locally, upload when connected
3. **Local Alerting**: Critical alerts fire locally, don't depend on cloud
4. **Bandwidth Optimization**: Pre-aggregate metrics, sample logs at edge

**Alloy Edge Configuration**

```river
// Local buffering for intermittent connectivity
prometheus.remote_write "central" {
  endpoint {
    url = "https://mimir.central.example.com/api/v1/push"
  }
  
  // WAL for offline resilience
  wal {
    truncate_frequency = "2h"
    max_segment_age    = "24h"  // Buffer up to 24h offline
  }
  
  // Retry configuration
  queue_config {
    capacity          = 100000
    max_shards        = 10
    max_samples_per_send = 5000
  }
}
```

**Bandwidth Optimization**
- Recording rules at edge for pre-aggregation
- Log sampling (1:100 for debug logs)
- Delta compression for metrics
- Batch uploads during off-peak hours

---

## Strategy Questions

### Question 8: Observability Maturity Assessment and Roadmap Development

**Difficulty**: Intermediate  
**Category**: Strategy

#### Question

You're conducting an observability maturity assessment for a mid-size company. They have basic Prometheus monitoring, scattered ELK deployments, and no tracing. How would you assess their maturity, identify gaps, and develop a roadmap to reach Level 4 (Managed) maturity?

#### Answer

**Observability Maturity Model Assessment**

| Level | Description | Current State |
|-------|-------------|---------------|
| Level 1: Initial | Ad-hoc monitoring | ❌ Past this |
| Level 2: Developing | Basic metrics/logs, reactive | ✅ Current state |
| Level 3: Defined | Standardized, centralized | ❌ Target (6 months) |
| Level 4: Managed | SLO-driven, full correlation | ❌ Target (12 months) |
| Level 5: Optimizing | AIOps, predictive | ❌ Future state |

**Gap Analysis**

| Dimension | Current (L2) | Target (L4) | Gap |
|-----------|--------------|-------------|-----|
| Metrics | Prometheus silos | Unified Mimir | High |
| Logs | Scattered ELK | Centralized Loki | High |
| Traces | None | Full coverage | Critical |
| Alerting | Noisy, reactive | SLO-based | High |
| Dashboards | Ad-hoc | Standardized | Medium |
| On-call | Tribal knowledge | Runbooks | High |

**12-Month Roadmap**

**Q1: Foundation (Level 2 → 2.5)**
- Deploy unified LGTM stack
- Migrate 3 pilot teams
- Establish naming conventions
- Deliverable: Platform operational, pilot success

**Q2: Standardization (Level 2.5 → 3)**
- Migrate 50% of teams
- Implement distributed tracing
- Create dashboard templates
- Deliverable: Standardized instrumentation

**Q3: SLO Implementation (Level 3 → 3.5)**
- Define SLIs for all critical services
- Implement error budgets
- Consolidate alerts (reduce by 70%)
- Deliverable: SLO framework operational

**Q4: Optimization (Level 3.5 → 4)**
- Complete migration
- Full correlation across pillars
- Self-service platform
- Deliverable: Level 4 maturity achieved

**Success Metrics**

| Metric | Baseline | Q2 | Q4 |
|--------|----------|-----|-----|
| MTTR | 4 hours | 2 hours | 30 min |
| Alert noise | 500/week | 200/week | 50/week |
| Team adoption | 0% | 50% | 95% |
| SLO coverage | 0% | 30% | 90% |

---

### Question 9: Technical Discovery Process for Enterprise Customers

**Difficulty**: Intermediate  
**Category**: Strategy

#### Question

You're leading a technical discovery engagement with a large enterprise customer considering Grafana Cloud. Walk me through your discovery process, the key questions you'd ask, and how you'd document findings to create a compelling proposal.

#### Answer

**Discovery Process Framework**

**Phase 1: Business Context (Week 1)**

*Executive Stakeholder Questions:*
- What business outcomes are you trying to achieve with observability?
- What incidents have had the biggest business impact in the past year?
- How will you measure success of this initiative?
- What budget and timeline constraints should we consider?

*Key Outputs:*
- Business drivers documented
- Success metrics defined
- Executive sponsor identified

**Phase 2: Technical Current State (Week 1-2)**

*Technical Stakeholder Questions:*
- Walk me through your current architecture and data flows
- What observability tools are currently in use? What works well?
- Where do you lack visibility today? What's hardest to troubleshoot?
- What's your current data volume? Expected growth?

*Assessment Template:*

| Category | Technology | Scale | Coverage | Pain Points |
|----------|------------|-------|----------|-------------|
| Compute | K8s (EKS) | 50 clusters | 80% | Scaling |
| Metrics | Prometheus | 5M series | 70% | Federation |
| Logs | Splunk | 2TB/day | 60% | Cost |
| Traces | None | 0 | 0% | No visibility |

**Phase 3: Gap Analysis (Week 2)**

*Gap Analysis Matrix:*

| Dimension | Current | Target | Gap | Priority |
|-----------|---------|--------|-----|----------|
| Metrics coverage | 70% | 95% | 25% | High |
| Log aggregation | Siloed | Unified | High | High |
| Distributed tracing | None | Full | Critical | Critical |
| MTTR | 4 hours | 30 min | 87% | Critical |

**Phase 4: Solution Design (Week 3)**

*Deliverables:*
- Architecture diagram
- Phased implementation plan
- Resource requirements
- ROI analysis
- Risk assessment

**Discovery Document Template**

```markdown
# Technical Discovery Report: [Customer Name]

## Executive Summary
[2-3 paragraphs: Context, findings, recommendation]

## Business Requirements
- BR-1: Reduce MTTR from 4 hours to 30 minutes
- BR-2: Consolidate 5 monitoring tools to 1 platform

## Technical Requirements
- TR-1: Support 10M active metric series
- TR-2: 99.99% platform availability

## Recommended Solution
[Architecture, phases, timeline]

## Investment and ROI
[Cost breakdown, expected benefits, payback period]
```

---

### Question 10: Technology Evaluation Framework for Observability Tools

**Difficulty**: Intermediate  
**Category**: Strategy

#### Question

A customer asks you to help them evaluate observability platforms. They're considering Grafana Cloud, Datadog, and building their own with open-source tools. How would you structure this evaluation to ensure a fair, comprehensive comparison?

#### Answer

**Evaluation Framework**

**1. Define Evaluation Criteria**

| Category | Weight | Criteria |
|----------|--------|----------|
| **Functionality** | 30% | Feature completeness, integration breadth |
| **Scalability** | 20% | Data volume limits, performance at scale |
| **Total Cost** | 20% | Licensing, infrastructure, operations |
| **Operational Burden** | 15% | Maintenance, upgrades, expertise required |
| **Strategic Fit** | 15% | Vendor lock-in, open standards, roadmap |

**2. Detailed Comparison Matrix**

| Criterion | Grafana Cloud | Datadog | Self-Hosted OSS |
|-----------|--------------|---------|-----------------|
| **Metrics** | ✅ Mimir (unlimited) | ✅ Custom metrics ($) | ✅ Prometheus/Mimir |
| **Logs** | ✅ Loki | ✅ Log Management ($$$) | ✅ Loki |
| **Traces** | ✅ Tempo | ✅ APM ($$$) | ✅ Tempo/Jaeger |
| **Dashboards** | ✅ Grafana | ✅ Datadog | ✅ Grafana |
| **Alerting** | ✅ Included | ✅ Included | ✅ Alertmanager |
| **Scale Limit** | Unlimited | Per-host pricing | Your infrastructure |
| **Vendor Lock-in** | Low (OSS core) | High (proprietary) | None |
| **Ops Burden** | Low (managed) | Low (managed) | High (self-managed) |

**3. TCO Analysis (3-Year, 500 Services)**

| Cost Category | Grafana Cloud | Datadog | Self-Hosted |
|---------------|--------------|---------|-------------|
| Licensing/SaaS | $1.8M | $4.5M | $0 |
| Infrastructure | $0 | $0 | $1.4M |
| Personnel | $450K | $450K | $1.35M |
| Training | $45K | $45K | $90K |
| **Total 3-Year** | **$2.3M** | **$5.0M** | **$2.9M** |

**4. Proof of Concept Criteria**

- Deploy to representative environment (3 services, 2 weeks)
- Measure: Query performance, ingestion reliability, user satisfaction
- Test: Failure scenarios, scale limits, integration complexity

**5. Decision Framework**

| If Priority Is... | Recommendation |
|-------------------|----------------|
| Lowest TCO + flexibility | Grafana Cloud |
| Fastest time-to-value, budget available | Datadog |
| Maximum control, strong platform team | Self-Hosted OSS |
| Avoid vendor lock-in | Grafana Cloud or Self-Hosted |

---

## Business Questions

### Question 11: ROI Analysis for Observability Platform Investment

**Difficulty**: Advanced  
**Category**: Business

#### Question

The CFO asks you to justify a $500K annual investment in a new observability platform. How would you build the ROI analysis, what metrics would you use, and how would you present this to a non-technical executive audience?

#### Answer

**ROI Analysis Framework**

**1. Quantifiable Benefits**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY ROI CALCULATION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ROI = (Total Benefits - Total Costs) / Total Costs × 100%                      │
│                                                                                  │
│  BENEFIT 1: INCIDENT COST REDUCTION                                             │
│  Savings = (Old MTTR - New MTTR) × Incidents/Year × Cost/Hour                   │
│  Example: (4hr - 0.5hr) × 50 incidents × $50,000/hr = $8,750,000               │
│                                                                                  │
│  BENEFIT 2: DEVELOPER PRODUCTIVITY                                              │
│  Savings = Developers × Hours Saved/Week × Weeks × Hourly Rate                  │
│  Example: 100 devs × 2hr/week × 50 weeks × $100/hr = $1,000,000                │
│                                                                                  │
│  BENEFIT 3: TOOL CONSOLIDATION                                                  │
│  Savings = Legacy Tool Costs - New Platform Costs                               │
│  Example: $800,000 (Splunk + Datadog) - $500,000 = $300,000                    │
│                                                                                  │
│  BENEFIT 4: PREVENTED REVENUE LOSS                                              │
│  Value = Prevented Outages × Average Revenue Impact                             │
│  Example: 2 outages × $250,000 = $500,000                                      │
│                                                                                  │
│  TOTAL ANNUAL BENEFITS: $10,550,000                                             │
│  TOTAL ANNUAL COSTS: $500,000                                                   │
│  ROI: ($10,550,000 - $500,000) / $500,000 × 100% = 2,010%                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**2. Executive Presentation Structure**

*Slide 1: The Problem*
- Current MTTR: 4 hours (industry benchmark: 30 minutes)
- Annual incident cost: $10M+
- Developer time wasted: 20% on debugging

*Slide 2: The Solution*
- Unified observability platform
- Faster detection and resolution
- Self-service for engineering teams

*Slide 3: The Investment*
- Year 1: $500K (platform + migration)
- Ongoing: $400K/year

*Slide 4: The Return*
- Year 1 benefits: $10.5M
- 3-year NPV: $28M
- Payback period: 3 weeks

*Slide 5: Risk Mitigation*
- Phased approach, prove value early
- Rollback plan if needed
- Industry-proven technology

**3. Ongoing Value Tracking**

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| MTTR | 4 hours | 30 min | Incident system |
| Developer satisfaction | 3.2/5 | 4.5/5 | Quarterly survey |
| Tool costs | $800K | $500K | Finance reports |
| Incidents prevented | 0 | 5/year | Post-mortems |

---

### Question 12: Building a Business Case for Observability Modernization

**Difficulty**: Intermediate  
**Category**: Business

#### Question

You need to convince a skeptical VP of Engineering to invest in observability modernization. They've been burned by failed tool migrations before. How would you build a compelling business case that addresses their concerns?

#### Answer

**Business Case Strategy: Address Skepticism Head-On**

**1. Acknowledge Past Failures**

"I understand previous migrations haven't delivered expected value. Let me share how this approach is different..."

*Key Differentiators:*
- Phased approach with clear go/no-go gates
- Parallel running (no big-bang cutover)
- Measurable success criteria at each phase
- Executive-sponsored change management

**2. Start with Business Pain, Not Technology**

| Business Problem | Current Impact | Proposed Solution |
|------------------|----------------|-------------------|
| Slow incident resolution | $10M/year in downtime costs | Unified observability reduces MTTR 85% |
| Developer productivity | 20% time on debugging | Self-service observability saves 2hr/dev/week |
| Tool sprawl | $800K/year, 5 different tools | Consolidation saves $300K/year |
| Customer churn from outages | 3 major incidents, 5% churn | Proactive monitoring prevents outages |

**3. De-Risk the Investment**

*Phase 1 (Low Risk, High Learning):*
- Investment: $50K
- Duration: 6 weeks
- Scope: 3 pilot teams
- Success criteria: Team satisfaction > 4/5, no data loss
- Exit criteria: If pilot fails, total loss is $50K

*Phase 2 (Conditional on Phase 1 Success):*
- Investment: $150K
- Duration: 3 months
- Scope: 50% of teams
- Success criteria: 25% MTTR improvement

**4. Show Quick Wins**

| Week | Deliverable | Value Demonstrated |
|------|-------------|-------------------|
| 2 | Real-time dashboards | Visual improvement |
| 4 | First distributed trace | New capability |
| 6 | SLO for pilot service | Strategic alignment |
| 8 | Faster incident resolution | MTTR proof point |

**5. Address Specific Concerns**

*"What if teams don't adopt it?"*
- Opt-in migration, not forced
- Champions program with incentives
- Dedicated support during transition

*"What about our Splunk investment?"*
- Parallel running protects existing investment
- Gradual license reduction as teams migrate
- Full sunset only after proven success

*"How do we know it will scale?"*
- Grafana stack powers Netflix, Bloomberg, CERN
- Proof of concept at your scale before commitment

---

## Reliability Questions

### Question 13: SLO Framework Design and Implementation

**Difficulty**: Advanced  
**Category**: Reliability

#### Question

Design a comprehensive SLO framework for a company with 200 microservices. Include how you would define SLIs, set appropriate SLO targets, implement error budgets, and integrate with alerting. How would you handle the organizational change management aspects?

#### Answer

**SLO Framework Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SLO FRAMEWORK COMPONENTS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  SLI (Service Level Indicator)                                                  │
│  └── What we measure: Availability, Latency, Throughput, Error Rate            │
│                                                                                  │
│  SLO (Service Level Objective)                                                  │
│  └── Target: 99.9% availability over 30-day rolling window                     │
│                                                                                  │
│  Error Budget                                                                   │
│  └── Allowed failures: 0.1% = 43.2 minutes/month                               │
│                                                                                  │
│  SLA (Service Level Agreement)                                                  │
│  └── Contractual commitment (typically SLO - buffer)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**SLI Definitions by Service Type**

| Service Type | Primary SLI | Secondary SLI | Measurement |
|--------------|-------------|---------------|-------------|
| API Gateway | Availability (2xx/total) | P99 latency | Prometheus metrics |
| Database | Query success rate | P95 query time | Database metrics |
| Message Queue | Delivery success | End-to-end latency | Custom instrumentation |
| Batch Jobs | Completion rate | Duration vs. SLA | Job scheduler metrics |

**SLO Target Setting Process**

1. **Baseline Current Performance**
   ```promql
   # Calculate current availability
   sum(rate(http_requests_total{status=~"2.."}[30d])) 
   / sum(rate(http_requests_total[30d]))
   ```

2. **Analyze User Impact**
   - What availability do users actually need?
   - What's the cost of each 9? (99.9% vs 99.99%)

3. **Set Achievable Targets**
   - Start conservative (current performance - 10%)
   - Tighten as reliability improves

**Error Budget Implementation**

```yaml
# Prometheus recording rules for error budget
groups:
  - name: slo_error_budget
    rules:
      - record: slo:error_budget_remaining:ratio
        expr: |
          1 - (
            (1 - (sum(rate(http_requests_total{status=~"2.."}[30d])) 
                  / sum(rate(http_requests_total[30d]))))
            / (1 - 0.999)  # SLO target: 99.9%
          )
```

**Error Budget Policy**

| Budget Remaining | Action |
|------------------|--------|
| > 50% | Normal development velocity |
| 25-50% | Increased testing, slower releases |
| 10-25% | Feature freeze, focus on reliability |
| < 10% | All hands on reliability, no new features |

**Alerting Integration**

```yaml
# Multi-window, multi-burn-rate alerting
groups:
  - name: slo_alerts
    rules:
      - alert: SLOBurnRateCritical
        expr: |
          (
            slo:error_rate:ratio_rate1h > (14.4 * 0.001)  # 14.4x burn rate
            and
            slo:error_rate:ratio_rate5m > (14.4 * 0.001)
          )
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "SLO burn rate critical - budget exhaustion in 1 hour"
```

**Organizational Change Management**

| Phase | Activities | Success Criteria |
|-------|------------|------------------|
| Education | SLO workshops, documentation | 80% teams understand SLOs |
| Pilot | 5 services define SLOs | SLOs operational, teams satisfied |
| Rollout | All critical services | 100% critical services have SLOs |
| Optimization | Error budget policies enforced | Development velocity tied to reliability |

---

### Question 14: Capacity Planning for Observability Data Growth

**Difficulty**: Advanced  
**Category**: Reliability

#### Question

Your observability platform currently handles 5 million active metric series and 1TB of logs per day. The company is planning to double its microservices count over the next 18 months. Design a capacity planning strategy that ensures the platform scales appropriately without over-provisioning.

#### Answer

**Capacity Planning Framework**

**1. Current State Analysis**

| Metric | Current | Growth Rate | 18-Month Projection |
|--------|---------|-------------|---------------------|
| Active series | 5M | 8%/month | 20M |
| Log volume | 1TB/day | 10%/month | 5TB/day |
| Trace spans | 100M/day | 15%/month | 800M/day |
| Query load | 1000 QPS | 5%/month | 2500 QPS |

**2. Capacity Formulas**

```
METRICS (Mimir):
├── Storage = Active Series × Samples/Day × Bytes/Sample × Retention
│   = 20M × 86,400 × 2 bytes × 365 days = 1.26 PB
├── Ingestion = Active Series × (1 / scrape_interval)
│   = 20M × (1/15s) = 1.33M samples/second
└── Memory (Ingesters) = Active Series × 2KB = 40GB per ingester

LOGS (Loki):
├── Storage = Daily Volume × Retention × Compression Ratio
│   = 5TB × 30 days × 0.1 = 15TB
└── Ingestion = 5TB / 86,400s = 60MB/s

TRACES (Tempo):
├── Storage = Spans/Day × Avg Span Size × Retention
│   = 800M × 500 bytes × 7 days = 2.8TB
└── Ingestion = 800M / 86,400s = 9,260 spans/second
```

**3. Scaling Strategy**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SCALING TIMELINE                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CURRENT (Month 0)                                                              │
│  ├── Mimir Ingesters: 6 (8GB each)                                             │
│  ├── Loki Ingesters: 3 (4GB each)                                              │
│  └── Object Storage: 500TB                                                      │
│                                                                                  │
│  PHASE 1 (Month 6) - 2x current                                                 │
│  ├── Mimir Ingesters: 9 (+50%)                                                 │
│  ├── Loki Ingesters: 6 (+100%)                                                 │
│  └── Object Storage: 1PB                                                        │
│                                                                                  │
│  PHASE 2 (Month 12) - 3x current                                                │
│  ├── Mimir Ingesters: 12 (+33%)                                                │
│  ├── Loki Ingesters: 9 (+50%)                                                  │
│  └── Object Storage: 2PB                                                        │
│                                                                                  │
│  PHASE 3 (Month 18) - 4x current                                                │
│  ├── Mimir Ingesters: 18 (+50%)                                                │
│  ├── Loki Ingesters: 12 (+33%)                                                 │
│  └── Object Storage: 3PB                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**4. Cost Optimization Strategies**

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| Retention tiering | Hot (15d) → Warm (90d) → Cold (1y) | 40% storage |
| Metric cardinality control | Label governance, drop unused | 30% series |
| Log sampling | Debug logs 1:100 in production | 50% log volume |
| Trace sampling | Head-based 10%, tail-based for errors | 80% trace volume |

**5. Monitoring Capacity**

```yaml
# Alerting rules for capacity planning
groups:
  - name: capacity_alerts
    rules:
      - alert: MimirIngesterMemoryHigh
        expr: |
          container_memory_usage_bytes{container="ingester"} 
          / container_spec_memory_limit_bytes > 0.8
        for: 15m
        annotations:
          summary: "Ingester memory at 80% - plan scaling"
          
      - alert: StorageGrowthExceedsProjection
        expr: |
          predict_linear(mimir_storage_bytes[7d], 30*24*3600) 
          > mimir_storage_quota_bytes * 0.9
        annotations:
          summary: "Storage will exceed quota in 30 days"
```

---

## Scenario Questions

### Question 15: Customer Engagement - Handling a Critical Observability Gap

**Difficulty**: Advanced  
**Category**: Scenario

#### Question

You're in a customer meeting when the VP of Engineering reveals that last week they had a 4-hour outage that cost $2M in lost revenue. Their current monitoring didn't detect the issue until customers started complaining. They're frustrated and skeptical that any observability solution can help. How do you handle this situation and turn it into an opportunity?

#### Answer

**Scenario Response Strategy**

**1. Immediate Response: Empathy and Understanding**

*What to say:*
"That sounds incredibly frustrating, and I appreciate you sharing that with me. A 4-hour outage with that kind of impact is exactly the scenario we help organizations prevent. Before I talk about solutions, can you walk me through what happened? I want to understand the specifics so we can address the root cause, not just the symptoms."

*What NOT to do:*
- Don't immediately pitch your product
- Don't criticize their current tools
- Don't make promises you can't keep

**2. Discovery: Understand the Failure**

*Questions to ask:*
- "What was the first indication something was wrong?"
- "What monitoring did you have in place? What did it show?"
- "How did you eventually identify the root cause?"
- "What would have helped you detect this earlier?"

*Likely findings:*
- Monitoring focused on infrastructure, not user experience
- No distributed tracing to follow request flow
- Alerts were noisy, so real issues got lost
- No SLOs to define "healthy" vs "degraded"

**3. Reframe the Problem**

*Shift from tools to outcomes:*

"Based on what you've described, the issue isn't that you need better monitoring—you need observability that's aligned with business outcomes. Let me explain the difference:

| Monitoring (What you had) | Observability (What you need) |
|---------------------------|-------------------------------|
| CPU, memory, disk | User-facing SLOs |
| Infrastructure alerts | Business impact alerts |
| Reactive detection | Proactive detection |
| 'Is it up?' | 'Is it working for users?' |

**4. Propose a Path Forward**

*Concrete next steps:*

"Here's what I'd recommend:

**Week 1: Post-Mortem Deep Dive**
- Let's analyze this specific incident together
- I'll show you how observability would have detected it earlier
- No commitment required, just learning

**Week 2-3: Proof of Concept**
- Instrument 3 critical services with full observability
- Define SLOs based on user experience
- Set up alerting that would have caught this issue

**Week 4: Results Review**
- Compare detection time: old vs new
- Quantify the value: 'If we had this, we'd have detected in X minutes instead of Y hours'
- Decision point: proceed or not"

**5. Address Skepticism Directly**

*Acknowledge their concern:*

"I understand you're skeptical—you've invested in monitoring before and it didn't prevent this outage. Here's why this is different:

1. **User-centric SLOs**: We'll define success from the user's perspective, not just 'servers are up'

2. **Distributed tracing**: We'll follow requests end-to-end, so you can see exactly where failures occur

3. **Proactive alerting**: Multi-window burn rate alerts catch issues before they become outages

4. **Proof before commitment**: We'll prove value with a pilot before you invest further"

**6. Quantify the Opportunity**

*Make it tangible:*

"Let's do the math:
- This outage: 4 hours × $500K/hour = $2M
- With proper observability: Detection in 5 minutes, resolution in 25 minutes
- Potential savings: $2M - $250K = $1.75M on this single incident
- Annual value: If you have 4 similar incidents/year = $7M in prevented losses
- Investment: ~$500K/year for enterprise observability
- ROI: 1,300%"

**7. Close with Commitment**

*Secure next steps:*

"Can we schedule a 2-hour session next week to do a deep dive on this incident? I'll bring our solutions architect, and we'll show you exactly how we would have detected and resolved this faster. No commitment, just a concrete demonstration of value. Does Tuesday or Wednesday work better for you?"

---

## Summary

These 15 questions cover the key competencies expected of a Senior Observability Architect at Grafana Labs:

| Category | Questions | Key Skills Tested |
|----------|-----------|-------------------|
| System Design | 1-4 | Enterprise architecture, multi-cloud, migration |
| Architecture | 5-7 | Multi-tenancy, HA, edge computing |
| Strategy | 8-10 | Maturity assessment, discovery, evaluation |
| Business | 11-12 | ROI analysis, business case development |
| Reliability | 13-14 | SLO frameworks, capacity planning |
| Scenario | 15 | Customer engagement, consultative selling |

**Preparation Tips:**
1. Practice whiteboarding architecture diagrams
2. Prepare specific examples from your experience
3. Be ready to discuss trade-offs, not just solutions
4. Understand Grafana's product portfolio deeply
5. Practice explaining technical concepts to non-technical audiences
