# Alerting Configuration Examples

This directory contains comprehensive alerting configuration examples for both Prometheus and Grafana, demonstrating best practices commonly discussed in Grafana observability architect interviews.

## Overview

Effective alerting is crucial for maintaining service reliability. This guide covers:

- **Prometheus Alerting Rules**: Native Prometheus alerting with recording rules
- **Grafana Unified Alerting**: Grafana 10.x+ alerting with contact points and notification policies

## Directory Structure

```
alerting/
├── README.md                    # This file
├── prometheus/
│   └── alerts.yaml              # Prometheus alerting and recording rules
└── grafana/
    └── alerts.json              # Grafana alert definitions (provisioning format)
```

## Key Concepts

### SLO-Based Alerting

Service Level Objective (SLO) based alerting focuses on user-facing impact rather than infrastructure metrics:

| Concept | Description |
|---------|-------------|
| **Error Budget** | Allowable amount of unreliability (e.g., 0.1% for 99.9% SLO) |
| **Burn Rate** | Rate at which error budget is being consumed |
| **Multi-Window** | Using multiple time windows to reduce false positives |

### Multi-Window Burn Rate Alerts

Based on Google SRE practices, multi-window alerts use two time windows to balance speed and accuracy:

| Alert Type | Short Window | Long Window | Budget Consumed | Time to Exhaust |
|------------|--------------|-------------|-----------------|-----------------|
| Fast Burn | 5m | 1h | 2% | ~1 hour |
| Slow Burn | 30m | 6h | 10% | ~3 days |

### USE Method for Resources

The USE (Utilization, Saturation, Errors) method provides comprehensive resource monitoring:

| Metric | Description | Example |
|--------|-------------|---------|
| **Utilization** | % time resource is busy | CPU usage % |
| **Saturation** | Amount of work queued | Memory pressure |
| **Errors** | Error events | Disk I/O errors |

### RED Method for Services

The RED (Rate, Errors, Duration) method focuses on service-level metrics:

| Metric | Description | Example |
|--------|-------------|---------|
| **Rate** | Requests per second | HTTP request rate |
| **Errors** | Failed requests | 5xx responses |
| **Duration** | Request latency | p99 response time |

## Prometheus Alerting Rules

### Recording Rules

Recording rules pre-compute expensive queries for efficiency:

```yaml
# Pre-compute error rate at multiple windows
- record: job:http_requests:error_rate_5m
  expr: |
    sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))
    /
    sum by (job) (rate(http_requests_total[5m]))
```

### Alert Rules

Alert rules define conditions and notifications:

```yaml
- alert: SLOErrorBudgetFastBurn
  expr: |
    job:http_requests:error_rate_5m > (14.4 * 0.001)
    and
    job:http_requests:error_rate_1h > (14.4 * 0.001)
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate burning SLO budget rapidly"
```

### Key Features in prometheus/alerts.yaml

1. **Recording Rules**: Pre-computed metrics for SLO calculations
2. **SLO Alerts**: Multi-window burn rate alerts for availability and latency
3. **Resource Alerts**: USE method alerts for CPU, memory, and disk
4. **Application Alerts**: Service health, traffic anomalies, goroutine monitoring
5. **Kubernetes Alerts**: Pod crashes, deployment issues, PVC problems

## Grafana Unified Alerting

### Alert Rule Structure

Grafana alerts use a query-condition model:

```json
{
  "uid": "slo-availability-fast-burn",
  "title": "SLO Availability - Fast Burn",
  "condition": "C",
  "data": [
    {
      "refId": "A",
      "datasourceUid": "prometheus",
      "model": {
        "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
      }
    }
  ],
  "for": "2m",
  "labels": {
    "severity": "critical"
  }
}
```

### Contact Points

Contact points define notification destinations:

- **Slack**: Channel-based notifications with severity routing
- **PagerDuty**: On-call escalation for critical alerts
- **Email**: Team notifications with business hours filtering

### Notification Policies

Policies route alerts to appropriate contact points:

```json
{
  "receiver": "slack-warning",
  "group_by": ["alertname", "job"],
  "routes": [
    {
      "receiver": "pagerduty-critical",
      "matchers": ["severity=critical"]
    }
  ]
}
```

### Mute Time Intervals

Suppress non-critical alerts during specific periods:

- **Outside Business Hours**: Mute warnings after 6 PM
- **Maintenance Windows**: Suppress alerts during planned maintenance

## Usage

### Prometheus

1. Copy `prometheus/alerts.yaml` to your Prometheus rules directory
2. Update `prometheus.yml` to include the rules file:
   ```yaml
   rule_files:
     - "alerts.yaml"
   ```
3. Reload Prometheus configuration

### Grafana

1. Copy `grafana/alerts.json` to Grafana provisioning directory
2. Configure environment variables for contact points:
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
   export PAGERDUTY_INTEGRATION_KEY="your-key"
   ```
3. Restart Grafana to load provisioned alerts

## Best Practices Demonstrated

### Alert Design
- ✅ Base alerts on SLOs and error budgets
- ✅ Use multi-window alerting to reduce noise
- ✅ Include actionable runbook links in annotations
- ✅ Use appropriate severity levels (critical, warning, info)

### Notification Routing
- ✅ Route critical alerts to PagerDuty for immediate response
- ✅ Send warnings to Slack for visibility
- ✅ Use mute intervals to prevent alert fatigue
- ✅ Group related alerts to reduce notification volume

### Recording Rules
- ✅ Pre-compute expensive queries
- ✅ Use consistent naming conventions
- ✅ Document rule purpose and usage

## Interview Discussion Points

1. **Why use multi-window burn rate alerts?**
   - Reduces false positives while maintaining fast detection
   - Balances alert sensitivity with noise reduction

2. **How do you set appropriate thresholds?**
   - Start with SLO targets and work backwards
   - Use historical data to tune thresholds
   - Iterate based on alert quality metrics

3. **What's the difference between Prometheus and Grafana alerting?**
   - Prometheus: Native, lightweight, PromQL-based
   - Grafana: Multi-datasource, rich UI, unified notification management

4. **How do you handle alert fatigue?**
   - Use multi-window alerts
   - Implement proper severity levels
   - Configure mute intervals
   - Group related alerts

## Related Resources

- [Prometheus Alerting Documentation](https://prometheus.io/docs/alerting/latest/overview/)
- [Grafana Alerting Documentation](https://grafana.com/docs/grafana/latest/alerting/)
- [Google SRE Book - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Observability Principles](../../shared-concepts/observability-principles.md)
