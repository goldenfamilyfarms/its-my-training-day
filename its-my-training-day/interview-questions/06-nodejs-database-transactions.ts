/**
 * Interview Question 6: Database Transactions and Consistency in Node.js
 * 
 * Implement a Node.js service that handles complex compliance data updates
 * using database transactions to ensure data consistency and atomicity.
 * Demonstrate:
 * - Transaction management with rollback on errors
 * - Retry logic with exponential backoff
 * - Deadlock detection and handling
 * - Transaction isolation levels
 * - Optimistic locking for concurrent updates
 * 
 * Key Technical Requirements:
 * - Atomic multi-table updates
 * - Proper error handling and rollback
 * - Retry mechanism for transient failures
 * - Conflict resolution strategies
 */

import { EventEmitter } from 'events';

// Types
interface ComplianceUpdate {
  controlId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  evidenceIds: string[];
  metadata: Record<string, unknown>;
}

interface TransactionResult {
  success: boolean;
  controlId: string;
  version: number;
  error?: string;
}

// Database interface (simplified - would use actual DB client)
interface DatabaseConnection {
  beginTransaction(): Promise<Transaction>;
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
}

interface Transaction {
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Transaction Manager
class TransactionManager extends EventEmitter {
  private maxRetries: number;
  private retryDelay: number;
  private isolationLevel: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';

  constructor(
    private db: DatabaseConnection,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      isolationLevel?: TransactionManager['isolationLevel'];
    } = {}
  ) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.isolationLevel = options.isolationLevel || 'READ_COMMITTED';
  }

  async executeInTransaction<T>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const tx = await this.db.beginTransaction();

      try {
        // Set isolation level
        await tx.query(`SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel}`);

        const result = await callback(tx);
        await tx.commit();
        
        this.emit('transaction-success', { attempt });
        return result;
      } catch (error) {
        await tx.rollback();
        lastError = error as Error;

        // Check if error is retryable
        if (this.isRetryableError(error as Error) && attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.emit('transaction-retry', { attempt, error, delay });
          await this.sleep(delay);
          continue;
        }

        // Not retryable or max retries exceeded
        this.emit('transaction-failure', { attempt, error });
        throw error;
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  private isRetryableError(error: Error): boolean {
    // Check for deadlock, timeout, or connection errors
    const retryableMessages = [
      'deadlock',
      'timeout',
      'connection',
      'ECONNRESET',
      'ETIMEDOUT',
    ];

    return retryableMessages.some(msg =>
      error.message.toLowerCase().includes(msg)
    );
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
    return baseDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Optimistic Locking Manager
class OptimisticLockManager {
  private versionCache: Map<string, number> = new Map();

  async checkVersion(controlId: string, expectedVersion: number): Promise<boolean> {
    // In production, would query database
    const currentVersion = this.versionCache.get(controlId) || 0;
    return currentVersion === expectedVersion;
  }

  async incrementVersion(controlId: string): Promise<number> {
    const currentVersion = this.versionCache.get(controlId) || 0;
    const newVersion = currentVersion + 1;
    this.versionCache.set(controlId, newVersion);
    return newVersion;
  }

  getVersion(controlId: string): number {
    return this.versionCache.get(controlId) || 0;
  }
}

// Compliance Update Service
class ComplianceUpdateService {
  constructor(
    private txManager: TransactionManager,
    private lockManager: OptimisticLockManager
  ) {}

  async updateCompliance(update: ComplianceUpdate): Promise<TransactionResult> {
    return this.txManager.executeInTransaction(async (tx) => {
      // 1. Check optimistic lock
      const currentVersion = this.lockManager.getVersion(update.controlId);
      const expectedVersion = (update.metadata.version as number) || currentVersion;

      if (!(await this.lockManager.checkVersion(update.controlId, expectedVersion))) {
        throw new Error('Version conflict: control was modified by another transaction');
      }

      // 2. Update control status
      await tx.query(
        'UPDATE controls SET status = $1, updated_at = NOW() WHERE id = $2',
        [update.status, update.controlId]
      );

      // 3. Link evidence
      for (const evidenceId of update.evidenceIds) {
        await tx.query(
          'INSERT INTO control_evidence (control_id, evidence_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [update.controlId, evidenceId]
        );
      }

      // 4. Update metadata
      await tx.query(
        'UPDATE controls SET metadata = $1 WHERE id = $2',
        [JSON.stringify(update.metadata), update.controlId]
      );

      // 5. Increment version
      const newVersion = await this.lockManager.incrementVersion(update.controlId);

      // 6. Log audit trail
      await tx.query(
        'INSERT INTO audit_log (control_id, action, old_status, new_status, version) VALUES ($1, $2, $3, $4, $5)',
        [update.controlId, 'UPDATE', 'UNKNOWN', update.status, newVersion]
      );

      return {
        success: true,
        controlId: update.controlId,
        version: newVersion,
      };
    });
  }

  async batchUpdateCompliance(updates: ComplianceUpdate[]): Promise<TransactionResult[]> {
    return this.txManager.executeInTransaction(async (tx) => {
      const results: TransactionResult[] = [];

      for (const update of updates) {
        try {
          // Similar logic as single update, but in same transaction
          const currentVersion = this.lockManager.getVersion(update.controlId);
          const expectedVersion = (update.metadata.version as number) || currentVersion;

          if (!(await this.lockManager.checkVersion(update.controlId, expectedVersion))) {
            results.push({
              success: false,
              controlId: update.controlId,
              version: currentVersion,
              error: 'Version conflict',
            });
            continue;
          }

          await tx.query(
            'UPDATE controls SET status = $1, updated_at = NOW() WHERE id = $2',
            [update.status, update.controlId]
          );

          const newVersion = await this.lockManager.incrementVersion(update.controlId);
          results.push({
            success: true,
            controlId: update.controlId,
            version: newVersion,
          });
        } catch (error) {
          results.push({
            success: false,
            controlId: update.controlId,
            version: this.lockManager.getVersion(update.controlId),
            error: (error as Error).message,
          });
        }
      }

      return results;
    });
  }
}

// Mock database implementation
class MockDatabase implements DatabaseConnection {
  private transactions: Transaction[] = [];

  async beginTransaction(): Promise<Transaction> {
    const tx = new MockTransaction();
    this.transactions.push(tx);
    return tx;
  }

  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    return [];
  }
}

class MockTransaction implements Transaction {
  private queries: Array<{ sql: string; params?: unknown[] }> = [];
  private committed = false;

  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    this.queries.push({ sql, params });
    return [];
  }

  async commit(): Promise<void> {
    this.committed = true;
  }

  async rollback(): Promise<void> {
    this.queries = [];
  }
}

