-- ====================================================================
-- GRO10X Content OS — Database Schema Migration v4.3
-- Created: 2026-09-10
-- Tables: social_brands, social_channels, channel_calendars, plan_items, analytics_snapshots, social_posts
-- ====================================================================

-- 1. Social Brands Table
CREATE TABLE IF NOT EXISTS public.social_brands (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    niche TEXT,
    primary_language TEXT DEFAULT 'Bangla + English (Banglish / Spoken)',
    standard_cta TEXT,
    standard_hashtags TEXT,
    guidelines JSONB DEFAULT '{}'::jsonb,
    monthly_focus JSONB DEFAULT '{}'::jsonb,
    assets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Social Channels Table
CREATE TABLE IF NOT EXISTS public.social_channels (
    id TEXT PRIMARY KEY,
    brand_slug TEXT REFERENCES public.social_brands(slug) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT,
    is_anchor BOOLEAN DEFAULT false,
    primary_language TEXT,
    audience_count INTEGER DEFAULT 0,
    analytics_kb JSONB DEFAULT '{}'::jsonb,
    onboarding_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Channel Calendars Table
CREATE TABLE IF NOT EXISTS public.channel_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT REFERENCES public.social_channels(id) ON DELETE CASCADE,
    brand_slug TEXT REFERENCES public.social_brands(slug) ON DELETE CASCADE,
    month_key TEXT NOT NULL, -- e.g. "2026-09"
    status TEXT DEFAULT 'Draft', -- 'Draft' | 'Locked'
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, month_key)
);

-- 4. Individual Plan Items Table
CREATE TABLE IF NOT EXISTS public.plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID REFERENCES public.channel_calendars(id) ON DELETE CASCADE,
    channel_id TEXT REFERENCES public.social_channels(id) ON DELETE CASCADE,
    week TEXT NOT NULL, -- "Week 1", "Week 2", etc.
    day_of_week TEXT,
    scheduled_date DATE,
    content_type TEXT NOT NULL,
    topic_idea TEXT NOT NULL,
    hook TEXT,
    rationale TEXT,
    target_duration TEXT DEFAULT '60s',
    format_tag TEXT,
    drafted BOOLEAN DEFAULT false,
    post_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Analytics Snapshots Table (Time-Series)
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT REFERENCES public.social_channels(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_views BIGINT DEFAULT 0,
    watch_hours NUMERIC DEFAULT 0,
    subscribers INTEGER DEFAULT 0,
    avg_ctr NUMERIC DEFAULT 0,
    top_categories TEXT[] DEFAULT '{}',
    top_performers JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Social Posts Table (Pipeline & Production)
CREATE TABLE IF NOT EXISTS public.social_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    caption TEXT,
    channel TEXT,
    platform TEXT DEFAULT 'Facebook',
    content_category TEXT DEFAULT 'General',
    content_type TEXT DEFAULT 'Short-form Video',
    target_duration TEXT DEFAULT '30s',
    veo_prompts JSONB,
    pdf_outline JSONB,
    first_comment TEXT,
    client_id TEXT,
    client_name TEXT DEFAULT 'General Client',
    target_url TEXT,
    hashtags TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    scheduled_date DATE,
    scheduled_time TEXT DEFAULT '18:00',
    assigned_publisher TEXT DEFAULT 'Content Team',
    status TEXT DEFAULT 'Draft',
    client_feedback TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    revisions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_social_channels_brand ON public.social_channels(brand_slug);
CREATE INDEX IF NOT EXISTS idx_channel_calendars_month ON public.channel_calendars(channel_id, month_key);
CREATE INDEX IF NOT EXISTS idx_plan_items_calendar ON public.plan_items(calendar_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_channel ON public.analytics_snapshots(channel_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_client ON public.social_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON public.social_posts(scheduled_date);

-- Enable RLS
ALTER TABLE public.social_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Service Role policies (bypass RLS for server-side operations)
DROP POLICY IF EXISTS "service_role_all_social_brands" ON public.social_brands;
CREATE POLICY "service_role_all_social_brands" ON public.social_brands FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_social_channels" ON public.social_channels;
CREATE POLICY "service_role_all_social_channels" ON public.social_channels FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_channel_calendars" ON public.channel_calendars;
CREATE POLICY "service_role_all_channel_calendars" ON public.channel_calendars FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_plan_items" ON public.plan_items;
CREATE POLICY "service_role_all_plan_items" ON public.plan_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_analytics_snapshots" ON public.analytics_snapshots;
CREATE POLICY "service_role_all_analytics_snapshots" ON public.analytics_snapshots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_social_posts" ON public.social_posts;
CREATE POLICY "service_role_all_social_posts" ON public.social_posts FOR ALL USING (true) WITH CHECK (true);
