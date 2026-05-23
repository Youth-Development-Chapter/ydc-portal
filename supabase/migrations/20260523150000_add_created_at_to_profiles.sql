-- Migration: Add created_at column to profiles table

-- 1. Add created_at column to public.profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Backfill existing profiles with created_at from auth.users
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id AND p.created_at IS NULL;
