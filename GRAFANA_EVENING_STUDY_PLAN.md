# Grafana Evening Study Plan
**Focus:** System Architecture - Grafana Directory & Related Concepts
**Duration:** 3-4 Hours
**Date:** Evening Study Session
**Location:** `/its-my-training-day/system-design-architecture/grafana/`

---

## 📚 Study Session Overview

This evening study plan covers the Grafana ecosystem, including architecture, observability principles, the LGTM stack, and Kubernetes fundamentals. The plan is structured to maximize learning efficiency in a single evening.

---

## ⏰ Session Timeline (3-4 Hours)

### **Phase 1: Foundation Review (60 minutes)** ⏱️ 6:00 PM - 7:00 PM

#### 🎯 Objective
Build a solid understanding of Grafana's ecosystem and core architecture.

#### 📖 Reading Materials
- **File:** `shared-concepts/grafana-ecosystem.md` (943 lines, 52KB)
- **Focus Areas:**
  1. Grafana Architecture Overview (lines 1-82)
  2. Core Components: Dashboards, Panels, Data Sources (lines 84-196)
  3. Alerting Architecture (lines 198-280)
  4. Plugin Architecture (lines 416-525)

#### ✅ Learning Goals
- [ ] Understand Grafana's high-level architecture (Frontend/Backend/Database)
- [ ] Know the request flow from user browser to data source
- [ ] Identify different panel types and their use cases
- [ ] Understand the plugin system (Data Source, Panel, App plugins)
- [ ] Grasp the alerting architecture components

#### 📝 Active Learning
- **Sketch:** Draw the Grafana architecture diagram from memory
- **List:** Write down 5 panel types and when to use each
- **Explain:** In 3 sentences, explain how a query flows through Grafana

#### 🔑 Key Concepts to Master
- **Frontend:** React + TypeScript for UI
- **Backend:** Go for API server, authentication, proxying
- **Database:** SQLite/MySQL/PostgreSQL for configuration
- **Plugin Types:** Data Source, Panel, App
- **Request Flow:** Browser → Frontend → Backend → Plugin → Data Source → Response

---

### **Phase 2: Observability Principles (45 minutes)** ⏱️ 7:00 PM - 7:45 PM

#### 🎯 Objective
Master the three pillars of observability and how they work together.

#### 📖 Reading Materials
- **File:** `shared-concepts/observability-principles.md` (1,746 lines, 134KB)
- **Focus Areas:**
  1. Three Pillars: Metrics, Logs, Traces (first 400 lines)
  2. Golden Signals: Latency, Traffic, Errors, Saturation
  3. SLIs, SLOs, and SLAs
  4. Instrumentation best practices

#### ✅ Learning Goals
- [ ] Define and differentiate Metrics, Logs, and Traces
- [ ] Understand when to use each observability signal
- [ ] Master the 4 Golden Signals (Latency, Traffic, Errors, Saturation)
- [ ] Know the difference between SLI, SLO, and SLA
- [ ] Understand the debug loop: Alert → Scope → Correlate → Fix

#### 📝 Active Learning
- **Compare:** Create a table comparing metrics vs logs vs traces
- **Formula:** Write down SLO calculation examples
- **Scenario:** Given a high latency alert, describe your debug approach

#### 🔑 Key Concepts to Master
- **Metrics:** Tell you "that something happened" (counters, gauges, histograms)
- **Logs:** Tell you "why it happened" (contextual event records)
- **Traces:** Show you "where it happened" (request flow through services)
- **Golden Signals:** Essential metrics for any service
- **SLI:** Service Level Indicator (measurement)
- **SLO:** Service Level Objective (target)
- **SLA:** Service Level Agreement (promise)

---

### **🍕 Break (15 minutes)** ⏱️ 7:45 PM - 8:00 PM
- Stretch, hydrate, quick snack
- Review your notes from Phase 1 & 2
- Prepare for deep dive into LGTM stack

---

### **Phase 3: LGTM Stack Deep Dive (60 minutes)** ⏱️ 8:00 PM - 9:00 PM

#### 🎯 Objective
Understand each component of the LGTM stack and how they integrate.

