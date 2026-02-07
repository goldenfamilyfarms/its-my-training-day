# Grafana Plugin Development Examples

This directory contains practical examples demonstrating Grafana plugin development, focusing on data source plugins that are essential for Senior Software Engineer - OSS Big Tent roles at Grafana Labs.

## Purpose

These examples provide hands-on implementations of:

- **Data Source Plugins**: Backend and frontend components for connecting Grafana to external data sources
- **Plugin Architecture**: Understanding Grafana's plugin SDK and development patterns
- **Query Handling**: Processing and transforming data queries between Grafana and data sources

The code is designed to help candidates:
1. Understand Grafana's plugin architecture and SDK
2. Practice implementing data source plugins commonly discussed in technical interviews
3. Build intuition for plugin development patterns used in the Grafana ecosystem

## Prerequisites

### Required Software

- **Node.js 18+** - [Download and install Node.js](https://nodejs.org/)
- **Go 1.21+** - [Download and install Go](https://go.dev/doc/install) (for backend plugins)
- **Yarn** - Package manager for frontend development
- **Docker** - For running Grafana in development mode
- **Grafana 10.x+** - Target Grafana version for plugin compatibility

### Recommended Knowledge

- TypeScript and React fundamentals
- Go programming basics (for backend data source plugins)
- Understanding of Grafana's data model (frames, fields, queries)
- Familiarity with observability concepts (see [shared-concepts](../../shared-concepts/))

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check Go version
go version
# Expected: go version go1.21.x or higher

# Check Yarn
yarn --version

# Check Docker
docker --version
```

## Directory Structure

```
grafana-plugins/
├── README.md                           # This file
├── sample-datasource/                  # Example data source plugin
│   ├── src/                            # Frontend source code
│   │   ├── components/                 # React components
│   │   │   ├── ConfigEditor.tsx        # Data source configuration UI
│   │   │   └── QueryEditor.tsx         # Query builder UI
│   │   ├── datasource.ts               # Data source class implementation
│   │   ├── module.ts                   # Plugin entry point
│   │   ├── types.ts                    # TypeScript type definitions
│   │   └── plugin.json                 # Plugin metadata
│   ├── pkg/                            # Backend source code (Go)
│   │   ├── plugin/
│   │   │   ├── datasource.go           # Backend data source handler
│   │   │   └── datasource_test.go      # Backend tests
│   │   └── main.go                     # Backend entry point
│   ├── package.json                    # Frontend dependencies
│   ├── go.mod                          # Go module definition
│   └── docker-compose.yml              # Development environment
└── docs/                               # Additional documentation
    ├── plugin-architecture.md          # Plugin architecture overview
    └── development-workflow.md         # Development best practices
```

## Plugin Types Overview

Grafana supports several plugin types. This repository focuses on **data source plugins**:

| Plugin Type | Description | Use Case |
|-------------|-------------|----------|
| **Data Source** | Connect to external data sources | Query databases, APIs, metrics systems |
| **Panel** | Custom visualizations | Specialized charts, maps, custom displays |
| **App** | Full applications with pages | Complex workflows, multi-panel experiences |

### Data Source Plugin Components

| Component | Language | Purpose |
|-----------|----------|---------|
| **Frontend** | TypeScript/React | Query editor UI, configuration UI |
| **Backend** | Go | Query execution, authentication, data transformation |
| **Plugin.json** | JSON | Metadata, capabilities, dependencies |

## Setup and Development

### 1. Clone and Navigate

```bash
# Navigate to the plugin examples directory
cd grafana/code-implementations/grafana-plugins
```

### 2. Install Grafana Plugin Tools

```bash
# Install the Grafana create-plugin tool globally
npm install -g @grafana/create-plugin

# Or use npx to run without installing
npx @grafana/create-plugin@latest
```

### 3. Set Up Development Environment

```bash
# Navigate to the sample data source plugin
cd sample-datasource

# Install frontend dependencies
yarn install

# Install backend dependencies
go mod download
```

### 4. Build the Plugin

```bash
# Build frontend (development mode with watch)
yarn dev

# Build frontend (production)
yarn build

# Build backend
mage -v build:linux  # For Linux
mage -v build:darwin # For macOS
mage -v build:windows # For Windows

# Or use go directly
go build -o dist/gpx_sample-datasource_linux_amd64 ./pkg
```

### 5. Run Grafana with Plugin

```bash
# Start Grafana with Docker (plugin auto-loaded)
docker-compose up -d

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

### Alternative: Local Grafana Installation

```bash
# Copy plugin to Grafana plugins directory
cp -r dist/ /var/lib/grafana/plugins/sample-datasource/

# Restart Grafana
sudo systemctl restart grafana-server

# Or for development, set plugin path in grafana.ini:
# [paths]
# plugins = /path/to/grafana-plugins
```

## Plugin Development Workflow

### Creating a New Data Source Plugin

```bash
# Use the official scaffolding tool
npx @grafana/create-plugin@latest

# Follow the prompts:
# - Plugin type: datasource
# - Plugin name: my-datasource
# - Organization: your-org
# - Backend: Yes (for Go backend)
```

### Development Cycle

1. **Edit Code**: Modify TypeScript/React or Go files
2. **Build**: Run `yarn dev` (frontend) or `mage build` (backend)
3. **Test**: Grafana hot-reloads frontend changes; restart for backend
4. **Debug**: Use browser DevTools and Go debugger

### Testing Plugins

```bash
# Run frontend tests
yarn test

# Run frontend tests with coverage
yarn test --coverage

# Run backend tests
go test ./pkg/...

# Run backend tests with race detection
go test -race ./pkg/...
```

## Key Concepts

### Data Frames

Grafana uses a columnar data format called **Data Frames**:

```typescript
// TypeScript example
import { MutableDataFrame, FieldType } from '@grafana/data';

const frame = new MutableDataFrame({
  refId: query.refId,
  fields: [
    { name: 'time', type: FieldType.time },
    { name: 'value', type: FieldType.number },
    { name: 'label', type: FieldType.string },
  ],
});

// Add rows
frame.appendRow([Date.now(), 42, 'metric-a']);
```

```go
// Go backend example
import "github.com/grafana/grafana-plugin-sdk-go/data"

frame := data.NewFrame("response",
    data.NewField("time", nil, []time.Time{}),
    data.NewField("value", nil, []float64{}),
    data.NewField("label", nil, []string{}),
)

frame.AppendRow(time.Now(), 42.0, "metric-a")
```

### Query Model

```typescript
// Define your query structure
interface MyQuery extends DataQuery {
  queryText: string;
  metric: string;
  filters?: Record<string, string>;
}
```

### Plugin Configuration

```typescript
// Data source configuration options
interface MyDataSourceOptions extends DataSourceJsonData {
  url: string;
  defaultDatabase?: string;
}

// Secure configuration (stored encrypted)
interface MySecureJsonData {
  apiKey?: string;
  password?: string;
}
```

## Official Documentation

### Essential Resources

- [Grafana Plugin Development Guide](https://grafana.com/developers/plugin-tools/) - Official getting started guide
- [Plugin SDK Documentation](https://grafana.com/developers/plugin-tools/introduction/grafana-plugin-sdk-for-go) - Go SDK reference
- [Data Source Plugin Tutorial](https://grafana.com/tutorials/build-a-data-source-plugin/) - Step-by-step tutorial
- [Plugin Examples Repository](https://github.com/grafana/grafana-plugin-examples) - Official example plugins

### API References

- [@grafana/data](https://grafana.com/developers/plugin-tools/introduction/data-frames) - Data frame utilities
- [@grafana/ui](https://developers.grafana.com/ui/latest/index.html) - UI component library
- [@grafana/runtime](https://grafana.com/developers/plugin-tools/introduction/grafana-runtime) - Runtime utilities
- [grafana-plugin-sdk-go](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go) - Go SDK reference

### Community Resources

- [Grafana Community Forums](https://community.grafana.com/) - Ask questions and share knowledge
- [Grafana GitHub Discussions](https://github.com/grafana/grafana/discussions) - Technical discussions
- [Plugin Development Slack](https://slack.grafana.com/) - Real-time community support

## Best Practices Demonstrated

### Frontend Development

- **TypeScript**: Strong typing for query models and configuration
- **React Hooks**: Modern React patterns for state management
- **Grafana UI Components**: Consistent look and feel with Grafana
- **Error Handling**: User-friendly error messages and validation

### Backend Development

- **Error Handling**: Proper error wrapping and logging
- **Context Usage**: Respect cancellation and timeouts
- **Testing**: Comprehensive unit tests with mocks
- **Health Checks**: Implement health check endpoints

### Security

- **Secure Storage**: Use `secureJsonData` for sensitive configuration
- **Input Validation**: Validate all user inputs
- **Authentication**: Proper credential handling

## Related Study Materials

- [Grafana Plugin Development](../../study-guides/02-senior-software-engineer-oss/intermediate.md) - Plugin development patterns
- [Grafana Ecosystem](../../shared-concepts/grafana-ecosystem.md) - Grafana architecture overview
- [Observability Principles](../../shared-concepts/observability-principles.md) - Data source concepts

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check `plugin.json` syntax and plugin ID |
| Backend not starting | Verify Go build and binary permissions |
| CORS errors | Configure Grafana proxy or data source URL |
| Type errors | Ensure `@grafana/*` package versions match |

### Debug Mode

```bash
# Enable Grafana debug logging
GF_LOG_LEVEL=debug docker-compose up

# Frontend debugging
# Use browser DevTools, React DevTools extension

# Backend debugging
# Use delve debugger or add log statements
```

## Contributing

When adding new plugin examples:

1. Create a new directory with descriptive name
2. Include complete `plugin.json` with metadata
3. Include both frontend and backend code where applicable
4. Add comprehensive tests
5. Update this README with the new example

## License

These examples are provided for educational purposes as part of the Grafana Interview Preparation Study Guide.
