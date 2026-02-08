# Junior Study Material: Grafana OSS Engineer Path (Plugins + Data Sources + CI/CD)

This companion is for **junior engineers** who want to learn how Grafana is extended via **data sources/plugins**, and how those extensions are built, shipped, and operated.

The role guide in this directory is intentionally senior. Use this file to move through it in a structured way.

## How this maps to “Topics Covered”

- **Go Programming**: backend plugins and services (request handling, testing, performance).
- **Grafana Ecosystem**: how Grafana talks to data sources; plugin lifecycle.
- **Kubernetes + DevOps**: shipping plugins/services safely (CI/CD, containerization, deployment).
- **Observability**: instrument your plugin/service so operators can debug it.
- **Architecture**: interface design, caching, failure modes, and safe evolution.

## Learning outcomes (junior expectations)

By the end you should be able to:

- Explain the **Grafana query lifecycle**: UI → query model → backend handler → data frame → visualization.
- Build a minimal “toy” datasource plugin that returns a time series.
- Containerize it and run it locally with dependencies.
- Design a CI pipeline that prevents shipping broken or unsafe artifacts.
- Add basic observability to your plugin/service (metrics + logs, optionally traces).

## Where to start (reading order)

1. `./fundamentals.md` (focus: Go HTTP patterns, Docker, datasource concepts)
2. `./intermediate.md` (focus: plugin architecture + CI/CD + Kubernetes patterns)
3. `./advanced.md` (reference; don’t try to “finish” it as a junior)
4. Repo examples:
   - `../../code-implementations/grafana-plugins/`
   - `../../code-implementations/observability-patterns/`
   - `../../code-implementations/kubernetes-configs/`

## 4-week plan (junior pace)

### Week 1 — Understand the datasource “contract”

Goal: learn what Grafana expects from a datasource and what you must return.

Core concepts:

#### Data source responsibilities

- Translate user queries into backend calls.
- Authenticate safely (don’t leak secrets).
- Return data in Grafana’s **data frame** model.
- Provide health checks.

#### Query lifecycle mental model

```
User edits query in UI
  |
  v
Frontend QueryEditor produces JSON model
  |
  v
Grafana calls backend QueryData (per panel refresh)
  |
  v
Backend executes query, builds data frames
  |
  v
Grafana renders panel(s)
```

Hands-on lab:

- In `../../code-implementations/grafana-plugins/sample-datasource/`:
  - find the query model (TypeScript types),
  - find the backend handler (Go),
  - trace: where the query JSON is parsed and where a frame is built.

Check your understanding:

- What is the difference between **wide** vs **long** time series formats?
- Why does Grafana prefer a unified “data frame” model?
- What belongs in a query model vs in datasource configuration?

### Week 2 — Build a minimal plugin (toy but real)

Goal: create a working loop: query → backend → frame → panel.

Minimum feature set:

- Query: “metric name” + “aggregation”
- Response: time series with timestamps and values
- Health: “OK” if backend can reach a mock dependency

Implementation notes (what juniors often miss):

- **Always bound work**: timeouts around network calls.
- **Validate inputs**: reject huge time ranges or unbounded queries by default.
- **Return partial results** thoughtfully when multiple queries are in one request.

Hands-on lab:

- Scaffold via Grafana plugin tooling (or adapt the sample datasource).
- Implement:
  - one query path (“random data” is fine for the first version),
  - one config field (base URL),
  - one secure field (API key).

Deliverable:

- A short `README` snippet explaining:
  - how to run it,
  - what the query model looks like,
  - what the response contains.

### Week 3 — Ship like you mean it (CI/CD + containers)

Goal: juniors learn to treat plugins like production software.

Core concepts:

#### A good pipeline is a “quality gate”

Your pipeline should prevent:
- broken builds,
- failing tests,
- vulnerable dependencies,
- unsigned/unverifiable artifacts,
- accidental secrets in the repo.

Minimum pipeline stages:

- **Lint + typecheck**
- **Unit tests** (Go + TS)
- **Build artifacts**
- **Security scanning** (SAST + dependency scanning)
- **Package** (zip dist)
- **Release** (tag-based)

Hands-on lab:

- Draft a pipeline file that:
  - caches Go modules + Node deps,
  - runs `go test -race`,
  - runs TS lint/typecheck,
  - builds artifacts,
  - runs a vulnerability scan.

Container lab:

- Write a multi-stage Dockerfile for your backend component.
- Run it locally with a docker compose stack that includes Grafana + a mock API.

Check your understanding:

- Why do multi-stage builds reduce risk?
- What failures do you catch with `-race`?
- What’s the difference between “build passes” and “release is safe”?

### Week 4 — Operate it (Kubernetes + observability)

Goal: learn “day-2” operations: upgrades, debugging, scaling.

Core concepts:

#### Observability for your plugin/service

If operators can’t see what your plugin is doing, they will blame Grafana (or your plugin) for everything. Give them the signals they need.

Minimum instrumentation checklist:

- **Metrics**
  - request rate (per endpoint / per query type)
  - error rate (by error class)
  - latency (histograms; p95/p99)
  - dependency latency (time spent calling upstream)
  - cache hit rate (if you add caching)
