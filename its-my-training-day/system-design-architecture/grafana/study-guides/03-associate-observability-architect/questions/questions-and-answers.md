# Technical Interview Questions - Associate Observability Architect

This document contains 15 technical interview questions designed to assess readiness for the Associate Observability Architect role at Grafana Labs. Questions cover Kubernetes operations, observability concepts, troubleshooting methodologies, customer scenarios, and documentation practices.

---

## Question 1: Kubernetes Pod Troubleshooting

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Kubernetes Operations

### Question

A customer reports that their Grafana pods are stuck in `CrashLoopBackOff` status after a recent deployment. Walk me through your systematic approach to diagnose and resolve this issue.

### Answer

**Systematic Troubleshooting Approach:**

**Step 1: Gather Initial Information**
```bash
# Check pod status and restart count
kubectl get pods -n monitoring -l app=grafana

# Get detailed pod information
kubectl describe pod <grafana-pod-name> -n monitoring
```

Look for key information in the describe output:
- **Events section**: Shows recent events like image pull failures, scheduling issues
- **State section**: Shows why the container is restarting
- **Last State**: Shows the exit code and reason for the previous termination

**Step 2: Examine Container Logs**
```bash
# View current container logs
kubectl logs <grafana-pod-name> -n monitoring

# View logs from the previous crashed container
kubectl logs <grafana-pod-name> -n monitoring --previous
```

**Step 3: Common Causes and Solutions**

| Exit Code | Meaning | Common Cause | Solution |
|-----------|---------|--------------|----------|
| 0 | Success | Container completed unexpectedly | Check if command is correct |
| 1 | Application error | Configuration issue, missing dependency | Check logs for specific error |
| 137 | SIGKILL (OOMKilled) | Memory limit exceeded | Increase memory limits |
| 139 | SIGSEGV | Segmentation fault | Check for corrupt image or config |

**Step 4: Verify Configuration**
```bash
# Check ConfigMaps are correctly mounted
kubectl get configmap -n monitoring
kubectl describe configmap grafana-config -n monitoring

# Verify Secrets exist
kubectl get secrets -n monitoring | grep grafana
```

**Step 5: Resource Verification**
```bash
# Check if resources are available on the node
kubectl describe node <node-name> | grep -A 5 "Allocated resources"
```

**Real-World Example Resolution:**
In many cases, CrashLoopBackOff is caused by:
1. **Missing ConfigMap/Secret**: The pod references a ConfigMap or Secret that doesn't exist
2. **Invalid configuration**: A syntax error in grafana.ini or datasource configuration
3. **Database connection failure**: Grafana can't connect to its backend database
4. **Permission issues**: The container can't write to required directories

**Prevention Recommendations:**
- Implement pre-deployment validation in CI/CD
- Use Kubernetes readiness probes to catch startup issues early
- Maintain configuration as code with version control


---

## Question 2: Observability Pillars Selection

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Observability Concepts

### Question

A customer asks: "We're experiencing intermittent slow response times in our application. Should we look at metrics, logs, or traces first?" Explain how you would guide them through choosing the right observability signal and why.

### Answer

**Recommended Approach: Start with Metrics, then Traces, then Logs**

**Step 1: Start with Metrics (The "What")**

Metrics answer "What is happening?" and help identify patterns:

```promql
# Check overall latency trends
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))

# Identify which endpoints are slow
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint))

# Check for correlation with resource usage
rate(container_cpu_usage_seconds_total[5m])
```

**Why metrics first:**
- Efficient for identifying patterns over time
- Shows if the issue is consistent or truly intermittent
- Helps narrow down which services/endpoints are affected
- Provides baseline for comparison

**Step 2: Use Traces (The "Where")**

Once you've identified slow requests exist, traces show where time is spent:

```
Request Flow with Traces:
┌─────────────────────────────────────────────────────────────────┐
│ Total Request: 2500ms                                           │
├─────────────────────────────────────────────────────────────────┤
│ ├── API Gateway: 50ms                                           │
│ ├── Auth Service: 100ms                                         │
│ ├── Application Service: 2200ms  ← BOTTLENECK                   │
│ │   ├── Database Query: 2000ms   ← ROOT CAUSE                   │
│ │   └── Processing: 200ms                                       │
│ └── Response: 150ms                                             │
└─────────────────────────────────────────────────────────────────┘
```

**TraceQL query example:**
```traceql
{ duration > 2s && resource.service.name = "application-service" }
```

**Step 3: Examine Logs (The "Why")**

After identifying the slow component, logs provide detailed context:

```logql
# Find logs correlated with slow traces
{service="application-service"} | json | trace_id="<trace-id-from-slow-request>"

# Look for database-related warnings
{service="application-service"} |= "database" |= "slow" or |= "timeout"
```

**Summary Table for Customer:**

| Signal | Best For | Example Question |
|--------|----------|------------------|
| **Metrics** | Trends, alerting, "is there a problem?" | "What's our p99 latency over the past hour?" |
| **Traces** | Request flow, latency breakdown | "Where is time being spent in slow requests?" |
| **Logs** | Detailed context, error messages | "Why did this specific query take so long?" |

**Key Teaching Point:**
The three pillars are complementary. Metrics tell you something is wrong, traces show you where, and logs explain why. For intermittent issues, this workflow prevents wasting time searching through logs without knowing what to look for.


---

## Question 3: Root Cause Analysis Scenario

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Troubleshooting

### Question

You're conducting a post-incident review after a customer's Grafana dashboards became unresponsive for 45 minutes. Initial investigation shows Prometheus was the bottleneck. Walk me through how you would conduct a thorough Root Cause Analysis and what your RCA report would include.

### Answer

**RCA Methodology: The 5 Whys Combined with Timeline Reconstruction**

**Step 1: Timeline Reconstruction**

First, build a detailed timeline of events:

```markdown
| Time (UTC) | Event | Source |
|------------|-------|--------|
| 14:00 | Normal dashboard performance | Metrics |
| 14:15 | New application version deployed | Deployment logs |
| 14:20 | Prometheus memory usage starts climbing | Prometheus metrics |
| 14:35 | First user reports slow dashboards | Support ticket |
| 14:40 | Prometheus memory at 95% | Alertmanager |
| 14:45 | Prometheus OOMKilled, restarts | Kubernetes events |
| 14:50 | Dashboards completely unresponsive | User reports |
| 15:00 | On-call engineer engaged | PagerDuty |
| 15:15 | High-cardinality metric identified | Investigation |
| 15:25 | Problematic metric removed | Deployment |
| 15:35 | Service fully restored | Metrics |
```

**Step 2: Apply the 5 Whys**

```
Problem: Grafana dashboards were unresponsive for 45 minutes

Why #1: Why were dashboards unresponsive?
→ Prometheus was not responding to queries

Why #2: Why was Prometheus not responding?
→ Prometheus pods were in CrashLoopBackOff due to OOMKilled

Why #3: Why was Prometheus running out of memory?
→ A sudden spike in time series count (from 500K to 5M series)

Why #4: Why did time series count spike?
→ New application deployment added a metric with user_id label

Why #5: Why was a high-cardinality metric deployed?
→ No cardinality review process in the deployment pipeline

ROOT CAUSE: Missing metric cardinality governance in CI/CD
```

**Step 3: RCA Report Structure**

```markdown
# Root Cause Analysis Report

## Incident Summary
- **Incident ID**: INC-2024-0215
- **Duration**: 45 minutes (14:45 - 15:35 UTC)
- **Severity**: P1 - Production dashboards unavailable
- **Impact**: All users unable to access monitoring dashboards

## Root Cause
A new application deployment introduced a metric with `user_id` as a label,
creating approximately 4.5 million new time series. This exceeded Prometheus
memory capacity, causing repeated OOM crashes.

## Contributing Factors
1. No automated cardinality checks in deployment pipeline
2. Prometheus memory limits not sized for growth
3. No alerting on cardinality growth rate
4. 20-minute delay in on-call response

## Resolution Actions Taken
1. Identified and removed high-cardinality metric
2. Restarted Prometheus with increased memory
3. Verified dashboard functionality restored

## Preventive Actions
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Add cardinality linting to CI/CD | Platform | Feb 22 | P1 |
| Implement cardinality alerting | SRE | Feb 20 | P1 |
| Create metric labeling guidelines | Docs | Feb 25 | P2 |
| Review Prometheus resource sizing | Platform | Feb 28 | P2 |

## Lessons Learned
- High-cardinality metrics can rapidly overwhelm Prometheus
- Need proactive monitoring of metric cardinality
- Deployment reviews should include observability impact assessment
```

