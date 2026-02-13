# 16-Week Learning Schedule: System Design & Architecture

A structured 16-week program built from supplemental Pluralsight courses and books. This schedule progresses from fundamentals through intermediate concepts to advanced topics, designed for professionals preparing for system design interviews or advancing their architecture skills.

---

## Learning Approach

- **Time Commitment**: 8-12 hours per week
- **Course Strategy**: Complete 1-2 Pluralsight courses per week (prioritize those marked as recent)
- **Reading Strategy**: Start books early and read alongside courses; most books span multiple weeks
- **Practice**: Apply concepts through hands-on labs, personal projects, or mock system designs
- **Review**: Reserve Fridays for review, practice problems, and reflection

---

## WEEKS 1-5: FUNDAMENTALS

### Week 1: CAP Theorem & Distributed Systems Foundations

**Primary Focus**: Understanding the foundational trade-offs in distributed systems

**Pluralsight Courses** (Pick 1-2):
- [Distributed Systems: The Big Picture](https://www.pluralsight.com/courses/distributed-systems-the-big-picture) - Start here for core concepts
- [Fundamentals of Distributed Systems](https://www.pluralsight.com/courses/distributed-systems-fundamentals) - Deeper dive into consistency models

**Books** (Start reading):
- *Designing Data-Intensive Applications* by Martin Kleppmann (Chapters 1-3: Foundations)
  - This book will span multiple weeks; focus on consistency/replication chapters this week
- *System Design Interview, Vol. 1* by Alex Xu (Skim chapter 1)

**Practice**:
- Sketch out CAP theorem trade-offs for 3 real-world systems (DynamoDB, PostgreSQL, MongoDB)
- Document when you'd choose CP vs AP systems

---

### Week 2: Three Pillars of Observability

**Primary Focus**: Metrics, logs, and traces as the foundation of production systems

**Pluralsight Courses** (Pick 1-2):
- [Observability with OpenTelemetry and Grafana](https://www.pluralsight.com/courses/opentelemetry-grafana-observability) - Hands-on with the full stack
- [SRE: Monitoring and Observability](https://www.pluralsight.com/courses/sre-monitoring-observability) - SRE perspective

**Books** (Start reading):
- *Observability Engineering* by Charity Majors, Liz Fong-Jones, George Miranda (Chapters 1-4)
  - This will be your primary observability reference for weeks 2, 7, 8, 9

**Practice**:
- Set up a simple app with OpenTelemetry instrumentation
- Create a dashboard showing metrics, logs, and traces for the same request flow

---

### Week 3: Cloud Design Patterns

**Primary Focus**: Proven patterns for scalability, resilience, and performance

**Pluralsight Courses** (Pick 1-2):
- [Cloud-native Architecture and Design Principles](https://www.pluralsight.com/courses/cloud-native-architecture-design-principles)
- [Cloud Design Patterns for Azure: Availability and Resilience](https://www.pluralsight.com/courses/azure-design-patterns-availability-resilience)

**Books**:
- *Fundamentals of Software Architecture* by Mark Richards & Neal Ford (Chapters 1-8)
  - Start this book; it will span weeks 3-6
- Continue: *Designing Data-Intensive Applications* (Chapters 4-6: Replication & Partitioning)

**Practice**:
- Identify and document 5 cloud design patterns in a system you know
- Sketch a retry pattern with exponential backoff

---

### Week 4: CI/CD Pipeline Design + Infrastructure as Code

**Primary Focus**: Automated software delivery and infrastructure management

**Pluralsight Courses** (Pick 2):
- [Implementing a Full CI/CD Pipeline](https://www.pluralsight.com/courses/implementing-a-full-cicd-pipeline)
- [Terraform - Getting Started](https://www.pluralsight.com/courses/terraform-getting-started-2023)

**Books** (Start reading):
- *Fundamentals of DevOps and Software Delivery* by Yevgeniy Brikman (Chapters 1-5)
  - Primary book for weeks 4-5, reference throughout
- *Terraform: Up and Running, 3rd Edition* by Yevgeniy Brikman (Chapters 1-3)

**Practice**:
- Build a simple CI/CD pipeline with GitHub Actions
- Write Terraform code to provision basic infrastructure (VPC, EC2, S3)

---

### Week 5: Container Orchestration + SLIs/SLOs/SLAs

**Primary Focus**: Kubernetes fundamentals and reliability metrics

**Pluralsight Courses** (Pick 2):
- [Kubernetes for Developers: Core Concepts](https://www.pluralsight.com/courses/kubernetes-developers-core-concepts)
- [SRE: Concepts and Principles](https://www.pluralsight.com/courses/sre-concepts-principles) - Updated Apr 2025

**Books** (Start reading):
- *Kubernetes: Up and Running, 3rd Edition* by Brendan Burns et al. (Chapters 1-5)
- *Implementing Service Level Objectives* by Alex Hidalgo (Chapters 1-3)
  - This becomes your SLO bible for weeks 5, 7, 9, 10

**Practice**:
- Deploy a simple application to Kubernetes (local or cloud)
- Define SLIs and SLOs for a service you know (e.g., 99.9% availability, p99 latency < 200ms)
- Calculate error budget consumption

---

## WEEKS 6-11: INTERMEDIATE

### Week 6: Metrics Architecture + Secret Management

**Primary Focus**: Production metrics collection and secrets handling

**Pluralsight Courses** (Pick 2):
- [Getting Started with Prometheus](https://www.pluralsight.com/courses/getting-started-prometheus)
- [Getting Started with HashiCorp Vault](https://www.pluralsight.com/courses/getting-started-hashicorp-vault)

**Books**:
- Continue: *Observability Engineering* (Chapters 5-8: Instrumentation)
- Continue: *Terraform: Up and Running, 3rd Edition* (Chapter on secrets management)

**Practice**:
- Instrument a service with Prometheus client library
- Set up Vault locally and rotate a database credential
- Create a Grafana dashboard with key service metrics

---

### Week 7: Log Aggregation + Distributed Tracing

**Primary Focus**: Building the complete observability pipeline

**Pluralsight Courses** (Pick 2):
- [Centralized Logging with the Elastic Stack: Getting Started](https://www.pluralsight.com/courses/centralized-logging-elastic-stack)
- [OpenTelemetry: Observability with Java](https://www.pluralsight.com/courses/opentelemetry-observability-java) (or Python/C# variant)

**Books**:
- *Cloud-Native Observability with OpenTelemetry* by Alex Boten (Full read this week)
- Continue: *Observability Engineering* (Chapters 9-12)

**Practice**:
- Set up centralized logging with Elasticsearch/Loki
- Implement distributed tracing across 3+ microservices
- Correlate logs, metrics, and traces for a single user request

---

### Week 8: Alerting Strategy

**Primary Focus**: SLO-based alerting and reducing alert fatigue

**Pluralsight Courses** (Pick 1-2):
- [SRE: Monitoring and Observability](https://www.pluralsight.com/courses/sre-monitoring-observability)
- [Creating Alerting Rules (Lab)](https://www.pluralsight.com/labs/aws/creating-alerting-rules)
- [Using Grafana with Prometheus for Alerting and Monitoring (Lab)](https://www.pluralsight.com/labs/aws/using-grafana-with-prometheus-for-alerting-and-monitoring)

**Books**:
- *Implementing Service Level Objectives* by Alex Hidalgo (Chapters 4-7: Multi-window alerting)
- Continue: *Observability Engineering* (Alerting chapters)

**Practice**:
- Implement multi-window, multi-burn-rate alerting for an SLO
- Set up PagerDuty/Opsgenie integration
- Document on-call runbooks for 3 common alerts

---

### Week 9: Deployment Strategies + GitOps Patterns

**Primary Focus**: Progressive delivery and declarative infrastructure

**Pluralsight Courses** (Pick 2):
- [Implementing and Testing Blue-Green Deployments on AWS](https://www.pluralsight.com/courses/implementing-testing-blue-green-deployments-aws)
- [GitOps: The Big Picture](https://www.pluralsight.com/courses/gitops-the-big-picture)
- [Getting Started with Argo CD](https://www.pluralsight.com/courses/argo-cd-getting-started)

**Books**:
- *Fundamentals of DevOps and Software Delivery* by Yevgeniy Brikman (Deployment chapters)
- *Kubernetes Patterns, 2nd Edition* by Bilgin Ibryam & Roland Huss (Start reading: Chapters 1-6)

**Practice**:
- Implement blue-green deployment for a service
- Set up Argo CD or Flux for GitOps workflow
- Compare canary vs blue-green for a specific use case

---

### Week 10: Environment Management + Serverless Patterns

**Primary Focus**: Multi-environment workflows and event-driven architecture

**Pluralsight Courses** (Pick 2):
- [Managing Infrastructure with Terraform](https://www.pluralsight.com/paths/managing-infrastructure-with-terraform) (Select relevant modules)
- [AWS Lambda Deep Dive](https://www.pluralsight.com/courses/aws-lambda-deep-dive)
- [Introduction to Serverless with AWS Lambda](https://www.pluralsight.com/courses/aws-lambda-serverless-introduction)

**Books**:
- *Terraform: Up and Running, 3rd Edition* (Multi-environment chapters)
- Continue: *Designing Data-Intensive Applications* (Chapters 7-9: Stream processing)

**Practice**:
- Create Terraform workspaces for dev/staging/prod
- Build a serverless API with Lambda + API Gateway + DynamoDB
- Implement an event-driven workflow with EventBridge/SQS

---

### Week 11: Cost Optimization (FinOps)

**Primary Focus**: Cloud financial operations and cost governance

**Pluralsight Courses** (Pick 2):
- [FinOps Foundations](https://www.pluralsight.com/courses/finops-foundations)
- [Tactical FinOps for AWS](https://www.pluralsight.com/paths/tactical-finops-for-aws) (Select 1-2 key courses)

**Books**:
- *Cloud FinOps, 2nd Edition* by J.R. Storment & Mike Fuller (Full read)
- *Scaling Cloud FinOps* by Sasi Kanumuri & Matthew Zeier (Skim key chapters)

**Practice**:
- Analyze AWS Cost Explorer for a real or sample account
- Identify 3 cost optimization opportunities
- Create a chargeback/showback model for multi-team environments
- Set up cost anomaly alerts

---

## WEEKS 12-16: ADVANCED

### Week 12: Multi-Region Architecture + Disaster Recovery

**Primary Focus**: Geographic distribution and business continuity

**Pluralsight Courses** (Pick 2):
- [Reliable Google Cloud Infrastructure: Design and Process](https://www.pluralsight.com/courses/reliable-google-cloud-infrastructure-design-process-9)
- [Designing, Implementing, and Maintaining a DR Plan](https://www.pluralsight.com/courses/designing-implementing-maintaining-disaster-recovery-plan)
- [Disaster Recovery for Developers](https://www.pluralsight.com/courses/disaster-recovery-developers)

**Books**:
- *Terraform: Up and Running, 3rd Edition* (Multi-region/multi-cloud chapter)
- Continue: *Designing Data-Intensive Applications* (Chapters 10-12: Batch & stream processing)
- *Site Reliability Engineering* (free) by Google (DR chapters)

**Practice**:
- Design a multi-region architecture with failover
- Document RTO/RPO for different failure scenarios
- Sketch DNS-based vs application-level failover strategies

---

### Week 13: Security Architecture (Zero Trust)

**Primary Focus**: Modern security principles and implementation

**Pluralsight Courses** (Pick 2):
- [Zero Trust Architecture Foundational Concepts](https://www.pluralsight.com/courses/zero-trust-architecture-foundational-concepts)
- [Zero Trust Network Security](https://www.pluralsight.com/courses/zero-trust-network-security)
- [Zero Trust Application and Data Security](https://www.pluralsight.com/courses/zero-trust-app-data-security)

**Books** (Start reading):
- *Security Architecture for Hybrid Cloud* by Mark Buckwell et al. (2024)
  - Focus on zero-trust and threat modeling chapters
- *Zero Trust Architecture* by David Houck (2023)

**Practice**:
- Map your current system to zero-trust principles
- Design network segmentation with micro-perimeters
- Document authentication/authorization flows with mutual TLS

---

### Week 14: Data Architecture + Reliability Engineering

**Primary Focus**: Data systems design and production resilience

**Pluralsight Courses** (Pick 2):
- [Database Design for Data Engineers](https://www.pluralsight.com/courses/data-engineers-database-design)
- [SRE: Resiliency and Automation](https://blog.sixeyed.com/sre-resiliency-course/) (2025 course)
- [Chaos Engineering: The Path to Reliability](https://www.pluralsight.com/courses/chaos-conf-session-14)

**Books**:
- *Fundamentals of Data Engineering* by Joe Reis & Matt Housley (Chapters 1-8)
- Finish: *Designing Data-Intensive Applications* (Complete remaining chapters)
- *The Site Reliability Workbook* (free) by Google (Practical case studies)

**Practice**:
- Design a data pipeline (batch or streaming)
- Run a chaos engineering experiment (kill pods, inject latency)
- Document blast radius mitigation strategies

---

### Week 15: Migration Strategies + Incident Response

**Primary Focus**: Cloud migration approaches and incident management

**Pluralsight Courses** (Pick 2):
- [Cloud Migration Strategies](https://www.pluralsight.com/courses/cloud-migration-strategies)
- [AWS Foundations: Strategies and Tools for Large-scale Migrations](https://www.pluralsight.com/courses/aws-foundations-strategies-tools-perform-large-scale-migrations)
- [Incident Response and Recovery for SSCP (2024)](https://www.pluralsight.com/courses/incident-response-recovery-sscp-2024-cert)

**Books**:
- *Site Reliability Engineering* (Google) - Chapter 14: Managing Incidents
- *The Howie Guide to Post-Incident Investigations* (free) by Dr. Laura Maguire et al.
- *The Field Guide to Understanding Human Error* by Sidney Dekker

**Practice**:
- Plan a migration using the 7 R's framework (rehost, replatform, refactor, etc.)
- Write an incident response runbook
- Conduct a blameless postmortem for a past incident (real or simulated)

---

### Week 16: Cost-Effective Observability + Interview Preparation

**Primary Focus**: Optimizing observability spend and interview readiness

**Pluralsight Courses** (Pick 1-2):
- [Observability and Monitoring Tools and Techniques](https://www.pluralsight.com/paths/observability-and-monitoring-tools-and-techniques) (Review)
- [Cloud-native Architecture and Design Principles](https://www.pluralsight.com/courses/cloud-native-architecture-design-principles) (Review)

**Books** (Review/Reference):
- *System Design Interview, Vol. 1* by Alex Xu (Full review)
- *System Design Interview, Vol. 2* by Alex Xu & Sahn Lam (Review 3-4 problems)
- *Acing the System Design Interview* by Zhiyong Tan (2024) - Skim for strategies

**Practice**:
- Analyze observability costs: sampling strategies, retention policies
- Complete 3-5 mock system design interviews using the RESHADED framework
- Design systems from interview-prep directory (URL shortener, chat system, news feed, etc.)
- Review all notes and create a personal reference sheet

**Final Week Activities**:
- Create a one-page "cheat sheet" of key patterns, trade-offs, and numbers
- Practice whiteboard communication (explain designs verbally)
- Review CAP/PACELC, consistency models, and scaling patterns
- Polish your portfolio or GitHub with example architectures

---

## Bonus: Grafana-Specific Track (Optional Extension)

If pursuing Grafana roles (Loki Backend Engineer, OSS Engineer, Observability Architect), extend the program with these resources:

**Week 17-18: LGTM Stack Deep Dive**

**Pluralsight**:
- [Grafana Learning Path](https://www.pluralsight.com/paths/grafana) (Complete path)
- [Monitoring Key Systems with Prometheus Exporters](https://www.pluralsight.com/courses/monitoring-key-systems-prometheus-exporters)

**Books**:
- *Observability Engineering with Cilium* by Dr. Mehdi Ghane (2024)
- *Cloud Native Observability* by Kenichi Shibata et al. (2024)

**Practice**:
- Set up full LGTM stack (Loki, Grafana, Tempo, Mimir)
- Contribute to a Grafana OSS project
- Build customer-facing dashboards with multi-tenancy

---

## Reading Strategy

### Books to Start Early (Long Reads)
1. **Week 1**: *Designing Data-Intensive Applications* (read across weeks 1-14)
2. **Week 2**: *Observability Engineering* (read across weeks 2-8)
3. **Week 3**: *Fundamentals of Software Architecture* (read across weeks 3-6)
4. **Week 4**: *Fundamentals of DevOps and Software Delivery* (reference throughout)
5. **Week 5**: *Implementing Service Level Objectives* (read across weeks 5-8)

### Books for Focused Study (Single Week)
- *Cloud FinOps* (Week 11)
- *Cloud-Native Observability with OpenTelemetry* (Week 7)
- *System Design Interview Vols 1 & 2* (Week 16 + ongoing reference)

### Free Resources
- Google SRE books (*Site Reliability Engineering*, *The Site Reliability Workbook*)
- *The Howie Guide to Post-Incident Investigations*
- Red Hat's *Kubernetes Patterns, 2nd Edition*

---

## Success Metrics

**Weekly Check-ins**:
- [ ] Completed 1-2 Pluralsight courses
- [ ] Read assigned book chapters
- [ ] Completed hands-on practice exercises
- [ ] Documented learnings in personal notes
- [ ] Can explain the week's concepts to someone else

**Mid-Program Review (Week 8)**:
- [ ] Can explain CAP theorem trade-offs with examples
- [ ] Can design a basic CI/CD pipeline
- [ ] Understand the three pillars of observability
- [ ] Can write SLIs and SLOs for a service
- [ ] Comfortable with Kubernetes and Terraform basics

**Final Program Review (Week 16)**:
- [ ] Can design systems at multiple scales (1K to 10M users)
- [ ] Understand trade-offs between consistency, availability, latency, cost
- [ ] Can explain multi-region, DR, and migration strategies
- [ ] Comfortable discussing security architecture
- [ ] Ready for system design interviews with RESHADED framework
- [ ] Have portfolio of architecture diagrams and designs

---

## Tips for Success

1. **Active Learning**: Don't just watch/read—build, break, and debug
2. **Spaced Repetition**: Review week 1-4 topics during weeks 8, 12, 16
3. **Community**: Join communities (r/devops, SRE Discord, CNCF Slack)
4. **Documentation**: Keep an architecture decision record (ADR) journal
5. **Mock Interviews**: Practice explaining designs out loud weekly
6. **Real-World Application**: Apply concepts to your current job when possible
7. **Pluralsight Labs**: Prioritize hands-on labs over passive video watching
8. **Adjust Pace**: If a week feels too heavy, split across two weeks

---

## Related Resources

This learning schedule complements:
- Study guides in `fundamentals/`, `intermediate/`, `advanced/`
- Interview preparation templates in `interview-prep/`
- RESHADED framework for system design interviews
- Grafana role-specific guides

**Next Steps**:
1. Block 8-12 hours per week on your calendar
2. Set up accounts: Pluralsight, AWS/GCP/Azure free tier, GitHub
3. Create a learning journal (Notion, Obsidian, or markdown)
4. Start Week 1 on a Monday for best momentum
5. Find an accountability partner or study group

---

*Good luck on your system design learning journey!*
