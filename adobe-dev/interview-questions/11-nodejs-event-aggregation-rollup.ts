/**
 * Interview Question 11: Event Aggregation and Time-Based Rollup
 * 
 * Implement a system that aggregates compliance events and performs time-based
 * rollups for efficient storage and querying. Demonstrate:
 * - Event aggregation with multiple dimensions
 * - Time-based rollup (minute, hour, day, month)
 * - Control-level rollup for compliance metrics
 * - Efficient storage and retrieval
 * - Query optimization for time-series data
 * 
 * Key Technical Requirements:
 * - Aggregate events by time windows
 * - Rollup to multiple time granularities
 * - Control-level aggregation
 * - Efficient storage structure
 * - Query API for different time ranges
 */

import { EventEmitter } from 'events';

// Types
interface ComplianceEvent {
  id: string;
  controlId: string;
  frameworkId: string;
  timestamp: string;
  eventType: 'VIOLATION' | 'REMEDIATION' | 'ASSESSMENT' | 'EVIDENCE_COLLECTED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  resourceId: string;
  metadata: Record<string, unknown>;
}

interface AggregatedEvent {
  timeWindow: string;
  controlId: string;
  frameworkId: string;
  eventType: ComplianceEvent['eventType'];
  count: number;
  severityCounts: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  sampleEventIds: string[];
  metadata: {
    uniqueResources: number;
    totalResources: string[];
  };
}

interface TimeBasedRollup {
  timestamp: string;
  granularity: 'minute' | 'hour' | 'day' | 'month';
  controlId: string;
  frameworkId: string;
  metrics: {
    totalEvents: number;
    violations: number;
    remediations: number;
    assessments: number;
    evidenceCollected: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    uniqueResources: number;
    complianceScore: number; // Calculated metric
  };
}

interface ControlLevelRollup {
  controlId: string;
  frameworkId: string;
  timeRange: { start: string; end: string };
  metrics: {
    totalEvents: number;
    violationRate: number;
    remediationRate: number;
    averageTimeToRemediate: number; // in seconds
    complianceTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    severityDistribution: Record<string, number>;
    topViolatingResources: Array<{ resourceId: string; count: number }>;
  };
}

// Time Window Utilities
class TimeWindowUtils {
  static getTimeWindow(timestamp: string, granularity: 'minute' | 'hour' | 'day' | 'month'): string {
    const date = new Date(timestamp);
    
    switch (granularity) {
      case 'minute':
        date.setSeconds(0, 0);
        return date.toISOString();
      
      case 'hour':
        date.setMinutes(0, 0, 0);
        return date.toISOString();
      
      case 'day':
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      
      default:
        throw new Error(`Unknown granularity: ${granularity}`);
    }
  }

  static getNextTimeWindow(timeWindow: string, granularity: 'minute' | 'hour' | 'day' | 'month'): string {
    const date = new Date(timeWindow);
    
    switch (granularity) {
      case 'minute':
        date.setMinutes(date.getMinutes() + 1);
        break;
      case 'hour':
        date.setHours(date.getHours() + 1);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    
    return date.toISOString();
  }

  static getTimeRange(start: string, end: string, granularity: 'minute' | 'hour' | 'day' | 'month'): string[] {
    const windows: string[] = [];
    let current = this.getTimeWindow(start, granularity);
    const endWindow = this.getTimeWindow(end, granularity);
    
    while (current <= endWindow) {
      windows.push(current);
      current = this.getNextTimeWindow(current, granularity);
    }
    
    return windows;
  }
}

// Event Aggregator
class EventAggregator extends EventEmitter {
  private eventBuffer: Map<string, ComplianceEvent[]> = new Map();
  private aggregatedEvents: Map<string, AggregatedEvent> = new Map();
  private rollupCache: Map<string, TimeBasedRollup[]> = new Map();

  constructor(
    private config: {
      bufferSize: number;
      flushInterval: number;
      rollupGranularities: Array<'minute' | 'hour' | 'day' | 'month'>;
    }
  ) {
    super();
    this.startFlushInterval();
  }

