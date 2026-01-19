/**
 * Question: Building a Compliance Rule Engine in Node.js
 * 
 * Design a rule engine that evaluates compliance controls against configurable rules.
 * Rules can be simple (single condition) or complex (Boolean combinations).
 * Structured for maintainability and performance.
 * 
 * Key Technical Decisions:
 * - JSON-based DSL for rule definition
 * - Pre-compilation for performance
 * - Batch evaluation with concurrency control
 * - Rule validation and testing framework
 */

// Types
interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  frameworkMappings: FrameworkMapping[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  condition: RuleCondition;
  remediation: RemediationConfig;
  metadata: Record<string, unknown>;
}

interface FrameworkMapping {
  framework: 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';
  controlId: string;
}

interface RemediationConfig {
  type: 'automatic' | 'manual' | 'approval-required';
  instructions: string;
  script?: string;
}

type RuleCondition =
  | SimpleCondition
  | AndCondition
  | OrCondition
  | NotCondition;

interface SimpleCondition {
  type: 'simple';
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  path?: string; // For nested data access
}

interface AndCondition {
  type: 'and';
  conditions: RuleCondition[];
}

interface OrCondition {
  type: 'or';
  conditions: RuleCondition[];
}

interface NotCondition {
  type: 'not';
  condition: RuleCondition;
}

type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'matches' // regex
  | 'exists'
  | 'isEmpty';

interface EvaluationContext {
  control: unknown;
  evidence: unknown;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

type ConditionEvaluator = (context: EvaluationContext) => boolean;

interface CompiledRule {
  id: string;
  evaluate: ConditionEvaluator;
  metadata: ComplianceRule;
}

interface EvaluationResult {
  ruleId: string;
  controlId: string;
  passed: boolean;
  evaluatedAt: string;
  details?: string;
  error?: string;
}

interface BulkEvaluationResult {
  results: Map<string, EvaluationResult[]>;
  summary: {
    totalControls: number;
    totalRules: number;
    passed: number;
    failed: number;
    errors: number;
  };
  evaluatedAt: string;
}

// Condition Evaluators
class ConditionEvaluators {
  private evaluators: Map<ComparisonOperator, (fieldValue: unknown, targetValue: unknown) => boolean>;

  constructor() {
    this.evaluators = new Map();
    this.registerDefaultEvaluators();
  }

  private registerDefaultEvaluators(): void {
    this.evaluators.set('equals', (fieldValue, targetValue) => fieldValue === targetValue);
    this.evaluators.set('notEquals', (fieldValue, targetValue) => fieldValue !== targetValue);

    this.evaluators.set('contains', (fieldValue, targetValue) => {
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(targetValue);
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(targetValue));
      }
      return false;
    });

    this.evaluators.set('notContains', (fieldValue, targetValue) => {
      return !this.evaluators.get('contains')!(fieldValue, targetValue);
    });

    this.evaluators.set('greaterThan', (fieldValue, targetValue) => {
      return Number(fieldValue) > Number(targetValue);
    });

    this.evaluators.set('lessThan', (fieldValue, targetValue) => {
      return Number(fieldValue) < Number(targetValue);
    });

    this.evaluators.set('greaterThanOrEqual', (fieldValue, targetValue) => {
      return Number(fieldValue) >= Number(targetValue);
    });

    this.evaluators.set('lessThanOrEqual', (fieldValue, targetValue) => {
      return Number(fieldValue) <= Number(targetValue);
    });

    this.evaluators.set('in', (fieldValue, targetValues) => {
      if (!Array.isArray(targetValues)) return false;
      return targetValues.includes(fieldValue);
    });

    this.evaluators.set('notIn', (fieldValue, targetValues) => {
      return !this.evaluators.get('in')!(fieldValue, targetValues);
    });

    this.evaluators.set('matches', (fieldValue, pattern) => {
      const regex = new RegExp(pattern as string);
      return regex.test(String(fieldValue));
    });

    this.evaluators.set('exists', (fieldValue) => {
      return fieldValue !== undefined && fieldValue !== null;
    });

    this.evaluators.set('isEmpty', (fieldValue) => {
      if (Array.isArray(fieldValue)) return fieldValue.length === 0;
      if (typeof fieldValue === 'string') return fieldValue.length === 0;
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        return Object.keys(fieldValue).length === 0;
      }
      return fieldValue === null || fieldValue === undefined;
    });
  }

  get(operator: ComparisonOperator): ((fieldValue: unknown, targetValue: unknown) => boolean) | undefined {
    return this.evaluators.get(operator);
  }
}

