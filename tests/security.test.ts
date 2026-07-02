import { test } from 'node:test';
import assert from 'node:assert';
import { checkRateLimit, getClientIdentifier } from '../src/lib/security.server';

test('Rate Limiter - Basic Limits and Exceeding', (t) => {
  const rateLimitOptions = {
    key: 'test-user-1',
    maxRequests: 3,
    windowMs: 1000,
  };

  // Deplete tokens
  const r1 = checkRateLimit(rateLimitOptions);
  assert.strictEqual(r1.allowed, true);
  assert.strictEqual(r1.remaining, 2);

  const r2 = checkRateLimit(rateLimitOptions);
  assert.strictEqual(r2.allowed, true);
  assert.strictEqual(r2.remaining, 1);

  const r3 = checkRateLimit(rateLimitOptions);
  assert.strictEqual(r3.allowed, true);
  assert.strictEqual(r3.remaining, 0);

  // 4th request must be blocked
  const r4 = checkRateLimit(rateLimitOptions);
  assert.strictEqual(r4.allowed, false);
  assert.strictEqual(r4.remaining, 0);
  assert.ok(r4.retryAfterMs > 0);
});

test('Rate Limiter - Key Isolation', (t) => {
  const options1 = { key: 'user-a', maxRequests: 1, windowMs: 1000 };
  const options2 = { key: 'user-b', maxRequests: 1, windowMs: 1000 };

  // Trigger limit for user-a
  assert.strictEqual(checkRateLimit(options1).allowed, true);
  assert.strictEqual(checkRateLimit(options1).allowed, false);

  // User-b should still be allowed
  assert.strictEqual(checkRateLimit(options2).allowed, true);
});

test('Rate Limiter - Token Bucket Refill via Date Mock', (t) => {
  const options = { key: 'refill-user', maxRequests: 2, windowMs: 1000 };

  // Deplete tokens
  checkRateLimit(options);
  checkRateLimit(options);
  assert.strictEqual(checkRateLimit(options).allowed, false);

  // Mock Date.now to simulate elapsed time (1000ms later)
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });

  Date.now = () => originalNow() + 1000;

  // Should refill 2 tokens
  const rRefilled = checkRateLimit(options);
  assert.strictEqual(rRefilled.allowed, true);
  assert.strictEqual(rRefilled.remaining, 1);
});

test('Client Identifier - Fallback behavior outside HTTP context', async () => {
  const id = await getClientIdentifier();
  // Outside of an active HTTP server request execution, getRequestHeaders will fail
  // or throw, leading to a fallback string.
  assert.ok(typeof id === 'string');
  assert.ok(id === 'fallback-global' || id === 'unknown-ip');
});
