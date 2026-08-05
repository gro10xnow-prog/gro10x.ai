-- Add leave balance columns to profiles table
ALTER TABLE profiles
ADD COLUMN casual_leaves_allowed INTEGER DEFAULT 14,
ADD COLUMN casual_leaves_used INTEGER DEFAULT 0,
ADD COLUMN sick_leaves_allowed INTEGER DEFAULT 10,
ADD COLUMN sick_leaves_used INTEGER DEFAULT 0;

-- Optional: Create a function to automatically deduct leave balances when a leave is approved
-- But for our Node.js backend, we can just do the logic in src/routes/leaves.js
