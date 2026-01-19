/**
 * Question: Remediation Workflow for Non-Compliant Resources
 * 
 * How would you build a remediation workflow that automatically fixes 
 * non-compliant resources while maintaining proper change control?
 * 
 * Key Technical Decisions:
 * - Risk-based graduated response (Tier 1-3)
 * - Safety mechanisms (dry-run, rate limiting, rollback)
 * - Change tracking and auditability
 * - Circuit breakers for error handling
 */

// UUID generator - in production would use: import { v4 as uuidv4 } from 'uuid';
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types
type RemediationTier = 'TIER_1_AUTOMATIC' | 'TIER_2_APPROVAL' | 'TIER_3_MANUAL';
type RemediationStatus = 'PENDING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

interface ComplianceViolation {
  id: string;
  controlId: string;
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: string;
  description: string;
}

interface RemediationRequest {
  id: string;
  violationId: string;
  tier: RemediationTier;
  status: RemediationStatus;
  resourceId: string;
  resourceType: string;
  remediationAction: RemediationAction;
  previousState: unknown; // For rollback
  requestedAt: string;
  approvedAt?: string;
  executedAt?: string;
  completedAt?: string;
  executedBy?: string;
  rollbackAvailable: boolean;
  metadata: {
    changeControlId?: string;
    prUrl?: string;
    ticketId?: string;
    justification?: string;
  };
}

interface RemediationAction {
  type: string;
  script: string;
  parameters: Record<string, string>;
  dryRunScript?: string;
}

// Risk Assessment Service
class RiskAssessmentService {
  /**
   * Determine remediation tier based on risk
   */
  assessRisk(violation: ComplianceViolation): RemediationTier {
    // Tier 1: Low-risk, well-understood remediations
    const tier1Violations = [
      'MISSING_ENCRYPTION',
      'MISSING_TAGS',
      'PUBLIC_READ_ACCESS',
    ];

    // Tier 2: Medium-risk changes
    const tier2Violations = [
      'INSECURE_SECURITY_GROUP',
      'OVERPRIVILEGED_IAM',
      'MISSING_LOGGING',
    ];

    // Tier 3: High-risk remediations
    const tier3Violations = [
      'REMOVE_IAM_PERMISSIONS',
      'SHUTDOWN_RESOURCE',
      'DELETE_DATA',
    ];

    if (tier1Violations.includes(violation.violationType)) {
      return 'TIER_1_AUTOMATIC';
    }

    if (tier2Violations.includes(violation.violationType)) {
      return 'TIER_2_APPROVAL';
    }

    if (tier3Violations.includes(violation.violationType)) {
      return 'TIER_3_MANUAL';
    }

    // Default based on severity
    if (violation.severity === 'CRITICAL' || violation.severity === 'HIGH') {
      return 'TIER_3_MANUAL';
    }

    return 'TIER_2_APPROVAL';
  }
}

// Remediation Action Repository
class RemediationActionRepository {
  private actions: Map<string, RemediationAction> = new Map();

  constructor() {
    this.initializeDefaultActions();
  }

  private initializeDefaultActions(): void {
    // Tier 1: Enable S3 encryption
    this.actions.set('ENABLE_S3_ENCRYPTION', {
      type: 'ENABLE_S3_ENCRYPTION',
      script: `
        aws s3api put-bucket-encryption \\
          --bucket {bucket_name} \\
          --server-side-encryption-configuration '{
            "Rules": [{
              "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }]
          }'
      `,
      parameters: { bucket_name: '{resource_id}' },
      dryRunScript: `
        echo "Would enable encryption on bucket {bucket_name}"
        aws s3api get-bucket-encryption --bucket {bucket_name} || echo "Encryption not enabled"
      `,
    });

    // Tier 2: Fix security group
    this.actions.set('FIX_SECURITY_GROUP', {
      type: 'FIX_SECURITY_GROUP',
      script: `
        aws ec2 revoke-security-group-ingress \\
          --group-id {security_group_id} \\
          --protocol tcp \\
          --port 22 \\
          --cidr 0.0.0.0/0
      `,
      parameters: { security_group_id: '{resource_id}' },
    });

    // Tier 3: Remove IAM permissions
    this.actions.set('REMOVE_IAM_PERMISSIONS', {
      type: 'REMOVE_IAM_PERMISSIONS',
      script: `
        # High-risk action - requires manual approval
        aws iam detach-user-policy \\
          --user-name {user_name} \\
          --policy-arn {policy_arn}
      `,
      parameters: {
        user_name: '{user_name}',
        policy_arn: '{policy_arn}',
      },
    });
  }

