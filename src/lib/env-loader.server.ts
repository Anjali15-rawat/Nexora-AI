import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Manually loads environment variables from .env.local and .env files
 * into process.env in environments where the bundler context does not propagate them.
 */
export function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    try {
      const filePath = path.resolve(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const index = trimmed.indexOf("=");
          if (index > 0) {
            const key = trimmed.slice(0, index).trim();
            const val = trimmed.slice(index + 1).trim();
            // Remove surrounding quotes if present
            const cleanVal = val.replace(/^['"]|['"]$/g, "");
            if (key && !process.env[key]) {
              process.env[key] = cleanVal;
            }
          }
        }
      }
    } catch {
      // Fail silently
    }
  }
}

// Automatically load on import
loadEnv();
