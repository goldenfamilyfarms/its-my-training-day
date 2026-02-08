# Technical Interview Questions - Senior Software Engineer, Grafana OSS Big Tent

## Overview

This section contains 15 technical interview questions designed to prepare you for the Senior Software Engineer - Grafana OSS Big Tent role. Questions cover the key competencies expected at the senior level, with detailed answers focusing on Go backend development and Grafana plugin architecture.

## Question Categories

| Category | Count | Description |
|----------|-------|-------------|
| **System Design** | 4 | Design plugin architectures and data source integrations |
| **Coding** | 4 | Go programming and plugin implementation challenges |
| **Architecture** | 3 | Technical decision-making and trade-offs |
| **Troubleshooting** | 2 | Debugging plugin and performance issues |
| **Scenario-Based** | 2 | Real-world problem-solving situations |

## Difficulty Distribution

| Difficulty | Count | Percentage |
|------------|-------|------------|
| Intermediate | 6 | 40% |
| Advanced | 9 | 60% |

## Topics Covered

### Go Backend Development
- HTTP server patterns
- Middleware implementation
- Error handling strategies
- Concurrent request processing
- Testing patterns

### Grafana Plugin Development
- Backend plugin SDK
- Data source plugin architecture
- Query handling and transformation
- Configuration management
- Plugin signing and distribution

### Data Source Integration
- Prometheus query patterns
- Loki log querying
- MySQL/PostgreSQL connections
- BigQuery analytics integration
- Custom data source design

### CI/CD & DevOps
- GitHub Actions workflows
- Automated testing strategies
- Release pipeline design
- Plugin marketplace publishing
- Kubernetes deployment

### Performance & Observability
- Query optimization
- Caching strategies
- Plugin instrumentation
- Distributed tracing
- Profiling techniques

### Frontend (Supplementary)
- TypeScript basics
- React component patterns
- Redux state management
- RxJS reactive patterns

---

## How to Use These Questions

### Recommended Approach

1. **Read the question carefully** - Understand what's being asked before formulating an answer
2. **Write your answer first** - Don't peek at the provided answer
3. **Time yourself** - Aim for 5-10 minutes per question initially
4. **Compare and learn** - Review the provided answer and note gaps
5. **Practice verbally** - Explain your answers out loud as if in an interview

### Study Tips

- **For System Design questions**: Draw diagrams, discuss trade-offs, consider extensibility
- **For Coding questions**: Write actual code, consider edge cases, discuss complexity
- **For Architecture questions**: Explain reasoning, consider alternatives
- **For Troubleshooting questions**: Be systematic, explain your debugging process
- **For Scenario questions**: Draw from experience, be specific about actions

### Interview Simulation

To simulate a real interview:

1. Set a timer for 45-60 minutes
2. Randomly select 3-4 questions
3. Answer without looking at solutions
4. Review and score yourself
5. Identify areas for improvement

---

## Question List

| # | Title | Category | Difficulty |
|---|-------|----------|------------|
| 1 | Design a Multi-Backend Data Source Plugin | System Design | Advanced |
| 2 | Implement Query Handler with Caching | Coding | Intermediate |
| 3 | Plugin Architecture for Streaming Data | Architecture | Advanced |
| 4 | Debug Slow Data Source Queries | Troubleshooting | Intermediate |
| 5 | Go HTTP Middleware for Authentication | Coding | Intermediate |
| 6 | CI/CD Pipeline for Plugin Development | Architecture | Intermediate |
| 7 | Design BigQuery Data Source Integration | System Design | Advanced |
| 8 | Implement Connection Pool Manager | Coding | Advanced |
| 9 | Plugin Performance Degradation | Scenario-Based | Advanced |
| 10 | Data Source Configuration Best Practices | Architecture | Intermediate |
| 11 | Design Plugin Health Check System | System Design | Advanced |
| 12 | Debug Memory Leak in Plugin | Troubleshooting | Advanced |
| 13 | Design Prometheus Query Optimizer | System Design | Advanced |
| 14 | Implement Retry Logic with Backoff | Coding | Intermediate |
| 15 | Plugin Marketplace Release Strategy | Scenario-Based | Advanced |

---

## Scoring Guide

Use this rubric to evaluate your answers:

### System Design Questions (0-10 points)

| Score | Criteria |
|-------|----------|
| 0-2 | Missing key components, no consideration of extensibility |
| 3-4 | Basic design, limited trade-off discussion |
| 5-6 | Solid design, some trade-offs considered |
| 7-8 | Comprehensive design, good trade-off analysis |
| 9-10 | Expert-level design, deep insights, production-ready |

### Coding Questions (0-10 points)

| Score | Criteria |
|-------|----------|
| 0-2 | Non-functional or major bugs |
| 3-4 | Works but inefficient or missing edge cases |
| 5-6 | Correct solution, reasonable efficiency |
| 7-8 | Clean, efficient, handles edge cases |
| 9-10 | Optimal solution, excellent code quality, testable |

### Architecture/Troubleshooting Questions (0-10 points)

| Score | Criteria |
|-------|----------|
| 0-2 | Superficial understanding |
| 3-4 | Basic understanding, limited depth |
| 5-6 | Good understanding, some insights |
| 7-8 | Deep understanding, practical experience evident |
| 9-10 | Expert-level insights, production experience |

### Target Scores

| Level | Target Score (per question) |
|-------|----------------------------|
| Passing | 6+ |
| Good | 7+ |
| Excellent | 8+ |

---

## Related Resources

### Study Materials
- [Fundamentals](../fundamentals.md) - Core concepts
- [Intermediate](../intermediate.md) - Practical patterns
- [Advanced](../advanced.md) - Expert techniques

### Code Practice
- [Grafana Plugins](../../../code-implementations/grafana-plugins/) - Hands-on plugin examples
- [Go Distributed Systems](../../../code-implementations/go-distributed-systems/) - Backend patterns

### Shared Concepts
- [Grafana Ecosystem](../../../shared-concepts/grafana-ecosystem.md) - Grafana architecture
- [LGTM Stack](../../../shared-concepts/lgtm-stack.md) - Observability stack
- [Observability Principles](../../../shared-concepts/observability-principles.md) - Foundational concepts

---

**Ready to practice? Go to [Questions and Answers](./questions-and-answers.md)** →
