/**
 * Sample Data Source Plugin - Module Entry Point
 *
 * This file is the main entry point for the Grafana plugin. It exports
 * the plugin components that Grafana needs to load and use the plugin.
 *
 * Key concepts demonstrated:
 * - DataSourcePlugin class for registering data source plugins
 * - Component registration (ConfigEditor, QueryEditor)
 * - Plugin metadata configuration
 *
 * Interview Tip: Understanding the module structure is essential for
 * Grafana plugin development. This file tells Grafana:
 * - Which class handles data source operations
 * - Which React components to use for configuration and query editing
 */

import { DataSourcePlugin } from '@grafana/data';

import { SampleDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { SampleQuery, SampleDataSourceOptions } from './types';

/**
 * Plugin Export
 *
 * This is the default export that Grafana looks for when loading the plugin.
 * The DataSourcePlugin class is a builder that allows you to configure:
 *
 * - setConfigEditor(): The React component for data source configuration
 * - setQueryEditor(): The React component for building queries
 * - setVariableQueryEditor(): Optional component for variable queries
 * - setAnnotationQueryCtrl(): Optional component for annotation queries
 *
 * The generic types ensure type safety throughout the plugin:
 * - SampleDataSource: The data source class
 * - SampleQuery: The query model type
 * - SampleDataSourceOptions: The configuration options type
 */
export const plugin = new DataSourcePlugin<SampleDataSource, SampleQuery, SampleDataSourceOptions>(
  SampleDataSource
)
  /**
   * Configuration Editor
   *
   * This component is displayed when users add or edit the data source
   * in Grafana's data source settings page. It handles:
   * - URL configuration
   * - Authentication settings
   * - Default options
   */
  .setConfigEditor(ConfigEditor)

  /**
   * Query Editor
   *
   * This component is displayed in the query panel when users build
   * queries. It provides the UI for:
   * - Query text input
   * - Metric selection
   * - Label filters
   * - Format options
   */
  .setQueryEditor(QueryEditor);

/**
 * Plugin Architecture Notes
 *
 * The Grafana plugin system uses a modular architecture where:
 *
 * 1. module.ts (this file) - Entry point that registers components
 * 2. datasource.ts - Core logic for query execution and data transformation
 * 3. types.ts - TypeScript interfaces for type safety
 * 4. components/ - React components for UI
 *
 * This separation of concerns makes plugins:
 * - Easier to test (logic separate from UI)
 * - Easier to maintain (clear responsibilities)
 * - Type-safe (TypeScript throughout)
 *
 * For backend plugins, there's also:
 * 5. pkg/plugin/ - Go code for backend query execution
 * 6. pkg/main.go - Backend entry point
 *
 * The frontend and backend communicate via Grafana's plugin protocol,
 * which handles serialization and transport automatically.
 */
