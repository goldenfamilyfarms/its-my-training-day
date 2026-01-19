# Technical Interview Questions: Node.js for TechGRC Full-Stack Developer

## Question 1: Compliance Audit Trail System Architecture

**Scenario:** You're building a GRC system that must maintain an immutable audit trail of all compliance-related changes (policy updates, control modifications, risk assessments). The system needs to handle 10,000+ audit events per day across multiple tenants while ensuring data integrity and meeting regulatory requirements for tamper-proof logging.

**Question:** How would you architect an audit trail service in Node.js that ensures immutability, supports efficient querying by compliance officers, and scales to handle multi-tenant workloads? Walk me through your design decisions, data storage approach, and how you'd handle potential bottlenecks.

**Senior-Level Answer:**

**Requirements Clarification:**
Before diving into the solution, I'd clarify several key requirements:
- What's the retention period for audit logs? (impacts storage strategy)
- Are there specific compliance frameworks we're targeting? (SOC 2, ISO 27001, GDPR)
- What query patterns do compliance officers need? (by user, by resource, by time range, by event type)
- What's the acceptable latency for audit log writes vs. reads?
- Do we need real-time alerting on certain audit events?
- What's the disaster recovery RTO/RPO?

**Architecture Design:**

```typescript
// 1. Event Schema with Cryptographic Integrity
interface AuditEvent {
  id: string;                    // UUID v7 (time-sortable)
  tenantId: string;              // Multi-tenancy isolation
  timestamp: Date;               // ISO 8601 timestamp
  eventType: string;             // e.g., "POLICY_UPDATED", "CONTROL_MODIFIED"
  actor: {
    userId: string;
    email: string;
    ipAddress: string;
    userAgent: string;
  };
  resource: {
    type: string;                // "Policy", "Control", "Risk"
    id: string;
    name: string;
  };
  changes: {
    before: Record<string, any>; // Previous state snapshot
    after: Record<string, any>;  // New state snapshot
  };
  metadata: Record<string, any>; // Additional context
  hash: string;                  // SHA-256 hash of event data
  previousHash: string;          // Hash of previous event (blockchain-style)
  signature: string;             // HMAC signature for tamper detection
}
```

```typescript
// 2. Audit Service with Write-Ahead Logging Pattern
import { createHash, createHmac } from 'crypto';
import { EventEmitter } from 'events';

class AuditService extends EventEmitter {
  private lastHash: Map<string, string>; // Per-tenant last hash
  private writeBuffer: AuditEvent[];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(
    private readonly primaryStore: AuditStore,      // PostgreSQL for queryability
    private readonly immutableStore: ImmutableStore, // S3/Object Storage for immutability
    private readonly secretKey: string
  ) {
    super();
    this.lastHash = new Map();
    this.writeBuffer = [];
    this.startBatchFlush();
  }

  async logEvent(event: Omit<AuditEvent, 'id' | 'hash' | 'previousHash' | 'signature'>): Promise<void> {
    // Generate time-sortable UUID v7
    const id = this.generateUUIDv7();
    
    // Get previous hash for this tenant's audit chain
    const previousHash = this.lastHash.get(event.tenantId) || '';
    
    // Create canonical representation for hashing
    const eventData = {
      ...event,
      id,
      previousHash,
      timestamp: event.timestamp.toISOString()
    };
    
    // Generate cryptographic hash
    const hash = this.generateHash(eventData);
    
    // Generate HMAC signature
    const signature = this.generateSignature(eventData, hash);
    
    const completeEvent: AuditEvent = {
      ...eventData,
      hash,
      signature
    };
    
    // Update last hash for chain
    this.lastHash.set(event.tenantId, hash);
    
    // Add to write buffer
    this.writeBuffer.push(completeEvent);
    
    // Emit event for real-time processing (alerts, streaming)
    this.emit('audit:logged', completeEvent);
    
    // Flush if buffer is full
    if (this.writeBuffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  private generateHash(event: any): string {
    const canonical = JSON.stringify(event, Object.keys(event).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  private generateSignature(event: any, hash: string): string {
    const hmac = createHmac('sha256', this.secretKey);
    hmac.update(hash);
    return hmac.digest('hex');
  }

  private async flush(): Promise<void> {
    if (this.writeBuffer.length === 0) return;
    
    const eventsToWrite = [...this.writeBuffer];
    this.writeBuffer = [];
    
    try {
      // Write to both stores in parallel
      await Promise.all([
        this.primaryStore.batchInsert(eventsToWrite),
        this.immutableStore.append(eventsToWrite)
      ]);
    } catch (error) {
      // Critical: audit log write failure
      // Re-add to buffer and alert
      this.writeBuffer.unshift(...eventsToWrite);
      this.emit('audit:write-failed', error);
      throw error;
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flush().catch(err => {
        console.error('Batch flush failed:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  private generateUUIDv7(): string {
    // UUID v7 implementation with timestamp-based ordering
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(10);
    // ... implementation details
    return uuid;
  }
}
```

```typescript
// 3. Dual Storage Strategy
// Primary Store: PostgreSQL with JSONB for flexible querying
class PostgreSQLAuditStore implements AuditStore {
  async batchInsert(events: AuditEvent[]): Promise<void> {
    const query = `
      INSERT INTO audit_events (
        id, tenant_id, timestamp, event_type, actor, resource, 
        changes, metadata, hash, previous_hash, signature
      ) VALUES ${events.map((_, i) => `($${i * 11 + 1}, $${i * 11 + 2}, ...)`).join(', ')}
    `;
    
    const values = events.flatMap(e => [
      e.id, e.tenantId, e.timestamp, e.eventType,
      JSON.stringify(e.actor), JSON.stringify(e.resource),
      JSON.stringify(e.changes), JSON.stringify(e.metadata),
      e.hash, e.previousHash, e.signature
    ]);
    
    await this.pool.query(query, values);
  }

  async query(criteria: AuditQueryCriteria): Promise<AuditEvent[]> {
    // Efficient querying with indexes on tenant_id, timestamp, event_type
    let query = `
      SELECT * FROM audit_events 
      WHERE tenant_id = $1
    `;
    const params: any[] = [criteria.tenantId];
    let paramIndex = 2;
    
    if (criteria.startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(criteria.startDate);
    }
    
    if (criteria.endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(criteria.endDate);
    }
    
    if (criteria.eventTypes?.length) {
      query += ` AND event_type = ANY($${paramIndex++})`;
      params.push(criteria.eventTypes);
    }
    
    if (criteria.resourceType) {
      query += ` AND resource->>'type' = $${paramIndex++}`;
      params.push(criteria.resourceType);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(criteria.limit || 100, criteria.offset || 0);
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

// Immutable Store: S3 with append-only writes
class S3ImmutableStore implements ImmutableStore {
  async append(events: AuditEvent[]): Promise<void> {
    // Partition by tenant and date for efficient retrieval
    const partitions = this.partitionEvents(events);
    
    const uploads = partitions.map(async ({ tenantId, date, events }) => {
      const key = `audit-logs/${tenantId}/${date.toISOString().split('T')[0]}/${Date.now()}.jsonl`;
      
      // JSONL format for streaming and efficient appending
      const content = events.map(e => JSON.stringify(e)).join('\n');
      
      await this.s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: 'application/x-ndjson',
        ServerSideEncryption: 'AES256',
        Metadata: {
          'event-count': events.length.toString(),
          'first-timestamp': events[0].timestamp.toISOString(),
          'last-timestamp': events[events.length - 1].timestamp.toISOString()
        }
      }).promise();
    });
    
    await Promise.all(uploads);
  }

  private partitionEvents(events: AuditEvent[]): Array<{ tenantId: string; date: Date; events: AuditEvent[] }> {
    const partitions = new Map<string, AuditEvent[]>();
    
    events.forEach(event => {
      const date = new Date(event.timestamp);
      date.setHours(0, 0, 0, 0);
      const key = `${event.tenantId}-${date.toISOString()}`;
      
      if (!partitions.has(key)) {
        partitions.set(key, []);
      }
      partitions.get(key)!.push(event);
    });
    
    return Array.from(partitions.entries()).map(([key, events]) => {
      const [tenantId, dateStr] = key.split('-', 2);
      return { tenantId, date: new Date(dateStr), events };
    });
  }
}
```

