-- Add full_name to profiles if upgrading an existing project
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text;
