/**
 * Question: Handling Compliance Framework Overlap
 * 
 * What strategies would you use to handle compliance framework overlap 
 * (SOC 2, FedRAMP, ISO 27001, PCI-DSS) in a unified platform?
 * 
 * Key Technical Decisions:
 * - Control mapping matrix as foundational data model
 * - Graph database structure for relationships
 * - Tag-based architecture for evidence
 * - Framework-specific views of unified data
 */

// Types
type Framework = 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';

interface ControlMapping {
  id: string;
  technicalControl: string; // e.g., "encrypt_data_at_rest"
  frameworkMappings: FrameworkControlMapping[];
  evidenceArtifacts: string[];
  conflicts?: FrameworkConflict[];
}

interface FrameworkControlMapping {
  framework: Framework;
  controlId: string; // e.g., "CC6.7" for SOC2, "SC-28" for FedRAMP
  controlTitle: string;
  requirement: string;
}

interface FrameworkConflict {
  framework1: Framework;
  framework2: Framework;
  conflictType: 'contradictory' | 'incompatible' | 'ambiguous';
  description: string;
  resolution?: string;
}

interface EvidenceArtifact {
  id: string;
  technicalControl: string;
  collectedAt: string;
  frameworks: Framework[]; // Tagged with applicable frameworks
  data: unknown;
  metadata: {
    resourceId: string;
    resourceType: string;
    collector: string;
  };
}

// Control Mapping Matrix
class ControlMappingMatrix {
  private mappings: Map<string, ControlMapping> = new Map();

  /**
   * Register a technical control and its framework mappings
   */
  registerControl(mapping: ControlMapping): void {
    this.mappings.set(mapping.technicalControl, mapping);
  }

  /**
   * Get all framework controls that map to a technical control
   */
  getFrameworkControls(technicalControl: string): FrameworkControlMapping[] {
    const mapping = this.mappings.get(technicalControl);
    return mapping?.frameworkMappings || [];
  }

  /**
   * Get technical controls for a specific framework
   */
  getTechnicalControlsForFramework(framework: Framework): string[] {
    const controls: string[] = [];
    for (const [technicalControl, mapping] of this.mappings.entries()) {
      if (mapping.frameworkMappings.some(m => m.framework === framework)) {
        controls.push(technicalControl);
      }
    }
    return controls;
  }

  /**
   * Find common controls across multiple frameworks
   */
  findCommonControls(frameworks: Framework[]): string[] {
    const frameworkSets = frameworks.map(f => 
      new Set(this.getTechnicalControlsForFramework(f))
    );

    if (frameworkSets.length === 0) return [];

    // Find intersection
    let common = Array.from(frameworkSets[0]);
    for (let i = 1; i < frameworkSets.length; i++) {
      common = common.filter(c => frameworkSets[i].has(c));
    }

    return common;
  }

  /**
   * Find framework-specific controls (unique to one framework)
   */
  findFrameworkSpecificControls(framework: Framework): string[] {
    const allFrameworks: Framework[] = ['SOC2', 'FEDRAMP', 'ISO27001', 'PCI'];
    const otherFrameworks = allFrameworks.filter(f => f !== framework);

    const frameworkControls = new Set(this.getTechnicalControlsForFramework(framework));
    const otherControls = new Set(
      otherFrameworks.flatMap(f => this.getTechnicalControlsForFramework(f))
    );

    // Controls in this framework but not in others
    return Array.from(frameworkControls).filter(c => !otherControls.has(c));
  }

  /**
   * Detect conflicts between frameworks
   */
  detectConflicts(): FrameworkConflict[] {
    const conflicts: FrameworkConflict[] = [];

    for (const mapping of this.mappings.values()) {
      if (mapping.conflicts) {
        conflicts.push(...mapping.conflicts);
      }
    }

    return conflicts;
  }
}

// Evidence Tagging Service
class EvidenceTaggingService {
  constructor(private mappingMatrix: ControlMappingMatrix) {}

  /**
   * Tag evidence with applicable frameworks based on technical control
   */
  tagEvidence(
    technicalControl: string,
    evidence: Omit<EvidenceArtifact, 'frameworks'>
  ): EvidenceArtifact {
    const frameworkMappings = this.mappingMatrix.getFrameworkControls(technicalControl);
    const frameworks = frameworkMappings.map(m => m.framework);

    return {
      ...evidence,
      frameworks: [...new Set(frameworks)], // Deduplicate
    };
  }

  /**
   * Get evidence that satisfies multiple frameworks
   */
  getEvidenceForFrameworks(
    evidenceList: EvidenceArtifact[],
    frameworks: Framework[]
  ): EvidenceArtifact[] {
    return evidenceList.filter(evidence =>
      frameworks.every(framework => evidence.frameworks.includes(framework))
    );
  }
}

// Framework-Specific View Service
class FrameworkViewService {
  constructor(private mappingMatrix: ControlMappingMatrix) {}

  /**
   * Get compliance posture for a specific framework
   */
  getFrameworkPosture(
    framework: Framework,
    evidenceList: EvidenceArtifact[]
  ): FrameworkPosture {
    const technicalControls = this.mappingMatrix.getTechnicalControlsForFramework(framework);
    const controls: FrameworkControlStatus[] = [];

    for (const technicalControl of technicalControls) {
      const mapping = this.mappingMatrix.getFrameworkControls(technicalControl);
      const frameworkMapping = mapping.find(m => m.framework === framework);

      if (!frameworkMapping) continue;

      const relevantEvidence = evidenceList.filter(
        e => e.technicalControl === technicalControl && e.frameworks.includes(framework)
      );

      controls.push({
        frameworkControlId: frameworkMapping.controlId,
        frameworkControlTitle: frameworkMapping.controlTitle,
        technicalControl,
        hasEvidence: relevantEvidence.length > 0,
        evidenceCount: relevantEvidence.length,
        lastEvidenceDate: relevantEvidence.length > 0
          ? new Date(Math.max(...relevantEvidence.map(e => new Date(e.collectedAt).getTime())))
            .toISOString()
          : undefined,
      });
    }

    const compliantCount = controls.filter(c => c.hasEvidence).length;
    const complianceScore = controls.length > 0
      ? (compliantCount / controls.length) * 100
      : 0;

    return {
      framework,
      totalControls: controls.length,
      compliantControls: compliantCount,
      complianceScore,
      controls,
    };
  }

