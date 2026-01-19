/**
 * Interview Question 8: Advanced API Rate Limiting in Node.js
 * 
 * Implement a comprehensive rate limiting system for a compliance API that
 * supports multiple strategies, per-user limits, and distributed rate limiting
 * across multiple server instances.
 * 
 * Key Technical Requirements:
 * - Multiple rate limiting algorithms (token bucket, sliding window, fixed window)
 * - Per-user and per-IP rate limits
 * - Distributed rate limiting with Redis
 * - Rate limit headers in responses
 * - Graceful degradation
 */

import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

// Types
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  algorithm: 'token-bucket' | 'sliding-window' | 'fixed-window';
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Rate Limiter Interface
interface RateLimiter {
  check(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }>;
  reset(key: string): Promise<void>;
}

// Token Bucket Implementation
class TokenBucketLimiter implements RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private windowMs: number
  ) {}

  async check(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.capacity, lastRefill: now };
    
    // Refill tokens
    const elapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    this.buckets.set(key, bucket);

    const allowed = bucket.tokens >= 1;
    if (allowed) {
      bucket.tokens -= 1;
    }

    const reset = now + this.windowMs;
    const remaining = Math.floor(bucket.tokens);

    return {
      allowed,
      info: {
        limit: this.capacity,
        remaining,
        reset,
        retryAfter: allowed ? undefined : Math.ceil((1 - bucket.tokens) / this.refillRate),
      },
    };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

// Sliding Window Implementation
class SlidingWindowLimiter implements RateLimiter {
  private windows: Map<string, number[]> = new Map();

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  async check(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const window = this.windows.get(key) || [];
    
    // Remove old requests outside window
    const cutoff = now - this.windowMs;
    const recentRequests = window.filter(timestamp => timestamp > cutoff);

    const allowed = recentRequests.length < this.maxRequests;
    if (allowed) {
      recentRequests.push(now);
    }

    this.windows.set(key, recentRequests);

    const reset = recentRequests.length > 0
      ? recentRequests[0] + this.windowMs
      : now + this.windowMs;

    return {
      allowed,
      info: {
        limit: this.maxRequests,
        remaining: Math.max(0, this.maxRequests - recentRequests.length),
        reset,
        retryAfter: allowed ? undefined : Math.ceil((recentRequests[0] + this.windowMs - now) / 1000),
      },
    };
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }
}

// Fixed Window Implementation
class FixedWindowLimiter implements RateLimiter {
  private windows: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  async check(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const window = this.windows.get(key);

    // Check if window expired
    if (!window || now >= window.resetTime) {
      this.windows.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        info: {
          limit: this.maxRequests,
          remaining: this.maxRequests - 1,
          reset: now + this.windowMs,
        },
      };
    }

    const allowed = window.count < this.maxRequests;
    if (allowed) {
      window.count += 1;
    }

    return {
      allowed,
      info: {
        limit: this.maxRequests,
        remaining: Math.max(0, this.maxRequests - window.count),
        reset: window.resetTime,
        retryAfter: allowed ? undefined : Math.ceil((window.resetTime - now) / 1000),
      },
    };
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }
}

// Rate Limiter Factory
class RateLimiterFactory {
  static create(config: RateLimitConfig): RateLimiter {
    switch (config.algorithm) {
      case 'token-bucket':
        return new TokenBucketLimiter(
          config.maxRequests,
          config.maxRequests / (config.windowMs / 1000),
          config.windowMs
        );
      case 'sliding-window':
        return new SlidingWindowLimiter(config.windowMs, config.maxRequests);
      case 'fixed-window':
        return new FixedWindowLimiter(config.windowMs, config.maxRequests);
      default:
        throw new Error(`Unknown algorithm: ${config.algorithm}`);
    }
  }
}

// Express Middleware
export function rateLimitMiddleware(config: RateLimitConfig) {
  const limiter = RateLimiterFactory.create(config);
  const keyGenerator = config.keyGenerator || ((req: Request) => req.ip || 'unknown');

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    
    try {
      const { allowed, info } = await limiter.check(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', info.limit.toString());
      res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.reset).toISOString());
      
      if (info.retryAfter) {
        res.setHeader('Retry-After', info.retryAfter.toString());
      }

      if (!allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: info.retryAfter,
        });
      }

      next();
    } catch (error) {
      // Graceful degradation: allow request if rate limiter fails
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

// Multi-tier rate limiting
export function multiTierRateLimit(
  tiers: Array<{ config: RateLimitConfig; condition?: (req: Request) => boolean }>
) {
  const limiters = tiers.map(tier => ({
    limiter: RateLimiterFactory.create(tier.config),
    condition: tier.condition || (() => true),
    keyGenerator: tier.config.keyGenerator || ((req: Request) => req.ip || 'unknown'),
  }));

  return async (req: Request, res: Response, next: NextFunction) => {
    for (const { limiter, condition, keyGenerator } of limiters) {
      if (!condition(req)) continue;

      const key = keyGenerator(req);
      const { allowed, info } = await limiter.check(key);

      if (!allowed) {
        res.setHeader('X-RateLimit-Limit', info.limit.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', (info.retryAfter || 0).toString());
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: info.retryAfter,
        });
      }
    }

    next();
  };
}

// Example usage
export function setupRateLimiting() {
  // Per-IP rate limit
  const ipRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    algorithm: 'sliding-window',
  });

  // Per-user rate limit (requires authentication)
  const userRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: 1000,
    algorithm: 'token-bucket',
    keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
  });

  // Multi-tier: Different limits for different endpoints
  const apiRateLimit = multiTierRateLimit([
    {
      config: {
        windowMs: 60 * 1000,
        maxRequests: 10,
        algorithm: 'fixed-window',
      },
      condition: (req) => req.path.startsWith('/api/compliance/evidence'),
    },
    {
      config: {
        windowMs: 60 * 1000,
        maxRequests: 100,
        algorithm: 'sliding-window',
      },
      condition: () => true, // Apply to all
    },
  ]);

  return { ipRateLimit, userRateLimit, apiRateLimit };
}

/**
 * Key Concepts Explained:
 * 
 * 1. Token Bucket: Allows bursts, refills over time. Good for variable rate.
 * 
 * 2. Sliding Window: More accurate, tracks exact request times. Better for
 *    strict limits but more memory intensive.
 * 
 * 3. Fixed Window: Simple, resets at interval. Can allow 2x limit at boundary.
 * 
 * 4. Multi-tier: Different limits for different users/endpoints. More flexible.
 * 
 * 5. Distributed: Use Redis for shared state across instances. Essential for
 *    horizontal scaling.
 * 
 * Interview Talking Points:
 * - Algorithm choice: Token bucket for bursts, sliding window for accuracy
 * - Distributed limiting: Redis for shared state, consistency challenges
 * - Graceful degradation: Allow requests if limiter fails, don't break app
 * - Headers: Standard headers for client awareness, retry-after for guidance
 */

export { RateLimiterFactory, TokenBucketLimiter, SlidingWindowLimiter, FixedWindowLimiter };

