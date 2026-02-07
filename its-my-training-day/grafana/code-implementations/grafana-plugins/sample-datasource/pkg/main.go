// Package main is the entry point for the Grafana backend plugin.
//
// This file sets up the plugin server that communicates with Grafana
// using the grafana-plugin-sdk-go. The SDK handles:
// - gRPC communication with Grafana
// - Health checks and lifecycle management
// - Logging and tracing integration
//
// Interview Tip: The backend plugin runs as a separate process that
// Grafana spawns and communicates with via gRPC. This architecture:
// - Isolates plugin crashes from Grafana
// - Allows plugins to be written in any language with gRPC support
// - Enables secure credential handling (secrets stay in the backend)
package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"sample-datasource/pkg/plugin"
)

func main() {
	// Set up logging
	// The SDK provides structured logging that integrates with Grafana's logging
	logger := log.DefaultLogger

	logger.Info("Starting sample-datasource backend plugin")

	// Start the plugin server
	// This blocks until Grafana terminates the plugin
	if err := datasource.Manage(
		// Plugin ID must match the id in plugin.json
		"sample-datasource",

		// Factory function to create new data source instances
		// Called when a new data source is configured in Grafana
		plugin.NewSampleDatasource,

		// Options for the plugin server
		datasource.ManageOpts{},
	); err != nil {
		logger.Error("Failed to start plugin", "error", err)
		os.Exit(1)
	}
}

/*
Backend Plugin Entry Point Notes

This main.go file demonstrates the minimal setup for a Grafana backend plugin:

1. **datasource.Manage**:
   - Starts the gRPC server that Grafana connects to
   - Handles instance management (creating/destroying data source instances)
   - Routes requests to the appropriate handler methods

2. **Plugin ID**:
   - Must match the "id" field in plugin.json
   - Used by Grafana to identify and route requests to this plugin

3. **Factory Function**:
   - plugin.NewSampleDatasource creates new instances
   - Called once per configured data source
   - Receives settings from Grafana's database

4. **Lifecycle**:
   - Plugin starts when Grafana loads it
   - Runs until Grafana terminates it
   - Dispose() is called on instances when they're no longer needed

Building the Plugin:

For Linux:
  GOOS=linux GOARCH=amd64 go build -o dist/gpx_sample-datasource_linux_amd64 ./pkg

For macOS:
  GOOS=darwin GOARCH=amd64 go build -o dist/gpx_sample-datasource_darwin_amd64 ./pkg

For Windows:
  GOOS=windows GOARCH=amd64 go build -o dist/gpx_sample-datasource_windows_amd64.exe ./pkg

Or use Mage (recommended):
  mage -v build:linux
  mage -v build:darwin
  mage -v build:windows

Interview Tip: Understanding the plugin lifecycle is important:
- Grafana spawns the plugin process on startup
- Multiple data source instances can share one plugin process
- The SDK handles multiplexing requests to the correct instance
- Plugins should be stateless where possible for scalability
*/
