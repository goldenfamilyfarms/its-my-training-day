/**
 * Interview Question 12: Sampling with Risk Bias for Compliance Monitoring
 * 
 * Implement a sampling system that intelligently selects compliance events
 * for detailed analysis based on risk factors. High-risk events are sampled
 * more frequently than low-risk events, ensuring critical issues are never
 * missed while optimizing resource usage.
 * 
 * Key Technical Requirements:
 * - Risk-based sampling probability
 * - Configurable sampling rates by risk level
 * - Deterministic sampling for auditability
 * - Sampling statistics and metrics
 * - Adaptive sampling based on event volume
 */

import { createHash } from 'crypto';

// Types
interface ComplianceEvent {
  id: string;
  controlId: string;
  frameworkId: string;
  timestamp: string;
  eventType: 'VIOLATION' | 'REMEDIATION' | 'ASSESSMENT' | 'EVIDENCE_COLLECTED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  resourceId: string;
  riskScore: number; // 0-100, calculated risk score
  metadata: Record<string, unknown>;
}

interface SamplingConfig {
  baseRate: number; // Base sampling rate (0-1)
  riskMultipliers: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  adaptiveThreshold?: number; // Event volume threshold for adaptive sampling
  deterministic?: boolean; // Use deterministic sampling for auditability
}

interface SamplingDecision {
  sampled: boolean;
  probability: number;
  reason: string;
  riskLevel: ComplianceEvent['severity'];
}

interface SamplingStatistics {
  totalEvents: number;
  sampledEvents: number;
  samplingRate: number;
  bySeverity: Record<string, { total: number; sampled: number; rate: number }>;
  byControl: Record<string, { total: number; sampled: number; rate: number }>;
}

// Risk-Based Sampler
class RiskBasedSampler {
  private statistics: SamplingStatistics = {
    totalEvents: 0,
    sampledEvents: 0,
    samplingRate: 0,
    bySeverity: {},
    byControl: {},
  };

  constructor(private config: SamplingConfig) {}

  /**
   * Determine if event should be sampled based on risk
   */
  shouldSample(event: ComplianceEvent): SamplingDecision {
    this.statistics.totalEvents++;

    // Calculate sampling probability based on risk
    const baseProbability = this.config.baseRate;
    const riskMultiplier = this.config.riskMultipliers[event.severity];
    const probability = Math.min(1, baseProbability * riskMultiplier);

    // Deterministic sampling for auditability
    let sampled: boolean;
    if (this.config.deterministic) {
      sampled = this.deterministicSample(event, probability);
    } else {
      sampled = Math.random() < probability;
    }

    if (sampled) {
      this.statistics.sampledEvents++;
      this.updateStatistics(event, true);
    } else {
      this.updateStatistics(event, false);
    }

    this.statistics.samplingRate = this.statistics.sampledEvents / this.statistics.totalEvents;

    return {
      sampled,
      probability,
      reason: this.getSamplingReason(event, probability),
      riskLevel: event.severity,
    };
  }

  /**
   * Deterministic sampling using hash of event ID
   * Ensures same event always gets same sampling decision
   */
  private deterministicSample(event: ComplianceEvent, probability: number): boolean {
    const hash = createHash('sha256')
      .update(`${event.id}:${event.timestamp}`)
      .digest('hex');
    
    // Convert first 8 hex characters to number (0-2^32)
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const threshold = Math.floor(probability * 0xFFFFFFFF);
    
    return hashValue < threshold;
  }

  /**
   * Get reason for sampling decision
   */
  private getSamplingReason(event: ComplianceEvent, probability: number): string {
    if (probability >= 1.0) {
      return 'Always sampled (critical risk)';
    } else if (probability >= 0.5) {
      return `High risk sampling (${(probability * 100).toFixed(1)}%)`;
    } else if (probability >= 0.1) {
      return `Medium risk sampling (${(probability * 100).toFixed(1)}%)`;
    } else {
      return `Low risk sampling (${(probability * 100).toFixed(1)}%)`;
    }
  }

