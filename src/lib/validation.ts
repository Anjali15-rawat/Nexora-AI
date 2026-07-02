import { z } from "zod";

// ─── Reusable Schemas ────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters");

export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .url("Please enter a valid URL");

export const businessNameSchema = z
  .string()
  .min(1, "Business name is required")
  .max(200, "Business name must be less than 200 characters");

export const uuidSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Auth Form Schemas ───────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: emailSchema,
  password: passwordSchema,
  site: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Business Schemas ────────────────────────────────────────

export const updateBusinessSchema = z.object({
  name: businessNameSchema,
  url: urlSchema,
  industry: z.string().max(200).default(""),
  growthGoals: z.string().max(2000).default(""),
});

export const addCompetitorSchema = z.object({
  name: z.string().min(1, "Competitor name is required").max(200),
  url: urlSchema,
});

export const analyzeBusinessSchema = z.object({
  url: urlSchema,
});

// ─── Sanitization ────────────────────────────────────────────

/** Strip HTML tags from a string to prevent XSS in text content */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// ─── Error Formatting ────────────────────────────────────────

/** Convert Zod validation errors into user-friendly messages */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

/** Get the first error message from a Zod error */
export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed";
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