**Key RCA Principles Demonstrated:**
- **Blameless culture**: Focus on process failures, not individuals
- **Actionable outcomes**: Every finding has an owner and due date
- **Prevention focus**: Address root cause, not just symptoms
- **Knowledge sharing**: Document for organizational learning


---

## Question 4: Customer Onboarding Scenario

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Customer Scenarios

### Question

You're assigned to onboard a new enterprise customer who is migrating from a legacy monitoring solution to Grafana Cloud. They have 50 microservices running on Kubernetes across 3 clusters. How would you structure the onboarding process, and what key milestones would you establish?

### Answer

**Structured Onboarding Framework**

**Phase 1: Discovery (Week 1-2)**

*Objective: Understand current state and define success criteria*

**Discovery Meeting Agenda:**
1. Current monitoring stack inventory
2. Pain points with existing solution
3. Key stakeholders and their needs
4. Compliance and security requirements
5. Timeline and resource constraints

**Key Questions to Ask:**
- What dashboards are business-critical?
- What's your current alerting strategy?
- How do teams currently troubleshoot issues?
- What data retention requirements do you have?
- Who needs access and at what permission levels?

**Deliverable: Discovery Document**
```markdown
## Customer Profile
- **Company**: [Name]
- **Environment**: 3 Kubernetes clusters, 50 microservices
- **Current Stack**: [Legacy tool]
- **Primary Pain Points**: [List]

## Success Criteria
1. All critical dashboards migrated and functional
2. Alerting parity with existing system
3. Team trained on Grafana basics
4. Documentation for common procedures

## Technical Requirements
- Data retention: 13 months
- Users: 150 (5 admin, 25 editor, 120 viewer)
- Integrations: PagerDuty, Slack, Jira
```

**Phase 2: Planning (Week 2-3)**

*Objective: Create detailed migration plan*

**Architecture Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Cluster 1        Cluster 2        Cluster 3                   │
│   ┌────────┐       ┌────────┐       ┌────────┐                  │
│   │ Agent  │       │ Agent  │       │ Agent  │                  │
│   └───┬────┘       └───┬────┘       └───┬────┘                  │
│       │                │                │                        │
│       └────────────────┼────────────────┘                        │
│                        ▼                                         │
│              ┌─────────────────┐                                 │
│              │  Grafana Cloud  │                                 │
│              │  (Metrics/Logs/ │                                 │
│              │   Traces)       │                                 │
│              └─────────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Migration Milestones:**

| Milestone | Week | Success Criteria |
|-----------|------|------------------|
| M1: Infrastructure | 3 | Agents deployed, data flowing |
| M2: Core Dashboards | 5 | Top 10 dashboards migrated |
| M3: Alerting | 6 | Critical alerts configured |
| M4: Full Migration | 8 | All dashboards, all alerts |
| M5: Training | 9 | All users trained |
| M6: Handoff | 10 | Customer self-sufficient |

**Phase 3: Implementation (Week 3-8)**

*Objective: Deploy and configure Grafana stack*

**Week 3-4: Infrastructure Setup**
- Deploy Grafana Agents to all clusters
- Configure remote write to Grafana Cloud
- Verify data ingestion from all sources
- Set up authentication (SSO/SAML)

**Week 5-6: Content Migration**
- Migrate dashboards (prioritized by criticality)
- Convert queries to PromQL/LogQL
- Configure data sources
- Set up folder structure and permissions

**Week 7-8: Alerting and Integration**
- Migrate alert rules
- Configure notification channels
- Test alert routing
- Integrate with incident management

**Phase 4: Enablement (Week 8-10)**

*Objective: Ensure customer self-sufficiency*

**Training Sessions:**
1. **Admin Training** (4 hours): User management, data sources, permissions
2. **Dashboard Training** (4 hours): Creating/editing dashboards, variables
3. **Alerting Training** (2 hours): Alert rules, notification policies
4. **Troubleshooting Training** (2 hours): Using Explore, log queries

**Documentation Deliverables:**
- Quick start guide for new users
- Dashboard creation guidelines
- Alerting best practices
- Escalation procedures

**Success Metrics:**
- 100% of critical dashboards functional
- Alert response time maintained or improved
- User satisfaction score > 4/5
- Zero P1 incidents during first month post-migration


---

## Question 5: Kubernetes Service Connectivity

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Kubernetes Operations

### Question

A customer reports that their Grafana instance cannot connect to Prometheus, showing "Bad Gateway" errors. Both are running in the same Kubernetes cluster but different namespaces. How would you troubleshoot this connectivity issue?

### Answer

**Systematic Network Troubleshooting Approach**

**Step 1: Verify Both Services Are Running**

```bash
# Check Grafana pods
kubectl get pods -n grafana-namespace -l app=grafana
# Expected: Running status

# Check Prometheus pods
kubectl get pods -n prometheus-namespace -l app=prometheus
# Expected: Running status

# Check services exist
kubectl get svc -n grafana-namespace
kubectl get svc -n prometheus-namespace
```

**Step 2: Verify Service Endpoints**

```bash
# Check if Prometheus service has endpoints
kubectl get endpoints prometheus -n prometheus-namespace

# Expected output should show pod IPs:
# NAME         ENDPOINTS           AGE
# prometheus   10.244.1.5:9090     5d
```

If endpoints are empty, the service selector doesn't match pod labels:
```bash
# Compare service selector with pod labels
kubectl get svc prometheus -n prometheus-namespace -o yaml | grep -A 3 selector
kubectl get pods -n prometheus-namespace --show-labels
```

**Step 3: Test Connectivity from Grafana Pod**

```bash
# Exec into Grafana pod
kubectl exec -it <grafana-pod> -n grafana-namespace -- /bin/sh

# Test DNS resolution
nslookup prometheus.prometheus-namespace.svc.cluster.local

# Test HTTP connectivity
wget -qO- http://prometheus.prometheus-namespace.svc.cluster.local:9090/api/v1/status/config
```

**Step 4: Check Network Policies**

```bash
# List network policies in both namespaces
kubectl get networkpolicies -n grafana-namespace
kubectl get networkpolicies -n prometheus-namespace

# Describe any policies that might block traffic
kubectl describe networkpolicy <policy-name> -n prometheus-namespace
```

**Common Causes and Solutions:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **DNS resolution failure** | `nslookup` fails | Check CoreDNS pods, verify service name |
| **Network Policy blocking** | DNS works, connection refused | Update NetworkPolicy to allow ingress from Grafana namespace |
| **Wrong port** | Connection refused | Verify service port matches Prometheus port |
| **Service selector mismatch** | No endpoints | Fix service selector to match pod labels |
| **Prometheus not ready** | Intermittent failures | Check Prometheus readiness probe |

**Step 5: Verify Grafana Data Source Configuration**

```bash
# Check the data source configuration in Grafana
# The URL should be:
# http://prometheus.prometheus-namespace.svc.cluster.local:9090

# Or if using short form (same cluster):
# http://prometheus.prometheus-namespace:9090
```

**Network Policy Fix Example:**

If NetworkPolicy is blocking traffic, create an allow policy:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-grafana-to-prometheus
  namespace: prometheus-namespace
spec:
  podSelector:
    matchLabels:
      app: prometheus
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: grafana-namespace
        - podSelector:
            matchLabels:
              app: grafana
      ports:
        - protocol: TCP
          port: 9090
```

**Verification:**
```bash
# After fix, test from Grafana pod again
kubectl exec -it <grafana-pod> -n grafana-namespace -- \
  wget -qO- http://prometheus.prometheus-namespace:9090/api/v1/status/config

# Then test in Grafana UI: Data Sources → Prometheus → Test
```


---

## Question 6: Metrics vs Logs Decision

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Observability Concepts

### Question

A customer is instrumenting a new payment processing service. They ask whether they should track failed transactions as a metric counter or log each failure with details. What would you recommend and why?

### Answer

**Recommendation: Use Both - They Serve Different Purposes**

**The Right Answer: Metrics AND Logs Together**

For payment processing, you need both signals because they answer different questions:

**Metrics (Counter) - For Alerting and Trends:**
```go
// Prometheus counter for failed transactions
var paymentFailures = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "payment_failures_total",
        Help: "Total number of failed payment transactions",
    },
    []string{"failure_reason", "payment_method"},
)

