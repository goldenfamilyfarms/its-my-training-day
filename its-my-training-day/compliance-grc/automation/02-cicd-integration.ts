/**
 * Question: CI/CD Integration for Compliance Automation
 * 
 * Describe how you would integrate compliance automation with existing CI/CD pipelines.
 * This implementation demonstrates "shift left" compliance - catching violations before 
 * they reach production.
 * 
 * Key Technical Decisions:
 * - Pre-commit hooks for local validation
 * - PR/MR validation with policy gates
 * - Compliance scan stage in pipeline
 * - Deployment gating based on compliance score
 * - Feedback loop for compliance drift
 */

// Types
interface PipelineStage {
  name: string;
  type: 'build' | 'test' | 'compliance-scan' | 'deploy' | 'monitor';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'blocked';
  complianceScore?: number;
  violations?: ComplianceViolation[];
}

interface ComplianceViolation {
  resourceType: string;
  resourceId: string;
  controlId: string;
  framework: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  remediation: string;
}

interface ComplianceScanResult {
  passed: boolean;
  complianceScore: number;
  violations: ComplianceViolation[];
  scannedResources: number;
  scannedAt: string;
}

// Pre-Commit Hook Validator
class PreCommitValidator {
  constructor(private policyEngine: PolicyEngine) {}

  /**
   * Validate IaC templates before commit
   */
  async validateIaCTemplates(filePaths: string[]): Promise<ComplianceScanResult> {
    const violations: ComplianceViolation[] = [];

    for (const filePath of filePaths) {
      const content = await this.readFile(filePath);
      const resources = this.parseIaC(content, filePath);

      for (const resource of resources) {
        const result = await this.policyEngine.evaluateResource(resource);
        if (!result.passed) {
          violations.push(...result.violations);
        }
      }
    }

    const complianceScore = violations.length === 0 ? 100 : 
      Math.max(0, 100 - (violations.length * 10));

    return {
      passed: violations.length === 0,
      complianceScore,
      violations,
      scannedResources: filePaths.length,
      scannedAt: new Date().toISOString(),
    };
  }

  private async readFile(filePath: string): Promise<string> {
    // In production, would read actual file
    return '';
  }

  private parseIaC(content: string, filePath: string): unknown[] {
    // In production, would parse Terraform/CloudFormation/etc.
    return [];
  }
}

// PR/MR Validator
class PRValidator {
  constructor(
    private policyEngine: PolicyEngine,
    private gitService: GitService
  ) {}

  /**
   * Validate PR/MR changes for compliance
   */
  async validatePR(prId: string, baseBranch: string, headBranch: string): Promise<PRValidationResult> {
    const changes = await this.gitService.getDiff(baseBranch, headBranch);
    const violations: ComplianceViolation[] = [];

    for (const change of changes) {
      if (this.isIaCFile(change.path)) {
        const result = await this.validateChange(change);
        violations.push(...result.violations);
      }
    }

    const blockingViolations = violations.filter(
      v => v.severity === 'CRITICAL' || v.severity === 'HIGH'
    );

    return {
      prId,
      passed: blockingViolations.length === 0,
      violations,
      blockingViolations,
      comment: this.generatePRComment(violations),
      shouldBlock: blockingViolations.length > 0,
    };
  }

  private async validateChange(change: GitChange): Promise<{ violations: ComplianceViolation[] }> {
    // Parse and validate the changed resource
    const resource = this.parseResource(change.content);
    const result = await this.policyEngine.evaluateResource(resource);
    return { violations: result.violations };
  }

  private generatePRComment(violations: ComplianceViolation[]): string {
    if (violations.length === 0) {
      return '✅ All compliance checks passed';
    }

    let comment = `## Compliance Scan Results\n\n`;
    comment += `Found ${violations.length} compliance violation(s):\n\n`;

    for (const violation of violations) {
      comment += `### ${violation.severity}: ${violation.controlId}\n`;
      comment += `**Resource:** ${violation.resourceType} (${violation.resourceId})\n`;
      comment += `**Issue:** ${violation.message}\n`;
      comment += `**Remediation:** ${violation.remediation}\n\n`;
    }

    return comment;
  }