// Example usage
export async function demonstrateTransactions() {
  const db = new MockDatabase();
  const txManager = new TransactionManager(db, {
    maxRetries: 3,
    retryDelay: 1000,
    isolationLevel: 'READ_COMMITTED',
  });

  const lockManager = new OptimisticLockManager();
  const service = new ComplianceUpdateService(txManager, lockManager);

  // Listen to transaction events
  txManager.on('transaction-success', ({ attempt }) => {
    console.log(`Transaction succeeded on attempt ${attempt}`);
  });

  txManager.on('transaction-retry', ({ attempt, error, delay }) => {
    console.log(`Retrying transaction (attempt ${attempt}) after ${delay}ms:`, error.message);
  });

  // Single update
  const result = await service.updateCompliance({
    controlId: 'control-1',
    status: 'COMPLIANT',
    evidenceIds: ['evidence-1', 'evidence-2'],
    metadata: { version: 0, updatedBy: 'user-1' },
  });

  console.log('Update result:', result);

  return { service, txManager, lockManager };
}

/**
 * Key Concepts Explained:
 * 
 * 1. Transactions: Ensure atomicity - all operations succeed or all fail.
 *    Prevents partial updates and data inconsistency.
 * 
 * 2. Isolation Levels: Control how transactions see each other's changes.
 *    READ_COMMITTED prevents dirty reads, SERIALIZABLE prevents all anomalies.
 * 
 * 3. Optimistic Locking: Check version before update, fail if changed.
 *    Better for low contention, avoids deadlocks.
 * 
 * 4. Retry Logic: Handle transient failures (deadlocks, timeouts).
 *    Exponential backoff prevents thundering herd.
 * 
 * 5. Batch Updates: Multiple updates in single transaction for consistency.
 * 
 * Interview Talking Points:
 * - Transaction benefits: Atomicity, consistency, isolation
 * - Isolation levels: Trade-off between consistency and performance
 * - Optimistic vs pessimistic locking: When to use each
 * - Retry strategy: Exponential backoff, jitter, max retries
 */

export { TransactionManager, OptimisticLockManager, ComplianceUpdateService };