// Increment on failure
paymentFailures.WithLabelValues("insufficient_funds", "credit_card").Inc()
```

**Why metrics:**
- Efficient alerting: "Alert when failure rate > 5%"
- Trend analysis: "Are failures increasing over time?"
- Low cardinality: Only track failure categories, not individual transactions
- Fast queries: Aggregations are pre-computed

**Logs (Structured) - For Investigation and Audit:**
```json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "level": "error",
  "event": "payment_failed",
  "transaction_id": "txn_abc123",
  "customer_id": "cust_xyz789",
  "amount": 150.00,
  "currency": "USD",
  "payment_method": "credit_card",
  "failure_reason": "insufficient_funds",
  "processor_response_code": "51",
  "trace_id": "trace_def456"
}
```

**Why logs:**
- Detailed context for debugging specific failures
- Audit trail for compliance (PCI-DSS requirements)
- Searchable by transaction ID, customer ID
- Contains sensitive details not suitable for metrics

**Practical Implementation Pattern:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT FAILURE FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Payment Fails                                                  │
│        │                                                         │
│        ├──────────────────────────────────────┐                  │
│        │                                      │                  │
│        ▼                                      ▼                  │
│   ┌─────────────┐                      ┌─────────────┐          │
│   │   METRIC    │                      │    LOG      │          │
│   │  Increment  │                      │   Write     │          │
│   │  counter    │                      │  details    │          │
│   └──────┬──────┘                      └──────┬──────┘          │
│          │                                    │                  │
│          ▼                                    ▼                  │
│   ┌─────────────┐                      ┌─────────────┐          │
│   │ Prometheus  │                      │    Loki     │          │
│   │  Alerting   │                      │   Search    │          │
│   └─────────────┘                      └─────────────┘          │
│                                                                  │
│   Use Case:                            Use Case:                 │
│   "Alert if >5% failures"              "Why did txn_abc123 fail?"│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cardinality Warning:**

Never put high-cardinality values in metric labels:

```go
// ❌ BAD - Creates millions of time series
paymentFailures.WithLabelValues(transactionID, customerID).Inc()

// ✅ GOOD - Limited cardinality
paymentFailures.WithLabelValues(failureReason, paymentMethod).Inc()
```

**Summary for Customer:**

| Aspect | Metrics | Logs |
|--------|---------|------|
| **Purpose** | Alerting, trends, dashboards | Investigation, audit, debugging |
| **Cardinality** | Low (categories only) | High (individual transactions) |
| **Query Speed** | Fast (pre-aggregated) | Slower (full-text search) |
| **Storage Cost** | Low | Higher |
| **Compliance** | Not for PII | Can include transaction details |
| **Example Query** | `rate(payment_failures_total[5m])` | `{service="payments"} \|= "txn_abc123"` |

**Best Practice:** Instrument both, use metrics for alerting and dashboards, use logs for root cause analysis and compliance.


---

## Question 7: Troubleshooting Methodology

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Troubleshooting

### Question

Describe your systematic approach to troubleshooting when a customer reports "dashboards are slow" but provides no other details. How do you narrow down the problem efficiently?

### Answer

**Systematic Troubleshooting Framework: The Funnel Approach**

**Phase 1: Define and Scope (5 minutes)**

Start by gathering essential information to define the problem:

**Key Questions:**
1. "Which specific dashboards are slow?" (All vs. specific)
2. "When did this start?" (Recent change vs. ongoing)
3. "How slow? 5 seconds or 5 minutes?" (Severity)
4. "Is it slow for all users or specific users?" (Scope)
5. "Any recent changes? Deployments, config updates?" (Correlation)

**Problem Definition Template:**
```markdown
Symptom: Dashboard loading slowly
Affected: [All dashboards / Specific: ___]
Started: [Date/time]
Severity: [Load time: ___ seconds]
Scope: [All users / Specific users]
Recent Changes: [Yes/No - Details]
```

**Phase 2: Isolate the Layer (10 minutes)**

Use binary search to identify which layer is causing the issue:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ISOLATION LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: CLIENT                                                 │
│  Test: Does the issue occur in different browsers/networks?     │
│  Tool: Browser DevTools Network tab                              │
│                                                                  │
│  Layer 2: NETWORK/LOAD BALANCER                                  │
│  Test: curl -w "%{time_total}" https://grafana/api/health       │
│  Tool: Network latency metrics                                   │
│                                                                  │
│  Layer 3: GRAFANA APPLICATION                                    │
│  Test: Check Grafana's own metrics and logs                     │
│  Tool: /metrics endpoint, application logs                       │
│                                                                  │
│  Layer 4: DATA SOURCE (Prometheus/Loki)                          │
│  Test: Query data source directly via API                        │
│  Tool: Direct API calls, data source metrics                     │
│                                                                  │
│  Layer 5: UNDERLYING INFRASTRUCTURE                              │
│  Test: Check CPU, memory, disk I/O                               │
│  Tool: kubectl top, node metrics                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Quick Isolation Tests:**

```bash
# Test 1: Grafana API health (eliminates network/LB issues)
curl -w "\nTotal time: %{time_total}s\n" https://grafana.example.com/api/health

# Test 2: Direct Prometheus query (eliminates Grafana as cause)
curl -w "\nTotal time: %{time_total}s\n" \
  "http://prometheus:9090/api/v1/query?query=up"

# Test 3: Check Grafana metrics
curl -s http://grafana:3000/metrics | grep grafana_http_request_duration
```

**Phase 3: Deep Dive into Identified Layer (15 minutes)**

Once you've identified the problematic layer, investigate deeply:

**If Grafana is slow:**
```bash
# Check Grafana resource usage
kubectl top pods -n monitoring -l app=grafana

# Check Grafana logs for slow queries
kubectl logs -n monitoring -l app=grafana | grep -i "slow\|timeout"

# Check active queries
curl -s http://grafana:3000/api/admin/stats | jq
```

**If Data Source is slow:**
```bash
# For Prometheus - check query performance
curl -s http://prometheus:9090/api/v1/query?query=prometheus_engine_query_duration_seconds

# Check for high cardinality
curl -s http://prometheus:9090/api/v1/status/tsdb | jq '.data.seriesCountByMetricName | to_entries | sort_by(-.value) | .[0:5]'
```

**Phase 4: Use Grafana's Built-in Tools**

**Query Inspector:**
1. Open the slow dashboard
2. Click panel menu → Inspect → Query
3. Review query execution time and data returned

**Key Metrics to Check:**
| Metric | Meaning | Action if High |
|--------|---------|----------------|
| Query time | Time to execute query | Optimize query, add recording rules |
| Data points | Amount of data returned | Reduce time range, increase step |
| Transformations | Post-processing time | Simplify transformations |

**Phase 5: Common Causes and Solutions**

| Root Cause | Symptoms | Solution |
|------------|----------|----------|
| Expensive PromQL query | Single panel slow | Use recording rules |
| High cardinality | All Prometheus queries slow | Reduce label cardinality |
| Large time range | Slow on historical views | Limit default time range |
| Too many panels | Entire dashboard slow | Split into multiple dashboards |
| Resource constraints | Intermittent slowness | Increase CPU/memory limits |
| Network latency | Consistent delay | Check network path, use caching |

**Phase 6: Document and Communicate**

```markdown
## Troubleshooting Summary

**Problem**: Dashboard "Production Overview" loading in 45 seconds

**Root Cause**: Panel "Request Rate by Endpoint" using high-cardinality 
query with 50,000+ unique label combinations

**Solution**: Created recording rule to pre-aggregate data:
```yaml
- record: job:http_requests:rate5m
  expr: sum(rate(http_requests_total[5m])) by (job, status_code)
```

**Result**: Dashboard now loads in 3 seconds

