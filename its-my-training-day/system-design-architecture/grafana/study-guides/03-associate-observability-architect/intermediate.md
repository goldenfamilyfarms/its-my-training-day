# Intermediate: Associate Observability Architect

This document covers intermediate-level skills for the Associate Observability Architect role at Grafana Labs. It focuses on troubleshooting methodologies, Root Cause Analysis (RCA) techniques, customer onboarding processes, and deployment operations.

## Table of Contents

1. [Troubleshooting Methodologies](#troubleshooting-methodologies)
2. [Root Cause Analysis (RCA) Techniques](#root-cause-analysis-rca-techniques)
3. [Customer Onboarding Processes](#customer-onboarding-processes)
4. [Deployment Operations](#deployment-operations)
5. [Practical Examples](#practical-examples)
6. [Key Takeaways](#key-takeaways)

---

## Troubleshooting Methodologies

Effective troubleshooting is a core skill for the Associate Observability Architect. This section covers systematic approaches to diagnosing and resolving issues in observability platforms.

> **📚 Related Content**: For foundational Kubernetes troubleshooting, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md#troubleshooting-patterns)

### The Scientific Method for Troubleshooting

A structured approach ensures consistent, efficient problem resolution.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SCIENTIFIC TROUBLESHOOTING METHOD                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. OBSERVE                                                                      │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ • Gather symptoms and evidence                                       │    │
│     │ • Document what is happening vs what should happen                   │    │
│     │ • Identify when the issue started                                    │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  2. HYPOTHESIZE                                                                 │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ • Form theories about potential causes                               │    │
│     │ • Prioritize hypotheses by likelihood and impact                     │    │
│     │ • Consider recent changes                                            │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  3. TEST                                                                        │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ • Design tests to validate or invalidate hypotheses                  │    │
│     │ • Execute tests systematically                                       │    │
│     │ • Document results                                                   │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  4. CONCLUDE                                                                    │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ • Identify root cause                                                │    │
│     │ • Implement fix                                                      │    │
│     │ • Verify resolution                                                  │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### The OODA Loop for Incident Response

The OODA (Observe, Orient, Decide, Act) loop is particularly effective for time-sensitive incidents.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OODA LOOP                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌─────────────┐                                         │
│                         │   OBSERVE   │                                         │
│                         │  Gather     │                                         │
│                         │  data       │                                         │
│                         └──────┬──────┘                                         │
│                                │                                                │
│              ┌─────────────────┴─────────────────┐                              │
│              │                                   │                              │
│              ▼                                   │                              │
│       ┌─────────────┐                           │                              │
│       │   ORIENT    │                           │                              │
│       │  Analyze &  │                           │                              │
│       │  understand │                           │                              │
│       └──────┬──────┘                           │                              │
│              │                                   │                              │
│              ▼                                   │                              │
│       ┌─────────────┐                           │                              │
│       │   DECIDE    │                           │                              │
│       │  Choose     │                           │                              │
│       │  action     │                           │                              │
│       └──────┬──────┘                           │                              │
│              │                                   │                              │
│              ▼                                   │                              │
│       ┌─────────────┐                           │                              │
│       │    ACT      │────────────────────────────┘                              │
│       │  Execute &  │     (Continuous loop)                                     │
│       │  monitor    │                                                           │
│       └─────────────┘                                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**OODA in Practice**:

| Phase | Actions | Tools |
|-------|---------|-------|
| **Observe** | Check dashboards, alerts, logs | Grafana, Loki, Prometheus |
| **Orient** | Correlate data, identify patterns | Tempo traces, log correlation |
| **Decide** | Choose remediation strategy | Runbooks, escalation procedures |
| **Act** | Execute fix, monitor results | kubectl, Grafana dashboards |

### Systematic Troubleshooting Framework

#### Step 1: Define the Problem

Before diving into investigation, clearly define what you're troubleshooting.

```markdown
## Problem Definition Template

**Symptom**: [What is the user experiencing?]
**Expected Behavior**: [What should happen?]
**Actual Behavior**: [What is happening?]
**Impact**: [Who/what is affected?]
**Timeline**: [When did it start? Any patterns?]
**Recent Changes**: [Deployments, config changes, traffic spikes?]
```

**Example**:
```markdown
**Symptom**: Grafana dashboards loading slowly
**Expected Behavior**: Dashboards load within 2 seconds
**Actual Behavior**: Dashboards take 15-30 seconds to load
**Impact**: All users in production environment
**Timeline**: Started at 14:00 UTC, coincides with traffic spike
**Recent Changes**: New dashboard deployed at 13:45 UTC
```

#### Step 2: Gather Information

Collect relevant data from multiple sources.

```bash
# Check Grafana pod status
kubectl get pods -n monitoring -l app=grafana

# View Grafana logs for errors
kubectl logs -n monitoring -l app=grafana --tail=100 | grep -i error

# Check resource usage
kubectl top pods -n monitoring

# View recent events
kubectl get events -n monitoring --sort-by='.lastTimestamp' | tail -20

# Check Prometheus targets
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'
```

#### Step 3: Isolate the Issue

Use binary search to narrow down the problem scope.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ISOLATION STRATEGY                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Is the issue in...                                                             │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        FULL STACK                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Client    │  │   Network   │  │  Application│  │  Data Store │    │   │
│  │  │  (Browser)  │  │  (Ingress)  │  │  (Grafana)  │  │ (Prometheus)│    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  │         │                │                │                │           │   │
│  │         ▼                ▼                ▼                ▼           │   │
│  │    Test locally    Test with curl   Check logs/metrics  Query directly│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Isolation Questions:                                                           │
│  • Does the issue occur for all users or specific users?                        │
│  • Does it affect all dashboards or specific ones?                              │
│  • Is it consistent or intermittent?                                            │
│  • Does it occur in all environments?                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Common Troubleshooting Patterns

#### Pattern 1: The Correlation Hunt

When symptoms don't point to an obvious cause, look for correlations.

```logql
# Find events correlated with error spikes
# Step 1: Identify error spike time
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)

# Step 2: Query logs around that time
{namespace="monitoring"} |= "error" | json | __timestamp__ >= "2024-01-15T14:00:00Z"

# Step 3: Check for deployment events
{namespace="monitoring", container="kube-events"} |= "deployment"
```

#### Pattern 2: The Elimination Process

Systematically rule out potential causes.

| Component | Test | Result | Conclusion |
|-----------|------|--------|------------|
| Network | `curl -w "%{time_total}" http://grafana:3000/api/health` | 0.05s | ✅ Network OK |
| Grafana | Check `/api/health` endpoint | 200 OK | ✅ Grafana healthy |
| Prometheus | Direct query via API | 15s response | ❌ Prometheus slow |
| Storage | Check disk I/O metrics | High latency | ❌ Storage issue |

#### Pattern 3: The Timeline Reconstruction

Build a timeline of events leading to the issue.

```markdown
## Incident Timeline

| Time (UTC) | Event | Source |
|------------|-------|--------|
| 13:30 | Normal operation | Metrics |
| 13:45 | New dashboard deployed | Deployment logs |
| 13:50 | Query complexity increased | Prometheus logs |
| 14:00 | First slow dashboard reports | User tickets |
| 14:05 | Prometheus memory spike | Metrics |
| 14:10 | OOMKilled event | Kubernetes events |
```

### Troubleshooting Grafana Stack Components

#### Grafana Troubleshooting

**Common Issues and Solutions**:

| Issue | Symptoms | Investigation | Solution |
|-------|----------|---------------|----------|
| Slow dashboards | High load times | Check query inspector | Optimize queries, add caching |
| Data source errors | "Bad Gateway" | Check datasource health | Verify connectivity, credentials |
| Authentication failures | Login loops | Check auth logs | Verify OAuth/LDAP config |
| Plugin errors | Panel not loading | Check browser console | Update/reinstall plugin |

**Grafana Health Check Commands**:

```bash
# Check Grafana API health
curl -s http://grafana:3000/api/health | jq

# Check datasource connectivity
curl -s -u admin:admin http://grafana:3000/api/datasources/proxy/1/api/v1/query?query=up

# View Grafana metrics
curl -s http://grafana:3000/metrics | grep grafana_http_request_duration

# Check active sessions
curl -s -u admin:admin http://grafana:3000/api/admin/stats | jq
```

#### Prometheus Troubleshooting

**Common Issues**:

```bash
# Check target health
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'

# Check for high cardinality
curl -s http://prometheus:9090/api/v1/status/tsdb | jq '.data.seriesCountByMetricName | to_entries | sort_by(-.value) | .[0:10]'

# Check query performance
curl -s http://prometheus:9090/api/v1/query?query=prometheus_engine_query_duration_seconds

# Check storage status
curl -s http://prometheus:9090/api/v1/status/tsdb | jq '.data'
```

#### Loki Troubleshooting

**Common Issues**:

```bash
# Check Loki readiness
curl -s http://loki:3100/ready

# Check ingester status
curl -s http://loki:3100/ring | jq

# View Loki metrics
curl -s http://loki:3100/metrics | grep loki_ingester

# Test log query
curl -s -G http://loki:3100/loki/api/v1/query --data-urlencode 'query={job="grafana"}' | jq
```

---

## Root Cause Analysis (RCA) Techniques

Root Cause Analysis is essential for preventing recurring issues. This section covers systematic approaches to identifying and addressing the underlying causes of incidents.

> **📚 Related Content**: For observability correlation techniques, see [Observability Principles](../../shared-concepts/observability-principles.md#pillar-relationships-and-correlation)


### The 5 Whys Technique

The 5 Whys is a simple but powerful technique for drilling down to root causes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           5 WHYS EXAMPLE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Problem: Grafana dashboards are not loading                                    │
│                                                                                  │
│  Why #1: Why are dashboards not loading?                                        │
│  ────────────────────────────────────────                                       │
│  Answer: Grafana cannot connect to Prometheus                                   │
│                                                                                  │
│  Why #2: Why can't Grafana connect to Prometheus?                               │
│  ────────────────────────────────────────────────                               │
│  Answer: Prometheus pods are in CrashLoopBackOff                                │
│                                                                                  │
│  Why #3: Why are Prometheus pods crashing?                                      │
│  ──────────────────────────────────────────                                     │
│  Answer: Prometheus is running out of memory (OOMKilled)                        │
│                                                                                  │
│  Why #4: Why is Prometheus running out of memory?                               │
│  ─────────────────────────────────────────────────                              │
│  Answer: A new high-cardinality metric was introduced                           │
│                                                                                  │
│  Why #5: Why was a high-cardinality metric introduced?                          │
│  ──────────────────────────────────────────────────────                         │
│  Answer: No cardinality review process for new metrics                          │
│                                                                                  │
│  ROOT CAUSE: Missing metric review process                                      │
│  ACTION: Implement cardinality review in CI/CD pipeline                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**5 Whys Best Practices**:

| Practice | Description |
|----------|-------------|
| Stay focused | Keep asking "why" about the same problem thread |
| Avoid blame | Focus on processes, not people |
| Get to actionable causes | Stop when you reach something you can fix |
| Involve the team | Multiple perspectives improve analysis |
| Document thoroughly | Record each step for future reference |

### Fishbone (Ishikawa) Diagram

The Fishbone diagram helps categorize potential causes systematically.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FISHBONE DIAGRAM: SLOW DASHBOARD LOADING                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│     INFRASTRUCTURE          CONFIGURATION           DATA                        │
│           │                      │                    │                         │
│           │  CPU limits          │  Query timeout     │  High cardinality       │
│           │  Memory pressure     │  Cache disabled    │  Large time range       │
│           │  Network latency     │  Wrong datasource  │  Complex joins          │
│           │                      │                    │                         │
│           └──────────────────────┼────────────────────┘                         │
│                                  │                                              │
│                                  ▼                                              │
│                        ┌─────────────────┐                                      │
│                        │  SLOW DASHBOARD │                                      │
│                        │    LOADING      │                                      │
│                        └─────────────────┘                                      │
│                                  ▲                                              │
│           ┌──────────────────────┼────────────────────┐                         │
│           │                      │                    │                         │
│           │  Inefficient queries │  Browser cache     │  Plugin bugs            │
│           │  Missing indexes     │  Network throttle  │  Version mismatch       │
│           │  No aggregation      │  Proxy timeout     │  Memory leaks           │
│           │                      │                    │                         │
│     APPLICATION              NETWORK              SOFTWARE                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Fault Tree Analysis

Fault Tree Analysis works backward from a failure to identify all possible causes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FAULT TREE: DATA NOT APPEARING IN GRAFANA                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                         ┌─────────────────────┐                                 │
│                         │  Data Not Appearing │                                 │
│                         │    in Grafana       │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                            │
│                              ┌─────┴─────┐                                      │
│                              │    OR     │                                      │
│                              └─────┬─────┘                                      │
│                    ┌───────────────┼───────────────┐                            │
│                    │               │               │                            │
│                    ▼               ▼               ▼                            │
│           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                │
│           │ Data Source   │ │ Query Issue   │ │ Visualization │                │
│           │ Problem       │ │               │ │ Problem       │                │
│           └───────┬───────┘ └───────┬───────┘ └───────┬───────┘                │
│                   │                 │                 │                         │
│             ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐                  │
│             │    OR     │     │    OR     │     │    OR     │                  │
│             └─────┬─────┘     └─────┬─────┘     └─────┬─────┘                  │
│         ┌────────┬┴───────┐   ┌────┴────┐      ┌────┴────┐                     │
│         │        │        │   │         │      │         │                     │
│         ▼        ▼        ▼   ▼         ▼      ▼         ▼                     │
│      ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│      │Conn │ │Auth │ │Down │ │Syntax│ │Time │ │Panel│ │Theme│                  │
│      │Error│ │Fail │ │     │ │Error│ │Range│ │Type │ │Issue│                  │
│      └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### RCA Documentation Template

A well-documented RCA helps prevent future incidents and shares knowledge across the team.

```markdown
# Root Cause Analysis Report

## Incident Summary
- **Incident ID**: INC-2024-0115
- **Date**: January 15, 2024
- **Duration**: 2 hours 15 minutes
- **Severity**: P2
- **Services Affected**: Grafana dashboards, alerting

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:00 | First alert: "Grafana High Latency" |
| 14:05 | On-call engineer acknowledged |
| 14:15 | Identified Prometheus memory pressure |
| 14:30 | Scaled Prometheus resources |
| 14:45 | Identified high-cardinality metric |
| 15:15 | Removed problematic metric |
| 16:15 | Full service restoration confirmed |

## Root Cause
A new application deployment introduced a metric with user_id as a label,
creating millions of unique time series. This caused Prometheus memory
exhaustion and cascading failures to Grafana.

## Contributing Factors
1. No cardinality review in deployment pipeline
2. Prometheus memory limits too low for growth
3. No alerting on cardinality growth

## Resolution
1. Removed high-cardinality metric from application
2. Increased Prometheus memory limits
3. Added cardinality monitoring dashboard

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add cardinality check to CI/CD | Platform Team | Jan 22 | In Progress |
| Create cardinality alerting | SRE Team | Jan 20 | Complete |
| Document metric labeling guidelines | Docs Team | Jan 25 | Not Started |

## Lessons Learned
- High-cardinality metrics can quickly overwhelm Prometheus
- Need proactive monitoring of metric cardinality
- Deployment reviews should include observability impact
```

### Blameless Postmortem Culture

Effective RCA requires a blameless culture that focuses on system improvement.

**Blameless Postmortem Principles**:

| Principle | Description | Example |
|-----------|-------------|---------|
| **Focus on systems** | Examine processes, not individuals | "The deployment process lacked validation" not "John deployed bad code" |
| **Assume good intent** | People made the best decisions with available information | "Given the time pressure, the decision was reasonable" |
| **Learn, don't punish** | Goal is improvement, not blame | "How can we prevent this?" not "Who is responsible?" |
| **Share openly** | Publish findings for organizational learning | Post RCA to internal wiki |
| **Follow up** | Track action items to completion | Regular review of open items |

---

## Customer Onboarding Processes

As an Associate Observability Architect, you'll help customers successfully adopt Grafana products. This section covers structured onboarding processes.

### Onboarding Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER ONBOARDING PHASES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Phase 1: DISCOVERY (Week 1-2)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Understand current observability stack                                │   │
│  │ • Identify pain points and goals                                        │   │
│  │ • Document technical requirements                                       │   │
│  │ • Assess team skills and capacity                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  Phase 2: PLANNING (Week 2-3)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Design target architecture                                            │   │
│  │ • Create migration plan                                                 │   │
│  │ • Define success metrics                                                │   │
│  │ • Establish timeline and milestones                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  Phase 3: IMPLEMENTATION (Week 3-8)                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Deploy Grafana stack components                                       │   │
│  │ • Configure data sources                                                │   │
│  │ • Migrate dashboards and alerts                                         │   │
│  │ • Integrate with existing systems                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  Phase 4: ENABLEMENT (Week 8-10)                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Train users on Grafana features                                       │   │
│  │ • Create documentation and runbooks                                     │   │
│  │ • Establish support processes                                           │   │
│  │ • Hand off to customer team                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│                                          ▼                                      │
│  Phase 5: OPTIMIZATION (Ongoing)                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Review performance and usage                                          │   │
│  │ • Identify improvement opportunities                                    │   │
│  │ • Implement advanced features                                           │   │
│  │ • Regular health checks                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Discovery Phase Deep Dive

The discovery phase sets the foundation for a successful onboarding.

#### Technical Discovery Questionnaire

```markdown
## Customer Technical Discovery

### Current Environment
1. What observability tools are you currently using?
   - [ ] Prometheus  [ ] Datadog  [ ] New Relic  [ ] Splunk  [ ] Other: ____
   
2. What is your current infrastructure?
   - [ ] Kubernetes  [ ] Docker  [ ] VMs  [ ] Bare metal  [ ] Serverless
   
3. Cloud providers in use:
   - [ ] AWS  [ ] GCP  [ ] Azure  [ ] On-premises  [ ] Hybrid

### Scale and Requirements
4. Approximate metrics volume: _____ samples/second
5. Approximate log volume: _____ GB/day
6. Number of services to monitor: _____
7. Number of users who will access Grafana: _____

### Goals and Pain Points
8. Top 3 observability challenges:
   1. ________________________________
   2. ________________________________
   3. ________________________________

9. Key success metrics for this project:
   1. ________________________________
   2. ________________________________

### Technical Constraints
10. Security requirements:
    - [ ] SSO/SAML  [ ] RBAC  [ ] Data encryption  [ ] Audit logging
    
11. Compliance requirements:
    - [ ] SOC2  [ ] HIPAA  [ ] PCI-DSS  [ ] GDPR  [ ] Other: ____
```

#### Environment Assessment Checklist

| Area | Questions to Ask | Why It Matters |
|------|------------------|----------------|
| **Infrastructure** | K8s version? Node count? | Determines deployment approach |
| **Networking** | Ingress controller? Service mesh? | Affects connectivity setup |
| **Storage** | Storage class? IOPS requirements? | Critical for Prometheus/Loki |
| **Security** | Auth provider? Network policies? | Determines access configuration |
| **Scale** | Current metrics/logs volume? Growth rate? | Sizing and architecture decisions |

### Planning Phase Deep Dive

#### Architecture Design Considerations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DECISION MATRIX                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DEPLOYMENT MODEL                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Grafana Cloud          vs          Self-Hosted                         │   │
│  │  ─────────────                      ───────────                         │   │
│  │  ✓ Managed service                  ✓ Full control                      │   │
│  │  ✓ Auto-scaling                     ✓ Data sovereignty                  │   │
│  │  ✓ No ops overhead                  ✓ Custom configurations             │   │
│  │  ✗ Less customization               ✗ Operational burden                │   │
│  │  ✗ Data leaves premises             ✗ Scaling complexity                │   │
│  │                                                                          │   │
│  │  Best for: Teams wanting            Best for: Teams with strict         │   │
│  │  to focus on using, not             compliance or customization         │   │
│  │  operating observability            requirements                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  STACK COMPONENTS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Component      │  When to Include  │  Sizing Consideration             │   │
│  │  ───────────────┼───────────────────┼──────────────────────────────     │   │
│  │  Prometheus     │  Always           │  2GB RAM per 1M active series     │   │
│  │  Grafana        │  Always           │  512MB-2GB based on users         │   │
│  │  Loki           │  If logs needed   │  Based on ingestion rate          │   │
│  │  Tempo          │  If traces needed │  Based on span volume             │   │
│  │  Mimir          │  Long-term metrics│  For >1M active series            │   │
│  │  Alertmanager   │  If alerting      │  Minimal resources                │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Migration Planning

**Migration Strategies**:

| Strategy | Description | Risk Level | Best For |
|----------|-------------|------------|----------|
| **Big Bang** | Switch everything at once | High | Small environments |
| **Parallel Run** | Run old and new simultaneously | Medium | Critical systems |
| **Phased** | Migrate component by component | Low | Large environments |
| **Pilot** | Start with non-critical systems | Low | Risk-averse organizations |

**Migration Checklist**:

```markdown
## Pre-Migration
- [ ] Document current dashboards and alerts
- [ ] Export existing configurations
- [ ] Identify dependencies
- [ ] Plan rollback procedure
- [ ] Schedule maintenance window

## During Migration
- [ ] Deploy new stack components
- [ ] Configure data sources
- [ ] Import/recreate dashboards
- [ ] Set up alerting rules
- [ ] Verify data flow

## Post-Migration
- [ ] Validate all dashboards working
- [ ] Confirm alerts firing correctly
- [ ] Train users on new system
- [ ] Document any changes
- [ ] Decommission old system (after validation period)
```


### Implementation Phase Deep Dive

#### Standard Deployment Checklist

```markdown
## Grafana Stack Deployment Checklist

### Prerequisites
- [ ] Kubernetes cluster accessible
- [ ] kubectl configured
- [ ] Helm installed (v3+)
- [ ] Storage class available
- [ ] Ingress controller deployed

### Namespace Setup
- [ ] Create monitoring namespace
- [ ] Apply resource quotas
- [ ] Configure network policies

### Component Deployment Order
1. [ ] Deploy Prometheus Operator (if using)
2. [ ] Deploy Prometheus
3. [ ] Deploy Alertmanager
4. [ ] Deploy Loki
5. [ ] Deploy Tempo
6. [ ] Deploy Grafana
7. [ ] Configure data sources
8. [ ] Import dashboards

### Validation
- [ ] All pods running
- [ ] Data sources connected
- [ ] Sample dashboard loading
- [ ] Test alert firing
```

#### Common Configuration Patterns

**Grafana Data Source Configuration**:

```yaml
# Prometheus data source
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "15s"
      httpMethod: POST
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "trace_id=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
    
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        tags: ['job', 'instance']
```

### Enablement Phase Deep Dive

#### Training Program Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TRAINING PROGRAM STRUCTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SESSION 1: Grafana Fundamentals (2 hours)                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Grafana UI navigation                                                 │   │
│  │ • Dashboard basics: panels, variables, time ranges                      │   │
│  │ • Exploring data with Explore view                                      │   │
│  │ • Hands-on: Create your first dashboard                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SESSION 2: PromQL and Metrics (2 hours)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Prometheus data model                                                 │   │
│  │ • PromQL basics: selectors, functions, aggregations                     │   │
│  │ • Common query patterns                                                 │   │
│  │ • Hands-on: Build metrics dashboards                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SESSION 3: LogQL and Logs (2 hours)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Loki architecture overview                                            │   │
│  │ • LogQL basics: stream selectors, filters, parsers                      │   │
│  │ • Log-to-metrics patterns                                               │   │
│  │ • Hands-on: Build log exploration dashboards                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SESSION 4: Alerting (2 hours)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Grafana alerting architecture                                         │   │
│  │ • Creating alert rules                                                  │   │
│  │ • Notification channels and routing                                     │   │
│  │ • Hands-on: Set up alerts for your services                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  SESSION 5: Advanced Topics (2 hours)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ • Distributed tracing with Tempo                                        │   │
│  │ • Correlating metrics, logs, and traces                                 │   │
│  │ • Performance optimization                                              │   │
│  │ • Best practices and common pitfalls                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Documentation Deliverables

| Document | Purpose | Audience |
|----------|---------|----------|
| **Architecture Diagram** | Visual overview of deployed stack | All stakeholders |
| **Runbook** | Step-by-step operational procedures | Operations team |
| **User Guide** | How to use Grafana features | End users |
| **Admin Guide** | Configuration and maintenance | Administrators |
| **Troubleshooting Guide** | Common issues and solutions | Support team |

---

## Deployment Operations

This section covers the operational aspects of deploying and maintaining Grafana stack components in Kubernetes environments.

> **📚 Related Content**: For Kubernetes deployment fundamentals, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md#deployment-strategies)


### Kubernetes Deployment Patterns for Observability

#### Grafana Deployment Best Practices

```yaml
# Production-ready Grafana Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  replicas: 2  # High availability
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 472
        fsGroup: 472
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0
          ports:
            - containerPort: 3000
              name: http
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
            - name: grafana-config
              mountPath: /etc/grafana/grafana.ini
              subPath: grafana.ini
      volumes:
        - name: grafana-storage
          persistentVolumeClaim:
            claimName: grafana-pvc
        - name: grafana-config
          configMap:
            name: grafana-config
```

#### Prometheus Deployment Considerations

```yaml
# Prometheus StatefulSet for data persistence
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
  namespace: monitoring
spec:
  serviceName: prometheus
  replicas: 2
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.48.0
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus"
            - "--storage.tsdb.retention.time=15d"
            - "--web.enable-lifecycle"
            - "--web.enable-admin-api"
          ports:
            - containerPort: 9090
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
            limits:
              memory: "4Gi"
              cpu: "1000m"
          volumeMounts:
            - name: prometheus-storage
              mountPath: /prometheus
            - name: prometheus-config
              mountPath: /etc/prometheus
  volumeClaimTemplates:
    - metadata:
        name: prometheus-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi
```

### Deployment Strategies

#### Rolling Updates

Rolling updates minimize downtime by gradually replacing old pods with new ones.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ROLLING UPDATE PROCESS                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Initial State (v1.0)                                                           │
│  ┌─────┐ ┌─────┐ ┌─────┐                                                       │
│  │ v1.0│ │ v1.0│ │ v1.0│                                                       │
│  └─────┘ └─────┘ └─────┘                                                       │
│                                                                                  │
│  Step 1: Create new pod                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                               │
│  │ v1.0│ │ v1.0│ │ v1.0│ │ v2.0│ ← New pod starting                            │
│  └─────┘ └─────┘ └─────┘ └─────┘                                               │
│                                                                                  │
│  Step 2: Terminate old pod                                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐                                                       │
│  │ v1.0│ │ v1.0│ │ v2.0│ ← Old pod terminated                                  │
│  └─────┘ └─────┘ └─────┘                                                       │
│                                                                                  │
│  Step 3-4: Repeat until complete                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐                                                       │
│  │ v2.0│ │ v2.0│ │ v2.0│ ← All pods updated                                    │
│  └─────┘ └─────┘ └─────┘                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Rolling Update Configuration**:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods above desired count during update
      maxUnavailable: 0  # Ensure no downtime
```

#### Blue-Green Deployments

Blue-green deployments maintain two identical environments for instant rollback capability.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BLUE-GREEN DEPLOYMENT                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Before Switch:                                                                 │
│                                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐                       │
│  │   BLUE (Active)     │ ◄────── │      Service        │                       │
│  │   Grafana v10.1     │         │   (Load Balancer)   │                       │
│  └─────────────────────┘         └─────────────────────┘                       │
│                                                                                  │
│  ┌─────────────────────┐                                                        │
│  │   GREEN (Standby)   │                                                        │
│  │   Grafana v10.2     │ ← Testing new version                                 │
│  └─────────────────────┘                                                        │
│                                                                                  │
│  After Switch:                                                                  │
│                                                                                  │
│  ┌─────────────────────┐                                                        │
│  │   BLUE (Standby)    │                                                        │
│  │   Grafana v10.1     │ ← Ready for rollback                                  │
│  └─────────────────────┘                                                        │
│                                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐                       │
│  │   GREEN (Active)    │ ◄────── │      Service        │                       │
│  │   Grafana v10.2     │         │   (Load Balancer)   │                       │
│  └─────────────────────┘         └─────────────────────┘                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Blue-Green Implementation**:

```bash
# Deploy green environment
kubectl apply -f grafana-green.yaml

# Verify green is healthy
kubectl rollout status deployment/grafana-green -n monitoring

# Switch traffic to green
kubectl patch service grafana -n monitoring \
  -p '{"spec":{"selector":{"version":"green"}}}'

# If issues, rollback to blue
kubectl patch service grafana -n monitoring \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```


### Canary Deployments

Canary deployments gradually shift traffic to new versions, allowing early detection of issues.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CANARY DEPLOYMENT PROGRESSION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Stage 1: 5% Canary                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Traffic: ████████████████████████████████████████████████░░ 95% → v1   │   │
│  │           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██ 5%  → v2   │   │
│  │  Monitor: Error rate, latency, user feedback                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Stage 2: 25% Canary (if Stage 1 successful)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Traffic: ██████████████████████████████████████░░░░░░░░░░░░ 75% → v1   │   │
│  │           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████ 25% → v2   │   │
│  │  Monitor: Error rate, latency, user feedback                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Stage 3: 50% Canary (if Stage 2 successful)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Traffic: ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 50% → v1   │   │
│  │           ░░░░░░░░░░░░░░░░░░░░░░░░████████████████████████ 50% → v2   │   │
│  │  Monitor: Error rate, latency, user feedback                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Stage 4: Full Rollout (if Stage 3 successful)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Traffic: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%  → v1   │   │
│  │           ████████████████████████████████████████████████ 100% → v2   │   │
│  │  Cleanup: Remove v1 deployment                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Operational Runbooks

#### Grafana Restart Procedure

```markdown
## Runbook: Grafana Restart

### When to Use
- Grafana unresponsive
- Configuration changes requiring restart
- Memory issues

### Prerequisites
- kubectl access to cluster
- Monitoring namespace access

### Procedure

1. **Check current status**
   ```bash
   kubectl get pods -n monitoring -l app=grafana
   kubectl describe pod -n monitoring -l app=grafana
   ```

2. **Perform rolling restart**
   ```bash
   kubectl rollout restart deployment/grafana -n monitoring
   ```

3. **Monitor rollout**
   ```bash
   kubectl rollout status deployment/grafana -n monitoring
   ```

4. **Verify health**
   ```bash
   kubectl exec -n monitoring -l app=grafana -- \
     curl -s localhost:3000/api/health
   ```

### Rollback
If issues persist after restart:
```bash
kubectl rollout undo deployment/grafana -n monitoring
```

### Escalation
If restart doesn't resolve the issue, escalate to:
- Platform Engineering Team
- Grafana Support (for Grafana Cloud)
```

#### Prometheus Scaling Procedure

```markdown
## Runbook: Prometheus Scaling

### When to Use
- High memory usage alerts
- Query performance degradation
- Increased metrics volume

### Procedure

1. **Assess current resource usage**
   ```bash
   kubectl top pods -n monitoring -l app=prometheus
   kubectl exec -n monitoring prometheus-0 -- \
     curl -s localhost:9090/api/v1/status/tsdb | jq '.data'
   ```

2. **Check cardinality**
   ```bash
   kubectl exec -n monitoring prometheus-0 -- \
     curl -s localhost:9090/api/v1/status/tsdb | \
     jq '.data.seriesCountByMetricName | to_entries | sort_by(-.value) | .[0:10]'
   ```

3. **Scale vertically (increase resources)**
   ```bash
   kubectl patch statefulset prometheus -n monitoring \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","resources":{"limits":{"memory":"8Gi"},"requests":{"memory":"4Gi"}}}]}}}}'
   ```

4. **Scale horizontally (add replicas with Thanos/Mimir)**
   - For horizontal scaling, consider migrating to Mimir
   - See: Mimir deployment guide

### Monitoring
After scaling, monitor:
- Memory usage: `container_memory_usage_bytes{pod=~"prometheus.*"}`
- Query latency: `prometheus_engine_query_duration_seconds`
- Scrape duration: `prometheus_target_scrape_pool_sync_total`
```

### Health Checks and Monitoring

#### Component Health Endpoints

| Component | Health Endpoint | Expected Response |
|-----------|-----------------|-------------------|
| Grafana | `/api/health` | `{"commit":"...","database":"ok","version":"..."}` |
| Prometheus | `/-/healthy` | `Prometheus Server is Healthy.` |
| Loki | `/ready` | `ready` |
| Tempo | `/ready` | `ready` |
| Alertmanager | `/-/healthy` | `OK` |

#### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Check all observability stack components

NAMESPACE="monitoring"

echo "=== Observability Stack Health Check ==="
echo ""

# Grafana
echo "Checking Grafana..."
GRAFANA_HEALTH=$(kubectl exec -n $NAMESPACE deploy/grafana -- \
  curl -s localhost:3000/api/health 2>/dev/null)
if echo "$GRAFANA_HEALTH" | grep -q '"database":"ok"'; then
  echo "✅ Grafana: Healthy"
else
  echo "❌ Grafana: Unhealthy"
fi

# Prometheus
echo "Checking Prometheus..."
PROM_HEALTH=$(kubectl exec -n $NAMESPACE prometheus-0 -- \
  curl -s localhost:9090/-/healthy 2>/dev/null)
if echo "$PROM_HEALTH" | grep -q "Healthy"; then
  echo "✅ Prometheus: Healthy"
else
  echo "❌ Prometheus: Unhealthy"
fi

# Loki
echo "Checking Loki..."
LOKI_HEALTH=$(kubectl exec -n $NAMESPACE deploy/loki -- \
  curl -s localhost:3100/ready 2>/dev/null)
if echo "$LOKI_HEALTH" | grep -q "ready"; then
  echo "✅ Loki: Healthy"
else
  echo "❌ Loki: Unhealthy"
fi

echo ""
echo "=== Health Check Complete ==="
```


---

## Practical Examples

This section provides real-world scenarios that combine the concepts covered in this document.

### Example 1: Troubleshooting a Dashboard Loading Issue

**Scenario**: A customer reports that their Grafana dashboards are taking 30+ seconds to load.

**Step 1: Gather Information**

```bash
# Check Grafana pod status
kubectl get pods -n monitoring -l app=grafana
# Output: grafana-abc123 1/1 Running 0 2d

# Check Grafana logs for errors
kubectl logs -n monitoring -l app=grafana --tail=50 | grep -i "error\|slow\|timeout"
# Output: level=warn msg="slow query" datasource=Prometheus duration=28.5s

# Check resource usage
kubectl top pods -n monitoring -l app=grafana
# Output: grafana-abc123 150m 256Mi
```

**Step 2: Isolate the Issue**

```bash
# Test Grafana API directly
kubectl exec -n monitoring deploy/grafana -- \
  curl -s -w "\nTime: %{time_total}s\n" localhost:3000/api/health
# Output: {"database":"ok"...} Time: 0.05s  ← Grafana itself is fast

# Test Prometheus query directly
kubectl exec -n monitoring prometheus-0 -- \
  curl -s -w "\nTime: %{time_total}s\n" \
  'localhost:9090/api/v1/query?query=up'
# Output: {...} Time: 25.3s  ← Prometheus is slow!
```

**Step 3: Investigate Prometheus**

```bash
# Check Prometheus resource usage
kubectl top pods -n monitoring -l app=prometheus
# Output: prometheus-0 1800m 7.5Gi  ← High memory usage

# Check cardinality
kubectl exec -n monitoring prometheus-0 -- \
  curl -s localhost:9090/api/v1/status/tsdb | jq '.data.headStats'
# Output: {"numSeries": 5000000, ...}  ← Very high series count!

# Find high-cardinality metrics
kubectl exec -n monitoring prometheus-0 -- \
  curl -s localhost:9090/api/v1/status/tsdb | \
  jq '.data.seriesCountByMetricName | to_entries | sort_by(-.value) | .[0:5]'
# Output: [{"key":"http_requests_by_user_id","value":2000000}, ...]
```

**Step 4: Root Cause and Resolution**

```markdown
## Root Cause Analysis

**Root Cause**: A new metric `http_requests_by_user_id` was introduced with
user_id as a label, creating 2 million unique time series.

**Resolution**:
1. Remove the high-cardinality metric from the application
2. Increase Prometheus memory limits temporarily
3. Add cardinality alerting to prevent recurrence

**Action Items**:
- [ ] Remove user_id label from http_requests metric
- [ ] Add cardinality monitoring dashboard
- [ ] Implement metric review process for new deployments
```

### Example 2: Customer Onboarding - E-commerce Platform

**Scenario**: Onboarding a mid-size e-commerce company to Grafana Cloud.

**Discovery Phase Output**:

```markdown
## Customer Profile: ShopFast Inc.

### Current State
- **Infrastructure**: AWS EKS (3 clusters, 50 nodes)
- **Current Tools**: CloudWatch, custom logging solution
- **Pain Points**:
  1. No unified view across services
  2. Slow log search (minutes to find relevant logs)
  3. No distributed tracing

### Requirements
- **Metrics**: ~500k active series
- **Logs**: ~100GB/day
- **Traces**: ~10M spans/day
- **Users**: 25 engineers, 5 SREs

### Success Criteria
1. Dashboard load time < 3 seconds
2. Log search < 10 seconds
3. End-to-end trace visibility
4. 99.9% observability stack availability
```

**Architecture Design**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SHOPFAST OBSERVABILITY ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         AWS EKS CLUSTERS                                 │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │  Cluster 1  │  │  Cluster 2  │  │  Cluster 3  │                      │   │
│  │  │  (Prod)     │  │  (Staging)  │  │  (Dev)      │                      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │   │
│  │         │                │                │                              │   │
│  │         │  ┌─────────────┴────────────────┘                              │   │
│  │         │  │                                                             │   │
│  │         ▼  ▼                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              Grafana Alloy (Collection Agent)                    │    │   │
│  │  │  • Prometheus remote_write for metrics                          │    │   │
│  │  │  • Loki push for logs                                           │    │   │
│  │  │  • OTLP export for traces                                       │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                    │                                     │   │
│  └────────────────────────────────────┼─────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GRAFANA CLOUD                                    │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Mimir     │  │    Loki     │  │   Tempo     │  │  Grafana    │    │   │
│  │  │  (Metrics)  │  │   (Logs)    │  │  (Traces)   │  │   (UI)      │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Example 3: RCA for Production Incident

**Scenario**: Production alerting stopped working for 2 hours.

**Incident Timeline**:

| Time | Event | Source |
|------|-------|--------|
| 09:00 | Last successful alert fired | Alertmanager logs |
| 09:15 | Prometheus config update deployed | Deployment logs |
| 09:30 | Customer reports missing alerts | Support ticket |
| 10:00 | On-call engineer investigates | Incident log |
| 10:30 | Root cause identified | Investigation |
| 11:00 | Fix deployed, alerts restored | Deployment logs |

**Investigation Process**:

```bash
# Step 1: Check Alertmanager status
kubectl get pods -n monitoring -l app=alertmanager
# Output: alertmanager-0 1/1 Running 0 5d  ← Pod is healthy

# Step 2: Check Prometheus alerting rules
kubectl exec -n monitoring prometheus-0 -- \
  curl -s localhost:9090/api/v1/rules | jq '.data.groups | length'
# Output: 0  ← No alerting rules loaded!

# Step 3: Check Prometheus config
kubectl exec -n monitoring prometheus-0 -- \
  cat /etc/prometheus/prometheus.yml | grep rule_files
# Output: rule_files: []  ← Rules file path is empty!

# Step 4: Check recent config changes
kubectl get configmap prometheus-config -n monitoring -o yaml | \
  grep -A5 "rule_files"
# Found: rule_files was accidentally removed in recent update
```

**5 Whys Analysis**:

```
Why #1: Why did alerting stop working?
→ Prometheus had no alerting rules loaded

Why #2: Why were no alerting rules loaded?
→ The rule_files configuration was empty

Why #3: Why was rule_files empty?
→ A config update accidentally removed the rule_files entry

Why #4: Why wasn't this caught before deployment?
→ No validation of Prometheus config in CI/CD pipeline

Why #5: Why is there no config validation?
→ Config validation was never implemented

ROOT CAUSE: Missing Prometheus config validation in deployment pipeline
```

**RCA Document**:

```markdown
## RCA: Alerting Outage - January 15, 2024

### Summary
Production alerting was non-functional for 2 hours due to missing
alerting rules configuration in Prometheus.

### Impact
- Duration: 2 hours (09:00 - 11:00 UTC)
- Affected: All production alerting
- Customer Impact: Potential missed incidents during outage window

### Root Cause
A configuration update to Prometheus accidentally removed the
`rule_files` entry, causing all alerting rules to be unloaded.

### Contributing Factors
1. No automated validation of Prometheus configuration
2. No alerting on "zero alerting rules loaded" condition
3. Manual config editing without peer review

### Resolution
1. Restored rule_files configuration
2. Verified all alerting rules loaded
3. Confirmed test alert fired successfully

### Action Items
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Add promtool check to CI/CD | Platform | Jan 20 | In Progress |
| Add alert for zero rules | SRE | Jan 18 | Complete |
| Implement config review process | Platform | Jan 25 | Not Started |

### Lessons Learned
- Always validate configuration changes before deployment
- Monitor the monitoring system itself
- Implement peer review for infrastructure changes
```

### Example 4: Deployment Operation - Grafana Upgrade

**Scenario**: Upgrading Grafana from v10.1 to v10.2 in production.

**Pre-Upgrade Checklist**:

```markdown
## Pre-Upgrade Checklist

### Preparation
- [x] Review release notes for breaking changes
- [x] Test upgrade in staging environment
- [x] Backup Grafana database
- [x] Document rollback procedure
- [x] Schedule maintenance window
- [x] Notify stakeholders

### Backup Commands
```bash
# Backup Grafana database (SQLite)
kubectl exec -n monitoring deploy/grafana -- \
  cp /var/lib/grafana/grafana.db /var/lib/grafana/grafana.db.backup

# Backup dashboards via API
curl -s -u admin:$GRAFANA_PASSWORD \
  http://grafana.example.com/api/search | jq -r '.[].uid' | \
  while read uid; do
    curl -s -u admin:$GRAFANA_PASSWORD \
      "http://grafana.example.com/api/dashboards/uid/$uid" > "dashboard-$uid.json"
  done
```

**Upgrade Procedure**:

```bash
# Step 1: Update image tag in deployment
kubectl set image deployment/grafana \
  grafana=grafana/grafana:10.2.0 \
  -n monitoring

# Step 2: Monitor rollout
kubectl rollout status deployment/grafana -n monitoring

# Step 3: Verify health
kubectl exec -n monitoring deploy/grafana -- \
  curl -s localhost:3000/api/health | jq

# Step 4: Verify version
kubectl exec -n monitoring deploy/grafana -- \
  curl -s localhost:3000/api/health | jq -r '.version'
# Expected: 10.2.0

# Step 5: Test critical dashboards
# Manual verification of key dashboards loading correctly
```

**Rollback Procedure** (if needed):

```bash
# Rollback to previous version
kubectl rollout undo deployment/grafana -n monitoring

# Verify rollback
kubectl rollout status deployment/grafana -n monitoring

# Restore database if needed
kubectl exec -n monitoring deploy/grafana -- \
  cp /var/lib/grafana/grafana.db.backup /var/lib/grafana/grafana.db

# Restart to pick up restored database
kubectl rollout restart deployment/grafana -n monitoring
```

---

## Key Takeaways

### Troubleshooting Methodologies

1. **Use systematic approaches**: Scientific method, OODA loop, or elimination process
2. **Gather data before hypothesizing**: Logs, metrics, traces, and events
3. **Isolate the problem**: Binary search through the stack
4. **Document everything**: For future reference and knowledge sharing

### Root Cause Analysis

1. **Go beyond symptoms**: Use 5 Whys to find underlying causes
2. **Categorize causes**: Fishbone diagrams help organize thinking
3. **Focus on prevention**: Action items should prevent recurrence
4. **Maintain blameless culture**: Focus on systems, not individuals

### Customer Onboarding

1. **Discovery is critical**: Understand current state and goals
2. **Plan before implementing**: Architecture decisions are hard to change
3. **Enable, don't just deploy**: Training and documentation ensure success
4. **Iterate and optimize**: Onboarding is the beginning, not the end

### Deployment Operations

1. **Choose the right strategy**: Rolling, blue-green, or canary based on risk tolerance
2. **Automate health checks**: Catch issues before users do
3. **Maintain runbooks**: Documented procedures reduce MTTR
4. **Always have a rollback plan**: Things will go wrong

---

## Further Reading

- [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md) - Deep dive into Kubernetes concepts
- [Observability Principles](../../shared-concepts/observability-principles.md) - Comprehensive observability coverage
- [LGTM Stack](../../shared-concepts/lgtm-stack.md) - Grafana's observability stack components
- [Fundamentals](./fundamentals.md) - Foundational concepts for this role
- [Advanced](./advanced.md) - Advanced topics for career growth
