# Intermediate: Senior Software Engineer - Grafana OSS

This document covers intermediate-level topics for the Senior Software Engineer role on the Grafana OSS Big Tent team. These concepts build on the fundamentals and prepare you for advanced plugin development and production deployments.

## Table of Contents

1. [Grafana Plugin Development](#grafana-plugin-development)
2. [CI/CD Pipeline Design](#cicd-pipeline-design)
3. [Kubernetes Deployment Patterns](#kubernetes-deployment-patterns)
4. [Monitoring Tool Integration](#monitoring-tool-integration)
5. [Practical Exercises](#practical-exercises)

---

## Grafana Plugin Development

Grafana's plugin architecture enables extending the platform with custom data sources, panels, and applications. Understanding plugin development is essential for contributing to the OSS ecosystem.

> **Related Reading**: For Grafana architecture overview, see [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md)

### Plugin Types Overview

Grafana supports three main plugin types:

| Plugin Type | Purpose | Primary Language | Use Cases |
|-------------|---------|------------------|-----------|
| **Data Source** | Connect to external data backends | Go + TypeScript | Prometheus, MySQL, custom APIs |
| **Panel** | Visualize data in custom ways | TypeScript/React | Custom charts, maps, widgets |
| **App** | Bundle multiple plugins with pages | TypeScript/React | Complete solutions, dashboards |

### Data Source Plugin Architecture

Data source plugins have both frontend and backend components:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DATA SOURCE PLUGIN ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (TypeScript/React)              BACKEND (Go)                          │
│  ┌─────────────────────────┐             ┌─────────────────────────┐            │
│  │ • ConfigEditor          │             │ • QueryData handler     │            │
│  │ • QueryEditor           │  ◄────────► │ • Health check          │            │
│  │ • Variable support      │   gRPC      │ • Resource handler      │            │
│  │ • Explore support       │             │ • Streaming support     │            │
│  └─────────────────────────┘             └─────────────────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Backend Plugin Development (Go)

The backend handles data queries, authentication, and communication with external systems.

#### Plugin SDK Setup

```go
package main

import (
    "os"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
    "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
    "github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
    // Start listening to requests from Grafana
    if err := datasource.Manage("myorg-mydatasource-datasource", NewDatasource, datasource.ManageOpts{}); err != nil {
        log.DefaultLogger.Error(err.Error())
        os.Exit(1)
    }
}

// Datasource is the main plugin struct
type Datasource struct {
    im instancemgmt.InstanceManager
}

// NewDatasource creates a new datasource instance
func NewDatasource(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
    return &DatasourceInstance{
        settings: settings,
    }, nil
}

// DatasourceInstance holds per-datasource configuration
type DatasourceInstance struct {
    settings backend.DataSourceInstanceSettings
    client   *APIClient // Your custom client
}

// Dispose cleans up resources when instance is removed
func (d *DatasourceInstance) Dispose() {
    if d.client != nil {
        d.client.Close()
    }
}
```

#### Implementing QueryData Handler

The QueryData handler processes queries from Grafana dashboards:

```go
package plugin

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)

// QueryData handles multiple queries in a single request
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    response := backend.NewQueryDataResponse()

    // Process each query independently
    for _, q := range req.Queries {
        res := d.query(ctx, req.PluginContext, q)
        response.Responses[q.RefID] = res
    }

    return response, nil
}

// queryModel represents the query structure from the frontend
type queryModel struct {
    QueryText   string `json:"queryText"`
    MetricName  string `json:"metricName"`
    Aggregation string `json:"aggregation"`
}

func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
    var response backend.DataResponse

    // Parse the query model
    var qm queryModel
    if err := json.Unmarshal(query.JSON, &qm); err != nil {
        return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err))
    }

    // Get the datasource instance
    instance, err := d.im.Get(ctx, pCtx)
    if err != nil {
        return backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("get instance: %v", err))
    }
    ds := instance.(*DatasourceInstance)

    // Execute the query against your backend
    results, err := ds.client.Query(ctx, qm.QueryText, query.TimeRange.From, query.TimeRange.To)
    if err != nil {
        return backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("query failed: %v", err))
    }

    // Create a data frame for the response
    frame := data.NewFrame("response",
        data.NewField("time", nil, results.Timestamps),
        data.NewField(qm.MetricName, nil, results.Values),
    )

    // Add metadata
    frame.Meta = &data.FrameMeta{
        ExecutedQueryString: qm.QueryText,
    }

    response.Frames = append(response.Frames, frame)
    return response
}
```


#### Health Check Implementation

Health checks verify the datasource connection is working:

```go
// CheckHealth handles health check requests from Grafana
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    // Get the datasource instance
    instance, err := d.im.Get(ctx, req.PluginContext)
    if err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Failed to get instance: %v", err),
        }, nil
    }
    ds := instance.(*DatasourceInstance)

    // Test the connection
    if err := ds.client.Ping(ctx); err != nil {
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: fmt.Sprintf("Connection failed: %v", err),
        }, nil
    }

    return &backend.CheckHealthResult{
        Status:  backend.HealthStatusOk,
        Message: "Data source is working",
    }, nil
}
```

#### Resource Handler for Custom Endpoints

Resource handlers enable custom HTTP endpoints for your plugin:

```go
package plugin

import (
    "encoding/json"
    "net/http"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

// CallResource handles custom HTTP requests
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    // Create an HTTP handler
    handler := httpadapter.New(d.resourceHandler())
    return handler.CallResource(ctx, req, sender)
}

func (d *Datasource) resourceHandler() http.Handler {
    mux := http.NewServeMux()

    // List available metrics
    mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
        metrics := []string{"cpu_usage", "memory_usage", "disk_io", "network_traffic"}
        json.NewEncoder(w).Encode(metrics)
    })

    // Get metric metadata
    mux.HandleFunc("/metrics/", func(w http.ResponseWriter, r *http.Request) {
        metricName := r.URL.Path[len("/metrics/"):]
        metadata := map[string]interface{}{
            "name":        metricName,
            "type":        "gauge",
            "description": fmt.Sprintf("Description for %s", metricName),
        }
        json.NewEncoder(w).Encode(metadata)
    })

    // Validate query syntax
    mux.HandleFunc("/validate", func(w http.ResponseWriter, r *http.Request) {
        var query struct {
            QueryText string `json:"queryText"`
        }
        if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
            http.Error(w, "Invalid request", http.StatusBadRequest)
            return
        }

        // Validate the query
        if err := validateQuerySyntax(query.QueryText); err != nil {
            json.NewEncoder(w).Encode(map[string]interface{}{
                "valid": false,
                "error": err.Error(),
            })
            return
        }

        json.NewEncoder(w).Encode(map[string]interface{}{
            "valid": true,
        })
    })

    return mux
}
```


### Frontend Plugin Development (TypeScript/React)

The frontend handles user interface components for configuration and query editing.

#### Query Editor Component

```typescript
// src/components/QueryEditor.tsx
import React, { ChangeEvent } from 'react';
import { InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, queryText: event.target.value });
  };

  const onMetricChange = (value: SelectableValue<string>) => {
    onChange({ ...query, metricName: value.value || '' });
    onRunQuery(); // Execute query immediately on metric change
  };

  const onAggregationChange = (value: SelectableValue<string>) => {
    onChange({ ...query, aggregation: value.value || 'avg' });
    onRunQuery();
  };

  const aggregationOptions: Array<SelectableValue<string>> = [
    { label: 'Average', value: 'avg' },
    { label: 'Sum', value: 'sum' },
    { label: 'Min', value: 'min' },
    { label: 'Max', value: 'max' },
    { label: 'Count', value: 'count' },
  ];

  return (
    <div className="gf-form-group">
      <InlineField label="Query" labelWidth={12} tooltip="Enter your query expression">
        <Input
          value={query.queryText || ''}
          onChange={onQueryTextChange}
          onBlur={onRunQuery}
          placeholder="Enter query..."
          width={60}
        />
      </InlineField>

      <InlineField label="Metric" labelWidth={12}>
        <Select
          options={datasource.getMetricOptions()}
          value={query.metricName}
          onChange={onMetricChange}
          width={30}
          placeholder="Select metric"
        />
      </InlineField>

      <InlineField label="Aggregation" labelWidth={12}>
        <Select
          options={aggregationOptions}
          value={query.aggregation}
          onChange={onAggregationChange}
          width={20}
        />
      </InlineField>
    </div>
  );
}
```

#### Config Editor Component

```typescript
// src/components/ConfigEditor.tsx
import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput, Switch } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  const onURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        url: event.target.value,
      },
    });
  };

  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...secureJsonData,
        apiKey: event.target.value,
      },
    });
  };

  const onResetAPIKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...secureJsonData,
        apiKey: '',
      },
    });
  };

  const onTLSSkipVerifyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        tlsSkipVerify: event.currentTarget.checked,
      },
    });
  };

  return (
    <div className="gf-form-group">
      <InlineField label="URL" labelWidth={14} tooltip="Base URL of your data source">
        <Input
          value={jsonData.url || ''}
          onChange={onURLChange}
          placeholder="https://api.example.com"
          width={40}
        />
      </InlineField>

      <InlineField label="API Key" labelWidth={14}>
        <SecretInput
          isConfigured={secureJsonFields?.apiKey}
          value={secureJsonData?.apiKey || ''}
          placeholder="Enter API key"
          width={40}
          onReset={onResetAPIKey}
          onChange={onAPIKeyChange}
        />
      </InlineField>

      <InlineField label="Skip TLS Verify" labelWidth={14} tooltip="Skip TLS certificate verification">
        <Switch
          value={jsonData.tlsSkipVerify || false}
          onChange={onTLSSkipVerifyChange}
        />
      </InlineField>
    </div>
  );
}
```


#### DataSource Class Implementation

```typescript
// src/datasource.ts
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  SelectableValue,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { MyDataSourceOptions, MyQuery } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  url?: string;
  private metricsCache: Array<SelectableValue<string>> = [];

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url;
  }

  // Query data from the backend
  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Process template variables
    const queries = options.targets.map((target) => ({
      ...target,
      queryText: getTemplateSrv().replace(target.queryText, options.scopedVars),
    }));

    // Call the backend plugin
    const response = await getBackendSrv().datasourceRequest({
      method: 'POST',
      url: `${this.url}/query`,
      data: {
        queries,
        from,
        to,
      },
    });

    return { data: response.data.results };
  }

  // Test datasource connection
  async testDatasource() {
    const response = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: `${this.url}/health`,
    });

    if (response.status === 200) {
      return {
        status: 'success',
        message: 'Data source is working',
      };
    }

    return {
      status: 'error',
      message: response.data?.message || 'Unknown error',
    };
  }

  // Get available metrics for dropdown
  async getMetricOptions(): Promise<Array<SelectableValue<string>>> {
    if (this.metricsCache.length > 0) {
      return this.metricsCache;
    }

    try {
      const response = await getBackendSrv().datasourceRequest({
        method: 'GET',
        url: `${this.url}/resources/metrics`,
      });

      this.metricsCache = response.data.map((metric: string) => ({
        label: metric,
        value: metric,
      }));

      return this.metricsCache;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return [];
    }
  }

  // Support for template variables
  async metricFindQuery(query: string): Promise<Array<SelectableValue<string>>> {
    const response = await getBackendSrv().datasourceRequest({
      method: 'POST',
      url: `${this.url}/resources/variable-query`,
      data: { query },
    });

    return response.data.map((item: { text: string; value: string }) => ({
      text: item.text,
      value: item.value,
    }));
  }
}
```

### Plugin Configuration Files

#### plugin.json

```json
{
  "type": "datasource",
  "name": "My Custom Datasource",
  "id": "myorg-mydatasource-datasource",
  "metrics": true,
  "backend": true,
  "executable": "gpx_mydatasource",
  "info": {
    "description": "Custom data source for My Service",
    "author": {
      "name": "My Organization",
      "url": "https://myorg.com"
    },
    "keywords": ["datasource", "custom"],
    "logos": {
      "small": "img/logo.svg",
      "large": "img/logo.svg"
    },
    "version": "1.0.0",
    "updated": "2024-01-15"
  },
  "dependencies": {
    "grafanaDependency": ">=9.0.0",
    "plugins": []
  },
  "routes": [
    {
      "path": "api",
      "url": "{{ .JsonData.url }}",
      "headers": [
        {
          "name": "Authorization",
          "content": "Bearer {{ .SecureJsonData.apiKey }}"
        }
      ]
    }
  ]
}
```


---

## CI/CD Pipeline Design

Effective CI/CD pipelines ensure code quality, automate testing, and enable reliable deployments. This section covers pipeline design patterns for Grafana plugins and Go services.

> **Related Reading**: For Kubernetes deployment targets, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Pipeline Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE STAGES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│  │  Build  │──▶│  Test   │──▶│  Scan   │──▶│ Package │──▶│ Deploy  │           │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘           │
│       │             │             │             │             │                  │
│       ▼             ▼             ▼             ▼             ▼                  │
│  • Compile      • Unit        • SAST       • Docker      • Staging              │
│  • Lint         • Integration • Deps       • Helm        • Production           │
│  • Type check   • E2E         • Container  • Artifacts   • Rollback             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Pipeline for Grafana Plugins

#### Complete Plugin CI/CD Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  GO_VERSION: '1.21'
  NODE_VERSION: '18'
  PLUGIN_ID: 'myorg-mydatasource-datasource'

jobs:
  # ============================================
  # Build and Lint
  # ============================================
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          go mod download

      - name: Lint Go code
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
          args: --timeout=5m

      - name: Lint TypeScript
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Build frontend
        run: npm run build

      - name: Build backend
        run: |
          mage -v build:linux
          mage -v build:darwin
          mage -v build:windows

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: plugin-dist
          path: dist/
          retention-days: 7

  # ============================================
  # Testing
  # ============================================
  test:
    runs-on: ubuntu-latest
    needs: build
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          go mod download

      - name: Run Go tests
        run: go test -v -race -coverprofile=coverage.out ./...
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: test
          DB_PASSWORD: test
          DB_NAME: testdb

      - name: Run frontend tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.out
          flags: backend

  # ============================================
  # Security Scanning
  # ============================================
  security:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Run gosec security scanner
        uses: securego/gosec@master
        with:
          args: ./...

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  # ============================================
  # E2E Testing
  # ============================================
  e2e:
    runs-on: ubuntu-latest
    needs: [build, test]
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: plugin-dist
          path: dist/

      - name: Start Grafana with plugin
        run: |
          docker-compose -f docker-compose.e2e.yml up -d
          sleep 30  # Wait for Grafana to start

      - name: Run E2E tests
        run: npm run e2e

      - name: Upload E2E screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-screenshots
          path: e2e/screenshots/

      - name: Stop services
        if: always()
        run: docker-compose -f docker-compose.e2e.yml down


  # ============================================
  # Package and Release
  # ============================================
  package:
    runs-on: ubuntu-latest
    needs: [test, security, e2e]
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: plugin-dist
          path: dist/

      - name: Package plugin
        run: |
          cd dist
          zip -r ../${{ env.PLUGIN_ID }}-${{ github.ref_name }}.zip .

      - name: Sign plugin
        run: |
          npx @grafana/sign-plugin@latest \
            --rootUrls https://grafana.myorg.com

      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: ${{ env.PLUGIN_ID }}-${{ github.ref_name }}.zip

  # ============================================
  # Deploy to Staging
  # ============================================
  deploy-staging:
    runs-on: ubuntu-latest
    needs: package
    if: github.event_name == 'release'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          helm upgrade --install grafana-plugin ./helm/grafana-plugin \
            --namespace grafana \
            --set image.tag=${{ github.ref_name }} \
            --set environment=staging \
            --wait --timeout=5m

      - name: Run smoke tests
        run: |
          kubectl run smoke-test --image=curlimages/curl --rm -i --restart=Never -- \
            curl -f http://grafana.grafana.svc:3000/api/health

  # ============================================
  # Deploy to Production
  # ============================================
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event_name == 'release'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          helm upgrade --install grafana-plugin ./helm/grafana-plugin \
            --namespace grafana \
            --set image.tag=${{ github.ref_name }} \
            --set environment=production \
            --set replicas=3 \
            --wait --timeout=10m

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/grafana -n grafana --timeout=5m
```

### GitLab CI Pipeline Alternative

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - package
  - deploy

variables:
  GO_VERSION: "1.21"
  NODE_VERSION: "18"
  PLUGIN_ID: "myorg-mydatasource-datasource"

# Build stage
build:
  stage: build
  image: golang:${GO_VERSION}
  before_script:
    - apt-get update && apt-get install -y nodejs npm
  script:
    - npm ci
    - npm run build
    - go mod download
    - CGO_ENABLED=0 go build -o dist/gpx_mydatasource ./pkg
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

# Unit tests
test:unit:
  stage: test
  image: golang:${GO_VERSION}
  services:
    - postgres:15
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DB_HOST: postgres
  script:
    - go test -v -race -coverprofile=coverage.out ./...
  coverage: '/coverage: \d+.\d+% of statements/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

# Security scanning
security:sast:
  stage: security
  image: securego/gosec:latest
  script:
    - gosec -fmt=json -out=gosec-report.json ./...
  artifacts:
    reports:
      sast: gosec-report.json
  allow_failure: true

security:dependency:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy fs --exit-code 1 --severity HIGH,CRITICAL .
  allow_failure: false

# Package
package:
  stage: package
  image: alpine:latest
  only:
    - tags
  script:
    - cd dist && zip -r ../${PLUGIN_ID}-${CI_COMMIT_TAG}.zip .
  artifacts:
    paths:
      - ${PLUGIN_ID}-*.zip

# Deploy to staging
deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://grafana-staging.myorg.com
  only:
    - tags
  script:
    - kubectl config use-context staging
    - helm upgrade --install grafana-plugin ./helm/grafana-plugin
        --namespace grafana
        --set image.tag=${CI_COMMIT_TAG}
        --wait

# Deploy to production (manual)
deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://grafana.myorg.com
  only:
    - tags
  when: manual
  script:
    - kubectl config use-context production
    - helm upgrade --install grafana-plugin ./helm/grafana-plugin
        --namespace grafana
        --set image.tag=${CI_COMMIT_TAG}
        --set replicas=3
        --wait
```


### Pipeline Best Practices

#### Caching Strategies

```yaml
# Effective caching for Go and Node.js projects
cache:
  # Go module cache
  go-modules:
    key: go-${{ hashFiles('go.sum') }}
    paths:
      - ~/go/pkg/mod
    restore-keys:
      - go-

  # Node modules cache
  node-modules:
    key: node-${{ hashFiles('package-lock.json') }}
    paths:
      - node_modules
    restore-keys:
      - node-

  # Build cache for faster rebuilds
  build-cache:
    key: build-${{ github.sha }}
    paths:
      - dist/
      - .cache/
```

#### Parallel Test Execution

```yaml
# Split tests across multiple runners
test:
  strategy:
    matrix:
      package:
        - ./pkg/datasource/...
        - ./pkg/handlers/...
        - ./pkg/models/...
    fail-fast: false
  steps:
    - name: Run tests for ${{ matrix.package }}
      run: go test -v -race ${{ matrix.package }}
```

#### Deployment Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Rolling** | Gradual replacement of pods | Standard deployments |
| **Blue-Green** | Switch traffic between environments | Zero-downtime releases |
| **Canary** | Route percentage of traffic to new version | Risk mitigation |
| **Feature Flags** | Toggle features without deployment | Gradual rollout |

```yaml
# Canary deployment example
deploy:canary:
  steps:
    - name: Deploy canary (10% traffic)
      run: |
        helm upgrade --install grafana-canary ./helm/grafana-plugin \
          --set replicas=1 \
          --set canary.enabled=true \
          --set canary.weight=10

    - name: Monitor canary metrics
      run: |
        # Check error rate for 10 minutes
        ./scripts/check-canary-health.sh --duration=10m --threshold=0.01

    - name: Promote or rollback
      run: |
        if [ "$CANARY_HEALTHY" = "true" ]; then
          helm upgrade grafana-plugin ./helm/grafana-plugin \
            --set image.tag=${{ github.ref_name }}
        else
          helm rollback grafana-canary
          exit 1
        fi
```

---

## Kubernetes Deployment Patterns

Understanding Kubernetes deployment patterns is essential for running Grafana and plugins in production environments.

> **Related Reading**: For comprehensive Kubernetes concepts, see [Kubernetes Fundamentals](../../shared-concepts/kubernetes-fundamentals.md)

### Grafana Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GRAFANA KUBERNETES ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           INGRESS CONTROLLER                             │    │
│  │                        (nginx/traefik/istio)                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                              SERVICE                                     │    │
│  │                         (ClusterIP/LoadBalancer)                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│           ┌──────────────────────────┼──────────────────────────┐               │
│           ▼                          ▼                          ▼               │
│  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       │
│  │   Grafana Pod   │       │   Grafana Pod   │       │   Grafana Pod   │       │
│  │   (replica 1)   │       │   (replica 2)   │       │   (replica 3)   │       │
│  └─────────────────┘       └─────────────────┘       └─────────────────┘       │
│           │                          │                          │               │
│           └──────────────────────────┼──────────────────────────┘               │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        PERSISTENT VOLUME                                 │    │
│  │                    (dashboards, plugins, config)                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Deployment Manifest

```yaml
# grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
    version: v10.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grafana
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: grafana
        version: v10.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: grafana
      securityContext:
        runAsNonRoot: true
        runAsUser: 472
        fsGroup: 472
      
      initContainers:
        # Install plugins before Grafana starts
        - name: install-plugins
          image: grafana/grafana:10.0.0
          command:
            - /bin/sh
            - -c
            - |
              grafana-cli plugins install grafana-clock-panel
              grafana-cli plugins install grafana-piechart-panel
          volumeMounts:
            - name: plugins
              mountPath: /var/lib/grafana/plugins
      
      containers:
        - name: grafana
          image: grafana/grafana:10.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          
          env:
            - name: GF_SECURITY_ADMIN_USER
              valueFrom:
                secretKeyRef:
                  name: grafana-credentials
                  key: admin-user
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-credentials
                  key: admin-password
            - name: GF_DATABASE_TYPE
              value: postgres
            - name: GF_DATABASE_HOST
              value: postgres.monitoring.svc:5432
            - name: GF_DATABASE_NAME
              value: grafana
            - name: GF_DATABASE_USER
              valueFrom:
                secretKeyRef:
                  name: grafana-db-credentials
                  key: username
            - name: GF_DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-db-credentials
                  key: password
            - name: GF_SERVER_ROOT_URL
              value: https://grafana.example.com
          
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          
          volumeMounts:
            - name: config
              mountPath: /etc/grafana/grafana.ini
              subPath: grafana.ini
            - name: datasources
              mountPath: /etc/grafana/provisioning/datasources
            - name: dashboards-config
              mountPath: /etc/grafana/provisioning/dashboards
            - name: dashboards
              mountPath: /var/lib/grafana/dashboards
            - name: plugins
              mountPath: /var/lib/grafana/plugins
            - name: storage
              mountPath: /var/lib/grafana
      
      volumes:
        - name: config
          configMap:
            name: grafana-config
        - name: datasources
          configMap:
            name: grafana-datasources
        - name: dashboards-config
          configMap:
            name: grafana-dashboards-config
        - name: dashboards
          configMap:
            name: grafana-dashboards
        - name: plugins
          emptyDir: {}
        - name: storage
          persistentVolumeClaim:
            claimName: grafana-storage
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: grafana
                topologyKey: kubernetes.io/hostname
      
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: grafana
```


### Service and Ingress Configuration

```yaml
# grafana-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: 3000
      protocol: TCP
  selector:
    app: grafana
---
# grafana-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
spec:
  tls:
    - hosts:
        - grafana.example.com
      secretName: grafana-tls
  rules:
    - host: grafana.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 80
```

### ConfigMaps for Provisioning

```yaml
# grafana-datasources.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus.monitoring.svc:9090
        isDefault: true
        editable: false
        jsonData:
          timeInterval: "15s"
          httpMethod: POST
      
      - name: Loki
        type: loki
        access: proxy
        url: http://loki.monitoring.svc:3100
        editable: false
        jsonData:
          maxLines: 1000
      
      - name: Tempo
        type: tempo
        access: proxy
        url: http://tempo.monitoring.svc:3200
        editable: false
        jsonData:
          tracesToLogs:
            datasourceUid: loki
            tags: ['job', 'instance']
            mappedTags: [{ key: 'service.name', value: 'service' }]
            mapTagNamesEnabled: true
            filterByTraceID: true
          serviceMap:
            datasourceUid: prometheus
          nodeGraph:
            enabled: true
---
# grafana-dashboards-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards-config
  namespace: monitoring
data:
  dashboards.yaml: |
    apiVersion: 1
    providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        updateIntervalSeconds: 30
        options:
          path: /var/lib/grafana/dashboards
```

### Helm Chart for Grafana Deployment

```yaml
# helm/grafana-plugin/values.yaml
replicaCount: 3

image:
  repository: grafana/grafana
  tag: "10.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: grafana.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: grafana-tls
      hosts:
        - grafana.example.com

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

persistence:
  enabled: true
  size: 10Gi
  storageClass: standard

grafana:
  adminUser: admin
  # adminPassword should be set via --set or secrets
  
  plugins:
    - grafana-clock-panel
    - grafana-piechart-panel
  
  datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus:9090
      isDefault: true
    - name: Loki
      type: loki
      url: http://loki:3100

  dashboardProviders:
    - name: default
      folder: ''
      type: file
      options:
        path: /var/lib/grafana/dashboards

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

podDisruptionBudget:
  enabled: true
  minAvailable: 1

nodeSelector: {}

tolerations: []

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


### StatefulSet for Database-Backed Grafana

When using an external database isn't feasible, use a StatefulSet with embedded SQLite:

```yaml
# grafana-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: grafana
  namespace: monitoring
spec:
  serviceName: grafana
  replicas: 1  # SQLite requires single replica
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.0.0
          ports:
            - containerPort: 3000
          volumeMounts:
            - name: grafana-data
              mountPath: /var/lib/grafana
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
  volumeClaimTemplates:
    - metadata:
        name: grafana-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 10Gi
```

### Horizontal Pod Autoscaler

```yaml
# grafana-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: grafana
  namespace: monitoring
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grafana
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
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

## Monitoring Tool Integration

Integrating monitoring tools with Grafana enables comprehensive observability. This section covers practical integration patterns.

> **Related Reading**: For observability concepts, see [Observability Principles](../../shared-concepts/observability-principles.md) and [LGTM Stack](../../shared-concepts/lgtm-stack.md)

### Prometheus Integration

#### Prometheus Configuration for Grafana Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Scrape Grafana metrics
  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana:3000']
    metrics_path: /metrics
    scheme: http

  # Kubernetes service discovery for pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  # Scrape your custom services
  - job_name: 'my-datasource-plugin'
    static_configs:
      - targets: ['my-datasource:8080']
    metrics_path: /metrics
```


#### Instrumenting Go Services for Prometheus

```go
package metrics

import (
    "net/http"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    // Request metrics
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    httpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )

    // Query metrics
    queryExecutionTime = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "datasource_query_duration_seconds",
            Help:    "Query execution time in seconds",
            Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
        },
        []string{"query_type"},
    )

    queryErrorsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "datasource_query_errors_total",
            Help: "Total number of query errors",
        },
        []string{"query_type", "error_type"},
    )

    // Connection pool metrics
    connectionPoolSize = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "datasource_connection_pool_size",
            Help: "Current size of the connection pool",
        },
    )

    connectionPoolActive = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "datasource_connection_pool_active",
            Help: "Number of active connections",
        },
    )
)

