# Practice Exercise: Design a URL Shortener

## Metadata
- **Related Study Guide**: [cap-theorem-study-guide](../fundamentals/cap-theorem-study-guide.md)
- **Track**: system-design-architecture
- **Difficulty**: intermediate
- **Time Limit**: 45 minutes
- **Type**: system-design

## Problem Statement

Design a URL shortening service like bit.ly or TinyURL. The service should take long URLs and generate short, unique aliases that redirect users to the original URL.

This is a classic system design interview question that tests your ability to design scalable, distributed systems while making appropriate trade-offs.

## Requirements

### Functional Requirements
- Given a long URL, generate a short unique URL
- When users access the short URL, redirect to the original URL
- Users can optionally specify a custom short URL alias
- Short URLs should expire after a configurable time (default: never)
- Track basic analytics (click count, last accessed)

### Non-Functional Requirements
- High availability (99.9% uptime)
- Low latency redirects (< 100ms p99)
- Short URLs should be as short as possible
- System should handle 100M new URLs per month
- Read-heavy workload (100:1 read to write ratio)

## Constraints

- URL length: Short URLs should be ≤ 7 characters (excluding domain)
- Scale: 100M new URLs/month, 10B redirects/month
- Storage: URLs stored for 5 years by default
- Geography: Global users, optimize for latency worldwide

## Capacity Estimation

Before designing, estimate the following:

### Traffic
- New URLs per second: ?
- Redirects per second: ?

### Storage
- Average URL length: ~100 characters
- Metadata per URL: ~500 bytes
- Total storage for 5 years: ?

### Bandwidth
- Incoming (writes): ?
- Outgoing (reads): ?

## Design Considerations

Think about these aspects in your design:

1. **URL Generation**: How do you generate unique short codes?
2. **Data Storage**: What database(s) would you use and why?
3. **Caching**: What caching strategy would improve performance?
4. **Scalability**: How does the system scale horizontally?
5. **Availability**: How do you ensure high availability?
6. **Analytics**: How do you track clicks without impacting latency?

## Hints (Optional)

<details>
<summary>Hint 1: Short Code Generation</summary>

Consider these approaches for generating unique short codes:
- **Base62 encoding**: Use [a-zA-Z0-9] for 62 characters
- **Hash-based**: MD5/SHA256 of URL, take first N characters
- **Counter-based**: Increment a counter, encode to base62
- **Pre-generated**: Generate codes in advance, assign on demand

Each has trade-offs around uniqueness, predictability, and coordination.

</details>

<details>
<summary>Hint 2: Database Choice</summary>

Consider the access patterns:
- Writes: Insert new URL mappings (relatively infrequent)
- Reads: Look up short code → long URL (very frequent)

A key-value store might be ideal for the core lookup. But what about:
- Custom aliases (need uniqueness check)?
- Analytics (need counters)?
- Expiration (need TTL)?

</details>

<details>
<summary>Hint 3: Caching Strategy</summary>

With a 100:1 read-to-write ratio, caching is essential:
- What percentage of URLs are accessed frequently? (Pareto principle)
- Where should caches be located? (CDN, application layer, database)
- What's the cache eviction policy?
- How do you handle cache invalidation for expired URLs?

</details>

## Deliverables

Your design should include:

1. **High-level architecture diagram** showing all components
2. **API design** for core operations
3. **Database schema** with justification
4. **Short code generation algorithm** with collision handling
5. **Caching strategy** with cache placement
6. **Scalability approach** for handling growth
7. **Trade-off analysis** for key decisions

## Evaluation Criteria

- [ ] Requirements: Addressed all functional and non-functional requirements
- [ ] Estimation: Reasonable capacity calculations
- [ ] Architecture: Clear, scalable component design
- [ ] Data Model: Appropriate database choice with schema
- [ ] Trade-offs: Discussed alternatives and justified decisions
- [ ] Communication: Clear diagrams and explanations

---

**When you're ready, check your solution against:** [url-shortener-solution.md](./url-shortener-solution.md)