```typescript
// 4. Express API with Proper Error Handling
import express from 'express';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

// Middleware for tenant isolation
const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }
  req.tenantId = tenantId;
  next();
};

// Log audit event endpoint (used internally by other services)
router.post('/audit/events',
  requireTenant,
  body('eventType').isString().notEmpty(),
  body('actor').isObject(),
  body('resource').isObject(),
  body('changes').isObject(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      await auditService.logEvent({
        tenantId: req.tenantId,
        timestamp: new Date(),
        eventType: req.body.eventType,
        actor: req.body.actor,
        resource: req.body.resource,
        changes: req.body.changes,
        metadata: req.body.metadata || {}
      });
      
      res.status(202).json({ status: 'accepted' });
    } catch (error) {
      console.error('Audit log failed:', error);
      res.status(500).json({ error: 'Failed to log audit event' });
    }
  }
);

// Query audit events endpoint
router.get('/audit/events',
  requireTenant,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('eventTypes').optional().isArray(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const events = await auditService.query({
        tenantId: req.tenantId,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        eventTypes: req.query.eventTypes as string[],
        limit: parseInt(req.query.limit as string) || 100,
        offset: parseInt(req.query.offset as string) || 0
      });
      
      res.json({ events, count: events.length });
    } catch (error) {
      console.error('Audit query failed:', error);
      res.status(500).json({ error: 'Failed to query audit events' });
    }
  }
);

// Verify audit chain integrity endpoint
router.post('/audit/verify',
  requireTenant,
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  async (req: Request, res: Response) => {
    try {
      const events = await auditService.query({
        tenantId: req.tenantId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        limit: 10000 // Verify up to 10k events
      });
      
      const verification = verifyAuditChain(events);
      res.json(verification);
    } catch (error) {
      console.error('Verification failed:', error);
      res.status(500).json({ error: 'Failed to verify audit chain' });
    }
  }
);

function verifyAuditChain(events: AuditEvent[]): { valid: boolean; tamperedEvents: string[] } {
  const tamperedEvents: string[] = [];
  let previousHash = '';
  
  for (const event of events) {
    // Verify hash chain
    if (event.previousHash !== previousHash) {
      tamperedEvents.push(event.id);
    }
    
    // Verify event hash
    const computedHash = generateHash(event);
    if (computedHash !== event.hash) {
      tamperedEvents.push(event.id);
    }
    
    previousHash = event.hash;
  }
  
  return {
    valid: tamperedEvents.length === 0,
    tamperedEvents
  };
}
```

**Bottleneck Handling:**

1. **Write Throughput**: Batching writes (100 events or 5-second intervals) reduces database round-trips
2. **Query Performance**: Composite indexes on `(tenant_id, timestamp, event_type)`, JSONB indexes for nested queries
3. **Storage Growth**: Automated archival to cold storage (Glacier) after 90 days, keeping hot data in PostgreSQL
4. **Multi-tenancy**: Tenant-level partitioning in PostgreSQL for query isolation
5. **Scalability**: Horizontal scaling with read replicas for queries, write leader for consistency

**Trade-offs:**
- Dual storage increases complexity but provides both queryability (PostgreSQL) and immutability (S3)
- Batching introduces slight latency (max 5 seconds) but dramatically improves throughput
- Hash chaining provides tamper detection but requires sequential processing for verification

---

## Question 2: Control Assessment Workflow Engine

**Scenario:** You need to build a workflow engine that orchestrates control assessments across different compliance frameworks (SOC 2, ISO 27001, NIST). Each framework has different control requirements, assessment procedures, and approval workflows. The system needs to handle parallel assessments, automated evidence collection, and deadline tracking.

**Question:** Design a Node.js workflow orchestration system that can handle complex, multi-step control assessments with dynamic branching based on control status, automated integrations for evidence gathering, and robust error handling for failed assessment steps. How would you ensure workflow state consistency and handle long-running processes?

**Senior-Level Answer:**

**Requirements Clarification:**
- What's the expected concurrency? (simultaneous assessments per tenant)
- Do workflows need to be versioned? (framework updates over time)
- What's the SLA for evidence collection integrations? (timeout handling)
- Do we need workflow pause/resume capability?
- How do we handle workflow schema evolution with in-flight assessments?
- What audit requirements exist for workflow state changes?

**Architecture Design:**

```typescript
// 1. Workflow Definition Schema
interface WorkflowDefinition {
  id: string;
  name: string;
  framework: 'SOC2' | 'ISO27001' | 'NIST' | 'CUSTOM';
  version: string;
  steps: WorkflowStep[];
  timeoutMs: number;
}

interface WorkflowStep {
  id: string;
  type: 'TASK' | 'DECISION' | 'PARALLEL' | 'INTEGRATION' | 'APPROVAL';
  name: string;
  config: StepConfig;
  next?: string | ConditionalNext[];
  onError?: ErrorHandler;
  timeoutMs?: number;
}

interface ConditionalNext {
  condition: string;  // JavaScript expression
  next: string;       // Next step ID
}

type StepConfig = 
  | TaskStepConfig 
  | DecisionStepConfig 
  | ParallelStepConfig 
  | IntegrationStepConfig
  | ApprovalStepConfig;

interface TaskStepConfig {
  assigneeRole: string;
  instructions: string;
  requiredFields: string[];
}

interface IntegrationStepConfig {
  integrationType: 'GITHUB' | 'JIRA' | 'AWS' | 'OKTA';
  action: string;
  parameters: Record<string, any>;
  retryPolicy: RetryPolicy;
}

interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

// 2. Workflow Instance State Management
interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowVersion: string;
  tenantId: string;
  controlId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  currentStep: string;
  context: Record<string, any>;  // Workflow variables
  history: StepExecution[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deadline?: Date;
}

interface StepExecution {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
}
```

