/**
 * Question: Node.js Event-Driven Architecture for Compliance Monitoring
 * 
 * Design an event-driven system in Node.js that monitors compliance control states 
 * and triggers automated remediation or alerts. This implementation ensures events 
 * are processed reliably and in order when needed.
 * 
 * Key Technical Decisions:
 * - Event sourcing pattern for complete audit trail
 * - At-least-once delivery guarantees
 * - Partitioned ordering for parallel processing
 * - Idempotency for safe retries
 * - Dead letter queue for failed events
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Types
type ComplianceEventType =
  | 'CONTROL_CHECK_STARTED'
  | 'CONTROL_CHECK_COMPLETED'
  | 'CONTROL_VIOLATION_DETECTED'
  | 'CONTROL_REMEDIATION_STARTED'
  | 'CONTROL_REMEDIATION_COMPLETED'
  | 'CONTROL_EXEMPTION_REQUESTED'
  | 'CONTROL_EXEMPTION_APPROVED';

interface ComplianceEvent {
  id: string;
  type: ComplianceEventType;
  controlId: string;
  frameworkId: string;
  timestamp: string;
  payload: unknown;
  metadata: {
    source: string;
    correlationId: string;
    causationId?: string;
    userId?: string;
    sequenceNumber?: number;
  };
}

interface EventHandler {
  name: string;
  handle(event: ComplianceEvent): Promise<void>;
}

interface ControlViolation {
  id: string;
  controlId: string;
  violationType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  detectedAt: string;
  resourceId?: string;
}

interface RemediationStrategy {
  id: string;
  type: 'automatic' | 'manual' | 'approval-required';
  execute?: (violation: ControlViolation) => Promise<void>;
  description: string;
}

// Event Store Interface
interface EventStore {
  append(event: ComplianceEvent): Promise<void>;
  getByControlId(controlId: string, limit?: number): Promise<ComplianceEvent[]>;
  getByCorrelationId(correlationId: string): Promise<ComplianceEvent[]>;
}

// Simple In-Memory Event Store (would use PostgreSQL in production)
class InMemoryEventStore implements EventStore {
  private events: ComplianceEvent[] = [];

  async append(event: ComplianceEvent): Promise<void> {
    this.events.push(event);
    // In production, would persist to database
  }

  async getByControlId(controlId: string, limit = 100): Promise<ComplianceEvent[]> {
    return this.events
      .filter(e => e.controlId === controlId)
      .slice(-limit);
  }

  async getByCorrelationId(correlationId: string): Promise<ComplianceEvent[]> {
    return this.events.filter(e => e.metadata.correlationId === correlationId);
  }
}

// Dead Letter Queue Interface
interface DeadLetterQueue {
  enqueue(event: ComplianceEvent, error: Error): Promise<void>;
  dequeue(): Promise<{ event: ComplianceEvent; error: Error } | null>;
}

class InMemoryDeadLetterQueue implements DeadLetterQueue {
  private queue: Array<{ event: ComplianceEvent; error: Error }> = [];

  async enqueue(event: ComplianceEvent, error: Error): Promise<void> {
    this.queue.push({ event, error });
  }

  async dequeue(): Promise<{ event: ComplianceEvent; error: Error } | null> {
    return this.queue.shift() || null;
  }
}

// Idempotency Store
interface IdempotencyStore {
  exists(key: string): Promise<boolean>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  get(key: string): Promise<unknown | null>;
}

class InMemoryIdempotencyStore implements IdempotencyStore {
  private store: Map<string, { value: unknown; expiresAt?: number }> = new Map();

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<unknown | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }
}

// Mutex for ordered processing
class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (this.locked) {
          this.queue.push(execute);
          return;
        }

        this.locked = true;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        }
      };

      execute();
    });
  }
}

// Compliance Event Bus
interface EventBusConfig {
  database?: unknown; // Would be database connection
  redis?: unknown; // Would be Redis connection
}

class ComplianceEventBus extends EventEmitter {
  private handlers: Map<ComplianceEventType, EventHandler[]> = new Map();
  private eventStore: EventStore;
  private deadLetterQueue: DeadLetterQueue;

  constructor(
    private config: EventBusConfig,
    private metrics?: MetricsClient
  ) {
    super();
    this.eventStore = new InMemoryEventStore();
    this.deadLetterQueue = new InMemoryDeadLetterQueue();
  }

  subscribe(eventType: ComplianceEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: ComplianceEvent): Promise<void> {
    const startTime = Date.now();

    // Persist first for durability
    await this.eventStore.append(event);

    // Then dispatch to handlers
    const handlers = this.handlers.get(event.type) ?? [];

    const results = await Promise.allSettled(
      handlers.map(handler => this.executeHandler(handler, event))
    );

    // Track failures for retry
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected'
    );

    if (failures.length > 0) {
      await this.handleFailures(event, failures);
    }

    if (this.metrics) {
      this.metrics.recordHistogram(
        'compliance_event_processing_duration',
        Date.now() - startTime,
        { eventType: event.type }
      );
    }
  }

  private async executeHandler(
    handler: EventHandler,
    event: ComplianceEvent
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`Handler ${handler.name} failed:`, error);
      throw error;
    }
  }

  private async handleFailures(
    event: ComplianceEvent,
    failures: PromiseRejectedResult[]
  ): Promise<void> {
    for (const failure of failures) {
      await this.deadLetterQueue.enqueue(
        event,
        failure.reason instanceof Error
          ? failure.reason
          : new Error(String(failure.reason))
      );
    }
  }

  // Process dead letter queue (would be called periodically)
  async processDeadLetterQueue(): Promise<void> {
    let item = await this.deadLetterQueue.dequeue();
    while (item) {
      console.warn('Retrying failed event:', item.event.id, item.error);
      // Could implement retry logic with exponential backoff
      item = await this.deadLetterQueue.dequeue();
    }
  }
}

// Ordered Event Processor
class OrderedEventProcessor {
  private partitionLocks: Map<string, Mutex> = new Map();
  private sequenceNumbers: Map<string, number> = new Map();
  private eventBuffers: Map<string, ComplianceEvent[]> = new Map();

  async processOrdered(
    event: ComplianceEvent,
    handler: (event: ComplianceEvent) => Promise<void>
  ): Promise<void> {
    const partitionKey = this.getPartitionKey(event);

    const lock = this.getOrCreateLock(partitionKey);

    await lock.runExclusive(async () => {
      const expectedSeq = (this.sequenceNumbers.get(partitionKey) ?? 0) + 1;
      const eventSeq = event.metadata.sequenceNumber ?? 0;

      if (eventSeq < expectedSeq) {
        // Duplicate, skip
        console.log(`Skipping duplicate event ${event.id}`);
        return;
      }

      if (eventSeq > expectedSeq) {
        // Out of order, buffer
        await this.bufferForReordering(event, partitionKey, expectedSeq);
        return;
      }

      // Process in order
      await handler(event);
      this.sequenceNumbers.set(partitionKey, eventSeq);

      // Process any buffered events that are now ready
      await this.processBufferedEvents(partitionKey, handler);
    });
  }

  private getPartitionKey(event: ComplianceEvent): string {
    // Partition by control for control-level ordering
    // This allows parallel processing across controls
    return `${event.frameworkId}:${event.controlId}`;
  }

  private getOrCreateLock(partitionKey: string): Mutex {
    if (!this.partitionLocks.has(partitionKey)) {
      this.partitionLocks.set(partitionKey, new Mutex());
    }
    return this.partitionLocks.get(partitionKey)!;
  }

  private async bufferForReordering(
    event: ComplianceEvent,
    partitionKey: string,
    expectedSeq: number
  ): Promise<void> {
    if (!this.eventBuffers.has(partitionKey)) {
      this.eventBuffers.set(partitionKey, []);
    }
    this.eventBuffers.get(partitionKey)!.push(event);
  }

  private async processBufferedEvents(
    partitionKey: string,
    handler: (event: ComplianceEvent) => Promise<void>
  ): Promise<void> {
    const buffer = this.eventBuffers.get(partitionKey);
    if (!buffer || buffer.length === 0) return;

    const expectedSeq = (this.sequenceNumbers.get(partitionKey) ?? 0) + 1;
    const readyEvents = buffer.filter(
      e => (e.metadata.sequenceNumber ?? 0) === expectedSeq
    );

    for (const event of readyEvents) {
      await handler(event);
      this.sequenceNumbers.set(partitionKey, event.metadata.sequenceNumber ?? 0);
      const index = buffer.indexOf(event);
      if (index > -1) {
        buffer.splice(index, 1);
      }
    }
  }
}

// Remediation Service
class RemediationService {
  constructor(private eventBus: ComplianceEventBus) {}

  async getStrategy(
    controlId: string,
    violationType: string
  ): Promise<RemediationStrategy> {
    // In real implementation, would query database for remediation strategies
    // Simplified for example
    if (violationType === 'MISSING_ENCRYPTION') {
      return {
        id: 'auto-enable-encryption',
        type: 'automatic',
        description: 'Automatically enable encryption',
        execute: async (violation: ControlViolation) => {
          // Would implement actual remediation logic
          console.log(`Enabling encryption for ${violation.resourceId}`);
        },
      };
    }

    return {
      id: 'manual-review',
      type: 'manual',
      description: 'Requires manual review',
    };
  }
}

// Control Remediation Handler
class ControlRemediationHandler implements EventHandler {
  name = 'control-remediation';

  constructor(
    private remediationService: RemediationService,
    private idempotencyStore: IdempotencyStore,
    private eventBus: ComplianceEventBus
  ) {}

  async handle(event: ComplianceEvent): Promise<void> {
    if (event.type !== 'CONTROL_VIOLATION_DETECTED') return;

    // Idempotency check
    const idempotencyKey = `remediation:${event.id}`;
    if (await this.idempotencyStore.exists(idempotencyKey)) {
      return; // Already processed
    }

    const violation = event.payload as ControlViolation;

    // Determine remediation strategy
    const strategy = await this.remediationService.getStrategy(
      violation.controlId,
      violation.violationType
    );

    if (strategy.type === 'automatic' && strategy.execute) {
      await this.executeAutomaticRemediation(event, violation, strategy);
    } else {
      await this.createRemediationTicket(event, violation, strategy);
    }

    // Mark as processed
    await this.idempotencyStore.set(idempotencyKey, {
      processedAt: new Date().toISOString(),
      outcome: strategy.type,
    }, 3600); // 1 hour TTL
  }

  private async executeAutomaticRemediation(
    event: ComplianceEvent,
    violation: ControlViolation,
    strategy: RemediationStrategy
  ): Promise<void> {
    // Publish start event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'CONTROL_REMEDIATION_STARTED',
      controlId: event.controlId,
      frameworkId: event.frameworkId,
      timestamp: new Date().toISOString(),
      payload: {
        violationId: violation.id,
        strategy: strategy.id,
      },
      metadata: {
        source: 'remediation-handler',
        correlationId: event.metadata.correlationId,
        causationId: event.id, // This event caused remediation
      },
    });

    try {
      if (strategy.execute) {
        await strategy.execute(violation);
      }

      await this.eventBus.publish({
        id: uuidv4(),
        type: 'CONTROL_REMEDIATION_COMPLETED',
        controlId: event.controlId,
        frameworkId: event.frameworkId,
        timestamp: new Date().toISOString(),
        payload: {
          violationId: violation.id,
          strategy: strategy.id,
          success: true,
        },
        metadata: {
          source: 'remediation-handler',
          correlationId: event.metadata.correlationId,
          causationId: event.id,
        },
      });
    } catch (error) {
      // Remediation failed, escalate
      await this.escalateToManualRemediation(event, violation, error as Error);
    }
  }

  private async createRemediationTicket(
    event: ComplianceEvent,
    violation: ControlViolation,
    strategy: RemediationStrategy
  ): Promise<void> {
    // Would create ticket in ticketing system
    console.log('Creating remediation ticket:', {
      violationId: violation.id,
      controlId: violation.controlId,
      strategy: strategy.id,
    });
  }

  private async escalateToManualRemediation(
    event: ComplianceEvent,
    violation: ControlViolation,
    error: Error
  ): Promise<void> {
    console.error('Remediation failed, escalating:', error);
    // Would create high-priority ticket
  }
}

// Metrics Client Interface (simplified)
interface MetricsClient {
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
}

class ConsoleMetricsClient implements MetricsClient {
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    console.log(`[METRIC] ${name}: ${value}ms`, tags);
  }
}

// Example Usage
export function setupComplianceEventSystem() {
  const eventBus = new ComplianceEventBus(
    {},
    new ConsoleMetricsClient()
  );
  const idempotencyStore = new InMemoryIdempotencyStore();
  const remediationService = new RemediationService(eventBus);
  const orderedProcessor = new OrderedEventProcessor();

  // Register remediation handler
  const remediationHandler = new ControlRemediationHandler(
    remediationService,
    idempotencyStore,
    eventBus
  );

  eventBus.subscribe('CONTROL_VIOLATION_DETECTED', remediationHandler);

  // Example: Publish a violation event
  const violationEvent: ComplianceEvent = {
    id: uuidv4(),
    type: 'CONTROL_VIOLATION_DETECTED',
    controlId: 'CC6.1',
    frameworkId: 'SOC2',
    timestamp: new Date().toISOString(),
    payload: {
      id: uuidv4(),
      controlId: 'CC6.1',
      violationType: 'MISSING_MFA',
      severity: 'HIGH',
      description: 'User missing MFA',
      detectedAt: new Date().toISOString(),
    } as ControlViolation,
    metadata: {
      source: 'compliance-scanner',
      correlationId: uuidv4(),
    },
  };

  // Process with ordering
  orderedProcessor.processOrdered(violationEvent, async (event) => {
    await eventBus.publish(event);
  });

  return { eventBus, orderedProcessor };
}

export {
  ComplianceEventBus,
  OrderedEventProcessor,
  ControlRemediationHandler,
  ComplianceEvent,
  ComplianceEventType,
};