  /**
   * Compare compliance posture across frameworks
   */
  compareFrameworks(
    frameworks: Framework[],
    evidenceList: EvidenceArtifact[]
  ): FrameworkComparison {
    const postures = frameworks.map(f =>
      this.getFrameworkPosture(f, evidenceList)
    );

    const commonControls = this.mappingMatrix.findCommonControls(frameworks);
    const commonCompliance = commonControls.map(control => {
      const evidence = evidenceList.filter(e => e.technicalControl === control);
      return {
        technicalControl: control,
        hasEvidence: evidence.length > 0,
        frameworks: frameworks.filter(f =>
          this.mappingMatrix.getFrameworkControls(control).some(m => m.framework === f)
        ),
      };
    });

    return {
      frameworks,
      postures,
      commonControls: {
        count: commonControls.length,
        compliance: commonCompliance,
      },
    };
  }
}

interface FrameworkControlStatus {
  frameworkControlId: string;
  frameworkControlTitle: string;
  technicalControl: string;
  hasEvidence: boolean;
  evidenceCount: number;
  lastEvidenceDate?: string;
}

interface FrameworkPosture {
  framework: Framework;
  totalControls: number;
  compliantControls: number;
  complianceScore: number;
  controls: FrameworkControlStatus[];
}

interface FrameworkComparison {
  frameworks: Framework[];
  postures: FrameworkPosture[];
  commonControls: {
    count: number;
    compliance: Array<{
      technicalControl: string;
      hasEvidence: boolean;
      frameworks: Framework[];
    }>;
  };
}

// Example Usage
export function demonstrateFrameworkOverlap() {
  const mappingMatrix = new ControlMappingMatrix();

  // Register encryption at rest control (maps to multiple frameworks)
  mappingMatrix.registerControl({
    id: 'encrypt-data-at-rest',
    technicalControl: 'encrypt_data_at_rest',
    frameworkMappings: [
      {
        framework: 'SOC2',
        controlId: 'CC6.7',
        controlTitle: 'System Operations',
        requirement: 'The entity restricts physical and logical access to information assets',
      },
      {
        framework: 'FEDRAMP',
        controlId: 'SC-28',
        controlTitle: 'Protection of Information at Rest',
        requirement: 'The information system protects the confidentiality and integrity of information at rest',
      },
      {
        framework: 'ISO27001',
        controlId: 'A.10.1.1',
        controlTitle: 'Cryptographic Controls',
        requirement: 'A cryptographic policy shall be developed and implemented',
      },
      {
        framework: 'PCI',
        controlId: '3.4',
        controlTitle: 'Render PAN unreadable',
        requirement: 'Render PAN unreadable anywhere it is stored',
      },
    ],
    evidenceArtifacts: [],
  });

  // Register MFA control
  mappingMatrix.registerControl({
    id: 'mfa-required',
    technicalControl: 'require_mfa',
    frameworkMappings: [
      {
        framework: 'SOC2',
        controlId: 'CC6.1',
        controlTitle: 'Logical Access Controls',
        requirement: 'The entity restricts logical access to information assets',
      },
      {
        framework: 'FEDRAMP',
        controlId: 'IA-2',
        controlTitle: 'Identification and Authentication',
        requirement: 'The information system uniquely identifies and authenticates organizational users',
      },
    ],
    evidenceArtifacts: [],
  });

  // Find common controls
  const commonControls = mappingMatrix.findCommonControls(['SOC2', 'FEDRAMP']);
  console.log('Common controls between SOC2 and FedRAMP:', commonControls);

  // Find framework-specific controls
  const pciSpecific = mappingMatrix.findFrameworkSpecificControls('PCI');
  console.log('PCI-specific controls:', pciSpecific);

  // Tag evidence
  const taggingService = new EvidenceTaggingService(mappingMatrix);
  const evidence = taggingService.tagEvidence('encrypt_data_at_rest', {
    id: 'evidence-1',
    technicalControl: 'encrypt_data_at_rest',
    collectedAt: new Date().toISOString(),
    data: { encrypted: true },
    metadata: {
      resourceId: 's3-bucket-123',
      resourceType: 's3_bucket',
      collector: 'aws-evidence-collector',
    },
  });

  console.log('Tagged evidence frameworks:', evidence.frameworks);
  // Should include: ['SOC2', 'FEDRAMP', 'ISO27001', 'PCI']

  // Get framework-specific view
  const viewService = new FrameworkViewService(mappingMatrix);
  const soc2Posture = viewService.getFrameworkPosture('SOC2', [evidence]);
  console.log('SOC2 Compliance Posture:', soc2Posture);

  // Compare frameworks
  const comparison = viewService.compareFrameworks(['SOC2', 'FEDRAMP'], [evidence]);
  console.log('Framework Comparison:', comparison);

  return {
    mappingMatrix,
    taggingService,
    viewService,
  };
}

export {
  ControlMappingMatrix,
  EvidenceTaggingService,
  FrameworkViewService,
  ControlMapping,
  FrameworkControlMapping,
  EvidenceArtifact,
  FrameworkPosture,
  FrameworkComparison,
};

