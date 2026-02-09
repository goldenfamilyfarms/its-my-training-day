# 📘 Grafana Day 1 Evening Study Plan
**Focus:** Building a Strong Foundation in Grafana & Observability
**Duration:** 2.5-3 Hours
**Difficulty:** Beginner-Friendly
**Goal:** Understand the "why" and "what" before diving into the "how"

---

## 🎯 Day 1 Mission

By the end of tonight, you'll be able to:
- ✅ Explain what Grafana is and why it exists
- ✅ Describe the three pillars of observability
- ✅ Understand the LGTM stack at a high level
- ✅ Recognize when to use metrics vs logs vs traces
- ✅ Have a mental model of Grafana's architecture

**Philosophy for Day 1:** Focus on understanding concepts and building mental models. Don't try to memorize details—that comes with practice.

---

## ⏰ Evening Timeline (2.5-3 Hours)

### **Part 1: What is Observability? (30 min)** ⏱️ 6:00 PM - 6:30 PM

#### 🎯 The Big Question
**"Why do we need Grafana and observability tools?"**

#### 📖 Reading
- **File:** `system-design-architecture/grafana/shared-concepts/observability-principles.md`
- **Read:** Introduction + "Three Pillars of Observability" section (first ~300 lines)

#### 🧠 Core Concepts to Understand

**The Three Pillars:**

1. **Metrics** 📊
   - **What:** Numbers that change over time (CPU usage, request count, error rate)
   - **When:** You need to know "what's happening" and "is it normal?"
   - **Example:** "Our API response time is 250ms (yesterday it was 100ms)"
   - **Tool:** Prometheus/Mimir

2. **Logs** 📝
   - **What:** Text records of events (error messages, user actions, system events)
   - **When:** You need to know "why did this happen?"
   - **Example:** "User login failed because password was incorrect"
   - **Tool:** Loki

3. **Traces** 🔍
   - **What:** Journey of a request through multiple services
   - **When:** You need to know "where is the bottleneck?"
   - **Example:** "The checkout took 2 seconds—1.8 seconds was in the payment service"
   - **Tool:** Tempo

#### ✍️ Active Learning Exercise (10 minutes)

**Scenario:** Your website is slow for some users.

Draw a simple flowchart showing how you'd use each pillar:
```
1. METRICS: Notice high response time (Dashboard alerts you)
2. TRACES: Find which service is slow (Payment service is taking 5 seconds)
3. LOGS: Discover why (Payment gateway timeout errors in logs)
```

**Write down in your own words:**
- When would you check metrics first? _______________
- When would you jump straight to logs? _______________
- When would traces be most helpful? _______________

#### 🔑 Key Takeaway
> "Metrics tell you WHAT is wrong, Traces show you WHERE, and Logs explain WHY."

---

### **Part 2: The Golden Signals (30 min)** ⏱️ 6:30 PM - 7:00 PM