  private isIaCFile(path: string): boolean {
    return path.endsWith('.tf') || 
           path.endsWith('.tf.json') || 
           path.endsWith('.yaml') || 
           path.endsWith('.yml') ||
           path.includes('cloudformation');
  }

  private parseResource(content: string): unknown {
    // In production, would parse actual IaC
    return {};
  }
}

// Pipeline Compliance Gate
class ComplianceGate {
  constructor(
    private policyEngine: PolicyEngine,
    private config: ComplianceGateConfig
  ) {}

  /**
   * Evaluate if deployment should proceed based on compliance score
   */
  async evaluateGate(
    environment: string,
    scanResult: ComplianceScanResult
  ): Promise<GateDecision> {
    const threshold = this.config.thresholds[environment] || this.config.defaultThreshold;

    if (scanResult.complianceScore < threshold) {
      return {
        allowed: false,
        reason: `Compliance score ${scanResult.complianceScore}% is below threshold ${threshold}%`,
        violations: scanResult.violations,
        canProceedToStaging: environment !== 'production',
      };
    }

    // Check for critical violations
    const criticalViolations = scanResult.violations.filter(
      v => v.severity === 'CRITICAL'
    );

    if (criticalViolations.length > 0 && environment === 'production') {
      return {
        allowed: false,
        reason: `Found ${criticalViolations.length} critical violation(s)`,
        violations: criticalViolations,
        canProceedToStaging: true,
      };
    }

    return {
      allowed: true,
      reason: 'Compliance requirements met',
      violations: [],
    };
  }
}

interface ComplianceGateConfig {
  defaultThreshold: number;
  thresholds: Record<string, number>; // environment -> threshold
}

interface GateDecision {
  allowed: boolean;
  reason: string;
  violations: ComplianceViolation[];
  canProceedToStaging?: boolean;
}

// CI/CD Pipeline Integration
class CompliancePipelineIntegration {
  constructor(
    private preCommitValidator: PreCommitValidator,
    private prValidator: PRValidator,
    private complianceGate: ComplianceGate,
    private policyEngine: PolicyEngine
  ) {}

  /**
   * Run compliance scan stage in pipeline
   */
  async runComplianceScanStage(
    artifacts: PipelineArtifact[],
    environment: string
  ): Promise<PipelineStage> {
    const stage: PipelineStage = {
      name: 'compliance-scan',
      type: 'compliance-scan',
      status: 'running',
    };

    try {
      const violations: ComplianceViolation[] = [];

      // Scan all deployment artifacts
      for (const artifact of artifacts) {
        const resources = await this.extractResources(artifact);
        for (const resource of resources) {
          const result = await this.policyEngine.evaluateResource(resource);
          violations.push(...result.violations);
        }
      }

      const complianceScore = this.calculateScore(violations);
      const gateDecision = await this.complianceGate.evaluateGate(environment, {
        passed: violations.length === 0,
        complianceScore,
        violations,
        scannedResources: artifacts.length,
        scannedAt: new Date().toISOString(),
      });

      stage.status = gateDecision.allowed ? 'passed' : 'blocked';
      stage.complianceScore = complianceScore;
      stage.violations = violations;

      return stage;
    } catch (error) {
      stage.status = 'failed';
      throw error;
    }
  }

  private async extractResources(artifact: PipelineArtifact): Promise<unknown[]> {
    // In production, would extract resources from deployment artifacts
    return [];
  }

  private calculateScore(violations: ComplianceViolation[]): number {
    if (violations.length === 0) return 100;

    const weights = {
      CRITICAL: 20,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 2,
    };

    const totalWeight = violations.reduce(
      (sum, v) => sum + (weights[v.severity] || 0),
      0
    );

    return Math.max(0, 100 - totalWeight);
  }
}

// Compliance Drift Monitor
class ComplianceDriftMonitor {
  constructor(
    private complianceService: ComplianceService,
    private metricsService: MetricsService
  ) {}