```typescript
// 3. Workflow Engine with State Machine Pattern
import { EventEmitter } from 'events';
import * as vm from 'vm';

class WorkflowEngine extends EventEmitter {
  private activeInstances: Map<string, WorkflowInstance>;
  private stepHandlers: Map<string, StepHandler>;
  
  constructor(
    private readonly instanceStore: WorkflowInstanceStore,
    private readonly definitionStore: WorkflowDefinitionStore,
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService
  ) {
    super();
    this.activeInstances = new Map();
    this.registerStepHandlers();
    this.startInstanceRecovery();
  }

  async startWorkflow(
    tenantId: string,
    workflowDefinitionId: string,
    controlId: string,
    initialContext: Record<string, any> = {}
  ): Promise<string> {
    const definition = await this.definitionStore.getLatest(workflowDefinitionId);
    
    const instance: WorkflowInstance = {
      id: this.generateId(),
      workflowDefinitionId: definition.id,
      workflowVersion: definition.version,
      tenantId,
      controlId,
      status: 'RUNNING',
      currentStep: definition.steps[0].id,
      context: initialContext,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: this.calculateDeadline(definition)
    };
    
    await this.instanceStore.save(instance);
    this.activeInstances.set(instance.id, instance);
    
    // Start execution asynchronously
    this.executeStep(instance.id).catch(err => {
      console.error(`Workflow ${instance.id} failed:`, err);
    });
    
    return instance.id;
  }

  private async executeStep(instanceId: string): Promise<void> {
    const instance = await this.getInstance(instanceId);
    if (!instance || instance.status !== 'RUNNING') {
      return;
    }
    
    const definition = await this.definitionStore.get(
      instance.workflowDefinitionId,
      instance.workflowVersion
    );
    
    const step = definition.steps.find(s => s.id === instance.currentStep);
    if (!step) {
      await this.completeWorkflow(instance, 'FAILED', 'Step not found');
      return;
    }
    
    const execution: StepExecution = {
      stepId: step.id,
      status: 'RUNNING',
      startedAt: new Date(),
      retryCount: 0
    };
    
    instance.history.push(execution);
    await this.updateInstance(instance);
    
    try {
      const handler = this.stepHandlers.get(step.type);
      if (!handler) {
        throw new Error(`No handler for step type: ${step.type}`);
      }
      
      // Execute step with timeout
      const result = await this.executeWithTimeout(
        () => handler.execute(step, instance),
        step.timeoutMs || definition.timeoutMs
      );
      
      execution.status = 'COMPLETED';
      execution.completedAt = new Date();
      execution.result = result;
      
      // Update context with result
      instance.context = { ...instance.context, ...result };
      
      // Determine next step
      const nextStepId = await this.determineNextStep(step, instance);
      
      if (nextStepId) {
        instance.currentStep = nextStepId;
        instance.updatedAt = new Date();
        await this.updateInstance(instance);
        
        // Continue execution
        await this.executeStep(instanceId);
      } else {
        // Workflow complete
        await this.completeWorkflow(instance, 'COMPLETED');
      }
      
    } catch (error) {
      execution.status = 'FAILED';
      execution.completedAt = new Date();
      execution.error = error.message;
      
      await this.handleStepError(instance, step, execution, error);
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Step timeout exceeded')), timeoutMs)
      )
    ]);
  }

  private async determineNextStep(
    step: WorkflowStep,
    instance: WorkflowInstance
  ): Promise<string | null> {
    if (!step.next) {
      return null;
    }
    
    // Simple next step
    if (typeof step.next === 'string') {
      return step.next;
    }
    
    // Conditional routing
    for (const conditional of step.next) {
      if (this.evaluateCondition(conditional.condition, instance.context)) {
        return conditional.next;
      }
    }
    
    return null;
  }

  private evaluateCondition(expression: string, context: Record<string, any>): boolean {
    try {
      const sandbox = { ...context };
      const script = new vm.Script(`(${expression})`);
      const vmContext = vm.createContext(sandbox);
      return script.runInContext(vmContext);
    } catch (error) {
      console.error('Condition evaluation failed:', error);
      return false;
    }
  }

  private async handleStepError(
    instance: WorkflowInstance,
    step: WorkflowStep,
    execution: StepExecution,
    error: Error
  ): Promise<void> {
    // Check retry policy for integration steps
    if (step.type === 'INTEGRATION' && step.config) {
      const config = step.config as IntegrationStepConfig;
      const retryPolicy = config.retryPolicy;
      
      if (execution.retryCount < retryPolicy.maxAttempts) {
        execution.retryCount++;
        const backoffMs = retryPolicy.backoffMs * 
          Math.pow(retryPolicy.backoffMultiplier, execution.retryCount - 1);
        
        console.log(`Retrying step ${step.id} after ${backoffMs}ms`);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        execution.status = 'RUNNING';
        execution.startedAt = new Date();
        
        await this.executeStep(instance.id);
        return;
      }
    }
    
    // Check error handler
    if (step.onError) {
      instance.currentStep = step.onError.nextStep;
      instance.context.lastError = error.message;
      await this.updateInstance(instance);
      await this.executeStep(instance.id);
      return;
    }
    
    // No recovery - fail workflow
    await this.completeWorkflow(instance, 'FAILED', error.message);
  }

  private registerStepHandlers(): void {
    this.stepHandlers.set('TASK', new TaskStepHandler());
    this.stepHandlers.set('DECISION', new DecisionStepHandler());
    this.stepHandlers.set('PARALLEL', new ParallelStepHandler(this));
    this.stepHandlers.set('INTEGRATION', new IntegrationStepHandler(this.integrationService));
    this.stepHandlers.set('APPROVAL', new ApprovalStepHandler(this.notificationService));
  }

  private async completeWorkflow(
    instance: WorkflowInstance,
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED',
    errorMessage?: string
  ): Promise<void> {
    instance.status = status;
    instance.completedAt = new Date();
    instance.updatedAt = new Date();
    
    if (errorMessage) {
      instance.context.error = errorMessage;
    }
    
    await this.updateInstance(instance);
    this.activeInstances.delete(instance.id);
    
    this.emit('workflow:completed', { instance, status });
  }

  // Recovery mechanism for crashed instances
  private async startInstanceRecovery(): Promise<void> {
    setInterval(async () => {
      const staleInstances = await this.instanceStore.findStale(Date.now() - 300000); // 5 min
      
      for (const instance of staleInstances) {
        console.log(`Recovering stale workflow: ${instance.id}`);
        this.activeInstances.set(instance.id, instance);
        await this.executeStep(instance.id);
      }
    }, 60000); // Check every minute
  }

  private async getInstance(id: string): Promise<WorkflowInstance | null> {
    return this.activeInstances.get(id) || await this.instanceStore.get(id);
  }

  private async updateInstance(instance: WorkflowInstance): Promise<void> {
    instance.updatedAt = new Date();
    await this.instanceStore.save(instance);
    this.activeInstances.set(instance.id, instance);
  }
}
```

```typescript
// 4. Step Handlers Implementation
interface StepHandler {
  execute(step: WorkflowStep, instance: WorkflowInstance): Promise<Record<string, any>>;
}

class IntegrationStepHandler implements StepHandler {
  constructor(private readonly integrationService: IntegrationService) {}
  
  async execute(step: WorkflowStep, instance: WorkflowInstance): Promise<Record<string, any>> {
    const config = step.config as IntegrationStepConfig;
    
    // Substitute context variables in parameters
    const parameters = this.substituteVariables(config.parameters, instance.context);
    
    const result = await this.integrationService.execute(
      config.integrationType,
      config.action,
      parameters
    );
    
    return { [`${step.id}_result`]: result };
  }
  
  private substituteVariables(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{(\w+)\}/g, (_, key) => context[key] || '');
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteVariables(item, context));
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteVariables(value, context);
      }
      return result;
    }
    return obj;
  }
}

class ParallelStepHandler implements StepHandler {
  constructor(private readonly engine: WorkflowEngine) {}
  
  async execute(step: WorkflowStep, instance: WorkflowInstance): Promise<Record<string, any>> {
    const config = step.config as ParallelStepConfig;
    
    // Execute parallel branches
    const promises = config.branches.map(async (branch) => {
      const branchInstance = await this.engine.startWorkflow(
        instance.tenantId,
        branch.workflowId,
        instance.controlId,
        instance.context
      );
      
      return this.waitForCompletion(branchInstance);
    });
    
    const results = await Promise.all(promises);
    
    return {
      parallelResults: results
    };
  }
  
  private async waitForCompletion(instanceId: string): Promise<any> {
    // Poll for completion
    while (true) {
      const instance = await this.engine['instanceStore'].get(instanceId);
      if (instance.status === 'COMPLETED') {
        return instance.context;
      }
      if (instance.status === 'FAILED') {
        throw new Error(`Parallel branch failed: ${instance.id}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

class ApprovalStepHandler implements StepHandler {
  constructor(private readonly notificationService: NotificationService) {}
  
  async execute(step: WorkflowStep, instance: WorkflowInstance): Promise<Record<string, any>> {
    const config = step.config as ApprovalStepConfig;
    
    // Send approval request
    await this.notificationService.sendApprovalRequest({
      workflowInstanceId: instance.id,
      stepId: step.id,
      approverRole: config.approverRole,
      dueDate: config.dueDateDays ? this.calculateDueDate(config.dueDateDays) : undefined
    });
    
    // Wait for approval (handled by separate approval endpoint)
    return new Promise((resolve, reject) => {
      const checkApproval = async () => {
        const approval = await this.notificationService.getApproval(instance.id, step.id);
        
        if (approval?.status === 'APPROVED') {
          resolve({ approved: true, approver: approval.approver });
        } else if (approval?.status === 'REJECTED') {
          reject(new Error('Approval rejected'));
        } else {
          setTimeout(checkApproval, 5000); // Poll every 5 seconds
        }
      };
      
      checkApproval();
    });
  }
  
  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
```

```typescript
// 5. Express API for Workflow Management
router.post('/workflows/start',
  requireTenant,
  body('workflowDefinitionId').isString(),
  body('controlId').isString(),
  body('context').optional().isObject(),
  async (req: Request, res: Response) => {
    try {
      const instanceId = await workflowEngine.startWorkflow(
        req.tenantId,
        req.body.workflowDefinitionId,
        req.body.controlId,
        req.body.context
      );
      
      res.json({ instanceId });
    } catch (error) {
      console.error('Failed to start workflow:', error);
      res.status(500).json({ error: 'Failed to start workflow' });
    }
  }
);

router.get('/workflows/:instanceId',
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const instance = await workflowEngine['instanceStore'].get(req.params.instanceId);
      
      if (!instance || instance.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json(instance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve workflow' });
    }
  }
);

router.post('/workflows/:instanceId/cancel',
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      await workflowEngine.cancelWorkflow(req.params.instanceId, req.tenantId);
      res.json({ status: 'cancelled' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel workflow' });
    }
  }
);
```

**State Consistency Approach:**
1. **Atomic Updates**: All state changes written to PostgreSQL with transactions
2. **Event Sourcing**: All state transitions logged for replay capability
3. **Idempotency**: Step executions are idempotent using execution IDs
4. **Recovery**: Periodic scanning for stale instances with automatic recovery
5. **Versioning**: Workflow definitions are versioned; in-flight workflows continue on their version

**Long-Running Process Handling:**
1. **Async Execution**: Steps execute asynchronously with webhook/polling for results
2. **Heartbeat**: Active workflows send heartbeats; stale workflows are recovered
3. **Checkpointing**: Context and history persisted after each step
4. **Timeout Management**: Per-step and workflow-level timeouts with configurable behavior

---

## Question 3: Multi-Tenant Data Isolation & RBAC

**Scenario:** Your GRC platform needs to support multiple enterprise customers (tenants) with strict data isolation requirements. Each tenant has complex role hierarchies (Admin, Compliance Officer, Auditor, Viewer) with different permissions on controls, policies, and audit logs. Some tenants require additional isolation for different business units within their organization.

**Question:** How would you implement a robust multi-tenant architecture in Node.js with row-level security, role-based access control (RBAC), and support for hierarchical permissions? Discuss database design, middleware implementation, and how you'd handle cross-tenant data leakage prevention.

**Senior-Level Answer:**

**Requirements Clarification:**
- How many tenants are we expecting? (affects partitioning strategy)
- What's the depth of organizational hierarchy? (business units, departments)
- Do we need attribute-based access control (ABAC) or just RBAC?
- Are there regulatory requirements (HIPAA, FedRAMP) for data isolation?
- Do we need tenant-level feature flags or configuration?
- What's the performance SLA for permission checks?

**Architecture Design:**

```typescript
// 1. Multi-Tenant Database Schema with Row-Level Security
-- PostgreSQL schema with RLS enabled

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  isolation_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- STANDARD, ENHANCED, DEDICATED
  encryption_key_id VARCHAR(255), -- For tenant-specific encryption
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, SUSPENDED, DELETED
);

