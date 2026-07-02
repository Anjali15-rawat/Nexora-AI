import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import net from "node:net";

/**
 * Polite User-Agent for crawling
 */
const USER_AGENT = "CommerceCopilotCGO/1.0 (+https://commercecopilot.ai)";

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  statusCode: number;
}

/**
 * Strips HTML tags and returns clean, readable text optimized for LLMs.
 */
export function cleanHtml(html: string): { title: string; metaDescription: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const metaDescription = metaDescMatch ? decodeEntities(metaDescMatch[1].trim()) : "";

  // Clean the main content
  let text = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Replace tags with spaces so words don't run together
  text = text.replace(/<\/?[^>]+>/g, " ");

  // Decode entities and clean spacing
  text = decodeEntities(text);
  text = text.replace(/\s+/g, " ").trim();

  return { title, metaDescription, content: text };
}

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-");
}

/**
 * Validates whether an IP address belongs to loopback, private, link-local, multicast, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 Checks
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [first, second, third, fourth] = parts;

    // Loopback (127.0.0.0/8)
    if (first === 127) return true;

    // Private Subnets:
    // 10.0.0.0/8
    if (first === 10) return true;
    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) return true;
    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;

    // Link-local (169.254.0.0/16)
    if (first === 169 && second === 254) return true;

    // Multicast (224.0.0.0/4)
    if (first >= 224 && first <= 239) return true;

    // Carrier-grade NAT (100.64.0.0/10)
    if (first === 100 && second >= 64 && second <= 127) return true;

    // Test networks / documentation:
    // 192.0.2.0/24 (TEST-NET-1), 198.51.100.0/24 (TEST-NET-2), 203.0.113.0/24 (TEST-NET-3)
    if (first === 192 && second === 0 && third === 2) return true;
    if (first === 198 && second === 51 && third === 100) return true;
    if (first === 203 && second === 0 && third === 113) return true;

    // Reserved (240.0.0.0/4) and Broadcast (255.255.255.255)
    if (first >= 240) return true;

    // Benchmarking (198.18.0.0/15)
    if (first === 198 && second >= 18 && second <= 19) return true;

    // Local host identifier (0.0.0.0/8)
    if (first === 0) return true;

    return false;
  }

  // IPv6 Checks
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();

    // Loopback (::1)
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

    // Unspecified address (::)
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

    // Link-local (fe80::/10)
    if (normalized.startsWith("fe80:") || normalized.startsWith("fe90:") || normalized.startsWith("fea0:") || normalized.startsWith("feb0:")) return true;

    // Unique Local / Private (fc00::/7)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

    // Multicast (ff00::/8)
    if (normalized.startsWith("ff")) return true;

    return false;
  }

  return true;
}

/**
 * Resolves a hostname and verifies all associated IP addresses are public.
 */
export async function resolveAndVerifyHost(hostname: string): Promise<string> {
  const cleanHostname = hostname.replace(/^\[|\]$/g, "");

  // If the hostname is already an IP, validate it directly
  if (/^[0-9.]+$/.test(cleanHostname) || cleanHostname.includes(":")) {
    if (isPrivateOrReservedIp(cleanHostname)) {
      throw new Error("SSRF_BLOCKED");
    }
    return cleanHostname;
  }

  return new Promise((resolve, reject) => {
    dns.lookup(cleanHostname, { all: true }, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        reject(new Error("DNS_RESOLUTION_FAILED"));
        return;
      }

      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          reject(new Error("SSRF_BLOCKED"));
          return;
        }
      }

      // Return the first resolved IP address
      resolve(addresses[0].address);
    });
  });
}

/**
 * Executes a secure HTTP/HTTPS request pinning the IP to prevent DNS rebinding.
 */
