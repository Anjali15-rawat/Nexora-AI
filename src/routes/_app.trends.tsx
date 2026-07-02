import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrendRadar } from "@/lib/api/growth.functions";
import { TrendingUp, TrendingDown, Radio, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/trends")({
  head: () => ({ meta: [{ title: "Trend Radar · Nexora AI" }] }),
  component: Trends,
});

function Trends() {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any>({ series: [], rising: [], declining: [] });

  useEffect(() => {
    async function load() {
      try {
        const data = await getTrendRadar();
        setTrendData(data);
      } catch (e) {
        console.error("Failed to load trend radar signals:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Figure out the keys dynamically for lines (excluding 'week')
  const keys = trendData.series.length > 0 
    ? Object.keys(trendData.series[0]).filter(k => k !== "week") 
    : ["barefoot", "recycled", "chunky"];

  const colors = ["var(--color-primary)", "var(--color-accent)", "var(--color-destructive)"];

  return (
    <div className="space-y-6">
      <PageHeader title="Trend Radar" description="What's rising, what's falling, what's emerging." />

      <Card>
        <CardHeader><CardTitle className="text-base">12-week signal trajectory</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {keys.map((k, idx) => (
                <Line 
                  key={k}
                  type="monotone" 
                  dataKey={k} 
                  stroke={colors[idx % colors.length]} 
                  strokeWidth={2.5} 
                  dot={false} 
                  name={k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1")} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Rising trends</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {trendData.rising.map((t: any) => (
              <div key={t.topic} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="font-medium text-sm">{t.topic}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Radio className="h-3 w-3" /> {t.signal}</div>
                </div>
                <Badge className="bg-success/15 text-success border-success/20" variant="outline">+{t.growth}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" /> Declining</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {trendData.declining.map((t: any) => (
              <div key={t.topic} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="font-medium text-sm">{t.topic}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Radio className="h-3 w-3" /> {t.signal}</div>
                </div>
                <Badge className="bg-destructive/15 text-destructive border-destructive/20" variant="outline">{t.growth}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Trend opportunities</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          {trendData.rising.map((t: any) => (
            <div key={t.topic} className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Capture this trend</Badge>
              <div className="font-medium mt-2">Build a landing page around "{t.topic}"</div>
              <div className="text-xs text-muted-foreground mt-1">Signal source: {t.signal} · Growth {t.growth}%</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
