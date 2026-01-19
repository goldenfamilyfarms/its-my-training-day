/**
 * Question: Real-Time Compliance Monitoring Using Cloud-Native Event Streams
 * 
 * Explain how you would implement real-time compliance monitoring using 
 * cloud-native event streams. This implementation demonstrates event-driven 
 * architecture consuming native cloud event streams.
 * 
 * Key Technical Decisions:
 * - Event normalization across cloud providers
 * - Event enrichment with context
 * - Stateful evaluation for correlated controls
 * - SQS buffering for burst traffic
 * - Lag monitoring
 */

// Types
interface CloudEvent {
  id: string;
  source: CloudProvider;
  eventType: string;
  timestamp: string;
  resourceId: string;
  resourceType: string;
  action: string; // e.g., "PutBucketEncryption", "CreateAccessKey"
  rawEvent: unknown; // Provider-specific event data
}

interface NormalizedEvent {
  id: string;
  source: CloudProvider;
  timestamp: string;
  resourceId: string;
  resourceType: CanonicalResourceType;
  action: string;
  normalizedAction: string; // Standardized action name
  metadata: {
    region: string;
    accountId: string;
    userId?: string;
    ipAddress?: string;
  };
}

interface EnrichedEvent extends NormalizedEvent {
  enrichment: {
    resourceTags: Record<string, string>;
    ownership: {
      team: string;
      owner: string;
    };
    historicalCompliance: ComplianceState;
    riskScore: number;
  };
}

type CloudProvider = 'AWS' | 'AZURE' | 'GCP';
type CanonicalResourceType =
  | 'STORAGE_BUCKET'
  | 'COMPUTE_INSTANCE'
  | 'IAM_USER'
  | 'IAM_ROLE'
  | 'DATABASE'
  | 'NETWORK_SECURITY_GROUP';

interface ComplianceState {
  compliant: boolean;
  lastChecked: string;
  violations: string[];
}

// Event Normalizer
class EventNormalizer {
  /**
   * Normalize cloud-specific events to standard format
   */
  normalize(event: CloudEvent): NormalizedEvent {
    const normalizer = this.getNormalizer(event.source);
    return normalizer.normalize(event);
  }

  private getNormalizer(source: CloudProvider): CloudEventNormalizer {
    switch (source) {
      case 'AWS':
        return new AWSEventNormalizer();
      case 'AZURE':
        return new AzureEventNormalizer();
      case 'GCP':
        return new GCPEventNormalizer();
      default:
        throw new Error(`Unsupported cloud provider: ${source}`);
    }
  }
}

interface CloudEventNormalizer {
  normalize(event: CloudEvent): NormalizedEvent;
}

// AWS Event Normalizer
class AWSEventNormalizer implements CloudEventNormalizer {
  normalize(event: CloudEvent): NormalizedEvent {
    const cloudTrailEvent = event.rawEvent as any;

    // Map AWS resource types to canonical types
    const resourceTypeMapping: Record<string, CanonicalResourceType> = {
      'AWS::S3::Bucket': 'STORAGE_BUCKET',
      'AWS::EC2::Instance': 'COMPUTE_INSTANCE',
      'AWS::IAM::User': 'IAM_USER',
      'AWS::IAM::Role': 'IAM_ROLE',
      'AWS::RDS::DBInstance': 'DATABASE',
      'AWS::EC2::SecurityGroup': 'NETWORK_SECURITY_GROUP',
    };

    // Map AWS actions to normalized actions
    const actionMapping: Record<string, string> = {
      'PutBucketEncryption': 'ENABLE_ENCRYPTION',
      'CreateAccessKey': 'CREATE_ACCESS_KEY',
      'ModifyDBInstance': 'MODIFY_DATABASE',
      'AuthorizeSecurityGroupIngress': 'MODIFY_SECURITY_GROUP',
    };

    return {
      id: event.id,
      source: 'AWS',
      timestamp: event.timestamp,
      resourceId: cloudTrailEvent.resources?.[0]?.resourceId || event.resourceId,
      resourceType: resourceTypeMapping[cloudTrailEvent.resourceType] || 'STORAGE_BUCKET',
      action: event.action,
      normalizedAction: actionMapping[event.action] || event.action,
      metadata: {
        region: cloudTrailEvent.awsRegion || 'us-east-1',
        accountId: cloudTrailEvent.recipientAccountId || '',
        userId: cloudTrailEvent.userIdentity?.arn,
        ipAddress: cloudTrailEvent.sourceIPAddress,
      },
    };
  }
}

