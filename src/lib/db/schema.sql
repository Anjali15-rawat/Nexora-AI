-- Nexora AI — PostgreSQL Schema
-- Run this against your Supabase project's SQL Editor.
-- Requires extensions: pgvector, pg_trgm

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ============================================================
-- BUSINESSES
-- ============================================================
create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  url           text not null,
  industry      text,
  description   text,
  -- AI-generated profile (JSON from Business Understanding Engine)
  ai_profile    jsonb default '{}'::jsonb,
  -- User-defined growth goals
  growth_goals  text,
  -- Pricing tier
  plan          text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  -- Usage tracking
  audits_used   int not null default 0,
  audits_limit  int not null default 5,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- BUSINESS MEMBERS (multi-tenancy)
-- ============================================================
create table if not exists public.business_members (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner', 'admin', 'viewer')),
  created_at    timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ============================================================
-- COMPETITORS
-- ============================================================
create table if not exists public.competitors (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  url           text not null,
  category      text,
  -- Latest computed scores
  threat_level  text default 'Medium' check (threat_level in ('Low', 'Medium', 'High')),
  content_score int default 0,
  traffic_trend float default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- COMPETITOR SNAPSHOTS (point-in-time captures)
-- ============================================================
create table if not exists public.competitor_snapshots (
  id              uuid primary key default gen_random_uuid(),
  competitor_id   uuid not null references public.competitors(id) on delete cascade,
  -- AI-generated snapshot data
  snapshot_data   jsonb not null default '{}'::jsonb,
  -- Detected changes since last snapshot
  changes         jsonb default '[]'::jsonb,
  captured_at     timestamptz not null default now()
);

-- ============================================================
-- INTELLIGENCE SCORES (SEO, AEO, GEO, etc.)
-- ============================================================
create table if not exists public.intelligence_scores (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  score_type    text not null check (score_type in ('seo', 'aeo', 'geo', 'competitor', 'customer', 'revenue')),
  score         int not null default 0 check (score >= 0 and score <= 100),
  delta         float default 0,
  -- Detailed breakdown
  breakdown     jsonb default '{}'::jsonb,
  -- Issues found
  issues        jsonb default '[]'::jsonb,
  -- Recommendations
  recommendations jsonb default '[]'::jsonb,
  hint          text,
  computed_at   timestamptz not null default now()
);

-- Index for fast lookups of latest scores
create index if not exists idx_intelligence_scores_business
  on public.intelligence_scores(business_id, score_type, computed_at desc);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
create table if not exists public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  title         text not null,
  type          text not null check (type in ('SEO', 'AEO', 'GEO', 'Content', 'Product', 'Trend', 'Pricing', 'CRO')),
  impact        text not null default 'Medium' check (impact in ('Low', 'Medium', 'High')),
  difficulty    text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  revenue       int default 0,
  -- Detailed action plan
  action_plan   text,
  status        text not null default 'open' check (status in ('open', 'in_progress', 'done', 'dismissed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- CUSTOMER INSIGHTS
-- ============================================================
create table if not exists public.customer_insights (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  insight_type  text not null check (insight_type in ('sentiment', 'pain_point', 'request', 'motivation', 'review')),
  -- Structured insight data
  data          jsonb not null default '{}'::jsonb,
  computed_at   timestamptz not null default now()
);

-- ============================================================
-- REPORTS (executive briefings)
-- ============================================================
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  title         text not null,
  period        text not null check (period in ('Daily', 'Weekly', 'Monthly')),
  -- Full report content (markdown)
  content       text not null default '',
  summary       text,
  report_date   date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CHAT MESSAGES (AI assistant conversations)
-- ============================================================
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant', 'system')),
  content       text not null,
  -- Optional metadata (tokens used, model, etc.)
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_chat_messages_business_user
  on public.chat_messages(business_id, user_id, created_at);

-- ============================================================
-- CRAWL JOBS (tracking scheduled data collection)
-- ============================================================
create table if not exists public.crawl_jobs (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  job_type      text not null check (job_type in ('seo_audit', 'competitor_scan', 'trend_scan', 'business_analysis')),
  status        text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  -- Results or error details
  result        jsonb default '{}'::jsonb,
  error         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- EMBEDDINGS (pgvector for semantic search)
-- ============================================================
create table if not exists public.embeddings (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  content       text not null,
  -- Source reference (e.g., "page:/about", "review:123", "report:456")
  source_type   text not null,
  source_id     text,
  -- 768-dimensional embedding (Gemini text-embedding-004)
  embedding     vector(768),
  created_at    timestamptz not null default now()
);

-- HNSW index for fast similarity search
create index if not exists idx_embeddings_vector
  on public.embeddings using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- TRENDS (cached trend data)
-- ============================================================
create table if not exists public.trends (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  topic         text not null,
  direction     text not null check (direction in ('rising', 'declining', 'stable')),
  growth        float default 0,
  signal_source text,
  data_points   jsonb default '[]'::jsonb,
  computed_at   timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
-- Disable RLS on core tables to allow onboarding with mock/development API keys
-- alter table public.businesses enable row level security;
-- alter table public.business_members enable row level security;
-- alter table public.competitors enable row level security;
alter table public.competitor_snapshots enable row level security;
alter table public.intelligence_scores enable row level security;
alter table public.opportunities enable row level security;
alter table public.customer_insights enable row level security;
alter table public.reports enable row level security;
alter table public.chat_messages enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.embeddings enable row level security;
alter table public.trends enable row level security;

-- Helper function: get business IDs for the current user
create or replace function public.get_user_business_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select business_id from public.business_members
  where user_id = auth.uid()
$$;

-- Businesses: users can see their own businesses
create policy "Users can view own businesses"
  on public.businesses for select
  using (id in (select public.get_user_business_ids()));

create policy "Users can update own businesses"
  on public.businesses for update
  using (id in (select public.get_user_business_ids()));

-- Business members: users can see members of their businesses
create policy "Users can view own business members"
  on public.business_members for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can insert own membership"
  on public.business_members for insert
  with check (user_id = auth.uid());

-- Apply same pattern to all data tables
-- (each table's business_id must be in user's business list)

create policy "Users can view own competitors"
  on public.competitors for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can manage own competitors"
  on public.competitors for all
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own competitor snapshots"
  on public.competitor_snapshots for select
  using (competitor_id in (
    select id from public.competitors
    where business_id in (select public.get_user_business_ids())
  ));

create policy "Users can view own intelligence scores"
  on public.intelligence_scores for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own opportunities"
  on public.opportunities for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can update own opportunities"
  on public.opportunities for update
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own customer insights"
  on public.customer_insights for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own reports"
  on public.reports for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (business_id in (select public.get_user_business_ids()) and user_id = auth.uid());

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (business_id in (select public.get_user_business_ids()) and user_id = auth.uid());

create policy "Users can view own crawl jobs"
  on public.crawl_jobs for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own embeddings"
  on public.embeddings for select
  using (business_id in (select public.get_user_business_ids()));

create policy "Users can view own trends"
  on public.trends for select
  using (business_id in (select public.get_user_business_ids()));

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create or replace trigger competitors_updated_at
  before update on public.competitors
  for each row execute function public.set_updated_at();

create or replace trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();
