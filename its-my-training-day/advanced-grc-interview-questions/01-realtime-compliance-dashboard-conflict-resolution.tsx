/**
 * ADVANCED QUESTION 1: Real-Time Compliance Dashboard with Conflict Resolution
 *
 * PROBLEM:
 * Build a real-time compliance monitoring dashboard where multiple compliance officers
 * can simultaneously update control statuses. Implement CRDT-based conflict resolution
 * to handle concurrent updates without losing data or creating inconsistencies.
 *
 * SCENARIO:
 * - Officer A marks control AC-1 as "Pass" at 10:00:00
 * - Officer B marks control AC-1 as "Fail" at 10:00:01
 * - Both updates happen before either officer's UI refreshes
 * - System must resolve conflict without data loss
 *
 * KEY CONCEPTS:
 * - Conflict-free Replicated Data Types (CRDT)
 * - Operational Transformation (OT)
 * - Last-Write-Wins (LWW) with Vector Clocks
 * - Optimistic UI with conflict detection
 * - WebSocket real-time sync
 *
 * INTERVIEW TALKING POINTS:
 * - Why CRDT over traditional locking?
 * - Trade-offs: Eventual consistency vs strong consistency
 * - How to handle complex conflicts (not just last-write-wins)
 * - Performance implications of conflict resolution
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ComplianceControl {
  id: string;
  controlId: string; // e.g., "AC-1", "AC-2"
  status: 'pass' | 'fail' | 'not_applicable' | 'pending';
  evidence: string;
  lastModified: number;
  modifiedBy: string;
  version: VectorClock; // For conflict detection
}

// Vector Clock for causality tracking
interface VectorClock {
  [userId: string]: number;
}

interface LocalUpdate {
  id: string;
  operation: 'update_status' | 'update_evidence';
  data: Partial<ComplianceControl>;
  timestamp: number;
  userId: string;
  localVersion: VectorClock;
}

interface RemoteUpdate extends LocalUpdate {
  serverVersion: VectorClock;
}

interface ConflictInfo {
  controlId: string;
  localValue: Partial<ComplianceControl>;
  remoteValue: Partial<ComplianceControl>;
  resolvedValue: Partial<ComplianceControl>;
  strategy: 'LWW' | 'manual' | 'merge';
}

// ============================================================================
// VECTOR CLOCK UTILITIES
// ============================================================================

function incrementVectorClock(clock: VectorClock, userId: string): VectorClock {
  return {
    ...clock,
    [userId]: (clock[userId] || 0) + 1,
  };
}

function compareVectorClocks(
  a: VectorClock,
  b: VectorClock
): 'before' | 'after' | 'concurrent' {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aBefore = false;
  let aAfter = false;

  for (const key of allKeys) {
    const aVal = a[key] || 0;
    const bVal = b[key] || 0;

    if (aVal < bVal) aBefore = true;
    if (aVal > bVal) aAfter = true;
  }

  if (aBefore && !aAfter) return 'before';
  if (aAfter && !aBefore) return 'after';
  return 'concurrent'; // Conflict!
}

function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged: VectorClock = {};

  for (const key of allKeys) {
    merged[key] = Math.max(a[key] || 0, b[key] || 0);
  }

  return merged;
}

// ============================================================================
// CONFLICT RESOLUTION STRATEGIES
// ============================================================================

class ConflictResolver {
  /**
   * Last-Write-Wins (LWW) strategy
   * Uses timestamp as tiebreaker when vector clocks show concurrent updates
   */
  static lastWriteWins(
    local: LocalUpdate,
    remote: RemoteUpdate
  ): RemoteUpdate {
    const comparison = compareVectorClocks(
      local.localVersion,
      remote.serverVersion
    );

    if (comparison === 'after') {
      // Local is newer, keep local
      return {
        ...local,
        serverVersion: incrementVectorClock(local.localVersion, local.userId),
      };
    }

    if (comparison === 'before') {
      // Remote is newer, use remote
      return remote;
    }

    // Concurrent updates - use timestamp as tiebreaker
    if (local.timestamp > remote.timestamp) {
      return {
        ...local,
        serverVersion: incrementVectorClock(local.localVersion, local.userId),
      };
    }

    return remote;
  }

  /**
   * Field-level merge strategy
   * Different fields can be updated independently without conflict
   */
  static fieldLevelMerge(
    local: Partial<ComplianceControl>,
    remote: Partial<ComplianceControl>,
    localVersion: VectorClock,
    remoteVersion: VectorClock
  ): { merged: Partial<ComplianceControl>; hasConflict: boolean } {
    const merged: Partial<ComplianceControl> = {};
    let hasConflict = false;

    const fields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of fields) {
      if (local[field] === remote[field]) {
        merged[field] = local[field];
      } else if (local[field] && !remote[field]) {
        merged[field] = local[field];
      } else if (!local[field] && remote[field]) {
        merged[field] = remote[field];
      } else {
        // True conflict - both modified same field
        hasConflict = true;

        // Use vector clock to decide
        const comparison = compareVectorClocks(localVersion, remoteVersion);
        if (comparison === 'after') {
          merged[field] = local[field];
        } else if (comparison === 'before') {
          merged[field] = remote[field];
        } else {
          // Concurrent - use business logic
          merged[field] = remote[field]; // Server wins for now
        }
      }
    }

    return { merged, hasConflict };
  }
}

