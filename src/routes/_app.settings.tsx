import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/api/business.functions";
import { signOut, getSession } from "@/lib/api/auth.functions";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · Nexora AI" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [profile, session] = await Promise.all([
          getBusinessProfile(),
          getSession()
        ]);

        if (profile) {
          setName(profile.name);
          setUrl(profile.url);
          setIndustry(profile.industry || "");
          setGoals(profile.growthGoals || "");
        }

        if (session && session.authenticated) {
          setEmail(session.user.email);
        }
      } catch (err) {
        console.error("Failed to load settings data:", err);
        toast.error("Failed to load business profile settings.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateBusinessProfile({
        data: {
          name,
          url,
          industry,
          growthGoals: goals,
        },
      });

      if (result.success) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error(result.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      await signOut();
      toast.success("Signed out successfully.");
      // Hard refresh to clear session cookies
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      toast.error("Failed to sign out.");
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage your business profile, notifications, and account." />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Business profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bizName">Business Name</Label>
                <Input
                  id="bizName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/20 focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bizUrl">Website URL</Label>
                <Input
                  id="bizUrl"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-muted/20 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry / Niche</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-muted/20 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goals">Growth goals</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="bg-muted/20 focus-visible:ring-primary min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Daily brief email", "Competitor alerts", "High-severity sentiment alerts", "Weekly executive summary"].map((n) => (
              <div key={n} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                <div className="text-sm">{n}</div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Theme</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Dark mode is on by default. Light mode coming soon.</div>
            <Switch defaultChecked disabled />
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-muted/10 opacity-70" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-gradient-primary border-0 shadow-glow" disabled={saving || signingOut}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                disabled={saving || signingOut}
                className="border-border/60 hover:bg-muted/25"
              >
                {signingOut ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing out…</> : "Sign out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
