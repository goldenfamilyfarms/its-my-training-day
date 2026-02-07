# Kubernetes Fundamentals

This document provides comprehensive coverage of Kubernetes concepts essential for all Grafana-related roles. From architecture fundamentals to advanced topics like Operators and Custom Resource Definitions, this guide serves as a foundational reference for interview preparation.

## Table of Contents

1. [Kubernetes Architecture Overview](#kubernetes-architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Configuration Management](#configuration-management)
4. [Storage](#storage)
5. [Networking](#networking)
6. [Deployment Strategies](#deployment-strategies)
7. [StatefulSets](#statefulsets)
8. [Operators and Custom Resource Definitions](#operators-and-custom-resource-definitions)
9. [Resource Management](#resource-management)
10. [Health Checks and Probes](#health-checks-and-probes)
11. [Troubleshooting Patterns](#troubleshooting-patterns)

---

## Kubernetes Architecture Overview

Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerized applications. Understanding its architecture is fundamental to operating and troubleshooting Kubernetes clusters.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KUBERNETES CLUSTER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CONTROL PLANE                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ kube-api-   │  │    etcd     │  │ kube-       │  │ kube-       │    │   │
│  │  │ server      │  │  (cluster   │  │ scheduler   │  │ controller- │    │   │
│  │  │             │  │   store)    │  │             │  │ manager     │    │   │
│  │  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │         │                                                               │   │
│  │         │         ┌─────────────┐                                      │   │
│  │         │         │ cloud-      │  (optional, for cloud providers)     │   │
│  │         │         │ controller- │                                      │   │
│  │         │         │ manager     │                                      │   │
│  │         │         └─────────────┘                                      │   │
│  └─────────┼───────────────────────────────────────────────────────────────┘   │
│            │                                                                    │
│            │ API Communication                                                  │
│            │                                                                    │
│  ┌─────────┴───────────────────────────────────────────────────────────────┐   │
│  │                          WORKER NODES                                    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐            │   │
│  │  │       Worker Node 1     │    │       Worker Node 2     │            │   │
│  │  │  ┌───────┐ ┌─────────┐ │    │  ┌───────┐ ┌─────────┐ │            │   │
│  │  │  │kubelet│ │kube-    │ │    │  │kubelet│ │kube-    │ │            │   │
│  │  │  │       │ │proxy    │ │    │  │       │ │proxy    │ │            │   │
│  │  │  └───────┘ └─────────┘ │    │  └───────┘ └─────────┘ │            │   │
│  │  │  ┌─────────────────┐   │    │  ┌─────────────────┐   │            │   │
│  │  │  │ Container       │   │    │  │ Container       │   │            │   │
│  │  │  │ Runtime         │   │    │  │ Runtime         │   │            │   │
│  │  │  │ (containerd)    │   │    │  │ (containerd)    │   │            │   │
│  │  │  └─────────────────┘   │    │  └─────────────────┘   │            │   │
│  │  │  ┌─────┐ ┌─────┐       │    │  ┌─────┐ ┌─────┐       │            │   │
│  │  │  │ Pod │ │ Pod │       │    │  │ Pod │ │ Pod │       │            │   │
│  │  │  └─────┘ └─────┘       │    │  └─────┘ └─────┘       │            │   │
│  │  └─────────────────────────┘    └─────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Control Plane Components

The control plane manages the overall state of the cluster and makes global decisions about scheduling and responding to cluster events.

| Component | Purpose | Key Responsibilities |
|-----------|---------|---------------------|
| **kube-apiserver** | API gateway | Exposes Kubernetes API, validates and processes REST requests, serves as the front-end for the control plane |
| **etcd** | Cluster store | Distributed key-value store for all cluster data, provides consistency and high availability |
| **kube-scheduler** | Pod placement | Watches for newly created Pods, selects nodes based on resource requirements, affinity rules, and constraints |
| **kube-controller-manager** | Controller loops | Runs controller processes (Node, Replication, Endpoints, Service Account controllers) |
| **cloud-controller-manager** | Cloud integration | Manages cloud-specific controller logic (load balancers, storage, nodes) |

### Worker Node Components

Worker nodes run the actual application workloads.

| Component | Purpose | Key Responsibilities |
|-----------|---------|---------------------|
| **kubelet** | Node agent | Ensures containers are running in Pods, reports node and Pod status to control plane |
| **kube-proxy** | Network proxy | Maintains network rules on nodes, enables Service abstraction through iptables/IPVS |
| **Container Runtime** | Container execution | Runs containers (containerd, CRI-O), implements Container Runtime Interface (CRI) |

### API Server Request Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│Authentication│────▶│Authorization │────▶│  Admission   │
│ (kubectl)│     │              │     │   (RBAC)     │     │  Controllers │
└──────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                   │
                                                                   ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Response │◀────│   Persist    │◀────│  Validation  │◀────│   Mutating   │
│          │     │   to etcd    │     │              │     │   Webhooks   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Core Concepts

### Pods

Pods are the smallest deployable units in Kubernetes, representing one or more containers that share storage and network resources.

#### Pod Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│                            POD                                   │
├─────────────────────────────────────────────────────────────────┤
│  Shared Network Namespace (same IP, port space)                 │
│  Shared Storage Volumes                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Container 1   │  │   Container 2   │  │  Init Container │ │
│  │   (main app)    │  │   (sidecar)     │  │  (setup tasks)  │ │
│  │                 │  │                 │  │                 │ │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │ │
│  │  │  Process  │  │  │  │  Process  │  │  │  │  Process  │  │ │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Shared Volumes                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Pod Specification Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: grafana-agent
  namespace: monitoring
  labels:
    app: grafana-agent
    tier: monitoring
spec:
  # Init containers run before main containers
  initContainers:
    - name: init-config
      image: busybox:1.35
      command: ['sh', '-c', 'cp /config-template/* /config/']
      volumeMounts:
        - name: config-template
          mountPath: /config-template
        - name: config
          mountPath: /config

  # Main containers
  containers:
    - name: agent
      image: grafana/agent:v0.38.0
      ports:
        - containerPort: 12345
          name: http-metrics
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "200m"
      volumeMounts:
        - name: config
          mountPath: /etc/agent
      env:
        - name: HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName

    # Sidecar container
    - name: config-reloader
      image: jimmidyson/configmap-reload:v0.5.0
      args:
        - --volume-dir=/etc/agent
        - --webhook-url=http://localhost:12345/-/reload
      volumeMounts:
        - name: config
          mountPath: /etc/agent
          readOnly: true

  # Volumes shared by containers
  volumes:
    - name: config-template
      configMap:
        name: grafana-agent-config
    - name: config
      emptyDir: {}

  # Pod scheduling constraints
  nodeSelector:
    kubernetes.io/os: linux
  
  tolerations:
    - key: "node-role.kubernetes.io/control-plane"
      operator: "Exists"
      effect: "NoSchedule"
```

### Services

Services provide stable network endpoints for accessing Pods, abstracting away the ephemeral nature of Pod IPs.

#### Service Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE TYPES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │   ClusterIP     │   │    NodePort     │   │  LoadBalancer   │           │
│  │   (default)     │   │                 │   │                 │           │
│  ├─────────────────┤   ├─────────────────┤   ├─────────────────┤           │
│  │ Internal only   │   │ ClusterIP +     │   │ NodePort +      │           │
│  │ Cluster DNS     │   │ Node port       │   │ Cloud LB        │           │
│  │ Virtual IP      │   │ (30000-32767)   │   │ External IP     │           │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘           │
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐                                  │
│  │   ExternalName  │   │    Headless     │                                  │
│  │                 │   │  (ClusterIP:    │                                  │
│  ├─────────────────┤   │     None)       │                                  │
│  │ DNS CNAME       │   ├─────────────────┤                                  │
│  │ External DNS    │   │ No load balance │                                  │
│  │ No proxying     │   │ Direct Pod DNS  │                                  │
│  └─────────────────┘   └─────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Service Examples

```yaml
# ClusterIP Service (internal access)
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  type: ClusterIP
  selector:
    app: grafana
  ports:
    - name: http
      port: 3000
      targetPort: 3000
      protocol: TCP

---
# NodePort Service (external access via node ports)
apiVersion: v1
kind: Service
metadata:
  name: grafana-nodeport
  namespace: monitoring
spec:
  type: NodePort
  selector:
    app: grafana
  ports:
    - name: http
      port: 3000
      targetPort: 3000
      nodePort: 30300  # Optional: auto-assigned if not specified

---
# LoadBalancer Service (cloud provider integration)
apiVersion: v1
kind: Service
metadata:
  name: grafana-lb
  namespace: monitoring
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  selector:
    app: grafana
  ports:
    - name: http
      port: 80
      targetPort: 3000

---
# Headless Service (for StatefulSets)
apiVersion: v1
kind: Service
metadata:
  name: loki-headless
  namespace: monitoring
spec:
  clusterIP: None  # Makes it headless
  selector:
    app: loki
  ports:
    - name: http
      port: 3100
      targetPort: 3100
```

### Deployments

Deployments manage ReplicaSets and provide declarative updates for Pods.

#### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT                                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ReplicaSet (current)                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │  Pod 1  │  │  Pod 2  │  │  Pod 3  │  │  Pod 4  │  │  Pod 5  │   │   │
│  │  │  v2.0   │  │  v2.0   │  │  v2.0   │  │  v2.0   │  │  v2.0   │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ReplicaSet (previous - scaled to 0)              │   │
│  │                              (kept for rollback)                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  replicas: 3
  
  # How to identify Pods managed by this Deployment
  selector:
    matchLabels:
      app: grafana
  
  # Update strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max Pods above desired during update
      maxUnavailable: 0  # Max Pods unavailable during update
  
  # Revision history for rollbacks
  revisionHistoryLimit: 10
  
  # Pod template
  template:
    metadata:
      labels:
        app: grafana
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0
          ports:
            - containerPort: 3000
              name: http
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
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
          volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
            - name: grafana-config
              mountPath: /etc/grafana/grafana.ini
              subPath: grafana.ini
      
      volumes:
        - name: grafana-storage
          persistentVolumeClaim:
            claimName: grafana-pvc
        - name: grafana-config
          configMap:
            name: grafana-config
```

### ReplicaSets

ReplicaSets ensure a specified number of Pod replicas are running at any given time. They are typically managed by Deployments.

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: grafana-rs
  namespace: monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grafana
    matchExpressions:
      - key: tier
        operator: In
        values:
          - frontend
          - backend
  template:
    metadata:
      labels:
        app: grafana
        tier: frontend
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0
```

### Namespaces

Namespaces provide logical isolation within a cluster, enabling multi-tenancy and resource organization.

#### Common Namespace Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NAMESPACE ORGANIZATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  System Namespaces:                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  kube-system    │  │  kube-public    │  │  kube-node-lease│             │
│  │  (K8s system    │  │  (publicly      │  │  (node          │             │
│  │   components)   │  │   readable)     │  │   heartbeats)   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  Application Namespaces:                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   monitoring    │  │   production    │  │    staging      │             │
│  │  (Grafana,      │  │  (prod apps)    │  │  (staging apps) │             │
│  │   Prometheus)   │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Namespace with Resource Quotas

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
    environment: production

---
# Resource quota for the namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: monitoring-quota
  namespace: monitoring
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    services: "20"
    persistentvolumeclaims: "10"

---
# Limit range for default resource limits
apiVersion: v1
kind: LimitRange
metadata:
  name: monitoring-limits
  namespace: monitoring
spec:
  limits:
    - default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      type: Container
```

---

## Configuration Management

### ConfigMaps

ConfigMaps store non-confidential configuration data as key-value pairs.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  # Simple key-value pairs
  GF_SERVER_ROOT_URL: "https://grafana.example.com"
  GF_AUTH_ANONYMOUS_ENABLED: "false"
  
  # File-like keys (multi-line values)
  grafana.ini: |
    [server]
    root_url = https://grafana.example.com
    
    [database]
    type = postgres
    host = postgres:5432
    name = grafana
    
    [auth]
    disable_login_form = false
    
    [auth.anonymous]
    enabled = false
    
    [alerting]
    enabled = true
    execute_alerts = true
  
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus:9090
        isDefault: true
      - name: Loki
        type: loki
        access: proxy
        url: http://loki:3100
```

#### Using ConfigMaps in Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: grafana
spec:
  containers:
    - name: grafana
      image: grafana/grafana:10.2.0
      
      # Environment variables from ConfigMap
      envFrom:
        - configMapRef:
            name: grafana-config
      
      # Individual environment variables
      env:
        - name: GF_INSTALL_PLUGINS
          valueFrom:
            configMapKeyRef:
              name: grafana-config
              key: GF_INSTALL_PLUGINS
              optional: true
      
      # Mount ConfigMap as files
      volumeMounts:
        - name: config-volume
          mountPath: /etc/grafana
        - name: datasources
          mountPath: /etc/grafana/provisioning/datasources
  
  volumes:
    - name: config-volume
      configMap:
        name: grafana-config
        items:
          - key: grafana.ini
            path: grafana.ini
    - name: datasources
      configMap:
        name: grafana-config
        items:
          - key: datasources.yaml
            path: datasources.yaml
```

### Secrets

Secrets store sensitive data such as passwords, tokens, and keys. They are base64-encoded (not encrypted by default).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: grafana-secrets
  namespace: monitoring
type: Opaque
data:
  # Base64 encoded values
  admin-user: YWRtaW4=           # "admin"
  admin-password: c2VjcmV0MTIz   # "secret123"
  
stringData:
  # Plain text (will be encoded automatically)
  database-url: "postgres://user:pass@postgres:5432/grafana"

---
# TLS Secret for HTTPS
apiVersion: v1
kind: Secret
metadata:
  name: grafana-tls
  namespace: monitoring
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>

---
# Docker registry credentials
apiVersion: v1
kind: Secret
metadata:
  name: registry-credentials
  namespace: monitoring
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
```

#### Using Secrets in Pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: grafana
spec:
  containers:
    - name: grafana
      image: grafana/grafana:10.2.0
      
      # Environment variables from Secret
      env:
        - name: GF_SECURITY_ADMIN_USER
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-user
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
      
      # Mount Secret as files
      volumeMounts:
        - name: tls-certs
          mountPath: /etc/grafana/ssl
          readOnly: true
  
  volumes:
    - name: tls-certs
      secret:
        secretName: grafana-tls
        defaultMode: 0400  # Read-only for owner
  
  # Pull images from private registry
  imagePullSecrets:
    - name: registry-credentials
```

#### Secret Best Practices

| Practice | Description |
|----------|-------------|
| **Enable encryption at rest** | Configure etcd encryption for Secrets |
| **Use external secret managers** | Integrate with Vault, AWS Secrets Manager, etc. |
| **Limit access with RBAC** | Restrict who can read Secrets |
| **Avoid committing to Git** | Use sealed-secrets or external-secrets operator |
| **Rotate regularly** | Implement secret rotation policies |

---

## Storage

### PersistentVolumes and PersistentVolumeClaims

Kubernetes storage abstraction separates storage provisioning from consumption.

#### Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │      Pod        │                                                        │
│  │  ┌───────────┐  │                                                        │
│  │  │ Container │  │                                                        │
│  │  │  /data    │──┼──┐                                                     │
│  │  └───────────┘  │  │                                                     │
│  └─────────────────┘  │                                                     │
│                       │ volumeMount                                         │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              PersistentVolumeClaim (PVC)                             │   │
│  │              "grafana-data" - 10Gi, ReadWriteOnce                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                       │ bound                                               │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              PersistentVolume (PV)                                   │   │
│  │              "pv-grafana-001" - 10Gi, ReadWriteOnce                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              StorageClass                                            │   │
│  │              "fast-ssd" - provisioner: kubernetes.io/aws-ebs        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Physical Storage                                        │   │
│  │              (AWS EBS, GCP PD, Azure Disk, NFS, etc.)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Access Modes

| Mode | Abbreviation | Description |
|------|--------------|-------------|
| ReadWriteOnce | RWO | Single node read-write |
| ReadOnlyMany | ROX | Multiple nodes read-only |
| ReadWriteMany | RWX | Multiple nodes read-write |
| ReadWriteOncePod | RWOP | Single pod read-write (K8s 1.22+) |

#### Storage Examples

```yaml
# StorageClass for dynamic provisioning
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  fsType: ext4
reclaimPolicy: Retain
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer

---
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-data
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi

---
# Static PersistentVolume (pre-provisioned)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: grafana-nfs-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs
  nfs:
    server: nfs-server.example.com
    path: /exports/grafana
```

---

## Networking

### Service Discovery and DNS

Kubernetes provides built-in DNS for service discovery within the cluster.

#### DNS Resolution Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DNS RESOLUTION                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Service DNS:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  <service-name>.<namespace>.svc.cluster.local                       │   │
│  │                                                                      │   │
│  │  Examples:                                                           │   │
│  │  • grafana.monitoring.svc.cluster.local                             │   │
│  │  • prometheus.monitoring.svc.cluster.local                          │   │
│  │  • loki.monitoring.svc.cluster.local                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Pod DNS (Headless Service):                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  <pod-name>.<service-name>.<namespace>.svc.cluster.local            │   │
│  │                                                                      │   │
│  │  Examples (StatefulSet):                                             │   │
│  │  • loki-0.loki-headless.monitoring.svc.cluster.local                │   │
│  │  • loki-1.loki-headless.monitoring.svc.cluster.local                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ingress

Ingress manages external access to services, typically HTTP/HTTPS routing.

#### Ingress Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INGRESS ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  External Traffic                                                            │
│        │                                                                     │
│        ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Ingress Controller                                │   │
│  │              (nginx, traefik, HAProxy, etc.)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│        │                                                                     │
│        │ Routes based on Ingress rules                                      │
│        │                                                                     │
│        ├──────────────────┬──────────────────┬──────────────────┐           │
│        │                  │                  │                  │           │
│        ▼                  ▼                  ▼                  ▼           │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐      │
│  │ grafana   │     │prometheus │     │   loki    │     │   tempo   │      │
│  │ Service   │     │ Service   │     │ Service   │     │ Service   │      │
│  └───────────┘     └───────────┘     └───────────┘     └───────────┘      │
│                                                                              │
│  Host-based routing:                                                         │
│  • grafana.example.com → grafana service                                    │
│  • prometheus.example.com → prometheus service                              │
│                                                                              │
│  Path-based routing:                                                         │
│  • example.com/grafana → grafana service                                    │
│  • example.com/prometheus → prometheus service                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Ingress Example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - grafana.example.com
        - prometheus.example.com
      secretName: monitoring-tls
  
  rules:
    # Host-based routing
    - host: grafana.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
    
    - host: prometheus.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090

---
# Path-based routing example
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-path-ingress
  namespace: monitoring
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
    - host: monitoring.example.com
      http:
        paths:
          - path: /grafana(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
          - path: /prometheus(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
```

### NetworkPolicies

NetworkPolicies control traffic flow between Pods at the IP address or port level.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: grafana-network-policy
  namespace: monitoring
spec:
  # Apply to Pods with label app=grafana
  podSelector:
    matchLabels:
      app: grafana
  
  # Policy types to enforce
  policyTypes:
    - Ingress
    - Egress
  
  # Ingress rules (incoming traffic)
  ingress:
    # Allow traffic from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 3000
    
    # Allow traffic from Prometheus for scraping
    - from:
        - podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 3000
  
  # Egress rules (outgoing traffic)
  egress:
    # Allow DNS resolution
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    
    # Allow connections to data sources
    - to:
        - podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 9090
    
    - to:
        - podSelector:
            matchLabels:
              app: loki
      ports:
        - protocol: TCP
          port: 3100

---
# Default deny all ingress traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: monitoring
spec:
  podSelector: {}  # Applies to all pods
  policyTypes:
    - Ingress
```

---

## Deployment Strategies

Kubernetes supports various deployment strategies for updating applications with minimal downtime.

### Strategy Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT STRATEGIES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ROLLING UPDATE                                   │   │
│  │  Gradually replaces old pods with new ones                          │   │
│  │                                                                      │   │
│  │  Time →                                                              │   │
│  │  [v1][v1][v1][v1]  →  [v1][v1][v1][v2]  →  [v1][v1][v2][v2]        │   │
│  │  →  [v1][v2][v2][v2]  →  [v2][v2][v2][v2]                          │   │
│  │                                                                      │   │
│  │  ✓ Zero downtime    ✓ Native K8s support    ✓ Easy rollback        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     BLUE-GREEN                                       │   │
│  │  Run two identical environments, switch traffic instantly           │   │
│  │                                                                      │   │
│  │  ┌─────────────┐         ┌─────────────┐                           │   │
│  │  │ Blue (v1)   │ ←─LB──→ │ Green (v2)  │                           │   │
│  │  │ [v1][v1]    │         │ [v2][v2]    │                           │   │
│  │  └─────────────┘         └─────────────┘                           │   │
│  │                                                                      │   │
│  │  ✓ Instant rollback    ✓ Full testing    ✗ 2x resources needed    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CANARY                                           │   │
│  │  Route small percentage of traffic to new version                   │   │
│  │                                                                      │   │
│  │  Traffic: 90% → [v1][v1][v1][v1][v1][v1][v1][v1][v1]               │   │
│  │           10% → [v2]                                                │   │
│  │                                                                      │   │
│  │  ✓ Risk mitigation    ✓ Real traffic testing    ✓ Gradual rollout │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rolling Update Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # Maximum number of pods that can be created above desired replicas
      maxSurge: 1
      # Maximum number of pods that can be unavailable during update
      maxUnavailable: 0
  
  # Minimum time a pod should be ready before considered available
  minReadySeconds: 10
  
  # How long to wait for a pod to become ready before considering failed
  progressDeadlineSeconds: 600
  
  template:
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Blue-Green Deployment

```yaml
# Blue deployment (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana-blue
  namespace: monitoring
  labels:
    app: grafana
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grafana
      version: blue
  template:
    metadata:
      labels:
        app: grafana
        version: blue
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.1.0

---
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana-green
  namespace: monitoring
  labels:
    app: grafana
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grafana
      version: green
  template:
    metadata:
      labels:
        app: grafana
        version: green
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0

---
# Service pointing to blue (switch to green by changing selector)
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
    version: blue  # Change to 'green' to switch traffic
  ports:
    - port: 3000
      targetPort: 3000
```

### Canary Deployment

```yaml
# Stable deployment (90% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana-stable
  namespace: monitoring
spec:
  replicas: 9
  selector:
    matchLabels:
      app: grafana
      track: stable
  template:
    metadata:
      labels:
        app: grafana
        track: stable
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.1.0

---
# Canary deployment (10% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana-canary
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
      track: canary
  template:
    metadata:
      labels:
        app: grafana
        track: canary
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.0

---
# Service routes to both (traffic split by replica count)
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana  # Matches both stable and canary
  ports:
    - port: 3000
      targetPort: 3000
```

### Deployment Commands

```bash
# Check rollout status
kubectl rollout status deployment/grafana -n monitoring

# View rollout history
kubectl rollout history deployment/grafana -n monitoring

# Rollback to previous revision
kubectl rollout undo deployment/grafana -n monitoring

# Rollback to specific revision
kubectl rollout undo deployment/grafana -n monitoring --to-revision=2

# Pause rollout (for canary analysis)
kubectl rollout pause deployment/grafana -n monitoring

# Resume rollout
kubectl rollout resume deployment/grafana -n monitoring

# Restart deployment (trigger new rollout with same config)
kubectl rollout restart deployment/grafana -n monitoring
```

---

## StatefulSets

StatefulSets manage stateful applications that require stable network identities, persistent storage, and ordered deployment/scaling.

### StatefulSet vs Deployment

| Feature | Deployment | StatefulSet |
|---------|------------|-------------|
| Pod naming | Random suffix (grafana-7d8f9) | Ordinal index (loki-0, loki-1) |
| Pod identity | Interchangeable | Stable, persistent |
| Storage | Shared or ephemeral | Per-pod persistent volumes |
| Scaling | Parallel | Ordered (sequential) |
| Updates | Parallel | Ordered (reverse order) |
| Use case | Stateless apps | Databases, distributed systems |

### StatefulSet Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATEFULSET                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Headless Service: loki-headless                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  DNS: loki-0.loki-headless.monitoring.svc.cluster.local             │   │
│  │       loki-1.loki-headless.monitoring.svc.cluster.local             │   │
│  │       loki-2.loki-headless.monitoring.svc.cluster.local             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │     loki-0      │  │     loki-1      │  │     loki-2      │            │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │            │
│  │  │ Container │  │  │  │ Container │  │  │  │ Container │  │            │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │            │
│  │       │         │  │       │         │  │       │         │            │
│  │       ▼         │  │       ▼         │  │       ▼         │            │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │            │
│  │  │ PVC       │  │  │  │ PVC       │  │  │  │ PVC       │  │            │
│  │  │ data-     │  │  │  │ data-     │  │  │  │ data-     │  │            │
│  │  │ loki-0    │  │  │  │ loki-1    │  │  │  │ loki-2    │  │            │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
│  Scaling: loki-0 → loki-1 → loki-2 (ordered)                               │
│  Termination: loki-2 → loki-1 → loki-0 (reverse order)                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### StatefulSet Example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: loki-headless
  namespace: monitoring
spec:
  clusterIP: None  # Headless service
  selector:
    app: loki
  ports:
    - name: http
      port: 3100
      targetPort: 3100
    - name: grpc
      port: 9095
      targetPort: 9095

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki
  namespace: monitoring
spec:
  serviceName: loki-headless  # Must match headless service name
  replicas: 3
  
  # Pod management policy
  podManagementPolicy: OrderedReady  # or Parallel
  
  # Update strategy
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0  # Pods with ordinal >= partition are updated
  
  selector:
    matchLabels:
      app: loki
  
  template:
    metadata:
      labels:
        app: loki
    spec:
      terminationGracePeriodSeconds: 300
      
      containers:
        - name: loki
          image: grafana/loki:2.9.0
          args:
            - -config.file=/etc/loki/loki.yaml
            - -target=all
          ports:
            - containerPort: 3100
              name: http
            - containerPort: 9095
              name: grpc
          
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          
          volumeMounts:
            - name: config
              mountPath: /etc/loki
            - name: data
              mountPath: /loki
          
          readinessProbe:
            httpGet:
              path: /ready
              port: 3100
            initialDelaySeconds: 30
            periodSeconds: 10
          
          livenessProbe:
            httpGet:
              path: /ready
              port: 3100
            initialDelaySeconds: 45
            periodSeconds: 10
      
      volumes:
        - name: config
          configMap:
            name: loki-config
  
  # Volume claim templates - creates PVC per pod
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```

### StatefulSet Operations

```bash
# Scale StatefulSet
kubectl scale statefulset loki -n monitoring --replicas=5

# Partition update (update only pods >= partition)
kubectl patch statefulset loki -n monitoring -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":2}}}}'

# Force delete stuck pod (use with caution)
kubectl delete pod loki-0 -n monitoring --force --grace-period=0

# Check pod ordinals
kubectl get pods -n monitoring -l app=loki -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
```

---

## Operators and Custom Resource Definitions

Operators extend Kubernetes to manage complex applications using custom resources and controllers.

### Operator Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPERATOR PATTERN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Custom Resource Definition (CRD)                  │   │
│  │                                                                      │   │
│  │  Defines new resource types in Kubernetes API                       │   │
│  │  Example: GrafanaInstance, LokiStack, PrometheusRule               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Custom Resource (CR)                              │   │
│  │                                                                      │   │
│  │  Instance of CRD with desired state                                 │   │
│  │  Example: my-grafana GrafanaInstance                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   │ watches                                 │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Operator Controller                               │   │
│  │                                                                      │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│  │  │   Watch     │───▶│  Reconcile  │───▶│   Update    │             │   │
│  │  │   Events    │    │   Logic     │    │   Status    │             │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘             │   │
│  │                            │                                        │   │
│  │                            ▼                                        │   │
│  │                    Creates/Updates:                                 │   │
│  │                    • Deployments                                    │   │
│  │                    • Services                                       │   │
│  │                    • ConfigMaps                                     │   │
│  │                    • Secrets                                        │   │
│  │                    • PVCs                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Custom Resource Definition Example

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: grafanainstances.grafana.integreatly.org
spec:
  group: grafana.integreatly.org
  
  names:
    kind: GrafanaInstance
    listKind: GrafanaInstanceList
    plural: grafanainstances
    singular: grafanainstance
    shortNames:
      - gi
  
  scope: Namespaced
  
  versions:
    - name: v1beta1
      served: true
      storage: true
      
      # Schema validation
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required:
                - replicas
              properties:
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
                version:
                  type: string
                  pattern: '^[0-9]+\.[0-9]+\.[0-9]+$'
                resources:
                  type: object
                  properties:
                    requests:
                      type: object
                      properties:
                        memory:
                          type: string
                        cpu:
                          type: string
                    limits:
                      type: object
                      properties:
                        memory:
                          type: string
                        cpu:
                          type: string
                persistence:
                  type: object
                  properties:
                    enabled:
                      type: boolean
                    size:
                      type: string
                    storageClassName:
                      type: string
            status:
              type: object
              properties:
                phase:
                  type: string
                  enum:
                    - Pending
                    - Running
                    - Failed
                replicas:
                  type: integer
                readyReplicas:
                  type: integer
                conditions:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                      status:
                        type: string
                      lastTransitionTime:
                        type: string
                        format: date-time
                      reason:
                        type: string
                      message:
                        type: string
      
      # Additional printer columns for kubectl
      additionalPrinterColumns:
        - name: Replicas
          type: integer
          jsonPath: .spec.replicas
        - name: Ready
          type: integer
          jsonPath: .status.readyReplicas
        - name: Phase
          type: string
          jsonPath: .status.phase
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
      
      # Subresources
      subresources:
        status: {}
        scale:
          specReplicasPath: .spec.replicas
          statusReplicasPath: .status.replicas
```

### Custom Resource Example

```yaml
apiVersion: grafana.integreatly.org/v1beta1
kind: GrafanaInstance
metadata:
  name: production-grafana
  namespace: monitoring
spec:
  replicas: 3
  version: "10.2.0"
  
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  
  persistence:
    enabled: true
    size: "10Gi"
    storageClassName: "fast-ssd"
```

### Operator Controller (Go Example)

```go
package controllers

import (
    "context"
    "fmt"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    grafanav1beta1 "github.com/example/grafana-operator/api/v1beta1"
)

// GrafanaInstanceReconciler reconciles a GrafanaInstance object
type GrafanaInstanceReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// Reconcile is the main reconciliation loop
func (r *GrafanaInstanceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // Fetch the GrafanaInstance
    grafana := &grafanav1beta1.GrafanaInstance{}
    if err := r.Get(ctx, req.NamespacedName, grafana); err != nil {
        if errors.IsNotFound(err) {
            // Object deleted, nothing to do
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }

    logger.Info("Reconciling GrafanaInstance", "name", grafana.Name)

    // Create or update Deployment
    deployment := r.deploymentForGrafana(grafana)
    if err := r.createOrUpdate(ctx, deployment); err != nil {
        return ctrl.Result{}, err
    }

    // Create or update Service
    service := r.serviceForGrafana(grafana)
    if err := r.createOrUpdate(ctx, service); err != nil {
        return ctrl.Result{}, err
    }

    // Update status
    grafana.Status.Phase = "Running"
    if err := r.Status().Update(ctx, grafana); err != nil {
        return ctrl.Result{}, err
    }

    return ctrl.Result{}, nil
}

func (r *GrafanaInstanceReconciler) deploymentForGrafana(g *grafanav1beta1.GrafanaInstance) *appsv1.Deployment {
    labels := map[string]string{"app": "grafana", "instance": g.Name}
    replicas := int32(g.Spec.Replicas)

    return &appsv1.Deployment{
        ObjectMeta: metav1.ObjectMeta{
            Name:      g.Name,
            Namespace: g.Namespace,
            OwnerReferences: []metav1.OwnerReference{
                *metav1.NewControllerRef(g, grafanav1beta1.GroupVersion.WithKind("GrafanaInstance")),
            },
        },
        Spec: appsv1.DeploymentSpec{
            Replicas: &replicas,
            Selector: &metav1.LabelSelector{MatchLabels: labels},
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{Labels: labels},
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{{
                        Name:  "grafana",
                        Image: fmt.Sprintf("grafana/grafana:%s", g.Spec.Version),
                        Ports: []corev1.ContainerPort{{ContainerPort: 3000}},
                    }},
                },
            },
        },
    }
}

// SetupWithManager sets up the controller with the Manager
func (r *GrafanaInstanceReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&grafanav1beta1.GrafanaInstance{}).
        Owns(&appsv1.Deployment{}).
        Owns(&corev1.Service{}).
        Complete(r)
}
```

### Popular Kubernetes Operators

| Operator | Purpose | Use Case |
|----------|---------|----------|
| **Prometheus Operator** | Prometheus/Alertmanager management | Monitoring stack deployment |
| **Grafana Operator** | Grafana instance management | Dashboard and datasource provisioning |
| **Loki Operator** | Loki stack management | Log aggregation deployment |
| **Cert-Manager** | Certificate management | TLS certificate automation |
| **External Secrets** | Secret synchronization | Vault/AWS Secrets Manager integration |
| **Strimzi** | Kafka management | Kafka cluster deployment |
| **Zalando Postgres** | PostgreSQL management | Database cluster deployment |

---

## Resource Management

### Resource Requests and Limits

Kubernetes uses requests and limits to manage container resources.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RESOURCE REQUESTS AND LIMITS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Node Resources                               │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Allocatable                               │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Pod A                                   │   │   │   │
│  │  │  │  Request: 100m CPU, 128Mi Memory                    │   │   │   │
│  │  │  │  Limit:   500m CPU, 512Mi Memory                    │   │   │   │
│  │  │  │  ┌───────────────────────────────────────────────┐  │   │   │   │
│  │  │  │  │ Actual Usage (varies)                         │  │   │   │   │
│  │  │  │  └───────────────────────────────────────────────┘  │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  Request = Guaranteed minimum (used for scheduling)        │   │   │
│  │  │  Limit = Maximum allowed (enforced at runtime)             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Resource Specification

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: grafana
spec:
  containers:
    - name: grafana
      image: grafana/grafana:10.2.0
      resources:
        # Guaranteed minimum resources
        requests:
          memory: "256Mi"    # 256 Mebibytes
          cpu: "100m"        # 100 millicores (0.1 CPU)
          ephemeral-storage: "1Gi"
        
        # Maximum allowed resources
        limits:
          memory: "512Mi"
          cpu: "500m"
          ephemeral-storage: "2Gi"
```

### Quality of Service (QoS) Classes

Kubernetes assigns QoS classes based on resource configuration, affecting eviction priority.

| QoS Class | Criteria | Eviction Priority |
|-----------|----------|-------------------|
| **Guaranteed** | requests = limits for all containers | Lowest (last to be evicted) |
| **Burstable** | At least one request or limit set | Medium |
| **BestEffort** | No requests or limits set | Highest (first to be evicted) |

```yaml
# Guaranteed QoS (requests = limits)
apiVersion: v1
kind: Pod
metadata:
  name: guaranteed-pod
spec:
  containers:
    - name: app
      image: nginx
      resources:
        requests:
          memory: "256Mi"
          cpu: "500m"
        limits:
          memory: "256Mi"
          cpu: "500m"

---
# Burstable QoS (requests < limits)
apiVersion: v1
kind: Pod
metadata:
  name: burstable-pod
spec:
  containers:
    - name: app
      image: nginx
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "512Mi"
          cpu: "1000m"

---
# BestEffort QoS (no resources specified)
apiVersion: v1
kind: Pod
metadata:
  name: besteffort-pod
spec:
  containers:
    - name: app
      image: nginx
      # No resources specified
```

### Resource Quotas and Limit Ranges

```yaml
# Namespace resource quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: monitoring-quota
  namespace: monitoring
spec:
  hard:
    # Compute resources
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    
    # Object counts
    pods: "100"
    services: "50"
    secrets: "100"
    configmaps: "100"
    persistentvolumeclaims: "20"
    
    # Storage
    requests.storage: "500Gi"

---
# Default limits for containers
apiVersion: v1
kind: LimitRange
metadata:
  name: monitoring-limits
  namespace: monitoring
spec:
  limits:
    # Container defaults
    - type: Container
      default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      min:
        cpu: "50m"
        memory: "64Mi"
      max:
        cpu: "2"
        memory: "4Gi"
    
    # Pod limits
    - type: Pod
      max:
        cpu: "4"
        memory: "8Gi"
    
    # PVC limits
    - type: PersistentVolumeClaim
      min:
        storage: "1Gi"
      max:
        storage: "100Gi"
```

### Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: grafana-vpa
  namespace: monitoring
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grafana
  
  updatePolicy:
    updateMode: "Auto"  # Auto, Recreate, Initial, Off
  
  resourcePolicy:
    containerPolicies:
      - containerName: grafana
        minAllowed:
          cpu: "100m"
          memory: "128Mi"
        maxAllowed:
          cpu: "2"
          memory: "4Gi"
        controlledResources:
          - cpu
          - memory
```

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: grafana-hpa
  namespace: monitoring
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grafana
  
  minReplicas: 2
  maxReplicas: 10
  
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    
    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    
    # Custom metrics (requires metrics adapter)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

---

## Health Checks and Probes

Kubernetes uses probes to determine container health and readiness.

### Probe Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROBE TYPES                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     STARTUP PROBE                                    │   │
│  │  Purpose: Determine when container has started                      │   │
│  │  Timing: Runs first, before other probes                           │   │
│  │  Failure: Container is killed and restarted                        │   │
│  │  Use case: Slow-starting applications                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼ (once successful)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LIVENESS PROBE                                   │   │
│  │  Purpose: Determine if container is running                         │   │
│  │  Timing: Runs continuously after startup                           │   │
│  │  Failure: Container is killed and restarted                        │   │
│  │  Use case: Detect deadlocks, unresponsive processes                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼ (runs in parallel)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     READINESS PROBE                                  │   │
│  │  Purpose: Determine if container can receive traffic                │   │
│  │  Timing: Runs continuously after startup                           │   │
│  │  Failure: Pod removed from Service endpoints (no traffic)          │   │
│  │  Use case: Warm-up periods, dependency checks                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Probe Mechanisms

| Mechanism | Description | Use Case |
|-----------|-------------|----------|
| **httpGet** | HTTP GET request to endpoint | Web applications with health endpoints |
| **tcpSocket** | TCP connection to port | Services without HTTP (databases, caches) |
| **exec** | Execute command in container | Custom health check scripts |
| **grpc** | gRPC health check (K8s 1.24+) | gRPC services |

### Comprehensive Probe Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: grafana
  namespace: monitoring
spec:
  containers:
    - name: grafana
      image: grafana/grafana:10.2.0
      ports:
        - containerPort: 3000
          name: http
      
      # Startup probe - for slow-starting containers
      startupProbe:
        httpGet:
          path: /api/health
          port: http
        # Allow up to 5 minutes for startup (30 * 10s)
        failureThreshold: 30
        periodSeconds: 10
      
      # Liveness probe - detect if container is alive
      livenessProbe:
        httpGet:
          path: /api/health
          port: http
          httpHeaders:
            - name: X-Custom-Header
              value: health-check
        initialDelaySeconds: 0      # Start immediately after startup probe succeeds
        periodSeconds: 10           # Check every 10 seconds
        timeoutSeconds: 5           # Timeout after 5 seconds
        successThreshold: 1         # 1 success to be considered healthy
        failureThreshold: 3         # 3 failures to be considered unhealthy
      
      # Readiness probe - determine if ready for traffic
      readinessProbe:
        httpGet:
          path: /api/health
          port: http
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 3
        successThreshold: 1
        failureThreshold: 3

---
# TCP Socket probe example (for non-HTTP services)
apiVersion: v1
kind: Pod
metadata:
  name: postgres
spec:
  containers:
    - name: postgres
      image: postgres:15
      ports:
        - containerPort: 5432
      
      livenessProbe:
        tcpSocket:
          port: 5432
        initialDelaySeconds: 30
        periodSeconds: 10
      
      readinessProbe:
        tcpSocket:
          port: 5432
        initialDelaySeconds: 5
        periodSeconds: 5

---
# Exec probe example (custom health check)
apiVersion: v1
kind: Pod
metadata:
  name: loki
spec:
  containers:
    - name: loki
      image: grafana/loki:2.9.0
      
      livenessProbe:
        exec:
          command:
            - /bin/sh
            - -c
            - wget -q --spider http://localhost:3100/ready || exit 1
        initialDelaySeconds: 45
        periodSeconds: 10
      
      readinessProbe:
        exec:
          command:
            - /bin/sh
            - -c
            - |
              # Check if Loki is ready and can query
              wget -q -O- http://localhost:3100/ready | grep -q "ready"
        initialDelaySeconds: 10
        periodSeconds: 5

---
# gRPC probe example (K8s 1.24+)
apiVersion: v1
kind: Pod
metadata:
  name: grpc-service
spec:
  containers:
    - name: server
      image: my-grpc-server:latest
      ports:
        - containerPort: 50051
      
      livenessProbe:
        grpc:
          port: 50051
          service: ""  # Empty string for default health check
        initialDelaySeconds: 10
        periodSeconds: 10
```

### Probe Best Practices

| Practice | Recommendation |
|----------|----------------|
| **Use startup probes** | For applications with long initialization times |
| **Separate liveness and readiness** | Different endpoints or thresholds for each |
| **Avoid expensive checks** | Probes should be lightweight and fast |
| **Set appropriate timeouts** | Match your application's response characteristics |
| **Use httpGet when possible** | More informative than tcpSocket |
| **Check dependencies in readiness** | Ensure downstream services are available |
| **Don't check dependencies in liveness** | Avoid cascading restarts |

---

## Troubleshooting Patterns

### Common Troubleshooting Commands

```bash
# Pod troubleshooting
kubectl get pods -n monitoring -o wide
kubectl describe pod grafana-0 -n monitoring
kubectl logs grafana-0 -n monitoring
kubectl logs grafana-0 -n monitoring --previous  # Previous container logs
kubectl logs grafana-0 -n monitoring -c sidecar  # Specific container

# Events (sorted by time)
kubectl get events -n monitoring --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n monitoring
kubectl top nodes

# Execute commands in container
kubectl exec -it grafana-0 -n monitoring -- /bin/sh
kubectl exec grafana-0 -n monitoring -- cat /etc/grafana/grafana.ini

# Port forwarding for debugging
kubectl port-forward pod/grafana-0 3000:3000 -n monitoring
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Copy files from/to container
kubectl cp grafana-0:/var/log/grafana/grafana.log ./grafana.log -n monitoring

# Debug with ephemeral container (K8s 1.25+)
kubectl debug -it grafana-0 -n monitoring --image=busybox --target=grafana
```

### Troubleshooting Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POD TROUBLESHOOTING FLOWCHART                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pod Status?                                                                 │
│       │                                                                      │
│       ├── Pending ──────────────────────────────────────────────────────┐   │
│       │   • Check: kubectl describe pod <name>                          │   │
│       │   • Common causes:                                              │   │
│       │     - Insufficient resources (CPU/memory)                       │   │
│       │     - Node selector/affinity not matching                       │   │
│       │     - PVC not bound                                             │   │
│       │     - Image pull issues                                         │   │
│       │                                                                 │   │
│       ├── ImagePullBackOff ─────────────────────────────────────────────┤   │
│       │   • Check: kubectl describe pod <name>                          │   │
│       │   • Common causes:                                              │   │
│       │     - Wrong image name/tag                                      │   │
│       │     - Missing imagePullSecrets                                  │   │
│       │     - Private registry authentication                           │   │
│       │     - Network issues                                            │   │
│       │                                                                 │   │
│       ├── CrashLoopBackOff ─────────────────────────────────────────────┤   │
│       │   • Check: kubectl logs <pod> --previous                        │   │
│       │   • Common causes:                                              │   │
│       │     - Application error/crash                                   │   │
│       │     - Missing configuration                                     │   │
│       │     - Failed health checks                                      │   │
│       │     - Resource limits too low                                   │   │
│       │                                                                 │   │
│       ├── Running but not Ready ────────────────────────────────────────┤   │
│       │   • Check: kubectl describe pod <name>                          │   │
│       │   • Common causes:                                              │   │
│       │     - Readiness probe failing                                   │   │
│       │     - Dependency not available                                  │   │
│       │     - Application still initializing                            │   │
│       │                                                                 │   │
│       └── OOMKilled ────────────────────────────────────────────────────┘   │
│           • Check: kubectl describe pod <name>                              │
│           • Solution: Increase memory limits                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Connectivity Troubleshooting

```bash
# Check service endpoints
kubectl get endpoints grafana -n monitoring

# Test DNS resolution from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup grafana.monitoring.svc.cluster.local

# Test connectivity from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://grafana.monitoring.svc.cluster.local:3000/api/health

# Check network policies
kubectl get networkpolicies -n monitoring
kubectl describe networkpolicy grafana-network-policy -n monitoring

# Verify service selector matches pod labels
kubectl get pods -n monitoring -l app=grafana --show-labels
kubectl get svc grafana -n monitoring -o jsonpath='{.spec.selector}'
```

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Pod stuck in Pending** | No node available | Check resource requests, node capacity, taints/tolerations |
| **CrashLoopBackOff** | Container repeatedly crashes | Check logs, verify config, increase resources |
| **ImagePullBackOff** | Cannot pull image | Verify image name, check registry credentials |
| **Service not accessible** | Connection refused | Check endpoints, verify selectors, check NetworkPolicies |
| **PVC stuck in Pending** | No storage available | Check StorageClass, verify provisioner |
| **OOMKilled** | Container killed | Increase memory limits, optimize application |
| **Evicted** | Pod removed from node | Check node resources, adjust resource requests |

---

## Summary

This document covered the essential Kubernetes concepts needed for Grafana-related roles:

1. **Architecture**: Control plane and worker node components
2. **Core Concepts**: Pods, Services, Deployments, ReplicaSets, Namespaces
3. **Configuration**: ConfigMaps and Secrets management
4. **Storage**: PersistentVolumes, PVCs, and StorageClasses
5. **Networking**: Services, Ingress, and NetworkPolicies
6. **Deployment Strategies**: Rolling updates, Blue-Green, Canary
7. **StatefulSets**: Managing stateful applications
8. **Operators and CRDs**: Extending Kubernetes functionality
9. **Resource Management**: Requests, limits, QoS classes, autoscaling
10. **Health Checks**: Liveness, readiness, and startup probes
11. **Troubleshooting**: Common patterns and debugging techniques

For role-specific Kubernetes applications, refer to:
- [Observability Principles](./observability-principles.md) - Kubernetes monitoring and observability
- [LGTM Stack](./lgtm-stack.md) - Deploying observability tools on Kubernetes
- [Grafana Ecosystem](./grafana-ecosystem.md) - Grafana deployment patterns

---

## Quick Reference

### Essential kubectl Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes -o wide

# Workloads
kubectl get pods,deployments,statefulsets,daemonsets -n <namespace>
kubectl rollout status deployment/<name> -n <namespace>
kubectl rollout undo deployment/<name> -n <namespace>

# Networking
kubectl get svc,ingress,endpoints -n <namespace>
kubectl port-forward svc/<name> <local>:<remote> -n <namespace>

# Configuration
kubectl get configmaps,secrets -n <namespace>
kubectl create configmap <name> --from-file=<path>

# Storage
kubectl get pv,pvc,storageclass

# Debugging
kubectl describe <resource> <name> -n <namespace>
kubectl logs <pod> -n <namespace> -f --tail=100
kubectl exec -it <pod> -n <namespace> -- /bin/sh
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

### Resource Manifest Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-name
  namespace: namespace
  labels:
    app: app-name
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app-name
  template:
    metadata:
      labels:
        app: app-name
    spec:
      containers:
        - name: container-name
          image: image:tag
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
```