**Prevention**: Added cardinality monitoring alert
```


---

## Question 8: Customer Communication Scenario

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Customer Scenarios

### Question

A frustrated customer sends an urgent email saying "Grafana is completely broken and we can't see any of our metrics. This is unacceptable!" How would you respond and handle this situation?

### Answer

**Customer Communication Framework: Acknowledge, Investigate, Resolve, Follow-up**

**Step 1: Immediate Acknowledgment (Within 15 minutes)**

```
Subject: RE: Grafana is completely broken - Investigating Now [URGENT]

Hi [Customer Name],

Thank you for reaching out. I understand how critical visibility into your 
metrics is, and I'm treating this as a top priority.

I'm investigating this issue right now. To help me diagnose the problem 
as quickly as possible, could you please confirm:

1. When did you first notice the issue?
2. Are all dashboards affected, or specific ones?
3. Do you see any error messages? (A screenshot would be helpful)
4. Have there been any recent changes to your environment?

I'll provide an update within the next 30 minutes, even if I'm still 
investigating.

Best regards,
[Your Name]
Associate Observability Architect
Direct: [Phone] | Slack: @[handle]
```

**Key Elements:**
- ✅ Acknowledge the urgency
- ✅ Show empathy ("I understand how critical...")
- ✅ Commit to action ("investigating right now")
- ✅ Set clear expectations ("update within 30 minutes")
- ✅ Ask clarifying questions
- ✅ Provide multiple contact methods

**Step 2: Investigation (While Waiting for Response)**

Don't wait for answers - start investigating immediately:

```bash
# Check Grafana health
curl -s https://customer-grafana.example.com/api/health

# Check data source connectivity
curl -s https://customer-grafana.example.com/api/datasources

# Review recent alerts or incidents
# Check internal monitoring dashboards
```

**Step 3: Status Update (Within 30 minutes)**

Even if not resolved, provide an update:

```
Subject: RE: Grafana is completely broken - Status Update

Hi [Customer Name],

Quick update on my investigation:

**What I've found so far:**
- Grafana application is running and accessible
- The issue appears to be with the Prometheus data source connection
- I can see the connection is timing out

**What I'm doing now:**
- Checking network connectivity between Grafana and Prometheus
- Reviewing Prometheus pod status in your cluster

**Next update:** I'll have more information in 20 minutes.

If you have the information from my previous questions, that would still 
be helpful.

Best regards,
[Your Name]
```

**Step 4: Resolution Communication**

```
Subject: RE: Grafana is completely broken - RESOLVED

Hi [Customer Name],

Great news - I've identified and resolved the issue.

**What happened:**
Your Prometheus pods were experiencing memory pressure due to a recent 
increase in metric cardinality. This caused intermittent connection 
timeouts from Grafana.

**What I did:**
1. Increased Prometheus memory limits from 4Gi to 8Gi
2. Restarted the Prometheus pods
3. Verified all dashboards are now loading correctly

**What you should see:**
All your dashboards should now be loading normally. Could you please 
confirm this on your end?

**Preventing this in the future:**
I recommend we schedule a brief call to discuss:
- Setting up alerting for Prometheus resource usage
- Reviewing your metric cardinality to optimize storage

Would tomorrow at 2pm work for a 30-minute call?

Best regards,
[Your Name]
```

**Step 5: Follow-up (Next Day)**

```
Subject: Following up - Grafana metrics issue

Hi [Customer Name],

I wanted to check in and make sure everything is still working well 
after yesterday's issue.

I've also prepared a brief document on monitoring Prometheus health 
that might be helpful for your team: [Link]

Please don't hesitate to reach out if you have any questions or 
concerns.

Best regards,
[Your Name]
```

**Communication Principles Demonstrated:**

| Principle | Application |
|-----------|-------------|
| **Empathy** | Acknowledge frustration, validate importance |
| **Transparency** | Share what you know and don't know |
| **Proactivity** | Update before being asked |
| **Clarity** | Use simple language, avoid jargon |
| **Accountability** | Take ownership, provide direct contact |
| **Prevention** | Offer solutions to prevent recurrence |


---

## Question 9: Kubernetes Resource Management

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Kubernetes Operations

### Question

A customer's Loki deployment is experiencing OOMKilled events. Explain how Kubernetes resource requests and limits work, and how you would help them right-size their Loki deployment.

### Answer

**Understanding Kubernetes Resource Management**

**Resource Requests vs Limits:**

```
┌─────────────────────────────────────────────────────────────────┐
│                REQUESTS vs LIMITS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REQUESTS (Guaranteed Resources)                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Minimum resources the container needs                  │    │
│  │ • Used by scheduler for pod placement                    │    │
│  │ • Container guaranteed to get these resources            │    │
│  │ • Affects which node the pod is scheduled on             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  LIMITS (Maximum Resources)                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Maximum resources the container can use                │    │
│  │ • CPU: Throttled if exceeded (not killed)                │    │
│  │ • Memory: OOMKilled if exceeded                          │    │
│  │ • Protects other workloads on the node                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Example:                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ resources:                                               │    │
│  │   requests:                                              │    │
│  │     memory: "2Gi"    # Guaranteed 2GB                    │    │
│  │     cpu: "500m"      # Guaranteed 0.5 CPU cores          │    │
│  │   limits:                                                │    │
│  │     memory: "4Gi"    # Max 4GB (OOMKilled if exceeded)   │    │
│  │     cpu: "2000m"     # Max 2 CPU cores (throttled)       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Diagnosing OOMKilled Issues:**

```bash
# Step 1: Confirm OOMKilled events
kubectl describe pod <loki-pod> -n monitoring | grep -A 5 "Last State"

# Expected output showing OOMKilled:
# Last State:     Terminated
#   Reason:       OOMKilled
#   Exit Code:    137

# Step 2: Check current resource configuration
kubectl get pod <loki-pod> -n monitoring -o yaml | grep -A 10 resources

# Step 3: Check actual memory usage over time
kubectl top pod <loki-pod> -n monitoring

# Step 4: Check memory usage history (if metrics available)
# PromQL query:
container_memory_working_set_bytes{pod=~"loki.*", namespace="monitoring"}
```

**Right-Sizing Methodology:**

**Step 1: Analyze Current Usage Patterns**

```promql
# Peak memory usage over last 7 days
max_over_time(container_memory_working_set_bytes{pod=~"loki.*"}[7d])

# Average memory usage
avg_over_time(container_memory_working_set_bytes{pod=~"loki.*"}[7d])

# Memory usage percentile (p95)
quantile_over_time(0.95, container_memory_working_set_bytes{pod=~"loki.*"}[7d])
```

**Step 2: Calculate Appropriate Values**

```
┌─────────────────────────────────────────────────────────────────┐
│                RIGHT-SIZING FORMULA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REQUEST = P95 usage + 10% buffer                               │
│  LIMIT = Peak usage + 25% headroom                              │
│                                                                  │
│  Example:                                                        │
│  • P95 memory usage: 3.2 GB                                     │
│  • Peak memory usage: 3.8 GB                                    │
│                                                                  │
│  Calculated values:                                              │
│  • Request: 3.2 GB × 1.1 = 3.5 GB                               │
│  • Limit: 3.8 GB × 1.25 = 4.75 GB → Round to 5 GB              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Step 3: Apply Updated Configuration**

```yaml
# loki-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: monitoring
spec:
  template:
    spec:
      containers:
        - name: loki
          image: grafana/loki:2.9.0
          resources:
            requests:
              memory: "3.5Gi"
              cpu: "500m"
            limits:
              memory: "5Gi"
              cpu: "2000m"
```

**Loki-Specific Considerations:**

| Component | Memory Driver | Optimization |
|-----------|---------------|--------------|
| **Ingester** | Active streams, chunk buffer | Tune `max_streams_per_user`, `chunk_idle_period` |
| **Querier** | Query result caching | Limit `max_query_length`, enable result caching |
| **Compactor** | Compaction operations | Schedule during low-traffic periods |

**Loki Configuration Tuning:**

```yaml
# loki-config.yaml
limits_config:
  max_streams_per_user: 10000        # Reduce if too many streams
  max_entries_limit_per_query: 5000  # Limit query result size
  
ingester:
  chunk_idle_period: 30m             # Flush chunks sooner
  max_chunk_age: 1h                  # Limit chunk memory residence
  chunk_target_size: 1536000         # ~1.5MB chunks
