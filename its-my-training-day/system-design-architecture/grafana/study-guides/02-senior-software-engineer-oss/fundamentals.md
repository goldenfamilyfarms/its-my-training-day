# Fundamentals: Senior Software Engineer - Grafana OSS

This document covers the foundational knowledge required for the Senior Software Engineer role on the Grafana OSS Big Tent team. Master these concepts before progressing to intermediate and advanced topics.

## Table of Contents

1. [Go Backend Development Patterns](#go-backend-development-patterns)
2. [Docker Basics and Containerization](#docker-basics-and-containerization)
3. [Data Source Concepts](#data-source-concepts)
4. [Practical Exercises](#practical-exercises)

---

## Go Backend Development Patterns

Go is the primary language for Grafana backend development. Understanding idiomatic Go patterns is essential for building robust, maintainable services.

> **Related Reading**: For distributed systems patterns in Go, see the [Staff Backend Engineer Fundamentals](../01-staff-backend-engineer-loki/fundamentals.md)

### HTTP Server Implementation

Grafana plugins and backend services are built on Go's `net/http` package. Understanding HTTP server patterns is fundamental.

#### Basic HTTP Server

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"
)

func main() {
    // Create a new ServeMux (router)
    mux := http.NewServeMux()
    
    // Register handlers
    mux.HandleFunc("/health", healthHandler)
    mux.HandleFunc("/api/v1/query", queryHandler)
    
    // Create server with timeouts
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    log.Printf("Server starting on %s", server.Addr)
    if err := server.ListenAndServe(); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    // Handle query logic
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"result": "success"})
}
```

#### Server Configuration Best Practices

| Configuration | Recommended Value | Purpose |
|--------------|-------------------|---------|
| `ReadTimeout` | 15-30 seconds | Prevents slow client attacks |
| `WriteTimeout` | 15-30 seconds | Prevents hanging connections |
| `IdleTimeout` | 60-120 seconds | Manages keep-alive connections |
| `MaxHeaderBytes` | 1 MB | Prevents header overflow attacks |

### Middleware Patterns

Middleware enables cross-cutting concerns like logging, authentication, and metrics collection.

#### Middleware Chain Pattern

```go
package middleware

import (
    "log"
    "net/http"
    "time"
)

// Middleware type definition
type Middleware func(http.Handler) http.Handler

// Chain applies middlewares in order
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

// LoggingMiddleware logs request details
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Wrap response writer to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        
        next.ServeHTTP(wrapped, r)
        
        log.Printf(
            "%s %s %d %v",
            r.Method,
            r.URL.Path,
            wrapped.statusCode,
            time.Since(start),
        )
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

// AuthMiddleware validates authentication
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Validate token (simplified example)
        if !validateToken(token) {
            http.Error(w, "Invalid token", http.StatusForbidden)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}

func validateToken(token string) bool {
    // Implement actual token validation
    return token != ""
}

// RecoveryMiddleware handles panics gracefully
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

#### Using the Middleware Chain

```go
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/api/query", queryHandler)
    
    // Apply middleware chain
    handler := middleware.Chain(
        mux,
        middleware.RecoveryMiddleware,
        middleware.LoggingMiddleware,
        middleware.AuthMiddleware,
    )
    
    http.ListenAndServe(":8080", handler)
}
```

### Request/Response Handling

Proper request parsing and response formatting is critical for API development.

#### Request Parsing

```go
package handlers

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strconv"
)

// QueryRequest represents an incoming query
type QueryRequest struct {
    Query     string            `json:"query"`
    TimeRange TimeRange         `json:"timeRange"`
    Variables map[string]string `json:"variables,omitempty"`
}

type TimeRange struct {
    From int64 `json:"from"`
    To   int64 `json:"to"`
}

// ParseQueryRequest parses and validates the request body
func ParseQueryRequest(r *http.Request) (*QueryRequest, error) {
    // Check content type
    if r.Header.Get("Content-Type") != "application/json" {
        return nil, fmt.Errorf("content-type must be application/json")
    }
    
    // Limit request body size (prevent DoS)
    r.Body = http.MaxBytesReader(nil, r.Body, 1<<20) // 1MB limit
    
    var req QueryRequest
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields() // Strict parsing
    
    if err := decoder.Decode(&req); err != nil {
        return nil, fmt.Errorf("invalid request body: %w", err)
    }
    
    // Validate required fields
    if req.Query == "" {
        return nil, fmt.Errorf("query field is required")
    }
    
    return &req, nil
}

// ParseQueryParams extracts query parameters with defaults
func ParseQueryParams(r *http.Request) (limit int, offset int, err error) {
    query := r.URL.Query()
    
    // Parse limit with default
    limitStr := query.Get("limit")
    if limitStr == "" {
        limit = 100 // default
    } else {
        limit, err = strconv.Atoi(limitStr)
        if err != nil || limit < 1 || limit > 1000 {
            return 0, 0, fmt.Errorf("invalid limit: must be 1-1000")
        }
    }
    
    // Parse offset with default
    offsetStr := query.Get("offset")
    if offsetStr == "" {
        offset = 0 // default
    } else {
        offset, err = strconv.Atoi(offsetStr)
        if err != nil || offset < 0 {
            return 0, 0, fmt.Errorf("invalid offset: must be >= 0")
        }
    }
    
    return limit, offset, nil
}
```

#### Response Formatting

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

// APIResponse is a standard response wrapper
type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

// WriteJSON writes a JSON response with proper headers
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    
    response := APIResponse{
        Success: status >= 200 && status < 300,
        Data:    data,
    }
    
    json.NewEncoder(w).Encode(response)
}

