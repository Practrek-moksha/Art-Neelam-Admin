-- Add columns to track parent credentials
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_account_created boolean DEFAULT false;