#### 🎯 The Essential Metrics
Learn the 4 metrics that matter for any service (from Google's SRE book).

#### 📖 Reading
- **File:** `system-design-architecture/grafana/shared-concepts/observability-principles.md`
- **Section:** "Golden Signals" or "Key Metrics Patterns"

#### 🧠 The 4 Golden Signals

| Signal | What It Measures | Example Query (PromQL) | Why It Matters |
|--------|------------------|------------------------|----------------|
| **Latency** | How long requests take | `histogram_quantile(0.95, rate(http_request_duration_seconds[5m]))` | Users hate slow apps |
| **Traffic** | How many requests | `rate(http_requests_total[5m])` | Shows demand/usage |
| **Errors** | How many fail | `rate(http_requests_total{status=~"5.."}[5m])` | Broken = bad |
| **Saturation** | How "full" you are | `node_memory_usage / node_memory_total` | Predicts future issues |

#### ✍️ Active Learning Exercise (15 minutes)

**For each signal, write a real-world analogy:**

1. **Latency** = _______________ (Example: "How long you wait in line at coffee shop")
2. **Traffic** = _______________ (Example: "How many customers enter the shop")
3. **Errors** = _______________ (Example: "How many orders are made wrong")
4. **Saturation** = _______________ (Example: "How close to running out of coffee beans")

**Quick Quiz (answer without looking):**
- Your service has high CPU but no user complaints. Which signal is this? _______________
- Users report errors but your dashboards look fine. What signal might be missing? _______________
- Response times are getting slower. Which signal shows this? _______________

#### 🔑 Key Takeaway
> "If you can only monitor 4 things, make it these 4. They catch 95% of problems."

---

### **🍕 Break (15 min)** ⏱️ 7:00 PM - 7:15 PM
- Stand up and stretch
- Grab water/snack
- Review your notes: Can you explain the 3 pillars to a rubber duck?

---

### **Part 3: What is Grafana? (45 min)** ⏱️ 7:15 PM - 8:00 PM

#### 🎯 Understanding the Tool
Now that you know WHY observability matters, learn WHAT Grafana does.

#### 📖 Reading
- **File:** `system-design-architecture/grafana/shared-concepts/grafana-ecosystem.md`
- **Sections to read:**
  - "Grafana Architecture Overview" (lines 1-82)
  - "Core Components" → Dashboards, Panels, Data Sources (lines 84-196)
  - Skip detailed config for now—focus on concepts

#### 🧠 Core Concepts

**What is Grafana?**
> A visualization platform that connects to data sources and displays the data in dashboards.

**The 3-Layer Architecture:**

```
┌─────────────────────────────────────┐
│  Layer 1: FRONTEND (React)          │  ← What you see in browser
│  - Dashboards, panels, graphs       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│  Layer 2: BACKEND (Go)              │  ← The brains
│  - API server, auth, query routing  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│  Layer 3: DATA SOURCES (Plugins)    │  ← Where data lives
│  - Prometheus, Loki, Tempo, etc.    │
└─────────────────────────────────────┘
```

**Request Flow (Simplified):**
```
User clicks on dashboard
    ↓
Frontend asks Backend for data
    ↓
Backend asks Data Source (via plugin)
    ↓
Data Source queries database (Prometheus/Loki/etc)
    ↓
Results flow back up the chain
    ↓
Frontend renders pretty graphs
```

#### 🧠 Key Components Explained Simply

**1. Dashboards**
- Container for panels (like a canvas)
- Has time range controls (last 6 hours, last 24 hours, etc.)
- Can have variables ($environment, $region, etc.)

**2. Panels**
- Individual graphs/visualizations
- Types: Time series (line graph), Stat (single number), Table, Gauge, etc.
- Each panel has a query that fetches data

**3. Data Sources**
- Connection to where data actually lives
- Examples: Prometheus (metrics), Loki (logs), Tempo (traces)
- Configured once, used in many dashboards

#### ✍️ Active Learning Exercise (15 minutes)

**Draw this from memory:**
```
┌──────────────────────────────────────────────┐
│              GRAFANA DASHBOARD                │
├──────────────────────────────────────────────┤
│  Time Range: [Last 6 hours ▼]               │
├─────────────────────┬────────────────────────┤
│  Panel 1            │  Panel 2               │
│  [Line Graph]       │  [Number]              │
│  CPU Usage          │  Total Requests        │
│                     │  1.2M                  │
├─────────────────────┴────────────────────────┤
│  Panel 3                                     │
│  [Table]                                     │
│  Recent Errors                               │
└──────────────────────────────────────────────┘
```

**Answer these:**
1. If you want to see CPU usage for the last hour, what do you change? _______________
2. To show data from Prometheus, you need a _______________ configured
3. Each panel contains a _______________ that fetches data

#### 🔑 Key Takeaway
> "Grafana is the window into your data. It doesn't store data—it visualizes data from other systems."

---

### **Part 4: The LGTM Stack (Big Picture) (45 min)** ⏱️ 8:00 PM - 8:45 PM

#### 🎯 Understanding the Full Picture
Grafana is part of a larger ecosystem. Learn what each piece does.

#### 📖 Reading
- **File:** `system-design-architecture/grafana/shared-concepts/lgtm-stack.md`
- **Focus:** Introduction + overview of each component (first 500 lines)
- **Don't worry about:** Detailed configurations, advanced queries (that's for later)

#### 🧠 The LGTM Stack Explained

**L** = **Loki** (Logs)
- **What:** Log aggregation system
- **Key Feature:** Doesn't index log content, only labels (cheaper than Elasticsearch)
- **Query Language:** LogQL (looks like PromQL)
- **Use Case:** "Show me all errors from the payment service in the last hour"

**G** = **Grafana** (Visualization)
- **What:** Dashboard and visualization tool
- **Key Feature:** Single pane of glass for all your data
- **Use Case:** "I want to see metrics, logs, and traces in one place"