// WriteError writes an error response
func WriteError(w http.ResponseWriter, status int, code, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    
    response := APIResponse{
        Success: false,
        Error: &APIError{
            Code:    code,
            Message: message,
        },
    }
    
    json.NewEncoder(w).Encode(response)
}

// Example handler using response helpers
func QueryHandler(w http.ResponseWriter, r *http.Request) {
    req, err := ParseQueryRequest(r)
    if err != nil {
        WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
        return
    }
    
    // Execute query (simplified)
    results, err := executeQuery(req)
    if err != nil {
        WriteError(w, http.StatusInternalServerError, "QUERY_FAILED", "Query execution failed")
        return
    }
    
    WriteJSON(w, http.StatusOK, results)
}
```

### JSON Serialization

Efficient JSON handling is crucial for API performance.

#### Custom JSON Marshaling

```go
package models

import (
    "encoding/json"
    "time"
)

// TimeSeriesPoint represents a data point
type TimeSeriesPoint struct {
    Timestamp time.Time
    Value     float64
    Labels    map[string]string
}

// MarshalJSON implements custom JSON marshaling
func (p TimeSeriesPoint) MarshalJSON() ([]byte, error) {
    // Use Unix milliseconds for timestamps (Grafana convention)
    return json.Marshal(struct {
        Timestamp int64             `json:"timestamp"`
        Value     float64           `json:"value"`
        Labels    map[string]string `json:"labels,omitempty"`
    }{
        Timestamp: p.Timestamp.UnixMilli(),
        Value:     p.Value,
        Labels:    p.Labels,
    })
}

// UnmarshalJSON implements custom JSON unmarshaling
func (p *TimeSeriesPoint) UnmarshalJSON(data []byte) error {
    var raw struct {
        Timestamp int64             `json:"timestamp"`
        Value     float64           `json:"value"`
        Labels    map[string]string `json:"labels"`
    }
    
    if err := json.Unmarshal(data, &raw); err != nil {
        return err
    }
    
    p.Timestamp = time.UnixMilli(raw.Timestamp)
    p.Value = raw.Value
    p.Labels = raw.Labels
    
    return nil
}

// DataFrame represents Grafana's data frame format
type DataFrame struct {
    Name   string   `json:"name"`
    Fields []Field  `json:"fields"`
}

type Field struct {
    Name   string        `json:"name"`
    Type   string        `json:"type"`
    Values []interface{} `json:"values"`
}

// ToDataFrame converts time series to Grafana data frame format
func ToDataFrame(name string, points []TimeSeriesPoint) DataFrame {
    timestamps := make([]interface{}, len(points))
    values := make([]interface{}, len(points))
    
    for i, p := range points {
        timestamps[i] = p.Timestamp.UnixMilli()
        values[i] = p.Value
    }
    
    return DataFrame{
        Name: name,
        Fields: []Field{
            {Name: "time", Type: "time", Values: timestamps},
            {Name: "value", Type: "number", Values: values},
        },
    }
}
```

### Error Handling Best Practices

Go's explicit error handling requires careful design for maintainable code.

#### Custom Error Types

```go
package errors

import (
    "fmt"
    "net/http"
)

// AppError represents an application error with context
type AppError struct {
    Code       string // Machine-readable error code
    Message    string // Human-readable message
    HTTPStatus int    // HTTP status code
    Err        error  // Underlying error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Err)
    }
    return e.Message
}