#### 📖 Reading Materials
- **File:** `shared-concepts/lgtm-stack.md` (1,539 lines, 86KB)
- **Focus Areas:**
  1. **Loki** - Log aggregation system
  2. **Grafana** - Visualization layer (review)
  3. **Tempo** - Distributed tracing backend
  4. **Mimir** - Metrics storage (Prometheus long-term storage)
  5. **Pyroscope** - Continuous profiling (bonus if time allows)

#### ✅ Learning Goals
- [ ] Understand Loki's label-based indexing vs full-text indexing
- [ ] Know LogQL basics for querying logs
- [ ] Understand Tempo's architecture and TraceQL
- [ ] Know Mimir's role as scalable Prometheus storage
- [ ] Understand how LGTM components correlate (exemplars, trace IDs in logs)

#### 📝 Active Learning
- **Write:** 5 LogQL queries (filter, parse, aggregate, group by, rate)
- **Write:** 3 PromQL queries (rate, errors, p95 latency)
- **Diagram:** Draw how trace IDs link logs, metrics, and traces
- **Compare:** Loki vs Elasticsearch, Tempo vs Jaeger

#### 🔑 Key Concepts to Master
- **Loki:**
  - Label-based indexing (not full-text)
  - LogQL query language
  - Cost-effective log storage
  - Push vs Pull model (Promtail, Grafana Agent)

- **Tempo:**
  - No indexing required (trace ID based)
  - TraceQL for trace queries
  - Integration with Grafana for visualization
  - Span storage and retrieval

- **Mimir:**
  - Horizontally scalable metrics storage
  - PromQL compatible
  - Multi-tenancy support
  - Long-term metrics retention

- **Correlation:**
  - Exemplars: Link metrics to traces
  - Trace IDs in logs: Link logs to traces
  - Unified view in Grafana

---

### **Phase 4: Kubernetes Fundamentals (45 minutes)** ⏱️ 9:00 PM - 9:45 PM

#### 🎯 Objective
Understand Kubernetes concepts relevant to deploying and operating Grafana.

#### 📖 Reading Materials
- **File:** `shared-concepts/kubernetes-fundamentals.md` (2,484 lines, 102KB)
- **Focus Areas:**
  1. Core Concepts: Pods, Deployments, Services (first 600 lines)
  2. ConfigMaps and Secrets
  3. Probes: Liveness, Readiness, Startup
  4. Resource management: Requests and Limits
  5. Common failure modes (CrashLoopBackOff, ImagePullBackOff, OOMKilled)

#### ✅ Learning Goals
- [ ] Understand Pod lifecycle and common states
- [ ] Know the difference between Deployment, StatefulSet, DaemonSet
- [ ] Understand Service types: ClusterIP, NodePort, LoadBalancer
- [ ] Master ConfigMaps vs Secrets usage
- [ ] Know how to debug failing pods

#### 📝 Active Learning
- **Debug:** Write kubectl commands to debug a failing pod
- **Sketch:** Draw traffic flow: Ingress → Service → Pods
- **List:** 5 reasons a pod might be in CrashLoopBackOff
- **Compare:** When to use Deployment vs StatefulSet

#### 🔑 Key Concepts to Master
- **Pods:** Smallest deployable unit in Kubernetes
- **Deployments:** Manage stateless applications
- **StatefulSets:** Manage stateful applications (Grafana HA with DB)
- **Services:** Expose pods with stable networking
- **ConfigMaps:** Configuration data
- **Secrets:** Sensitive data (base64 encoded)
- **Probes:**
  - Liveness: Is the app alive? (restart if fails)
  - Readiness: Is the app ready for traffic?
  - Startup: Did the app start successfully?
- **Resources:**
  - Requests: Minimum guaranteed resources
  - Limits: Maximum allowed resources

---

### **Phase 5: Code Exploration & Practical Review (30 minutes)** ⏱️ 9:45 PM - 10:15 PM

#### 🎯 Objective
Bridge theory with practice by reviewing code implementations.