**T** = **Tempo** (Traces)
- **What:** Distributed tracing backend
- **Key Feature:** Doesn't index traces, finds by trace ID (very cheap)
- **Query Language:** TraceQL
- **Use Case:** "Show me the journey of request ID abc123 through all services"

**M** = **Mimir** (Metrics)
- **What:** Long-term storage for Prometheus metrics
- **Key Feature:** Horizontally scalable, multi-tenant
- **Query Language:** PromQL (same as Prometheus)
- **Use Case:** "I need to store 2 years of metrics for 10,000 services"

#### 🧠 How They Work Together

**Scenario: Debugging a Slow Checkout**

```
Step 1: Grafana Dashboard shows high latency (Metric from Mimir)
   ↓
Step 2: Click on the spike, see trace (Trace from Tempo)
   ↓
Step 3: Trace shows payment service is slow
   ↓
Step 4: Jump to logs for payment service (Logs from Loki)
   ↓
Step 5: Logs show "Database timeout" errors
   ↓
Step 6: Fix database connection pool
```

**The Magic: Correlation**
- Metrics have **exemplars** (links to traces)
- Logs have **trace IDs** (links to traces)
- Traces have **span IDs** (links to logs)
- All connected in Grafana!

#### ✍️ Active Learning Exercise (20 minutes)

**Fill in the blanks:**

| Component | Stores | Query Language | Best For |
|-----------|--------|----------------|----------|
| Loki | _________ | LogQL | Finding why errors happened |
| Grafana | _________ | N/A (uses others) | _________ |
| Tempo | Traces | _________ | Finding slow services |
| Mimir | _________ | PromQL | _________ |

**Matching Game:**
Match the tool to the question it answers:

Questions:
1. "What's our 95th percentile latency?"
2. "Why did this specific request fail?"
3. "Which service in the chain was slowest?"
4. "Show me all errors containing 'timeout'"

Tools: Loki, Grafana, Tempo, Mimir

Answers:
1. _____________
2. _____________
3. _____________
4. _____________

#### 🔑 Key Takeaway
> "LGTM is a complete observability stack. Each component specializes in one pillar and they all talk to each other."

---

### **Part 5: Hands-On Visualization (20 min)** ⏱️ 8:45 PM - 9:05 PM

#### 🎯 See It In Action (Even Without Installing)

#### 🖥️ Option 1: Grafana Play (No Installation)
Visit: `https://play.grafana.org/`
- Pre-configured Grafana instance
- Real data sources
- Explore dashboards
- Try creating a simple panel

#### ✍️ Things to Try (15 minutes)

**Task 1: Explore a Dashboard**
1. Open any dashboard from the left sidebar
2. Identify: How many panels? What time range?
3. Click on a panel → "Edit" → Look at the query
4. Change the time range (top right)

**Task 2: Create a Simple Panel**
1. Click "+" → "Dashboard" → "Add visualization"
2. Select "Prometheus" as data source
3. Try a simple query: `up` (shows which services are running)
4. Change visualization type (time series → stat → gauge)

**Task 3: Understand a Query**
Find a panel with a PromQL query like:
```
rate(http_requests_total[5m])
```
Break it down:
- `http_requests_total` = metric name
- `[5m]` = look at last 5 minutes
- `rate()` = calculate per-second rate

#### 📝 Write Down Your Observations
1. What was intuitive about the UI? _______________
2. What was confusing? _______________
3. What type of panel would you use for error count? _______________

---

### **Part 6: Day 1 Review & Next Steps (15 min)** ⏱️ 9:05 PM - 9:20 PM

#### 🎯 Consolidate Your Learning

#### 📝 The "Explain to a 5-Year-Old" Test

Write 1-2 sentences for each (without looking at notes):

**What is observability?**
_________________________________________

**What are the three pillars?**
_________________________________________

**What does Grafana do?**
_________________________________________

**What is the LGTM stack?**
_________________________________________

**What are the Golden Signals?**
_________________________________________

#### ✅ Day 1 Completion Checklist

