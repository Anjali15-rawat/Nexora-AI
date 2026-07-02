import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export async function generateElevenLabsSpeechHandler({ data }: { data: { text: string } }) {
  const { requireAuth, getAccessToken } = await import("../auth-utils.server");
  const { getClientIdentifier, checkRateLimit } = await import("../security.server");
  const { getServerConfig } = await import("../config.server");

  // 1. Enforce token-level authorization checks
  const config = getServerConfig();
  const isMockAuth = !config.supabaseUrl || config.supabaseUrl.includes("placeholder");

  let userId = "dev-user";
  if (!isMockAuth) {
    try {
      const { user } = await requireAuth();
      userId = user.id;
    } catch (err) {
      console.warn("[ElevenLabs] Unauthorized TTS access blocked.");
      return { success: false as const, error: "Authentication required" };
    }
  } else {
    // Dev mode fallback verification: require token in request context
    const token = await getAccessToken();
    if (!token) {
      console.warn("[ElevenLabs] Anonymous TTS access in dev mock blocked.");
      return { success: false as const, error: "Authentication required" };
    }
  }

  // 2. Client-scoped rate limiter (10 requests per minute)
  const clientIp = await getClientIdentifier();
  const rateLimit = checkRateLimit({
    key: `tts:${userId}:${clientIp}`,
    maxRequests: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[ElevenLabs] Rate limit exceeded for identifier: ${userId} (${clientIp})`);
    return { success: false as const, error: "Too many speech requests. Please wait a moment." };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    console.warn("[ElevenLabs] API Key or Voice ID is missing in server environment.");
    return { success: false as const, error: "Credentials not configured" };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] TTS request failed:", errorText);
      return { success: false as const, error: `API status: ${response.status}` };
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { success: true as const, audioBase64: base64 };
  } catch (e: any) {
    console.error("[ElevenLabs] Failed to communicate with ElevenLabs:", e);
    return { success: false as const, error: e?.message || "Network error" };
  }
}

export const generateElevenLabsSpeech = createServerFn({ method: "POST" })
  .validator(z.object({ text: z.string() }))
  .handler(generateElevenLabsSpeechHandler);
