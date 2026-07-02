-- Enable pg_cron extension (requires superuser, typically enabled via Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension to make HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to invoke Edge Functions
CREATE OR REPLACE FUNCTION invoke_edge_function(function_name TEXT, payload JSONB)
RETURNS VOID AS $$
DECLARE
    endpoint_url TEXT;
    project_url TEXT;
    service_role_key TEXT;
BEGIN
    -- In Supabase, you typically get these from vault or environment. 
    -- For this implementation, we assume they are configured in a secure way.
    
    -- Example pg_net usage:
    -- SELECT net.http_post(
    --     url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/' || function_name,
    --     headers:=jsonb_build_object(
    --         'Content-Type', 'application/json',
    --         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    --     ),
    --     body:=payload
    -- );
    
    -- This is a conceptual implementation of the invocation.
END;
$$ LANGUAGE plpgsql;

-- Schedule jobs in pg_cron
-- Daily SEO & AI Visibility Scan
SELECT cron.schedule(
    'daily_seo_ai_visibility_scan', 
    '0 2 * * *', 
    $$SELECT invoke_edge_function('execute_job', '{"job_type": "daily_intelligence"}'::jsonb)$$
);

-- Weekly Competitor Movement Scan
SELECT cron.schedule(
    'weekly_competitor_movement_scan', 
    '0 3 * * 0', 
    $$SELECT invoke_edge_function('execute_job', '{"job_type": "competitor_analysis"}'::jsonb)$$
);

-- Daily Store Growth Score Update
SELECT cron.schedule(
    'daily_store_growth_score_update', 
    '30 2 * * *', 
    $$SELECT invoke_edge_function('execute_job', '{"job_type": "health_recalc"}'::jsonb)$$
);

-- Daily Briefing Generation
SELECT cron.schedule(
    'daily_briefing_gen', 
    '0 6 * * *', 
    $$SELECT invoke_edge_function('execute_job', '{"job_type": "daily_briefing"}'::jsonb)$$
);

-- Weekly Executive Report
SELECT cron.schedule(
    'weekly_executive_report', 
    '0 4 * * 1', 
    $$SELECT invoke_edge_function('execute_job', '{"job_type": "weekly_report"}'::jsonb)$$
);

-- Retry failed jobs (Runs every hour)
SELECT cron.schedule(
    'retry_failed_jobs', 
    '0 * * * *', 
    $$SELECT invoke_edge_function('retry_failed_jobs', '{}'::jsonb)$$
);
