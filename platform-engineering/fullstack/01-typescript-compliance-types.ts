/**
 * Question: TypeScript Type Safety for Compliance Data Structures
 * 
 * Design TypeScript types for a compliance system where different frameworks 
 * have different control structures, but we need to work with them uniformly. 
 * This implementation shows how to handle framework-specific data while 
 * maintaining type safety.
 * 
 * Key Technical Decisions:
 * - Discriminated unions for framework types
 * - Branded types for validated data
 * - Generic repository pattern
 * - Type-safe factory methods
 */

// Base Types
type FrameworkType = 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';

type ControlStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'NOT_ASSESSED';

interface EvidenceRequirement {
  id: string;
  type: string;
  description: string;
  satisfied: boolean;
}

// Base Control Structure
interface BaseControl<TFramework extends FrameworkType> {
  frameworkType: TFramework;
  id: string;
  title: string;
  description: string;
  status: ControlStatus;
  lastAssessedAt: string;
  evidenceRequirements: EvidenceRequirement[];
}

// Framework-Specific Control Types
interface SOC2Control extends BaseControl<'SOC2'> {
  frameworkType: 'SOC2';
  trustServiceCriteria: 'Security' | 'Availability' | 'ProcessingIntegrity' | 'Confidentiality' | 'Privacy';
  controlNumber: string; // e.g., "CC6.1"
  pointsOfFocus: string[];
}

type FedRAMPControlFamily =
  | 'AC' // Access Control
  | 'AU' // Audit and Accountability
  | 'CA' // Security Assessment and Authorization
  | 'CM' // Configuration Management
  | 'CP' // Contingency Planning
  | 'IA' // Identification and Authentication
  | 'IR' // Incident Response
  | 'MA' // Maintenance
  | 'MP' // Media Protection
  | 'PE' // Physical and Environmental Protection
  | 'PL' // Planning
  | 'PS' // Personnel Security
  | 'RA' // Risk Assessment
  | 'SA' // System and Services Acquisition
  | 'SC' // System and Communications Protection
  | 'SI' // System and Information Integrity
  | 'SR' // Supply Chain Risk Management;

interface FedRAMPControl extends BaseControl<'FEDRAMP'> {
  frameworkType: 'FEDRAMP';
  controlFamily: FedRAMPControlFamily;
  controlIdentifier: string; // e.g., "AC-2"
  impactLevel: 'LOW' | 'MODERATE' | 'HIGH';
  controlEnhancements: string[];
  parameterValues: Record<string, string>;
}

interface ISO27001Control extends BaseControl<'ISO27001'> {
  frameworkType: 'ISO27001';
  clause: string; // e.g., "A.5.1"
  annexCategory: string;
  implementationGuidance: string;
}

interface PCIControl extends BaseControl<'PCI'> {
  frameworkType: 'PCI';
  requirement: string; // e.g., "1.1.1"
  testingProcedures: string[];
  guidanceNotes: string;
  applicableSAQs: string[];
}

// Union type for any control
type ComplianceControl = SOC2Control | FedRAMPControl | ISO27001Control | PCIControl;

// Type-Safe Framework-Specific Operations
function getControlDisplayName(control: ComplianceControl): string {
  // TypeScript knows all controls have these base fields
  return `${control.id}: ${control.title}`;
}

function getControlHierarchy(control: ComplianceControl): string[] {
  switch (control.frameworkType) {
    case 'SOC2':
      // TypeScript knows this is SOC2Control
      return [control.trustServiceCriteria, control.controlNumber];

    case 'FEDRAMP':
      // TypeScript knows this is FedRAMPControl
      return [
        control.controlFamily,
        control.controlIdentifier,
        ...control.controlEnhancements,
      ];

    case 'ISO27001':
      return [control.annexCategory, control.clause];

    case 'PCI':
      return [control.requirement];

    default:
      // Exhaustiveness check - TypeScript error if we miss a framework
      const _exhaustive: never = control;
      throw new Error(`Unknown framework: ${_exhaustive}`);
  }
}

// Generic Utilities with Framework Constraints
type ControlUpdatePayload<T extends ComplianceControl> = Partial<
  Omit<T, 'frameworkType' | 'id'>
>;

function updateControl<T extends ComplianceControl>(
  control: T,
  updates: ControlUpdatePayload<T>
): T {
  return { ...control, ...updates };
}

