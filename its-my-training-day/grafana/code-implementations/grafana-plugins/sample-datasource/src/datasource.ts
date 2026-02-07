/**
 * Sample Data Source Plugin - Data Source Class Implementation
 *
 * This file contains the main data source class that handles:
 * - Query execution and data transformation
 * - Health checks (testDatasource)
 * - Variable support for templating
 * - Annotation queries
 *
 * Key concepts demonstrated:
 * - Extending DataSourceApi for Grafana integration
 * - Using DataFrames for query results
 * - Proper error handling patterns
 * - Backend communication via getBackendSrv
 */

import {
  DataSourceInstanceSettings,
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  MutableDataFrame,
  FieldType,
  dateTime,
  TimeRange,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv, TemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { SampleQuery, SampleDataSourceOptions, defaultQuery, HealthCheckResult } from './types';

/**
 * SampleDataSource - Main data source implementation
 *
 * This class is the core of the data source plugin. It extends DataSourceApi
 * which provides the interface that Grafana expects from all data sources.
 *
 * Interview Tip: Understanding this class structure is essential for
 * Grafana plugin development. The key methods are:
 * - query(): Execute queries and return data frames
 * - testDatasource(): Verify connection to the data source
 * - getDefaultQuery(): Provide default query values
 */
export class SampleDataSource extends DataSourceApi<SampleQuery, SampleDataSourceOptions> {
  /** Base URL for API requests */
  private readonly baseUrl: string;

  /** Default database from configuration */
  private readonly defaultDatabase: string;

  /** Request timeout in milliseconds */
  private readonly timeout: number;

  /** Template service for variable interpolation */
  private readonly templateSrv: TemplateSrv;

  /**
   * Constructor - Initialize the data source
   *
   * @param instanceSettings - Configuration from Grafana's data source settings
   * @param templateSrv - Optional template service (injected for testing)
   */
  constructor(
    instanceSettings: DataSourceInstanceSettings<SampleDataSourceOptions>,
    templateSrv?: TemplateSrv
  ) {
    // Call parent constructor with instance settings
    super(instanceSettings);

    // Extract configuration from instance settings
    this.baseUrl = instanceSettings.url || '';
    this.defaultDatabase = instanceSettings.jsonData?.defaultDatabase || 'default';
    this.timeout = (instanceSettings.jsonData?.timeout || 30) * 1000;

    // Use injected template service or get from runtime
    this.templateSrv = templateSrv || getTemplateSrv();
  }

  /**
   * Get default query values for new queries
   *
   * This method is called when a user creates a new query in the editor.
   * It provides sensible defaults to improve the user experience.
   *
   * @param app - The Grafana application context (dashboard, explore, etc.)
   * @returns Partial query with default values
   */
  getDefaultQuery(app: CoreApp): Partial<SampleQuery> {
    return {
      ...defaultQuery,
      // Customize defaults based on context
      format: app === CoreApp.Explore ? 'table' : 'time_series',
    };
  }

  /**
   * Execute queries and return data frames
   *
   * This is the main method that Grafana calls to fetch data. It receives
   * a request containing one or more queries and returns a response with
   * data frames.
   *
   * Interview Tip: This method demonstrates several important patterns:
   * - Processing multiple queries in parallel
   * - Variable interpolation using templateSrv
   * - Creating properly typed DataFrames
   * - Error handling and propagation
   *
   * @param request - Query request from Grafana
   * @returns Promise resolving to query response with data frames
   */
  async query(request: DataQueryRequest<SampleQuery>): Promise<DataQueryResponse> {
    const { range, targets, maxDataPoints, intervalMs } = request;

    // Filter out hidden queries
    const queries = targets.filter((q) => !q.hide);

    if (queries.length === 0) {
      return { data: [] };
    }

    // Process all queries in parallel
    const promises = queries.map((query) =>
      this.executeQuery(query, range, maxDataPoints, intervalMs)
    );

    try {
      const results = await Promise.all(promises);
      return { data: results };
    } catch (error) {
      // Re-throw with additional context
      throw this.handleError(error, 'Query execution failed');
    }
  }

  /**
   * Execute a single query and return a data frame
   *
   * This method handles the actual query execution logic. In a real plugin,
   * this would make HTTP requests to the backend or external API.
   *
   * @param query - The query to execute
   * @param range - Time range for the query
   * @param maxDataPoints - Maximum data points to return
   * @param intervalMs - Suggested interval between data points
   * @returns Promise resolving to a MutableDataFrame
   */
  private async executeQuery(
    query: SampleQuery,
    range: TimeRange,
    maxDataPoints?: number,
    intervalMs?: number
  ): Promise<MutableDataFrame> {
    // Interpolate variables in the query text
    // Note: In production, you would pass scopedVars from the request
    const interpolatedQuery = this.templateSrv.replace(query.queryText);
    const interpolatedMetric = this.templateSrv.replace(query.metric);

    // For demonstration, generate sample data
    // In a real plugin, this would call the backend or external API
    if (query.format === 'table') {
      return this.createTableFrame(query, interpolatedMetric);
    }

    return this.createTimeSeriesFrame(query, range, interpolatedMetric, maxDataPoints, intervalMs);
  }

  /**
   * Create a time series data frame
   *
   * Demonstrates creating properly structured time series data that
   * Grafana can display in graph panels.
   */
  private createTimeSeriesFrame(
    query: SampleQuery,
    range: TimeRange,
    metric: string,
    maxDataPoints?: number,
    intervalMs?: number
  ): MutableDataFrame {
    // Calculate the number of data points
    const from = range.from.valueOf();
    const to = range.to.valueOf();
    const duration = to - from;

    // Use provided interval or calculate based on max data points
    const interval = intervalMs || Math.max(duration / (maxDataPoints || 100), 1000);
    const numPoints = Math.min(Math.floor(duration / interval), maxDataPoints || 1000);

    // Create the data frame with time series structure
    const frame = new MutableDataFrame({
      refId: query.refId,
      name: metric,
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          config: {
            displayName: 'Time',
          },
        },
        {
          name: 'value',
          type: FieldType.number,
          config: {
            displayName: metric,
            unit: 'short',
          },
          labels: query.labels,
        },
      ],
      meta: {
        preferredVisualisationType: 'graph',
      },
    });

    // Generate sample data points
    // In a real plugin, this data would come from the backend
    for (let i = 0; i < numPoints; i++) {
      const timestamp = from + i * interval;
      // Generate a sine wave with some noise for demonstration
      const value = Math.sin(i / 10) * 50 + 50 + Math.random() * 10;
      frame.appendRow([timestamp, value]);
    }

    return frame;
  }

  /**
   * Create a table data frame
   *
   * Demonstrates creating tabular data that Grafana can display
   * in table panels.
   */
  private createTableFrame(query: SampleQuery, metric: string): MutableDataFrame {
    const frame = new MutableDataFrame({
      refId: query.refId,
      name: metric,
      fields: [
        { name: 'id', type: FieldType.number },
        { name: 'name', type: FieldType.string },
        { name: 'value', type: FieldType.number },
        { name: 'timestamp', type: FieldType.time },
        { name: 'status', type: FieldType.string },
      ],
      meta: {
        preferredVisualisationType: 'table',
      },
    });

    // Generate sample table data
    const statuses = ['active', 'inactive', 'pending', 'error'];
    for (let i = 1; i <= 10; i++) {
      frame.appendRow([
        i,
        `${metric}_${i}`,
        Math.random() * 100,
        Date.now() - i * 60000,
        statuses[Math.floor(Math.random() * statuses.length)],
      ]);
    }

    return frame;
  }

  /**
   * Test the data source connection
   *
   * This method is called when users click "Save & Test" in the data source
   * configuration page. It should verify that the connection works.
   *
   * Interview Tip: A good testDatasource implementation should:
   * - Verify network connectivity
   * - Validate authentication credentials
   * - Check permissions if applicable
   * - Return meaningful error messages
   *
   * @returns Promise resolving to health check result
   */
  async testDatasource(): Promise<HealthCheckResult> {
    try {
      // In a real plugin, make a lightweight API call to verify connection
      // For example: GET /api/health or GET /api/v1/status

      // Simulate a health check request
      const response = await this.doRequest({
        url: `${this.baseUrl}/health`,
        method: 'GET',
      });

      // For demonstration, always return success
      // In a real plugin, check the response status
      return {
        status: 'success',
        message: 'Data source is working',
        details: {
          version: '1.0.0',
          database: this.defaultDatabase,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Support for Grafana variables (template variables)
   *
   * This method is called when Grafana needs to populate variable dropdowns.
   * It allows users to create dynamic dashboards with variable-based queries.
   *
   * @param query - The variable query string
   * @returns Promise resolving to metric names for the variable
   */
  async metricFindQuery(query: string): Promise<Array<{ text: string; value: string }>> {
    // Interpolate any variables in the query
    const interpolatedQuery = this.templateSrv.replace(query);

    // In a real plugin, query the backend for available values
    // For demonstration, return sample metrics
    const sampleMetrics = [
      'cpu_usage',
      'memory_usage',
      'disk_io',
      'network_bytes',
      'request_count',
      'error_rate',
      'latency_p50',
      'latency_p99',
    ];

    return sampleMetrics.map((metric) => ({
      text: metric,
      value: metric,
    }));
  }

  /**
   * Make an HTTP request using Grafana's backend service
   *
   * This method demonstrates the proper way to make HTTP requests from
   * a Grafana plugin. Using getBackendSrv() ensures:
   * - Proper authentication handling
   * - CORS proxy support
   * - Consistent error handling
   *
   * @param options - Request options
   * @returns Promise resolving to the response
   */
  private async doRequest(options: {
    url: string;
    method: string;
    data?: unknown;
  }): Promise<unknown> {
    const backendSrv = getBackendSrv();

    const requestOptions = {
      ...options,
      timeout: this.timeout,
    };

    // Use lastValueFrom to convert Observable to Promise
    return lastValueFrom(backendSrv.fetch(requestOptions));
  }

  /**
   * Handle and format errors consistently
   *
   * @param error - The error to handle
   * @param context - Additional context for the error
   * @returns Formatted error
   */
  private handleError(error: unknown, context: string): Error {
    const message = this.getErrorMessage(error);
    return new Error(`${context}: ${message}`);
  }

  /**
   * Extract error message from various error types
   *
   * @param error - The error to extract message from
   * @returns Error message string
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred';
  }
}
