# Repository Consolidation Map

This document maps the overlapping content that was consolidated from the root and adobe-dev directories into the `its-my-training-day` directory.

## Consolidation Summary

All training and interview preparation materials have been consolidated into the `its-my-training-day` directory to eliminate duplication and create a single source of truth.

## Directory Mappings

### Directories with Identical Content

These directories had identical content in both locations and were consolidated:

- **compliance-grc**: GRC/Compliance engineering implementations
  - Source: `./compliance-grc` (root)
  - Destination: `./its-my-training-day/compliance-grc`
  - Status: Identical content, moved from root

### Directories with Merged Content

These directories had overlapping content that was merged:

#### interview-questions
- **Source 1**: `./interview-questions` (root) - Base content (10 questions)
- **Source 2**: `./adobe-dev/interview-questions` - Additional content (2 extra questions + enhanced README)
- **Destination**: `./its-my-training-day/interview-questions`
- **Merged Content**:
  - All 10 original questions (01-10)
  - 2 additional questions from adobe-dev:
    - `11-nodejs-event-aggregation-rollup.ts`
    - `12-nodejs-sampling-risk-bias.ts`
  - Enhanced README.md with documentation for all 12 questions

#### platform-engineering
- **Source 1**: `./platform-engineering` (root) - Base content with root README
- **Source 2**: `./adobe-dev/platform-engineering` - Additional nodejs content
- **Destination**: `./its-my-training-day/platform-engineering`
- **Merged Content**:
  - All original content
  - 2 additional files from adobe-dev:
    - `nodejs/04-batch-control-status-api.ts`
    - `nodejs/04-batch-control-status-api-README.md`
  - Root README.md preserved

#### react-interview
- **Source 1**: `./react-interview` (root) - Base content with READMEs in each subdirectory
- **Source 2**: `./adobe-dev/react-interview` - Additional typescript documentation
- **Destination**: `./its-my-training-day/react-interview`
- **Merged Content**:
  - All original content with subdirectory READMEs
  - 1 additional file from adobe-dev:
    - `typescript/01-type-safe-components-SYNTAX-EXPLANATION.md`

### Unique Content Moved

These directories only existed in one location and were moved:

#### From adobe-dev:
- **leetcode-top-75**: LeetCode interview preparation
  - Source: `./adobe-dev/leetcode-top-75`
  - Destination: `./its-my-training-day/leetcode-top-75`

- **algorithms**: Algorithm implementations
  - Source: `./adobe-dev/algorithms`
  - Destination: `./its-my-training-day/algorithms`

- **anki**: Anki flashcard content
  - Source: `./adobe-dev/anki`
  - Destination: `./its-my-training-day/anki`

- **docs**: Documentation files
  - Source: `./adobe-dev/docs`
  - Destination: `./its-my-training-day/docs`

- **we-talking-about-practice**: Practice materials
  - Source: `./adobe-dev/we-talking-about-practice`
  - Destination: `./its-my-training-day/we-talking-about-practice`

#### From root:
- **advanced-grc-interview-questions**: Advanced GRC interview questions
  - Source: `./advanced-grc-interview-questions`
  - Destination: `./its-my-training-day/advanced-grc-interview-questions`

## Files Preserved at Root Level

The following files remain at the repository root as they pertain to overall repository documentation:

- `Adobe 2 round technical interview 2e6f679c19d3808aba03e4e774270b70.md`
- `MASTER_STUDY_PLAN.md`
- `QUESTIONS_INDEX.md`
- `README.md`
- `React 2e0f679c19d3805ab81be6b6ce58e6dc.md`
- `STUDY_PLAN.md`
- `refactor.tsx`

## Post-Consolidation Structure

```
its-my-training-day/
├── advanced-grc-interview-questions/   # Advanced GRC questions
├── algorithms/                         # Algorithm implementations
├── anki/                              # Anki flashcard materials
├── compliance-grc/                    # GRC/Compliance engineering
├── docs/                              # Documentation
├── interview-questions/               # 12 comprehensive interview questions
├── leetcode-top-75/                   # LeetCode preparation
├── platform-engineering/              # Platform engineering implementations
├── react-interview/                   # React interview preparation
├── we-talking-about-practice/         # Practice materials
└── CONSOLIDATION_MAP.md              # This file
```

## Removed Directories

After consolidation, the following directories were removed as they contained only duplicate content:

- `./adobe-dev/` - Entire directory removed after content migration
- `./compliance-grc/` - Moved to its-my-training-day
- `./interview-questions/` - Merged into its-my-training-day
- `./platform-engineering/` - Merged into its-my-training-day
- `./react-interview/` - Merged into its-my-training-day
- `./advanced-grc-interview-questions/` - Moved to its-my-training-day

## Benefits of Consolidation

1. **Single Source of Truth**: All training materials in one location
2. **No Duplication**: Eliminated redundant directories and files
3. **Better Organization**: Clear structure with logical grouping
4. **Easier Maintenance**: Updates needed in only one location
5. **Enhanced Content**: Merged unique content from both sources
