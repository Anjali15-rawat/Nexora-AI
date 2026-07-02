import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseForUser } from "../supabase.server";

async function getToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

export const getUserPreferences = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  if (!token || token === "dev-token") return { dashboard_layout: [] };

  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { dashboard_layout: [] };

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("dashboard_layout")
    .eq("user_id", user.id)
    .maybeSingle();

  return prefs || { dashboard_layout: [] };
});

export const updateUserPreferences = createServerFn({ method: "POST" })
  .validator(z.object({ dashboard_layout: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const token = await getToken();
    if (!token || token === "dev-token") return { success: true };

    const supabase = getSupabaseForUser(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      dashboard_layout: data.dashboard_layout,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  });
