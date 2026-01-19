/**
 * Interview Question 2: Node.js Stream Processing for Large Compliance Data
 * 
 * Implement a Node.js service that processes large compliance evidence files
 * using streams to handle files that don't fit in memory. The service should:
 * - Parse CSV/JSON evidence files line-by-line
 * - Validate and transform data on-the-fly
 * - Write results to database in batches
 * - Handle backpressure and errors gracefully
 * 
 * Key Technical Requirements:
 * - Use Node.js streams (Readable, Transform, Writable)
 * - Implement backpressure handling
 * - Batch database writes for efficiency
 * - Error handling and recovery
 * - Progress tracking
 */

import { Readable, Transform, Writable, pipeline } from 'stream';
import { promisify } from 'util';
import { createReadStream } from 'fs';

const pipelineAsync = promisify(pipeline);

// Types
interface EvidenceRecord {
  controlId: string;
  resourceId: string;
  collectedAt: string;
  data: Record<string, unknown>;
  hash: string;
}

interface ProcessedEvidence {
  controlId: string;
  resourceId: string;
  collectedAt: Date;
  data: Record<string, unknown>;
  hash: string;
  validated: boolean;
  errors?: string[];
}

// CSV Parser Transform Stream
class CSVParser extends Transform {
  private buffer: string = '';
  private headers: string[] = [];
  private isFirstLine: boolean = true;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    
    // Keep last incomplete line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') continue;

      if (this.isFirstLine) {
        this.headers = line.split(',').map(h => h.trim());
        this.isFirstLine = false;
        continue;
      }

      const values = line.split(',');
      const record: Record<string, string> = {};
      
      this.headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || '';
      });

      this.push(record);
    }

    callback();
  }

  _flush(callback: Function) {
    // Process remaining buffer
    if (this.buffer.trim() && !this.isFirstLine) {
      const values = this.buffer.split(',');
      const record: Record<string, string> = {};
      
      this.headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || '';
      });

      this.push(record);
    }
    callback();
  }
}

// Evidence Validator Transform Stream
class EvidenceValidator extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(record: Record<string, string>, encoding: string, callback: Function) {
    const errors: string[] = [];
    
    // Validate required fields
    if (!record.controlId) {
      errors.push('Missing controlId');
    }
    if (!record.resourceId) {
      errors.push('Missing resourceId');
    }
    if (!record.collectedAt) {
      errors.push('Missing collectedAt');
    }

    // Validate date format
    const collectedAt = new Date(record.collectedAt);
    if (isNaN(collectedAt.getTime())) {
      errors.push('Invalid date format');
    }

    // Parse JSON data
    let data: Record<string, unknown> = {};
    if (record.data) {
      try {
        data = JSON.parse(record.data);
      } catch (e) {
        errors.push('Invalid JSON data');
      }
    }

    // Calculate hash
    const hash = this.calculateHash(record);

    const processed: ProcessedEvidence = {
      controlId: record.controlId,
      resourceId: record.resourceId,
      collectedAt,
      data,
      hash,
      validated: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };

    this.push(processed);
    callback();
  }

  private calculateHash(record: Record<string, string>): string {
    const crypto = require('crypto');
    const data = `${record.controlId}:${record.resourceId}:${record.collectedAt}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Batch Writer Writable Stream
class BatchWriter extends Writable {
  private batch: ProcessedEvidence[] = [];
  private batchSize: number;
  private totalProcessed: number = 0;
  private totalErrors: number = 0;

  constructor(batchSize: number = 100) {
    super({ objectMode: true });
    this.batchSize = batchSize;
  }

  async _write(chunk: ProcessedEvidence, encoding: string, callback: Function) {
    this.batch.push(chunk);
    
    if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }

    callback();
  }

  async _final(callback: Function) {
    // Flush remaining items
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
    
    console.log(`Processing complete: ${this.totalProcessed} processed, ${this.totalErrors} errors`);
    callback();
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const batch = [...this.batch];
    this.batch = [];

    try {
      // Simulate database batch insert
      await this.insertBatch(batch);
      
      const validCount = batch.filter(e => e.validated).length;
      const errorCount = batch.length - validCount;
      
      this.totalProcessed += batch.length;
      this.totalErrors += errorCount;

      console.log(`Batch written: ${batch.length} records (${validCount} valid, ${errorCount} errors)`);
    } catch (error) {
      console.error('Batch insert failed:', error);
      // Could implement retry logic here
      throw error;
    }
  }

  private async insertBatch(batch: ProcessedEvidence[]): Promise<void> {
    // Simulate database insert with delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, would use actual database client:
    // await db.evidence.insertMany(batch.map(e => ({
    //   controlId: e.controlId,
    //   resourceId: e.resourceId,
    //   collectedAt: e.collectedAt,
    //   data: e.data,
    //   hash: e.hash,
    //   validated: e.validated,
    //   errors: e.errors,
    // })));
  }

  getStats() {
    return {
      totalProcessed: this.totalProcessed,
      totalErrors: this.totalErrors,
    };
  }
}

// Progress Tracker Transform Stream
class ProgressTracker extends Transform {
  private count: number = 0;
  private startTime: number = Date.now();

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: ProcessedEvidence, encoding: string, callback: Function) {
    this.count++;
    
    if (this.count % 1000 === 0) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const rate = this.count / elapsed;
      console.log(`Progress: ${this.count} records processed (${rate.toFixed(2)} records/sec)`);
    }

    this.push(chunk);
    callback();
  }
}

// Main processing function
export async function processEvidenceFile(filePath: string): Promise<void> {
  const fileStream = createReadStream(filePath, { encoding: 'utf8' });
  const csvParser = new CSVParser();
  const validator = new EvidenceValidator();
  const progressTracker = new ProgressTracker();
  const batchWriter = new BatchWriter(100);

  try {
    await pipelineAsync(
      fileStream,
      csvParser,
      validator,
      progressTracker,
      batchWriter
    );

    const stats = batchWriter.getStats();
    console.log('Final stats:', stats);
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Error handling wrapper
export async function processEvidenceFileWithRetry(
  filePath: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processEvidenceFile(filePath);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Processing failed after retries');
}

/**
 * Key Concepts Explained:
 * 
 * 1. Streams: Process data in chunks, don't load entire file into memory.
 *    Essential for large files (GB+).
 * 
 * 2. Transform Streams: Process data as it flows through the pipeline.
 *    Each transform can modify, filter, or validate data.
 * 
 * 3. Backpressure: Streams automatically handle backpressure - if downstream
 *    is slow, upstream pauses. No manual buffer management needed.
 * 
 * 4. Pipeline: Composes multiple streams together, handles errors, and ensures
 *    proper cleanup. Better than manual pipe() chains.
 * 
 * 5. Object Mode: Streams can work with objects, not just buffers. Enables
 *    type-safe stream processing.
 * 
 * Interview Talking Points:
 * - Why streams? Memory efficiency, can handle files larger than RAM
 * - Backpressure: Automatic flow control, prevents memory issues
 * - Pipeline vs manual: Better error handling, automatic cleanup
 * - Batch writing: Reduces database round trips, improves performance
 */

export { CSVParser, EvidenceValidator, BatchWriter, ProgressTracker };