// MetricsMiddleware wraps HTTP handlers with metrics collection
func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Wrap response writer to capture status code
        wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        next.ServeHTTP(wrapped, r)

        duration := time.Since(start).Seconds()

        httpRequestsTotal.WithLabelValues(
            r.Method,
            r.URL.Path,
            http.StatusText(wrapped.statusCode),
        ).Inc()

        httpRequestDuration.WithLabelValues(
            r.Method,
            r.URL.Path,
        ).Observe(duration)
    })
}

type statusResponseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}

// RecordQueryMetrics records query execution metrics
func RecordQueryMetrics(queryType string, duration time.Duration, err error) {
    queryExecutionTime.WithLabelValues(queryType).Observe(duration.Seconds())

    if err != nil {
        errorType := classifyError(err)
        queryErrorsTotal.WithLabelValues(queryType, errorType).Inc()
    }
}

func classifyError(err error) string {
    // Classify error types for better metrics
    switch {
    case isTimeoutError(err):
        return "timeout"
    case isConnectionError(err):
        return "connection"
    case isValidationError(err):
        return "validation"
    default:
        return "unknown"
    }
}

// UpdateConnectionPoolMetrics updates connection pool gauges
func UpdateConnectionPoolMetrics(size, active int) {
    connectionPoolSize.Set(float64(size))
    connectionPoolActive.Set(float64(active))
}

