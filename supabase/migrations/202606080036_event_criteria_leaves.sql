-- Migration: Add Event Criteria, Compulsory toggle, and Leave System

-- 1. Add custom_criteria to events and rewards
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;

-- 2. Add is_compulsory to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN DEFAULT false NOT NULL;

-- 3. Enhance event_registrations for leaves and dynamic attendance
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'present', 'absent', 'leave_pending', 'leave_approved', 'leave_rejected'));
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS leave_note TEXT;

-- For existing registrations that were attended, update status
UPDATE public.event_registrations SET status = 'present' WHERE attended = true;

-- 4. Default Rank Tiers Settings
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'rank_tiers',
    '[{"name": "Bronze Tier", "threshold": 0}, {"name": "Silver Tier", "threshold": 500}, {"name": "Gold Tier", "threshold": 1000}, {"name": "Platinum Tier", "threshold": 2500}]',
    'JSON array configuring rank tiers based on YDC Coin thresholds.'
)
ON CONFLICT (key) DO NOTHING;
