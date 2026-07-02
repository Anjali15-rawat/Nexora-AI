import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/cards";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReports, createReport } from "@/lib/api/copilot.functions";
import { Download, FileText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · Nexora AI" }] }),
  component: Reports,
});

function Reports() {
  const [tab, setTab] = useState("All");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getReports();
        setReports(data);
      } catch (e) {
        console.error("Failed to load reports:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleGenerate = async (period: "Daily" | "Weekly" | "Monthly") => {
    setGenerating(period);
    toast.loading(`Generating ${period} report...`, { id: "report" });
    try {
      const report = await createReport({ data: { period } });
      setReports(prev => [
        { id: `new-${Date.now()}`, ...report },
        ...prev,
      ]);
      toast.success(`${period} report generated!`, { id: "report" });
    } catch (e) {
      toast.error("Failed to generate report.", { id: "report" });
    } finally {
      setGenerating(null);
    }
  };

  const list = tab === "All" ? reports : reports.filter((r) => r.period === tab);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Executive summaries from your Copilot."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleGenerate("Daily")} disabled={!!generating}>
              {generating === "Daily" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Daily Brief
            </Button>
            <Button variant="outline" onClick={() => handleGenerate("Weekly")} disabled={!!generating}>
              {generating === "Weekly" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Weekly
            </Button>
            <Button className="bg-gradient-primary border-0" onClick={() => handleGenerate("Monthly")} disabled={!!generating}>
              {generating === "Monthly" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Monthly
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Daily">Daily</TabsTrigger>
          <TabsTrigger value="Weekly">Weekly</TabsTrigger>
          <TabsTrigger value="Monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-5 space-y-4">
          {list.length === 0 ? (
            <Card className="border-border/40 p-8 text-center text-sm text-muted-foreground glass">
              No reports yet. Click a button above to generate your first AI-powered executive report.
            </Card>
          ) : (
            list.map((r) => (
              <Card key={r.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 items-start">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{r.title}</div>
                        <Badge variant="outline">{r.period}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{r.date}</div>
                      <p className="text-sm mt-3 text-muted-foreground leading-relaxed">{r.summary}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {expandedId === r.id ? "Collapse" : "View"}
                    </Button>
                  </div>
                  {expandedId === r.id && r.content && (
                    <div className="mt-4 pt-4 border-t border-border prose prose-sm prose-invert max-w-none text-foreground/90 whitespace-pre-line leading-relaxed">
                      {r.content}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