func (e *AppError) Unwrap() error {
    return e.Err
}

// Error constructors
func NewBadRequest(message string) *AppError {
    return &AppError{
        Code:       "BAD_REQUEST",
        Message:    message,
        HTTPStatus: http.StatusBadRequest,
    }
}

func NewNotFound(resource string) *AppError {
    return &AppError{
        Code:       "NOT_FOUND",
        Message:    fmt.Sprintf("%s not found", resource),
        HTTPStatus: http.StatusNotFound,
    }
}

func NewInternalError(err error) *AppError {
    return &AppError{
        Code:       "INTERNAL_ERROR",
        Message:    "An internal error occurred",
        HTTPStatus: http.StatusInternalServerError,
        Err:        err,
    }
}

func NewUnauthorized(message string) *AppError {
    return &AppError{
        Code:       "UNAUTHORIZED",
        Message:    message,
        HTTPStatus: http.StatusUnauthorized,
    }
}
```

#### Error Wrapping Pattern

```go
package datasource

import (
    "context"
    "fmt"
)

// QueryData executes a query with proper error handling
func (ds *DataSource) QueryData(ctx context.Context, query string) ([]byte, error) {
    // Validate input
    if query == "" {
        return nil, fmt.Errorf("query validation failed: %w", ErrEmptyQuery)
    }
    
    // Connect to backend
    conn, err := ds.pool.Get(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to get connection: %w", err)
    }
    defer conn.Release()
    
    // Execute query
    result, err := conn.Execute(ctx, query)
    if err != nil {
        return nil, fmt.Errorf("query execution failed for '%s': %w", query, err)
    }
    
    return result, nil
}

// Sentinel errors for common cases
var (
    ErrEmptyQuery     = fmt.Errorf("query cannot be empty")
    ErrQueryTimeout   = fmt.Errorf("query timed out")
    ErrConnectionLost = fmt.Errorf("connection to backend lost")
)
```


### Configuration Management

Proper configuration management enables flexible deployments across environments.

#### Environment-Based Configuration

```go
package config

import (
    "fmt"
    "os"
    "strconv"
    "time"
)

// Config holds application configuration
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Logging  LoggingConfig
}

type ServerConfig struct {
    Host         string
    Port         int
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    Database string
    MaxConns int
}

type LoggingConfig struct {
    Level  string
    Format string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
    cfg := &Config{
        Server: ServerConfig{
            Host:         getEnv("SERVER_HOST", "0.0.0.0"),
            Port:         getEnvInt("SERVER_PORT", 8080),
            ReadTimeout:  getEnvDuration("SERVER_READ_TIMEOUT", 15*time.Second),
            WriteTimeout: getEnvDuration("SERVER_WRITE_TIMEOUT", 15*time.Second),
        },
        Database: DatabaseConfig{
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnvInt("DB_PORT", 5432),
            User:     getEnv("DB_USER", "grafana"),
            Password: getEnv("DB_PASSWORD", ""),
            Database: getEnv("DB_NAME", "grafana"),
            MaxConns: getEnvInt("DB_MAX_CONNS", 10),
        },
        Logging: LoggingConfig{
            Level:  getEnv("LOG_LEVEL", "info"),
            Format: getEnv("LOG_FORMAT", "json"),
        },
    }
    
    // Validate required fields
    if cfg.Database.Password == "" {
        return nil, fmt.Errorf("DB_PASSWORD is required")
    }
    
    return cfg, nil
}

// Helper functions for environment variables
func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.Atoi(value); err == nil {
            return intVal
        }
    }
    return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
    if value := os.Getenv(key); value != "" {
        if duration, err := time.ParseDuration(value); err == nil {
            return duration
        }
    }
    return defaultValue
}
```

#### Configuration File Support

```go
package config

import (
    "encoding/json"
    "os"
    "path/filepath"
)