// Azure Event Normalizer
class AzureEventNormalizer implements CloudEventNormalizer {
  normalize(event: CloudEvent): NormalizedEvent {
    const activityLog = event.rawEvent as any;

    const resourceTypeMapping: Record<string, CanonicalResourceType> = {
      'Microsoft.Storage/storageAccounts': 'STORAGE_BUCKET',
      'Microsoft.Compute/virtualMachines': 'COMPUTE_INSTANCE',
      'Microsoft.Sql/servers/databases': 'DATABASE',
    };

    return {
      id: event.id,
      source: 'AZURE',
      timestamp: event.timestamp,
      resourceId: activityLog.resourceId || event.resourceId,
      resourceType: resourceTypeMapping[activityLog.resourceType] || 'STORAGE_BUCKET',
      action: event.action,
      normalizedAction: event.action, // Would map to normalized actions
      metadata: {
        region: activityLog.location || 'eastus',
        accountId: activityLog.subscriptionId || '',
        userId: activityLog.caller,
        ipAddress: activityLog.httpRequest?.clientIpAddress,
      },
    };
  }
}

// GCP Event Normalizer
class GCPEventNormalizer implements CloudEventNormalizer {
  normalize(event: CloudEvent): NormalizedEvent {
    const auditLog = event.rawEvent as any;

    return {
      id: event.id,
      source: 'GCP',
      timestamp: event.timestamp,
      resourceId: auditLog.resourceName || event.resourceId,
      resourceType: 'STORAGE_BUCKET', // Would map based on resource type
      action: event.action,
      normalizedAction: event.action,
      metadata: {
        region: auditLog.resourceLocation?.region || 'us-central1',
        accountId: auditLog.resource?.projectId || '',
        userId: auditLog.authenticationInfo?.principalEmail,
        ipAddress: auditLog.requestMetadata?.callerIp,
      },
    };
  }
}

// Event Enrichment Service
class EventEnrichmentService {
  constructor(
    private resourceService: ResourceService,
    private complianceService: ComplianceService
  ) {}

  /**
   * Enrich normalized event with context
   */
  async enrich(event: NormalizedEvent): Promise<EnrichedEvent> {
    // Get resource tags and ownership
    const resource = await this.resourceService.getResource(event.resourceId);
    const ownership = await this.resourceService.getOwnership(event.resourceId);

    // Get historical compliance state
    const historicalCompliance = await this.complianceService.getState(event.resourceId);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(event, historicalCompliance);

    return {
      ...event,
      enrichment: {
        resourceTags: resource?.tags || {},
        ownership: ownership || { team: 'unknown', owner: 'unknown' },
        historicalCompliance,
        riskScore,
      },
    };
  }

  private calculateRiskScore(
    event: NormalizedEvent,
    compliance: ComplianceState
  ): number {
    let score = 50; // Base score

    // Increase risk if resource was previously non-compliant
    if (!compliance.compliant) {
      score += 30;
    }

    // Increase risk for sensitive actions
    const sensitiveActions = ['CREATE_ACCESS_KEY', 'MODIFY_SECURITY_GROUP', 'DELETE_RESOURCE'];
    if (sensitiveActions.includes(event.normalizedAction)) {
      score += 20;
    }

    // Increase risk for IAM resources
    if (event.resourceType === 'IAM_USER' || event.resourceType === 'IAM_ROLE') {
      score += 10;
    }

    return Math.min(100, score);
  }
}

// Compliance Evaluation Service
class ComplianceEvaluationService {
  constructor(
    private policyEngine: PolicyEngine,
    private stateStore: StateStore
  ) {}

