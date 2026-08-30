-- ====================================================================
-- PurpleOS Version 0.6 Master Database Schema Migration
-- Project: GRO10X AI Agency OS & Employee Web Panel
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extends auth.users or Employee records)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    telegram_id VARCHAR(50),
    phone VARCHAR(30),
    base_salary NUMERIC(12,2) DEFAULT 0,
    commission_rate NUMERIC(5,2) DEFAULT 0,
    earned_commissions NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'In Studio',
    active_bookings INT DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    status VARCHAR(50) DEFAULT 'Active Retainer',
    category VARCHAR(100),
    total_spent VARCHAR(50) DEFAULT '$0',
    active_campaigns JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price VARCHAR(100),
    description TEXT,
    included_features JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    client_id VARCHAR(20) REFERENCES public.clients(id) ON DELETE SET NULL,
    stage VARCHAR(50) DEFAULT 'Scripting', -- Scripting, Shooting, Editing, Client Review, Approved
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Urgent
    assignee VARCHAR(255),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reviews & Proofing Engine
CREATE TABLE IF NOT EXISTS public.reviews (
    id VARCHAR(20) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    active_version VARCHAR(20) DEFAULT 'v1',
    versions JSONB DEFAULT '["v1"]'::jsonb,
    media_type VARCHAR(20) DEFAULT 'video', -- video, image, document
    media_url TEXT NOT NULL,
    poster_url TEXT,
    resolved_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Review Comments Table
CREATE TABLE IF NOT EXISTS public.review_comments (
    id VARCHAR(50) PRIMARY KEY,
    review_id VARCHAR(20) REFERENCES public.reviews(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    timestamp VARCHAR(20),
    time_seconds NUMERIC(10,2) DEFAULT 0,
    text TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    drawings JSONB DEFAULT '[]'::jsonb,
    replies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id VARCHAR(30) PRIMARY KEY,
    client_id VARCHAR(20) REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 15,
    discount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pending', -- Paid, Pending, Draft, Overdue
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    date DATE NOT NULL,
    logged_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Assets Inventory Table
CREATE TABLE IF NOT EXISTS public.assets (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    serial VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    purchase_price NUMERIC(12,2) DEFAULT 0,
    monthly_depreciation NUMERIC(12,2) DEFAULT 0,
    condition VARCHAR(50) DEFAULT 'Good',
    assigned_to VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'In Studio',
    clock_in_time VARCHAR(30),
    location VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Enable Row-Level Security (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow public/anon read access for initial development & API serving
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public read access on services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public read access on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access on review_comments" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public read access on expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public read access on assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Allow public read access on attendance" ON public.attendance FOR SELECT USING (true);

-- Allow full mutations for service role and anon during v0.6 setup
CREATE POLICY "Allow anon insert/update/delete on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on services" ON public.services FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on review_comments" ON public.review_comments FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update/delete on attendance" ON public.attendance FOR ALL USING (true);
