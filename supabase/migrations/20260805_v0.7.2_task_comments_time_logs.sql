-- Migration: v0.7.2 Task Intelligence
-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_logs table for logging hours on tasks
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    duration_hours NUMERIC(5,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users (simplistic for now)
CREATE POLICY "Enable all access for authenticated users on task_comments" ON public.task_comments FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users on time_logs" ON public.time_logs FOR ALL USING (true);
