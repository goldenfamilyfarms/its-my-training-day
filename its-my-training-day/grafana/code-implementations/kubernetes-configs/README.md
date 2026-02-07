# Kubernetes Configuration Examples

This directory contains Kubernetes configuration examples and manifests for deploying and managing observability infrastructure. These examples demonstrate best practices for deploying Grafana, Loki, and other LGTM stack components in production Kubernetes environments.

## Purpose

The configurations in this directory serve as practical references for:

- **Interview Preparation**: Understanding Kubernetes deployment patterns commonly discussed in Grafana Labs interviews
- **Hands-on Practice**: Deploying observability tools in local or cloud Kubernetes clusters
- **Best Practices**: Learning production-ready configuration patterns for observability infrastructure
- **Architecture Understanding**: Grasping how different Kubernetes resources work together in observability contexts

## Directory Structure

```
kubernetes-configs/
├── README.md                    # This file
├── deployments/                 # Deployment manifests
│   ├── grafana-deployment.yaml  # Grafana server deployment
│   └── simple-app.yaml          # Sample application for testing
├── statefulsets/                # StatefulSet examples
│   └── loki-statefulset.yaml    # Loki with persistent storage
├── operators/                   # Operator and CRD examples
│   ├── crd-example.yaml         # Custom Resource Definition
│   └── operator-controller.go   # Basic operator controller skeleton
└── services/                    # Service and networking
    ├── services.yaml            # ClusterIP and LoadBalancer examples
    └── ingress.yaml             # Ingress configuration
```

## Configurations Included

### Deployments

Standard Kubernetes Deployments for stateless observability components:

| File | Description |
|------|-------------|
| `grafana-deployment.yaml` | Production-ready Grafana deployment with resource limits, probes, and ConfigMaps |
| `simple-app.yaml` | Sample instrumented application for testing observability pipelines |

### StatefulSets

StatefulSet configurations for stateful components requiring persistent storage:

| File | Description |
|------|-------------|
| `loki-statefulset.yaml` | Loki deployment with persistent volume claims for log storage |

### Operators and CRDs

Custom Resource Definitions and operator patterns:

| File | Description |
|------|-------------|
| `crd-example.yaml` | Example CRD for managing observability resources declaratively |
| `operator-controller.go` | Go skeleton for building Kubernetes operators |

### Services and Networking

Service discovery and external access configurations:

| File | Description |
|------|-------------|
| `services.yaml` | ClusterIP and LoadBalancer service examples |
| `ingress.yaml` | Ingress rules for external access to Grafana dashboards |

## Prerequisites

Before using these configurations, ensure you have:

### Required Tools

1. **kubectl** (v1.25+)
   ```bash
   # Verify installation
   kubectl version --client
   ```