CREATE TABLE organizational_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path LTREE, -- Hierarchical path for efficient queries
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, path)
);

CREATE INDEX idx_org_units_path ON organizational_units USING GIST (path);
CREATE INDEX idx_org_units_tenant ON organizational_units(tenant_id);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  org_unit_id UUID REFERENCES organizational_units(id),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE, -- System roles vs custom roles
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES organizational_units(id), -- Scope role to org unit
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id, COALESCE(org_unit_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES organizational_units(id), -- Control ownership
  name VARCHAR(255) NOT NULL,
  description TEXT,
  framework VARCHAR(50),
  status VARCHAR(50),
  owner_id UUID REFERENCES users(id),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_controls_tenant ON controls(tenant_id);
CREATE INDEX idx_controls_org_unit ON controls(org_unit_id);

-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_controls ON controls
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_audit ON audit_events
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

```typescript
// 2. Permission System with Hierarchical RBAC
enum Permission {
  // Control permissions
  CONTROL_VIEW = 'control:view',
  CONTROL_CREATE = 'control:create',
  CONTROL_EDIT = 'control:edit',
  CONTROL_DELETE = 'control:delete',
  CONTROL_ASSESS = 'control:assess',
  
  // Policy permissions
  POLICY_VIEW = 'policy:view',
  POLICY_CREATE = 'policy:create',
  POLICY_EDIT = 'policy:edit',
  POLICY_DELETE = 'policy:delete',
  
  // Audit permissions
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  
  // User management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  
  // Role management
  ROLE_VIEW = 'role:view',
  ROLE_CREATE = 'role:create',
  ROLE_EDIT = 'role:edit',
  ROLE_DELETE = 'role:delete',
  
  // Tenant admin
  TENANT_ADMIN = 'tenant:admin'
}

interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

interface UserContext {
  userId: string;
  tenantId: string;
  email: string;
  orgUnitId?: string;
  orgUnitPath?: string; // LTREE path for hierarchy
  roles: Array<{
    roleId: string;
    roleName: string;
    permissions: Permission[];
    scope?: string; // org unit scope
  }>;
}

class PermissionService {
  constructor(private readonly db: Database) {}
  
  async getUserContext(userId: string, tenantId: string): Promise<UserContext> {
    const query = `
      SELECT 
        u.id as user_id,
        u.tenant_id,
        u.email,
        u.org_unit_id,
        ou.path as org_unit_path,
        json_agg(
          json_build_object(
            'roleId', r.id,
            'roleName', r.name,
            'permissions', r.permissions,
            'scope', ur_ou.path
          )
        ) as roles
      FROM users u
      LEFT JOIN organizational_units ou ON u.org_unit_id = ou.id
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN organizational_units ur_ou ON ur.org_unit_id = ur_ou.id
      WHERE u.id = $1 AND u.tenant_id = $2 AND u.status = 'ACTIVE'
      GROUP BY u.id, u.tenant_id, u.email, u.org_unit_id, ou.path
    `;
    
    const result = await this.db.query(query, [userId, tenantId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }
    
    return result.rows[0];
  }
  
  hasPermission(
    userContext: UserContext,
    permission: Permission,
    resource?: { orgUnitId?: string }
  ): boolean {
    // Check if user has permission
    const hasDirectPermission = userContext.roles.some(role => 
      role.permissions.includes(permission) || role.permissions.includes(Permission.TENANT_ADMIN)
    );
    
    if (!hasDirectPermission) {
      return false;
    }
    
    // If no resource scope, direct permission is sufficient
    if (!resource?.orgUnitId) {
      return true;
    }
    
    // Check hierarchical permission scope
    return this.hasPermissionInHierarchy(userContext, permission, resource.orgUnitId);
  }
  
  private hasPermissionInHierarchy(
    userContext: UserContext,
    permission: Permission,
    targetOrgUnitId: string
  ): boolean {
    // User with permission at parent org unit has permission on child units
    // Use LTREE path matching
    for (const role of userContext.roles) {
      if (!role.permissions.includes(permission) && !role.permissions.includes(Permission.TENANT_ADMIN)) {
        continue;
      }
      
      // No scope means tenant-wide permission
      if (!role.scope) {
        return true;
      }
      
      // Check if role scope is ancestor of target
      // This requires async query, so we'd cache org unit paths
      // For now, simplified check
      if (role.scope === targetOrgUnitId) {
        return true;
      }
    }
    
    return false;
  }
  
  async checkPermissionWithHierarchy(
    userContext: UserContext,
    permission: Permission,
    resourceOrgUnitId?: string
  ): Promise<boolean> {
    // Check direct permission
    const hasDirectPermission = userContext.roles.some(role => 
      role.permissions.includes(permission) || role.permissions.includes(Permission.TENANT_ADMIN)
    );
    
    if (!hasDirectPermission) {
      return false;
    }
    
    if (!resourceOrgUnitId) {
      return true;
    }
    
    // Query database for hierarchy check using LTREE
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN organizational_units ur_ou ON ur.org_unit_id = ur_ou.id
        JOIN organizational_units target_ou ON target_ou.id = $3
        WHERE ur.user_id = $1
          AND (r.permissions ? $2 OR r.permissions ? 'tenant:admin')
          AND (
            ur.org_unit_id IS NULL  -- Tenant-wide permission
            OR target_ou.path <@ ur_ou.path  -- Target is descendant of role scope
          )
      ) as has_permission
    `;
    
    const result = await this.db.query(query, [
      userContext.userId,
      permission,
      resourceOrgUnitId
    ]);
    
    return result.rows[0].has_permission;
  }
}
```

```typescript
// 3. Tenant Context Middleware with Request Isolation
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userContext: UserContext;
    }
  }
}

class TenantMiddleware {
  constructor(
    private readonly db: Pool,
    private readonly permissionService: PermissionService
  ) {}
  
  // Tenant identification middleware
  identifyTenant() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract tenant from subdomain, header, or JWT
        const tenantId = 
          req.headers['x-tenant-id'] as string ||
          await this.extractTenantFromSubdomain(req.hostname) ||
          await this.extractTenantFromJWT(req.headers.authorization);
        
        if (!tenantId) {
          return res.status(400).json({ error: 'Tenant identification required' });
        }
        
        // Verify tenant exists and is active
        const tenant = await this.getTenant(tenantId);
        if (!tenant || tenant.status !== 'ACTIVE') {
          return res.status(403).json({ error: 'Invalid or inactive tenant' });
        }
        