  /**
   * Monitor compliance drift post-deployment
   */
  async monitorDrift(
    resourceId: string,
    deploymentTime: string
  ): Promise<DriftReport> {
    // Get compliance state at deployment
    const deploymentState = await this.complianceService.getStateAtTime(
      resourceId,
      new Date(deploymentTime)
    );

    // Get current compliance state
    const currentState = await this.complianceService.getCurrentState(resourceId);

    // Calculate drift
    const drift = this.calculateDrift(deploymentState, currentState);

    // Record metrics
    if (drift.hasDrift) {
      await this.metricsService.recordDrift({
        resourceId,
        deploymentTime,
        driftType: drift.driftType,
        severity: drift.severity,
      });
    }

    return drift;
  }

  private calculateDrift(
    deploymentState: ComplianceState,
    currentState: ComplianceState
  ): DriftReport {
    const newViolations = currentState.violations.filter(
      v => !deploymentState.violations.some(dv => dv.controlId === v.controlId)
    );

    return {
      hasDrift: newViolations.length > 0,
      driftType: newViolations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
      severity: newViolations.length > 0
        ? this.getMaxSeverity(newViolations)
        : 'NONE',
      newViolations,
      deploymentComplianceScore: deploymentState.complianceScore,
      currentComplianceScore: currentState.complianceScore,
    };
  }

  private getMaxSeverity(violations: ComplianceViolation[]): string {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    for (const severity of severities) {
      if (violations.some(v => v.severity === severity)) {
        return severity;
      }
    }
    return 'LOW';
  }
}

// Interfaces
interface PolicyEngine {
  evaluateResource(resource: unknown): Promise<{
    passed: boolean;
    violations: ComplianceViolation[];
  }>;
}

interface GitService {
  getDiff(base: string, head: string): Promise<GitChange[]>;
}

interface GitChange {
  path: string;
  content: string;
  type: 'added' | 'modified' | 'deleted';
}

interface PipelineArtifact {
  type: string;
  path: string;
  content: unknown;
}

interface PRValidationResult {
  prId: string;
  passed: boolean;
  violations: ComplianceViolation[];
  blockingViolations: ComplianceViolation[];
  comment: string;
  shouldBlock: boolean;
}

interface ComplianceState {
  resourceId: string;
  complianceScore: number;
  violations: ComplianceViolation[];
  timestamp: string;
}

interface DriftReport {
  hasDrift: boolean;
  driftType: 'COMPLIANT' | 'NON_COMPLIANT';
  severity: string;
  newViolations: ComplianceViolation[];
  deploymentComplianceScore: number;
  currentComplianceScore: number;
}

interface ComplianceService {
  getStateAtTime(resourceId: string, time: Date): Promise<ComplianceState>;
  getCurrentState(resourceId: string): Promise<ComplianceState>;
}

interface MetricsService {
  recordDrift(data: {
    resourceId: string;
    deploymentTime: string;
    driftType: string;
    severity: string;
  }): Promise<void>;
}

// Example GitLab CI Configuration
export const gitlabCIExample = `
# .compliance-ci.yml
compliance-scan:
  stage: compliance-scan
  image: compliance-scanner:latest
  script:
    - compliance-scanner scan --artifacts $CI_PROJECT_DIR
    - compliance-scanner report --format json --output compliance-report.json
  artifacts:
    reports:
      compliance: compliance-report.json
    paths:
      - compliance-report.json
  allow_failure: false
  only:
    - merge_requests
    - main
    - master

compliance-gate:
  stage: deploy
  image: compliance-gate:latest
  script:
    - compliance-gate evaluate --environment $CI_ENVIRONMENT_NAME --report compliance-report.json
  dependencies:
    - compliance-scan
  only:
    - main
    - master
`;

// Example Usage
export function demonstrateCICDIntegration() {
  // In production, would integrate with actual CI/CD systems
  console.log('CI/CD Integration demonstrated');
  return {
    preCommitValidator: new PreCommitValidator({} as PolicyEngine),
    prValidator: new PRValidator({} as PolicyEngine, {} as GitService),
    complianceGate: new ComplianceGate({} as PolicyEngine, {
      defaultThreshold: 95,
      thresholds: {
        production: 95,
        staging: 80,
        development: 70,
      },
    }),
  };
}

export {
  PreCommitValidator,
  PRValidator,
  ComplianceGate,
  CompliancePipelineIntegration,
  ComplianceDriftMonitor,
};

