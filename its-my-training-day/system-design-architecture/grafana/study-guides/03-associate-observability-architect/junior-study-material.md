# Junior Study Material: Associate Observability Architect (Troubleshooting + Enablement)

This companion is for junior engineers learning the **customer-facing** side of observability: troubleshooting, onboarding, and creating documentation/runbooks that make teams successful.

Your north star is not “knowing every config option.” It’s **reducing time-to-understand and time-to-fix**.

## How this maps to “Topics Covered”

- **Kubernetes**: most real issues are operational (pods, networking, storage, upgrades).
- **Observability**: use metrics/logs/traces to scope and confirm, not guess.
- **Grafana Ecosystem**: understand how data sources, dashboards, and alerting connect.
- **Architecture**: learn to reason about blast radius, failure modes, and trade-offs.
- **(Optional) Go Programming**: helpful for reading logs, metrics endpoints, and understanding exporters/agents.

## Learning outcomes (junior expectations)

By the end you should be able to:

- Run a **repeatable troubleshooting process** that produces evidence and a clear narrative.
- Write a **blameless RCA** with actionable prevention steps.
- Onboard a team to Grafana/LGTM with a checklist and success criteria.
- Produce **runbooks** that reduce MTTR for common incidents.

## Your core workflow (memorize this)

### 1) Triage

- What’s the **impact** (users, revenue, critical paths)?
- What’s the **urgency** (active outage vs degradation)?
- Is there a **workaround**?
- What is the **scope** (one user? one cluster? one region? all)?

### 2) Scope with metrics

Answer:
- Is the system unhealthy right now?
- When did it change?
- What services are affected?

Common “first” PromQL patterns:

```promql
# traffic
sum(rate(http_requests_total[5m])) by (service)

# error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
/
sum(rate(http_requests_total[5m])) by (service)

# latency p95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))
```

### 3) Narrow with traces (if available)

Answer:
- where is time spent?
- which dependency is slow/failing?
- is this a fan-out problem or a single choke point?

### 4) Confirm with logs

Answer:
- what exactly failed?
- which inputs triggered it?
- what changed (deployments/config)?

Common LogQL patterns:

```logql
# errors for a service
{service="api"} | json | level="error"

# count errors over time
sum by (error_type) (count_over_time({service="api"} | json | level="error" [5m]))
```

### 5) Fix + prevent

- Apply a safe change (rollback, config fix, scale, rate limit).
- Verify with metrics that the symptom is gone.
- Add prevention: alert, dashboard panel, limit, runbook step, or CI validation.

## 3-week plan (junior pace)

### Week 1 — Kubernetes troubleshooting fundamentals

Read:
- `./fundamentals.md` Kubernetes sections
- `../../shared-concepts/kubernetes-fundamentals.md` troubleshooting patterns

Learn these “failure signatures”:

- **CrashLoopBackOff**: app crashes repeatedly (config, dependencies, runtime error).
- **ImagePullBackOff**: image tag/registry auth problem.
- **Pending**: scheduler can’t place the pod (resources, node selectors, PVC).
- **OOMKilled**: memory limit too low or memory leak.
- **Readiness failing**: app isn’t ready, but may still be alive (dependency down).

Hands-on drill:

- Pick any workload (Grafana/Prometheus/Loki) and write a 10-step “first response” runbook that includes:
  - `kubectl get pods`
  - `kubectl describe pod`
  - `kubectl logs`
  - check service endpoints
  - check events

### Week 2 — RCA and communication (your superpower)

Read:
- `./intermediate.md` RCA techniques

RCA is not “why the server crashed.” It’s “why our system allowed this to become customer pain.”

Minimum RCA sections:

- **What happened** (timeline)
- **Impact**
- **Root cause** (the underlying cause you can fix)
- **Contributing factors**
- **Detection** (why wasn’t it detected sooner?)
- **Resolution**
- **Action items** (owners + deadlines)

Communication rules:

- lead with impact + current status
- share what you know vs what you suspect
- set the next update time
- keep a running timeline

Hands-on drill:

- Write a sample status update for:
  - “Dashboards are slow”
  - “No data in panels”
  - “Alerts stopped firing”

### Week 3 — Onboarding + enablement

Read:
- `./advanced.md` enablement + documentation sections (skim)

Your goal is to make customers/users independent:

- standard dashboards
- alert policies
- runbooks
- naming/labeling conventions

Hands-on deliverable:

- Create an onboarding checklist that includes:
  - required data sources
  - authentication (SSO/RBAC)
  - baseline dashboards
  - alert routing
  - success metrics (e.g., “MTTR reduced by X%”, “dashboard load time < Y sec”)

## Practical “golden” runbooks to write (copy, then improve)

Write these as short, testable runbooks:

1. **“No data” in Grafana panel**
2. **Dashboards slow**
3. **Prometheus targets down**
4. **Loki ingestion stopped**
5. **Alerting not firing / routing wrong**

Each runbook should include:

- purpose + when to use
- prerequisites (access, tools)
- step-by-step commands
- expected outputs
- how to escalate

## Common mistakes juniors make (avoid these)

- **Skipping problem definition**: always write “expected vs actual”.
- **Jumping to logs first**: use metrics to scope; logs for detail.
- **Trying random fixes**: test hypotheses with evidence.
- **Over-communicating technical detail to non-technical stakeholders**: use summaries and analogies.
- **Forgetting prevention**: every incident should produce at least one prevention improvement.

## Next steps

- Keep practicing scenarios in:
  - `./fundamentals.md`, `./intermediate.md`, `./advanced.md`
- Use the question bank to rehearse explanations:
  - `./questions/questions-and-answers.md`
