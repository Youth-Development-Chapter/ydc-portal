-- Migration: Add coin_reward column to public.events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS coin_reward INTEGER DEFAULT 50 NOT NULL;
