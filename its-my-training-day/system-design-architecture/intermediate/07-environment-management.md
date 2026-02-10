# Study Guide: Environment Management (Dev, Staging, Prod)

## Metadata
- **Track**: system-design-architecture
- **Subdomain**: devops
- **Difficulty**: Intermediate
- **Target audience**: Junior engineers working across dev/stage/prod
- **Estimated time**: 30–60 minutes

## Prerequisites
- Basic understanding of CI/CD and deployments
- Familiarity with configuration vs secrets (what belongs where)
- Helpful: basic cloud/IaC concepts

## Suggested study path (junior)
1. Start with [CI/CD Pipeline Design](./01-ci-cd-pipeline-design.md) (artifact promotion and gates)
2. Then read this guide (dev/stage/prod purpose and parity)
3. Next: [Deployment Strategies](./04-deployment-strategies.md) (how rollouts use environments)
4. Then: [Secret Management](./06-secret-management.md) (env scoping and rotation)
5. For production discipline: [Reliability Engineering](./08-reliability-engineering.md)

## Related guides
- [CI/CD Pipeline Design](./01-ci-cd-pipeline-design.md)
- [Deployment Strategies](./04-deployment-strategies.md)
- [Secret Management](./06-secret-management.md)
- [Reliability Engineering](./08-reliability-engineering.md)
- [Cloud Design Patterns](../../solutions-architecture/study-guides/01-cloud-design-patterns.md)

## What you’ll learn
- What environments are for (and common traps)
- How to keep environments consistent without blocking iteration speed
- Safe configuration management and release practices across environments
- How to design staging to catch real issues (not create fake confidence)

## Why environments exist
Environments manage risk by separating:
- experimentation (dev)
- verification (staging)
- customer impact (production)

The goal is not “make staging identical to prod at all costs”. The goal is “make staging **predictive** of prod for the risks you care about”.

## Typical environment tiers

### Dev
- Fast iteration
- Lower controls
- Often uses cheaper shared resources

### Staging / Pre-prod
- Production-like configuration and deployment process
- Used for rehearsal: rollouts, migrations, incident drills
- Ideally uses production-like dependencies (auth, queues) or realistic substitutes

### Production
- Tightest controls (approvals, SLO gating)
- Real users and real cost

## Reference architecture: promotion flow

```mermaid
flowchart LR
  PR[Pull_Request] --> CI[CI]
  CI --> Art[Immutable_Artifact]
  Art --> Dev[Deploy_Dev]
  Dev --> Stage[Deploy_Staging]
  Stage -->|gate_passed| Prod[Deploy_Prod]
```

Key rule: **promote the same artifact**.

## Environment parity (what matters)
Parity dimensions:
- **Code**: same artifact
- **Config**: same shape, env-specific values
- **Infra**: same topology patterns (LB, autoscaling), scaled down if needed
- **Data**: same schema and migration path; sanitized copies where needed

Common compromise: staging is smaller (scale) but functionally similar (topology and settings).

## Configuration management

### Principles
- Configuration is code: versioned, reviewed, validated.
- Separate **config** from **secrets**.
- Prefer **declarative** config with schema validation.

### Common strategies
- **Env vars**: simple, portable; can become messy without validation.
- **Config files**: structured; needs safe distribution and reload patterns.
- **Central config service**: dynamic config; adds a dependency.

Junior-friendly safe default:
- Typed config schema + env vars or config file
- Validation at startup (fail fast)

## Access and controls
Controls should match risk:
- Dev: broad access for speed
- Staging: limited access, but enough to debug
- Prod: least privilege, break-glass for emergencies

Anti-pattern: shared admin credentials across all envs.

## Data management (most common staging pain)

### Problem
Staging without realistic data gives false confidence.
Staging with real prod data risks privacy incidents.

### Patterns
- **Synthetic data**: safe but may miss edge cases
- **Sanitized prod snapshots**: good realism but requires strong governance
- **Read-only replicas**: realistic but risk of accidental writes

Best practice:
- Use sanitized snapshots + strict access controls + monitoring.

## Release and testing strategy across environments

### What to validate in staging
- Deployment mechanics (rollout + rollback)
- Migrations (expand/contract)
- Performance regression checks (within scale limits)
- Key business flows (synthetic transactions)

### What staging often cannot validate
- Rare production traffic patterns
- Long-tail latency under real load
- Third-party outages at scale

Mitigation: canaries and production verification gates.

## Failure modes & mitigations
- **“Works in staging” illusion** because configs differ
  - Mitigation: config parity, config drift detection, environment templates.
- **Manual hotfixes in prod** create drift
  - Mitigation: GitOps, audit, break-glass with mandatory follow-up PR.
- **Staging is always broken** so teams stop trusting it
  - Mitigation: SLO for staging health; ownership; repair SLAs.
- **Secrets reused across envs**
  - Mitigation: separate secret namespaces; separate identities.

## Operational checklist
- [ ] Same artifact promoted across envs
- [ ] Config validated with schema; secrets separated and not reused across envs
- [ ] Staging uses production-like topology and deployment process
- [ ] Access controls are environment-scoped with least privilege
- [ ] Staging health is tracked; broken staging is treated as a real problem
- [ ] Migration rehearsal happens in staging before prod

## Exercises
1. Create a staging validation checklist for a new feature (what you can and can’t prove).
2. Design an environment config scheme for 3 envs + 2 regions (naming, scoping, secrets).
3. Write a break-glass process for a production emergency change.

## Interview pack

### Common questions
1. “How do you design staging so it’s useful?”
2. “How do you prevent config drift across environments?”
3. “What should be different between dev and prod?”

### Strong answer outline
- Same artifact, consistent deployment process
- Config/secrets separated and validated
- Staging predictive for key risks; canary in prod for what staging can’t simulate
- Governance: access controls, drift detection, staging health ownership

