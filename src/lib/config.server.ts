import "./env-loader.server";
import process from "node:process";
import { z } from "zod";

// ─── Environment Schema ──────────────────────────────────────

const serverConfigSchema = z.object({
  nodeEnv: z.string().default("development"),
  supabaseUrl: z.string().min(1, "SUPABASE_URL is required").optional(),
  supabaseAnonKey: z.string().min(1, "SUPABASE_ANON_KEY is required").optional(),
  supabaseServiceRoleKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  appUrl: z.string().url().default("http://localhost:3000"),
});

type ServerConfig = z.infer<typeof serverConfigSchema>;

let _config: ServerConfig | null = null;

// ─── Config Accessors ────────────────────────────────────────

export function getServerConfig(): ServerConfig {
  if (_config) return _config;

  const raw = {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    appUrl: process.env.VITE_APP_URL,
  };

  const result = serverConfigSchema.safeParse(raw);

  if (!result.success) {
    console.warn(
      "[Config] Environment validation warnings:",
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
    );
    // Fall through with defaults for development
    _config = serverConfigSchema.parse({
      ...raw,
      supabaseUrl: raw.supabaseUrl || undefined,
      supabaseAnonKey: raw.supabaseAnonKey || undefined,
    });
  } else {
    _config = result.data;
  }

  return _config;
}

export function requireConfig<K extends keyof ServerConfig>(
  key: K,
): NonNullable<ServerConfig[K]> {
  const config = getServerConfig();
  const value = config[key];
  if (!value) {
    throw new Error(`Missing required server config: ${key}. Check your .env file.`);
  }
  return value as NonNullable<typeof value>;
}

// ─── Convenience Helpers ─────────────────────────────────────

export function isProduction(): boolean {
  return getServerConfig().nodeEnv === "production";
}

export function isDevelopment(): boolean {
  return getServerConfig().nodeEnv !== "production";
}

export function hasGeminiKey(): boolean {
  return !!getServerConfig().geminiApiKey;
}

export function requireGeminiKey(): string {
  return requireConfig("geminiApiKey");
}

export function hasSupabase(): boolean {
  const config = getServerConfig();
  return !!config.supabaseUrl && !!config.supabaseAnonKey;
}