// LoadFromFile loads configuration from a JSON file
func LoadFromFile(path string) (*Config, error) {
    // Expand path
    if path == "" {
        path = filepath.Join(os.Getenv("HOME"), ".config", "grafana-plugin", "config.json")
    }
    
    file, err := os.Open(path)
    if err != nil {
        if os.IsNotExist(err) {
            // Fall back to environment variables
            return Load()
        }
        return nil, fmt.Errorf("failed to open config file: %w", err)
    }
    defer file.Close()
    
    var cfg Config
    if err := json.NewDecoder(file).Decode(&cfg); err != nil {
        return nil, fmt.Errorf("failed to parse config file: %w", err)
    }
    
    // Override with environment variables (env takes precedence)
    if host := os.Getenv("SERVER_HOST"); host != "" {
        cfg.Server.Host = host
    }
    if port := getEnvInt("SERVER_PORT", 0); port != 0 {
        cfg.Server.Port = port
    }
    
    return &cfg, nil
}
```

---

## Docker Basics and Containerization

Docker is essential for developing, testing, and deploying Grafana plugins and services.

> **Related Reading**: For Kubernetes deployment patterns, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Dockerfile Creation

A well-structured Dockerfile ensures consistent, secure, and efficient container images.

#### Basic Go Application Dockerfile

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Runtime stage
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN adduser -D -g '' appuser

# Copy binary from builder
COPY --from=builder /app/server /usr/local/bin/server

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
ENTRYPOINT ["/usr/local/bin/server"]
```


### Multi-Stage Builds

Multi-stage builds reduce image size and improve security by separating build and runtime environments.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-STAGE BUILD BENEFITS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BUILD STAGE                              RUNTIME STAGE                          │
│  ┌─────────────────────────┐             ┌─────────────────────────┐            │
│  │ • Full Go toolchain     │             │ • Minimal Alpine base   │            │
│  │ • Source code           │  ────────►  │ • Only binary           │            │
│  │ • Dependencies          │   COPY      │ • CA certificates       │            │
│  │ • Build tools           │   binary    │ • Non-root user         │            │
│  │                         │             │                         │            │
│  │ Size: ~1GB              │             │ Size: ~15MB             │            │
│  └─────────────────────────┘             └─────────────────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Advanced Multi-Stage Dockerfile

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM golang:1.21-alpine AS deps

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# ============================================
# Stage 2: Builder
# ============================================
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy cached dependencies
COPY --from=deps /go/pkg /go/pkg

# Copy source
COPY . .

# Build with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s -X main.version=${VERSION}" \
    -o /app/server ./cmd/server

# ============================================
# Stage 3: Test (optional, for CI)
# ============================================
FROM builder AS test

RUN go test -v ./...

# ============================================
# Stage 4: Runtime
# ============================================
FROM gcr.io/distroless/static-debian12 AS runtime

# Copy binary
COPY --from=builder /app/server /server

# Copy config files if needed
COPY --from=builder /app/configs /configs

EXPOSE 8080

ENTRYPOINT ["/server"]
```

### Container Networking

Understanding Docker networking is essential for local development and testing.

#### Network Types

| Network Type | Use Case | Example |
|--------------|----------|---------|
| **bridge** | Default, isolated containers | Local development |
| **host** | Container uses host network | Performance testing |
| **none** | No networking | Security-sensitive workloads |
| **overlay** | Multi-host networking | Docker Swarm/K8s |

#### Creating Custom Networks

```bash
# Create a custom bridge network
docker network create --driver bridge grafana-net

# Run containers on the network
docker run -d --name prometheus \
    --network grafana-net \
    prom/prometheus

docker run -d --name grafana \
    --network grafana-net \
    -p 3000:3000 \
    grafana/grafana

# Containers can now communicate by name
# grafana can reach prometheus at http://prometheus:9090
```

#### Network Configuration in Docker Compose

```yaml
version: '3.8'

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  grafana:
    image: grafana/grafana:latest
    networks:
      - frontend
      - backend
    ports:
      - "3000:3000"
  
  prometheus:
    image: prom/prometheus:latest
    networks:
      - backend
    # No ports exposed - only accessible from backend network
  
  nginx:
    image: nginx:alpine
    networks:
      - frontend
    ports:
      - "80:80"
```

### Volume Management

Volumes persist data and share files between containers and the host.

#### Volume Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER VOLUME TYPES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  NAMED VOLUMES                    BIND MOUNTS                   TMPFS           │
│  ┌─────────────────┐             ┌─────────────────┐           ┌─────────────┐  │
│  │ Managed by      │             │ Host path       │           │ In-memory   │  │
│  │ Docker          │             │ mounted into    │           │ storage     │  │
│  │                 │             │ container       │           │             │  │
│  │ Best for:       │             │ Best for:       │           │ Best for:   │  │
│  │ • Databases     │             │ • Development   │           │ • Secrets   │  │
│  │ • Persistent    │             │ • Config files  │           │ • Temp data │  │
│  │   data          │             │ • Source code   │           │             │  │
│  └─────────────────┘             └─────────────────┘           └─────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


#### Volume Commands

```bash
# Create a named volume
docker volume create grafana-data

