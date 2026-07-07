-- Migration: Split event time into start_time and end_time
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time TIME;

-- Set defaults for existing rows (09:00 AM - 05:00 PM equivalent)
UPDATE public.events
SET start_time = '09:00:00' WHERE start_time IS NULL;

UPDATE public.events
SET end_time = '17:00:00' WHERE end_time IS NULL;

ALTER TABLE public.events ALTER COLUMN start_time SET DEFAULT '09:00:00';
ALTER TABLE public.events ALTER COLUMN start_time SET NOT NULL;

ALTER TABLE public.events ALTER COLUMN end_time SET DEFAULT '17:00:00';
ALTER TABLE public.events ALTER COLUMN end_time SET NOT NULL;

-- Remove old column
ALTER TABLE public.events DROP COLUMN IF EXISTS time;