// ============================================================================
// WEBSOCKET SYNC MANAGER
// ============================================================================

class ComplianceSyncManager {
  private ws: WebSocket | null = null;
  private messageQueue: LocalUpdate[] = [];
  private pendingUpdates: Map<string, LocalUpdate> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    private url: string,
    private onRemoteUpdate: (update: RemoteUpdate) => void,
    private onConflict: (conflict: ConflictInfo) => void,
    private getCurrentUserId: () => string
  ) {}

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[Sync] Connected to compliance server');
      this.reconnectAttempts = 0;

      // Send queued messages
      while (this.messageQueue.length > 0) {
        const update = this.messageQueue.shift()!;
        this.sendUpdate(update);
      }
    };

    this.ws.onmessage = (event) => {
      const update: RemoteUpdate = JSON.parse(event.data);
      this.handleRemoteUpdate(update);
    };

    this.ws.onerror = (error) => {
      console.error('[Sync] WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('[Sync] Connection closed, attempting reconnect...');
      this.reconnect();
    };
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Sync] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(
        `[Sync] Reconnecting... (attempt ${this.reconnectAttempts})`
      );
      this.connect();
    }, delay);
  }

  sendUpdate(update: LocalUpdate): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(update));
      this.pendingUpdates.set(update.id, update);
    } else {
      // Queue for later
      this.messageQueue.push(update);
    }
  }

  private handleRemoteUpdate(remoteUpdate: RemoteUpdate): void {
    const pendingUpdate = this.pendingUpdates.get(remoteUpdate.id);

    if (pendingUpdate) {
      // This is acknowledgment of our update
      this.pendingUpdates.delete(remoteUpdate.id);

      // Check for conflicts
      const comparison = compareVectorClocks(
        pendingUpdate.localVersion,
        remoteUpdate.serverVersion
      );

      if (comparison === 'concurrent') {
        // Conflict detected!
        const resolved = ConflictResolver.lastWriteWins(
          pendingUpdate,
          remoteUpdate
        );

        this.onConflict({
          controlId: remoteUpdate.data.controlId!,
          localValue: pendingUpdate.data,
          remoteValue: remoteUpdate.data,
          resolvedValue: resolved.data,
          strategy: 'LWW',
        });

        this.onRemoteUpdate(resolved);
      } else {
        // No conflict
        this.onRemoteUpdate(remoteUpdate);
      }
    } else {
      // Update from another user
      this.onRemoteUpdate(remoteUpdate);
    }
  }

  disconnect(): void {
    this.ws?.close();
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

function ComplianceDashboardWithCRDT() {
  const [controls, setControls] = useState<Map<string, ComplianceControl>>(
    new Map()
  );
  const [vectorClock, setVectorClock] = useState<VectorClock>({});
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [currentUserId] = useState('user-' + Math.random().toString(36).substr(2, 9));

  const syncManagerRef = useRef<ComplianceSyncManager | null>(null);

  // Initialize WebSocket sync
  useEffect(() => {
    syncManagerRef.current = new ComplianceSyncManager(
      'ws://localhost:8080/compliance-sync',
      handleRemoteUpdate,
      handleConflict,
      () => currentUserId
    );

    syncManagerRef.current.connect();

    return () => {
      syncManagerRef.current?.disconnect();
    };
  }, [currentUserId]);

  // Handle remote updates
  const handleRemoteUpdate = useCallback((update: RemoteUpdate) => {
    setControls((prev) => {
      const newControls = new Map(prev);
      const existing = newControls.get(update.data.controlId!);

      if (existing) {
        newControls.set(update.data.controlId!, {
          ...existing,
          ...update.data,
          version: update.serverVersion,
        });
      } else {
        newControls.set(update.data.controlId!, {
          id: update.id,
          controlId: update.data.controlId!,
          status: update.data.status!,
          evidence: update.data.evidence || '',
          lastModified: update.timestamp,
          modifiedBy: update.userId,
          version: update.serverVersion,
        });
      }

      return newControls;
    });

    setVectorClock(update.serverVersion);
  }, []);

  // Handle conflicts
  const handleConflict = useCallback((conflict: ConflictInfo) => {
    setConflicts((prev) => [...prev, conflict]);

    // Auto-dismiss conflict notification after 5 seconds
    setTimeout(() => {
      setConflicts((prev) => prev.filter((c) => c !== conflict));
    }, 5000);
  }, []);

  // Local update (optimistic)
  const updateControlStatus = useCallback(
    (controlId: string, newStatus: ComplianceControl['status']) => {
      const control = controls.get(controlId);
      if (!control) return;

      // Increment local vector clock
      const newVectorClock = incrementVectorClock(vectorClock, currentUserId);

      // Optimistic update
      const update: LocalUpdate = {
        id: `update-${Date.now()}-${Math.random()}`,
        operation: 'update_status',
        data: {
          controlId,
          status: newStatus,
          lastModified: Date.now(),
          modifiedBy: currentUserId,
        },
        timestamp: Date.now(),
        userId: currentUserId,
        localVersion: newVectorClock,
      };

      // Update local state immediately (optimistic)
      setControls((prev) => {
        const newControls = new Map(prev);
        newControls.set(controlId, {
          ...control,
          status: newStatus,
          lastModified: update.timestamp,
          modifiedBy: currentUserId,
          version: newVectorClock,
        });
        return newControls;
      });

      setVectorClock(newVectorClock);

      // Send to server
      syncManagerRef.current?.sendUpdate(update);
    },
    [controls, vectorClock, currentUserId]
  );

  return (
    <div className="compliance-dashboard">
      <h1>Real-Time Compliance Dashboard</h1>
      <p>User: {currentUserId}</p>

      {/* Conflict notifications */}
      {conflicts.length > 0 && (
        <div className="conflict-notifications">
          {conflicts.map((conflict, index) => (
            <div key={index} className="conflict-alert">
              <strong>Conflict Detected:</strong> Control {conflict.controlId}
              <br />
              Your change: {JSON.stringify(conflict.localValue)}
              <br />
              Remote change: {JSON.stringify(conflict.remoteValue)}
              <br />
              Resolved to: {JSON.stringify(conflict.resolvedValue)} (
              {conflict.strategy})
            </div>
          ))}
        </div>
      )}

      {/* Controls table */}
      <table className="controls-table">
        <thead>
          <tr>
            <th>Control ID</th>
            <th>Status</th>
            <th>Last Modified</th>
            <th>Modified By</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(controls.values()).map((control) => (
            <tr key={control.id}>
              <td>{control.controlId}</td>
              <td>
                <span className={`status-badge status-${control.status}`}>
                  {control.status}
                </span>
              </td>
              <td>{new Date(control.lastModified).toLocaleTimeString()}</td>
              <td>{control.modifiedBy}</td>
              <td>
                <code>{JSON.stringify(control.version)}</code>
              </td>
              <td>
                <button
                  onClick={() => updateControlStatus(control.controlId, 'pass')}
                >
                  Pass
                </button>
                <button
                  onClick={() => updateControlStatus(control.controlId, 'fail')}
                >
                  Fail
                </button>
                <button
                  onClick={() =>
                    updateControlStatus(control.controlId, 'pending')
                  }
                >
                  Pending
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ComplianceDashboardWithCRDT;

/**
 * INTERVIEW DISCUSSION POINTS:
 *
 * 1. Why CRDT/Vector Clocks?
 *    - Allows offline-first: Users can work without connectivity
 *    - Automatic conflict detection: Know when concurrent edits happen
 *    - Causality tracking: Know which edit happened "before" another
 *
 * 2. Alternative Approaches:
 *    - Optimistic locking: Simpler but requires online connectivity
 *    - Pessimistic locking: Prevents conflicts but poor UX (locks controls)
 *    - OT (Operational Transformation): Good for text, complex for structured data
 *
 * 3. Trade-offs:
 *    - ✅ Handles offline scenarios
 *    - ✅ No server-side locking needed
 *    - ❌ Eventual consistency (not strong consistency)
 *    - ❌ Vector clock overhead (grows with users)
 *    - ❌ Complex conflict resolution logic
 *
 * 4. Production Considerations:
 *    - Vector clock garbage collection (remove inactive users)
 *    - Conflict resolution strategies per field type
 *    - Audit trail of conflicts and resolutions
 *    - Monitoring conflict rates (high rate = UX problem)
 *
 * 5. When to Use:
 *    ✅ Collaborative editing
 *    ✅ Offline-first applications
 *    ✅ High-latency environments
 *    ❌ Financial transactions (need strong consistency)
 *    ❌ Single-user applications (overkill)
 */