async function secureRequest(parsedUrl: URL, ip: string, timeoutMs: number): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const isHttps = parsedUrl.protocol === "https:";
    const requestModule = isHttps ? https : http;

    const requestOptions: http.RequestOptions & https.RequestOptions = {
      hostname: ip,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Host": parsedUrl.hostname,
      },
      timeout: timeoutMs,
    };

    if (isHttps) {
      // For HTTPS, SNI must be manually set when connecting directly to an IP
      requestOptions.servername = parsedUrl.hostname.replace(/^\[|\]$/g, "");
      // Re-enable default CA verification matching the target hostname
      requestOptions.rejectUnauthorized = true;
    }

    const req = requestModule.request(requestOptions, (res) => {
      const statusCode = res.statusCode || 200;
      const isRedirect = statusCode >= 300 && statusCode < 400;

      if (isRedirect) {
        resolve({
          statusCode: statusCode,
          headers: res.headers,
          body: "",
        });
        return;
      }

      const contentType = res.headers["content-type"] || "";
      if (!contentType.includes("text/html") && !contentType.includes("xml")) {
        req.destroy(new Error("UNSUPPORTED_CONTENT_TYPE"));
        return;
      }

      let data = "";
      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        data += chunk;
        if (data.length > 500000) { // Max size 500KB
          req.destroy(new Error("OVERSIZED_RESPONSE"));
        }
      });

      res.on("end", () => {
        resolve({
          statusCode: statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("TIMEOUT"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Fetches and processes a single web page with full SSRF and redirection controls.
 */
export async function crawlPage(url: string, timeoutMs = 10000, redirectCount = 0): Promise<CrawlResult> {
  if (redirectCount > 5) {
    throw new Error("TOO_MANY_REDIRECTS");
  }

  let parsedUrl: URL;
  try {
    const hasScheme = /^[a-zA-Z0-9+-.]+:/.test(url);
    parsedUrl = new URL(hasScheme ? url : `https://${url}`);
  } catch (err) {
    throw new Error("INVALID_URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("UNSUPPORTED_PROTOCOL");
  }

  // Validate hostname structure
  const host = parsedUrl.hostname.replace(/^\[|\]$/g, "");
  const isValidHost = host === "localhost" || host.includes(".") || net.isIP(host);
  if (!isValidHost) {
    throw new Error("INVALID_URL");
  }

  try {
    // 1. Resolve host and check all addresses for SSRF protection
    const ip = await resolveAndVerifyHost(parsedUrl.hostname);

    // 2. Perform connection pinning direct-to-IP request
    const response = await secureRequest(parsedUrl, ip, timeoutMs);

    // 3. Handle redirects manually
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      const redirectTarget = new URL(response.headers.location, parsedUrl.href).href;
      return crawlPage(redirectTarget, timeoutMs, redirectCount + 1);
    }

    const cleaned = cleanHtml(response.body);

    return {
      url: parsedUrl.href,
      title: cleaned.title,
      metaDescription: cleaned.metaDescription,
      content: cleaned.content,
      statusCode: response.statusCode,
    };
  } catch (err: any) {
    let errorStr = "CONNECTION_FAILED";
    if (err.message === "SSRF_BLOCKED") {
      errorStr = "SSRF_BLOCKED";
    } else if (err.message === "DNS_RESOLUTION_FAILED") {
      errorStr = "DNS_RESOLUTION_FAILED";
    } else if (err.message === "UNSUPPORTED_CONTENT_TYPE") {
      errorStr = "UNSUPPORTED_CONTENT_TYPE";
    } else if (err.message === "OVERSIZED_RESPONSE") {
      errorStr = "OVERSIZED_RESPONSE";
    } else if (err.message === "TIMEOUT") {
      errorStr = "TIMEOUT";
    } else if (err.message === "TOO_MANY_REDIRECTS") {
      errorStr = "TOO_MANY_REDIRECTS";
    } else if (err.message === "INVALID_URL") {
      errorStr = "INVALID_URL";
    } else if (err.message === "UNSUPPORTED_PROTOCOL") {
      errorStr = "UNSUPPORTED_PROTOCOL";
    }

    throw new Error(errorStr);
  }
}