  /**
   * Update sampling statistics
   */
  private updateStatistics(event: ComplianceEvent, sampled: boolean): void {
    // By severity
    if (!this.statistics.bySeverity[event.severity]) {
      this.statistics.bySeverity[event.severity] = { total: 0, sampled: 0, rate: 0 };
    }
    const severityStats = this.statistics.bySeverity[event.severity];
    severityStats.total++;
    if (sampled) severityStats.sampled++;
    severityStats.rate = severityStats.sampled / severityStats.total;

    // By control
    if (!this.statistics.byControl[event.controlId]) {
      this.statistics.byControl[event.controlId] = { total: 0, sampled: 0, rate: 0 };
    }
    const controlStats = this.statistics.byControl[event.controlId];
    controlStats.total++;
    if (sampled) controlStats.sampled++;
    controlStats.rate = controlStats.sampled / controlStats.total;
  }

  /**
   * Get sampling statistics
   */
  getStatistics(): SamplingStatistics {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalEvents: 0,
      sampledEvents: 0,
      samplingRate: 0,
      bySeverity: {},
      byControl: {},
    };
  }
}

// Adaptive Sampler with Volume-Based Adjustment
class AdaptiveRiskSampler extends RiskBasedSampler {
  private eventVolume: Map<string, number> = new Map(); // Control ID -> event count
  private volumeWindow: number; // Time window in milliseconds
  private volumeThreshold: number;

  constructor(
    config: SamplingConfig,
    volumeWindow: number = 60000, // 1 minute
    volumeThreshold: number = 1000
  ) {
    super(config);
    this.volumeWindow = volumeWindow;
    this.volumeThreshold = volumeThreshold || config.adaptiveThreshold || 1000;
  }

  /**
   * Sample with adaptive rate based on event volume
   */
  shouldSampleAdaptive(event: ComplianceEvent): SamplingDecision {
    const now = Date.now();
    const controlKey = `${event.controlId}:${event.frameworkId}`;
    
    // Track event volume
    if (!this.eventVolume.has(controlKey)) {
      this.eventVolume.set(controlKey, 0);
    }
    this.eventVolume.set(controlKey, this.eventVolume.get(controlKey)! + 1);

    // Clean old volume data (simplified - would use time-based cleanup in production)
    // In production, would track volume with timestamps

    // Adjust sampling probability based on volume
    const volume = this.eventVolume.get(controlKey)!;
    const volumeMultiplier = volume > this.volumeThreshold
      ? Math.max(0.1, this.volumeThreshold / volume) // Reduce sampling when volume is high
      : 1.0; // Normal sampling when volume is low

    // Temporarily adjust config for this event
    const originalMultipliers = { ...this.config.riskMultipliers };
    for (const severity in this.config.riskMultipliers) {
      this.config.riskMultipliers[severity as ComplianceEvent['severity']] *= volumeMultiplier;
    }

    const decision = super.shouldSample(event);

    // Restore original multipliers
    this.config.riskMultipliers = originalMultipliers;

    return {
      ...decision,
      reason: `${decision.reason} (volume-adjusted: ${(volumeMultiplier * 100).toFixed(1)}%)`,
    };
  }

  /**
   * Get volume statistics
   */
  getVolumeStatistics(): Map<string, number> {
    return new Map(this.eventVolume);
  }
}

// Stratified Sampler - Ensures representation across risk levels
class StratifiedRiskSampler extends RiskBasedSampler {
  private strataCounts: Map<string, number> = new Map();
  private strataTargets: Map<string, number> = new Map();

  constructor(
    config: SamplingConfig,
    strataTargets: { [key in ComplianceEvent['severity']]?: number } = {}
  ) {
    super(config);
    
    // Set target counts for each stratum
    this.strataTargets.set('CRITICAL', strataTargets.CRITICAL || 100);
    this.strataTargets.set('HIGH', strataTargets.HIGH || 50);
    this.strataTargets.set('MEDIUM', strataTargets.MEDIUM || 20);
    this.strataTargets.set('LOW', strataTargets.LOW || 10);
  }

