import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomerInsights } from "@/lib/api/growth.functions";
import { Quote, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customer Voice · Nexora AI" }] }),
  component: Customers,
});

function Customers() {
  const [loading, setLoading] = useState(true);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [buyingMotivationsData, setBuyingMotivationsData] = useState<any[]>([]);
  const [painPointsData, setPainPointsData] = useState<any[]>([]);
  const [customerRequestsData, setCustomerRequestsData] = useState<string[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCustomerInsights();
        setSentimentData(data.sentiment || []);
        setBuyingMotivationsData(data.buyingMotivations || []);
        setPainPointsData(data.painPoints || []);
        setCustomerRequestsData(data.customerRequests || []);
        setReviewsData(data.reviews || []);
      } catch (e) {
        console.error("Failed to load customer voice insights:", e);
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

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Voice" description="What customers are saying about your brand." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Sentiment overview</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {sentimentData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name} {s.value}%
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Buying motivations</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buyingMotivationsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="reason" stroke="var(--color-muted-foreground)" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="pct" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Top pain points</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {painPointsData.map((p) => (
              <div key={p.topic} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="font-medium text-sm">{p.topic}</div>
                  <div className="text-xs text-muted-foreground">{p.mentions} mentions</div>
                </div>
                <Badge variant="outline" className={
                  p.severity === "High" ? "bg-destructive/15 text-destructive border-destructive/20"
                  : p.severity === "Medium" ? "bg-warning/15 text-warning border-warning/20"
                  : "bg-success/15 text-success border-success/20"
                }>{p.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Customer requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {customerRequestsData.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border border-border text-sm">{r}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent review insights</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {reviewsData.map((r, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
              <Quote className="h-4 w-4 text-primary mb-2" />
              <p className="text-sm leading-relaxed">"{r.text}"</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">— {r.name}</div>
                <Badge variant="outline" className="text-xs">{r.tag}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
