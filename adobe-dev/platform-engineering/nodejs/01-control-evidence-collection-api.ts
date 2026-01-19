/**
 * Question: Building a Control Evidence Collection API
 * 
 * Design a Node.js API that collects compliance evidence from multiple cloud 
 * providers (AWS, Azure, GCP) and internal systems. This implementation handles 
 * varying APIs, rate limits, and ensures evidence freshness.
 * 
 * Key Technical Decisions:
 * - Adapter pattern for cloud provider abstraction
 * - Token bucket rate limiting per provider
 * - Parallel collection with error boundaries
 * - Cryptographic hashing for evidence integrity
 * - Priority queue for freshness-based scheduling
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Types
type ControlType =
  | 'ACCESS_CONTROL'
  | 'ENCRYPTION_AT_REST'
  | 'ENCRYPTION_IN_TRANSIT'
  | 'NETWORK_SECURITY'
  | 'LOGGING'
  | 'INCIDENT_RESPONSE';

type ProviderId = 'aws' | 'azure' | 'gcp' | 'internal';

interface CollectionScope {
  region?: string;
  accountId?: string;
  resourceTypes?: string[];
  tags?: Record<string, string>;
}

interface Evidence {
  controlType: ControlType;
  provider: ProviderId;
  collectedAt: string;
  contentHash: string;
  data: unknown;
  metadata: {
    scope: CollectionScope;
    apiVersions?: Record<string, string>;
    collectionDuration?: number;
  };
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

interface CollectorHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCollectionAt?: string;
  errorRate?: number;
  rateLimitStatus?: {
    remaining: number;
    resetAt: string;
  };
}

// Core Evidence Collector Interface
interface EvidenceCollector {
  readonly providerId: ProviderId;
  readonly supportedControls: ControlType[];

  collectEvidence(control: ControlType, scope: CollectionScope): Promise<Evidence>;
  validateEvidence(evidence: Evidence): Promise<ValidationResult>;
  getCollectionStatus(): CollectorHealth;
}

// Rate Limiter Implementation (Token Bucket)
class TokenBucketLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private initialTokens: number = capacity
  ) {
    this.tokens = initialTokens;
    this.lastRefill = Date.now();
  }

  async acquire(cost: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return;
    }

    // Calculate wait time
    const tokensNeeded = cost - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000;

    await this.delay(waitTime);
    this.refill();
    this.tokens -= cost;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): { remaining: number; capacity: number } {
    this.refill();
    return {
      remaining: Math.floor(this.tokens),
      capacity: this.capacity,
    };
  }
}

// Rate-Limited Collector Wrapper
class RateLimitedCollector implements EvidenceCollector {
  constructor(
    private collector: EvidenceCollector,
    private rateLimiter: TokenBucketLimiter
  ) {}

  get providerId(): ProviderId {
    return this.collector.providerId;
  }

  get supportedControls(): ControlType[] {
    return this.collector.supportedControls;
  }

  async collectEvidence(
    control: ControlType,
    scope: CollectionScope
  ): Promise<Evidence> {
    await this.rateLimiter.acquire(1);
    return this.collector.collectEvidence(control, scope);
  }

  async validateEvidence(evidence: Evidence): Promise<ValidationResult> {
    return this.collector.validateEvidence(evidence);
  }

  getCollectionStatus(): CollectorHealth {
    const baseStatus = this.collector.getCollectionStatus();
    const limiterStatus = this.rateLimiter.getStatus();

    return {
      ...baseStatus,
      rateLimitStatus: {
        remaining: limiterStatus.remaining,
        resetAt: new Date(Date.now() + 1000).toISOString(),
      },
    };
  }
}

// AWS Evidence Collector Implementation
interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  credentials?: {
    roleArn?: string;
    sessionName?: string;
  };
  rateLimit?: {
    capacity: number;
    refillRate: number;
  };
}

class AWSEvidenceCollector implements EvidenceCollector {
  readonly providerId: ProviderId = 'aws';
  readonly supportedControls: ControlType[] = [
    'ACCESS_CONTROL',
    'ENCRYPTION_AT_REST',
    'ENCRYPTION_IN_TRANSIT',
    'NETWORK_SECURITY',
    'LOGGING',
  ];

  private clients: Map<string, any> = new Map(); // Would use actual AWS SDK clients
  private lastCollectionAt?: string;
  private errorCount = 0;
  private totalRequests = 0;

  constructor(private config: AWSConfig) {
    // Initialize AWS clients (simplified - would use AWS SDK)
    this.initializeClients();
  }

  private initializeClients(): void {
    // In real implementation, would initialize AWS SDK clients here
    // this.clients.set('IAM', new AWS.IAM({ ...this.config }));
    // this.clients.set('S3', new AWS.S3({ ...this.config }));
    // etc.
  }

  async collectEvidence(
    control: ControlType,
    scope: CollectionScope
  ): Promise<Evidence> {
    const startTime = Date.now();

    try {
      let evidenceData: unknown;

      switch (control) {
        case 'ACCESS_CONTROL':
          evidenceData = await this.collectIAMEvidence(scope);
          break;
        case 'ENCRYPTION_AT_REST':
          evidenceData = await this.collectEncryptionEvidence(scope);
          break;
        case 'NETWORK_SECURITY':
          evidenceData = await this.collectNetworkSecurityEvidence(scope);
          break;
        case 'LOGGING':
          evidenceData = await this.collectLoggingEvidence(scope);
          break;
        default:
          throw new Error(`Unsupported control type: ${control}`);
      }

      const evidence: Evidence = {
        controlType: control,
        provider: this.providerId,
        collectedAt: new Date().toISOString(),
        contentHash: await this.hashEvidence(evidenceData),
        data: evidenceData,
        metadata: {
          scope,
          apiVersions: this.getApiVersions(),
          collectionDuration: Date.now() - startTime,
        },
      };

      this.lastCollectionAt = evidence.collectedAt;
      this.totalRequests++;
      this.errorCount = 0; // Reset on success

      return evidence;
    } catch (error) {
      this.errorCount++;
      this.totalRequests++;
      throw error;
    }
  }

  private async collectIAMEvidence(scope: CollectionScope): Promise<unknown> {
    // Simulated IAM evidence collection
    // In real implementation, would use AWS SDK to collect:
    // - IAM users, roles, policies
    // - MFA status
    // - Access key rotation status
    // - Password policies

    const mockIAMData = {
      users: [
        {
          userName: 'example-user',
          userId: 'AIDAEXAMPLE',
          createDate: new Date().toISOString(),
          passwordLastUsed: new Date().toISOString(),
          mfaEnabled: true,
        },
      ],
      roles: [
        {
          roleName: 'example-role',
          roleId: 'AROAEXAMPLE',
          assumeRolePolicyDocument: {},
        },
      ],
      policies: [
        {
          policyName: 'example-policy',
          policyId: 'ANPAEXAMPLE',
        },
      ],
    };

    return mockIAMData;
  }

  private async collectEncryptionEvidence(
    scope: CollectionScope
  ): Promise<unknown> {
    // Simulated encryption evidence collection
    // Would collect S3 bucket encryption, EBS volume encryption, etc.
    return {
      s3Buckets: [
        {
          bucketName: 'example-bucket',
          encryptionEnabled: true,
          encryptionType: 'AES256',
        },
      ],
      ebsVolumes: [
        {
          volumeId: 'vol-123456',
          encrypted: true,
          kmsKeyId: 'arn:aws:kms:...',
        },
      ],
    };
  }

  private async collectNetworkSecurityEvidence(
    scope: CollectionScope
  ): Promise<unknown> {
    // Simulated network security evidence
    return {
      securityGroups: [],
      vpcs: [],
      networkAcls: [],
    };
  }

  private async collectLoggingEvidence(scope: CollectionScope): Promise<unknown> {
    // Simulated logging evidence
    return {
      cloudTrailEnabled: true,
      logGroups: [],
    };
  }

  private async hashEvidence(data: unknown): Promise<string> {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  private getApiVersions(): Record<string, string> {
    return {
      iam: '2010-05-08',
      s3: '2006-03-01',
      ec2: '2016-11-15',
    };
  }

  async validateEvidence(evidence: Evidence): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate hash
    const computedHash = await this.hashEvidence(evidence.data);
    if (computedHash !== evidence.contentHash) {
      errors.push('Evidence hash mismatch - possible tampering');
    }

    // Validate timestamp freshness (evidence should be less than 24 hours old)
    const collectedAt = new Date(evidence.collectedAt);
    const ageHours = (Date.now() - collectedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) {
      warnings.push(`Evidence is ${ageHours.toFixed(1)} hours old`);
    }

    // Validate required fields
    if (!evidence.data) {
      errors.push('Evidence data is missing');
    }

    if (!evidence.metadata.scope) {
      errors.push('Collection scope is missing');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getCollectionStatus(): CollectorHealth {
    const errorRate = this.totalRequests > 0
      ? this.errorCount / this.totalRequests
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errorRate > 0.1) {
      status = 'unhealthy';
    } else if (errorRate > 0.05) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      lastCollectionAt: this.lastCollectionAt,
      errorRate,
    };
  }
}

// Evidence Collector Factory
interface ProviderConfig {
  type: ProviderId;
  credentials: unknown;
  rateLimit?: {
    capacity: number;
    refillRate: number;
  };
}

class EvidenceCollectorFactory {
  private collectors: Map<ProviderId, EvidenceCollector> = new Map();
  private rateLimiters: Map<ProviderId, TokenBucketLimiter> = new Map();

  async getCollector(providerId: ProviderId): Promise<EvidenceCollector> {
    if (this.collectors.has(providerId)) {
      return this.collectors.get(providerId)!;
    }

    const config = await this.loadProviderConfig(providerId);
    const collector = this.createCollector(providerId, config);

    // Wrap with rate limiting if configured
    if (config.rateLimit) {
      const rateLimiter = new TokenBucketLimiter(
        config.rateLimit.capacity,
        config.rateLimit.refillRate
      );
      this.rateLimiters.set(providerId, rateLimiter);

      const rateLimitedCollector = new RateLimitedCollector(
        collector,
        rateLimiter
      );
      this.collectors.set(providerId, rateLimitedCollector);
      return rateLimitedCollector;
    }

    this.collectors.set(providerId, collector);
    return collector;
  }

  private async loadProviderConfig(providerId: ProviderId): Promise<ProviderConfig> {
    // In real implementation, would load from config store/database
    const defaultRateLimit = {
      capacity: 100,
      refillRate: 10, // 10 requests per second
    };

    return {
      type: providerId,
      credentials: {}, // Would load actual credentials
      rateLimit: defaultRateLimit,
    };
  }

  private createCollector(
    providerId: ProviderId,
    config: ProviderConfig
  ): EvidenceCollector {
    switch (providerId) {
      case 'aws':
        return new AWSEvidenceCollector(config.credentials as AWSConfig);
      case 'azure':
        // Would implement AzureEvidenceCollector
        throw new Error('Azure collector not yet implemented');
      case 'gcp':
        // Would implement GCPEvidenceCollector
        throw new Error('GCP collector not yet implemented');
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }
}

// Evidence Collection Service
class EvidenceCollectionService {
  private factory: EvidenceCollectorFactory;

  constructor() {
    this.factory = new EvidenceCollectorFactory();
  }

  async collectEvidence(
    providerId: ProviderId,
    control: ControlType,
    scope: CollectionScope
  ): Promise<Evidence> {
    const collector = await this.factory.getCollector(providerId);

    if (!collector.supportedControls.includes(control)) {
      throw new Error(
        `Control ${control} not supported by provider ${providerId}`
      );
    }

    const evidence = await collector.collectEvidence(control, scope);
    const validation = await collector.validateEvidence(evidence);

    if (!validation.valid) {
      throw new Error(
        `Evidence validation failed: ${validation.errors?.join(', ')}`
      );
    }

    return evidence;
  }

  async collectFromMultipleProviders(
    providers: ProviderId[],
    control: ControlType,
    scope: CollectionScope
  ): Promise<Map<ProviderId, Evidence>> {
    const results = new Map<ProviderId, Evidence>();

    // Collect in parallel with error handling
    const promises = providers.map(async providerId => {
      try {
        const evidence = await this.collectEvidence(providerId, control, scope);
        return { providerId, evidence };
      } catch (error) {
        console.error(`Failed to collect from ${providerId}:`, error);
        return { providerId, evidence: null };
      }
    });

    const settled = await Promise.allSettled(promises);

    settled.forEach(result => {
      if (result.status === 'fulfilled' && result.value.evidence) {
        results.set(result.value.providerId, result.value.evidence);
      }
    });

    return results;
  }

  async getCollectorHealth(providerId: ProviderId): Promise<CollectorHealth> {
    const collector = await this.factory.getCollector(providerId);
    return collector.getCollectionStatus();
  }
}

// Express.js API Routes (example usage)
export function createEvidenceCollectionRoutes(
  service: EvidenceCollectionService
) {
  return {
    // POST /api/evidence/collect
    collectEvidence: async (req: any, res: any) => {
      try {
        const { providerId, control, scope } = req.body;

        const evidence = await service.collectEvidence(
          providerId,
          control,
          scope
        );

        res.json({
          success: true,
          evidence,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    },

    // GET /api/evidence/health/:providerId
    getHealth: async (req: any, res: any) => {
      try {
        const { providerId } = req.params;
        const health = await service.getCollectorHealth(providerId);

        res.json({
          success: true,
          health,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    },
  };
}

export { EvidenceCollectionService, EvidenceCollectorFactory };