// Handler returns the Prometheus metrics handler
func Handler() http.Handler {
    return promhttp.Handler()
}
```

### Loki Integration for Logging

#### Structured Logging with Loki

```go
package logging

import (
    "context"
    "os"
    "time"

    "github.com/go-kit/log"
    "github.com/go-kit/log/level"
)

// Logger wraps go-kit logger with structured fields
type Logger struct {
    logger log.Logger
}

// NewLogger creates a new structured logger
func NewLogger(serviceName string) *Logger {
    logger := log.NewJSONLogger(log.NewSyncWriter(os.Stdout))
    logger = log.With(logger,
        "service", serviceName,
        "ts", log.DefaultTimestampUTC,
        "caller", log.DefaultCaller,
    )

    return &Logger{logger: logger}
}

// WithContext adds context fields to the logger
func (l *Logger) WithContext(ctx context.Context) *Logger {
    // Extract trace ID if available
    traceID := ctx.Value("trace_id")
    if traceID != nil {
        return &Logger{
            logger: log.With(l.logger, "trace_id", traceID),
        }
    }
    return l
}

// WithFields adds additional fields
func (l *Logger) WithFields(keyvals ...interface{}) *Logger {
    return &Logger{
        logger: log.With(l.logger, keyvals...),
    }
}

