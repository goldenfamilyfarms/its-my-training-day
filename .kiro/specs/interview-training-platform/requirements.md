# Requirements Document

## Introduction

A personal technical interview preparation repository organized into three main training tracks: React/Node.js Full Stack, Python Backend, and System Design/Architecture. The platform supports a workflow of generating mock interview questions from job descriptions, studying detailed senior-level answers, and practicing concept recreation through hands-on exercises.

## Glossary

- **Training_Track**: A top-level directory representing a major domain of study (React/Node.js, Python Backend, System Design)
- **Study_Guide**: A markdown file containing mock interview questions and detailed senior-level answers
- **Practice_Exercise**: A hands-on coding or design exercise to recreate learned concepts
- **Job_Description_Parser**: A component that extracts key topics and requirements from job descriptions
- **Progress_Tracker**: A system for tracking completion and mastery of topics
- **Spaced_Repetition_System**: A learning technique that schedules review sessions at optimal intervals

## Requirements

### Requirement 1: Training Track Directory Structure

**User Story:** As a job seeker, I want organized directories for each interview domain, so that I can focus my preparation on relevant topics.

#### Acceptance Criteria

1. THE Repository SHALL contain a `its-my-training-day/react-nodejs-fullstack/` directory for React/Node.js training
2. THE Repository SHALL contain a `its-my-training-day/python-backend/` directory for Python backend training
3. THE Repository SHALL contain a `its-my-training-day/system-design-architecture/` directory for system design training
4. WHEN a training track directory is created, THE Repository SHALL include subdirectories for common interview topics within that domain
5. THE Repository SHALL include a README.md in each training track explaining the focus areas and target roles

### Requirement 2: React/Node.js Full Stack Training Content

**User Story:** As a full stack developer candidate, I want structured content covering automation, retail operations, and dashboard/telemetry topics, so that I can prepare for roles recruiters commonly reach out about.

#### Acceptance Criteria

1. THE React_Node_Track SHALL include a subdirectory for automation-related interview topics
2. THE React_Node_Track SHALL include a subdirectory for retail operations (customer-facing and internal) topics
3. THE React_Node_Track SHALL include a subdirectory for dashboard and telemetry/observability topics
4. WHEN studying a topic, THE Study_Guide SHALL provide questions formatted as if from a senior engineer
5. WHEN studying a topic, THE Study_Guide SHALL include detailed answers demonstrating problem-solving and technical depth

### Requirement 3: Python Backend Training Content

**User Story:** As a Python developer candidate, I want structured content covering fundamentals, API design, FastAPI, microservices, and live coding patterns, so that I can prepare for backend and automation roles.

#### Acceptance Criteria

1. THE Python_Backend_Track SHALL include a subdirectory for fundamentals and core concepts (Python internals, OOP, decorators, generators, async/await)
2. THE Python_Backend_Track SHALL include a subdirectory for API design patterns and best practices
3. THE Python_Backend_Track SHALL include a subdirectory for FastAPI-specific interview topics
4. THE Python_Backend_Track SHALL include a subdirectory for microservices architecture topics
5. THE Python_Backend_Track SHALL include a subdirectory for live coding interview patterns using Python
6. WHEN preparing for live coding, THE Study_Guide SHALL include common algorithm and data structure problems with Python solutions

### Requirement 4: System Design and Architecture Training Content

**User Story:** As an architecture candidate, I want structured content covering fundamentals, observability, cloud architecture, and DevOps topics, so that I can prepare for architect and senior engineering roles.

#### Acceptance Criteria

1. THE System_Design_Track SHALL include a subdirectory for fundamentals and core concepts (distributed systems principles, CAP theorem, consistency models, scalability patterns)
2. THE System_Design_Track SHALL include a subdirectory for observability architecture topics
3. THE System_Design_Track SHALL include a subdirectory for solutions architecture and cloud patterns
4. THE System_Design_Track SHALL include a subdirectory for DevOps engineering topics
5. THE System_Design_Track SHALL include a subdirectory for system design interview frameworks and templates
6. WHEN studying system design, THE Study_Guide SHALL include diagrams or diagram templates (Mermaid/ASCII)

### Requirement 5: Study Guide Template System

**User Story:** As a learner, I want consistent study guide templates, so that I can efficiently create and review interview preparation materials.

#### Acceptance Criteria

1. THE Repository SHALL include a template for mock interview Q&A study guides
2. WHEN creating a study guide, THE Template SHALL include sections for: question, detailed answer, key concepts, follow-up questions
3. THE Template SHALL include metadata fields for: difficulty level, target role, source job description
4. WHEN a study guide is created, THE System SHALL support markdown formatting for code blocks and diagrams

