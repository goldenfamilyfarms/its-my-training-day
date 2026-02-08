# Master Study Plan (Grafana Roles) — 3 hours/day

## Who this is for
You have technical interviews in ~2 weeks for **all four Grafana roles**:
- Staff Backend Engineer — Loki Ingest
- Senior Software Engineer — OSS Big Tent
- Associate Observability Architect
- Observability Architect (Senior)

This plan tells you **exactly how to spend each hour**, with **objectives** and an **artifact** to produce daily.

## How to use this plan (rules)
- **3 hours/day** means **3 focused 60-minute blocks**.
- **Always produce something**: notes, a diagram, a runbook, or recorded answers.
- **Speak answers out loud** (record if possible). Reading ≠ interview readiness.
- If you fall behind: do the day’s **Hour 1 + Hour 2**; keep Hour 3 as “minimum viable practice”.

## Daily output templates (copy/paste)

### 10-bullet summary template (from reading)
- What this topic is (1–2 lines)
- When to use it / not use it
- Key terms (3–5)
- Happy-path flow (3 steps)
- 3 trade-offs
- 3 failure modes + mitigations
- 3 metrics/SLIs to watch

### 90-second answer template (for Q&A)
- Context + goal (1 sentence)
- Approach (3 bullets)
- Trade-off you’re choosing (1 bullet)
- Failure mode + mitigation (1 bullet)
- “How I’d validate in prod” (1 bullet: metrics/logs/traces)

### Diagram template (every day)
Include:
- components
- one happy-path flow
- one failure path
- where telemetry (metrics/logs/traces) is emitted

## Directory map (what each folder is for)
- **Role prep (primary)**: `grafana/`
  - Shared foundations: `grafana/shared-concepts/`
  - Role tracks: `grafana/study-guides/01-...` through `04-...`
  - Hands-on: `grafana/code-implementations/`
- **System design depth**: `fundamentals/`, `devops/`, `observability/`, `solutions-architecture/`
- **Interview structure**: `interview-frameworks/`
- **Timed practice**: `_practice/`

---

## 14-day plan (3 hours/day)

### Day 1 — Observability fundamentals (the “debug loop”)
**Hour 1 (Read + objectives)**
- Read: `grafana/shared-concepts/observability-principles.md`
- Objective: clearly explain **monitoring vs observability** and the **metrics→traces→logs** loop.

**Hour 2 (Reinforce + objectives)**
- Read: `observability/study-guides/01-three-pillars-of-observability.md`
- Objective: list what each pillar is best at, and how to correlate with `trace_id` / `request_id`.

**Hour 3 (Artifact)**
- Produce: a 1-page “Incident Triage Loop” runbook using the diagram template.

---

### Day 2 — Kubernetes operations (how things actually fail)
**Hour 1**
- Read: `grafana/shared-concepts/kubernetes-fundamentals.md`
- Objective: be able to explain **Pods/Deployments/Services/Ingress**, probes, and requests/limits.

**Hour 2**
- Read: `devops/study-guides/03-container-orchestration.md`
- Objective: explain rollouts and the most common production failure states.

**Hour 3 (Artifact)**
- Produce: “First 10 minutes debugging CrashLoopBackOff” checklist (steps + what evidence proves/disproves).

---

### Day 3 — Grafana + LGTM stack (how telemetry systems fit)
**Hour 1**
- Read: `grafana/shared-concepts/grafana-ecosystem.md`
- Objective: explain Grafana’s role: datasource → query → frames → panels/alerts.

**Hour 2**
- Read: `grafana/shared-concepts/lgtm-stack.md`
- Objective: explain Loki vs Tempo vs Mimir vs Pyroscope at a high level.

**Hour 3 (Artifact)**
- Produce: 1 diagram of “service emits telemetry → collector → storage → Grafana dashboard/alerts”.

---

### Day 4 — Staff Backend + Associate OA (start both tracks)
**Hour 1 (Staff Backend)**
- Read: `grafana/study-guides/01-staff-backend-engineer-loki/junior-study-material.md`
- Objective: capture the “staff expectations” narrative: ownership, scale, reliability.

**Hour 2 (Associate OA)**
- Read: `grafana/study-guides/03-associate-observability-architect/junior-study-material.md`
- Objective: define your customer-facing workflow: discovery → onboarding → health checks → RCA.

**Hour 3 (Artifact)**
- Produce: “Customer discovery script”: 10 questions you ask + what each answer changes in the design.

