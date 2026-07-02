import { createServerFn } from "@tanstack/react-start";
import { getSupabaseForUser } from "../supabase.server";

// Helper to get access token from cookies
async function getToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

export const getNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();

  if (!token || token === "dev-token") {
    // Fallback dev mode data
    return [
      { id: "1", title: "New SEO Issue Detected", message: "Missing H1 on /product/eco-sneakers", type: "alert", is_read: false, created_at: new Date().toISOString() },
      { id: "2", title: "Weekly Summary Ready", message: "Your growth score increased by 4 points.", type: "system", is_read: false, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", title: "Competitor Update", message: "Veja published a new sustainability guide.", type: "competitor", is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() }
    ];
  }

  const supabase = getSupabaseForUser(token);
  const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).single();
  
  if (!membership) return [];

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", membership.business_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return notifications || [];
});

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const token = await getToken();
    if (!token || token === "dev-token") return { success: true };

    const supabase = getSupabaseForUser(token);
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    return { success: true };
  });

export const clearAllNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const token = await getToken();
  if (!token) return { success: true };

  const supabase = getSupabaseForUser(token);
  const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).single();
  
  if (membership) {
    await supabase.from("notifications").update({ is_read: true }).eq("business_id", membership.business_id);
  }
  return { success: true };
});
