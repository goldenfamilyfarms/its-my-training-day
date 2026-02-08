# Grafana Study Guides (Junior Engineer Curriculum)

This directory contains **role-based** study guides, but this index reframes them into a **junior engineer learning path**. Use it as your “map” so you build fundamentals first, then specialize.

## Topics Covered (from the repo “Topics Covered” section)

These study guides collectively train you across:

| Area | What you should be able to do by the end |
|------|------------------------------------------|
| **Go Programming** | Read Go code confidently, understand concurrency patterns, write tests, and reason about performance trade-offs |
| **Grafana Ecosystem** | Explain how Grafana + data sources + plugins fit together; understand the LGTM stack at a high level |
| **Kubernetes** | Deploy services, troubleshoot pods/networking, and understand production patterns (scaling, HA, upgrades) |
| **Observability** | Use metrics/logs/traces for incident response; design SLIs/SLOs; build dashboards and actionable alerts |
| **Architecture** | Make trade-offs explicitly; document decisions; design for scale, reliability, and cost; communicate clearly |

The role guides go *deeper* than a junior engineer typically needs. That’s good: you’ll use them as references, but follow the **junior track** steps below.

## How to Use This Curriculum

- **Start broad**: learn observability + Kubernetes basics so you can operate systems.
- **Then choose a track**: backend implementation (Go/Loki), platform extensibility (plugins), customer enablement (associate architect), or enterprise architecture (senior architect).
- **Learn by doing**: each week includes small labs and “check your understanding” prompts.

### Recommended baseline reading (required)

Read these first, in order:

1. `grafana/shared-concepts/observability-principles.md`
2. `grafana/shared-concepts/kubernetes-fundamentals.md`
3. `grafana/shared-concepts/grafana-ecosystem.md`
4. `grafana/shared-concepts/lgtm-stack.md`

Then pick your role guide.

## Junior Engineer Learning Plan (6 weeks)

### Week 1 — Observability basics (signals + workflows)

- **Learn**
  - What metrics/logs/traces are (and when to use which)
  - The “debug loop”: alert → scope → correlate → confirm → fix → prevent
  - Golden signals: latency, traffic, errors, saturation
- **Practice**
  - Write 5 PromQL queries: rate, error rate, p95 latency, CPU %, memory %
  - Write 5 LogQL queries: filter, parse JSON, count over time, group by label
  - Describe a trace: identify the slow span and explain what it implies
- **Success criteria**
  - You can explain: “metrics tell me *that*; traces show me *where*; logs tell me *why*.”

### Week 2 — Kubernetes operations (so you can debug reality)

- **Learn**
  - Pods/Deployments/Services/Ingress, ConfigMaps/Secrets
  - Requests/limits, probes, and why “Running” ≠ “Healthy”
  - Common failures: CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled
- **Practice**
  - Debug a failing pod using `kubectl describe`, `kubectl logs`, and `kubectl exec`
  - Sketch how traffic flows: Ingress → Service → Pods → upstream dependency
- **Success criteria**
  - You can form a hypothesis and prove/disprove it with evidence.

### Week 3 — Grafana “how it works” (dashboards + data sources)

- **Learn**
  - Data source model: query → response → data frames → visualization
  - Dashboard design: purpose-first panels, sane defaults, variable hygiene
  - Alerting basics: symptoms, actionability, routing, and noise control
- **Practice**
  - Build one dashboard with: traffic, errors, latency p95/p99, saturation
  - Add one alert: high error rate with a runbook link
- **Success criteria**
  - Your dashboard answers: “Is it broken?”, “Where?”, “What changed?”, “What do I do next?”

### Week 4 — Pick a specialization track

Choose one:

- **Track A (Backend + Loki / Go focus)**: `01-staff-backend-engineer-loki/`
- **Track B (Grafana OSS + plugin focus)**: `02-senior-software-engineer-oss/`
- **Track C (Customer-facing enablement + troubleshooting)**: `03-associate-observability-architect/`
- **Track D (Enterprise architecture + strategy)**: `04-observability-architect-senior/`

Each track has a junior-friendly file:

- `01-staff-backend-engineer-loki/junior-study-material.md`
- `02-senior-software-engineer-oss/junior-study-material.md`
- `03-associate-observability-architect/junior-study-material.md`
- `04-observability-architect-senior/junior-study-material.md`

### Week 5 — Build a capstone (small, real, end-to-end)

Pick one project:

- **Service observability**: instrument a small HTTP service (metrics + logs + traces), then build a dashboard and alert.
- **Kubernetes “day-2”**: deploy a small stack, then write runbooks for 5 failure modes.
- **Plugin sandbox**: scaffold a datasource plugin and return a simple time series.

### Week 6 — Review + interview-style explanation practice

- Pick 10 questions from your role’s `questions/questions-and-answers.md`.
- For each:
  - Write an answer in your own words.
  - Add a diagram or example query.
  - Identify one trade-off and one failure mode.

## Role Guides

| Role Guide | Best for | Start here |
|-----------|----------|------------|
| `01-staff-backend-engineer-loki/` | Junior backend engineers aspiring to distributed systems | `fundamentals.md` + `junior-study-material.md` |
| `02-senior-software-engineer-oss/` | Junior full-stack/backend engineers curious about plugins | `fundamentals.md` + `junior-study-material.md` |
| `03-associate-observability-architect/` | Junior engineers moving into support/enablement | `fundamentals.md` + `junior-study-material.md` |
| `04-observability-architect-senior/` | Juniors who want enterprise architecture context | `fundamentals.md` (skim) + `junior-study-material.md` |

## Hands-on Code to Explore

Use these as “lab material”:

- `grafana/code-implementations/observability-patterns/` (instrumentation + alerting patterns)
- `grafana/code-implementations/go-distributed-systems/` (concurrency + distributed patterns)
- `grafana/code-implementations/grafana-plugins/` (sample datasource plugin scaffolding)
- `grafana/code-implementations/kubernetes-configs/` (deployment manifests and operators)

## What “Good” Looks Like (Junior Expectations)

- **You can operate**: you can debug pods, read logs, and validate a fix with metrics.
- **You can explain trade-offs**: latency vs cost, consistency vs availability, granularity vs cardinality.
- **You write for the next person**: you create dashboards and runbooks that reduce MTTR for the team.

