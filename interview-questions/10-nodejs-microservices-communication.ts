/**
 * Interview Question 10: Microservices Communication Patterns in Node.js
 * 
 * Implement a microservices architecture for a compliance platform with:
 * - Service-to-service communication (REST, gRPC, message queue)
 * - Service discovery and health checks
 * - Circuit breaker pattern for resilience
 * - Distributed tracing
 * - Event-driven communication
 * 
 * Key Technical Requirements:
 * - HTTP client with retry and timeout
 * - Service registry for discovery
 * - Circuit breaker for fault tolerance
 * - Message queue integration
 * - Request correlation and tracing
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Types
interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: number;
  responseTime?: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

// Service Registry
class ServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceConfig> = new Map();
  private healthChecks: Map<string, ServiceHealth> = new Map();

  register(service: ServiceConfig): void {
    this.services.set(service.name, service);
    this.healthChecks.set(service.name, {
      service: service.name,
      status: 'healthy',
      lastCheck: Date.now(),
    });
    this.emit('service-registered', service);
  }

  getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }

  getHealthyServices(): ServiceConfig[] {
    return Array.from(this.services.values()).filter(service => {
      const health = this.healthChecks.get(service.name);
      return health?.status === 'healthy';
    });
  }

  updateHealth(service: string, health: ServiceHealth): void {
    this.healthChecks.set(service, health);
    this.emit('health-updated', { service, health });
  }

  getHealth(service: string): ServiceHealth | undefined {
    return this.healthChecks.get(service);
  }
}

// Circuit Breaker
class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
  };

  constructor(
    private config: {
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
      resetTimeout: number;
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (this.state.nextAttemptTime && Date.now() < this.state.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Transition to HALF_OPEN
      this.state.state = 'HALF_OPEN';
      this.state.failures = 0;
      this.state.successes = 0;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    this.state.successes++;
    this.state.failures = 0;

    if (this.state.state === 'HALF_OPEN' && this.state.successes >= this.config.successThreshold) {
      this.state.state = 'CLOSED';
    }
  }

  private recordFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// HTTP Client with Retry and Circuit Breaker
class ServiceClient {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private registry: ServiceRegistry,
    private config: {
      defaultTimeout?: number;
      defaultRetries?: number;
      circuitBreakerConfig?: CircuitBreaker['config'];
    } = {}
  ) {}

  async call<T>(
    serviceName: string,
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const service = this.registry.getService(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const circuitBreaker = this.getCircuitBreaker(serviceName);

    return circuitBreaker.execute(async () => {
      const url = `${service.baseUrl}${endpoint}`;
      const timeout = options.timeout || service.timeout || this.config.defaultTimeout || 5000;
      const maxRetries = options.retries || service.retries || this.config.defaultRetries || 3;

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': uuidv4(),
              'X-Correlation-ID': uuidv4(),
              ...options.headers,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxRetries && this.isRetryableError(error as Error)) {
            const delay = this.calculateBackoff(attempt);
            await this.sleep(delay);
            continue;
          }

          throw error;
        }
      }

      throw lastError || new Error('Request failed');
    });
  }

  private getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker(
          this.config.circuitBreakerConfig || {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 5000,
            resetTimeout: 60000,
          }
        )
      );
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  private isRetryableError(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT')
    );
  }

  private calculateBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Health Check Service
class HealthCheckService {
  constructor(
    private registry: ServiceRegistry,
    private client: ServiceClient
  ) {}

  async checkService(serviceName: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      await this.client.call(serviceName, '/health', { timeout: 3000 });
      const responseTime = Date.now() - startTime;

      const health: ServiceHealth = {
        service: serviceName,
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime,
      };

      this.registry.updateHealth(serviceName, health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        service: serviceName,
        status: 'unhealthy',
        lastCheck: Date.now(),
      };

      this.registry.updateHealth(serviceName, health);
      return health;
    }
  }

  startPeriodicChecks(interval: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      const services = Array.from(this.registry['services'].keys());
      await Promise.all(services.map(service => this.checkService(service)));
    }, interval);
  }
}

// Example usage
export function setupMicroservices() {
  const registry = new ServiceRegistry();
  const client = new ServiceClient(registry, {
    defaultTimeout: 5000,
    defaultRetries: 3,
    circuitBreakerConfig: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 5000,
      resetTimeout: 60000,
    },
  });

  const healthCheck = new HealthCheckService(registry, client);

  // Register services
  registry.register({
    name: 'compliance-service',
    baseUrl: 'http://localhost:3001',
    timeout: 5000,
    retries: 3,
  });

  registry.register({
    name: 'evidence-service',
    baseUrl: 'http://localhost:3002',
    timeout: 5000,
    retries: 3,
  });

  // Start health checks
  healthCheck.startPeriodicChecks(30000);

  return { registry, client, healthCheck };
}

/**
 * Key Concepts Explained:
 * 
 * 1. Service Registry: Centralized service discovery. Services register
 *    themselves, clients discover services by name.
 * 
 * 2. Circuit Breaker: Prevents cascading failures. Opens circuit after
 *    threshold failures, allows retry after timeout.
 * 
 * 3. Retry Logic: Exponential backoff for transient failures. Don't retry
 *    on 4xx errors, retry on 5xx and network errors.
 * 
 * 4. Health Checks: Periodic checks to determine service availability.
 *    Update registry with health status.
 * 
 * 5. Request Correlation: Add correlation IDs to track requests across
 *    services. Essential for distributed tracing.
 * 
 * Interview Talking Points:
 * - Service discovery: Centralized vs decentralized, DNS vs registry
 * - Circuit breaker: Prevents cascading failures, improves resilience
 * - Retry strategy: Exponential backoff, jitter, max retries
 * - Health checks: Active vs passive, health endpoint design
 */

export { ServiceRegistry, CircuitBreaker, ServiceClient, HealthCheckService };