// Info logs at info level
func (l *Logger) Info(msg string, keyvals ...interface{}) {
    keyvals = append([]interface{}{"msg", msg}, keyvals...)
    level.Info(l.logger).Log(keyvals...)
}

// Error logs at error level
func (l *Logger) Error(msg string, err error, keyvals ...interface{}) {
    keyvals = append([]interface{}{"msg", msg, "error", err.Error()}, keyvals...)
    level.Error(l.logger).Log(keyvals...)
}

// Debug logs at debug level
func (l *Logger) Debug(msg string, keyvals ...interface{}) {
    keyvals = append([]interface{}{"msg", msg}, keyvals...)
    level.Debug(l.logger).Log(keyvals...)
}

// Warn logs at warn level
func (l *Logger) Warn(msg string, keyvals ...interface{}) {
    keyvals = append([]interface{}{"msg", msg}, keyvals...)
    level.Warn(l.logger).Log(keyvals...)
}

// Example usage in a handler
func QueryHandler(logger *Logger) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        ctx := r.Context()

        // Log request start
        logger.WithContext(ctx).Info("query started",
            "method", r.Method,
            "path", r.URL.Path,
            "remote_addr", r.RemoteAddr,
        )

        // Execute query...
        result, err := executeQuery(ctx, r)

        duration := time.Since(start)

        if err != nil {
            logger.WithContext(ctx).Error("query failed", err,
                "duration_ms", duration.Milliseconds(),
            )
            http.Error(w, "Query failed", http.StatusInternalServerError)
            return
        }

        logger.WithContext(ctx).Info("query completed",
            "duration_ms", duration.Milliseconds(),
            "result_count", len(result),
        )

        // Write response...
    }
}
```


#### Promtail Configuration for Log Collection

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Scrape Kubernetes pod logs
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    pipeline_stages:
      - cri: {}
      - json:
          expressions:
            level: level
            msg: msg
            trace_id: trace_id
            service: service
      - labels:
          level:
          service:
          trace_id:
      - timestamp:
          source: ts
          format: RFC3339Nano
    relabel_configs:
      - source_labels:
          - __meta_kubernetes_pod_controller_name
        regex: ([0-9a-z-.]+?)(-[0-9a-f]{8,10})?
        action: replace
        target_label: __tmp_controller_name
      - source_labels:
          - __meta_kubernetes_pod_label_app_kubernetes_io_name
          - __meta_kubernetes_pod_label_app
          - __tmp_controller_name
          - __meta_kubernetes_pod_name
        regex: ^;*([^;]+)(;.*)?$
        action: replace
        target_label: app
      - source_labels:
          - __meta_kubernetes_pod_node_name
        action: replace
        target_label: node_name
      - source_labels:
          - __meta_kubernetes_namespace
        action: replace
        target_label: namespace
      - action: replace
        replacement: /var/log/pods/*$1/*.log
        separator: /
        source_labels:
          - __meta_kubernetes_pod_uid
          - __meta_kubernetes_pod_container_name
        target_label: __path__
```

