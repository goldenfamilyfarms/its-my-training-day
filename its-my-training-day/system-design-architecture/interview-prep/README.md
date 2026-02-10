# Interview Prep

Structured approaches, practice exercises, and templates for system design interviews. Use these alongside the study guides to build interview-ready fluency.

## Contents

### RESHADED Framework

The recommended framework for structuring 45-60 minute system design interviews:

| Step | Time (45 min) | Focus |
|------|---------------|-------|
| **R**equirements | 3-5 min | Clarify functional & non-functional scope |
| **E**stimation | 3-5 min | QPS, storage, bandwidth |
| **S**torage | 5 min | Data model, database choice |
| **H**igh-Level Design | 10-15 min | Components, data flow |
| **A**PI Design | 3-5 min | Key endpoints & contracts |
| **D**etailed Design | 10-15 min | Deep dive 1-2 components |
| **E**valuate | 5-7 min | Trade-offs, bottlenecks |
| **D**iscuss | remaining | Extensions, improvements |

### Mock Interview Template

Use [mock-interview-template.md](./mock-interview-template.md) for full 60-minute practice sessions. Includes:
- Warm-up questions and fundamentals deep-dive
- System design exercise using the RESHADED framework
- Architecture discussion (operational concerns, failure scenarios)
- Self-evaluation rubric with scoring

### Practice Exercises

| Exercise | Difficulty | Focus Area | Est. Time |
|----------|------------|------------|-----------|
| [URL Shortener](./practice/url-shortener-problem.md) | Intermediate | Distributed Systems, Caching | 45 min |

Each exercise includes a problem statement with constraints and a [reference solution](./practice/url-shortener-solution.md) with architecture diagrams and trade-off analysis.

## How to Practice

1. Pick a problem and set a timer (45-60 min)
2. Follow the RESHADED framework to structure your answer
3. Draw diagrams and talk through your thinking out loud
4. Compare against the reference solution
5. Use the mock interview template for full simulation runs
6. Score yourself using the self-evaluation rubric

## Tips

- **Time yourself** -- real interviews have strict limits
- **Talk out loud** -- practice explaining your thinking
- **Draw diagrams** -- visual communication is essential
- **Consider trade-offs** -- there's no perfect solution
- **Start simple, then add complexity** -- iterative design impresses interviewers
