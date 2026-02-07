# Fundamentals: Associate Observability Architect

This document covers the foundational knowledge required for the Associate Observability Architect role at Grafana Labs. It focuses on Kubernetes basics and operations, the three pillars of observability (metrics, logs, traces), and technical support foundations.

## Table of Contents

1. [Kubernetes Basics and Operations](#kubernetes-basics-and-operations)
2. [Observability Pillars](#observability-pillars)
3. [Technical Support Foundations](#technical-support-foundations)
4. [Practical Examples](#practical-examples)
5. [Key Takeaways](#key-takeaways)

---

## Kubernetes Basics and Operations

Understanding Kubernetes is essential for the Associate Observability Architect role, as most Grafana deployments run on Kubernetes. This section covers the core concepts you need to support customers effectively.

> **📚 Deep Dive**: For comprehensive Kubernetes coverage, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Core Kubernetes Concepts

Kubernetes orchestrates containerized applications across clusters of machines. As an observability architect, you'll help customers deploy and troubleshoot Grafana stack components on Kubernetes.

#### Essential Resources

| Resource | Purpose | Key Use Case |
|----------|---------|--------------|
| **Pod** | Smallest deployable unit | Running Grafana, Prometheus, Loki containers |
| **Deployment** | Manages Pod replicas | Scaling Grafana instances |
| **Service** | Network endpoint for Pods | Exposing Grafana dashboards |
| **ConfigMap** | Configuration storage | Grafana datasource configs |
| **Secret** | Sensitive data storage | API keys, passwords |
| **Namespace** | Logical isolation | Separating monitoring from applications |

#### Pod Fundamentals

Pods are the atomic unit in Kubernetes. Understanding Pod structure helps you troubleshoot customer issues effectively.

```
┌─────────────────────────────────────────────────────────────────┐
│                            POD                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │   Container 1   │  │   Container 2   │  (Sidecar pattern)   │
│  │   (Grafana)     │  │   (Config       │                       │
│  │                 │  │    Reloader)    │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  Shared: Network namespace, Storage volumes, IP address         │
└─────────────────────────────────────────────────────────────────┘
```

**Pod Lifecycle States**:

| State | Description | Common Causes |
|-------|-------------|---------------|
| **Pending** | Pod accepted but not running | Image pull, resource constraints |
| **Running** | Pod bound to node, containers started | Normal operation |
| **Succeeded** | All containers terminated successfully | Job completion |
| **Failed** | All containers terminated, at least one failed | Application error |
| **Unknown** | Pod state cannot be determined | Node communication issues |

#### Deployments and ReplicaSets

Deployments manage the desired state of your application, ensuring the right number of Pods are running.

```yaml
# Example: Grafana Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  replicas: 2  # Run 2 instances for availability
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

**Key Deployment Concepts**:

- **Replicas**: Number of identical Pods to maintain
- **Selector**: How the Deployment finds Pods to manage
- **Strategy**: How updates are rolled out (RollingUpdate or Recreate)
- **Resource Requests/Limits**: CPU and memory allocation

#### Services and Networking

Services provide stable network endpoints for accessing Pods, which is crucial for exposing Grafana dashboards and APIs.

```yaml
# Example: Grafana Service
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  type: ClusterIP  # Internal access only
  selector:
    app: grafana
  ports:
    - name: http
      port: 3000
      targetPort: 3000
```

**Service Types for Observability Deployments**:

| Type | Access | Use Case |
|------|--------|----------|
| **ClusterIP** | Internal only | Inter-service communication (Prometheus → Grafana) |
| **NodePort** | External via node IP | Development/testing access |
| **LoadBalancer** | External via cloud LB | Production Grafana access |
| **Headless** | Direct Pod DNS | StatefulSet services (Loki ingesters) |

### Essential kubectl Commands

As an Associate Observability Architect, you'll use kubectl daily to help customers troubleshoot issues.

#### Viewing Resources

```bash
# List all pods in monitoring namespace
kubectl get pods -n monitoring

# Get detailed pod information
kubectl describe pod grafana-abc123 -n monitoring

# View pod logs
kubectl logs grafana-abc123 -n monitoring

# Follow logs in real-time
kubectl logs -f grafana-abc123 -n monitoring

# View logs from previous container instance (after restart)
kubectl logs grafana-abc123 -n monitoring --previous

# View logs from specific container in multi-container pod
kubectl logs grafana-abc123 -n monitoring -c config-reloader
```

#### Debugging and Troubleshooting

```bash
# Execute command in running container
kubectl exec -it grafana-abc123 -n monitoring -- /bin/sh

# Check events for troubleshooting
kubectl get events -n monitoring --sort-by='.lastTimestamp'

# View resource usage
kubectl top pods -n monitoring
kubectl top nodes

# Check container resource requests/limits
kubectl describe pod grafana-abc123 -n monitoring | grep -A 5 "Requests\|Limits"

# Port forward for local access
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

#### Configuration Management

```bash
# View ConfigMap contents
kubectl get configmap grafana-config -n monitoring -o yaml

# Edit ConfigMap directly
kubectl edit configmap grafana-config -n monitoring

# Create ConfigMap from file
kubectl create configmap grafana-dashboards \
  --from-file=dashboard.json \
  -n monitoring

# View Secret (base64 encoded)
kubectl get secret grafana-secrets -n monitoring -o yaml

# Decode Secret value
kubectl get secret grafana-secrets -n monitoring \
  -o jsonpath='{.data.admin-password}' | base64 -d
```

### Common Kubernetes Issues in Observability Deployments

Understanding common issues helps you quickly diagnose customer problems.

#### Issue 1: Pod Not Starting

```
┌─────────────────────────────────────────────────────────────────┐
│                    POD NOT STARTING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Symptom: Pod stuck in Pending or CrashLoopBackOff              │
│                                                                  │
│  Common Causes:                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Insufficient resources (CPU/Memory)                   │    │
│  │    → Check: kubectl describe pod <name>                  │    │
│  │    → Look for: "Insufficient cpu" or "Insufficient memory"│   │
│  │                                                          │    │
│  │ 2. Image pull failure                                    │    │
│  │    → Check: Events section in describe output            │    │
│  │    → Look for: "ImagePullBackOff" or "ErrImagePull"     │    │
│  │                                                          │    │
│  │ 3. ConfigMap/Secret not found                           │    │
│  │    → Check: Volume mounts in describe output             │    │
│  │    → Look for: "configmap not found" errors             │    │
│  │                                                          │    │
│  │ 4. Node selector/affinity mismatch                      │    │
│  │    → Check: Node labels vs pod nodeSelector             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Issue 2: Service Not Accessible

**Troubleshooting Steps**:

1. **Verify Pod is running**: `kubectl get pods -n monitoring`
2. **Check Service selector matches Pod labels**: 
   ```bash
   kubectl get svc grafana -n monitoring -o yaml | grep -A 5 selector
   kubectl get pods -n monitoring --show-labels
   ```
3. **Test connectivity from within cluster**:
   ```bash
   kubectl run test-pod --rm -it --image=busybox -- wget -qO- http://grafana.monitoring:3000/api/health
   ```
4. **Check endpoints are populated**:
   ```bash
   kubectl get endpoints grafana -n monitoring
   ```

#### Issue 3: High Resource Usage

```bash
# Check current resource usage
kubectl top pods -n monitoring

# Compare with resource limits
kubectl get pods -n monitoring -o custom-columns=\
"NAME:.metadata.name,CPU_REQ:.spec.containers[*].resources.requests.cpu,\
CPU_LIM:.spec.containers[*].resources.limits.cpu,\
MEM_REQ:.spec.containers[*].resources.requests.memory,\
MEM_LIM:.spec.containers[*].resources.limits.memory"

# Check for OOMKilled events
kubectl describe pod <pod-name> -n monitoring | grep -i oom
```

---

## Observability Pillars

The three pillars of observability—metrics, logs, and traces—provide complementary views into system behavior. Understanding when and how to use each pillar is fundamental to the Associate Observability Architect role.

> **📚 Deep Dive**: For comprehensive observability coverage, see [Observability Principles](../../shared-concepts/observability-principles.md)

### Overview: The Three Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       THE THREE PILLARS OF OBSERVABILITY                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌─────────────┐                                    │
│                              │   System    │                                    │
│                              │  Behavior   │                                    │
│                              └──────┬──────┘                                    │
│                                     │                                           │
│              ┌──────────────────────┼──────────────────────┐                   │
│              │                      │                      │                   │
│              ▼                      ▼                      ▼                   │
│       ┌─────────────┐        ┌─────────────┐        ┌─────────────┐           │
│       │   METRICS   │        │    LOGS     │        │   TRACES    │           │
│       │             │        │             │        │             │           │
│       │  "What is   │        │  "What      │        │  "How does  │           │
│       │  happening?"│        │  happened?" │        │  it flow?"  │           │
│       └─────────────┘        └─────────────┘        └─────────────┘           │
│                                                                                  │
│       Best for:              Best for:              Best for:                   │
│       • Alerting             • Debugging            • Request flow              │
│       • Trends               • Audit trails         • Latency analysis          │
│       • Capacity             • Error details        • Dependencies              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Metrics

Metrics are numeric measurements collected at regular intervals. They're efficient for storage and ideal for alerting and trend analysis.

#### Metric Types

| Type | Description | Example | When to Use |
|------|-------------|---------|-------------|
| **Counter** | Monotonically increasing value | `http_requests_total` | Counting events (requests, errors) |
| **Gauge** | Value that can go up or down | `temperature_celsius` | Current state (CPU usage, queue depth) |
| **Histogram** | Distribution of values | `request_duration_seconds` | Latency percentiles |
| **Summary** | Pre-calculated quantiles | `request_duration_quantile` | Client-side percentiles |

#### Metric Anatomy

```
http_requests_total{method="GET", status="200", service="api"} 1234567
├──────────────────┤├─────────────────────────────────────────┤├──────┤
       │                              │                           │
  Metric Name                     Labels                       Value
```

**Components**:
- **Metric Name**: Describes what is being measured (convention: `<namespace>_<name>_<unit>`)
- **Labels**: Key-value pairs for filtering and grouping
- **Value**: The numeric measurement at a point in time

#### Practical Example: Monitoring Grafana

```yaml
# Prometheus scrape config for Grafana metrics
scrape_configs:
  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana:3000']
    metrics_path: /metrics
```

**Key Grafana Metrics to Monitor**:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `grafana_http_request_duration_seconds` | Request latency | p99 > 2s |
| `grafana_alerting_active_alerts` | Active alert count | Sudden spike |
| `grafana_datasource_request_total` | Datasource queries | Error rate > 5% |
| `grafana_api_login_post_total` | Login attempts | Failed logins spike |

### Pillar 2: Logs

Logs are timestamped, immutable records of discrete events. They provide detailed context about what happened in a system.

#### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| **DEBUG** | Diagnostic information | Variable values, state changes |
| **INFO** | Normal operations | Request processed, job completed |
| **WARN** | Potential issues | Retry attempted, deprecated API used |
| **ERROR** | Failures requiring attention | Request failed, exception caught |
| **FATAL** | Critical failures | Application crash, data corruption |

#### Structured vs Unstructured Logs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    UNSTRUCTURED vs STRUCTURED LOGS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  UNSTRUCTURED (Avoid):                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 2024-01-15 10:23:45 ERROR Failed to process order 12345 for user john   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Problems: Hard to parse, inconsistent format, difficult to query              │
│                                                                                  │
│  STRUCTURED (Preferred):                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ {                                                                        │   │
│  │   "timestamp": "2024-01-15T10:23:45.123Z",                              │   │
│  │   "level": "error",                                                      │   │
│  │   "message": "Failed to process order",                                  │   │
│  │   "order_id": "12345",                                                   │   │
│  │   "user_id": "john",                                                     │   │
│  │   "trace_id": "abc123def456"                                            │   │
│  │ }                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Benefits: Machine-parseable, queryable, correlatable with traces              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Practical Example: Querying Logs in Loki

```logql
# Find all error logs from Grafana
{app="grafana"} |= "error"

# Find logs with specific user
{app="grafana"} | json | user_id="john"

# Count errors by level in last hour
sum by (level) (count_over_time({app="grafana"} | json [1h]))

# Find slow queries (> 5 seconds)
{app="grafana"} | json | duration > 5s
```

### Pillar 3: Traces

Traces track the journey of a request through a distributed system, showing the causal relationship between services.

#### Trace Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRACE ANATOMY                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Trace ID: abc123 (identifies the entire request journey)                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ Span: HTTP GET /api/dashboard (Root Span)                       │    │   │
│  │  │ Service: grafana                                                │    │   │
│  │  │ Duration: 250ms                                                 │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │       │                                                                  │   │
│  │       ├──────────────────────────────────────┐                          │   │
│  │       │                                      │                          │   │
│  │       ▼                                      ▼                          │   │
│  │  ┌─────────────────────┐            ┌─────────────────────┐            │   │
│  │  │ Span: Auth Check    │            │ Span: Query Data    │            │   │
│  │  │ Service: grafana    │            │ Service: prometheus │            │   │
│  │  │ Duration: 20ms      │            │ Duration: 200ms     │            │   │
│  │  └─────────────────────┘            └─────────────────────┘            │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Trace Concepts**:

| Concept | Description |
|---------|-------------|
| **Trace** | Complete request journey, identified by Trace ID |
| **Span** | Single unit of work within a trace |
| **Parent Span** | The span that initiated the current span |
| **Attributes** | Key-value metadata attached to spans |
| **Events** | Timestamped annotations within a span |

#### Practical Example: Querying Traces in Tempo

```traceql
# Find traces from Grafana service
{ resource.service.name = "grafana" }

# Find slow traces (> 1 second)
{ duration > 1s }

# Find traces with errors
{ status = error }

# Find traces for specific endpoint
{ span.http.url = "/api/dashboards" }
```

### Relationships Between Pillars

The true power of observability comes from correlating data across all three pillars.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PILLAR CORRELATION WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. ALERT FIRES (Metrics)                                                       │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Alert: "High error rate on Grafana"                                 │    │
│     │ Metric: http_requests_total{status="500"} > threshold               │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  2. EXAMINE METRICS                                                             │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Dashboard shows spike in 500 errors starting at 14:32               │    │
│     │ Click on exemplar to see a specific failing request                 │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  3. FOLLOW TRACE                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Trace shows: grafana → prometheus (ERROR)                           │    │
│     │ Prometheus query span shows timeout after 30s                       │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                          │                                      │
│                                          ▼                                      │
│  4. EXAMINE LOGS                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Filter logs by trace_id from the failing trace                      │    │
│     │ Log: "Query timeout: prometheus server not responding"              │    │
│     │ Root cause: Prometheus overloaded due to expensive query            │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Choosing the Right Signal

| Scenario | Primary Signal | Why |
|----------|---------------|-----|
| "Is the system healthy?" | Metrics | Quick yes/no answer, efficient alerting |
| "Why is latency high?" | Traces | Shows where time is spent |
| "What caused this error?" | Logs | Detailed error messages and stack traces |
| "Which service is slow?" | Traces | Visualizes service dependencies |
| "What's the error rate trend?" | Metrics | Time-series analysis |
| "What happened at 3pm?" | Logs | Event-level detail |

---

## Technical Support Foundations

As an Associate Observability Architect, you'll spend significant time supporting customers. This section covers the foundational skills for effective technical support.

### Ticket Triage and Prioritization

Effective triage ensures critical issues get immediate attention while managing customer expectations.

#### Priority Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRIORITY MATRIX                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              IMPACT                                              │
│                    Low              Medium            High                       │
│              ┌─────────────┬─────────────────┬─────────────────┐                │
│         High │     P3      │       P2        │       P1        │                │
│              │  Schedule   │   Same day      │   Immediate     │                │
│    U         ├─────────────┼─────────────────┼─────────────────┤                │
│    R    Med  │     P4      │       P3        │       P2        │                │
│    G         │  Backlog    │   Schedule      │   Same day      │                │
│    E         ├─────────────┼─────────────────┼─────────────────┤                │
│    N    Low  │     P5      │       P4        │       P3        │                │
│    C         │  As time    │   Backlog       │   Schedule      │                │
│    Y         │  permits    │                 │                 │                │
│              └─────────────┴─────────────────┴─────────────────┘                │
│                                                                                  │
│  P1: Production down, data loss risk                                            │
│  P2: Major feature broken, workaround exists                                    │
│  P3: Feature degraded, business impact                                          │
│  P4: Minor issue, low business impact                                           │
│  P5: Enhancement request, cosmetic issues                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Triage Checklist

When a new ticket arrives, gather this information:

1. **Environment Details**
   - Grafana version
   - Deployment type (Kubernetes, Docker, bare metal)
   - Cloud provider (if applicable)
   - Related component versions (Prometheus, Loki, etc.)

2. **Problem Description**
   - What is the expected behavior?
   - What is the actual behavior?
   - When did the issue start?
   - What changed recently?

3. **Impact Assessment**
   - How many users affected?
   - Is there a workaround?
   - What's the business impact?

4. **Reproduction Steps**
   - Can the issue be reproduced?
   - What are the exact steps?
   - Is it intermittent or consistent?

### Effective Customer Communication

Clear communication builds trust and helps resolve issues faster.

#### Communication Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Acknowledge quickly** | Respond within SLA, even if just to confirm receipt | "Thank you for reporting this. I'm investigating now." |
| **Set expectations** | Be clear about timelines and next steps | "I'll have an update for you within 2 hours." |
| **Explain simply** | Avoid jargon when possible | "The database connection pool is full" vs "Connection exhaustion" |
| **Be proactive** | Update before being asked | "Still investigating, found a potential lead..." |
| **Document everything** | Keep detailed notes for handoffs | Internal notes with timestamps and findings |

#### Response Templates

**Initial Response**:
```
Hi [Customer],

Thank you for reaching out. I understand you're experiencing [brief problem summary].

I'm currently investigating this issue. To help me diagnose the problem faster, 
could you please provide:
1. [Specific information needed]
2. [Logs or screenshots if applicable]

I'll update you within [timeframe] with my findings.

Best regards,
[Your name]
```

**Status Update**:
```
Hi [Customer],

Quick update on your issue:

**What I've found so far:**
- [Finding 1]
- [Finding 2]

**Next steps:**
- [Action 1]
- [Action 2]

**Expected timeline:** [When you'll have more information]

Please let me know if you have any questions.

Best regards,
[Your name]
```

**Resolution**:
```
Hi [Customer],

Great news! I've identified and resolved the issue.

**Root Cause:**
[Brief explanation of what caused the problem]

**Solution:**
[What was done to fix it]

**Prevention:**
[Recommendations to prevent recurrence]

Please confirm the issue is resolved on your end. I'll keep this ticket open 
for 48 hours in case you have any follow-up questions.

Best regards,
[Your name]
```

### Escalation Procedures

Knowing when and how to escalate is crucial for effective support.

#### When to Escalate

| Situation | Action |
|-----------|--------|
| Issue beyond your expertise | Escalate to senior engineer |
| Customer dissatisfied with progress | Escalate to manager |
| Security vulnerability discovered | Immediate escalation to security team |
| Data loss or corruption | Immediate escalation to engineering |
| SLA breach imminent | Escalate to manager for resource allocation |

#### Escalation Best Practices

1. **Document thoroughly before escalating**
   - What you've tried
   - What you've ruled out
   - Current hypothesis
   - All relevant logs and data

2. **Provide context**
   - Customer impact and urgency
   - Business context
   - Timeline of events

3. **Stay involved**
   - Don't "throw over the wall"
   - Remain the customer's point of contact
   - Learn from the resolution

### Knowledge Base Utilization

Effective use of documentation accelerates problem resolution.

#### Finding Information

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE SEARCH STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Start with error messages                                                   │
│     └─► Search exact error text in quotes                                       │
│                                                                                  │
│  2. Search by component + symptom                                               │
│     └─► "Grafana dashboard slow loading"                                        │
│                                                                                  │
│  3. Check release notes                                                         │
│     └─► Recent version changes may explain new behavior                         │
│                                                                                  │
│  4. Review similar tickets                                                      │
│     └─► Past resolutions often apply to current issues                          │
│                                                                                  │
│  5. Check community forums                                                      │
│     └─► Others may have encountered the same issue                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Documentation Sources

| Source | Best For |
|--------|----------|
| [Grafana Docs](https://grafana.com/docs/) | Official configuration and features |
| [GitHub Issues](https://github.com/grafana/grafana/issues) | Known bugs and workarounds |
| [Community Forums](https://community.grafana.com/) | User experiences and solutions |
| Internal KB | Company-specific procedures and past resolutions |
| Release Notes | Version-specific changes and migrations |

### Setting Customer Expectations

Managing expectations prevents frustration and builds trust.

#### Expectation Management Framework

| Phase | What to Communicate |
|-------|---------------------|
| **Initial Contact** | Acknowledgment, initial assessment, timeline for update |
| **Investigation** | What you're checking, preliminary findings, revised timeline if needed |
| **Resolution** | Root cause, fix applied, prevention recommendations |
| **Follow-up** | Verification request, ticket closure timeline |

#### Common Pitfalls to Avoid

1. **Over-promising timelines**
   - Bad: "I'll have this fixed in an hour"
   - Good: "I'll investigate and update you within 2 hours"

2. **Making assumptions**
   - Bad: "This is definitely a configuration issue"
   - Good: "Based on the symptoms, I suspect a configuration issue. Let me verify."

3. **Going silent**
   - Bad: No updates for hours
   - Good: Regular updates even if just "still investigating"

4. **Technical jargon overload**
   - Bad: "The ingester's WAL is corrupted causing chunk flush failures"
   - Good: "There's a data storage issue that's preventing logs from being saved properly"

---

## Practical Examples

This section provides hands-on scenarios you might encounter as an Associate Observability Architect.

### Example 1: Customer Reports Grafana Dashboard Loading Slowly

**Scenario**: A customer reports their Grafana dashboards take 30+ seconds to load.

**Investigation Steps**:

```bash
# 1. Check Grafana pod health
kubectl get pods -n monitoring -l app=grafana
kubectl describe pod grafana-xxx -n monitoring

# 2. Check resource usage
kubectl top pods -n monitoring -l app=grafana

# 3. Check Grafana logs for slow queries
kubectl logs -n monitoring -l app=grafana | grep -i "slow\|timeout\|error"

# 4. Check datasource connectivity
kubectl exec -it grafana-xxx -n monitoring -- \
  wget -qO- http://prometheus:9090/-/healthy
```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution |
|-------|----------|----------|
| Expensive queries | Slow specific panels | Optimize PromQL, add recording rules |
| Resource constraints | High CPU/memory | Increase resource limits |
| Network issues | Timeouts to datasources | Check network policies, DNS |
| Too many panels | All dashboards slow | Split dashboards, reduce refresh rate |

### Example 2: Setting Up Basic Observability for a New Customer

**Scenario**: A customer wants to set up basic observability for their Kubernetes application.

**Recommended Stack**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BASIC OBSERVABILITY STACK                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GRAFANA                                          │   │
│  │                    (Unified Dashboard)                                   │   │
│  └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                  │                                              │
│         ┌────────────────────────┼────────────────────────────┐                │
│         │                        │                            │                │
│         ▼                        ▼                            ▼                │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐            │
│  │ Prometheus  │          │    Loki     │          │   Tempo     │            │
│  │  (Metrics)  │          │   (Logs)    │          │  (Traces)   │            │
│  └──────┬──────┘          └──────┬──────┘          └──────┬──────┘            │
│         │                        │                        │                    │
│         │                        │                        │                    │
│  ┌──────┴──────┐          ┌──────┴──────┐          ┌──────┴──────┐            │
│  │  Scrape     │          │  Promtail/  │          │   OTLP      │            │
│  │  Targets    │          │  Alloy      │          │  Collector  │            │
│  └─────────────┘          └─────────────┘          └─────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Checklist**:

1. **Metrics Setup**
   - [ ] Deploy Prometheus or Mimir
   - [ ] Configure service discovery for Kubernetes
   - [ ] Set up basic alerting rules
   - [ ] Create Grafana datasource

2. **Logs Setup**
   - [ ] Deploy Loki
   - [ ] Deploy Promtail/Alloy as DaemonSet
   - [ ] Configure log labels (namespace, pod, container)
   - [ ] Create Grafana datasource

3. **Traces Setup** (Optional for basic setup)
   - [ ] Deploy Tempo
   - [ ] Configure application instrumentation
   - [ ] Create Grafana datasource

4. **Dashboards**
   - [ ] Import Kubernetes cluster dashboard
   - [ ] Import application-specific dashboards
   - [ ] Set up basic alerting

### Example 3: Troubleshooting "No Data" in Grafana Panel

**Scenario**: Customer reports a Grafana panel shows "No data".

**Systematic Troubleshooting**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    "NO DATA" TROUBLESHOOTING FLOWCHART                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Panel shows "No data"                                                          │
│         │                                                                        │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Check time range - Is it set correctly?                              │   │
│  │    → Try "Last 1 hour" or "Last 24 hours"                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │ Still no data                                                         │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 2. Check datasource - Is it configured and healthy?                     │   │
│  │    → Go to Configuration > Data Sources > Test                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │ Datasource OK                                                         │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 3. Check query - Does the metric/log stream exist?                      │   │
│  │    → Use Explore to test query directly                                │   │
│  │    → Check for typos in metric names or labels                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│         │ Query looks correct                                                   │
│         ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 4. Check data source - Is data being collected?                         │   │
│  │    → Verify scrape targets (Prometheus)                                │   │
│  │    → Verify log collection (Loki)                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Example 4: Explaining Observability to a Non-Technical Stakeholder

**Scenario**: A customer's manager asks "Why do we need all three pillars? Can't we just use logs?"

**Explanation Approach**:

> "Think of observability like diagnosing a car problem:
> 
> **Metrics** are like your dashboard gauges - they tell you at a glance if something's wrong (engine temperature high, fuel low). They're great for alerting you to problems quickly.
> 
> **Logs** are like the mechanic's diagnostic report - detailed information about what happened. When the check engine light comes on, logs tell you exactly what error occurred.
> 
> **Traces** are like following the path of fuel through your engine - they show you how a request flows through your system and where it gets stuck. This is crucial when you have many interconnected services.
> 
> Each serves a different purpose:
> - Metrics tell you **something is wrong**
> - Traces tell you **where it's wrong**
> - Logs tell you **why it's wrong**
> 
> Using all three together lets you find and fix problems much faster than using just one."

---

## Key Takeaways

### Kubernetes Essentials

1. **Pods are the basic unit** - Understand Pod lifecycle and common failure states
2. **Services provide stable networking** - Know the different Service types and when to use each
3. **kubectl is your primary tool** - Master the essential commands for viewing, debugging, and managing resources
4. **Resource management matters** - Understand requests, limits, and how they affect scheduling

### Observability Pillars

1. **Metrics for alerting and trends** - Efficient, aggregated, time-series data
2. **Logs for detailed debugging** - Event-level detail with context
3. **Traces for request flow** - Understand distributed system behavior
4. **Correlation is key** - Use trace IDs to connect all three pillars

### Technical Support

1. **Triage effectively** - Prioritize based on impact and urgency
2. **Communicate clearly** - Set expectations and provide regular updates
3. **Document everything** - Enable smooth handoffs and future reference
4. **Know when to escalate** - Don't struggle alone when help is available

---

## Next Steps

Now that you've completed the fundamentals, continue your learning journey:

1. **[Intermediate](./intermediate.md)** - Troubleshooting methodologies, RCA techniques, customer onboarding
2. **[Advanced](./advanced.md)** - Complex deployments, documentation best practices, enablement strategies
3. **[Questions](./questions/)** - Practice with 15 technical interview questions

### Recommended Practice

- Set up a local Kubernetes cluster (minikube or kind)
- Deploy the Grafana stack and practice troubleshooting
- Create sample dashboards and alerts
- Practice explaining concepts to non-technical friends or colleagues

---

## References

### Shared Concepts

- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md)
- [LGTM Stack](../../shared-concepts/lgtm-stack.md)
- [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)
- [Observability Principles](../../shared-concepts/observability-principles.md)

### External Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Tempo Documentation](https://grafana.com/docs/tempo/latest/)
