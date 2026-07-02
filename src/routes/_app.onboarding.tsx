import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle, Plus, Trash2, Globe } from "lucide-react";
import { analyzeBusiness, addCompetitor } from "@/lib/api/business.functions";
import type { BusinessProfile } from "@/lib/engines/business-understanding.server";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · Nexora AI" }] }),
  component: Onboarding,
});

const analysisSteps = [
  "Resolving store domain and checking response...",
  "Crawling store homepage and extracting markup...",
  "Analyzing product categories and catalog structure...",
  "Evaluating pricing tier and target audience parameters...",
  "Decoding brand voice and copywriting style...",
  "Synthesizing customized growth goals...",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  // Extracted Profile State
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [businessId, setBusinessId] = useState("");

  // Competitor Inputs State
  const [competitors, setCompetitors] = useState<Array<{ name: string; url: string }>>([
    { name: "", url: "" },
  ]);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);

  // Step 2: Simulate step progression during API call
  useEffect(() => {
    if (step !== 2) return;

    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [step]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url) {
      setError("Please enter your website URL.");
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL (e.g. my-store.com).");
      return;
    }

    setStep(2);
    setLoadingStepIdx(0);

    try {
      const result = await analyzeBusiness({ data: { url: cleanUrl } });
      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      setProfile(result.profile);
      setBusinessId(result.businessId);
      // Brief delay to allow the user to read the final step
      setTimeout(() => {
        setStep(3);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to analyze website. Please try again or proceed with a manual setup.");
      setStep(1);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setStep(4);
  };

  const handleAddCompetitorRow = () => {
    setCompetitors((prev) => [...prev, { name: "", url: "" }]);
  };

  const handleRemoveCompetitorRow = (idx: number) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompetitorChange = (idx: number, field: "name" | "url", val: string) => {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  };

  const handleCompleteOnboarding = async () => {
    setCompetitorsLoading(true);
    try {
      // Filter out empty competitor rows
      const validCompetitors = competitors.filter((c) => c.name.trim() && c.url.trim());

      for (const comp of validCompetitors) {
        let compUrl = comp.url.trim();
        if (!compUrl.startsWith("http://") && !compUrl.startsWith("https://")) {
          compUrl = `https://${compUrl}`;
        }
        await addCompetitor({ data: { name: comp.name.trim(), url: compUrl } });
      }

      // Hard refresh page so router refetches the user session with business info
      window.location.href = "/overview";
    } catch (err) {
      console.error("Failed to add competitors:", err);
      // Fallback redirect
      window.location.href = "/overview";
    } finally {
      setCompetitorsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {step === 1 && (
        <Card className="w-full max-w-lg glass border-border/40 shadow-glow">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-2">
              <Sparkles className="h-6 w-6 text-primary-foreground animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Configure your Chief Growth Officer</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your store URL. Nexora AI will crawl your website and configure a tailored strategy using AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartAnalysis} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="storeUrl">Store Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="storeUrl"
                    placeholder="https://yourstore.com"
                    className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary border-0 shadow-glow">
                Analyze website <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="w-full max-w-lg glass border-border/40 text-center shadow-glow py-8 px-6">
          <CardContent className="space-y-6">
            <div className="relative mx-auto w-24 h-24">
              {/* Spinning outer border */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              {/* Inner glowing core */}
              <div className="absolute inset-2 rounded-full bg-gradient-primary/20 flex items-center justify-center shadow-glow">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold">Analyzing your Business</CardTitle>
              <CardDescription className="text-sm">
                Our AI agents are analyzing your website structure, product catalogs, and branding.
              </CardDescription>
            </div>
            <div className="max-w-xs mx-auto border border-border/40 rounded-xl bg-muted/20 p-4 text-left space-y-3">
              {analysisSteps.map((s, idx) => {
                const active = idx === loadingStepIdx;
                const completed = idx < loadingStepIdx;
                return (
                  <div key={s} className="flex items-center gap-2.5 text-xs">
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border/60 shrink-0" />
                    )}
                    <span className={completed ? "text-muted-foreground line-through" : active ? "text-foreground font-medium" : "text-muted-foreground/60"}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && profile && (
        <Card className="w-full max-w-2xl glass border-border/40 shadow-glow">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">Review AI Profile Analysis</CardTitle>
            </div>
            <CardDescription className="text-sm">
              We parsed your store's structure and formulated the following metadata. Review and adjust below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizName">Business name</Label>
                  <Input
                    id="bizName"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bizIndustry">Industry / Niche</Label>
                  <Input
                    id="bizIndustry"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    className="bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bizDesc">Business Description</Label>
                <Textarea
                  id="bizDesc"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={2}
                  className="bg-muted/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizAudience">Target Audience</Label>
                  <Input
                    id="bizAudience"
                    value={profile.targetAudience}
                    onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bizPrice">Pricing Tier</Label>
                  <select
                    id="bizPrice"
                    value={profile.pricingTier}
                    onChange={(e) => setProfile({ ...profile, pricingTier: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <option value="Budget">Budget</option>
                    <option value="Mid-market">Mid-market</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizVoice">Brand Voice Attributes</Label>
                  <Input
                    id="bizVoice"
                    value={profile.brandVoice}
                    onChange={(e) => setProfile({ ...profile, brandVoice: e.target.value })}
                    placeholder="e.g. Modern, Inspiring, Friendly"
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bizCategories">Product Categories</Label>
                  <Input
                    id="bizCategories"
                    value={profile.categories.join(", ")}
                    onChange={(e) => setProfile({ ...profile, categories: e.target.value.split(",").map((s) => s.trim()) })}
                    placeholder="e.g. Shirts, Pants, Outerwear"
                    className="bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <Label>Primary Growth Goals</Label>
                <div className="space-y-2">
                  {profile.suggestedGoals.map((g, idx) => (
                    <Input
                      key={idx}
                      value={g}
                      onChange={(e) => {
                        const newGoals = [...profile.suggestedGoals];
                        newGoals[idx] = e.target.value;
                        setProfile({ ...profile, suggestedGoals: newGoals });
                      }}
                      className="bg-muted/30 text-sm"
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary border-0 shadow-glow mt-2">
                Continue to competitor setup <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="w-full max-w-lg glass border-border/40 shadow-glow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Track Competitors</CardTitle>
            <CardDescription className="text-sm">
              We monitor competitor products, content velocity, and pricing updates. Add up to 3 competitors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3.5">
              {competitors.map((c, idx) => (
                <div key={idx} className="flex gap-2.5 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Competitor Name</Label>
                    <Input
                      placeholder="Brand Name"
                      value={c.name}
                      onChange={(e) => handleCompetitorChange(idx, "name", e.target.value)}
                      className="bg-muted/20"
                      disabled={competitorsLoading}
                    />
                  </div>
                  <div className="flex-[1.5] space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Website URL</Label>
                    <Input
                      placeholder="competitor.com"
                      value={c.url}
                      onChange={(e) => handleCompetitorChange(idx, "url", e.target.value)}
                      className="bg-muted/20"
                      disabled={competitorsLoading}
                    />
                  </div>
                  {competitors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCompetitorRow(idx)}
                      className="h-10 w-10 text-destructive/80 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      disabled={competitorsLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCompetitorRow}
              className="w-full border-dashed border-border text-xs gap-1.5"
              disabled={competitorsLoading || competitors.length >= 3}
            >
              <Plus className="h-3.5 w-3.5" /> Add Competitor
            </Button>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCompleteOnboarding}
                className="flex-1 text-muted-foreground hover:text-foreground"
                disabled={competitorsLoading}
              >
                Skip for now
              </Button>
              <Button
                onClick={handleCompleteOnboarding}
                className="flex-1 bg-gradient-primary border-0 shadow-glow"
                disabled={competitorsLoading}
              >
                {competitorsLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Completing…</>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
