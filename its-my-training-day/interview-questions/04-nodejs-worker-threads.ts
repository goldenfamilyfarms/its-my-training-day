/**
 * Interview Question 4: Node.js Worker Threads for CPU-Intensive Compliance Calculations
 * 
 * Implement a Node.js service that uses worker threads to perform CPU-intensive
 * compliance calculations (risk scoring, control correlation analysis) without
 * blocking the main event loop.
 * 
 * Key Technical Requirements:
 * - Use worker_threads module for parallel processing
 * - Implement a worker pool for efficient resource management
 * - Handle task queuing and load balancing
 * - Proper error handling and worker lifecycle management
 * - Progress reporting and cancellation support
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import { cpus } from 'os';

// Types
interface ComplianceCalculation {
  id: string;
  type: 'RISK_SCORE' | 'CONTROL_CORRELATION' | 'EVIDENCE_ANALYSIS';
  data: unknown;
}

interface CalculationResult {
  id: string;
  result: unknown;
  duration: number;
  success: boolean;
  error?: string;
}

interface WorkerTask {
  id: string;
  calculation: ComplianceCalculation;
  resolve: (result: CalculationResult) => void;
  reject: (error: Error) => void;
  startTime: number;
}

// Worker Pool Manager
class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private maxWorkers: number;

  constructor(maxWorkers: number = cpus().length) {
    super();
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): Worker {
    const worker = new Worker(__filename, {
      workerData: { isWorker: true },
    });

    worker.on('message', (result: CalculationResult) => {
      this.handleWorkerMessage(worker, result);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(worker, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
        // Replace dead worker
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    return worker;
  }

  private replaceWorker(deadWorker: Worker): void {
    const index = this.workers.indexOf(deadWorker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
    
    const availableIndex = this.availableWorkers.indexOf(deadWorker);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }

    // Remove any active tasks for this worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (task.calculation.id === deadWorker.threadId.toString()) {
        this.activeTasks.delete(taskId);
        task.reject(new Error('Worker died'));
      }
    }

    // Create replacement worker
    this.createWorker();
  }

  private handleWorkerMessage(worker: Worker, result: CalculationResult): void {
    const task = this.activeTasks.get(result.id);
    if (!task) {
      console.warn(`Received result for unknown task: ${result.id}`);
      return;
    }

    this.activeTasks.delete(result.id);
    this.availableWorkers.push(worker);
    task.resolve(result);
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, error: Error): void {
    // Find task for this worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (task.calculation.id === worker.threadId.toString()) {
        this.activeTasks.delete(taskId);
        task.reject(error);
        break;
      }
    }

    this.replaceWorker(worker);
    this.processQueue();
  }

  async execute(calculation: ComplianceCalculation): Promise<CalculationResult> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: calculation.id,
        calculation,
        resolve,
        reject,
        startTime: Date.now(),
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;

      this.activeTasks.set(task.id, task);
      worker.postMessage(task.calculation);
    }
  }

  async shutdown(): Promise<void> {
    // Wait for active tasks to complete
    const activePromises = Array.from(this.activeTasks.values()).map(
      task => Promise.race([
        new Promise(resolve => task.resolve = resolve),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ])
    );

    await Promise.allSettled(activePromises);

    // Terminate all workers
    await Promise.all(
      this.workers.map(worker => worker.terminate())
    );

    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
    };
  }
}

// CPU-intensive calculation functions
function calculateRiskScore(data: unknown): number {
  // Simulate complex risk calculation
  let score = 0;
  for (let i = 0; i < 10000000; i++) {
    score += Math.sqrt(i) * Math.random();
  }
  return score / 10000000;
}

function analyzeControlCorrelation(data: unknown): Record<string, number> {
  // Simulate correlation analysis
  const correlations: Record<string, number> = {};
  for (let i = 0; i < 1000000; i++) {
    const key = `control-${i % 100}`;
    correlations[key] = (correlations[key] || 0) + Math.random();
  }
  return correlations;
}

function analyzeEvidence(data: unknown): { confidence: number; anomalies: string[] } {
  // Simulate evidence analysis
  let confidence = 0;
  for (let i = 0; i < 5000000; i++) {
    confidence += Math.random();
  }
  confidence = confidence / 5000000;

  return {
    confidence,
    anomalies: ['anomaly-1', 'anomaly-2'],
  };
}

// Worker thread code
if (!isMainThread && workerData?.isWorker) {
  parentPort?.on('message', async (calculation: ComplianceCalculation) => {
    const startTime = Date.now();
    
    try {
      let result: unknown;

      switch (calculation.type) {
        case 'RISK_SCORE':
          result = calculateRiskScore(calculation.data);
          break;
        case 'CONTROL_CORRELATION':
          result = analyzeControlCorrelation(calculation.data);
          break;
        case 'EVIDENCE_ANALYSIS':
          result = analyzeEvidence(calculation.data);
          break;
        default:
          throw new Error(`Unknown calculation type: ${calculation.type}`);
      }

      const calculationResult: CalculationResult = {
        id: calculation.id,
        result,
        duration: Date.now() - startTime,
        success: true,
      };

      parentPort?.postMessage(calculationResult);
    } catch (error) {
      const calculationResult: CalculationResult = {
        id: calculation.id,
        result: null,
        duration: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };

      parentPort?.postMessage(calculationResult);
    }
  });
}

// Main thread exports
if (isMainThread) {
  let workerPool: WorkerPool | null = null;

  export function getWorkerPool(): WorkerPool {
    if (!workerPool) {
      workerPool = new WorkerPool();
    }
    return workerPool;
  }

  export async function calculateCompliance(
    calculation: ComplianceCalculation
  ): Promise<CalculationResult> {
    const pool = getWorkerPool();
    return pool.execute(calculation);
  }

  export async function shutdownWorkerPool(): Promise<void> {
    if (workerPool) {
      await workerPool.shutdown();
      workerPool = null;
    }
  }

  export function getPoolStats() {
    return workerPool?.getStats() || null;
  }
}

/**
 * Key Concepts Explained:
 * 
 * 1. Worker Threads: Separate V8 instances that run in parallel. Share memory
 *    via SharedArrayBuffer or message passing. Don't block main thread.
 * 
 * 2. Worker Pool: Reuse workers instead of creating new ones for each task.
 *    More efficient than spawning workers on-demand.
 * 
 * 3. Task Queue: Queue tasks when all workers are busy. Process queue as
 *    workers become available.
 * 
 * 4. Error Handling: Handle worker crashes, replace dead workers, retry tasks.
 * 
 * 5. Lifecycle Management: Properly shutdown workers, wait for active tasks,
 *    cleanup resources.
 * 
 * Interview Talking Points:
 * - When to use workers: CPU-intensive tasks, don't block event loop
 * - Worker pool benefits: Reuse workers, better resource management
 * - Message passing: Serialization overhead, use SharedArrayBuffer for large data
 * - Error handling: Worker crashes, task retries, graceful degradation
 */

export { WorkerPool };