  /**
   * Add event to buffer for aggregation
   */
  addEvent(event: ComplianceEvent): void {
    const key = this.getEventKey(event);
    
    if (!this.eventBuffer.has(key)) {
      this.eventBuffer.set(key, []);
    }
    
    this.eventBuffer.get(key)!.push(event);
    
    // Emit event for real-time processing
    this.emit('event', event);
    
    // Flush if buffer is full
    if (this.eventBuffer.get(key)!.length >= this.config.bufferSize) {
      this.flushBuffer(key);
    }
  }

  /**
   * Aggregate events in buffer
   */
  private flushBuffer(key: string): void {
    const events = this.eventBuffer.get(key);
    if (!events || events.length === 0) return;

    const aggregated = this.aggregateEvents(events);
    this.aggregatedEvents.set(key, aggregated);
    
    // Create rollups for all granularities
    for (const granularity of this.config.rollupGranularities) {
      this.createRollup(events, granularity);
    }

    // Clear buffer
    this.eventBuffer.set(key, []);
    
    this.emit('aggregated', aggregated);
  }

  /**
   * Aggregate events into a single aggregated event
   */
  private aggregateEvents(events: ComplianceEvent[]): AggregatedEvent {
    if (events.length === 0) {
      throw new Error('Cannot aggregate empty event list');
    }

    const firstEvent = events[0];
    const timeWindow = TimeWindowUtils.getTimeWindow(firstEvent.timestamp, 'minute');
    
    const severityCounts: Record<string, number> = {};
    const resourceSet = new Set<string>();
    const sampleEventIds: string[] = [];

    // Sample up to 10 events for reference
    const sampleSize = Math.min(10, events.length);
    for (let i = 0; i < sampleSize; i++) {
      sampleEventIds.push(events[i].id);
    }

    let firstSeen = events[0].timestamp;
    let lastSeen = events[0].timestamp;

    for (const event of events) {
      // Track severity distribution
      severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;
      
      // Track unique resources
      resourceSet.add(event.resourceId);
      
      // Track time range
      if (event.timestamp < firstSeen) firstSeen = event.timestamp;
      if (event.timestamp > lastSeen) lastSeen = event.timestamp;
    }

    return {
      timeWindow,
      controlId: firstEvent.controlId,
      frameworkId: firstEvent.frameworkId,
      eventType: firstEvent.eventType,
      count: events.length,
      severityCounts,
      firstSeen,
      lastSeen,
      sampleEventIds,
      metadata: {
        uniqueResources: resourceSet.size,
        totalResources: Array.from(resourceSet),
      },
    };
  }