### Alerting Configuration

#### Grafana Alerting Rules

```yaml
# alerting-rules.yaml
apiVersion: 1

groups:
  - orgId: 1
    name: Service Health
    folder: Alerts
    interval: 1m
    rules:
      - uid: high-error-rate
        title: High Error Rate
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: |
                sum(rate(http_requests_total{status=~"5.."}[5m])) 
                / 
                sum(rate(http_requests_total[5m])) * 100
              intervalMs: 1000
              maxDataPoints: 43200
          - refId: B
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params: [5]
                    type: gt
                  operator:
                    type: and
                  query:
                    params: [A]
                  reducer:
                    type: avg
              refId: B
              type: classic_conditions
          - refId: C
            datasourceUid: __expr__
            model:
              expression: B
              type: threshold
        noDataState: NoData
        execErrState: Error
        for: 5m
        annotations:
          summary: High error rate detected
          description: Error rate is {{ $values.A }}% over the last 5 minutes
        labels:
          severity: critical
          team: platform

      - uid: high-latency
        title: High Request Latency
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: |
                histogram_quantile(0.95, 
                  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
                )
          - refId: B
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params: [2]
                    type: gt
                  operator:
                    type: and
                  query:
                    params: [A]
                  reducer:
                    type: avg
              type: classic_conditions
          - refId: C
            datasourceUid: __expr__
            model:
              expression: B
              type: threshold
        for: 5m
        annotations:
          summary: High latency detected
          description: P95 latency is {{ $values.A }}s
        labels:
          severity: warning
          team: platform

      - uid: pod-restart
        title: Pod Restart Loop
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: |
                increase(kube_pod_container_status_restarts_total{
                  namespace="monitoring"
                }[1h]) > 3
          - refId: C
            datasourceUid: __expr__
            model:
              expression: A
              type: threshold
        for: 0s
        annotations:
          summary: Pod restarting frequently
          description: Pod {{ $labels.pod }} has restarted {{ $values.A }} times
        labels:
          severity: warning
```


