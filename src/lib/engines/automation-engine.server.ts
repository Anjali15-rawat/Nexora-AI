import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '../supabase.server';

// Automation Engine - Handles background jobs, retries, and orchestration

export async function executeJob(jobType: string) {
  const supabase = getSupabaseServer();
  
  console.log(`Starting job execution for type: ${jobType}`);
  
  // Create job log entry
  const { data: job, error: jobError } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('job_type', jobType)
    .single();
    
  if (jobError || !job) {
    console.error(`Failed to find job ${jobType}:`, jobError);
    return;
  }
  
  // We should ideally fetch all active businesses and run the job for them
  const { data: businesses } = await supabase.from('businesses').select('id');
  
  if (!businesses) return;
  
  for (const business of businesses) {
    const { data: logEntry } = await supabase
      .from('job_logs')
      .insert({
        job_id: job.id,
        business_id: business.id,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (!logEntry) continue;
    
    try {
      const startTime = Date.now();
      let resultData = null;
      
      // Execute based on job type
      switch(jobType) {
        case 'daily_intelligence':
          resultData = await runDailyIntelligence(business.id);
          break;
        case 'competitor_analysis':
          resultData = await runCompetitorAnalysis(business.id);
          break;
        case 'health_recalc':
          resultData = await runHealthRecalc(business.id);
          break;
        case 'daily_briefing':
          resultData = await runDailyBriefing(business.id);
          break;
        case 'weekly_report':
          resultData = await runWeeklyReport(business.id);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
      
      // Mark as success
      await supabase
        .from('job_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          result_data: resultData
        })
        .eq('id', logEntry.id);
        
      // Reset retry count on scheduled_job if it was previously failing
      if (job.retry_count > 0) {
        await supabase
          .from('scheduled_jobs')
          .update({ retry_count: 0, last_error: null })
          .eq('id', job.id);
      }
      
    } catch (error) {
      console.error(`Job ${jobType} failed for business ${business.id}:`, error);
      
      // Mark log as failed
      await supabase
        .from('job_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: String(error)
        })
        .eq('id', logEntry.id);
        
      // Increment retry count
      await supabase
        .from('scheduled_jobs')
        .update({
          retry_count: job.retry_count + 1,
          last_error: String(error)
        })
        .eq('id', job.id);
    }
  }
  
  // Update last_run_at
  await supabase
    .from('scheduled_jobs')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', job.id);
}

export async function retryFailedJobs() {
  const supabase = getSupabaseServer();
  
  const { data: failedJobs } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .not('last_error', 'is', null)
    .lt('retry_count', 3); // max retries = 3
    
  if (!failedJobs || failedJobs.length === 0) return;
  
  for (const job of failedJobs) {
    console.log(`Retrying failed job: ${job.job_type}`);
    await executeJob(job.job_type);
  }
}

// Stubs for the actual engine executions

async function runDailyIntelligence(businessId: string) {
  // Hash calculation and change detection would happen here
  return { status: "completed", skipped: false, message: "Scores updated" };
}

async function runCompetitorAnalysis(businessId: string) {
  return { status: "completed", competitors_found: 2 };
}

async function runHealthRecalc(businessId: string) {
  return { status: "completed", new_score: 85 };
}

async function runDailyBriefing(businessId: string) {
  return { status: "completed", briefing_generated: true };
}

async function runWeeklyReport(businessId: string) {
  return { status: "completed", report_generated: true };
}
