/**
 * Sample Data Source Plugin - Type Definitions
 *
 * This file defines the TypeScript types used throughout the data source plugin.
 * Proper typing is essential for Grafana plugin development as it ensures
 * type safety and enables better IDE support.
 *
 * Key concepts demonstrated:
 * - Query model extending DataQuery
 * - Data source options extending DataSourceJsonData
 * - Secure JSON data for sensitive configuration
 */

import { DataQuery, DataSourceJsonData } from '@grafana/data';

/**
 * Query model for the sample data source.
 *
 * This interface defines the structure of queries that users can build
 * in the Query Editor. It extends DataQuery which provides:
 * - refId: Unique identifier for the query (A, B, C, etc.)
 * - hide: Whether to hide the query results
 * - key: Optional key for the query
 * - queryType: Optional query type identifier
 * - datasource: Optional data source reference
 *
 * Interview Tip: Understanding the query model is crucial for implementing
 * custom data sources. The query model defines what parameters users can
 * configure when building queries.
 */
export interface SampleQuery extends DataQuery {
  /**
   * The query text or expression to execute.
   * This could be SQL, PromQL, LogQL, or any domain-specific query language.
   */
  queryText: string;

  /**
   * The metric or measurement name to query.
   * Used for filtering or selecting specific data series.
   */
  metric: string;

  /**
   * Optional label filters for the query.
   * Key-value pairs used to filter results (e.g., {job: "api", env: "prod"}).
   */
  labels?: Record<string, string>;

  /**
   * Query format - determines how results are processed.
   * - 'time_series': Returns time-indexed data for graphs
   * - 'table': Returns tabular data for table panels
   */
  format?: 'time_series' | 'table';

  /**
   * Maximum number of data points to return.
   * Used for downsampling large datasets.
   */
  maxDataPoints?: number;

  /**
   * Interval hint from Grafana based on the time range and panel width.
   * Useful for determining appropriate data resolution.
   */
  intervalMs?: number;
}

/**
 * Default values for a new query.
 *
 * These defaults are applied when a user creates a new query in the editor.
 * Providing sensible defaults improves the user experience.
 */
export const defaultQuery: Partial<SampleQuery> = {
  queryText: '',
  metric: 'sample_metric',
  format: 'time_series',
};

/**
 * Data source configuration options.
 *
 * This interface defines the configuration that users set when adding
 * the data source in Grafana's data source settings page. These values
 * are stored in Grafana's database (non-sensitive data).
 *
 * Extends DataSourceJsonData which provides the base configuration structure.
 */
export interface SampleDataSourceOptions extends DataSourceJsonData {
  /**
   * The base URL of the data source API.
   * Example: "http://localhost:8080/api"
   */
  url?: string;

  /**
   * Default database or namespace to query.
   * Used when no specific database is specified in the query.
   */
  defaultDatabase?: string;

  /**
   * Request timeout in seconds.
   * How long to wait for responses from the data source.
   */
  timeout?: number;

  /**
   * Whether to enable debug logging.
   * Useful for troubleshooting query issues.
   */
  enableDebug?: boolean;

  /**
   * Custom HTTP headers to include in requests.
   * Useful for authentication or routing.
   */
  customHeaders?: Record<string, string>;
}

/**
 * Secure configuration options.
 *
 * This interface defines sensitive configuration that should be stored
 * encrypted in Grafana's database. These values are never exposed to
 * the browser after initial configuration.
 *
 * Interview Tip: Always use secureJsonData for API keys, passwords,
 * and other sensitive credentials. This is a security best practice
 * that Grafana enforces.
 */
export interface SampleSecureJsonData {
  /**
   * API key for authenticating with the data source.
   * Stored encrypted and never sent to the browser.
   */
  apiKey?: string;

  /**
   * Password for basic authentication.
   * Stored encrypted and never sent to the browser.
   */
  password?: string;

  /**
   * OAuth token for token-based authentication.
   * Stored encrypted and never sent to the browser.
   */
  accessToken?: string;
}

/**
 * Health check response structure.
 *
 * Used by the testDatasource method to report connection status.
 */
export interface HealthCheckResult {
  status: 'success' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Query response metadata.
 *
 * Additional information returned with query results.
 */
export interface QueryResponseMeta {
  /** Total number of rows before any limits */
  totalRows?: number;
  /** Query execution time in milliseconds */
  executionTimeMs?: number;
  /** Whether results were truncated */
  truncated?: boolean;
  /** Any warnings from the query execution */
  warnings?: string[];
}