### Requirement 6: Practice Exercise Framework

**User Story:** As a learner, I want structured practice exercises, so that I can validate my understanding by recreating concepts independently.

#### Acceptance Criteria

1. THE Repository SHALL include a practice exercises directory within each training track
2. WHEN practicing a concept, THE Exercise SHALL provide a problem statement without the solution visible
3. THE Exercise SHALL include a separate solutions file for self-checking
4. WHEN completing an exercise, THE Learner SHALL be able to compare their solution against the reference

### Requirement 7: Progress Tracking (Enhancement)

**User Story:** As a learner, I want to track my progress across topics, so that I can identify gaps and measure improvement.

#### Acceptance Criteria

1. THE Repository SHALL include a progress tracking mechanism using markdown checklists
2. WHEN completing a study guide, THE Learner SHALL be able to mark topics as: not started, in progress, completed, needs review
3. THE Progress_Tracker SHALL provide a summary view of completion status per training track
4. WHEN reviewing progress, THE System SHALL highlight topics marked for review

### Requirement 8: Job Description Integration (Enhancement)

**User Story:** As a job seeker, I want to easily map job descriptions to relevant study materials, so that I can quickly prepare for specific opportunities.

#### Acceptance Criteria

1. THE Repository SHALL include a job-descriptions directory for storing target role descriptions
2. WHEN adding a job description, THE System SHALL support tagging with relevant training tracks and topics
3. THE Repository SHALL include a mapping guide linking common job requirements to study materials
4. WHEN preparing for an interview, THE Learner SHALL be able to create a focused study plan from a job description

### Requirement 9: Spaced Repetition Support (Enhancement)

**User Story:** As a learner, I want spaced repetition reminders, so that I can retain information more effectively over time.

#### Acceptance Criteria

1. THE Repository SHALL include a review schedule template for tracking when topics should be revisited
2. WHEN a topic is completed, THE Learner SHALL record the completion date for scheduling future reviews
3. THE Review_Schedule SHALL suggest review intervals (1 day, 3 days, 7 days, 14 days, 30 days)
4. WHEN reviewing the schedule, THE Learner SHALL see which topics are due for review

### Requirement 10: Mock Interview Simulation Templates (Enhancement)

**User Story:** As a learner, I want mock interview simulation templates, so that I can practice the full interview experience.

#### Acceptance Criteria

1. THE Repository SHALL include timed mock interview templates for each training track
2. WHEN simulating an interview, THE Template SHALL specify time limits for each question type
3. THE Template SHALL include behavioral question prompts alongside technical questions
4. WHEN completing a mock interview, THE Learner SHALL have a self-evaluation rubric to assess performance

### Requirement 11: Anki Flashcard Generation

**User Story:** As a learner, I want to automatically generate Anki cloze deletion flashcards from my study sessions, so that I can use spaced repetition to reinforce key concepts.

#### Acceptance Criteria

1. THE System SHALL generate Anki cloze deletion cards from completed study guide content
2. WHEN generating cards, THE System SHALL produce a minimum of 100 cards per study session
3. THE System SHALL export flashcards to an .apkg file format compatible with Anki import
4. WHEN creating cloze deletions, THE System SHALL identify key terms, definitions, code patterns, and concepts for deletion
5. THE System SHALL organize cards with tags matching the training track and topic
6. WHEN a study session is completed, THE Learner SHALL be able to trigger card generation for that session's content
7. THE System SHALL include both forward (concept → definition) and reverse (definition → concept) card variations where appropriate

### Requirement 12: Directory README Concept Guides

**User Story:** As a learner, I want each directory to have a README that serves as a concept guide, so that I can understand the topics covered and navigate the content effectively.

#### Acceptance Criteria

1. THE Repository SHALL include a README.md in every directory (training tracks and subdirectories)
2. WHEN viewing a directory README, THE Concept_Guide SHALL list all topics and questions covered in that directory
3. THE Concept_Guide SHALL provide a brief explanation of each topic's relevance to interviews
4. THE Concept_Guide SHALL include a table of contents linking to study guides and exercises within the directory
5. WHEN a new study guide is added, THE Concept_Guide SHALL be updated to reflect the new content
6. THE Concept_Guide SHALL indicate prerequisite knowledge or recommended study order where applicable
7. THE Concept_Guide SHALL include estimated time to complete the materials in that directory
