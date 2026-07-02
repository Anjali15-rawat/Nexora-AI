import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Activity, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getScheduledJobs, getJobLogs, triggerJob } from "@/lib/api/automation.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Automation Jobs · Nexora AI" }] }),
  component: JobsDashboard,
});

function JobsDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [j, l] = await Promise.all([getScheduledJobs(), getJobLogs()]);
      setJobs(j);
      setLogs(l);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleRunJob = async (jobId: string, jobType: string) => {
    setRunningJob(jobId);
    toast.loading(`Starting job...`, { id: jobId });
    try {
      const result = await triggerJob({ data: { jobId, jobType } });
      if (result.success) {
        toast.success(`Job completed in ${result.duration}ms`, { id: jobId });
      } else {
        toast.error(`Job failed: ${result.error}`, { id: jobId });
      }
      await load();
    } catch (e: any) {
      toast.error(`Job failed: ${e.message}`, { id: jobId });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Automation & Intelligence Jobs" 
        description="Monitor and manage background intelligence processes."
        action={
          <Button variant="outline" onClick={load} disabled={loading}>
            <Activity className="h-4 w-4 mr-2" /> Refresh
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/40 glass">
          <CardHeader>
            <CardTitle className="text-lg">Scheduled Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                <div>
                  <div className="font-semibold">{job.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Schedule: {job.cron_schedule}
                    <span className="opacity-50">|</span>
                    Last run: {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleRunJob(job.id, job.job_type)}
                  disabled={runningJob === job.id}
                >
                  {runningJob === job.id ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Run Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/40 glass overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Execution Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2">
            {logs.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No execution logs found.</div>}
            {logs.map(log => (
              <div key={log.id} className="text-sm border-b border-border/50 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{log.scheduled_jobs?.name || "Unknown Job"}</div>
                  <Badge variant="outline" className={
                    log.status === 'success' ? 'border-success text-success' : 
                    log.status === 'failed' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                  }>
                    {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : 
                     log.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                    {log.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Started: {new Date(log.started_at).toLocaleString()} • {log.duration_ms ? `${log.duration_ms}ms` : 'Running...'}
                </div>
                {log.error_message && (
                  <div className="text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded">
                    {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
