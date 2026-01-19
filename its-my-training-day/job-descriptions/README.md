# Job Description Library

This directory stores job descriptions for target roles and provides a mapping guide to connect job requirements with relevant study materials.

## How to Use

### 1. Save Job Descriptions
Save job descriptions as markdown files in this directory using the naming convention:
```
{company}-{role}-{date}.md
```
Example: `acme-senior-fullstack-2024-01.md`

### 2. Tag with Training Tracks
Add metadata at the top of each JD file:
```markdown
---
company: {Company Name}
role: {Role Title}
date_added: {YYYY-MM-DD}
tracks: [react-nodejs-fullstack, python-backend, system-design-architecture]
priority_topics: [topic1, topic2, topic3]
---
```

### 3. Create a Focused Study Plan
Use the mapping table below to identify which study materials to prioritize based on the JD keywords.

---

## JD Keyword to Training Track Mapping

### React/Node.js Full Stack Track

| JD Keyword | Relevant Topics | Study Materials |
|------------|-----------------|-----------------|
| React | fundamentals | `react-nodejs-fullstack/fundamentals/` |
| React hooks | fundamentals | `react-nodejs-fullstack/fundamentals/hooks-study-guide.md` |
| Redux, state management | fundamentals | `react-nodejs-fullstack/fundamentals/state-management.md` |
| Node.js | fundamentals | `react-nodejs-fullstack/fundamentals/nodejs-event-loop.md` |
| Express | fundamentals | `react-nodejs-fullstack/fundamentals/express-patterns.md` |
| Testing, Jest, Cypress | automation | `react-nodejs-fullstack/automation/` |
| CI/CD, GitHub Actions | automation | `react-nodejs-fullstack/automation/cicd-patterns.md` |
| E-commerce, retail | retail-operations | `react-nodejs-fullstack/retail-operations/` |
| Customer-facing apps | retail-operations | `react-nodejs-fullstack/retail-operations/` |
| Dashboard, analytics | dashboards-telemetry | `react-nodejs-fullstack/dashboards-telemetry/` |
| Monitoring, observability | dashboards-telemetry | `react-nodejs-fullstack/dashboards-telemetry/` |
| Real-time, WebSocket | dashboards-telemetry | `react-nodejs-fullstack/dashboards-telemetry/` |

### Python Backend Track

| JD Keyword | Relevant Topics | Study Materials |
|------------|-----------------|-----------------|
| Python | fundamentals | `python-backend/fundamentals/` |
| OOP, classes | fundamentals | `python-backend/fundamentals/oop-patterns.md` |
| Decorators, generators | fundamentals | `python-backend/fundamentals/decorators-generators.md` |
| Async, asyncio | fundamentals | `python-backend/fundamentals/async-await.md` |
| REST API, API design | api-design | `python-backend/api-design/` |
| GraphQL | api-design | `python-backend/api-design/graphql-patterns.md` |
| FastAPI | fastapi | `python-backend/fastapi/` |
| Pydantic, validation | fastapi | `python-backend/fastapi/pydantic-validation.md` |
| Microservices | microservices | `python-backend/microservices/` |
| Message queues, Kafka | microservices | `python-backend/microservices/messaging-patterns.md` |
| Algorithms, data structures | live-coding | `python-backend/live-coding/` |
| LeetCode, coding interview | live-coding | `python-backend/live-coding/` |

### System Design & Architecture Track

| JD Keyword | Relevant Topics | Study Materials |
|------------|-----------------|-----------------|
| Distributed systems | fundamentals | `system-design-architecture/fundamentals/` |
| CAP theorem | fundamentals | `system-design-architecture/fundamentals/cap-theorem.md` |
| Scalability, scaling | fundamentals | `system-design-architecture/fundamentals/scalability-patterns.md` |
| Consistency, availability | fundamentals | `system-design-architecture/fundamentals/consistency-models.md` |
| Monitoring, logging | observability | `system-design-architecture/observability/` |
| Metrics, tracing | observability | `system-design-architecture/observability/` |
| AWS, GCP, Azure | solutions-architecture | `system-design-architecture/solutions-architecture/` |
| Cloud architecture | solutions-architecture | `system-design-architecture/solutions-architecture/` |
| Terraform, IaC | devops | `system-design-architecture/devops/` |
| Kubernetes, Docker | devops | `system-design-architecture/devops/containerization.md` |
| CI/CD pipelines | devops | `system-design-architecture/devops/cicd-strategies.md` |
| System design interview | interview-frameworks | `system-design-architecture/interview-frameworks/` |

---

## Creating a Study Plan from a JD

### Step 1: Identify Keywords
Highlight technical keywords in the job description.

### Step 2: Map to Topics
Use the tables above to find relevant study materials.

### Step 3: Prioritize
Rank topics by:
1. **Must Have**: Explicitly required in JD
2. **Should Have**: Mentioned as preferred
3. **Nice to Have**: Related to the role but not mentioned

### Step 4: Create Timeline
Estimate time needed based on study guide estimates and your interview date.

### Example Study Plan

```markdown
## Study Plan: Senior Full Stack Engineer @ Acme Corp

**Interview Date**: 2024-02-15
**Prep Time Available**: 2 weeks

### Week 1: Core Requirements
- [ ] React hooks (2 hours) - Must Have
- [ ] State management (2 hours) - Must Have
- [ ] Node.js event loop (1.5 hours) - Must Have

### Week 2: Differentiators
- [ ] System design fundamentals (3 hours) - Should Have
- [ ] CI/CD patterns (1 hour) - Nice to Have
- [ ] Mock interview practice (2 hours)
```

---

## Job Description Template

Use this template when saving new job descriptions:

```markdown
---
company: 
role: 
date_added: 
tracks: []
priority_topics: []
application_status: [saved | applied | interviewing | offer | rejected]
interview_date: 
---

# {Role Title} @ {Company}

## About the Role
{Paste role description}

## Requirements
{Paste requirements}

## Nice to Have
{Paste preferred qualifications}

## My Notes
- Key topics to focus on:
- Questions to ask:
- Company research:
```