  /**
   * Evaluate compliance for an enriched event
   */
  async evaluate(event: EnrichedEvent): Promise<EvaluationResult> {
    // Get applicable policies for this resource type
    const policies = await this.policyEngine.getPoliciesForResourceType(event.resourceType);

    const results: PolicyEvaluationResult[] = [];

    for (const policy of policies) {
      // Check if this event affects the policy
      if (!this.eventAffectsPolicy(event, policy)) {
        continue;
      }

      // Evaluate policy
      const result = await this.evaluatePolicy(event, policy);
      results.push(result);

      // Update state if needed
      if (result.stateChanged) {
        await this.stateStore.updateState(event.resourceId, result.newState);
      }
    }

    return {
      resourceId: event.resourceId,
      evaluatedAt: new Date().toISOString(),
      results,
      hasViolations: results.some(r => !r.passed),
    };
  }

  private eventAffectsPolicy(event: EnrichedEvent, policy: Policy): boolean {
    // Check if event action is relevant to policy
    return policy.relevantActions.includes(event.normalizedAction);
  }

  private async evaluatePolicy(
    event: EnrichedEvent,
    policy: Policy
  ): Promise<PolicyEvaluationResult> {
    // Get current resource state
    const resource = await this.getResourceState(event.resourceId);

    // Evaluate policy rules
    const passed = await policy.evaluate(resource, event);

    // Check for state changes
    const previousState = await this.stateStore.getState(event.resourceId);
    const stateChanged = previousState?.compliant !== passed;

    return {
      policyId: policy.id,
      passed,
      stateChanged,
      newState: {
        compliant: passed,
        lastChecked: new Date().toISOString(),
        violations: passed ? [] : [policy.id],
      },
    };
  }

  private async getResourceState(resourceId: string): Promise<unknown> {
    // In production, would fetch actual resource state
    return {};
  }
}

// Stateful Evaluation Handler
class StatefulEvaluationHandler {
  constructor(
    private stateStore: StateStore,
    private evaluationService: ComplianceEvaluationService
  ) {}

