import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer, getSupabaseForUser } from "../supabase.server";
import { runDailyAutomation } from "../engines/automation-pipeline.server";
import { generateDailySummary } from "../engines/recommendation-engine.server";

async function getToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

// Helper to hash objects for change detection
function hashObject(obj: any): string {
  try {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit int
    }
    return hash.toString();
  } catch {
    return Date.now().toString();
  }
}

// ─── Get Scheduled Jobs ──────────────────────────────────────────
export const getScheduledJobs = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  if (!token || token === "dev-token") {
    return [
      { id: "1", name: "Daily SEO & AI Visibility Scan", cron_schedule: "0 2 * * *", job_type: "daily_intelligence", is_active: true, last_run_at: new Date(Date.now() - 3600000).toISOString(), next_run_at: new Date(Date.now() + 82800000).toISOString() },
      { id: "2", name: "Weekly Competitor Movement Scan", cron_schedule: "0 3 * * 0", job_type: "competitor_analysis", is_active: true, last_run_at: new Date(Date.now() - 86400000).toISOString(), next_run_at: new Date(Date.now() + 518400000).toISOString() },
    ];
  }

  const supabase = getSupabaseForUser(token);
  const { data } = await supabase.from("scheduled_jobs").select("*").order("name");
  return data || [];
});

// ─── Get Job Logs ──────────────────────────────────────────────
export const getJobLogs = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  if (!token || token === "dev-token") {
    return [
      { id: "log-1", job_id: "1", status: "success", started_at: new Date(Date.now() - 3600000).toISOString(), duration_ms: 4500, scheduled_jobs: { name: "Daily SEO & AI Visibility Scan" } },
      { id: "log-2", job_id: "2", status: "failed", started_at: new Date(Date.now() - 86400000).toISOString(), duration_ms: 1200, error_message: "Network timeout connecting to competitor site", scheduled_jobs: { name: "Weekly Competitor Movement Scan" } },
    ];
  }

  const supabase = getSupabaseForUser(token);
  const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).single();
  if (!membership) return [];

  const { data } = await supabase
    .from("job_logs")
    .select("*, scheduled_jobs(name)")
    .eq("business_id", membership.business_id)
    .order("started_at", { ascending: false })
    .limit(100);
  return data || [];
});

// ─── Run Job Manually ──────────────────────────────────────────
export const triggerJob = createServerFn({ method: "POST" })
  .validator(z.object({ jobId: z.string(), jobType: z.string() }))
  .handler(async ({ data }) => {
    const token = await getToken();
    if (!token || token === "dev-token") {
      // Simulate delay for dev mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, message: `Successfully ran ${data.jobType} in dev mode.` };
    }

    const adminSupabase = getSupabaseServer();
    const supabaseUser = getSupabaseForUser(token);
    const { data: membership } = await supabaseUser.from("business_members").select("business_id").limit(1).single();
    if (!membership) return { success: false, error: "No business found" };

    const businessId = membership.business_id;

    // Create running log
    const { data: logEntry } = await adminSupabase.from("job_logs").insert({
      job_id: data.jobId,
      business_id: businessId,
      status: "running",
      started_at: new Date().toISOString()
    }).select("id").single();

    const startTime = Date.now();
    try {
      if (data.jobType === "daily_intelligence" || data.jobType === "health_recalc") {
        await runDailyAutomation(businessId);
      }
      
      const duration = Date.now() - startTime;
      if (logEntry) {
        await adminSupabase.from("job_logs").update({
          status: "success",
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        }).eq("id", logEntry.id);
      }
      
      // Update last run on job
      await adminSupabase.from("scheduled_jobs").update({ last_run_at: new Date().toISOString() }).eq("id", data.jobId);
      return { success: true, duration };
    } catch (e: any) {
      if (logEntry) {
        await adminSupabase.from("job_logs").update({
          status: "failed",
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          error_message: e.message || "Unknown error",
        }).eq("id", logEntry.id);
      }
      return { success: false, error: e.message };
    }
  });

// ─── Record State Change (Change Detection Engine) ─────────────
export async function detectAndRecordChange(businessId: string, entityType: string, newState: any) {
  const adminSupabase = getSupabaseServer();
  
  // Get last recorded state for this entity
  const { data: history } = await adminSupabase
    .from("automation_history")
    .select("change_hash, new_state")
    .eq("business_id", businessId)
    .eq("entity_type", entityType)
    .order("detected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newHash = hashObject(newState);

  // If hash differs, record the change and potentially notify
  if (!history || history.change_hash !== newHash) {
    await adminSupabase.from("automation_history").insert({
      business_id: businessId,
      entity_type: entityType,
      previous_state: history?.new_state || null,
      new_state: newState,
      change_hash: newHash,
    });

    return { changed: true, previousState: history?.new_state };
  }
  
  return { changed: false };
}
