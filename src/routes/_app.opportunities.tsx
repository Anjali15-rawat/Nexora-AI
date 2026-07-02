import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGeneratedOpportunities } from "@/lib/api/growth.functions";
import { updateOpportunityStatus } from "@/lib/api/copilot.functions";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities · Nexora AI" }] }),
  component: Opportunities,
});

const filters = ["All", "SEO", "AEO", "GEO", "Content", "Product", "Trend"];

const statusColors: Record<string, string> = {
  open: "text-blue-400 bg-blue-400/10",
  in_progress: "text-amber-400 bg-amber-400/10",
  done: "text-emerald-400 bg-emerald-400/10",
  dismissed: "text-muted-foreground bg-muted/50",
};

function Opportunities() {
  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGeneratedOpportunities();
        setOpportunities(data || []);
      } catch (e) {
        console.error("Failed to load opportunities:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStatusChange = async (id: string, status: "in_progress" | "done" | "dismissed") => {
    try {
      await updateOpportunityStatus({ data: { opportunityId: id, status } });
      setOpportunities(prev =>
        prev.map(o => o.id === id ? { ...o, status } : o)
      );
      toast.success(`Opportunity marked as ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const list = active === "All" ? opportunities : opportunities.filter((o) => o.type === active);

  return (
    <div className="space-y-6">
      <PageHeader title="Opportunity Finder" description="Ranked by projected revenue impact." />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button key={f} variant={active === f ? "default" : "outline"} size="sm"
            className={cn(active === f && "bg-gradient-primary border-0")}
            onClick={() => setActive(f)}>{f}</Button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="border-border/40 p-8 text-center text-sm text-muted-foreground glass">
          No opportunities found. Run an AI Audit from the Overview page to discover growth opportunities.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((o) => (
            <Card key={o.id} className={cn("hover:border-primary/40 transition-colors group", o.status === "dismissed" && "opacity-60")}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{o.type}</Badge>
                  <Badge variant="outline" className={cn("text-xs capitalize", statusColors[o.status] || statusColors.open)}>
                    {(o.status || "open").replace("_", " ")}
                  </Badge>
                </div>
                <div className="font-medium mt-3 leading-snug">{o.title || o.name}</div>
                {o.actionPlan && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{o.actionPlan}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Impact</div>
                    <div className="font-medium mt-0.5">{o.impact}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Difficulty</div>
                    <div className="font-medium mt-0.5">{o.difficulty}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Revenue potential</div>
                      <div className="text-lg font-semibold text-success">+₹{((o.revenue || 0) / 1000).toFixed(1)}k</div>
                    </div>
                  </div>
                  {o.status !== "done" && o.status !== "dismissed" && (
                    <div className="flex gap-1.5">
                      {o.status !== "in_progress" && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleStatusChange(o.id, "in_progress")}>
                          <Clock className="h-3 w-3 mr-1" /> Start
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1 text-xs text-emerald-400 hover:text-emerald-300" onClick={() => handleStatusChange(o.id, "done")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleStatusChange(o.id, "dismissed")}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