# Run with named volume
docker run -d --name grafana \
    -v grafana-data:/var/lib/grafana \
    grafana/grafana

# Bind mount for development
docker run -d --name grafana \
    -v $(pwd)/provisioning:/etc/grafana/provisioning \
    -v $(pwd)/dashboards:/var/lib/grafana/dashboards \
    grafana/grafana

# Inspect volume
docker volume inspect grafana-data

# Backup volume data
docker run --rm \
    -v grafana-data:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/grafana-backup.tar.gz /data
```

### Docker Compose for Development

Docker Compose simplifies multi-container development environments.

#### Complete Development Stack

```yaml
version: '3.8'

services:
  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-clock-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./provisioning:/etc/grafana/provisioning
      - ./dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
      - loki
    networks:
      - monitoring

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - monitoring

  # Loki for logs
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki-data:/loki
    networks:
      - monitoring

  # Your plugin/service under development
  my-datasource:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: my-datasource
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=debug
      - DB_HOST=postgres
    depends_on:
      - postgres
    volumes:
      - ./:/app  # Mount source for hot reload
    networks:
      - monitoring

  # Database for testing
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      - POSTGRES_USER=grafana
      - POSTGRES_PASSWORD=grafana
      - POSTGRES_DB=testdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - monitoring

volumes:
  grafana-data:
  prometheus-data:
  loki-data:
  postgres-data:

networks:
  monitoring:
    driver: bridge
```

#### Development Workflow Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f my-datasource

# Rebuild and restart a single service
docker-compose up -d --build my-datasource

# Run tests in container
docker-compose exec my-datasource go test ./...

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## Data Source Concepts

Understanding Grafana data sources is fundamental for plugin development. Data sources connect Grafana to external data backends.

> **Related Reading**: For the complete Grafana ecosystem overview, see [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md)

### What is a Grafana Data Source?

A data source is a plugin that enables Grafana to query and visualize data from external systems.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCE ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Grafana   │    │   Data Source   │    │    Backend      │                 │
│  │   Frontend  │───▶│     Plugin      │───▶│    System       │                 │
│  │             │    │                 │    │                 │                 │
│  │  • Query    │    │  • Query        │    │  • Prometheus   │                 │
│  │    Editor   │    │    Handler      │    │  • MySQL        │                 │
│  │  • Config   │    │  • Auth         │    │  • PostgreSQL   │                 │
│  │    Editor   │    │  • Transform    │    │  • Custom API   │                 │
│  └─────────────┘    └─────────────────┘    └─────────────────┘                 │
│                                                                                  │
│  Data Flow:                                                                      │
│  1. User builds query in Grafana UI                                             │
│  2. Query sent to data source plugin                                            │
│  3. Plugin translates and executes against backend                              │
│  4. Results transformed to Grafana data frames                                  │
│  5. Data frames rendered in panels                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Data Source Types

| Type | Description | Examples |
|------|-------------|----------|
| **Time Series** | Data indexed by time | Prometheus, InfluxDB, Graphite |
| **SQL** | Relational databases | MySQL, PostgreSQL, MSSQL |
| **Logs** | Log aggregation systems | Loki, Elasticsearch |
| **Traces** | Distributed tracing | Tempo, Jaeger, Zipkin |
| **Custom** | Any data backend | REST APIs, GraphQL, proprietary systems |

### Query and Response Models

Understanding the query lifecycle is essential for building data source plugins.

#### Query Request Structure

```go
package plugin