#### 📂 Directories to Explore
1. **`code-implementations/observability-patterns/`**
   - Review instrumentation examples
   - Check alerting configurations

2. **`code-implementations/kubernetes-configs/`**
   - Review Grafana deployment manifests
   - Check StatefulSet configurations
   - Review service definitions

3. **`code-implementations/grafana-plugins/`**
   - Skim plugin structure
   - Review `sample-datasource` plugin

#### ✅ Learning Goals
- [ ] See real-world Grafana deployment YAMLs
- [ ] Understand Grafana plugin structure
- [ ] Review practical observability instrumentation
- [ ] Connect theory from earlier phases to code

#### 📝 Active Learning
- **Read:** Grafana deployment YAML - identify all components
- **Trace:** Follow a data source plugin request flow
- **Note:** Write down 3 interesting patterns you discovered

#### 🔑 Key Takeaways
- How Grafana is actually deployed in Kubernetes
- Plugin development structure and patterns
- Practical alerting rule configurations
- Instrumentation best practices in code

---

### **Phase 6: Quiz & Review (15 minutes)** ⏱️ 10:15 PM - 10:30 PM

#### 🎯 Objective
Solidify learning through self-testing and knowledge synthesis.

#### 📝 Self-Quiz Questions

**Grafana Architecture:**
1. What are the three main components of Grafana architecture?
2. Describe the request flow from user to data source
3. What are the three types of Grafana plugins?
4. What databases can Grafana use for configuration storage?

**Observability:**
5. What are the three pillars of observability?
6. Define the 4 Golden Signals
7. What's the difference between SLI, SLO, and SLA?
8. When would you use metrics vs logs vs traces?

**LGTM Stack:**
9. Why does Loki use label-based indexing instead of full-text?
10. What is Mimir and how does it relate to Prometheus?
11. What is Tempo's unique approach to trace storage?
12. How do exemplars correlate metrics to traces?

**Kubernetes:**
13. What's the difference between a Deployment and a StatefulSet?
14. What are the three types of Kubernetes probes?
15. What's the difference between resource requests and limits?
16. Name 5 common pod failure states

#### ✅ Review Checklist
- [ ] Can you draw Grafana's architecture from memory?
- [ ] Can you explain the three pillars to someone else?
- [ ] Do you understand each LGTM component's purpose?
- [ ] Can you deploy Grafana to Kubernetes conceptually?
- [ ] Have you noted any gaps for follow-up study?

---

## 📊 Study Tracking

### ✅ Completion Checklist

#### Phase 1: Foundation Review
- [ ] Read grafana-ecosystem.md key sections
- [ ] Drew architecture diagram
- [ ] Listed panel types and use cases
- [ ] Understood request flow

#### Phase 2: Observability Principles
- [ ] Understand three pillars
- [ ] Mastered Golden Signals
- [ ] Differentiated SLI/SLO/SLA
- [ ] Know the debug loop

#### Phase 3: LGTM Stack
- [ ] Understand Loki architecture
- [ ] Understand Tempo architecture
- [ ] Understand Mimir architecture
- [ ] Wrote example queries
- [ ] Understand correlation mechanisms

#### Phase 4: Kubernetes Fundamentals
- [ ] Understand core K8s resources
- [ ] Know probe types
- [ ] Understand resource management
- [ ] Can debug pod failures

#### Phase 5: Code Exploration
- [ ] Reviewed deployment YAMLs
- [ ] Explored plugin structure
- [ ] Checked observability patterns

#### Phase 6: Quiz & Review
- [ ] Completed self-quiz
- [ ] Identified knowledge gaps
- [ ] Created follow-up list

---

## 🎯 Success Criteria

By the end of this study session, you should be able to:

1. **Explain Grafana's architecture** to a colleague
2. **Differentiate between the three pillars** of observability
3. **Describe each LGTM component** and their purposes
4. **Deploy Grafana to Kubernetes** (conceptually)
5. **Debug common issues** using metrics, logs, and traces
6. **Write basic queries** in PromQL and LogQL
7. **Understand plugin architecture** and extensibility

---

## 📚 Quick Reference Cheat Sheet

