import { test } from 'node:test';
import assert from 'node:assert';
import { generateContentStream } from '../src/lib/ai/gemini.server.ts';

test('Gemini Stream - Correctly parses SSE newlines and returns stream text', async (t) => {
  // Save original fetch
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;

  process.env.GEMINI_API_KEY = 'mock-api-key';

  // Mock fetch
  global.fetch = async (url, options) => {
    // SSE formatted body with raw \n newlines
    const sseContent = 
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n' +
      'data: {"candidates":[{"content":{"parts":[{"text":" "}]}}]}\n' +
      'data: {"candidates":[{"content":{"parts":[{"text":"world!"}]}}]}\n' +
      'data: [DONE]\n';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseContent));
        controller.close();
      }
    });

    return {
      ok: true,
      body: stream,
      headers: new Headers(),
    } as unknown as Response;
  };

  t.after(() => {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  // Call the function
  const resultStream = await generateContentStream('Say hello');
  const reader = resultStream.getReader();
  const decoder = new TextDecoder();
  let resultText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    resultText += decoder.decode(value);
  }

  // The split parser should have correctly parsed and merged the chunks into "Hello world!"
  assert.strictEqual(resultText, 'Hello world!');
});

test('Gemini Stream - Handles chunks split across packet boundaries', async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;

  process.env.GEMINI_API_KEY = 'mock-api-key';

  global.fetch = async (url, options) => {
    // Send fragments split across boundaries
    const chunk1 = 'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\ndata: {"candidates":[{"con';
    const chunk2 = 'tent":{"parts":[{"text":" world"}]}}]}\ndata: [DONE]\n';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(chunk1));
        controller.enqueue(new TextEncoder().encode(chunk2));
        controller.close();
      }
    });

    return {
      ok: true,
      body: stream,
      headers: new Headers(),
    } as unknown as Response;
  };

  t.after(() => {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  const resultStream = await generateContentStream('Say hello');
  const reader = resultStream.getReader();
  const decoder = new TextDecoder();
  let resultText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    resultText += decoder.decode(value);
  }

  // The parser must combine "Hello" and " world" across chunks without losing text
  assert.strictEqual(resultText, 'Hello world');
});
