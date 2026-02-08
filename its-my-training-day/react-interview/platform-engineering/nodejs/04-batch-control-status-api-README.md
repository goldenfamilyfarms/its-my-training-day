# Batch Control Status API

## Overview

This API fetches compliance control status for multiple control IDs concurrently, handling partial failures gracefully. It returns successful results while flagging failures with detailed error information.

## Key Features

- **Parallel Fetching**: Fetches multiple control statuses concurrently using `Promise.allSettled`
- **Failure Handling**: Returns both successful results and failures, allowing partial success
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Concurrency Control**: Optional rate limiting to prevent overwhelming downstream services
- **Type Safety**: Full TypeScript support with discriminated unions for results
- **Event Emitting**: Emits events for monitoring and logging

## API Structure

### Types

```typescript
interface ControlStatus {
  controlId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_ASSESSED' | 'EXEMPT';
  lastAssessedAt: string;
  evidenceCount: number;
  violations?: Violation[];
  metadata?: Record<string, unknown>;
}

interface BatchStatusRequest {
  controlIds: string[];
  options?: {
    retryAttempts?: number;      // Default: 3
    retryDelay?: number;         // Default: 1000ms
    timeout?: number;            // Default: 10000ms
    includeMetadata?: boolean;
  };
}

interface BatchStatusResponse {
  results: ControlStatus[];      // Successful results
  failures: ControlStatusError[]; // Failed requests
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;         // Percentage
  };
  metadata?: {
    requestId: string;
    processedAt: string;
    duration: number;            // Milliseconds
  };
}
```

## Usage

### Basic Example

```typescript
import { ControlStatusService } from './04-batch-control-status-api';

const service = new ControlStatusService();

// Fetch status for multiple controls
const response = await service.fetchBatchStatus({
  controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-003'],
  options: {
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 10000,
  },
});

// Process results
console.log(`Success: ${response.results.length}`);
console.log(`Failed: ${response.failures.length}`);
console.log(`Success Rate: ${response.summary.successRate}%`);

// Access successful results
response.results.forEach(status => {
  console.log(`${status.controlId}: ${status.status}`);
});

// Handle failures
response.failures.forEach(failure => {
  console.error(`Failed ${failure.controlId}:`, failure.error.message);
});
```

### With Concurrency Control

```typescript
// Limit to 10 concurrent requests
const response = await service.fetchBatchStatusWithConcurrency(
  {
    controlIds: Array.from({ length: 50 }, (_, i) => `ctrl-${i}`),
    options: {
      retryAttempts: 2,
      timeout: 5000,
    },
  },
  10 // Max 10 concurrent requests
);
```

### Event Listening

```typescript
const service = new ControlStatusService();

// Listen to events
service.on('control:status:success', ({ controlId, attempt }) => {
  console.log(`✓ ${controlId} succeeded (attempt ${attempt})`);
});

service.on('control:status:failed', ({ controlId, error }) => {
  console.error(`✗ ${controlId} failed: ${error.message}`);
});

service.on('batch:status:complete', ({ requestId, summary, duration }) => {
  console.log(`Batch ${requestId}: ${summary.successful}/${summary.total} succeeded in ${duration}ms`);
});
```

### Express.js Integration

```typescript
import express from 'express';
import { ControlStatusService, createBatchStatusHandler } from './04-batch-control-status-api';

const app = express();
app.use(express.json());

const service = new ControlStatusService();

app.post('/api/controls/batch-status', createBatchStatusHandler(service));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Request Example

```bash
POST /api/controls/batch-status
Content-Type: application/json