---

### Day 5 — Senior OSS + Observability Architect (start both tracks)
**Hour 1 (Senior OSS Big Tent)**
- Read: `grafana/study-guides/02-senior-software-engineer-oss/junior-study-material.md`
- Objective: understand plugin ownership expectations + cloud ops + escalations.

**Hour 2 (Observability Architect Senior)**
- Read: `grafana/study-guides/04-observability-architect-senior/junior-study-material.md`
- Objective: translate tech → roadmap/value: adoption, ROI, lifecycle.

**Hour 3 (Artifact)**
- Produce: 1-page “Enterprise onboarding roadmap” (week 0–4) with success metrics and risks.

---

### Day 6 — Go/distributed systems + SLOs
**Hour 1 (Hands-on Go)**
- Read: `grafana/code-implementations/go-distributed-systems/concurrency.go`
- Objective: explain one concurrency pattern and where it breaks (races, leaks, backpressure).

**Hour 2 (SLO foundations)**
- Read: `observability/study-guides/06-slis-slos-and-slas.md`
- Objective: be able to define SLI/SLO/SLA, error budgets, and why teams page on burn rate.

**Hour 3 (Artifact)**
- Produce: 2 SLOs for a “checkout” service + a burn-rate alert intent statement for each.

---

### Day 7 — Plugins mental model + Alerting strategy
**Hour 1 (Hands-on plugins)**
- Read: `grafana/code-implementations/grafana-plugins/sample-datasource/README.md`
- Objective: describe plugin lifecycle (config/query) and how you debug datasource issues.

**Hour 2 (Alerting)**
- Read: `observability/study-guides/05-alerting-strategy.md`
- Objective: distinguish symptom vs cause alerts; know what belongs in paging.

**Hour 3 (Artifact)**
- Produce: “Paging vs tickets” table for a service + one runbook stub (“5xx rate high”).

---

### Day 8 — CI/CD and GitOps + Multi-region
**Hour 1**
- Read: `devops/study-guides/01-ci-cd-pipeline-design.md`
- Objective: explain build-once/promote-many, gates, verification, rollback.

**Hour 2**
- Read: `solutions-architecture/study-guides/02-multi-region-architecture.md`
- Objective: active-passive vs active-active; DNS/GSLB; state is the hard part.

**Hour 3 (Artifact)**
- Produce: a failover runbook skeleton: detect → route traffic → promote DB → verify key journeys.

---

### Day 9 — Reliability patterns + Disaster recovery (RTO/RPO)
**Hour 1**
- Read: `devops/study-guides/08-reliability-engineering.md`
- Objective: timeouts/retries/breakers/bulkheads/backpressure story (clean and repeatable).

**Hour 2**
- Read: `solutions-architecture/study-guides/03-disaster-recovery-strategies.md`
- Objective: explain DR tiers and select one based on RTO/RPO.

**Hour 3 (Artifact)**
- Produce: pick RTO/RPO for a hypothetical SaaS and defend in a 90-second answer outline.

---

### Day 10 — Role Q&A drill day (breadth)
**Hour 1 (Staff Backend Q&A)**
- Use: `grafana/study-guides/01-staff-backend-engineer-loki/questions/questions-and-answers.md`
- Objective: answer 3 questions out loud; refine each into the 90-second template.

**Hour 2 (Senior OSS Q&A)**
- Use: `grafana/study-guides/02-senior-software-engineer-oss/questions/questions-and-answers.md`
- Objective: same (3 questions).

**Hour 3 (Architect Q&A)**
- Use: `grafana/study-guides/03-associate-observability-architect/questions/questions-and-answers.md` OR `04-observability-architect-senior/questions/questions-and-answers.md`
- Objective: answer 3 questions; emphasize communication and trade-offs.

Artifact: save your 9 outlines (bullet form) in one place.

---

### Day 11 — System design framework reps (RESHADED)
**Hour 1**
- Read: `interview-frameworks/README.md`
- Objective: memorize the flow and the time allocation for a 45-minute interview.

**Hour 2 (Timed rep)**
- Do: `_practice/url-shortener-problem.md` (45 minutes design + 15 minutes review)
- Objective: produce a coherent design with trade-offs + failure modes.

**Hour 3 (Artifact)**
- Produce: a 1-page RESHADED cheat sheet in your own words + your URL shortener diagram.

---