#### Contact Points and Notification Policies

```yaml
# contact-points.yaml
apiVersion: 1

contactPoints:
  - orgId: 1
    name: Platform Team Slack
    receivers:
      - uid: slack-platform
        type: slack
        settings:
          recipient: "#platform-alerts"
          token: $SLACK_TOKEN
          username: Grafana Alerts
          icon_emoji: ":grafana:"
          mentionChannel: here
        disableResolveMessage: false

  - orgId: 1
    name: On-Call PagerDuty
    receivers:
      - uid: pagerduty-oncall
        type: pagerduty
        settings:
          integrationKey: $PAGERDUTY_KEY
          severity: critical
          class: infrastructure
          component: grafana
          group: monitoring

  - orgId: 1
    name: Email Notifications
    receivers:
      - uid: email-team
        type: email
        settings:
          addresses: platform-team@example.com
          singleEmail: true

---
# notification-policies.yaml
apiVersion: 1

policies:
  - orgId: 1
    receiver: Platform Team Slack
    group_by:
      - alertname
      - severity
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
    routes:
      - receiver: On-Call PagerDuty
        matchers:
          - severity = critical
        continue: true
        mute_time_intervals:
          - maintenance-window
      
      - receiver: Email Notifications
        matchers:
          - severity = warning
        group_wait: 1m
        repeat_interval: 24h

---
# mute-timings.yaml
apiVersion: 1

muteTimes:
  - orgId: 1
    name: maintenance-window
    time_intervals:
      - times:
          - start_time: "02:00"
            end_time: "04:00"
        weekdays:
          - sunday
        location: America/New_York
```

