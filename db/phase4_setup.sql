-- Phase 4: Automation & Intelligence Orchestration Setup

-- 1. Scheduled Jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cron_schedule TEXT NOT NULL, -- e.g., '0 0 * * *'
    job_type TEXT NOT NULL, -- e.g., 'seo_scan', 'competitor_analysis'
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Job Logs
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'running', 'success', 'failed'
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    result_data JSONB,
    error_message TEXT
);

-- 3. Automation History (Change Detection)
CREATE TABLE IF NOT EXISTS automation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'seo_score', 'competitor', 'health'
    entity_id TEXT, -- ID of the specific entity, if applicable
    previous_state JSONB,
    new_state JSONB,
    change_hash TEXT NOT NULL, -- Hash of new state for quick comparison
    detected_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Weekly Reports
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    health_summary JSONB,
    seo_performance JSONB,
    competitor_changes JSONB,
    top_opportunities JSONB,
    completed_actions JSONB,
    recommended_priorities JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Daily Briefings
CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    changes_today JSONB,
    biggest_opportunity JSONB,
    biggest_risk JSONB,
    highest_priority_task JSONB,
    suggested_next_action JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Notifications (Expanded for Phase 4)
-- Assuming notifications table from Phase 3 might exist, if not we create it
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,                 -- Phase 3 Compatibility
    type TEXT,                    -- Phase 3 Compatibility
    description TEXT,             -- Phase 4 Compatibility
    category TEXT,                -- Phase 4 Compatibility
    priority TEXT,                -- Phase 4 Compatibility
    related_feature TEXT,
    suggested_action JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and add policies for Phase 4 tables
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON public.scheduled_jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view job logs for their business" ON public.job_logs
    FOR SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view automation history for their business" ON public.automation_history
    FOR SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view weekly reports for their business" ON public.weekly_reports
    FOR SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view daily briefings for their business" ON public.daily_briefings
    FOR SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
        )
    );

-- Seed initial jobs
INSERT INTO scheduled_jobs (name, description, cron_schedule, job_type)
VALUES 
    ('Daily SEO & AI Visibility Scan', 'Updates SEO, AEO, and GEO scores daily.', '0 2 * * *', 'daily_intelligence'),
    ('Weekly Competitor Movement Scan', 'Scans for new competitor movements weekly.', '0 3 * * 0', 'competitor_analysis'),
    ('Daily Store Growth Score Update', 'Recalculates overarching business health.', '30 2 * * *', 'health_recalc')
ON CONFLICT DO NOTHING;
