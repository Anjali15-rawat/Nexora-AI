import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, Swords, Users, TrendingUp, Lightbulb,
  Mic, ArrowRight, Check, Activity, BarChart3, Zap, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexora AI — Your AI Chief Growth Officer" },
      { name: "description", content: "Autonomous AI Chief Growth Officer for online stores. Surface opportunities, track competitors, and grow revenue while you sleep." },
      { property: "og:title", content: "Nexora AI — Your AI Chief Growth Officer" },
      { property: "og:description", content: "Autonomous growth intelligence for ecommerce operators." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-accent overflow-x-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="aurora-blob-emerald animate-aurora w-[55vw] h-[55vw] -top-[15%] -left-[10%]" />
        <div
          className="aurora-blob-violet animate-aurora w-[55vw] h-[55vw] top-[40%] -right-[10%]"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>
      <CursorFollower />
      <Nav />
      <Hero />
      <LogoStrip />
      <BentoSection />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold tracking-tight">Nexora AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Sign in</Link>
          <Link to="/register">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5">
              Start Free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-20 pb-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold mb-8 uppercase tracking-[0.18em]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          AI Chief Growth Officer · Private beta
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-tight leading-[1.02] text-foreground">
          Scale your store with{" "}
          <span className="text-gradient">Autonomous Intelligence</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The first AI CGO that surfaces missed revenue, tracks every competitor move, and executes
          growth plays — while you sleep.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="rounded-xl bg-gradient-primary border-0 text-primary-foreground font-semibold px-7 h-12 shadow-glow hover:opacity-95">
              Launch Copilot <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="rounded-xl glass h-12 px-7 font-semibold">
            <Play className="h-4 w-4 mr-1.5" /> Watch demo
          </Button>
        </div>

        {/* Dashboard mock */}
        <div className="mt-20 relative max-w-6xl mx-auto">
          <div className="absolute -inset-2 bg-gradient-primary opacity-30 blur-3xl rounded-[2rem]" />
          <div className="relative rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-aurora overflow-hidden">
            <div className="h-9 border-b border-border flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              <div className="ml-4 text-[11px] text-muted-foreground">copilot.app / overview</div>
            </div>
            <div className="grid grid-cols-12 gap-4 p-6 min-h-[420px]">
              <div className="col-span-3 space-y-2 text-left">
                {["Overview", "Competitors", "Customers", "Opportunities", "Trends", "AI Assistant"].map((l, i) => (
                  <div
                    key={l}
                    className={`px-3 py-2 rounded-lg text-xs font-medium ${
                      i === 0 ? "bg-primary/15 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-3 text-left">
                <MockKpi label="Growth score" value="84" delta="+6" tone="accent" />
                <MockKpi label="Revenue lift / mo" value="$42.8k" delta="+18%" tone="primary" />
                <MockKpi label="Opportunities" value="23" delta="9 new" tone="accent" />
                <div className="col-span-2 rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">Revenue impact · last 30d</div>
                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="h-32 flex items-end gap-1.5">
                    {[40, 55, 48, 70, 62, 78, 65, 88, 82, 95, 90, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-primary/60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground mb-3">Top action</div>
                  <div className="text-sm font-medium leading-snug text-foreground">
                    Reprice 12 SKUs underpriced vs. Allbirds
                  </div>
                  <div className="mt-3 text-xs text-accent font-semibold">+$8.2k / mo projected</div>
                  <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockKpi({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "accent" | "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</div>
      <div className={`mt-1 text-xs font-semibold ${tone === "accent" ? "text-accent" : "text-primary"}`}>
        {delta}
      </div>
    </div>
  );
}

const logos = ["GLOSSIER", "SHOPIFY", "STRIPE", "ASANA", "VERCEL", "HYBE"];

function LogoStrip() {
  return (
    <section className="py-12 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-8">
          Trusted by world-class operators
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 opacity-50">
          {logos.map((l) => (
            <span key={l} className="font-display text-xl font-bold tracking-widest text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoSection() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-semibold text-accent uppercase tracking-[0.22em] mb-3">
            The operating system
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            One brain, every insight.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Nexora AI replaces a dozen fragmented tools with a single unified intelligence engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          <BentoCard className="md:col-span-3 md:row-span-2" tone="emerald">
            <div className="flex items-start justify-between">
              <div>
                <Lightbulb className="h-5 w-5 text-accent mb-4" />
                <h3 className="font-display text-2xl font-semibold text-foreground">Revenue Opportunities</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Ranked, revenue-weighted plays you can ship this week — cart recovery, repricing, content gaps.
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 grid place-items-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              </div>
            </div>
            <div className="mt-auto pt-6 space-y-2">
              {[
                { t: "Recover abandoned EU checkouts", v: "+$12.4k" },
                { t: "Add FAQ schema to 38 product pages", v: "+$6.8k" },
                { t: "Repackage bestseller as bundle", v: "+$4.1k" },
              ].map((r) => (
                <div
                  key={r.t}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5"
                >
                  <span className="text-xs text-foreground truncate">{r.t}</span>
                  <span className="text-xs font-semibold text-accent ml-3 shrink-0">{r.v}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-3" tone="violet">
            <Swords className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-display text-xl font-semibold text-foreground">Competitor Moves</h3>
            <p className="mt-1 text-sm text-muted-foreground">Instant alerts when rivals shift pricing or launch.</p>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <TagBadge tone="violet">Allbirds · -8% on runners</TagBadge>
              <TagBadge tone="emerald">Rothy's · new campaign</TagBadge>
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <Users className="h-5 w-5 text-accent mb-3" />
            <h3 className="font-display text-xl font-semibold text-foreground">Customer Voice</h3>
            <p className="mt-1 text-sm text-muted-foreground">Sentiment across reviews, tickets, social.</p>
          </BentoCard>

          <BentoCard className="md:col-span-4 relative overflow-hidden" tone="aurora">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="h-5 w-5 text-foreground" />
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">Conversational Growth</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Ask anything. "Which SKUs lose money on Meta?" — answered instantly via chat or voice.
              </p>
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <TrendingUp className="h-5 w-5 text-accent mb-3" />
            <h3 className="font-display text-xl font-semibold text-foreground">Trend Radar</h3>
            <p className="mt-1 text-sm text-muted-foreground">Catch rising trends 60 days before peak.</p>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <Search className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-display text-xl font-semibold text-foreground">SEO · AEO · GEO</h3>
            <p className="mt-1 text-sm text-muted-foreground">Rank in Google, ChatGPT, Perplexity.</p>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <Activity className="h-5 w-5 text-accent mb-3" />
            <h3 className="font-display text-xl font-semibold text-foreground">Exec Reports</h3>
            <p className="mt-1 text-sm text-muted-foreground">Daily, weekly, monthly — boardroom-ready.</p>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function TagBadge({ children, tone }: { children: React.ReactNode; tone: "emerald" | "violet" }) {
  const cls =
    tone === "emerald"
      ? "bg-accent/10 text-accent border-accent/20"
      : "bg-primary/10 text-primary border-primary/20";
  return (
    <span className={`inline-flex items-center text-[11px] font-medium border rounded-full px-2.5 py-1 ${cls}`}>
      {children}
    </span>
  );
}

function BentoCard({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "emerald" | "violet" | "aurora";
}) {
  const ring =
    tone === "emerald"
      ? "hover:border-accent/40"
      : tone === "violet"
        ? "hover:border-primary/40"
        : tone === "aurora"
          ? "border-white/15 bg-gradient-to-br from-primary/10 to-accent/10"
          : "hover:border-border";
  return (
    <div
      className={`group rounded-2xl border border-border bg-card/60 backdrop-blur p-6 flex flex-col transition-all hover:-translate-y-0.5 ${ring} ${className}`}
    >
      {children}
    </div>
  );
}

const steps = [
  { n: "01", t: "Connect", d: "One-click index of your catalog, analytics, and reviews." },
  { n: "02", t: "Audit", d: "Copilot maps products, customers, competitors, and market." },
  { n: "03", t: "Recommend", d: "Ranked growth plays with projected revenue impact." },
  { n: "04", t: "Execute", d: "Ship from Copilot or export into your stack." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-28 px-6 border-y border-border/60 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-semibold text-accent uppercase tracking-[0.22em] mb-3">
            From signup to first revenue lift
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Four steps. Usually under an hour.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-background border border-accent/40 grid place-items-center font-display font-semibold text-accent relative z-10">
                {s.n}
              </div>
              <h4 className="mt-5 font-semibold text-foreground">{s.t}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-[200px] mx-auto">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const quotes = [
  { q: "Replaced 3 tools and our weekly growth meeting. Genuinely like hiring a CGO.", a: "Maya Chen", r: "Founder, Northwind Apparel" },
  { q: "Caught a competitor product launch before our team did. Paid for itself in week one.", a: "Daniel Ortega", r: "Head of Growth, Tideline" },
  { q: "The opportunity scoring is uncanny. We just work the top of the list every Monday.", a: "Priya Sharma", r: "CEO, Soko Goods" },
];

function Testimonials() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-center mb-16">
          Operators ship faster with Copilot
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div
              key={q.a}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur p-7 flex flex-col"
            >
              <Sparkles className="h-5 w-5 text-accent mb-4" />
              <p className="text-foreground leading-relaxed">"{q.q}"</p>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-primary" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{q.a}</div>
                  <div className="text-xs text-muted-foreground">{q.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-semibold text-accent uppercase tracking-[0.22em] mb-3">Pricing</div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Built for every scale</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when revenue compounds.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-10 flex flex-col">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Starter</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold text-foreground">$0</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-8 space-y-3.5 flex-1">
              {["1 website", "5 audits / month", "Daily brief email", "AI Assistant (50 msgs)"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-accent/15 grid place-items-center">
                    <Check className="h-3 w-3 text-accent" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-10">
              <Button variant="outline" className="w-full h-12 rounded-xl glass font-semibold">
                Start free
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-px rounded-3xl bg-gradient-primary opacity-60 blur-md" />
            <div className="relative rounded-3xl border border-primary/40 bg-card p-10 flex flex-col h-full shadow-aurora">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-primary uppercase tracking-wider">Pro Growth</div>
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-gradient-primary text-primary-foreground rounded-full px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" /> Most popular
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold text-foreground">$149</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-8 space-y-3.5 flex-1">
                {["Up to 5 websites", "Unlimited audits", "25 competitor trackers", "Voice Assistant", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-accent/15 grid place-items-center">
                      <Check className="h-3 w-3 text-accent" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-10">
                <Button className="w-full h-12 rounded-xl bg-gradient-primary border-0 text-primary-foreground font-semibold shadow-glow">
                  Start 14-day trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-28 px-6">
      <div className="relative max-w-5xl mx-auto rounded-3xl border border-border bg-card/60 backdrop-blur p-12 md:p-16 text-center overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/30 blur-3xl rounded-full" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Stop guessing. <span className="text-gradient">Start compounding.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Connect your store in 60 seconds. See your first growth play within minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="rounded-xl bg-gradient-primary border-0 text-primary-foreground font-semibold px-7 h-12 shadow-glow">
                Get started free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/overview">
              <Button size="lg" variant="outline" className="rounded-xl glass h-12 px-7 font-semibold">
                Explore demo dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-14 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-80">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary grid place-items-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Nexora AI</span>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 Nexora AI · Built for operators</div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Twitter</a>
        </div>
      </div>
    </footer>
  );
}

function CursorFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [hoverType, setHoverType] = useState<"link" | "button" | "card" | "nora" | null>(null);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isInteractive = target.closest("a, button, [role='button'], .cursor-pointer, .bento-card-hover");
      if (isInteractive) {
        setIsHovered(true);
        const text = isInteractive.textContent?.toLowerCase() || "";
        if (text.includes("nora") || isInteractive.closest("[href*='voice'], [href*='assistant']")) {
          setHoverType("nora");
        } else if (isInteractive.closest("button") || isInteractive.tagName === "BUTTON") {
          setHoverType("button");
        } else {
          setHoverType("link");
        }
      } else {
        setIsHovered(false);
        setHoverType(null);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  const springConfig = { damping: 30, stiffness: 150 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const offset = isHovered ? 24 : 16;
    cursorX.set(mousePosition.x - offset);
    cursorY.set(mousePosition.y - offset);
  }, [mousePosition, isHovered, cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border border-primary/40 hidden md:flex items-center justify-center overflow-hidden"
        animate={{
          width: isHovered ? 48 : 32,
          height: isHovered ? 48 : 32,
          borderColor: hoverType === "nora" ? "var(--color-accent)" : "var(--color-primary)",
          backgroundColor: isHovered 
            ? (hoverType === "nora" ? "rgba(var(--primary-rgb), 0.08)" : "rgba(var(--primary-rgb), 0.05)") 
            : "transparent",
        }}
        transition={{ duration: 0.2 }}
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-[9px] font-bold tracking-wider uppercase text-primary pointer-events-none"
            >
              {hoverType === "nora" ? "✨" : hoverType === "button" ? "→" : "view"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <div 
        className="pointer-events-none fixed left-0 top-0 z-[100] h-2 w-2 rounded-full bg-primary hidden md:block transition-all duration-150"
        style={{
          transform: `translate(${mousePosition.x - 4}px, ${mousePosition.y - 4}px)`,
          opacity: isHovered ? 0 : 1,
        }}
      />
    </>
  );
}
