# Interview Content Generation Guide

When the user asks to generate interview preparation content from a job description or create study materials, follow these instructions.

## Job Description Analysis Workflow

When given a job description:

1. **Extract Key Topics**: Identify technical skills, frameworks, and concepts mentioned
2. **Map to Training Tracks**: Categorize topics into:
   - `react-nodejs-fullstack/` - React, Node.js, JavaScript, frontend, full stack
   - `python-backend/` - Python, FastAPI, Django, backend, automation
   - `system-design-architecture/` - Distributed systems, cloud, scalability, architecture
3. **Prioritize**: Rank topics by frequency/emphasis in the JD
4. **Generate Content**: Create study guides for the top 3-5 topics

## Study Guide Generation

Use the template at `its-my-training-day/_templates/study-guide-template.md`

Required sections:
- **Metadata**: Track, subdomain, difficulty, target roles, estimated time
- **Questions**: 5-10 questions phrased as a senior engineer would ask
- **Answers**: Detailed responses showing technical depth and problem-solving
- **Key Concepts**: 2-4 concepts per question with brief explanations
- **Follow-up Questions**: 2-3 follow-ups to deepen understanding

Question quality guidelines:
- Start with "How would you..." or "Explain..." or "What happens when..."
- Include scenario-based questions ("You're debugging a production issue where...")
- Mix conceptual and practical questions
- Include at least one "compare and contrast" question

## File Naming Convention

- Study guides: `{topic-name}-study-guide.md` (kebab-case)
- Place in appropriate subdirectory: `its-my-training-day/{track}/{subdomain}/`

## Practice Exercise Generation

When creating practice exercises:
- Problem file: `{exercise-name}-problem.md` in `_practice/`
- Solution file: `{exercise-name}-solution.md` in `_practice/`
- Use templates from `its-my-training-day/_templates/`

## After Content Creation

Remind the user to:
1. Run the Anki generator to create flashcards
2. Update `progress.md` with the new topic
3. Update the subdirectory README with the new study guide

## Example Prompt Response

When user says "Generate study content from this JD: [job description]":

1. Summarize the key technical requirements
2. List which training track(s) apply
3. Propose 3-5 study guide topics
4. Ask user to confirm before generating
5. Create the study guides in the correct locations