### Dashboard as Code

```json
{
  "dashboard": {
    "title": "Service Overview",
    "uid": "service-overview",
    "tags": ["service", "overview"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {
        "title": "Request Rate",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (status)",
            "legendFormat": "{{ status }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "x": 12, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": null, "color": "green" },
                { "value": 1, "color": "yellow" },
                { "value": 5, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "title": "P95 Latency",
        "type": "stat",
        "gridPos": { "x": 18, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": null, "color": "green" },
                { "value": 0.5, "color": "yellow" },
                { "value": 1, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "title": "Logs",
        "type": "logs",
        "gridPos": { "x": 0, "y": 8, "w": 24, "h": 8 },
        "datasource": { "type": "loki", "uid": "loki" },
        "targets": [
          {
            "expr": "{namespace=\"monitoring\", app=\"my-service\"} |= ``",
            "refId": "A"
          }
        ],
        "options": {
          "showTime": true,
          "showLabels": true,
          "wrapLogMessage": true,
          "enableLogDetails": true
        }
      }
    ],
    "templating": {
      "list": [
        {
          "name": "namespace",
          "type": "query",
          "datasource": { "type": "prometheus", "uid": "prometheus" },
          "query": "label_values(kube_pod_info, namespace)",
          "refresh": 2,
          "includeAll": true,
          "multi": true
        }
      ]
    }
  }
}
```

