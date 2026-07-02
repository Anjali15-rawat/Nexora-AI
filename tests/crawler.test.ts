import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { crawlPage, isPrivateOrReservedIp } from '../src/lib/crawl/lightweight-crawler.server.ts';

test('isPrivateOrReservedIp - IPv4 Ranges', () => {
  // Loopback
  assert.strictEqual(isPrivateOrReservedIp('127.0.0.1'), true);
  assert.strictEqual(isPrivateOrReservedIp('127.255.0.1'), true);

  // Private subnets
  assert.strictEqual(isPrivateOrReservedIp('10.0.0.1'), true);
  assert.strictEqual(isPrivateOrReservedIp('172.16.1.10'), true);
  assert.strictEqual(isPrivateOrReservedIp('172.31.255.255'), true);
  assert.strictEqual(isPrivateOrReservedIp('192.168.1.1'), true);

  // Link-local
  assert.strictEqual(isPrivateOrReservedIp('169.254.169.254'), true);

  // Multicast
  assert.strictEqual(isPrivateOrReservedIp('224.0.0.1'), true);

  // Unspecified / Reserved
  assert.strictEqual(isPrivateOrReservedIp('0.0.0.0'), true);
  assert.strictEqual(isPrivateOrReservedIp('240.0.0.1'), true);

  // Public IP
  assert.strictEqual(isPrivateOrReservedIp('8.8.8.8'), false);
  assert.strictEqual(isPrivateOrReservedIp('1.1.1.1'), false);
});

test('isPrivateOrReservedIp - IPv6 Ranges', () => {
  // Loopback
  assert.strictEqual(isPrivateOrReservedIp('::1'), true);
  assert.strictEqual(isPrivateOrReservedIp('0:0:0:0:0:0:0:1'), true);

  // Link-local
  assert.strictEqual(isPrivateOrReservedIp('fe80::1'), true);

  // Unique Local / Private
  assert.strictEqual(isPrivateOrReservedIp('fc00::'), true);
  assert.strictEqual(isPrivateOrReservedIp('fd00::1'), true);

  // Multicast
  assert.strictEqual(isPrivateOrReservedIp('ff02::1'), true);

  // Public IPv6
  assert.strictEqual(isPrivateOrReservedIp('2001:4860:4860::8888'), false);
});