        req.tenantId = tenantId;
        next();
      } catch (error) {
        console.error('Tenant identification failed:', error);
        res.status(500).json({ error: 'Tenant identification failed' });
      }
    };
  }
  
  // Set PostgreSQL session variable for RLS
  setTenantContext() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.tenantId) {
        return res.status(400).json({ error: 'Tenant context required' });
      }
      
      // Get database client from pool
      const client = await this.db.connect();
      
      try {
        // Set tenant context for RLS
        await client.query(`SET app.current_tenant_id = $1`, [req.tenantId]);
        
        // Attach client to request for this request's queries
        (req as any).dbClient = client;
        
        // Release client after response
        res.on('finish', () => {
          client.release();
        });
        
        next();
      } catch (error) {
        client.release();
        console.error('Failed to set tenant context:', error);
        res.status(500).json({ error: 'Failed to set tenant context' });
      }
    };
  }
  
  // Load user context with roles and permissions
  loadUserContext() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = await this.extractUserIdFromJWT(req.headers.authorization);
        
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const userContext = await this.permissionService.getUserContext(
          userId,
          req.tenantId
        );
        
        req.userContext = userContext;
        next();
      } catch (error) {
        console.error('Failed to load user context:', error);
        res.status(500).json({ error: 'Failed to load user context' });
      }
    };
  }
  
  // Permission check middleware factory
  requirePermission(permission: Permission, options?: { checkResourceOwnership?: boolean }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.userContext) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Basic permission check
        if (!this.permissionService.hasPermission(req.userContext, permission)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        // Resource-level permission check
        if (options?.checkResourceOwnership && req.params.id) {
          const resource = await this.getResource(req.params.id, req.tenantId);
          
          if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
          }
          
          const hasPermission = await this.permissionService.checkPermissionWithHierarchy(
            req.userContext,
            permission,
            resource.orgUnitId
          );
          
          if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions for this resource' });
          }
        }
        
        next();
      } catch (error) {
        console.error('Permission check failed:', error);
        res.status(500).json({ error: 'Permission check failed' });
      }
    };
  }
  
  private async getTenant(tenantId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    return result.rows[0];
  }
  
  private async extractTenantFromSubdomain(hostname: string): Promise<string | null> {
    // Extract tenant slug from subdomain (e.g., acme.grc-platform.com -> acme)
    const subdomain = hostname.split('.')[0];
    if (!subdomain || subdomain === 'www') {
      return null;
    }
    
    const result = await this.db.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [subdomain]
    );
    
    return result.rows[0]?.id || null;
  }
  
  private async extractTenantFromJWT(authorization?: string): Promise<string | null> {
    // Extract and verify JWT, return tenantId from claims
    // Implementation depends on JWT library
    return null; // Placeholder
  }
  
  private async extractUserIdFromJWT(authorization?: string): Promise<string | null> {
    // Extract and verify JWT, return userId from claims
    return null; // Placeholder
  }
  
  private async getResource(resourceId: string, tenantId: string): Promise<any> {
    // Generic resource fetch - would be specialized per resource type
    const result = await this.db.query(
      'SELECT * FROM controls WHERE id = $1 AND tenant_id = $2',
      [resourceId, tenantId]
    );
    return result.rows[0];
  }
}
```

```typescript
// 4. Express Application Setup with Security Layers
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security headers
app.use(helmet());

// Rate limiting per tenant
const createTenantRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each tenant to 1000 requests per windowMs
  keyGenerator: (req) => req.tenantId,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from this tenant' });
  }
});

// Initialize middleware
const tenantMiddleware = new TenantMiddleware(db, permissionService);

// Apply middleware chain
app.use(express.json());
app.use(tenantMiddleware.identifyTenant());
app.use(tenantMiddleware.setTenantContext());
app.use(createTenantRateLimiter());
app.use(tenantMiddleware.loadUserContext());

