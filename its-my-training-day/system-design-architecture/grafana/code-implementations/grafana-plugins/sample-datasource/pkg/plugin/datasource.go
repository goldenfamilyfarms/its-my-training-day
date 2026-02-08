// Package plugin implements the backend data source handler for the sample data source plugin.
//
// This file demonstrates key patterns for Grafana backend plugin development:
// - Implementing the datasource.QueryDataHandler interface
// - Processing queries and returning data frames
// - Health check implementation
// - Proper error handling and logging
//
// Interview Tip: Backend plugins are essential for:
// - Secure credential handling (secrets never reach the browser)
// - Complex data transformations
// - Connecting to databases or APIs that require server-side access
// - Alerting support (requires backend)
package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Ensure SampleDatasource implements required interfaces.
// This compile-time check ensures we implement all required methods.
var (
	_ backend.QueryDataHandler      = (*SampleDatasource)(nil)
	_ backend.CheckHealthHandler    = (*SampleDatasource)(nil)
	_ instancemgmt.InstanceDisposer = (*SampleDatasource)(nil)
)

// SampleDatasourceSettings contains the data source configuration.
// These settings are configured in the Grafana UI and passed to the backend.
type SampleDatasourceSettings struct {
	// URL is the base URL of the data source API
	URL string `json:"url"`

	// DefaultDatabase is the default database to query
	DefaultDatabase string `json:"defaultDatabase"`

	// Timeout is the request timeout in seconds
	Timeout int `json:"timeout"`

	// EnableDebug enables verbose logging
	EnableDebug bool `json:"enableDebug"`
}

// SampleQuery represents a query from the frontend.
// This structure must match the TypeScript SampleQuery interface.
type SampleQuery struct {
	// RefID is the unique identifier for this query (A, B, C, etc.)
	RefID string `json:"refId"`

	// QueryText is the query expression
	QueryText string `json:"queryText"`

	// Metric is the metric name to query
	Metric string `json:"metric"`

	// Labels are key-value pairs for filtering
	Labels map[string]string `json:"labels"`

	// Format determines the output format (time_series or table)
	Format string `json:"format"`

	// MaxDataPoints is the maximum number of data points to return
	MaxDataPoints int64 `json:"maxDataPoints"`

	// IntervalMs is the suggested interval between data points
	IntervalMs int64 `json:"intervalMs"`
}

// SampleDatasource is the backend implementation of the data source.
// It handles query execution, health checks, and resource management.
type SampleDatasource struct {
	settings SampleDatasourceSettings
	logger   log.Logger
}

// NewSampleDatasource creates a new instance of the data source.
// This function is called by Grafana when a new data source instance is needed.
//
// Interview Tip: The instance management pattern allows Grafana to:
// - Create separate instances for each configured data source
// - Manage connection pools and resources per instance
// - Clean up resources when data sources are deleted
func NewSampleDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	logger := log.DefaultLogger.With("datasource", settings.Name)
	logger.Info("Creating new data source instance")

	// Parse the JSON data from settings
	var dsSettings SampleDatasourceSettings
	if err := json.Unmarshal(settings.JSONData, &dsSettings); err != nil {
		logger.Error("Failed to parse settings", "error", err)
		return nil, fmt.Errorf("failed to parse settings: %w", err)
	}

	// Set defaults
	if dsSettings.Timeout == 0 {
		dsSettings.Timeout = 30
	}
	if dsSettings.DefaultDatabase == "" {
		dsSettings.DefaultDatabase = "default"
	}

	// Access secure settings (API key, password)
	// These are decrypted by Grafana and passed securely
	apiKey := settings.DecryptedSecureJSONData["apiKey"]
	if apiKey != "" {
		logger.Debug("API key configured")
	}

	return &SampleDatasource{
		settings: dsSettings,
		logger:   logger,
	}, nil
}

// Dispose cleans up resources when the data source instance is destroyed.
// This is called when a data source is deleted or Grafana shuts down.
func (d *SampleDatasource) Dispose() {
	d.logger.Info("Disposing data source instance")
	// Clean up any resources (connections, goroutines, etc.)
}

