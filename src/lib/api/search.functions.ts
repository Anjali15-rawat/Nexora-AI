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

export const globalSearch = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    const token = await getToken();
    
    if (!token || token === "dev-token") {
      // Dev mode fallback
      return [
        { type: "opportunity", title: "Optimize product titles", description: "Increase keyword coverage.", id: "1" },
        { type: "competitor", title: "Veja", description: "Recently added sustainability section.", id: "2" },
      ].filter(item => item.title.toLowerCase().includes(data.query.toLowerCase()) || item.description.toLowerCase().includes(data.query.toLowerCase()));
    }

    const supabase = getSupabaseForUser(token);
    const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).single();
    
    if (!membership) return [];

    // Simple FTS search via postgres
    // If pgvector is enabled, you'd calculate the embedding for `data.query` and do a similarity search.
    // For now, we'll use Postgres FTS.
    const { data: results } = await supabase
      .from("search_index")
      .select("entity_type, entity_id, title, description")
      .eq("business_id", membership.business_id)
      .textSearch("fts", data.query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(10);

    // Fallback simple ILIKE if no search index records exist yet
    if (!results || results.length === 0) {
      // Mocking results dynamically by querying multiple tables
      const opps = await supabase.from("opportunities").select("id, title, action_plan").ilike("title", `%${data.query}%`).limit(3);
      const comps = await supabase.from("competitors").select("id, name, category").ilike("name", `%${data.query}%`).limit(3);
      
      const combined = [
        ...(opps.data || []).map(o => ({ type: "opportunity", id: o.id, title: o.title, description: o.action_plan })),
        ...(comps.data || []).map(c => ({ type: "competitor", id: c.id, title: c.name, description: c.category })),
      ];
      return combined;
    }

    return results.map(r => ({
      type: r.entity_type,
      id: r.entity_id,
      title: r.title,
      description: r.description
    }));
  });
