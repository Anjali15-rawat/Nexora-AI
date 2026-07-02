// Rate limiting and security utilities for server-side use.
// Uses an in-memory token-bucket approach. For production at scale,
// swap to a Redis-backed implementation.

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of buckets) {
    // Remove entries older than 10 minutes
    if (now - entry.lastRefill > 10 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Unique key for this rate limit (e.g., "login:192.168.1.1") */
  key: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check if a request is within rate limits.
 * Uses a token-bucket algorithm.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  cleanup();

  const { key, maxRequests, windowMs } = options;
  const now = Date.now();

  let entry = buckets.get(key);

  if (!entry) {
    entry = { tokens: maxRequests - 1, lastRefill: now };
    buckets.set(key, entry);
    return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refillRate = maxRequests / windowMs;
  const tokensToAdd = elapsed * refillRate;
  entry.tokens = Math.min(maxRequests, entry.tokens + tokensToAdd);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    const retryAfterMs = Math.ceil((1 - entry.tokens) / refillRate);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.tokens -= 1;
  return { allowed: true, remaining: Math.floor(entry.tokens), retryAfterMs: 0 };
}

/** Rate limit presets for common operations */
export const RATE_LIMITS = {
  /** 5 login attempts per minute */
  login: { maxRequests: 5, windowMs: 60 * 1000 },
  /** 3 signup attempts per minute */
  signup: { maxRequests: 3, windowMs: 60 * 1000 },
  /** 3 password reset requests per minute */
  passwordReset: { maxRequests: 3, windowMs: 60 * 1000 },
  /** 10 API requests per minute */
  api: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;

/**
 * Extracts a client identifier for rate limiting.
 * Falls back to a generic key if no identifiable header is found.
 */
export async function getClientIdentifier(): Promise<string> {
  try {
    // Dynamically import to avoid browser bundling compilation errors
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    const headers = getRequestHeaders();
    
    if (headers) {
      // Prioritize Cloudflare connecting IP
      const cfIp = headers.get("cf-connecting-ip");
      if (cfIp) return cfIp.trim();

      // Fallback to standard Real IP
      const realIp = headers.get("x-real-ip");
      if (realIp) return realIp.trim();

      // Fallback to X-Forwarded-For (take the first client IP in the chain)
      const forwardedFor = headers.get("x-forwarded-for");
      if (forwardedFor) {
        const parts = forwardedFor.split(",");
        const clientIp = parts[0]?.trim();
        if (clientIp) return clientIp;
      }
    }
    return "unknown-ip";
  } catch (error) {
    console.warn("[Security] Could not extract request headers for client identifier:", error);
    return "fallback-global";
  }
}

/**
 * Generic safe error message for authentication failures.
 * Never reveals whether the email exists or the password was wrong.
 */
export const AUTH_ERROR_GENERIC = "Invalid email or password. Please try again.";
export const RATE_LIMIT_ERROR = "Too many attempts. Please wait a moment and try again.";
