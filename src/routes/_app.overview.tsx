import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Sparkles, RefreshCw, Loader2, Activity, Lightbulb, Users, Search, Zap, Heart, ShieldAlert, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard, ScoreCard, PageHeader } from "@/components/app/cards";
import { ActionCard } from "@/components/app/action-card";
import { runSeoAudit } from "@/lib/api/seo.functions";
import { getBusinessProfile } from "@/lib/api/business.functions";
import { getGrowthDashboard, getGeneratedOpportunities, getDailySummary } from "@/lib/api/growth.functions";
import { getUserPreferences, updateUserPreferences } from "@/lib/api/user.functions";
import { GrowthTimeline } from "@/components/app/timeline";
import { toast } from "sonner";
import { Player } from "@lottiefiles/react-lottie-player";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/overview")({
  head: () => ({ meta: [{ title: "Overview · Nexora AI" }] }),
  component: Overview,
});

function Overview() {
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  
  // Data states
  const [dashboard, setDashboard] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [dismissSummary, setDismissSummary] = useState(false);
  const [layout, setLayout] = useState<string[]>(["summary", "nora-insights", "scores", "health", "trends", "actions", "timeline"]);

  async function loadData() {
    try {
      const [dashData, oppsList, bizProfile, summaryData, prefs] = await Promise.all([
        getGrowthDashboard(),
        getGeneratedOpportunities(),
        getBusinessProfile(),
        getDailySummary(),
        getUserPreferences(),
      ]);
      setDashboard(dashData);
      setOpportunities(oppsList);
      setBusiness(bizProfile);
      setDailySummary(summaryData);
      if (prefs.dashboard_layout && prefs.dashboard_layout.length > 0) {
        setLayout(prefs.dashboard_layout);
      }
    } catch (err) {
      console.error("Failed to load overview data:", err);
    }
  }

  useEffect(() => {
    async function init() {
      await loadData();
      setLoading(false);
    }
    init();
  }, []);

  const handleRunAudit = async () => {
    setAuditing(true);
    toast.loading("Running comprehensive AI SEO/AEO/GEO audit...", { id: "audit" });
    try {
      const result = await runSeoAudit();
      if (result.success) {
        await loadData();
        toast.success("AI Audit complete! Scores and recommendations updated.", { id: "audit" });
      } else {
        toast.error(result.error || "Failed to execute audit.", { id: "audit" });
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during the audit.", { id: "audit" });
    } finally {
      setAuditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const growthScoreTotal = dashboard?.growthScore ?? 0;
  const growthScoreBreakdown = dashboard?.breakdown ?? [];
  const healthMetrics = dashboard?.healthMetrics ?? [];
  const dynamicGain = dashboard?.revenueImpact?.gain ?? 0;
  const dynamicLoss = dashboard?.revenueImpact?.loss ?? 0;

  const priorityActions = (opportunities || []).map((o: any, idx: number) => ({
    id: o?.id || `opp-${idx}`,
    title: o?.title || "Opportunity",
    description: o?.actionPlan || o?.description || "",
    priority: o?.priority || "High",
    impact: o?.impact || "Medium",
    difficulty: o?.difficulty || "Medium",
  })).slice(0, 3);

  const displayName = business?.name || "Alex";

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    if (direction === 'up' && index > 0) {
      [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
    } else if (direction === 'down' && index < newLayout.length - 1) {
      [newLayout[index + 1], newLayout[index]] = [newLayout[index], newLayout[index + 1]];
    }
    setLayout(newLayout);
    await updateUserPreferences({ data: { dashboard_layout: newLayout } });
  };

  const SectionWrapper = ({ id, title, children }: { id: string, title?: string, children: React.ReactNode }) => {
    const idx = layout.indexOf(id);
    return (
      <div className="relative group">
        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => moveSection(idx, 'down')} disabled={idx === layout.length - 1}><ArrowDown className="h-3 w-3" /></Button>
        </div>
        {title && <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">{title}</h2>}
        {children}
      </div>
    );
  };

  const renderSection = (id: string) => {
    switch(id) {
      case "summary":
        return dashboard?.briefing ? (
          <SectionWrapper id="summary">
            <Card className="border-border/40 bg-gradient-surface glass relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="h-24 w-24 text-primary" /></div>
              <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Morning Growth Briefing</CardTitle></CardHeader>
              <CardContent className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{dashboard.briefing.text}</CardContent>
            </Card>
          </SectionWrapper>
        ) : null;
      case "nora-insights":
        return (
          <SectionWrapper id="nora-insights">
            <Card className="border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent relative overflow-hidden shadow-elegant glass">
              <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
              <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Player
                    src="https://lottie.host/80e9a7e6-7eb4-4db2-9443-41bb2f45cc35/qY6rC6jB18.json"
                    loop
                    autoplay
                    style={{ height: '36px', width: '36px' }}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Nora's Tactical Advice
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    "Veja's traffic from 'eco-friendly runners' increased by 14% this week. I recommend creating a dedicated landing page for your organic hemp shoes to capture this surge."
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs rounded-lg border-primary/30 hover:bg-primary/5"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-advisor", { detail: { message: "Tell me more about Veja's traffic increase for eco-friendly runners." } }))}
                  >
                    Discuss Opportunity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SectionWrapper>
        );
      case "scores":
        return (
          <SectionWrapper id="scores">
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <ScoreCard score={growthScoreTotal} breakdown={growthScoreBreakdown} />
              </div>
              <Card className="bg-gradient-surface border-border/40 glass">
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Revenue Impact (90d)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-success" /> Potential monthly gain</div>
                    <div className="text-3xl font-semibold text-success mt-1">+₹{(dynamicGain / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="h-3.5 w-3.5 text-destructive" /> At risk</div>
                    <div className="text-3xl font-semibold text-destructive mt-1">-₹{(dynamicLoss / 1000).toFixed(1)}k</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SectionWrapper>
        );
      case "health":
        return (
          <SectionWrapper id="health" title="Business Health">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {healthMetrics.map((m: any) => (<MetricCard key={m.label} label={m.label} value={m.value} delta={m.delta} hint={m.hint} />))}
            </div>
          </SectionWrapper>
        );
      case "trends":
        return (
          <SectionWrapper id="trends" title="Revenue Trend">
            <Card className="border-border/40 glass">
              <CardContent className="h-72 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard?.revenueImpact?.trend || []}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="gain" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="loss" stroke="var(--color-destructive)" fill="url(#g2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </SectionWrapper>
        );
      case "actions":
        return (
          <SectionWrapper id="actions" title="Priority Actions">
            {priorityActions.length === 0 ? (
              <Card className="border-border/40 p-6 text-center text-sm text-muted-foreground glass">No priority actions available.</Card>
            ) : (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityActions.map((a: any) => (
                  <motion.div key={a.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                    <ActionCard 
                      {...a} 
                      onComplete={(id) => toast.success(`Marked as complete!`)}
                      onDismiss={(id) => toast.info(`Action dismissed.`)}
                      onAskAdvisor={(title) => window.dispatchEvent(new CustomEvent("open-advisor", { detail: { message: `Can you help me with this opportunity: ${title}?` } }))}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </SectionWrapper>
        );
      case "timeline":
        return (
          <SectionWrapper id="timeline" title="Growth Timeline">
            <Card className="border-border/40 glass p-6">
              <GrowthTimeline events={[
                { id: "1", title: "New SEO Recommendation", description: "Identified missing schema on 12 product pages.", type: "seo", time: "2 hours ago" },
                { id: "2", title: "Competitor Movement", description: "Veja launched a new collection.", type: "competitor", time: "1 day ago" },
                { id: "3", title: "Task Completed", description: "Updated meta tags for Summer Collection.", type: "action", time: "3 days ago" },
              ]} />
            </Card>
          </SectionWrapper>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${displayName}`}
        description="Here's what your Copilot has been working on overnight."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRunAudit}
              disabled={auditing}
              className="border-border/60 hover:bg-muted/20 text-foreground"
            >
              {auditing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Auditing…</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Run AI Audit</>
              )}
            </Button>
            <Button className="bg-gradient-primary border-0"><Sparkles className="h-4 w-4 mr-2" /> Ask Copilot</Button>
          </div>
        }
      />

      {dailySummary && !dismissSummary && (
        <Card className="border-border/40 bg-gradient-primary/[0.03] relative overflow-hidden mb-6 glass">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4 text-primary" /> Today's Growth Summary
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setDismissSummary(true)} className="h-6 text-xs text-muted-foreground hover:bg-muted/50">Dismiss</Button>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" /> Health Status
              </div>
              <div className={cn(
                "text-sm font-semibold mt-2",
                dailySummary.healthStatus === 'Excellent' || dailySummary.healthStatus === 'Good' ? 'text-success' : 'text-destructive'
              )}>
                {dailySummary.healthStatus}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-accent" /> Top Opportunity
              </div>
              <div className="text-xs font-medium text-foreground mt-2 line-clamp-2" title={dailySummary.topOpportunity}>
                {dailySummary.topOpportunity}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-destructive/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-destructive" /> Biggest Risk
              </div>
              <div className="text-xs font-medium text-foreground mt-2 line-clamp-2" title={dailySummary.biggestRisk}>
                {dailySummary.biggestRisk}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Users className="h-4 w-4 text-primary" /> Competitor Activity
              </div>
              <div className="text-xs font-medium text-foreground mt-2 line-clamp-2" title={dailySummary.competitorActivity}>
                {dailySummary.competitorActivity}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Search className="h-4 w-4 text-accent" /> SEO Status
              </div>
              <div className="text-xs font-medium text-foreground mt-2 line-clamp-2" title={dailySummary.seoStatus}>
                {dailySummary.seoStatus}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur shadow-sm hover:border-success/20 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Zap className="h-4 w-4 text-success" /> Recommended Action
              </div>
              <div className="text-xs font-medium text-foreground mt-2 line-clamp-2" title={dailySummary.recommendedNextAction}>
                {dailySummary.recommendedNextAction}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {layout.map(id => (
        <div key={id}>
          {renderSection(id)}
        </div>
      ))}
    </div>
  );
}