Core Concepts:
- [ ] I understand why observability matters
- [ ] I can explain metrics, logs, and traces
- [ ] I know the 4 Golden Signals
- [ ] I understand what Grafana is (and isn't)
- [ ] I know what each LGTM component does
- [ ] I've seen a real Grafana dashboard

Practical Skills:
- [ ] I can identify when to use metrics vs logs vs traces
- [ ] I can read a simple PromQL query
- [ ] I know what a dashboard, panel, and data source are
- [ ] I understand how LGTM components connect

#### 🎯 Tonight's Key Wins

You now have a mental model of:
1. ✅ **The Problem Space:** Why we need observability
2. ✅ **The Solution:** What Grafana and LGTM provide
3. ✅ **The Components:** How each piece fits together
4. ✅ **The Practice:** What it looks like in real life

---

## 🔮 Preview: What's Next?

### Day 2 Topics (Future Session)
- **Deeper into Kubernetes:** How Grafana runs in production
- **Query Languages:** Write PromQL and LogQL queries
- **Alerting:** Setting up alerts that matter
- **Architecture Deep Dive:** HA, scaling, deployment patterns

### Day 3 Topics (Future Session)
- **Plugin Development:** How to extend Grafana
- **Advanced Dashboards:** Variables, templating, annotations
- **Code Implementations:** Hands-on with real configs
- **Role-Specific Content:** Choose your learning path

---

## 📚 Quick Reference Card (Print/Screenshot This!)

### The 3 Pillars
```
📊 METRICS → "What & When" → Prometheus/Mimir → PromQL
📝 LOGS    → "Why"         → Loki           → LogQL
🔍 TRACES  → "Where"       → Tempo          → TraceQL
```

### The 4 Golden Signals
```
⏱️  Latency:    How long?
📈 Traffic:    How many?
❌ Errors:     How many failed?
💾 Saturation: How full?
```

### Grafana Architecture
```
Frontend (React) → Backend (Go) → Data Sources (Plugins) → Databases
```

### LGTM Stack
```
Loki    = Log storage (cheap, label-based)
Grafana = Visualization (single pane of glass)
Tempo   = Trace storage (cheap, ID-based)
Mimir   = Metric storage (scalable Prometheus)
```

### When to Use What?
```
Dashboard looks weird     → Check METRICS
Known issue, need context → Check LOGS
Slow multi-service flow   → Check TRACES
```

---

## 💡 Study Tips That Actually Work

### ✅ Do This
- **Take breaks:** Your brain needs processing time
- **Explain out loud:** Pretend you're teaching someone
- **Draw diagrams:** Visual memory is powerful
- **Connect to your work:** "How would I use this at my job?"
- **Sleep on it:** Tomorrow, review these notes for 10 minutes

### ❌ Don't Do This
- **Don't memorize:** Understand concepts, not details
- **Don't rush:** Better to understand 3 things than skim 10
- **Don't skip exercises:** Active learning > passive reading
- **Don't multitask:** Phone away, notifications off

---

## 🏆 Day 1 Complete!

**How do you feel?** (Circle one)
- 😰 Overwhelmed (that's normal! It gets easier)
- 😐 Confused (review Part 1-2 tomorrow)
- 🙂 Understanding the basics (great job!)
- 😄 Confident (you're crushing it!)

**Self-Assessment (1-5 scale):**
- Understanding of observability concept: ___/5
- Knowledge of three pillars: ___/5
- Familiarity with Grafana: ___/5
- Understanding of LGTM stack: ___/5
- Overall confidence: ___/5

**Most interesting thing I learned:**
_________________________________________

**Biggest question I still have:**
_________________________________________

**How I'll use this knowledge:**
_________________________________________

---

## 📝 Notes Space

### "Aha!" Moments
1. _________________________________________
2. _________________________________________
3. _________________________________________

### Things to Research Later
1. _________________________________________
2. _________________________________________

### Connections to My Work
1. _________________________________________
2. _________________________________________

---

## 🚀 Action Items Before Day 2

**Optional (but recommended):**
- [ ] Review your notes for 10 minutes tomorrow morning
- [ ] Watch a 10-minute YouTube video on "Grafana basics"
- [ ] Explore play.grafana.org for 15 more minutes
- [ ] Join Grafana Community Slack or forum (links in README)
- [ ] Think of a real problem at work you could solve with observability

**Required:**
- [ ] Read over this study guide one more time
- [ ] Make sure you can explain the 3 pillars to someone
- [ ] Get excited for Day 2! 🎉

---

**Remember:** You're building expertise, not cramming for a test. Understanding beats memorization every time.

**Session Completed:** __________ (Date & Time)

**Ready for Day 2:** [ ] Yes [ ] Review Day 1 first [ ] Need a break

---

🎉 **Congratulations on completing Day 1!** You've taken the first big step toward mastering Grafana and observability. Keep going—you've got this! 💪