// Framework Control Data Types
type FrameworkControlData = {
  SOC2: Omit<SOC2Control, 'frameworkType'>;
  FEDRAMP: Omit<FedRAMPControl, 'frameworkType'>;
  ISO27001: Omit<ISO27001Control, 'frameworkType'>;
  PCI: Omit<PCIControl, 'frameworkType'>;
};

// Framework-Aware Factory
class ControlFactory {
  static create<T extends FrameworkType>(
    framework: T,
    data: FrameworkControlData[T]
  ): Extract<ComplianceControl, { frameworkType: T }> {
    switch (framework) {
      case 'SOC2':
        return {
          frameworkType: 'SOC2',
          ...data,
        } as Extract<ComplianceControl, { frameworkType: T }>;

      case 'FEDRAMP':
        return {
          frameworkType: 'FEDRAMP',
          ...data,
        } as Extract<ComplianceControl, { frameworkType: T }>;

      case 'ISO27001':
        return {
          frameworkType: 'ISO27001',
          ...data,
        } as Extract<ComplianceControl, { frameworkType: T }>;

      case 'PCI':
        return {
          frameworkType: 'PCI',
          ...data,
        } as Extract<ComplianceControl, { frameworkType: T }>;

      default:
        const _exhaustive: never = framework;
        throw new Error(`Unknown framework: ${_exhaustive}`);
    }
  }
}

// Branded Types for Validated Data
type ValidatedControlId = string & { readonly __brand: 'ValidatedControlId' };
type ValidatedEvidenceHash = string & { readonly __brand: 'ValidatedEvidenceHash' };

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateControlId(id: string): ValidatedControlId {
  // Validation logic for different framework formats
  const patterns = {
    SOC2: /^CC\d+\.\d+$/,
    FEDRAMP: /^[A-Z]{2}-\d+$/,
    ISO27001: /^A\.\d+\.\d+$/,
    PCI: /^\d+\.\d+\.\d+$/,
  };

  // Try to match any pattern
  const matches = Object.values(patterns).some(pattern => pattern.test(id));

  if (!matches) {
    throw new ValidationError(`Invalid control ID format: ${id}`);
  }

  return id as ValidatedControlId;
}

function validateEvidenceHash(hash: string): ValidatedEvidenceHash {
  // SHA-256 hash is 64 hex characters
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    throw new ValidationError(`Invalid evidence hash format: ${hash}`);
  }

  return hash as ValidatedEvidenceHash;
}

// Evidence with Cryptographic Integrity
interface ValidatedEvidence {
  controlId: ValidatedControlId;
  hash: ValidatedEvidenceHash;
  collectedAt: string;
  data: unknown;
  signature: string; // Cryptographic signature for audit
}

// Functions that require validated input
async function getControlEvidence(
  controlId: ValidatedControlId // Can't pass unvalidated string
): Promise<ValidatedEvidence[]> {
  // Implementation would fetch evidence from database
  // The type system ensures only validated IDs can be passed
  return [];
}

// Generic Repository Pattern
interface ControlRepository<T extends ComplianceControl> {
  findById(id: string): Promise<T | null>;
  findByFramework(framework: T['frameworkType']): Promise<T[]>;
  save(control: T): Promise<T>;
  bulkUpdate(controls: T[]): Promise<void>;
}

// Database Interface (simplified)
interface Database {
  controls: {
    findMany(query: { where: Record<string, unknown> }): Promise<ComplianceControl[]>;
    create(data: ComplianceControl): Promise<ComplianceControl>;
    updateMany(controls: ComplianceControl[]): Promise<void>;
  };
}

// Unified Control Repository Implementation
class UnifiedControlRepository implements ControlRepository<ComplianceControl> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<ComplianceControl | null> {
    const results = await this.db.controls.findMany({ where: { id } });
    return results[0] || null;
  }

  async findByFramework<T extends FrameworkType>(
    framework: T
  ): Promise<Extract<ComplianceControl, { frameworkType: T }>[]> {
    const results = await this.db.controls.findMany({
      where: { frameworkType: framework },
    });

    // Type assertion safe because we filtered by frameworkType
    return results as Extract<ComplianceControl, { frameworkType: T }>[];
  }

  async save(control: ComplianceControl): Promise<ComplianceControl> {
    return this.db.controls.create(control);
  }

  async bulkUpdate(controls: ComplianceControl[]): Promise<void> {
    await this.db.controls.updateMany(controls);
  }
}

// Type-Safe Framework-Specific Queries
class FrameworkSpecificQueries {
  constructor(private repository: UnifiedControlRepository) {}