```

**Monitoring After Changes:**

```yaml
# Alert rule for memory pressure
- alert: LokiHighMemoryUsage
  expr: |
    container_memory_working_set_bytes{pod=~"loki.*"} 
    / container_spec_memory_limit_bytes{pod=~"loki.*"} > 0.85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Loki memory usage above 85% of limit"
```


---

## Question 10: Documentation Best Practices

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Documentation

### Question

You need to create a runbook for a customer's on-call team to handle "Grafana High Latency" alerts. What sections would you include, and what makes a runbook effective for incident response?

### Answer

**Effective Runbook Structure**

A good runbook enables anyone on-call to respond effectively, even if they're not deeply familiar with the system.

**Complete Runbook Example:**

```markdown
# Runbook: Grafana High Latency Alert

## Alert Details
- **Alert Name**: GrafanaHighLatency
- **Severity**: P2 - High
- **Threshold**: p99 latency > 5 seconds for 5 minutes
- **Notification**: PagerDuty, #alerts-grafana Slack channel

## Overview
This alert fires when Grafana dashboard and API response times exceed 
acceptable thresholds, indicating performance degradation that impacts 
user experience.

## Impact Assessment
| Severity | Condition | Action |
|----------|-----------|--------|
| **Critical** | All dashboards unusable | Escalate immediately |
| **High** | Significant delays (>10s) | Follow runbook, escalate if no progress in 15min |
| **Medium** | Noticeable delays (5-10s) | Follow runbook, monitor |

## Quick Diagnosis (5 minutes)

### Step 1: Verify the Alert
```bash
# Check current latency
curl -w "Total: %{time_total}s\n" -o /dev/null -s \
  https://grafana.example.com/api/health
```
Expected: < 1 second. If > 5 seconds, alert is valid.

### Step 2: Check Grafana Pod Status
```bash
kubectl get pods -n monitoring -l app=grafana
kubectl top pods -n monitoring -l app=grafana
```
Look for: Restarts, high CPU/memory usage, pending pods.

### Step 3: Check Data Source Health
```bash
# Test Prometheus connectivity
curl -w "Total: %{time_total}s\n" -o /dev/null -s \
  "http://prometheus:9090/api/v1/query?query=up"
```
If slow: Issue is likely with Prometheus, not Grafana.

## Common Causes and Resolutions

### Cause 1: Prometheus Overloaded
**Symptoms**: Data source queries slow, Prometheus high CPU/memory
**Resolution**:
```bash
# Check Prometheus resource usage
kubectl top pods -n monitoring -l app=prometheus

# If memory > 80%, consider restart or scaling
kubectl rollout restart deployment/prometheus -n monitoring
```

### Cause 2: Expensive Dashboard Queries
**Symptoms**: Specific dashboards slow, others fine
**Resolution**:
1. Identify slow dashboard from user reports
2. Open dashboard → Panel menu → Inspect → Query
3. Note query execution time
4. If query > 5s, create recording rule or optimize query

### Cause 3: Grafana Resource Constraints
**Symptoms**: All Grafana operations slow, high CPU usage
**Resolution**:
```bash
# Scale Grafana horizontally
kubectl scale deployment/grafana --replicas=3 -n monitoring

# Or increase resources
kubectl set resources deployment/grafana -n monitoring \
  --limits=cpu=2000m,memory=2Gi \
  --requests=cpu=500m,memory=1Gi
```

### Cause 4: Database Connection Issues
**Symptoms**: Login slow, dashboard saves fail
**Resolution**:
```bash
# Check database connectivity
kubectl exec -it <grafana-pod> -n monitoring -- \
  nc -zv postgres-host 5432

# Check database logs
kubectl logs -n monitoring -l app=postgres --tail=50
```

## Escalation Path
| Time | Action |
|------|--------|
| 0-15 min | Follow runbook steps |
| 15-30 min | Escalate to senior engineer |
| 30+ min | Escalate to engineering manager |

**Escalation Contacts**:
- Primary: @oncall-platform (Slack)
- Secondary: platform-team@example.com
- Manager: [Name] - [Phone]

## Post-Incident
- [ ] Document what happened in incident channel
- [ ] Create ticket for follow-up if needed
- [ ] Update this runbook if new failure mode discovered

## Related Resources
- [Grafana Architecture Diagram](link)
- [Prometheus Troubleshooting Guide](link)
- [Escalation Policy](link)

---
**Last Updated**: 2024-01-15
**Owner**: Platform Team
**Review Cycle**: Quarterly
```

**What Makes This Runbook Effective:**

| Element | Purpose |
|---------|---------|
| **Alert context** | Responder understands what triggered the page |
| **Impact assessment** | Helps prioritize response urgency |
| **Quick diagnosis** | Fast triage in first 5 minutes |
| **Copy-paste commands** | No need to remember syntax under pressure |
| **Decision trees** | Clear paths based on symptoms |
| **Escalation path** | Know when and who to escalate to |
| **Post-incident checklist** | Ensures follow-up happens |
| **Ownership and review date** | Keeps documentation current |


---

## Question 11: Distributed Tracing Concepts

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Observability Concepts

### Question

A customer is implementing distributed tracing with Tempo for the first time. They ask: "How do traces help us that metrics and logs don't? And how do we correlate data across all three?" Explain the unique value of traces and demonstrate correlation.

### Answer

**The Unique Value of Distributed Traces**

**What Traces Provide That Metrics and Logs Don't:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRACE UNIQUE VALUE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CAUSALITY - Shows cause and effect relationships            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Metrics: "Service A has high latency"                    │    │
│  │ Logs: "Service A called Service B"                       │    │
│  │ Traces: "Service A is slow BECAUSE Service B's DB query  │    │
│  │          took 2 seconds"                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. REQUEST FLOW - Visualizes the complete journey              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ API Gateway → Auth → Order Service → Payment → Database │    │
│  │     50ms      20ms      100ms         500ms      200ms   │    │
│  │                                        ↑                 │    │
│  │                                   BOTTLENECK             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. LATENCY BREAKDOWN - Shows where time is spent               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Total: 870ms                                             │    │
│  │ ├── Network: 50ms (6%)                                   │    │
│  │ ├── Auth: 20ms (2%)                                      │    │
│  │ ├── Business Logic: 100ms (11%)                          │    │
│  │ ├── Payment API: 500ms (57%) ← Focus optimization here   │    │
│  │ └── Database: 200ms (23%)                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Practical Correlation Example:**

**Scenario**: User reports slow checkout

**Step 1: Alert from Metrics**
```promql
# Alert fires: High p99 latency on checkout endpoint
histogram_quantile(0.99, 
  sum(rate(http_request_duration_seconds_bucket{endpoint="/checkout"}[5m])) by (le)
) > 2
```

**Step 2: Find Example Trace via Exemplars**

In Grafana, metrics can include exemplars that link to specific traces:

```promql
# Query with exemplars enabled shows trace_id for slow requests
http_request_duration_seconds_bucket{endpoint="/checkout"}
```

Click on an exemplar point to jump directly to the trace in Tempo.

**Step 3: Analyze Trace in Tempo**

```
Trace ID: abc123def456
Duration: 2.5s

├── [200ms] api-gateway (HTTP GET /checkout)
│   └── [50ms] Authentication check
├── [100ms] checkout-service (Process order)
│   ├── [30ms] Validate cart
│   └── [70ms] Calculate totals
├── [2000ms] payment-service (Process payment) ← BOTTLENECK
│   ├── [100ms] Fraud check
│   └── [1900ms] payment-provider-api (External call) ← ROOT CAUSE
└── [200ms] notification-service (Send confirmation)
```

**Step 4: Correlate with Logs**

Using the trace_id, find detailed logs:

```logql
# Query Loki with trace_id from the slow trace
{service="payment-service"} | json | trace_id="abc123def456"
```

**Log Output:**
```json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "level": "warn",
  "message": "Payment provider response slow",
  "trace_id": "abc123def456",
  "span_id": "span789",
  "provider": "stripe",
  "response_time_ms": 1900,
  "retry_count": 2
}
```

**Setting Up Correlation:**

**1. Instrument Applications with Trace Context:**
```go
// Ensure trace_id is included in logs
logger.With(
    "trace_id", span.SpanContext().TraceID().String(),
    "span_id", span.SpanContext().SpanID().String(),
).Info("Processing payment")
```

**2. Configure Grafana Data Source Correlation:**
```yaml
# In Grafana datasource configuration
correlations:
  - targetUID: tempo
    label: "View Trace"
    description: "View trace in Tempo"
    config:
      type: query
      target:
        query: "${__data.fields.trace_id}"