- **Logs**
  - structured JSON logs
  - include `datasource_uid`, `org_id` (or tenant), `ref_id`, and correlation IDs where available
  - log *errors with context*, not noise
- **Traces (optional early)**
  - if you use OpenTelemetry, ensure context propagation
  - create spans around upstream calls and expensive transforms

#### Kubernetes operational basics (just enough for juniors)

Even if plugins run “inside Grafana”, your backend component still has operational concerns:

- readiness/liveness checks
- resource requests/limits
- safe rollouts
- config + secrets management

Hands-on lab:

1. Use `../../code-implementations/kubernetes-configs/deployments/grafana-deployment.yaml` as a reference.
2. Write a short deployment plan for your plugin/service:
   - where config lives (ConfigMap),
   - where secrets live (Secret),
   - how you validate readiness,
   - how you roll back safely.

Check your understanding:

- What’s the difference between a readiness probe and a liveness probe?
- Why can “auto-scaling” increase outages if you don’t design for it?
- What should your `CheckHealth` endpoint test (and what should it avoid)?

## Common pitfalls (and how to avoid them)

- **Unbounded queries**: Always cap time range, max datapoints, or rows returned.
- **Silent retries**: Retries without limits amplify outages. Add backoff + max attempts + circuit breaker.
- **Leaking secrets**: Never log decrypted secure settings.
- **High cardinality**: Don’t turn user IDs into labels. Prefer aggregation or sampling.
- **Caching without invalidation**: Cache with an explicit TTL and clear rules.
- **“Works locally” syndrome**: Use a reproducible dev stack (Docker Compose) and document it.

## Design guardrails (junior-friendly)

These guardrails keep your plugin “boringly reliable.”

### Error taxonomy (make failures diagnosable)

Don’t return “query failed” for everything. Operators need to know what kind of failure happened.

Suggested categories:

- **validation**: malformed query, unsupported aggregation, time range too large
- **auth**: invalid credentials, expired tokens, permission denied
- **timeout**: upstream slow, network issues, query too expensive
- **rate_limit**: upstream throttling or your own per-tenant limits
- **upstream**: upstream returned an error (5xx) or invalid response
- **internal**: bugs, panics, data frame construction errors

Best practice:
- log the detailed root cause (with context)
- return a safe, user-facing message
- increment a metric counter by category

### Caching strategy (simple rules first)

Caching can save you (and can also create confusing bugs). Start simple:

- **Cache only idempotent queries**
- **Cache key** should include:
  - datasource instance ID (or org/tenant)
  - query model (normalized)
  - time range bucket (e.g., round to 1m) if acceptable
- **TTL** should match the “freshness” you promise users
- **Bypass cache** for:
  - “now” ranges (last 5m) if freshness matters
  - queries that include randomness or non-determinism

If you can’t explain invalidation in 2 sentences, use a short TTL and accept misses.

### Compatibility + versioning

Grafana upgrades; plugin SDK evolves; APIs change. Plan for it:

- **Version your query model** (even if only with a `version` field).
- Be strict in parsing:
  - reject unknown fields if you want safety,
  - or tolerate unknown fields if you want forward compatibility—just be consistent.
- Maintain a “compatibility matrix” in your README:
  - Grafana version range
  - plugin SDK version

### Plugin distribution (high level)

At minimum, you should understand:

- **packaging**: producing a `dist/` artifact
- **signing** (if required by your environment)
- **release**: versioned artifact + changelog + rollback plan

Operational principle:
- Treat the plugin artifact like a deployable: immutable, versioned, reproducible.

### Testing strategy (what to test as a junior)

You don’t need 100% coverage. You need **confidence**.

Minimum tests:

- **Query parsing**:
  - invalid JSON → bad request
  - missing fields → clear validation error
- **Upstream client**:
  - timeouts handled
  - non-200 responses handled
- **Frame building**:
  - correct field types
  - timestamps monotonic
- **Health checks**:
  - dependency down → error status + message

### Security checklist

- never log secrets
- default to least privilege (scope tokens to read-only if possible)
- enforce request size limits
- validate URLs (avoid SSRF patterns in plugins that proxy)

## Capstone (pick one)

### Capstone A — “Toy datasource” to “operable datasource”

Take your minimal datasource and add:

- query timeout controls (per query type)
- input validation with clear error messages
- metrics for:
  - query duration (histogram)
  - errors (counter by class)
  - upstream latency
- structured logging with correlation IDs

Deliverable:

- a short “operations README” section:
  - dashboards to create,
  - alerts to add,
  - how to debug common issues.

### Capstone B — “CI pipeline that prevents bad releases”

Deliverable:

- a CI/CD design doc (1–2 pages) describing:
  - triggers (PR, main, tags),
  - required checks,
  - artifact versioning,
  - release signing strategy,
  - rollback plan.

## Next steps

- Use the role docs as deep references:
  - `./fundamentals.md` for patterns
  - `./intermediate.md` for plugin mechanics and deployment workflows
  - `./advanced.md` when you want performance + complex architectures
- Practice with the repo sample plugin: `../../code-implementations/grafana-plugins/sample-datasource/`

