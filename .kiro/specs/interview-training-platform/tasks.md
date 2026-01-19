# Implementation Plan: Interview Training Platform

## Overview

This plan creates the interview training repository structure, templates, and Anki card generation tooling. Tasks are ordered to establish the directory structure first, then templates, then the Python tooling for card generation.

## Tasks

- [x] 1. Create base directory structure
  - [x] 1.1 Create root `its-my-training-day/` directory with main README.md
    - Include overview of the three training tracks
    - Add quick start guide for using the repository
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Create `_templates/` directory with all template files
    - study-guide-template.md
    - practice-problem-template.md
    - practice-solution-template.md
    - readme-concept-guide-template.md
    - _Requirements: 5.1, 5.2, 5.3, 6.1_
  - [x] 1.3 Create `job-descriptions/` directory with mapping guide README
    - Include JD keyword to training track mapping table
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 1.4 Create `progress.md` with tracking template
    - Include tables for all three tracks
    - Add summary section with totals
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Create React/Node.js Full Stack training track
  - [x] 2.1 Create `react-nodejs-fullstack/` directory structure
    - Create subdirectories: fundamentals/, automation/, retail-operations/, dashboards-telemetry/, _practice/, _anki/
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Create README.md concept guides for each subdirectory
    - Main track README with overview and study order
    - Subdirectory READMEs with topic tables
    - _Requirements: 1.5, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_
  - [x] 2.3 Create sample study guide in fundamentals/
    - Use template format with React hooks topic
    - Include 5+ Q&A pairs demonstrating format
    - _Requirements: 2.5, 2.6, 5.2, 5.3, 5.4_

- [x] 3. Create Python Backend training track
  - [x] 3.1 Create `python-backend/` directory structure
    - Create subdirectories: fundamentals/, api-design/, fastapi/, microservices/, live-coding/, _practice/, _anki/
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Create README.md concept guides for each subdirectory
    - Main track README with overview and study order
    - Subdirectory READMEs with topic tables
    - _Requirements: 1.5, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_
  - [x] 3.3 Create sample study guide in fundamentals/
    - Use template format with Python decorators topic
    - Include 5+ Q&A pairs demonstrating format
    - _Requirements: 3.6, 5.2, 5.3, 5.4_

- [x] 4. Create System Design/Architecture training track
  - [x] 4.1 Create `system-design-architecture/` directory structure
    - Create subdirectories: fundamentals/, observability/, solutions-architecture/, devops/, interview-frameworks/, _practice/, _anki/
    - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 4.2 Create README.md concept guides for each subdirectory
    - Main track README with overview and study order
    - Subdirectory READMEs with topic tables
    - Include Mermaid diagram examples in system design guides
    - _Requirements: 1.5, 4.6, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_
  - [x] 4.3 Create sample study guide in fundamentals/
    - Use template format with CAP theorem topic
    - Include 5+ Q&A pairs with diagrams
    - _Requirements: 4.6, 5.2, 5.3, 5.4_

- [x] 5. Checkpoint - Verify directory structure
  - Ensure all directories and READMEs are created
  - Verify sample study guides follow template format
  - Ask the user if questions arise

- [x] 6. Create practice exercise framework
  - [x] 6.1 Create sample practice exercise in react-nodejs-fullstack/_practice/
    - Problem file with requirements and hints
    - Solution file with approach and code
    - _Requirements: 6.2, 6.3, 6.4_
  - [x] 6.2 Create sample practice exercise in python-backend/_practice/
    - Live coding style problem (algorithm/data structure)
    - Solution with complexity analysis
    - _Requirements: 3.6, 6.2, 6.3, 6.4_
  - [x] 6.3 Create sample practice exercise in system-design-architecture/_practice/
    - System design problem with constraints
    - Solution with architecture diagram
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 7. Create Anki card generator tool
  - [x] 7.1 Set up `_tools/anki-generator/` Python package structure
    - Create __init__.py, config.py with settings
    - Add requirements.txt with dependencies (genanki, markdown)
    - _Requirements: 11.1_
  - [x] 7.2 Implement markdown_parser.py
    - Parse study guide markdown files
    - Extract metadata, questions, answers, key concepts
    - _Requirements: 11.1, 11.4_
  - [x] 7.3 Write property test for markdown parser
    - **Property 5: Study Guide Template Conformance**
    - **Validates: Requirements 5.2, 5.3**
  - [x] 7.4 Implement concept_extractor.py
    - Identify key terms, definitions, code patterns
    - Generate cloze deletion candidates
    - _Requirements: 11.4_
  - [x] 7.5 Implement cloze_generator.py
    - Create cloze deletion cards with valid Anki syntax
    - Generate forward and reverse variations
    - Ensure minimum 100 cards per study guide
    - _Requirements: 11.2, 11.4, 11.7_
  - [x] 7.6 Write property tests for cloze generator
    - **Property 1: Anki Card Minimum Count**
    - **Property 3: Cloze Deletion Validity**
    - **Validates: Requirements 11.2, 11.4**
  - [x] 7.7 Implement apkg_exporter.py
    - Export cards to .apkg format using genanki
    - Include tags from source metadata
    - _Requirements: 11.3, 11.5_
  - [x] 7.8 Write property tests for APKG exporter
    - **Property 2: APKG Export Round-Trip**
    - **Property 4: Tag Consistency**
    - **Validates: Requirements 11.3, 11.5**
  - [x] 7.9 Implement cli.py command-line interface
    - Accept input file, output directory, min-cards, tags arguments
    - Provide progress output and error messages
    - _Requirements: 11.6_

- [x] 8. Checkpoint - Test Anki generator end-to-end
  - Run generator on sample study guides
  - Verify .apkg files are created with 100+ cards
  - Ask the user if questions arise

- [x] 9. Create spaced repetition and mock interview templates
  - [x] 9.1 Create review-schedule.md template
    - Include interval recommendations (1, 3, 7, 14, 30 days)
    - Add date tracking columns
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 9.2 Create mock-interview-template.md for each track
    - Include time limits per question type
    - Add behavioral question prompts
    - Include self-evaluation rubric
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 10. Final checkpoint - Complete repository verification
  - Verify all directories have README concept guides
  - Verify templates are complete and consistent
  - Verify Anki generator produces valid output
  - Ask the user if questions arise

## Notes

- All tasks including property-based tests are required
- The Anki generator uses Python with genanki library for .apkg creation
- Sample study guides serve as both examples and test fixtures
- Progress tracking is manual via markdown - no automation required
- Property tests use pytest with hypothesis (minimum 100 iterations)
