/**
 * Question: Data Model for Storing Compliance Evidence
 * 
 * How would you design the data model for storing compliance evidence with 
 * auditability and queryability? This implementation uses a hybrid storage 
 * model balancing immutability and queryability.
 * 
 * Key Technical Decisions:
 * - Event store for immutability (append-only)
 * - Projection database for queryability (PostgreSQL with JSONB)
 * - Blob storage for artifacts (S3/Azure Blob)
 * - Star schema for OLAP analytics
 * - Point-in-time reconstruction capability
 */

// Node.js crypto module - in production would use actual crypto
const crypto = {
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  createHash: (algorithm: string) => {
    return {
      update: (data: string) => ({
        digest: (encoding: string) => {
          // Simplified hash - in production would use actual crypto
          let hash = 0;
          for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          return Math.abs(hash).toString(16).padStart(64, '0');
        },
      }),
    };
  },
};

// Types
interface ComplianceEvent {
  id: string;
  timestamp: string;
  controlId: string;
  resourceId: string;
  resourceType: string;
  checkResult: 'PASS' | 'FAIL' | 'WARNING';
  evidenceArtifacts: string[]; // References to blob storage
  cryptographicSignature: string; // Hash of event for tamper detection
  previousEventHash?: string; // Chain of custody
  metadata: {
    collector: string;
    framework: string;
    team: string;
    environment: string;
    [key: string]: unknown;
  };
}

interface EvidenceArtifact {
  id: string;
  eventId: string;
  artifactType: 'screenshot' | 'log_export' | 'config_snapshot' | 'api_response';
  storageLocation: string; // S3/Azure Blob path
  contentType: string;
  size: number;
  collectedAt: string;
  tags: Record<string, string>;
}

// Event Store Interface (Immutable)
interface EventStore {
  append(event: ComplianceEvent): Promise<void>;
  getByControlId(controlId: string, limit?: number): Promise<ComplianceEvent[]>;
  getByResourceId(resourceId: string): Promise<ComplianceEvent[]>;
  getByTimeRange(start: Date, end: Date): Promise<ComplianceEvent[]>;
  getLatestHash(): Promise<string | null>;
}

// In-Memory Event Store (would use Kafka/S3 in production)
class InMemoryEventStore implements EventStore {
  private events: ComplianceEvent[] = [];
  private lastHash: string | null = null;

  async append(event: ComplianceEvent): Promise<void> {
    // Verify chain of custody
    if (this.lastHash && event.previousEventHash !== this.lastHash) {
      throw new Error('Event hash chain broken - possible tampering');
    }

    // Verify event signature
    const computedHash = this.computeEventHash(event);
    if (computedHash !== event.cryptographicSignature) {
      throw new Error('Event signature mismatch - possible tampering');
    }

    this.events.push(event);
    this.lastHash = event.cryptographicSignature;
  }

  async getByControlId(controlId: string, limit = 100): Promise<ComplianceEvent[]> {
    return this.events
      .filter(e => e.controlId === controlId)
      .slice(-limit)
      .reverse();
  }

  async getByResourceId(resourceId: string): Promise<ComplianceEvent[]> {
    return this.events.filter(e => e.resourceId === resourceId);
  }

  async getByTimeRange(start: Date, end: Date): Promise<ComplianceEvent[]> {
    return this.events.filter(e => {
      const eventTime = new Date(e.timestamp);
      return eventTime >= start && eventTime <= end;
    });
  }

  async getLatestHash(): Promise<string | null> {
    return this.lastHash;
  }

