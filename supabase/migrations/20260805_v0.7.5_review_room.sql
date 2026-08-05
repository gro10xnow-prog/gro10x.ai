-- Create review_drawings table for Review Room 2.0
CREATE TABLE IF NOT EXISTS review_drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id TEXT NOT NULL,
    timestamp_sec NUMERIC NOT NULL,
    drawing_data JSONB NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by review_id and timestamp
CREATE INDEX IF NOT EXISTS idx_review_drawings_lookup ON review_drawings(review_id, timestamp_sec);

-- Add missing columns to reviews table for formal sign-off if they don't exist
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_released BOOLEAN DEFAULT false;