### Grafana Core Components
```
Frontend (React) → Backend (Go) → Database (SQLite/MySQL/PostgreSQL)
                 ↓
           Data Source Plugins
                 ↓
         External Data Backends
```

### Three Pillars of Observability
| Pillar  | Answers        | Tools         | Query Language |
|---------|----------------|---------------|----------------|
| Metrics | "What" & "When"| Prometheus/Mimir | PromQL      |
| Logs    | "Why"          | Loki          | LogQL          |
| Traces  | "Where"        | Tempo         | TraceQL        |

### Golden Signals (Google SRE)
1. **Latency** - How long requests take
2. **Traffic** - How many requests
3. **Errors** - How many requests fail
4. **Saturation** - How "full" the service is

### LGTM Stack Quick Reference
- **L**oki - Log aggregation (label-based indexing)
- **G**rafana - Visualization & dashboards
- **T**empo - Distributed tracing (no indexing)
- **M**imir - Metrics storage (scalable Prometheus)

### Kubernetes Resources for Grafana
```yaml
Deployment     # Grafana application
Service        # Expose Grafana
ConfigMap      # Grafana configuration
Secret         # Database passwords, API keys
Ingress        # External access
PVC            # Persistent storage
```

### Essential kubectl Commands
```bash
# Debug pods
kubectl get pods -n monitoring
kubectl describe pod <pod-name> -n monitoring
kubectl logs <pod-name> -n monitoring
kubectl exec -it <pod-name> -n monitoring -- /bin/sh

# Check resources
kubectl top pods -n monitoring
kubectl get events -n monitoring --sort-by='.lastTimestamp'
```

---

## 🔄 Follow-Up Study (After This Session)

### Priority 1 (Next Study Session)
- [ ] Deep dive into one role-specific study guide
- [ ] Complete hands-on labs with LGTM stack
- [ ] Practice writing PromQL and LogQL queries
- [ ] Deploy Grafana locally with Docker

### Priority 2 (This Week)
- [ ] Review deployment patterns and HA architecture
- [ ] Study authentication and authorization in depth
- [ ] Explore advanced alerting strategies
- [ ] Practice Kubernetes troubleshooting scenarios

### Priority 3 (Long Term)
- [ ] Build a sample plugin
- [ ] Set up a full LGTM stack environment
- [ ] Work through role-specific interview questions
- [ ] Contribute to Grafana open source

---

## 💡 Study Tips for Maximum Retention

### Active Learning Techniques
1. **Feynman Technique:** Explain concepts in simple terms
2. **Spaced Repetition:** Review notes tomorrow, in 3 days, in a week
3. **Practice Recall:** Close the book and write what you remember
4. **Teach Others:** Explain concepts to colleagues or rubber duck

### Focus Strategies
- ⏱️ **Pomodoro Technique:** 25 min focus + 5 min break
- 🔕 **Eliminate Distractions:** Phone away, notifications off
- 📝 **Take Notes:** Write by hand for better retention
- 🎯 **Set Micro-Goals:** Check off each learning goal as complete

### Retention Boosters
- 🏃 **Take Breaks:** Your brain consolidates during rest
- 💧 **Stay Hydrated:** Water helps cognitive function
- 🔄 **Review Summary:** End with 5-minute recap
- 📖 **Sleep on It:** Sleep helps memory consolidation

---

## 📝 Notes Section

### Key Insights
_Use this space to write down "aha!" moments during your study:_

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Questions to Research Later
_Write down questions that come up during study:_

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Connections to Real Work
_How does this knowledge apply to your current projects?_

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 🏆 Completion

**Study Session Completed:** __________ (Date & Time)

**Self-Assessment (1-5):**
- Understanding of Grafana architecture: ___/5
- Grasp of observability principles: ___/5
- Knowledge of LGTM stack: ___/5
- Kubernetes deployment understanding: ___/5
- Overall confidence: ___/5

**Next Study Focus:** _________________________________

---

**Remember:** The goal isn't to memorize everything, but to build mental models you can refer back to. Focus on understanding concepts and connections rather than memorizing details!

🚀 **Happy studying!**