import (
    "context"
    "encoding/json"
    "time"
    
    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

// QueryModel represents the query from Grafana
type QueryModel struct {
    QueryText   string `json:"queryText"`
    Format      string `json:"format"`      // "time_series" or "table"
    MaxDataPoints int64 `json:"maxDataPoints"`
}

// HandleQuery processes incoming queries
func (ds *DataSource) HandleQuery(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()
    
    for _, query := range req.Queries {
        // Parse the query model
        var qm QueryModel
        if err := json.Unmarshal(query.JSON, &qm); err != nil {
            response.Responses[query.RefID] = backend.ErrDataResponse(
                backend.StatusBadRequest,
                "failed to parse query: "+err.Error(),
            )
            continue
        }
        
        // Execute query with time range
        result, err := ds.executeQuery(ctx, qm, query.TimeRange)
        if err != nil {
            response.Responses[query.RefID] = backend.ErrDataResponse(
                backend.StatusInternal,
                "query failed: "+err.Error(),
            )
            continue
        }
        
        response.Responses[query.RefID] = result
    }
    
    return response, nil
}

// TimeRange from the query
type TimeRange struct {
    From time.Time
    To   time.Time
}
```

#### Building Data Frames

Data frames are Grafana's universal data format for query results.

```go
package plugin

import (
    "time"
    
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// BuildTimeSeriesFrame creates a time series data frame
func BuildTimeSeriesFrame(name string, timestamps []time.Time, values []float64) *data.Frame {
    frame := data.NewFrame(name,
        data.NewField("time", nil, timestamps),
        data.NewField("value", nil, values),
    )
    
    // Set field configuration
    frame.Fields[0].Config = &data.FieldConfig{
        DisplayName: "Time",
    }
    frame.Fields[1].Config = &data.FieldConfig{
        DisplayName: name,
        Unit:        "short",
    }
    
    return frame
}

// BuildTableFrame creates a table data frame
func BuildTableFrame(name string, columns []string, rows [][]interface{}) *data.Frame {
    fields := make([]*data.Field, len(columns))
    
    for i, col := range columns {
        // Determine field type from first row
        var values interface{}
        switch rows[0][i].(type) {
        case string:
            vals := make([]string, len(rows))
            for j, row := range rows {
                vals[j] = row[i].(string)
            }
            values = vals
        case float64:
            vals := make([]float64, len(rows))
            for j, row := range rows {
                vals[j] = row[i].(float64)
            }
            values = vals
        case int64:
            vals := make([]int64, len(rows))
            for j, row := range rows {
                vals[j] = row[i].(int64)
            }
            values = vals
        case time.Time:
            vals := make([]time.Time, len(rows))
            for j, row := range rows {
                vals[j] = row[i].(time.Time)
            }
            values = vals
        }
        
        fields[i] = data.NewField(col, nil, values)
    }
    
    return data.NewFrame(name, fields...)
}

// BuildMultiSeriesFrame creates multiple time series in one frame
func BuildMultiSeriesFrame(name string, series map[string][]float64, timestamps []time.Time) *data.Frame {
    fields := []*data.Field{
        data.NewField("time", nil, timestamps),
    }
    
    for seriesName, values := range series {
        field := data.NewField(seriesName, nil, values)
        field.Config = &data.FieldConfig{
            DisplayName: seriesName,
        }
        fields = append(fields, field)
    }
    
    return data.NewFrame(name, fields...)
}
```


### Time Series Data Structures

Time series data is the most common format in Grafana. Understanding its structure is crucial.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TIME SERIES DATA STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WIDE FORMAT (Multiple values per timestamp)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ time                  │ cpu_user │ cpu_system │ cpu_idle │              │   │
│  │ 2024-01-15T10:00:00Z │ 25.5     │ 10.2       │ 64.3     │              │   │
│  │ 2024-01-15T10:01:00Z │ 30.1     │ 12.5       │ 57.4     │              │   │
│  │ 2024-01-15T10:02:00Z │ 28.7     │ 11.8       │ 59.5     │              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  LONG FORMAT (One value per row with labels)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ time                  │ metric     │ value │ host      │                │   │
│  │ 2024-01-15T10:00:00Z │ cpu_user   │ 25.5  │ server-1  │                │   │
│  │ 2024-01-15T10:00:00Z │ cpu_system │ 10.2  │ server-1  │                │   │
│  │ 2024-01-15T10:00:00Z │ cpu_user   │ 22.1  │ server-2  │                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Time Series Utilities

```go
package timeseries

import (
    "sort"
    "time"
)

// Point represents a single time series data point
type Point struct {
    Timestamp time.Time
    Value     float64
}

// Series represents a time series with labels
type Series struct {
    Name   string
    Labels map[string]string
    Points []Point
}

// Downsample reduces the number of points using averaging
func (s *Series) Downsample(maxPoints int) *Series {
    if len(s.Points) <= maxPoints {
        return s
    }
    
    // Sort by timestamp
    sort.Slice(s.Points, func(i, j int) bool {
        return s.Points[i].Timestamp.Before(s.Points[j].Timestamp)
    })
    
    bucketSize := len(s.Points) / maxPoints
    downsampled := make([]Point, 0, maxPoints)
    
    for i := 0; i < len(s.Points); i += bucketSize {
        end := i + bucketSize
        if end > len(s.Points) {
            end = len(s.Points)
        }
        
        // Average the bucket
        var sum float64
        for j := i; j < end; j++ {
            sum += s.Points[j].Value
        }
        
        downsampled = append(downsampled, Point{
            Timestamp: s.Points[i].Timestamp,
            Value:     sum / float64(end-i),
        })
    }
    
    return &Series{
        Name:   s.Name,
        Labels: s.Labels,
        Points: downsampled,
    }
}

// FillGaps fills missing data points with interpolation or null
func (s *Series) FillGaps(interval time.Duration, fillMethod string) *Series {
    if len(s.Points) < 2 {
        return s
    }
    
    sort.Slice(s.Points, func(i, j int) bool {
        return s.Points[i].Timestamp.Before(s.Points[j].Timestamp)
    })
    
    filled := make([]Point, 0)
    
    for i := 0; i < len(s.Points)-1; i++ {
        filled = append(filled, s.Points[i])
        
        current := s.Points[i].Timestamp
        next := s.Points[i+1].Timestamp
        
        // Fill gaps
        for t := current.Add(interval); t.Before(next); t = t.Add(interval) {
            var value float64
            switch fillMethod {
            case "null":
                value = 0 // or use NaN
            case "previous":
                value = s.Points[i].Value
            case "linear":
                // Linear interpolation
                progress := float64(t.Sub(current)) / float64(next.Sub(current))
                value = s.Points[i].Value + progress*(s.Points[i+1].Value-s.Points[i].Value)
            }
            filled = append(filled, Point{Timestamp: t, Value: value})
        }
    }
    filled = append(filled, s.Points[len(s.Points)-1])
    
    return &Series{
        Name:   s.Name,
        Labels: s.Labels,
        Points: filled,
    }
}
```

### Authentication Patterns

Data sources often need to authenticate with backend systems.

#### Authentication Types

| Type | Use Case | Implementation |
|------|----------|----------------|
| **Basic Auth** | Simple username/password | HTTP Authorization header |
| **API Key** | Service-to-service | Custom header or query param |
| **OAuth 2.0** | Third-party services | Token refresh flow |
| **mTLS** | High-security environments | Client certificates |

#### Implementing Authentication

```go
package plugin

import (
    "context"
    "encoding/base64"
    "fmt"
    "net/http"
    
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
)

// DataSourceSettings holds configuration from Grafana
type DataSourceSettings struct {
    URL      string `json:"url"`
    AuthType string `json:"authType"`
}

// SecureSettings holds sensitive configuration
type SecureSettings struct {
    APIKey   string
    Password string
}

// NewHTTPClient creates an authenticated HTTP client
func NewHTTPClient(settings backend.DataSourceInstanceSettings) (*http.Client, error) {
    opts, err := settings.HTTPClientOptions()
    if err != nil {
        return nil, fmt.Errorf("failed to get HTTP options: %w", err)
    }
    
    // Add custom middleware for authentication
    opts.Middlewares = append(opts.Middlewares, authMiddleware(settings))
    
    return httpclient.New(opts)
}


// authMiddleware adds authentication to requests
func authMiddleware(settings backend.DataSourceInstanceSettings) httpclient.Middleware {
    return httpclient.MiddlewareFunc(func(opts httpclient.Options, next http.RoundTripper) http.RoundTripper {
        return httpclient.RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
            // Get secure settings
            apiKey := settings.DecryptedSecureJSONData["apiKey"]
            
            if apiKey != "" {
                req.Header.Set("X-API-Key", apiKey)
            }
            
            // Basic auth
            if user := settings.BasicAuthUser; user != "" {
                password := settings.DecryptedSecureJSONData["basicAuthPassword"]
                auth := base64.StdEncoding.EncodeToString([]byte(user + ":" + password))
                req.Header.Set("Authorization", "Basic "+auth)
            }
            
            return next.RoundTrip(req)
        })
    })
}