  /**
   * Create time-based rollup
   */
  private createRollup(
    events: ComplianceEvent[],
    granularity: 'minute' | 'hour' | 'day' | 'month'
  ): void {
    if (events.length === 0) return;

    const firstEvent = events[0];
    const timestamp = TimeWindowUtils.getTimeWindow(firstEvent.timestamp, granularity);
    const rollupKey = `${granularity}:${timestamp}:${firstEvent.controlId}:${firstEvent.frameworkId}`;

    // Group events by time window
    const eventsByWindow = new Map<string, ComplianceEvent[]>();
    for (const event of events) {
      const window = TimeWindowUtils.getTimeWindow(event.timestamp, granularity);
      if (!eventsByWindow.has(window)) {
        eventsByWindow.set(window, []);
      }
      eventsByWindow.get(window)!.push(event);
    }

    // Create rollup for each window
    for (const [window, windowEvents] of eventsByWindow.entries()) {
      const rollup: TimeBasedRollup = {
        timestamp: window,
        granularity,
        controlId: firstEvent.controlId,
        frameworkId: firstEvent.frameworkId,
        metrics: this.calculateMetrics(windowEvents),
      };

      // Store rollup
      if (!this.rollupCache.has(rollupKey)) {
        this.rollupCache.set(rollupKey, []);
      }
      this.rollupCache.get(rollupKey)!.push(rollup);
    }
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(events: ComplianceEvent[]): TimeBasedRollup['metrics'] {
    const metrics = {
      totalEvents: events.length,
      violations: 0,
      remediations: 0,
      assessments: 0,
      evidenceCollected: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      uniqueResources: 0,
      complianceScore: 0,
    };

    const resourceSet = new Set<string>();
    let compliantCount = 0;

    for (const event of events) {
      // Count by event type
      switch (event.eventType) {
        case 'VIOLATION':
          metrics.violations++;
          break;
        case 'REMEDIATION':
          metrics.remediations++;
          break;
        case 'ASSESSMENT':
          metrics.assessments++;
          break;
        case 'EVIDENCE_COLLECTED':
          metrics.evidenceCollected++;
          compliantCount++;
          break;
      }

      // Count by severity
      switch (event.severity) {
        case 'CRITICAL':
          metrics.criticalCount++;
          break;
        case 'HIGH':
          metrics.highCount++;
          break;
        case 'MEDIUM':
          metrics.mediumCount++;
          break;
        case 'LOW':
          metrics.lowCount++;
          break;
      }

      resourceSet.add(event.resourceId);
    }

    metrics.uniqueResources = resourceSet.size;
    
    // Calculate compliance score: (compliant events / total events) * 100
    metrics.complianceScore = events.length > 0
      ? (compliantCount / events.length) * 100
      : 100;

    return metrics;
  }

  /**
   * Get rollups for time range
   */
  getRollups(
    controlId: string,
    frameworkId: string,
    start: string,
    end: string,
    granularity: 'minute' | 'hour' | 'day' | 'month'
  ): TimeBasedRollup[] {
    const windows = TimeWindowUtils.getTimeRange(start, end, granularity);
    const rollups: TimeBasedRollup[] = [];

    for (const window of windows) {
      const rollupKey = `${granularity}:${window}:${controlId}:${frameworkId}`;
      const cached = this.rollupCache.get(rollupKey);
      if (cached) {
        rollups.push(...cached);
      }
    }

    return rollups.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get control-level rollup
   */
  getControlRollup(
    controlId: string,
    frameworkId: string,
    start: string,
    end: string
  ): ControlLevelRollup {
    // Get all events for this control in time range
    const allEvents: ComplianceEvent[] = [];
    for (const events of this.eventBuffer.values()) {
      for (const event of events) {
        if (
          event.controlId === controlId &&
          event.frameworkId === frameworkId &&
          event.timestamp >= start &&
          event.timestamp <= end
        ) {
          allEvents.push(event);
        }
      }
    }

    // Also check aggregated events
    for (const aggregated of this.aggregatedEvents.values()) {
      if (
        aggregated.controlId === controlId &&
        aggregated.frameworkId === frameworkId &&
        aggregated.firstSeen >= start &&
        aggregated.lastSeen <= end
      ) {
        // Would need to expand aggregated events back to individual events
        // For simplicity, using aggregated count
      }
    }

    return this.calculateControlRollup(allEvents, controlId, frameworkId, start, end);
  }

  /**
   * Calculate control-level metrics
   */
  private calculateControlRollup(
    events: ComplianceEvent[],
    controlId: string,
    frameworkId: string,
    start: string,
    end: string
  ): ControlLevelRollup {
    const violations = events.filter(e => e.eventType === 'VIOLATION');
    const remediations = events.filter(e => e.eventType === 'REMEDIATION');
    
    // Calculate time to remediate
    const remediationTimes: number[] = [];
    const violationMap = new Map<string, ComplianceEvent>();
    
    for (const violation of violations) {
      violationMap.set(violation.resourceId, violation);
    }
    
    for (const remediation of remediations) {
      const violation = violationMap.get(remediation.resourceId);
      if (violation) {
        const timeToRemediate = new Date(remediation.timestamp).getTime() -
          new Date(violation.timestamp).getTime();
        remediationTimes.push(timeToRemediate / 1000); // Convert to seconds
      }
    }

    // Calculate compliance trend
    const midPoint = new Date((new Date(start).getTime() + new Date(end).getTime()) / 2);
    const firstHalf = events.filter(e => new Date(e.timestamp) < midPoint);
    const secondHalf = events.filter(e => new Date(e.timestamp) >= midPoint);
    
    const firstHalfViolationRate = firstHalf.length > 0
      ? firstHalf.filter(e => e.eventType === 'VIOLATION').length / firstHalf.length
      : 0;
    const secondHalfViolationRate = secondHalf.length > 0
      ? secondHalf.filter(e => e.eventType === 'VIOLATION').length / secondHalf.length
      : 0;

    let complianceTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    if (secondHalfViolationRate < firstHalfViolationRate * 0.9) {
      complianceTrend = 'IMPROVING';
    } else if (secondHalfViolationRate > firstHalfViolationRate * 1.1) {
      complianceTrend = 'DEGRADING';
    } else {
      complianceTrend = 'STABLE';
    }

    // Top violating resources
    const resourceViolations = new Map<string, number>();
    for (const violation of violations) {
      resourceViolations.set(
        violation.resourceId,
        (resourceViolations.get(violation.resourceId) || 0) + 1
      );
    }

    const topViolatingResources = Array.from(resourceViolations.entries())
      .map(([resourceId, count]) => ({ resourceId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Severity distribution
    const severityDistribution: Record<string, number> = {};
    for (const event of events) {
      severityDistribution[event.severity] =
        (severityDistribution[event.severity] || 0) + 1;
    }

    return {
      controlId,
      frameworkId,
      timeRange: { start, end },
      metrics: {
        totalEvents: events.length,
        violationRate: events.length > 0 ? violations.length / events.length : 0,
        remediationRate: events.length > 0 ? remediations.length / events.length : 0,
        averageTimeToRemediate: remediationTimes.length > 0
          ? remediationTimes.reduce((a, b) => a + b, 0) / remediationTimes.length
          : 0,
        complianceTrend,
        severityDistribution,
        topViolatingResources,
      },
    };
  }

  private getEventKey(event: ComplianceEvent): string {
    const window = TimeWindowUtils.getTimeWindow(event.timestamp, 'minute');
    return `${window}:${event.controlId}:${event.frameworkId}:${event.eventType}`;
  }

  private startFlushInterval(): void {
    setInterval(() => {
      for (const key of this.eventBuffer.keys()) {
        if (this.eventBuffer.get(key)!.length > 0) {
          this.flushBuffer(key);
        }
      }
    }, this.config.flushInterval);
  }
}

// Example usage
export function demonstrateEventAggregation() {
  const aggregator = new EventAggregator({
    bufferSize: 100,
    flushInterval: 60000, // 1 minute
    rollupGranularities: ['minute', 'hour', 'day', 'month'],
  });

  // Listen to events
  aggregator.on('aggregated', (aggregated: AggregatedEvent) => {
    console.log('Aggregated event:', aggregated);
  });

  // Simulate events
  const now = new Date();
  for (let i = 0; i < 50; i++) {
    aggregator.addEvent({
      id: `event-${i}`,
      controlId: 'CC6.1',
      frameworkId: 'SOC2',
      timestamp: new Date(now.getTime() + i * 1000).toISOString(),
      eventType: i % 3 === 0 ? 'VIOLATION' : 'EVIDENCE_COLLECTED',
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][i % 4] as ComplianceEvent['severity'],
      resourceId: `resource-${i % 10}`,
      metadata: {},
    });
  }

  // Get rollups
  const rollups = aggregator.getRollups(
    'CC6.1',
    'SOC2',
    now.toISOString(),
    new Date(now.getTime() + 60000).toISOString(),
    'minute'
  );

  // Get control rollup
  const controlRollup = aggregator.getControlRollup(
    'CC6.1',
    'SOC2',
    now.toISOString(),
    new Date(now.getTime() + 60000).toISOString()
  );

  return { aggregator, rollups, controlRollup };
}

/**
 * Key Concepts Explained:
 * 
 * 1. Event Aggregation: Combine multiple events into single aggregated records.
 *    Reduces storage, improves query performance.
 * 
 * 2. Time-Based Rollup: Aggregate events into time windows (minute, hour, day, month).
 *    Enables efficient time-series queries at different granularities.
 * 
 * 3. Control-Level Rollup: Aggregate all events for a control to calculate
 *    compliance metrics, trends, and statistics.
 * 
 * 4. Multi-Granularity: Store rollups at multiple time granularities.
 *    Query appropriate granularity based on time range.
 * 
 * 5. Efficient Storage: Store aggregated data instead of raw events for
 *    historical queries. Keep raw events for recent data.
 * 
 * Interview Talking Points:
 * - Aggregation benefits: Reduced storage, faster queries, data summarization
 * - Time rollup strategy: Multiple granularities, query optimization
 * - Control rollup: Compliance metrics, trend analysis, resource insights
 * - Trade-offs: Storage vs query performance, granularity vs detail
 */

export { EventAggregator, TimeWindowUtils, AggregatedEvent, TimeBasedRollup, ControlLevelRollup };

