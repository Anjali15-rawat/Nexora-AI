import { getServerConfig } from "../config.server";

interface GeminiOptions {
  systemInstruction?: string;
  jsonMode?: boolean;
}

/**
 * Thin wrapper around the Gemini REST API.
 * Uses fetch to be fully compatible with Edge runtimes (Cloudflare Workers).
 */
export async function generateContent(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const config = getServerConfig();
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Falling back to mock response in development mode.");
    // In development mode, return a mocked placeholder that conforms to JSON mode if requested
    if (options.jsonMode) {
      return JSON.stringify({
        mocked: true,
        message: "Gemini API key missing. This is a fallback mock response."
      });
    }
    return "Gemini API key missing. This is a fallback mock response.";
  }

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {}
  };

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }]
    };
  }

  if (options.jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API Error (Attempt ${attempt}/${maxRetries}):`, errorText);

        // Retry on rate limit (429) or server error (5xx)
        if (response.status === 429 || response.status >= 500) {
          if (attempt === maxRetries) {
            throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
          }
          console.log(`Retrying Gemini request in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
          continue;
        }

        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const result = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Invalid response structure from Gemini API");
      }

      return text;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : error}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error("Failed to call Gemini API after multiple retries");
}

/**
 * Streaming version of the Gemini API wrapper.
 * Returns a ReadableStream of text chunks.
 */
export async function generateContentStream(
  prompt: string,
  options: GeminiOptions = {}
): Promise<ReadableStream> {
  const config = getServerConfig();
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("Gemini API key missing. This is a fallback mock streaming response."));
        controller.close();
      }
    });
  }

  const model = "gemini-2.5-flash"; // updated to gemini-2.5-flash as per requirements
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {}
  };

  if (options.systemInstruction) {
    payload.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }
  if (options.jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Stream API Error ${response.status}: ${err}`);
  }
  
  if (!response.body) {
    throw new Error("No response body returned from Gemini API");
  }

  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  let lineBuffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const combined = lineBuffer + chunk;
          const lines = combined.split('\n');
          
          // The last element is either empty (if chunk ends with \n)
          // or a partial line (if chunk splits mid-line). Save for next read.
          lineBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
                // Ignore parse errors on partial lines
              }
            }
          }
        }

        // Flush any remaining text in the buffer
        if (lineBuffer) {
          const trimmedLine = lineBuffer.trim();
          if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    }
  });
}