```

**3. Use Derived Fields in Loki:**
```yaml
# Loki datasource derived fields
derivedFields:
  - name: TraceID
    matcherRegex: '"trace_id":"(\w+)"'
    url: '/explore?left=["now-1h","now","Tempo",{"query":"${__value.raw}"}]'
    datasourceUid: tempo
```

**Correlation Workflow Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREE-PILLAR CORRELATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   METRICS                 TRACES                  LOGS          │
│   ┌─────────┐            ┌─────────┐            ┌─────────┐    │
│   │ Alert:  │            │ Trace:  │            │ Log:    │    │
│   │ High    │──exemplar──│ Shows   │──trace_id──│ Details │    │
│   │ Latency │            │ Flow    │            │ & Error │    │
│   └─────────┘            └─────────┘            └─────────┘    │
│       │                       │                      │          │
│       │                       │                      │          │
│       ▼                       ▼                      ▼          │
│   "Something               "Where is            "Why did       │
│    is wrong"               time spent?"          it fail?"     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Takeaway for Customer:**
Traces are the "glue" that connects metrics (what's wrong) to logs (why it's wrong) by showing the complete request journey and enabling correlation via trace_id.


---

## Question 12: Deployment Troubleshooting Scenario

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Kubernetes Operations

### Question

A customer deployed a new version of their application, and now their Prometheus scrape targets show as "DOWN". The application pods are running. Walk through how you would diagnose this issue.

### Answer

**Systematic Scrape Target Troubleshooting**

**Step 1: Verify the Symptom**

```bash
# Check Prometheus targets via API
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health == "down") | {job: .labels.job, instance: .labels.instance, lastError: .lastError}'
```

**Common Error Messages and Meanings:**

| Error | Meaning | Likely Cause |
|-------|---------|--------------|
| `connection refused` | Port not listening | App not exposing metrics, wrong port |
| `context deadline exceeded` | Timeout | Network issue, slow response |
| `server returned HTTP status 404` | Endpoint not found | Wrong metrics path |
| `server returned HTTP status 401/403` | Auth required | Missing credentials |

**Step 2: Verify Application is Exposing Metrics**

```bash
# Get pod IP
POD_IP=$(kubectl get pod <app-pod> -n <namespace> -o jsonpath='{.status.podIP}')

# Test metrics endpoint from within cluster
kubectl run test-curl --rm -it --image=curlimages/curl -- \
  curl -v http://${POD_IP}:8080/metrics

# Check if the metrics port is in the container spec
kubectl get pod <app-pod> -n <namespace> -o yaml | grep -A 5 ports
```

**Step 3: Check Prometheus Scrape Configuration**

```bash
# View current scrape config
kubectl get configmap prometheus-config -n monitoring -o yaml

# Or via Prometheus API
curl -s http://prometheus:9090/api/v1/status/config | jq -r '.data.yaml' | grep -A 20 "job_name: <your-job>"
```

**Common Configuration Issues:**

```yaml
# Issue 1: Wrong port
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['my-app:8080']  # App changed to port 9090

# Issue 2: Wrong metrics path
scrape_configs:
  - job_name: 'my-app'
    metrics_path: /metrics  # App now uses /actuator/prometheus

# Issue 3: Service discovery not matching new labels
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true  # New deployment missing annotation
```

**Step 4: Check Pod Annotations (for Kubernetes SD)**

```bash
# Check if pod has required annotations
kubectl get pod <app-pod> -n <namespace> -o yaml | grep -A 5 annotations

# Expected annotations for Prometheus kubernetes_sd:
# annotations:
#   prometheus.io/scrape: "true"
#   prometheus.io/port: "8080"
#   prometheus.io/path: "/metrics"
```

**Step 5: Network Policy Check**

```bash
# Check if NetworkPolicy is blocking Prometheus
kubectl get networkpolicies -n <app-namespace>

# Describe policy to see ingress rules
kubectl describe networkpolicy <policy-name> -n <app-namespace>
```

**Resolution Checklist:**

```markdown
## Scrape Target Down - Diagnosis Checklist

### Application Side
- [ ] Application is running (`kubectl get pods`)
- [ ] Metrics endpoint responds (`curl http://<pod-ip>:<port>/metrics`)
- [ ] Correct port is exposed in container spec
- [ ] Pod has correct Prometheus annotations (if using kubernetes_sd)

### Prometheus Side
- [ ] Scrape config has correct target/port
- [ ] Scrape config has correct metrics_path
- [ ] Relabel configs match pod labels/annotations
- [ ] Scrape interval/timeout appropriate

### Network Side
- [ ] No NetworkPolicy blocking Prometheus
- [ ] Service exists and has endpoints
- [ ] DNS resolution works

### After New Deployment
- [ ] Verify annotations weren't removed
- [ ] Check if port changed
- [ ] Check if metrics path changed
- [ ] Verify new pods are in correct namespace
```

**Example Fix - Adding Missing Annotation:**

```yaml
# deployment.yaml - Add Prometheus annotations
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"      # Updated port
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: my-app
          ports:
            - containerPort: 9090       # Match annotation
              name: metrics
```

**Verification:**
```bash
# After fix, check targets again
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job == "my-app") | {health: .health, lastScrape: .lastScrape}'
```


---

## Question 13: Customer Escalation Handling

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Customer Scenarios

### Question

A customer's VP of Engineering has escalated directly to your manager, saying the observability platform has been "unreliable for weeks" and they're considering alternatives. You're asked to take over the account. How do you approach this situation?

### Answer

**Executive Escalation Recovery Framework**

**Phase 1: Immediate Response (Day 1)**

**Step 1: Internal Preparation (Before Customer Contact)**

```markdown
## Pre-Call Research Checklist
- [ ] Review all support tickets from past 30 days
- [ ] Analyze incident history and resolution times
- [ ] Identify patterns in reported issues
- [ ] Review SLA compliance data
- [ ] Understand customer's environment and scale
- [ ] Identify any known issues affecting this customer
```

**Step 2: Executive Acknowledgment Call**

Request a call with the VP directly. Agenda:

```markdown
## Executive Recovery Call Agenda (30 minutes)

1. **Acknowledgment** (5 min)
   - Thank them for escalating
   - Acknowledge their frustration is valid
   - Commit to personal ownership

2. **Listen** (10 min)
   - "Help me understand the impact on your team"
   - "What are the most critical issues?"
   - "What does success look like for you?"

3. **Immediate Actions** (10 min)
   - Present findings from ticket analysis
   - Propose immediate remediation steps
   - Commit to specific timeline

4. **Ongoing Communication** (5 min)
   - Establish direct communication channel
   - Agree on update frequency
   - Schedule follow-up meeting
```

**Key Phrases to Use:**
- "I understand this has been frustrating, and I take full responsibility for getting this resolved."
- "Your business depends on this platform, and we've let you down."
- "Here's exactly what I'm going to do..."

**Phase 2: Root Cause Analysis (Days 1-3)**

**Comprehensive Issue Analysis:**

```markdown
## Account Health Assessment

### Ticket Analysis Summary
| Category | Count | Avg Resolution | Pattern |
|----------|-------|----------------|---------|
| Performance | 8 | 4 hours | Dashboard slowness during peak |
| Availability | 3 | 2 hours | Prometheus restarts |
| Configuration | 5 | 6 hours | Data source issues |

### Identified Root Causes
1. **Undersized Prometheus**: Memory limits causing OOM during peak
2. **Missing Recording Rules**: Expensive queries on every dashboard load
3. **No Proactive Monitoring**: Issues discovered by customer, not us

### Environment Gaps
- No alerting on platform health
- Outdated Grafana version (missing performance fixes)
- No capacity planning in place
```

**Phase 3: Remediation Plan (Days 3-5)**

**Present Concrete Action Plan:**

```markdown
## 30-Day Remediation Plan

### Week 1: Stabilization
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Increase Prometheus resources | Platform | Day 2 | ✅ |
| Implement recording rules for top 10 dashboards | Me | Day 3 | In Progress |
| Deploy platform health monitoring | SRE | Day 5 | Scheduled |

