# Sample Data Source Plugin

This is a complete example of a Grafana data source plugin demonstrating both frontend (TypeScript/React) and backend (Go) components. It's designed for interview preparation and learning Grafana plugin development patterns.

## Overview

This plugin demonstrates:

- **Frontend Development**: TypeScript types, React components, Grafana UI integration
- **Backend Development**: Go-based query handling, health checks, data frame creation
- **Plugin Architecture**: Module structure, configuration management, query processing

## Directory Structure

```
sample-datasource/
├── src/                          # Frontend source code
│   ├── types.ts                  # TypeScript type definitions
│   ├── datasource.ts             # Data source class implementation
│   ├── module.ts                 # Plugin entry point
│   ├── plugin.json               # Plugin metadata
│   └── components/
│       ├── ConfigEditor.tsx      # Data source configuration UI
│       └── QueryEditor.tsx       # Query builder UI
├── pkg/                          # Backend source code (Go)
│   ├── main.go                   # Backend entry point
│   └── plugin/
│       └── datasource.go         # Backend data source handler
├── package.json                  # Frontend dependencies
├── go.mod                        # Go module definition
└── README.md                     # This file
```

## Key Concepts Demonstrated

### Frontend (TypeScript/React)

| File | Concepts |
|------|----------|
| `types.ts` | Query model, data source options, secure JSON data |
| `datasource.ts` | DataSourceApi extension, query execution, health checks |
| `module.ts` | Plugin registration, component binding |
| `ConfigEditor.tsx` | Grafana UI components, secure input handling |
| `QueryEditor.tsx` | Query building UI, label filters, format selection |

### Backend (Go)

| File | Concepts |
|------|----------|
| `main.go` | Plugin server setup, lifecycle management |
| `datasource.go` | Query handling, data frame creation, health checks |

## Plugin Components Explained

### 1. Type Definitions (`types.ts`)

```typescript
// Query model - defines what users can configure
interface SampleQuery extends DataQuery {
  queryText: string;      // Query expression
  metric: string;         // Metric name
  labels?: Record<string, string>;  // Label filters
  format?: 'time_series' | 'table'; // Output format
}

// Configuration - stored in Grafana's database
interface SampleDataSourceOptions extends DataSourceJsonData {
  url?: string;           // API endpoint
  defaultDatabase?: string;
  timeout?: number;
}

// Secure configuration - stored encrypted
interface SampleSecureJsonData {
  apiKey?: string;        // Never sent to browser after save
  password?: string;
}
```

### 2. Data Source Class (`datasource.ts`)

The main class that handles:
- Query execution (`query()`)
- Health checks (`testDatasource()`)
- Variable support (`metricFindQuery()`)
- Default query values (`getDefaultQuery()`)

```typescript
export class SampleDataSource extends DataSourceApi<SampleQuery, SampleDataSourceOptions> {
  async query(request: DataQueryRequest<SampleQuery>): Promise<DataQueryResponse> {
    // Process queries and return data frames
  }

  async testDatasource(): Promise<HealthCheckResult> {
    // Verify connection to data source
  }
}
```

### 3. Configuration Editor (`ConfigEditor.tsx`)

React component for data source settings:
- URL configuration
- Authentication (API key, password)
- Default options
- Uses Grafana UI components for consistency

### 4. Query Editor (`QueryEditor.tsx`)

React component for building queries:
- Query text input with code editor
- Metric selection dropdown
- Label filter management
- Format selection (time series vs table)

### 5. Backend Handler (`datasource.go`)

Go implementation for:
- Query processing with proper error handling
- Data frame creation (time series and table formats)
- Health check implementation
- Secure credential access

```go
func (d *SampleDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
    // Process queries and return data frames
}

func (d *SampleDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    // Verify data source connectivity
}
```

## Development Setup

### Prerequisites

- Node.js 18+
- Go 1.21+
- Yarn
- Docker (optional, for running Grafana)

### Install Dependencies

```bash
# Frontend dependencies
yarn install

# Backend dependencies
go mod download
```

### Build

```bash
# Build frontend (development with watch)
yarn dev

# Build frontend (production)
yarn build

# Build backend (Linux)
GOOS=linux GOARCH=amd64 go build -o dist/gpx_sample-datasource_linux_amd64 ./pkg

# Build backend (macOS)
GOOS=darwin GOARCH=amd64 go build -o dist/gpx_sample-datasource_darwin_amd64 ./pkg
```

### Run Tests

```bash
# Frontend tests
yarn test

# Backend tests
go test ./pkg/...
```

## Interview Discussion Points

### Why Backend Plugins?

1. **Security**: Credentials never reach the browser
2. **Alerting**: Required for Grafana alerting support
3. **Complex Processing**: Heavy data transformations
4. **Database Access**: Direct database connections

### Key Patterns to Understand

1. **Data Frames**: Grafana's columnar data format
2. **Query Model**: How queries are structured and processed
3. **Instance Management**: Per-data-source configuration
4. **Error Handling**: Proper error propagation and logging

### Common Interview Questions

1. How does Grafana communicate with backend plugins?
   - Via gRPC using the plugin SDK

2. How are credentials secured?
   - Stored encrypted, decrypted only in backend

3. What's the difference between jsonData and secureJsonData?
   - jsonData is visible to frontend, secureJsonData is encrypted

4. How do you support Grafana variables?
   - Implement `metricFindQuery()` method

5. How do you create time series data?
   - Use data frames with time field first, then value fields

## Related Resources

- [Grafana Plugin Development Guide](https://grafana.com/developers/plugin-tools/)
- [Plugin SDK Documentation](https://grafana.com/developers/plugin-tools/introduction/grafana-plugin-sdk-for-go)
- [Data Source Plugin Tutorial](https://grafana.com/tutorials/build-a-data-source-plugin/)
- [Plugin Examples Repository](https://github.com/grafana/grafana-plugin-examples)

## Study Guide References

- [Senior Software Engineer OSS - Intermediate](../../study-guides/02-senior-software-engineer-oss/intermediate.md) - Plugin development patterns
- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md) - Architecture overview