  async getSOC2ControlsByCriteria(
    criteria: SOC2Control['trustServiceCriteria']
  ): Promise<SOC2Control[]> {
    const allSOC2 = await this.repository.findByFramework('SOC2');
    return allSOC2.filter(
      (control): control is SOC2Control =>
        control.frameworkType === 'SOC2' && control.trustServiceCriteria === criteria
    );
  }

  async getFedRAMPControlsByImpactLevel(
    impactLevel: FedRAMPControl['impactLevel']
  ): Promise<FedRAMPControl[]> {
    const allFedRAMP = await this.repository.findByFramework('FEDRAMP');
    return allFedRAMP.filter(
      (control): control is FedRAMPControl =>
        control.frameworkType === 'FEDRAMP' && control.impactLevel === impactLevel
    );
  }

  async getPCIControlsBySAQ(saq: string): Promise<PCIControl[]> {
    const allPCI = await this.repository.findByFramework('PCI');
    return allPCI.filter(
      (control): control is PCIControl =>
        control.frameworkType === 'PCI' && control.applicableSAQs.includes(saq)
    );
  }
}

// Type Guards
function isSOC2Control(control: ComplianceControl): control is SOC2Control {
  return control.frameworkType === 'SOC2';
}

function isFedRAMPControl(control: ComplianceControl): control is FedRAMPControl {
  return control.frameworkType === 'FEDRAMP';
}

function isISO27001Control(control: ComplianceControl): control is ISO27001Control {
  return control.frameworkType === 'ISO27001';
}

function isPCIControl(control: ComplianceControl): control is PCIControl {
  return control.frameworkType === 'PCI';
}

// Example Usage
export function demonstrateTypeSafety() {
  // Create a SOC2 control
  const soc2Control = ControlFactory.create('SOC2', {
    id: 'CC6.1',
    title: 'Logical Access Controls',
    description: 'The entity restricts logical access to information assets',
    status: 'COMPLIANT',
    lastAssessedAt: new Date().toISOString(),
    evidenceRequirements: [],
    trustServiceCriteria: 'Security',
    controlNumber: 'CC6.1',
    pointsOfFocus: ['Access Rights', 'Access Credentials'],
  });

  // TypeScript knows this is SOC2Control
  console.log(soc2Control.trustServiceCriteria); // OK
  // console.log(soc2Control.impactLevel); // Error! Not on SOC2Control

  // Create a FedRAMP control
  const fedrampControl = ControlFactory.create('FEDRAMP', {
    id: 'AC-2',
    title: 'Account Management',
    description: 'The organization manages information system accounts',
    status: 'COMPLIANT',
    lastAssessedAt: new Date().toISOString(),
    evidenceRequirements: [],
    controlFamily: 'AC',
    controlIdentifier: 'AC-2',
    impactLevel: 'MODERATE',
    controlEnhancements: ['AC-2(1)', 'AC-2(2)'],
    parameterValues: {},
  });

  // TypeScript knows this is FedRAMPControl
  console.log(fedrampControl.impactLevel); // OK
  // console.log(fedrampControl.trustServiceCriteria); // Error! Not on FedRAMPControl

  // Generic operations work on all controls
  const displayName = getControlDisplayName(soc2Control);
  const hierarchy = getControlHierarchy(fedrampControl);

  // Type-safe updates
  const updatedSOC2 = updateControl(soc2Control, {
    status: 'NON_COMPLIANT',
    trustServiceCriteria: 'Security', // Valid
    // impactLevel: 'HIGH' // Error! Not on SOC2Control
  });

  // Validated IDs
  try {
    const validatedId = validateControlId('CC6.1');
    // Now can use in functions requiring ValidatedControlId
    getControlEvidence(validatedId);
  } catch (error) {
    console.error('Validation failed:', error);
  }

  return {
    soc2Control,
    fedrampControl,
    displayName,
    hierarchy,
    updatedSOC2,
  };
}

export {
  ComplianceControl,
  SOC2Control,
  FedRAMPControl,
  ISO27001Control,
  PCIControl,
  ControlFactory,
  UnifiedControlRepository,
  FrameworkSpecificQueries,
  validateControlId,
  validateEvidenceHash,
  ValidatedControlId,
  ValidatedEvidenceHash,
  ValidatedEvidence,
  isSOC2Control,
  isFedRAMPControl,
  isISO27001Control,
  isPCIControl,
};