2. **Kubernetes Cluster** - One of the following:
   - **Local Development**: [minikube](https://minikube.sigs.k8s.io/), [kind](https://kind.sigs.k8s.io/), or [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **Cloud Providers**: GKE, EKS, AKS, or any managed Kubernetes service
   - **Self-managed**: kubeadm-based clusters

3. **Helm** (optional, for some examples)
   ```bash
   # Verify installation
   helm version
   ```

### Cluster Requirements

- Kubernetes version 1.25 or higher
- At least 4GB RAM available for observability stack
- Storage class configured for persistent volumes (for StatefulSets)
- RBAC enabled (default in most clusters)

### Quick Cluster Setup (Local Development)

```bash
# Using minikube
minikube start --memory=4096 --cpus=2

# Using kind
kind create cluster --name observability-lab

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

## Usage

### Applying Configurations

```bash
# Apply a single configuration
kubectl apply -f deployments/grafana-deployment.yaml

# Apply all configurations in a directory
kubectl apply -f deployments/

# Apply with a specific namespace
kubectl apply -f deployments/grafana-deployment.yaml -n monitoring

# Dry-run to validate without applying
kubectl apply -f deployments/grafana-deployment.yaml --dry-run=client
```

### Creating a Namespace

```bash
# Create a dedicated namespace for observability
kubectl create namespace monitoring

# Set as default namespace for current context
kubectl config set-context --current --namespace=monitoring
```

### Verifying Deployments

```bash
# Check deployment status
kubectl get deployments -n monitoring

# Check pod status
kubectl get pods -n monitoring

# View pod logs
kubectl logs -f deployment/grafana -n monitoring

# Describe a resource for troubleshooting
kubectl describe deployment grafana -n monitoring
```

### Accessing Services

```bash
# Port-forward to access Grafana locally
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Access via browser: http://localhost:3000

# For LoadBalancer services, get external IP
kubectl get svc grafana -n monitoring
```

### Testing Configurations

```bash
# Validate YAML syntax
kubectl apply -f deployments/grafana-deployment.yaml --dry-run=client -o yaml

# Check resource quotas and limits
kubectl describe resourcequota -n monitoring

# View events for troubleshooting
kubectl get events -n monitoring --sort-by='.lastTimestamp'
```

## Best Practices for Kubernetes Deployments in Observability

### 1. Resource Management

Always define resource requests and limits:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Why**: Prevents resource contention and enables proper scheduling. Critical for observability tools that can consume significant resources during high-load periods.

### 2. Health Probes

Configure liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Why**: Ensures Kubernetes can detect unhealthy pods and route traffic only to ready instances.

### 3. Configuration Management

Use ConfigMaps and Secrets for configuration:

```yaml
# ConfigMap for non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
data:
  grafana.ini: |
    [server]
    root_url = https://grafana.example.com

# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: grafana-secrets
type: Opaque
stringData:
  admin-password: "secure-password"
```

**Why**: Separates configuration from container images, enabling environment-specific deployments.

### 4. Persistent Storage

Use PersistentVolumeClaims for stateful data:

```yaml
volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "standard"
      resources:
        requests:
          storage: 10Gi
```

**Why**: Ensures data survives pod restarts and enables proper data retention for logs and metrics.

### 5. High Availability

Deploy multiple replicas with anti-affinity:

```yaml
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: grafana
                topologyKey: kubernetes.io/hostname
```

**Why**: Distributes pods across nodes for fault tolerance.

### 6. Security Context

Run containers with minimal privileges:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 472
  fsGroup: 472
  readOnlyRootFilesystem: true
```

**Why**: Reduces attack surface and follows the principle of least privilege.

### 7. Network Policies

Restrict network access:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: grafana-network-policy
spec:
  podSelector:
    matchLabels:
      app: grafana
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
      ports:
        - port: 3000
```

**Why**: Limits blast radius of potential security breaches.

### 8. Observability for Observability

Monitor your monitoring stack:

- Deploy Prometheus to scrape metrics from Grafana, Loki, and other components
- Set up alerts for observability infrastructure health
- Use separate clusters or namespaces for meta-monitoring

## Troubleshooting

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Pod stuck in Pending | `kubectl describe pod <name>` | Check resource availability, node selectors |
| CrashLoopBackOff | `kubectl logs <pod> --previous` | Check application logs, probe configuration |
| ImagePullBackOff | `kubectl describe pod <name>` | Verify image name, registry credentials |
| PVC stuck in Pending | `kubectl describe pvc <name>` | Check storage class, provisioner |

### Useful Commands

```bash
# Get all resources in namespace
kubectl get all -n monitoring

# Watch pod status changes
kubectl get pods -n monitoring -w

# Execute into a pod for debugging
kubectl exec -it <pod-name> -n monitoring -- /bin/sh

# View resource usage
kubectl top pods -n monitoring
kubectl top nodes
```

## Related Resources

- [Shared Concepts: Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)
- [Shared Concepts: Observability Principles](../../shared-concepts/observability-principles.md)
- [Study Guide: Associate Observability Architect](../../study-guides/03-associate-observability-architect/)
- [Study Guide: Senior Observability Architect](../../study-guides/04-observability-architect-senior/)

## External References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Grafana Kubernetes Deployment Guide](https://grafana.com/docs/grafana/latest/setup-grafana/installation/kubernetes/)
- [Loki Helm Chart](https://grafana.com/docs/loki/latest/setup/install/helm/)
- [Kubernetes Patterns Book](https://k8spatterns.io/)