  private computeEventHash(event: Omit<ComplianceEvent, 'cryptographicSignature'>): string {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      controlId: event.controlId,
      resourceId: event.resourceId,
      checkResult: event.checkResult,
      metadata: event.metadata,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Projection Database Schema (Queryable)
interface ComplianceEventProjection {
  id: string;
  event_id: string;
  timestamp: Date;
  control_id: string;
  resource_id: string;
  resource_type: string;
  check_result: 'PASS' | 'FAIL' | 'WARNING';
  framework: string;
  team: string;
  environment: string;
  evidence_count: number;
  metadata: Record<string, unknown>; // JSONB column
}

interface CompliancePostureSnapshot {
  control_id: string;
  framework: string;
  team: string;
  environment: string;
  snapshot_date: Date;
  compliant_count: number;
  non_compliant_count: number;
  warning_count: number;
  compliance_score: number; // 0-100
}

// Projection Service
class ProjectionService {
  constructor(
    private eventStore: EventStore,
    private projectionDb: ProjectionDatabase
  ) {}

  /**
   * Build projections from event stream
   */
  async buildProjections(): Promise<void> {
    // In production, would process events in batches
    const events = await this.eventStore.getByTimeRange(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );

    for (const event of events) {
      await this.projectEvent(event);
    }
  }

  private async projectEvent(event: ComplianceEvent): Promise<void> {
    const projection: ComplianceEventProjection = {
      id: crypto.randomUUID(),
      event_id: event.id,
      timestamp: new Date(event.timestamp),
      control_id: event.controlId,
      resource_id: event.resourceId,
      resource_type: event.resourceType,
      check_result: event.checkResult,
      framework: event.metadata.framework as string,
      team: event.metadata.team as string,
      environment: event.metadata.environment as string,
      evidence_count: event.evidenceArtifacts.length,
      metadata: event.metadata,
    };

    await this.projectionDb.insertEvent(projection);
    await this.updateComplianceSnapshot(projection);
  }

  private async updateComplianceSnapshot(projection: ComplianceEventProjection): Promise<void> {
    // Update or create compliance snapshot
    const snapshot = await this.projectionDb.getSnapshot(
      projection.control_id,
      projection.framework,
      projection.team,
      projection.environment,
      projection.timestamp
    );

    if (!snapshot) {
      // Create new snapshot
      const newSnapshot: CompliancePostureSnapshot = {
        control_id: projection.control_id,
        framework: projection.framework,
        team: projection.team,
        environment: projection.environment,
        snapshot_date: projection.timestamp,
        compliant_count: projection.check_result === 'PASS' ? 1 : 0,
        non_compliant_count: projection.check_result === 'FAIL' ? 1 : 0,
        warning_count: projection.check_result === 'WARNING' ? 1 : 0,
        compliance_score: projection.check_result === 'PASS' ? 100 : 0,
      };
      await this.projectionDb.insertSnapshot(newSnapshot);
    } else {
      // Update existing snapshot
      const total = snapshot.compliant_count + snapshot.non_compliant_count + snapshot.warning_count;
      const compliant = snapshot.compliant_count + (projection.check_result === 'PASS' ? 1 : 0);
      const nonCompliant = snapshot.non_compliant_count + (projection.check_result === 'FAIL' ? 1 : 0);
      const warnings = snapshot.warning_count + (projection.check_result === 'WARNING' ? 1 : 0);

      snapshot.compliant_count = compliant;
      snapshot.non_compliant_count = nonCompliant;
      snapshot.warning_count = warnings;
      snapshot.compliance_score = total > 0 ? (compliant / total) * 100 : 0;

      await this.projectionDb.updateSnapshot(snapshot);
    }
  }

  /**
   * Point-in-time reconstruction
   */
  async reconstructPosture(
    controlId: string,
    framework: string,
    pointInTime: Date
  ): Promise<CompliancePostureSnapshot | null> {
    // Get all events up to point in time
    const events = await this.eventStore.getByTimeRange(
      new Date(0), // Beginning of time
      pointInTime
    );

    const relevantEvents = events.filter(
      e => e.controlId === controlId && e.metadata.framework === framework
    );

    if (relevantEvents.length === 0) return null;

    const compliant = relevantEvents.filter(e => e.checkResult === 'PASS').length;
    const nonCompliant = relevantEvents.filter(e => e.checkResult === 'FAIL').length;
    const warnings = relevantEvents.filter(e => e.checkResult === 'WARNING').length;
    const total = relevantEvents.length;

    return {
      control_id: controlId,
      framework,
      team: relevantEvents[0].metadata.team as string,
      environment: relevantEvents[0].metadata.environment as string,
      snapshot_date: pointInTime,
      compliant_count: compliant,
      non_compliant_count: nonCompliant,
      warning_count: warnings,
      compliance_score: total > 0 ? (compliant / total) * 100 : 0,
    };
  }
}

// Projection Database Interface
interface ProjectionDatabase {
  insertEvent(projection: ComplianceEventProjection): Promise<void>;
  insertSnapshot(snapshot: CompliancePostureSnapshot): Promise<void>;
  updateSnapshot(snapshot: CompliancePostureSnapshot): Promise<void>;
  getSnapshot(
    controlId: string,
    framework: string,
    team: string,
    environment: string,
    date: Date
  ): Promise<CompliancePostureSnapshot | null>;
  queryFailedControls(framework: string, team?: string): Promise<ComplianceEventProjection[]>;
  queryComplianceDrift(team: string, days: number): Promise<CompliancePostureSnapshot[]>;
}

// In-Memory Projection Database (would use PostgreSQL in production)
class InMemoryProjectionDatabase implements ProjectionDatabase {
  private events: ComplianceEventProjection[] = [];
  private snapshots: CompliancePostureSnapshot[] = [];

  async insertEvent(projection: ComplianceEventProjection): Promise<void> {
    this.events.push(projection);
  }

  async insertSnapshot(snapshot: CompliancePostureSnapshot): Promise<void> {
    this.snapshots.push(snapshot);
  }

  async updateSnapshot(snapshot: CompliancePostureSnapshot): Promise<void> {
    const index = this.snapshots.findIndex(
      s =>
        s.control_id === snapshot.control_id &&
        s.framework === snapshot.framework &&
        s.team === snapshot.team &&
        s.environment === snapshot.environment &&
        s.snapshot_date.getTime() === snapshot.snapshot_date.getTime()
    );

    if (index >= 0) {
      this.snapshots[index] = snapshot;
    } else {
      this.snapshots.push(snapshot);
    }
  }

  async getSnapshot(
    controlId: string,
    framework: string,
    team: string,
    environment: string,
    date: Date
  ): Promise<CompliancePostureSnapshot | null> {
    return (
      this.snapshots.find(
        s =>
          s.control_id === controlId &&
          s.framework === framework &&
          s.team === team &&
          s.environment === environment &&
          Math.abs(s.snapshot_date.getTime() - date.getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
      ) || null
    );
  }

  async queryFailedControls(framework: string, team?: string): Promise<ComplianceEventProjection[]> {
    return this.events.filter(
      e => e.framework === framework && e.check_result === 'FAIL' && (!team || e.team === team)
    );
  }

  async queryComplianceDrift(team: string, days: number): Promise<CompliancePostureSnapshot[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.snapshots.filter(
      s => s.team === team && s.snapshot_date >= cutoffDate
    );
  }
}

// Evidence Artifact Storage
interface ArtifactStorage {
  store(artifact: EvidenceArtifact, data: Uint8Array): Promise<string>;
  retrieve(artifactId: string): Promise<Uint8Array>;
  delete(artifactId: string): Promise<void>;
  getLifecyclePolicy(artifactId: string): Promise<LifecyclePolicy>;
}

interface LifecyclePolicy {
  archiveAfterDays: number;
  deleteAfterDays: number;
  currentTier: 'standard' | 'archive' | 'deep_archive';
}

// Example Usage
export function demonstrateEvidenceDataModel() {
  const eventStore = new InMemoryEventStore();
  const projectionDb = new InMemoryProjectionDatabase();
  const projectionService = new ProjectionService(eventStore, projectionDb);

  // Create an event
  const event: ComplianceEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    controlId: 'CC6.1',
    resourceId: 'iam-user-123',
    resourceType: 'aws_iam_user',
    checkResult: 'FAIL',
    evidenceArtifacts: ['artifact-1'],
    cryptographicSignature: '', // Would be computed
    metadata: {
      collector: 'aws-evidence-collector',
      framework: 'SOC2',
      team: 'security-team',
      environment: 'production',
    },
  };

  // Compute signature
  const data = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    controlId: event.controlId,
    resourceId: event.resourceId,
    checkResult: event.checkResult,
    metadata: event.metadata,
  });
  event.cryptographicSignature = crypto.createHash('sha256').update(data).digest('hex');

  // Append to event store
  eventStore.append(event);

  // Build projections
  projectionService.buildProjections();

  // Query failed controls
  const failed = projectionDb.queryFailedControls('SOC2');
  console.log('Failed controls:', failed);

  // Point-in-time reconstruction
  const pastPosture = projectionService.reconstructPosture(
    'CC6.1',
    'SOC2',
    new Date()
  );
  console.log('Past posture:', pastPosture);

  return { eventStore, projectionDb, projectionService };
}

export {
  EventStore,
  InMemoryEventStore,
  ProjectionService,
  ComplianceEvent,
  EvidenceArtifact,
  ComplianceEventProjection,
  CompliancePostureSnapshot,
  ProjectionDatabase,
};

