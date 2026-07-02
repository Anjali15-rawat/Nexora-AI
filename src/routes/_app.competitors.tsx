import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTrackedCompetitors } from "@/lib/api/growth.functions";
import { ArrowDownRight, ArrowUpRight, Package, FileText, DollarSign, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/competitors")({
  head: () => ({ meta: [{ title: "Competitors · Nexora AI" }] }),
  component: Competitors,
});

const iconFor = (t: string) => t === "New Product" ? Package : t === "New Content" ? FileText : DollarSign;

function Competitors() {
  const [loading, setLoading] = useState(true);
  const [competitorList, setCompetitorList] = useState<any[]>([]);
  const [changesList, setChangesList] = useState<any[]>([]);
  const [trendSeries, setTrendSeries] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTrackedCompetitors();
        setCompetitorList(data.competitors || []);
        setChangesList(data.changes || []);
        setTrendSeries(data.seoTrendSeries || []);
      } catch (e) {
        console.error("Failed to load competitor data:", e);
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
      <PageHeader title="Competitor Intelligence" description={`We're tracking ${competitorList.length} rivals across content, traffic, and pricing.`} />

      <Card>
        <CardHeader><CardTitle className="text-base">Tracked competitors</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Traffic Trend</TableHead>
                <TableHead>Content Score</TableHead>
                <TableHead>Threat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitorList.map((c) => {
                const up = (c.trafficTrend ?? c.traffic) >= 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.category}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1 text-sm font-medium ${up ? "text-success" : "text-destructive"}`}>
                        {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {Math.abs(c.trafficTrend ?? c.traffic)}%
                      </div>
                    </TableCell>
                    <TableCell>{c.contentScore ?? c.content}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        (c.threatLevel ?? c.threat) === "High" ? "bg-destructive/15 text-destructive border-destructive/20"
                        : (c.threatLevel ?? c.threat) === "Medium" ? "bg-warning/15 text-warning border-warning/20"
                        : "bg-success/15 text-success border-success/20"
                      }>{c.threatLevel ?? c.threat}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Share of voice — you vs. category</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="you" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="competitor" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Content score by rival</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorList}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="contentScore" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent competitor changes</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {changesList.map((c, i) => {
            const Icon = iconFor(c.type);
            return (
              <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.change}</div>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">{c.type}</Badge>
                <div className="text-xs text-muted-foreground shrink-0">{c.at}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
