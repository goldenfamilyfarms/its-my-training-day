# Mock Interview: Python Backend

## Interview Details
- **Date**: {YYYY-MM-DD}
- **Track**: Python Backend
- **Target Role**: {Backend Engineer | Python Developer | Senior Software Engineer}
- **Total Duration**: 60 minutes
- **Focus Areas**: Python internals, API design, FastAPI, microservices, algorithms

---

## Time Allocation

| Section | Duration | Focus |
|---------|----------|-------|
| Introduction & Warm-up | 5 min | Background, Python experience |
| Python Fundamentals | 10 min | Internals, OOP, async |
| API & Architecture | 10 min | Design patterns, FastAPI |
| Live Coding Exercise | 25 min | Algorithm or API implementation |
| Behavioral Questions | 5 min | STAR format |
| Your Questions | 5 min | Role, team, tech stack |

---

## Section 1: Introduction (5 minutes)

### Warm-up Questions
1. Tell me about your Python backend experience.
2. What's the most complex Python system you've built or maintained?

### Your Response Notes
{Record key points from your response}

---

## Section 2: Python Fundamentals (10 minutes)

### Q1: Python Internals
**Time**: 5 minutes

"Explain how Python's GIL works and its implications for concurrent programming. How do you handle CPU-bound vs I/O-bound tasks?"

**Key Points to Cover**:
- [ ] GIL purpose and behavior
- [ ] Threading vs. multiprocessing
- [ ] asyncio for I/O-bound tasks
- [ ] When to use each approach
- [ ] Real-world example

**Your Answer**:
{Record your response}

---

### Q2: Decorators & Metaprogramming
**Time**: 5 minutes

"Explain how decorators work in Python. Can you describe a scenario where you'd write a custom decorator?"

**Key Points to Cover**:
- [ ] Decorator syntax and mechanics
- [ ] Closures and function wrapping
- [ ] functools.wraps usage
- [ ] Class decorators vs. function decorators
- [ ] Practical use cases (logging, caching, auth)

**Your Answer**:
{Record your response}

---

## Section 3: API & Architecture (10 minutes)

### Q1: API Design
**Time**: 5 minutes

"Design a REST API for a user authentication system. What endpoints would you create and how would you handle security?"

**Key Points to Cover**:
- [ ] RESTful endpoint design
- [ ] Authentication flow (JWT, OAuth)
- [ ] Password hashing (bcrypt, argon2)
- [ ] Rate limiting and brute force protection
- [ ] Input validation and error responses

**Your Answer**:
{Record your response}

---

### Q2: FastAPI & Async Patterns
**Time**: 5 minutes

"Compare FastAPI to Flask/Django. When would you choose FastAPI, and how do you handle database operations in an async context?"

**Key Points to Cover**:
- [ ] FastAPI advantages (async, type hints, auto-docs)
- [ ] Pydantic for validation
- [ ] Async database drivers (asyncpg, databases)
- [ ] Dependency injection in FastAPI
- [ ] Background tasks and workers

**Your Answer**:
{Record your response}

---

## Section 4: Live Coding Exercise (25 minutes)

### Option A: Algorithm Challenge

**Problem**: Implement an LRU (Least Recently Used) Cache with the following requirements:
- O(1) time complexity for get and put operations
- Fixed capacity with eviction of least recently used items
- Thread-safe implementation (bonus)

```python
class LRUCache:
    def __init__(self, capacity: int):
        # Your implementation
        pass
    
    def get(self, key: int) -> int:
        # Your implementation
        pass
    
    def put(self, key: int, value: int) -> None:
        # Your implementation
        pass

# Test cases to verify:
# cache = LRUCache(2)
# cache.put(1, 1)
# cache.put(2, 2)
# cache.get(1)       # returns 1
# cache.put(3, 3)    # evicts key 2
# cache.get(2)       # returns -1 (not found)
```

**Your Solution**:
```python
# Your code here
```

**Complexity Analysis**:
- Time: O(?)
- Space: O(?)

---

### Option B: API Implementation Challenge

**Problem**: Build a FastAPI endpoint for a rate-limited URL shortener:
- POST /shorten - accepts URL, returns short code
- GET /{code} - redirects to original URL
- Rate limit: 10 requests per minute per IP
- Store in memory (no database required)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Your implementation here
```

**Your Solution**:
```python
# Your code here
```

**Approach Explanation**:
{Explain your thought process}

---

## Section 5: Behavioral Questions (5 minutes)

### Question: "Tell me about a time you had to debug a complex production issue in a Python application."

**Situation**:
{Describe the context}

**Task**:
{What was your responsibility}

**Action**:
{What did you do - tools used, approach taken}

**Result**:
{What was the outcome, what did you learn}

---

### Common Behavioral Prompts for Python Backend Roles
- Describe a time you optimized a slow Python application
- Tell me about a time you had to learn a new framework quickly
- How do you approach writing maintainable Python code?
- Describe a challenging data processing problem you solved

---

## Section 6: Your Questions (5 minutes)

### Suggested Questions
1. What Python version and frameworks does the team use?
2. How do you handle testing and CI/CD for Python services?
3. What's the team's approach to code review?
4. How do Python services interact with other parts of the system?

### Your Questions
1. {Your question}
2. {Your question}

---

## Self-Evaluation Rubric

### Python Fundamentals
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| GIL and concurrency | | |
| Decorators and closures | | |
| OOP principles | | |
| Memory management | | |
| Standard library knowledge | | |

### API & Architecture
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| REST API design | | |
| FastAPI proficiency | | |
| Authentication patterns | | |
| Database design | | |
| Microservices concepts | | |

### Live Coding
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| Algorithm knowledge | | |
| Data structure selection | | |
| Code quality (Pythonic) | | |
| Edge case handling | | |
| Testing awareness | | |
| Communication while coding | | |

### Communication
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| Clarity of explanations | | |
| Technical depth | | |
| Asking clarifying questions | | |

### Behavioral
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| STAR format usage | | |
| Concrete examples | | |
| Problem-solving narrative | | |

---

## Score Summary

**Total Score**: {sum} / 100

| Rating | Score Range | Interpretation |
|--------|-------------|----------------|
| Excellent | 80-100 | Ready for senior roles |
| Good | 60-79 | Ready for mid-level, prep for senior |
| Fair | 40-59 | More practice needed |
| Needs Work | <40 | Focus on fundamentals |

---

## Action Items

### Strengths
1. {strength}
2. {strength}

### Areas for Improvement
1. {area} - Study: {specific topic}
2. {area} - Practice: {specific exercise}

### Study Guides to Review
- [ ] [Python Decorators](./fundamentals/python-decorators-study-guide.md)
- [ ] {other relevant guides}

### Practice Problems to Attempt
- [ ] [LRU Cache](./_practice/lru-cache-problem.md)
- [ ] {other problems}

### Next Mock Interview: {YYYY-MM-DD}