{
  "controlIds": ["ctrl-001", "ctrl-002", "ctrl-003"],
  "options": {
    "retryAttempts": 3,
    "retryDelay": 1000,
    "timeout": 10000
  }
}
```

## Response Example

### All Successful (200 OK)

```json
{
  "results": [
    {
      "controlId": "ctrl-001",
      "status": "COMPLIANT",
      "lastAssessedAt": "2024-01-15T10:30:00Z",
      "evidenceCount": 5,
      "violations": []
    },
    {
      "controlId": "ctrl-002",
      "status": "NON_COMPLIANT",
      "lastAssessedAt": "2024-01-15T10:30:00Z",
      "evidenceCount": 3,
      "violations": [
        {
          "id": "viol-001",
          "severity": "HIGH",
          "description": "Missing encryption",
          "detectedAt": "2024-01-15T09:00:00Z"
        }
      ]
    }
  ],
  "failures": [],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "successRate": 100
  },
  "metadata": {
    "requestId": "req-1705312200000-abc123",
    "processedAt": "2024-01-15T10:30:00Z",
    "duration": 245
  }
}
```

### Partial Failures (207 Multi-Status)

```json
{
  "results": [
    {
      "controlId": "ctrl-001",
      "status": "COMPLIANT",
      "lastAssessedAt": "2024-01-15T10:30:00Z",
      "evidenceCount": 5
    }
  ],
  "failures": [
    {
      "controlId": "ctrl-002",
      "error": {
        "code": "HTTP 500",
        "message": "Internal server error",
        "statusCode": 500,
        "retryable": true,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    },
    {
      "controlId": "ctrl-003",
      "error": {
        "code": "TIMEOUT",
        "message": "Request timeout after 10000ms",
        "retryable": true,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "summary": {
    "total": 3,
    "successful": 1,
    "failed": 2,
    "successRate": 33.33
  },
  "metadata": {
    "requestId": "req-1705312200000-abc123",
    "processedAt": "2024-01-15T10:30:00Z",
    "duration": 10245
  }
}
```

## Error Handling

### Retryable Errors

The API automatically retries on:
- **5xx Server Errors**: Internal server errors, service unavailable
- **429 Rate Limit**: Too many requests
- **408 Request Timeout**: Request timeout

### Non-Retryable Errors

These errors are not retried:
- **4xx Client Errors**: Bad request, unauthorized, not found (except 429)
- **Invalid Response**: Malformed response structure
- **Validation Errors**: Invalid control ID format

### Error Structure

```typescript
interface ControlStatusError {
  controlId: string;
  error: {
    code: string;           // Error code (e.g., "HTTP 500", "TIMEOUT")
    message: string;        // Human-readable error message
    statusCode?: number;    // HTTP status code if applicable
    retryable: boolean;    // Whether the error is retryable
    timestamp: string;     // ISO 8601 timestamp
  };
}
```

## Performance Considerations

### Parallel vs Sequential

- **Parallel (default)**: All requests sent simultaneously
  - Faster for small batches
  - May overwhelm downstream service
  - Use when: < 20 control IDs

- **Concurrency Control**: Process in batches
  - Prevents overwhelming services
  - Slightly slower but more reliable
  - Use when: > 20 control IDs or rate-limited APIs

### Timeout Configuration

- **Default**: 10 seconds per request
- **Adjust based on**: Network latency, API response time
- **Too short**: May cause false timeouts
- **Too long**: Slows down batch processing

### Retry Strategy

- **Exponential Backoff**: Delay increases with each retry
  - Attempt 1: 1s delay
  - Attempt 2: 2s delay
  - Attempt 3: 4s delay

- **Max Retries**: Default 3 attempts
  - Balance between reliability and speed
  - Adjust based on error rate

## Best Practices

1. **Batch Size**: Keep batches under 100 control IDs
2. **Concurrency**: Use concurrency control for large batches (>20)
3. **Timeout**: Set appropriate timeout based on API response times
4. **Retry**: Use 2-3 retries for transient failures
5. **Monitoring**: Listen to events for observability
6. **Error Handling**: Always check both `results` and `failures` arrays

## Interview Talking Points

1. **Partial Failure Handling**: "I use `Promise.allSettled` instead of `Promise.all` to handle partial failures gracefully, ensuring successful results are returned even if some requests fail."

2. **Retry Logic**: "The retry mechanism uses exponential backoff and only retries on transient errors (5xx, 429, 408), preventing unnecessary retries on client errors."

3. **Type Safety**: "I use discriminated unions (`ControlStatusResult`) to ensure type safety when handling success/failure cases, preventing runtime errors."

4. **Concurrency Control**: "For large batches, I provide a concurrency-controlled version that processes requests in batches, preventing overwhelming downstream services."

5. **Observability**: "The service emits events for monitoring, allowing integration with logging and metrics systems."

6. **HTTP Status Codes**: "I return 207 Multi-Status when there are partial failures, following HTTP standards for batch operations."