// OAuth2Client handles OAuth 2.0 token management
type OAuth2Client struct {
    tokenURL     string
    clientID     string
    clientSecret string
    token        *Token
}

type Token struct {
    AccessToken  string
    RefreshToken string
    ExpiresAt    time.Time
}

func (c *OAuth2Client) GetToken(ctx context.Context) (string, error) {
    if c.token != nil && time.Now().Before(c.token.ExpiresAt.Add(-time.Minute)) {
        return c.token.AccessToken, nil
    }
    
    // Refresh or obtain new token
    return c.refreshToken(ctx)
}

func (c *OAuth2Client) refreshToken(ctx context.Context) (string, error) {
    // Implementation of OAuth token refresh
    // ...
    return "", nil
}
```

### Health Check Implementations

Health checks ensure data sources are properly configured and accessible.

```go
package plugin

import (
    "context"
    "fmt"
    "net/http"
    "time"
    
    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

// CheckHealth verifies the data source connection
func (ds *DataSource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    // Create a context with timeout
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    // Test connection to backend
    if err := ds.testConnection(ctx); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Connection failed: %v", err),
        }, nil
    }
    
    // Test authentication
    if err := ds.testAuth(ctx); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Authentication failed: %v", err),
        }, nil
    }
    
    // Test query capability
    if err := ds.testQuery(ctx); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Query test failed: %v", err),
        }, nil
    }
    
    return &backend.CheckHealthResult{
        Status:  backend.HealthStatusOk,
        Message: "Data source is working",
    }, nil
}

