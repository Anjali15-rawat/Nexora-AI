import { test } from 'node:test';
import assert from 'node:assert';
import { generateElevenLabsSpeechHandler } from '../src/lib/api/voice.functions';

test('Voice API - Rejects Anonymous Requests', async () => {
  // Enforce a real database state so requireAuth runs
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://real-supabase-url.supabase.co';

  try {
    // When running under test without cookies/headers, requireAuth must fail
    const result = await generateElevenLabsSpeechHandler({ data: { text: 'Hello world' } });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Authentication required');
  } finally {
    process.env.SUPABASE_URL = originalSupabaseUrl;
  }
});

test('Voice API - Rejects Anonymous in Mock Auth Mode', async () => {
  // Enforce placeholder mode
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://placeholder.supabase.co';

  try {
    // Under mock mode, it looks for a token. Without headers/cookies, token is null, so it must reject.
    const result = await generateElevenLabsSpeechHandler({ data: { text: 'Hello mock' } });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Authentication required');
  } finally {
    process.env.SUPABASE_URL = originalSupabaseUrl;
  }
});