  /**
   * Handle stateful evaluation for controls requiring correlation
   */
  async handleStatefulEvaluation(
    event: EnrichedEvent,
    controlId: string
  ): Promise<StatefulEvaluationResult> {
    // Example: "User must have MFA AND strong password policy"
    // Need to correlate MFA event with password policy event

    const correlationKey = this.getCorrelationKey(event, controlId);
    const sessionState = await this.stateStore.getSessionState(correlationKey);

    // Store event in session
    const updatedSession = {
      ...sessionState,
      events: [...(sessionState?.events || []), event],
      lastUpdated: new Date().toISOString(),
    };

    await this.stateStore.setSessionState(correlationKey, updatedSession, 3600); // 1 hour TTL

    // Check if all required events are present
    const requiredEvents = this.getRequiredEvents(controlId);
    const hasAllEvents = requiredEvents.every(req =>
      updatedSession.events.some(e => e.normalizedAction === req)
    );

    if (hasAllEvents) {
      // Evaluate control
      const result = await this.evaluationService.evaluate(event);
      return {
        controlId,
        passed: result.hasViolations === false,
        correlatedEvents: updatedSession.events.length,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // Waiting for more events
    return {
      controlId,
      passed: false,
      correlatedEvents: updatedSession.events.length,
      waitingFor: requiredEvents.filter(
        req => !updatedSession.events.some(e => e.normalizedAction === req)
      ),
      evaluatedAt: new Date().toISOString(),
    };
  }

  private getCorrelationKey(event: EnrichedEvent, controlId: string): string {
    // Correlate by user for access control, by resource for resource controls
    return `${controlId}:${event.resourceId}`;
  }

  private getRequiredEvents(controlId: string): string[] {
    // Define required events for each control
    const requirements: Record<string, string[]> = {
      'CC6.1': ['ENABLE_MFA', 'SET_PASSWORD_POLICY'], // MFA + Password Policy
      'AC-2': ['CREATE_USER', 'ASSIGN_ROLE'], // User creation + role assignment
    };

    return requirements[controlId] || [];
  }
}

// Event Processing Pipeline
class EventProcessingPipeline {
  private queue: EnrichedEvent[] = [];
  private processing = false;

  constructor(
    private normalizer: EventNormalizer,
    private enrichmentService: EventEnrichmentService,
    private evaluationService: ComplianceEvaluationService,
    private alertService: AlertService
  ) {}

  /**
   * Process cloud event through pipeline
   */
  async processEvent(cloudEvent: CloudEvent): Promise<void> {
    try {
      // Step 1: Normalize
      const normalized = this.normalizer.normalize(cloudEvent);

      // Step 2: Enrich
      const enriched = await this.enrichmentService.enrich(normalized);

      // Step 3: Evaluate
      const evaluation = await this.evaluationService.evaluate(enriched);

      // Step 4: Record
      await this.recordEvaluation(evaluation);

      // Step 5: Alert if violations
      if (evaluation.hasViolations) {
        await this.alertService.sendAlert(enriched, evaluation);
      }
    } catch (error) {
      console.error('Error processing event:', error);
      // Would send to dead letter queue
    }
  }

  private async recordEvaluation(evaluation: EvaluationResult): Promise<void> {
    // In production, would store in compliance database
    console.log('Recording evaluation:', evaluation);
  }
}

// Interfaces
interface ResourceService {
  getResource(resourceId: string): Promise<{ tags: Record<string, string> } | null>;
  getOwnership(resourceId: string): Promise<{ team: string; owner: string } | null>;
}

interface ComplianceService {
  getState(resourceId: string): Promise<ComplianceState>;
}

interface PolicyEngine {
  getPoliciesForResourceType(type: CanonicalResourceType): Promise<Policy[]>;
}

interface Policy {
  id: string;
  relevantActions: string[];
  evaluate(resource: unknown, event: EnrichedEvent): Promise<boolean>;
}

interface StateStore {
  getState(resourceId: string): Promise<ComplianceState | null>;
  updateState(resourceId: string, state: ComplianceState): Promise<void>;
  getSessionState(key: string): Promise<SessionState | null>;
  setSessionState(key: string, state: SessionState, ttl: number): Promise<void>;
}

interface SessionState {
  events: EnrichedEvent[];
  lastUpdated: string;
}

interface EvaluationResult {
  resourceId: string;
  evaluatedAt: string;
  results: PolicyEvaluationResult[];
  hasViolations: boolean;
}

interface PolicyEvaluationResult {
  policyId: string;
  passed: boolean;
  stateChanged: boolean;
  newState: ComplianceState;
}

interface StatefulEvaluationResult {
  controlId: string;
  passed: boolean;
  correlatedEvents: number;
  waitingFor?: string[];
  evaluatedAt: string;
}

interface AlertService {
  sendAlert(event: EnrichedEvent, evaluation: EvaluationResult): Promise<void>;
}

// Example Usage
export function demonstrateRealTimeEventStreams() {
  const normalizer = new EventNormalizer();
  const enrichmentService = new EventEnrichmentService(
    {} as ResourceService,
    {} as ComplianceService
  );
  const evaluationService = new ComplianceEvaluationService(
    {} as PolicyEngine,
    {} as StateStore
  );
  const alertService = {} as AlertService;

  const pipeline = new EventProcessingPipeline(
    normalizer,
    enrichmentService,
    evaluationService,
    alertService
  );

  // Simulate AWS CloudTrail event
  const awsEvent: CloudEvent = {
    id: 'event-123',
    source: 'AWS',
    eventType: 'AwsApiCall',
    timestamp: new Date().toISOString(),
    resourceId: 's3-bucket-123',
    resourceType: 'AWS::S3::Bucket',
    action: 'PutBucketEncryption',
    rawEvent: {
      eventName: 'PutBucketEncryption',
      awsRegion: 'us-east-1',
      recipientAccountId: '123456789012',
      userIdentity: { arn: 'arn:aws:iam::123456789012:user/admin' },
      sourceIPAddress: '192.168.1.1',
    },
  };

  // Process event
  pipeline.processEvent(awsEvent);

  return { pipeline, normalizer };
}

export {
  EventNormalizer,
  EventEnrichmentService,
  ComplianceEvaluationService,
  StatefulEvaluationHandler,
  EventProcessingPipeline,
  CloudEvent,
  NormalizedEvent,
  EnrichedEvent,
};

