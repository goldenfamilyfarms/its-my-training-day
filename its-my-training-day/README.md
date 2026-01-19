# Its My Training Day 🎯

A personal technical interview preparation repository organized into three focused training tracks for senior engineering roles.

## Training Tracks

### 1. React/Node.js Full Stack (`react-nodejs-fullstack/`)
Comprehensive preparation for full-stack development roles covering:
- **Fundamentals**: React hooks, state management, Node.js event loop
- **Automation**: Testing frameworks, CI/CD, build tooling
- **Retail Operations**: Customer-facing and internal application patterns
- **Dashboards & Telemetry**: Observability, metrics, real-time data visualization

### 2. Python Backend (`python-backend/`)
Deep dive into Python backend development and automation:
- **Fundamentals**: Python internals, OOP, decorators, generators, async/await
- **API Design**: RESTful patterns, GraphQL, best practices
- **FastAPI**: Modern Python web framework specifics
- **Microservices**: Distributed architecture, service communication
- **Live Coding**: Algorithm and data structure interview patterns

### 3. System Design & Architecture (`system-design-architecture/`)
Architecture and system design interview preparation:
- **Fundamentals**: Distributed systems, CAP theorem, consistency models
- **Observability**: Monitoring, logging, tracing architecture
- **Solutions Architecture**: Cloud patterns, AWS/GCP/Azure designs
- **DevOps**: Infrastructure as code, deployment strategies
- **Interview Frameworks**: Structured approaches to design questions

## Quick Start Guide

### 1. Choose Your Focus
Start with the training track most relevant to your target role. Check `job-descriptions/` for mapping common job requirements to study materials.

### 2. Study with Structure
Each topic has a study guide with:
- Mock interview questions (as a senior engineer would ask)
- Detailed answers demonstrating technical depth
- Key concepts and follow-up questions

### 3. Practice Actively
Use the `_practice/` directories to:
- Solve problems without looking at solutions
- Compare your approach with reference solutions
- Time yourself for realistic interview simulation

### 4. Track Progress
Update `progress.md` as you complete topics:
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- 🔁 Needs Review

### 5. Generate Flashcards
Use the Anki generator tool to create spaced repetition cards:
```bash
python -m anki_generator generate --input "./path/to/study-guide.md" --output "./_anki/"
```

### 6. Schedule Reviews
Follow the spaced repetition schedule (1, 3, 7, 14, 30 days) to retain information effectively.

## Repository Structure

```
its-my-training-day/
├── README.md                          # This file
├── progress.md                        # Track your learning progress
├── _templates/                        # Templates for creating new content
├── _tools/                            # Anki generator and utilities
├── job-descriptions/                  # JD library and mapping guide
├── react-nodejs-fullstack/            # Full stack training track
├── python-backend/                    # Python backend training track
└── system-design-architecture/        # System design training track
```

## Getting Started

1. **Review the tracks**: Read each track's README to understand the scope
2. **Assess your gaps**: Use job descriptions to identify priority topics
3. **Create a study plan**: Focus on 2-3 topics at a time
4. **Study → Practice → Review**: Follow the learning cycle consistently
5. **Track everything**: Update progress.md after each session

Good luck with your interview preparation! 🚀
