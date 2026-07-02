import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer, getSupabaseForUser } from "../supabase.server";
import { askAssistant } from "../engines/ai-assistant.server";
import { generateReport } from "../engines/report-generator.server";
import { processVoiceQuery } from "../engines/voice-agent.server";
import { loadBusinessMemory, compressMemoryForPrompt } from "../engines/business-memory.server";

// Helper to get access token from cookies
async function getToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

// Helper: resolve businessId and userId from token
async function resolveContext(): Promise<{ businessId: string; userId: string; bizName: string } | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const supabase = getSupabaseForUser(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(name)")
      .limit(1)
      .single();
    if (!membership) return null;
    const biz = membership.businesses as any;
    return { businessId: membership.business_id, userId: user.id, bizName: biz.name };
  } catch {
    return null;
  }
}

// ─── AI Assistant Chat ───────────────────────────────────────
export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(z.object({ message: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await resolveContext();

    if (!ctx) {
      // Dev mode fallback — still use Gemini if available, otherwise return contextual fallback
      const result = await askAssistant({
        businessId: "dev-business-id",
        userId: "dev",
        message: data.message,
      });
      return result;
    }

    return askAssistant({
      businessId: ctx.businessId,
      userId: ctx.userId,
      message: data.message,
    });
  });

// ─── Get Chat History ────────────────────────────────────────
export const getChatHistory = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();
    if (!token) {
      return [
        { role: "assistant" as const, content: "Hi there — I've reviewed your business overnight. Ask me anything about your growth, competitors, or opportunities." },
      ];
    }

    const supabase = getSupabaseForUser(token);
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(50);

    if (!messages || messages.length === 0) {
      return [
        { role: "assistant" as const, content: "Hi there — I've reviewed your business overnight. Ask me anything about your growth, competitors, or opportunities." },
      ];
    }

    return messages.map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }
);

// ─── Generate Report ─────────────────────────────────────────
export const createReport = createServerFn({ method: "POST" })
  .validator(z.object({ period: z.enum(["Daily", "Weekly", "Monthly"]) }))
  .handler(async ({ data }) => {
    const ctx = await resolveContext();
    const businessId = ctx?.businessId || "dev-business-id";

    const report = await generateReport({
      businessId,
      period: data.period,
    });

    return report;
  });

// ─── Get Reports ─────────────────────────────────────────────
export const getReports = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();
    if (!token) {
      return [];
    }

    const supabase = getSupabaseForUser(token);
    const { data: reports } = await supabase
      .from("reports")
      .select("id, title, period, summary, content, report_date, created_at")
      .order("report_date", { ascending: false })
      .limit(20);

    return (reports || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      period: r.period,
      summary: r.summary || "",
      content: r.content || "",
      date: r.report_date,
    }));
  }
);

// ─── Update Opportunity Status ───────────────────────────────
export const updateOpportunityStatus = createServerFn({ method: "POST" })
  .validator(z.object({
    opportunityId: z.string(),
    status: z.enum(["open", "in_progress", "done", "dismissed"]),
  }))
  .handler(async ({ data }) => {
    const token = await getToken();
    if (!token) return { success: true as const };

    const supabase = getSupabaseForUser(token);
    const { error } = await supabase
      .from("opportunities")
      .update({ status: data.status })
      .eq("id", data.opportunityId);

    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  });

// ─── Context-Aware Voice Agent ───────────────────────────────
export const askVoiceAgentContextual = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await resolveContext();
    const businessId = ctx?.businessId || "dev-business-id";

    let businessName = ctx?.bizName || "Northwind Apparel";
    let growthScore = 75;
    let explanation = "Good overall health with clear optimization fields.";
    let opportunities: any[] = [];
    let competitorsList: any[] = [];

    try {
      const memory = await loadBusinessMemory(businessId);
      businessName = memory.business.name;
      const avg = Math.round((memory.scores.seo.score + memory.scores.aeo.score + memory.scores.geo.score) / 3);
      growthScore = avg || 75;
      explanation = compressMemoryForPrompt(memory);
      opportunities = memory.opportunities.filter(o => o.status === "open");
      competitorsList = memory.competitors;
    } catch (e) {
      console.warn("Could not load memory for voice agent:", e);
    }

    if (opportunities.length === 0) {
      opportunities = [{ title: "Run an AI audit to discover opportunities", revenue: 0, recommendedAction: "Click 'Run AI Audit' on the Overview page." }];
    }

    return processVoiceQuery({
      query: data.query,
      businessName,
      growthScore,
      explanation,
      opportunities,
      competitors: competitorsList,
    });
  });