// Protected routes with permission checks
app.get('/api/controls',
  tenantMiddleware.requirePermission(Permission.CONTROL_VIEW),
  async (req: Request, res: Response) => {
    try {
      // Query automatically filtered by RLS
      const result = await (req as any).dbClient.query(`
        SELECT * FROM controls
        WHERE ($1::UUID IS NULL OR org_unit_id IN (
          SELECT id FROM organizational_units
          WHERE path <@ (SELECT path FROM organizational_units WHERE id = $1)
        ))
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [
        req.userContext.orgUnitId || null,
        parseInt(req.query.limit as string) || 50,
        parseInt(req.query.offset as string) || 0
      ]);
      
      res.json({ controls: result.rows });
    } catch (error) {
      console.error('Failed to fetch controls:', error);
      res.status(500).json({ error: 'Failed to fetch controls' });
    }
  }
);

app.post('/api/controls',
  tenantMiddleware.requirePermission(Permission.CONTROL_CREATE),
  body('name').isString().notEmpty(),
  body('framework').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      // Ensure user can create in specified org unit
      const orgUnitId = req.body.orgUnitId || req.userContext.orgUnitId;
      
      if (orgUnitId) {
        const hasPermission = await permissionService.checkPermissionWithHierarchy(
          req.userContext,
          Permission.CONTROL_CREATE,
          orgUnitId
        );
        
        if (!hasPermission) {
          return res.status(403).json({ error: 'Cannot create control in this organizational unit' });
        }
      }
      
      const result = await (req as any).dbClient.query(`
        INSERT INTO controls (tenant_id, org_unit_id, name, description, framework, owner_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT')
        RETURNING *
      `, [
        req.tenantId,
        orgUnitId,
        req.body.name,
        req.body.description,
        req.body.framework,
        req.userContext.userId
      ]);
      
      res.status(201).json({ control: result.rows[0] });
    } catch (error) {
      console.error('Failed to create control:', error);
      res.status(500).json({ error: 'Failed to create control' });
    }
  }
);
```

**Cross-Tenant Data Leakage Prevention:**

1. **Database-Level RLS**: PostgreSQL Row-Level Security automatically filters queries
2. **Session Context**: Each request sets `app.current_tenant_id` for RLS enforcement
3. **Application-Level Checks**: Double validation in middleware before RLS
4. **Query Parameterization**: All queries use prepared statements to prevent SQL injection
5. **Tenant ID in Every Table**: Foreign key constraints ensure referential integrity
6. **Audit Logging**: All cross-tenant access attempts logged for security review
7. **Regular Security Scans**: Automated testing for tenant isolation violations

**Performance Considerations:**
- **Indexes**: Composite indexes on `(tenant_id, ...)` for all multi-tenant tables
- **Connection Pooling**: Per-tenant connection pools for high-scale deployments
- **Caching**: Permission results cached with tenant-scoped keys (Redis)
- **Query Optimization**: LTREE indexes for efficient hierarchical queries

---

## Question 4: Real-Time Compliance Dashboard

**Scenario:** Compliance officers need a real-time dashboard showing control assessment status, risk scores, and upcoming audit deadlines across multiple frameworks. The dashboard should update instantly when control statuses change, assessments are completed, or new evidence is uploaded.

**Question:** Design a real-time data pipeline in Node.js that pushes updates to connected clients efficiently. How would you handle WebSocket scaling, message ordering, and ensuring clients receive all relevant updates even if they disconnect temporarily? Consider both the backend architecture and the data synchronization strategy.

**Senior-Level Answer:**

**Requirements Clarification:**
- How many concurrent dashboard users per tenant? (affects scaling strategy)
- What's the update frequency? (real-time vs near-real-time)
- Do we need historical playback? (replay events from disconnection)
- What's the acceptable latency for updates? (100ms vs 1s vs 5s)
- Do different users see different views of the same data? (permission-based filtering)
- Should updates be persisted for offline clients?

**Architecture Design:**

```typescript
// 1. Event-Driven Architecture with Domain Events
interface DomainEvent {
  id: string;              // Event UUID
  type: string;            // Event type
  tenantId: string;        // Tenant isolation
  aggregateId: string;     // Resource ID
  aggregateType: string;   // Resource type
  timestamp: Date;         // Event timestamp
  sequence: number;        // Monotonic sequence number
  payload: Record<string, any>;
  userId: string;          // User who triggered event
}

enum EventType {
  CONTROL_CREATED = 'control.created',
  CONTROL_UPDATED = 'control.updated',
  CONTROL_STATUS_CHANGED = 'control.status_changed',
  ASSESSMENT_COMPLETED = 'assessment.completed',
  EVIDENCE_UPLOADED = 'evidence.uploaded',
  RISK_SCORE_CHANGED = 'risk.score_changed',
  DEADLINE_APPROACHING = 'deadline.approaching'
}

// 2. Event Bus with PostgreSQL Listen/Notify
import { Pool } from 'pg';
import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  private sequence: number = 0;
  
  constructor(
    private readonly publishPool: Pool,
    private readonly listenPool: Pool,
    private readonly eventStore: EventStore
  ) {
    super();
    this.setupListener();
  }
  
  async publish(event: Omit<DomainEvent, 'id' | 'sequence' | 'timestamp'>): Promise<void> {
    const completeEvent: DomainEvent = {
      ...event,
      id: this.generateEventId(),
      sequence: ++this.sequence,
      timestamp: new Date()
    };
    
    // Persist event first
    await this.eventStore.append(completeEvent);
    
    // Publish via PostgreSQL NOTIFY
    await this.publishPool.query(
      `NOTIFY events, $1`,
      [JSON.stringify(completeEvent)]
    );
    
    // Emit locally for in-process subscribers
    this.emit('event', completeEvent);
  }
  
  private async setupListener(): Promise<void> {
    const client = await this.listenPool.connect();
    
    client.on('notification', (msg) => {
      if (msg.channel === 'events') {
        try {
          const event: DomainEvent = JSON.parse(msg.payload!);
          this.emit('event', event);
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      }
    });
    
    await client.query('LISTEN events');
  }
  
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 3. WebSocket Server with Room-Based Pub/Sub
import { Server as WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import { verify as verifyJWT } from 'jsonwebtoken';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  tenantId: string;
  userId: string;
  subscriptions: Set<string>; // Subscription keys
  lastSequence: number;       // Last event sequence received
  permissions: Permission[];
}

class RealtimeServer {
  private connections: Map<string, ClientConnection>;
  private subscriptions: Map<string, Set<string>>; // subscription -> clientIds
  
  constructor(
    private readonly wss: WebSocketServer,
    private readonly eventBus: EventBus,
    private readonly permissionService: PermissionService,
    private readonly eventStore: EventStore,
    private readonly jwtSecret: string
  ) {
    this.connections = new Map();
    this.subscriptions = new Map();
    this.setupWebSocketServer();
    this.setupEventSubscription();
  }
  
  private setupWebSocketServer(): void {
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      try {
        // Extract JWT from query params
        const { query } = parseUrl(req.url!, true);
        const token = query.token as string;
        
        if (!token) {
          ws.close(1008, 'Token required');
          return;
        }
        
        // Verify JWT and extract claims
        const claims = verifyJWT(token, this.jwtSecret) as any;
        const { userId, tenantId } = claims;
        
        // Load user permissions
        const userContext = await this.permissionService.getUserContext(userId, tenantId);
        
        // Create connection
        const connection: ClientConnection = {
          id: this.generateConnectionId(),
          ws,
          tenantId,
          userId,
          subscriptions: new Set(),
          lastSequence: 0,
          permissions: this.flattenPermissions(userContext.roles)
        };
        
        this.connections.set(connection.id, connection);
        
        // Setup message handlers
        ws.on('message', (data: string) => {
          this.handleClientMessage(connection, data);
        });
        
        ws.on('close', () => {
          this.handleDisconnect(connection);
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.handleDisconnect(connection);
        });
        
        // Send connection acknowledgment
        this.sendToClient(connection, {
          type: 'connected',
          connectionId: connection.id,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Connection failed:', error);
        ws.close(1008, 'Authentication failed');
      }
    });
  }
  
  private handleClientMessage(connection: ClientConnection, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(connection, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(connection, message);
          break;
        case 'sync':
          this.handleSync(connection, message);
          break;
        case 'ping':
          this.sendToClient(connection, { type: 'pong', timestamp: new Date() });
          break;
      }
    } catch (error) {
      console.error('Failed to handle client message:', error);
    }
  }
  
  private async handleSubscribe(connection: ClientConnection, message: any): Promise<void> {
    const { channels } = message;
    
    for (const channel of channels) {
      // Validate subscription permissions
      if (!this.canSubscribe(connection, channel)) {
        this.sendToClient(connection, {
          type: 'error',
          message: `Insufficient permissions for channel: ${channel}`
        });
        continue;
      }
      
      // Add subscription
      const subscriptionKey = `${connection.tenantId}:${channel}`;
      connection.subscriptions.add(subscriptionKey);
      
      if (!this.subscriptions.has(subscriptionKey)) {
        this.subscriptions.set(subscriptionKey, new Set());
      }
      this.subscriptions.get(subscriptionKey)!.add(connection.id);
      
      // Send initial data snapshot
      await this.sendInitialData(connection, channel);
    }
    
    this.sendToClient(connection, {
      type: 'subscribed',
      channels,
      timestamp: new Date()
    });
  }
  
  private handleUnsubscribe(connection: ClientConnection, message: any): void {
    const { channels } = message;
    
    for (const channel of channels) {
      const subscriptionKey = `${connection.tenantId}:${channel}`;
      connection.subscriptions.delete(subscriptionKey);
      
      const subscribers = this.subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(connection.id);
        if (subscribers.size === 0) {
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
    
    this.sendToClient(connection, {
      type: 'unsubscribed',
      channels,
      timestamp: new Date()
    });
  }
  
  private async handleSync(connection: ClientConnection, message: any): Promise<void> {
    const { lastSequence } = message;
    
    // Replay missed events
    const missedEvents = await this.eventStore.getEventsSince(
      connection.tenantId,
      lastSequence
    );
    
    for (const event of missedEvents) {
      if (this.shouldSendEvent(connection, event)) {
        this.sendToClient(connection, {
          type: 'event',
          event: this.filterEventPayload(connection, event)
        });
      }
    }
    
    connection.lastSequence = missedEvents[missedEvents.length - 1]?.sequence || lastSequence;
    
    this.sendToClient(connection, {
      type: 'synced',
      currentSequence: connection.lastSequence,
      timestamp: new Date()
    });
  }
  
  private handleDisconnect(connection: ClientConnection): void {
    // Remove all subscriptions
    for (const subscriptionKey of connection.subscriptions) {
      const subscribers = this.subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(connection.id);
        if (subscribers.size === 0) {
          this.subscriptions.delete(subscriptionKey);
        }
      }
    }
    
    this.connections.delete(connection.id);
  }
  
  private setupEventSubscription(): void {
    this.eventBus.on('event', (event: DomainEvent) => {
      this.broadcastEvent(event);
    });
  }
  
  private broadcastEvent(event: DomainEvent): void {
    // Determine subscription key
    const subscriptionKey = `${event.tenantId}:${this.getChannelForEvent(event)}`;
    const subscribers = this.subscriptions.get(subscriptionKey);
    
    if (!subscribers || subscribers.size === 0) {
      return;
    }
    
    // Send to all subscribed clients with permission
    for (const clientId of subscribers) {
      const connection = this.connections.get(clientId);
      if (!connection) {
        continue;
      }
      
      if (this.shouldSendEvent(connection, event)) {
        this.sendToClient(connection, {
          type: 'event',
          event: this.filterEventPayload(connection, event)
        });
        
        connection.lastSequence = event.sequence;
      }
    }
  }
  
  private canSubscribe(connection: ClientConnection, channel: string): boolean {
    // Map channels to required permissions
    const channelPermissions: Record<string, Permission> = {
      'controls': Permission.CONTROL_VIEW,
      'assessments': Permission.CONTROL_ASSESS,
      'risks': Permission.CONTROL_VIEW,
      'audit': Permission.AUDIT_VIEW
    };
    
    const requiredPermission = channelPermissions[channel];
    if (!requiredPermission) {
      return false;
    }
    
    return connection.permissions.includes(requiredPermission) ||
           connection.permissions.includes(Permission.TENANT_ADMIN);
  }
  
  private shouldSendEvent(connection: ClientConnection, event: DomainEvent): boolean {
    // Tenant isolation
    if (event.tenantId !== connection.tenantId) {
      return false;
    }
    
    // Permission check based on event type
    const requiredPermission = this.getRequiredPermission(event.type);
    if (requiredPermission && 
        !connection.permissions.includes(requiredPermission) &&
        !connection.permissions.includes(Permission.TENANT_ADMIN)) {
      return false;
    }
    
    return true;
  }
  
  private filterEventPayload(connection: ClientConnection, event: DomainEvent): DomainEvent {
    // Filter sensitive fields based on permissions
    const filtered = { ...event };
    
    if (!connection.permissions.includes(Permission.AUDIT_VIEW)) {
      delete filtered.payload.auditDetails;
    }
    
    return filtered;
  }
  
  private getChannelForEvent(event: DomainEvent): string {
    if (event.type.startsWith('control.')) return 'controls';
    if (event.type.startsWith('assessment.')) return 'assessments';
    if (event.type.startsWith('risk.')) return 'risks';
    if (event.type.startsWith('evidence.')) return 'evidence';
    return 'general';
  }
  
  private getRequiredPermission(eventType: string): Permission | null {
    if (eventType.startsWith('control.')) return Permission.CONTROL_VIEW;
    if (eventType.startsWith('assessment.')) return Permission.CONTROL_ASSESS;
    if (eventType.startsWith('audit.')) return Permission.AUDIT_VIEW;
    return null;
  }
  
  private async sendInitialData(connection: ClientConnection, channel: string): Promise<void> {
    // Send current snapshot for the subscribed channel
    // Implementation depends on channel type
  }
  
  private sendToClient(connection: ClientConnection, message: any): void {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }
  
  private flattenPermissions(roles: UserContext['roles']): Permission[] {
    const permissions = new Set<Permission>();
    for (const role of roles) {
      role.permissions.forEach(p => permissions.add(p));
    }
    return Array.from(permissions);
  }
  
  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 4. Event Store with Sequencing
class EventStore {
  constructor(private readonly db: Pool) {}
  
  async append(event: DomainEvent): Promise<void> {
    await this.db.query(`
      INSERT INTO domain_events (
        id, type, tenant_id, aggregate_id, aggregate_type,
        timestamp, sequence, payload, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      event.id,
      event.type,
      event.tenantId,
      event.aggregateId,
      event.aggregateType,
      event.timestamp,
      event.sequence,
      JSON.stringify(event.payload),
      event.userId
    ]);
  }
  
  async getEventsSince(tenantId: string, sequence: number): Promise<DomainEvent[]> {
    const result = await this.db.query(`
      SELECT * FROM domain_events
      WHERE tenant_id = $1 AND sequence > $2
      ORDER BY sequence ASC
      LIMIT 1000
    `, [tenantId, sequence]);
    
    return result.rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload)
    }));
  }
}