// QueryData handles multiple queries and returns multiple responses.
// This is the main entry point for query execution.
//
// Interview Tip: Key considerations for QueryData:
// - Process queries in parallel when possible
// - Respect context cancellation for long-running queries
// - Return partial results if some queries fail
// - Include meaningful error messages
func (d *SampleDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	d.logger.Debug("QueryData called", "numQueries", len(req.Queries))

	// Create response container
	response := backend.NewQueryDataResponse()

	// Process each query
	for _, q := range req.Queries {
		res := d.processQuery(ctx, req.PluginContext, q)
		response.Responses[q.RefID] = res
	}

	return response, nil
}

// processQuery handles a single query and returns a DataResponse.
func (d *SampleDatasource) processQuery(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse

	// Parse the query JSON
	var q SampleQuery
	if err := json.Unmarshal(query.JSON, &q); err != nil {
		d.logger.Error("Failed to parse query", "error", err)
		response.Error = fmt.Errorf("failed to parse query: %w", err)
		return response
	}

	// Set defaults from the DataQuery
	q.RefID = query.RefID
	if q.MaxDataPoints == 0 {
		q.MaxDataPoints = query.MaxDataPoints
	}
	if q.IntervalMs == 0 {
		q.IntervalMs = query.Interval.Milliseconds()
	}

	d.logger.Debug("Processing query",
		"refId", q.RefID,
		"metric", q.Metric,
		"format", q.Format,
		"timeRange", fmt.Sprintf("%v - %v", query.TimeRange.From, query.TimeRange.To),
	)

	// Generate data based on format
	var frame *data.Frame
	var err error

	switch q.Format {
	case "table":
		frame, err = d.createTableFrame(ctx, q)
	default:
		frame, err = d.createTimeSeriesFrame(ctx, q, query.TimeRange)
	}

	if err != nil {
		d.logger.Error("Failed to create frame", "error", err)
		response.Error = err
		return response
	}

	response.Frames = append(response.Frames, frame)
	return response
}

// createTimeSeriesFrame generates time series data.
// In a real plugin, this would query an external data source.
//
// Interview Tip: Time series data in Grafana:
// - First field should be time (FieldType.Time)
// - Subsequent fields are values
// - Labels can be added to fields for multi-series data
// - Meta can specify preferred visualization
func (d *SampleDatasource) createTimeSeriesFrame(ctx context.Context, q SampleQuery, timeRange backend.TimeRange) (*data.Frame, error) {
	// Calculate data points
	from := timeRange.From.UnixMilli()
	to := timeRange.To.UnixMilli()
	duration := to - from

	// Determine interval
	interval := q.IntervalMs
	if interval == 0 {
		interval = duration / q.MaxDataPoints
	}
	if interval < 1000 {
		interval = 1000 // Minimum 1 second
	}

	numPoints := int(duration / interval)
	if numPoints > int(q.MaxDataPoints) && q.MaxDataPoints > 0 {
		numPoints = int(q.MaxDataPoints)
	}

	d.logger.Debug("Creating time series",
		"numPoints", numPoints,
		"interval", interval,
		"from", timeRange.From,
		"to", timeRange.To,
	)

	// Create the frame
	frame := data.NewFrame(q.Metric,
		data.NewField("time", nil, make([]time.Time, numPoints)),
		data.NewField("value", q.Labels, make([]float64, numPoints)),
	)

	// Set frame metadata
	frame.RefID = q.RefID
	frame.Meta = &data.FrameMeta{
		PreferredVisualization: data.VisTypeGraph,
	}

	// Generate sample data
	// In a real plugin, this data would come from the external data source
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < numPoints; i++ {
		timestamp := time.UnixMilli(from + int64(i)*interval)
		// Generate a sine wave with noise for demonstration
		value := math.Sin(float64(i)/10)*50 + 50 + rng.Float64()*10

		frame.SetRow(i, timestamp, value)
	}

	return frame, nil
}

