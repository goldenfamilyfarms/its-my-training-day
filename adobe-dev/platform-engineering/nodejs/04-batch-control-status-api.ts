/**
 * Question: Batch Control Status API with Failure Handling
 * 
 * Design a Node.js API that fetches compliance control status for multiple
 * control IDs concurrently. Some calls may fail, and the API should return
 * successful results while flagging failures with detailed error information.
 * 
 * Key Technical Decisions:
 * - Parallel fetching with Promise.allSettled for partial failures
 * - Detailed error tracking per control ID
 * - Retry logic for transient failures
 * - Rate limiting to prevent overwhelming downstream services
 * - Type-safe results with discriminated unions
 */

import { EventEmitter } from 'events';

// Types
interface ControlStatus {
  controlId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_ASSESSED' | 'EXEMPT';
  lastAssessedAt: string;
  evidenceCount: number;
  violations?: Violation[];
  metadata?: Record<string, unknown>;
}

interface Violation {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  detectedAt: string;
  resourceId?: string;
}

interface ControlStatusError {
  controlId: string;
  error: {
    code: string;
    message: string;
    statusCode?: number;
    retryable: boolean;
    timestamp: string;
  };
}

type ControlStatusResult = 
  | { success: true; data: ControlStatus }
  | { success: false; error: ControlStatusError };

interface BatchStatusRequest {
  controlIds: string[];
  options?: {
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    includeMetadata?: boolean;
  };
}

interface BatchStatusResponse {
  results: ControlStatus[];
  failures: ControlStatusError[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  metadata?: {
    requestId: string;
    processedAt: string;
    duration: number;
  };
}

// Control Status Service
class ControlStatusService extends EventEmitter {
  private readonly defaultRetryAttempts = 3;
  private readonly defaultRetryDelay = 1000; // 1 second
  private readonly defaultTimeout = 10000; // 10 seconds

  /**
   * Fetches status for a single control ID with retry logic
   */
  private async fetchControlStatus(
    controlId: string,
    options: BatchStatusRequest['options'] = {}
  ): Promise<ControlStatusResult> {
    const retryAttempts = options.retryAttempts ?? this.defaultRetryAttempts;
    const retryDelay = options.retryDelay ?? this.defaultRetryDelay;
    const timeout = options.timeout ?? this.defaultTimeout;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(
          `/api/controls/${controlId}/status`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            `HTTP ${response.status}`,
            errorData.message || `Failed to fetch status for control ${controlId}`,
            response.status,
            this.isRetryableError(response.status)
          );
        }

        const data: ControlStatus = await response.json();

        // Validate response structure
        if (!this.isValidControlStatus(data)) {
          throw new ApiError(
            'INVALID_RESPONSE',
            `Invalid response structure for control ${controlId}`,
            200,
            false
          );
        }

        this.emit('control:status:success', { controlId, attempt });
        return { success: true, data };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if error is not retryable or if it's the last attempt
        const isRetryable = error instanceof ApiError ? error.retryable : this.isRetryableError(500);
        
        if (!isRetryable || attempt === retryAttempts) {
          break;
        }

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        this.emit('control:status:retry', { controlId, attempt, delay, error: lastError.message });
        