func (ds *DataSource) testConnection(ctx context.Context) error {
    req, err := http.NewRequestWithContext(ctx, "GET", ds.settings.URL+"/health", nil)
    if err != nil {
        return err
    }
    
    resp, err := ds.httpClient.Do(req)
    if err != nil {
        return fmt.Errorf("connection error: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("unexpected status: %d", resp.StatusCode)
    }
    
    return nil
}

func (ds *DataSource) testAuth(ctx context.Context) error {
    // Test an authenticated endpoint
    req, err := http.NewRequestWithContext(ctx, "GET", ds.settings.URL+"/api/v1/status", nil)
    if err != nil {
        return err
    }
    
    resp, err := ds.httpClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
        return fmt.Errorf("authentication failed")
    }
    
    return nil
}

func (ds *DataSource) testQuery(ctx context.Context) error {
    // Execute a simple test query
    _, err := ds.executeQuery(ctx, QueryModel{
        QueryText: "SELECT 1",
        Format:    "table",
    }, backend.TimeRange{
        From: time.Now().Add(-time.Hour),
        To:   time.Now(),
    })
    return err
}
```

---

## Practical Exercises

Apply your knowledge with these hands-on exercises.

### Exercise 1: Build a Simple HTTP API

Create a Go HTTP server that:
1. Serves a `/health` endpoint returning JSON status
2. Implements logging middleware
3. Handles `/api/query` POST requests with JSON body parsing
4. Returns proper error responses

**Starter Code**: See [Go Distributed Systems](../../code-implementations/go-distributed-systems/)

### Exercise 2: Containerize a Go Application

1. Write a multi-stage Dockerfile for a Go application
2. Create a Docker Compose file with:
   - Your application
   - A PostgreSQL database
   - Grafana for visualization
3. Configure networking so services can communicate

**Reference**: See [Kubernetes Configs](../../code-implementations/kubernetes-configs/)

### Exercise 3: Implement a Mock Data Source

Create a simple data source that:
1. Generates random time series data
2. Supports configurable time ranges
3. Returns data in Grafana data frame format
4. Implements health checks

**Reference**: See [Grafana Plugins](../../code-implementations/grafana-plugins/)

---

## Key Takeaways

### Go Backend Development
- Use proper HTTP server configuration with timeouts
- Implement middleware chains for cross-cutting concerns
- Follow Go error handling best practices with wrapping
- Use structured configuration management

### Docker
- Use multi-stage builds for smaller, secure images
- Understand networking for container communication
- Use volumes for persistent data
- Docker Compose simplifies development environments

### Data Sources
- Understand the query/response lifecycle
- Master data frame construction
- Implement proper authentication patterns
- Always include health checks

---

## Next Steps

Ready to continue? Proceed to:

1. **[Intermediate](./intermediate.md)** - Grafana plugin development, CI/CD pipelines, Kubernetes deployment
2. **[Questions](./questions/)** - Test your knowledge with technical interview questions

---

## Quick Reference Links

### Internal
- [← Back to Role Overview](./README.md)
- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md)
- [LGTM Stack](../../shared-concepts/lgtm-stack.md)
- [Observability Principles](../../shared-concepts/observability-principles.md)

### External
- [Go Documentation](https://go.dev/doc/)
- [Docker Documentation](https://docs.docker.com/)
- [Grafana Plugin SDK](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go)
- [Grafana Data Frames](https://grafana.com/developers/plugin-tools/introduction/data-frames)
