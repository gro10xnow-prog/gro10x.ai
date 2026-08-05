-- Migration: Client Meetings Table
-- Adds a table to track meetings with clients.

CREATE TABLE IF NOT EXISTS client_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  meeting_date timestamp with time zone NOT NULL,
  notes text,
  action_items text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view
CREATE POLICY "Enable read access for authenticated users" 
ON client_meetings FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins/owners to insert
CREATE POLICY "Enable insert for authenticated users" 
ON client_meetings FOR INSERT 
TO authenticated 
WITH CHECK (true);