### Week 2: Optimization
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Upgrade Grafana to latest version | Platform | Day 8 | Scheduled |
| Implement query caching | Me | Day 10 | Scheduled |
| Review and optimize all dashboards | Me | Day 12 | Scheduled |

### Week 3: Prevention
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Implement proactive alerting | SRE | Day 15 | Scheduled |
| Create capacity planning dashboard | Me | Day 17 | Scheduled |
| Document runbooks for common issues | Me | Day 19 | Scheduled |

### Week 4: Validation
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Performance testing | QA | Day 22 | Scheduled |
| Customer review meeting | Me | Day 25 | Scheduled |
| Handoff to regular support | Me | Day 30 | Scheduled |
```

**Phase 4: Ongoing Communication**

**Weekly Executive Summary Template:**

```markdown
## Weekly Status Update - [Customer Name]

**Period**: [Date Range]
**Overall Status**: 🟢 Green / 🟡 Yellow / 🔴 Red

### Key Metrics
| Metric | Last Week | This Week | Target |
|--------|-----------|-----------|--------|
| Platform Uptime | 99.2% | 99.9% | 99.9% |
| Avg Dashboard Load | 8s | 2s | <3s |
| Support Tickets | 5 | 1 | <2 |

### Completed This Week
- ✅ Prometheus memory increased to 16GB
- ✅ Recording rules deployed for 10 dashboards
- ✅ Platform health dashboard created

### Planned Next Week
- Grafana upgrade to v10.2
- Query caching implementation
- Dashboard optimization review

### Risks/Blockers
- None currently

### Next Check-in
- Date: [Next Week]
- Attendees: [Names]
```

**Success Metrics:**

| Metric | Before | Target | Timeline |
|--------|--------|--------|----------|
| Support tickets/week | 5+ | <2 | 30 days |
| Dashboard load time | 8s | <3s | 14 days |
| Platform uptime | 99.2% | 99.9% | 7 days |
| Customer satisfaction | Escalated | Promoter | 60 days |

**Key Principles:**
1. **Own it completely** - No blame, no excuses
2. **Over-communicate** - More updates than they expect
3. **Deliver quick wins** - Show progress immediately
4. **Prevent recurrence** - Address root causes, not just symptoms
5. **Rebuild trust** - Consistent delivery over time


---

## Question 14: Knowledge Transfer Documentation

**Difficulty**: ⭐⭐ Intermediate  
**Category**: Documentation

### Question

You've been supporting a complex customer environment for 6 months and need to hand off to a colleague. What documentation would you create to ensure a smooth knowledge transfer?

### Answer

**Comprehensive Knowledge Transfer Package**

**Document 1: Account Overview**

```markdown
# Customer Account Overview: [Company Name]

## Quick Reference
| Item | Value |
|------|-------|
| **Customer** | [Company Name] |
| **Industry** | [e.g., Financial Services] |
| **Contract Tier** | Enterprise |
| **Primary Contact** | [Name], [Title], [Email] |
| **Technical Contact** | [Name], [Title], [Email] |
| **Slack Channel** | #customer-[name] |
| **Support Hours** | 24/7 |

## Environment Summary
- **Grafana Version**: 10.2.0
- **Deployment**: Grafana Cloud
- **Data Sources**: Prometheus, Loki, Tempo
- **Users**: 150 (5 admin, 25 editor, 120 viewer)
- **Dashboards**: 45 production dashboards
- **Alerts**: 120 active alert rules

## Architecture Diagram
```
[Include architecture diagram showing data flow]
```

## Key Stakeholders
| Name | Role | Relationship | Notes |
|------|------|--------------|-------|
| [VP Name] | VP Engineering | Executive Sponsor | Monthly check-ins |
| [Manager Name] | Platform Manager | Primary Contact | Weekly syncs |
| [Engineer Name] | SRE Lead | Technical Contact | Day-to-day issues |

## Communication Preferences
- Prefers Slack for quick questions
- Email for formal updates
- Bi-weekly sync calls (Tuesdays 2pm)
```

**Document 2: Technical Environment Details**

```markdown
# Technical Environment: [Customer Name]

## Infrastructure
### Kubernetes Clusters
| Cluster | Region | Purpose | Nodes |
|---------|--------|---------|-------|
| prod-us-east | us-east-1 | Production | 50 |
| prod-us-west | us-west-2 | Production DR | 30 |
| staging | us-east-1 | Staging | 10 |

### Grafana Stack Components
| Component | Version | Replicas | Resources |
|-----------|---------|----------|-----------|
| Grafana | 10.2.0 | 3 | 2CPU/4GB |
| Prometheus | 2.47.0 | 2 (HA) | 4CPU/16GB |
| Loki | 2.9.0 | Microservices | Various |
| Tempo | 2.3.0 | Distributed | Various |

## Data Sources Configuration
### Prometheus
- **URL**: https://prometheus.customer.internal:9090
- **Auth**: Service account token
- **Scrape Interval**: 30s
- **Retention**: 30 days

### Loki
- **URL**: https://loki.customer.internal:3100
- **Auth**: Basic auth (credentials in Vault)
- **Retention**: 90 days

## Known Quirks and Workarounds
1. **Dashboard "Payment Analytics"** - Uses custom plugin, requires 
   manual update when Grafana upgrades
2. **Prometheus HA** - They use Thanos for long-term storage, queries 
   >7 days go to Thanos endpoint
3. **SSO** - Uses Okta, group sync runs every 4 hours
```

**Document 3: Historical Context**

```markdown
# Account History: [Customer Name]

## Timeline
| Date | Event | Outcome |
|------|-------|---------|
| 2023-06 | Initial deployment | Successful go-live |
| 2023-08 | Performance issues | Upgraded Prometheus resources |
| 2023-10 | Executive escalation | 30-day remediation plan |
| 2023-11 | Remediation complete | Customer satisfied |
| 2024-01 | Added Tempo | Distributed tracing enabled |

## Major Incidents
### INC-2023-1015: Platform Outage
- **Duration**: 2 hours
- **Root Cause**: Prometheus OOM due to cardinality spike
- **Resolution**: Increased memory, added cardinality alerting
- **Customer Impact**: High - all dashboards unavailable
- **Lessons Learned**: Need proactive cardinality monitoring

### INC-2023-1102: Slow Dashboards
- **Duration**: Ongoing for 2 weeks before escalation
- **Root Cause**: Missing recording rules, expensive queries
- **Resolution**: Created recording rules, optimized dashboards
- **Customer Impact**: Medium - degraded experience
- **Lessons Learned**: Regular dashboard performance reviews

## Ongoing Initiatives
1. **Cardinality Reduction** - Working with app teams to reduce 
   metric labels (Target: Q1 completion)
2. **Dashboard Consolidation** - Merging redundant dashboards 
   (Target: 45 → 30 dashboards)
3. **Alerting Optimization** - Reducing alert noise 
   (Target: 50% reduction in non-actionable alerts)
```

**Document 4: Runbooks and Procedures**

```markdown
# Customer-Specific Runbooks: [Customer Name]

## Common Issues and Resolutions

### Issue: "Dashboards loading slowly"
**Frequency**: Monthly
**Typical Cause**: Prometheus memory pressure during month-end reporting
**Resolution**:
1. Check Prometheus memory: `kubectl top pods -n monitoring`
2. If >80%, restart: `kubectl rollout restart sts/prometheus`
3. Long-term: Review recording rules for month-end dashboards

### Issue: "Missing metrics for [specific service]"
**Frequency**: After deployments
**Typical Cause**: Prometheus annotations removed in new deployment
**Resolution**:
1. Check pod annotations: `kubectl get pod -o yaml | grep prometheus`
2. If missing, contact app team to add annotations
3. Reference: [Internal wiki link to annotation requirements]

### Issue: "SSO login not working"
**Frequency**: Quarterly (after Okta changes)
**Typical Cause**: Okta group mapping changed
**Resolution**:
1. Check Okta admin console for group changes
2. Update Grafana team sync configuration
3. Contact: [Okta admin name and email]