### Day 12 — Security architecture + cost controls (architect credibility)
**Hour 1**
- Read: `solutions-architecture/study-guides/05-security-architecture.md`
- Objective: least privilege, identity-first, auditability, supply chain basics.

**Hour 2**
- Read: `observability/study-guides/08-cost-effective-observability.md`
- Objective: cost drivers (volume/cardinality/retention) + guardrails.

**Hour 3 (Artifact)**
- Produce: threat model table (5 threats) + cost guardrails list (sampling/retention/quotas).

---

### Day 13 — Mock interviews (2 roles)
**Hour 1 (Mock #1 prep + run)**
- 10m prep: pick 5 Qs from `01-staff-backend-engineer-loki/questions/questions-and-answers.md`
- 50m: mock interview (speak only; no reading)
- Objective: stay structured; always mention trade-offs and failure modes.

**Hour 2 (Review)**
- Rewrite the 5 answers using the 90-second template.
- Objective: remove rambling; add one measurable validation step per answer.

**Hour 3 (Mock #2)**
- 60m: Associate OA mock using `03-associate-observability-architect/questions/questions-and-answers.md` (5 Qs).

---

### Day 14 — Mock interviews (2 roles)
**Hour 1 (Mock #3)**
- 60m: Senior OSS mock using `02-senior-software-engineer-oss/questions/questions-and-answers.md` (5 Qs).

**Hour 2 (Mock #4)**
- 60m: Observability Architect (Senior) mock using `04-observability-architect-senior/questions/questions-and-answers.md` (5 Qs).

**Hour 3 (Final polish)**
- Pick your weakest 6 answers (across all roles) and rewrite as crisp bullet outlines.
- Objective: “tight + confident” delivery for the last 48 hours before interviews.

---

## 30-day extension plan (if interviews are pushed back)
Use the same 3-hour structure. The goal is to turn “knowledge” into **automatic performance**.

### Days 15–21 (Week 3) — Architecture depth + reliability drills
Rotate these topics (repeat until Day 21):
- **Day 15**: `solutions-architecture/study-guides/04-cost-optimization.md` + produce unit-economics KPI list
- **Day 16**: `solutions-architecture/study-guides/06-serverless-patterns.md` + design async workflow + DLQ runbook
- **Day 17**: `solutions-architecture/study-guides/07-data-architecture.md` + pipeline lag runbook + data quality SLIs
- **Day 18**: `observability/study-guides/04-log-aggregation-patterns.md` + log schema + retention/index plan
- **Day 19**: `observability/study-guides/03-distributed-tracing.md` + “trace breaks” troubleshooting checklist
- **Day 20**: `fundamentals/cap-theorem-study-guide.md` + write 3 CAP trade-off stories (banking vs feed vs telemetry)
- **Day 21**: full system design rep (choose `_practice/` + add SLOs + incident playbook)

Hour-by-hour for each day (Days 15–21):
- **Hour 1**: read the day’s primary guide + 10-bullet summary
- **Hour 2**: answer 3 relevant role questions out loud (pick the role most aligned with the topic)
- **Hour 3**: produce the day’s artifact (diagram/runbook/queries)

### Days 22–30 (Week 4) — Heavy mock-interview cycle (performance mode)
Each day:
- **Hour 1**: 30m rapid-fire Q&A (5 questions, timed) + 30m rewrite
- **Hour 2**: 1 timed system design rep using RESHADED (45m) + 15m critique
- **Hour 3**: hands-on rotation (pick one):
  - `grafana/code-implementations/go-distributed-systems/`
  - `grafana/code-implementations/grafana-plugins/`
  - `grafana/code-implementations/kubernetes-configs/`
  - `grafana/code-implementations/observability-patterns/`

Suggested focus rotation (Days 22–30):
- D22: Staff Backend
- D23: Associate OA
- D24: Senior OSS
- D25: Observability Architect Senior
- D26: Staff Backend
- D27: Associate OA
- D28: Senior OSS
- D29: Observability Architect Senior
- D30: Mixed panel (10 hardest Qs across roles)

---

## “Am I ready?” checklist (quick)
- [ ] I can explain LGTM telemetry flows and multi-tenancy clearly (no notes)
- [ ] I can tell the timeouts/retries/idempotency/backpressure story in <90s
- [ ] I can define 2–3 SLOs for any service and propose burn-rate pages
- [ ] I can run a structured incident response narrative (roles + first 10 minutes)
- [ ] I can do a 45-minute system design using RESHADED without getting lost

