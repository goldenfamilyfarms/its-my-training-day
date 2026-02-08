# Junior Study Material: Senior Observability Architect Track (Enterprise Thinking)

This companion is for junior engineers who want to build **architecture muscle**: how to design and communicate observability solutions that work across teams, regions, and constraints.

As a junior, you are not expected to “own the enterprise strategy.” You *are* expected to understand the vocabulary, the trade-offs, and how to reason clearly.

## How this maps to “Topics Covered”

- **Architecture**: decision-making frameworks, reference architectures, governance, and trade-offs.
- **Observability**: SLOs/SLIs, alerting strategy, correlation across signals.
- **Kubernetes**: production patterns, HA, multi-cluster.
- **Grafana Ecosystem**: how LGTM fits together at scale.
- **Business** (implied in the role guide): value realization, ROI, and stakeholder alignment.

## Learning outcomes (junior expectations)

By the end you should be able to:

- Explain what “enterprise observability” means (and what makes it different).
- Produce a simple **reference architecture** for an org (central vs federated).
- Define 2–3 **SLIs** and an **SLO** for a service, with error budget math.
- Explain why alerting must be actionable and how to reduce noise.
- Write a 1-page “executive summary” that ties observability to outcomes (MTTR, reliability, cost).

## The 4 artifacts you should learn to create

### 1) Architecture Decision Record (ADR)

Use an ADR when you make a decision that you’ll regret if you don’t write down.

Minimum ADR fields:

- Context
- Decision
- Alternatives considered
- Consequences (good and bad)

### 2) Reference architecture diagram + narrative

A good reference architecture:

- names components and responsibilities
- shows data flow (collection → storage → query → alert)
- highlights trust boundaries (auth, tenancy, data residency)
- explains scaling approach

### 3) SLO + error budget policy

SLOs turn reliability into a measurable target.

- **SLI**: how you measure reliability (e.g., success rate, latency)
- **SLO**: target (e.g., 99.9% success over 30 days)
- **Error budget**: allowed unreliability (e.g., 0.1% failures)

### 4) Stakeholder-ready status update

You should be able to communicate:

- current status
- risks + mitigations
- next steps + timeline
- measurable progress

## 4-week plan (junior pace)

### Week 1 — Enterprise observability basics (what changes at scale)

Read:
- `./fundamentals.md` (skim) enterprise architecture + governance sections

Key concepts:

- **Standardization vs autonomy**: teams want freedom; platforms need consistency.
- **Multi-tenancy**: isolate teams/customers (quotas, retention, access control).
- **Cost drivers**: cardinality (metrics), volume (logs), spans (traces), query compute.
- **Failure domains**: a platform must fail gracefully (rate limits, per-tenant protections).

Exercise:

- Write a 10-bullet “enterprise requirements list” for an observability platform:
  - availability target, retention, access control, compliance, scale, latency, cost visibility.

### Week 2 — SLOs and alerting strategy (how to avoid alert spam)

Read:
- `./fundamentals.md` SLO + alerting sections

Build one SLO (simple, realistic):

- Service: `checkout`
- Window: 30 days
- SLO: 99.9% of requests succeed

Compute error budget:

- budget = \(1 - 0.999 = 0.001\)
- minutes per 30d ≈ 43,200
- downtime allowed ≈ \(43,200 \times 0.001 = 43.2\) minutes

Write:

- SLI definition (PromQL)
- alert strategy:
  - fast burn (page)
  - slow burn (ticket)
- runbook outline (5 steps)

### Week 3 — Multi-cluster / multi-region thinking

Read:
- `./fundamentals.md` Kubernetes production patterns (skim)

Key questions:

- centralized vs federated collection?
- data residency constraints?
- network connectivity between environments?
- what happens during a region outage?

Exercise:

- Draw (ASCII is fine) two architectures:
  - **centralized**: all signals ship to a central LGTM stack
  - **federated**: per-region stacks + central “global view”
- For each, list:
  - 3 benefits
  - 3 risks
  - 2 operational complexities

### Week 4 — Value realization (ROI) for engineers

Read:
- `./intermediate.md` (skim) roadmap + stakeholder communication sections

As a junior, focus on *how to reason*, not perfect finance.

Exercise:

- Build a simple ROI narrative:
  - baseline: 20 incidents/month, avg 2 hours to resolve
  - after: 20 incidents/month, avg 45 minutes to resolve
  - engineer cost: \$150/hour
  - savings/month ≈ \((2h - 0.75h) \times 20 \times 150 = \$3,750\)
- Then list 3 “non-financial” benefits:
  - customer trust, fewer escalations, faster delivery.

## Capstone: 1-page reference architecture + 1-page roadmap

Deliverables:

### Reference architecture (1 page)

- components (collection, storage, query, alerting)
- tenancy model
- retention strategy
- “day-2” operations: upgrades, capacity planning, cost controls

### Roadmap (1 page)

- Phase 1 (foundation): baseline dashboards + alerts + collection standard
- Phase 2 (expansion): tracing + SLOs + self-service onboarding
- Phase 3 (optimization): cost attribution + limits + automation/runbooks

## Next steps

- Use the senior role docs as reference:
  - `./fundamentals.md`, `./intermediate.md`, `./advanced.md`
- Practice with question bank:
  - `./questions/questions-and-answers.md`
