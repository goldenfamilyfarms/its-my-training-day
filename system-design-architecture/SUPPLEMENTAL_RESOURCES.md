# Supplemental Resources: Videos, Courses & Books

Curated Pluralsight courses and books to complement each study guide in the system-design-architecture curriculum. Courses are preferably from the last two years (2024-2025). Books are within the last four years (2022-2025).

---

## Fundamentals

### 01 - CAP Theorem

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Fundamentals of Distributed Systems](https://www.pluralsight.com/courses/distributed-systems-fundamentals) | Foundational coverage of distributed systems concepts including consistency models and partition tolerance |
| [Distributed Systems: The Big Picture](https://www.pluralsight.com/courses/distributed-systems-the-big-picture) | Core concepts, terminologies, and technologies that make up distributed systems |
| [Patterns for Building Distributed Systems for The Enterprise](https://www.pluralsight.com/courses/cqrs-theory-practice) | Covers how CAP Theorem theory applies to practice using an Enterprise Service Bus, CQRS patterns |
| [Recognize the Need for Document Databases](https://www.pluralsight.com/courses/recognize-need-document-databases) | Explores CAP theorem trade-offs in the context of big data and document databases |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 (classic) | The definitive deep-dive on consistency models, replication, partitioning, and CAP/PACELC trade-offs |
| *System Design Interview, Vol. 1* | Alex Xu | 2020 | Step-by-step framework for system design with real-world CAP trade-off discussions |
| *System Design Interview, Vol. 2* | Alex Xu & Sahn Lam | 2022 | 13 detailed system design questions with 300+ diagrams covering distributed system trade-offs |

---

### 02 - Three Pillars of Observability

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Observability with OpenTelemetry and Grafana](https://www.pluralsight.com/courses/opentelemetry-grafana-observability) | End-to-end observability using OpenTelemetry and Grafana covering metrics, logs, and traces |
| [SRE: Monitoring and Observability](https://www.pluralsight.com/courses/sre-monitoring-observability) | Observability stack components: logging, distributed tracing, metrics with Prometheus, and visualizing SLIs with Grafana |
| [Observability and Monitoring Tools and Techniques](https://www.pluralsight.com/paths/observability-and-monitoring-tools-and-techniques) | Learning path surveying observability concepts and tool implementations (updated Jan 2025) |
| [OpenTelemetry: Observability with Java](https://www.pluralsight.com/courses/opentelemetry-observability-java) | Hands-on implementation of OpenTelemetry in Java for collecting logs, metrics, and traces |
| [Building an Observable Infrastructure and Code](https://www.pluralsight.com/courses/devseccon24-building-observable-infrastructure-code) | Monitoring service level availability, logs, security events, and application traces |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | The foundational text on observability from the Honeycomb team; covers SLOs, instrumentation, and maturity models |
| *Cloud-Native Observability with OpenTelemetry* | Alex Boten | 2022 | Hands-on guide to producing telemetry with OpenTelemetry API for distributed traces, metrics, and logs |
| *Cloud Native Observability* | Kenichi Shibata, Rob Skillington, Martin Mao | 2024 | Covers observability for complex microservices architectures including Prometheus and OpenTelemetry standards |
| *Cloud Observability in Action* | Michael Hausenblas | 2023 | Background and techniques for observability in serverless and Kubernetes environments using open standards |

---

### 03 - Cloud Design Patterns

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Cloud Design Patterns for Azure: Availability and Resilience](https://www.pluralsight.com/courses/azure-design-patterns-availability-resilience) | Queue-based load leveling, retry patterns, and throttling for resilient cloud applications |
| [Cloud Design Patterns for Azure: Data Management and Performance](https://www.pluralsight.com/courses/azure-design-patterns-data-management-performance) | Sharding, CQRS, and static content hosting patterns for performance |
| [Cloud-native Architecture and Design Principles](https://www.pluralsight.com/courses/cloud-native-architecture-design-principles) | Microservice architectures for improving scalability and resilience |
| [Reliable Google Cloud Infrastructure: Design and Process](https://www.pluralsight.com/courses/reliable-google-cloud-infrastructure-design-process-9) | Proven design patterns for building highly reliable solutions on Google Cloud |
| [Microservices Architecture](https://www.pluralsight.com/paths/microservices-architecture-new) | Learning path: resilient service architectures, communication patterns, service discovery, fault tolerance |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of Software Architecture* | Mark Richards & Neal Ford | 2020 | Comprehensive coverage of architecture patterns, trade-off analysis, and soft skills for architects |
| *Kubernetes Patterns, 2nd Edition* | Bilgin Ibryam & Roland Huss | 2023 | Reusable cloud-native design patterns for container deployment and orchestration |
| *System Design Interview, Vol. 2* | Alex Xu & Sahn Lam | 2022 | Real-world system design walkthroughs that apply cloud patterns in practice |

---

### 04 - CI/CD Pipeline Design

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [CI/CD Integration with GitHub Copilot](https://www.pluralsight.com/courses/ci-cd-integration-github-copilot) | Build and maintain CI/CD pipelines, automate testing, enforce security checks with GitHub Actions |
| [Implementing a Full CI/CD Pipeline](https://www.pluralsight.com/courses/implementing-a-full-cicd-pipeline) | Hands-on experience building a CI/CD pipeline from start to finish |
| [AIOps: CI/CD for AI Systems](https://www.pluralsight.com/courses/ai-ops-ci-cd-systems) | Applying CI/CD concepts to ML, AI, and LLM systems |
| [DevOps CI/CD: Setting up a CI/CD Pipeline](https://www.pluralsight.com/courses/devops-continuous-integration-delivery-settingup-cicd-pipeline) | Self-hosted GitLab and cloud-hosted GitHub Actions pipeline configuration |
| [Building a Modern CI/CD Pipeline with Jenkins](https://www.pluralsight.com/courses/jenkins-modern-ci-cd-pipeline-building) | Jenkins Pipeline syntax, flow control, conditions, and shared libraries |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of DevOps and Software Delivery* | Yevgeniy Brikman | 2024 | Hands-on guide covering the complete software delivery lifecycle including CI/CD |
| *Pipeline as Code* | Mohamed Labouardy | 2022 | Building CI/CD pipelines with Jenkins, Kubernetes, and Terraform |
| *Accelerate* | Nicole Forsgren, Jez Humble, Gene Kim | 2018 | Research-backed insights into CI/CD capabilities that drive high-performing teams |

---

### 05 - Infrastructure as Code

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Managing Infrastructure with Terraform](https://www.pluralsight.com/paths/managing-infrastructure-with-terraform) | Complete path: variables, modules, state, CI/CD integration, multi-cloud (updated Jul 2024) |
| [Terraform - Getting Started](https://www.pluralsight.com/courses/terraform-getting-started-2023) | Foundational Terraform: configurations, variables, resources, providers, state files, and modules |
| [Implementing Terraform with AWS](https://www.pluralsight.com/courses/implementing-terraform-aws) | AWS-specific IaC: S3/DynamoDB remote state, AWS data sources |
| [HashiCorp Certified: Terraform Associate](https://www.pluralsight.com/paths/hashicorp-certified-terraform-associate) | Certification-focused learning path for infrastructure management with Terraform |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Terraform: Up and Running, 3rd Edition* | Yevgeniy Brikman | 2022 | The definitive Terraform book; covers secrets management, multi-region, multi-cloud, and Kubernetes integration |
| *Terraform Cookbook* | Mikael Krief | 2023 | Practical recipes for provisioning infrastructure with real-world DevOps patterns |
| *Fundamentals of DevOps and Software Delivery* | Yevgeniy Brikman | 2024 | Broader context for IaC within the complete software delivery process |

---

### 06 - Container Orchestration

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Kubernetes Tooling and Techniques](https://www.pluralsight.com/paths/kubernetes-tooling-and-techniques) | Learning path covering core K8s concepts, essential objects, and advanced tooling (updated 2024-2025) |
| [Kubernetes for Developers: Core Concepts](https://www.pluralsight.com/courses/kubernetes-developers-core-concepts) | Pods, deployments, services, storage, ConfigMaps, secrets, and troubleshooting |
| [Kubernetes for Developers: Deploying Your Code](https://www.pluralsight.com/courses/kubernetes-developers-deploying-code) | Deployment techniques for ensuring code and applications work correctly on K8s |
| [Docker Deep Dive](https://www.pluralsight.com/courses/docker-deep-dive-2023) | Containers, images, volumes, networking, and orchestration for modern DevOps (2025 update) |
| [Azure Kubernetes Service (AKS)](https://www.pluralsight.com/paths/azure-kubernetes-service-aks) | Deploying, managing, and scaling containerized applications with AKS (2024-2025) |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Kubernetes Patterns, 2nd Edition* | Bilgin Ibryam & Roland Huss | 2023 | Foundational, behavioral, structural, configuration, security, and advanced K8s patterns (free from Red Hat) |
| *Kubernetes: Up and Running, 3rd Edition* | Brendan Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson | 2022 | Updated coverage of DaemonSets, secrets, ConfigMaps, jobs, and advanced objects |
| *Production Kubernetes* | Josh Rosso, Rich Lander, Alex Brand, John Harris | 2021 | Deep-dive into configuring and extending K8s in production environments |

---

### 07 - SLIs, SLOs, and SLAs

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [SRE: Concepts and Principles](https://www.pluralsight.com/courses/sre-concepts-principles) | SLOs, error budgets, SLIs, monitoring stacks, and why SLOs beat SLAs (updated Apr 2025) |
| [Site Reliability Engineering (SRE): The Big Picture (2024)](https://www.pluralsight.com/courses/site-reliability-engineering-big-picture-2024) | 2024 edition covering SRE fundamentals including service level definitions |
| [Site Reliability Engineering (SRE) Learning Path](https://www.pluralsight.com/paths/site-reliability-engineering-sre) | Complete path: SLIs, SLOs, error budgets, resilient and self-healing system design |
| [Site Reliability Engineering: Measuring and Managing Reliability](https://www.pluralsight.com/courses/site-reliability-engineering-measuring-managing-reliability-1) | Google-authored course on devising SLIs, setting SLOs, and managing error budgets |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Implementing Service Level Objectives* | Alex Hidalgo | 2020 | The definitive guide to defining SLIs, setting SLOs, and building an error budget culture |
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | Connects observability practices directly to SLO-driven development |
| *Site Reliability Engineering (Google)* | Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy | 2016 (free) | The original SRE handbook with foundational chapters on SLIs, SLOs, and error budgets |

---

### 08 - Secret Management

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Getting Started with HashiCorp Vault](https://www.pluralsight.com/courses/getting-started-hashicorp-vault) | Vault basics: managing secrets, configuring policies, reviewing audit logs |
| [Managing Access and Secrets in HashiCorp Vault](https://www.pluralsight.com/courses/hashicorp-vault-managing-access-secrets) | Accessing, managing, and storing secrets across multiple backends at scale |
| [Installing and Configuring HashiCorp Vault](https://www.pluralsight.com/courses/hashicorp-vault-installing-configuring) | Fundamentals and production deployment of Vault |
| [HashiCorp Certified: Vault Associate](https://www.pluralsight.com/paths/hashicorp-certified-vault-associate) | Complete path for Vault certification: secrets engines, auth, policies, HA clusters |
| [Implementing and Managing HashiCorp Vault](https://www.pluralsight.com/paths/implementing-and-managing-hashicorp-vault) | Skills for modern security needs including managing secrets and protecting sensitive data |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Terraform: Up and Running, 3rd Edition* | Yevgeniy Brikman | 2022 | Includes a new chapter specifically on secrets management with Terraform |
| *Security Architecture for Hybrid Cloud* | Mark Buckwell, Stefaan Van daele, Carsten Horst | 2024 | Covers secrets management within the broader context of zero-trust cloud security |

---

## Intermediate

### 01 - Metrics Architecture

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Getting Started with Prometheus](https://www.pluralsight.com/courses/getting-started-prometheus) | Prometheus architecture, pull model, PromQL, exporters, and Grafana dashboards |
| [Instrumenting Applications with Metrics for Prometheus](https://www.pluralsight.com/courses/instrumenting-applications-metrics-prometheus) | Adding Prometheus metrics in Java, Go, Node.js, and .NET with client libraries |
| [Configuring Prometheus 2 to Collect Metrics](https://www.pluralsight.com/courses/prometheus-configuring-collect-metrics) | Service discovery, scrape target configuration, and debugging metric collection |
| [Event Monitoring and Alerting with Prometheus](https://www.pluralsight.com/paths/event-monitoring-and-alerting-with-prometheus) | Learning path for implementing Prometheus monitoring (updated Jul 2024) |
| [AIOps Essentials: Autoscaling K8s with Prometheus Metrics](https://www.pluralsight.com/courses/aiops-essentials-autoscaling-kubernetes-with-prometheus-metrics) | Time-series metrics, Node Exporter, cAdvisor, and K8s autoscaling integration |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | Metrics instrumentation strategies, cardinality management, and SLO-aligned alerting |
| *Cloud Observability in Action* | Michael Hausenblas | 2023 | Practical metrics collection with Prometheus and Grafana in cloud-native environments |

---

### 02 - Log Aggregation Patterns

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Centralized Logging with the Elastic Stack: Getting Started](https://www.pluralsight.com/courses/centralized-logging-elastic-stack) | Elasticsearch, Kibana, and Beats for centralized log aggregation |
| [Managing Advanced Kubernetes Logging and Tracing](https://www.pluralsight.com/courses/kubernetes-advanced-logging-tracing-managing) | Using logging and tracing to find bugs and performance issues in K8s production |
| [Getting Started with Endpoint Log Analysis](https://www.pluralsight.com/courses/getting-started-endpoint-log-analysis) | Machine data analysis, searching/filtering, authentication data analysis (Mar 2024) |
| [Searching and Analyzing Data with Elasticsearch](https://www.pluralsight.com/courses/elasticsearch-analyzing-data) | Elasticsearch fundamentals: search algorithms, data structures, indexing |
| [Modern Structured Logging With Serilog and Seq](https://www.pluralsight.com/courses/modern-structured-logging-serilog-seq) | Structured logging concepts and implementation |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Cloud-Native Observability with OpenTelemetry* | Alex Boten | 2022 | Log collection and correlation within the OpenTelemetry framework |
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | Structured events vs traditional logging, correlation strategies |

---

### 03 - Distributed Tracing

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Observability with OpenTelemetry and Grafana](https://www.pluralsight.com/courses/opentelemetry-grafana-observability) | End-to-end distributed tracing with OpenTelemetry Collector and Grafana backends |
| [OpenTelemetry: Observability with .NET and C#](https://www.pluralsight.com/courses/opentelemetry-observability-dot-net-c-sharp) | Implementing distributed tracing in .NET applications |
| [OpenTelemetry: Observability with Java](https://www.pluralsight.com/courses/opentelemetry-observability-java) | Trace/span instrumentation, context propagation, and Grafana integration for Java |
| [OpenTelemetry: Observability with Python](https://www.pluralsight.com/courses/opentelemetry-observability-python) | Spans, metrics, and trace export using the Python SDK |
| [Managing Advanced Kubernetes Logging and Tracing](https://www.pluralsight.com/courses/kubernetes-advanced-logging-tracing-managing) | Tracing in Kubernetes production environments |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Cloud-Native Observability with OpenTelemetry* | Alex Boten | 2022 | Deep-dive into OpenTelemetry tracing: spans, context propagation, sampling, and backends |
| *Observability Engineering with Cilium* | Dr. Mehdi Ghane | 2024 | Advanced tracing with eBPF, Cilium, Hubble, and cloud-native tooling |
| *Cloud Native Observability* | Kenichi Shibata et al. | 2024 | Distributed tracing at scale with Prometheus and OpenTelemetry |

---

### 04 - Alerting Strategy

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [SRE: Monitoring and Observability](https://www.pluralsight.com/courses/sre-monitoring-observability) | Alerting strategies, Prometheus alerting, Grafana visualization, and AIOps tools |
| [SRE: Concepts and Principles](https://www.pluralsight.com/courses/sre-concepts-principles) | SLO-based alerting, error budgets, and burn-rate alerting patterns (updated Apr 2025) |
| [Creating Alerting Rules (Lab)](https://www.pluralsight.com/labs/aws/creating-alerting-rules) | Hands-on: writing Prometheus alerting rules for Redis and pod availability |
| [Using Grafana with Prometheus for Alerting and Monitoring (Lab)](https://www.pluralsight.com/labs/aws/using-grafana-with-prometheus-for-alerting-and-monitoring) | Hands-on: setting up Prometheus with cAdvisor and Grafana alerting |
| [Designing a Monitoring Strategy for Azure Data Platform](https://www.pluralsight.com/courses/microsoft-azure-monitoring-strategy-data-platform-designing) | Alert types, action types, and metric-based alerting in Azure |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Implementing Service Level Objectives* | Alex Hidalgo | 2020 | Burn-rate alerting, multi-window alerting, and symptom-based strategies tied to SLOs |
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | Alert fatigue, symptom vs cause alerts, and observability-driven debugging |

---

### 05 - Deployment Strategies

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Implementing and Testing Blue-Green Deployments on AWS](https://www.pluralsight.com/courses/implementing-testing-blue-green-deployments-aws) | Dedicated course on blue-green deployments with AWS services |
| [Kubernetes for Developers: Deploying Your Code](https://www.pluralsight.com/courses/kubernetes-developers-deploying-code) | Rolling, canary, and blue-green deployment techniques on Kubernetes |
| [SRE: Resiliency and Automation](https://blog.sixeyed.com/sre-resiliency-course/) | GitOps, chaos engineering, and progressive delivery patterns (2025) |
| [AWS Operations Learning Path](https://www.pluralsight.com/paths/aws-operations) | Includes courses on deployment strategies with content updated through 2025 |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of DevOps and Software Delivery* | Yevgeniy Brikman | 2024 | Comprehensive coverage of deployment strategies within the software delivery lifecycle |
| *Accelerate* | Nicole Forsgren, Jez Humble, Gene Kim | 2018 | Research proving the impact of deployment frequency and change failure rate on team performance |

---

### 06 - GitOps Patterns

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [GitOps: The Big Picture](https://www.pluralsight.com/courses/gitops-the-big-picture) | GitOps principles, architecture, workflows, and tooling (Flux, Argo CD, Jenkins X) |
| [Getting Started with Argo CD](https://www.pluralsight.com/courses/argo-cd-getting-started) | Argo CD core concepts, architecture, deploying and managing applications with GitOps |
| [SRE: Resiliency and Automation](https://blog.sixeyed.com/sre-resiliency-course/) | GitOps with ArgoCD, IaC with Terraform, Helm modeling, and continuous reconciliation (2025) |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Terraform: Up and Running, 3rd Edition* | Yevgeniy Brikman | 2022 | IaC workflows that underpin GitOps reconciliation models |
| *Kubernetes Patterns, 2nd Edition* | Bilgin Ibryam & Roland Huss | 2023 | Declarative configuration patterns that GitOps reconciliation loops manage |

---

### 07 - Environment Management

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Managing Infrastructure with Terraform](https://www.pluralsight.com/paths/managing-infrastructure-with-terraform) | Multi-environment Terraform workflows, state management, and module reuse (updated Jul 2024) |
| [Implementing Terraform on Microsoft Azure](https://www.pluralsight.com/courses/implementing-terraform-microsoft-azure) | Azure-specific environment management with Terraform including Azure DevOps integration |
| [Kubernetes for Developers: Core Concepts](https://www.pluralsight.com/courses/kubernetes-developers-core-concepts) | ConfigMaps, secrets, and namespace-based environment isolation |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Terraform: Up and Running, 3rd Edition* | Yevgeniy Brikman | 2022 | Multi-environment management, workspace strategies, and module patterns for dev/stage/prod parity |

---

### 08 - Serverless Patterns

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Introduction to Serverless with AWS Lambda](https://www.pluralsight.com/courses/aws-lambda-serverless-introduction) | Lambda vs EC2, event-driven architecture, Lambda design principles (Aug 2024) |
| [AWS Lambda Deep Dive](https://www.pluralsight.com/courses/aws-lambda-deep-dive) | Lambda architecture, EventBridge, SQS, API Gateway integration, and advanced patterns |
| [Build an Event Driven App with AWS Lambda](https://www.pluralsight.com/paths/build-an-event-driven-app-with-aws-lambda) | Learning path: building a scalable serverless video processing pipeline with event-driven patterns |
| [Building Serverless Applications on AWS](https://www.pluralsight.com/paths/building-serverless-applications-on-aws) | Complete path: Lambda, API Gateway, DynamoDB, EventBridge, S3, and Step Functions |
| [Deploying Serverless Applications with AWS SAM](https://www.pluralsight.com/courses/aws-deploying-serverless-applications-application-model) | Serverless Application Model for packaging and deploying Lambda functions |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of DevOps and Software Delivery* | Yevgeniy Brikman | 2024 | Serverless within the broader software delivery context |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 (classic) | Event-driven architecture, stream processing, and idempotency patterns |

---

### 09 - Cost Optimization

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [FinOps Foundations](https://www.pluralsight.com/courses/finops-foundations) | Core FinOps concepts, importance, and how to apply FinOps to enhance business value from cloud spend |
| [Tactical FinOps for AWS](https://www.pluralsight.com/paths/tactical-finops-for-aws) | AWS cost drivers, pricing structures, and strategies for monitoring and managing costs |
| [Microsoft Azure Cost Optimization Deep Dive](https://www.pluralsight.com/courses/microsoft-azure-cost-optimization-deep-dive) | Core optimization practices including FinOps applied to Azure environments |
| [Managing Compute Costs in Azure](https://www.pluralsight.com/courses/azure-costs-managing-compute) | Monitor, analyze, and apply compute cost optimizations using the FinOps cycle |
| [FinOps Principles (Instructor-Led)](https://www.pluralsight.com/professional-services/business-professional/finops-principles) | Comprehensive FinOps: budgeting, forecasting, cost allocation, and optimization strategies |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Cloud FinOps, 2nd Edition* | J.R. Storment & Mike Fuller | 2023 | The foundational FinOps text: cloud billing, cost management culture, and the FinOps lifecycle |
| *Scaling Cloud FinOps* | Sasi Kanumuri & Matthew Zeier | 2024 | Pragmatic insights with the #Piggy-Bank Framework for cloud cost governance at scale |

---

## Advanced

### 01 - Multi-Region Architecture

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Providing Disaster Recovery with Azure Services](https://www.pluralsight.com/courses/azure-services-providing-disaster-recovery) | Azure DR strategies including cross-region replication and failover |
| [Azure Site Recovery: IaaS Migration and Disaster Recovery](https://www.pluralsight.com/courses/azure-site-recovery-iaas-migration-disaster-recovery) | Extending data centers to Azure with DR models and monitoring |
| [Reliable Google Cloud Infrastructure: Design and Process](https://www.pluralsight.com/courses/reliable-google-cloud-infrastructure-design-process-9) | Designing reliable, multi-region solutions on Google Cloud |
| [Cloud Design Patterns for Azure: Availability and Resilience](https://www.pluralsight.com/courses/azure-design-patterns-availability-resilience) | Patterns for keeping applications running across failure domains |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Terraform: Up and Running, 3rd Edition* | Yevgeniy Brikman | 2022 | New chapter on working with multiple regions, accounts, and clouds |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 (classic) | Multi-leader replication, conflict resolution, and cross-datacenter consistency |

---

### 02 - Disaster Recovery Strategies

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Designing, Implementing, and Maintaining a DR Plan](https://www.pluralsight.com/courses/designing-implementing-maintaining-disaster-recovery-plan) | Complete DR plan lifecycle: design, implementation, and ongoing maintenance |
| [Disaster Recovery Planning: Step by Step](https://www.pluralsight.com/courses/disaster-recovery-planning) | Framework for creating an effective, workable written DR plan |
| [Disaster Recovery for Developers](https://www.pluralsight.com/courses/disaster-recovery-developers) | Developer-focused DR strategies and implementation |
| [SRE: Resiliency and Automation](https://blog.sixeyed.com/sre-resiliency-course/) | Classifying apps by business criticality and implementing DR strategies (2025) |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Site Reliability Engineering* | Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy | 2016 (free) | Foundational DR chapters from Google's production experience |
| *The Site Reliability Workbook* | Betsy Beyer et al. | 2018 (free) | Practical DR case studies including incident response scenarios |

---

### 03 - Security Architecture

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Zero Trust Architecture Foundational Concepts](https://www.pluralsight.com/courses/zero-trust-architecture-foundational-concepts) | Shifting from perimeter-based to zero-trust security principles and implementation |
| [Zero Trust Network Security](https://www.pluralsight.com/courses/zero-trust-network-security) | Network segmentation, ZTNA, SDPs, and continuous monitoring within zero trust |
| [Zero Trust Application and Data Security](https://www.pluralsight.com/courses/zero-trust-app-data-security) | Application access controls, secure coding, encryption, tokenization, and DLP |
| [Security Architecture: Secure Network Design for CompTIA SecurityX](https://www.pluralsight.com/courses/security-architecture-secure-network-comptia-securityx-cert) | Designing resilient, adaptive security architectures aligned with Zero Trust |
| [Zero Trust Architecture (ZTA): Getting Started](https://www.pluralsight.com/courses/zero-trust-architecture-getting-started) | Introductory course on ZTA fundamentals and adoption |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Security Architecture for Hybrid Cloud* | Mark Buckwell, Stefaan Van daele, Carsten Horst | 2024 | First comprehensive method for hybrid/multicloud security with zero-trust, threat modeling, and compliance |
| *Zero Trust Architecture* | David Houck | 2023 | Practical ZTA implementation from a Cisco security architect |

---

### 04 - Data Architecture

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Database Design for Data Engineers](https://www.pluralsight.com/courses/data-engineers-database-design) | OLTP vs OLAP, relational design, ACID, star/snowflake schemas, CAP theorem (May 2024) |
| [Data Modeling for Data Engineers](https://www.pluralsight.com/courses/data-modeling-data-engineers) | Data modeling for OLTP and OLAP workloads, normalization, and entity relationships |
| [Key Concepts: Data Architecture Design](https://www.pluralsight.com/courses/data-architecture-design-key-concepts) | Core data architecture design concepts and 2025 technology landscape |
| [Data Engineering Core Skills](https://www.pluralsight.com/paths/data-engineering-core-skills) | Foundation path: data modeling, database design, ETL, and more |
| [Data Engineering on Google Cloud](https://www.pluralsight.com/paths/data-engineering-on-google-cloud-platform) | End-to-end data pipelines covering structured, unstructured, and streaming data (updated 2024) |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of Data Engineering* | Joe Reis & Matt Housley | 2022 | The modern reference for data engineering lifecycle: ingestion, orchestration, transformation, storage, governance |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 (classic) | Deep-dive on storage engines, replication, partitioning, batch/stream processing, and data system trade-offs |

---

### 05 - Reliability Engineering

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [SRE: Resiliency and Automation](https://blog.sixeyed.com/sre-resiliency-course/) | Architectural resilience, distributed caching, async messaging, graceful degradation, Chaos Mesh (2025) |
| [Implementing SRE Reliability Best Practices](https://www.pluralsight.com/courses/sre-reliability-best-practices-implementing) | SRE theory and practice including incident response and change management |
| [Chaos Engineering: The Path to Reliability](https://www.pluralsight.com/courses/chaos-conf-session-14) | Real-world chaos engineering examples and reliability strategies |
| [Site Reliability Engineering (SRE) Learning Path](https://www.pluralsight.com/paths/site-reliability-engineering-sre) | Complete SRE path: SLIs, SLOs, error budgets, resilient system design, monitoring, and observability |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Site Reliability Engineering* | Betsy Beyer et al. | 2016 (free) | The foundational SRE reference covering error budgets, timeouts, retries, and release engineering |
| *The Site Reliability Workbook* | Betsy Beyer et al. | 2018 (free) | Practical SRE implementation with hands-on case studies |
| *Implementing Service Level Objectives* | Alex Hidalgo | 2020 | SLO-driven reliability engineering methodology |

---

### 06 - Incident Response

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Incident Response and Recovery for SSCP (2024)](https://www.pluralsight.com/courses/incident-response-recovery-sscp-2024-cert) | Incident management lifecycle: detection, response, and recovery |
| [Incident Response Learning Path](https://www.pluralsight.com/paths/incident-response) | Path for incident responders covering hands-on technical aspects of security incidents |
| [Implementing SRE Reliability Best Practices](https://www.pluralsight.com/courses/sre-reliability-best-practices-implementing) | Incident response and change management processes in SRE practice |
| [Culturing Resiliency with Data: A Taxonomy of Outages](https://www.pluralsight.com/courses/chaos-conf-session-12) | Incident management frameworks, categories, and data-driven resilience |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Site Reliability Engineering* | Betsy Beyer et al. | 2016 (free) | Chapter 14 (Managing Incidents) is the seminal reference on incident roles, triage, and postmortems |
| *The Howie Guide to Post-Incident Investigations* | Dr. Laura Maguire, Nora Jones, Vanessa Huerta Granda | 2023 (free) | Modern blameless post-incident review methodology from PagerDuty/Jeli |
| *The Field Guide to Understanding Human Error* | Sidney Dekker | 2014 | Psychological aspects of incident management, blameless culture, and systems thinking |

---

### 07 - Migration Strategies

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Cloud Migration Strategies](https://www.pluralsight.com/courses/cloud-migration-strategies) | Comprehensive coverage of migration approaches and decision frameworks |
| [AWS Foundations: Strategies and Tools for Large-scale Migrations](https://www.pluralsight.com/courses/aws-foundations-strategies-tools-perform-large-scale-migrations) | AWS migration best practices from hundreds of enterprise migrations (updated Dec 2024) |
| [Cloud Transformation: Defining a Strategy](https://www.pluralsight.com/cloud-guru/courses/cloud-transformation-defining-a-strategy) | Migration approaches, tools, and techniques for full cloud adoption |
| [Cloud Migration Fundamentals](https://www.pluralsight.com/cloud-guru/courses/cloud-migration-fundamentals) | Planning, frameworks, and optimization for cloud migrations |
| [Microservices Architecture](https://www.pluralsight.com/paths/microservices-architecture-new) | Service decomposition patterns relevant to strangler fig migration |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Fundamentals of DevOps and Software Delivery* | Yevgeniy Brikman | 2024 | Migration within the context of modern software delivery practices |
| *Kubernetes Patterns, 2nd Edition* | Bilgin Ibryam & Roland Huss | 2023 | Patterns for migrating workloads to container-based architectures |

---

### 08 - Cost-Effective Observability

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [FinOps Foundations](https://www.pluralsight.com/courses/finops-foundations) | Core FinOps concepts applied to all cloud spend including observability tooling |
| [Observability and Monitoring Tools and Techniques](https://www.pluralsight.com/paths/observability-and-monitoring-tools-and-techniques) | Survey of observability tools with cost-awareness considerations (updated Jan 2025) |
| [Observability with OpenTelemetry and Grafana](https://www.pluralsight.com/courses/opentelemetry-grafana-observability) | Open-source observability stack as a cost-effective alternative to commercial tools |
| [Getting Started with Prometheus](https://www.pluralsight.com/courses/getting-started-prometheus) | Open-source metrics collection as a cost-effective monitoring foundation |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Cloud FinOps, 2nd Edition* | J.R. Storment & Mike Fuller | 2023 | Applying FinOps principles to all cloud services including observability spend |
| *Cloud Observability in Action* | Michael Hausenblas | 2023 | Includes cost-benefit analysis for observability tooling decisions |
| *Observability Engineering* | Charity Majors, Liz Fong-Jones, George Miranda | 2022 | Sampling strategies, data retention policies, and cost-aware instrumentation |

---

## Grafana-Specific Role Paths

### Shared Concepts (Observability Principles, K8s Fundamentals, Grafana Ecosystem, LGTM Stack)

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [Grafana Learning Path](https://www.pluralsight.com/paths/grafana) | Core Grafana concepts, dashboards, data ingestion, and advanced integrations (Nov 2024 - Mar 2025) |
| [Observability with OpenTelemetry and Grafana](https://www.pluralsight.com/courses/opentelemetry-grafana-observability) | The LGTM stack (Loki, Grafana, Tempo, Mimir) with OpenTelemetry |
| [Working with Prometheus and Grafana](https://www.pluralsight.com/professional-services/data-machine-learning/prometheus-grafana) | Prometheus monitoring and Grafana data visualization |
| [Kubernetes Tooling and Techniques](https://www.pluralsight.com/paths/kubernetes-tooling-and-techniques) | K8s fundamentals, essential objects, and advanced tooling (updated 2024-2025) |
| [Monitoring Key Systems with Prometheus Exporters](https://www.pluralsight.com/courses/monitoring-key-systems-prometheus-exporters) | Prometheus exporters for system monitoring including Kubernetes clusters |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *Observability Engineering with Cilium* | Dr. Mehdi Ghane | 2024 | Covers Grafana, Prometheus, OpenTelemetry, eBPF, and the cloud-native observability ecosystem |
| *Cloud-Native Observability with OpenTelemetry* | Alex Boten | 2022 | OpenTelemetry as the data collection standard feeding into Grafana backends |
| *Cloud Native Observability* | Kenichi Shibata et al. | 2024 | Prometheus and OpenTelemetry standards for complex distributed systems |

### Role-Specific Supplementals

**For Loki Backend Engineers:** The Pluralsight Grafana Learning Path + *Cloud-Native Observability with OpenTelemetry* (Boten, 2022) for understanding the data ingestion pipeline architecture.

**For OSS Engineers:** [Kubernetes for Developers: Core Concepts](https://www.pluralsight.com/courses/kubernetes-developers-core-concepts) + *Kubernetes Patterns, 2nd Edition* (Ibryam & Huss, 2023) for plugin development and cloud operations context.

**For Observability Architects:** The full [SRE Learning Path](https://www.pluralsight.com/paths/site-reliability-engineering-sre) + *Observability Engineering* (Majors et al., 2022) for customer discovery, onboarding, and ROI conversations.

---

## Interview Preparation

These resources pair well with the RESHADED framework and mock interview templates in the `interview-prep/` directory.

**Pluralsight Courses**

| Course | Description |
|--------|-------------|
| [SRE: Concepts and Principles](https://www.pluralsight.com/courses/sre-concepts-principles) | Quick refresher on SLOs, error budgets, and reliability fundamentals before interviews |
| [Cloud-native Architecture and Design Principles](https://www.pluralsight.com/courses/cloud-native-architecture-design-principles) | Architecture concepts commonly tested in system design interviews |
| [Distributed Systems: The Big Picture](https://www.pluralsight.com/courses/distributed-systems-the-big-picture) | Core distributed systems vocabulary and concepts |

**Books**

| Book | Author(s) | Year | Why It Pairs Well |
|------|-----------|------|-------------------|
| *System Design Interview, Vol. 1* | Alex Xu | 2020 | Step-by-step framework with real-world examples matching the RESHADED approach |
| *System Design Interview, Vol. 2* | Alex Xu & Sahn Lam | 2022 | 13 detailed system design problems with comprehensive solutions and 300+ diagrams |
| *Acing the System Design Interview* | Zhiyong Tan | 2024 | Manning guide with practical strategies for system design interviews |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 (classic) | The single best reference for deep system design knowledge tested in interviews |