// Compliance Rule Engine
class ComplianceRuleEngine {
  private compiledRules: Map<string, CompiledRule> = new Map();
  private evaluators: ConditionEvaluators;

  constructor() {
    this.evaluators = new ConditionEvaluators();
  }

  compileRule(rule: ComplianceRule): CompiledRule {
    // Pre-compile for performance
    const evaluator = this.compileCondition(rule.condition);

    const compiled: CompiledRule = {
      id: rule.id,
      evaluate: evaluator,
      metadata: rule,
    };

    this.compiledRules.set(rule.id, compiled);
    return compiled;
  }

  private compileCondition(condition: RuleCondition): ConditionEvaluator {
    switch (condition.type) {
      case 'simple':
        return this.compileSimpleCondition(condition);

      case 'and':
        const andEvaluators = condition.conditions.map(c => this.compileCondition(c));
        return (context) => andEvaluators.every(e => e(context));

      case 'or':
        const orEvaluators = condition.conditions.map(c => this.compileCondition(c));
        return (context) => orEvaluators.some(e => e(context));

      case 'not':
        const innerEvaluator = this.compileCondition(condition.condition);
        return (context) => !innerEvaluator(context);
    }
  }

  private compileSimpleCondition(condition: SimpleCondition): ConditionEvaluator {
    const { field, operator, value, path } = condition;
    const evaluator = this.evaluators.get(operator);

    if (!evaluator) {
      throw new Error(`Unknown operator: ${operator}`);
    }

    // Pre-compute field accessor for performance
    const accessor = this.createFieldAccessor(field, path);

    return (context: EvaluationContext) => {
      const fieldValue = accessor(context);
      return evaluator(fieldValue, value);
    };
  }

  private createFieldAccessor(
    field: string,
    path?: string
  ): (context: EvaluationContext) => unknown {
    if (path) {
      // Handle nested paths like "config.encryption.enabled"
      const pathParts = path.split('.');
      return (context) => {
        let value = context[field];
        for (const part of pathParts) {
          if (value == null) return undefined;
          value = (value as Record<string, unknown>)[part];
        }
        return value;
      };
    }

    return (context) => context[field];
  }

  getCompiledRule(ruleId: string): CompiledRule | undefined {
    return this.compiledRules.get(ruleId);
  }
}

// Rule Evaluation Service
class RuleEvaluationService {
  constructor(
    private engine: ComplianceRuleEngine,
    private metrics?: MetricsClient
  ) {}