test('Crawler Integration Suite', async (suiteContext) => {
  
  await suiteContext.test('crawlPage - SSRF Block Loopback and Private IPs', async () => {
    // Test loopbacks
    try {
      await crawlPage('http://localhost');
    } catch (e) {
      console.log('DEBUG http://localhost error:', e);
    }

    try {
      await crawlPage('http://127.0.0.1');
    } catch (e) {
      console.log('DEBUG http://127.0.0.1 error:', e);
    }

    try {
      await crawlPage('http://[::1]');
    } catch (e) {
      console.log('DEBUG http://[::1] error:', e);
    }

    await assert.rejects(crawlPage('http://localhost'), /SSRF_BLOCKED/);
    await assert.rejects(crawlPage('http://127.0.0.1'), /SSRF_BLOCKED/);
    await assert.rejects(crawlPage('http://[::1]'), /SSRF_BLOCKED/);

    // Test private subnets
    await assert.rejects(crawlPage('http://10.0.0.1'), /SSRF_BLOCKED/);
    await assert.rejects(crawlPage('http://172.16.0.1'), /SSRF_BLOCKED/);
    await assert.rejects(crawlPage('http://192.168.1.1'), /SSRF_BLOCKED/);

    // Test link-local metadata endpoint
    await assert.rejects(crawlPage('http://169.254.169.254'), /SSRF_BLOCKED/);
  });

  await suiteContext.test('crawlPage - Unsupported Protocols and Invalid URLs', async () => {
    try {
      await crawlPage('ftp://example.com');
    } catch (e) {
      console.log('DEBUG ftp://example.com error:', e);
    }
    try {
      await crawlPage('invalid-url-string');
    } catch (e) {
      console.log('DEBUG invalid-url-string error:', e);
    }

    await assert.rejects(crawlPage('ftp://example.com'), /UNSUPPORTED_PROTOCOL/);
    await assert.rejects(crawlPage('file:///etc/passwd'), /UNSUPPORTED_PROTOCOL/);
    await assert.rejects(crawlPage('data:text/html,hello'), /UNSUPPORTED_PROTOCOL/);
    await assert.rejects(crawlPage('invalid-url-string'), /INVALID_URL/);
  });

  await suiteContext.test('crawlPage - Handle Oversized Response', async (t) => {
    const originalRequest = https.request;

    https.request = (options: any, callback: any) => {
      const mockRes = new EventEmitter() as any;
      mockRes.statusCode = 200;
      mockRes.headers = { 'content-type': 'text/html' };
      mockRes.setEncoding = () => {};

      const mockReq = new EventEmitter() as any;
      mockReq.end = () => {
        process.nextTick(() => {
          callback(mockRes);
          mockRes.emit('data', Buffer.alloc(600000)); // 600KB
        });
      };

      mockReq.destroy = (err: any) => {
        process.nextTick(() => {
          mockReq.emit('error', err);
        });
      };

      return mockReq;
    };

    t.after(() => {
      https.request = originalRequest;
    });

    await assert.rejects(crawlPage('https://example.com'), /OVERSIZED_RESPONSE/);
  });

  await suiteContext.test('crawlPage - Reject Non-HTML Content Type', async (t) => {
    const originalRequest = https.request;

    https.request = (options: any, callback: any) => {
      const mockRes = new EventEmitter() as any;
      mockRes.statusCode = 200;
      mockRes.headers = { 'content-type': 'image/png' };
      mockRes.setEncoding = () => {};

      const mockReq = new EventEmitter() as any;
      mockReq.end = () => {
        process.nextTick(() => {
          callback(mockRes);
        });
      };

      mockReq.destroy = (err: any) => {
        process.nextTick(() => {
          mockReq.emit('error', err);
        });
      };

      return mockReq;
    };

    t.after(() => {
      https.request = originalRequest;
    });

    await assert.rejects(crawlPage('https://example.com'), /UNSUPPORTED_CONTENT_TYPE/);
  });

  await suiteContext.test('crawlPage - Timeout Trigger', async (t) => {
    const originalRequest = https.request;

    https.request = (options: any, callback: any) => {
      const mockReq = new EventEmitter() as any;
      mockReq.end = () => {};

      mockReq.destroy = (err: any) => {
        process.nextTick(() => {
          mockReq.emit('error', err);
        });
      };

      process.nextTick(() => {
        mockReq.emit('timeout');
      });

      return mockReq;
    };

    t.after(() => {
      https.request = originalRequest;
    });

    await assert.rejects(crawlPage('https://example.com', 100), /TIMEOUT/);
  });

  await suiteContext.test('crawlPage - Redirect to Localhost Blocked', async (t) => {
    const originalRequest = https.request;
    let requestCount = 0;

    https.request = (options: any, callback: any) => {
      requestCount++;
      const mockRes = new EventEmitter() as any;
      
      if (requestCount === 1) {
        mockRes.statusCode = 302;
        mockRes.headers = { 'location': 'http://localhost' };
      } else {
        mockRes.statusCode = 200;
        mockRes.headers = { 'content-type': 'text/html' };
      }
      
      mockRes.setEncoding = () => {};
      mockRes.resume = () => {};

      const mockReq = new EventEmitter() as any;
      mockReq.end = () => {
        process.nextTick(() => {
          callback(mockRes);
        });
      };

      mockReq.destroy = (err: any) => {
        process.nextTick(() => {
          mockReq.emit('error', err);
        });
      };

      return mockReq;
    };

    t.after(() => {
      https.request = originalRequest;
    });

    await assert.rejects(crawlPage('https://example.com'), /SSRF_BLOCKED/);
  });

  await suiteContext.test('crawlPage - Valid Public Site Success', async () => {
    const result = await crawlPage('https://example.com');
    
    assert.strictEqual(result.statusCode, 200);
    assert.match(result.title, /Example Domain/i);
    assert.ok(result.content.includes('Example Domain'));
  });

});
