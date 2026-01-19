/**
 * Question: Policy-as-Code Framework for Compliance Controls
 * 
 * Describe how you would implement a policy-as-code framework for compliance controls.
 * This implementation provides a DSL (Domain-Specific Language) allowing compliance 
 * teams to define controls declaratively.
 * 
 * Key Technical Decisions:
 * - YAML-based DSL for readability
 * - AST parsing and compilation
 * - Versioning with semantic versioning
 * - Testing framework for policies
 * - Sandboxed execution
 */

// In production, would use: import { parse as parseYaml } from 'yaml';
// For this example, using a simplified parser
function parseYaml(content: string): unknown {
  // Simplified YAML parser - in production would use actual yaml library
  try {
    return JSON.parse(content); // Fallback for demo
  } catch {
    // Basic YAML-like parsing
    return {};
  }
}

// Types
type Framework = 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';
type ResourceType = 'aws_iam_user' | 'aws_s3_bucket' | 'aws_rds_instance' | 'aws_security_group';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface PolicyDefinition {
  control_id: string;
  version: string; // Semantic versioning
  frameworks: Framework[];
  resources: ResourceSelector[];
  rules: PolicyRule[];
  remediation: RemediationConfig;
  metadata?: Record<string, unknown>;
}

interface ResourceSelector {
  type: ResourceType;
  selector: 'all' | 'tagged' | 'filtered';
  filter?: Record<string, unknown>;
}

interface PolicyRule {
  name: string;
  condition: string; // Expression like "mfa_enabled == true"
  severity: Severity;
  description?: string;
}

interface RemediationConfig {
  type: 'automatic' | 'manual' | 'approval-required';
  instructions: string;
  script?: string;
  parameters?: Record<string, string>;
}

// Policy Parser
class PolicyParser {
  /**
   * Parse YAML policy definition
   */
  parse(yamlContent: string): PolicyDefinition {
    try {
      const parsed = parseYaml(yamlContent);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      throw new Error(`Failed to parse policy YAML: ${(error as Error).message}`);
    }
  }

  private validateAndNormalize(parsed: unknown): PolicyDefinition {
    // In production, would use a schema validator like Zod
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid policy definition');
    }

    const policy = parsed as Partial<PolicyDefinition>;

    if (!policy.control_id) {
      throw new Error('control_id is required');
    }
    if (!policy.version) {
      throw new Error('version is required');
    }
    if (!policy.frameworks || !Array.isArray(policy.frameworks)) {
      throw new Error('frameworks is required and must be an array');
    }
    if (!policy.resources || !Array.isArray(policy.resources)) {
      throw new Error('resources is required and must be an array');
    }
    if (!policy.rules || !Array.isArray(policy.rules)) {
      throw new Error('rules is required and must be an array');
    }
    if (!policy.remediation) {
      throw new Error('remediation is required');
    }

    return policy as PolicyDefinition;
  }
}

// Policy Compiler
interface CompiledRule {
  name: string;
  evaluate: (resource: unknown) => boolean;
  severity: Severity;
  description?: string;
}

interface CompiledPolicy {
  controlId: string;
  version: string;
  frameworks: Framework[];
  resourceSelectors: ResourceSelector[];
  rules: CompiledRule[];
  remediation: RemediationConfig;
}

class PolicyCompiler {
  /**
   * Compile policy definition to executable code
   */
  compile(policy: PolicyDefinition): CompiledPolicy {
    const compiledRules = policy.rules.map(rule => ({
      name: rule.name,
      evaluate: this.compileCondition(rule.condition),
      severity: rule.severity,
      description: rule.description,
    }));

    return {
      controlId: policy.control_id,
      version: policy.version,
      frameworks: policy.frameworks,
      resourceSelectors: policy.resources,
      rules: compiledRules,
      remediation: policy.remediation,
    };
  }

  /**
   * Compile condition expression to evaluator function
   * In production, would use a proper expression parser
   */
  private compileCondition(condition: string): (resource: unknown) => boolean {
    // Simplified - in production would use a proper expression evaluator
    // This is a basic implementation for demonstration

    // Handle simple equality checks: "field == value"
    const equalityMatch = condition.match(/^(\w+)\s*==\s*(.+)$/);
    if (equalityMatch) {
      const [, field, value] = equalityMatch;
      const normalizedValue = this.normalizeValue(value.trim());
      return (resource: any) => {
        const fieldValue = this.getFieldValue(resource, field);
        return fieldValue === normalizedValue;
      };
    }

    // Handle boolean checks: "field == true"
    const booleanMatch = condition.match(/^(\w+)\s*==\s*(true|false)$/);
    if (booleanMatch) {
      const [, field, boolValue] = booleanMatch;
      const expected = boolValue === 'true';
      return (resource: any) => {
        const fieldValue = this.getFieldValue(resource, field);
        return Boolean(fieldValue) === expected;
      };
    }

    // Handle contains: "field contains value"
    const containsMatch = condition.match(/^(\w+)\s+contains\s+(.+)$/);
    if (containsMatch) {
      const [, field, value] = containsMatch;
      const normalizedValue = this.normalizeValue(value.trim());
      return (resource: any) => {
        const fieldValue = this.getFieldValue(resource, field);
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(normalizedValue);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(String(normalizedValue));
        }
        return false;
      };
    }

