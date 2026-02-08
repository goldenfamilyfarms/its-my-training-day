module sample-datasource

go 1.21

require github.com/grafana/grafana-plugin-sdk-go v0.199.0

// Note: In a real project, run 'go mod tidy' to populate indirect dependencies
// The grafana-plugin-sdk-go provides:
// - backend: Core plugin interfaces and types
// - data: Data frame creation and manipulation
// - live: Streaming data support
// - experimental: Experimental features