## Escalation Contacts
| Issue Type | Primary | Secondary |
|------------|---------|-----------|
| Platform | @platform-oncall | platform@example.com |
| Networking | @network-team | network@example.com |
| Customer Billing | @sales-ops | billing@example.com |
```

**Document 5: Handoff Checklist**

```markdown
# Knowledge Transfer Checklist

## Access and Permissions
- [ ] Added to customer Slack channel
- [ ] Added to customer email distribution
- [ ] Access to customer's Grafana instance
- [ ] Access to internal customer documentation

## Introductions
- [ ] Introduced to primary contact via email
- [ ] Introduced to technical contact via email
- [ ] Added to recurring meeting invites

## Knowledge Transfer Sessions
- [ ] Session 1: Account overview and history (1 hour)
- [ ] Session 2: Technical environment deep-dive (2 hours)
- [ ] Session 3: Shadow on support ticket (1 hour)
- [ ] Session 4: Shadow on customer call (1 hour)

## Documentation Review
- [ ] Reviewed account overview document
- [ ] Reviewed technical environment document
- [ ] Reviewed historical context document
- [ ] Reviewed runbooks and procedures

## Handoff Complete
- [ ] Customer notified of new point of contact
- [ ] First solo customer interaction completed
- [ ] 30-day check-in scheduled
```


---

## Question 15: Alerting Strategy Design

**Difficulty**: ⭐⭐⭐ Advanced  
**Category**: Troubleshooting

### Question

A customer complains they're experiencing "alert fatigue" - their team receives hundreds of alerts daily, most of which are not actionable. How would you help them redesign their alerting strategy?

### Answer

**Alert Fatigue Remediation Framework**

**Phase 1: Assessment - Understand the Current State**

**Step 1: Quantify the Problem**

```promql
# Count alerts fired in last 7 days
count(ALERTS{alertstate="firing"}) by (alertname)

# Identify most frequent alerts
topk(10, count_over_time(ALERTS{alertstate="firing"}[7d])) by (alertname)

# Calculate alert-to-incident ratio
# (Alerts that resulted in actual incidents vs total alerts)
```

**Alert Audit Template:**

```markdown
## Alert Audit: [Customer Name]

### Current State
| Metric | Value |
|--------|-------|
| Total alert rules | 250 |
| Alerts fired (7 days) | 1,847 |
| Unique alerts | 89 |
| Alerts per day (avg) | 264 |
| Actionable alerts | ~15% |

### Top 10 Noisy Alerts
| Alert | Fires/Week | Actionable? | Recommendation |
|-------|------------|-------------|----------------|
| HighCPU | 312 | 5% | Increase threshold |
| PodRestart | 245 | 10% | Add for: clause |
| DiskSpace | 189 | 20% | Tune threshold |
| HighLatency | 156 | 30% | Add recording rule |
| ... | ... | ... | ... |
```

**Phase 2: Establish Alerting Principles**

**The Alerting Philosophy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALERTING PRINCIPLES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. EVERY ALERT MUST BE ACTIONABLE                              │
│     If you can't do anything about it, don't alert on it        │
│                                                                  │
│  2. ALERT ON SYMPTOMS, NOT CAUSES                               │
│     Alert: "Users experiencing errors"                          │
│     Not: "Database CPU high"                                    │
│                                                                  │
│  3. ALERT ON USER IMPACT                                        │
│     Focus on SLOs: availability, latency, error rate            │
│                                                                  │
│  4. USE APPROPRIATE SEVERITY                                    │
│     Page: Requires immediate human intervention                 │
│     Ticket: Needs attention within business hours               │
│     Log: Informational, no action needed                        │
│                                                                  │
│  5. INCLUDE CONTEXT                                             │
│     Alert should tell you what's wrong and where to start       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Phase 3: Implement Alert Tiers**

```yaml
# Tiered alerting structure
groups:
  - name: tier1-page-immediately
    rules:
      # Only alerts that require immediate human intervention
      - alert: ServiceDown
        expr: up{job="critical-service"} == 0
        for: 2m
        labels:
          severity: critical
          tier: page
        annotations:
          summary: "Critical service {{ $labels.instance }} is down"
          runbook: "https://wiki/runbooks/service-down"
          
  - name: tier2-ticket-business-hours
    rules:
      # Issues that need attention but not immediately
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service) > 0.05
        for: 15m
        labels:
          severity: warning
          tier: ticket
        annotations:
          summary: "{{ $labels.service }} error rate above 5%"
          
  - name: tier3-informational
    rules:
      # Logged but not alerted
      - alert: ElevatedLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 30m
        labels:
          severity: info
          tier: log
```

**Phase 4: Optimize Existing Alerts**

**Common Fixes:**

| Problem | Before | After |
|---------|--------|-------|
| **Too sensitive** | `for: 1m` | `for: 5m` |
| **Wrong threshold** | `> 80%` | `> 95%` |
| **Missing context** | Fires on any pod | Add `for:` and label filters |
| **Duplicate alerts** | Multiple similar alerts | Consolidate into one |

**Example Optimization:**

```yaml
# BEFORE: Noisy alert
- alert: HighCPU
  expr: container_cpu_usage_seconds_total > 0.8
  for: 1m  # Too short
  labels:
    severity: critical  # Over-classified

# AFTER: Optimized alert
- alert: HighCPU
  expr: |
    (
      sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)
      / sum(container_spec_cpu_quota) by (pod)
    ) > 0.9  # Higher threshold
  for: 10m  # Longer duration
  labels:
    severity: warning  # Appropriate severity
  annotations:
    summary: "Pod {{ $labels.pod }} CPU usage above 90% for 10 minutes"
    dashboard: "https://grafana/d/cpu-dashboard?var-pod={{ $labels.pod }}"
```

**Phase 5: Implement SLO-Based Alerting**

```yaml
# SLO-based alerting (recommended approach)
groups:
  - name: slo-alerts
    rules:
      # Alert on error budget burn rate
      - alert: ErrorBudgetBurn
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            / sum(rate(http_requests_total[1h]))
          ) > (1 - 0.999) * 14.4
          # 14.4x burn rate = budget exhausted in 5 days
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Error budget burning too fast"
          description: "At current rate, monthly error budget exhausted in 5 days"
          
      # Alert on availability SLO breach risk
      - alert: AvailabilitySLOAtRisk
        expr: |
          (
            sum(increase(http_requests_total{status=~"5.."}[24h]))
            / sum(increase(http_requests_total[24h]))
          ) > 0.001
          # More than 0.1% errors in 24h
        for: 30m
        labels:
          severity: critical
```

**Phase 6: Measure Improvement**

```markdown
## Alert Health Metrics (Track Weekly)

| Metric | Before | Week 1 | Week 4 | Target |
|--------|--------|--------|--------|--------|
| Alerts/day | 264 | 150 | 45 | <50 |
| Actionable % | 15% | 40% | 85% | >80% |
| MTTA (min) | 45 | 30 | 15 | <20 |
| False positive % | 60% | 30% | 10% | <15% |
| Alert rules | 250 | 180 | 75 | <100 |
```

**Deliverables for Customer:**

1. **Alert Audit Report** - Current state analysis
2. **Alerting Standards Document** - Principles and guidelines
3. **Optimized Alert Rules** - Refactored Prometheus rules
4. **Runbook Templates** - For each critical alert
5. **Monitoring Dashboard** - Track alert health metrics

---

## Summary

These 15 questions cover the core competencies expected of an Associate Observability Architect at Grafana Labs:

| Category | Questions | Key Skills Tested |
|----------|-----------|-------------------|
| **Kubernetes Operations** | 1, 5, 9, 12 | Pod troubleshooting, networking, resource management |
| **Observability Concepts** | 2, 6, 11 | Three pillars, signal selection, correlation |
| **Troubleshooting** | 3, 7, 15 | RCA, systematic debugging, alerting |
| **Customer Scenarios** | 4, 8, 13 | Onboarding, communication, escalation handling |
| **Documentation** | 10, 14 | Runbooks, knowledge transfer |

**Preparation Tips:**
- Practice explaining technical concepts in simple terms
- Prepare real examples from your experience
- Be ready to whiteboard troubleshooting approaches
- Demonstrate customer empathy in scenario questions
- Show systematic thinking in problem-solving questions

---

**[← Back to Questions Overview](./README.md)** | **[← Back to Study Guide](../README.md)**