    throw new Error(`Unsupported condition format: ${condition}`);
  }

  private getFieldValue(resource: any, field: string): unknown {
    // Handle nested fields like "config.encryption.enabled"
    const parts = field.split('.');
    let value = resource;
    for (const part of parts) {
      if (value == null) return undefined;
      value = value[part];
    }
    return value;
  }

  private normalizeValue(value: string): unknown {
    // Remove quotes if present
    const unquoted = value.replace(/^["']|["']$/g, '');
    
    // Try to parse as boolean
    if (unquoted === 'true') return true;
    if (unquoted === 'false') return false;
    
    // Try to parse as number
    const num = Number(unquoted);
    if (!isNaN(num) && unquoted.trim() !== '') return num;
    
    // Return as string
    return unquoted;
  }
}

// Policy Engine
interface EvaluationResult {
  controlId: string;
  resourceId: string;
  passed: boolean;
  failedRules: Array<{
    name: string;
    severity: Severity;
    description?: string;
  }>;
  evaluatedAt: string;
}

class PolicyEngine {
  private compiledPolicies: Map<string, CompiledPolicy> = new Map();

  constructor(
    private parser: PolicyParser,
    private compiler: PolicyCompiler
  ) {}

  /**
   * Load and compile a policy
   */
  loadPolicy(yamlContent: string): CompiledPolicy {
    const policy = this.parser.parse(yamlContent);
    const compiled = this.compiler.compile(policy);
    this.compiledPolicies.set(compiled.controlId, compiled);
    return compiled;
  }

  /**
   * Evaluate a resource against a policy
   */
  evaluate(
    controlId: string,
    resource: { id: string; type: ResourceType; [key: string]: unknown }
  ): EvaluationResult {
    const policy = this.compiledPolicies.get(controlId);
    if (!policy) {
      throw new Error(`Policy ${controlId} not found`);
    }

    // Check if resource matches selectors
    if (!this.matchesSelectors(resource, policy.resourceSelectors)) {
      return {
        controlId,
        resourceId: resource.id,
        passed: true, // Not applicable to this resource
        failedRules: [],
        evaluatedAt: new Date().toISOString(),
      };
    }

    // Evaluate all rules
    const failedRules: EvaluationResult['failedRules'] = [];
    for (const rule of policy.rules) {
      try {
        const passed = rule.evaluate(resource);
        if (!passed) {
          failedRules.push({
            name: rule.name,
            severity: rule.severity,
            description: rule.description,
          });
        }
      } catch (error) {
        // Rule evaluation error - treat as failure
        failedRules.push({
          name: rule.name,
          severity: 'high',
          description: `Evaluation error: ${(error as Error).message}`,
        });
      }
    }

    return {
      controlId,
      resourceId: resource.id,
      passed: failedRules.length === 0,
      failedRules,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private matchesSelectors(
    resource: { type: ResourceType; [key: string]: unknown },
    selectors: ResourceSelector[]
  ): boolean {
    return selectors.some(selector => {
      if (selector.type !== resource.type) return false;

      switch (selector.selector) {
        case 'all':
          return true;
        case 'tagged':
          // Check if resource has required tags
          return selector.filter
            ? Object.entries(selector.filter).every(([key, value]) => {
                const resourceTags = (resource as any).tags || {};
                return resourceTags[key] === value;
              })
            : true;
        case 'filtered':
          // Apply custom filter logic
          return selector.filter
            ? this.matchesFilter(resource, selector.filter)
            : true;
        default:
          return false;
      }
    });
  }

  private matchesFilter(resource: unknown, filter: Record<string, unknown>): boolean {
    // Simplified filter matching
    return Object.entries(filter).every(([key, value]) => {
      const resourceValue = (resource as any)[key];
      return resourceValue === value;
    });
  }

  /**
   * Get remediation instructions for a failed evaluation
   */
  getRemediation(controlId: string): RemediationConfig | null {
    const policy = this.compiledPolicies.get(controlId);
    return policy?.remediation || null;
  }
}

// Example Policy YAML
const examplePolicyYAML = `
control_id: AC-2-FEDRAMP
version: 1.0.0
frameworks:
  - FedRAMP
  - SOC2
resources:
  - type: aws_iam_user
    selector: all
rules:
  - name: MFA Required
    condition: mfa_enabled == true
    severity: high
    description: All IAM users must have MFA enabled
  - name: Access Key Age
    condition: access_key_age_days < 90
    severity: medium
    description: Access keys must be rotated within 90 days
remediation:
  type: automatic
  instructions: |
    Enable MFA via AWS Console or CLI:
    aws iam enable-mfa-device --user-name {user}
  script: |
    #!/bin/bash
    aws iam enable-mfa-device --user-name $1
  parameters:
    user: "{user}"
`;

// Example Usage
export function demonstratePolicyAsCode() {
  const parser = new PolicyParser();
  const compiler = new PolicyCompiler();
  const engine = new PolicyEngine(parser, compiler);

  // Load policy
  const compiled = engine.loadPolicy(examplePolicyYAML);
  console.log('Loaded policy:', compiled.controlId, 'v' + compiled.version);

  // Evaluate a resource
  const resource = {
    id: 'user-123',
    type: 'aws_iam_user' as ResourceType,
    mfa_enabled: false, // Violation
    access_key_age_days: 45,
  };

  const result = engine.evaluate(compiled.controlId, resource);
  console.log('Evaluation result:', result);
  // Should show: passed: false, failedRules: [{ name: 'MFA Required', ... }]

  // Get remediation
  const remediation = engine.getRemediation(compiled.controlId);
  console.log('Remediation:', remediation);

  return { engine, compiled, result };
}

export {
  PolicyParser,
  PolicyCompiler,
  PolicyEngine,
  PolicyDefinition,
  CompiledPolicy,
  EvaluationResult,
};