// createTableFrame generates tabular data.
// Useful for displaying data in table panels.
func (d *SampleDatasource) createTableFrame(ctx context.Context, q SampleQuery) (*data.Frame, error) {
	numRows := 10

	// Create the frame with table structure
	frame := data.NewFrame(q.Metric,
		data.NewField("id", nil, make([]int64, numRows)),
		data.NewField("name", nil, make([]string, numRows)),
		data.NewField("value", nil, make([]float64, numRows)),
		data.NewField("timestamp", nil, make([]time.Time, numRows)),
		data.NewField("status", nil, make([]string, numRows)),
	)

	// Set frame metadata
	frame.RefID = q.RefID
	frame.Meta = &data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
	}

	// Generate sample data
	statuses := []string{"active", "inactive", "pending", "error"}
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := 0; i < numRows; i++ {
		frame.SetRow(i,
			int64(i+1),
			fmt.Sprintf("%s_%d", q.Metric, i+1),
			rng.Float64()*100,
			time.Now().Add(-time.Duration(i)*time.Minute),
			statuses[rng.Intn(len(statuses))],
		)
	}

	return frame, nil
}

// CheckHealth handles health check requests from Grafana.
// This is called when users click "Save & Test" in the data source settings.
//
// Interview Tip: A good health check should:
// - Verify network connectivity to the data source
// - Validate authentication credentials
// - Check permissions if applicable
// - Return meaningful error messages for troubleshooting
func (d *SampleDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	d.logger.Info("CheckHealth called")

	// In a real plugin, you would:
	// 1. Make a lightweight API call to verify connectivity
	// 2. Check authentication
	// 3. Verify permissions

	// Simulate a health check
	// In production, replace this with actual connectivity check
	if d.settings.URL == "" {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "URL is not configured",
		}, nil
	}

	// Example: Check if URL is reachable
	// In a real plugin, you would make an HTTP request here
	/*
		client := &http.Client{Timeout: time.Duration(d.settings.Timeout) * time.Second}
		resp, err := client.Get(d.settings.URL + "/health")
		if err != nil {
			return &backend.CheckHealthResult{
				Status:  backend.HealthStatusError,
				Message: fmt.Sprintf("Failed to connect: %v", err),
			}, nil
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return &backend.CheckHealthResult{
				Status:  backend.HealthStatusError,
				Message: fmt.Sprintf("Unexpected status code: %d", resp.StatusCode),
			}, nil
		}
	*/

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
		JSONDetails: []byte(fmt.Sprintf(`{
			"version": "1.0.0",
			"database": "%s",
			"url": "%s"
		}`, d.settings.DefaultDatabase, d.settings.URL)),
	}, nil
}

/*
Backend Plugin Architecture Notes

This file demonstrates the key patterns for Grafana backend plugin development:

1. **Interface Implementation**:
   - QueryDataHandler: Required for query execution
   - CheckHealthHandler: Required for health checks
   - InstanceDisposer: Optional for cleanup

2. **Instance Management**:
   - NewSampleDatasource creates instances per data source configuration
   - Dispose cleans up resources when instances are destroyed
   - This pattern allows connection pooling and resource management

3. **Query Processing**:
   - QueryData receives multiple queries in a single request
   - Each query is processed and results are returned in a map
   - Partial failures are supported (some queries can fail while others succeed)

4. **Data Frames**:
   - Use the data package to create properly typed frames
   - Time series: first field is time, subsequent fields are values
   - Tables: multiple fields of various types
   - Labels can be added to fields for filtering and grouping

5. **Error Handling**:
   - Return errors in the DataResponse.Error field
   - Use fmt.Errorf with %w for error wrapping
   - Log errors with context for debugging

6. **Security**:
   - Secure settings are decrypted by Grafana
   - Never log sensitive data
   - Use context for cancellation

Interview Tip: When discussing backend plugins, emphasize:
- Why backend is needed (security, alerting, complex transformations)
- The plugin SDK and its abstractions
- Error handling and logging best practices
- Performance considerations (connection pooling, caching)
*/