        await this.sleep(delay);
      }
    }

    // All retries failed
    const error: ControlStatusError = {
      controlId,
      error: {
        code: lastError instanceof ApiError ? lastError.code : 'FETCH_ERROR',
        message: lastError?.message || `Failed to fetch status for control ${controlId}`,
        statusCode: lastError instanceof ApiError ? lastError.statusCode : undefined,
        retryable: lastError instanceof ApiError ? lastError.retryable : false,
        timestamp: new Date().toISOString(),
      },
    };

    this.emit('control:status:failed', error);
    return { success: false, error };
  }

  /**
   * Fetches status for multiple control IDs in parallel
   */
  async fetchBatchStatus(request: BatchStatusRequest): Promise<BatchStatusResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const { controlIds, options = {} } = request;

    this.emit('batch:status:start', { requestId, controlIds: controlIds.length });

    // Fetch all control statuses in parallel
    const results = await Promise.allSettled(
      controlIds.map(controlId => this.fetchControlStatus(controlId, options))
    );

    // Separate successful and failed results
    const successful: ControlStatus[] = [];
    const failures: ControlStatusError[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const controlId = controlIds[i];

      if (result.status === 'fulfilled') {
        const controlResult = result.value;
        if (controlResult.success) {
          successful.push(controlResult.data);
        } else {
          failures.push(controlResult.error);
        }
      } else {
        // Promise itself was rejected (shouldn't happen, but handle it)
        failures.push({
          controlId,
          error: {
            code: 'PROMISE_REJECTED',
            message: result.reason?.message || `Unexpected error for control ${controlId}`,
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    const duration = Date.now() - startTime;
    const total = controlIds.length;
    const successfulCount = successful.length;
    const failedCount = failures.length;
    const successRate = total > 0 ? (successfulCount / total) * 100 : 0;

    const response: BatchStatusResponse = {
      results: successful,
      failures,
      summary: {
        total,
        successful: successfulCount,
        failed: failedCount,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      },
      metadata: {
        requestId,
        processedAt: new Date().toISOString(),
        duration,
      },
    };

    this.emit('batch:status:complete', {
      requestId,
      summary: response.summary,
      duration,
    });

    return response;
  }

  /**
   * Fetches status with concurrency control (rate limiting)
   */
  async fetchBatchStatusWithConcurrency(
    request: BatchStatusRequest,
    maxConcurrency: number = 10
  ): Promise<BatchStatusResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const { controlIds, options = {} } = request;

    this.emit('batch:status:start', { requestId, controlIds: controlIds.length, maxConcurrency });

    const results: ControlStatus[] = [];
    const failures: ControlStatusError[] = [];

    // Process in batches to control concurrency
    for (let i = 0; i < controlIds.length; i += maxConcurrency) {
      const batch = controlIds.slice(i, i + maxConcurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(controlId => this.fetchControlStatus(controlId, options))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const controlId = batch[j];

        if (result.status === 'fulfilled') {
          const controlResult = result.value;
          if (controlResult.success) {
            results.push(controlResult.data);
          } else {
            failures.push(controlResult.error);
          }
        } else {
          failures.push({
            controlId,
            error: {
              code: 'PROMISE_REJECTED',
              message: result.reason?.message || `Unexpected error for control ${controlId}`,
              retryable: false,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    const total = controlIds.length;
    const successfulCount = results.length;
    const failedCount = failures.length;
    const successRate = total > 0 ? (successfulCount / total) * 100 : 0;

    const response: BatchStatusResponse = {
      results,
      failures,
      summary: {
        total,
        successful: successfulCount,
        failed: failedCount,
        successRate: Math.round(successRate * 100) / 100,
      },
      metadata: {
        requestId,
        processedAt: new Date().toISOString(),
        duration,
      },
    };

    this.emit('batch:status:complete', {
      requestId,
      summary: response.summary,
      duration,
    });

    return response;
  }

  /**
   * Validates control status response structure
   */
  private isValidControlStatus(data: unknown): data is ControlStatus {
    if (!data || typeof data !== 'object') return false;
    
    const status = data as Record<string, unknown>;
    return (
      typeof status.controlId === 'string' &&
      typeof status.status === 'string' &&
      ['COMPLIANT', 'NON_COMPLIANT', 'NOT_ASSESSED', 'EXEMPT'].includes(status.status) &&
      typeof status.lastAssessedAt === 'string' &&
      typeof status.evidenceCount === 'number'
    );
  }

  /**
   * Determines if an HTTP status code represents a retryable error
   */
  private isRetryableError(statusCode: number): boolean {
    // Retry on 5xx errors (server errors) and 429 (rate limit)
    // Don't retry on 4xx errors (client errors) except 429
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Custom Error Class
class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Express.js API Route Handler Example
export function createBatchStatusHandler(service: ControlStatusService) {
  return async (req: { body: BatchStatusRequest }, res: {
    status: (code: number) => { json: (data: unknown) => void };
    json: (data: unknown) => void;
  }) => {
    try {
      const { controlIds, options } = req.body;

      // Validate request
      if (!controlIds || !Array.isArray(controlIds) || controlIds.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'controlIds must be a non-empty array',
          },
        });
      }

      if (controlIds.length > 100) {
        return res.status(400).json({
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: 'Maximum 100 control IDs allowed per request',
          },
        });
      }

      // Fetch batch status
      const response = await service.fetchBatchStatus({
        controlIds,
        options,
      });

      // Return 207 Multi-Status if there are partial failures
      // Or 200 OK if all succeeded
      const statusCode = response.failures.length > 0 ? 207 : 200;
      res.status(statusCode).json(response);

    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      });
    }
  };
}

// Usage Example
export function exampleUsage() {
  const service = new ControlStatusService();

  // Listen to events
  service.on('control:status:success', ({ controlId, attempt }) => {
    console.log(`✓ Control ${controlId} fetched successfully (attempt ${attempt})`);
  });

  service.on('control:status:failed', ({ controlId, error }) => {
    console.error(`✗ Control ${controlId} failed: ${error.message}`);
  });

  service.on('batch:status:complete', ({ requestId, summary, duration }) => {
    console.log(`Batch request ${requestId} completed:`, {
      ...summary,
      duration: `${duration}ms`,
    });
  });

  // Example 1: Fetch status for multiple controls
  async function example1() {
    const response = await service.fetchBatchStatus({
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-003', 'ctrl-004'],
      options: {
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 10000,
        includeMetadata: true,
      },
    });

    console.log('Successful:', response.results.length);
    console.log('Failed:', response.failures.length);
    console.log('Success Rate:', `${response.summary.successRate}%`);

    // Process successful results
    response.results.forEach(status => {
      console.log(`Control ${status.controlId}: ${status.status}`);
    });

    // Handle failures
    response.failures.forEach(failure => {
      console.error(`Failed to fetch ${failure.controlId}:`, failure.error);
    });
  }

  // Example 2: Fetch with concurrency control
  async function example2() {
    const response = await service.fetchBatchStatusWithConcurrency(
      {
        controlIds: Array.from({ length: 50 }, (_, i) => `ctrl-${String(i + 1).padStart(3, '0')}`),
        options: {
          retryAttempts: 2,
          timeout: 5000,
        },
      },
      10 // Max 10 concurrent requests
    );

    console.log('Batch completed:', response.summary);
  }

  return { example1, example2 };
}

// Export types for use in other modules
export type {
  ControlStatus,
  ControlStatusError,
  ControlStatusResult,
  BatchStatusRequest,
  BatchStatusResponse,
  Violation,
};

export { ControlStatusService, ApiError };