  getAction(actionType: string): RemediationAction | null {
    return this.actions.get(actionType) || null;
  }
}

// Remediation Workflow Service
class RemediationWorkflowService {
  private requests: Map<string, RemediationRequest> = new Map();
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private actionRepository: RemediationActionRepository,
    private changeTracker: ChangeTracker
  ) {
    this.rateLimiter = new RateLimiter({ maxPerHour: 10 });
    this.circuitBreaker = new CircuitBreaker({ threshold: 0.1 }); // 10% error rate
  }

  /**
   * Create remediation request from violation
   */
  async createRemediationRequest(violation: ComplianceViolation): Promise<RemediationRequest> {
    const tier = this.riskAssessment.assessRisk(violation);
    const actionType = this.getActionTypeForViolation(violation.violationType);
    const action = this.actionRepository.getAction(actionType);

    if (!action) {
      throw new Error(`No remediation action found for ${violation.violationType}`);
    }

    // Get previous state for rollback
    const previousState = await this.changeTracker.getResourceState(violation.resourceId);

    const request: RemediationRequest = {
      id: uuidv4(),
      violationId: violation.id,
      tier,
      status: tier === 'TIER_1_AUTOMATIC' ? 'PENDING' : 'PENDING',
      resourceId: violation.resourceId,
      resourceType: violation.resourceType,
      remediationAction: action,
      previousState,
      requestedAt: new Date().toISOString(),
      rollbackAvailable: true,
      metadata: {},
    };

    this.requests.set(request.id, request);

    // Route based on tier
    switch (tier) {
      case 'TIER_1_AUTOMATIC':
        await this.handleTier1Remediation(request);
        break;
      case 'TIER_2_APPROVAL':
        await this.handleTier2Remediation(request);
        break;
      case 'TIER_3_MANUAL':
        await this.handleTier3Remediation(request);
        break;
    }

    return request;
  }

  private async handleTier1Remediation(request: RemediationRequest): Promise<void> {
    // Automatic execution after dry-run
    try {
      await this.executeDryRun(request);
      await this.executeRemediation(request);
    } catch (error) {
      request.status = 'FAILED';
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }

  private async handleTier2Remediation(request: RemediationRequest): Promise<void> {
    // Create PR/MR for approval
    const prUrl = await this.createRemediationPR(request);
    request.metadata.prUrl = prUrl;
    request.metadata.changeControlId = uuidv4();

    // Auto-merge after 24 hours if no objections
    setTimeout(async () => {
      if (request.status === 'PENDING') {
        await this.autoApproveTier2(request);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async handleTier3Remediation(request: RemediationRequest): Promise<void> {
    // Create ticket for manual review
    const ticketId = await this.createRemediationTicket(request);
    request.metadata.ticketId = ticketId;
    request.status = 'PENDING';
  }

  private async executeDryRun(request: RemediationRequest): Promise<void> {
    if (!request.remediationAction.dryRunScript) {
      return; // No dry-run available
    }

    // Execute dry-run script in staging
    console.log('Executing dry-run for remediation:', request.id);
    // In production, would execute script in staging environment
  }

  private async executeRemediation(request: RemediationRequest): Promise<void> {
    // Check rate limit
    if (!this.rateLimiter.canProceed()) {
      throw new Error('Rate limit exceeded - too many remediations this hour');
    }

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker open - too many failures');
    }

    request.status = 'EXECUTING';
    request.executedAt = new Date().toISOString();

    try {
      // Execute remediation script
      console.log('Executing remediation:', request.remediationAction.script);
      // In production, would execute actual script

      // Track change
      await this.changeTracker.recordChange({
        remediationId: request.id,
        resourceId: request.resourceId,
        action: request.remediationAction.type,
        previousState: request.previousState,
        newState: {}, // Would capture actual new state
        timestamp: new Date().toISOString(),
      });

      request.status = 'COMPLETED';
      request.completedAt = new Date().toISOString();
      this.circuitBreaker.recordSuccess();
    } catch (error) {
      request.status = 'FAILED';
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }

  private async createRemediationPR(request: RemediationRequest): Promise<string> {
    // In production, would create actual PR/MR
    return `https://github.com/org/repo/pull/123`;
  }

  private async createRemediationTicket(request: RemediationRequest): Promise<string> {
    // In production, would create ticket in Jira/ServiceNow
    return `TICKET-${uuidv4()}`;
  }

  private async autoApproveTier2(request: RemediationRequest): Promise<void> {
    request.status = 'APPROVED';
    request.approvedAt = new Date().toISOString();
    await this.executeRemediation(request);
  }

  /**
   * Rollback a remediation
   */
  async rollbackRemediation(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Remediation request not found');
    }

    if (!request.rollbackAvailable || !request.previousState) {
      throw new Error('Rollback not available for this remediation');
    }

    // Restore previous state
    await this.changeTracker.restoreState(request.resourceId, request.previousState);
    request.status = 'ROLLED_BACK';
  }

  private getActionTypeForViolation(violationType: string): string {
    const mapping: Record<string, string> = {
      MISSING_ENCRYPTION: 'ENABLE_S3_ENCRYPTION',
      INSECURE_SECURITY_GROUP: 'FIX_SECURITY_GROUP',
      OVERPRIVILEGED_IAM: 'REMOVE_IAM_PERMISSIONS',
    };
    return mapping[violationType] || violationType;
  }
}

// Rate Limiter
class RateLimiter {
  private requests: number[] = [];

  constructor(private config: { maxPerHour: number }) {}

  canProceed(): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old requests
    this.requests = this.requests.filter(time => time > oneHourAgo);

    if (this.requests.length >= this.config.maxPerHour) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

// Circuit Breaker
class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime?: number;

  constructor(private config: { threshold: number }) {}

  recordSuccess(): void {
    this.successes++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.reset();
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    const errorRate = this.failures / (this.failures + this.successes);
    if (errorRate > this.config.threshold) {
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Try to transition to HALF_OPEN after 1 minute
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > 60 * 1000) {
        this.state = 'HALF_OPEN';
        this.reset();
      }
    }
    return this.state === 'OPEN';
  }

  private reset(): void {
    this.failures = 0;
    this.successes = 0;
  }
}

// Change Tracker
interface ChangeRecord {
  remediationId: string;
  resourceId: string;
  action: string;
  previousState: unknown;
  newState: unknown;
  timestamp: string;
}

class ChangeTracker {
  private changes: ChangeRecord[] = [];
  private resourceStates: Map<string, unknown> = new Map();

  async recordChange(change: ChangeRecord): Promise<void> {
    this.changes.push(change);
    this.resourceStates.set(change.resourceId, change.newState);
  }

  async getResourceState(resourceId: string): Promise<unknown> {
    return this.resourceStates.get(resourceId) || null;
  }

  async restoreState(resourceId: string, previousState: unknown): Promise<void> {
    this.resourceStates.set(resourceId, previousState);
    // In production, would actually restore the resource state
  }

  getChangeHistory(resourceId: string): ChangeRecord[] {
    return this.changes.filter(c => c.resourceId === resourceId);
  }
}

// Example Usage
export function demonstrateRemediationWorkflow() {
  const riskAssessment = new RiskAssessmentService();
  const actionRepository = new RemediationActionRepository();
  const changeTracker = new ChangeTracker();
  const workflow = new RemediationWorkflowService(
    riskAssessment,
    actionRepository,
    changeTracker
  );

  // Create a violation
  const violation: ComplianceViolation = {
    id: uuidv4(),
    controlId: 'CC6.7',
    resourceId: 's3-bucket-123',
    resourceType: 'aws_s3_bucket',
    violationType: 'MISSING_ENCRYPTION',
    severity: 'HIGH',
    detectedAt: new Date().toISOString(),
    description: 'S3 bucket does not have encryption enabled',
  };

  // Create remediation request
  const request = workflow.createRemediationRequest(violation);
  console.log('Remediation request created:', request);

  return { workflow, request };
}

export {
  RemediationWorkflowService,
  RiskAssessmentService,
  RemediationRequest,
  ComplianceViolation,
  RemediationTier,
};