// 5. Integration with Application Services
class ControlService {
  constructor(private readonly eventBus: EventBus) {}
  
  async updateControlStatus(
    controlId: string,
    newStatus: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    // Update control in database
    const result = await db.query(`
      UPDATE controls
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `, [newStatus, controlId, tenantId]);
    
    const control = result.rows[0];
    
    // Publish event
    await this.eventBus.publish({
      type: EventType.CONTROL_STATUS_CHANGED,
      tenantId,
      aggregateId: controlId,
      aggregateType: 'Control',
      userId,
      payload: {
        controlId,
        name: control.name,
        previousStatus: control.status,
        newStatus,
        framework: control.framework
      }
    });
  }
}
```

**Message Ordering & Reliability:**
1. **Sequence Numbers**: Monotonic sequence numbers ensure ordering
2. **Event Store**: All events persisted before broadcasting
3. **Sync Protocol**: Clients can request missed events by sequence number
4. **Idempotency**: Events include unique IDs to prevent duplicate processing
5. **Reconnection Strategy**: Clients send last sequence on reconnect

**Scaling Strategy:**
1. **Horizontal Scaling**: Multiple WebSocket servers behind load balancer with sticky sessions
2. **Redis Pub/Sub**: For cross-server event distribution (alternative to PostgreSQL NOTIFY)
3. **Connection Sharding**: Distribute connections across servers by tenant ID
4. **Backpressure Handling**: Slow consumers buffered with overflow protection

---

## Question 5: Evidence Collection & File Processing Pipeline

**Scenario:** Your GRC system needs to collect and process various types of evidence documents (screenshots, PDFs, log files, JSON exports) that support control assessments. Files need to be scanned for malware, have metadata extracted, be indexed for search, and potentially have PII redacted before storage.

**Question:** Design a resilient file processing pipeline in Node.js that handles asynchronous file uploads, orchestrates multiple processing steps (virus scanning, OCR, metadata extraction), and provides progress updates to users. How would you handle processing failures, retry logic, and ensure files are never lost even if processing fails?

**Senior-Level Answer:**

**Requirements Clarification:**
- What's the expected file size range? (affects chunking strategy)
- What's the upload volume? (concurrent uploads per tenant)
- What's the acceptable processing latency? (seconds vs minutes)
- Do we need versioning for evidence files?
- What retention policies exist? (compliance requirements)
- Do we need to support resumable uploads for large files?
- What virus scanning SLA do we have? (timeout handling)

**Architecture Design:**

```typescript
// 1. Multi-Stage Processing Pipeline
interface FileUpload {
  id: string;
  tenantId: string;
  controlId: string;
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stages: ProcessingStage[];
  metadata: FileMetadata;
  createdAt: Date;
  completedAt?: Date;
}

interface ProcessingStage {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  result?: any;
}

interface FileMetadata {
  originalName: string;
  extension: string;
  hash: string;          // SHA-256 hash
  virusScanResult?: {
    clean: boolean;
    threats?: string[];
    scannedAt: Date;
  };
  extractedText?: string;
  extractedMetadata?: Record<string, any>;
  piiDetected?: boolean;
  tags?: string[];
}

// 2. Upload Handler with Multipart Support
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3 } from 'aws-sdk';
import { createHash } from 'crypto';

class FileUploadService {
  private s3: S3;
  private uploadBucket: string;
  
  constructor(
    private readonly eventBus: EventBus,
    private readonly db: Pool,
    config: { s3Bucket: string; s3Region: string }
  ) {
    this.s3 = new S3({ region: config.s3Region });
    this.uploadBucket = config.s3Bucket;
  }
  
  createUploadMiddleware() {
    // Multipart upload to S3
    const upload = multer({
      storage: multerS3({
        s3: this.s3,
        bucket: this.uploadBucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
          cb(null, {
            tenantId: req.tenantId,
            userId: req.userContext.userId,
            controlId: req.body.controlId,
            uploadedAt: new Date().toISOString()
          });
        },
        key: (req, file, cb) => {
          const uploadId = this.generateUploadId();
          const key = `uploads/${req.tenantId}/${uploadId}/${file.originalname}`;
          cb(null, key);
        }
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
        files: 10  // 10 files per request
      },
      fileFilter: (req, file, cb) => {
        // Validate file type
        const allowed Mimes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/json',
          'text/plain',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
      }
    });
    
    return upload.array('files', 10);
  }
  
  async processUpload(
    tenantId: string,
    userId: string,
    controlId: string,
    file: Express.MulterS3.File
  ): Promise<string> {
    const uploadId = this.generateUploadId();
    
    // Create upload record
    const upload: FileUpload = {
      id: uploadId,
      tenantId,
      controlId,
      userId,
      filename: file.key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: 'PROCESSING',
      stages: this.initializeStages(file.mimetype),
      metadata: {
        originalName: file.originalname,
        extension: file.originalname.split('.').pop()!,
        hash: '' // Computed during processing
      },
      createdAt: new Date()
    };
    
    await this.saveUpload(upload);
    
    // Queue for processing
    await this.eventBus.publish({
      type: 'file.uploaded',
      tenantId,
      aggregateId: uploadId,
      aggregateType: 'FileUpload',
      userId,
      payload: {
        uploadId,
        filename: file.key,
        mimeType: file.mimetype,
        sizeBytes: file.size
      }
    });
    
    return uploadId;
  }
  
  private initializeStages(mimeType: string): ProcessingStage[] {
    const stages: ProcessingStage[] = [
      { name: 'HASH_COMPUTATION', status: 'PENDING', retryCount: 0 },
      { name: 'VIRUS_SCAN', status: 'PENDING', retryCount: 0 }
    ];
    
    // Add OCR for images and PDFs
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      stages.push({ name: 'OCR', status: 'PENDING', retryCount: 0 });
      stages.push({ name: 'PII_DETECTION', status: 'PENDING', retryCount: 0 });
    }
    
