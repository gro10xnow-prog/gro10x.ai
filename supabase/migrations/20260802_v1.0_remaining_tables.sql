-- ====================================================================
-- PurpleOS v1.0 Remaining Tables Migration
-- Adds tables for logs, bookings, telegram groups, leaves, and settings
-- ====================================================================

-- 1. Automation Logs Table
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id VARCHAR(50) PRIMARY KEY,
    rule VARCHAR(100),
    event VARCHAR(100),
    target VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Executed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Studio Bookings Table
CREATE TABLE IF NOT EXISTS public.studio_bookings (
    id VARCHAR(50) PRIMARY KEY,
    resource_name VARCHAR(255),
    resource_type VARCHAR(50),
    slot VARCHAR(100),
    booked_by_name VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telegram Groups Table
CREATE TABLE IF NOT EXISTS public.telegram_groups (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(30) DEFAULT 'group',
    chat_id VARCHAR(50) UNIQUE NOT NULL,
    bot VARCHAR(30) DEFAULT 'teamBot',
    description TEXT,
    active BOOLEAN DEFAULT true,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(30),
    employee_name VARCHAR(255),
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    reports_to VARCHAR(30),
    manager_reviewed_by VARCHAR(255),
    manager_approved_at TIMESTAMPTZ,
    owner_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add locked_at column to auth_pins for Brute-Force lockout
ALTER TABLE public.auth_pins
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Enable RLS for all new tables
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
