-- Phase 3 Database Setup for Commerce Copilot AI

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,                 -- Phase 3 Compatibility
    type TEXT,                    -- Phase 3 Compatibility
    description TEXT,             -- Phase 4 Compatibility
    category TEXT,                -- Phase 4 Compatibility
    priority TEXT,                -- Phase 4 Compatibility
    related_feature TEXT,
    suggested_action JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own business notifications"
    ON public.notifications FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own business notifications"
    ON public.notifications FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
    ));

-- 2. User Preferences (Layouts, etc.)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dashboard_layout JSONB DEFAULT '[]'::jsonb,
    theme TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for user preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences"
    ON public.user_preferences FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 3. Search Index (Full-Text Search + pgvector setup)
-- Note: Assuming pgvector extension is enabled. If not, run: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'opportunity', 'competitor', 'report', 'review'
    entity_id TEXT NOT NULL,   -- Reference to the external ID
    title TEXT NOT NULL,
    description TEXT,
    embedding vector(768),     -- Using 768 dimensions for standard embeddings (e.g. text-embedding-004)
    fts tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || coalesce(description, ''))) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for search index
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own business search index"
    ON public.search_index FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
    ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_business_id_idx ON public.notifications(business_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS search_index_fts_idx ON public.search_index USING GIN (fts);
CREATE INDEX IF NOT EXISTS search_index_business_id_idx ON public.search_index(business_id);

-- Optional: pgvector index for fast cosine similarity search (ivfflat or hnsw)
-- CREATE INDEX ON public.search_index USING hnsw (embedding vector_cosine_ops);