    // Add metadata extraction for all files
    stages.push({ name: 'METADATA_EXTRACTION', status: 'PENDING', retryCount: 0 });
    stages.push({ name: 'INDEXING', status: 'PENDING', retryCount: 0 });
    
    return stages;
  }
  
  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async saveUpload(upload: FileUpload): Promise<void> {
    await this.db.query(`
      INSERT INTO file_uploads (
        id, tenant_id, control_id, user_id, filename, mime_type,
        size_bytes, status, stages, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      upload.id,
      upload.tenantId,
      upload.controlId,
      upload.userId,
      upload.filename,
      upload.mimeType,
      upload.sizeBytes,
      upload.status,
      JSON.stringify(upload.stages),
      JSON.stringify(upload.metadata),
      upload.createdAt
    ]);
  }
}

// 3. Processing Pipeline with Worker Pattern
import { Worker } from 'worker_threads';
import { Queue } from 'bull';

class FileProcessingPipeline {
  private queue: Queue;
  private processors: Map<string, StageProcessor>;
  
  constructor(
    private readonly eventBus: EventBus,
    private readonly db: Pool,
    private readonly s3: S3,
    private readonly uploadBucket: string,
    private readonly processedBucket: string
  ) {
    this.queue = new Queue('file-processing', {
      redis: { host: 'localhost', port: 6379 }
    });
    
    this.processors = new Map([
      ['HASH_COMPUTATION', new HashComputationProcessor(s3, uploadBucket)],
      ['VIRUS_SCAN', new VirusScanProcessor(s3, uploadBucket)],
      ['OCR', new OCRProcessor(s3, uploadBucket)],
      ['PII_DETECTION', new PIIDetectionProcessor()],
      ['METADATA_EXTRACTION', new MetadataExtractionProcessor(s3, uploadBucket)],
      ['INDEXING', new IndexingProcessor()]
    ]);
    
    this.startWorker();
    this.subscribeToEvents();
  }
  
  private subscribeToEvents(): void {
    this.eventBus.on('event', async (event: DomainEvent) => {
      if (event.type === 'file.uploaded') {
        await this.queueProcessing(event.aggregateId);
      }
    });
  }
  
  private async queueProcessing(uploadId: string): Promise<void> {
    await this.queue.add('process-file', { uploadId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
  }
  
  private startWorker(): void {
    this.queue.process('process-file', 5, async (job) => {
      const { uploadId } = job.data;
      
      try {
        await this.processFile(uploadId, job);
      } catch (error) {
        console.error(`Failed to process file ${uploadId}:`, error);
        throw error; // Re-throw for Bull retry logic
      }
    });
  }
  
  private async processFile(uploadId: string, job: any): Promise<void> {
    const upload = await this.getUpload(uploadId);
    
    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }
    
    // Process stages sequentially
    for (const stage of upload.stages) {
      if (stage.status === 'COMPLETED' || stage.status === 'SKIPPED') {
        continue;
      }
      
      await this.processStage(upload, stage, job);
      
      // If stage failed and no more retries, fail entire upload
      if (stage.status === 'FAILED' && stage.retryCount >= 3) {
        upload.status = 'FAILED';
        await this.updateUpload(upload);
        
        await this.eventBus.publish({
          type: 'file.processing_failed',
          tenantId: upload.tenantId,
          aggregateId: uploadId,
          aggregateType: 'FileUpload',
          userId: upload.userId,
          payload: {
            uploadId,
            failedStage: stage.name,
            error: stage.error
          }
        });
        
        throw new Error(`Processing failed at stage: ${stage.name}`);
      }
    }
    
    // All stages complete - move to processed bucket
    await this.finalizeProcessing(upload);
    
    upload.status = 'COMPLETED';
    upload.completedAt = new Date();
    await this.updateUpload(upload);
    
    await this.eventBus.publish({
      type: 'file.processing_completed',
      tenantId: upload.tenantId,
      aggregateId: uploadId,
      aggregateType: 'FileUpload',
      userId: upload.userId,
      payload: {
        uploadId,
        metadata: upload.metadata
      }
    });
  }
  
  private async processStage(
    upload: FileUpload,
    stage: ProcessingStage,
    job: any
  ): Promise<void> {
    const processor = this.processors.get(stage.name);
    
    if (!processor) {
      stage.status = 'SKIPPED';
      return;
    }
    
    stage.status = 'RUNNING';
    stage.startedAt = new Date();
    await this.updateUpload(upload);
    
    // Update job progress
    const currentStageIndex = upload.stages.indexOf(stage);
    const progress = (currentStageIndex / upload.stages.length) * 100;
    await job.progress(progress);
    
    try {
      const result = await processor.process(upload, stage);
      
      stage.status = 'COMPLETED';
      stage.completedAt = new Date();
      stage.result = result;
      
      // Merge result into metadata
      upload.metadata = { ...upload.metadata, ...result };
      
      await this.updateUpload(upload);
      
    } catch (error) {
      stage.retryCount++;
      stage.error = error.message;
      
      if (stage.retryCount < 3) {
        // Retry this stage
        stage.status = 'PENDING';
        const backoffMs = 2000 * Math.pow(2, stage.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        stage.status = 'FAILED';
      }
      
      await this.updateUpload(upload);
      throw error;
    }
  }
  
  private async finalizeProcessing(upload: FileUpload): Promise<void> {
    // Move file to processed bucket
    const sourceKey = upload.filename;
    const destKey = `processed/${upload.tenantId}/${upload.controlId}/${upload.id}/${upload.metadata.originalName}`;
    
    await this.s3.copyObject({
      Bucket: this.processedBucket,
      CopySource: `${this.uploadBucket}/${sourceKey}`,
      Key: destKey,
      ServerSideEncryption: 'AES256',
      Metadata: {
        ...upload.metadata,
        processedAt: new Date().toISOString()
      }
    }).promise();
    
    // Delete from upload bucket
    await this.s3.deleteObject({
      Bucket: this.uploadBucket,
      Key: sourceKey
    }).promise();
    
    // Update filename to processed location
    upload.filename = destKey;
  }
  
  private async getUpload(uploadId: string): Promise<FileUpload | null> {
    const result = await this.db.query(
      'SELECT * FROM file_uploads WHERE id = $1',
      [uploadId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      stages: JSON.parse(row.stages),
      metadata: JSON.parse(row.metadata)
    };
  }
  
  private async updateUpload(upload: FileUpload): Promise<void> {
    await this.db.query(`
      UPDATE file_uploads
      SET status = $1, stages = $2, metadata = $3, completed_at = $4
      WHERE id = $5
    `, [
      upload.status,
      JSON.stringify(upload.stages),
      JSON.stringify(upload.metadata),
      upload.completedAt,
      upload.id
    ]);
  }
}

// 4. Stage Processors
interface StageProcessor {
  process(upload: FileUpload, stage: ProcessingStage): Promise<any>;
}

class HashComputationProcessor implements StageProcessor {
  constructor(
    private readonly s3: S3,
    private readonly bucket: string
  ) {}
  
  async process(upload: FileUpload): Promise<{ hash: string }> {
    const stream = this.s3.getObject({
      Bucket: this.bucket,
      Key: upload.filename
    }).createReadStream();
    
    const hash = createHash('sha256');
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve({ hash: hash.digest('hex') }));
      stream.on('error', reject);
    });
  }
}

class VirusScanProcessor implements StageProcessor {
  constructor(
    private readonly s3: S3,
    private readonly bucket: string
  ) {}
  
  async process(upload: FileUpload): Promise<{ virusScanResult: any }> {
    // Download file to temp location
    const tempPath = `/tmp/${upload.id}`;
    const file = fs.createWriteStream(tempPath);
    
    await new Promise((resolve, reject) => {
      this.s3.getObject({
        Bucket: this.bucket,
        Key: upload.filename
      }).createReadStream()
        .pipe(file)
        .on('finish', resolve)
        .on('error', reject);
    });
    
    // Run ClamAV scan
    const { exec } = require('child_process');
    const result = await new Promise<string>((resolve, reject) => {
      exec(`clamscan ${tempPath}`, (error, stdout, stderr) => {
        if (error && error.code !== 1) { // Code 1 means virus found
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
    
    // Cleanup
    fs.unlinkSync(tempPath);
    
    const clean = !result.includes('FOUND');
    
    if (!clean) {
      throw new Error('Virus detected in uploaded file');
    }
    
    return {