  /**
   * Sample with stratification to ensure representation
   */
  shouldSampleStratified(event: ComplianceEvent): SamplingDecision {
    const severity = event.severity;
    const currentCount = this.strataCounts.get(severity) || 0;
    const targetCount = this.strataTargets.get(severity) || 0;

    // Always sample if below target
    if (currentCount < targetCount) {
      this.strataCounts.set(severity, currentCount + 1);
      return {
        sampled: true,
        probability: 1.0,
        reason: `Stratified sampling: below target (${currentCount}/${targetCount})`,
        riskLevel: severity,
      };
    }

    // Use risk-based sampling if above target
    const decision = super.shouldSample(event);
    if (decision.sampled) {
      this.strataCounts.set(severity, currentCount + 1);
    }

    return {
      ...decision,
      reason: `Stratified sampling: ${decision.reason}`,
    };
  }

  /**
   * Reset strata counts
   */
  resetStrata(): void {
    this.strataCounts.clear();
    this.resetStatistics();
  }
}

// Example usage
export function demonstrateRiskBasedSampling() {
  // Standard risk-based sampler
  const standardSampler = new RiskBasedSampler({
    baseRate: 0.1, // 10% base rate
    riskMultipliers: {
      CRITICAL: 10.0, // 100% sampling for critical
      HIGH: 5.0,      // 50% sampling for high
      MEDIUM: 2.0,    // 20% sampling for medium
      LOW: 0.5,       // 5% sampling for low
    },
    deterministic: true, // For auditability
  });

  // Adaptive sampler
  const adaptiveSampler = new AdaptiveRiskSampler(
    {
      baseRate: 0.1,
      riskMultipliers: {
        CRITICAL: 10.0,
        HIGH: 5.0,
        MEDIUM: 2.0,
        LOW: 0.5,
      },
    },
    60000, // 1 minute window
    1000   // 1000 events threshold
  );

  // Stratified sampler
  const stratifiedSampler = new StratifiedRiskSampler(
    {
      baseRate: 0.1,
      riskMultipliers: {
        CRITICAL: 10.0,
        HIGH: 5.0,
        MEDIUM: 2.0,
        LOW: 0.5,
      },
    },
    {
      CRITICAL: 100,
      HIGH: 50,
      MEDIUM: 20,
      LOW: 10,
    }
  );

  // Simulate events
  const events: ComplianceEvent[] = [];
  for (let i = 0; i < 1000; i++) {
    events.push({
      id: `event-${i}`,
      controlId: `control-${i % 10}`,
      frameworkId: 'SOC2',
      timestamp: new Date().toISOString(),
      eventType: i % 3 === 0 ? 'VIOLATION' : 'EVIDENCE_COLLECTED',
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][i % 4] as ComplianceEvent['severity'],
      resourceId: `resource-${i % 100}`,
      riskScore: Math.random() * 100,
      metadata: {},
    });
  }

  // Sample events
  const sampledEvents: ComplianceEvent[] = [];
  for (const event of events) {
    const decision = standardSampler.shouldSample(event);
    if (decision.sampled) {
      sampledEvents.push(event);
    }
  }

  const stats = standardSampler.getStatistics();
  console.log('Sampling Statistics:', stats);
  console.log(`Sampled ${sampledEvents.length} out of ${events.length} events`);

  return {
    standardSampler,
    adaptiveSampler,
    stratifiedSampler,
    stats,
    sampledEvents,
  };
}

/**
 * Key Concepts Explained:
 * 
 * 1. Risk-Based Sampling: Higher risk events sampled more frequently.
 *    Ensures critical issues are never missed.
 * 
 * 2. Deterministic Sampling: Same event always gets same decision.
 *    Important for auditability and reproducibility.
 * 
 * 3. Adaptive Sampling: Adjusts sampling rate based on event volume.
 *    Prevents resource exhaustion during high-volume periods.
 * 
 * 4. Stratified Sampling: Ensures representation across risk levels.
 *    Guarantees minimum samples from each risk category.
 * 
 * 5. Sampling Statistics: Track sampling rates by severity, control, etc.
 *    Monitor sampling effectiveness and adjust rates.
 * 
 * Interview Talking Points:
 * - Risk bias: Why sample high-risk events more? Never miss critical issues
 * - Deterministic: Auditability, reproducibility, consistent decisions
 * - Adaptive: Handle volume spikes, prevent resource exhaustion
 * - Stratified: Ensure representation, balanced analysis
 * - Statistics: Monitor effectiveness, optimize sampling rates
 */

export { RiskBasedSampler, AdaptiveRiskSampler, StratifiedRiskSampler, SamplingConfig, SamplingStatistics };

