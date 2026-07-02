import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MetricCard({
  label, value, delta, hint, icon: Icon,
}: { label: string; value: number | string; delta?: number; hint?: string; icon?: LucideIcon }) {
  const up = (delta ?? 0) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-gradient-surface border-border/60">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            {delta !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", up ? "text-success" : "text-destructive")}>
                {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(delta).toFixed(1)}%
              </div>
            )}
          </div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ScoreCard({ score, breakdown }: { score: number; breakdown: { label: string; value: number }[] }) {
  return (
    <Card className="bg-gradient-surface border-border/60 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-10 pointer-events-none" />
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Growth Score</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 items-center relative">
        <div className="flex flex-col items-center md:items-start">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160 }}
            className="text-7xl sm:text-8xl font-bold tracking-tight text-gradient"
          >
            {score}
          </motion.div>
          <div className="text-sm text-muted-foreground mt-2">out of 100 · trending up</div>
          <Badge className="mt-3 bg-success/15 text-success border-success/20">Healthy</Badge>
        </div>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">{b.value}</span>
              </div>
              <Progress value={b.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActionCard({ title, difficulty, impact, revenue }: { title: string; difficulty: string; impact: string; revenue: number }) {
  const diffColor = difficulty === "Easy" ? "bg-success/15 text-success border-success/20"
    : difficulty === "Medium" ? "bg-warning/15 text-warning border-warning/20"
    : "bg-destructive/15 text-destructive border-destructive/20";
  return (
    <Card className="hover:border-primary/40 transition-colors group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="font-medium text-sm leading-snug">{title}</div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Est. revenue</div>
            <div className="text-sm font-semibold text-success">+${(revenue / 1000).toFixed(1)}k</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={diffColor}>{difficulty}</Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{impact} impact</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