  async evaluateControl(
    control: { id: string; [key: string]: unknown },
    rules: ComplianceRule[]
  ): Promise<EvaluationResult[]> {
    const context = this.buildEvaluationContext(control);
    const results: EvaluationResult[] = [];

    for (const rule of rules) {
      const startTime = performance.now();

      try {
        const compiled = this.engine.getCompiledRule(rule.id) ||
          this.engine.compileRule(rule);

        const passed = compiled.evaluate(context);

        results.push({
          ruleId: rule.id,
          controlId: control.id,
          passed,
          evaluatedAt: new Date().toISOString(),
          details: passed ? undefined : this.captureFailureDetails(rule, context),
        });

        if (this.metrics) {
          this.metrics.recordHistogram(
            'rule_evaluation_duration_ms',
            performance.now() - startTime,
            { ruleId: rule.id, passed: String(passed) }
          );
        }
      } catch (error) {
        results.push({
          ruleId: rule.id,
          controlId: control.id,
          passed: false,
          error: (error as Error).message,
          evaluatedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  async evaluateBulk(
    controls: Array<{ id: string; [key: string]: unknown }>,
    rules: ComplianceRule[]
  ): Promise<BulkEvaluationResult> {
    const results = new Map<string, EvaluationResult[]>();

    // Parallel evaluation with concurrency control
    const limit = 10; // Max 10 concurrent evaluations
    const chunks: Array<typeof controls> = [];
    for (let i = 0; i < controls.length; i += limit) {
      chunks.push(controls.slice(i, i + limit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(control => this.evaluateControl(control, rules))
      );

      chunk.forEach((control, index) => {
        results.set(control.id, chunkResults[index]);
      });
    }

    return {
      results,
      summary: this.computeSummary(results),
      evaluatedAt: new Date().toISOString(),
    };
  }

  private buildEvaluationContext(control: { id: string; [key: string]: unknown }): EvaluationContext {
    return {
      control,
      evidence: (control as any).evidenceRequirements || [],
      metadata: (control as any).metadata || {},
      // Add computed fields for rule convenience
      daysSinceLastAssessment: this.daysSince((control as any).lastAssessedAt),
      hasRequiredEvidence: ((control as any).evidenceRequirements || []).every(
        (e: { satisfied: boolean }) => e.satisfied
      ),
    };
  }

  private daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private captureFailureDetails(rule: ComplianceRule, context: EvaluationContext): string {
    return `Rule "${rule.name}" failed for control ${context.control}. ${rule.description}`;
  }

  private computeSummary(results: Map<string, EvaluationResult[]>): BulkEvaluationResult['summary'] {
    let totalRules = 0;
    let passed = 0;
    let failed = 0;
    let errors = 0;

    for (const controlResults of results.values()) {
      for (const result of controlResults) {
        totalRules++;
        if (result.error) {
          errors++;
        } else if (result.passed) {
          passed++;
        } else {
          failed++;
        }
      }
    }

    return {
      totalControls: results.size,
      totalRules,
      passed,
      failed,
      errors,
    };
  }
}

// Rule Validator
interface ValidationError {
  path: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

class RuleValidator {
  constructor(private engine: ComplianceRuleEngine) {}

  validateRule(rule: ComplianceRule): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic validation
    if (!rule.id) {
      errors.push({ path: 'id', message: 'Rule ID is required' });
    }

    if (!rule.name) {
      errors.push({ path: 'name', message: 'Rule name is required' });
    }

    if (!rule.condition) {
      errors.push({ path: 'condition', message: 'Rule condition is required' });
    }

    // Test compilation
    try {
      this.engine.compileRule(rule);
    } catch (e) {
      errors.push({
        path: 'condition',
        message: `Compilation failed: ${(e as Error).message}`,
      });
    }

    // Validate condition structure
    errors.push(...this.validateCondition(rule.condition, []));

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateCondition(condition: RuleCondition, path: string[]): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (condition.type) {
      case 'simple':
        if (!condition.field) {
          errors.push({ path: path.join('.'), message: 'Field is required' });
        }
        if (!condition.operator) {
          errors.push({ path: path.join('.'), message: 'Operator is required' });
        }
        break;

      case 'and':
      case 'or':
        if (!condition.conditions || condition.conditions.length === 0) {
          errors.push({ path: path.join('.'), message: 'At least one condition is required' });
        }
        condition.conditions.forEach((c, i) => {
          errors.push(...this.validateCondition(c, [...path, String(i)]));
        });
        break;

      case 'not':
        if (!condition.condition) {
          errors.push({ path: path.join('.'), message: 'Condition is required for NOT operator' });
        } else {
          errors.push(...this.validateCondition(condition.condition, [...path, 'condition']));
        }
        break;
    }

    return errors;
  }
}

// Metrics Client Interface
interface MetricsClient {
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
}

class ConsoleMetricsClient implements MetricsClient {
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    console.log(`[METRIC] ${name}: ${value}ms`, tags);
  }
}

// Example Usage
export function demonstrateRuleEngine() {
  const engine = new ComplianceRuleEngine();
  const validator = new RuleValidator(engine);
  const evaluationService = new RuleEvaluationService(engine, new ConsoleMetricsClient());

  // Example rule: Check if encryption is enabled
  const encryptionRule: ComplianceRule = {
    id: 'encryption-required',
    name: 'Encryption at Rest Required',
    description: 'All storage must have encryption enabled',
    frameworkMappings: [
      { framework: 'SOC2', controlId: 'CC6.7' },
      { framework: 'FedRAMP', controlId: 'SC-28' },
    ],
    severity: 'HIGH',
    condition: {
      type: 'simple',
      field: 'control',
      path: 'config.encryption.enabled',
      operator: 'equals',
      value: true,
    },
    remediation: {
      type: 'automatic',
      instructions: 'Enable encryption on the storage resource',
      script: 'aws s3api put-bucket-encryption --bucket {bucket} --server-side-encryption-configuration {...}',
    },
    metadata: {},
  };

  // Validate rule
  const validation = validator.validateRule(encryptionRule);
  console.log('Validation:', validation);

  if (validation.valid) {
    // Compile and use
    const compiled = engine.compileRule(encryptionRule);

    // Evaluate against a control
    const control = {
      id: 'control-1',
      config: {
        encryption: {
          enabled: false, // Violation
        },
      },
    };

    const context = {
      control,
      evidence: [],
      metadata: {},
    };

    const result = compiled.evaluate(context);
    console.log('Evaluation result:', result); // false - violation detected
  }

  return { engine, validator, evaluationService };
}

export {
  ComplianceRuleEngine,
  RuleEvaluationService,
  RuleValidator,
  ComplianceRule,
  RuleCondition,
  EvaluationResult,
  BulkEvaluationResult,
};

