# Compliance & GRC Fundamentals - Technical Interview Questions

This directory contains fundamental implementations for handling compliance framework overlap and control mapping.

## Directory Contents

### 01-framework-overlap-control-mapping.ts
**Question:** What strategies would you use to handle compliance framework overlap (SOC 2, FedRAMP, ISO 27001, PCI-DSS) in a unified platform?

**Key Concepts Demonstrated:**
- **Control mapping matrix** for technical controls to framework requirements
- **Graph database structure** for relationships
- **Tag-based evidence architecture** for multi-framework support
- **Framework-specific views** of unified data
- **Conflict detection** between frameworks

**Step-by-Step Implementation:**

1. **Control Mapping Matrix:**
   - Technical control → Framework controls mapping
   - One-to-many relationships
   - Evidence artifact associations
   - Conflict tracking

2. **Evidence Tagging:**
   - Automatic framework tagging
   - Multi-framework evidence
   - Framework-specific filtering
   - Evidence reuse

3. **Framework Views:**
   - Framework-specific compliance posture
   - Common control detection
   - Framework comparison
   - Gap analysis

4. **Conflict Resolution:**
   - Contradictory requirements
   - Incompatible controls
   - Ambiguous mappings
   - Resolution strategies

**Interview Talking Points:**
- Control mapping: Reduce duplication, enable evidence reuse
- Framework views: Unified data, framework-specific presentation
- Conflict detection: Identify and resolve framework conflicts

---

## Common Patterns

### Framework Overlap Patterns

1. **Control Mapping:**
   - Technical control abstraction
   - Framework-specific mappings
   - Evidence associations

2. **Evidence Tagging:**
   - Multi-framework support
   - Automatic tagging
   - Evidence reuse

3. **Framework Views:**
   - Unified data model
   - Framework-specific queries
   - Comparison capabilities

---

## Interview Preparation Tips

### When Discussing Framework Overlap:

1. **Mapping Strategy:**
   - How to map controls?
   - How to handle differences?
   - How to maintain mappings?

2. **Evidence Management:**
   - How to tag evidence?
   - How to reuse evidence?
   - How to handle conflicts?

3. **Framework Views:**
   - How to present unified data?
   - How to compare frameworks?
   - How to identify gaps?

---

## Additional Resources

- [SOC 2 Framework](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)
- [FedRAMP Framework](https://www.fedramp.gov/)
- [ISO 27001 Standard](https://www.iso.org/isoiec-27001-information-security.html)