---

## Practical Exercises

### Exercise 1: Build a Simple Data Source Plugin

Create a data source plugin that queries a REST API:

1. **Setup**: Use `npx @grafana/create-plugin` to scaffold the project
2. **Backend**: Implement QueryData handler to fetch from an API
3. **Frontend**: Create QueryEditor with metric selection
4. **Test**: Run locally with Docker Compose

```bash
# Create plugin scaffold
npx @grafana/create-plugin@latest

# Start development environment
docker-compose up -d

# Build and watch for changes
npm run dev
mage -v build:linux && mage reloadPlugin
```

### Exercise 2: Design a CI/CD Pipeline

Design a pipeline for a Grafana plugin with these requirements:
- Automated testing on every PR
- Security scanning
- Automatic releases on tag
- Staged deployments (staging → production)

**Deliverables**:
1. GitHub Actions workflow file
2. Helm chart for deployment
3. Rollback procedure documentation

### Exercise 3: Deploy Grafana to Kubernetes

Deploy a production-ready Grafana instance:

1. Create namespace and RBAC
2. Deploy with external PostgreSQL database
3. Configure Prometheus and Loki data sources
4. Set up Ingress with TLS
5. Configure HPA for auto-scaling

```bash
# Create namespace
kubectl create namespace monitoring

# Deploy using Helm
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values values.yaml \
  --wait

# Verify deployment
kubectl get pods -n monitoring
kubectl port-forward svc/grafana 3000:80 -n monitoring
```

### Exercise 4: Implement Comprehensive Monitoring

Add monitoring to an existing Go service:

1. Add Prometheus metrics (requests, latency, errors)
2. Add structured logging for Loki
3. Create Grafana dashboard
4. Configure alerting rules

**Success Criteria**:
- Dashboard shows request rate, error rate, and latency
- Alerts fire when error rate > 5%
- Logs are queryable by trace ID

---

## Summary

This intermediate guide covered:

| Topic | Key Concepts |
|-------|--------------|
| **Plugin Development** | Backend handlers, frontend components, plugin.json configuration |
| **CI/CD Pipelines** | GitHub Actions, testing stages, deployment strategies |
| **Kubernetes Deployment** | Deployments, Services, Ingress, HPA, Helm charts |
| **Monitoring Integration** | Prometheus metrics, Loki logging, alerting rules |

### Next Steps

- Progress to [Advanced Topics](./advanced.md) for complex plugin architectures and performance optimization
- Review [Questions and Answers](./questions/questions-and-answers.md) for interview preparation
- Practice with [Code Implementations](../../code-implementations/) for hands-on experience

### Key Interview Topics

Be prepared to discuss:
1. How Grafana plugins communicate between frontend and backend
2. CI/CD best practices for plugin development
3. Kubernetes deployment patterns for high availability
4. Prometheus metric types and when to use each
5. Structured logging best practices for observability
